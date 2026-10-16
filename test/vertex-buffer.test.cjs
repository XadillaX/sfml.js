'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  graphicsNative, graphicsContext, vertexBufferId,
} = require('../dist/internal/graphics-state');

const P = sf.PrimitiveType;
const U = sf.VertexBufferUsage;
const point = (x, y) => new sf.Vector2f(x, y);
const vertex = (x, color = sf.Color.Red) =>
  new sf.Vertex(point(x + 0.5, 0.5), color);
const target = (width = 4, height = 1) =>
  new sf.RenderTexture(new sf.Vector2u(width, height), { stencilBits: 8 });
const pixels = output =>
  native.readRenderTexturePixels(output[graphicsNative]);
const colors = output => {
  const bytes = pixels(output);
  return Array.from({ length: bytes.length / 4 }, (_, i) =>
    bytes.readUInt32BE(i * 4));
};
function buffer(vertices, type = P.Points, usage = U.Stream) {
  const result = new sf.VertexBuffer(type, usage);
  assert.equal(result.create(vertices.length), true);
  assert.equal(result.update(vertices), true);
  return result;
}

test('VertexBuffer constructors, modes, native handle and binding', () => {
  assert.equal(sf.VertexBuffer.isAvailable(), true);
  assert.equal(sf.VertexBuffer.Usage, U);
  for (const [ value, type, usage ] of [
    [ new sf.VertexBuffer(), P.Points, U.Stream ],
    [ new sf.VertexBuffer(P.Triangles), P.Triangles, U.Stream ],
    [ new sf.VertexBuffer(U.Static), P.Points, U.Static ],
    [ new sf.VertexBuffer(P.Lines, U.Dynamic), P.Lines, U.Dynamic ],
  ]) {
    assert.ok(value instanceof sf.Drawable);
    assert.equal(value instanceof sf.Transformable, false);
    assert.equal(value.getVertexCount(), 0);
    assert.equal(value.getNativeHandle(), 0);
    assert.equal(value.getPrimitiveType(), type);
    assert.equal(value.getUsage(), usage);
    assert.equal(value.create(2), true);
    assert.ok(value.getNativeHandle() > 0);
    value.setPrimitiveType(P.TriangleStrip);
    value.setUsage(U.Static);
    const copy = new sf.VertexBuffer(value);
    assert.equal(copy.getVertexCount(), 2);
    assert.equal(copy.getPrimitiveType(), P.TriangleStrip);
    assert.equal(copy.getUsage(), U.Static);
    assert.notEqual(copy.getNativeHandle(), value.getNativeHandle());
    assert.equal(value.create(0), true);
    assert.equal(value.getVertexCount(), 0);
  }
  const output = target();
  const value = buffer([ vertex(0) ]);
  assert.equal(output.setActive(), true);
  sf.VertexBuffer.bind(value);
  assert.equal(native.boundVertexBuffer(), value.getNativeHandle());
  sf.VertexBuffer.bind(null);
  assert.equal(native.boundVertexBuffer(), 0);
  const empty = new sf.VertexBuffer(new sf.VertexBuffer());
  assert.equal(empty.getVertexCount(), 0);
  assert.equal(empty.getNativeHandle(), 0);
});

test('uploads snapshot VertexArray and array data; partial updates and growth',
  t => {
    const array = new sf.VertexArray(P.Points, 3);
    for (let i = 0; i < 3; i++) array.setVertex(i, vertex(i));
    const value = new sf.VertexBuffer();
    assert.equal(value.update(array, 3, 0), false);
    assert.equal(value.create(3), true);
    const get = t.mock.method(array, 'getVertex', () =>
      assert.fail('Upload must use contiguous storage'));
    assert.equal(value.update(array), true);
    assert.equal(get.mock.callCount(), 0);
    array.setVertex(0, vertex(3));
    assert.equal(value.update([ vertex(1, sf.Color.Green) ], 1, 1), true);
    assert.equal(value.update([ vertex(3) ], 1, 3), false);
    assert.equal(value.getVertexCount(), 3);
    const output = target();
    output.clear();
    output.draw(value);
    output.display();
    assert.deepEqual(colors(output), [ 0xff0000ff, 0x00ff00ff,
      0xff0000ff, 0x000000ff ]);
    assert.equal(value.update([ vertex(0, sf.Color.Blue) ], 1, 0), true);
    assert.equal(value.getVertexCount(), 3);
    assert.equal(value.update([ vertex(0), vertex(1), vertex(2),
      vertex(3, sf.Color.White) ], 4, 0), true);
    assert.equal(value.getVertexCount(), 4);
    assert.equal(value.update([], 0, 0), true);
    assert.equal(value.getVertexCount(), 4);
    output.clear();
    output.draw(value, 3, 99);
    output.display();
    assert.deepEqual(colors(output), [ 0x000000ff, 0x000000ff,
      0x000000ff, 0xffffffff ]);
  });

