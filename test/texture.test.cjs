'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join, relative } = require('node:path');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { nativeStruct } = require('../dist/internal/struct-view');
const {
  graphicsNative, textureId,
} = require('../dist/internal/graphics-state');

const V = sf.Vector2u;
const handle = value => value[graphicsNative];
const xy = value => [ value.x, value.y ];
const bytes = mapping => [ ...new Uint8Array(mapping.buffer) ];
const read = texture => bytes(native.readTexturePixels(handle(texture)));
const flags = texture =>
  [ texture.isSmooth(), texture.isRepeated(), texture.isSrgb() ];
const rect = (x, y, w, h) =>
  new sf.IntRect(new sf.Vector2i(x, y), new sf.Vector2i(w, h));
const red = [ 255, 0, 0, 255 ];
const blue = [ 0, 0, 255, 255 ];
const green = [ 0, 255, 0, 255 ];

function fixture(w = 3, h = 2) {
  const image = new sf.Image(new V(w, h));
  for (let i = 0; i < image.pixels.length; i++) {
    image.pixels[i] = i % 4 === 3 ? 255 : (i * 43 + 17) % 256;
  }
  return image;
}

function loaded(image = fixture()) {
  const texture = new sf.Texture();
  assert.equal(texture.loadFromImage(image), true);
  return texture;
}

function row(target, y) {
  const width = target.getSize().x;
  const pixels = native.readRenderTexturePixels(handle(target));
  return [ ...pixels.subarray(y * width * 4, (y + 1) * width * 4) ];
}

function quad(width = 8, edge = 2) {
  const array = new sf.VertexArray(sf.PrimitiveType.TriangleStrip, 4);
  for (const [ i, x, y, u, v ] of [
    [ 0, 0, 0, 0, 0 ], [ 1, width, 0, edge, 0 ],
    [ 2, 0, 1, 0, 1 ], [ 3, width, 1, edge, 1 ],
  ]) {
    array.getVertex(i).position = new sf.Vector2f(x, y);
    array.getVertex(i).texCoords = new sf.Vector2f(u, v);
  }
  return array;
}

test('Texture empty construction, native metadata and value-size results',
  () => {
    const texture = new sf.Texture();
    assert.deepEqual(xy(texture.getSize()), [ 0, 0 ]);
    assert.deepEqual(read(texture), []);
    assert.equal(texture.isSmooth(), false);
    assert.equal(texture.isRepeated(), false);
    assert.equal(texture.isSrgb(), false);
    texture.setSmooth(true);
    texture.setRepeated(true);
    assert.equal(texture.loadFromImage(fixture()), true);
    assert.deepEqual(native.readTextureFlags(handle(texture)),
      [ true, true, false ]);
    const size = texture.getSize();
    size.x = 90;
    assert.deepEqual(xy(texture.getSize()), [ 3, 2 ]);
    const srgb = new sf.Texture(new V(2, 2), true);
    assert.equal(srgb.isSrgb(), native.readTextureFlags(handle(srgb))[2]);
    assert.throws(() => new sf.Texture(new V(0, 1)), RangeError);
    assert.throws(() => new sf.Texture(new sf.Vector2f(1, 1)), TypeError);
    assert.throws(() => new sf.Texture(new V(1, 1), 1), TypeError);
  });

test('Texture image loading, cropping and SFML edge clamping match native',
  () => {
    const image = fixture(4, 3);
    const texture = loaded(image);
    for (const area of [
      [ 0, 0, 0, 0 ], [ 2, 1, 0, 1 ], [ 1, 1, 2, 1 ],
      [ -1, -1, 2, 2 ], [ 3, 2, 90, 90 ], [ -5, -5, 90, 90 ],
    ]) {
      assert.equal(texture.loadFromImage(image, false, rect(...area)), true);
      const expected = native.loadTextureAreaOracle(handle(image), ...area);
      const size = nativeStruct(expected.info);
      assert.deepEqual(xy(texture.getSize()),
        [ size.width, size.height ]);
      assert.deepEqual(read(texture), bytes(expected));
    }
    assert.equal(texture.loadFromImage(image, true), true);
    assert.equal(texture.isSrgb(), native.readTextureFlags(handle(texture))[2]);
    assert.equal(texture.loadFromImage(image), true);
    assert.equal(texture.isSrgb(), false);
    const before = read(texture);
    assert.equal(texture.loadFromImage(new sf.Image()), false);
    for (const area of [
      [ 0, 0, -1, 2 ], [ 0, 0, 2, -1 ], [ 4, 0, 1, 1 ], [ 0, 3, 1, 1 ],
    ]) {
      assert.throws(
        () => texture.loadFromImage(image, false, rect(...area)), RangeError);
    }
    assert.deepEqual(read(texture), before);
  });

