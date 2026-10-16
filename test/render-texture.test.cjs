'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  graphicsNative, graphicsContext, textureId,
} = require('../dist/internal/graphics-state');

const size = (w = 1, h = 1) => new sf.Vector2u(w, h);
const point = (x, y) => new sf.Vector2f(x, y);
const handle = value => value[graphicsNative];
const pixels = texture => [ ...texture.copyToImage().pixels ];
const read = target => pixels(target.getTexture());
const rgba = color => [ color.r, color.g, color.b, color.a ];

function target(color = sf.Color.Red, w = 1, h = 1) {
  const result = new sf.RenderTexture(size(w, h));
  result.clear(color);
  result.display();
  return result;
}

function quad(w = 1, h = 1) {
  const vertices = new sf.VertexArray(sf.PrimitiveType.TriangleStrip, 4);
  for (const [ i, x, y ] of [
    [ 0, 0, 0 ], [ 1, w, 0 ], [ 2, 0, h ], [ 3, w, h ],
  ]) {
    vertices.getVertex(i).position = point(x, y);
    vertices.getVertex(i).texCoords = point(x, y);
  }
  return vertices;
}

function fixture() {
  return new sf.Image(size(3, 2), new Uint8Array([
    ...rgba(sf.Color.Red), ...rgba(sf.Color.Green), ...rgba(sf.Color.Blue),
    ...rgba(sf.Color.Yellow), ...rgba(sf.Color.Magenta), ...rgba(sf.Color.Cyan),
  ]));
}

function traceSubmissions(t) {
  const calls = [];
  const submit = native.submitRenderTexture;
  t.mock.method(native, 'submitRenderTexture', (...args) => {
    calls.push(args);
    return submit(...args);
  });
  return calls;
}

async function collectUntil(check) {
  for (let i = 0; i < 80; i++) {
    await setImmediate();
    global.gc();
    if (check()) return;
  }
  assert.fail('Resource was not released after collection');
}

test('RenderTexture caches a const alias without allocating or submitting',
  t => {
    const source = target(sf.Color.Red, 3, 2);
    source.clear(sf.Color.Blue);
    const calls = [];
    for (const [ name, fn ] of Object.entries(native)) {
      if (typeof fn === 'function') {
        t.mock.method(native, name, (...args) => {
          calls.push(name);
          return fn(...args);
        });
      }
    }
    const view = source.getTexture();
    for (let i = 0; i < 128; i++) {
      assert.equal(source.getTexture(), view);
      assert.equal(view.getSize().x, 3);
      assert.equal(view.getSize().y, 2);
      assert.equal(view.isSmooth(), false);
      assert.equal(view.isRepeated(), false);
      assert.equal(view.isSrgb(), false);
    }
    assert.deepEqual(calls, [ 'getRenderTextureTexture' ]);
    assert.ok(view instanceof sf.Texture);
    assert.equal(native.renderTextureSharesTexture(
      handle(source), handle(view)), true);
    assert.equal(native.renderTextureSharesTexture(
      handle(source), handle(new sf.Texture(view))), false);
    assert.deepEqual(pixels(view), Array(6).fill(rgba(sf.Color.Red)).flat());
    source.display();
    assert.equal(source.getTexture(), view);
    assert.deepEqual(pixels(view), Array(6).fill(rgba(sf.Color.Blue)).flat());
    const detached = view.getSize();
    detached.x = 90;
    assert.equal(view.getSize().x, 3);
    assert.equal(sf.textureFromMapping, undefined);
  });

test('RenderTexture views reject every mutation before side effects',
  async t => {
    const source = target();
    const view = source.getTexture();
    const image = new sf.Image(size(), sf.Color.Blue);
    const writable = new sf.Texture(image);
    source.clear(sf.Color.Green);
    const calls = traceSubmissions(t);
    for (const mutate of [
      () => view.resize(size(2, 2)),
      () => view.update(image),
      () => view.loadFromImage(image),
      () => view.setSmooth(false),
      () => view.setRepeated(false),
      () => view.generateMipmap(),
      () => view.swap(writable),
      () => writable.swap(view),
      () => view.swap(view),
    ]) {
      assert.throws(mutate, /Cannot modify a RenderTexture texture view/);
    }
    await assert.rejects(view.loadFromFile('unused.png'), /Cannot modify/);
    await assert.rejects(view.loadFromMemory(new Uint8Array()),
      /Cannot modify/);
    assert.deepEqual(calls, []);
    for (const mutate of [
      () => native.resizeTexture(handle(view), 2, 2, false),
      () => native.updateTexture(handle(view), image.pixels, 1, 1, 0, 0),
      () => native.updateTextureImage(handle(view), handle(image), 0, 0),
      () => native.updateTextureTexture(handle(view), handle(writable), 0, 0),
      () => native.loadTextureImage(handle(view), handle(image),
        false, 0, 0, 0, 0),
      () => native.setTextureSmooth(handle(view), true),
      () => native.setTextureRepeated(handle(view), true),
      () => native.generateTextureMipmap(handle(view)),
      () => native.swapTextures(handle(view), handle(writable)),
      () => native.swapTextures(handle(writable), handle(view)),
    ]) assert.throws(mutate, TypeError);
    assert.deepEqual(pixels(view), rgba(sf.Color.Red));
    assert.deepEqual(pixels(writable), rgba(sf.Color.Blue));
    source.display();
  });

