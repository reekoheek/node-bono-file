module.exports = function exists (fs, p) {
  return new Promise((resolve, reject) => {
    fs.stat(p, (err, stats) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};
