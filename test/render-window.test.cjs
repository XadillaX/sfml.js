'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const { setImmediate: nextTurn } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative, graphicsContext } =
  require('../dist/internal/graphics-state');
const { writeView } = require('../dist/graphics/view');
const windowHost = require('./fixtures/window-host.cjs');
const V = sf.Vector2u;
const F = sf.Vector2f;
const I = sf.Vector2i;

function windowFixture(t, options = {}) {
  const window = new sf.RenderWindow(new V(80, 60),
    'RenderWindow test', { style: sf.Style.None, ...options });
  window.setVerticalSyncEnabled(false);
  t.after(() => window.close());
  return window;
}

function capture(window) {
  const texture = new sf.Texture(window.getSize());
  texture.update(window);
  return texture.copyToImage();
}

function point(x, y, color = sf.Color.Red) {
  return new sf.Vertex(new F(x, y), color);
}

function colorAt(image, x = 0, y = 0) {
  return image.getPixel(new V(x, y)).toInteger();
}

test('RenderWindow exposes both complete base APIs and closed operations',
  () => {
    const window = new sf.RenderWindow();
    assert.ok(window instanceof sf.RenderWindow);
    assert.ok(window instanceof sf.RenderTarget);
    assert.ok(window instanceof sf.Window);
    assert.equal(new sf.RenderTexture() instanceof sf.Window, false);
    class Derived extends sf.RenderWindow {}
    const child = new Derived();
    assert.ok(child instanceof sf.Window);
    assert.ok(child instanceof Derived);
    assert.equal(window instanceof Derived, false);
    class OtherWindow extends sf.Window {}
    assert.equal(window instanceof OtherWindow, false);
    for (const Base of [ sf.Window, sf.RenderTarget ]) {
      for (const key of Reflect.ownKeys(Base.prototype)) {
        if (key !== 'constructor' &&
            typeof Base.prototype[key] === 'function') {
          assert.equal(typeof window[key], 'function', String(key));
        }
      }
    }
    assert.equal(window.isOpen(), false);
    assert.equal(window.isSrgb(), false);
    assert.equal(window.getNativeHandle(), 0n);
    assert.equal(window.pollEvent(), undefined);
    assert.equal(window.waitEvent(), undefined);
    window.clear();
    window.draw([ point(0, 0) ], sf.PrimitiveType.Points);
    window.display();
    window.pushGLStates();
    window.popGLStates();
    window.resetGLStates();
    window.setActive(false);
    window.close();
    window.close();
    child.close();
  });

test('RenderWindow batches draws once and Texture.update reads pending pixels',
  t => {
    const window = windowFixture(t);
    const texture = new sf.Texture(window.getSize());
    const submit = t.mock.method(native, 'submitRenderWindow');
    window.clear(sf.Color.Red);
    for (let i = 0; i < 20; i++) {
      window.draw([ point(i + 0.5, 0.5, sf.Color.Green) ],
        sf.PrimitiveType.Points);
    }
    assert.equal(submit.mock.callCount(), 0);
    texture.update(window);
    assert.equal(submit.mock.callCount(), 1);
    assert.equal(submit.mock.calls[0].arguments[2], false);
    const image = texture.copyToImage();
    assert.equal(colorAt(image, 0, 0), sf.Color.Green.toInteger());
    assert.equal(colorAt(image, 40, 40), sf.Color.Red.toInteger());
    window.clear(sf.Color.Blue);
    window.display();
    assert.equal(submit.mock.callCount(), 2);
    assert.equal(submit.mock.calls[1].arguments[2], true);
  });

test('RenderWindow draws Sprite, VertexArray, raw vertices and GPU ranges',
  t => {
    const window = windowFixture(t);
    const size = window.getSize();
    const reference = new sf.RenderTexture(size);
    const image = new sf.Image(new V(2, 2), sf.Color.Green);
    const sprite = new sf.Sprite(new sf.Texture(image));
    sprite.setPosition(new F(3, 4));
    sprite.setScale(new F(4, 5));
    // Constant colors avoid framebuffer-specific interpolation rounding.
    const vertices = [
      point(20, 5), point(50, 5), point(20, 30),
    ];
    const array = new sf.VertexArray(sf.PrimitiveType.Triangles);
    vertices.forEach(vertex => array.append(vertex));
    const buffer = new sf.VertexBuffer(sf.PrimitiveType.Points);
    assert.equal(buffer.create(3), true);
    assert.equal(buffer.update([
      point(60.5, 10.5), point(61.5, 10.5, sf.Color.Cyan),
      point(62.5, 10.5),
    ]), true);
    class Scene extends sf.Drawable {
      draw(target, states) {
        assert.ok(target instanceof sf.RenderTarget);
        target.draw(sprite, states);
        target.draw(array, states);
        target.draw([ point(70.5, 50.5) ], sf.PrimitiveType.Points);
        target.draw(buffer, 1, 1);
      }
    }
    const scene = new Scene();
    window.clear();
    reference.clear();
    window.draw(scene);
    reference.draw(scene);
    reference.display();
    const actual = capture(window);
    assert.deepEqual(actual.pixels,
      reference.getTexture().copyToImage().pixels);
    assert.equal(colorAt(actual, 61, 10), sf.Color.Cyan.toInteger());
    assert.equal(colorAt(actual, 60, 10), sf.Color.Black.toInteger());
  });

