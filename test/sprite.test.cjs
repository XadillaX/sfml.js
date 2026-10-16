'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  graphicsNative, graphicsContext, spriteState, textureId,
} = require('../dist/internal/graphics-state');
const {
  rectStorage, rectNative, vector2Native,
} = require('../dist/internal/value-storage');
const { transformableState } = require('../dist/internal/transformable');

const handle = value => value[graphicsNative];
const point = (x = 0, y = 0) => new sf.Vector2f(x, y);
const size = (x, y) => new sf.Vector2u(x, y);
const rectangle = (x, y, w, h) =>
  new sf.IntRect(new sf.Vector2i(x, y), new sf.Vector2i(w, h));
const rectValues = value => [ ...value[rectStorage] ];
const read = target => native.readRenderTexturePixels(handle(target));
const tex = (w = 4, h = 3, color = sf.Color.White) =>
  new sf.Texture(new sf.Image(size(w, h), color));

function atlas() {
  const image = new sf.Image(size(4, 3));
  for (let i = 0; i < image.pixels.length; i++) {
    image.pixels[i] = i % 4 === 3 ? 255 : (i * 43 + 31) % 256;
  }
  return new sf.Texture(image);
}

function snapshot(sprite, parent) {
  return {
    texture: handle(sprite.getTexture()),
    rect: new Int32Array(sprite.getTextureRect()[rectStorage]),
    color: sprite.getColor().toInteger(),
    transform: sprite[transformableState].values.slice(),
    parent: parent ? new Float32Array(parent.getMatrix()) : undefined,
  };
}

function near(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, i) => assert.ok(
    Math.abs(value - expected[i]) <= Math.max(1, Math.abs(expected[i])) * 3e-6,
    `${value} != ${expected[i]}`
  ));
}

test('Sprite constructors cover full, explicit, empty and copied rectangles',
  () => {
    const texture = atlas();
    const sprite = new sf.Sprite(texture);
    assert.equal(sprite.getTexture(), texture);
    assert.deepEqual(rectValues(sprite.getTextureRect()), [ 0, 0, 4, 3 ]);
    assert.equal(sprite.getColor().toInteger(), 0xffffffff);
    const area = rectangle(3, 2, -2, -1);
    const cropped = new sf.Sprite(texture, area);
    area.size.x = 99;
    assert.deepEqual(rectValues(cropped.getTextureRect()), [ 3, 2, -2, -1 ]);
    assert.deepEqual(rectValues(cropped.getLocalBounds()), [ 0, 0, 2, 1 ]);
    const empty = new sf.Sprite(new sf.Texture());
    assert.deepEqual(rectValues(empty.getLocalBounds()), [ 0, 0, 0, 0 ]);
    cropped.setPosition(point(10, 12));
    cropped.setScale(point(-2, 3));
    cropped.setOrigin(point(1, 2));
    cropped.setRotation(sf.degrees(30));
    cropped.setColor(new sf.Color(32, 64, 128, 96));
    const copy = new sf.Sprite(cropped);
    assert.notEqual(handle(copy), handle(cropped));
    assert.notEqual(copy[spriteState].id, cropped[spriteState].id);
    assert.equal(copy.getTexture(), cropped.getTexture());
    assert.deepEqual(copy[transformableState].values,
      cropped[transformableState].values);
    assert.equal(copy.getColor().toInteger(), cropped.getColor().toInteger());
    assert.deepEqual(rectValues(copy.getTextureRect()), [ 3, 2, -2, -1 ]);
    assert.deepEqual(rectValues(copy.getGlobalBounds()),
      rectValues(cropped.getGlobalBounds()));
    cropped.setTexture(tex(1, 1), true);
    cropped.setPosition(point());
    cropped.setColor(sf.Color.Red);
    assert.equal(copy.getTexture(), texture);
    assert.deepEqual(rectValues(copy.getTextureRect()), [ 3, 2, -2, -1 ]);
    assert.equal(copy.getColor().toInteger(), 0x20408060);
    copy.setTextureRect(rectangle(0, 0, 1, 2));
    assert.deepEqual(rectValues(cropped.getTextureRect()), [ 0, 0, 1, 1 ]);
    assert.throws(() => new sf.Sprite(), TypeError);
    assert.throws(() => new sf.Sprite({}), TypeError);
    assert.throws(() => new sf.Sprite(texture, new sf.FloatRect()), TypeError);
    assert.throws(() => new sf.Sprite(copy, rectangle(0, 0, 1, 1)), TypeError);
  });

