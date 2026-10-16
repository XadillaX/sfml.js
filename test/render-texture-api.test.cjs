'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative, textureId } =
  require('../dist/internal/graphics-state');

const size = (x = 1, y = 1) => new sf.Vector2u(x, y);
const point = (x, y) => new sf.Vector2f(x, y);
const handle = value => value[graphicsNative];
const xy = value => [ value.x, value.y ];
const read = target => [ ...target.getTexture().copyToImage().pixels ];
const rgba = color => [ color.r, color.g, color.b, color.a ];
function target(color = sf.Color.Red, x = 1, y = 1, settings) {
  const result = new sf.RenderTexture(size(x, y), settings);
  result.clear(color);
  result.display();
  return result;
}
function quad(width, height, edgeX = width, edgeY = height, offset = 0) {
  const result = new sf.VertexArray(sf.PrimitiveType.TriangleStrip, 4);
  for (const [ i, x, y, u, v ] of [
    [ 0, 0, 0, offset, offset ],
    [ 1, width, 0, edgeX + offset, offset ],
    [ 2, 0, height, offset, edgeY + offset ],
    [ 3, width, height, edgeX + offset, edgeY + offset ],
  ]) {
    result.getVertex(i).position = point(x, y);
    result.getVertex(i).texCoords = point(u, v);
  }
  return result;
}

test('Default RenderTexture can be queried, then resized with a retained view',
  () => {
    const source = new sf.RenderTexture();
    const view = source.getTexture();
    const id = view[textureId];
    assert.deepEqual(xy(source.getSize()), [ 0, 0 ]);
    assert.equal(view.getNativeHandle(), 0);
    assert.equal(source.isSrgb(), false);
    assert.equal(source.setActive(), false);
    assert.equal(source.setActive(false), false);
    assert.equal(source.generateMipmap(), false);
    source.clear(sf.Color.Blue);
    source.display();
    source.setSmooth(true);
    source.setRepeated(true);
    assert.equal(view.isSmooth(), true);
    assert.equal(view.isRepeated(), true);
    assert.equal(source.resize(size(4, 2)), true);
    assert.equal(source.getTexture(), view);
    assert.equal(view[textureId], id);
    assert.equal(native.renderTextureSharesTexture(
      handle(source), handle(view)), true);
    assert.deepEqual(xy(view.getSize()), [ 4, 2 ]);
    assert.equal(view.isSmooth(), false);
    assert.equal(view.isRepeated(), true);
    source.clear(sf.Color.Green);
    source.display();
    assert.deepEqual(read(source), Array(8).fill(rgba(sf.Color.Green)).flat());
  });

test('Resize flushes old draws, preserves identity and resets the default view',
  async () => {
    let source = target();
    const view = source.getTexture();
    const oldHandle = handle(view);
    const oldId = view[textureId];
    const sprite = new sf.Sprite(view);
    const output = target(sf.Color.Black, 3, 1);
    output.draw(sprite);
    source.clear(sf.Color.Blue);
    assert.equal(source.resize(size(2, 1)), true);
    source.clear(sf.Color.Green);
    source.display();
    assert.equal(handle(view), oldHandle);
    assert.equal(view[textureId], oldId);
    assert.deepEqual(xy(view.getSize()), [ 2, 1 ]);
    assert.deepEqual(xy(sprite.getTextureRect().size), [ 1, 1 ]);
    sprite.setTexture(view, true);
    sprite.setPosition(point(1, 0));
    output.draw(sprite);
    output.display();
    assert.deepEqual(read(output),
      [ ...rgba(sf.Color.Red),
        ...rgba(sf.Color.Green), ...rgba(sf.Color.Green) ]);
    // The target's new default view must use the new pixel dimensions.
    const dot = new sf.Sprite(new sf.Texture(
      new sf.Image(size(), sf.Color.Blue)));
    dot.setPosition(point(1, 0));
    source.draw(dot);
    source.display();
    assert.deepEqual(read(source),
      [ ...rgba(sf.Color.Green), ...rgba(sf.Color.Blue) ]);
    const observed = native.observeRenderTexture(handle(source));
    source = null;
    await setImmediate();
    global.gc();
    assert.equal(native.renderTextureExpired(observed), false);
    assert.deepEqual(xy(new sf.Texture(view).getSize()), [ 2, 1 ]);
  });

