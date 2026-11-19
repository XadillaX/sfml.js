'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const native = require('../../build/Release/rmlui.node');
const { Direction, FontKerning } = require('../../dist').Style;

const fields = [
  'ascent', 'descent', 'lineSpacing', 'xHeight',
  'underlinePosition', 'underlineThickness',
];

const inputMetrics = {
  size: 31,
  ascent: 22.5,
  descent: 8.25,
  lineSpacing: 33.75,
  xHeight: 12.125,
  underlinePosition: -2.5,
  underlineThickness: 1.25,
  hasEllipsis: false,
};

function customEngine(rmlui, window, callbacks = {}) {
  let face;
  const engine = new rmlui.FontEngineInterface({
    initialize() {
      face = engine.createFontFace(inputMetrics);
    },
    getFontFaceHandle() {
      return face.handle;
    },
    ...callbacks,
  });

  rmlui.setFontEngineInterface(engine);
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const handle = engine.getFontFaceHandle('field-contracts', 0, 400, 31);
  return { engine, handle };
}

async function collected(reference) {
  for (let attempt = 0; attempt < 60; ++attempt) {
    global.gc();
    await new Promise(resolve => setImmediate(resolve));
    if (!reference.deref()) {
      return true;
    }
    await new Promise(resolve => setImmediate(resolve));
  }
  return false;
}

function parameters(context) {
  return {
    language: context.language,
    direction: context.textDirection,
    fontKerning: context.fontKerning,
    letterSpacing: context.letterSpacing,
  };
}

