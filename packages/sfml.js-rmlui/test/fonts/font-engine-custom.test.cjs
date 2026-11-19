'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');

const metrics = {
  size: 20, ascent: 15, descent: 5, lineSpacing: 20, xHeight: 10,
  underlinePosition: 2, underlineThickness: 1, hasEllipsis: true,
};

async function collect(reference) {
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

const cases = {
  'custom-metrics-version-release-and-foreign-face-contracts':
    ({ rmlui, window }) => {
      let face;
      let foreign = false;
      let badMetrics = false;
      let version = 4;
      let releases = 0;
      const other = new rmlui.FontEngineInterface({});
      const foreignFace = other.createFontFace(metrics);
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return foreign ? foreignFace.handle : face.handle;
        },
        getFontMetrics(handle) {
          assert.equal(handle, face.handle);
          return { ...metrics, ascent: badMetrics ? Infinity : 18 };
        },
        getVersion(handle) {
          assert.equal(handle, face.handle);
          return version;
        },
        releaseFontResources() {
          ++releases;
          assert.throws(() => engine.createFontFace(metrics), /releasing/i);
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      const snapshot = engine.getFontMetrics(handle);
      assert.equal(snapshot.ascent, 18);
      assert.equal(engine.getVersion(handle), 4);
      version = 4.5;
      assert.throws(() => engine.getVersion(handle), /int32/i);
      badMetrics = true;
      assert.throws(() => engine.getFontMetrics(handle), /finite/i);
      assert.equal(snapshot.ascent, 18);
      foreign = true;
      assert.throws(() => engine.getFontFaceHandle('custom', 0, 400, 20),
        /another|invalid/i);
      foreign = false;
      engine.releaseFontResources();
      assert.equal(releases, 1);
      assert.throws(() => engine.getVersion(handle), /valid/i);
      badMetrics = false;
      version = 5;
      face = engine.createFontFace(metrics);
      assert.equal(engine.getFontFaceHandle('custom', 0, 400, 20), face.handle);
      assert.equal(engine.getVersion(face.handle), 5);
    },

  'custom-packed-font-renders-context-and-reuses-static-geometry':
    ({ rmlui, window }) => {
      let face;
      let generated = 0;
      let measured = 0;
      let emptyTexture;
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return face.handle;
        },
        measureStrings(handle, packed, count) {
          assert.equal(handle, face.handle);
          ++measured;
          for (let i = 0; i < count; ++i) {
            packed.widths[i] = (packed.offsets[i + 1] - packed.offsets[i]) * 7;
          }
        },
        generateString(manager, handle, effects, string, position, colour) {
          assert.ok(manager instanceof rmlui.RenderManager);
          assert.equal(handle, face.handle);
          assert.equal(effects, null);
          ++generated;
          const mesh = new rmlui.Mesh(3, 3);
          mesh.indices.set([ 0, 1, 2 ]);
          const vertices = new DataView(mesh.vertices.buffer);
          const width = string.length * 7;
          const points = [
            [ position.x, position.y ],
            [ position.x + width, position.y ],
            [ position.x, position.y - metrics.ascent ],
          ];
          for (let i = 0; i < points.length; ++i) {
            const offset = i * 20;
            vertices.setFloat32(offset, points[i][0], true);
            vertices.setFloat32(offset + 4, points[i][1], true);
            vertices.setUint8(offset + 8, colour.red);
            vertices.setUint8(offset + 9, colour.green);
            vertices.setUint8(offset + 10, colour.blue);
            vertices.setUint8(offset + 11, colour.alpha);
          }
          return { width, meshes: [{ mesh, texture: emptyTexture }] };
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      emptyTexture = new rmlui.Texture();
      const context = rmlui.createContext('custom-font-context', 80, 60);
      const document = context.loadDocumentFromMemory(
        '<rml><head><style>body {font-family:custom;font-size:20px}' +
        '</style></head><body><p id="text">native</p></body></rml>');
      document.show();
      context.update();
      const text = document.querySelector('#text').getChild(0);
      assert.equal(text.getFontFaceHandle(), face.handle);
      assert.ok(measured > 0, 'upstream layout must call the packed provider');
      context.render();
      assert.ok(generated > 0, 'upstream render must generate actual meshes');
      const before = generated;
      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics(false);
      for (let frame = 0; frame < 8; ++frame) {
        context.update();
        context.render();
      }
      const counts = native.endDataDiagnostics();
      assert.equal(generated, before);
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.geometryUploads, 0);
      assert.ok(counts.geometryDraws >= 8);
      ++face.version[0];
      context.render();
      assert.ok(generated > before, 'version change must rebuild text meshes');
      const rebuilt = generated;
      text.setText('changed');
      context.update();
      context.render();
      assert.ok(generated > rebuilt, 'changed text must regenerate geometry');
    },

  'custom-packed-measurement-reuses-native-workspace-with-one-callback':
    ({ rmlui, window }) => {
      let face;
      let previous;
      let calls = 0;
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return face.handle;
        },
        measureStrings(handle, packed, count, shaping, prior) {
          ++calls;
          assert.equal(handle, face.handle);
          assert.equal(count, 100000);
          assert.equal(shaping.language, 'en');
          assert.equal(shaping.letterSpacing, 0);
          assert.equal(prior, 65);
          assert.ok(Object.isFrozen(packed));
          if (previous) {
            assert.equal(packed, previous);
          }
          previous = packed;
          for (let i = 0; i < count; ++i) {
            packed.widths[i] = (packed.offsets[i + 1] - packed.offsets[i]) * 7;
          }
        },
        getStringWidths() {
          throw new Error('packed path must bypass string conversion');
        },
        getStringWidth() {
          throw new Error('packed path must bypass scalar callbacks');
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      const buffer = new rmlui.FontMeasureBuffer(100000, 600000);
      for (let i = 0; i < buffer.widths.length; ++i) {
        buffer.append('native');
      }
      const shaping = new rmlui.TextShapingContext('en');
      engine.measureStrings(handle, buffer, shaping, 65);
      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics(false);
      assert.ok(engine.measureStrings(handle, buffer, shaping, 65)
        .every(width => width === 42));
      const counts = native.endDataDiagnostics();
      assert.equal(calls, 2);
      assert.equal(counts.runtimeEntries, 1);
      assert.equal(counts.nativeCallbacks, 1);
      assert.equal(counts.fontMeasureStorageAllocations, 0);
      assert.equal(counts.fontMeasureCopiedBytes, 1400004);
      engine.measureStrings(handle, buffer, shaping, 65, 0);
      assert.equal(calls, 2);
    },

  'custom-packed-callback-has-independent-input-and-atomic-errors':
    ({ rmlui, window }) => {
      let face;
      let buffer;
      let mode = 'snapshot';
      const original = new Error('packed first error');
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return face.handle;
        },
        measureStrings(handle, packed, count) {
          assert.equal(handle, face.handle);
          assert.equal(count, 2);
          if (mode === 'snapshot') {
            buffer.bytes.fill(0);
            buffer.offsets.fill(0);
            assert.deepEqual(Array.from(packed.bytes.subarray(0, 6)),
              Array.from(Buffer.from('abcdef')));
            assert.deepEqual(Array.from(packed.offsets.subarray(0, 3)),
              [ 0, 3, 6 ]);
          }
          packed.widths[0] = 21;
          packed.widths[1] = 22;
          if (mode === 'throw') {
            throw original;
          }
          if (mode === 'promise') {
            return Promise.reject(original);
          }
          if (mode === 'return') {
            return new Int32Array([ 21, 22 ]);
          }
          if (mode === 'reentry') {
            rmlui.shutdown();
          }
          if (mode === 'detach-snapshot') {
            packed.bytes.buffer.transfer();
          }
          if (mode === 'detach-offsets') {
            packed.offsets.buffer.transfer();
          }
          if (mode === 'detach-result') {
            packed.widths.buffer.transfer();
          }
          if (mode === 'detach-source') {
            buffer.widths.buffer.transfer();
          }
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      const reset = () => {
        buffer = new rmlui.FontMeasureBuffer(2, 6);
        buffer.append('abc');
        buffer.append('def');
        buffer.widths.fill(77);
      };
      reset();
      assert.deepEqual(Array.from(engine.measureStrings(handle, buffer)),
        [ 21, 22 ]);
      for (mode of [
        'throw', 'promise', 'return', 'reentry', 'detach-snapshot',
        'detach-offsets', 'detach-result', 'detach-source',
      ]) {
        reset();
        const current = buffer;
        const widths = buffer.widths;
        const storage = mode === 'detach-source' ? null : widths;
        assert.throws(() => engine.measureStrings(handle, current),
          mode === 'throw' ? error => error === original :
            /synchronous|undefined|callback|detach/i);
        if (storage) {
          assert.deepEqual(Array.from(storage), [ 77, 77 ], mode);
        }
      }
      mode = 'snapshot';
      reset();
      assert.deepEqual(Array.from(engine.measureStrings(handle, buffer)),
        [ 21, 22 ]);
    },

  'custom-packed-growth-and-detachment-preserve-old-native-storage':
    async ({ rmlui, window }) => {
      let face;
      let last;
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return face.handle;
        },
        measureStrings(handle, packed, count) {
          assert.equal(handle, face.handle);
          last = packed;
          packed.widths.fill(19, 0, count);
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      const small = new rmlui.FontMeasureBuffer(1, 1);
      small.append('x');
      engine.measureStrings(handle, small);
      const old = last;
      const large = new rmlui.FontMeasureBuffer(1000, 1000);
      for (let i = 0; i < 1000; ++i) {
        large.append('y');
      }
      engine.measureStrings(handle, large);
      assert.notEqual(last, old);
      assert.equal(old.bytes[0], 120);
      assert.equal(old.widths[0], 19);
      assert.equal(last.bytes[0], 121);
      assert.throws(() => structuredClone(last.widths.buffer,
        { transfer: [ last.widths.buffer ] }), /transfer/i);
      const detached = last;
      const moved = last.bytes.buffer.transfer();
      engine.measureStrings(handle, large);
      assert.notEqual(last, detached);
      assert.equal(new Uint8Array(moved)[0], 121);
      const escaped = last.widths;
      const weak = new WeakRef(last);
      last = null;
      rmlui.shutdown();
      assert.ok(await collect(weak), 'shutdown must release workspace wrapper');
      global.gc();
      assert.equal(escaped[0], 19);
      assert.equal(old.widths[0], 19);
    },

  'custom-native-table-overflow-keeps-entire-output-unchanged':
    ({ rmlui, window }) => {
      let face;
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics, {
            firstCharacter: 0, advances: new Int32Array(128).fill(2147483647),
            fallbackAdvance: 0,
          });
        },
        getFontFaceHandle() {
          return face.handle;
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      const buffer = new rmlui.FontMeasureBuffer(2, 3);
      buffer.append('x');
      buffer.append('yy');
      buffer.widths.fill(77);
      assert.throws(() => engine.measureStrings(handle, buffer), /int32/i);
      assert.deepEqual(Array.from(buffer.widths), [ 77, 77 ]);
    },

  'custom-provider-initializes-once-and-invalidates-owned-faces':
    ({ rmlui, window }) => {
      const calls = [];
      let face;
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          calls.push('initialize');
          face = engine.createFontFace(metrics);
        },
        shutdown() {
          calls.push('shutdown');
        },
        getFontFaceHandle(family, style, weight, size) {
          assert.equal(family, 'custom');
          assert.deepEqual([ style, weight, size ], [ 0, 400, 20 ]);
          return face.handle;
        },
        getStringWidth(handle, string) {
          assert.equal(handle, face.handle);
          return string.length * 7;
        },
      });
      assert.deepEqual(calls, []);
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.deepEqual(calls, [ 'initialize' ]);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('CUSTOM', 0, 400, 20);
      assert.equal(engine.getStringWidth(handle, 'abc'), 21);
      assert.equal(engine.getFontMetrics(handle).ascent, 15);
      rmlui.shutdown();
      assert.deepEqual(calls, [ 'initialize', 'shutdown' ]);
      assert.throws(() => engine.getStringWidth(handle, 'abc'), /initialised/i);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => engine.getStringWidth(handle, 'abc'), /valid/i);
    },

  'custom-native-advance-table-has-no-per-string-callback':
    ({ rmlui, window }) => {
      let face;
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics, {
            firstCharacter: 0, advances: new Int32Array(128).fill(7),
            fallbackAdvance: 9,
          });
        },
        getFontFaceHandle() {
          return face.handle;
        },
        getStringWidth() {
          throw new Error('native table must bypass JS');
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      const buffer = new rmlui.FontMeasureBuffer(100000, 600000);
      for (let i = 0; i < buffer.widths.length; ++i) {
        buffer.append('native');
      }
      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics(false);
      const widths = engine.measureStrings(handle, buffer);
      const counts = native.endDataDiagnostics();
      assert.ok(widths.every(width => width === 42));
      assert.equal(counts.runtimeEntries, 1);
      assert.equal(counts.nativeCallbacks, 0);
      face.advances[110] = 10;
      ++face.version[0];
      assert.equal(engine.getStringWidth(handle, 'n'), 10);
      assert.equal(engine.getStringWidth(handle, '😀'), 9);
      assert.equal(engine.getVersion(handle), 1);
      const storage = face.advances;
      engine.releaseFontResources();
      assert.throws(() => engine.getStringWidth(handle, 'n'), /valid/i);
      assert.equal(storage[110], 10);
    },

  'custom-bulk-callback-snapshots-input-and-commits-once':
    ({ rmlui, window }) => {
      let face;
      let buffer;
      let calls = 0;
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return face.handle;
        },
        getStringWidths(handle, strings, shaping, prior) {
          ++calls;
          assert.equal(handle, face.handle);
          assert.deepEqual(strings, [ 'abc', 'def' ]);
          assert.equal(shaping.language, 'en');
          assert.equal(prior, 65);
          buffer.bytes.fill(0);
          buffer.offsets.fill(0);
          return new Int32Array([ 21, 22 ]);
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      buffer = new rmlui.FontMeasureBuffer(2, 6);
      buffer.append('abc');
      buffer.append('def');
      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics(false);
      const result = engine.measureStrings(handle, buffer,
        new rmlui.TextShapingContext('en'), 65);
      const counts = native.endDataDiagnostics();
      assert.equal(calls, 1);
      assert.deepEqual(Array.from(result), [ 21, 22 ]);
      assert.equal(counts.nativeCallbacks, 1);
    },

  'custom-callback-exceptions-promises-and-reentry':
    ({ rmlui, window }) => {
      let face;
      let mode = 'throw';
      const original = new Error('first font error');
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return face.handle;
        },
        getStringWidth() {
          if (mode === 'throw') {
            throw original;
          }
          if (mode === 'promise') {
            return Promise.reject(original);
          }
          if (mode === 'reentry') {
            rmlui.shutdown();
          }
          return 8;
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      assert.throws(() => engine.getStringWidth(handle, 'x'),
        error => error === original);
      mode = 'promise';
      assert.throws(() => engine.getStringWidth(handle, 'x'), /synchronous/i);
      mode = 'reentry';
      assert.throws(() => engine.getStringWidth(handle, 'x'), /callback/i);
      mode = 'ok';
      assert.equal(engine.getStringWidth(handle, 'x'), 8);
    },

  'custom-initialize-failure-releases-core-and-first-error':
    ({ rmlui, window }) => {
      const original = new Error('initialize error');
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          engine.createFontFace(metrics);
          throw original;
        },
        shutdown() {
          throw new Error('later shutdown error');
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.throws(() => rmlui.initialise(window, { highDpi: false }),
        error => error === original);
      assert.equal(rmlui.getFontEngineInterface(), null);
      assert.throws(() => engine.createFontFace(metrics), /valid/i);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
    },

  'custom-bulk-failure-and-detachment-leave-output-unchanged':
    ({ rmlui, window }) => {
      let face;
      let buffer;
      let mode = 'bad';
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return face.handle;
        },
        getStringWidths() {
          if (mode === 'bad') {
            return new Int32Array([ 1 ]);
          }
          buffer.bytes.buffer.transfer();
          return new Int32Array([ 1, 2 ]);
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      buffer = new rmlui.FontMeasureBuffer(2, 2);
      buffer.append('a');
      buffer.append('b');
      buffer.widths.set([ 100, 200 ]);
      assert.throws(() => engine.measureStrings(handle, buffer), /length/i);
      assert.deepEqual(Array.from(buffer.widths), [ 100, 200 ]);
      mode = 'detach';
      assert.throws(() => engine.measureStrings(handle, buffer), /detach/i);
      assert.deepEqual(Array.from(buffer.widths), [ 100, 200 ]);
    },

  'custom-all-load-overloads-preserve-arguments-and-memory-snapshot':
    ({ rmlui, window }) => {
      const calls = [];
      const engine = new rmlui.FontEngineInterface({
        loadFontFace(...args) {
          calls.push(args);
          return true;
        },
        loadFontFaceNamed(...args) {
          calls.push(args);
          return true;
        },
        loadFontFaceMemory(...args) {
          calls.push(args);
          return true;
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.ok(engine.loadFontFace('file.ttf', true, 550, 2));
      assert.ok(engine.loadFontFace('named.ttf', 'family', 1, 600, false, 3));
      const bytes = new Uint8Array([ 1, 2, 3 ]);
      assert.ok(engine.loadFontFace(bytes, 'memory', 0, 400, true, 1));
      bytes.fill(0);
      assert.deepEqual(calls[0], [ 'file.ttf', 2, true, 550 ]);
      assert.deepEqual(calls[1], [ 'named.ttf', 3, 'family', 1, 600, false ]);
      assert.deepEqual(Array.from(calls[2][0]), [ 1, 2, 3 ]);
      assert.deepEqual(calls[2].slice(1), [ 1, 'memory', 0, 400, true ]);
    },

  'custom-compatibility-widths-snapshot-all-rows-before-first-callback':
    ({ rmlui, window }) => {
      let face;
      let buffer;
      const seen = [];
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return face.handle;
        },
        getStringWidth(handle, string, shaping) {
          seen.push(string);
          buffer.bytes.fill(120);
          buffer.offsets.fill(0);
          assert.ok(Object.isFrozen(shaping));
          return string.length * 4;
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      buffer = new rmlui.FontMeasureBuffer(2, 6);
      buffer.append('a');
      buffer.append('bcdef');
      assert.deepEqual(Array.from(engine.measureStrings(handle, buffer)),
        [ 4, 20 ]);
      assert.deepEqual(seen, [ 'a', 'bcdef' ]);
    },

  'custom-effects-and-generated-mesh-snapshots':
    ({ rmlui, window }) => {
      let face;
      let texture;
      let source;
      const effectData = { id: 'effect' };
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return face.handle;
        },
        prepareFontEffects(handle, effects) {
          assert.equal(handle, face.handle);
          assert.equal(effects.length, 0);
          return effectData;
        },
        generateString(manager, handle, effects, string, position, colour,
          opacity, shaping) {
          assert.ok(manager instanceof rmlui.RenderManager);
          assert.equal(handle, face.handle);
          assert.equal(effects, effectData);
          assert.equal(string, 'x');
          assert.deepEqual(position, { x: 2, y: 20 });
          assert.equal(colour.alpha, 255);
          assert.equal(opacity, 1);
          assert.equal(shaping.language, '');
          source = new rmlui.Mesh(3, 3);
          source.indices.set([ 0, 1, 2 ]);
          const vertices = new DataView(source.vertices.buffer);
          vertices.setFloat32(0, 2, true);
          vertices.setFloat32(4, 20, true);
          vertices.setFloat32(20, 9, true);
          vertices.setFloat32(24, 20, true);
          vertices.setFloat32(40, 2, true);
          vertices.setFloat32(44, 5, true);
          return { width: 7, meshes: [{ mesh: source, texture }] };
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
      texture = manager.loadTexture(path.resolve(__dirname,
        '../../third_party/rmlui/Samples/assets/hello_world.png'));
      const effects = engine.prepareFontEffects(handle, []);
      const generated = engine.generateString(manager, handle, effects, 'x',
        { x: 2, y: 20 }, { red: 255, green: 255, blue: 255, alpha: 255 });
      assert.equal(generated.width, 7);
      assert.equal(generated.meshes.length, 1);
      assert.equal(generated.meshes[0].mesh.vertexCount, 3);
      assert.equal(source.vertexCount, 0);
      const saved = generated.meshes[0].mesh.vertices;
      engine.releaseFontResources();
      assert.throws(() => generated.meshes[0].texture.getDimensions(),
        /valid/i);
      assert.equal(saved.byteLength, 60);
    },

  'custom-face-descriptor-accessors-cannot-destroy-provider':
    ({ rmlui, window }) => {
      const engine = new rmlui.FontEngineInterface({});
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const descriptor = { ...metrics };
      Object.defineProperty(descriptor, 'ascent', {
        get() {
          rmlui.shutdown();
          return 15;
        },
      });
      assert.throws(() => engine.createFontFace(descriptor), /callback/i);
      assert.ok(engine.createFontFace(metrics).handle);
    },

  'custom-cross-realm-promises-are-rejected-synchronously':
    ({ rmlui, window }) => {
      let face;
      const engine = new rmlui.FontEngineInterface({
        initialize() {
          face = engine.createFontFace(metrics);
        },
        getFontFaceHandle() {
          return face.handle;
        },
        generateString() {
          return vm.runInNewContext('Promise.reject(new Error("font async"))');
        },
      });
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handle = engine.getFontFaceHandle('custom', 0, 400, 20);
      const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
      assert.throws(() => engine.generateString(manager, handle, null, 'x',
        { x: 0, y: 20 }, { red: 255, green: 255, blue: 255, alpha: 255 }),
      /synchronous/i);
    },

  'custom-callback-cycles-collect-and-selected-roots-release':
    async ({ rmlui, window }) => {
      const unused = (() => {
        const captured = { engine: null };
        const engine = new rmlui.FontEngineInterface({
          initialize() {
            void captured.engine;
          },
        });
        captured.engine = engine;
        return new WeakRef(captured);
      })();
      assert.ok(await collect(unused), 'unused provider cycle must collect');
      const calls = [];
      const selected = (() => {
        const captured = { value: 'selected' };
        const engine = new rmlui.FontEngineInterface({
          initialize() {
            calls.push(captured.value);
          },
        });
        rmlui.setFontEngineInterface(engine);
        return { engine, captured: new WeakRef(captured) };
      })();
      global.gc();
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.deepEqual(calls, [ 'selected' ]);
      assert.ok(selected.captured.deref());
      rmlui.shutdown();
      assert.ok(await collect(selected.captured),
        'retaining a shut-down wrapper must not retain callbacks');
      assert.ok(selected.engine instanceof rmlui.FontEngineInterface);
    },
};

async function run(name) {
  const rmlui = require('../../dist');
  const sfml = require('sfml.js');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Custom font');
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
  assert.equal(failures, 0, `${failures} custom font failures`);
}
