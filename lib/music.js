'use strict';

const path = require('path');

const { Music: _Music } = require('../build/Release/binding.node');
const { createDeferred, validateTypeOf } = require('./common');

class Music extends _Music {
  async openFromFile(filename) {
    const { promise, resolve, reject } = createDeferred();
    validateTypeOf(filename, 'filename', 'string');
    filename = path.resolve(process.cwd(), filename);
    const err = super.openFromFile(filename, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });

    if (err) {
      process.nextTick(() => { reject(err); });
    }

    return promise;
  }

  openFromFileSync(filename) {
    validateTypeOf(filename, 'filename', 'string');
    filename = path.resolve(process.cwd(), filename);
    return super.openFromFileSync(filename);
  }
}

module.exports = Music;
