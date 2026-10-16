'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('..');
const { FloatRect, IntRect, Vector2f, Vector2i } = sf;
const native = require('../build/Release/sfml.node');
const {
  rectStorage, rectNative, vector2Storage, vector2Native,
} = require('../dist/internal/value-storage');

const coordinates = rect => rect && ({
  position: [ rect.position.x, rect.position.y ],
  size: [ rect.size.x, rect.size.y ],
});
const make = (Constructor, values) => {
  const rect = new Constructor();
  rect[rectStorage].set(values);
  return rect;
};

for (const [ Constructor, Vector, ArrayType ] of [
  [ FloatRect, Vector2f, Float32Array ],
  [ IntRect, Vector2i, Int32Array ],
]) {
  test(`${Constructor.name}: constructors and member assignments copy values`,
    () => {
      const rect = new Constructor();
      assert.deepEqual(coordinates(rect), {
        position: [ 0, 0 ], size: [ 0, 0 ],
      });
      assert.ok(rect[rectStorage] instanceof ArrayType);
      assert.equal(rect[rectStorage].buffer.byteLength, 16);
      const source = new Vector(12, 34);
      const sizeSource = new Vector(56, 78);
      const value = new Constructor(source, sizeSource);
      const position = value.position;
      const size = value.size;
      assert.ok(position instanceof Vector);
      assert.ok(size instanceof Vector);
      assert.equal(value.position, position);
      assert.equal(value.size, size);
      source.x = 99;
      sizeSource.y = 99;
      assert.deepEqual(coordinates(value), {
        position: [ 12, 34 ], size: [ 56, 78 ],
      });
      value.position = source;
      value.size = sizeSource;
      assert.equal(value.position, position);
      assert.equal(value.size, size);
      source.x = 100;
      assert.equal(position.x, 99);
      value.position = value.size;
      assert.deepEqual([ position.x, position.y ], [ 56, 99 ]);
      value.size = size;
      position.x = 1;
      assert.equal(size.x, 56);
      const copy = new Constructor(value);
      const memberCopy = new Vector(position);
      value.position.x = 2;
      copy.size.y = 3;
      assert.equal(copy.position.x, 1);
      assert.equal(memberCopy.x, 1);
      assert.equal(value.size.y, 99);
      assert.notEqual(copy[rectStorage].buffer, value[rectStorage].buffer);
    });

  test(`${Constructor.name}: normalized bounds include only left and top`,
    () => {
      for (const rect of [
        make(Constructor, [ 10, 20, 4, 6 ]),
        make(Constructor, [ 14, 26, -4, -6 ]),
        make(Constructor, [ 14, 20, -4, 6 ]),
        make(Constructor, [ 10, 26, 4, -6 ]),
      ]) {
        assert.equal(rect.contains(new Vector(10, 20)), true);
        assert.equal(rect.contains(new Vector(13, 25)), true);
        for (const point of [[ 14, 20 ], [ 10, 26 ], [ 9, 20 ], [ 10, 19 ]]) {
          assert.equal(rect.contains(new Vector(...point)), false);
        }
        assert.equal(rect.findIntersection(
          make(Constructor, [ 14, 20, 4, 6 ])
        ), undefined);
        assert.equal(rect.findIntersection(
          make(Constructor, [ 10, 26, 4, 6 ])
        ), undefined);
        for (const empty of [[ 10, 20, 0, 6 ], [ 10, 20, 4, 0 ]]) {
          const value = make(Constructor, empty);
          assert.equal(value.contains(new Vector(10, 20)), false);
          assert.equal(rect.findIntersection(value), undefined);
        }
      }
    });

  test(`${Constructor.name}: independent specialized results`, () => {
    const rect = make(Constructor, [ 10, 20, 10, 10 ]);
    const other = make(Constructor, [ 15, 25, 10, 10 ]);
    const result = rect.findIntersection(other);
    assert.ok(result instanceof Constructor);
    assert.deepEqual(coordinates(result), {
      position: [ 15, 25 ], size: [ 5, 5 ],
    });
    const center = rect.getCenter();
    assert.ok(center instanceof Vector);
    assert.deepEqual([ center.x, center.y ], [ 15, 25 ]);
    result.position.x = 99;
    center.y = 99;
    assert.deepEqual(coordinates(rect), {
      position: [ 10, 20 ], size: [ 10, 10 ],
    });
    const normalized = rect.findIntersection(rect);
    assert.notEqual(normalized[rectNative], rect[rectNative]);
    const reverse = make(Constructor, [ 20, 30, -10, -10 ]);
    assert.equal(sf.equal(rect, reverse), false);
    assert.equal(sf.equal(reverse.findIntersection(reverse), rect), true);
    assert.equal(sf.equal(rect, new Constructor(rect)), true);
    assert.equal(sf.notEqual(rect, new Constructor(rect)), false);
    const memberResult = sf.add(rect.position, rect.size);
    assert.ok(memberResult instanceof Vector);
    assert.ok(rect.position.perpendicular() instanceof Vector);
    assert.deepEqual(native.readVector2(memberResult[vector2Native]),
      [ 20, 30 ]);
  });

  test(`${Constructor.name}: geometry matches C++ over edges and random data`,
    () => {
      const compare = (leftData, rightData, pointData) => {
        const left = make(Constructor, leftData);
        const right = make(Constructor, rightData);
        const point = new Vector(...pointData);
        const before = [ coordinates(left), coordinates(right) ];
        const expected = native.evaluateRect(
          left[rectNative], right[rectNative], point[vector2Native]
        );
        assert.equal(left.contains(point), Boolean(expected.contains));
        const center = left.getCenter();
        assert.deepEqual([ center.x, center.y ], expected.center);
        const result = left.findIntersection(right);
        assert.deepEqual(coordinates(result), expected.intersection);
        if (result) {
          assert.deepEqual(native.readRect(result[rectNative]),
            expected.intersection);
        }
        assert.equal(sf.equal(left, right), Boolean(expected.equal));
        assert.equal(sf.notEqual(left, right), Boolean(expected.notEqual));
        assert.deepEqual([ coordinates(left), coordinates(right) ], before);
      };
      for (const values of [
        [ 0, 0, 0, 0 ], [ -7, 5, 3, -5 ], [ 12, 34, -8, -9 ],
        [ -2000000000, 2000000000, 5, -7 ], [ 1, -1, 1, -1 ],
      ]) {
        compare(values, values, values.slice(0, 2));
        compare(values, [ 0, 0, 10, 10 ], [ 0, 0 ]);
      }
      let state = 0x12345678;
      const next = () => {
        state = (1664525 * state + 1013904223) % 4294967296;
        return Constructor === IntRect
          ? state % 2001 - 1000 : (state / 4294967296 - 0.5) * 2000;
      };
      for (let index = 0; index < 256; index++) {
        compare([ next(), next(), next(), next() ],
          [ next(), next(), next(), next() ], [ next(), next() ]);
      }
      if (Constructor === FloatRect) {
        for (const values of [
          [ 0.1, -0.2, 0.3, -0.4 ], [ -0, 0, 0, -0 ],
          [ 16777216, -16777216, 1, -3 ],
          [ 1e-45, -1e-45, 1e-45, -1e-45 ],
          [ NaN, 0, 10, 10 ], [ 0, 0, NaN, 10 ],
          [ Infinity, 0, -Infinity, 10 ], [ 0, 0, Infinity, 10 ],
        ]) {
          compare(values, [ -1, -1, 5, 5 ], [ 0, 0 ]);
          compare(values, values, [ 0, 0 ]);
        }
      }
    });
}

