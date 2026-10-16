'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const { Vertex, Vector2f, Color } = require('..');
const native = require('../build/Release/sfml.node');
const {
  vertexStorage, vertexNative, colorStorage, colorNative,
  vector2Storage, vector2Native,
} = require('../dist/internal/value-storage');

const members = [
  {
    name: 'position', index: 0, storage: vector2Storage, handle: vector2Native,
    retain: native.retainVector2, useCount: native.vector2UseCount,
    read: native.readVector2, initial: [ 1, 2 ],
  },
  {
    name: 'color', index: 1, storage: colorStorage, handle: colorNative,
    retain: native.retainColor, useCount: native.colorUseCount,
    read: native.readColor, initial: 0x12345678,
  },
  {
    name: 'texCoords', index: 2, storage: vector2Storage, handle: vector2Native,
    retain: native.retainVector2, useCount: native.vector2UseCount,
    read: native.readVector2, initial: [ 3, 4 ],
  },
];

const create = () => new Vertex(
  new Vector2f(1, 2), new Color(0x12345678), new Vector2f(3, 4)
);

async function assertCollected(references, released = () => true) {
  for (let attempt = 0; attempt < 30; attempt++) {
    await setImmediate();
    global.gc();
    if (references.every(reference => reference.deref() === undefined) &&
        released()) return;
  }
  assert.fail('JS wrappers and their native ownership should be released');
}

test('Vertex members share one control block and genuine SFML member objects',
  () => {
    const vertex = create();
    const position = vertex.position;
    const color = vertex.color;
    const texCoords = vertex.texCoords;
    for (const member of members) void vertex[member.name][member.handle];
    const count = native.vertexUseCount(vertex[vertexNative]);
    assert.ok(count >= 8);
    for (const member of members) {
      const value = vertex[member.name];
      assert.equal(member.useCount(value[member.handle]), count);
      assert.deepEqual(member.read(value[member.handle]), member.initial);
    }
    native.swapVector2(position[vector2Native]);
    native.setColor(color[colorNative], 0xabcdef01);
    native.swapVector2(texCoords[vector2Native]);
    assert.deepEqual(native.readVertex(vertex[vertexNative]),
      { position: [ 2, 1 ], color: 0xabcdef01, texCoords: [ 4, 3 ] });
    const replacement = new Vertex(
      new Vector2f(5, 6), Color.Red, new Vector2f(7, 8)
    );
    native.copyVertex(vertex[vertexNative], replacement[vertexNative]);
    assert.deepEqual([ position.x, position.y ], [ 5, 6 ]);
    assert.equal(color.toInteger(), 0xff0000ff);
    assert.deepEqual([ texCoords.x, texCoords.y ], [ 7, 8 ]);
    native.copyVertex(vertex[vertexNative], vertex[vertexNative]);
    assert.equal(color.toInteger(), 0xff0000ff);
    color.a = 42;
    assert.equal(replacement.color.a, 255);
  });

test('a retained Vertex survives collection of all original JS views',
  async () => {
    let vertex = create();
    const retained = native.retainVertex(vertex[vertexNative]);
    const references = [
      new WeakRef(vertex), new WeakRef(vertex[vertexNative]),
      new WeakRef(vertex[vertexStorage]),
      new WeakRef(vertex[vertexStorage].buffer),
      ...members.flatMap(member => {
        const value = vertex[member.name];
        return [
          new WeakRef(value), new WeakRef(value[member.handle]),
          new WeakRef(value[member.storage]),
          new WeakRef(value[member.storage].buffer),
        ];
      }),
    ];
    vertex = null;
    await assertCollected(references,
      () => native.vertexUseCount(retained) === 1);
    assert.deepEqual(native.readVertex(retained),
      { position: [ 1, 2 ], color: 0x12345678, texCoords: [ 3, 4 ] });
    const replacement = new Vertex();
    native.copyVertex(retained, replacement[vertexNative]);
    assert.deepEqual(native.readVertex(retained),
      { position: [ 0, 0 ], color: 0xffffffff, texCoords: [ 0, 0 ] });
  });

