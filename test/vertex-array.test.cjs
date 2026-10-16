'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  graphicsNative, graphicsContext,
} = require('../dist/internal/graphics-state');
const {
  vertexStorage, vertexNative, vector2Native, colorNative,
} = require('../dist/internal/value-storage');

const P = sf.PrimitiveType;
const point = (x, y) => new sf.Vector2f(x, y);
const vertex = (x, y, color = sf.Color.Red) =>
  new sf.Vertex(point(x, y), color);
const pixels = target => native.readRenderTexturePixels(target[graphicsNative]);
const fields = v => [ v.position.x, v.position.y, v.color.toInteger(),
  v.texCoords.x, v.texCoords.y ];
const makeTarget = (width = 32, height = 32) =>
  new sf.RenderTexture(new sf.Vector2u(width, height), { stencilBits: 8 });
const makeTexture = () => {
  const texture = new sf.Texture(new sf.Vector2u(2, 2));
  texture.update(new Uint8Array([
    255, 0, 0, 255, 0, 255, 0, 255,
    0, 0, 255, 255, 255, 255, 255, 255,
  ]));
  return texture;
};

test('VertexArray construction, indexed views and value copies', () => {
  const empty = new sf.VertexArray();
  assert.equal(empty.getVertexCount(), 0);
  assert.equal(empty.getPrimitiveType(), P.Points);
  assert.ok(empty instanceof sf.Drawable);
  assert.equal(empty instanceof sf.Transformable, false);
  const array = new sf.VertexArray(P.Triangles, 3);
  assert.equal(array.getVertexCount(), 3);
  assert.equal(array.getPrimitiveType(), P.Triangles);
  for (const value of array) {
    assert.deepEqual(fields(value), [ 0, 0, 0xffffffff, 0, 0 ]);
  }
  const member = array.getVertex(1);
  const position = member.position;
  array.setVertex(1, vertex(3, 4));
  assert.equal(array.getVertex(1), member);
  assert.equal(member.position, position);
  assert.deepEqual(fields(member), [ 3, 4, 0xff0000ff, 0, 0 ]);
  const copy = new sf.VertexArray(array);
  member.position.x = 10;
  member.color.b = 32;
  assert.deepEqual(fields(copy.getVertex(1)),
    [ 3, 4, 0xff0000ff, 0, 0 ]);
  copy.setPrimitiveType(P.Lines);
  assert.equal(array.getPrimitiveType(), P.Triangles);
  const raw = array.getVertex(2)[vertexStorage];
  new Uint32Array(raw.buffer, raw.byteOffset, 5).set([
    0x7fa12345, 0x80000000, 0x12345678, 0x7f800000, 1,
  ]);
  assert.deepEqual(new sf.VertexArray(array).getVertex(2)[vertexStorage], raw);
});

test('mapped vertex and members stay shared through native wrapping and growth',
  () => {
    const array = new sf.VertexArray(P.Points, 2);
    const member = array.getVertex(1);
    member.position = point(3, 7);
    member.color = sf.Color.Red;
    const position = member.position;
    const color = member.color;
    const bytes = member[vertexStorage];
    const handle = member[vertexNative];
    native.swapVector2(position[vector2Native]);
    native.setColor(color[colorNative], 0x12345678);
    assert.deepEqual(fields(array.getVertex(1)), [ 7, 3, 0x12345678, 0, 0 ]);
    assert.deepEqual([ ...member[vertexStorage] ], [ ...bytes ]);
    array.append(member); // reallocates; source remains alive until copied
    assert.notEqual(array.getVertex(1), member);
    assert.deepEqual(fields(array.getVertex(2)), fields(member));
    member.position.x = 40;
    color.r = 99;
    assert.equal(array.getVertex(1).position.x, 7);
    assert.equal(array.getVertex(1).color.r, 18);
    assert.equal(native.readVertex(handle).position[0], 40);
    assert.equal(bytes[8], 99);
    native.swapVector2(position[vector2Native]);
    assert.equal(member.position.y, 40);
  });

test('removed slots reset and capacity is reused without native calls',
  t => {
    const array = new sf.VertexArray(P.Points, 4);
    const member = array.getVertex(0);
    array.setVertex(0, vertex(4, 5));
    array.setVertex(3, vertex(7, 8));
    const create = t.mock.method(native, 'createVertexStorage');
    array.resize(1);
    assert.equal(array.getVertex(0), member);
    array.resize(4);
    assert.deepEqual(fields(array.getVertex(3)), [ 0, 0, 0xffffffff, 0, 0 ]);
    array.clear();
    assert.equal(array.getVertexCount(), 0);
    assert.deepEqual([ ...array ], []);
    array.append(vertex(1, 2));
    assert.equal(member.position.x, 1); // same physical slot, reused storage
    assert.equal(create.mock.callCount(), 0);
    array.resize(5);
    assert.equal(create.mock.callCount(), 1);
    assert.deepEqual(fields(array.getVertex(0)), [ 1, 2, 0xff0000ff, 0, 0 ]);
  });

