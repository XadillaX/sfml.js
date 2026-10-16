'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { join } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { spawnSync } = require('node:child_process');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { AudioWorkerSession } =
  require('../dist/internal/audio-worker-session');
const { audioHandle } = require('../dist/internal/audio-native');
const modulePath = join(__dirname, 'fixtures/audio-worker.cjs');

async function until(check) {
  const deadline = Date.now() + 3000;
  while (!check()) {
    assert.ok(Date.now() < deadline, 'audio worker did not make progress');
    await delay(2);
  }
}

function queue(kind, data = {}, slots = 8) {
  const mode = { stream: 0, recorder: 1, effect: 2 }[kind];
  const mapping = native.createAudioQueueProbe(mode, 64, 1, 8000, slots);
  const session = new AudioWorkerSession(mapping.handle, mapping.token,
    kind, { module: modulePath, data },
    { sampleRate: 8000, channelCount: 1, blockFrames: 64 });
  return { ...mapping, session };
}

test('Stream Worker fills native PCM, EOF and seek discard old generations',
  async () => {
    const events = new SharedArrayBuffer(32);
    const counters = new Int32Array(events);
    const stream = queue('stream', { samples: 400, events });
    try {
      assert.equal(await stream.session.ready, true);
      await until(() => Atomics.load(counters, 0) === 7);
      let result = native.audioQueueProbe(stream.handle, 0);
      assert.equal(result.more, true);
      assert.deepEqual(new Int16Array(result.samples),
        Int16Array.from({ length: 64 }, (_, i) => i));
      native.audioQueueProbe(stream.handle, 3, 25000n);
      await until(() => Atomics.load(counters, 2) === 200);
      await until(() => {
        result = native.audioQueueProbe(stream.handle, 0);
        return new Int16Array(result.samples)[0] === 200;
      });
      assert.equal(new Int16Array(result.samples)[0], 200);
      await until(() => Atomics.load(counters, 0) === 11);
      result = native.audioQueueProbe(stream.handle, 0);
      assert.equal(new Int16Array(result.samples)[0], 264);
      result = native.audioQueueProbe(stream.handle, 0);
      assert.equal(new Int16Array(result.samples)[0], 328);
      result = native.audioQueueProbe(stream.handle, 0);
      assert.equal(result.more, false);
      assert.equal(new Int16Array(result.samples).length, 8);
    } finally { await stream.session.close(); }
  });

test('Capture Worker consumes native slots and drains before onStop',
  async () => {
    const events = new SharedArrayBuffer(32);
    const counters = new Int32Array(events);
    const recorder = queue('recorder', { events });
    try {
      await recorder.session.ready;
      const samples = Int16Array.from({ length: 129 }, (_, i) => i + 11);
      native.audioQueueProbe(recorder.handle, 1, samples);
      native.audioQueueProbe(recorder.handle, 4);
      await recorder.session.drain();
      assert.equal(Atomics.load(counters, 3), 1);
      assert.equal(Atomics.load(counters, 4), 129);
      assert.equal(Atomics.load(counters, 5), 139);
      assert.equal(Atomics.load(counters, 6), 1);
      assert.equal(recorder.session.getStats().processed, 129n);
    } finally { await recorder.session.close(); }
  });

test('Effect Worker processes native float slots with partial consumption',
  async () => {
    const effect = queue('effect', { gain: 0.25, partial: 17 });
    try {
      await effect.session.ready;
      const input = Float32Array.from({ length: 64 }, (_, i) => i / 64);
      let result = native.audioQueueProbe(effect.handle, 2, input, 64, 1);
      assert.equal(result.inputFrames, 64);
      assert.deepEqual(new Float32Array(result.samples), new Float32Array(64));
      await until(() => effect.session.getStats().processed === 64n);
      result = native.audioQueueProbe(effect.handle, 2, null, 64, 1);
      assert.deepEqual(new Float32Array(result.samples), input.map(x => x / 4));
      await delay(15);
      result = native.audioQueueProbe(effect.handle, 2, null, 64, 1);
      assert.equal(result.outputFrames, 0);
    } finally { await effect.session.close(); }
  });

test('SoundStream plays, pauses, loops and exposes the SFML stream metadata',
  async () => {
    assert.equal(sf.PlaybackDevice.setDeviceToNull(), true);
    const stream = new sf.SoundStream({
      module: modulePath, data: { samples: 8000 },
      sampleRate: 8000, channelCount: 1, channelMap: [ sf.SoundChannel.Mono ],
      blockFrames: 128,
    });
    try {
      await stream.ready;
      assert.equal(stream.getSampleRate(), 8000);
      assert.equal(stream.getChannelCount(), 1);
      stream.setLooping(true);
      stream.play();
      await delay(60);
      assert.equal(stream.getStatus(), sf.SoundStatus.Playing);
      stream.pause();
      assert.equal(stream.getStatus(), sf.SoundStatus.Paused);
      stream.setPlayingOffset(sf.milliseconds(200));
      stream.play();
      await delay(40);
      assert.ok(stream.getWorkerStats().processed > 0n);
      stream.stop();
      assert.equal(stream.getStatus(), sf.SoundStatus.Stopped);
      assert.ok(new sf.Music() instanceof sf.SoundStream);
    } finally { await stream.close(); }
  });

