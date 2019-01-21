const formidable = require('formidable');

module.exports = function upload () {
  return async (ctx, next) => {
    if (ctx.method !== 'POST' || ctx.path !== '/upload') {
      return next();
    }

    ctx.request.files = await new Promise((resolve, reject) => {
      try {
        let files = [];
        let form = new formidable.IncomingForm();
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

    await next();
  };
};
