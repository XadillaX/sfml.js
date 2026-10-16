'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setTimeout: delay } = require('node:timers/promises');
const { join } = require('node:path');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { audioHandle } = require('../dist/internal/audio-native');

async function until(check) {
  const deadline = Date.now() + 3000;
  while (!check()) {
    assert.ok(Date.now() < deadline, 'Recorder callback did not finish');
    await delay(2);
  }
}

function gate() {
  let resolve;
  let resolved = false;
  const promise = new Promise(done => {
    resolve = () => { resolved = true; done(); };
  });
  return { promise, resolve, get resolved() { return resolved; } };
}

// Replace device preparation/start only. Queue, callbacks, stop and buffer
// aggregation use the real native implementation; no microphone is opened.
function capture(t, starts = true) {
  assert.equal(sf.PlaybackDevice.setDeviceToNull(), true);
  const queues = [];
  t.mock.method(native, 'prepareAudioRecorder',
    (handle, rate, frames, slots, callback, callbacks) => {
      const result = native.prepareAudioRecorderProbe(
        handle, rate, frames, slots, callbacks);
      queues.push(result);
      queueMicrotask(() => callback(null, result));
    });
  t.mock.method(native, 'startAudioRecorder', (handle, callback) => {
    const result = native.startAudioRecorderProbe(handle, starts);
    queueMicrotask(() => callback(null, result));
  });
  return {
    queues,
    samples(values) {
      native.audioQueueProbe(queues.at(-1).handle, 1,
        Int16Array.from(values));
    },
  };
}

test('Recorder subclasses transform PCM through super and drain in order',
  async t => {
    const input = capture(t);
    const entered = gate();
    const release = gate();
    const events = [];
    class Filtered extends sf.SoundBufferRecorder {
      #blocks = 0;
      async onStart() {
        events.push('start');
        return await super.onStart();
      }
      async onProcessSamples(samples) {
        events.push(`block:${++this.#blocks}`);
        if (this.#blocks === 1) {
          entered.resolve();
          await release.promise;
        }
        for (let i = 0; i < samples.length; ++i) samples[i] *= 2;
        return await super.onProcessSamples(samples);
      }
      async onStop() {
        events.push('stop');
        await super.onStop();
      }
    }
    const recorder = new Filtered();
    assert.equal(await recorder.start(8000), true);
    input.samples([ 1, 2 ]);
    await until(() => entered.resolved);
    input.samples([ 3, 4 ]);
    let stopped = false;
    const stopping = recorder.stop().then(() => { stopped = true; });
    await delay(5);
    assert.equal(stopped, false);
    release.resolve();
    await stopping;
    assert.deepEqual(events, [ 'start', 'block:1', 'block:2', 'stop' ]);
    assert.deepEqual([ ...recorder.getBuffer().getSamples() ], [ 2, 4, 6, 8 ]);
    assert.equal(recorder.getBuffer().getSampleRate(), 8000);
    assert.equal(recorder.getWorkerStats().processed, 4n);
    const previous = recorder.getBuffer();
    assert.equal(await recorder.start(16000), true);
    assert.equal(recorder.getBuffer().getSampleCount(), 0n);
    input.samples([ 9 ]);
    await recorder.stop();
    assert.deepEqual([ ...recorder.getBuffer().getSamples() ], [ 18 ]);
    assert.deepEqual([ ...previous.getSamples() ], [ 2, 4, 6, 8 ]);
    assert.equal(recorder.getBuffer().getSampleRate(), 16000);
    await recorder.stop();
    assert.equal(events.filter(event => event === 'stop').length, 2);
  });

test('Recorder does not preserve samples when the subclass omits super',
  async t => {
    const input = capture(t);
    class Private extends sf.SoundBufferRecorder {
      onProcessSamples() { return true; }
    }
    const recorder = new Private();
    await recorder.start(8000);
    input.samples([ 11, 22, 33 ]);
    await recorder.stop();
    assert.equal(recorder.getBuffer().getSampleCount(), 0n);
    assert.equal(recorder.getWorkerStats().processed, 3n);
  });

