'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Vector2, Vector2i, Vector2u, Vector2f } = require('..');
const { vector2Storage } = require('../dist/internal/value-storage');

for (const [ type, Constructor, ArrayType ] of [
  [ 'i32', Vector2i, Int32Array ],
  [ 'u32', Vector2u, Uint32Array ],
  [ 'f32', Vector2f, Float32Array ],
]) {
  test(`${type}: default and coordinate constructors`, () => {
    for (const vector of [ new Vector2(type), new Constructor() ]) {
      assert.equal(vector.scalarType, type);
      assert.deepEqual([ vector.x, vector.y ], [ 0, 0 ]);
      assert.ok(vector[vector2Storage] instanceof ArrayType);
      assert.equal(vector[vector2Storage].length, 2);
      assert.equal(vector[vector2Storage].byteLength, 8);
    }
    const vectors = [ new Vector2(type, 12, 34), new Constructor(12, 34) ];
    for (const vector of vectors) {
      assert.deepEqual([ vector.x, vector.y ], [ 12, 34 ]);
    }
  });

  test(`${type}: getters and setters share the same backing memory`, () => {
    const vector = new Constructor(12, 34);
    const storage = vector[vector2Storage];
    const alias = new ArrayType(storage.buffer, storage.byteOffset, 2);
    vector.x = 56;
    vector.y = 78;
    assert.deepEqual([ ...alias ], [ 56, 78 ]);
    alias[0] = 90;
    alias[1] = 21;
    assert.deepEqual([ vector.x, vector.y ], [ 90, 21 ]);
    assert.equal(vector[vector2Storage], storage);
    for (const coordinate of [ 'x', 'y' ]) {
      const descriptor = Object.getOwnPropertyDescriptor(
        Vector2.prototype, coordinate
      );
      assert.equal(typeof descriptor.get, 'function');
      assert.equal(typeof descriptor.set, 'function');
      assert.equal(Object.hasOwn(vector, coordinate), false);
    }
  });

  test(`${type}: copies own their memory; variable assignment aliases`, () => {
    const source = new Constructor(12, 34);
    const copies = [
      new Constructor(source),
      new Vector2(source),
      new Vector2(type, source),
    ];
    for (const copy of copies) {
      assert.equal(copy.scalarType, type);
      assert.deepEqual([ copy.x, copy.y ], [ 12, 34 ]);
      assert.notEqual(
        copy[vector2Storage].buffer, source[vector2Storage].buffer
      );
      copy.x = 99;
      assert.equal(source.x, 12);
    }
    const alias = source;
    alias.y = 56;
    assert.equal(source.y, 56);
    for (const copy of copies) assert.equal(copy.y, 34);
  });
}

test('i32 storage truncates fractions and retains signed 32-bit values', () => {
  const vector = new Vector2i(1.9, -2.9);
  assert.deepEqual([ vector.x, vector.y ], [ 1, -2 ]);
  vector.x = 2147483647;
  vector.y = -2147483648;
  assert.deepEqual([ vector.x, vector.y ], [ 2147483647, -2147483648 ]);
});

test('u32 storage uses unsigned 32-bit conversion', () => {
  const vector = new Vector2u(-1, 4294967296);
  assert.deepEqual([ vector.x, vector.y ], [ 4294967295, 0 ]);
  vector.x = 1.9;
  vector.y = -2;
  assert.deepEqual([ vector.x, vector.y ], [ 1, 4294967294 ]);
});

test('f32 storage rounds on construction and assignment', () => {
  const vector = new Vector2f(0.1, -0);
  assert.equal(vector.x, Math.fround(0.1));
  assert.ok(Object.is(vector.y, -0));
  vector.x = 1 / 3;
  vector.y = 16777217;
  assert.equal(vector.x, Math.fround(1 / 3));
  assert.equal(vector.y, 16777216);
});

test('explicit scalar conversion creates an independent target', () => {
  const source = new Vector2f(12.75, 34.5);
  const integer = new Vector2i(source);
  const generic = new Vector2('i32', source);
  const unsigned = new Vector2u(integer);
  const float = new Vector2f(integer);
  for (const copy of [ integer, generic, unsigned, float ]) {
    assert.deepEqual([ copy.x, copy.y ], [ 12, 34 ]);
    assert.notEqual(copy[vector2Storage].buffer, source[vector2Storage].buffer);
  }
  source.y = 90.5;
  integer.x = 99;
  assert.deepEqual([ float.x, float.y ], [ 12, 34 ]);
  assert.deepEqual([ unsigned.x, unsigned.y ], [ 12, 34 ]);
  assert.deepEqual([ generic.x, generic.y ], [ 12, 34 ]);
});