test('GPU copies resize safely, preserve modes and own their data', () => {
  const source = buffer([ vertex(0), vertex(1) ], P.Points, U.Static);
  const copy = new sf.VertexBuffer(source);
  const destination = buffer([ vertex(3) ], P.Lines, U.Dynamic);
  assert.equal(destination.update(source), true);
  assert.equal(destination.getVertexCount(), 2);
  assert.equal(destination.getPrimitiveType(), P.Lines);
  assert.equal(destination.getUsage(), U.Dynamic);
  destination.setPrimitiveType(P.Points);
  assert.equal(source.update([ vertex(2), vertex(3) ]), true);
  const output = target();
  for (const value of [ copy, destination ]) {
    output.clear();
    output.draw(value);
    output.display();
    assert.deepEqual(colors(output), [ 0xff0000ff, 0xff0000ff,
      0x000000ff, 0x000000ff ]);
  }
  assert.equal(copy.update(source), true); // equal-capacity GPU copy
  assert.equal(copy.update(copy), true);
  const small = buffer([ vertex(3, sf.Color.Green) ]);
  assert.equal(copy.update(small), true);
  assert.equal(copy.getVertexCount(), 1);
  output.clear();
  output.draw(copy);
  output.display();
  assert.deepEqual(colors(output), [ 0x000000ff, 0x000000ff,
    0x000000ff, 0x00ff00ff ]);
  assert.equal(copy.update(new sf.VertexBuffer()), false);
  assert.equal(new sf.VertexBuffer().update(source), false);
  assert.equal(small.create(0), true);
  assert.equal(copy.update(small), true);
  assert.equal(copy.getVertexCount(), 0);
});

test('updates, reallocation and swap preserve cross-target snapshots',
  () => {
    const a = target();
    const b = target();
    const value = buffer([ vertex(0) ]);
    a.clear();
    b.clear();
    a.draw(value);
    b.draw(value);
    value.update([ vertex(1, sf.Color.Green) ]);
    a.draw(value);
    b.draw(value);
    const other = buffer([ vertex(2, sf.Color.Blue) ], P.Points, U.Static);
    const handle = other.getNativeHandle();
    sf.swap(value, other);
    assert.equal(value.getNativeHandle(), handle);
    assert.equal(value.getUsage(), U.Static);
    a.draw(value);
    b.draw(value);
    value.create(1);
    value.update([ vertex(3, sf.Color.White) ]);
    a.draw(value);
    b.draw(value);
    sf.swap(value, value);
    a.display();
    b.display();
    for (const output of [ a, b ]) {
      assert.deepEqual(colors(output), [ 0xff0000ff, 0x00ff00ff,
        0x0000ffff, 0xffffffff ]);
    }
  });

test('primitive/state snapshots and subclass dispatch',
  () => {
    class Shift extends sf.VertexBuffer {
      draw(output, states) {
        states.transform.translate(point(1, 0));
        super.draw(output, states);
      }
    }
    const source = buffer([ vertex(0) ]);
    const value = new Shift(source);
    const output = target();
    const states = new sf.RenderStates(sf.BlendNone);
    output.clear();
    output.draw(value, states); // subclass shifts to x=1
    output.draw(value, 0, 1, states); // explicit range uses native geometry
    value.setPrimitiveType(P.Lines); // one vertex now produces no primitive
    states.transform.translate(point(2, 0));
    output.draw(value, 0, 1, states);
    output.display();
    assert.deepEqual(colors(output), [ 0xff0000ff, 0xff0000ff,
      0x000000ff, 0x000000ff ]);
    assert.equal(value.getPrimitiveType(), P.Lines);
    output.clear();
    output.draw(value);
    output.display();
    assert.deepEqual(colors(output), Array(4).fill(0x000000ff));
  });

