const test = require('supertest');
const FileBundle = require('..');
const assert = require('assert');
const MemoryFileSystem = require('memory-fs');

describe('download', () => {
  it('download file', async () => {
    let hash = '1234567890';
    let fb = Buffer.from('foo');
    let data = {
      files: {
        '': true,
        'fooBucket': {
          '': true,
          '1234567890': fb,
        },
      },
      metadata: {
        '': true,
        'fooBucket': {
          '': true,
          '1234567890': Buffer.from(JSON.stringify({
            name: 'foo.txt',
            type: 'text/foo',
          })),
        },
      },
    };

    let fs = new MemoryFileSystem(data);
    let bundle = new FileBundle({ dataDir: '/', fs });

    let res = await test(bundle.callback())
      .get(`/files/fooBucket/${hash}`)
      .expect(200);

    assert.strictEqual(res.headers['content-type'], 'text/foo');
    assert(!res.headers['content-disposition']);
    assert.strictEqual(res.text, fb.toString());
  });

  it('download file as attachment', async () => {
    let hash = '1234567890';
    let fb = Buffer.from('foo');
    let data = {
      files: {
        '': true,
        'fooBucket': {
          '': true,
          '1234567890': fb,
        },
      },
      metadata: {
        '': true,
        'fooBucket': {
          '': true,
          '1234567890': Buffer.from(JSON.stringify({
            name: 'foo.txt',
            type: 'text/foo',
          })),
        },
      },
    };

    let fs = new MemoryFileSystem(data);
    let bundle = new FileBundle({ dataDir: '/', fs });

    let res = await test(bundle.callback())
      .get(`/files/fooBucket/${hash}?attachment=1`)
      .expect(200);

    assert.strictEqual(res.headers['content-type'], 'text/foo');
    assert.strictEqual(res.headers['content-disposition'], 'attachment; filename="foo.txt"');
    assert.strictEqual(res.text, fb.toString());
  });
});
