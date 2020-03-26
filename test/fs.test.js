const path = require('path');
const fse = require('fs-extra');
const assert = require('assert');
const FileSystem = require('../fs');

const TMP_DIR = path.join(process.cwd(), 'test-tmp');
const SRC_DIR = path.join(TMP_DIR, 'src');
const DATA_DIR = path.join(TMP_DIR, 'data');

describe('FileSystem', () => {
  let filePath;

  beforeEach(async () => {
    await fse.remove(TMP_DIR);
    await fse.ensureDir(SRC_DIR);

    filePath = path.join(SRC_DIR, 'foo');
    await fse.writeFile(filePath, 'ini foo');
  });

  afterEach(async () => {
    await fse.remove(TMP_DIR);
  });

  describe('#writeFile()', () => {
    it('write entry', async () => {
      const fs = new FileSystem({ dataDir: DATA_DIR });

      const stat = await fs.writeFile({
        path: filePath,
        name: 'foo.txt',
        bucket: '/bar',
      });

      assert.strictEqual(await fse.readFile(fs.getEntryPath(stat), 'utf8'), 'ini foo');
    });

    it('write stat', async () => {
      const fs = new FileSystem({ dataDir: DATA_DIR });

      const stat = await fs.writeFile({
        path: filePath,
        name: 'foo.txt',
        bucket: '/bar',
      });

      const stored = JSON.parse(await fse.readFile(fs.getStatPath(stat), 'utf8'));

      assert.deepStrictEqual(stat, stored);
    });
  });

  describe('#stat()', () => {
    it('get stat from file', async () => {
      const fs = new FileSystem({ dataDir: DATA_DIR });
      const stat = await fs.writeFile({
        path: filePath,
        name: 'foo.txt',
        bucket: '/bar',
      });

      const st1 = await fs.stat(`${stat.bucket}/${stat.name}`);
      assert.deepStrictEqual(st1, stat);

      const st2 = await fs.stat(stat);
      assert.deepStrictEqual(st2, stat);
    });
  });

  describe('#createReadStream()', () => {
    it('create read stream for file', async () => {
      const fs = new FileSystem({ dataDir: DATA_DIR });
      const stat = await fs.writeFile({
        path: filePath,
        name: 'foo.txt',
        bucket: '/bar',
      });

      const content = await new Promise((resolve, reject) => {
        const chunks = [];
        const rs = fs.createReadStream(stat);
        rs.on('data', chunk => chunks.push(chunk));
        rs.on('error', reject);
        rs.on('end', () => {
          const data = Buffer.concat(chunks);
          resolve(data.toString());
        });
      });

      assert.strictEqual(content, 'ini foo');
    });
  });
});