for (let type = 0; type < 6; type++) {
  test(`GPU ${P[type]} matches SFML with ranges, view, texture and stencil`,
    () => {
      const texture = new sf.Texture(new sf.Vector2u(2, 2));
      texture.update(new Uint8Array([
        255, 0, 0, 255, 0, 255, 0, 255,
        0, 0, 255, 255, 255, 255, 255, 255,
      ]));
      for (const normalized of [ false, true ]) {
        const positions = [[ 0, 0 ], [ 10, 0 ], [ 0, 10 ],
          [ 0, 10 ], [ 10, 0 ], [ 10, 10 ]];
        const value = buffer(positions.map(([ x, y ], i) =>
          new sf.Vertex(point(x, y), new sf.Color(80 + i * 25, 180, 220, 160),
            point(x / (normalized ? 10 : 5), y / (normalized ? 10 : 5)))),
        type, U.Static);
        const ranges = [[ 0, 6 ], [ 3, 99 ], [ 9, 1 ], [ 0, 0 ]];
        for (const [ first, count ] of ranges) {
          const output = target(32, 32);
          output.clear(new sf.Color(24, 40, 72, 180), 0);
          const view = new sf.View(output.getDefaultView());
          view.move(point(1, -1));
          view.setRotation(sf.degrees(7));
          view.setViewport(new sf.FloatRect(point(0.1, 0.1), point(0.8, 0.8)));
          view.setScissor(new sf.FloatRect(point(0.2, 0.2), point(0.7, 0.6)));
          output.setView(view);
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
          if (first === 0 && count === 6) output.draw(value, states);
          else output.draw(value, first, count, states);
          states.stencilMode = new sf.StencilMode({
            stencilComparison: sf.StencilComparison.Equal,
            stencilReference: 3, stencilMask: 0xff,
          });
          output.draw(value, first, count, states);
          view.move(point(100, 100));
          states.transform.translate(point(100, 100));
          output.display();
          assert.deepEqual(pixels(output), native.renderVertexBufferOracle(
            texture[graphicsNative], type, normalized, first, count));
        }
      }
    });
}

test('texture and render-texture updates flush GPU consumers before mutation',
  () => {
    const output = target(2);
    const source = target(1);
    const value = buffer([ vertex(0, sf.Color.White) ]);
    const states = new sf.RenderStates(source.getTexture());
    source.clear(sf.Color.Red);
    source.display();
    output.clear();
    output.draw(value, states);
    source.clear(sf.Color.Green);
    source.display();
    states.transform.translate(point(1, 0));
    output.draw(value, states);
    output.display();
    assert.deepEqual(colors(output), [ 0xff0000ff, 0x00ff00ff ]);
    assert.throws(() => source.draw(value, source.getTexture()), /own texture/);
    const texture = new sf.Texture(new sf.Vector2u(1, 1));
    texture.update(new Uint8Array([ 255, 0, 0, 255 ]));
    output.clear();
    output.draw(value, texture);
    texture.update(new Uint8Array([ 0, 0, 255, 255 ]));
    output.draw(value, { texture, transform: new sf.Transform()
      .translate(point(1, 0)) });
    output.display();
    assert.deepEqual(colors(output), [ 0xff0000ff, 0x0000ffff ]);
  });

test('GPU recording makes no native calls and handles command overflow', t => {
  const output = target();
  const value = buffer([ vertex(0) ]);
  const calls = [];
  for (const [ name, fn ] of Object.entries(native)) {
    if (typeof fn === 'function') {
      t.mock.method(native, name, (...args) => {
        calls.push(name);
        return fn(...args);
      });
    }
  }
  for (let i = 0; i < 4096; i++) output.draw(value);
  assert.deepEqual(calls, []);
  output.draw(value, 0, 1);
  assert.deepEqual(calls, [ 'submitRenderTexture' ]);
  output.display();
  assert.deepEqual(calls, [ 'submitRenderTexture', 'submitRenderTexture' ]);
});

