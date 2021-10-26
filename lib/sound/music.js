'use strict';

const path = require('path');

const { createDeferred, validateTypeOf } = require('../common');
const SoundSource = require('./base');

class Music extends SoundSource {
  constructor() {
    super('Music');
  }

  setLoop(loop) {
    validateTypeOf(loop, 'loop', 'boolean');
    this._raw().setLoop(loop);
  }

  getLoop() {
    return this._raw().getLoop();
  }

  async openFromFile(filename) {
    const { promise, resolve, reject } = createDeferred();
    validateTypeOf(filename, 'filename', 'string');
    filename = path.resolve(process.cwd(), filename);
    const err = this._raw().openFromFile(filename, err => {
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
    return this._raw().openFromFileSync(filename);
  }
}

module.exports = Music;
