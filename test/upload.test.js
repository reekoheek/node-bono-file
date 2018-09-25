const test = require('supertest');
const FileBundle = require('..');
const assert = require('assert');
const MemoryFileSystem = require('memory-fs');

describe('upload', () => {
  // before(() => process.addListener('unhandledRejection', err => console.error('Unhandled', err)));
  // after(() => process.removeAllListeners('unhandledRejection'));

  let fs;
  beforeEach(() => {
    fs = new MemoryFileSystem();
  });

  it('upload file', async () => {
    let bundle = new FileBundle({ dataDir: '/files', fs });

    let res = await test(bundle.callback())
      .post('/upload')
      .attach('file', Buffer.from('foo'), 'foo.txt')
      .attach('file', Buffer.from('bar'), 'bar.txt')
      .expect(200);

    assert.strictEqual(res.body[0].name, 'foo.txt');
    assert.strictEqual(res.body[1].name, 'bar.txt');
  });

  it('upload file to bucket', async () => {
    let bundle = new FileBundle({ dataDir: '/files', fs });

    let res = await test(bundle.callback())
      .post('/upload?bucket=/fooBucket')
      .attach('file', Buffer.from('foo'), 'foo.txt')
      .expect(200);

    assert.strictEqual(res.body[0].name, 'foo.txt');
    assert(fs.data.files.fooBucket);
  });
});