test('RenderTexture readback, copy and update preserve vertical orientation',
  () => {
    const original = fixture();
    const source = target(sf.Color.Black, 3, 2);
    source.draw(new sf.Sprite(new sf.Texture(original)));
    source.display();
    const view = source.getTexture();
    const image = view.copyToImage();
    const copy = new sf.Texture(view);
    const updated = new sf.Texture(size(5, 4));
    updated.update(new sf.Image(size(5, 4), sf.Color.Black));
    updated.update(view, size(1, 1));
    const expected = new sf.Image(size(5, 4), sf.Color.Black);
    expected.copy(original, size(1, 1));
    assert.deepEqual([ ...image.pixels ], [ ...original.pixels ]);
    assert.deepEqual(pixels(copy), [ ...original.pixels ]);
    assert.deepEqual(pixels(updated), [ ...expected.pixels ]);
    source.clear(sf.Color.Blue);
    source.display();
    image.pixels.fill(0);
    assert.deepEqual(pixels(copy), [ ...original.pixels ]);
    assert.deepEqual(pixels(updated), [ ...expected.pixels ]);
    copy.setSmooth(true);
    assert.equal(view.isSmooth(), false);
    assert.deepEqual(pixels(view), Array(6).fill(rgba(sf.Color.Blue)).flat());
  });

test('RenderTexture Sprite and VertexArray composition matches immediate SFML',
  () => {
    const original = fixture();
    const source = target(sf.Color.Black, 3, 2);
    source.draw(new sf.Sprite(new sf.Texture(original)));
    source.display();
    const output = target(sf.Color.Black, 6, 4);
    const sprite = new sf.Sprite(source.getTexture());
    const vertices = quad(3, 2);
    const states = new sf.RenderStates(source.getTexture());
    states.transform.translate(point(3, 0));
    output.draw(sprite);
    output.draw(vertices, states);
    source.clear(sf.Color.Blue);
    source.display();
    sprite.setPosition(point(0, 2));
    states.transform.translate(point(0, 2));
    output.draw(sprite);
    output.draw(vertices, states);
    output.display();
    const expected = native.renderTextureViewOracle(handle(original));
    assert.deepEqual(read(output), [ ...new Uint8Array(expected.buffer) ]);
    assert.equal(sprite.getTexture(), source.getTexture());
    const reassigned = new sf.Sprite(new sf.Texture(original));
    reassigned.setTexture(source.getTexture());
    output.draw(reassigned);
    output.display();
    assert.deepEqual(read(output).slice(0, 4), rgba(sf.Color.Blue));
  });

test('Sampling, copying and readback do not submit a source pending frame',
  t => {
    const source = target();
    const view = source.getTexture();
    const output = target(sf.Color.Black);
    const sprite = new sf.Sprite(view);
    source.clear(sf.Color.Blue);
    const calls = traceSubmissions(t);
    assert.deepEqual(pixels(view), rgba(sf.Color.Red));
    assert.deepEqual(pixels(new sf.Texture(view)), rgba(sf.Color.Red));
    output.draw(sprite);
    output.display();
    assert.deepEqual(calls.map(call => call[0]), [ handle(output) ]);
    assert.deepEqual(read(output), rgba(sf.Color.Red));
    source.display();
    output.draw(sprite);
    output.display();
    assert.deepEqual(read(output), rgba(sf.Color.Blue));
  });

