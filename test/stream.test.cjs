'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const { mkdtemp, rm, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { Worker } = require('node:worker_threads');
const { once } = require('node:events');
const sf = require('..');

const V = sf.Vector2u;
const rect = (x, y, width, height) => new sf.IntRect(
  new sf.Vector2i(x, y), new sf.Vector2i(width, height));

async function fixture() {
  const image = new sf.Image(new V(3, 2), sf.Color.Red);
  image.setPixel(new V(1, 0), sf.Color.Blue);
  return { image, png: await image.saveToMemory('png') };
}

test('InputStream and MemoryInputStream expose seek, EOF and unopened state',
  () => {
    const stream = new sf.MemoryInputStream();
    assert.ok(stream instanceof sf.InputStream);
    assert.equal(stream.tell(), undefined);
    assert.equal(stream.getSize(), undefined);
    assert.equal(stream.read(new Uint8Array(2)), undefined);
    assert.equal(stream.seek(0n), undefined);
    stream.open(new Uint8Array([ 1, 2, 3 ]));
    const bytes = new Uint8Array(5);
    assert.equal(stream.read(bytes), 3n);
    assert.deepEqual([ ...bytes ], [ 1, 2, 3, 0, 0 ]);
    assert.equal(stream.tell(), 3n);
    assert.equal(stream.getSize(), 3n);
    assert.equal(stream.read(bytes), 0n);
    assert.equal(stream.seek(1n), 1n);
    assert.equal(stream.read(bytes), 2n);
    assert.equal(stream.seek(2n ** 60n), 3n);
    assert.throws(() => stream.seek(-1n), RangeError);
    stream.open(new Uint8Array([ 9 ]));
    assert.equal(stream.tell(), 0n);
  });

test('Image decodes real seekable streams and preserves old pixel views',
  async () => {
    const { image, png } = await fixture();
    const stream = new sf.MemoryInputStream(png);
    stream.seek(10n);
    const loaded = new sf.Image(new V(1, 1), sf.Color.Green);
    const old = loaded.pixels;
    assert.equal(await loaded.loadFromStream(stream), true);
    assert.deepEqual(loaded.pixels, image.pixels);
    assert.deepEqual([ ...old ], [ 0, 255, 0, 255 ]);
    const retained = loaded.pixels;
    assert.equal(await loaded.loadFromStream(
      new sf.MemoryInputStream(new Uint8Array([ 1, 2, 3 ]))), false);
    assert.equal(loaded.pixels, retained);
  });

test('Asynchronous stream callbacks run on JS and keep the loop responsive',
  async () => {
    const { image, png } = await fixture();
    const source = new sf.MemoryInputStream(png);
    const calls = new Set();
    const progress = { ticks: 0 };
    const retained = [];
    const stream = {};
    for (const key of [ 'read', 'seek', 'tell', 'getSize' ]) {
      stream[key] = async argument => {
        calls.add(key);
        await setImmediate();
        progress.ticks++;
        if (key === 'read') retained.push(argument);
        global.gc();
        return source[key](argument);
      };
    }
    const loaded = new sf.Image();
    assert.equal(await loaded.loadFromStream(stream), true);
    assert.ok(progress.ticks > 1);
    assert.ok(calls.has('read'));
    assert.ok(calls.has('seek'));
    assert.deepEqual(loaded.pixels, image.pixels);
    for (const buffer of retained) buffer.fill(0);
    global.gc();
    assert.deepEqual(loaded.pixels, image.pixels);
  });

