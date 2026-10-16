'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { glslNative } = require('../dist/internal/glsl-value');
const { transformNative, transformStorage } =
  require('../dist/internal/value-storage');

async function collect(done) {
  for (let i = 0; i < 60; i++) {
    await setImmediate();
    global.gc();
    if (done()) return;
  }
  assert.fail('Expected matrix wrappers and backing-store references to GC');
}

for (const dimension of [ 3, 4 ]) {
  const name = `Mat${dimension}`;
  const prefix = `mat${dimension}`;
  const Matrix = sf.Glsl[name];
  const length = dimension * dimension;
  const data = Array.from({ length }, (_, i) => (i - 3) / 7);
  const identity = Array.from({ length }, (_, i) =>
    Number(i % (dimension + 1) === 0));

  test(`${name}: column-major array construction and independent copies`,
    () => {
      const source = new Float32Array(length + 2);
      source.set(data, 1);
      const input = source.subarray(1, length + 1);
      const value = new Matrix(input);
      const expected = native[`${prefix}FromArray`](input);
      assert.ok(value.array instanceof Float32Array);
      assert.equal(value.array.byteLength, length * 4);
      assert.deepEqual([ ...value.array ],
        native[`read${name}`](expected.handle));
      assert.deepEqual([ ...new Matrix(data).array ], [ ...value.array ]);
      const like = { ...input, length };
      assert.deepEqual([ ...new Matrix(like).array ], [ ...value.array ]);
      const copy = new Matrix(value);
      source.fill(42);
      value.array[0] = 99;
      assert.equal(copy.array[0], Math.fround(data[0]));
      assert.notEqual(copy.array.buffer, value.array.buffer);
      assert.deepEqual([ ...new Matrix(sf.Transform.Identity).array ],
        identity);
    });

  test(`${name}: Transform conversion agrees with actual SFML constructors`,
    () => {
      const source = new sf.Transform(1, 2, 3, 4, 5, 6, 7, 8, 9);
      const matrix = new Matrix(source);
      assert.deepEqual([ ...matrix.array ], dimension === 3
        ? [ 1, 4, 7, 2, 5, 8, 3, 6, 9 ] : [ ...source.getMatrix() ]);
      const bits = new Uint32Array(source[transformStorage].buffer);
      bits[0] = 0x7fa12345;
      bits[3] = 0x80000000;
      bits[5] = 0x7fc54321;
      const converted = new Matrix(source);
      const cpp = native[`${prefix}FromTransform`](source[transformNative]);
      assert.deepEqual([ ...new Uint32Array(converted.array.buffer) ],
        [ ...new Uint32Array(cpp.buffer) ]);
      source[transformStorage].fill(42);
      assert.equal(matrix.array[0], 1);
    });

  test(`${name}: arrays and copies retain float32 bits through lazy wrapping`,
    t => {
      const spy = t.mock.method(native, `wrap${name}`, native[`wrap${name}`]);
      const input = new Float32Array(length);
      const bits = new Uint32Array(input.buffer);
      bits.set([ 0x7fa12345, 0x80000000, 0x7fc54321, 0x7f800000 ]);
      const value = new Matrix(input);
      const copy = new Matrix(value);
      copy.array = input;
      const old = value.array;
      assert.equal(spy.mock.callCount(), 0);
      assert.deepEqual([ ...new Uint32Array(copy.array.buffer) ], [ ...bits ]);
      const handle = value[glslNative];
      assert.equal(value[glslNative], handle);
      assert.equal(spy.mock.callCount(), 1);
      assert.notEqual(value.array.buffer, old.buffer);
      assert.equal(native.sameBackingStore(old.buffer, value.array.buffer),
        true);
      assert.deepEqual([ ...new Uint32Array(value.array.buffer) ], [ ...bits ]);
      assert.deepEqual([ ...new Uint32Array(old.buffer) ], [ ...bits ]);
      const cpp = native[`${prefix}FromArray`](input);
      assert.deepEqual([ ...new Uint32Array(cpp.buffer) ], [ ...bits ]);
    });

  test(`${name}: array assignment and native writes keep prior views live`,
    () => {
      const value = new Matrix(data);
      const old = value.array;
      const handle = value[glslNative];
      const current = value.array;
      value.array = identity;
      assert.equal(value.array, current);
      assert.deepEqual([ ...old ], identity);
      old[1] = 0.1;
      assert.equal(native[`read${name}`](handle)[1], Math.fround(0.1));
      native[`set${name}Element`](handle, length - 1, -2.5);
      assert.equal(old[length - 1], -2.5);
      assert.equal(value.array[length - 1], -2.5);
      value.array = old;
      value.array = current;
      assert.deepEqual([ ...value.array ], native[`read${name}`](handle));
      const before = value.array.slice();
      for (const source of [
        data.slice(1), [ ...data, 0 ], { ...data, length, 2: 'x' },
      ]) {
        assert.throws(() => { value.array = source; });
        assert.deepEqual(value.array, before);
        assert.equal(value.array, current);
      }
    });

  test(`${name}: native owner survives collection of all JS matrix views`,
    async () => {
      let value = new Matrix(data);
      const expected = [ ...value.array ];
      const reference = new WeakRef(value);
      const retained = native[`retain${name}`](value[glslNative]);
      value = null;
      await collect(() => reference.deref() === undefined &&
        native[`${prefix}UseCount`](retained) === 1);
      assert.deepEqual(native[`read${name}`](retained), expected);
      native[`set${name}Element`](retained, 0, 17);
      assert.equal(native[`read${name}`](retained)[0], 17);
    });

  test(`${name}: old array survives wrapper collection and can be rewrapped`,
    async () => {
      let value = new Matrix(data);
      const old = value.array;
      const reference = new WeakRef(value);
      const nativeReference = new WeakRef(value[glslNative]);
      value = null;
      await collect(() => reference.deref() === undefined &&
        nativeReference.deref() === undefined);
      old[0] = -3;
      const remapped = native[`wrap${name}`](old.buffer);
      assert.deepEqual(native[`read${name}`](remapped.handle), [ ...old ]);
      native[`set${name}Element`](remapped.handle, 1, 42);
      assert.equal(old[1], 42);
    });

  test(`${name}: invalid constructors, operators, buffers and handles`,
    () => {
      for (const input of [
        undefined, null, 1, '123456789', {}, new sf.Glsl.Vec3(),
        new sf.Glsl[dimension === 3 ? 'Mat4' : 'Mat3'](sf.Transform.Identity),
        Array(length - 1).fill(1), Array(length + 1).fill(1),
        Array(length), Array(length).fill(true), new BigInt64Array(length),
      ]) assert.throws(() => new Matrix(input));
      const value = new Matrix(data);
      for (const operation of [
        'add', 'subtract', 'multiply', 'divide', 'negate', 'equal', 'notEqual',
        'addAssign', 'multiplyAssign',
      ]) assert.throws(() => sf[operation](value, value), TypeError);
      assert.equal(value.native, undefined);
      assert.throws(() => native[`read${name}`](
        new sf.Transform()[transformNative]), TypeError);
      const other = new sf.Glsl[dimension === 3 ? 'Mat4' : 'Mat3'](
        sf.Transform.Identity);
      assert.throws(() => native[`read${name}`](other[glslNative]), TypeError);
      for (const buffer of [
        new ArrayBuffer(length * 4 - 4), new ArrayBuffer(length * 4 + 4),
      ]) assert.throws(() => native[`wrap${name}`](buffer), RangeError);
      assert.throws(() => native[`wrap${name}`](
        new SharedArrayBuffer(length * 4)), TypeError);
      const detached = new ArrayBuffer(length * 4);
      structuredClone(detached, { transfer: [ detached ] });
      assert.throws(() => native[`wrap${name}`](detached), RangeError);
      const resizable = new ArrayBuffer(length * 4,
        { maxByteLength: length * 8 });
      if (resizable.resizable) {
        assert.throws(() => native[`wrap${name}`](resizable), TypeError);
      }
    });
}

test('GLSL matrix construction and array operations never enter NAN', t => {
  for (const [ name, fn ] of Object.entries(native)) {
    if (typeof fn === 'function') {
      t.mock.method(native, name, () => assert.fail(`Unexpected NAN: ${name}`));
    }
  }
  for (const Matrix of [ sf.Glsl.Mat3, sf.Glsl.Mat4 ]) {
    const value = new Matrix(new sf.Transform());
    const copy = new Matrix(value);
    copy.array[0] = 0.25;
    value.array = copy.array;
    value.array.fill(0);
    assert.equal(value.array[0], 0);
  }
});