test('Rect explicit scalar conversion copies and truncates toward zero', () => {
  const source = make(FloatRect, [ -1.9, 2.9, -3.9, 4.9 ]);
  const integer = new IntRect(source);
  assert.deepEqual([ ...integer[rectStorage] ], [ -1, 2, -3, 4 ]);
  const float = new FloatRect(integer);
  integer.position.x = 16777217;
  assert.equal(float.position.x, -1);
  assert.equal(new FloatRect(integer).position.x, 16777216);
  assert.deepEqual([ ...source[rectStorage] ],
    [ -1.9, 2.9, -3.9, 4.9 ].map(Math.fround));
  const center = make(IntRect, [ -10, 10, 3, -3 ]).getCenter();
  assert.deepEqual([ center.x, center.y ], [ -9, 9 ]);
});

test('Rect construction and result allocation never create temporary vectors',
  () => {
    const rect = make(FloatRect, [ 0, 0, 10, 10 ]);
    const point = new Vector2f(1, 1);
    const originals = {
      createRect: native.createRect,
      createVector2: native.createVector2,
      rectMember: native.rectMember,
    };
    const calls = { createRect: 0, createVector2: 0, rectMember: 0 };
    for (const [ name, fn ] of Object.entries(originals)) {
      native[name] = (...args) => {
        calls[name]++;
        return fn(...args);
      };
    }
    try {
      for (const create of [
        () => new FloatRect(), () => new FloatRect(rect),
        () => new FloatRect(point, point),
        () => rect.findIntersection(rect),
      ]) {
        const before = calls.createRect;
        create();
        assert.equal(calls.createRect, before);
        assert.equal(calls.createVector2, 0);
        assert.equal(calls.rectMember, 0);
      }
      const position = rect.position;
      assert.equal(calls.rectMember, 0);
      assert.equal(rect.position, position);
      assert.equal(calls.rectMember, 0);
      assert.equal(calls.createVector2, 0);
      rect.getCenter();
      assert.equal(calls.createVector2, 0);
    } finally {
      Object.assign(native, originals);
    }
  });

