const tester = require('supertest');
const FileBundle = require('../bundle');
const path = require('path');
const fs = require('fs-extra');

const TEST_DIR = path.join(process.cwd(), 'test-tmp');

describe('FileBundle', () => {
  it('can upload and download', async () => {
    await fs.remove(TEST_DIR);

    try {
      const bundle = new FileBundle({ dataDir: TEST_DIR });

      await tester(bundle.callback())
        .post('/upload?bucket=/foo')
        .attach('file', Buffer.from('foo'), 'foo.txt')
        .expect(201);

      await tester(bundle.callback())
        .get('/files/foo/foo.txt')
        .expect(200);
    } finally {
      await fs.remove(TEST_DIR);
    }
  });
});