test('Failed resize preserves allocation, dimensions, flags and future drawing',
  () => {
    const source = target();
    const view = source.getTexture();
    source.setSmooth(true);
    source.setRepeated(true);
    const id = view.getNativeHandle();
    for (const [ dimensions, settings ] of [
      [ size(0, 1), {}],
      [ size(sf.Texture.getMaximumSize() + 1, 1), {}],
      [ size(2, 2), {
        antiAliasingLevel: sf.RenderTexture.getMaximumAntiAliasingLevel() + 1,
      }],
    ]) {
      assert.equal(source.resize(dimensions, settings), false);
      assert.deepEqual(xy(source.getSize()), [ 1, 1 ]);
      assert.equal(view.getNativeHandle(), id);
      assert.equal(view.isSmooth(), true);
      assert.equal(view.isRepeated(), true);
      assert.deepEqual(read(source), rgba(sf.Color.Red));
    }
    source.clear(sf.Color.Blue);
    source.display();
    assert.deepEqual(read(source), rgba(sf.Color.Blue));
  });

for (const repeat of [ false, true ]) {
  test(`Sampling change preserves old rendered filtering (${repeat})`, t => {
    const image = new sf.Image(size(2, 1), new Uint8Array([
      ...rgba(sf.Color.Red), ...rgba(sf.Color.Blue),
    ]));
    const source = target(sf.Color.Black, 2, 1);
    source.draw(new sf.Sprite(new sf.Texture(image)));
    source.display();
    const view = source.getTexture();
    const output = target(sf.Color.Black, 8, 2);
    const vertices = quad(8, 1, repeat ? 8 : 2, 1);
    const states = new sf.RenderStates(view);
    output.draw(vertices, states);
    source.clear(sf.Color.Green);
    const calls = [];
    const submit = native.submitRenderTexture;
    t.mock.method(native, 'submitRenderTexture', (...args) => {
      calls.push(args);
      return submit(...args);
    });
    if (repeat) source.setRepeated(true);
    else source.setSmooth(true);
    assert.deepEqual(calls.map(call => call[0]), [ handle(output) ]);
    const before = calls.length;
    if (repeat) source.setRepeated(true);
    else source.setSmooth(true);
    assert.equal(calls.length, before);
    assert.equal(repeat ? view.isRepeated() : view.isSmooth(), true);
    states.transform.translate(point(0, 1));
    output.draw(vertices, states);
    output.display();
    const expected = native.renderOffscreenSamplingOracle(repeat);
    assert.deepEqual(read(output), [ ...new Uint8Array(expected.buffer) ]);
    source.display();
  });
}

test('Mipmap generation preserves recorded sampling and display invalidates it',
  () => {
    const image = new sf.Image(size(64, 64));
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        image.setPixel(size(x, y),
          (x + y) % 2 ? sf.Color.White : sf.Color.Black);
      }
    }
    const expected = native.renderOffscreenMipmapOracle(handle(image));
    const source = target(sf.Color.Black, 64, 64);
    source.draw(new sf.Sprite(new sf.Texture(image)));
    source.display();
    source.setSmooth(true);
    const output = target(sf.Color.Black, 8, 24);
    const vertices = quad(8, 8, 64, 64, 0.2);
    const states = new sf.RenderStates(source.getTexture());
    output.draw(vertices, states);
    assert.equal(source.generateMipmap(), expected.generated);
    states.transform.translate(point(0, 8));
    output.draw(vertices, states);
    source.clear(sf.Color.Blue);
    source.display();
    states.transform.translate(point(0, 8));
    output.draw(vertices, states);
    output.display();
    assert.deepEqual(read(output), [ ...new Uint8Array(expected.buffer) ]);
  });

