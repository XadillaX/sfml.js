'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { transformableState } = require('../dist/internal/transformable');
const { graphicsNative } = require('../dist/internal/graphics-state');
const {
  vector2Native, vector2Storage, angleNative, transformNative,
} = require('../dist/internal/value-storage');

const V = sf.Vector2f;
const xy = value => [ value.x, value.y ];
const handle = value => value[transformableState].handle;
const storage = value => value[transformableState].values;

function image() {
  const texture = new sf.Texture(new sf.Vector2u(3, 2));
  texture.update(new Uint8Array([
    255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255,
    255, 255, 0, 255, 255, 0, 255, 255, 0, 255, 255, 255,
  ]));
  return texture;
}

function assign(value, data) {
  value.setPosition(new V(data[0], data[1]));
  value.setRotation(sf.radians(data[2]));
  value.setScale(new V(data[3], data[4]));
  value.setOrigin(new V(data[5], data[6]));
}

function close(actual, expected) {
  assert.equal(actual.length, expected.length);
  for (let i = 0; i < actual.length; i++) {
    if (Object.is(actual[i], expected[i])) continue;
    assert.ok(Math.abs(actual[i] - expected[i]) <=
      4e-6 * Math.max(1, Math.abs(expected[i])),
    `component ${i}: ${actual[i]} != ${expected[i]}`);
  }
}

function compare(value, expected) {
  assert.deepEqual(xy(value.getPosition()), expected.position);
  assert.deepEqual(xy(value.getScale()), expected.scale);
  assert.deepEqual(xy(value.getOrigin()), expected.origin);
  close([ value.getRotation().asRadians() ], [ expected.rotation ]);
  close(value.getTransform().getMatrix(), expected.transform);
  close(value.getInverseTransform().getMatrix(), expected.inverse);
}

async function collect(done) {
  for (let i = 0; i < 60; i++) {
    await setImmediate();
    global.gc();
    if (done()) return;
  }
  assert.fail('Expected transformable wrappers and owners to collect');
}