const cases = {
  'all-metric-fields-use-independent-native-snapshots': ({ rmlui, window }) => {
    const { engine, handle } = customEngine(rmlui, window);
    const snapshot = engine.getFontMetrics(handle);

    assert.ok(snapshot instanceof rmlui.FontMetrics);
    assert.equal(snapshot.size, inputMetrics.size);
    assert.equal(snapshot.hasEllipsis, false);
    assert.ok(snapshot.values instanceof Float32Array);
    assert.equal(snapshot.values.length, fields.length);
    assert.equal(snapshot.values, snapshot.values);

    for (const [ index, field ] of fields.entries()) {
      assert.equal(snapshot[field], inputMetrics[field]);
      snapshot.values[index] = index + 100.25;
      assert.equal(snapshot[field], index + 100.25);
    }

    const fresh = engine.getFontMetrics(handle);
    assert.deepEqual([ ...fresh.values ],
      fields.map(field => inputMetrics[field]));
    assert.equal(fresh.size, 31);
    assert.equal(fresh.hasEllipsis, false);

    const raw = native.fontEngineGetMetrics(
      native.getFontEngineInterface(), handle);
    raw.sizeView[0] = -17;
    raw.flags[0] = 1;
    assert.equal(raw.sizeView[0], -17);
    assert.equal(raw.flags[0], 1);
    assert.equal(engine.getFontMetrics(handle).size, 31);
    assert.equal(engine.getFontMetrics(handle).hasEllipsis, false);
  },

  'shaping-defaults-enums-and-language-survive-runtime-restart':
    ({ rmlui, window }) => {
      const context = new rmlui.TextShapingContext();
      assert.deepEqual(parameters(context), {
        language: '', direction: Direction.Auto,
        fontKerning: FontKerning.Auto, letterSpacing: 0,
      });
      assert.ok(context.enums instanceof Int32Array);
      assert.equal(context.enums.length, 2);
      assert.equal(context.values.length, 1);

      const language = '日本語\0العربية🙂';
      context.language = language;
      for (const direction of [
        Direction.Auto, Direction.Ltr, Direction.Rtl,
      ]) {
        context.textDirection = direction;
        assert.equal(context.enums[0], direction);
      }
      for (const kerning of [
        FontKerning.Auto, FontKerning.Normal, FontKerning.None,
      ]) {
        context.fontKerning = kerning;
        assert.equal(context.enums[1], kerning);
      }

      context.letterSpacing = -1.125;
      const expected = parameters(context);
      assert.equal(expected.language, language);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      rmlui.shutdown();
      assert.deepEqual(parameters(context), expected);
      context.language = 'after-shutdown';
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.equal(context.language, 'after-shutdown');
      assert.equal(context.letterSpacing, -1.125);
    },

  'shaping-mutations-in-callback-do-not-change-active-batch':
    ({ rmlui, window }) => {
      const context = new rmlui.TextShapingContext('en');
      context.textDirection = Direction.Rtl;
      context.fontKerning = FontKerning.None;
      context.letterSpacing = 1.25;
      const expected = parameters(context);
      let calls = 0;

      const { engine, handle } = customEngine(rmlui, window, {
        getStringWidth(face, string, snapshot) {
          ++calls;
          assert.ok(face);
          assert.equal(typeof string, 'string');
          assert.ok(Object.isFrozen(snapshot));
          assert.deepEqual(snapshot, expected);

          context.language = 'replacement'.repeat(10000);
          context.enums.set([ Direction.Ltr, FontKerning.Normal ]);
          context.values[0] = -8;
          global.gc();
          assert.deepEqual(snapshot, expected);
          return 41;
        },
      });

      assert.deepEqual([ ...engine.getStringWidths(
        handle, [ 'a', 'b', 'c' ], context) ], [ 41, 41, 41 ]);
      assert.equal(calls, 3);
      assert.equal(context.language.length, 110000);
      assert.equal(context.letterSpacing, -8);
    },

  'packed-measure-and-generation-use-frozen-shaping-snapshots':
    ({ rmlui, window }) => {
      const context = new rmlui.TextShapingContext('ar');
      context.enums.set([ Direction.Rtl, FontKerning.None ]);
      context.values[0] = 2.5;
      let expected = parameters(context);
      let measurements = 0;
      let generations = 0;

      function check(snapshot) {
        assert.ok(Object.isFrozen(snapshot));
        assert.deepEqual(snapshot, expected);
        context.language = 'updated';
        context.enums.set([ Direction.Ltr, FontKerning.Normal ]);
        context.values[0] = 9;
        assert.deepEqual(snapshot, expected);
      }

      const { engine, handle } = customEngine(rmlui, window, {
        measureStrings(face, buffer, count, snapshot) {
          ++measurements;
          assert.ok(face);
          check(snapshot);
          buffer.widths.fill(37, 0, count);
        },
        generateString(manager, face, effects, string, position, colour,
          opacity, snapshot) {
          ++generations;
          assert.ok(manager);
          assert.ok(face);
          assert.equal(effects, null);
          assert.equal(string, 'text');
          assert.equal(opacity, 1);
          assert.equal(position.y, 30);
          assert.equal(colour.alpha, 255);
          check(snapshot);
          return { width: 37, meshes: [] };
        },
      });

      const buffer = new rmlui.FontMeasureBuffer(2, 8);
      buffer.append('one');
      buffer.append('two');
      assert.deepEqual([ ...engine.measureStrings(handle, buffer, context) ],
        [ 37, 37 ]);
      assert.equal(measurements, 1);

      expected = parameters(context);
      const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
      assert.equal(engine.generateString(manager, handle, null, 'text',
        { x: 0, y: 30 },
        { red: 255, green: 255, blue: 255, alpha: 255 }, 1, context).width, 37);
      assert.equal(generations, 1);
    },

  'invalid-shared-shaping-fields-reject-before-host-callback':
    ({ rmlui, window }) => {
      let calls = 0;
      const { engine, handle } = customEngine(rmlui, window, {
        getStringWidth() {
          ++calls;
          return 10;
        },
      });
      const context = new rmlui.TextShapingContext('valid');

      for (const field of [ 'textDirection', 'fontKerning' ]) {
        for (const value of [ -1, 3, 1.5, NaN, Infinity, '1' ]) {
          assert.throws(() => {
            context[field] = value;
          }, /direction|kerning/i);
        }
      }
      for (const value of [
        Infinity, NaN, 2147483647, -2147483904, '2',
      ]) {
        assert.throws(() => {
          context.letterSpacing = value;
        }, /int32/i);
      }
      assert.throws(() => {
        context.language = 12;
      }, /string/i);
      assert.equal(context.language, 'valid');

      for (const [ field, value, expression ] of [
        [ 0, -1, /direction/i ], [ 1, 3, /kerning/i ],
      ]) {
        context.enums[field] = value;
        assert.throws(() => engine.getStringWidth(handle, 'x', context),
          expression);
        context.enums[field] = 0;
      }
      for (const value of [ Infinity, NaN, 2147483648, -2147483904 ]) {
        context.values[0] = value;
        assert.throws(() => engine.getStringWidth(handle, 'x', context),
          /finite|int32|spacing/i);
      }
      assert.equal(calls, 0);
    },

  'numeric-field-access-has-zero-native-entries': ({ rmlui, window }) => {
    const { engine, handle } = customEngine(rmlui, window);
    const metrics = engine.getFontMetrics(handle);
    const context = new rmlui.TextShapingContext('en');

    native.beginDataDiagnostics(false);
    for (let i = 0; i < 100000; ++i) {
      metrics.values[0] = i;
      assert.equal(metrics.ascent, i);
      assert.equal(metrics.descent, 8.25);
      assert.equal(metrics.lineSpacing, 33.75);
      assert.equal(metrics.xHeight, 12.125);
      assert.equal(metrics.underlinePosition, -2.5);
      assert.equal(metrics.underlineThickness, 1.25);
      assert.equal(metrics.size, 31);
      assert.equal(metrics.hasEllipsis, false);

      context.textDirection = i % 3;
      context.fontKerning = (i + 1) % 3;
      context.letterSpacing = i / 4;
      assert.equal(context.textDirection, i % 3);
      assert.equal(context.fontKerning, (i + 1) % 3);
      assert.equal(context.letterSpacing, i / 4);
    }
    const counts = native.endDataDiagnostics();
    assert.equal(counts.runtimeEntries, 0);
    assert.equal(counts.nativeCallbacks, 0);
    assert.equal(counts.elementOwnershipVisits, 0);
  },

  'retained-font-views-survive-wrapper-gc-and-engine-shutdown':
    async ({ rmlui, window }) => {
      const { engine, handle } = customEngine(rmlui, window);
      let metrics = engine.getFontMetrics(handle);
      let context = new rmlui.TextShapingContext('en');
      const references = [ new WeakRef(metrics), new WeakRef(context) ];
      const values = metrics.values;
      const enums = context.enums;
      const spacing = context.values;
      const raw = native.fontEngineGetMetrics(
        native.getFontEngineInterface(), handle);

      metrics = null;
      context = null;
      for (const reference of references) {
        assert.ok(await collected(reference));
      }

      rmlui.shutdown();
      global.gc();
      values[5] = 77.25;
      enums.set([ 2, 1 ]);
      spacing[0] = -4.5;
      raw.sizeView[0] = 17;
      raw.flags[0] = 1;
      assert.equal(values[5], 77.25);
      assert.deepEqual([ ...enums ], [ 2, 1 ]);
      assert.equal(spacing[0], -4.5);
      assert.equal(raw.sizeView[0], 17);
      assert.equal(raw.flags[0], 1);
    },
};

async function run(name) {
  const rmlui = require('../../dist');
  const sfml = require('sfml.js');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Font fields');

  try {
    await cases[name]({ rmlui, window });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} font-field failures`);
}
