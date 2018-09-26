const test = require('supertest');
const FileBundle = require('..');
const assert = require('assert');
const MemoryFileSystem = require('memory-fs');
const getFileHash = require('../helpers/get-file-hash');

describe('upload', () => {
  // before(() => process.addListener('unhandledRejection', err => console.error('Unhandled', err)));
  // after(() => process.removeAllListeners('unhandledRejection'));

  let fs;
  beforeEach(() => {
    fs = new MemoryFileSystem();
  });

  it('upload file', async () => {
    let bundle = new FileBundle({ dataDir: '/', fs });

    let res = await test(bundle.callback())
      .post('/upload')
      .attach('file', Buffer.from('foo'), 'foo.txt')
      .attach('file', Buffer.from('bar'), 'bar.txt')
      .expect(200);

    assert.strictEqual(res.body[0].name, 'foo.txt');
    assert.strictEqual(res.body[1].name, 'bar.txt');
  });

  it('upload file to bucket', async () => {
    let fb = Buffer.from('foo');
    let bundle = new FileBundle({ dataDir: '/', fs });

    let res = await test(bundle.callback())
      .post('/upload?bucket=/fooBucket')
      .attach('file', fb, 'foo.txt')
      .expect(200);

    let hash = getFileHash(fb);
    assert.strictEqual(res.body[0].name, 'foo.txt');
    assert.strictEqual(res.body[0].hash, hash);
    assert.strictEqual(res.body[0].type, 'text/plain');
    assert.strictEqual(res.body[0].size, fb.length);

    assert(fs.data.files.fooBucket);
    assert.strictEqual(fs.data.files.fooBucket[hash].toString('base64'), fb.toString('base64'));

    res = await test(bundle.callback())
      .get(`/files/fooBucket/${hash}`)
      .expect(200);

    assert.strictEqual(res.body.toString('base64'), fb.toString('base64'));
  });
});
