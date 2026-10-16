'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const { Glsl } = sf;
const native = require('../build/Release/sfml.node');
const { glslStorage, glslNative } = require('../dist/internal/glsl-value');
const { colorNative, vector2Native, vector3Native } =
  require('../dist/internal/value-storage');

const fields = [ 'x', 'y', 'z', 'w' ];
const coordinates = value =>
  fields.filter(field => field in value).map(field => Number(value[field]));
const cases = [
  [ 'Bvec2', 2, [ true, false ], 'bool', 2 ],
  [ 'Bvec3', 3, [ true, false, false ], 'bool', 3 ],
  [ 'Vec4', 4, [ 1.25, -2.5, 3.75, -0 ], 'f32', 16 ],
  [ 'Ivec4', 4, [ 2, -4, 6, 8 ], 'i32', 16 ],
  [ 'Bvec4', 4, [ true, false, true, false ], 'bool', 4 ],
];

test('Glsl numeric aliases are the existing constructors and types', () => {
  for (const [ alias, name ] of [
    [ 'Vec2', 'Vector2f' ], [ 'Ivec2', 'Vector2i' ],
    [ 'Vec3', 'Vector3f' ], [ 'Ivec3', 'Vector3i' ],
  ]) {
    assert.equal(Glsl[alias], sf[name]);
    const value = new Glsl[alias]();
    assert.ok(sf.add(value, value) instanceof sf[name]);
  }
});

for (const [ name, dimension, args, type, bytes ] of cases) {
  const Constructor = Glsl[name];
  const key = `Vector${dimension}`;
  test(`${name}: defaults, copy, canonical storage and lazy native roundtrip`,
    t => {
      const spy = t.mock.method(native, `wrap${key}`, native[`wrap${key}`]);
      const zero = new Constructor();
      assert.deepEqual(coordinates(zero), Array(dimension).fill(0));
      const cpp = native[`create${key}`](type);
      assert.equal(cpp.buffer.byteLength, bytes);
      assert.deepEqual(coordinates(zero), native[`read${key}`](cpp.handle));
      const value = new Constructor(...args);
      const copy = new Constructor(value);
      assert.deepEqual(coordinates(copy), coordinates(value));
      value.x = type === 'bool' ? false : 9;
      assert.notEqual(value.x, copy.x);
      const old = copy[glslStorage];
      assert.equal(old.byteLength, bytes);
      assert.equal(spy.mock.callCount(), 0);
      const handle = copy[glslNative];
      assert.equal(copy[glslNative], handle);
      assert.equal(spy.mock.callCount(), 1);
      assert.equal(native.sameBackingStore(
        old.buffer, copy[glslStorage].buffer), true);
      assert.notEqual(old.buffer, copy[glslStorage].buffer);
      assert.deepEqual(native[`read${key}`](handle), coordinates(copy));
      old[0] = 0;
      assert.equal(Number(copy.x), 0);
      copy.x = type === 'bool' ? true : 7;
      assert.equal(old[0], type === 'bool' ? 1 : 7);
      native[`swap${key}`](handle);
      assert.deepEqual(native[`read${key}`](handle), coordinates(copy));
      assert.deepEqual([ ...old ], [ ...copy[glslStorage] ]);
      assert.equal(typeof copy.x, type === 'bool' ? 'boolean' : 'number');
    });

  test(`${name}: native owner survives JS wrapper and views`, async () => {
    let value = new Constructor(...args);
    const before = coordinates(value);
    const reference = new WeakRef(value);
    const handle = native[`retain${key}`](value[glslNative]);
    value = null;
    await collect(() => reference.deref() === undefined &&
      native[`vector${dimension}UseCount`](handle) === 1);
    assert.deepEqual(native[`read${key}`](handle), before);
    native[`swap${key}`](handle);
  });

  test(`${name}: old JS view keeps storage alive after native wrapper GC`,
    async () => {
      let value = new Constructor(...args);
      const old = value[glslStorage];
      const reference = new WeakRef(value[glslNative]);
      value = null;
      await collect(() => reference.deref() === undefined);
      old[0] = 1;
      const remapped = native[`wrap${key}`](type, old.buffer);
      assert.deepEqual(native[`read${key}`](remapped.handle), [ ...old ]);
    });
}

async function collect(done) {
  for (let i = 0; i < 60; i++) {
    await setImmediate();
    global.gc();
    if (done()) return;
  }
  assert.fail('Expected wrappers and backing-store references to collect');
}

