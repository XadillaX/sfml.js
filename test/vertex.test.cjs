'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('..');
const { Vertex, Vector2f, Color } = sf;
const native = require('../build/Release/sfml.node');
const {
  vertexStorage, vertexNative, colorStorage, colorNative,
  vector2Storage, vector2Native,
} = require('../dist/internal/value-storage');

const fields = vertex => ({
  position: [ vertex.position.x, vertex.position.y ],
  color: vertex.color.toInteger(),
  texCoords: [ vertex.texCoords.x, vertex.texCoords.y ],
});

test('Vertex constructors match SFML aggregate initialization', () => {
  const position = new Vector2f(0.1, -0.2);
  const color = new Color(0x12345678);
  const texCoords = new Vector2f(-1.5, 2.5);
  const expected = native.evaluateVertex(
    position[vector2Native], color[colorNative], texCoords[vector2Native]
  );
  for (const [ name, vertex ] of [
    [ 'default', new Vertex() ],
    [ 'position', new Vertex(position) ],
    [ 'color', new Vertex(position, color) ],
    [ 'texCoords', new Vertex(position, color, texCoords) ],
    [ 'defaultColor', new Vertex(position, undefined, texCoords) ],
  ]) {
    assert.deepEqual(fields(vertex), expected[name], name);
    assert.deepEqual(native.readVertex(vertex[vertexNative]), expected[name]);
    assert.ok(vertex[vertexStorage] instanceof Uint8Array);
    assert.equal(vertex[vertexStorage].byteLength, 20);
    const copy = new Vertex(vertex);
    assert.deepEqual(fields(copy), expected[name]);
    assert.notEqual(copy[vertexStorage].buffer, vertex[vertexStorage].buffer);
  }
  const vertex = new Vertex();
  assert.deepEqual(fields(vertex),
    { position: [ 0, 0 ], color: 0xffffffff, texCoords: [ 0, 0 ] });
  assert.notEqual(vertex.color, Color.White);
  assert.equal(Object.isFrozen(vertex.color), false);
  vertex.color.r = 0;
  assert.equal(Color.White.r, 255);
});

test('Vertex constructor and member assignment copy inputs without rebinding',
  () => {
    const position = new Vector2f(1, 2);
    const color = new Color(0x12345678);
    const texCoords = new Vector2f(3, 4);
    const vertex = new Vertex(position, color, texCoords);
    const original = fields(vertex);
    const p = vertex.position;
    const c = vertex.color;
    const t = vertex.texCoords;
    assert.ok(p instanceof Vector2f);
    assert.ok(c instanceof Color);
    assert.ok(t instanceof Vector2f);
    assert.equal(vertex.position, p);
    assert.equal(vertex.color, c);
    assert.equal(vertex.texCoords, t);
    position.x = 5;
    color.a = 9;
    texCoords.y = 8;
    assert.deepEqual(fields(vertex), original);
    vertex.position = position;
    vertex.color = color;
    vertex.texCoords = texCoords;
    assert.equal(vertex.position, p);
    assert.equal(vertex.color, c);
    assert.equal(vertex.texCoords, t);
    assert.deepEqual(fields(vertex),
      { position: [ 5, 2 ], color: 0x12345609, texCoords: [ 3, 8 ] });
    position.y = 99;
    color.r = 99;
    texCoords.x = 99;
    assert.equal(p.y, 2);
    assert.equal(c.r, 18);
    assert.equal(t.x, 3);
    vertex.position = t;
    p.x = 42;
    assert.equal(t.x, 3);
    vertex.texCoords = p;
    assert.equal(t.x, 42);
    vertex.color = c;
    assert.equal(c.toInteger(), 0x12345609);
    vertex.color = Color.Red;
    c.g = 17;
    assert.equal(Color.Red.toInteger(), 0xff0000ff);
    assert.deepEqual(fields(vertex),
      { position: [ 42, 8 ], color: 0xff1100ff, texCoords: [ 42, 8 ] });
  });