test('Recorder start rejection and device failure invoke onStop once',
  async t => {
    capture(t, false);
    for (const accept of [ false, true ]) {
      class Refused extends sf.SoundBufferRecorder {
        stops = 0;
        onStart() { super.onStart(); return accept; }
        onStop() { this.stops++; return super.onStop(); }
      }
      const recorder = new Refused();
      assert.equal(await recorder.start(8000), false);
      await recorder.stop();
      await recorder.stop();
      assert.equal(recorder.stops, 1);
      assert.equal(recorder.getBuffer().getSampleCount(), 0n);
    }
  });

test('Recorder false result stops before delivering another block',
  async t => {
    const input = capture(t);
    class OneBlock extends sf.SoundBufferRecorder {
      stops = 0;
      onProcessSamples(samples) {
        super.onProcessSamples(samples);
        return false;
      }
      onStop() { this.stops++; return super.onStop(); }
    }
    const recorder = new OneBlock();
    await recorder.start(8000);
    input.samples([ 3 ]);
    input.samples([ 7 ]);
    await until(() => recorder.stops === 1);
    await recorder.stop();
    assert.deepEqual([ ...recorder.getBuffer().getSamples() ], [ 3 ]);
    assert.equal(recorder.stops, 1);
  });

test('Recorder callbacks may await stop without waiting for themselves',
  async t => {
    const input = capture(t);
    for (const phase of [ 'start', 'samples', 'stop' ]) {
      class SelfStopping extends sf.SoundBufferRecorder {
        stops = 0;
        async onStart() {
          if (phase === 'start') await this.stop();
          return await super.onStart();
        }
        async onProcessSamples(samples) {
          if (phase === 'samples') await this.stop();
          return await super.onProcessSamples(samples);
        }
        async onStop() {
          this.stops++;
          if (phase === 'stop') await this.stop();
          await super.onStop();
        }
      }
      const recorder = new SelfStopping();
      assert.equal(await recorder.start(8000), phase !== 'start');
      if (phase !== 'start') input.samples([ 1 ]);
      await recorder.stop();
      assert.equal(recorder.stops, 1);
    }
  });

test('Recorder stop cancels pending start and waits for its callback',
  async t => {
    capture(t);
    const entered = gate();
    const release = gate();
    class Pending extends sf.SoundBufferRecorder {
      stops = 0;
      async onStart() {
        entered.resolve();
        await release.promise;
        return super.onStart();
      }
      onStop() { this.stops++; return super.onStop(); }
    }
    const recorder = new Pending();
    const starting = recorder.start(8000);
    await until(() => entered.resolved);
    let finished = false;
    const stopping = recorder.stop().then(() => { finished = true; });
    await delay(5);
    assert.equal(finished, false);
    release.resolve();
    assert.equal(await starting, false);
    await stopping;
    assert.equal(recorder.stops, 1);
  });

for (const count of [ 1, 2 ]) {
  test(`Recorder finalizes ${count} cancelled queued starts exactly once`,
    async t => {
      capture(t);
      const entered = gate();
      const release = gate();
      class Cancelled extends sf.SoundBufferRecorder {
        starts = 0;
        stops = 0;
        onStart() { this.starts++; return super.onStart(); }
        async onStop() {
          if (++this.stops === 1) {
            entered.resolve();
            await release.promise;
          }
          await super.onStop();
        }
      }
      const recorder = new Cancelled();
      const starting = Array.from({ length: count },
        () => recorder.start(8000));
      let done = false;
      const stopping = recorder.stop().then(() => { done = true; });
      try {
        await until(() => entered.resolved || done);
        assert.equal(entered.resolved, true, 'Cancellation must invoke onStop');
        assert.equal(done, false, 'External stop must wait for onStop');
        assert.equal(recorder.starts, 0);
        assert.equal(native.startAudioRecorder.mock.callCount(), 0);
      } finally { release.resolve(); }
      assert.deepEqual(await Promise.all(starting), Array(count).fill(false));
      await stopping;
      await recorder.stop();
      assert.equal(recorder.stops, count);
      assert.equal(recorder.getBuffer().getSampleCount(), 0n);
      assert.equal(await recorder.start(8000), true);
      assert.equal(recorder.starts, 1);
      await recorder.stop();
      assert.equal(recorder.stops, count + 1);
    });
}

