module.exports = function readFile (fs, p) {
  return new Promise((resolve, reject) => {
    fs.readFile(p, (err, data) => {
      if (err) {
        return reject(err);
      }

      resolve(data);
    });
  });
};
