'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { writeView } = require('../dist/graphics/view');
const { graphicsNative } = require('../dist/internal/graphics-state');
const p = (x = 0, y = 0) => new sf.Vector2f(x, y);
const size = (x, y) => new sf.Vector2u(x, y);
const rect = (x, y, w, h) => new sf.FloatRect(p(x, y), p(w, h));
const xy = value => [ value.x, value.y ];
const rectangle = value => [ ...xy(value.position), ...xy(value.size) ];
const data = view => {
  const result = new Float32Array(13);
  writeView(view, result, 0);
  return result;
};
const pixels = target => [ ...target.getTexture().copyToImage().pixels ];
function near(actual, expected, tolerance = 0.00002) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, i) => {
    if (Number.isNaN(expected[i])) assert.ok(Number.isNaN(value));
    else {
      assert.ok(Math.abs(value - expected[i]) <=
        tolerance * Math.max(1, Math.abs(expected[i])),
      `${i}: ${value} != ${expected[i]}`);
    }
  });
}

test('View constructors, independent copies and value getters', () => {
  const view = new sf.View();
  assert.deepEqual(xy(view.getCenter()), [ 500, 500 ]);
  assert.deepEqual(xy(view.getSize()), [ 1000, 1000 ]);
  assert.equal(view.getRotation().asRadians(), 0);
  assert.deepEqual(rectangle(view.getViewport()), [ 0, 0, 1, 1 ]);
  assert.deepEqual(rectangle(view.getScissor()), [ 0, 0, 1, 1 ]);
  const source = rect(10, 20, 30, 40);
  const fromRect = new sf.View(source);
  assert.deepEqual(xy(fromRect.getCenter()), [ 25, 40 ]);
  assert.deepEqual(xy(fromRect.getSize()), [ 30, 40 ]);
  source.position.x = 100;
  fromRect.getCenter().x = 200;
  assert.equal(fromRect.getCenter().x, 25);
  const copy = new sf.View(fromRect);
  fromRect.move(p(3, 4));
  assert.deepEqual(xy(copy.getCenter()), [ 25, 40 ]);
  copy.setRotation(sf.degrees(-90));
  near([ copy.getRotation().asDegrees() ], [ 270 ]);
  copy.rotate(sf.degrees(180));
  near([ copy.getRotation().asDegrees() ], [ 90 ]);
  copy.zoom(0.5);
  assert.deepEqual(xy(copy.getSize()), [ 15, 20 ]);
  const center = p(7, 9);
  const dimensions = p(8, 12);
  const direct = new sf.View(center, dimensions);
  center.x = 0;
  dimensions.x = 0;
  assert.deepEqual(xy(direct.getCenter()), [ 7, 9 ]);
  assert.deepEqual(xy(direct.getSize()), [ 8, 12 ]);
});

test('View const rectangles and transforms keep identity and refresh', () => {
  const view = new sf.View(rect(0, 0, 20, 10));
  const viewport = view.getViewport();
  const position = viewport.position;
  const scissor = view.getScissor();
  const transform = view.getTransform();
  const matrix = transform.getMatrix();
  const inverse = view.getInverseTransform();
  view.setViewport(rect(0.5, 0, 0.5, 1));
  view.setScissor(rect(0.25, 0.25, 0.5, 0.5));
  assert.equal(view.getViewport(), viewport);
  assert.equal(viewport.position, position);
  assert.equal(position.x, 0.5);
  assert.deepEqual(rectangle(scissor), [ 0.25, 0.25, 0.5, 0.5 ]);
  const before = [ ...matrix ];
  view.move(p(10, 0));
  assert.equal(view.getTransform(), transform);
  assert.notDeepEqual([ ...matrix ], before);
  assert.equal(view.getInverseTransform(), inverse);
  near(xy(inverse.transformPoint(p())), [ 20, 5 ]);
  assert.throws(() => { viewport.position.x = 0; }, TypeError);
  assert.throws(() => { viewport.size = p(1, 1); }, TypeError);
  assert.throws(() => transform.translate(p(1, 1)), TypeError);
});

test('View projection and inverse match native SFML across rotations and zoom',
  () => {
    for (const angle of [ 0, 12, -37, 90, 180, 359 ]) {
      for (const dimensions of [ p(640, 480), p(-320, 200), p(0.25, 3) ]) {
        const view = new sf.View(p(31.25, -8.5), dimensions);
        view.setRotation(sf.degrees(angle));
        view.zoom(1.25);
        const expected = native.viewOracle(data(view));
        near(view.getTransform().getMatrix(), expected.matrix);
        near(view.getInverseTransform().getMatrix(), expected.inverse);
      }
    }
  });