for (const [ name, make ] of [
  [ 'Transformable', () => new sf.Transformable() ],
  [ 'Sprite', () => new sf.Sprite(image()) ],
]) {
  test(`${name}: defaults, independent getters, shared 28-byte native state`,
    () => {
      const value = make();
      assert.equal(storage(value).byteLength, 28);
      assert.deepEqual([ ...storage(value) ], [ 0, 0, 0, 1, 1, 0, 0 ]);
      compare(value, native.readTransformable(handle(value)));
      for (const [ field, offset ] of [
        [ 'Position', 0 ], [ 'Scale', 3 ], [ 'Origin', 5 ],
      ]) {
        const input = new V();
        const bits = new Uint32Array(input[vector2Storage].buffer);
        bits.set([ 0x80000000, 0x7fc12345 ]);
        value[`set${field}`](input);
        const copy = value[`get${field}`]();
        assert.deepEqual([ ...new Uint32Array(
          storage(value).buffer, offset * 4, 2) ], [ ...bits ]);
        assert.deepEqual([ ...new Uint32Array(copy[vector2Storage].buffer) ],
          [ ...bits ]);
        input.y = 3;
        copy.y = 4;
        assert.ok(Number.isNaN(value[`get${field}`]().y));
      }
      // Origin must not accidentally overwrite scale.
      assert.ok(Number.isNaN(value.getScale().y));
      value.setOrigin(new V(3, 4));
      assert.ok(Number.isNaN(value.getScale().y));
      value.setRotation(sf.degrees(-90));
      const rotation = value.getRotation();
      sf.addAssign(rotation, sf.degrees(45));
      close([ value.getRotation().asDegrees() ], [ 270 ]);
    });

  test(`${name}: setters, incremental operations and matrices match SFML`,
    () => {
      const value = make();
      const offset = new V(0.3, -1.25);
      const rotation = sf.degrees(37);
      const factors = new V(-1.5, 0.75);
      const fixtures = [
        [ 0, 0, 0, 1, 1, 0, 0 ],
        [ 12.5, -8.25, sf.degrees(90).asRadians(), 2, 3, 4, -5 ],
        [ -7.25, 9.5, sf.degrees(-37).asRadians(), -2, 0.5, 3.5, 1.25 ],
        [ 2, 3, sf.degrees(720.25).asRadians(), 0, 3, 9, 4 ],
      ];
      let seed = 424242;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) % 2 ** 32;
        return seed / 2 ** 32;
      };
      for (let i = 0; i < 30; i++) {
        fixtures.push([
          random() * 40 - 20, random() * 40 - 20, random() * 20 - 10,
          0.5 + random() * 3, 0.5 + random() * 3,
          random() * 10, random() * 10,
        ]);
      }
      for (const fixture of fixtures) {
        const data = new Float32Array(fixture);
        const expected = native.evaluateTransformable(data,
          offset[vector2Native], rotation[angleNative], factors[vector2Native]);
        assign(value, data);
        compare(value, expected.base);
        assert.equal(value.move(offset), undefined);
        assert.equal(value.rotate(rotation), undefined);
        assert.equal(value.scale(factors), undefined);
        compare(value, expected.changed);
      }
    });

  test(`${name}: methods and matrix queries do not enter native code`, t => {
    const value = make();
    for (const [ name, fn ] of Object.entries(native)) {
      if (typeof fn === 'function') {
        t.mock.method(native, name,
          () => assert.fail(`Unexpected NAN: ${name}`));
      }
    }
    assign(value, [ 4, 5, 1, 2, 3, 6, 7 ]);
    value.move(new V(1, 2));
    value.rotate(sf.degrees(37));
    value.scale(new V(2, 3));
    value.getPosition();
    value.getOrigin();
    value.getScale();
    value.getRotation();
    value.getTransform();
    value.getInverseTransform();
  });

  test(`${name}: readonly transform caches update and detect C++ writes`,
    () => {
      const value = make();
      const matrix = value.getTransform();
      const inverse = value.getInverseTransform();
      const view = matrix.getMatrix();
      const inverseView = inverse.getMatrix();
      assert.equal(value.getTransform(), matrix);
      assert.equal(value.getInverseTransform(), inverse);
      assert.ok(Object.isFrozen(matrix));
      assert.ok(Object.isFrozen(inverse));
      assert.throws(() => matrix.translate(new V(1, 2)), TypeError);
      assert.throws(() => inverse.scale(new V(2, 3)), TypeError);
      assert.throws(() => { view[0] = 2; }, TypeError);
      const nativeMatrix = matrix[transformNative];
      const nativeInverse = inverse[transformNative];
      value.setPosition(new V(4, 5));
      assert.equal(value.getTransform(), matrix);
      assert.equal(value.getInverseTransform(), inverse);
      assert.equal(view[12], 4);
      assert.equal(inverseView[12], -4);
      assert.equal(native.readTransform(nativeMatrix)[13], 5);
      native.setTransformableState(handle(value),
        new Float32Array([ 10, 12, 0, 2, 3, 1, 2 ]));
      compare(value, native.readTransformable(handle(value)));
      assert.equal(view[12], 8);
      assert.equal(view[13], 6);
      assert.equal(native.readTransform(nativeInverse)[12], -4);
      // A singular transform follows SFML's independent identity inverse.
      value.setScale(new V(0, 1));
      assert.equal(value.getInverseTransform(), inverse);
      assert.deepEqual(inverseView, sf.Transform.Identity.getMatrix());
    });

  test(`${name}: invalid arguments leave staged data unchanged`, () => {
    const value = make();
    const before = storage(value).slice();
    for (const method of [ 'setPosition', 'move', 'setScale',
      'scale', 'setOrigin' ]) {
      assert.throws(() => value[method](new sf.Vector2i(1, 2)), TypeError);
      assert.throws(() => value[method]({ x: 1, y: 2 }), TypeError);
    }
    for (const method of [ 'setRotation', 'rotate' ]) {
      assert.throws(() => value[method](90), TypeError);
      assert.throws(() => value[method](sf.radians(NaN)), RangeError);
      assert.throws(() => value[method](sf.radians(Infinity)), RangeError);
    }
    assert.deepEqual(storage(value), before);
  });

  test(`${name}: retained base handle keeps native object alive through GC`,
    async () => {
      let value = make();
      assign(value, [ 3, 4, 0, 2, 3, 1, 2 ]);
      const expected = native.readTransformable(handle(value));
      const retained = native.retainTransformable(handle(value));
      const reference = new WeakRef(value);
      value = null;
      await collect(() => reference.deref() === undefined &&
        native.transformableUseCount(retained) === 1);
      assert.deepEqual(native.readTransformable(retained), expected);
      native.setTransformableState(retained,
        new Float32Array([ 7, 8, 0, 1, 1, 0, 0 ]));
      assert.deepEqual(native.readTransformable(retained).position, [ 7, 8 ]);
    });

  test(`${name}: staged buffer alone retains native allocation`, async () => {
    let value = make();
    const data = storage(value);
    const reference = new WeakRef(value);
    const baseReference = new WeakRef(handle(value));
    value = null;
    await collect(() => reference.deref() === undefined &&
      baseReference.deref() === undefined);
    data[0] = 17;
    assert.equal(data[0], 17);
    assert.deepEqual([ ...data.subarray(3) ], [ 1, 1, 0, 0 ]);
  });
}

