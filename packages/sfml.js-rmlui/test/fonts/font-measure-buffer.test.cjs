'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const font = path.resolve(__dirname,
  '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf');

function setup(rmlui, window) {
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const engine = rmlui.getFontEngineInterface();
  assert.ok(engine.loadFontFace(font, 'buffer-face', rmlui.FontStyle.Normal));
  const face = engine.getFontFaceHandle('buffer-face', 0, 400, 20);
  assert.ok(face);
  return { engine, face };
}

const cases = {
  'packed-utf8-parity-and-reused-output': ({ rmlui, window }) => {
    const { engine, face } = setup(rmlui, window);
    const strings = [ '', 'AV', 'é', '世界', 'a\0b', '😀', '\ud800', 'native' ];
    const buffer = new rmlui.FontMeasureBuffer(strings.length, 256);
    for (const string of strings) {
      buffer.append(string);
    }
    assert.equal(buffer.length, strings.length);
    const widths = buffer.widths;
    assert.equal(engine.measureStrings(face, buffer), widths);
    assert.deepEqual(Array.from(widths),
      strings.map(string => engine.getStringWidth(face, string)));
    buffer.clear();
    buffer.append('new');
    assert.equal(engine.measureStrings(face, buffer), widths);
    assert.equal(widths[0], engine.getStringWidth(face, 'new'));
    assert.equal(buffer.length, 1);
  },

  'direct-shared-input-and-partial-count': ({ rmlui, window }) => {
    const { engine, face } = setup(rmlui, window);
    const buffer = new rmlui.FontMeasureBuffer(3, 16);
    buffer.bytes.set(Buffer.from('AVnative'));
    buffer.offsets.set([ 0, 2, 8, 8 ]);
    buffer.widths.fill(-77);
    assert.equal(engine.measureStrings(face, buffer, undefined, 65, 2),
      buffer.widths);
    assert.equal(buffer.widths[0],
      engine.getStringWidth(face, 'AV', undefined, 65));
    assert.equal(buffer.widths[1],
      engine.getStringWidth(face, 'native', undefined, 65));
    assert.equal(buffer.widths[2], -77);
    engine.measureStrings(face, buffer, undefined, 0, 0);
    assert.equal(buffer.widths[2], -77);
  },

  'bounds-and-utf8-fail-before-output': ({ rmlui, window }) => {
    const { engine, face } = setup(rmlui, window);
    const buffer = new rmlui.FontMeasureBuffer(2, 8);
    buffer.append('ok');
    buffer.append('end');
    buffer.widths.fill(-77);
    buffer.offsets[2] = 99;
    assert.throws(() => engine.measureStrings(face, buffer), /offset|bounds/i);
    assert.deepEqual(Array.from(buffer.widths), [ -77, -77 ]);
    buffer.offsets.set([ 1, 2, 5 ]);
    assert.throws(() => engine.measureStrings(face, buffer), /offset/i);
    buffer.offsets.set([ 0, 5, 2 ]);
    assert.throws(() => engine.measureStrings(face, buffer), /offset/i);
    for (const bytes of [
      [ 0xc0, 0x80 ], [ 0xed, 0xa0, 0x80 ], [ 0xf4, 0x90, 0x80, 0x80 ],
      [ 0x80 ], [ 0xc2 ], [ 0xe2, 0x82 ], [ 0xff ],
    ]) {
      buffer.bytes.set(bytes, 2);
      buffer.offsets.set([ 0, 2, 2 + bytes.length ]);
      assert.throws(() => engine.measureStrings(face, buffer), /utf-?8/i);
      assert.deepEqual(Array.from(buffer.widths), [ -77, -77 ]);
    }
    assert.throws(() => engine.measureStrings(face, buffer, undefined, 0, 3),
      /count|capacity/i);
    assert.throws(() => engine.measureStrings(face, buffer, undefined, 0, 0.5),
      /count/i);
    assert.throws(() => engine.measureStrings(face, {}), /buffer/i);
  },

  'append-capacity-and-zero-capacity': ({ rmlui, window }) => {
    const { engine, face } = setup(rmlui, window);
    assert.throws(() => new rmlui.FontMeasureBuffer(-1, 4), /capacity/i);
    assert.throws(() => new rmlui.FontMeasureBuffer(1, 0.5), /capacity/i);
    assert.throws(() => new rmlui.FontMeasureBuffer(2 ** 32, 4), /capacity/i);
    const empty = new rmlui.FontMeasureBuffer(0, 0);
    assert.equal(engine.measureStrings(face, empty), empty.widths);
    assert.equal(empty.widths.length, 0);
    assert.throws(() => empty.append(''), /capacity/i);
    const buffer = new rmlui.FontMeasureBuffer(2, 2);
    buffer.append('é');
    assert.throws(() => buffer.append('a'), /capacity/i);
    assert.equal(buffer.length, 1);
    buffer.append('');
    assert.throws(() => buffer.append(''), /capacity/i);
    assert.throws(() => {
      buffer.clear();
      buffer.append(123);
    }, /string/i);
  },

  'warm-one-entry-without-buffer-allocations-or-copies':
    ({ rmlui, window }) => {
      const { engine, face } = setup(rmlui, window);
      const native = require('../../build/Release/rmlui.node');
      const shaping = new rmlui.TextShapingContext(
        'language-tag-longer-than-sso');
      const expected = engine.getStringWidth(face, 'native', shaping);
      // Native counters work everywhere; libmalloc tracking is macOS-only.
      const trackMalloc = process.platform === 'darwin';
      for (const size of [ 1000, 10000, 100000 ]) {
        const buffer = new rmlui.FontMeasureBuffer(size, size * 6);
        for (let i = 0; i < size; ++i) {
          buffer.append('native');
        }
        for (let warmup = 0; warmup < 20; ++warmup) {
          engine.measureStrings(face, buffer, shaping);
        }
        native.beginDataDiagnostics(trackMalloc);
        const result = engine.measureStrings(face, buffer, shaping);
        const counts = native.endDataDiagnostics();
        assert.equal(result, buffer.widths);
        assert.equal(counts.runtimeEntries, 1);
        assert.equal(counts.nativeCallbacks, 0);
        assert.equal(counts.fontMeasureStorageAllocations, 0);
        assert.equal(counts.fontMeasureCopiedBytes, 0);
        assert.equal(counts.fontMeasureRows, size);
        assert.equal(counts.callbackSnapshotVisits, 0);
        assert.equal(counts.elementOwnershipVisits, 0);
        assert.equal(counts.mallocTracking, trackMalloc);
        if (trackMalloc) {
          assert.equal(counts.mallocAllocations, 0,
            JSON.stringify({ size, counts }));
          assert.equal(counts.mallocReallocations, 0);
        }
        assert.ok(result.every(width => width === expected));
      }
    },

  'shared-buffers-cannot-transfer-native-memory': ({ rmlui, window }) => {
    const { engine, face } = setup(rmlui, window);
    const buffer = new rmlui.FontMeasureBuffer(1, 6);
    buffer.append('native');
    engine.measureStrings(face, buffer);
    for (const view of [ buffer.bytes, buffer.offsets, buffer.widths ]) {
      const saved = Array.from(view);
      let clone;
      try {
        clone = structuredClone(view, { transfer: [ view.buffer ] });
      } catch (error) {
        assert.equal(error.name, 'DataCloneError');
      }
      if (clone) {
        clone.fill(0);
      }
      assert.deepEqual(Array.from(view), saved);
    }
    assert.ok(engine.measureStrings(face, buffer)[0] > 0);
  },

  'direct-transfers-invalidate-measurement-without-losing-storage':
    ({ rmlui, window }) => {
      const { engine, face } = setup(rmlui, window);
      const retained = [];
      for (const key of [ 'bytes', 'offsets', 'widths' ]) {
        for (const method of [ 'transfer', 'transferToFixedLength' ]) {
          const buffer = new rmlui.FontMeasureBuffer(1, 6);
          buffer.append('native');
          engine.measureStrings(face, buffer);
          const view = buffer[key];
          if (typeof view.buffer[method] !== 'function') {
            continue;
          }
          const saved = Array.from(view);
          const transferred = view.buffer[method]();
          const escaped = new view.constructor(transferred);
          assert.deepEqual(Array.from(escaped), saved);
          retained.push({ escaped, saved });
          assert.throws(() => engine.measureStrings(face, buffer), /detach/i);
        }
      }
      global.gc();
      rmlui.shutdown();
      global.gc();
      for (const { escaped, saved } of retained) {
        assert.deepEqual(Array.from(escaped), saved);
      }
    },

  'count-accessors-cannot-use-invalidated-face': ({ rmlui, window }) => {
    const { engine, face } = setup(rmlui, window);
    const buffer = new rmlui.FontMeasureBuffer(1, 6);
    buffer.append('native');
    Object.defineProperty(buffer, 'length', {
      get() {
        engine.releaseFontResources();
        return 1;
      },
    });
    assert.throws(() => engine.measureStrings(face, buffer), /valid/i);
  },

  'escaped-views-survive-gc-and-shutdown': ({ rmlui, window }) => {
    const { engine, face } = setup(rmlui, window);
    let buffer = new rmlui.FontMeasureBuffer(2, 12);
    buffer.append('native');
    engine.measureStrings(face, buffer);
    const { bytes, offsets, widths } = buffer;
    const expected = widths[0];
    buffer = null;
    global.gc();
    rmlui.shutdown();
    global.gc();
    assert.equal(Buffer.from(bytes.subarray(0, 6)).toString(), 'native');
    assert.equal(offsets[1], 6);
    assert.equal(widths[0], expected);
    widths[0] = 123;
    assert.equal(widths[0], 123);
    assert.throws(() => engine.measureStrings(face,
      new rmlui.FontMeasureBuffer(0, 0)), /valid|initial/i);
  },
};

function run(name) {
  const rmlui = require('../../dist');
  const sfml = require('sfml.js');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Font measurement');
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
  assert.equal(failures, 0, `${failures} font-measure-buffer failures`);
}