test('Rect hot access, assignment, contains and comparisons stay in JS', () => {
  const rect = make(FloatRect, [ 0, 0, 10, 10 ]);
  const other = make(FloatRect, [ 100, 100, 10, 10 ]);
  const point = new Vector2f(1, 1);
  const position = rect.position;
  const size = rect.size;
  const originals = Object.entries(native).filter(
    ([ , value ]) => typeof value === 'function'
  );
  for (const [ name ] of originals) {
    native[name] = () => assert.fail(`unexpected native call: ${name}`);
  }
  try {
    assert.equal(rect.position, position);
    assert.equal(rect.size, size);
    rect.position = point;
    sf.addAssign(rect.position, point);
    rect.size = size;
    assert.equal(rect.position.x, 2);
    assert.equal(rect.contains(point), false);
    assert.equal(sf.equal(rect, other), false);
    assert.equal(sf.notEqual(rect, other), true);
    assert.equal(rect.findIntersection(other), undefined);
  } finally {
    for (const [ name, fn ] of originals) native[name] = fn;
  }
  assert.deepEqual(native.readRect(rect[rectNative]),
    { position: [ 2, 2 ], size: [ 10, 10 ] });
  assert.equal(position[vector2Storage].byteLength, 8);
});

test('Rect rejects incompatible values and unsupported arithmetic', () => {
  const rect = make(FloatRect, [ 1, 2, 3, 4 ]);
  const integer = new IntRect();
  for (const invalid of [
    new Vector2i(), new sf.Vector2u(), new sf.Vector3f(),
    {}, null, { x: 1, y: 2 },
  ]) {
    assert.throws(() => new FloatRect(invalid, new Vector2f()), TypeError);
    assert.throws(() => new FloatRect(new Vector2f(), invalid), TypeError);
    assert.throws(() => { rect.position = invalid; }, TypeError);
    assert.throws(() => { rect.size = invalid; }, TypeError);
    assert.throws(() => rect.contains(invalid), TypeError);
  }
  for (const invalid of [ integer, {}, null, new Vector2f(), sf.Color.White ]) {
    assert.throws(() => rect.findIntersection(invalid), TypeError);
    assert.throws(() => sf.equal(rect, invalid), TypeError);
    assert.throws(() => sf.equal(invalid, rect), TypeError);
    assert.throws(() => sf.notEqual(rect, invalid), TypeError);
  }
  for (const operation of [
    'add', 'subtract', 'addAssign', 'subtractAssign', 'multiply',
    'multiplyAssign', 'divide', 'divideAssign', 'modulo', 'moduloAssign',
    'less', 'lessEqual', 'greater', 'greaterEqual',
  ]) {
    assert.throws(() => sf[operation](rect, rect), TypeError);
  }
  assert.throws(() => sf.negate(rect), TypeError);
  assert.throws(() => sf.multiply(rect, 2), TypeError);
  assert.throws(() => sf.multiply(2, rect), TypeError);
  assert.throws(() => sf.divideAssign(rect, 2), TypeError);
  assert.throws(() => new FloatRect(new Vector2f()), TypeError);
  assert.throws(() => new FloatRect(1, 2, 3, 4), TypeError);
  assert.deepEqual([ ...rect[rectStorage] ], [ 1, 2, 3, 4 ]);
});
