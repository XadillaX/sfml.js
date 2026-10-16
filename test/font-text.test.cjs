'use strict';
/* eslint-disable no-bitwise */

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFile, mkdtemp, copyFile, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { setImmediate: nextTurn } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative, vertexArrayBytes } =
  require('../dist/internal/graphics-state');
const {
  glyphNative, glyphStorage, rectNative, rectStorage, transformStorage,
  vector2Native, vector2Storage,
} = require('../dist/internal/value-storage');
const { transformableState } = require('../dist/internal/transformable');
const filename = join(__dirname, 'fixtures/fonts/DejaVuSansMono.ttf');
const F = (x = 0, y = 0) => new sf.Vector2f(x, y);
const box = value => [ ...value[rectStorage] ];
function near(actual, expected) {
  actual.forEach((value, i) => {
    assert.ok(Math.abs(value - expected[i]) < 0.0001);
  });
}

async function load() {
  const font = new sf.Font();
  assert.equal(await font.openFromFile(filename), true);
  return font;
}
function target() {
  const result = new sf.RenderTexture(new sf.Vector2u(320, 200));
  result.clear(sf.Color.Transparent);
  return result;
}
function pixels(target) {
  target.display();
  return native.readRenderTexturePixels(target[graphicsNative]);
}
function snapshot(text, parent = sf.Transform.Identity, processor = false) {
  return {
    font: text.getFont()[graphicsNative], string: text.getString(),
    properties: new Float64Array([
      text.getCharacterSize(), text.getLetterSpacing(), text.getLineSpacing(),
      text.getStyle(), text.getFillColor().toInteger(),
      text.getOutlineColor().toInteger(), text.getOutlineThickness(),
      text.getLineAlignment(), text.getTextOrientation(),
      text.getClusterGrouping(),
    ]),
    pose: text[transformableState].values.slice(),
    parent: parent[transformStorage].slice(), processor,
  };
}
function processor(glyph, appearance) {
  if (glyph.cluster % 2 === 0) {
    appearance.style |= sf.TextStyle.Bold;
    appearance.fillColor = sf.Color.Red;
    appearance.outlineColor = sf.Color.Blue;
    appearance.outlineThickness = 1.5;
  }
}

test('Glyph members share native storage and copies are independent', () => {
  const glyph = new sf.Glyph();
  assert.equal(glyph[glyphStorage].length, 44);
  glyph.advance = 12.5;
  glyph.lsbDelta = -3;
  glyph.rsbDelta = 7;
  glyph.bounds = new sf.FloatRect(F(1, 2), F(3, 4));
  glyph.textureRect = new sf.IntRect(
    new sf.Vector2i(5, 6), new sf.Vector2i(7, 8));
  assert.equal(native.glyphAliases(glyph[glyphNative],
    glyph.bounds[rectNative], glyph.textureRect[rectNative]), true);
  const copy = new sf.Glyph(glyph);
  glyph.bounds.position.x = 11;
  assert.equal(copy.bounds.position.x, 1);
  assert.equal(glyph.bounds.position.x, 11);
  assert.equal(copy.advance, 12.5);
  assert.equal(copy.lsbDelta, -3);
  assert.equal(copy.rsbDelta, 7);
});

test('Font async file/memory/stream opens and metrics', async () => {
  const bytes = await readFile(filename);
  const file = new sf.FileInputStream();
  assert.equal(await file.open(filename), true);
  try {
    for (const input of [
      filename, bytes, file, new sf.MemoryInputStream(bytes),
    ]) {
      const font = new sf.Font();
      const pending = typeof input === 'string' ? font.openFromFile(input)
        : input instanceof Uint8Array
          ? font.openFromMemory(input) : font.openFromStream(input);
      assert.ok(pending instanceof Promise);
      assert.equal(font.getInfo().id, 0n);
      assert.equal(await pending, true);
      assert.equal(font.getInfo().family, 'DejaVu Sans Mono');
      assert.equal(typeof font.getInfo().id, 'bigint');
      assert.equal(font.hasGlyph(65), true);
      assert.equal(font.hasGlyph(0x10ffff), false);
      const glyph = font.getGlyph(65, 28, false);
      assert.ok(glyph.advance > 0);
      assert.strictEqual(glyph, font.getGlyph(65, 28, false));
      assert.ok(font.getGlyphById(1, 28, false) instanceof sf.Glyph);
      assert.ok(font.getAscent(28) > 0);
      assert.ok(font.getDescent(28) < 0);
      assert.ok(font.getLineSpacing(28) > 0);
      assert.ok(font.getUnderlinePosition(28) > 0);
      assert.ok(font.getUnderlineThickness(28) > 0);
      assert.equal(typeof font.getKerning(65, 86, 28, true), 'number');
    }
  } finally { await file.close(); }
});