for (const format of [ 'png', 'bmp', 'tga', 'jpg', 'jpeg', 'qoi' ]) {
  test(`Texture async ${format} load preserves decoded pixels`, async () => {
    const image = new sf.Image(new V(8, 8), new sf.Color(80, 140, 200));
    const encoded = await image.saveToMemory(format);
    const texture = new sf.Texture();
    const result = texture.loadFromMemory(encoded);
    assert.ok(result instanceof Promise);
    assert.deepEqual(xy(texture.getSize()), [ 0, 0 ]);
    assert.equal(await result, true);
    assert.deepEqual(xy(texture.getSize()), [ 8, 8 ]);
    if (format === 'jpg' || format === 'jpeg') {
      const decoded = new sf.Image();
      assert.equal(await decoded.loadFromMemory(encoded), true);
      assert.deepEqual(read(texture), [ ...decoded.pixels ]);
    } else {
      assert.deepEqual(read(texture), [ ...image.pixels ]);
    }
  });
}

test('Texture async input and crop snapshots survive mutation, detach and GC',
  async () => {
    const image = fixture(4, 3);
    const encoded = await image.saveToMemory('png');
    const envelope = new Uint8Array(encoded.length + 8);
    envelope.set(encoded, 4);
    const input = envelope.subarray(4, 4 + encoded.length);
    const area = rect(1, 1, 2, 2);
    const expected = bytes(native.loadTextureAreaOracle(
      handle(image), 1, 1, 2, 2));
    const texture = new sf.Texture();
    const loading = texture.loadFromMemory(input, false, area);
    input.fill(0);
    area.position.x = 100;
    area.size.y = -9;
    structuredClone(envelope.buffer, { transfer: [ envelope.buffer ] });
    global.gc();
    assert.equal(await loading, true);
    assert.deepEqual(xy(texture.getSize()), [ 2, 2 ]);
    assert.deepEqual(read(texture), expected);
  });

test('Texture async file loads capture relative Unicode paths and crop',
  async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sfml-texture-'));
    const originalCwd = process.cwd();
    try {
      const image = fixture(4, 3);
      const path = join(directory, '纹理 🦊.png');
      assert.equal(await image.saveToFile(path), true);
      const texture = new sf.Texture();
      const loading = texture.loadFromFile(
        relative(originalCwd, path), false, rect(1, 1, 2, 2));
      process.chdir(directory);
      assert.equal(await loading, true);
      assert.deepEqual(read(texture), bytes(native.loadTextureAreaOracle(
        handle(image), 1, 1, 2, 2)));
      const before = read(texture);
      assert.equal(await texture.loadFromFile(
        join(directory, 'missing')), false);
      assert.equal(await texture.loadFromMemory(new Uint8Array()), false);
      assert.equal(await texture.loadFromMemory(
        new Uint8Array([ 1, 2, 3 ])), false);
      assert.deepEqual(read(texture), before);
      assert.deepEqual(xy(texture.getSize()), [ 2, 2 ]);
    } finally {
      process.chdir(originalCwd);
      await rm(directory, { recursive: true, force: true });
    }
  });

test('Texture concurrent loads commit in completion order with stable IDs',
  async () => {
    const images = [ fixture(3, 2), fixture(2, 3) ];
    const inputs = await Promise.all(images.map(image =>
      image.saveToMemory('png')));
    const texture = loaded();
    const identity = handle(texture);
    const id = texture[textureId];
    const completed = [];
    const requests = inputs.map((input, i) => texture.loadFromMemory(input)
      .then(ok => {
        assert.equal(ok, true);
        completed.push(i);
        assert.deepEqual(read(texture), [ ...images[i].pixels ]);
        assert.deepEqual(xy(texture.getSize()), xy(images[i].getSize()));
      }));
    texture.loadFromImage(new sf.Image(new V(1, 1), sf.Color.Green));
    texture.setSmooth(true);
    texture.setRepeated(true);
    await Promise.all(requests);
    assert.equal(handle(texture), identity);
    assert.equal(texture[textureId], id);
    assert.deepEqual(read(texture), [ ...images[completed[1]].pixels ]);
    assert.deepEqual(native.readTextureFlags(handle(texture)),
      [ true, true, false ]);
  });

