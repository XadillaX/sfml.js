'use strict';

const path = require('path');
const util = require('util');

const { milliseconds } = require('../time');

const { SoundBuffer: _SoundBuffer } = require('../../build/Release/binding.node');
const { createDeferred, validateTypeOf } = require('../common');

const SAMPLES = Symbol('SoundBuffer#samples');
const DURATION = Symbol('SoundBuffer#duration');
const SAMPLE_COUNT = Symbol('SoundBuffer#sampleCount');
const SAMPLE_RATE = Symbol('SoundBuffer#sampleRate');
const CHANNEL_COUNT = Symbol('SoundBuffer#channelCount');

class SoundBuffer extends _SoundBuffer {
  [util.inspect.custom](depth, opts) {
    return `${SoundBuffer.name} ${util.inspect({
      [SAMPLES]: this.duplicateSamples(),
      [DURATION]: this.getDuration(),
      [SAMPLE_COUNT]: this.getSampleCount(),
      [SAMPLE_RATE]: this.getSampleRate(),
      [CHANNEL_COUNT]: this.getChannelCount(),
    }, opts)}`;
  }

  constructor(buffer) {
    if (!buffer) {
      super();
    } else {
      validateTypeOf(buffer, 'buffer', Buffer);
      super(buffer);
    }
  }

  loadFromMemory(buffer) {
    validateTypeOf(buffer, 'buffer', Buffer);
    return super.loadFromMemory(buffer);
  }

  loadFromSamples(samples, channelCount, sampleRate) {
    validateTypeOf(samples, 'samples', [ Array, Int16Array ]);
    validateTypeOf(channelCount, 'channelCount', 'number');
    validateTypeOf(sampleRate, 'sampleRate', 'number');
    if (sampleRate < 0 || channelCount < 0) {
      throw new RangeError('channelCount and sampleRate should >= 0.');
    }

    return super.loadFromSamples(samples, channelCount, sampleRate);
  }

  getDuration() {
    const dur = super.getDuration();
    return milliseconds(dur);
  }

  async saveToFile(filename) {
    const { promise, resolve, reject } = createDeferred();
    validateTypeOf(filename, 'filename', 'string');
    filename = path.resolve(process.cwd(), filename);
    const err = super.saveToFile(filename, err => {
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
}

module.exports = { SoundBuffer };
