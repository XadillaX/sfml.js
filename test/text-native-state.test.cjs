'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { join } = require('node:path');
const { setImmediate: nextTurn } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative, vertexArrayBytes } =
  require('../dist/internal/graphics-state');
const { transformableState } = require('../dist/internal/transformable');
const { rectStorage } = require('../dist/internal/value-storage');

async function font() {
  const result = new sf.Font();
  assert.equal(await result.openFromFile(
    join(__dirname, 'fixtures/fonts/DejaVuSansMono.ttf')), true);
  return result;
}

function inspect(text) {
  return native.inspectTextState(
    text[graphicsNative], text[transformableState].handle);
}

test('Text numeric views alias sf::Text fields without native setter calls',
  async t => {
    const face = await font();
    t.mock.method(native, 'createTransformable',
      () => assert.fail('Text must own its transform'));
    const text = new sf.Text({ font: face, string: 'mapped' });
    assert.equal(inspect(text).sharesTransform, true);
    assert.equal(text.floats.buffer.byteLength, 40);
    assert.equal(text.words.buffer, text.floats.buffer);
    assert.equal(text.colors.buffer, text.floats.buffer);
    assert.equal(Object.hasOwn(text, 'properties'), false);
    assert.equal(Object.hasOwn(text, 'dirty'), false);
    t.mock.reset();
    for (const name of Object.keys(native)) {
      if (typeof native[name] === 'function') {
        t.mock.method(native, name,
          () => assert.fail(`Unexpected native call: ${name}`));
      }
    }
    text.setCharacterSize(42);
    text.setLetterSpacing(1.25);
    text.setLineSpacing(1.5);
    text.setStyle(sf.TextStyle.Bold);
    text.setFillColor(new sf.Color(0x12345678));
    text.setOutlineColor(new sf.Color(0xabcdef90));
    text.setOutlineThickness(2.5);
    text.setLineAlignment(sf.LineAlignment.Right);
    text.setTextOrientation(sf.TextOrientation.BottomToTop);
    text.setClusterGrouping(sf.ClusterGrouping.Grapheme);
    assert.equal(text.getFillColor().toInteger(), 0x12345678);
    assert.equal(text.getOutlineColor().toInteger(), 0xabcdef90);
    t.mock.reset();
    // Read through SFML's public C++ getters, before any layout/sync call.
    assert.deepEqual(inspect(text).properties, [
      42, 1.25, 1.5, 1, 0x12345678, 0xabcdef90, 2.5, 3, 2, 0,
    ]);
    assert.equal(inspect(text).needsUpdate, true);
  });

test('Text observes SFML invalidation and C++ field writes through its views',
  async () => {
    const text = new sf.Text({ font: await font(), string: 'A' });
    const initial = text.getLocalBounds().size.y;
    const before = inspect(text);
    assert.equal(before.needsUpdate, false);
    native.setTextCharacterSize(text[graphicsNative], 60);
    assert.equal(text.getCharacterSize(), 60);
    assert.equal(inspect(text).needsUpdate, true);
    assert.ok(text.getLocalBounds().size.y > initial);
    assert.equal(inspect(text).needsUpdate, false);
    assert.equal(inspect(text).address, before.address);
    assert.deepEqual([ ...text.bounds ], inspect(text).bounds);
  });

test('Text reuses its native object across layout changes', async () => {
  const first = await font();
  const text = new sf.Text({ font: first, string: 'A' });
  const address = inspect(text).address;
  const buffer = text.floats.buffer;
  for (const change of [
    () => text.setString('B longer'),
    () => text.setCharacterSize(19),
    () => text.setOutlineThickness(2),
    () => text.setFont(new sf.Font(first)),
  ]) {
    change();
    text.getVertexData();
    assert.equal(inspect(text).address, address);
    assert.equal(text.floats.buffer, buffer);
    assert.equal(inspect(text).needsUpdate, false);
    assert.deepEqual([ ...text.getLocalBounds()[rectStorage] ],
      inspect(text).bounds);
  }
});