test('window draws preserve Sprite, vertex, texture and shader snapshots',
  async t => {
    const window = windowFixture(t);
    const texture = new sf.Texture(new sf.Image(new V(1, 1), sf.Color.Red));
    const sprite = new sf.Sprite(texture);
    sprite.setScale(new F(10, 10));
    window.clear();
    window.draw(sprite);
    sprite.setPosition(new F(20, 20));
    sprite.setColor(sf.Color.Blue);
    texture.update(new sf.Image(new V(1, 1), sf.Color.Green));
    let image = capture(window);
    assert.equal(colorAt(image, 0, 0), sf.Color.Red.toInteger());
    assert.equal(colorAt(image, 20, 20), sf.Color.Black.toInteger());

    const shader = new sf.Shader();
    assert.equal(await shader.loadFromMemory(
      'uniform vec4 tint; void main(){gl_FragColor=tint;}',
      sf.Shader.Type.Fragment), true);
    shader.setUniform('tint', new sf.Glsl.Vec4(sf.Color.Yellow));
    const vertex = point(15.5, 15.5);
    window.draw([ vertex ], sf.PrimitiveType.Points, shader);
    vertex.position = new F(30, 30);
    shader.setUniform('tint', new sf.Glsl.Vec4(sf.Color.Blue));
    image = capture(window);
    assert.equal(colorAt(image, 15, 15), sf.Color.Yellow.toInteger());
  });

test('RenderWindow view, viewport, scissor and resize retain SFML view state',
  t => {
    const window = windowFixture(t);
    const initialSize = window.getSize();
    const defaultView = window.getDefaultView();
    const currentView = window.getView();
    assert.equal(sf.equal(defaultView.getSize(),
      new F(initialSize.x, initialSize.y)), true);
    const view = new sf.View(new F(40, 30), new F(80, 60));
    view.setViewport(new sf.FloatRect(new F(0.25, 0), new F(0.5, 1)));
    view.setScissor(new sf.FloatRect(new F(0.25, 0), new F(0.25, 1)));
    window.clear();
    window.setView(view);
    window.clear();
    window.draw([
      point(0, 0), point(80, 0), point(0, 60),
      point(80, 0), point(80, 60), point(0, 60),
    ], sf.PrimitiveType.Triangles);
    const image = capture(window);
    assert.equal(colorAt(image, 25, 20), sf.Color.Red.toInteger());
    assert.equal(colorAt(image, 50, 20), sf.Color.Black.toInteger());
    assert.equal(window.getViewport(view).size.x, initialSize.x / 2);
    const coords = window.mapPixelToCoords(new I(40, 30));
    const oracleTarget = new sf.RenderTexture(initialSize);
    const viewData = new Float32Array(13);
    writeView(view, viewData, 0);
    const oracle = native.viewCoordinatesOracle(
      oracleTarget[graphicsNative], viewData, coords.x, coords.y, 40, 30);
    assert.deepEqual([ coords.x, coords.y ], oracle.slice(2, 4));
    assert.equal(sf.equal(window.mapCoordsToPixel(coords), new I(40, 30)),
      true);
    window.setSize(new V(initialSize.x + 20, initialSize.y + 10));
    let resized = false;
    window.handleEvents({ Resized: () => { resized = true; } });
    assert.equal(resized, true);
    assert.equal(window.getView(), currentView);
    assert.equal(window.getDefaultView(), defaultView);
    assert.equal(sf.equal(window.getView().getSize(), view.getSize()), true);
    assert.equal(sf.equal(defaultView.getSize(),
      new F(initialSize.x, initialSize.y)), true);
  });

test('offscreen textures can feed windows across GL context switches',
  t => {
    const window = windowFixture(t);
    const source = new sf.RenderTexture(new V(4, 4));
    source.clear(sf.Color.Green);
    source.display();
    const sprite = new sf.Sprite(source.getTexture());
    sprite.setScale(new F(5, 5));
    window.clear(sf.Color.Blue);
    window.draw(sprite);
    source.clear(sf.Color.Red);
    source.display();
    assert.equal(colorAt(capture(window), 0, 0), sf.Color.Green.toInteger());
    window.pushGLStates();
    window.popGLStates();
    window.resetGLStates();
    assert.equal(window.setActive(), true);
    window.clear(sf.Color.Yellow);
    assert.equal(window.setActive(false), true);
    assert.equal(colorAt(capture(window), 0, 0), sf.Color.Yellow.toInteger());
  });

