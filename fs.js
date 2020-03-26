const fs = require('fs-extra');
const nPath = require('path');
const nodePath = require('path');
const crypto = require('crypto');
const mime = require('mime');

class FileSystem {
  constructor ({ dataDir, hashAlgorithm = 'sha256', hashEncoding = 'hex' }) {
    this.hashAlgorithm = hashAlgorithm;
    this.hashEncoding = hashEncoding;
    this.dataDir = dataDir;
    this.entryDir = nodePath.join(dataDir, 'entries');
    this.statDir = nodePath.join(dataDir, 'stat');
  }

  async writeFile ({ name, bucket = '/', path, type, size }) {
    if (!name) {
      throw new Error('File must have name');
    }

    if (!path) {
      throw new Error('File must have source path');
    }

    if (!type) {
      type = mime.getType(name);
    }

    if (!size) {
      const stat = await fs.stat(path);
      size = stat.size;
    }

    const hash = await this.hash({ path });

    const entryPath = this.getEntryPath({ hash });
    if (!await fs.exists(entryPath)) {
      // await fs.ensureDir(nPath.dirname(entryPath));
      await fs.copy(path, entryPath);
    }

    const stat = { name, bucket, type, size, hash };

    const statPath = this.getStatPath({ name, bucket });
    await fs.ensureDir(nPath.dirname(statPath));
    await fs.writeFile(statPath, JSON.stringify(stat));

    return stat;
  }

  async stat (file) {
    if (typeof file === 'string') {
      const bucket = nPath.dirname(file);
      const name = nPath.basename(file);
      file = { bucket, name };
    }

    const statPath = this.getStatPath(file);
    const content = await fs.readFile(statPath);
    return JSON.parse(content);
  }

  hash (file) {
    return new Promise((resolve, reject) => {
      try {
        const hash = crypto.createHash(this.hashAlgorithm);
        const f = fs.createReadStream(file.path);
        f.on('data', data => hash.update(data));
        f.on('close', () => {
          resolve(`${this.hashAlgorithm}:${hash.digest(this.hashEncoding)}`);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  createReadStream (file) {
    const entryPath = this.getEntryPath(file);
    return fs.createReadStream(entryPath);
  }

  getStatPath ({ name, bucket }) {
    return nPath.join(this.statDir, bucket, name + '.json');
  }

  getEntryPath ({ hash }) {
    const [alg, hashOnly] = hash.split(':');
    const prefix = hashOnly.substr(0, 2);
    const suffix = hashOnly.substr(2);
    return nPath.join(this.entryDir, alg, prefix, suffix);
  }
}

module.exports = FileSystem;
