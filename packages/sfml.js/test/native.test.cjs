'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const native = require('../build/Release/sfml.node');
const { Vector2i, Vector2u, Vector2f } = require('..');
const {
  vector2Storage, vector2Native,
} = require('../dist/internal/value-storage');

async function assertCollected(references, released = () => true) {
  for (let attempt = 0; attempt < 30; attempt++) {
    await setImmediate();
    global.gc();
    // BackingStore sweeping can finish after JS weak references disappear.
    if (references.every(reference => reference.deref() === undefined) &&
        released()) {
      return;
    }
  }
  assert.fail('JS wrappers and their native ownership should be released');
}

test('NAN loads SFML 3.1.0 and calls the System dynamic library', () => {
  assert.equal(native.sfmlVersion, '3.1.0');
  const elapsed = native.systemElapsedMicroseconds();
  assert.ok(Number.isFinite(elapsed) && elapsed >= 0);
});

for (const [ Constructor, x, y ] of [
  [ Vector2i, -123, 456 ],
  [ Vector2u, 4294967295, 123 ],
  [ Vector2f, 0.1, -0.2 ],
]) {
  test(`${Constructor.name}: JS and C++ access the same sf::Vector2`, () => {
    const vector = new Constructor();
    const handle = vector[vector2Native];
    vector.x = x;
    vector.y = y;
    const before = [ vector.x, vector.y ];
    assert.deepEqual(native.readVector2(handle), before);
    const copy = new Constructor(vector);
    native.swapVector2(handle);
    assert.deepEqual([ vector.x, vector.y ], [ before[1], before[0] ]);
    assert.deepEqual(
      native.readVector2(handle), [ before[1], before[0] ]
    );
    assert.deepEqual([ copy.x, copy.y ], before);
  });

  test(`${Constructor.name}: native owner survives every original JS view`,
    async () => {
      let vector = new Constructor(x, y);
      const before = [ vector.x, vector.y ];
      const retained = native.retainVector2(vector[vector2Native]);
      // The old ArrayBuffer may also retain the store until it is swept.
      assert.ok(native.vector2UseCount(retained) >= 3);
      const references = [
        new WeakRef(vector),
        new WeakRef(vector[vector2Native]),
        new WeakRef(vector[vector2Storage]),
        new WeakRef(vector[vector2Storage].buffer),
      ];
      vector = null;
      await assertCollected(references,
        () => native.vector2UseCount(retained) === 1);
      assert.equal(native.vector2UseCount(retained), 1);
      assert.deepEqual(native.readVector2(retained), before);
      native.swapVector2(retained);
      assert.deepEqual(
        native.readVector2(retained), [ before[1], before[0] ]
      );
    });

  test(`${Constructor.name}: retained owner and surviving view stay aliased`,
    async () => {
      let vector = new Constructor(x, y);
      const view = vector[vector2Storage];
      const retained = native.retainVector2(vector[vector2Native]);
      const references = [
        new WeakRef(vector), new WeakRef(vector[vector2Native]),
      ];
      vector = null;
      await assertCollected(references,
        () => native.vector2UseCount(retained) === 2);
      assert.equal(native.vector2UseCount(retained), 2);
      view[0] = 12;
      view[1] = 34;
      assert.deepEqual(native.readVector2(retained), [ 12, 34 ]);
      native.swapVector2(retained);
      assert.deepEqual([ ...view ], [ 34, 12 ]);
    });
}

test('an array view survives collection of all native handles', async () => {
  let vector = new Vector2i(12, 34);
  let retained = native.retainVector2(vector[vector2Native]);
  const references = [
    new WeakRef(vector),
    new WeakRef(vector[vector2Native]),
    new WeakRef(retained),
  ];
  const view = vector[vector2Storage];
  vector = null;
  retained = null;
  await assertCollected(references);
  assert.deepEqual([ ...view ], [ 12, 34 ]);
  const alias = new Int32Array(view.buffer);
  alias.set([ 34, 12 ]);
  assert.deepEqual([ ...view ], [ 34, 12 ]);
});

test('native ownership does not keep JS wrappers alive', async () => {
  let vector = new Vector2i(12, 34);
  const references = [
    new WeakRef(vector),
    new WeakRef(vector[vector2Native]),
    new WeakRef(vector[vector2Storage]),
    new WeakRef(vector[vector2Storage].buffer),
  ];
  vector = null;
  await assertCollected(references);
});

test('transferring the buffer leaves native ownership intact', () => {
  const { handle, buffer } = native.createVector2('i32');
  new Int32Array(buffer).set([ 12, 34 ]);
  const transferred = structuredClone(buffer, { transfer: [ buffer ] });
  assert.equal(buffer.byteLength, 0);
  assert.deepEqual(native.readVector2(handle), [ 12, 34 ]);
  native.swapVector2(handle);
  assert.deepEqual([ ...new Int32Array(transferred) ], [ 34, 12 ]);
});

test('native entry points require authentic handles', () => {
  assert.throws(() => native.createVector2('f128'), TypeError);
  const { handle, buffer } = native.createVector2('i32');
  for (const value of [
    null, {}, buffer, new ArrayBuffer(8), Object.create(handle),
  ]) {
    assert.throws(() => native.readVector2(value), TypeError);
    assert.throws(() => native.swapVector2(value), TypeError);
    assert.throws(() => native.retainVector2(value), TypeError);
  }
});

test('Vector2 handles remain distinct from other shared value handles', () => {
  const others = [
    native.createVector3('i32').handle,
    native.createVector3('u32').handle,
    native.createVector3('f32').handle,
    native.createAngle().handle,
    native.createColor().handle,
  ];
  for (const type of [ 'i32', 'u32', 'f32' ]) {
    const { handle } = native.createVector2(type);
    for (const other of others) {
      assert.throws(() => native.readVector2(other), TypeError);
      assert.throws(() => native.swapVector2(other), TypeError);
      assert.throws(() => native.retainVector2(other), TypeError);
      assert.throws(() => native.vector2UseCount(other), TypeError);
      assert.throws(() => native.evaluateVector2(handle, other), TypeError);
      assert.throws(() => native.evaluateVector2(other, handle), TypeError);
    }
    assert.throws(() => native.readVector3(handle), TypeError);
    assert.throws(() => native.readAngle(handle), TypeError);
    assert.throws(() => native.readColor(handle), TypeError);
  }
});