test('Texture pixel, Image and Texture region uploads preserve other pixels',
  () => {
    const texture = loaded(new sf.Image(new V(4, 3), sf.Color.Red));
    const expected = new sf.Image(new V(4, 3), sf.Color.Red);
    const source = fixture(2, 2);
    const envelope = new Uint8Array(source.pixels.length + 4);
    envelope.set(source.pixels, 2);
    texture.update(envelope.subarray(2, 2 + source.pixels.length),
      new V(2, 2), new V(1, 1));
    expected.copy(source, new V(1, 1));
    assert.deepEqual(read(texture), [ ...expected.pixels ]);
    envelope.fill(0);
    const patch = new sf.Image(new V(1, 1), sf.Color.Blue);
    texture.update(patch);
    expected.copy(patch, new V());
    texture.update(patch, new V(3, 2));
    expected.copy(patch, new V(3, 2));
    const other = loaded(new sf.Image(new V(1, 1), sf.Color.Green));
    texture.update(other);
    expected.setPixel(new V(), sf.Color.Green);
    texture.update(other, new V(3, 0));
    expected.setPixel(new V(3, 0), sf.Color.Green);
    texture.update(texture);
    texture.update(new sf.Image());
    texture.update(new sf.Texture());
    texture.update(new Uint8Array(), new V(0, 1), new V(4, 2));
    assert.deepEqual(read(texture), [ ...expected.pixels ]);
    const empty = new sf.Texture();
    empty.update(new Uint8Array());
    empty.update(empty);
  });

test('Texture invalid input never reaches unsafe native uploads', async () => {
  const texture = loaded();
  const before = read(texture);
  for (const source of [
    new Uint8Array(16), new sf.Image(new V(2, 2)), loaded(fixture(2, 2)),
  ]) {
    const args = source instanceof Uint8Array
      ? [ new V(2, 2), new V(2, 1) ] : [ new V(2, 1) ];
    assert.throws(() => texture.update(source, ...args), RangeError);
  }
  assert.throws(() => texture.update(texture, new V(1, 0)), RangeError);
  assert.throws(() => texture.update(new Uint8Array(4)), RangeError);
  assert.throws(() => texture.update(new Uint8Array(4), new V(1, 1)),
    TypeError);
  assert.throws(() => texture.update(fixture(), new sf.Vector2i()), TypeError);
  assert.throws(() => texture.update({}), TypeError);
  assert.throws(() => texture.setSmooth(1), TypeError);
  assert.throws(() => texture.setRepeated(null), TypeError);
  assert.throws(() => texture.loadFromImage({}), TypeError);
  assert.throws(() => texture.loadFromImage(fixture(), false,
    new sf.FloatRect()), TypeError);
  const detached = new Uint8Array(24);
  structuredClone(detached.buffer, { transfer: [ detached.buffer ] });
  const invalid = [ detached, new Uint8Array(new SharedArrayBuffer(24)) ];
  if (typeof ArrayBuffer.prototype.resize === 'function') {
    invalid.push(new Uint8Array(new ArrayBuffer(24, { maxByteLength: 48 })));
  }
  for (const input of invalid) {
    assert.throws(() => texture.update(input));
    await assert.rejects(texture.loadFromMemory(input), TypeError);
    assert.throws(() => native.updateTexture(handle(texture), input),
      TypeError);
  }
  await assert.rejects(texture.loadFromFile('bad\0.png'), TypeError);
  await assert.rejects(texture.loadFromFile(42), TypeError);
  await assert.rejects(texture.loadFromMemory(new Uint8Array(), 1), TypeError);
  await assert.rejects(texture.loadFromMemory(new Uint8Array(), false, {}),
    TypeError);
  assert.throws(() => native.updateTexture(handle(texture),
    new Uint8Array(4), 1, 1, 0xffffffff, 0), RangeError);
  assert.throws(() => native.updateTextureImage(handle(texture),
    handle(fixture(9, 9)), 0, 0), RangeError);
  assert.throws(() => native.updateTextureTexture(handle(texture),
    handle(loaded(fixture(9, 9))), 0, 0), RangeError);
  assert.throws(() => native.loadTextureImage(handle(texture),
    handle(fixture()), false, 3, 0, 1, 1), RangeError);
  assert.deepEqual(read(texture), before);
  assert.equal(texture.loadFromFileSync, undefined);
  assert.equal(texture.loadFromMemorySync, undefined);
});