test('Sprite texture reset follows current size including same-texture reset',
  () => {
    const a = tex(4, 3);
    const b = tex(2, 5);
    const sprite = new sf.Sprite(a, rectangle(1, 2, -3, 4));
    const live = sprite.getTextureRect();
    sprite.setTexture(b);
    assert.equal(sprite.getTexture(), b);
    assert.deepEqual(rectValues(live), [ 1, 2, -3, 4 ]);
    sprite.setTexture(b, true);
    assert.deepEqual(rectValues(live), [ 0, 0, 2, 5 ]);
    assert.equal(b.resize(size(3, 2)), true);
    assert.deepEqual(rectValues(live), [ 0, 0, 2, 5 ]);
    sprite.setTexture(b, true);
    assert.deepEqual(rectValues(live), [ 0, 0, 3, 2 ]);
    sprite.setTexture(a, true);
    assert.deepEqual(rectValues(live), [ 0, 0, 4, 3 ]);
    sprite.setTexture(new sf.Texture(), true);
    assert.deepEqual(rectValues(live), [ 0, 0, 0, 0 ]);
    assert.throws(() => sprite.setTexture(a, 1), TypeError);
    assert.throws(() => sprite.setTexture({}), TypeError);
    assert.throws(() => sprite.setTextureRect({}), TypeError);
    assert.throws(() => sprite.setColor({}), TypeError);
    assert.equal(sprite.getTexture().getSize().x, 0);
  });

test('Sprite rectangle views share storage and retain it after wrapper GC',
  async () => {
    let sprite = new sf.Sprite(tex());
    const reference = new WeakRef(sprite);
    const live = sprite.getTextureRect();
    const position = live.position;
    const dimensions = live.size;
    assert.equal(sprite.getTextureRect(), live);
    assert.equal(native.spriteRectSharesStorage(
      handle(sprite), live[rectNative]), true);
    // Resolving member native handles must preserve the same live views.
    assert.ok(position[vector2Native]);
    assert.ok(dimensions[vector2Native]);
    sprite.setTextureRect(rectangle(-2, 1, -3, 5));
    assert.deepEqual(rectValues(live), [ -2, 1, -3, 5 ]);
    assert.equal(position.x, -2);
    assert.equal(dimensions.x, -3);
    const independent = live.findIntersection(rectangle(-4, 0, 4, 8));
    assert.deepEqual(rectValues(independent), [ -4, 1, 2, 5 ]);
    sprite = null;
    for (let i = 0; i < 80; i++) {
      await setImmediate();
      global.gc();
      if (!reference.deref()) break;
    }
    assert.equal(reference.deref(), undefined);
    assert.deepEqual(rectValues(live), [ -2, 1, -3, 5 ]);
    assert.equal(position.x, -2);
    assert.equal(dimensions.y, 5);
  });

test('Sprite color and bounds results are independent values', () => {
  const sprite = new sf.Sprite(tex());
  const color = new sf.Color(50, 120, 240, 96);
  sprite.setColor(color);
  color.r = 0;
  const result = sprite.getColor();
  assert.equal(result.toInteger(), 0x3278f060);
  result.a = 255;
  assert.equal(sprite.getColor().a, 96);
  const bounds = sprite.getLocalBounds();
  bounds.size.x = 900;
  assert.equal(sprite.getLocalBounds().size.x, 4);
  sprite.getGlobalBounds().position.x = -999;
  assert.equal(sprite.getGlobalBounds().position.x, 0);
});

test('Sprite bounds match SFML for signed sizes and float32 transforms', () => {
  const sprite = new sf.Sprite(tex());
  const rectangles = [
    [ 0, 0, 4, 3 ], [ 5, 7, -4, 3 ], [ 1, 2, 4, -3 ],
    [ 3, 4, -4, -3 ], [ 0, 0, 0, 3 ], [ 0, 0, 4, 0 ],
    [ -2147483648, 2147483647, -2147483648, 16777217 ],
  ];
  for (const rect of rectangles) {
    sprite.setTextureRect(rectangle(...rect));
    for (const angle of [ 0, 30, 90, 225, -37 ]) {
      for (const scale of [[ 1, 1 ], [ -2, 0.5 ], [ 0, 3 ]]) {
        sprite.setPosition(point(10.3, -7.1));
        sprite.setOrigin(point(1.25, -0.5));
        sprite.setScale(point(...scale));
        sprite.setRotation(sf.degrees(angle));
        const expected = native.evaluateSprite(snapshot(sprite));
        assert.deepEqual(rectValues(sprite.getLocalBounds()), expected.local);
        near(rectValues(sprite.getGlobalBounds()), expected.global);
      }
    }
  }
});

