const tester = require('supertest');
const assert = require('assert');
const path = require('path');
const fse = require('fs-extra');
const Bundle = require('bono');
const FileSystem = require('../fs');

const TEST_DIR = path.join(process.cwd(), 'test-tmp');
const SRC_DIR = path.join(TEST_DIR, 'src');
const DATA_DIR = path.join(TEST_DIR, 'data');

describe('middleware:download', () => {
  let fs;

  beforeEach(async () => {
    await fse.remove(TEST_DIR);
    await fse.ensureDir(SRC_DIR);

    const filePath = path.join(SRC_DIR, 'foo.txt');
    await fse.writeFile(filePath, 'ini foo');

    fs = new FileSystem({ dataDir: DATA_DIR });
    await fs.writeFile({ name: 'foo.txt', path: filePath });
  });

  afterEach(async () => {
    await fse.remove(TEST_DIR);
  });

  it('download file', async () => {
    const bundle = new Bundle();
    bundle.use(require('../download')({ fs }));

    const res = await tester(bundle.callback())
      .get('/files/foo.txt')
      .expect(200);

    assert.strictEqual(res.headers['content-type'], 'text/plain');
    assert(!res.headers['content-disposition']);
    assert.strictEqual(res.text, 'ini foo');
  });

  it('download file as attachment', async () => {
    const bundle = new Bundle();
    bundle.use(require('../download')({ fs }));

    const res = await tester(bundle.callback())
      .get('/files/foo.txt?attachment=1')
      .expect(200);

    assert.strictEqual(res.headers['content-type'], 'text/plain');
    assert.strictEqual(res.headers['content-disposition'], 'attachment; filename="foo.txt"');
    assert.strictEqual(res.text, 'ini foo');
  });
});