test('Font memory open snapshots the input view', async () => {
  const data = await readFile(filename);
  const padded = new Uint8Array(data.length + 16);
  padded.set(data, 8);
  const font = new sf.Font();
  const pending = font.openFromMemory(padded.subarray(8, -8));
  padded.fill(0);
  assert.equal(await pending, true);
  assert.ok(font.getGlyph(65, 30, false).advance > 0);
});

test('Font streams allow partial reads and release input', async () => {
  class Chunked extends sf.MemoryInputStream {
    async read(destination) {
      return super.read(destination.subarray(0, 4096));
    }
  }
  const stream = new Chunked(await readFile(filename));
  const font = new sf.Font();
  assert.equal(await font.openFromStream(stream), true);
  stream.open(new Uint8Array());
  assert.ok(font.getGlyph(65, 30, false).bounds.size.x > 0);
  const broken = new Chunked(await readFile(filename));
  broken.read = () => 0n;
  assert.equal(await font.openFromStream(broken), false);
  broken.read = () => -1n;
  await assert.rejects(font.openFromStream(broken), /count/);
  broken.read = () => { throw new Error('read failed'); };
  await assert.rejects(font.openFromStream(broken), /read failed/);
});

test('Font failed opens preserve resource and caches', async () => {
  const font = await load();
  const info = font.getInfo();
  const glyph = font.getGlyph(65, 30, false);
  const atlas = font.getTexture(30);
  assert.equal(await font.openFromFile(`${filename}.missing`), false);
  assert.equal(await font.openFromMemory(new Uint8Array([ 1, 2, 3 ])), false);
  assert.strictEqual(font.getInfo(), info);
  assert.strictEqual(font.getGlyph(65, 30, false), glyph);
  assert.strictEqual(font.getTexture(30), atlas);
});

test('Font copy and old atlas stay usable across reload and GC', async () => {
  let font = await load();
  font.setSmooth(false);
  const copy = new sf.Font(font);
  const glyph = font.getGlyph(65, 30, false);
  const atlas = font.getTexture(30);
  const before = Buffer.from(atlas.copyToImage().pixels);
  assert.equal(copy.isSmooth(), false);
  assert.equal(atlas.isSmooth(), false);
  assert.equal(await font.openFromMemory(await readFile(filename)), true);
  assert.notStrictEqual(font.getTexture(30), atlas);
  assert.equal(font.isSmooth(), false);
  font = null;
  global.gc();
  await nextTurn();
  assert.deepEqual(Buffer.from(atlas.copyToImage().pixels), before);
  assert.equal(copy.getGlyph(65, 30, false).advance, glyph.advance);
  assert.throws(() => atlas.setSmooth(true), /texture view/);
  const sprite = new sf.Sprite(atlas);
  const output = target();
  output.draw(sprite);
  assert.ok(pixels(output).some(Boolean));
});

test('Font atlas metadata follows growth and smoothing', async () => {
  const font = await load();
  const atlas = font.getTexture(64);
  const initial = atlas.getSize();
  for (let i = 33; i < 256; i++) font.getGlyph(i, 64, false);
  const grown = atlas.getSize();
  assert.ok(grown.x > initial.x || grown.y > initial.y);
  assert.equal(sf.equal(grown, atlas.copyToImage().getSize()), true);
  font.setSmooth(false);
  assert.equal(atlas.isSmooth(), false);
  font.setSmooth(true);
  assert.equal(atlas.isSmooth(), true);
  assert.equal(atlas.isRepeated(), false);
  assert.equal(atlas.isSrgb(), false);
  assert.ok(atlas.getNativeHandle() > 0);
});