test('Sprite visual snapshots match immediate SFML across two target queues',
  () => {
    const textures = [ atlas(), tex(2, 5, sf.Color.Cyan) ];
    const sprite = new sf.Sprite(textures[0]);
    const targets = [ 0, 1 ].map(() => new sf.RenderTexture(size(64, 64)));
    const states = new sf.RenderStates();
    states.transform.translate(point(5, 5)).rotate(sf.degrees(13))
      .scale(point(1.2, 0.8));
    const snapshots = [];
    for (const target of targets) target.clear();
    for (let i = 0; i < 12; i++) {
      sprite.setTexture(textures[i % 2]);
      sprite.setTextureRect(rectangle(
        i % 3, 1, i % 2 ? -2 : 3, i % 3 ? 2 : -2));
      sprite.setColor(
        new sf.Color(255 - i * 9, 100 + i * 10, 220, 80 + i * 12));
      sprite.setPosition(point((i % 4) * 10, Math.floor(i / 4) * 12));
      sprite.setScale(point(2, 3));
      sprite.setRotation(sf.degrees(i * 11));
      snapshots.push(snapshot(sprite, states.transform));
      for (const target of targets) target.draw(sprite, states);
    }
    const expected = native.renderSpriteAppearanceOracle(snapshots);
    sprite.setTexture(textures[0], true);
    sprite.setColor(sf.Color.Red);
    sprite.setPosition(point(60, 60));
    sprite.setRotation(sf.degrees(90));
    const latest = snapshot(sprite);
    const latestBounds = native.evaluateSprite(latest);
    targets[1].flush();
    for (const target of targets) {
      target.display();
      assert.deepEqual(read(target), expected);
      const actual = native.readSpriteAppearance(handle(sprite));
      assert.equal(actual.currentTexture, true);
      assert.deepEqual(actual.rect, [ ...latest.rect ]);
      assert.equal(actual.color, latest.color);
      near(actual.global, latestBounds.global);
    }
  });

test('Sprite properties retain batching with only texture ownership calls',
  t => {
    const a = tex();
    const b = tex(3, 2);
    const sprite = new sf.Sprite(a);
    const target = new sf.RenderTexture(size(32, 32));
    const area = rectangle(0, 0, 2, 2);
    const color = new sf.Color(255, 120, 80);
    const calls = [];
    for (const [ name, fn ] of Object.entries(native)) {
      if (typeof fn === 'function') {
        t.mock.method(native, name, (...args) => {
          calls.push(name);
          return fn(...args);
        });
      }
    }
    target.clear();
    for (let i = 0; i < 128; i++) {
      sprite.setTextureRect(area);
      sprite.setColor(color);
      sprite.setPosition(point(i % 32, Math.floor(i / 32)));
      sprite.getTextureRect();
      sprite.getColor();
      sprite.getLocalBounds();
      sprite.getGlobalBounds();
      target.draw(sprite);
    }
    assert.deepEqual(calls, []);
    sprite.setTexture(b);
    sprite.setTexture(b, true);
    assert.deepEqual(calls, [ 'setSpriteTexture' ]);
    target.draw(sprite);
    target.display();
    assert.deepEqual(calls, [ 'setSpriteTexture', 'submitRenderTexture' ]);
  });

