const formidable = require('formidable');

/**
 * Create upload middleware
 * @param {Object} options
 * @param {string} options.uri
 * @param {import('./fs')} options.fs
 */
module.exports = function upload ({ uri = '/upload', fs }) {
  return async (ctx, next) => {
    if (ctx.method !== 'POST' || ctx.path !== uri) {
      return next();
    }

    try {
      let { bucket = '/' } = ctx.query;
      if (bucket[0] !== '/') {
        bucket = '/' + bucket;
      }

      const files = await getFiles(ctx);

      const entries = await Promise.all(
        files.map(({ name, path, type, size }) =>
          fs.writeFile({ bucket, name, path, type, size }),
        ),
      );

      ctx.status = 201;
      ctx.body = { entries };
    } catch (err) {
      ctx.throw(400);
    }
  };
};

function getFiles (ctx) {
  return new Promise((resolve, reject) => {
    try {
      const files = [];
      const form = new formidable.IncomingForm();
      form.on('file', (field, file) => {
        file.field = field;
        files.push(file);
      });
      form.on('error', reject);
      form.on('abort', reject);
      form.on('end', () => resolve(files));
      form.parse(ctx.req);
    } catch (err) {
      reject(err);
    }
  });
}
