'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  vector2Storage, vector2Native,
} = require('../dist/internal/value-storage');

for (const [ type, Constructor, ArrayType ] of [
  [ 'i32', sf.Vector2i, Int32Array ],
  [ 'u32', sf.Vector2u, Uint32Array ],
  [ 'f32', sf.Vector2f, Float32Array ],
]) {
  test(`${type}: construction, math and copies stay in JS`, t => {
    for (const method of [ 'createVector2', 'wrapVector2' ]) {
      t.mock.method(native, method, () => {
        assert.fail('Pure value operations must not wrap a native vector');
      });
    }
    const a = new Constructor(3, 4);
    const b = new Constructor(2, 3);
    const generic = new sf.Vector2(type, a);
    a.x = 6;
    a.y = 8;
    assert.deepEqual([ generic.x, generic.y ], [ 3, 4 ]);
    assert.equal(a.lengthSquared(), 100);
    assert.equal(a.dot(b), 36);
    assert.equal(a.cross(b), 2);
    for (const result of [
      new Constructor(a), new sf.Vector2(a), new sf.Vector2f(a),
      a.perpendicular(), a.componentWiseMul(b), a.componentWiseDiv(b),
      sf.add(a, b), sf.subtract(a, b), sf.negate(a),
      sf.multiply(a, 3), sf.multiply(3, a), sf.divide(a, 2),
    ]) {
      assert.ok(result instanceof sf.Vector2);
      assert.equal(typeof result.x, 'number');
    }
    sf.addAssign(a, b);
    sf.subtractAssign(a, b);
    sf.multiplyAssign(a, 2);
    sf.divideAssign(a, 2);
    assert.deepEqual([ a.x, a.y ], [ 6, 8 ]);
    assert.equal(sf.equal(a, b), false);
    assert.equal(sf.notEqual(a, b), true);
    const target = new ArrayType(4);
    target.set(a[vector2Storage], 1);
    assert.deepEqual([ ...target ], [ 0, 6, 8, 0 ]);
    if (type === 'f32') {
      assert.equal(a.length(), 10);
      a.normalized();
      a.angle();
      a.angleTo(b);
      a.rotatedBy(sf.degrees(30));
      a.projectedOnto(b);
      new sf.Vector2f(2, sf.degrees(30));
    }
  });

  for (const trigger of [ vector2Native, vector2Storage ]) {
    test(`${type}: ${trigger.description} migrates once`, t => {
      const spy = t.mock.method(native, 'wrapVector2', native.wrapVector2);
      const vector = new Constructor(3.1, -4.2);
      const original = vector[vector2Storage];
      const alias = vector;
      vector.x = 7.3;
      const expected = [ vector.x, vector.y ];
      assert.equal(spy.mock.callCount(), 0);
      const first = vector[trigger];
      if (trigger === vector2Storage) assert.equal(spy.mock.callCount(), 0);
      const handle = vector[vector2Native];
      const view = vector[vector2Storage];
      if (trigger === vector2Native) assert.equal(first, handle);
      else assert.equal(first, original);
      assert.notEqual(view, original);
      assert.notEqual(view.buffer, original.buffer);
      assert.equal(native.sameBackingStore(view.buffer, original.buffer), true);
      assert.equal(spy.mock.callCount(), 1);
      assert.equal(alias, vector);
      assert.deepEqual([ ...view ], expected);
      assert.deepEqual(native.readVector2(handle), expected);
      const descriptor = Object.getOwnPropertyDescriptor(vector, vector2Native);
      assert.equal(descriptor.get, undefined);
      assert.equal(descriptor.value, handle);
      const copy = new Constructor(vector);
      assert.equal(spy.mock.callCount(), 1);
      native.swapVector2(handle);
      assert.deepEqual([ alias.x, alias.y ], [ expected[1], expected[0] ]);
      assert.deepEqual([ ...original ], [ expected[1], expected[0] ]);
      vector.x = 12;
      vector.y = 34;
      assert.deepEqual(native.readVector2(handle), [ 12, 34 ]);
      view[0] = 56;
      assert.equal(alias.x, 56);
      original[1] = 78;
      assert.equal(alias.y, 78);
      assert.deepEqual(native.readVector2(handle), [ 56, 78 ]);
      assert.deepEqual([ copy.x, copy.y ], expected);
      assert.equal(spy.mock.callCount(), 1);
      assert.equal(vector[vector2Storage], view);
    });
  }

  test(`${type}: scalar conversion agrees before and after migration`, () => {
    const lazy = new Constructor();
    const mapped = new Constructor();
    void mapped[vector2Native];
    const array = mapped[vector2Storage];
    for (const value of [
      0, -0, 0.1, -1.9, 2147483648, 4294967297, 1e100,
      Infinity, -Infinity, NaN, 1e-45,
    ]) {
      lazy.x = value;
      mapped.x = value;
      lazy.y = value;
      mapped.y = value;
      assert.equal(lazy.x, array[0]);
      assert.equal(lazy.y, array[1]);
    }
    for (const value of [ 1n, Symbol('invalid') ]) {
      assert.throws(() => { lazy.x = value; }, TypeError);
      assert.throws(() => { mapped.y = value; }, TypeError);
    }
  });

  test(`${type}: mutation during coercion targets the migrated storage`, () => {
    const vector = new Constructor(1, 2);
    vector.x = {
      valueOf() {
        native.swapVector2(vector[vector2Native]);
        return 12.75;
      },
    };
    const expected = new ArrayType([ 12.75, 1 ]);
    assert.deepEqual(native.readVector2(vector[vector2Native]),
      [ ...expected ]);
  });
}