test('member operations need no NAN calls before native handle access', t => {
  const array = new sf.VertexArray(P.Triangles, 3);
  const source = vertex(3, 4);
  for (const [ name, value ] of Object.entries(native)) {
    if (typeof value === 'function') {
      t.mock.method(native, name, () => assert.fail(`unexpected NAN: ${name}`));
    }
  }
  array.setVertex(1, source);
  array.getVertex(1).position.x = 8;
  sf.addAssign(array.getVertex(1).position, point(1, 2));
  array.getVertex(1).color.a = 128;
  assert.deepEqual(fields(array.getVertex(1)), [ 9, 6, 0xff000080, 0, 0 ]);
  assert.equal(array.getBounds().size.x, 9);
});

test('array wrappers can be collected while old members retain their storage',
  async () => {
    let array = new sf.VertexArray(P.Points, 2);
    const reference = new WeakRef(array);
    let member = array.getVertex(1);
    const position = member.position;
    const color = member.color;
    const bytes = member[vertexStorage];
    member.position.x = 13;
    array = null;
    member = null;
    await setImmediate();
    global.gc();
    assert.equal(reference.deref(), undefined);
    native.swapVector2(position[vector2Native]); // resolves after parent GC
    native.setColor(color[colorNative], 0x12345678);
    assert.equal(position.y, 13);
    assert.equal(bytes[8], 18);
    assert.equal(bytes[11], 120);
  });

test('bounds agree with native SFML, including empty and floating point inputs',
  () => {
    for (const data of [
      [], [ 1, 2 ], [ 0.1, -0.2, -3.3, 4.4, 5.5, -6.6 ],
      [ -0, 0, 0, -0 ], [ NaN, 1, 2, 3 ], [ 1, 2, NaN, 4 ],
    ]) {
      const coordinates = new Float32Array(data);
      const array = new sf.VertexArray(P.Points, data.length / 2);
      for (let i = 0; i < array.getVertexCount(); i++) {
        array.getVertex(i).position = point(
          coordinates[i * 2], coordinates[i * 2 + 1]);
      }
      const bounds = array.getBounds();
      assert.deepEqual([
        bounds.position.x, bounds.position.y, bounds.size.x, bounds.size.y,
      ], native.vertexArrayBoundsOracle(coordinates));
    }
  });

for (let type = 0; type < 6; type++) {
  test(`${P[type]} pixels match SFML with texture, transform and stencil`,
    () => {
      const texture = makeTexture();
      for (const normalized of [ false, true ]) {
        const target = makeTarget();
        const array = new sf.VertexArray(type, 6);
        const positions = [[ 0, 0 ], [ 10, 0 ], [ 0, 10 ],
          [ 0, 10 ], [ 10, 0 ], [ 10, 10 ]];
        for (let i = 0; i < positions.length; i++) {
          const [ x, y ] = positions[i];
          array.setVertex(i, new sf.Vertex(point(x, y),
            new sf.Color(80 + i * 25, 180, 220, 160),
            point(x / (normalized ? 10 : 5), y / (normalized ? 10 : 5))));
        }
        const states = new sf.RenderStates({
          transform: new sf.Transform().translate(point(7, 5))
            .scale(point(1.3, 0.8))
            .rotate(sf.degrees(23)),
          texture, blendMode: sf.BlendAdd,
          coordinateType: normalized ? sf.CoordinateType.Normalized
            : sf.CoordinateType.Pixels,
          stencilMode: new sf.StencilMode({
            stencilUpdateOperation: sf.StencilUpdateOperation.Replace,
            stencilReference: 3, stencilMask: 0xff, stencilOnly: true,
          }),
        });
        target.clear(new sf.Color(24, 40, 72, 180), 0);
        target.draw(array, states);
        states.stencilMode = new sf.StencilMode({
          stencilComparison: sf.StencilComparison.Equal,
          stencilReference: 3, stencilMask: 0xff,
        });
        // Exercise the raw Vertex[] overload in the second pass.
        target.draw([ ...array ], type, states);
        target.display();
        assert.deepEqual(pixels(target),
          native.renderVertexArrayOracle(texture[graphicsNative],
            type, normalized));
      }
    });
}

