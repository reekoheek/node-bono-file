const crypto = require('crypto');
const fs = require('fs');

module.exports = function getFileHash (file, encoding = 'hex') {
  let hash = crypto.createHash('sha1');
  if (file instanceof Buffer) {
    hash.update(file);
    return hash.digest(encoding);
  }

  return new Promise((resolve, reject) => {
    try {
      let f = fs.createReadStream(file.path);
      f.on('data', data => hash.update(data));
      f.on('close', () => {
        resolve(hash.digest(encoding));
      });
    } catch (err) {
      reject(err);
    }
  });
};
