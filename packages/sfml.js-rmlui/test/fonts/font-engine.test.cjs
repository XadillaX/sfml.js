'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const font = path.resolve(__dirname,
  '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf');

function face(engine, rmlui) {
  assert.ok(engine.loadFontFace(font, 'engine-face', rmlui.FontStyle.Normal));
  return engine.getFontFaceHandle('ENGINE-FACE',
    rmlui.FontStyle.Normal, rmlui.FontWeight.Normal, 20);
}

const cases = {
  'selection-and-single-provider-lifetime': ({ rmlui, window }) => {
    assert.equal(rmlui.getFontEngineInterface(), null);
    const unused = new rmlui.FontEngineInterface();
    const engine = new rmlui.FontEngineInterface();
    rmlui.setFontEngineInterface(engine);
    assert.equal(rmlui.getFontEngineInterface(), engine);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.equal(rmlui.getFontEngineInterface(), engine);
    assert.throws(() => face(unused, rmlui), /selected|active/i);
    assert.throws(() => rmlui.setFontEngineInterface(null), /before|initial/i);
    const handle = face(engine, rmlui);
    assert.ok(handle);
    assert.throws(() => engine.getStringWidth(0x1234, 'x'), /handle/i);
    rmlui.shutdown();
    assert.equal(rmlui.getFontEngineInterface(), null);
    assert.throws(() => rmlui.setFontEngineInterface(engine), /valid/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.ok(rmlui.getFontEngineInterface() instanceof
      rmlui.FontEngineInterface);
    assert.throws(() => rmlui.getFontEngineInterface()
      .getStringWidth(handle, 'x'), /valid/i);
  },

  'reset-to-automatic-default': ({ rmlui, window }) => {
    const engine = new rmlui.FontEngineInterface();
    rmlui.setFontEngineInterface(engine);
    rmlui.setFontEngineInterface(null);
    assert.equal(rmlui.getFontEngineInterface(), null);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const automatic = rmlui.getFontEngineInterface();
    assert.notEqual(automatic, engine);
    assert.ok(face(automatic, rmlui));
  },

  'all-three-load-overloads': ({ rmlui, window }) => {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const engine = rmlui.getFontEngineInterface();
    assert.ok(engine.loadFontFace(font, false, 400, 0));
    assert.ok(engine.loadFontFace(font, 'named-file', 0, 550, false, 0));
    const bytes = fs.readFileSync(font);
    assert.ok(engine.loadFontFace(bytes, 'named-memory', 0, 650, false, 0));
    bytes.fill(0);
    for (const [ family, weight ] of [
      [ 'LatoLatin', 400 ], [ 'named-file', 550 ], [ 'named-memory', 650 ],
    ]) {
      const token = engine.getFontFaceHandle(family, 0, weight, 20);
      assert.ok(token);
      assert.ok(engine.getStringWidth(token, 'font') > 0);
    }
    assert.equal(engine.getFontFaceHandle('absent', 0, 400, 20), null);
  },

  'shared-metrics-and-shaping-storage': ({ rmlui, window }) => {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const engine = rmlui.getFontEngineInterface();
    const handle = face(engine, rmlui);
    const metrics = engine.getFontMetrics(handle);
    assert.equal(metrics.size, 20);
    assert.ok(metrics.ascent > 0);
    assert.ok(metrics.lineSpacing > 0);
    const snapshot = metrics.values;
    const ascent = metrics.ascent;
    snapshot[0] = 1000;
    assert.equal(metrics.ascent, 1000);
    assert.equal(engine.getFontMetrics(handle).ascent, ascent);
    const shaping = new rmlui.TextShapingContext('en');
    assert.equal(shaping.language, 'en');
    const base = engine.getStringWidth(handle, 'AAAA', shaping);
    shaping.letterSpacing = 3;
    assert.ok(engine.getStringWidth(handle, 'AAAA', shaping) > base);
    shaping.values[0] = Infinity;
    assert.throws(() => engine.getStringWidth(handle, 'AAAA', shaping),
      /finite|spacing/i);
    shaping.letterSpacing = 0;
    shaping.values[0] = 1e20;
    assert.throws(() => engine.getStringWidth(handle, 'AAAA', shaping),
      /int32|spacing/i);
    assert.throws(() => {
      shaping.letterSpacing = 2147483647;
    }, /int32/i);
    shaping.letterSpacing = 0;
    assert.throws(() => engine.getFontFaceHandle(
      'engine-face', 0, 400, 33554432), /size/i);
    shaping.enums[0] = 999;
    assert.throws(() => engine.getStringWidth(handle, 'AAAA', shaping),
      /direction/i);
    rmlui.shutdown();
    assert.equal(snapshot[0], 1000);
  },

  'bulk-widths-and-shared-output': ({ rmlui, window }) => {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const engine = rmlui.getFontEngineInterface();
    const handle = face(engine, rmlui);
    const strings = [ '', 'AV', 'native', 'WWWW', 'iiii' ];
    assert.equal(engine.getStringWidths(handle, []).length, 0);
    const widths = engine.getStringWidths(handle, strings);
    assert.ok(widths instanceof Int32Array);
    assert.deepEqual(Array.from(widths),
      strings.map(string => engine.getStringWidth(handle, string)));
    assert.equal(widths[0], 0);
    assert.ok(widths[3] > widths[4]);
    assert.throws(() => engine.getStringWidths(handle, [ 'valid', 123 ]),
      /string/i);
    rmlui.shutdown();
    assert.ok(widths[2] > 0);
  },

  'bulk-widths-have-one-entry-and-zero-host-callbacks':
    ({ rmlui, window }) => {
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const engine = rmlui.getFontEngineInterface();
      const handle = face(engine, rmlui);
      const shaping = new rmlui.TextShapingContext();
      const native = require('../../build/Release/rmlui.node');
      const expected = engine.getStringWidth(handle, 'native font', shaping);
      for (const size of [ 1000, 10000, 100000 ]) {
        const strings = Array(size).fill('native font');
        native.beginDataDiagnostics(false);
        const result = engine.getStringWidths(handle, strings, shaping);
        const counts = native.endDataDiagnostics();
        assert.equal(counts.runtimeEntries, 1);
        assert.equal(counts.nativeCallbacks, 0);
        assert.equal(counts.callbackSnapshotVisits, 0);
        assert.equal(counts.elementOwnershipVisits, 0);
        assert.equal(result.length, size);
        assert.ok(result.every(width => width === expected));
      }
    },

  'bulk-input-accessors-cannot-use-invalidated-face': ({ rmlui, window }) => {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const engine = rmlui.getFontEngineInterface();
    const handle = face(engine, rmlui);
    const strings = [ 'first', 'second' ];
    Object.defineProperty(strings, 1, {
      get() {
        engine.releaseFontResources();
        return 'second';
      },
    });
    assert.throws(() => engine.getStringWidths(handle, strings), /valid/i);
    const fresh = face(engine, rmlui);
    Object.defineProperty(strings, 1, {
      get() {
        rmlui.shutdown();
        return 'second';
      },
    });
    assert.throws(() => engine.getStringWidths(fresh, strings), /valid/i);
  },

  'computed-face-tokens-and-static-native-font-rendering':
    ({ rmlui, window }) => {
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const engine = rmlui.getFontEngineInterface();
      face(engine, rmlui);
      const context = rmlui.createContext('engine-text', 80, 60);
      const document = context.loadDocumentFromMemory(
        '<rml><head><style>body {font-family:engine-face;font-size:20px}' +
        '</style></head><body><p id="text">native</p></body></rml>');
      document.show();
      context.update();
      const element = document.querySelector('#text').getChild(0);
      const token = element.getFontFaceHandle();
      assert.ok(token);
      assert.ok(engine.getStringWidth(token, 'native') > 0);
      context.render();
      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics(false);
      for (let frame = 0; frame < 32; ++frame) {
        context.update();
        context.render();
      }
      const counts = native.endDataDiagnostics();
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.callbackSnapshotVisits, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
    },

  'font-effects-meshes-and-resource-generations': ({ rmlui, window }) => {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const engine = rmlui.getFontEngineInterface();
    const handle = face(engine, rmlui);
    const effects = engine.prepareFontEffects(handle, []);
    const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
    const generated = engine.generateString(
      manager, handle, effects, 'Native text', { x: 0, y: 30 },
      { red: 255, green: 255, blue: 255, alpha: 255 });
    assert.ok(generated.width > 0);
    assert.ok(generated.meshes.length > 0);
    for (const item of generated.meshes) {
      assert.ok(item.mesh instanceof rmlui.Mesh);
      assert.ok(item.texture instanceof rmlui.Texture);
      assert.ok(item.mesh.isValid);
      assert.ok(item.mesh.vertexCount > 0);
    }
    const saved = generated.meshes[0].mesh.vertices;
    const texture = generated.meshes[0].texture;
    assert.ok(engine.getVersion(handle) >= 0);
    engine.releaseFontResources();
    assert.throws(() => engine.getVersion(handle), /valid/i);
    assert.throws(() => texture.getDimensions(), /valid/i);
    const fresh = face(engine, rmlui);
    assert.throws(() => engine.generateString(
      manager, fresh, effects, 'stale', { x: 0, y: 0 },
      { red: 255, green: 255, blue: 255, alpha: 255 }), /valid/i);
    assert.ok(saved.length > 0);
  },
};

function run(name) {
  const rmlui = require('../../dist');
  const sfml = require('sfml.js');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Font engine');
  try {
    cases[name]({ rmlui, sfml, window });
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
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} font-engine failures`);
}