test('Transformable copies staged values from Sprite into independent storage',
  () => {
    const sprite = new sf.Sprite(image());
    assign(sprite, [ 4, 5, 0.5, 2, 3, 6, 7 ]);
    assert.equal(native.transformableSharesSprite(handle(sprite),
      sprite[graphicsNative]), true);
    const copy = new sf.Transformable(sprite);
    assert.deepEqual(storage(copy), storage(sprite));
    assert.notEqual(storage(copy).buffer, storage(sprite).buffer);
    copy.move(new V(1, 2));
    assert.deepEqual(xy(sprite.getPosition()), [ 4, 5 ]);
    const other = new sf.Transformable(copy);
    assert.deepEqual(storage(other), storage(copy));
    assert.throws(() => new sf.Transformable({}), TypeError);
    assert.throws(() => native.readTransformable(sprite[graphicsNative]),
      TypeError);
    assert.throws(() => native.readSpritePosition(handle(sprite)), TypeError);
  });

test('cached transforms outlive their resource and native owners', async () => {
  let value = new sf.Transformable();
  value.setPosition(new V(8, 9));
  const transform = value.getTransform();
  const inverse = value.getInverseTransform();
  const reference = new WeakRef(value);
  const baseReference = new WeakRef(handle(value));
  value = null;
  await collect(() => reference.deref() === undefined &&
    baseReference.deref() === undefined);
  assert.equal(transform.getMatrix()[12], 8);
  assert.equal(inverse.getMatrix()[13], -9);
});

const snapshots = [
  [ 8, 7, 0, 2, 1, 0, 0 ],
  [ 30, 15, sf.degrees(90).asRadians(), 3, 2, 1, 0.5 ],
  [ 45, 40, sf.degrees(225).asRadians(), -2, 1.5, 0, 1 ],
  [ 20, 40, sf.degrees(37).asRadians(), 1.2, 0.7, 1.5, 1 ],
].map(values => new Float32Array(values));

test('full snapshots match immediate SFML draws with exactly one native submit',
  t => {
    const texture = image();
    const sprite = new sf.Sprite(texture);
    const target = new sf.RenderTexture(new sf.Vector2u(64, 64));
    const expected = native.renderSpriteSnapshots(texture[graphicsNative],
      snapshots);
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
    for (const data of snapshots) {
      assign(sprite, data);
      target.draw(sprite);
    }
    assign(sprite, [ 60, 60, 0.7, 7, 5, 9, 3 ]);
    const latest = storage(sprite).slice();
    assert.deepEqual(calls, []);
    target.display();
    assert.deepEqual(calls, [ 'submitRenderTexture' ]);
    assert.deepEqual(native.readRenderTexturePixels(target[graphicsNative]),
      expected);
    compare(sprite, native.readTransformable(handle(sprite), false));
    assert.deepEqual(storage(sprite), latest);
  });

test('snapshots survive automatic flushes and separate targets', t => {
  const texture = image();
  const sprite = new sf.Sprite(texture);
  const first = new sf.RenderTexture(new sf.Vector2u(64, 64));
  const second = new sf.RenderTexture(new sf.Vector2u(64, 64));
  const submit = t.mock.method(native, 'submitRenderTexture',
    native.submitRenderTexture);
  const recorded = [];
  first.clear();
  second.clear();
  assign(sprite, snapshots[3]);
  second.draw(sprite);
  for (let i = 0; i < 4100; i++) {
    const data = snapshots[i % snapshots.length];
    assign(sprite, data);
    first.draw(sprite);
    recorded.push(data);
  }
  assert.equal(submit.mock.callCount(), 1);
  assert.equal(submit.mock.calls[0].arguments[1], 4096);
  assert.equal(submit.mock.calls[0].arguments[2], false);
  assign(sprite, [ 60, 60, 0.5, 4, 5, 2, 3 ]);
  second.display();
  first.display();
  assert.equal(submit.mock.callCount(), 3);
  assert.deepEqual(native.readRenderTexturePixels(first[graphicsNative]),
    native.renderSpriteSnapshots(texture[graphicsNative], recorded));
  assert.deepEqual(native.readRenderTexturePixels(second[graphicsNative]),
    native.renderSpriteSnapshots(texture[graphicsNative], [ snapshots[3] ]));
  compare(sprite, native.readTransformable(handle(sprite), false));
});
