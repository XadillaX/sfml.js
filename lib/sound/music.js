'use strict';

const path = require('path');
const util = require('util');

const { createDeferred, validateTypeOf } = require('../common');
const { SoundSource } = require('./base');

const GET_LOOP = Symbol('Music::getLoop');

class Music extends SoundSource {
  [util.inspect.custom](depth, opts) {
    return `${Music.name} ${util.inspect({
      [GET_LOOP]: this.getLoop(),
      ...super.toJSON(),
    }, opts)}`;
  }

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

  openFromMemory(buff) {
    validateTypeOf(buff, 'buff', Buffer);
    return this._raw().openFromMemory(buff);
  }

}

Music.Status = SoundSource.Status;
module.exports = { Music };