test('Stream exceptions, rejections, invalid results and I/O failures settle',
  async () => {
    const { png } = await fixture();
    for (const [ result, pattern ] of [
      [ () => { throw new Error('read failed'); }, /read failed/ ],
      [ () => Promise.reject(new Error('async failed')), /async failed/ ],
      [ () => -1n, /bigint.*range/ ],
      [ () => 1, /bigint.*range/ ],
      [ bytes => BigInt(bytes.length + 1), /bigint.*range/ ],
    ]) {
      const stream = new sf.MemoryInputStream(png);
      stream.read = result;
      const image = new sf.Image(new V(1, 1), sf.Color.Blue);
      const old = image.pixels;
      await assert.rejects(image.loadFromStream(stream), pattern);
      assert.equal(image.pixels, old);
    }
    const failed = new sf.MemoryInputStream(png);
    failed.read = () => undefined;
    assert.equal(await new sf.Image().loadFromStream(failed), false);
    await assert.rejects(new sf.Image().loadFromStream({}), TypeError);
  });

test('Stream callbacks preserve the original JS error and its properties',
  async () => {
    const { png } = await fixture();
    const loaders = [
      stream => new sf.Image().loadFromStream(stream),
      stream => new sf.Texture().loadFromStream(stream),
      stream => new sf.Font().openFromStream(stream),
      stream => new sf.Shader().loadFromStream(stream, sf.ShaderType.Fragment),
    ];
    for (const load of loaders) {
      for (const asynchronous of [ false, true ]) {
        const expected = new RangeError('caller stream failure');
        expected.code = 'CALLER_ERROR';
        const stream = new sf.MemoryInputStream(png);
        stream.read = asynchronous ? () => Promise.reject(expected) : () => {
          throw expected;
        };
        await assert.rejects(load(stream), error => {
          assert.strictEqual(error, expected);
          assert.equal(error.code, 'CALLER_ERROR');
          assert.equal(error instanceof sf.SFMLError, false);
          return true;
        });
      }
    }
  });

test('Concurrent stream decoders do not starve asynchronous filesystem reads',
  { timeout: 20000 }, async () => {
    const { image, png } = await fixture();
    const folder = await mkdtemp(join(tmpdir(), 'sfml-stream-'));
    const filename = join(folder, 'image.png');
    await writeFile(filename, png);
    try {
      await Promise.all(Array.from({ length: 8 }, async () => {
        const stream = new sf.FileInputStream();
        try {
          assert.equal(await stream.open(filename), true);
          const loaded = new sf.Image();
          assert.equal(await loaded.loadFromStream(stream), true);
          assert.deepEqual(loaded.pixels, image.pixels);
        } finally {
          await stream.close();
        }
      }));
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });

test('Texture stream loading snapshots cropping and old recorded draws',
  async () => {
    const { png } = await fixture();
    const texture = new sf.Texture(new sf.Image(new V(1, 1), sf.Color.Green));
    const sprite = new sf.Sprite(texture);
    const target = new sf.RenderTexture(new V(2, 1));
    target.clear();
    target.draw(sprite);
    const area = rect(1, 0, 1, 1);
    const pending = texture.loadFromStream(
      new sf.MemoryInputStream(png), true, area);
    area.position.x = 0;
    assert.equal(await pending, true);
    assert.equal(texture.isSrgb(), true);
    sprite.setPosition(new sf.Vector2f(1, 0));
    target.draw(sprite);
    target.display();
    assert.deepEqual([ ...target.getTexture().copyToImage().pixels ],
      [ 0, 255, 0, 255, 0, 0, 255, 255 ]);
    assert.equal(await texture.loadFromStream(
      new sf.MemoryInputStream(new Uint8Array(1))), false);
    assert.deepEqual([ ...texture.copyToImage().pixels ], [ 0, 0, 255, 255 ]);
    const view = target.getTexture();
    await assert.rejects(view.loadFromStream(new sf.MemoryInputStream(png)),
      /Cannot modify/);
  });

test('Worker termination releases a decoder waiting for a stream Promise',
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
      new sf.Image().loadFromStream(stream);
    `, { eval: true, workerData: require.resolve('..') });
    try {
      assert.deepEqual(await once(worker, 'message'), [ 'waiting' ]);
    } finally {
      assert.equal(await worker.terminate(), 1);
    }
  });