test('Texture loading keeps existing sprites and pending targets correct',
  async () => {
    const texture = loaded(new sf.Image(new V(1, 1), sf.Color.Red));
    const identity = handle(texture);
    const sprite = new sf.Sprite(texture);
    const targets = [ 0, 1 ].map(() => new sf.RenderTexture(new V(4, 1)));
    const blueBytes = await new sf.Image(
      new V(2, 1), sf.Color.Blue).saveToMemory('png');
    const loading = texture.loadFromMemory(blueBytes);
    for (const target of targets) {
      target.clear();
      target.draw(sprite);
    }
    assert.equal(await loading, true);
    sprite.setPosition(new sf.Vector2f(1, 0));
    for (const target of targets) target.draw(sprite);
    texture.update(new sf.Image(new V(1, 1), sf.Color.Green));
    sprite.setPosition(new sf.Vector2f(2, 0));
    for (const target of targets) target.draw(sprite);
    texture.update(loaded(new sf.Image(new V(1, 1), sf.Color.Red)));
    sprite.setPosition(new sf.Vector2f(3, 0));
    for (const target of targets) {
      target.draw(sprite);
      target.display();
      assert.deepEqual(row(target, 0), [ ...red, ...blue, ...green, ...red ]);
    }
    assert.equal(handle(texture), identity);
    assert.equal(sprite.getTexture(), texture);
  });

for (const repeat of [ false, true ]) {
  test(`Texture ${repeat ? 'repeat' : 'smooth'} changes match immediate SFML`,
    () => {
      const texture = loaded(new sf.Image(
        new V(2, 1), new Uint8Array([ ...red, ...blue ])));
      const vertices = quad(8, repeat ? 8 : 2);
      const targets = [ 0, 1 ].map(() => new sf.RenderTexture(new V(8, 2)));
      const states = new sf.RenderStates(texture);
      for (const target of targets) {
        target.clear();
        target.draw(vertices, states);
      }
      if (repeat) texture.setRepeated(true);
      else texture.setSmooth(true);
      states.transform.translate(new sf.Vector2f(0, 1));
      const expected = bytes(native.renderTextureSamplingOracle(repeat));
      for (const target of targets) {
        target.draw(vertices, states);
        target.display();
        assert.deepEqual(
          [ ...native.readRenderTexturePixels(handle(target)) ], expected);
        assert.notDeepEqual(row(target, 0), row(target, 1));
      }
    });
}

test('Texture async decoding yields to the event loop and retains its owner',
  async () => {
    const encoded = await fixture(1024, 1024).saveToMemory('png');
    let texture = new sf.Texture();
    const reference = new WeakRef(texture);
    // Observe a loop turn without depending on the platform's timer precision.
    let yielded = false;
    const turn = setImmediate().then(() => { yielded = true; });
    const pending = Array.from({ length: 4 },
      () => texture.loadFromMemory(encoded));
    texture = null;
    try {
      assert.deepEqual(await Promise.all(pending), [ true, true, true, true ]);
      assert.equal(yielded, true, 'Decoding must not block the event loop');
    } finally {
      await turn;
    }
    for (let i = 0; i < 80; i++) {
      await setImmediate();
      global.gc();
      if (!reference.deref()) break;
    }
    assert.equal(reference.deref(), undefined);
  });