test('failed migration preserves JS state and can be retried', t => {
  const vector = new sf.Vector2f(0.1, -0);
  const create = native.wrapVector2;
  let calls = 0;
  t.mock.method(native, 'wrapVector2', (...args) => {
    if (++calls === 1) throw new Error('allocation failed');
    return create(...args);
  });
  assert.throws(() => vector[vector2Native], /allocation failed/);
  assert.equal(vector.x, Math.fround(0.1));
  assert.ok(Object.is(vector.y, -0));
  vector.x = 2;
  assert.deepEqual(native.readVector2(vector[vector2Native]), [ 2, -0 ]);
  assert.equal(calls, 2);
});

test('non-extensible wrappers still migrate once and retain readable values',
  t => {
    const spy = t.mock.method(native, 'wrapVector2', native.wrapVector2);
    const freezeMethods = [
      Object.freeze, Object.seal, Object.preventExtensions,
    ];
    for (const freeze of freezeMethods) {
      const vector = freeze(new sf.Vector2f(3, 4));
      const before = spy.mock.callCount();
      const view = vector[vector2Storage];
      const handle = vector[vector2Native];
      assert.equal(native.sameBackingStore(
        vector[vector2Storage].buffer, view.buffer
      ), true);
      assert.equal(vector[vector2Native], handle);
      assert.equal(spy.mock.callCount(), before + 1);
      assert.deepEqual(native.readVector2(handle), [ 3, 4 ]);
    }
  });

test('value consumers do not promote sources; member handles alias parents',
  t => {
    for (const method of [ 'createVector2', 'wrapVector2' ]) {
      t.mock.method(native, method, () => {
        assert.fail('Coordinate copies and members must not wrap a vector');
      });
    }
    const point = new sf.Vector2f(3, 4);
    const rect = new sf.FloatRect(point, point);
    const vertex = new sf.Vertex(point, sf.Color.White, point);
    const sprite = new sf.Sprite(new sf.Texture(new sf.Vector2u(1, 1)));
    sprite.setPosition(point);
    assert.deepEqual([ sprite.getPosition().x, sprite.getPosition().y ],
      [ 3, 4 ]);
    rect.position = point;
    rect.size = point;
    vertex.position = point;
    vertex.texCoords = point;
    assert.equal(rect.getCenter().x, 4.5);
    assert.equal(rect.contains(point), true);
    for (const member of [
      rect.position, rect.size, vertex.position, vertex.texCoords,
    ]) {
      const handle = member[vector2Native];
      assert.equal(Object.getOwnPropertyDescriptor(member, vector2Native).value,
        handle);
      assert.deepEqual(native.readVector2(handle), [ 3, 4 ]);
      native.swapVector2(handle);
      assert.deepEqual([ member.x, member.y ], [ 4, 3 ]);
    }
    assert.deepEqual([ point.x, point.y ], [ 3, 4 ]);
  });

test('wrapping keeps the original BackingStore and exact floating-point bits',
  () => {
    const vector = new sf.Vector2f();
    const original = vector[vector2Storage].buffer;
    const bits = new Uint32Array(original);
    // Include a signaling NaN: construction must not canonicalize its payload.
    bits.set([ 0x7f812345, 0x80000000 ]);
    const handle = vector[vector2Native];
    const current = vector[vector2Storage].buffer;
    assert.notEqual(current, original);
    assert.equal(native.sameBackingStore(original, current), true);
    assert.deepEqual([ ...new Uint32Array(current) ],
      [ 0x7f812345, 0x80000000 ]);
    bits.set([ 0x3f800000, 0x40000000 ]);
    assert.deepEqual(native.readVector2(handle), [ 1, 2 ]);
    const transferred = structuredClone(original, { transfer: [ original ] });
    assert.equal(original.byteLength, 0);
    assert.equal(native.sameBackingStore(transferred, current), true);
    native.swapVector2(handle);
    assert.deepEqual([ ...new Float32Array(transferred) ], [ 2, 1 ]);
    assert.deepEqual([ vector.x, vector.y ], [ 2, 1 ]);
  });

test('native wrapping validates scalar type, fixed size and attachment', () => {
  for (const value of [ null, {}, new Float32Array(2),
    new SharedArrayBuffer(8) ]) {
    assert.throws(() => native.wrapVector2('f32', value), TypeError);
  }
  for (const size of [ 0, 4, 12, 16 ]) {
    assert.throws(() => native.wrapVector2('f32', new ArrayBuffer(size)),
      RangeError);
  }
  assert.throws(() => native.wrapVector2('f128', new ArrayBuffer(8)),
    TypeError);
  const detached = new ArrayBuffer(8);
  structuredClone(detached, { transfer: [ detached ] });
  assert.throws(() => native.wrapVector2('f32', detached), RangeError);
  if (ArrayBuffer.prototype.resize) {
    const resizable = new ArrayBuffer(8, { maxByteLength: 16 });
    assert.throws(() => native.wrapVector2('f32', resizable), TypeError);
  }
});