test('queued draws snapshot bytes, primitive type and states', () => {
  const target = makeTarget(4, 1);
  const array = new sf.VertexArray(P.Points, 1);
  array.setVertex(0, vertex(0.5, 0.5));
  const states = new sf.RenderStates(sf.BlendNone);
  target.clear();
  target.draw(array, states);
  array.getVertex(0).color = sf.Color.Green;
  states.transform.translate(point(1, 0));
  target.draw(array, states);
  array.getVertex(0).color = sf.Color.Blue;
  states.transform.translate(point(1, 0));
  target.draw([ array.getVertex(0) ], P.Points, states);
  array.resize(100);
  array.clear();
  array.setPrimitiveType(P.Lines);
  states.transform.translate(point(50, 0));
  target.display();
  assert.deepEqual([ ...pixels(target) ],
    [ 255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 0, 0, 0, 255 ]);
});

test('vertex subclasses get independent states and validate super.draw edits',
  () => {
    class Shift extends sf.VertexArray {
      draw(target, states) {
        states.transform.translate(point(1, 0));
        super.draw(target, states);
        states.blendMode.colorSrcFactor = -1;
        assert.throws(() => super.draw(target, states), RangeError);
      }
    }
    const array = new Shift(P.Points, 1);
    array.setVertex(0, vertex(0.5, 0.5));
    const target = makeTarget(2, 1);
    const states = new sf.RenderStates();
    target.clear();
    target.draw(array, states);
    target.display();
    assert.equal(states.transform.getMatrix()[12], 0);
    assert.deepEqual([ ...pixels(target) ],
      [ 0, 0, 0, 255, 255, 0, 0, 255 ]);
  });

test('snapshot arenas handle overflow, huge strips and command capacity', t => {
  const target = makeTarget(2, 2);
  const array = new sf.VertexArray(P.Points, 1);
  array.setVertex(0, vertex(0.5, 0.5));
  target.draw(array); // allocate the arena once
  target.flush();
  const submit = t.mock.method(native, 'submitRenderTexture');
  const allocate = t.mock.method(native, 'allocateRenderTextureVertices');
  target.clear();
  for (let i = 0; i < 4096; i++) target.draw(array);
  target.display();
  assert.equal(submit.mock.callCount(), 2);
  assert.equal(allocate.mock.callCount(), 0);
  assert.equal(submit.mock.calls[0].arguments[1], 4096);
  const strip = new sf.VertexArray(P.TriangleStrip, 5001);
  for (let i = 0; i < 5000; i++) strip.setVertex(i, vertex(0, 0));
  strip.setVertex(4999, vertex(2, 0));
  strip.setVertex(5000, vertex(0, 2));
  target.clear();
  target.draw(strip);
  target.display();
  assert.equal(allocate.mock.callCount(), 1);
  assert.equal(submit.mock.calls.at(-1).arguments[1], 2);
  assert.deepEqual([ ...pixels(target).subarray(0, 4) ], [ 255, 0, 0, 255 ]);
  const many = new sf.VertexArray(P.Points, 4500);
  target.draw(many);
  target.draw(many); // vertex capacity overflow, before command capacity
  target.display();
  assert.equal(submit.mock.calls.at(-2).arguments[1], 1);
  assert.equal(submit.mock.calls.at(-1).arguments[1], 1);
});

test('textures are retained until submission and update flushes vertex draws',
  async () => {
    const target = makeTarget(2, 1);
    let texture = new sf.Texture(new sf.Vector2u(1, 1));
    texture.update(new Uint8Array([ 255, 0, 0, 255 ]));
    const reference = new WeakRef(texture);
    const array = new sf.VertexArray(P.Points, 1);
    array.setVertex(0, vertex(0.5, 0.5, sf.Color.White));
    target.clear();
    target.draw(array, texture);
    texture.update(new Uint8Array([ 0, 255, 0, 255 ]));
    array.getVertex(0).position.x = 1.5;
    target.draw(array, texture);
    texture = null;
    await setImmediate();
    global.gc();
    assert.ok(reference.deref());
    target.display();
    assert.deepEqual([ ...pixels(target) ],
      [ 255, 0, 0, 255, 0, 255, 0, 255 ]);
    for (let i = 0; i < 20; i++) {
      await setImmediate();
      global.gc();
      if (!reference.deref()) break;
    }
    assert.equal(reference.deref(), undefined);
  });