test('Texture resize preserves failed state and refreshes successful metadata',
  () => {
    const texture = new sf.Texture(fixture(), true);
    texture.setSmooth(true);
    texture.setRepeated(true);
    const identity = handle(texture);
    const id = texture[textureId];
    const before = read(texture);
    const settings = flags(texture);
    const max = sf.Texture.getMaximumSize();
    assert.ok(Number.isInteger(max) && max > 0);
    for (const size of [ new V(), new V(1, 0), new V(max + 1, 1) ]) {
      assert.equal(texture.resize(size), false);
      assert.deepEqual(xy(texture.getSize()), [ 3, 2 ]);
      assert.deepEqual(read(texture), before);
      assert.deepEqual(flags(texture), settings);
    }
    assert.equal(texture.resize(new V(5, 4)), true);
    assert.deepEqual(xy(texture.getSize()), [ 5, 4 ]);
    assert.deepEqual(flags(texture), [ true, true, false ]);
    assert.deepEqual(flags(texture), native.readTextureFlags(identity));
    texture.update(fixture(5, 4));
    assert.deepEqual(read(texture), [ ...fixture(5, 4).pixels ]);
    assert.equal(handle(texture), identity);
    assert.equal(texture[textureId], id);
    assert.throws(() => texture.resize(new sf.Vector2f(1, 1)), TypeError);
    assert.throws(() => texture.resize(new V(1, 1), 1), TypeError);
    assert.throws(() => native.resizeTexture(identity, -1, 1, false),
      RangeError);
    assert.throws(() => native.resizeTexture(identity, 1.5, 1, false),
      RangeError);
    assert.throws(() => native.resizeTexture(identity, 1, 1, 0), TypeError);
    const empty = new sf.Texture();
    assert.equal(empty.resize(new V(2, 3), true), true);
    assert.deepEqual(flags(empty), native.readTextureFlags(handle(empty)));
  });

test('Texture Image and copy constructors make independent resources', () => {
  const image = fixture(4, 3);
  const texture = new sf.Texture(image, true, rect(1, 1, 2, 2));
  const expected = bytes(native.loadTextureAreaOracle(
    handle(image), 1, 1, 2, 2));
  assert.deepEqual(read(texture), expected);
  image.pixels.fill(0);
  assert.deepEqual(read(texture), expected);
  texture.setSmooth(true);
  texture.setRepeated(true);
  const copy = new sf.Texture(texture);
  assert.notEqual(handle(copy), handle(texture));
  assert.notEqual(copy[textureId], texture[textureId]);
  assert.deepEqual(flags(copy), flags(texture));
  assert.deepEqual(read(copy), expected);
  texture.update(new sf.Image(new V(2, 2), sf.Color.Red));
  assert.deepEqual(read(copy), expected);
  copy.update(new sf.Image(new V(2, 2), sf.Color.Blue));
  assert.deepEqual(read(texture), [ ...red, ...red, ...red, ...red ]);
  texture.setSmooth(false);
  assert.equal(copy.isSmooth(), true);
  const empty = new sf.Texture();
  empty.setRepeated(true);
  const emptyCopy = new sf.Texture(empty);
  assert.deepEqual(xy(emptyCopy.getSize()), [ 0, 0 ]);
  assert.deepEqual(flags(emptyCopy), flags(empty));
  assert.throws(() => new sf.Texture(new sf.Image()), /could not create/);
  assert.throws(() => new sf.Texture(image, false, {}), TypeError);
  assert.throws(() => new sf.Texture(image, false, rect(4, 0, 1, 1)),
    RangeError);
  assert.equal(sf.imageFromMapping, undefined);
});

test('Texture readback shares Native Image memory and supports codecs',
  async () => {
    const original = fixture();
    const texture = new sf.Texture(original);
    const image = texture.copyToImage();
    assert.ok(image instanceof sf.Image);
    assert.deepEqual(xy(image.getSize()), [ 3, 2 ]);
    assert.equal(native.imageSharesPixels(handle(image), image.pixels), true);
    assert.deepEqual([ ...image.pixels ], [ ...original.pixels ]);
    native.setImagePixel(handle(image), 0, 0, sf.Color.Blue.toInteger());
    assert.deepEqual([ ...image.pixels.slice(0, 4) ], blue);
    assert.deepEqual(read(texture), [ ...original.pixels ]);
    const encoded = await image.saveToMemory('png');
    const decoded = new sf.Image();
    assert.equal(await decoded.loadFromMemory(encoded), true);
    assert.deepEqual([ ...decoded.pixels ], [ ...image.pixels ]);
    texture.update(new sf.Image(new V(3, 2), sf.Color.Green));
    assert.deepEqual([ ...image.pixels ], [ ...decoded.pixels ]);
    const second = texture.copyToImage();
    second.pixels.fill(0);
    assert.deepEqual(read(texture).slice(0, 4), green);
    image.resize(new V(1, 1), sf.Color.Red);
    assert.deepEqual([ ...image.pixels ], red);
    const empty = new sf.Texture().copyToImage();
    assert.ok(empty instanceof sf.Image);
    assert.deepEqual(xy(empty.getSize()), [ 0, 0 ]);
    assert.equal(empty.getPixelsPtr(), undefined);
  });