test('pending GPU draws retain buffers and textures only until submission',
  async () => {
    const output = target();
    let value = buffer([ vertex(0, sf.Color.White) ]);
    let texture = new sf.Texture(new sf.Vector2u(1, 1));
    texture.update(new Uint8Array([ 255, 0, 0, 255 ]));
    const references = [ new WeakRef(value), new WeakRef(texture) ];
    output.clear();
    output.draw(value, texture);
    value = null;
    texture = null;
    await setImmediate();
    global.gc();
    for (const reference of references) assert.ok(reference.deref());
    output.display();
    assert.equal(colors(output)[0], 0xff0000ff);
    await setImmediate();
    global.gc();
    for (const reference of references) {
      assert.equal(reference.deref(), undefined);
    }
    // Isolated context verifies native registry cleanup independently of JS GC.
    const context = native.createGraphicsContext();
    let mapping = native.createVertexBuffer(context, P.Points, 0);
    assert.equal(native.vertexBufferRegistrySize(context), 1);
    assert.ok(mapping.handle);
    mapping = null;
    // BackingStore sweeping and deferred deletion may span event-loop turns.
    for (let i = 0; i < 8; i++) { await setImmediate(); global.gc(); }
    assert.equal(native.vertexBufferRegistrySize(context), 0);
  });

test('invalid input cannot add a command or overwrite existing data', t => {
  const output = target();
  const value = buffer([ vertex(0) ]);
  const submit = t.mock.method(native, 'submitRenderTexture');
  for (const count of [ -1, 0.5, NaN, Infinity, 0xffffffff ]) {
    assert.throws(() => value.create(count), RangeError);
    assert.throws(() => value.update([], count, 0), RangeError);
  }
  for (const range of [[ -1, 1 ], [ 0, -1 ], [ NaN, 1 ], [ 0, 0.5 ]]) {
    assert.throws(() => output.draw(value, ...range), RangeError);
  }
  assert.throws(() => value.update([]), RangeError);
  assert.throws(() => value.update(new Array(1)), TypeError);
  assert.throws(() => value.update([{}]), TypeError);
  assert.throws(() => value.update([ vertex(0) ], 1, -1), RangeError);
  assert.throws(() => value.update(value, 1, 0), TypeError);
  assert.throws(() => value.swap({}), TypeError);
  assert.throws(() => sf.swap(value, new sf.Texture()), TypeError);
  assert.throws(() => sf.swap(value, {}), TypeError);
  assert.throws(() => value.setPrimitiveType(6), RangeError);
  assert.throws(() => value.setUsage(0), RangeError);
  assert.throws(() => new sf.VertexBuffer('invalid'), RangeError);
  assert.throws(() => sf.VertexBuffer.bind({}), TypeError);
  output.draw(value, 1, 1);
  output.draw(value, 0, 0);
  output.draw(new sf.VertexBuffer());
  output.flush();
  assert.equal(submit.mock.callCount(), 0);
  output.clear();
  output.draw(value);
  output.display();
  assert.equal(colors(output)[0], 0xff0000ff);
});

test('native rejects invalid GPU ranges and IDs before executing any command',
  () => {
    const context = graphicsContext();
    const output = native.createRenderTexture(context, 1, 1, {});
    const value = buffer([ vertex(0) ]);
    const words = new Uint32Array(output.buffer);
    const floats = new Float32Array(output.buffer);
    words[0] = 0;
    words[1] = 0xff0000ff;
    native.submitRenderTexture(output.handle, 1, true);
    words[1] = 0x00ff00ff;
    for (const [ first, count, id ] of [
      [ 2, 0, value[vertexBufferId] ], [ 0, 2, value[vertexBufferId] ],
      [ 0, 1, 0xffffffff ],
    ]) {
      words[43] = 6;
      words[44] = count;
      words.set([ first, P.Points, 0, 0, id ], 45);
      floats.set(sf.Transform.Identity.getMatrix(), 52);
      words.set([ 1, 0, 0, 1, 0, 0, 7, 0, 0, 0xffffffff, 0 ], 68);
      assert.throws(() => native.submitRenderTexture(output.handle, 2, true),
        TypeError);
      const bytes = native.readRenderTexturePixels(output.handle);
      assert.equal(bytes.readUInt32BE(0), 0xff0000ff);
    }
    assert.throws(() => native.updateVertexBuffer(
      value[graphicsNative], new Uint8Array(1), 1, 0), RangeError);
  });