for (const dimension of [ 2, 3, 4 ]) {
  const names = [ `Vec${dimension}`, `Ivec${dimension}`, `Bvec${dimension}` ];
  test(`Glsl ${dimension}D: all scalar conversions agree with C++`, () => {
    for (const from of names) {
      const args = [ 0, 0.5, 3.25, 1 ].slice(0, dimension)
        .map(value => (from[0] === 'B' ? value !== 0 : value));
      const source = new Glsl[from](...args);
      const key = from[0] === 'B' || dimension === 4 ? glslNative
        : dimension === 2 ? vector2Native : vector3Native;
      for (const to of names) {
        const converted = new Glsl[to](source);
        const expected = native[`convertVector${dimension}`](
          source[key], converted.scalarType);
        assert.deepEqual(coordinates(converted), expected, `${from} -> ${to}`);
      }
    }
    if (dimension !== 4) {
      const bool = new Glsl[`Bvec${dimension}`](
        ...Array(dimension).fill(true));
      const unsigned = new sf[`Vector${dimension}u`](bool);
      assert.deepEqual(coordinates(unsigned), Array(dimension).fill(1));
      assert.deepEqual(coordinates(new Glsl[`Bvec${dimension}`](unsigned)),
        Array(dimension).fill(1));
    }
  });

  test(`Glsl ${dimension}D: NaN, infinity and signed zero convert like C++`,
    () => {
      const floats = new Glsl[`Vec${dimension}`](
        ...[ NaN, -0, Infinity, -Infinity ].slice(0, dimension));
      const key = dimension === 4 ? glslNative
        : dimension === 2 ? vector2Native : vector3Native;
      const bool = new Glsl[`Bvec${dimension}`](floats);
      assert.equal(bool.x, true);
      assert.equal(bool.y, false);
      assert.deepEqual(coordinates(bool),
        native[`convertVector${dimension}`](floats[key], 'bool'));
    });

  test(`Glsl ${dimension}D: bool wrapper rejects noncanonical bytes`, () => {
    const data = new Uint8Array(dimension);
    data[dimension - 1] = 2;
    assert.throws(() => native[`wrapVector${dimension}`]('bool', data.buffer),
      /Boolean storage/);
    assert.throws(() => native[`wrapVector${dimension}`]('bool',
      new ArrayBuffer(dimension + 1)), RangeError);
    assert.throws(() => native[`wrapVector${dimension}`]('bool',
      new SharedArrayBuffer(dimension)), TypeError);
  });
}

test('Vec4 and Ivec4 Color conversions agree with C++ for all channel values',
  () => {
    for (let i = 0; i <= 255; i++) {
      const color = new sf.Color(i, 255 - i, i, 255);
      const expected = native.colorVector4(color[colorNative]);
      for (const name of [ 'Vec4', 'Ivec4' ]) {
        const vector = new Glsl[name](color);
        assert.deepEqual(coordinates(vector), expected[name]);
        color.r = 0;
        assert.equal(vector.x, expected[name][0]);
        color.r = i;
      }
    }
    assert.deepEqual(coordinates(new Glsl.Vec4(sf.Color.Transparent)),
      [ 0, 0, 0, 0 ]);
    assert.throws(() => new Glsl.Bvec4(sf.Color.White), TypeError);
  });

test('Vec4 copies and lazy wrapping preserve float32 bit patterns', () => {
  const source = new Glsl.Vec4();
  const bits = new Uint32Array(source[glslStorage].buffer);
  bits.set([ 0x7fa12345, 0x80000000, 0x7fc54321, 0x3eaaaaab ]);
  const copy = new Glsl.Vec4(source);
  const copyBits = new Uint32Array(copy[glslStorage].buffer);
  assert.deepEqual([ ...copyBits ], [ ...bits ]);
  assert.ok(source[glslNative]);
  assert.ok(copy[glslNative]);
  assert.deepEqual([ ...copyBits ], [ ...bits ]);
  copy.x = 0.1;
  assert.equal(copy.x, Math.fround(0.1));
  assert.equal(bits[0], 0x7fa12345);
  assert.ok(Object.is(copy.y, -0));
  const integers = new Glsl.Ivec4(-1.75, 1.75, -2147483648, 2147483647);
  assert.deepEqual(coordinates(integers), [ -1, 1, -2147483648, 2147483647 ]);
  assert.deepEqual(native.readVector4(integers[glslNative]),
    coordinates(integers));
});