test('invalid vertex input leaves the queue empty', t => {
  const target = makeTarget();
  const array = new sf.VertexArray();
  const submit = t.mock.method(native, 'submitRenderTexture');
  for (const count of [ -1, 1.5, NaN, Infinity, 0x100000000 ]) {
    assert.throws(() => array.resize(count), RangeError);
    assert.throws(() => new sf.VertexArray(P.Points, count), RangeError);
  }
  for (const type of [ -1, 6, NaN, 0.5, 'Points' ]) {
    assert.throws(() => array.setPrimitiveType(type), RangeError);
    assert.throws(() => target.draw([], type), RangeError);
  }
  for (const index of [ -1, 0, 1.5, NaN ]) {
    assert.throws(() => array.getVertex(index), RangeError);
    assert.throws(() => array.setVertex(index, new sf.Vertex()), RangeError);
  }
  assert.throws(() => array.append({}), TypeError);
  assert.throws(() => target.draw([ new sf.Vertex(), {}], P.Points), TypeError);
  assert.throws(() => target.draw(new Array(2), P.Points), TypeError);
  const states = new sf.RenderStates();
  states.coordinateType = 9;
  assert.throws(() => target.draw(array, states), RangeError);
  assert.throws(() => target.draw([], P.Points, states), RangeError);
  target.draw(array);
  target.draw([], P.Points);
  target.flush();
  assert.equal(submit.mock.callCount(), 0);
});

test('mixed commands and independent target arenas preserve order', () => {
  const a = makeTarget(2, 1);
  const b = makeTarget(2, 1);
  const image = new sf.Texture(new sf.Vector2u(1, 1));
  image.update(new Uint8Array([ 0, 255, 0, 255 ]));
  const sprite = new sf.Sprite(image);
  const array = new sf.VertexArray(P.Points, 1);
  array.setVertex(0, vertex(0.5, 0.5));
  const states = new sf.RenderStates();
  class Group extends sf.Drawable {
    draw(target, received) {
      received.transform.translate(point(1, 0));
      target.draw(array, received);
    }
  }
  a.clear();
  b.clear();
  a.draw(sprite);
  a.draw(array); // red replaces green at x=0
  b.draw(array);
  b.draw(sprite); // green replaces red at x=0
  a.draw(new Group(), states);
  b.draw(new Group(), states);
  array.getVertex(0).color = sf.Color.Blue;
  a.flush();
  b.display();
  a.display();
  assert.equal(states.transform.getMatrix()[12], 0);
  assert.deepEqual([ ...pixels(a) ],
    [ 255, 0, 0, 255, 255, 0, 0, 255 ]);
  assert.deepEqual([ ...pixels(b) ],
    [ 0, 255, 0, 255, 255, 0, 0, 255 ]);
});

test('steady vertex drawing performs no native calls before submission', t => {
  const target = makeTarget();
  const array = new sf.VertexArray(P.Triangles, 3);
  target.draw(array);
  target.display();
  const calls = [];
  for (const [ name, fn ] of Object.entries(native)) {
    if (typeof fn !== 'function') continue;
    t.mock.method(native, name, (...args) => {
      calls.push(name);
      return fn(...args);
    });
  }
  target.clear();
  for (let i = 0; i < 100; i++) target.draw(array);
  assert.deepEqual(calls, []);
  target.display();
  assert.deepEqual(calls, [ 'submitRenderTexture' ]);
});

test('native validates vertex ranges and texture IDs before any batch executes',
  () => {
    const target = native.createRenderTexture(graphicsContext(), 1, 1, 0);
    native.allocateRenderTextureVertices(target.handle, 3);
    const words = new Uint32Array(target.buffer);
    const floats = new Float32Array(target.buffer);
    words[0] = 0;
    words[1] = 0xff0000ff;
    native.submitRenderTexture(target.handle, 1, true);
    words[1] = 0x00ff00ff;
    for (const [ first, count, type, texture, coordinate ] of [
      [ 4, 0, 0, 0, 1 ], [ 2, 2, 0, 0, 1 ],
      [ 0xffffffff, 2, 0, 0, 1 ], [ 0, 3, 6, 0, 1 ],
      [ 0, 3, 0, 0xffffffff, 1 ], [ 0, 3, 0, 0, 2 ],
    ]) {
      words[43] = 4;
      words[44] = count;
      words.set([ first, type, texture, coordinate ], 45);
      floats.set(sf.Transform.Identity.getMatrix(), 52);
      words.set([ 1, 0, 0, 1, 0, 0, 7, 0, 0, 0xffffffff, 0 ], 68);
      assert.throws(() =>
        native.submitRenderTexture(target.handle, 2, true), TypeError);
      assert.deepEqual([ ...native.readRenderTexturePixels(target.handle) ],
        [ 255, 0, 0, 255 ]);
    }
    words[44] = 0;
    words.set([ 0, 0, 0, 1 ], 45);
    native.submitRenderTexture(target.handle, 2, true);
    assert.deepEqual([ ...native.readRenderTexturePixels(target.handle) ],
      [ 0, 255, 0, 255 ]);
  });