test('Vertex and member copies preserve independent storage and exact bytes',
  () => {
    const source = new Vertex(
      new Vector2f(1, 2), Color.Red, new Vector2f(3, 4)
    );
    const copy = new Vertex(source);
    const colorCopy = new Color(source.color);
    const vectorCopy = new Vector2f(source.position);
    source.position.x = 9;
    source.color.b = 10;
    source.texCoords.y = 11;
    assert.deepEqual(fields(copy),
      { position: [ 1, 2 ], color: 0xff0000ff, texCoords: [ 3, 4 ] });
    assert.equal(colorCopy.toInteger(), 0xff0000ff);
    assert.deepEqual([ vectorCopy.x, vectorCopy.y ], [ 1, 2 ]);
    // Include a NaN payload, signed zero and raw RGBA bytes.
    new Uint32Array(source[vertexStorage].buffer).set([
      0x7fa12345, 0x80000000, 0x12345678, 0x7f800000, 0x00000001,
    ]);
    const byteCopy = new Vertex(source);
    assert.deepEqual([ ...byteCopy[vertexStorage] ],
      [ ...source[vertexStorage] ]);
  });

test('Vertex member writes preserve neighboring fields and scalar semantics',
  () => {
    const vertex = new Vertex();
    vertex.color = new Color(0x12345678);
    vertex.position = new Vector2f(0.1, -0.2);
    vertex.texCoords = new Vector2f(3.3, -4.4);
    assert.deepEqual(fields(vertex), {
      position: [ Math.fround(0.1), Math.fround(-0.2) ],
      color: 0x12345678,
      texCoords: [ Math.fround(3.3), Math.fround(-4.4) ],
    });
    vertex.color.r = -1;
    vertex.color.g = 256;
    vertex.color.b = 1.9;
    vertex.color.a = -2.9;
    assert.equal(vertex.color.toInteger(), 0xff0001fe);
    assert.deepEqual([ ...vertex[vertexStorage].slice(8, 12) ],
      [ 255, 0, 1, 254 ]);
    assert.deepEqual(native.readVertex(vertex[vertexNative]), fields(vertex));
  });

test('Vertex member arithmetic uses existing Color and Vector2 operations',
  () => {
    const vertex = new Vertex(
      new Vector2f(3, 4), new Color(100, 128, 200, 255), new Vector2f(5, 6)
    );
    const colorExpected = native.evaluateColor(
      vertex.color[colorNative], Color.Red[colorNative]
    );
    const colorResult = sf.multiply(vertex.color, Color.Red);
    assert.ok(colorResult instanceof Color);
    assert.equal(colorResult.toInteger(), colorExpected.multiply);
    assert.notEqual(colorResult[colorStorage].buffer,
      vertex.color[colorStorage].buffer);
    const normal = vertex.position.normalized();
    assert.ok(normal instanceof Vector2f);
    assert.equal(vertex.position.length(), 5);
    assert.ok(vertex.texCoords.perpendicular() instanceof Vector2f);
    const position = vertex.position;
    const texCoords = vertex.texCoords;
    sf.addAssign(position, texCoords);
    sf.multiplyAssign(vertex.color, Color.Red);
    assert.deepEqual(native.readVertex(vertex[vertexNative]), {
      position: [ 8, 10 ], color: colorExpected.multiply, texCoords: [ 5, 6 ],
    });
    assert.deepEqual([ normal.x, normal.y ],
      [ Math.fround(0.6), Math.fround(0.8) ]);
  });

