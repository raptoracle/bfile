/* eslint-env mocha */
/* eslint prefer-arrow-callback: "off" */
/* global BigInt */

'use strict';

const assert = require('assert');
const {resolve} = require('path');
const fs = require('../');
const {COPYFILE_EXCL} = fs.constants;

const REAL_LIB = resolve(__dirname, '..', 'lib');
const DATA = resolve(__dirname, 'data');
const LIB = resolve(DATA, 'lib');

const LIB_FILES = [
  'backend.js',
  'bfile.js',
  'compat.js',
  'error.js',
  'extra.js',
  'features.js',
  'fs-browser.js',
  'fs.js',
  'legacy.js',
  'modern.js',
  'util.js'
];

function validateLib() {
  const list = fs.readdirSync(LIB);

  assert.deepStrictEqual(list.sort(), LIB_FILES);

  const dirents = fs.readdirSync(LIB, { withFileTypes: true });

  assert.deepStrictEqual(dirents.sort(sortDirent).map(d => d.name), LIB_FILES);

  for (const name of LIB_FILES) {
    const file = resolve(LIB, name);
    const stat = fs.statSync(file);
    assert(stat.isFile());
  }

  for (const name of LIB_FILES) {
    const file = resolve(LIB, name);
    const real = resolve(REAL_LIB, name);
    const fileData = fs.readFileSync(file);
    const realData = fs.readFileSync(real);

    assert(fileData.equals(realData));
  }
}

function sortDirent(a, b) {
  return a.name.localeCompare(b.name);
}

if (!assert.rejects) {
  // Not pretty, but better than nothing.
  assert.rejects = async function rejects(func, ...args) {
    if (!(func instanceof Promise))
      assert(typeof func === 'function');

    try {
      if (func instanceof Promise)
        await func;
      else
        await func();
    } catch (e) {
      assert.throws(() => {
        throw e;
      }, ...args);
      return;
    }

    assert.throws(() => {}, ...args);
  };
}