test('Sprite old textures survive queued draws, updates and GC',
  async () => {
    let a = tex(1, 1, sf.Color.Red);
    const b = tex(1, 1, sf.Color.Blue);
    const reference = new WeakRef(a);
    const sprite = new sf.Sprite(a);
    const targets = [ 0, 1 ].map(() => new sf.RenderTexture(size(3, 1)));
    for (const target of targets) {
      target.clear();
      target.draw(sprite);
    }
    sprite.setTexture(b);
    sprite.setPosition(point(1, 0));
    for (const target of targets) target.draw(sprite);
    a = null;
    await setImmediate();
    global.gc();
    assert.ok(reference.deref());
    b.update(new sf.Image(size(1, 1), sf.Color.Green));
    sprite.setPosition(point(2, 0));
    for (const target of targets) {
      target.draw(sprite);
      target.display();
      assert.deepEqual([ ...read(target) ], [
        255, 0, 0, 255, 0, 0, 255, 255, 0, 255, 0, 255,
      ]);
    }
    for (let i = 0; i < 80; i++) {
      await setImmediate();
      global.gc();
      if (!reference.deref()) break;
    }
    assert.equal(reference.deref(), undefined);
  });

test('Sprite pending old texture is flushed when its async load completes',
  async () => {
    const a = tex(1, 1, sf.Color.Red);
    const b = tex(1, 1, sf.Color.Blue);
    const encoded = await new sf.Image(size(1, 1), sf.Color.Green)
      .saveToMemory('png');
    const sprite = new sf.Sprite(a);
    const target = new sf.RenderTexture(size(3, 1));
    const pending = a.loadFromMemory(encoded);
    target.clear();
    target.draw(sprite);
    sprite.setTexture(b);
    sprite.setPosition(point(1, 0));
    target.draw(sprite);
    assert.equal(await pending, true);
    sprite.setTexture(a);
    sprite.setPosition(point(2, 0));
    target.draw(sprite);
    target.display();
    assert.deepEqual([ ...read(target) ], [
      255, 0, 0, 255, 0, 0, 255, 255, 0, 255, 0, 255,
    ]);
  });

test('Sprite snapshots survive full batches with alternating appearance',
  () => {
    const a = tex(1, 1, sf.Color.Red);
    const b = tex(1, 1, sf.Color.Blue);
    const sprite = new sf.Sprite(a);
    const target = new sf.RenderTexture(size(2, 1));
    target.clear();
    for (let i = 0; i < 4100; i++) {
      sprite.setTexture(i % 2 ? b : a);
      sprite.setPosition(point(i % 2, 0));
      sprite.setTextureRect(rectangle(0, 0, i % 2 ? -1 : 1, 1));
      sprite.setColor(sf.Color.White);
      target.draw(sprite);
    }
    target.display();
    assert.deepEqual([ ...read(target) ],
      [ 255, 0, 0, 255, 0, 0, 255, 255 ]);
  });

test('Sprite native texture IDs must match handles and batch resources', () => {
  const a = tex();
  const b = tex();
  const sprite = new sf.Sprite(a);
  assert.throws(() => native.createSprite(
    graphicsContext(), handle(a), b[textureId]), TypeError);
  assert.throws(() => native.setSpriteTexture(
    handle(sprite), handle(b), a[textureId]), TypeError);
  assert.throws(() => native.setSpriteTexture(
    handle(sprite), handle(b), -1), TypeError);
  assert.equal(sprite.getTexture(), a);
  const target = native.createRenderTexture(graphicsContext(), 1, 1);
  const words = new Uint32Array(target.buffer);
  const floats = new Float32Array(target.buffer);
  words[0] = 0;
  words[1] = sf.Color.Red.toInteger();
  native.submitRenderTexture(target.handle, 1, true);
  words[1] = sf.Color.Green.toInteger();
  words[43] = 1;
  words[44] = sprite[spriteState].id;
  floats.set(sprite[transformableState].values, 45);
  floats.set(sf.Transform.Identity.getMatrix(), 52);
  words.set([ 1, 0, 0, 1, 0, 0, 7, 0, 0, 0xffffffff, 0 ], 68);
  words.set(sprite[spriteState].words, 79);
  const initial = native.transformableUseCount(
    sprite[transformableState].handle);
  for (const id of [ 0, 0xffffffff ]) {
    words[79] = id;
    assert.throws(() =>
      native.submitRenderTexture(target.handle, 2, true), TypeError);
    assert.equal(native.transformableUseCount(
      sprite[transformableState].handle), initial);
    assert.deepEqual([ ...native.readRenderTexturePixels(target.handle) ],
      [ 255, 0, 0, 255 ]);
  }
  words[79] = a[textureId];
  native.submitRenderTexture(target.handle, 2, true);
  assert.deepEqual([ ...native.readRenderTexturePixels(target.handle) ],
    [ 255, 255, 255, 255 ]);
});
