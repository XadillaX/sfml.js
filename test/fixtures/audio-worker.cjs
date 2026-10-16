'use strict';

const { isMainThread } = require('node:worker_threads');
const assert = require('node:assert/strict');
const { setTimeout: delay } = require('node:timers/promises');

module.exports = (context, options = {}) => {
  assert.equal(isMainThread, false);
  const events = options.events ? new Int32Array(options.events) : null;
  let cursor = 0;
  return {
    async onGetData(chunk) {
      if (options.fail) throw new Error('worker fixture failed');
      if (options.delay) await delay(options.delay);
      const limit = options.samples ?? context.sampleRate;
      const count = Math.max(0, Math.min(chunk.samples.length, limit - cursor));
      for (let i = 0; i < count; i++) chunk.samples[i] = (cursor + i) % 30000;
      cursor += count;
      chunk.sampleCount = count;
      if (events) Atomics.add(events, 0, 1);
      return cursor < limit;
    },
    onSeek(time) {
      cursor = Number(time.asMicroseconds() *
        BigInt(context.sampleRate * context.channelCount) / 1000000n);
      if (events) {
        Atomics.add(events, 1, 1);
        Atomics.store(events, 2, cursor);
      }
    },
    onLoop() { return options.loop === false ? undefined : 0n; },
    onStart() {
      if (events) Atomics.add(events, 3, 1);
      return options.start !== false;
    },
    onProcessSamples(samples) {
      if (events) {
        Atomics.add(events, 4, samples.length);
        Atomics.store(events, 5, samples[0]);
      }
      return options.continue !== false;
    },
    onStop() { if (events) Atomics.add(events, 6, 1); },
    process(input, inputCount, output, outputCount, channels) {
      if (!input) {
        if (events) Atomics.add(events, 7, 1);
        return { inputFrameCount: 0, outputFrameCount: 0 };
      }
      const count = Math.min(inputCount, outputCount, options.partial ?? 65536);
      for (let i = 0; i < count * channels; ++i) {
        output[i] = input[i] * (options.gain ?? 0.5);
      }
      return { inputFrameCount: count, outputFrameCount: count };
    },
  };
};
