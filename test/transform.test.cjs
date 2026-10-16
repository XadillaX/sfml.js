'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  transformStorage: storage, transformNative: handle,
  angleNative, rectNative, vector2Native,
} = require('../dist/internal/value-storage');
const { Transform: T, Vector2f: V } = sf;

const identity = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ];
const xyz = value => [ value.x, value.y ];
const rectangle = value => ({
  position: xyz(value.position), size: xyz(value.size),
});

function inputs(angle = 37) {
  return {
    point: new V(1.25, -2.75),
    rect: new sf.FloatRect(new V(-1.25, 2.75), new V(5.5, -3.125)),
    angle: sf.degrees(angle), factors: new V(0.75, -1.25),
    center: new V(-3.75, 2.125),
  };
}

function oracle(a, b, values) {
  const { point, rect, angle, factors, center } = values;
  return native.evaluateTransform(
    a[handle], b[handle], point[vector2Native], rect[rectNative],
    angle[angleNative], factors[vector2Native], center[vector2Native]);
}

function close(actual, expected) {
  assert.equal(actual.length, expected.length);
  for (let i = 0; i < actual.length; i++) {
    if (Object.is(actual[i], expected[i])) continue;
    // rotate() is in the prebuilt SFML library; libm/FMA may differ by ulps.
    assert.ok(Number.isFinite(actual[i]) && Number.isFinite(expected[i]) &&
      Math.abs(actual[i] - expected[i]) <=
        2e-6 * Math.max(1, Math.abs(expected[i])),
    `matrix[${i}]: ${actual[i]} != ${expected[i]}`);
  }
}

function compare(a, b, values = inputs()) {
  const expected = oracle(a, b, values);
  assert.deepEqual(a.getMatrix(), expected.matrix);
  assert.deepEqual(a.getInverse().getMatrix(), expected.inverse);
  assert.deepEqual(xyz(a.transformPoint(values.point)), expected.point);
  assert.deepEqual(xyz(sf.multiply(a, values.point)), expected.multiplyPoint);
  assert.deepEqual(rectangle(a.transformRect(values.rect)), expected.rectangle);
  assert.deepEqual(sf.multiply(a, b).getMatrix(), expected.multiply);
  let copy = new T(a);
  assert.equal(copy.combine(b), copy);
  assert.deepEqual(copy.getMatrix(), expected.combine);
  copy = new T(a);
  assert.equal(sf.multiplyAssign(copy, b), copy);
  assert.deepEqual(copy.getMatrix(), expected.multiplyAssign);
  copy = new T(a);
  assert.equal(copy.combine(copy), copy);
  assert.deepEqual(copy.getMatrix(), expected.selfCombine);
  assert.deepEqual(new T(a).translate(values.point).getMatrix(),
    expected.translate);
  assert.deepEqual(new T(a).scale(values.factors).getMatrix(), expected.scale);
  assert.deepEqual(new T(a).scale(values.factors, values.center).getMatrix(),
    expected.scaleCenter);
  close(new T(a).rotate(values.angle).getMatrix(), expected.rotate);
  close(new T(a).rotate(values.angle, values.center).getMatrix(),
    expected.rotateCenter);
  assert.equal(sf.equal(a, b), Boolean(expected.equal));
  assert.equal(sf.notEqual(a, b), Boolean(expected.notEqual));
}

test('Transform constructor maps 9 row-major arguments into 16 native floats',
  () => {
    const value = new T(1, 2, 3, 4, 5, 6, 7, 8, 9);
    assert.deepEqual(value.getMatrix(),
      [ 1, 4, 0, 7, 2, 5, 0, 8, 0, 0, 1, 0, 3, 6, 0, 9 ]);
    assert.equal(value[storage].byteLength, 64);
    const initial = native.createTransform();
    assert.equal(initial.buffer.byteLength, 64);
    assert.deepEqual(native.readTransform(initial.handle), identity);
    assert.deepEqual(new T().getMatrix(), identity);
    const copy = new T(value);
    copy.translate(new V(3, 4));
    assert.notDeepEqual(copy.getMatrix(), value.getMatrix());
    assert.notEqual(copy[storage].buffer, value[storage].buffer);
  });

