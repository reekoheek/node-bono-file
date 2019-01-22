const Bundle = require('bono');
const path = require('path');
const exists = require('../helpers/exists');
const readFile = require('../helpers/read-file');
const getFilepathByHash = require('../helpers/get-filepath-by-hash');

module.exports = class FsBundle extends Bundle {
  constructor ({ fs, fileDir, metadataDir }) {
    super();

    this.fs = fs;
    this.fileDir = fileDir;
    this.metadataDir = metadataDir;

    this.use(this.doRouting.bind(this));
  }

  async doRouting (ctx, next) {
    let absolutePath = ctx.path;

    if (absolutePath === '/') {
      return next();
    }

    let metadata = await this.getMetadata(absolutePath);
    if (!metadata) {
      ctx.throw(404);
    }

    let filepath = getFilepathByHash(this.fileDir, metadata.hash);
    let fexist = await exists(this.fs, filepath);
    if (!fexist) {
      ctx.throw(404);
    }

    ctx.set('Content-Type', metadata.type);
    if (ctx.query.attachment) {
      let filename = ctx.query.name || metadata.name || '';
      ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    }
    ctx.body = this.fs.createReadStream(filepath);
  }

  async getMetadata (bucketPath) {
    try {
      let data = await readFile(this.fs, path.join(this.metadataDir, bucketPath));
      return JSON.parse(data);
    } catch (err) {
      // noop
    }
  }
};
