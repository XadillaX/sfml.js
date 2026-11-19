'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const assets = path.resolve(__dirname, '../../third_party/rmlui/Samples');
const latin = path.join(assets, 'assets/LatoLatin-Regular.ttf');
const arabic = path.join(assets, 'basic/harfbuzz/data/Cairo-Regular.ttf');
const bitmap = path.join(assets,
  'basic/bitmap_font/data/Comfortaa_Regular_22.fnt');
const white = { red: 255, green: 255, blue: 255, alpha: 255 };

function start(rmlui, window, kind) {
  const engine = new rmlui.FontEngineInterface(kind);
  rmlui.setFontEngineInterface(engine);
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  return engine;
}

function load(engine, file, size = 32) {
  assert.ok(engine.loadFontFace(file, 'probe', 0, 400));
  const face = engine.getFontFaceHandle('probe', 0, 400, size);
  assert.ok(face);
  return face;
}

function generate(rmlui, engine, face, text, shaping) {
  const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
  const result = engine.generateString(manager, face, null, text,
    { x: 0, y: 40 }, white, 1, shaping);
  return { manager, result };
}

const cases = {
  'compiled-capabilities-and-runtime-selection': ({ rmlui, window }) => {
    const before = rmlui.getCapabilities();
    assert.equal(before.initialized, false);
    assert.equal(before.selectedFontEngine, null);
    for (const kind of [ 'freetype', 'harfbuzz', 'bitmap' ]) {
      assert.equal(before.fonts[kind].compiled, true);
      assert.equal(before.fonts[kind].available, false);
    }

    const engine = new rmlui.FontEngineInterface('harfbuzz');
    assert.equal(engine.kind, 'harfbuzz');
    rmlui.setFontEngineInterface(engine);
    assert.equal(rmlui.getCapabilities().selectedFontEngine, 'harfbuzz');
    assert.equal(rmlui.getCapabilities().fonts.harfbuzz.available, false);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const active = rmlui.getCapabilities();
    assert.equal(active.initialized, true);
    assert.equal(active.fonts.harfbuzz.available, true);
    assert.equal(active.fonts.freetype.available, false);
    assert.equal(active.fonts.bitmap.available, false);
    assert.equal(active.fonts.harfbuzz.shaping, true);
    assert.equal(active.fonts.harfbuzz.priorCharacter, false);
    assert.equal(active.fonts.bitmap.effects, false);
    assert.equal(active.fonts.bitmap.memoryLoading, false);
    assert.equal(active.fonts.bitmap.letterSpacing, false);
    assert.equal(active.fonts.bitmap.scalable, false);
    assert.equal(active.fonts.bitmap.strictFamilyMatching, false);
    for (const module of Object.values(active.modules)) {
      assert.equal(module.compiled, true);
      assert.equal(module.available, true);
    }

    rmlui.shutdown();
    assert.equal(rmlui.getCapabilities().selectedFontEngine, null);
    assert.equal(rmlui.getCapabilities().fonts.harfbuzz.available, false);
    assert.throws(() => engine.kind, /valid/i);
    assert.equal(active.fonts.harfbuzz.available, true);
  },

  'harfbuzz-ligature-versus-native-freetype': ({ rmlui, window }) => {
    const counts = {};
    for (const kind of [ 'freetype', 'harfbuzz' ]) {
      const engine = start(rmlui, window, kind);
      const face = load(engine, latin);
      const shaping = new rmlui.TextShapingContext('en');
      const { result } = generate(rmlui, engine, face, 'ffi', shaping);
      counts[kind] = result.meshes.reduce(
        (count, item) => count + item.mesh.vertexCount, 0);
      assert.equal(result.width,
        engine.getStringWidth(face, 'ffi', shaping));
      assert.ok(result.meshes[0].texture.getDimensions().x > 0);
      rmlui.shutdown();
    }
    assert.equal(counts.freetype, 12);
    assert.equal(counts.harfbuzz, 4);
  },

  'harfbuzz-arabic-joining-versus-native-freetype': ({ rmlui, window }) => {
    const output = {};
    for (const kind of [ 'freetype', 'harfbuzz' ]) {
      const engine = new rmlui.FontEngineInterface(kind);
      if (kind === 'harfbuzz') {
        engine.registerLanguage('ar', 'Arab', 'rtl');
      }
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const face = load(engine, arabic);
      const shaping = new rmlui.TextShapingContext('ar');
      const { result } = generate(rmlui, engine, face, 'لا', shaping);
      output[kind] = {
        width: result.width,
        vertices: result.meshes.reduce(
          (count, item) => count + item.mesh.vertexCount, 0),
      };
      assert.equal(result.width,
        engine.getStringWidth(face, 'لا', shaping));
      rmlui.shutdown();
    }
    assert.equal(output.freetype.vertices, 8);
    assert.equal(output.harfbuzz.vertices, 4);
    assert.notEqual(output.freetype.width, output.harfbuzz.width);
  },

  'harfbuzz-memory-ownership-and-resource-generations':
    ({ rmlui, window }) => {
      const engine = start(rmlui, window, 'harfbuzz');
      const bytes = fs.readFileSync(latin);
      assert.ok(engine.loadFontFace(bytes, 'owned', 0, 400));
      bytes.fill(0);
      const face = engine.getFontFaceHandle('owned', 0, 400, 32);
      const { manager, result } =
        generate(rmlui, engine, face, 'ffi');
      const texture = result.meshes[0].texture;
      const vertices = result.meshes[0].mesh.vertices;
      assert.ok(texture.getDimensions().x > 0);
      const effects = engine.prepareFontEffects(face, []);
      engine.releaseFontResources();
      assert.throws(() => engine.getVersion(face), /valid/i);
      assert.throws(() => texture.getDimensions(), /valid/i);
      const fresh = engine.getFontFaceHandle('owned', 0, 400, 32);
      assert.equal(engine.getStringWidth(fresh, 'ffi'), result.width);
      assert.throws(() => engine.generateString(manager, fresh, effects,
        'ffi', { x: 0, y: 40 }, white), /valid/i);
      assert.ok(vertices.length > 0);
    },

  'harfbuzz-file-metadata-and-named-overloads': ({ rmlui, window }) => {
    const engine = start(rmlui, window, 'harfbuzz');
    assert.ok(engine.loadFontFace(latin));
    assert.ok(engine.getFontFaceHandle('latolatin', 0, 400, 32));
    const named = load(engine, latin);
    assert.equal(engine.getFontFaceHandle('absent', 0, 400, 32), null);
    assert.equal(engine.loadFontFace(path.join(assets, 'absent.ttf'),
      'absent', 0, 400), false);
    const shaping = new rmlui.TextShapingContext('en');
    const first = engine.getStringWidth(named, 'AV', shaping);
    assert.equal(engine.getStringWidth(named, 'AV', shaping, 65), first);
    engine.releaseFontResources();
    const fresh = engine.getFontFaceHandle('probe', 0, 400, 32);
    assert.equal(engine.getStringWidth(fresh, 'AV', shaping), first);
  },

  'harfbuzz-named-file-short-reads-and-close-ownership':
    ({ rmlui, window }) => {
      const bytes = fs.readFileSync(latin);
      const sentinel = new Error('font read failure');
      let mode = 'full';
      let closed = 0;
      let lastFile;
      const files = new rmlui.FileInterface({
        open: () => bytes,
        length: () => (mode === 'empty' ? 0 : bytes.length),
        read(output, size, file) {
          lastFile = file;
          if (mode === 'throw') {
            throw sentinel;
          }
          output.set(bytes.subarray(0, size));
          return mode === 'short' ? size - 1 : size;
        },
        close() {
          ++closed;
        },
      });
      rmlui.setFileInterface(files);
      const engine = start(rmlui, window, 'harfbuzz');
      const face = load(engine, 'virtual.ttf');
      const width = engine.getStringWidth(face, 'ffi');
      assert.ok(width > 0);
      assert.equal(closed, 1);
      for (const failure of [ 'short', 'empty', 'throw' ]) {
        mode = failure;
        if (failure === 'throw') {
          assert.throws(() => engine.loadFontFace('virtual.ttf', failure,
            0, 400), error => error === sentinel);
        } else {
          assert.equal(engine.loadFontFace('virtual.ttf', failure,
            0, 400), false);
        }
        assert.equal(engine.getFontFaceHandle(failure, 0, 400, 32), null);
      }
      // The first callback error suppresses subsequent JS hooks, while Native
      // still removes and invalidates the open file token.
      assert.equal(closed, 3);
      assert.throws(() => files.tell(lastFile), /closed|valid/i);
      bytes.fill(0);
      assert.equal(engine.getStringWidth(face, 'ffi'), width);
    },

  'font-atlas-replacement-invalidates-borrowed-textures':
    ({ rmlui, window }) => {
      for (const kind of [ 'freetype', 'harfbuzz' ]) {
        const engine = start(rmlui, window, kind);
        const face = load(engine, latin);
        const { result } = generate(rmlui, engine, face, 'A');
        const texture = result.meshes[0].texture;
        const vertices = result.meshes[0].mesh.vertices;
        assert.ok(texture.getDimensions().x > 0);
        const before = engine.getVersion(face);
        const fresh = generate(rmlui, engine, face, 'é').result;
        assert.ok(engine.getVersion(face) > before);
        assert.ok(fresh.meshes[0].texture.getDimensions().x > 0);
        assert.throws(() => texture.getDimensions(), /valid/i);
        assert.ok(vertices.length > 0);
        rmlui.shutdown();
      }
    },

  'harfbuzz-native-kerning-and-letter-spacing': ({ rmlui, window }) => {
    const engine = start(rmlui, window, 'harfbuzz');
    const face = load(engine, latin);
    const shaping = new rmlui.TextShapingContext('en');
    shaping.fontKerning = rmlui.Style.FontKerning.Normal;
    const kerned = engine.getStringWidth(face, 'To', shaping);
    shaping.fontKerning = rmlui.Style.FontKerning.None;
    const unkerned = engine.getStringWidth(face, 'To', shaping);
    assert.ok(kerned < unkerned);
    const plain = engine.getStringWidth(face, 'AAAA', shaping);
    shaping.letterSpacing = 3;
    assert.equal(engine.getStringWidth(face, 'AAAA', shaping), plain + 12);
    const native = require('../../build/Release/rmlui.node');
    native.beginDataDiagnostics(false);
    const widths = engine.getStringWidths(face, Array(1000).fill('To'),
      shaping);
    const diagnostics = native.endDataDiagnostics();
    assert.equal(diagnostics.runtimeEntries, 1);
    assert.equal(diagnostics.nativeCallbacks, 0);
    assert.ok(widths.every(width => width === unkerned + 6));
  },

  'registered-language-controls-native-auto-direction':
    ({ rmlui, window }) => {
      const engine = new rmlui.FontEngineInterface('harfbuzz');
      engine.registerLanguage('x-test', 'Latn', 'rtl');
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const face = load(engine, latin);
      const shaping = new rmlui.TextShapingContext('x-test');
      const firstUv = text => generate(rmlui, engine, face, text, shaping)
        .result.meshes[0].mesh.getVertex(0).texCoord;
      const a = firstUv('A');
      const b = firstUv('B');
      assert.notDeepEqual(a, b);
      assert.deepEqual(firstUv('AB'), b);
      shaping.textDirection = rmlui.Style.Direction.Ltr;
      assert.deepEqual(firstUv('AB'), a);
      shaping.textDirection = rmlui.Style.Direction.Rtl;
      assert.deepEqual(firstUv('AB'), b);
    },

  'bitmap-atlas-uv-advance-and-kerning-oracle': ({ rmlui, window }) => {
    const engine = start(rmlui, window, 'bitmap');
    const face = load(engine, bitmap, 22);
    const xml = fs.readFileSync(bitmap, 'utf8');
    const glyphs = new Map();
    for (const match of xml.matchAll(/<char\s+([^>]+)\/>/g)) {
      const values = Object.fromEntries(Array.from(
        match[1].matchAll(/(\w+)="(-?\d+)"/g),
        entry => [ entry[1], Number(entry[2]) ]));
      glyphs.set(values.id, values);
    }
    const pair = Array.from(xml.matchAll(
      /<kerning first="(\d+)" second="(\d+)" amount="(-?\d+)"/g))
      .find(match => Number(match[3]) !== 0 &&
        glyphs.has(Number(match[1])) && glyphs.has(Number(match[2])));
    assert.ok(pair, 'Fixture must contain a nonzero kerning pair');
    const left = Number(pair[1]);
    const right = Number(pair[2]);
    const text = String.fromCodePoint(left, right);
    const expected = glyphs.get(left).xadvance +
      glyphs.get(right).xadvance + Number(pair[3]);
    assert.equal(engine.getStringWidth(face, text), expected);
    assert.equal(engine.getStringWidth(face,
      String.fromCodePoint(right), undefined, left),
    glyphs.get(right).xadvance + Number(pair[3]));
    const { result } = generate(rmlui, engine, face, text);
    assert.equal(result.width, expected);
    assert.equal(result.meshes.length, 1);
    assert.equal(result.meshes[0].mesh.vertexCount, 8);
    const scaleW = Number(xml.match(/scaleW="(\d+)"/)[1]);
    const scaleH = Number(xml.match(/scaleH="(\d+)"/)[1]);
    assert.deepEqual(result.meshes[0].texture.getDimensions(),
      { x: scaleW, y: scaleH });
    const uv = result.meshes[0].mesh.getVertex(0).texCoord;
    assert.ok(Math.abs(uv.x - glyphs.get(left).x / scaleW) < 1e-6);
    assert.ok(Math.abs(uv.y - glyphs.get(left).y / scaleH) < 1e-6);
    assert.equal(engine.getFontMetrics(face).size, 22);
    const otherSize = engine.getFontFaceHandle('probe', 0, 400, 80);
    assert.equal(engine.getFontMetrics(otherSize).size, 22);
    assert.equal(engine.loadFontFace(fs.readFileSync(latin), 'bytes', 0,
      400), false);
  },

  'language-registration-validation-and-lifecycle': ({ rmlui, window }) => {
    const engine = new rmlui.FontEngineInterface('harfbuzz');
    engine.registerLanguage('en', 'Latn', 'ltr');
    assert.throws(() => engine.registerLanguage('', 'Latn', 'ltr'),
      /language/i);
    assert.throws(() => engine.registerLanguage('en', 'Latin', 'ltr'),
      /script/i);
    assert.throws(() => engine.registerLanguage('en', 'Latn', 'auto'),
      /direction/i);
    assert.throws(() => new rmlui.FontEngineInterface()
      .registerLanguage('en', 'Latn', 'ltr'), /HarfBuzz/i);
    assert.throws(() => new rmlui.FontEngineInterface('absent'),
      /engine/i);
    rmlui.setFontEngineInterface(engine);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => engine.registerLanguage('en', 'Latn', 'ltr'),
      /before|initial/i);
  },
};

function run(name) {
  const rmlui = require('../../dist');
  const sfml = require('sfml.js');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 90)), 'Font backends');
  try {
    cases[name]({ rmlui, window });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]);
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [ __filename, name ],
      { encoding: 'utf8', timeout: 30000 });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} font-backend failures`);
}
