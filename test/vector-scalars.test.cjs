'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate: nextTurn } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const storage = require('../dist/internal/value-storage');

const scalars = {
  f64: Float64Array,
  i8: Int8Array, u8: Uint8Array, i16: Int16Array, u16: Uint16Array,
  i64: BigInt64Array, u64: BigUint64Array,
};
const big = type => type === 'i64' || type === 'u64';
const coordinates = value => Array.from(
  value[storage.vector2Storage] ?? value[storage.vector3Storage]);
const handle = value =>
  value[storage.vector2Native] ?? value[storage.vector3Native];
const create = (dimension, type, values) =>
  new sf[`Vector${dimension}`](type, ...values);

function near(actual, expected) {
  if (Array.isArray(expected)) {
    expected.forEach((value, i) => near(actual[i], value));
  } else {
    const tolerance = 4e-6 * Math.max(1, Math.abs(expected));
    assert.ok(Math.abs(actual - expected) <= tolerance,
      `${actual} != ${expected}`);
  }
}

for (const dimension of [ 2, 3 ]) {
  const storageKey = storage[`vector${dimension}Storage`];
  const nativeKey = storage[`vector${dimension}Native`];
  for (const [ type, ArrayType ] of Object.entries(scalars)) {
    test(`Vector${dimension}<${type}> stores and aliases genuine SFML values`,
      async t => {
        const initial = Array.from({ length: dimension },
          (_, i) => (big(type) ? 9007199254740993n + BigInt(i) : 12 + i));
        const wrap = t.mock.method(native, `wrapVector${dimension}`);
        let vector = create(dimension, type, initial);
        const original = vector[storageKey];
        assert.ok(original instanceof ArrayType);
        assert.equal(original.byteLength,
          dimension * ArrayType.BYTES_PER_ELEMENT);
        assert.equal(wrap.mock.callCount(), 0);
        const value = vector[nativeKey];
        assert.equal(wrap.mock.callCount(), 1);
        assert.equal(vector[nativeKey], value);
        assert.equal(native.sameBackingStore(
          original.buffer, vector[storageKey].buffer), true);
        assert.deepEqual(native[`readVector${dimension}`](value), initial);
        const copy = new sf[`Vector${dimension}`](vector);
        native[`swapVector${dimension}`](value);
        const reversed = [ ...initial ];
        [ reversed[0], reversed[dimension - 1] ] =
          [ reversed[dimension - 1], reversed[0] ];
        assert.deepEqual(coordinates(vector), reversed);
        assert.deepEqual([ ...original ], reversed);
        assert.deepEqual(coordinates(copy), initial);
        original[0] = big(type) ? 42n : 42;
        assert.equal(vector.x, original[0]);
        const weak = new WeakRef(vector);
        vector = null;
        // Mock call stacks can retain the wrapper that requested its handle.
        wrap.mock.resetCalls();
        t.mock.reset();
        for (let i = 0; i < 6; i++) { await nextTurn(); global.gc(); }
        assert.equal(weak.deref(), undefined);
        assert.equal(native[`readVector${dimension}`](value)[0], original[0]);
        assert.throws(() => native[`wrapVector${dimension}`](
          type, new ArrayBuffer(original.byteLength - 1)), RangeError);
      });

    test(`Vector${dimension}<${type}> methods and operators match SFML`,
      () => {
        for (let sample = 0; sample < 24; sample++) {
          const values = Array.from({ length: dimension }, (_, i) => {
            const value = ((sample + i * 3) % 11 + 1) *
              (type.startsWith('i') && i % 2 ? -1 : 1);
            return big(type) ? BigInt(value)
              : type === 'f64' ? value / 7 : value;
          });
          const rhs = Array.from({ length: dimension }, (_, i) =>
            (big(type) ? BigInt(i + 2) : i + 2));
          const a = create(dimension, type, values);
          const b = create(dimension, type, rhs);
          const oracle = native[`evaluateVector${dimension}`](handle(a),
            handle(b));
          const scalar = big(type) ? 3n : 3;
          for (const name of [ 'add', 'subtract', 'negate',
            'multiply', 'divide' ]) {
            const operand = [ 'multiply', 'divide' ].includes(name)
              ? scalar : b;
            assert.deepEqual(coordinates(sf[name](a, operand)), oracle[name],
              name);
          }
          assert.deepEqual(coordinates(sf.multiply(scalar, a)),
            oracle.leftMultiply);
          for (const name of [ 'addAssign', 'subtractAssign',
            'multiplyAssign', 'divideAssign' ]) {
            const value = new sf[`Vector${dimension}`](a);
            const original = value[storageKey];
            const operand = name.startsWith('multiply') ||
              name.startsWith('divide') ? scalar : b;
            assert.equal(sf[name](value, operand), value);
            assert.equal(value[storageKey], original);
            assert.deepEqual(coordinates(value), oracle[name], name);
          }
          assert.equal(sf.equal(a, b), Boolean(oracle.equal));
          assert.equal(sf.notEqual(a, b), Boolean(oracle.notEqual));
          for (const method of [ 'lengthSquared', 'dot', 'cross',
            'componentWiseMul', 'componentWiseDiv' ]) {
            const result = a[method](b);
            assert.deepEqual(typeof result === 'object'
              ? coordinates(result) : result, oracle[method], method);
          }
          if (dimension === 2) {
            assert.deepEqual(coordinates(a.perpendicular()),
              oracle.perpendicular);
          }
          if (type === 'f64') {
            assert.equal(a.length(), oracle.length);
            assert.deepEqual(coordinates(a.normalized()), oracle.normalized);
            if (dimension === 2) {
              near(a.angle().asRadians(), oracle.angle);
              near(a.angleTo(b).asRadians(), oracle.angleTo);
              near(coordinates(a.rotatedBy(sf.degrees(37))), oracle.rotatedBy);
              near(coordinates(new sf.Vector2('f64', a.x, sf.degrees(37))),
                oracle.polar);
              assert.deepEqual(coordinates(a.projectedOnto(b)),
                oracle.projectedOnto);
            }
          }
        }
      });

    test(`Vector${dimension}<${type}> math stays in JS and validates operands`,
      t => {
        for (const name of [ 'createVector2', 'wrapVector2',
          'createVector3', 'wrapVector3' ]) {
          t.mock.method(native, name,
            () => assert.fail('Unexpected native call'));
        }
        const one = big(type) ? 1n : 1;
        const zero = big(type) ? 0n : 0;
        const a = create(dimension, type, Array(dimension).fill(one));
        const b = create(dimension, type, Array(dimension).fill(zero));
        sf.add(a, a);
        sf.multiply(a, one);
        assert.equal(sf.addAssign(a, a), a);
        assert.equal(sf.subtractAssign(a, a), a);
        assert.deepEqual(coordinates(a), Array(dimension).fill(zero));
        assert.throws(() => sf.divideAssign(a, zero), RangeError);
        assert.throws(() => a.componentWiseDiv(b), RangeError);
        assert.throws(() => sf.multiply(a, big(type) ? 1 : 1n), TypeError);
        assert.throws(() => { a.x = big(type) ? 1 : 1n; }, TypeError);
        const mixed = create(dimension, type === 'f64' ? 'f32' : 'f64', []);
        for (const name of [ 'add', 'addAssign', 'equal', 'notEqual' ]) {
          assert.throws(() => sf[name](a, mixed), TypeError);
        }
        assert.throws(() => a.dot(mixed), TypeError);
        assert.throws(() => sf.addAssign(Object.freeze(a), b), TypeError);
        if (type !== 'f64') {
          assert.throws(() => b.length(), TypeError);
          assert.throws(() => b.normalized(), TypeError);
        } else {
          assert.throws(() => b.normalized(), RangeError);
        }
      });
  }
}

