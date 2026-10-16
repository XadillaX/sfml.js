'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, rm, readFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

const V = sf.Vector2u;
const xy = value => [ value.x, value.y ];
const handle = value => value[graphicsNative];
const read = value => [ ...native.readImagePixels(handle(value)) ];
const rect = (x, y, w, h) =>
  new sf.IntRect(new sf.Vector2i(x, y), new sf.Vector2i(w, h));

function fixture(w = 3, h = 2) {
  const image = new sf.Image(new V(w, h));
  for (let i = 0; i < image.pixels.length; i++) {
    image.pixels[i] = (i * 43 + 17) % 256;
  }
  return image;
}

async function collect(done) {
  for (let i = 0; i < 80; i++) {
    await setImmediate();
    global.gc();
    if (done()) return;
  }
  assert.fail('Image allocation did not reach expected lifetime');
}

test('Image constructors, defaults, deep copies and RGBA byte layout', () => {
  const empty = new sf.Image();
  assert.deepEqual(xy(empty.getSize()), [ 0, 0 ]);
  assert.equal(empty.getPixelsPtr(), undefined);
  assert.equal(empty.pixels.length, 0);
  for (const size of [ new V(0, 9), new V(9, 0) ]) {
    assert.deepEqual(xy(new sf.Image(size).getSize()), [ 0, 0 ]);
  }
  const black = new sf.Image(new V(2, 1));
  assert.deepEqual(read(black), [ 0, 0, 0, 255, 0, 0, 0, 255 ]);
  const source = Buffer.from([ 99, 1, 2, 3, 4, 99 ]).subarray(1, 5);
  const image = new sf.Image(new V(1, 1), source);
  assert.deepEqual(read(image), [ 1, 2, 3, 4 ]);
  assert.equal(native.imageSharesPixels(handle(image), image.pixels), true);
  assert.equal(image.getPixelsPtr(), image.pixels);
  source.fill(0);
  assert.deepEqual(read(image), [ 1, 2, 3, 4 ]);
  const copy = new sf.Image(image);
  copy.pixels[0] = 80;
  assert.equal(image.pixels[0], 1);
  assert.equal(read(copy)[0], 80);
  const size = image.getSize();
  size.x = 100;
  assert.deepEqual(xy(image.getSize()), [ 1, 1 ]);
});

test('Image JS and C++ pixel writes share the exact allocation', t => {
  const image = fixture();
  const coords = new V(1, 1);
  native.setImagePixel(handle(image), 1, 1, 0x12345678);
  assert.equal(image.getPixel(coords).toInteger(), 0x12345678);
  image.setPixel(coords, sf.Color.Red);
  assert.deepEqual(read(image).slice(16, 20), [ 255, 0, 0, 255 ]);
  const color = image.getPixel(coords);
  color.g = 255;
  assert.equal(image.getPixel(coords).g, 0);
  for (const [ name, fn ] of Object.entries(native)) {
    if (typeof fn === 'function') {
      t.mock.method(native, name, () => assert.fail(`Unexpected NAN: ${name}`));
    }
  }
  image.setPixel(coords, sf.Color.Blue);
  assert.equal(image.getPixel(coords).b, 255);
  image.getSize();
  image.pixels[0] = 99;
  image.getPixelsPtr();
});

test('Image resize replaces storage, including equal size and empty images',
  () => {
    const image = fixture();
    const original = image.pixels;
    const before = original.slice();
    const identity = handle(image);
    image.resize(new V(3, 2), sf.Color.Blue);
    assert.equal(handle(image), identity);
    assert.notEqual(image.pixels.buffer, original.buffer);
    assert.deepEqual(original, before);
    original.fill(0);
    assert.equal(image.getPixel(new V()).toInteger(),
      sf.Color.Blue.toInteger());
    const current = image.pixels;
    image.resize(new V(3, 2), current);
    assert.deepEqual(image.pixels, current);
    assert.notEqual(image.pixels.buffer, current.buffer);
    image.resize(new V(0, 9));
    assert.deepEqual(xy(image.getSize()), [ 0, 0 ]);
    assert.equal(image.getPixelsPtr(), undefined);
    assert.equal(current[2], 255);
  });

