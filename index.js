const Bundle = require('bono');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const util = require('util');
const unlink = util.promisify(fs.unlink);
const getFileHash = require('./helpers/get-file-hash');
const mkdirp = require('./helpers/mkdirp');
const exists = require('./helpers/exists');

class FileBundle extends Bundle {
  constructor ({ dataDir = path.join(process.cwd(), 'data'), fs: optFs } = {}) {
    super();

    this.use(async (ctx, next) => {
      if (ctx.path.startsWith('/files')) {
        try {
          let matches = ctx.path.match(/^\/files(.*)$/);
          let filepath = path.join(this.fileDir, matches[1]);
          if (await exists(this.fs, filepath)) {
            let rs = this.fs.createReadStream(filepath);
            ctx.body = rs;
            return;
          }
        } catch (err) {
          throw err;
        }
        ctx.throw(404);
        return;
      }

      await next();
    });
    this.post('/upload', this.upload.bind(this));

    this.fs = optFs || fs;
    this.dataDir = dataDir;
    this.fileDir = path.join(dataDir, 'files');
    this.metadataDir = path.join(dataDir, 'metadata');
  }

  async upload (ctx) {
    let { bucket = '/' } = ctx.query;

    let files = await new Promise((resolve, reject) => {
      try {
        let files = [];
        let form = new formidable.IncomingForm();
        form.on('file', (field, file) => files.push(file));
        form.on('error', reject);
        form.on('abort', reject);
        form.on('end', () => resolve(files));
        form.parse(ctx.req);
      } catch (err) {
        reject(err);
      }
    });

    let fileInfos = await Promise.all(files.map(async file => {
      let hash = await getFileHash(file);
      let filepath = path.join(this.fileDir, bucket, hash);
      let mdpath = path.join(this.metadataDir, bucket, hash);
      let filedir = path.dirname(filepath);
      let mddir = path.dirname(mdpath);

      await mkdirp(this.fs, filedir);
      await mkdirp(this.fs, mddir);

      await new Promise((resolve, reject) => {
        let rs = fs.createReadStream(file.path);
        rs.on('error', reject);

        let ws = this.fs.createWriteStream(filepath);
        ws.on('error', reject);
        ws.on('close', resolve);
        ws.on('finish', resolve);

        rs.pipe(ws);
      });

      await unlink(file.path);

      let { size, name, type } = file;
      let metadata = { bucket, name, hash, type, size };

      await new Promise((resolve, reject) => {
        this.fs.writeFile(mdpath, JSON.stringify(metadata, null, 2), err => {
          if (err) {
            return reject(err);
          }

          resolve();
        });
      });

      return metadata;
    }));

    ctx.body = fileInfos;
  }
}

module.exports = FileBundle;
