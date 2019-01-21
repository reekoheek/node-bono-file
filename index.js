const Bundle = require('bono');
const path = require('path');
const fs = require('fs');
const util = require('util');
const unlink = util.promisify(fs.unlink);
const getFileHash = require('./helpers/get-file-hash');
const mkdirp = require('./helpers/mkdirp');
const FsBundle = require('./bundles/fs');

class FileBundle extends Bundle {
  constructor ({ dataDir = path.join(process.cwd(), 'data'), fs: optFs } = {}) {
    super();

    this.fs = optFs || fs;
    this.dataDir = dataDir;
    this.fileDir = path.join(dataDir, 'files');
    this.metadataDir = path.join(dataDir, 'metadata');

    this.use(require('./middlewares/upload')());

    this.bundle('/files', new FsBundle(this));
    this.post('/upload', this.upload.bind(this));
  }

  async upload (ctx) {
    let { bucket = '/' } = ctx.query;
    if (bucket[0] !== '/') {
      bucket = '/' + bucket;
    }

    let files = ctx.request.files;

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