test('Image bounds and invalid input preserve pixels', async () => {
  const image = fixture();
  const original = image.pixels;
  for (const coords of [ new V(3, 0), new V(0, 2), new V(-1, 0) ]) {
    assert.throws(() => image.getPixel(coords), RangeError);
    assert.throws(() => image.setPixel(coords, sf.Color.Red), RangeError);
  }
  assert.throws(() => image.getPixel(new sf.Vector2i()), TypeError);
  assert.throws(() => new sf.Image('a.png'), TypeError);
  assert.throws(() => new sf.Image(new sf.Vector2f(1, 1)), TypeError);
  assert.throws(() => image.resize(new V(3, 2), new Uint8Array(4)), RangeError);
  assert.throws(() => image.resize(new V(0xffffffff, 0xffffffff)), RangeError);
  assert.throws(() => image.setPixel(new V(), 0), TypeError);
  assert.throws(() => image.copy(
    image, new V(), new sf.FloatRect()), TypeError);
  const detached = new Uint8Array(4);
  structuredClone(detached.buffer, { transfer: [ detached.buffer ] });
  assert.throws(() => image.resize(new V(1, 1), detached), TypeError);
  await assert.rejects(image.loadFromMemory(detached), TypeError);
  await assert.rejects(image.loadFromMemory(
    new Uint8Array(new SharedArrayBuffer(4))), TypeError);
  if (typeof ArrayBuffer.prototype.resize === 'function') {
    await assert.rejects(image.loadFromMemory(
      new Uint8Array(new ArrayBuffer(4, { maxByteLength: 8 }))), TypeError);
  }
  await assert.rejects(image.loadFromFile(42), TypeError);
  await assert.rejects(image.saveToFile('bad\0.png'), TypeError);
  await assert.rejects(image.saveToMemory(null), TypeError);
  assert.equal(image.pixels, original);
  for (const method of [ 'loadFromFile', 'loadFromMemory',
    'saveToFile', 'saveToMemory' ]) {
    assert.equal(image[`${method}Sync`], undefined);
    assert.equal(image[`${method}Async`], undefined);
  }
});

test('Image flips and exact RGBA color mask preserve the shared view', () => {
  const image = fixture(3, 3);
  const pixels = image.pixels;
  const before = [ ...pixels ];
  image.flipHorizontally();
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const from = (y * 3 + (2 - x)) * 4;
      const to = (y * 3 + x) * 4;
      assert.deepEqual(read(image).slice(to, to + 4),
        before.slice(from, from + 4));
    }
  }
  image.flipHorizontally();
  image.flipVertically();
  assert.deepEqual(read(image), [
    ...before.slice(24), ...before.slice(12, 24), ...before.slice(0, 12),
  ]);
  image.flipVertically();
  assert.deepEqual(read(image), before);
  image.setPixel(new V(0, 0), sf.Color.Red);
  image.setPixel(new V(1, 0), new sf.Color(255, 0, 0, 254));
  image.createMaskFromColor(sf.Color.Red, 300);
  assert.equal(image.getPixel(new V(0, 0)).a, 44);
  assert.equal(image.getPixel(new V(1, 0)).a, 254);
  image.createMaskFromColor(new sf.Color(255, 0, 0, 44));
  assert.equal(image.getPixel(new V(0, 0)).a, 0);
  assert.equal(image.pixels, pixels);
  const empty = new sf.Image();
  empty.flipHorizontally();
  empty.flipVertically();
  empty.createMaskFromColor(sf.Color.Red);
});

test('Image copy rectangles, clipping, failure atomicity and self-overlap',
  () => {
    const source = fixture(3, 2);
    const dest = new sf.Image(new V(2, 2));
    assert.equal(dest.copy(source, new V(1, 1)), true);
    assert.equal(dest.getPixel(new V(1, 1)).toInteger(),
      source.getPixel(new V()).toInteger());
    assert.equal(dest.copy(source, new V(), rect(1, 0, 2, 2)), true);
    assert.deepEqual(read(dest), [
      ...read(source).slice(4, 12), ...read(source).slice(16, 24),
    ]);
    for (const invalid of [
      rect(-1, 0, 1, 1), rect(0, 0, -1, 1), rect(3, 0, 1, 1),
      rect(1, 1, 3, 2),
    ]) {
      const before = dest.pixels.slice();
      assert.equal(dest.copy(source, new V(), invalid), false);
      assert.deepEqual(dest.pixels, before);
    }
    assert.equal(dest.copy(source, new V(2, 0)), false);
    assert.equal(dest.copy(new sf.Image(), new V()), false);
    const self = fixture(4, 3);
    const expected = new sf.Image(self);
    assert.equal(expected.copy(new sf.Image(self), new V(1, 1)), true);
    assert.equal(self.copy(self, new V(1, 1)), true);
    assert.deepEqual(self.pixels, expected.pixels);
  });