test('ContextSettings allocate framebuffer buffers and refresh sRGB', t => {
  assert.deepEqual([ sf.ContextAttribute.Default, sf.ContextAttribute.Core,
    sf.ContextAttribute.Debug ], [ 0, 1, 4 ]);
  const maximum = sf.RenderTexture.getMaximumAntiAliasingLevel();
  assert.ok(Number.isInteger(maximum) && maximum >= 0);
  const requested = {
    depthBits: 24, stencilBits: 8,
    antiAliasingLevel: maximum ? Math.min(4, maximum) : 0,
    majorVersion: 2, minorVersion: 1,
    attributeFlags: sf.ContextAttribute.Default, sRgbCapable: true,
  };
  const source = target(sf.Color.Red, 8, 8, requested);
  const view = source.getTexture();
  assert.equal(source.setActive(), true);
  const [ framebuffer, depth, stencil, samples ] =
    native.inspectActiveFramebuffer();
  assert.ok(framebuffer > 0);
  assert.ok(depth >= 24);
  assert.ok(stencil >= 8);
  assert.equal(samples, requested.antiAliasingLevel);
  const state = native.readRenderTextureState(handle(source));
  assert.equal(source.isSrgb(), state.targetSrgb);
  assert.equal(view.isSrgb(), state.sRgb);
  assert.deepEqual(read(source), Array(64).fill(rgba(sf.Color.Red)).flat());
  requested.sRgbCapable = false;
  assert.equal(source.isSrgb(), state.targetSrgb);
  assert.equal(source.resize(size(2, 2)), true);
  assert.equal(source.isSrgb(), false);
  assert.equal(view.isSrgb(), false);
  source.setActive();
  const baseline = native.inspectActiveFramebuffer();
  assert.equal(baseline[1], 0);
  assert.equal(baseline[2], 0);
  assert.equal(baseline[3], 0);
  source.clear();
  source.display();
  for (const [ name, fn ] of Object.entries(native)) {
    if (typeof fn === 'function') {
      t.mock.method(native, name,
        () => assert.fail(`Unexpected native query: ${name}`));
    }
  }
  assert.deepEqual(xy(view.getSize()), [ 2, 2 ]);
  assert.equal(source.isSrgb(), false);
  assert.equal(source.isSmooth(), false);
  assert.equal(source.isRepeated(), false);
});

test('setActive flushes earlier draws and consumers before selecting its FBO',
  () => {
    const source = target();
    const view = source.getTexture();
    const output = target(sf.Color.Black);
    output.draw(new sf.Sprite(view));
    source.clear(sf.Color.Green);
    assert.equal(source.setActive(), true);
    assert.ok(native.inspectActiveFramebuffer()[0] > 0);
    native.clearActiveFramebuffer();
    source.display();
    output.display();
    assert.deepEqual(read(output), rgba(sf.Color.Red));
    assert.deepEqual(read(source), rgba(sf.Color.Blue));
    source.clear(sf.Color.Green);
    assert.equal(source.setActive(false), true);
    assert.equal(native.inspectActiveFramebuffer()[0], 0);
    source.display();
    assert.deepEqual(read(source), rgba(sf.Color.Green));
  });

test('Invalid RenderTexture arguments fail before submitting draws', t => {
  const source = target();
  source.clear(sf.Color.Blue);
  t.mock.method(native, 'submitRenderTexture',
    () => assert.fail('Invalid arguments submitted pending work'));
  for (const settings of [
    null, [], { depthBits: -1 }, { stencilBits: 33 },
    { antiAliasingLevel: 0.5 }, { majorVersion: NaN }, { minorVersion: -1 },
    { attributeFlags: 2 }, { sRgbCapable: 1 },
  ]) assert.throws(() => source.resize(size(), settings));
  assert.throws(() => source.resize(new sf.Vector2f(2, 2)), TypeError);
  assert.throws(() => new sf.RenderTexture({ x: 2, y: 2 }), TypeError);
  assert.throws(() => source.setSmooth(1), TypeError);
  assert.throws(() => source.setRepeated(null), TypeError);
  assert.throws(() => source.setActive('true'), TypeError);
  assert.throws(() => native.resizeRenderTexture(handle(source), 2, 2,
    { attributeFlags: 2 }), RangeError);
  assert.throws(() => native.setRenderTextureSmooth(handle(source), 1),
    TypeError);
  assert.throws(() => native.setRenderTextureActive({}, true), TypeError);
});