for (const mode of [
  'display', 'flush', 'commands full', 'vertices full', 'texture mutation',
]) {
  test(`Source ${mode} submits all old-content consumers first`, t => {
    const mutable = new sf.Texture(new sf.Image(size(), sf.Color.White));
    const source = target();
    const view = source.getTexture();
    const outputs = [ target(sf.Color.Black), target(sf.Color.Black) ];
    outputs[0].draw(new sf.Sprite(view));
    outputs[1].draw(quad(), new sf.RenderStates(view));
    const calls = traceSubmissions(t);
    source.clear(sf.Color.Blue);
    if (mode === 'display') source.display();
    else if (mode === 'flush') source.flush();
    else if (mode === 'commands full') {
      for (let i = 0; i < 4096; i++) source.clear(sf.Color.Blue);
    } else if (mode === 'vertices full') {
      const vertices = new sf.VertexArray(sf.PrimitiveType.Points, 4096);
      for (const vertex of vertices) vertex.position = point(-10, -10);
      source.draw(vertices);
      source.draw([ new sf.Vertex(point(-10, -10)) ], sf.PrimitiveType.Points);
    } else mutable.update(new sf.Image(size(), sf.Color.Green));
    assert.deepEqual(calls.slice(0, 3).map(call => call[0]),
      [ handle(outputs[0]), handle(outputs[1]), handle(source) ]);
    assert.equal(calls[0][2], false);
    assert.equal(calls[1][2], false);
    for (const output of outputs) {
      output.display();
      assert.deepEqual(read(output), rgba(sf.Color.Red));
    }
    source.display();
    assert.deepEqual(pixels(view), rgba(sf.Color.Blue));
  });
}

for (const globalFlush of [ false, true ]) {
  test(`Dependency chains preserve each displayed generation (${globalFlush})`,
    t => {
      const mutable = new sf.Texture(new sf.Image(size(), sf.Color.White));
      const a = target(sf.Color.Red);
      const b = target(sf.Color.Green);
      const c = target(sf.Color.Blue);
      c.draw(new sf.Sprite(b.getTexture()));
      b.draw(new sf.Sprite(a.getTexture()));
      a.clear(sf.Color.White);
      const calls = traceSubmissions(t);
      if (globalFlush) mutable.update(new sf.Image(size(), sf.Color.Black));
      else a.display();
      assert.deepEqual(calls.slice(0, 3).map(call => call[0]),
        [ handle(c), handle(b), handle(a) ]);
      a.display();
      b.display();
      c.display();
      assert.deepEqual(read(a), rgba(sf.Color.White));
      assert.deepEqual(read(b), rgba(sf.Color.Red));
      assert.deepEqual(read(c), rgba(sf.Color.Green));
    });
}

test('Empty display orders pending consumers but adds no empty flushes', t => {
  const source = target();
  const view = source.getTexture();
  const output = target(sf.Color.Black);
  output.draw(new sf.Sprite(view));
  const calls = traceSubmissions(t);
  source.display();
  assert.deepEqual(calls.map(call => [ call[0], call[2] ]),
    [[ handle(output), false ], [ handle(source), true ]]);
  source.flush();
  output.flush();
  assert.equal(calls.length, 2);
  source.display();
  assert.equal(calls.length, 3);
  output.display();
  assert.deepEqual(read(output), rgba(sf.Color.Red));
});

test('Feedback and dependency cycles fail before changing a full queue',
  t => {
    const a = target(sf.Color.Red);
    const b = target(sf.Color.Green);
    const aSprite = new sf.Sprite(a.getTexture());
    const bSprite = new sf.Sprite(b.getTexture());
    const vertices = quad();
    b.draw(aSprite);
    for (let i = 0; i < 4096; i++) a.clear(sf.Color.Blue);
    const calls = traceSubmissions(t);
    assert.throws(() => a.draw(aSprite), /own texture/);
    assert.throws(() => a.draw(vertices, a.getTexture()), /own texture/);
    assert.throws(() => a.draw(bSprite), /Cyclic texture dependency/);
    assert.throws(() => a.draw(vertices, b.getTexture()),
      /Cyclic texture dependency/);
    assert.deepEqual(calls, []);
    b.display();
    assert.deepEqual(read(b), rgba(sf.Color.Red));
    a.display();
    assert.deepEqual(read(a), rgba(sf.Color.Blue));
    a.draw(bSprite);
    a.display();
    assert.deepEqual(read(a), rgba(sf.Color.Red));
  });

