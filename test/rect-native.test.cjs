'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const { FloatRect, IntRect, Vector2f, Vector2i } = require('..');
const native = require('../build/Release/sfml.node');
const {
  rectStorage, rectNative, vector2Storage, vector2Native,
} = require('../dist/internal/value-storage');

async function assertCollected(references, released = () => true) {
  for (let attempt = 0; attempt < 30; attempt++) {
    await setImmediate();
    global.gc();
    if (references.every(reference => reference.deref() === undefined) &&
        released()) return;
  }
  assert.fail('JS wrappers and their native ownership should be released');
}

for (const [ Constructor, Vector ] of [
  [ FloatRect, Vector2f ], [ IntRect, Vector2i ],
]) {
  test(`${Constructor.name}: members alias genuine native Vector2 objects`,
    () => {
      const rect = new Constructor(new Vector(1, 2), new Vector(3, 4));
      const position = rect.position;
      const size = rect.size;
      const positionHandle = position[vector2Native];
      const sizeHandle = size[vector2Native];
      const count = native.rectUseCount(rect[rectNative]);
      assert.ok(count >= 6);
      assert.equal(native.vector2UseCount(positionHandle), count);
      assert.equal(native.vector2UseCount(sizeHandle), count);
      assert.equal(position[vector2Storage].buffer.byteLength, 8);
      assert.equal(size[vector2Storage].buffer.byteLength, 8);
      native.swapVector2(position[vector2Native]);
      assert.deepEqual(native.readRect(rect[rectNative]),
        { position: [ 2, 1 ], size: [ 3, 4 ] });
      native.swapRectMembers(rect[rectNative]);
      assert.deepEqual([ position.x, position.y ], [ 3, 4 ]);
      assert.deepEqual([ size.x, size.y ], [ 2, 1 ]);
      rect[rectStorage][0] = 9;
      assert.deepEqual(native.readVector2(position[vector2Native]), [ 9, 4 ]);
      const standalone = new Vector(3, 4);
      assert.equal(native.evaluateVector2(
        position[vector2Native], standalone[vector2Native]
      ).dot, position.dot(standalone));
      assert.equal(native.evaluateVector2(
        standalone[vector2Native], position[vector2Native]
      ).dot, standalone.dot(position));
    });

  test(`${Constructor.name}: native owner survives all original JS views`,
    async () => {
      let rect = new Constructor(new Vector(1, 2), new Vector(3, 4));
      const retained = native.retainRect(rect[rectNative]);
      const references = [
        new WeakRef(rect), new WeakRef(rect[rectNative]),
        new WeakRef(rect[rectStorage]), new WeakRef(rect[rectStorage].buffer),
        new WeakRef(rect.position), new WeakRef(rect.size),
        new WeakRef(rect.position[vector2Native]),
        new WeakRef(rect.size[vector2Native]),
        new WeakRef(rect.position[vector2Storage].buffer),
        new WeakRef(rect.size[vector2Storage].buffer),
      ];
      rect = null;
      await assertCollected(references,
        () => native.rectUseCount(retained) === 1);
      assert.deepEqual(native.readRect(retained),
        { position: [ 1, 2 ], size: [ 3, 4 ] });
      native.swapRectMembers(retained);
      assert.deepEqual(native.readRect(retained),
        { position: [ 3, 4 ], size: [ 1, 2 ] });
    });

  test(`${Constructor.name}: a member view survives parent wrapper collection`,
    async () => {
      let rect = new Constructor(new Vector(1, 2), new Vector(3, 4));
      const member = rect.position;
      void member[vector2Native];
      const retained = native.retainRect(rect[rectNative]);
      const references = [
        new WeakRef(rect), new WeakRef(rect[rectNative]),
        new WeakRef(rect[rectStorage].buffer), new WeakRef(rect.size),
      ];
      rect = null;
      await assertCollected(references,
        () => native.rectUseCount(retained) === 3);
      member.x = 9;
      assert.deepEqual(native.readRect(retained),
        { position: [ 9, 2 ], size: [ 3, 4 ] });
      native.swapRectMembers(retained);
      assert.deepEqual([ member.x, member.y ], [ 3, 4 ]);
      assert.ok(member.perpendicular() instanceof Vector);
    });

  test(`${Constructor.name}: a native member handle alone retains the Rect`,
    async () => {
      let rect = new Constructor(new Vector(1, 2), new Vector(3, 4));
      const retained = native.retainVector2(rect.size[vector2Native]);
      const references = [
        new WeakRef(rect), new WeakRef(rect[rectNative]),
        new WeakRef(rect[rectStorage].buffer), new WeakRef(rect.size),
        new WeakRef(rect.size[vector2Native]),
        new WeakRef(rect.size[vector2Storage].buffer),
      ];
      rect = null;
      await assertCollected(references,
        () => native.vector2UseCount(retained) === 1);
      assert.deepEqual(native.readVector2(retained), [ 3, 4 ]);
      native.swapVector2(retained);
      assert.deepEqual(native.readVector2(retained), [ 4, 3 ]);
    });

  test(`${Constructor.name}: a member backing buffer retains native storage`,
    async () => {
      let rect = new Constructor(new Vector(1, 2), new Vector(3, 4));
      const view = rect.size[vector2Storage];
      const references = [
        new WeakRef(rect), new WeakRef(rect[rectNative]),
        new WeakRef(rect[rectStorage].buffer), new WeakRef(rect.size),
        new WeakRef(rect.size[vector2Native]),
      ];
      rect = null;
      await assertCollected(references);
      assert.deepEqual([ ...view ], [ 3, 4 ]);
      view.set([ 5, 6 ]);
      assert.deepEqual([ ...new view.constructor(
        view.buffer, view.byteOffset, view.length
      ) ], [ 5, 6 ]);
    });
}