test('Worker exceptions reject readiness and remain observable', async () => {
  const stream = new sf.SoundStream({
    module: modulePath, data: { fail: true },
    sampleRate: 8000, channelCount: 1, channelMap: [ sf.SoundChannel.Mono ],
  });
  await assert.rejects(stream.ready, /worker fixture failed/);
  assert.match(stream.getWorkerError().message, /worker fixture failed/);
  await assert.rejects(stream.close(), /worker fixture failed/);
});

test('SoundStream loops across EOF and stops after looping is disabled',
  async () => {
    const events = new SharedArrayBuffer(32);
    const counters = new Int32Array(events);
    const stream = new sf.SoundStream({
      module: modulePath, data: { samples: 400, events },
      sampleRate: 8000, channelCount: 1, channelMap: [ sf.SoundChannel.Mono ],
      blockFrames: 64,
    });
    try {
      await stream.ready;
      stream.setLooping(true);
      stream.play();
      await until(() => Atomics.load(counters, 1) >= 3);
      assert.equal(stream.getStatus(), sf.SoundStatus.Playing);
      assert.ok(stream.getWorkerStats().processed >= 800n);
      stream.setLooping(false);
      await until(() => stream.getStatus() === sf.SoundStatus.Stopped);
    } finally { await stream.close(); }
  });

test('Effect attachment preserves playback and rejects concurrent sharing',
  async () => {
    const buffer = new sf.SoundBuffer();
    buffer.loadFromSamples(new Int16Array(8000), 1, 8000,
      [ sf.SoundChannel.Mono ]);
    const sound = new sf.Sound(buffer);
    const other = new sf.Sound(buffer);
    const effect = new sf.EffectProcessor({ module: modulePath });
    await effect.ready;
    try {
      sound.setLooping(true);
      sound.play();
      sound.setEffectProcessor(effect);
      assert.equal(sound.getStatus(), sf.SoundStatus.Playing);
      assert.throws(() => other.setEffectProcessor(effect), /one source/);
      await delay(35);
      assert.ok(effect.getWorkerStats().processed > 0n);
      const copy = new sf.Sound(sound);
      sound.stop();
      sound.setEffectProcessor();
      await delay(30);
      const processed = effect.getWorkerStats().processed;
      copy.play();
      await delay(50);
      copy.stop();
      assert.equal(effect.getWorkerStats().processed, processed,
        'A copied Sound must not share the original effect queue');
      sound.setEffectProcessor(effect);
      sound.play();
      sound.setEffectProcessor();
      assert.equal(sound.getStatus(), sf.SoundStatus.Playing);
      other.setEffectProcessor(effect);
      other.setEffectProcessor();
    } finally {
      sound.stop();
      other.stop();
      await effect.close();
    }
  });

test('Native capture queue counts overflow and retained mappings survive close',
  () => {
    const state = native.createAudioQueueProbe(1, 64, 1, 8000, 2);
    const mapping = native.attachAudioWorker(state.token);
    assert.throws(() => native.attachAudioWorker(state.token), /already used/);
    native.audioQueueProbe(state.handle, 1, new Int16Array(192).fill(17));
    const stats = new BigUint64Array(native.audioWorkerStats(state.handle));
    assert.equal(stats[1], 64n);
    assert.equal(native.pollAudioWorker(mapping.handle), 0);
    assert.equal(new Int16Array(mapping.input[0])[0], 17);
    native.commitAudioWorker(mapping.handle, true);
    native.closeAudioWorker(state.handle);
    assert.equal(native.pollAudioWorker(mapping.handle), -3);
    global.gc();
    assert.equal(new Int16Array(mapping.input[0])[0], 17);
    assert.equal(typeof sf.SoundBufferRecorder.isAvailable(), 'boolean');
    const recorder = new sf.SoundBufferRecorder();
    assert.equal(recorder.getBuffer().getSampleCount(), 0n);
    assert.equal(recorder.getChannelCount(), 1);
    recorder.setChannelCount(2);
    assert.deepEqual([ ...recorder.getChannelMap() ],
      [ sf.SoundChannel.FrontLeft, sf.SoundChannel.FrontRight ]);
    assert.ok(recorder[audioHandle]);
  });

test('Playing Audio workers release resources on process exit', () => {
  const result = spawnSync(process.execPath, [ '-e', `
    const sf = require(${JSON.stringify(require.resolve('..'))});
    sf.PlaybackDevice.setDeviceToNull();
    const source = new sf.SoundStream({
      module: ${JSON.stringify(modulePath)},
      sampleRate: 8000, channelCount: 1, channelMap: [sf.SoundChannel.Mono],
    });
    source.ready.then(() => {
      source.setLooping(true);
      source.play();
    });
  ` ], { encoding: 'utf8', timeout: 5000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});