test('Recorder callback errors remain observable and onStop runs once',
  async t => {
    const input = capture(t);
    for (const phase of [ 'start', 'samples', 'stop' ]) {
      const failure = new Error(`Recorder ${phase} failed`);
      class Broken extends sf.SoundBufferRecorder {
        stops = 0;
        async onStart() {
          if (phase === 'start') throw failure;
          return super.onStart();
        }
        async onProcessSamples(samples) {
          if (phase === 'samples') throw failure;
          return super.onProcessSamples(samples);
        }
        async onStop() {
          this.stops++;
          if (phase === 'stop') throw failure;
          await super.onStop();
        }
      }
      const recorder = new Broken();
      if (phase === 'start') {
        await assert.rejects(recorder.start(8000), error => error === failure);
      } else {
        await recorder.start(8000);
        input.samples([ 1 ]);
      }
      await assert.rejects(recorder.stop(), error => error === failure);
      assert.equal(recorder.getWorkerError(), failure);
      assert.equal(recorder.stops, 1);
    }
  });

test('Recorder rejects recursive start and device changes inside callbacks',
  async t => {
    const input = capture(t);
    class Recursive extends sf.SoundBufferRecorder {
      async onProcessSamples(samples) {
        await assert.rejects(this.start(), /inside.*callback/);
        await assert.rejects(this.setDevice('unused'), /inside.*callback/);
        return super.onProcessSamples(samples);
      }
    }
    const recorder = new Recursive();
    await recorder.start(8000);
    input.samples([ 2 ]);
    await recorder.stop();
    assert.deepEqual([ ...recorder.getBuffer().getSamples() ], [ 2 ]);
  });

test('Recorder without overrides keeps the native buffer fast path',
  async t => {
    capture(t);
    const recorder = new sf.SoundBufferRecorder();
    assert.equal(await recorder.start(8000), true);
    assert.equal(recorder.getWorkerStats(), undefined);
    await recorder.stop();
  });

test('Recorder idle callback dispatcher does not retain its wrapper',
  async t => {
    const input = capture(t);
    class Collectable extends sf.SoundBufferRecorder {
      onProcessSamples(samples) { return super.onProcessSamples(samples); }
    }
    let recorder = new Collectable();
    await recorder.start(8000);
    const weak = new WeakRef(recorder);
    const handle = recorder[audioHandle];
    // The hardware spies retain completion callbacks and their async contexts.
    // Drop that test-only ownership before checking the production dispatcher.
    native.prepareAudioRecorder.mock.resetCalls();
    native.startAudioRecorder.mock.resetCalls();
    recorder = null;
    for (let attempt = 0; attempt < 100; ++attempt) {
      await delay(2);
      global.gc();
      if (!weak.deref()) {
        await until(() =>
          native.pollAudioWorker(input.queues[0].handle) === -3);
        assert.ok(handle);
        return;
      }
    }
    await weak.deref()?.stop();
    assert.fail('Recorder callback dispatcher retains its wrapper');
  });

test('Worker Recorder keeps ordered start and drain behavior', async t => {
  const input = capture(t);
  const events = new SharedArrayBuffer(32);
  const counters = new Int32Array(events);
  const recorder = new sf.SoundRecorder({
    module: join(__dirname, 'fixtures/audio-worker.cjs'),
    data: { events },
  });
  const starting = recorder.start(8000);
  const stopping = recorder.stop();
  assert.equal(await starting, true);
  await stopping;
  assert.equal(Atomics.load(counters, 3), 1);
  assert.equal(Atomics.load(counters, 6), 1);
  assert.equal(await recorder.start(8000), true);
  input.samples([ 5, 6, 7 ]);
  await recorder.stop();
  assert.equal(Atomics.load(counters, 4), 3);
  assert.equal(Atomics.load(counters, 6), 2);
});

