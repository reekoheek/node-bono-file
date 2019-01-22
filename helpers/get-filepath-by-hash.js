const path = require('path');

module.exports = function (fileDir, hash) {
  let [ alg, hashOnly ] = hash.split(':');
  let [ hashPrefix, hashRest ] = hashOnly.match(/^(\w{2})(.*)$/).slice(1);
  return path.join(fileDir, alg, hashPrefix, hashRest);
};