test('Vertex construction and cached member views stay entirely in JS',
  () => {
    const point = new Vector2f(1, 2);
    const color = new Color(0x12345678);
    const source = new Vertex(point, color, point);
    const originals = {
      createVertex: native.createVertex,
      createVector2: native.createVector2,
      createColor: native.createColor,
      vertexMember: native.vertexMember,
    };
    const calls = {
      createVertex: 0, createVector2: 0, createColor: 0, vertexMember: 0,
    };
    for (const [ name, fn ] of Object.entries(originals)) {
      native[name] = (...args) => {
        calls[name]++;
        return fn(...args);
      };
    }
    try {
      for (const construct of [
        () => new Vertex(), () => new Vertex(point),
        () => new Vertex(point, color), () => new Vertex(point, color, point),
        () => new Vertex(point, undefined, point), () => new Vertex(source),
      ]) {
        const count = calls.createVertex;
        const vertex = construct();
        vertex.position = point;
        vertex.color = color;
        vertex.texCoords = point;
        assert.equal(calls.createVertex, count);
        assert.equal(calls.vertexMember, 0);
      }
      for (const name of [ 'position', 'color', 'texCoords' ]) {
        const count = calls.vertexMember;
        const member = source[name];
        assert.equal(source[name], member);
        source[name] = member;
        assert.equal(source[name], member);
        assert.equal(calls.vertexMember, count);
      }
      assert.equal(calls.createVector2, 0);
      assert.equal(calls.createColor, 0);
    } finally {
      Object.assign(native, originals);
    }
  });

test('Vertex cached member access and assignment stay entirely in JS', () => {
  const vertex = new Vertex();
  const position = vertex.position;
  const color = vertex.color;
  const texCoords = vertex.texCoords;
  const point = new Vector2f(3, 4);
  const originals = Object.entries(native).filter(
    ([ , value ]) => typeof value === 'function'
  );
  for (const [ name ] of originals) {
    native[name] = () => assert.fail(`unexpected native call: ${name}`);
  }
  try {
    vertex.position = point;
    vertex.texCoords = point;
    vertex.color = Color.Red;
    sf.addAssign(vertex.position, vertex.texCoords);
    sf.multiplyAssign(vertex.color, Color.White);
    vertex.texCoords.x = 7;
    vertex.color.a = 128;
    assert.equal(vertex.position, position);
    assert.equal(vertex.color, color);
    assert.equal(vertex.texCoords, texCoords);
    assert.deepEqual(fields(vertex),
      { position: [ 6, 8 ], color: 0xff000080, texCoords: [ 7, 4 ] });
  } finally {
    for (const [ name, fn ] of originals) native[name] = fn;
  }
  assert.deepEqual(native.readVertex(vertex[vertexNative]), fields(vertex));
  assert.equal(position[vector2Storage].byteLength, 8);
  assert.equal(color[colorStorage].byteLength, 4);
  assert.equal(texCoords[vector2Storage].byteLength, 8);
});

test('Vertex rejects invalid members, constructors and unsupported operators',
  () => {
    const vertex = new Vertex();
    const point = new Vector2f();
    const before = fields(vertex);
    for (const invalid of [
      new sf.Vector2i(), new sf.Vector2u(), new sf.Vector3f(),
      new sf.FloatRect(), Color.White, {}, null, { x: 1, y: 2 },
    ]) {
      assert.throws(() => new Vertex(invalid), TypeError);
      assert.throws(() => new Vertex(point, Color.White, invalid), TypeError);
      assert.throws(() => { vertex.position = invalid; }, TypeError);
      assert.throws(() => { vertex.texCoords = invalid; }, TypeError);
    }
    for (const invalid of [ 0xffffffff, point, {}, null ]) {
      assert.throws(() => new Vertex(point, invalid), TypeError);
      assert.throws(() => { vertex.color = invalid; }, TypeError);
    }
    assert.throws(() => new Vertex(vertex, Color.White), TypeError);
    assert.throws(() => new Vertex(point, Color.White, point, point),
      TypeError);
    for (const method of [
      'add', 'subtract', 'addAssign', 'subtractAssign', 'equal', 'notEqual',
      'multiply', 'multiplyAssign', 'divide', 'divideAssign', 'modulo',
      'moduloAssign', 'less', 'lessEqual', 'greater', 'greaterEqual',
    ]) {
      assert.throws(() => sf[method](vertex, vertex), TypeError);
    }
    assert.throws(() => sf.negate(vertex), TypeError);
    assert.deepEqual(fields(vertex), before);
  });
