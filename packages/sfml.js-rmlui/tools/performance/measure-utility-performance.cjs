'use strict';

const assert = require('node:assert/strict');
const os = require('node:os');
const { performance } = require('node:perf_hooks');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

const warmupSamples = 10;
const timedSamples = 80;
const countedSamples = 5;

function distribution(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  return {
    p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    minimum: sorted[0], maximum: sorted[sorted.length - 1],
  };
}

function counters(value) {
  const fields = [
    'utilityEntries', 'utilityCommands', 'utilityKernelWeights',
    'utilityNegativePreflightPixels', 'utilityAllocations',
    'utilityAllocatedBytes', 'utilityMeshPrefixCopies',
    'utilityMeshPrefixCopiedBytes', 'utilityMeshReallocations',
    'utilityMeshReservedBytes', 'nativeCallbacks',
    'mallocTracking', 'mallocAllocations', 'mallocReallocations',
    'mallocRequestedBytes',
  ];
  return Object.fromEntries(fields.map(name => [ name, value[name] ]));
}

function measure(prepare, action, check) {
  for (let i = 0; i < warmupSamples; ++i) {
    prepare();
    action();
  }
  const times = [];
  for (let i = 0; i < timedSamples; ++i) {
    prepare();
    const start = performance.now();
    action();
    times.push(performance.now() - start);
    check();
  }

  const counts = [];
  for (let i = 0; i < countedSamples; ++i) {
    prepare();
    native.beginDataDiagnostics(process.platform === 'darwin');
    let result;
    try {
      action();
    } finally {
      result = native.endDataDiagnostics();
    }
    check();
    counts.push(counters(result));
  }
  return { cpuMs: distribution(times), counters: counts };
}

function meshRuns() {
  const result = [];
  const color = { red: 80, green: 40, blue: 20, alpha: 100 };
  for (const count of [ 1000, 10000, 100000 ]) {
    const commands = rmlui.MeshUtilities.allocateCommands(count);
    for (let i = 0; i < count; ++i) {
      commands.set([ 0, i, 0, 1, 1, 80, 40, 20, 100, 0, 0, 1, 1 ],
        i * rmlui.MeshUtilities.commandStride);
    }
    const mesh = new rmlui.Mesh();
    const prepare = () => mesh.resize(0, 0);
    const check = () => assert.equal(mesh.vertexCount, count * 4);
    const bulk = measure(prepare,
      () => rmlui.MeshUtilities.append(mesh, commands), check);
    const scalar = measure(prepare, () => {
      for (let i = 0; i < count; ++i) {
        rmlui.MeshUtilities.generateQuad(
          mesh, { x: i, y: 0 }, { x: 1, y: 1 }, color);
      }
    }, check);
    for (const value of bulk.counters) {
      assert.equal(value.utilityEntries, 1);
      assert.equal(value.utilityCommands, count);
      assert.equal(value.utilityMeshPrefixCopies, 0);
      assert.equal(value.utilityAllocations, 0);
      assert.equal(value.nativeCallbacks, 0);
    }
    for (const value of scalar.counters) {
      assert.equal(value.utilityEntries, count);
      assert.equal(value.utilityMeshPrefixCopies, 0);
      assert.equal(value.nativeCallbacks, 0);
    }
    result.push({ kind: 'quad-generation', count, bulk, scalar });
  }
  return result;
}

function filterRuns() {
  const result = [];
  for (const side of [ 64, 256, 512 ]) {
    const filter = new rmlui.ConvolutionFilter();
    filter.initialise(1, rmlui.FilterOperation.Sum);
    filter.kernel.fill(1 / 9);
    const source = rmlui.ConvolutionFilter.allocateBytes(side * side);
    source.fill(90);
    const output = rmlui.ConvolutionFilter.allocateBytes(side * side);
    const dimensions = { x: side, y: side };
    const offset = { x: 0, y: 0 };
    const run = measure(() => {}, () => filter.run(
      output, dimensions, side, rmlui.ColorFormat.A8,
      source, dimensions, offset, rmlui.ColorFormat.A8),
    () => assert.equal(output[side + 1], 90));
    for (const value of run.counters) {
      assert.equal(value.utilityEntries, 1);
      assert.equal(value.utilityKernelWeights, 9);
      assert.equal(value.utilityNegativePreflightPixels, 0);
      assert.equal(value.utilityAllocations, 0);
      assert.equal(value.nativeCallbacks, 0);
      if (value.mallocTracking) {
        assert.equal(value.mallocAllocations, 0);
        assert.equal(value.mallocReallocations, 0);
      }
    }
    result.push({ kind: 'convolution', side, pixels: side * side, run });
  }
  return result;
}

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(32, 32)), 'Utility measurement');
assert.ok(rmlui.initialise(window, { highDpi: false }));
try {
  const runs = [ ...meshRuns(), ...filterRuns() ];
  console.log(JSON.stringify({
    date: new Date().toISOString(), platform: process.platform,
    architecture: process.arch, cpu: os.cpus()[0].model, node: process.version,
    warmupSamples, timedSamples, countedSamples,
    timing: 'CPU utility calls; diagnostics and malloc logging disabled',
    limits: 'Excludes input setup, mesh reset, layout, rendering and GPU time',
    allocationScope: 'Utility payloads and mesh reserves; malloc is separate',
    runs,
  }, null, 2));
} finally {
  rmlui.shutdown();
  window.close();
}
