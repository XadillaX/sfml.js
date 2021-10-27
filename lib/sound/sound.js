'use strict';

const { validateTypeOf } = require('../common');
const SoundSource = require('./base');

class Sound extends SoundSource {
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

module.exports = Sound;
