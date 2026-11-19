'use strict';

const assert = require('node:assert/strict');
const os = require('node:os');
const { performance } = require('node:perf_hooks');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

const warmupCalls = 20;
const sampleCalls = 80;
const countedCalls = 5;
const metrics = {
  size: 20, ascent: 15, descent: 5, lineSpacing: 20, xHeight: 10,
  underlinePosition: 2, underlineThickness: 1, hasEllipsis: true,
};

function distribution(values) {
  const ordered = values.slice().sort((a, b) => a - b);
  return {
    p50: ordered[Math.ceil(ordered.length * 0.5) - 1],
    p95: ordered[Math.ceil(ordered.length * 0.95) - 1],
    minimum: ordered[0],
    maximum: ordered[ordered.length - 1],
  };
}

function counters() {
  const value = native.endDataDiagnostics();
  return Object.fromEntries([
    'runtimeEntries', 'nativeCallbacks', 'fontMeasureRows',
    'fontMeasureStorageAllocations', 'fontMeasureCopiedBytes',
    'callbackSnapshotVisits', 'elementOwnershipVisits', 'mallocTracking',
    'mallocAllocations', 'mallocReallocations', 'mallocRequestedBytes',
  ].map(name => [ name, value[name] ]));
}

function measure(call, count, mode) {
  for (let i = 0; i < warmupCalls; ++i) {
    call();
  }
  const milliseconds = [];
  for (let i = 0; i < sampleCalls; ++i) {
    const start = performance.now();
    const widths = call();
    milliseconds.push(performance.now() - start);
    assert.equal(widths.length, count);
    assert.ok(widths.every(width => width === 42));
  }
  const samples = [];
  for (let i = 0; i < countedCalls; ++i) {
    native.beginDataDiagnostics(process.platform === 'darwin');
    call();
    const value = counters();
    assert.equal(value.runtimeEntries, 1);
    assert.equal(value.nativeCallbacks,
      mode === 'native' ? 0 : mode === 'packed' ? 1 : count);
    assert.equal(value.fontMeasureRows, count);
    assert.equal(value.fontMeasureStorageAllocations, 0);
    assert.equal(value.fontMeasureCopiedBytes,
      mode === 'native' ? 0 : mode === 'packed' ? count * 14 + 4 : count * 4);
    samples.push(value);
  }
  return { measurementMs: distribution(milliseconds), counters: samples };
}

function provider(mode) {
  let face;
  const engine = new rmlui.FontEngineInterface({
    initialize() {
      face = engine.createFontFace(metrics, mode === 'native' ? {
        firstCharacter: 0, advances: new Int32Array(128).fill(7),
        fallbackAdvance: 7,
      } : undefined);
    },
    getFontFaceHandle() {
      return face.handle;
    },
    getStringWidth: mode === 'compatibility' ?
      (handle, string) => string.length * 7 : undefined,
    measureStrings: mode === 'packed' ?
      (handle, buffer, count) => {
        for (let i = 0; i < count; ++i) {
          buffer.widths[i] = (buffer.offsets[i + 1] - buffer.offsets[i]) * 7;
        }
      } : undefined,
  });
  return engine;
}

function main() {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Custom font measurement');
  const runs = [];
  try {
    for (const mode of [ 'native', 'packed', 'compatibility' ]) {
      const engine = provider(mode);
      rmlui.setFontEngineInterface(engine);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      // Warm diagnostics outside measured calls. Keep every observed
      // allocation in the samples without assuming zero malloc.
      for (let i = 0; i < 5; ++i) {
        native.beginDataDiagnostics(process.platform === 'darwin');
        native.endDataDiagnostics();
      }
      const face = engine.getFontFaceHandle('measured', 0, 400, 20);
      for (const count of [ 1000, 10000, 100000 ]) {
        const buffer = new rmlui.FontMeasureBuffer(count, count * 6);
        for (let i = 0; i < count; ++i) {
          buffer.append('native');
        }
        runs.push({
          mode, count,
          ...measure(() => engine.measureStrings(face, buffer), count, mode),
        });
      }
      rmlui.shutdown();
    }
    console.log(JSON.stringify({
      date: new Date().toISOString(), platform: process.platform,
      cpu: os.cpus()[0].model, node: process.version,
      warmupCalls, sampleCalls, countedCalls,
      text: 'native', bytesPerRow: 6, expectedWidth: 42,
      timing: 'CPU measurement calls with allocation logging disabled',
      semantics: 'Equal independent codepoint advances; no kerning or shaping',
      limits: [
        'Excludes setup, UTF-8 encoding, layout, render, presentation and GPU',
        'malloc tracks native main-thread allocation requests on macOS',
        'Copy counters cover explicit measurement-buffer copies only',
        'Compatibility also creates per-string V8 snapshots and callbacks',
        'Not a FreeType, HarfBuzz, or bitmap-renderer comparison',
      ],
      runs,
    }, null, 2));
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

main();
