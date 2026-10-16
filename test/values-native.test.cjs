'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  angleStorage, angleNative, vector3Storage, vector3Native,
} = require('../dist/internal/value-storage');

async function assertCollected(references, released = () => true) {
  for (let attempt = 0; attempt < 30; attempt++) {
    await setImmediate();
    global.gc();
    // BackingStore sweeping can finish after JS weak references disappear.
    if (references.every(reference => reference.deref() === undefined) &&
        released()) return;
  }
  assert.fail('JS wrappers and their native ownership should be released');
}

for (const [ Constructor, type, ArrayType ] of [
  [ sf.Vector3i, 'i32', Int32Array ],
  [ sf.Vector3u, 'u32', Uint32Array ],
  [ sf.Vector3f, 'f32', Float32Array ],
]) {
  test(`${Constructor.name}: constructors, conversions and shared coordinates`,
    () => {
      const zero = new Constructor();
      assert.deepEqual([ ...zero[vector3Storage] ], [ 0, 0, 0 ]);
      assert.ok(zero[vector3Storage] instanceof ArrayType);
      assert.equal(zero[vector3Storage].byteLength, 12);
      const source = new sf.Vector3f(1.5, 2.25, 3.75);
      const expected = type === 'f32' ? [ 1.5, 2.25, 3.75 ] : [ 1, 2, 3 ];
      const copies = [
        new Constructor(source), new sf.Vector3(type, source),
        new sf.Vector3(new Constructor(source)),
      ];
      for (const copy of copies) {
        assert.equal(copy.scalarType, type);
        assert.deepEqual(native.readVector3(copy[vector3Native]), expected);
        assert.notEqual(copy[vector3Storage].buffer,
          source[vector3Storage].buffer);
        native.swapVector3(copy[vector3Native]);
        assert.deepEqual([ copy.x, copy.y, copy.z ],
          [ expected[2], expected[1], expected[0] ]);
        copy.x = 10;
        copy.y = 20;
        copy.z = 30;
        assert.deepEqual(native.readVector3(copy[vector3Native]),
          [ 10, 20, 30 ]);
      }
      assert.deepEqual([ source.x, source.y, source.z ], [ 1.5, 2.25, 3.75 ]);
      const generic = new sf.Vector3(type, 1, 2, 3);
      for (const result of [
        generic.cross(generic), sf.add(generic, generic), sf.negate(generic),
      ]) {
        assert.equal(result.constructor, sf.Vector3);
        assert.equal(result.scalarType, type);
      }
    });
}

for (const [ name, create, storageKey, handleKey, expected, changed ] of [
  [
    'Angle', () => sf.radians(1.5), angleStorage, angleNative,
    [ 1.5 ], [ 4 ],
  ],
  ...[ sf.Vector3i, sf.Vector3u, sf.Vector3f ].map(Constructor => [
    'Vector3', () => new Constructor(1, 2, 3), vector3Storage, vector3Native,
    [ 1, 2, 3 ], [ 3, 2, 1 ],
  ]),
]) {
  const read = handle => {
    const value = native[`read${name}`](handle);
    return name === 'Angle' ? [ value ] : value;
  };
  const mutate = handle => (name === 'Angle'
    ? native.setAngle(handle, 4) : native.swapVector3(handle));
  const count = handle => native[
    name === 'Angle' ? 'angleUseCount' : 'vector3UseCount'
  ](handle);

  test(`${name}: native owner outlives all JS views`, async () => {
    let value = create();
    const retained = native[`retain${name}`](value[handleKey]);
    assert.ok(count(retained) >= 3);
    const references = [
      new WeakRef(value), new WeakRef(value[handleKey]),
      new WeakRef(value[storageKey]), new WeakRef(value[storageKey].buffer),
    ];
    value = null;
    await assertCollected(references, () => count(retained) === 1);
    assert.equal(count(retained), 1);
    assert.deepEqual(read(retained), expected);
    mutate(retained);
    assert.deepEqual(read(retained), changed);
  });

  test(`${name}: surviving view remains aliased after original handle GC`,
    async () => {
      let value = create();
      const retained = native[`retain${name}`](value[handleKey]);
      const view = value[storageKey];
      const references = [
        new WeakRef(value), new WeakRef(value[handleKey]),
      ];
      value = null;
      await assertCollected(references, () => count(retained) === 2);
      assert.equal(count(retained), 2);
      mutate(retained);
      assert.deepEqual([ ...view ], changed);
      view.fill(9);
      assert.deepEqual(read(retained), Array(view.length).fill(9));
    });

  test(`${name}: backing view outlives every native handle`, async () => {
    let value = create();
    let retained = native[`retain${name}`](value[handleKey]);
    const view = value[storageKey];
    const references = [
      new WeakRef(value), new WeakRef(value[handleKey]), new WeakRef(retained),
    ];
    value = null;
    retained = null;
    await assertCollected(references);
    assert.deepEqual([ ...view ], expected);
    view.fill(12);
    assert.deepEqual([ ...view ], Array(view.length).fill(12));
  });
}

test('Angle native writes leave copied storage independent', () => {
  const original = sf.radians(0.1);
  const copy = new sf.Angle(original);
  assert.equal(native.readAngle(original[angleNative]), Math.fround(0.1));
  native.setAngle(original[angleNative], 3);
  assert.equal(original.asRadians(), 3);
  assert.equal(copy.asRadians(), Math.fround(0.1));
  assert.equal(original[angleStorage].byteLength, 4);
});

test('native value handles reject spoofing and cross-type handles', () => {
  const angle = native.createAngle();
  const vector = native.createVector3('i32');
  assert.throws(() => native.createVector3('f128'), TypeError);
  assert.throws(() => native.readAngle(vector.handle), TypeError);
  assert.throws(() => native.readVector3(angle.handle), TypeError);
  for (const invalid of [
    null, {}, angle.buffer, vector.buffer, Object.create(vector.handle),
  ]) {
    assert.throws(() => native.readAngle(invalid), TypeError);
    assert.throws(() => native.readVector3(invalid), TypeError);
    assert.throws(() => native.retainVector3(invalid), TypeError);
  }
});

test('transferred value buffers preserve native ownership and aliasing', () => {
  for (const [ create, ArrayType, read ] of [
    [ () => native.createAngle(), Float32Array,
      handle => [ native.readAngle(handle) ] ],
    [ () => native.createVector3('u32'), Uint32Array, native.readVector3 ],
  ]) {
    const { handle, buffer } = create();
    new ArrayType(buffer).fill(9);
    const moved = structuredClone(buffer, { transfer: [ buffer ] });
    assert.equal(buffer.byteLength, 0);
    new ArrayType(moved).fill(3);
    assert.deepEqual(read(handle), Array(moved.byteLength / 4).fill(3));
  }
});