test('Texture readback pixel views retain only their native allocation',
  async () => {
    let texture = new sf.Texture(fixture());
    let image = texture.copyToImage();
    let pixels = image.pixels;
    const expected = [ ...pixels ];
    const observed = native.observeImage(handle(image));
    image.resize(new V(1, 1));
    image = null;
    texture = null;
    global.gc();
    assert.equal(native.imageExpired(observed), false);
    assert.deepEqual([ ...pixels ], expected);
    pixels = null;
    for (let i = 0; i < 80 && !native.imageExpired(observed); i++) {
      await setImmediate();
      global.gc();
    }
    assert.equal(native.imageExpired(observed), true);
  });

test('Texture swap exchanges metadata and content but keeps async destinations',
  async () => {
    const a = new sf.Texture(fixture(2, 1), true);
    const b = new sf.Texture(fixture(1, 3));
    a.setSmooth(true);
    a.setRepeated(true);
    const handles = [ handle(a), handle(b) ];
    const ids = [ a[textureId], b[textureId] ];
    const contents = [ read(a), read(b) ];
    const settings = [ flags(a), flags(b) ];
    const next = fixture(4, 2);
    const input = await next.saveToMemory('png');
    const loading = a.loadFromMemory(input);
    sf.swap(a, b);
    assert.deepEqual([ handle(a), handle(b) ], handles);
    assert.deepEqual([ a[textureId], b[textureId] ], ids);
    assert.deepEqual([ xy(a.getSize()), xy(b.getSize()) ],
      [[ 1, 3 ], [ 2, 1 ]]);
    assert.deepEqual([ read(a), read(b) ], [ contents[1], contents[0] ]);
    assert.deepEqual([ flags(a), flags(b) ], [ settings[1], settings[0] ]);
    b.swap(b);
    assert.deepEqual(read(b), contents[0]);
    assert.equal(await loading, true);
    assert.deepEqual(read(a), [ ...next.pixels ]);
    assert.deepEqual(read(b), contents[0]);
    const empty = new sf.Texture();
    b.swap(empty);
    assert.deepEqual(read(b), []);
    assert.deepEqual(flags(b), [ false, false, false ]);
    assert.deepEqual(read(empty), contents[0]);
    assert.deepEqual(flags(empty), settings[0]);
    assert.throws(() => a.swap({}), TypeError);
    assert.throws(() => sf.swap(a, new sf.VertexBuffer()), TypeError);
    assert.throws(() => sf.swap({}, a), TypeError);
    const borrowed = new sf.RenderTexture(new V(1, 1)).getTexture();
    assert.throws(() => sf.swap(a, borrowed), TypeError);
    assert.throws(() => sf.swap(borrowed, a), TypeError);
    assert.throws(() => native.swapTextures(handle(a), handle(next)),
      TypeError);
  });

test('Texture copies and swaps do not retain unrelated Native handles',
  async () => {
    let source = new sf.Texture(fixture());
    const reference = new WeakRef(handle(source));
    const copy = new sf.Texture(source);
    const swapped = new sf.Texture();
    const expected = read(source);
    source.swap(swapped);
    source = null;
    for (let i = 0; i < 80; i++) {
      await setImmediate();
      global.gc();
      if (!reference.deref()) break;
    }
    assert.equal(reference.deref(), undefined);
    assert.deepEqual(read(copy), expected);
    assert.deepEqual(read(swapped), expected);
  });