test('RenderWindow recreation resets views and supports external handles',
  t => {
    const window = windowFixture(t);
    const defaultView = window.getDefaultView();
    window.setView(new sf.View(new F(2, 3), new F(4, 5)));
    window.clear(sf.Color.Red);
    window.create(new sf.VideoMode(new V(96, 64)), 'Recreated', {
      style: sf.Style.None,
      settings: { depthBits: 24, stencilBits: 8 },
    });
    assert.equal(window.getDefaultView(), defaultView);
    assert.equal(sf.equal(window.getView().getSize(), new F(96, 64)), true);
    assert.ok(window.getSettings().depthBits >= 24);
    window.clear(sf.Color.Cyan, 0);
    window.clearStencil(1);
    assert.equal(colorAt(capture(window)), sf.Color.Cyan.toInteger());
    const host = windowHost(window);
    const embedded = new sf.RenderWindow(host.handle);
    try {
      assert.equal(embedded.isOpen(), true);
      assert.equal(embedded.getNativeHandle(), host.handle);
      embedded.clear(sf.Color.Yellow);
      assert.equal(colorAt(capture(embedded)), sf.Color.Yellow.toInteger());
    } finally {
      embedded.close();
      host.close();
    }
    window.close();
    window.clear(sf.Color.Red);
    window.create(new V(64, 48), 'Reopened', { style: sf.Style.None });
    window.clear(sf.Color.Blue);
    assert.equal(colorAt(capture(window)), sf.Color.Blue.toInteger());
  });

test('RenderWindow supports icons, mouse coordinates and cursor ownership',
  async t => {
    const window = windowFixture(t);
    window.setIcon(new sf.Image(new V(2, 2), sf.Color.Red));
    window.setIcon(new V(2, 2), Buffer.alloc(16, 255));
    assert.ok(sf.Mouse.getPosition(window) instanceof I);
    let cursor = new sf.Cursor(sf.Cursor.Type.Hand);
    native.watchCursor(cursor[graphicsNative]);
    window.setMouseCursor(cursor);
    cursor = null;
    await nextTurn();
    global.gc();
    assert.equal(native.isWatchedCursorAlive(), true);
    window.close();
    assert.equal(native.isWatchedCursorAlive(), false);
  });

test('RenderWindow validates input and retains queued resources until close',
  async t => {
    const window = windowFixture(t);
    assert.throws(() => window.setSize(new I()), TypeError);
    assert.throws(() => window.setIcon(new V(2, 2), new Uint8Array(3)),
      RangeError);
    assert.throws(() => window.create(0n), RangeError);
    assert.throws(() => window.create(new V(10, 10), '', { state: 8 }),
      RangeError);
    assert.throws(() => window.setActive(1), TypeError);
    assert.equal(typeof window.isSrgb(), 'boolean');
    let sprite = new sf.Sprite(
      new sf.Texture(new sf.Image(new V(1, 1), sf.Color.Green)));
    const weak = new WeakRef(sprite);
    window.draw(sprite);
    sprite = null;
    await nextTurn();
    global.gc();
    assert.ok(weak.deref());
    window.close();
    for (let i = 0; i < 10; i++) {
      await nextTurn();
      global.gc();
      if (!weak.deref()) break;
    }
    assert.equal(weak.deref(), undefined);
  });

test('RenderWindow command memory retains the window until deferred release',
  async () => {
    let mapping = native.createRenderWindow(graphicsContext());
    native.openWindow(mapping.window, 80, 60, 'Deferred RenderWindow',
      32, sf.Style.Default, sf.State.Windowed, {});
    let cursor = new sf.Cursor(sf.Cursor.Type.Hand);
    native.watchCursor(cursor[graphicsNative]);
    native.setWindowCursor(mapping.window, cursor[graphicsNative]);
    const memory = mapping.buffer;
    const references = [
      new WeakRef(mapping.handle), new WeakRef(mapping.window),
      new WeakRef(cursor),
    ];
    mapping = null;
    cursor = null;
    for (let i = 0; i < 20; i++) {
      await nextTurn();
      global.gc();
      if (references.every(ref => !ref.deref())) break;
    }
    assert.equal(references.every(ref => !ref.deref()), true);
    assert.equal(native.isWatchedCursorAlive(), true);
    native.releaseBackingOffThread(memory);
    assert.equal(memory.byteLength, 0);
    for (let i = 0; i < 20; i++) {
      await nextTurn();
      if (!native.isWatchedCursorAlive()) break;
    }
    assert.equal(native.isWatchedCursorAlive(), false);
  });

test('open RenderWindows are closed during process exit', () => {
  const result = spawnSync(process.execPath, [ '-e', `
    const sf = require(${JSON.stringify(require.resolve('..'))});
    global.window = new sf.RenderWindow(new sf.Vector2u(80, 60), 'Exit test');
    window.clear(sf.Color.Green);
    window.display();
  ` ], { encoding: 'utf8', timeout: 5000 });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
});