for (const dimension of [ 2, 3 ]) {
  test(`Bvec${dimension}: all boolean combinations match C++ arithmetic`,
    () => {
      const Constructor = Glsl[`Bvec${dimension}`];
      const count = 2 ** dimension;
      const fromBits = bits => new Constructor(...fields.slice(0, dimension)
        .map((_, i) => Math.floor(bits / 2 ** i) % 2 !== 0));
      for (let a = 0; a < count; a++) {
        for (let b = 0; b < count; b++) {
          const left = fromBits(a);
          const right = fromBits(b);
          const expected = native[`evaluateVector${dimension}`](
            left[glslNative], right[glslNative]);
          for (const method of [ 'lengthSquared', 'dot' ]) {
            assert.equal(Number(left[method](right)), expected[method]);
          }
          const cross = left.cross(right);
          assert.deepEqual(typeof cross === 'boolean'
            ? Number(cross) : coordinates(cross), expected.cross);
          if (dimension === 2) {
            assert.deepEqual(coordinates(left.perpendicular()),
              expected.perpendicular);
          }
          assert.deepEqual(coordinates(left.componentWiseMul(right)),
            expected.componentWiseMul);
          if (expected.componentWiseDiv) {
            assert.deepEqual(coordinates(left.componentWiseDiv(right)),
              expected.componentWiseDiv);
          } else {
            assert.throws(() => left.componentWiseDiv(right), RangeError);
          }
          for (const method of [ 'add', 'subtract' ]) {
            assert.deepEqual(coordinates(sf[method](left, right)),
              expected[method]);
            const copy = new Constructor(left);
            assert.equal(sf[`${method}Assign`](copy, right), copy);
            assert.deepEqual(coordinates(copy), expected[`${method}Assign`]);
          }
          assert.deepEqual(coordinates(sf.negate(left)), expected.negate);
          assert.deepEqual(coordinates(sf.multiply(true, left)),
            expected.leftMultiply);
          for (const method of [ 'multiply', 'divide' ]) {
            assert.deepEqual(coordinates(sf[method](left, true)),
              expected[method]);
            const copy = new Constructor(left);
            assert.equal(sf[`${method}Assign`](copy, true), copy);
            assert.deepEqual(coordinates(copy), expected[`${method}Assign`]);
          }
          assert.equal(sf.equal(left, right), Boolean(expected.equal));
          assert.equal(sf.notEqual(left, right), Boolean(expected.notEqual));
        }
      }
      const value = fromBits(count - 1);
      assert.deepEqual(coordinates(sf.multiply(value, false)),
        Array(dimension).fill(0));
      assert.throws(() => sf.divideAssign(value, false), RangeError);
      assert.deepEqual(coordinates(value), Array(dimension).fill(1));
      assert.throws(() => sf.multiply(value, 2), TypeError);
      assert.throws(() => sf.add(value, new Glsl[`Ivec${dimension}`]()),
        TypeError);
      assert.throws(() => sf.addAssign(Object.freeze(value), value), TypeError);
    });
}

test('Glsl construction, conversions and math run without native calls', t => {
  for (const [ name, fn ] of Object.entries(native)) {
    if (typeof fn === 'function') {
      t.mock.method(native, name, () => assert.fail(`Unexpected NAN: ${name}`));
    }
  }
  for (const [ name, , args ] of cases) {
    const value = new Glsl[name](...args);
    new Glsl[name](value);
    value.x = name[0] === 'B' ? false : 42;
  }
  const bool = new Glsl.Bvec3(true, false, true);
  sf.addAssign(bool, bool);
  bool.cross(bool);
  new Glsl.Vec3(bool);
  new Glsl.Bvec2(new Glsl.Vec2(NaN, 0));
  new Glsl.Vec4(sf.Color.White);
  new Glsl.Bvec4(new Glsl.Vec4(1, 2, 0, 0));
});

test('Glsl types reject mixed dimensions and mismatched native handles', () => {
  assert.throws(() => new Glsl.Bvec2(true), TypeError);
  assert.throws(() => new Glsl.Bvec2(true, 1), TypeError);
  assert.throws(() => new Glsl.Bvec3(true, false), TypeError);
  assert.throws(() => new Glsl.Bvec2(new Glsl.Bvec3()), TypeError);
  assert.throws(() => new Glsl.Vec4(new Glsl.Vec3()), TypeError);
  assert.throws(() => new Glsl.Vec4(1, 2, 3), TypeError);
  assert.throws(() => new Glsl.Bvec4(true, false), TypeError);
  assert.throws(() => sf.equal(new Glsl.Bvec2(), new Glsl.Bvec3()), TypeError);
  const vector = new Glsl.Bvec4();
  assert.throws(() => native.readColor(vector[glslNative]), TypeError);
  assert.throws(() => native.readVector4(new Glsl.Bvec2()[glslNative]),
    TypeError);
  assert.throws(() => native.readVector4(sf.Color.White[colorNative]),
    TypeError);
  for (const name of [ 'Vec4', 'Ivec4', 'Bvec4' ]) {
    assert.equal(new Glsl[name]().dot, undefined);
    assert.throws(() => sf.add(new Glsl[name](), new Glsl[name]()),
      TypeError);
  }
});
