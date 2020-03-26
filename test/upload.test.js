const tester = require('supertest');
const assert = require('assert');
const path = require('path');
const fse = require('fs-extra');
const Bundle = require('bono');
const FileSystem = require('../fs');

const TEST_DIR = path.join(process.cwd(), 'test-tmp');

describe('middleware:upload', () => {
  it('upload multiple files', async () => {
    await fse.remove(TEST_DIR);
    await fse.ensureDir(TEST_DIR);

    try {
      const fs = new FileSystem({ dataDir: TEST_DIR });
      const bundle = new Bundle();
      bundle.use(require('../upload')({ fs }));

      const { body } = await tester(bundle.callback())
        .post('/upload')
        .attach('file', Buffer.from('foo'), 'foo.txt')
        .attach('file', Buffer.from('bar'), 'bar.txt')
        .expect(201);

      assert.deepStrictEqual(body.entries.map(e => e.name), ['foo.txt', 'bar.txt']);
    } finally {
      await fse.remove(TEST_DIR);
    }
  });
});
