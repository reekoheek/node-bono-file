const Bundle = require('bono');
const formidable = require('formidable');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const util = require('util');
const unlink = util.promisify(fs.unlink);

class FileBundle extends Bundle {
  constructor ({ dataDir = path.join(process.cwd(), 'files'), fs: optFs } = {}) {
    super();

    this.post('/upload', this.upload.bind(this));

    this.fs = optFs || fs;
    this.dataDir = dataDir;
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
      let serverName = await getFileHash(file);
      let filepath = path.join(this.dataDir, bucket, serverName);
      let filedir = path.dirname(filepath);
      await mkdirP(this.fs, filedir);

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
      return { bucket, name, serverName, type, size };
    }));

    ctx.body = fileInfos;
  }
}

function getFileHash (file, encoding = 'hex') {
  return new Promise((resolve, reject) => {
    try {
      let f = fs.createReadStream(file.path);
      let hash = crypto.createHash('sha1');
      f.on('data', data => hash.update(data));
      f.on('close', () => {
        resolve(hash.digest(encoding));
      });
    } catch (err) {
      reject(err);
    }
  });
}

async function mkdirP (fs, p, mode) {
  if (p.charAt(0) !== '/') {
    throw new Error('Relative path: ' + p);
  }

  if (p === '/') {
    return;
  }

  let exists = await new Promise(resolve => {
    fs.exists(p, exists => resolve(exists));
  });

  if (exists) {
    return;
  }

  return new Promise(async (resolve, reject) => {
    let ps = path.normalize(p).split('/');
    try {
      let parentPath = ps.slice(0, -1).join('/') || '/';
      await mkdirP(fs, parentPath, mode);
      await new Promise((resolve, reject) => {
        fs.mkdir(p, mode, err => {
          if (err) {
            return reject(err);
          }

          resolve();
        });
      });
      resolve();
    } catch (err) {
      if (err.errno !== process.EEXIST) {
        return reject(err);
      }
    }
  });
};

module.exports = FileBundle;