test('View methods and target coordinate queries make no native calls', t => {
  const target = new sf.RenderTexture(size(80, 40));
  for (const [ name, value ] of Object.entries(native)) {
    if (typeof value === 'function') {
      t.mock.method(native, name, () => assert.fail(`Native call: ${name}`));
    }
  }
  const view = new sf.View(rect(0, 0, 80, 40));
  view.move(p(5, 6));
  view.rotate(sf.degrees(20));
  view.zoom(2);
  view.getTransform();
  view.getInverseTransform();
  target.setView(view);
  target.mapPixelToCoords(new sf.Vector2i(10, 20));
  target.mapCoordsToPixel(p(10, 20), view);
  target.getViewport(view);
  target.getScissor(view);
});

test('Viewport/scissor rounding and coordinate overloads match SFML', () => {
  const target = new sf.RenderTexture(size(301, 203));
  const view = new sf.View(p(57, 31), p(120, 80));
  for (const angle of [ 0, 17, -90 ]) {
    view.setRotation(sf.degrees(angle));
    view.setViewport(rect(-0.5, 0.25, 0.5, 0.75));
    view.setScissor(rect(0.25, 0.25, 0.5, 0.5));
    target.setView(view);
    for (const [ x, y ] of [[ 0, 0 ], [ -12, 54 ], [ 203, 101 ]]) {
      const coords = p(x + 0.3, y - 0.2);
      const pixel = new sf.Vector2i(x, y);
      const expected = native.viewCoordinatesOracle(
        target[graphicsNative], data(view), coords.x, coords.y, x, y);
      assert.deepEqual(rectangle(target.getViewport(view)),
        expected.slice(4, 8));
      assert.deepEqual(rectangle(target.getScissor(view)), expected.slice(8));
      near(xy(target.mapPixelToCoords(pixel)), expected.slice(2, 4));
      near(xy(target.mapPixelToCoords(pixel, view)), expected.slice(2, 4));
      assert.deepEqual(xy(target.mapCoordsToPixel(coords)),
        expected.slice(0, 2));
      assert.deepEqual(xy(target.mapCoordsToPixel(coords, view)),
        expected.slice(0, 2));
    }
  }
});

test('Target views are const live references; successful resize resets both',
  () => {
    const target = new sf.RenderTexture();
    const current = target.getView();
    const original = target.getDefaultView();
    assert.deepEqual(xy(current.getSize()), [ 1000, 1000 ]);
    assert.throws(() => current.move(p(1, 1)), TypeError);
    assert.equal(target.resize(size(80, 40)), true);
    assert.equal(target.getView(), current);
    assert.equal(target.getDefaultView(), original);
    assert.deepEqual(xy(original.getCenter()), [ 40, 20 ]);
    const view = new sf.View(original);
    view.move(p(4, 6));
    target.setView(view);
    view.move(p(50, 50));
    assert.deepEqual(xy(current.getCenter()), [ 44, 26 ]);
    assert.deepEqual(xy(original.getCenter()), [ 40, 20 ]);
    assert.equal(target.resize(size(0, 1)), false);
    assert.deepEqual(xy(current.getCenter()), [ 44, 26 ]);
    assert.equal(target.resize(size(20, 10)), true);
    assert.deepEqual(xy(current.getCenter()), [ 10, 5 ]);
    assert.deepEqual(xy(original.getSize()), [ 20, 10 ]);
  });

test('Recorded view changes, rotation and scissor clearing match SFML pixels',
  () => {
    const target = new sf.RenderTexture(size(32, 16));
    const original = target.getDefaultView();
    const texture = new sf.Texture(new sf.Image(size(4, 4), sf.Color.White));
    const sprite = new sf.Sprite(texture);
    target.clear(sf.Color.Black);
    const view = new sf.View(original);
    view.setViewport(rect(0, 0, 0.5, 1));
    view.setCenter(p(8, 8));
    view.setSize(p(16, 16));
    target.setView(view);
    sprite.setPosition(p(4, 4));
    sprite.setColor(sf.Color.Red);
    target.draw(sprite);
    view.setRotation(sf.degrees(90));
    view.setViewport(rect(0.5, 0, 0.5, 1));
    target.setView(view);
    sprite.setColor(sf.Color.Green);
    target.draw(sprite);
    view.setScissor(rect(0.25, 0.5, 0.5, 0.5));
    target.setView(view);
    target.clear(sf.Color.Blue);
    target.setView(original);
    sprite.setPosition(p(0, 12));
    sprite.setColor(sf.Color.Yellow);
    target.draw(sprite);
    view.setSize(p(2, 2));
    target.display();
    const expected = native.renderViewOracle();
    assert.deepEqual(pixels(target), [ ...new Uint8Array(expected.buffer) ]);
  });

