'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const {
  Color, Texture, Sprite, RenderTexture, Vector2u, Vector2f,
} = require('..');
const native = require('../build/Release/sfml.node');
const {
  graphicsNative, textureId,
} = require('../dist/internal/graphics-state');
const { vector2Storage } = require('../dist/internal/value-storage');
const {
  transformableState,
} = require('../dist/internal/transformable');

const red = [ 255, 0, 0, 255 ];
const green = [ 0, 255, 0, 255 ];
const black = [ 0, 0, 0, 255 ];

function texture(color = red) {
  const value = new Texture(new Vector2u(1, 1));
  value.update(new Uint8Array(color));
  return value;
}

function pixels(target) {
  return native.readRenderTexturePixels(target[graphicsNative]);
}

function pixel(data, width, x, y) {
  const offset = (y * width + x) * 4;
  return [ ...data.subarray(offset, offset + 4) ];
}

test('position and draw enter native code only at display', () => {
  const sprite = new Sprite(texture());
  const target = new RenderTexture(new Vector2u(8, 4));
  const position = new Vector2f();
  const names = [
    'createVector2', 'createSprite', 'createTexture', 'createRenderTexture',
    'createGraphicsContext', 'submitRenderTexture', 'updateTexture',
  ];
  const original = new Map(names.map(name => [ name, native[name] ]));
  const calls = [];
  for (const name of names) {
    native[name] = (...args) => {
      calls.push(name);
      return original.get(name)(...args);
    };
  }
  try {
    target.clear();
    for (let index = 0; index < 256; index++) {
      position.x = index % 8;
      position.y = Math.floor(index / 8) % 4;
      sprite.setPosition(position);
      target.draw(sprite);
    }
    assert.deepEqual(calls, []);
    target.display();
    assert.deepEqual(calls, [ 'submitRenderTexture' ]);
  } finally {
    for (const [ name, fn ] of original) native[name] = fn;
  }
  const data = pixels(target);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 8; x++) assert.deepEqual(pixel(data, 8, x, y), red);
  }
});

test('two draws of one sprite preserve their position snapshots', () => {
  const sprite = new Sprite(texture());
  const target = new RenderTexture(new Vector2u(8, 4));
  const position = new Vector2f(1, 1);
  target.clear();
  sprite.setPosition(position);
  target.draw(sprite);
  position.x = 5;
  position.y = 2;
  sprite.setPosition(position);
  target.draw(sprite);
  // An undrawn later state must not modify either queued draw.
  position.x = 7;
  position.y = 3;
  sprite.setPosition(position);
  assert.deepEqual(native.readSpritePosition(sprite[graphicsNative]), [ 0, 0 ]);
  target.display();
  assert.deepEqual(native.readSpritePosition(sprite[graphicsNative]), [ 7, 3 ]);
  const data = pixels(target);
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 8; x++) {
      const expected = (x === 1 && y === 1) || (x === 5 && y === 2)
        ? red : black;
      assert.deepEqual(pixel(data, 8, x, y), expected);
    }
  }
});

test('clear and draw preserve order and frames do not replay', () => {
  const sprite = new Sprite(texture());
  const target = new RenderTexture(new Vector2u(4, 2));
  target.clear();
  target.draw(sprite);
  target.clear(Color.Green);
  sprite.setPosition(new Vector2f(3, 1));
  target.draw(sprite);
  target.display();
  let data = pixels(target);
  assert.deepEqual(pixel(data, 4, 0, 0), green);
  assert.deepEqual(pixel(data, 4, 3, 1), red);
  target.clear();
  target.display();
  target.display();
  data = pixels(target);
  assert.ok(data.every(
    (value, index) => value === (index % 4 === 3 ? 255 : 0)
  ));
});

test('texture updates preserve the pixels used by earlier queued draws', () => {
  const image = texture();
  const sprite = new Sprite(image);
  const target = new RenderTexture(new Vector2u(4, 2));
  target.clear();
  target.draw(sprite);
  image.update(new Uint8Array(green));
  sprite.setPosition(new Vector2f(2, 1));
  target.draw(sprite);
  target.display();
  const data = pixels(target);
  assert.deepEqual(pixel(data, 4, 0, 0), red);
  assert.deepEqual(pixel(data, 4, 2, 1), green);
});

test('clear records Color bytes without native calls or retaining the source',
  async () => {
    const first = new RenderTexture(new Vector2u(2, 1));
    const second = new RenderTexture(new Vector2u(2, 1));
    let color = new Color(18, 52, 86, 120);
    const reference = new WeakRef(color);
    const original = Object.entries(native).filter(
      ([ , value ]) => typeof value === 'function'
    );
    const calls = [];
    for (const [ name, fn ] of original) {
      native[name] = (...args) => {
        calls.push(name);
        return fn(...args);
      };
    }
    try {
      first.clear(color);
      color.r = 171;
      color.g = 205;
      color.b = 239;
      color.a = 255;
      second.clear(color);
      assert.deepEqual(calls, []);
    } finally {
      for (const [ name, fn ] of original) native[name] = fn;
    }
    color = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      await setImmediate();
      global.gc();
      if (!reference.deref()) break;
    }
    assert.equal(reference.deref(), undefined);
    first.display();
    second.display();
    assert.deepEqual(pixel(pixels(first), 2, 0, 0), [ 18, 52, 86, 120 ]);
    assert.deepEqual(pixel(pixels(second), 2, 0, 0), [ 171, 205, 239, 255 ]);
    first.clear(Color.Transparent);
    first.display();
    assert.deepEqual(pixel(pixels(first), 2, 0, 0), [ 0, 0, 0, 0 ]);
    assert.throws(
      () => first.clear({ r: 1, g: 2, b: 3, a: 4 }), TypeError
    );
    first.clear();
    first.display();
    assert.deepEqual(pixel(pixels(first), 2, 0, 0), black);
  });

