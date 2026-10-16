'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, rm, readFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');

async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'sfml-audio-subclass-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  assert.equal(sf.PlaybackDevice.setDeviceToNull(), true);
  const samples = Int16Array.from({ length: 4096 }, (_, i) => i - 2048);
  const buffer = new sf.SoundBuffer();
  assert.equal(buffer.loadFromSamples(samples, 1, 8000,
    [ sf.SoundChannel.Mono ]), true);
  const filename = join(directory, 'source.wav');
  assert.equal(await buffer.saveToFile(filename), true);
  return { filename, samples, bytes: await readFile(filename) };
}

test('Music subclasses transform decoded PCM through super on their JS thread',
  async t => {
    const { filename, samples, bytes } = await fixture(t);
    const queues = [];
    const open = native.openAudioMusicStream;
    t.mock.method(native, 'openAudioMusicStream', (...args) => {
      const mapping = open(...args);
      queues.push(mapping);
      return mapping;
    });
    class Filtered extends sf.Music {
      #calls = 0;
      #seeks = [];
      get calls() { return this.#calls; }
      get seeks() { return this.#seeks; }
      async onGetData(chunk) {
        const more = await super.onGetData(chunk);
        for (let i = 0; i < chunk.sampleCount; i++) {
          chunk.samples[i] = Math.trunc(chunk.samples[i] / 2);
        }
        this.#calls++;
        return more;
      }
      async onSeek(offset) {
        this.#seeks.push(offset.asMicroseconds());
        await super.onSeek(offset);
      }
    }
    const music = new Filtered();
    t.after(() => music.close());
    for (const load of [
      () => music.openFromFile(filename),
      () => music.openFromMemory(bytes),
      () => music.openFromStream(new sf.MemoryInputStream(bytes)),
    ]) {
      const calls = music.calls;
      assert.equal(await load(), true);
      assert.ok(music.calls > calls, 'Music must invoke the derived onGetData');
      assert.ok(music.seeks.includes(0n), 'Initial seek reaches the subclass');
      assert.equal(music.getDuration().asMicroseconds(), 512000n);
      const result = native.audioQueueProbe(queues.at(-1).handle, 0);
      assert.equal(result.more, true);
      assert.deepEqual(new Int16Array(result.samples),
        samples.subarray(0, 1024).map(value => Math.trunc(value / 2)));
      await music.close();
    }
  });

test('Music without overridden callbacks keeps its direct native path',
  async t => {
    const { filename } = await fixture(t);
    const music = new sf.Music();
    t.after(() => music.close());
    assert.equal(await music.openFromFile(filename), true);
    assert.equal(music.getWorkerStats(), undefined);
  });

test('Music subclass seek and loop defaults preserve loop points',
  async t => {
    const { filename } = await fixture(t);
    class Observed extends sf.Music {
      seeks = [];
      loops = [];
      async onSeek(offset) {
        this.seeks.push(offset.asMicroseconds());
        await super.onSeek(offset);
      }
      async onLoop() {
        const sample = await super.onLoop();
        this.loops.push(sample);
        return sample;
      }
    }
    const music = new Observed();
    t.after(() => music.close());
    assert.equal(await music.openFromFile(filename), true);
    music.setLoopPoints({ offset: sf.milliseconds(128),
      length: sf.milliseconds(128) });
    music.setLooping(true);
    music.play();
    const deadline = Date.now() + 3000;
    while (!music.seeks.includes(128000n)) {
      assert.ok(Date.now() < deadline, 'Music loop did not seek to loop start');
      await delay(2);
    }
    assert.ok(music.loops.includes(1024n));
    music.pause();
    music.setPlayingOffset(sf.milliseconds(384));
    while (!music.seeks.includes(384000n)) {
      assert.ok(Date.now() < deadline, 'Music seek did not reach the callback');
      await delay(2);
    }
    assert.equal(music.getWorkerError(), undefined);
  });

test('Music subclass errors reject open and remain observable through close',
  async t => {
    const { filename } = await fixture(t);
    const failure = new Error('subclass decode failed');
    class Broken extends sf.Music {
      async onGetData() { throw failure; }
    }
    const music = new Broken();
    await assert.rejects(music.openFromFile(filename),
      error => error === failure);
    assert.equal(music.getWorkerError(), failure);
    await assert.rejects(music.close(), error => error === failure);
    await music.close();
  });

test('Music closes a pending callback before allowing a new session',
  async t => {
    const { filename } = await fixture(t);
    let enter;
    let release;
    const entered = new Promise(resolve => { enter = resolve; });
    const released = new Promise(resolve => { release = resolve; });
    class Pending extends sf.Music {
      wait = true;
      async onGetData(chunk) {
        if (this.wait) {
          this.wait = false;
          enter();
          await released;
        }
        return await super.onGetData(chunk);
      }
    }
    const music = new Pending();
    t.after(() => music.close());
    const opening = music.openFromFile(filename);
    await entered;
    let done = false;
    const closing = music.close().then(() => { done = true; });
    await delay(5);
    assert.equal(done, false, 'Close must wait for the delivered callback');
    release();
    assert.equal(await opening, false);
    await closing;
    assert.equal(await music.openFromFile(filename), true);
    assert.equal(music.getWorkerError(), undefined);
  });

test('Music callback can await close without waiting for itself',
  async t => {
    const { filename } = await fixture(t);
    class SelfClosing extends sf.Music {
      completed = false;
      async onGetData(chunk) {
        await this.close();
        this.completed = true;
        chunk.sampleCount = 0;
        return false;
      }
    }
    const music = new SelfClosing();
    t.after(() => music.close());
    assert.equal(await music.openFromFile(filename), false);
    assert.equal(music.completed, true);
    await music.close();
  });

test('Music callback rejects recursive open without deadlocking the session',
  async t => {
    const { filename } = await fixture(t);
    class Recursive extends sf.Music {
      async onGetData(chunk) {
        await assert.rejects(this.openFromFile(filename),
          /Cannot reopen Music inside its callback/);
        return await super.onGetData(chunk);
      }
    }
    const music = new Recursive();
    t.after(() => music.close());
    assert.equal(await music.openFromFile(filename), true);
  });

test('Music callback dispatcher does not retain an idle wrapper',
  async t => {
    const { filename } = await fixture(t);
    class Collectable extends sf.Music {
      onGetData(chunk) { return super.onGetData(chunk); }
    }
    let music = new Collectable();
    assert.equal(await music.openFromFile(filename), true);
    const weak = new WeakRef(music);
    music = null;
    for (let attempt = 0; attempt < 100; attempt++) {
      await delay(2);
      global.gc();
      if (!weak.deref()) return;
    }
    await weak.deref()?.close();
    assert.fail('Idle Music is retained by its callback dispatcher');
  });

test('SoundBufferRecorder exposes overridable default capture callbacks',
  () => {
    for (const name of [ 'onStart', 'onProcessSamples', 'onStop' ]) {
      assert.equal(typeof sf.SoundBufferRecorder.prototype[name], 'function',
        `${name} must be available through super`);
    }
  });
