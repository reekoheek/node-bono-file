/**
 * Create download middleware
 * @param {Object} options
 * @param {string} options.uri
 * @param {import('./fs')} options.fs
 */
module.exports = function download ({ uri = '/files', fs }) {
  return async (ctx, next) => {
    const ctxPath = decodeURIComponent(ctx.path);
    if (ctx.method !== 'GET' || !ctxPath.startsWith(uri)) {
      return next();
    }

    try {
      const file = ctxPath.substr(uri.length);
      const stat = await fs.stat(file);

      ctx.set('Content-Type', stat.type);
      if (ctx.query.attachment) {
        const filename = ctx.query.name || stat.name || '';
        ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      }
      ctx.body = fs.createReadStream(stat);
    } catch (err) {
      ctx.throw(404);
    }
  };
};