for (const member of members) {
  test(`Vertex.${member.name} view survives parent wrapper collection`,
    async () => {
      let vertex = create();
      const value = vertex[member.name];
      void value[member.handle];
      const retained = native.retainVertex(vertex[vertexNative]);
      const references = [
        new WeakRef(vertex), new WeakRef(vertex[vertexNative]),
        new WeakRef(vertex[vertexStorage].buffer),
      ];
      vertex = null;
      await assertCollected(references,
        () => native.vertexUseCount(retained) === 3);
      value[member.storage].fill(7);
      const expected = member.name === 'color' ? 0x07070707 : [ 7, 7 ];
      assert.deepEqual(native.readVertex(retained)[member.name], expected);
      const replacement = create();
      native.copyVertex(retained, replacement[vertexNative]);
      assert.deepEqual(member.read(value[member.handle]), member.initial);
      assert.deepEqual([ ...value[member.storage] ],
        [ ...replacement[member.name][member.storage] ]);
    });

  test(`Vertex.${member.name} native handle alone keeps the Vertex alive`,
    async () => {
      let vertex = create();
      let value = vertex[member.name];
      const retained = member.retain(value[member.handle]);
      const references = [
        new WeakRef(vertex), new WeakRef(vertex[vertexNative]),
        new WeakRef(vertex[vertexStorage].buffer), new WeakRef(value),
        new WeakRef(value[member.handle]),
        new WeakRef(value[member.storage].buffer),
      ];
      vertex = null;
      value = null;
      await assertCollected(references, () => member.useCount(retained) === 1);
      assert.deepEqual(member.read(retained), member.initial);
      if (member.name === 'color') {
        native.setColor(retained, 0xffffffff);
        assert.equal(member.read(retained), 0xffffffff);
      } else {
        native.swapVector2(retained);
        assert.deepEqual(member.read(retained),
          [ ...member.initial ].reverse());
      }
    });

  test(`Vertex.${member.name} backing store survives all native handles`,
    async () => {
      let vertex = create();
      let value = vertex[member.name];
      const view = value[member.storage];
      const before = [ ...view ];
      const references = [
        new WeakRef(vertex), new WeakRef(vertex[vertexNative]),
        new WeakRef(vertex[vertexStorage].buffer), new WeakRef(value),
        new WeakRef(value[member.handle]),
      ];
      vertex = null;
      value = null;
      await assertCollected(references);
      assert.deepEqual([ ...view ], before);
      view.fill(9);
      assert.deepEqual([ ...view ], before.map(() => 9));
    });

  test(`transferring Vertex.${member.name} buffer preserves native sharing`,
    () => {
      const vertex = create();
      const value = vertex[member.name];
      void value[member.handle];
      const data = value[member.storage];
      const moved = structuredClone(data.buffer, { transfer: [ data.buffer ] });
      assert.equal(data.byteLength, 0);
      const view = new data.constructor(moved);
      view.fill(9);
      const expected = member.name === 'color' ? 0x09090909 : [ 9, 9 ];
      assert.deepEqual(native.readVertex(vertex[vertexNative])[member.name],
        expected);
      assert.deepEqual(member.read(value[member.handle]), expected);
    });
}

test('Vertex native APIs require authentic handles and valid member indices',
  () => {
    const { handle, buffer } = native.createVertex();
    const position = native.createVector2('f32').handle;
    const color = native.createColor().handle;
    for (const invalid of [
      null, {}, buffer, Object.create(handle), position, color,
      native.createRect('f32').handle, native.createAngle().handle,
      native.createVector3('f32').handle,
    ]) {
      assert.throws(() => native.readVertex(invalid), TypeError);
      assert.throws(() => native.retainVertex(invalid), TypeError);
      assert.throws(() => native.vertexUseCount(invalid), TypeError);
      assert.throws(() => native.vertexMember(invalid, 0), TypeError);
      assert.throws(() => native.copyVertex(invalid, handle), TypeError);
      assert.throws(() => native.copyVertex(handle, invalid), TypeError);
    }
    for (const index of [ -1, 3, 0.5, undefined, '0' ]) {
      assert.throws(() => native.vertexMember(handle, index), TypeError);
    }
    for (const method of [
      'readColor', 'readVector2', 'readVector3', 'readRect', 'readAngle',
    ]) {
      assert.throws(() => native[method](handle), TypeError);
    }
    const integer = native.createVector2('i32').handle;
    assert.throws(() => native.evaluateVertex(integer, color, position),
      TypeError);
    assert.throws(() => native.evaluateVertex(position, position, position),
      TypeError);
    assert.throws(() => native.evaluateVertex(position, color, integer),
      TypeError);
  });