test('Native feedback validation rejects the entire batch for both draw types',
  () => {
    const context = native.createGraphicsContext();
    const mapping = native.createRenderTexture(context, 1, 1);
    const view = native.getRenderTextureTexture(mapping.handle);
    const sprite = native.createSprite(context, view.handle, view.id);
    const words = new Uint32Array(mapping.buffer);
    const floats = new Float32Array(mapping.buffer);
    words[1] = sf.Color.Red.toInteger();
    native.submitRenderTexture(mapping.handle, 1, true);
    words[1] = sf.Color.Green.toInteger();
    floats.set(sf.Transform.Identity.getMatrix(), 52);
    words.set([ 1, 0, 0, 1, 0, 0, 7, 0, 0, 0xffffffff, 0 ], 68);
    words[43] = 1;
    words[44] = sprite.id;
    floats.set([ 0, 0, 0, 1, 1, 0, 0 ], 45);
    words.set([ view.id, 0, 0, 1, 1, 0xffffffff ], 79);
    assert.throws(() => native.submitRenderTexture(mapping.handle, 2, true),
      TypeError);
    assert.deepEqual([ ...native.readRenderTexturePixels(mapping.handle) ],
      rgba(sf.Color.Red));
    native.allocateRenderTextureVertices(mapping.handle, 1);
    words[43] = 4;
    words[44] = 1;
    words.set([ 0, 0, view.id, 0 ], 45);
    assert.throws(() => native.submitRenderTexture(mapping.handle, 2, true),
      TypeError);
    assert.deepEqual([ ...native.readRenderTexturePixels(mapping.handle) ],
      rgba(sf.Color.Red));
    native.submitRenderTexture(mapping.handle, 1, true);
    assert.deepEqual([ ...native.readRenderTexturePixels(mapping.handle) ],
      rgba(sf.Color.Green));
  });

test('Displayed ping-pong frames do not create pending dependency cycles',
  () => {
    let a = target(sf.Color.Red, 2, 2);
    let b = target(sf.Color.Blue, 2, 2);
    for (let i = 0; i < 12; i++) {
      b.clear();
      b.draw(new sf.Sprite(a.getTexture()));
      b.display();
      assert.deepEqual(read(b), Array(4).fill(rgba(sf.Color.Red)).flat());
      [ a, b ] = [ b, a ];
    }
  });

test('A view retains its JS target and Native allocation, then releases both',
  async () => {
    let source = target();
    let view = source.getTexture();
    const reference = new WeakRef(source);
    const observed = native.observeRenderTexture(handle(source));
    const id = view[textureId];
    source = null;
    await setImmediate();
    global.gc();
    assert.ok(reference.deref());
    assert.equal(native.renderTextureExpired(observed), false);
    assert.deepEqual(pixels(view), rgba(sf.Color.Red));
    view = null;
    await collectUntil(() => native.renderTextureExpired(observed));
    assert.equal(reference.deref(), undefined);
    // weak_ptr expiration precedes the owner thread's deferred destruction.
    await collectUntil(() => !native.textureRegistered(graphicsContext(), id));
    assert.equal(native.textureRegistered(graphicsContext(), id), false);
  });

test('Native sprite ownership retains an alias after all JS wrappers are gone',
  async () => {
    let source = target(sf.Color.Cyan);
    let sprite = new sf.Sprite(source.getTexture());
    let retained = handle(sprite);
    const reference = new WeakRef(source);
    const observed = native.observeRenderTexture(handle(source));
    source = null;
    sprite = null;
    await collectUntil(() => reference.deref() === undefined);
    assert.equal(native.renderTextureExpired(observed), false);
    assert.equal(native.readSpriteAppearance(retained, true).currentTexture,
      true);
    retained = null;
    await collectUntil(() => native.renderTextureExpired(observed));
  });

for (const mode of [ 'sprite', 'vertices' ]) {
  test(`Pending ${mode} retain old target views through reassignment and GC`,
    async () => {
      const replacement = new sf.Texture(new sf.Image(size(), sf.Color.Blue));
      let source = target();
      const observed = native.observeRenderTexture(handle(source));
      const output = target(sf.Color.Black);
      const sprite = new sf.Sprite(source.getTexture());
      const states = new sf.RenderStates(source.getTexture());
      if (mode === 'sprite') output.draw(sprite);
      else output.draw(quad(), states);
      sprite.setTexture(replacement);
      states.texture = replacement;
      source = null;
      await setImmediate();
      global.gc();
      assert.equal(native.renderTextureExpired(observed), false);
      output.display();
      assert.deepEqual(read(output), rgba(sf.Color.Red));
      await collectUntil(() => native.renderTextureExpired(observed));
    });
}