test('Image copy alpha matches SFML integer over, including alpha zero', () => {
  for (const sa of [ 0, 1, 64, 128, 254, 255 ]) {
    for (const da of [ 0, 1, 127, 255 ]) {
      const source = new sf.Image(new V(1, 1), new sf.Color(20, 130, 240, sa));
      const dest = new sf.Image(new V(1, 1), new sf.Color(210, 80, 10, da));
      assert.equal(dest.copy(source, new V(), undefined, true), true);
      const alpha = sa + da - Math.floor(sa * da / 255);
      const expected = alpha === 0 ? [ 20, 130, 240, 0 ] :
        [ 20, 130, 240 ].map((c, i) => Math.floor(
          (c * sa + [ 210, 80, 10 ][i] * (alpha - sa)) / alpha))
          .concat(alpha);
      assert.deepEqual(read(dest), expected);
    }
  }
});

for (const format of [ 'png', 'bmp', 'tga', 'jpg', 'jpeg', 'qoi' ]) {
  test(`Image async ${format} codec roundtrip and zero-copy decoded mapping`,
    async () => {
      const image = new sf.Image(new V(8, 8), new sf.Color(80, 140, 200));
      const saving = image.saveToMemory(format);
      assert.ok(saving instanceof Promise);
      const encoded = await saving;
      assert.ok(encoded instanceof Uint8Array && encoded.length > 0);
      const loaded = new sf.Image();
      assert.equal(await loaded.loadFromMemory(encoded), true);
      assert.deepEqual(xy(loaded.getSize()), [ 8, 8 ]);
      if (format !== 'jpg' && format !== 'jpeg') {
        assert.deepEqual(loaded.pixels, image.pixels);
      } else {
        assert.ok(Math.abs(loaded.pixels[0] - 80) <= 3);
        assert.equal(loaded.pixels[3], 255);
      }
      assert.equal(native.imageSharesPixels(
        handle(loaded), loaded.pixels), true);
    });
}

test('Image concurrent loads commit in completion order with stable handles',
  async () => {
    const first = fixture(3, 2);
    const second = fixture(2, 3);
    const bytes = await Promise.all([
      first.saveToMemory('png'), second.saveToMemory('png'),
    ]);
    const image = new sf.Image();
    const identity = handle(image);
    const completed = [];
    const requests = bytes.map((input, i) => image.loadFromMemory(input)
      .then(ok => {
        assert.equal(ok, true);
        completed.push(i);
        assert.deepEqual(image.pixels, [ first, second ][i].pixels);
        assert.deepEqual(xy(image.getSize()), i === 0 ? [ 3, 2 ] : [ 2, 3 ]);
        assert.equal(native.imageSharesPixels(
          handle(image), image.pixels), true);
      }));
    // Pending loads do not block synchronous pixel operations or resize.
    image.resize(new V(1, 1), sf.Color.Blue);
    const interim = image.pixels;
    await Promise.all(requests);
    assert.equal(handle(image), identity);
    assert.deepEqual(image.pixels, [ first, second ][completed[1]].pixels);
    assert.deepEqual([ ...interim ], [ 0, 0, 255, 255 ]);
  });

test('Image codec snapshots survive immediate edits, detach, resize and GC',
  async () => {
    const image = fixture(32, 32);
    const expected = image.pixels.slice();
    const saving = image.saveToMemory('png');
    image.pixels.fill(0);
    image.resize(new V(1, 1));
    const encoded = await saving;
    const envelope = new Uint8Array(encoded.length + 8);
    envelope.set(encoded, 4);
    const input = envelope.subarray(4, 4 + encoded.length);
    const old = image.pixels;
    const loading = image.loadFromMemory(input);
    input.fill(0);
    structuredClone(envelope.buffer, { transfer: [ envelope.buffer ] });
    global.gc();
    assert.equal(await loading, true);
    assert.deepEqual(image.pixels, expected);
    assert.deepEqual([ ...old ], [ 0, 0, 0, 255 ]);
    assert.equal(native.imageSharesPixels(handle(image), image.pixels), true);
    await collect(() => true);
    assert.ok(encoded.length > 0);
  });

