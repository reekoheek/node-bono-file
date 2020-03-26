const FileSystem = require('./fs');
const Bundle = require('bono');

class FileBundle extends Bundle {
  constructor ({
    dataDir,
    hashAlgorithm,
    hashEncoding,
    fs = new FileSystem({ dataDir, hashAlgorithm, hashEncoding }),
  }) {
    super();

    this.fs = fs;

    this.use(require('./upload')({ fs }));
    this.use(require('./download')({ fs }));
  }
}

module.exports = FileBundle;
