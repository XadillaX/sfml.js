'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, rm, readFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { Worker } = require('node:worker_threads');
const { once } = require('node:events');
const sf = require('..');

async function fixture(run) {
  const directory = await mkdtemp(join(tmpdir(), 'sfml-audio-stream-'));
  try {
    const path = join(directory, 'source.wav');
    const samples = Int16Array.from({ length: 4000 }, (_, i) => i - 2000);
    const buffer = new sf.SoundBuffer();
    buffer.loadFromSamples(samples, 1, 8000, [ sf.SoundChannel.Mono ]);
    assert.equal(await buffer.saveToFile(path), true);
    await run({ path, samples });
  } finally { await rm(directory, { recursive: true, force: true }); }
}

test('SoundBuffer decodes an asynchronous InputStream with native read buffers',
  async () => fixture(async ({ path, samples }) => {
    const stream = new sf.FileInputStream();
    assert.equal(await stream.open(path), true);
    try {
      const buffer = new sf.SoundBuffer();
      assert.equal(await buffer.loadFromStream(stream), true);
      assert.deepEqual(buffer.getSamples(), samples);
    } finally { await stream.close(); }
  }));

test('InputSoundFile retains a stream across read, seek and failed reopening',
  async () => fixture(async ({ path, samples }) => {
    const stream = new sf.FileInputStream();
    await stream.open(path);
    const file = new sf.InputSoundFile();
    try {
      assert.equal(await file.openFromStream(stream), true);
      const first = new Int16Array(10);
      assert.equal(await file.read(first), 10n);
      assert.deepEqual(first, samples.subarray(0, 10));
      await file.seek(100n);
      const next = new Int16Array(7);
      assert.equal(await file.read(next), 7n);
      assert.deepEqual(next, samples.subarray(100, 107));
      assert.equal(await file.openFromStream(
        new sf.MemoryInputStream(new Uint8Array([ 1, 2, 3 ]))), false);
      assert.equal(await file.read(next), 7n);
      assert.deepEqual(next, samples.subarray(107, 114));
    } finally {
      await file.close();
      await stream.close();
    }
  }));

test('Concurrent stream decoding leaves libuv workers available for file I/O',
  async () => fixture(async ({ path, samples }) => {
    await Promise.all(Array.from({ length: 8 }, async () => {
      const stream = new sf.FileInputStream();
      await stream.open(path);
      try {
        const buffer = new sf.SoundBuffer();
        assert.equal(await buffer.loadFromStream(stream), true);
        assert.deepEqual(buffer.getSamples(), samples);
      } finally { await stream.close(); }
    }));
  }));

test('Stream callback failures preserve the original thrown value',
  async () => fixture(async ({ path }) => {
    const failure = new Error('audio read rejected');
    const bytes = await readFile(path);
    class BrokenStream extends sf.MemoryInputStream {
      async read() { throw failure; }
    }
    const buffer = new sf.SoundBuffer();
    await assert.rejects(buffer.loadFromStream(new BrokenStream(bytes)),
      error => error === failure);
    const input = new sf.InputSoundFile();
    await assert.rejects(input.openFromStream(new BrokenStream(bytes)),
      error => error === failure);
    await input.close();
  }));

test('Audio decoder cancellation releases outstanding InputStream promises',
  { timeout: 10000 }, async () => {
    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      const sf = require(workerData);
      const stream = {
        read() {
          parentPort.postMessage('waiting');
          return new Promise(() => {});
        },
        seek(position) { return position; },
        tell() { return 0n; },
        getSize() { return 100n; },
      };
      new sf.SoundBuffer().loadFromStream(stream);
    `, { eval: true, workerData: require.resolve('..') });
    try {
      assert.deepEqual(await once(worker, 'message'), [ 'waiting' ]);
    } finally {
      assert.equal(await worker.terminate(), 1);
    }
  });