describe('FS', function() {
  if (process.browser)
    return;

  it('should have environment', () => {
    assert(fs && typeof fs === 'object');
    assert(fs.unsupported === false);
  });

  describe('Sync', function() {
    it('should do rimraf (1)', () => {
      fs.rimrafSync(DATA);
      assert(!fs.existsSync(DATA));
      assert(!fs.existsSync(LIB));
    });

    it('should do mkdirp', () => {
      fs.mkdirpSync(LIB, 0o755);
      assert(fs.existsSync(DATA));
      assert(fs.existsSync(LIB));
      assert(fs.statSync(DATA).isDirectory());
      assert(fs.statSync(LIB).isDirectory());
      assert(typeof fs.statSync(DATA).birthtimeMs === 'number');
    });

    it('should do recursive copy (1)', () => {
      assert.strictEqual(fs.copySync(REAL_LIB, LIB), 0);

      validateLib();

      assert.strictEqual(fs.copySync(REAL_LIB, LIB), 0);

      validateLib();

      assert.throws(() => {
        fs.copySync(REAL_LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should do rimraf (2)', () => {
      assert.strictEqual(fs.rimrafSync(DATA), 0);
      assert(!fs.existsSync(DATA));
      assert(!fs.existsSync(LIB));
    });

    it('should do mkdir', () => {
      fs.mkdirSync(DATA, 0o755);
      assert(fs.statSync(DATA).isDirectory());
      assert(!fs.existsSync(LIB));
    });

    it('should do recursive copy (2)', () => {
      assert.strictEqual(fs.copySync(REAL_LIB, LIB, COPYFILE_EXCL), 0);

      validateLib();

      assert.throws(() => {
        fs.copySync(REAL_LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should fail to do recursive copy', () => {
      assert.throws(() => {
        fs.copySync(LIB, LIB);
      }, /EPERM/);

      assert.throws(() => {
        fs.copySync(LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should do rimraf (3)', () => {
      assert.strictEqual(fs.rimrafSync(DATA), 0);
      assert(!fs.existsSync(DATA));
      assert(!fs.existsSync(LIB));
    });
  });

  describe('Async', function() {
    it('should do rimraf (1)', async () => {
      await fs.rimraf(DATA);
      assert(!await fs.exists(DATA));
      assert(!await fs.exists(LIB));
    });

    it('should do mkdirp', async () => {
      await fs.mkdirp(LIB, 0o755);
      assert(await fs.exists(DATA));
      assert(await fs.exists(LIB));
      assert((await fs.stat(DATA)).isDirectory());
      assert((await fs.stat(LIB)).isDirectory());
      assert(typeof (await fs.stat(DATA)).birthtimeMs === 'number');
    });

    it('should do recursive copy (1)', async () => {
      assert.strictEqual(await fs.copy(REAL_LIB, LIB), 0);

      validateLib();

      assert.strictEqual(await fs.copy(REAL_LIB, LIB), 0);

      validateLib();

      await assert.rejects(async () => {
        await fs.copy(REAL_LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should do rimraf (2)', async () => {
      assert.strictEqual(await fs.rimraf(DATA), 0);
      assert(!await fs.exists(DATA));
      assert(!await fs.exists(LIB));
    });

    it('should do mkdir', async () => {
      await fs.mkdir(DATA, 0o755);
      assert((await fs.stat(DATA)).isDirectory());
      assert(!await fs.exists(LIB));
    });

    it('should do recursive copy (2)', async () => {
      assert.strictEqual(await fs.copy(REAL_LIB, LIB, COPYFILE_EXCL), 0);

      validateLib();

      await assert.rejects(async () => {
        await fs.copy(REAL_LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should fail to do recursive copy', async () => {
      await assert.rejects(async () => {
        await fs.copy(LIB, LIB);
      }, /EPERM/);

      await assert.rejects(async () => {
        await fs.copy(LIB, LIB, COPYFILE_EXCL);
      }, /EEXIST/);
    });

    it('should do rimraf (3)', async () => {
      assert.strictEqual(await fs.rimraf(DATA), 0);
      assert(!await fs.exists(DATA));
      assert(!await fs.exists(LIB));
    });
  });

  describe('I/O', function() {
    let fd = null;

    it('should create directory', async () => {
      await fs.mkdir(DATA, 0o755);
    });

    it('should open file', async () => {
      fd = await fs.open(resolve(DATA, 'fd'), 'a+');
      assert(fd != null);
    });

    it('should write to file (1)', async () => {
      assert(fd != null);
      const result = await fs.write(fd, 'foobar\n');
      assert(typeof result === 'number');
      assert.strictEqual(result, 7);
    });

    it('should stat file (1)', async () => {
      assert(fd != null);
      const stat = await fs.fstat(fd);
      assert(stat);
      assert.strictEqual(stat.size, 7);
    });

    it('should read from file (1)', async () => {
      assert(fd != null);
      const buf = Buffer.alloc(7);
      const result = await fs.read(fd, buf, 0, 7, 0);
      assert(typeof result === 'number');
      assert.strictEqual(result, 7);
      assert.strictEqual(buf.toString('binary'), 'foobar\n');
    });

    it('should truncate file', async () => {
      assert(fd != null);
      await fs.ftruncate(fd, 0);
      const stat = await fs.fstat(fd);
      assert(stat);
      assert.strictEqual(stat.size, 0);
    });

    it('should write to file (2)', async () => {
      assert(fd != null);
      const buf = Buffer.from('foobaz\n');
      const result = await fs.write(fd, buf, 0, 7, 0);
      assert(typeof result === 'number');
      assert.strictEqual(result, 7);
    });

    it('should stat file (2)', async () => {
      assert(fd != null);
      const stat = await fs.fstat(fd);
      assert(stat);
      assert.strictEqual(stat.size, 7);
    });

    it('should read from file (2)', async () => {
      assert(fd != null);
      const buf = Buffer.alloc(7);
      const result = await fs.read(fd, buf, 0, 7, 0);
      assert(typeof result === 'number');
      assert.strictEqual(result, 7);
      assert.strictEqual(buf.toString('binary'), 'foobaz\n');
    });

    it('should close file', async () => {
      await fs.close(fd);
    });

    it('should do rimraf', async () => {
      assert.strictEqual(await fs.rimraf(DATA), 0);
      assert(!await fs.exists(DATA));
      assert(!await fs.exists(LIB));
    });
  });

  describe('Promises', function() {
    const {promises} = fs;

    let handle = null;

    for (let i = 0; i < 2; i++) {
      it('should create directory', async () => {
        await promises.mkdir(DATA, 0o755);
      });

      it('should open file', async () => {
        if (i === 0)
          handle = await promises.open(resolve(DATA, 'handle'), 'a+');
        else
          handle = await fs.handle(resolve(DATA, 'handle'), 'a+');

        assert(handle && typeof handle === 'object');
      });

      it('should write to file (1)', async () => {
        assert(handle);
        const result = await handle.write('foobar\n');
        assert(result);
        assert(typeof result.bytesWritten === 'number');
        assert(typeof result.buffer === 'string');
        assert.strictEqual(result.bytesWritten, 7);
      });

      it('should stat file (1)', async () => {
        assert(handle);
        const stat = await handle.stat();
        assert(stat);
        assert.strictEqual(stat.size, 7);
      });

      it('should read from file (1)', async () => {
        assert(handle);
        const buf = Buffer.alloc(7);
        const result = await handle.read(buf, 0, 7, 0);
        assert(result);
        assert(typeof result.bytesRead === 'number');
        assert(Buffer.isBuffer(result.buffer));
        assert.strictEqual(result.bytesRead, 7);
        assert.strictEqual(buf.toString('binary'), 'foobar\n');
      });

      it('should truncate file', async () => {
        assert(handle);
        await handle.truncate(0);
        const stat = await handle.stat();
        assert(stat);
        assert.strictEqual(stat.size, 0);
      });

      it('should write to file (2)', async () => {
        assert(handle);
        const buf = Buffer.from('foobaz\n');
        const result = await handle.write(buf, 0, 7, 0);
        assert(result);
        assert(typeof result.bytesWritten === 'number');
        assert(Buffer.isBuffer(result.buffer));
        assert.strictEqual(result.bytesWritten, 7);
      });

      it('should stat file (2)', async () => {
        assert(handle);

        const stat = await handle.stat();

        assert(stat);
        assert.strictEqual(stat.size, 7);

        if (typeof BigInt === 'function') {
          const bigstat = await handle.stat({ bigint: true });
          assert.strictEqual(bigstat.size, BigInt(7));
        }
      });

      it('should read from file (2)', async () => {
        assert(handle);
        const buf = Buffer.alloc(7);
        const result = await handle.read(buf, 0, 7, 0);
        assert(result);
        assert(typeof result.bytesRead === 'number');
        assert(Buffer.isBuffer(result.buffer));
        assert.strictEqual(result.bytesRead, 7);
        assert.strictEqual(buf.toString('binary'), 'foobaz\n');
      });

      it('should close file', async () => {
        await handle.close();
      });

      it('should do rimraf', async () => {
        assert.strictEqual(await fs.rimraf(DATA), 0);
        assert(!await fs.exists(DATA));
        assert(!await fs.exists(LIB));
      });
    }
  });
});