test('int64 and uint64 arithmetic preserves values beyond Number precision',
  () => {
    const value = 9007199254740993n;
    const a = new sf.Vector2('i64', value, -value);
    assert.deepEqual(coordinates(sf.add(a, a)), [ 2n * value, -2n * value ]);
    assert.deepEqual(coordinates(sf.divide(a, 2n)),
      [ 4503599627370496n, -4503599627370496n ]);
    const u = new sf.Vector3('u64', 2n ** 64n - 1n, 0n, 1n);
    assert.deepEqual(coordinates(sf.add(u, new sf.Vector3('u64', 1n, 1n, 1n))),
      [ 0n, 1n, 2n ]);
    const b = new sf.Vector3('u64', 3n, 1n, 2n);
    const oracle = native.evaluateVector3(handle(u), handle(b));
    assert.equal(u.dot(b), oracle.dot);
    assert.equal(u.lengthSquared(), oracle.lengthSquared);
    assert.deepEqual(coordinates(u.cross(b)), oracle.cross);
  });

test('vector scalar conversions match C++ within its defined domain', () => {
  const types = [ 'i32', 'u32', 'f32', ...Object.keys(scalars) ];
  for (const dimension of [ 2, 3 ]) {
    for (const from of types) {
      const a = create(dimension, from,
        Array.from({ length: dimension }, (_, i) =>
          (big(from) ? BigInt(i + 2) : i + 2.75)));
      for (const to of types) {
        const converted = new sf[`Vector${dimension}`](to, a);
        assert.deepEqual(coordinates(converted),
          native[`convertVector${dimension}`](handle(a), to),
          `${from} -> ${to}`);
      }
      const boolean = new sf.Glsl[`Bvec${dimension}`](a);
      assert.deepEqual(Array.from({ length: dimension }, (_, i) =>
        Number(boolean[[ 'x', 'y', 'z' ][i]])),
      native[`convertVector${dimension}`](handle(a), 'bool'));
    }
    const zero = create(dimension, 'u64', Array(dimension).fill(0n));
    assert.equal(new sf.Glsl[`Bvec${dimension}`](zero).x, false);
  }
  const source = new sf.Vector2('u64', 9007199254740993n, 2n ** 64n - 1n);
  for (const to of [ 'i8', 'u8', 'i16', 'u16', 'i32', 'u32', 'i64', 'f64' ]) {
    assert.deepEqual(coordinates(new sf.Vector2(to, source)),
      native.convertVector2(handle(source), to), to);
  }
  // Values just above a float32 midpoint: direct int64 -> float is required.
  const midpoint = 2n ** 60n + 2n ** 36n + 1n;
  const signed = new sf.Vector2('i64', midpoint, -midpoint);
  assert.deepEqual(coordinates(new sf.Vector2f(signed)),
    native.convertVector2(handle(signed), 'f32'));
});

