const crypto = require('crypto');
const fs = require('fs');

module.exports = function getFileHash (file, alg = 'sha256', encoding = 'hex') {
  let hash = crypto.createHash(alg);
  if (file instanceof Buffer) {
    hash.update(file);
    return alg + ':' + hash.digest(encoding);
  }

  return new Promise((resolve, reject) => {
    try {
      let f = fs.createReadStream(file.path);
      f.on('data', data => hash.update(data));
      f.on('close', () => {
        resolve(alg + ':' + hash.digest(encoding));
      });
    } catch (err) {
      reject(err);
    }
  });
};