test('Text color edits preserve geometry and do not rerun the processor',
  async t => {
    const text = new sf.Text({ font: await font(), string: 'Colors' });
    text.setOutlineThickness(2);
    let calls = 0;
    text.setGlyphPreProcessor((_, appearance) => {
      calls++;
      appearance.fillColor = sf.Color.Blue;
    });
    const vertices = text.getVertexData();
    const outline = text.getOutlineVertexData();
    const position = vertices.getVertex(0).position;
    position.x += 7;
    const x = position.x;
    const count = calls;
    t.mock.method(native, 'prepareText',
      () => assert.fail('Recoloring must not reshape'));
    text.setFillColor(sf.Color.Red);
    text.setOutlineColor(sf.Color.Green);
    assert.equal(text.getVertexData(), vertices);
    assert.equal(text.getOutlineVertexData(), outline);
    assert.equal(position.x, x);
    assert.equal(calls, count);
    assert.equal(inspect(text).needsUpdate, false);
    assert.equal(inspect(text).hasProcessor, false);
    for (const vertex of vertices) {
      assert.equal(vertex.color.toInteger(), sf.Color.Red.toInteger());
    }
    for (const vertex of outline) {
      assert.equal(vertex.color.toInteger(), sf.Color.Green.toInteger());
    }
    const target = new sf.RenderTexture(new sf.Vector2u(320, 160));
    target.clear(sf.Color.Transparent);
    target.draw(text);
    target.display();
    assert.ok(target.getTexture().copyToImage().pixels.some(Boolean));
  });

test('Text draw snapshots retain their colors across in-place recoloring',
  async () => {
    const text = new sf.Text({ font: await font(), string: 'Snapshot' });
    const first = new sf.RenderTexture(new sf.Vector2u(320, 160));
    const second = new sf.RenderTexture(new sf.Vector2u(320, 160));
    first.clear(sf.Color.Transparent);
    first.draw(text);
    first.display();
    const expected = Buffer.from(first.getTexture().copyToImage().pixels);
    second.clear(sf.Color.Transparent);
    second.draw(text);
    text.setFillColor(sf.Color.Red);
    second.display();
    assert.deepEqual(Buffer.from(second.getTexture().copyToImage().pixels),
      expected);
  });

test('Text copies have independent native fields, flags and edited vertices',
  async () => {
    const source = new sf.Text({ font: await font(), string: 'Copy' });
    const vertices = source.getVertexData();
    vertices.getVertex(0).position.x += 4;
    const copy = new sf.Text(source);
    assert.notEqual(inspect(copy).address, inspect(source).address);
    assert.notEqual(copy.floats.buffer, source.floats.buffer);
    assert.equal(inspect(copy).sharesTransform, true);
    assert.deepEqual(copy.getVertexData()[vertexArrayBytes],
      vertices[vertexArrayBytes]);
    copy.setCharacterSize(48);
    assert.equal(source.getCharacterSize(), 30);
    assert.equal(inspect(source).needsUpdate, false);
    assert.equal(inspect(copy).needsUpdate, true);
    copy.getVertexData();
    assert.equal(source.getVertexData(), vertices);
  });

test('Text retries a failed callback on the same native object', async () => {
  const text = new sf.Text({ font: await font(), string: 'Retry' });
  const previous = text.getShapedGlyphs();
  const address = inspect(text).address;
  const error = new Error('once');
  let fail = true;
  text.setGlyphPreProcessor(() => {
    if (fail) { fail = false; throw error; }
  });
  assert.throws(() => text.getLocalBounds(), value => value === error);
  assert.equal(inspect(text).needsUpdate, true);
  assert.equal(inspect(text).hasProcessor, false);
  assert.equal(inspect(text).address, address);
  assert.ok(text.getLocalBounds().size.x > 0);
  assert.equal(inspect(text).needsUpdate, false);
  assert.equal(inspect(text).hasProcessor, false);
  assert.deepEqual(previous.map(value => value.cluster), [ 0, 1, 2, 3, 4 ]);
});

test('An escaped Text property buffer retains and releases its native owner',
  async () => {
    let text = new sf.Text({ font: await font(), string: 'Lifetime' });
    text.getLocalBounds();
    let view = text.words;
    const watch = native.watchTextLifetime(text[graphicsNative]);
    const reference = new WeakRef(text);
    text = null;
    for (let i = 0; i < 8; i++) { await nextTurn(); global.gc(); }
    assert.equal(reference.deref(), undefined);
    assert.equal(native.isTextAlive(watch), true);
    assert.equal(view[0], 30);
    view[0] = 50;
    assert.equal(view[0], 50);
    view = null;
    for (let i = 0; i < 8; i++) { await nextTurn(); global.gc(); }
    assert.equal(native.isTextAlive(watch), false);
  });
