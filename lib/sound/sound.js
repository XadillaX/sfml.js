'use strict';

const util = require('util');

const { validateTypeOf } = require('../common');
const { SoundSource } = require('./base');

const GET_LOOP = Symbol('Sound::getLoop');

class Sound extends SoundSource {
  [util.inspect.custom](depth, opts) {
    return `${Sound.name} ${util.inspect({
      [GET_LOOP]: this.getLoop(),
      ...super.toJSON(),
    }, opts)}`;
  }

  constructor(buffer) {
    super('Sound', buffer);
  }

  setLoop(loop) {
    validateTypeOf(loop, 'loop', 'boolean');
    this._raw().setLoop(loop);
  }

  getLoop() {
    return this._raw().getLoop();
  }
}

module.exports = { Sound };
