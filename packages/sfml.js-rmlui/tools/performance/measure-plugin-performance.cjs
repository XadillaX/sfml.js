'use strict';

const assert = require('node:assert/strict');
const os = require('node:os');
const { performance } = require('node:perf_hooks');
const { createHash } = require('node:crypto');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');
const countNativeCalls = require('./count-native-calls.cjs');

const warmupFrames = 20;
const timedFrames = 80;
const countedFrames = 5;

function distribution(samples) {
  const sorted = samples.slice().sort((a, b) => a - b);
  return {
    p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    minimum: sorted[0],
    maximum: sorted[sorted.length - 1],
    samples,
  };
}

function measure(window, subscription, count) {
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('plugin-frame', 160, 120);
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>body{display:block;margin:0;width:160px;' +
      'height:120px;}div{display:block;width:20px;height:20px;' +
      'background-color:#f00;}</style></head><body><div/></body></rml>');
    document.show();
    let notifications = 0;
    const observe = () => {
      ++notifications;
    };
    const callbacks = {
      getEventClasses: () => subscription,
      onContextCreate: observe,
      onDocumentLoad: observe,
      onElementCreate: observe,
      onDataModelCreate: observe,
    };
    for (let i = 0; i < count; ++i) {
      rmlui.registerPlugin(new rmlui.Plugin(callbacks));
    }
    const frame = () => {
      window.clear(sfml.Color.Black);
      window.flush();
      assert.equal(context.update(), true);
      assert.equal(context.render(), true);
      window.display();
    };
    for (let i = 0; i < warmupFrames; ++i) {
      frame();
    }
    const samples = [];
    for (let i = 0; i < timedFrames; ++i) {
      const start = performance.now();
      frame();
      samples.push(performance.now() - start);
    }
    const counters = [];
    for (let i = 0; i < countedFrames; ++i) {
      native.beginDataDiagnostics(process.platform === 'darwin');
      frame();
      const value = native.endDataDiagnostics();
      assert.equal(value.runtimeEntries, 2);
      assert.equal(value.nativeCallbacks, 0);
      assert.equal(value.callbacks.plugin, 0);
      assert.equal(value.geometryUploads, 0);
      assert.equal(value.elementOwnershipVisits, 0);
      assert.equal(value.geometryDraws, 1);
      counters.push(Object.fromEntries([
        'runtimeEntries', 'nativeCallbacks', 'geometryUploads',
        'geometryUploadBytes', 'geometryDraws', 'elementOwnershipVisits',
        'callbackSnapshotVisits', 'mallocTracking', 'mallocAllocations',
        'mallocReallocations', 'mallocRequestedBytes',
      ].map(name => [ name, value[name] ])));
    }
    assert.equal(notifications, 0);
    const crossings = countNativeCalls(frame);
    assert.equal(crossings.rmlui.total, 2);
    assert.equal(crossings.nativeToJs, 0);
    // Capture outside every timed/counted interval. Compare actual pixels
    // across the four subscription cases, including a non-black red pixel.
    window.clear(sfml.Color.Black);
    window.flush();
    context.update();
    context.render();
    const capture = new sfml.Texture(window.getSize());
    capture.update(window);
    const image = capture.copyToImage();
    const colour = image.getPixel(new sfml.Vector2u(2, 2));
    assert.deepEqual([ colour.r, colour.g, colour.b ], [ 255, 0, 0 ]);
    const pixelSha256 = createHash('sha256').update(image.pixels).digest('hex');
    return {
      subscription, registeredPlugins: count,
      completeCpuFrameMs: distribution(samples), counters, crossings,
      pixelSha256,
    };
  } finally {
    rmlui.shutdown();
  }
}

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Plugin frame measurement');
try {
  const rows = [
    measure(window, 0, 0),
    measure(window, rmlui.PluginEventClasses.Basic, 1),
    measure(window, rmlui.PluginEventClasses.All, 1),
    measure(window, rmlui.PluginEventClasses.All, 1000),
  ];
  assert.equal(new Set(rows.map(row => row.pixelSha256)).size, 1);
  console.log(JSON.stringify({
    measuredAt: new Date().toISOString(),
    platform: process.platform,
    architecture: process.arch,
    node: process.version,
    cpu: os.cpus()[0].model,
    warmupFrames, timedFrames, countedFrames,
    scope: 'Complete CPU clear/flush/update/render/display of identical ' +
      'static geometry. Timing excludes setup and diagnostics; ' +
      'GPU completion is not measured. Counted samples include main-thread ' +
      'allocator tracking ' +
      'only when available.',
    rows,
  }, null, 2));
} finally {
  rmlui.shutdown();
  window.close();
}