test('transferred Rect member buffers keep the parent memory shared', () => {
  const { handle, buffer } = native.createRect('i32');
  new Int32Array(buffer).set([ 1, 2, 3, 4 ]);
  const member = native.rectMember(handle, 1);
  const moved = structuredClone(member.buffer, { transfer: [ member.buffer ] });
  assert.equal(member.buffer.byteLength, 0);
  const view = new Int32Array(moved);
  view[0] = 9;
  assert.deepEqual(native.readRect(handle),
    { position: [ 1, 2 ], size: [ 9, 4 ] });
  native.swapRectMembers(handle);
  assert.deepEqual([ ...view ], [ 1, 2 ]);
  assert.deepEqual(native.readVector2(member.handle), [ 1, 2 ]);
});

test('Rect native APIs reject forged, unrelated and mismatched handles', () => {
  const { handle, buffer } = native.createRect('f32');
  const integer = native.createRect('i32').handle;
  const vector = native.createVector2('f32').handle;
  for (const invalid of [
    null, {}, Object.create(handle), buffer, vector,
    native.createVector3('f32').handle,
    native.createColor().handle, native.createAngle().handle,
  ]) {
    assert.throws(() => native.readRect(invalid), TypeError);
    assert.throws(() => native.swapRectMembers(invalid), TypeError);
    assert.throws(() => native.retainRect(invalid), TypeError);
    assert.throws(() => native.rectUseCount(invalid), TypeError);
    assert.throws(() => native.rectMember(invalid, 0), TypeError);
    assert.throws(() => native.evaluateRect(
      invalid, handle, vector
    ), TypeError);
    assert.throws(() => native.evaluateRect(
      handle, invalid, vector
    ), TypeError);
  }
  for (const invalid of [ -1, 2, 0.5, '0', undefined ]) {
    assert.throws(() => native.rectMember(handle, invalid), TypeError);
  }
  for (const invalid of [ undefined, 'u32', 'f64', 0 ]) {
    assert.throws(() => native.createRect(invalid), TypeError);
  }
  assert.throws(() => native.evaluateRect(handle, integer, vector), TypeError);
  assert.throws(() => native.evaluateRect(
    handle, handle, native.createVector2('i32').handle
  ), TypeError);
  for (const method of [
    'readVector2', 'readVector3', 'readColor', 'readAngle',
  ]) {
    assert.throws(() => native[method](handle), TypeError);
    assert.throws(() => native[method](integer), TypeError);
  }
});