test('a full command block flushes in order without losing draws', () => {
  const sprite = new Sprite(texture());
  const target = new RenderTexture(new Vector2u(2, 1));
  const first = new Vector2f(0, 0);
  const second = new Vector2f(1, 0);
  target.clear();
  for (let index = 0; index < 4096; index++) {
    sprite.setPosition(index % 2 ? first : second);
    target.draw(sprite);
  }
  target.display();
  const data = pixels(target);
  assert.deepEqual(pixel(data, 2, 0, 0), red);
  assert.deepEqual(pixel(data, 2, 1, 0), red);
});

test('setPosition copies eight bytes without aliasing the source', () => {
  const sprite = new Sprite(texture());
  const position = new Vector2f();
  const source = new Uint32Array(position[vector2Storage].buffer);
  const destination = sprite[transformableState].values;
  assert.equal(destination.length, 7);
  assert.equal(destination.buffer.byteLength, 28);
  assert.notEqual(destination.buffer, source.buffer);
  // Preserve negative zero and the float32 NaN payload during the copy.
  source.set([ 0x80000000, 0x7fc12345 ]);
  sprite.setPosition(position);
  const copiedBits = new Uint32Array(destination.buffer, 0, 2);
  assert.deepEqual([ ...copiedBits ], [ ...source ]);
  source.fill(0);
  assert.deepEqual([ ...copiedBits ], [ 0x80000000, 0x7fc12345 ]);
  sprite.setPosition(position);
  assert.equal(sprite[transformableState].values, destination);
  assert.deepEqual([ ...copiedBits ], [ 0, 0 ]);
  assert.deepEqual([ ...destination.subarray(2) ], [ 0, 1, 1, 0, 0 ]);
});

test('position copy and move preserve SFML float32 value semantics', () => {
  const image = texture();
  const sprite = new Sprite(image);
  const source = new Vector2f(0.1, -0.2);
  sprite.setPosition(source);
  source.x = 99;
  const result = sprite.getPosition();
  assert.equal(result.x, Math.fround(0.1));
  result.x = 100;
  sprite.move(new Vector2f(0.3, 0.7));
  const moved = sprite.getPosition();
  assert.equal(moved.x, Math.fround(Math.fround(0.1) + Math.fround(0.3)));
  assert.equal(moved.y, Math.fround(Math.fround(-0.2) + Math.fround(0.7)));
  assert.equal(sprite.getTexture(), image);
});

test('queued draws retain sprite and texture until submission', async () => {
  let sprite = new Sprite(texture());
  const target = new RenderTexture(new Vector2u(2, 2));
  const reference = new WeakRef(sprite);
  target.clear();
  target.draw(sprite);
  sprite = null;
  await setImmediate();
  global.gc();
  assert.ok(reference.deref());
  target.display();
  assert.deepEqual(pixel(pixels(target), 2, 0, 0), red);
  for (let attempt = 0; attempt < 30; attempt++) {
    await setImmediate();
    global.gc();
    if (!reference.deref()) break;
  }
  assert.equal(reference.deref(), undefined);
});

test('native sprite ownership retains texture when its JS wrapper is gone',
  async () => {
    let image = texture();
    const reference = new WeakRef(image);
    // Keep only native references here, bypassing the TS convenience wrapper.
    const {
      graphicsContext,
    } = require('../dist/internal/graphics-state');
    const allocation = native.createSprite(
      graphicsContext(), image[graphicsNative], image[textureId]
    );
    const target = native.createRenderTexture(graphicsContext(), 2, 2);
    image = null;
    for (let attempt = 0; attempt < 30; attempt++) {
      await setImmediate();
      global.gc();
      if (!reference.deref()) break;
    }
    assert.equal(reference.deref(), undefined);
    const words = new Uint32Array(target.buffer);
    const floats = new Float32Array(target.buffer);
    words[0] = 0;
    words[1] = 0xff;
    words[43] = 1;
    words[44] = allocation.id;
    floats.set(new Float32Array(allocation.buffer), 45);
    floats.set([ 1, 0, 0, 0, 0, 1, 0, 0,
      0, 0, 1, 0, 0, 0, 0, 1 ], 52);
    words.set([ 1, 0, 0, 1, 0, 0, 7, 0, 0, 0xffffffff, 0 ], 68);
    words.set(new Uint32Array(allocation.appearance), 79);
    native.submitRenderTexture(target.handle, 2, true);
    assert.deepEqual(pixel(
      native.readRenderTexturePixels(target.handle), 2, 0, 0), red);
  });

test('pixel uploads honor view offsets and validate length', () => {
  const image = new Texture(new Vector2u(1, 1));
  const source = new Uint8Array([ 1, 2, ...red, 3, 4 ]);
  image.update(source.subarray(2, 6));
  assert.throws(() => image.update(source), RangeError);
  const target = new RenderTexture(new Vector2u(1, 1));
  target.clear();
  target.draw(new Sprite(image));
  target.display();
  assert.deepEqual(pixel(pixels(target), 1, 0, 0), red);
});

test('native graphics entry points reject unrelated handles and counts', () => {
  const target = new RenderTexture(new Vector2u(1, 1));
  assert.throws(() => native.submitRenderTexture({}, 0, true), TypeError);
  assert.throws(
    () => native.submitRenderTexture(target[graphicsNative], 4097, true),
    RangeError
  );
  assert.throws(() => native.updateTexture(target[graphicsNative], red),
    TypeError);
  assert.throws(() => target.draw({}), TypeError);
});