test('Transform preserves float bits through copy and one-time native wrapping',
  t => {
    const spy = t.mock.method(native, 'wrapTransform', native.wrapTransform);
    const source = new T();
    const old = source[storage];
    const bits = new Uint32Array(old.buffer);
    bits[0] = 0x7fa12345;
    bits[12] = 0x80000000;
    const copy = new T(source);
    assert.deepEqual([ ...new Uint32Array(copy[storage].buffer) ], [ ...bits ]);
    source.getMatrix();
    assert.equal(spy.mock.callCount(), 0);
    const nativeHandle = source[handle];
    assert.equal(source[handle], nativeHandle);
    assert.equal(spy.mock.callCount(), 1);
    assert.equal(native.sameBackingStore(old.buffer,
      source[storage].buffer), true);
    assert.notEqual(old.buffer, source[storage].buffer);
    assert.equal(new Uint32Array(source[storage].buffer)[0], 0x7fa12345);
    assert.equal(new Uint32Array(source[storage].buffer)[12], 0x80000000);
  });

test('getMatrix is a cached readonly live view across JS and native writes',
  () => {
    const value = new T();
    const matrix = value.getMatrix();
    assert.equal(value.getMatrix(), matrix);
    assert.ok(Object.isFrozen(matrix));
    assert.throws(() => { matrix[0] = 7; }, TypeError);
    assert.throws(() => matrix.fill(0), TypeError);
    assert.throws(() => Object.defineProperty(matrix, 0, { value: 7 }),
      TypeError);
    const copy = matrix.slice();
    copy[0] = 7;
    assert.equal(matrix[0], 1);
    const old = value[storage];
    value.translate(new V(2, 3));
    assert.equal(matrix[12], 2);
    native.translateTransform(value[handle], 4, 5);
    assert.equal(matrix[12], 6);
    assert.equal(matrix[13], 8);
    old[0] = 2;
    assert.equal(matrix[0], 2);
    value.translate(new V(1, 1));
    assert.equal(matrix[12], 8);
    assert.equal(old[12], 8);
    assert.equal(value.getMatrix(), matrix);
  });

test('Transform.Identity blocks mutations but permits lazy reads and copies',
  () => {
    const value = T.Identity;
    assert.ok(Object.isFrozen(value));
    assert.deepEqual(value.getMatrix(), identity);
    const nativeHandle = value[handle];
    assert.equal(value[handle], nativeHandle);
    assert.deepEqual(native.readTransform(nativeHandle), identity);
    for (const mutate of [
      () => value.translate(new V(1, 2)),
      () => value.rotate(sf.degrees(45)),
      () => value.scale(new V(2, 3)),
      () => value.combine(new T()),
      () => sf.multiplyAssign(value, new T()),
      () => { value.getMatrix()[0] = 2; },
    ]) assert.throws(mutate, TypeError);
    new T(value).translate(new V(1, 2));
    assert.deepEqual(value.getMatrix(), identity);
  });

test('Transform core operations agree exactly with SFML for general matrices',
  () => {
    const fixtures = [
      [],
      [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ],
      [ 1, 0, 8, 0, 1, -5, 0, 0, 1 ],
      [ 0.1, 0.2, -0.3, -0.4, 0.5, 0.6, 0.7, -0.8, 0.9 ],
      [ -2, 0.125, 1.5, -0.25, 3, -4, 0, 0, 1 ],
    ];
    for (const a of fixtures) {
      for (const b of fixtures) compare(new T(...a), new T(...b));
    }
    let seed = 123456;
    const matrix = () => Array.from({ length: 9 }, () => {
      seed = (seed * 1664525 + 1013904223) % 2 ** 32;
      return (seed / 2 ** 32 - 0.5) * 10;
    });
    for (let n = 0; n < 40; n++) {
      compare(new T(...matrix()), new T(...matrix()));
    }
  });

test('Transform multiplication order, center transforms and in-place aliases',
  () => {
    const value = new T().translate(new V(10, 20)).scale(new V(2, 3));
    assert.deepEqual(xyz(value.transformPoint(new V(1, 2))), [ 12, 26 ]);
    const center = new V(4, 5);
    close(xyz(new T().rotate(sf.degrees(90), center).transformPoint(center)),
      xyz(center));
    assert.deepEqual(xyz(new T().scale(new V(-2, 0), center)
      .transformPoint(center)), xyz(center));
    for (const angle of [ 0, -0, 90, 180, -720.25, 10000000 ]) {
      compare(value, new T(value), inputs(angle));
    }
  });

test('singular matrices return identity; tiny nonzero determinants count',
  () => {
    const singular = new T(1, 2, 3, 2, 4, 6, 0, 0, 1).getInverse();
    assert.deepEqual(singular.getMatrix(), identity);
    assert.notEqual(singular, T.Identity);
    singular.translate(new V(1, 2));
    assert.deepEqual(T.Identity.getMatrix(), identity);
    const tiny = new T(1e-30, 0, 0, 0, 1, 0, 0, 0, 1);
    compare(tiny, new T());
    assert.notDeepEqual(tiny.getInverse().getMatrix(), identity);
  });