test('Image file IO accepts Unicode paths and failures preserve current view',
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sfml-image-'));
    try {
      const image = fixture();
      const path = join(directory, '像素 🦊.png');
      const before = image.pixels.slice();
      const saving = image.saveToFile(path);
      image.pixels.fill(0);
      assert.equal(await saving, true);
      const input = await readFile(path);
      const loaded = new sf.Image();
      assert.equal(await loaded.loadFromFile(path), true);
      assert.deepEqual(loaded.pixels, before);
      const current = loaded.pixels;
      assert.equal(await loaded.loadFromFile(
        join(directory, 'missing')), false);
      assert.equal(await loaded.loadFromMemory(input.subarray(0, 4)), false);
      assert.equal(await loaded.loadFromMemory(new Uint8Array()), false);
      assert.equal(loaded.pixels, current);
      assert.equal(await loaded.saveToMemory('unsupported'), undefined);
      assert.equal(await loaded.saveToFile(
        join(directory, 'missing', 'image.png')), false);
      assert.equal(await new sf.Image().saveToMemory('png'), undefined);
      assert.equal(await new sf.Image().saveToFile(path), false);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

test('Image old pixel buffers retain only their allocation through GC',
  async () => {
    let image = fixture();
    let pixels = image.pixels;
    const old = native.observeImage(handle(image));
    const expected = pixels.slice();
    image.resize(new V(2, 2), sf.Color.Blue);
    const current = native.observeImage(handle(image));
    const wrapper = new WeakRef(image);
    image = null;
    await collect(() => wrapper.deref() === undefined &&
      native.imageExpired(current));
    assert.equal(native.imageExpired(old), false);
    assert.deepEqual(pixels, expected);
    pixels[0] = 91;
    assert.equal(pixels[0], 91);
    pixels = null;
    await collect(() => native.imageExpired(old));
  });

test('Image load retires old allocation and async owners eventually release',
  async () => {
    let image = fixture();
    let oldPixels = image.pixels;
    const old = native.observeImage(handle(image));
    const bytes = await new sf.Image(
      new V(1, 1), sf.Color.Blue).saveToMemory('png');
    assert.equal(await image.loadFromMemory(bytes), true);
    assert.equal(native.imageExpired(old), false);
    oldPixels[0] = 10;
    assert.equal(image.pixels[0], 0);
    oldPixels = null;
    await collect(() => native.imageExpired(old));
    const current = native.observeImage(handle(image));
    const saving = image.saveToMemory('png');
    image = null;
    let encoded = await saving;
    await collect(() => native.imageExpired(current));
    // An encoded subview must keep the returned vector alive on its own.
    const retained = encoded.subarray();
    encoded = null;
    global.gc();
    const loaded = new sf.Image();
    assert.equal(await loaded.loadFromMemory(retained), true);
    assert.deepEqual([ ...loaded.pixels ], [ 0, 0, 255, 255 ]);
  });

test('Image async encoding lets event-loop callbacks run while work is pending',
  async () => {
    const image = fixture(1024, 1024);
    let ticks = 0;
    const timer = setInterval(() => ticks++, 1);
    try {
      await Promise.all(Array.from({ length: 4 },
        () => image.saveToMemory('png')));
    } finally {
      clearInterval(timer);
    }
    assert.ok(ticks > 0, 'Encoding must run outside the JS event loop');
  });

test('Image shared pixels upload and render through the real Texture path',
  async () => {
    const image = new sf.Image(new V(2, 1), sf.Color.Red);
    image.setPixel(new V(1, 0), sf.Color.Blue);
    const loaded = new sf.Image();
    assert.equal(await loaded.loadFromMemory(
      await image.saveToMemory('png')), true);
    const texture = new sf.Texture(loaded.getSize());
    texture.update(loaded.pixels);
    const target = new sf.RenderTexture(loaded.getSize());
    target.clear();
    target.draw(new sf.Sprite(texture));
    target.display();
    assert.deepEqual([ ...native.readRenderTexturePixels(handle(target)) ],
      [ ...image.pixels ]);
  });
