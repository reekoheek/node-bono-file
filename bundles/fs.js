const Bundle = require('bono');
const path = require('path');
const exists = require('../helpers/exists');
const readFile = require('../helpers/read-file');

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

    try {
      let filepath = path.join(this.fileDir, absolutePath);
      if (await exists(this.fs, filepath)) {
        let metadata = await this.getMetadata(absolutePath);

        ctx.set('Content-Type', metadata.type);
        if (ctx.query.attachment) {
          let filename = ctx.query.name || metadata.name || '';
          ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
        }
        ctx.body = this.fs.createReadStream(filepath);
        return;
      }
    } catch (err) {
      throw err;
    }

    ctx.throw(404);
  }

  async getMetadata (bucketPath) {
    let data = await readFile(this.fs, path.join(this.metadataDir, bucketPath));
    try {
      return JSON.parse(data);
    } catch (err) {
      return {};
    }
  }
};
