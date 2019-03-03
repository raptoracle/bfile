/*!
 * legacy.js - legacy backend for bfile
 * Copyright (c) 2014-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bfile
 */

'use strict';

const compat = require('./compat');
const features = require('./features');
const fs = require('./modern');

let cloned = false;

// Future proofing:
const clone = () => {
  if (!cloned) {
    fs.constants = Object.assign(Object.create(null), fs.constants);
    cloned = true;
  }
};

if (!features.HAS_STAT_NUMBERS
    || !features.HAS_STAT_BIGINTS) {
  fs.fstat = compat.fstat;
  fs.fstatSync = compat.fstatSync;
  fs.stat = compat.stat;
  fs.statSync = compat.statSync;
  fs.lstat = compat.lstat;
  fs.lstatSync = compat.lstatSync;
}

if (!features.HAS_COPY_FILE_IMPL) {
  clone();
  fs.constants.COPYFILE_EXCL = compat.COPYFILE_EXCL;
  fs.constants.COPYFILE_FICLONE = compat.COPYFILE_FICLONE;
  fs.constants.COPYFILE_FICLONE_FORCE = compat.COPYFILE_FICLONE_FORCE;
  fs.copyFile = compat.copyFile;
  fs.copyFileSync = compat.copyFileSync;
}

if (!features.HAS_REALPATH_NATIVE_IMPL) {
  fs.realpath = compat.realpath;
  fs.realpathSync = compat.realpathSync;
}

if (!features.HAS_PROMISES_IMPL) {
  Object.defineProperty(fs, 'promises', {
    configurable: true,
    enumerable: false,
    get() {
      return compat.promises;
    }
  });
}

if (!features.HAS_DIRENT_IMPL) {
  fs.readdir = compat.readdir;
  fs.readdirSync = compat.readdirSync;
  fs.Dirent = compat.Dirent;
}

if (!features.HAS_RW_TYPED_ARRAY) {
  fs.read = compat.read;
  fs.readSync = compat.readSync;
  fs.write = compat.write;
  fs.writeSync = compat.writeSync;
  fs.writeFile = compat.writeFile;
  fs.writeFileSync = compat.writeFileSync;
}

if (!features.HAS_RECURSIVE_MKDIR) {
  fs.mkdir = compat.mkdir;
  fs.mkdirSync = compat.mkdirSync;
}

if (!features.HAS_OPTIONAL_FLAGS)
  fs.open = compat.open;

/*
 * Expose
 */

module.exports = fs;