test('View commands survive full buffers and scissor applies to vertex draws',
  () => {
    const target = new sf.RenderTexture(size(8, 1));
    target.clear(sf.Color.Black);
    const view = new sf.View(target.getDefaultView());
    for (let i = 0; i < 4096; i++) target.setView(view);
    view.setScissor(rect(0.5, 0, 0.5, 1));
    target.setView(view);
    const vertices = Array.from({ length: 8 }, (_, x) =>
      new sf.Vertex(p(x + 0.5, 0.5), sf.Color.Red));
    target.draw(vertices, sf.PrimitiveType.Points);
    target.flush();
    target.display();
    assert.deepEqual(pixels(target),
      Array(4).fill([ 0, 0, 0, 255 ]).flat()
        .concat(Array(4).fill([ 255, 0, 0, 255 ]).flat()));
  });

test('GL push/pop restore external states after deferred drawing; reset works',
  () => {
    const target = new sf.RenderTexture(size(32, 32));
    target.setActive();
    native.setExternalGLState();
    const saved = native.readGLState();
    target.pushGLStates();
    assert.deepEqual(native.readGLState().slice(-2), [ 0, 0 ]);
    target.clear(sf.Color.Red);
    target.draw(new sf.Sprite(new sf.Texture(
      new sf.Image(size(1, 1), sf.Color.Blue))));
    target.popGLStates();
    assert.deepEqual(native.readGLState(), saved);
    target.resetGLStates();
    assert.deepEqual(native.readGLState().slice(-2), [ 0, 0 ]);
    target.display();
    assert.deepEqual(pixels(target).slice(0, 4), [ 0, 0, 255, 255 ]);
    assert.equal(typeof sf.RenderTarget.prototype.setActive, 'function');
    assert.equal(sf.RenderTarget.prototype.isSrgb.call(target), false);
  });

test('Invalid views and scissor rectangles fail without altering a full queue',
  t => {
    const target = new sf.RenderTexture(size(1, 1));
    for (let i = 0; i < 4096; i++) target.clear();
    t.mock.method(native, 'submitRenderTexture',
      () => assert.fail('Invalid input flushed a batch'));
    const view = new sf.View();
    for (const invalid of [
      rect(-0.1, 0, 1, 1), rect(0, 0, 2, 1), rect(0, NaN, 1, 1),
    ]) assert.throws(() => view.setScissor(invalid), RangeError);
    assert.deepEqual(rectangle(view.getScissor()), [ 0, 0, 1, 1 ]);
    assert.throws(() => new sf.View(new sf.IntRect()), TypeError);
    assert.throws(() => view.setCenter(new sf.Vector2i()), TypeError);
    assert.throws(() => view.setRotation(90), TypeError);
    assert.throws(() => target.setView({}), TypeError);
    assert.throws(() => target.getViewport({}), TypeError);
    assert.throws(() => target.mapPixelToCoords(p()), TypeError);
    assert.throws(() => target.mapCoordsToPixel(new sf.Vector2i()), TypeError);
    assert.throws(() => native.changeRenderTextureGLStates(
      target[graphicsNative], 3), RangeError);
  });

test('Native rejects an invalid view before executing any command', () => {
  const mapping = native.createRenderTexture(
    native.createGraphicsContext(), 1, 1);
  const words = new Uint32Array(mapping.buffer);
  const floats = new Float32Array(mapping.buffer);
  words[1] = sf.Color.Red.toInteger();
  native.submitRenderTexture(mapping.handle, 1, true);
  words[1] = sf.Color.Blue.toInteger();
  words[43] = 5;
  floats.set(data(new sf.View(rect(0, 0, 1, 1))), 52);
  floats[52 + 9] = -1;
  assert.throws(() => native.submitRenderTexture(mapping.handle, 2, true),
    TypeError);
  assert.deepEqual([ ...native.readRenderTexturePixels(mapping.handle) ],
    [ 255, 0, 0, 255 ]);
});

test('View scissor clips stencil clearing in the recorded sequence', () => {
  const target = new sf.RenderTexture(size(8, 1), { stencilBits: 8 });
  target.clear(sf.Color.Black, 0);
  const view = new sf.View(target.getDefaultView());
  view.setScissor(rect(0, 0, 0.5, 1));
  target.setView(view);
  target.clearStencil(1);
  target.setView(target.getDefaultView());
  const vertices = Array.from({ length: 8 }, (_, x) =>
    new sf.Vertex(p(x + 0.5, 0.5), sf.Color.White));
  target.draw(vertices, sf.PrimitiveType.Points, {
    stencilMode: new sf.StencilMode({
      stencilComparison: sf.StencilComparison.Equal, stencilReference: 1,
    }),
  });
  target.display();
  assert.deepEqual(pixels(target), Array(4).fill([ 255, 255, 255, 255 ]).flat()
    .concat(Array(4).fill([ 0, 0, 0, 255 ]).flat()));
});
