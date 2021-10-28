'use strict';

const util = require('util');

const { validateTypeOf } = require('../common');
const { SoundBuffer } = require('./sound_buffer');
const { SoundSource } = require('./base');

const GET_LOOP = Symbol('Sound::getLoop');
const SOUND_BUFFER = Symbol('Sound::soundBuffer');

class Sound extends SoundSource {
  [util.inspect.custom](depth, opts) {
    return `${Sound.name} ${util.inspect({
      [GET_LOOP]: this.getLoop(),
      [SOUND_BUFFER]: this[SOUND_BUFFER],
      ...super.toJSON(),
    }, opts)}`;
  }

  constructor(buffer) {
    validateTypeOf(buffer, 'buffer', [ Buffer, SoundBuffer ], true);
    if (Buffer.isBuffer(buffer)) {
      buffer = new SoundBuffer(buffer);
    }

    super('Sound', buffer);
    this[SOUND_BUFFER] = buffer || null;
  }

  setLoop(loop) {
    validateTypeOf(loop, 'loop', 'boolean');
    this._raw().setLoop(loop);
  }

  getLoop() {
    return this._raw().getLoop();
  }

  setBuffer(buffer) {
    validateTypeOf(buffer, 'buffer', [ Buffer, SoundBuffer ]);
    if (Buffer.isBuffer(buffer)) {
      buffer = new SoundBuffer(buffer);
    }
    super.setBuffer(buffer);
    this[SOUND_BUFFER] = buffer;
  }

  getBuffer() {
    return this[SOUND_BUFFER];
  }
}

Sound.Status = SoundSource.Status;
module.exports = { Sound };