test('negative rectangles, non-affine rows, NaN and signed zero follow SFML',
  () => {
    const values = inputs(0);
    values.rect = new sf.FloatRect(new V(-0, 3), new V(-5, -0));
    compare(new T(), new T(), values);
    compare(new T(1, 0, 0, 0, 1, 0, 2, 3, 4), new T(), values);
    assert.deepEqual(xyz(new T(1, 0, 0, 0, 1, 0, 2, 3, 4)
      .transformPoint(new V(1, 2))), [ 1, 2 ]);
    values.rect = new sf.FloatRect(new V(1, 2), new V(NaN, 3));
    compare(new T(), new T(), values);
    compare(new T(NaN, 0, 0, 0, 1, 0, 0, 0, 1), new T(), values);
    compare(new T(Infinity, 0, 0, 0, 1, 0, 0, 0, 1), new T(), values);
  });

test('Transform equality uses the nine SFML entries and combine resets padding',
  () => {
    const a = new T();
    const b = new T();
    a[storage][2] = 42;
    a[storage][10] = 99;
    assert.equal(sf.equal(a, b), true);
    assert.equal(oracle(a, b, inputs()).equal, 1);
    a.combine(b);
    assert.deepEqual(a.getMatrix(), identity);
    a[storage][15] = 2;
    assert.equal(sf.equal(a, b), false);
  });

test('Transform construction and math never request native handles', t => {
  for (const [ name, fn ] of Object.entries(native)) {
    if (typeof fn === 'function') {
      t.mock.method(native, name, () => assert.fail(`Unexpected NAN: ${name}`));
    }
  }
  const a = new T().translate(new V(1, 2))
    .rotate(sf.degrees(37))
    .scale(new V(2, 3));
  a.getMatrix();
  a.getInverse();
  a.transformPoint(new V(1, 2));
  a.transformRect(new sf.FloatRect(new V(1, 2), new V(-3, 4)));
  sf.multiplyAssign(a, T.Identity);
  sf.multiply(a, new V(2, 3));
  sf.multiply(a, a);
  sf.equal(a, new T(a));
});

async function collect(done) {
  for (let i = 0; i < 60; i++) {
    await setImmediate();
    global.gc();
    if (done()) return;
  }
  assert.fail('Expected Transform wrappers and backing-store references to GC');
}

test('native Transform survives all JS views being collected', async () => {
  let value = new T().translate(new V(4, 5));
  const expected = Array.from(value.getMatrix());
  const reference = new WeakRef(value);
  const retained = native.retainTransform(value[handle]);
  value = null;
  await collect(() => reference.deref() === undefined &&
    native.transformUseCount(retained) === 1);
  assert.deepEqual(native.readTransform(retained), expected);
  native.translateTransform(retained, 1, 2);
  assert.equal(native.readTransform(retained)[12], 5);
});

test('readonly matrix views outlive both JS and native wrappers', async () => {
  let value = new T();
  const matrix = value.getMatrix();
  let retained = value[handle];
  const reference = new WeakRef(value);
  const nativeReference = new WeakRef(retained);
  value = null;
  await collect(() => reference.deref() === undefined);
  native.translateTransform(retained, 3, 4);
  assert.equal(matrix[12], 3);
  retained = null;
  await collect(() => nativeReference.deref() === undefined);
  assert.equal(matrix[13], 4);
});

test('Transform validates types, operators and native input buffers', () => {
  assert.throws(() => new T(1, 2), TypeError);
  assert.throws(() => new T(new V()), TypeError);
  const value = new T();
  assert.throws(() => value.translate(new sf.Vector2i()), TypeError);
  assert.throws(() => value.transformRect(new sf.IntRect()), TypeError);
  assert.throws(() => value.rotate(45), TypeError);
  assert.throws(() => value.scale(new V(), new sf.Vector2u()), TypeError);
  for (const operation of [
    () => sf.multiply(value, 2), () => sf.multiply(new V(), value),
    () => sf.multiplyAssign(value, new V()), () => sf.add(value, value),
    () => sf.equal(value, new V()), () => sf.divide(value, value),
    () => sf.negate(value), () => sf.less(value, value),
  ]) assert.throws(operation, TypeError);
  assert.throws(() => native.readTransform(sf.Angle.Zero[angleNative]),
    TypeError);
  assert.throws(() => native.wrapTransform(new ArrayBuffer(60)), RangeError);
  assert.throws(() => native.wrapTransform(new SharedArrayBuffer(64)),
    TypeError);
  const buffer = new ArrayBuffer(64);
  structuredClone(buffer, { transfer: [ buffer ] });
  assert.throws(() => native.wrapTransform(buffer), RangeError);
});
