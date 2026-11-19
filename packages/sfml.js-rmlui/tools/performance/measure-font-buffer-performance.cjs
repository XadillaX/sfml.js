'use strict';

const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

const warmupFrames = 20;
const sampleFrames = 80;
const countedFrames = 5;

function distribution(values) {
  const ordered = values.slice().sort((a, b) => a - b);
  return {
    p50: ordered[Math.ceil(ordered.length * 0.5) - 1],
    p95: ordered[Math.ceil(ordered.length * 0.95) - 1],
    minimum: ordered[0],
    maximum: ordered[ordered.length - 1],
  };
}

function measure(call, expected, count) {
  for (let warmup = 0; warmup < warmupFrames; ++warmup) {
    call();
  }
  const milliseconds = [];
  for (let sample = 0; sample < sampleFrames; ++sample) {
    const start = performance.now();
    const widths = call();
    milliseconds.push(performance.now() - start);
    assert.equal(widths.length, count);
    assert.ok(widths.every(width => width === expected));
  }
  const counters = [];
  for (let sample = 0; sample < countedFrames; ++sample) {
    native.beginDataDiagnostics(process.platform === 'darwin');
    call();
    const value = native.endDataDiagnostics();
    counters.push({
      runtimeEntries: value.runtimeEntries,
      nativeCallbacks: value.nativeCallbacks,
      fontMeasureRows: value.fontMeasureRows,
      fontMeasureStorageAllocations: value.fontMeasureStorageAllocations,
      fontMeasureCopiedBytes: value.fontMeasureCopiedBytes,
      callbackSnapshotVisits: value.callbackSnapshotVisits,
      elementOwnershipVisits: value.elementOwnershipVisits,
      mallocTracking: value.mallocTracking,
      mallocAllocations: value.mallocAllocations,
      mallocReallocations: value.mallocReallocations,
      mallocRequestedBytes: value.mallocRequestedBytes,
    });
  }
  return { measurementMs: distribution(milliseconds), counters };
}

function main() {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Font buffer measurement');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const engine = rmlui.getFontEngineInterface();
    const font = path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf');
    assert.ok(engine.loadFontFace(font, 'measured', 0));
    const face = engine.getFontFaceHandle('measured', 0, 400, 20);
    const shaping = new rmlui.TextShapingContext(
      'language-tag-longer-than-sso');
    const expected = engine.getStringWidth(face, 'native', shaping);
    const runs = [];
    for (const count of [ 1000, 10000, 100000 ]) {
      const strings = Array(count).fill('native');
      const buffer = new rmlui.FontMeasureBuffer(count, count * 6);
      for (const string of strings) {
        buffer.append(string);
      }
      const packed = measure(() => engine.measureStrings(face, buffer, shaping),
        expected, count);
      for (const counters of packed.counters) {
        assert.equal(counters.runtimeEntries, 1);
        assert.equal(counters.nativeCallbacks, 0);
        assert.equal(counters.fontMeasureRows, count);
        assert.equal(counters.fontMeasureStorageAllocations, 0);
        assert.equal(counters.fontMeasureCopiedBytes, 0);
        assert.equal(counters.callbackSnapshotVisits, 0);
        assert.equal(counters.elementOwnershipVisits, 0);
        if (counters.mallocTracking) {
          assert.equal(counters.mallocAllocations, 0);
          assert.equal(counters.mallocReallocations, 0);
        }
      }
      const arrayCall = () => engine.getStringWidths(face, strings, shaping);
      const array = measure(arrayCall, expected, count);
      runs.push({ count, nativePacked: packed, stringArray: array });
    }
    console.log(JSON.stringify({
      date: new Date().toISOString(),
      platform: process.platform,
      cpu: os.cpus()[0].model,
      node: process.version,
      warmupFrames, sampleFrames, countedFrames,
      text: 'native', bytesPerRow: 6, fontSize: 20,
      timing: 'CPU measurement call only; counters and malloc logging disabled',
      limits: 'Excludes UTF-8 setup, layout, render, presentation and GPU time',
      runs,
    }, null, 2));
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

main();
