'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const { Color, Angle } = require('..');
const native = require('../build/Release/sfml.node');
const {
  colorStorage, colorNative, angleNative,
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

test('Color getters and C++ fields alias the same four bytes', () => {
  const color = new Color();
  const storage = color[colorStorage];
  storage.set([ 18, 52, 86, 120 ]);
  assert.equal(color.toInteger(), 0x12345678);
  assert.equal(native.readColor(color[colorNative]), 0x12345678);
  color.r = 255;
  color.a = 0;
  assert.equal(native.readColor(color[colorNative]), 0xff345600);
  native.setColor(color[colorNative], 0xabcdef01);
  assert.deepEqual([ color.r, color.g, color.b, color.a ],
    [ 171, 205, 239, 1 ]);
  assert.equal(native.sameBackingStore(color[colorStorage].buffer,
    storage.buffer), true);
  assert.deepEqual([ ...storage ], [ 171, 205, 239, 1 ]);
});

test('Color native owner outlives every original JS view', async () => {
  let color = new Color(0x12345678);
  const retained = native.retainColor(color[colorNative]);
  assert.ok(native.colorUseCount(retained) >= 3);
  const references = [
    new WeakRef(color), new WeakRef(color[colorNative]),
    new WeakRef(color[colorStorage]), new WeakRef(color[colorStorage].buffer),
  ];
  color = null;
  await assertCollected(references, () => native.colorUseCount(retained) === 1);
  assert.equal(native.colorUseCount(retained), 1);
  assert.equal(native.readColor(retained), 0x12345678);
  native.setColor(retained, 0xabcdef01);
  assert.equal(native.readColor(retained), 0xabcdef01);
});

test('Color view and retained native owner remain aliased after wrapper GC',
  async () => {
    let color = new Color(1, 2, 3, 4);
    const retained = native.retainColor(color[colorNative]);
    const view = color[colorStorage];
    const references = [
      new WeakRef(color), new WeakRef(color[colorNative]),
    ];
    color = null;
    await assertCollected(references,
      () => native.colorUseCount(retained) === 2);
    assert.equal(native.colorUseCount(retained), 2);
    native.setColor(retained, 0x12345678);
    assert.deepEqual([ ...view ], [ 18, 52, 86, 120 ]);
    view.set([ 1, 2, 3, 4 ]);
    assert.equal(native.readColor(retained), 0x01020304);
  });

test('Color backing view remains valid after every native handle is collected',
  async () => {
    let color = new Color(1, 2, 3, 4);
    let retained = native.retainColor(color[colorNative]);
    const view = color[colorStorage];
    const references = [
      new WeakRef(color), new WeakRef(color[colorNative]),
      new WeakRef(retained),
    ];
    color = null;
    retained = null;
    await assertCollected(references);
    assert.deepEqual([ ...view ], [ 1, 2, 3, 4 ]);
    new Uint8Array(view.buffer).fill(255);
    assert.deepEqual([ ...view ], [ 255, 255, 255, 255 ]);
  });

test('Color buffer transfer preserves native ownership and sharing', () => {
  const { handle, buffer } = native.createColor();
  new Uint8Array(buffer).set([ 1, 2, 3, 4 ]);
  const moved = structuredClone(buffer, { transfer: [ buffer ] });
  assert.equal(buffer.byteLength, 0);
  assert.equal(native.readColor(handle), 0x01020304);
  native.setColor(handle, 0xaabbccdd);
  assert.deepEqual([ ...new Uint8Array(moved) ], [ 170, 187, 204, 221 ]);
});

test('Color native entry points require authentic Color handles', () => {
  const color = new Color();
  const handle = color[colorNative];
  const angle = new Angle();
  for (const invalid of [
    {}, null, color[colorStorage], color[colorStorage].buffer,
    Object.create(handle), angle[angleNative],
  ]) {
    assert.throws(() => native.readColor(invalid), TypeError);
    assert.throws(() => native.setColor(invalid, 0), TypeError);
    assert.throws(() => native.retainColor(invalid), TypeError);
    assert.throws(() => native.colorUseCount(invalid), TypeError);
    assert.throws(() => native.evaluateColor(invalid, handle), TypeError);
    assert.throws(() => native.evaluateColor(handle, invalid), TypeError);
  }
  assert.throws(() => native.readAngle(handle), TypeError);
});