test('f64 preserves precision, negative zero and NaN payloads during wrapping',
  () => {
    const a = new sf.Vector2('f64', 16777217, -0);
    assert.equal(a.x, 16777217);
    assert.equal(Object.is(a.y, -0), true);
    const original = a[storage.vector2Storage].buffer;
    const bits = new BigUint64Array(original);
    bits[0] = 0x7ff0000000004321n;
    const copied = new sf.Vector2(a);
    assert.equal(new BigUint64Array(copied[storage.vector2Storage].buffer)[0],
      bits[0]);
    void handle(a);
    const mapped = a[storage.vector2Storage].buffer;
    assert.equal(native.sameBackingStore(original, mapped), true);
    assert.equal(new BigUint64Array(mapped)[0], 0x7ff0000000004321n);
    const transferred = structuredClone(original, { transfer: [ original ] });
    assert.equal(native.sameBackingStore(transferred, mapped), true);
    new Float64Array(transferred).set([ 1.25, 2.5 ]);
    assert.deepEqual(native.readVector2(handle(a)), [ 1.25, 2.5 ]);
  });

test('new vector scalar types do not bypass graphics API type requirements',
  () => {
    const transform = new sf.Transformable();
    const rect = new sf.FloatRect();
    for (const type of Object.keys(scalars)) {
      const vector = new sf.Vector2(type);
      assert.throws(() => transform.setPosition(vector), TypeError);
      assert.throws(() => new sf.Vertex(vector), TypeError);
      assert.throws(() => rect.contains(vector), TypeError);
    }
  });