test('Recorder super buffers stereo frames with the requested channel map',
  async t => {
    const input = capture(t);
    class Stereo extends sf.SoundBufferRecorder {
      onProcessSamples(samples) { return super.onProcessSamples(samples); }
    }
    const recorder = new Stereo();
    recorder.setChannelCount(2);
    await recorder.start(16000);
    input.samples([ 1, 2, 3, 4 ]);
    await recorder.stop();
    assert.equal(recorder.getBuffer().getChannelCount(), 2);
    assert.equal(recorder.getBuffer().getSampleCount(), 4n);
    assert.deepEqual([ ...recorder.getBuffer().getChannelMap() ],
      [ sf.SoundChannel.FrontLeft, sf.SoundChannel.FrontRight ]);
    assert.deepEqual([ ...recorder.getBuffer().getSamples() ], [ 1, 2, 3, 4 ]);
  });

test('Recorder start waits for onStop and rejects stale super calls',
  async t => {
    const input = capture(t);
    const entered = gate();
    const release = gate();
    let stale;
    class Generation extends sf.SoundBufferRecorder {
      first = true;
      onProcessSamples(samples) {
        stale = () => super.onProcessSamples(Int16Array.of(99));
        return super.onProcessSamples(samples);
      }
      async onStop() {
        if (this.first) {
          this.first = false;
          entered.resolve();
          await release.promise;
        }
        await super.onStop();
      }
    }
    const recorder = new Generation();
    await recorder.start(8000);
    input.samples([ 1 ]);
    const stopping = recorder.stop();
    await until(() => entered.resolved);
    let started = false;
    const restarting = recorder.start(8000).then(ok => { started = ok; });
    await delay(5);
    assert.equal(started, false);
    release.resolve();
    await stopping;
    await restarting;
    assert.equal(started, true);
    assert.throws(stale, /active Recorder callback/);
    input.samples([ 2 ]);
    await recorder.stop();
    assert.deepEqual([ ...recorder.getBuffer().getSamples() ], [ 2 ]);
  });

test('Recorder does not finalize PCM when onStop omits super', async t => {
  const input = capture(t);
  class Unfinished extends sf.SoundBufferRecorder {
    onStop() {}
  }
  const recorder = new Unfinished();
  await recorder.start(8000);
  input.samples([ 10, 20 ]);
  await recorder.stop();
  assert.equal(recorder.getBuffer().getSampleCount(), 0n);
  assert.equal(recorder.getWorkerStats().processed, 2n);
});

test('Recorder stop waits for an in-flight device switch', async t => {
  capture(t);
  const entered = gate();
  const release = gate();
  let switching = false;
  let overlap = false;
  t.mock.method(native, 'audioRecorderDevice', (handle, name, callback) => {
    switching = true;
    entered.resolve();
    void release.promise.then(() => {
      switching = false;
      callback(null, true);
    });
  });
  const stop = native.stopAudioRecorder;
  t.mock.method(native, 'stopAudioRecorder', (...args) => {
    overlap ||= switching;
    return stop(...args);
  });
  class Switching extends sf.SoundBufferRecorder {
    onProcessSamples(samples) { return super.onProcessSamples(samples); }
  }
  const recorder = new Switching();
  await recorder.start(8000);
  const changing = recorder.setDevice('test capture device');
  await until(() => entered.resolved);
  const stopping = recorder.stop();
  await delay(5);
  release.resolve();
  assert.equal(await changing, true);
  await stopping;
  assert.equal(overlap, false, 'Native device operations must not overlap');
});
