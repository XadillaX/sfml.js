'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setTimeout: delay } = require('node:timers/promises');
const sf = require('..');

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function wav() {
  const bytes = Buffer.alloc(44 + 4096 * 2);
  bytes.write('RIFF', 0);
  bytes.writeUInt32LE(bytes.length - 8, 4);
  bytes.write('WAVEfmt ', 8);
  bytes.writeUInt32LE(16, 16);
  bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22);
  bytes.writeUInt32LE(44100, 24);
  bytes.writeUInt32LE(88200, 28);
  bytes.writeUInt16LE(2, 32);
  bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36);
  bytes.writeUInt32LE(bytes.length - 44, 40);
  for (let i = 0; i < 4096; i++) bytes.writeInt16LE(i, 44 + i * 2);
  assert.equal(sf.PlaybackDevice.setDeviceToNull(), true);
  return bytes;
}

test('Music cancels opening before delivering a new callback', async t => {
  const bytes = wav();
  let calls = 0;
  class Observed extends sf.Music {
    async onGetData(chunk) {
      calls++;
      return await super.onGetData(chunk);
    }
  }
  const music = new Observed();
  t.after(() => music.close());
  const opening = music.openFromMemory(bytes);
  const closing = music.close();
  assert.equal(await opening, false);
  await closing;
  assert.equal(calls, 0);
  assert.equal(await music.openFromMemory(bytes), true);
});

test('Music cancels after asynchronous input opens but before callbacks',
  async t => {
    const input = new sf.MemoryInputStream(wav());
    const entered = deferred();
    const released = deferred();
    let first = true;
    let calls = 0;
    class Observed extends sf.Music {
      async onGetData(chunk) {
        calls++;
        return await super.onGetData(chunk);
      }
    }
    const stream = {
      async read(bytes) {
        if (first) {
          first = false;
          entered.resolve();
          await released.promise;
        }
        return input.read(bytes);
      },
      seek: offset => input.seek(offset),
      tell: () => input.tell(),
      getSize: () => input.getSize(),
    };
    const music = new Observed();
    t.after(() => music.close());
    const opening = music.openFromStream(stream);
    await entered.promise;
    const closing = music.close();
    released.resolve();
    assert.equal(await opening, false);
    await closing;
    assert.equal(calls, 0);
  });

test('Music reports user callback failures even while closing', async () => {
  const bytes = wav();
  const entered = deferred();
  const released = deferred();
  const failure = new Error('callback rejection after cancellation');
  class Broken extends sf.Music {
    async onGetData() {
      entered.resolve();
      await released.promise;
      throw failure;
    }
  }
  const music = new Broken();
  const opening = assert.rejects(music.openFromMemory(bytes),
    error => error === failure);
  await entered.promise;
  const closing = assert.rejects(music.close(), error => error === failure);
  released.resolve();
  await Promise.all([ opening, closing ]);
  await music.close();
});

test('Music keeps exact sample loop targets and independent explicit seeks',
  async t => {
    class Observed extends sf.Music {
      sought;
      blocks = [];
      async onSeek(offset) {
        await super.onSeek(offset);
        this.sought = offset.asMicroseconds();
      }
      async onGetData(chunk) {
        const more = await super.onGetData(chunk);
        if (this.sought !== undefined) {
          this.blocks.push({ time: this.sought, sample: chunk.samples[0] });
          this.sought = undefined;
        }
        return more;
      }
    }
    const music = new Observed();
    t.after(() => music.close());
    assert.equal(await music.openFromMemory(wav()), true);
    music.setLoopPoints({ offset: sf.microseconds(23220n),
      length: sf.microseconds(23220n) });
    music.setLooping(true);
    music.play();
    const deadline = Date.now() + 3000;
    while (!music.blocks.some(block => block.time === 23219n)) {
      assert.ok(Date.now() < deadline, 'Loop did not seek');
      await delay(2);
    }
    music.pause();
    assert.equal(music.blocks.find(block => block.time === 23219n).sample,
      1024);
    music.setPlayingOffset(sf.microseconds(60000n));
    while (!music.blocks.some(block => block.time === 60000n)) {
      assert.ok(Date.now() < deadline, 'Explicit seek did not arrive');
      await delay(2);
    }
    assert.equal(music.blocks.find(block => block.time === 60000n).sample,
      2646);
    assert.equal(music.getWorkerError(), undefined);
  });

for (const phase of [ 'read', 'seek' ]) {
  test(`Music preserves decoder ${phase} errors during close`, async t => {
    const entered = deferred();
    const released = deferred();
    const failure = new Error(`${phase} is not a cancellation`);
    class Reader extends sf.SoundFileReader {
      static check() { return true; }
      open() {
        return new sf.SoundFileReader.Info({ sampleCount: 4096n,
          sampleRate: 44100, channelCount: 1,
          channelMap: [ sf.SoundChannel.Mono ] });
      }
      async read(samples) {
        if (phase === 'read') {
          entered.resolve();
          await released.promise;
          throw failure;
        }
        samples.fill(1);
        return BigInt(samples.length);
      }
      async seek() {
        if (phase === 'seek') {
          entered.resolve();
          await released.promise;
          throw failure;
        }
      }
      close() {}
    }
    class Observed extends sf.Music {
      onGetData(chunk) { return super.onGetData(chunk); }
    }
    sf.SoundFileFactory.registerReader(Reader);
    t.after(() => sf.SoundFileFactory.unregisterReader(Reader));
    const music = new Observed();
    t.after(() => music.close());
    const opening = music.openFromMemory(Buffer.from('custom')).then(
      value => ({ value }), error => ({ error }));
    await entered.promise;
    const closing = music.close().then(
      () => ({}), error => ({ error }));
    released.resolve();
    assert.equal((await opening).error, failure);
    assert.equal((await closing).error, failure);
  });
}

test('Music treats native InputStream cancellation as a normal close',
  { timeout: 5000 }, async t => {
    const entered = deferred();
    const released = deferred();
    let armed = false;
    class Stream extends sf.MemoryInputStream {
      async seek(offset) {
        if (armed) {
          entered.resolve();
          await released.promise;
        }
        return super.seek(offset);
      }
    }
    class Observed extends sf.Music {
      async onSeek() {
        armed = true;
        await super.onSeek(sf.microseconds(40000n));
      }
    }
    const music = new Observed();
    t.after(() => music.close());
    const opening = music.openFromStream(new Stream(wav()));
    await entered.promise;
    try {
      const closing = music.close();
      assert.equal(await opening, false);
      await closing;
    } finally { released.resolve(); }
  });