for (const operation of [ 'resize', 'swap' ]) {
  test(`Texture ${operation} preserves queued Sprite and vertex draws`,
    () => {
      const a = new sf.Texture(new sf.Image(new V(1, 1), sf.Color.Red));
      const b = new sf.Texture(new sf.Image(new V(2, 1), sf.Color.Blue));
      const spriteA = new sf.Sprite(a);
      const spriteB = new sf.Sprite(b);
      const vertices = quad(1, 1);
      const targets = [ 0, 1 ].map(() => new sf.RenderTexture(new V(8, 1)));
      const draw = offset => {
        spriteA.setPosition(new sf.Vector2f(offset, 0));
        spriteB.setPosition(new sf.Vector2f(offset + 1, 0));
        const states = new sf.RenderStates(a);
        states.transform.translate(new sf.Vector2f(offset + 3, 0));
        for (const target of targets) {
          target.draw(spriteA);
          target.draw(spriteB);
          target.draw(vertices, states);
        }
      };
      for (const target of targets) target.clear();
      draw(0);
      if (operation === 'swap') sf.swap(a, b);
      else {
        assert.equal(a.resize(new V(3, 2)), true);
        a.update(new sf.Image(new V(3, 2), sf.Color.Green));
      }
      draw(4);
      const after = operation === 'swap'
        ? [ ...blue, ...red, ...red, ...blue ]
        : [ ...green, ...blue, ...blue, ...green ];
      for (const target of targets) {
        target.display();
        assert.deepEqual(row(target, 0),
          [ ...red, ...blue, ...blue, ...red, ...after ]);
      }
      assert.equal(spriteA.getTexture(), a);
      assert.equal(spriteB.getTexture(), b);
    });
}

for (const mode of [ 'pixels', 'image', 'texture', 'load', 'resize' ]) {
  test(`Texture mipmap generation, ${mode}, copy and swap match immediate SFML`,
    () => {
      const source = new sf.Image(new V(64, 64));
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          source.setPixel(new V(x, y),
            (x + y) % 2 ? sf.Color.Black : sf.Color.White);
        }
      }
      const patch = new sf.Image(source);
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          patch.setPixel(new V(x, y),
            (x + y) % 2 ? sf.Color.Red : sf.Color.Blue);
        }
      }
      const index = [ 'pixels', 'image', 'texture', 'load', 'resize' ]
        .indexOf(mode);
      const expected = native.renderTextureMipmapOracle(
        handle(source), handle(patch), index);
      const texture = new sf.Texture(source);
      texture.setSmooth(true);
      const patchTexture = mode === 'texture' ? new sf.Texture(patch) : null;
      const other = new sf.Texture(source);
      other.setSmooth(true);
      const targets = [ 0, 1 ].map(() => new sf.RenderTexture(new V(8, 56)));
      const vertices = quad(8, 64);
      for (let i = 0; i < 4; i++) {
        const vertex = vertices.getVertex(i);
        vertex.position.y *= 8;
        vertex.texCoords.x += 0.2;
        vertex.texCoords.y = vertex.texCoords.y * 64 + 0.2;
      }
      const draw = (input, y) => {
        const states = new sf.RenderStates(input);
        states.transform.translate(new sf.Vector2f(0, y));
        for (const target of targets) target.draw(vertices, states);
      };
      for (const target of targets) target.clear();
      draw(texture, 0);
      assert.equal(texture.generateMipmap(), expected.generated);
      draw(texture, 8);
      const copy = new sf.Texture(texture);
      draw(copy, 16);
      if (mode === 'pixels') texture.update(patch.pixels);
      else if (mode === 'image') texture.update(patch);
      else if (mode === 'texture') texture.update(patchTexture);
      else if (mode === 'load') {
        assert.equal(texture.loadFromImage(patch), true);
      } else {
        assert.equal(texture.resize(new V(64, 64)), true);
        texture.update(patch);
      }
      draw(texture, 24);
      assert.equal(texture.generateMipmap(), expected.regenerated);
      draw(texture, 32);
      texture.swap(other);
      draw(texture, 40);
      draw(other, 48);
      for (const target of targets) {
        target.display();
        assert.deepEqual(
          [ ...native.readRenderTexturePixels(handle(target)) ],
          bytes(expected));
        if (expected.generated) {
          assert.notDeepEqual(row(target, 0), row(target, 8));
        }
        assert.deepEqual(row(target, 0), row(target, 16));
        assert.deepEqual(row(target, 32), row(target, 48));
      }
      assert.equal(new sf.Texture().generateMipmap(), false);
    });
}