test('Font relative paths are captured before async work', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'sfml-font-'));
  try {
    await copyFile(filename, join(dir, 'font.ttf'));
    const previous = process.cwd();
    let pending;
    try {
      process.chdir(dir);
      pending = new sf.Font().openFromFile('font.ttf');
    } finally { process.chdir(previous); }
    assert.equal(await pending, true);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('Text defaults, options, copy and unloaded font validation', async () => {
  const empty = new sf.Font();
  const text = new sf.Text({ font: empty, string: 'A' });
  assert.throws(() => text.getLocalBounds(), /loaded Font/);
  assert.equal(await empty.openFromFile(filename), true);
  assert.strictEqual(text.getFont(), empty);
  assert.equal(text.getCharacterSize(), 30);
  assert.equal(text.getLetterSpacing(), 1);
  assert.equal(text.getLineSpacing(), 1);
  assert.equal(text.getStyle(), sf.TextStyle.Regular);
  assert.equal(text.getFillColor().toInteger(), 0xffffffff);
  assert.equal(text.getOutlineColor().toInteger(), 255);
  assert.equal(text.getOutlineThickness(), 0);
  assert.equal(text.getLineAlignment(), sf.LineAlignment.Default);
  assert.equal(text.getClusterGrouping(), sf.ClusterGrouping.Character);
  assert.equal(text.getTextOrientation(), sf.TextOrientation.Default);
  text.setPosition(F(5, 8));
  text.setStyle(sf.TextStyle.Bold);
  const copy = new sf.Text(text);
  assert.equal(sf.equal(copy.getPosition(), text.getPosition()), true);
  assert.deepEqual(box(copy.getLocalBounds()), box(text.getLocalBounds()));
  copy.setString('copy');
  assert.equal(text.getString(), 'A');
  assert.equal(copy.getString(), 'copy');
  const blank = new sf.Text({ font: empty });
  assert.equal(blank.getVertexData().getVertexCount(), 0);
  assert.equal(blank.getOutlineVertexData().getVertexCount(), 0);
});

for (const [ label, string, orientation, grouping, alignment ] of [
  [ 'latin', 'AV ffi\nHello', 0, 1, 2 ],
  [ 'unicode', 'é e\u0301 😀\nمرحبا', 0, 0, 0 ],
  [ 'ungrouped', 'fi e\u0301', 0, 2, 3 ],
  [ 'vertical down', 'Text', 1, 1, 1 ],
  [ 'vertical up', 'Text', 2, 1, 1 ],
]) {
  test(`Text ${label}: SFML layout and pixels`, async () => {
    const text = new sf.Text({ font: await load(), string, characterSize: 23 });
    text.setStyle(sf.TextStyle.Italic |
      sf.TextStyle.Underlined | sf.TextStyle.StrikeThrough);
    text.setLetterSpacing(1.2);
    text.setLineSpacing(1.3);
    text.setOutlineThickness(1.5);
    text.setOutlineColor(sf.Color.Blue);
    text.setFillColor(new sf.Color(190, 230, 120));
    text.setLineAlignment(alignment);
    text.setClusterGrouping(grouping);
    text.setTextOrientation(orientation);
    text.setPosition(F(90, 80));
    text.setOrigin(F(3, 2));
    text.setRotation(sf.degrees(8));
    text.setScale(F(1.1, 0.9));
    const parent = new sf.Transform().translate(F(3, 5));
    const oracle = native.textOracle([ snapshot(text, parent) ]);
    const description = oracle.descriptions[0];
    assert.deepEqual(box(text.getLocalBounds()), description.local);
    near(box(text.getGlobalBounds()), description.global);
    assert.deepEqual(text.getShapedGlyphs().map(g => [
      g.position.x, g.position.y, g.cluster, g.textDirection, g.baseline,
      g.vertexOffset, g.vertexCount, g.glyph.advance,
    ]), description.glyphs.map(([ x, y, cluster, ...rest ]) => [
      x, y, Array.from(string).slice(0, cluster).join('').length, ...rest,
    ]));
    const count = Array.from(string).length + 2;
    for (let i = 0; i < count; i++) {
      const position = text.findCharacterPos(i);
      near([ position.x, position.y ],
        description.characters.slice(i * 2, i * 2 + 2));
    }
    const output = target();
    output.draw(text, parent);
    assert.deepEqual(pixels(output), oracle.pixels);
  });
}

test('Text pre-processor matches SFML and runs when dirty', async () => {
  const text = new sf.Text({
    font: await load(), string: 'Hello', characterSize: 26,
  });
  text.setPosition(F(10, 10));
  let calls = 0;
  text.setGlyphPreProcessor((glyph, appearance) => {
    calls++;
    processor(glyph, appearance);
  });
  const oracle = native.textOracle([
    snapshot(text, sf.Transform.Identity, true),
  ]);
  assert.deepEqual(box(text.getLocalBounds()), oracle.descriptions[0].local);
  const count = calls;
  assert.ok(count > 0);
  const output = target();
  output.draw(text);
  assert.deepEqual(pixels(output), oracle.pixels);
  text.getShapedGlyphs();
  text.getVertexData();
  text.getLocalBounds();
  assert.equal(calls, count);
  text.setString('Hello!');
  text.getLocalBounds();
  assert.ok(calls > count);
});

test('Text exposes UTF-16 clusters for emoji and combining characters',
  async () => {
    const text = new sf.Text({
      font: await load(), string: 'A😀Be\u0301C',
    });
    text.setClusterGrouping(sf.ClusterGrouping.None);
    const clusters = text.getShapedGlyphs().map(g => g.cluster);
    assert.ok(clusters.includes(1), 'Emoji starts at UTF-16 index 1');
    assert.ok(clusters.includes(3), 'B starts after the surrogate pair');
    assert.ok(clusters.includes(6), 'C follows both combining code points');
    assert.ok(!clusters.includes(2), 'No cluster inside a surrogate pair');
    for (const glyph of text.getShapedGlyphs()) {
      assert.notEqual(text.getString().charCodeAt(glyph.cluster), 0xde00);
    }
    text.setString('😀😀A');
    assert.deepEqual(text.getShapedGlyphs().map(g => g.cluster), [ 0, 2, 4 ]);
    text.setString('A');
    assert.deepEqual(text.getShapedGlyphs().map(g => g.cluster), [ 0 ]);
    text.setString('');
    assert.deepEqual(text.getShapedGlyphs(), []);
  });

test('Text callback and returned glyphs expose matching UTF-16 indices',
  async () => {
    const text = new sf.Text({ font: await load(), string: '😀AB😀C' });
    const seen = [];
    const retained = [];
    text.setGlyphPreProcessor((glyph, appearance) => {
      seen.push(glyph.cluster);
      retained.push(glyph);
      if (glyph.cluster === 6) appearance.fillColor = sf.Color.Red;
    });
    const glyphs = text.getShapedGlyphs();
    const expected = [ 0, 2, 3, 4, 6 ];
    // SFML may regenerate geometry while populating the glyph atlas.
    assert.deepEqual([ ...new Set(seen) ], expected);
    assert.deepEqual(glyphs.map(g => g.cluster), expected);
    const last = glyphs.find(g => g.cluster === 6);
    assert.equal(text.getVertexData().getVertex(last.vertexOffset)
      .color.toInteger(), sf.Color.Red.toInteger());
    const savedPositions = retained.map(g => g.position.x);
    text.setString('short');
    text.setGlyphPreProcessor(null);
    text.getLocalBounds();
    global.gc();
    await nextTurn();
    assert.deepEqual(retained.map(g => g.cluster), seen);
    assert.deepEqual(retained.map(g => g.position.x), savedPositions);
  });

test('Shaped glyph fields read shared buffers and resolve members lazily',
  async t => {
    const text = new sf.Text({ font: await load(), string: '😀AB' });
    text.getLocalBounds();
    const map = native.getTextGlyphs(text[graphicsNative]);
    const calls = t.mock.method(native, 'shapedGlyphMember');
    const glyphs = text.getShapedGlyphs();
    assert.strictEqual(text.getShapedGlyphs(), glyphs);
    assert.equal(map.buffer.byteLength, glyphs.length * 80);
    const index = 2;
    const glyph = glyphs[index];
    const floats = new Float32Array(map.buffer);
    const words = new Uint32Array(map.buffer);
    const doubles = new Float64Array(map.buffer);
    assert.equal(words[index * 20 + 13], 2, 'Native code point index');
    assert.equal(glyph.cluster, 3);
    assert.equal(glyph.glyph.advance, floats[index * 20]);
    assert.equal(glyph.position.x, floats[index * 20 + 11]);
    assert.equal(glyph.baseline, floats[index * 20 + 15]);
    assert.equal(glyph.textDirection, words[index * 20 + 14]);
    assert.equal(glyph.vertexOffset, doubles[index * 10 + 8]);
    assert.equal(glyph.vertexCount, doubles[index * 10 + 9]);
    assert.equal(glyph.glyph.bounds.position.x, floats[index * 20 + 3]);
    assert.equal(calls.mock.callCount(), 0);
    floats[index * 20] = 123;
    floats[index * 20 + 11] = 456;
    assert.equal(glyph.glyph.advance, 123);
    assert.equal(glyph.position.x, 456);
    assert.equal(native.shapedGlyphAliases(map.handle, index,
      glyph.glyph[glyphNative], glyph.position[vector2Native]), true);
    assert.equal(calls.mock.callCount(), 2);
    assert.equal(glyph.glyph[glyphNative], glyph.glyph[glyphNative]);
    assert.equal(glyph.position[vector2Native], glyph.position[vector2Native]);
    assert.equal(calls.mock.callCount(), 2);
    assert.equal(glyph.position[vector2Storage][0], 456);
  });

test('Old shaped glyph views retain their buffers and string index maps',
  async () => {
    let text = new sf.Text({ font: await load(), string: '😀ABC' });
    const old = text.getShapedGlyphs();
    const member = old[1].glyph.bounds.position;
    const originalX = member.x;
    text.setString('changed');
    text.getShapedGlyphs();
    text = null;
    global.gc();
    await nextTurn();
    assert.deepEqual(old.map(g => g.cluster), [ 0, 2, 3, 4 ]);
    assert.equal(member.x, originalX);
    assert.ok(old[1].glyph[glyphNative]);
    assert.ok(old[1].position[vector2Native]);
  });

test('Text pre-processor exceptions and re-entry recover', async () => {
  const text = new sf.Text({ font: await load(), string: 'A' });
  const error = new Error('expected callback failure');
  text.setGlyphPreProcessor(() => { throw error; });
  assert.throws(() => text.getLocalBounds(), value => value === error);
  text.setGlyphPreProcessor(() => { text.setString('reentry'); });
  assert.throws(() => text.getLocalBounds(), /pre-processor/);
  text.setGlyphPreProcessor(() => { text.getLocalBounds(); });
  assert.throws(() => text.getLocalBounds(), /pre-processor/);
  text.setGlyphPreProcessor((_, appearance) => {
    appearance.outlineThickness = NaN;
  });
  assert.throws(() => text.getLocalBounds(), /finite/);
  text.setGlyphPreProcessor(null);
  assert.ok(text.getVertexData().getVertexCount() > 0);
});

test('Text snapshots survive property and vertex edits', async () => {
  const text = new sf.Text({
    font: await load(), string: 'Snapshot', characterSize: 22,
  });
  text.setPosition(F(5, 10));
  text.setOutlineThickness(1);
  const oracle = native.textOracle([ snapshot(text) ]);
  const output = target();
  output.draw(text);
  text.getVertexData().getVertex(0).position.x += 100;
  text.getOutlineVertexData().clear();
  text.setString('changed');
  text.setFillColor(sf.Color.Red);
  text.move(F(100, 100));
  assert.deepEqual(pixels(output), oracle.pixels);
});

test('Text vertex edits, regeneration and GC', async () => {
  let text = new sf.Text({ font: await load(), string: 'A' });
  const vertices = text.getVertexData();
  const member = vertices.getVertex(0).position;
  for (const vertex of vertices) vertex.color = sf.Color.Red;
  const expected = target();
  expected.draw(vertices, new sf.RenderStates(text.getFont().getTexture(30)));
  const actual = target();
  actual.draw(text);
  assert.deepEqual(pixels(actual), pixels(expected));
  const oldX = member.x;
  text.setString('B');
  assert.notStrictEqual(text.getVertexData(), vertices);
  text = null;
  global.gc();
  await nextTurn();
  assert.equal(member.x, oldX);
  member.x += 5;
  assert.equal(vertices.getVertex(0).position.x, oldX + 5);
});

test('Text cached draws require no native layout calls', async t => {
  const text = new sf.Text({ font: await load(), string: 'Cached' });
  const output = target();
  text.getVertexData();
  text.getFont().getTexture(30);
  t.mock.method(native, 'prepareText', () => assert.fail('unexpected layout'));
  t.mock.method(native, 'getFontTexture',
    () => assert.fail('unexpected atlas lookup'));
  for (let i = 0; i < 3; i++) {
    text.setPosition(F(i * 10, i * 20));
    output.draw(text);
  }
  assert.ok(pixels(output).some(Boolean));
});

test('Font cached metrics, coverage and glyphs require no native calls',
  async t => {
    const font = await load();
    font.getAscent(24);
    font.getKerning(65, 86, 24);
    font.hasGlyph(65);
    font.getGlyph(65, 24, false);
    t.mock.method(native, 'fontMetric', () => assert.fail('metric cache miss'));
    t.mock.method(native, 'getFontGlyph', () => assert.fail('glyph miss'));
    assert.ok(font.getAscent(24) > 0);
    assert.equal(typeof font.getKerning(65, 86, 24), 'number');
    assert.equal(font.hasGlyph(65), true);
    assert.ok(font.getGlyph(65, 24, false).advance > 0);
  });

test('Text copies preserve edited geometry without sharing vertex storage',
  async () => {
    const text = new sf.Text({ font: await load(), string: 'Copy' });
    const vertices = text.getVertexData();
    vertices.getVertex(0).position.x += 7;
    vertices.getVertex(1).color = sf.Color.Red;
    const copy = new sf.Text(text);
    assert.deepEqual(copy.getVertexData()[vertexArrayBytes],
      vertices[vertexArrayBytes]);
    const originalX = vertices.getVertex(0).position.x;
    copy.getVertexData().getVertex(0).position.x += 4;
    assert.equal(vertices.getVertex(0).position.x, originalX);
    assert.equal(copy.getShapedGlyphs().length, 4);
  });

test('Text pre-processor cycles remain collectible', async () => {
  let reference;
  {
    const text = new sf.Text({ font: await load(), string: 'GC' });
    text.setGlyphPreProcessor((_, appearance) => {
      appearance.style = text.getStyle();
    });
    text.getLocalBounds();
    reference = new WeakRef(text);
  }
  for (let i = 0; i < 8; i++) {
    await nextTurn();
    global.gc();
  }
  assert.equal(reference.deref(), undefined);
});

test('Font reload and atlas growth preserve Text snapshots', async () => {
  const font = await load();
  const text = new sf.Text({ font, string: 'Old face', characterSize: 24 });
  const oracle = native.textOracle([ snapshot(text) ]);
  const output = target();
  output.draw(text);
  for (let i = 33; i < 250; i++) font.getGlyph(i, 24, true, 2);
  assert.equal(await font.openFromMemory(await readFile(filename)), true);
  text.setString('New face');
  text.getLocalBounds();
  assert.deepEqual(pixels(output), oracle.pixels);
  assert.equal(text.getShapedGlyphs().length, 8);
});

test('Text custom draw and Font replacement', async () => {
  class Shifted extends sf.Text {
    draw(target, states) {
      states.transform.translate(F(7, 9));
      super.draw(target, states);
    }
  }
  const first = await load();
  const second = new sf.Font(first);
  const text = new Shifted({ font: first, string: 'ABC' });
  text.setFont(second);
  assert.strictEqual(text.getFont(), second);
  const transform = new sf.Transform().translate(F(7, 9));
  const oracle = native.textOracle([ snapshot(text, transform) ]);
  const output = target();
  output.draw(text);
  assert.deepEqual(pixels(output), oracle.pixels);
});

test('Font and Text validate public arguments', async () => {
  const font = await load();
  const text = new sf.Text({ font });
  assert.throws(() => new sf.Font({}), /Font/);
  assert.throws(() => new sf.Text({}), /Font/);
  assert.throws(() => text.setFont({}), /Font/);
  assert.throws(() => text.setString(123), /string/);
  assert.throws(() => text.setCharacterSize(-1), /unsigned/);
  assert.throws(() => text.setStyle(16), /unsigned/);
  assert.throws(() => text.setLineAlignment(4), /unsigned/);
  assert.throws(() => text.setClusterGrouping(3), /unsigned/);
  assert.throws(() => text.setTextOrientation(3), /unsigned/);
  assert.throws(() => text.setLetterSpacing(Infinity), /finite/);
  assert.throws(() => text.setFillColor(0), /Color/);
  assert.throws(() => text.setGlyphPreProcessor({}), /pre-processor/);
  assert.throws(() => font.getGlyph(0x110000, 30, false), /unsigned/);
  assert.throws(() => font.getGlyph(65, 30, 1), /boolean/);
  assert.throws(() => font.setSmooth(1), /boolean/);
  await assert.rejects(font.openFromMemory('bytes'), /Uint8Array/);
  await assert.rejects(font.openFromStream({}), /InputStream/);
  await assert.rejects(font.openFromFile('\0'), /path/);
  assert.equal(text.getVertexData()[vertexArrayBytes].length, 0);
});
