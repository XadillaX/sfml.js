'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

function measure(action) {
  native.beginDataDiagnostics(false);
  let counts;
  try {
    action();
  } finally {
    counts = native.endDataDiagnostics();
  }
  return counts;
}

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(32, 32)),
  'Utility performance contracts');
assert.ok(rmlui.initialise(window, { highDpi: false }));
try {
  const count = 10000;
  const commands = rmlui.MeshUtilities.allocateCommands(count);
  for (let i = 0; i < count; ++i) {
    commands.set([ 0, i, 0, 1, 1, 80, 40, 20, 100, 0, 0, 1, 1 ],
      i * rmlui.MeshUtilities.commandStride);
  }
  const mesh = new rmlui.Mesh();
  const first = measure(() => rmlui.MeshUtilities.append(mesh, commands));
  assert.equal(first.utilityEntries, 1);
  assert.equal(first.utilityCommands, count);
  assert.equal(first.utilityMeshPrefixCopies, 0);
  assert.equal(first.utilityMeshReallocations, 2);
  assert.equal(first.utilityAllocations, 0);
  assert.equal(first.nativeCallbacks, 0);
  assert.equal(mesh.vertexCount, count * 4);
  assert.equal(mesh.indices.length, count * 6);
  console.log('PASS utility-batch-fixed-entry-and-no-input-allocation');

  // Holding a view requires exactly one prefix copy on the next append.
  const held = mesh.vertices;
  const next = measure(() => rmlui.MeshUtilities.append(mesh, commands));
  assert.equal(next.utilityMeshPrefixCopies, 1);
  assert.equal(next.utilityMeshPrefixCopiedBytes, count * (4 * 20 + 6 * 4));
  held[0] = 19;
  assert.notEqual(mesh.vertices[0], 19);
  console.log('PASS utility-retained-view-one-prefix-copy');

  const reusable = new rmlui.Mesh();
  const repeated = measure(() => {
    for (let i = 0; i < 1000; ++i) {
      rmlui.MeshUtilities.append(reusable, commands, 1);
    }
  });
  assert.equal(repeated.utilityMeshPrefixCopies, 0);
  assert.ok(repeated.utilityMeshReallocations <= 24);
  console.log('PASS utility-growth-bounded-without-exported-views');

  const filter = new rmlui.ConvolutionFilter();
  filter.initialise(1, rmlui.FilterOperation.Sum);
  filter.kernel.fill(1 / 9);
  const source = rmlui.ConvolutionFilter.allocateBytes(64 * 64);
  source.fill(90);
  const output = rmlui.ConvolutionFilter.allocateBytes(64 * 64);
  const steady = measure(() => {
    for (let i = 0; i < 20; ++i) {
      filter.run(output, { x: 64, y: 64 }, 64, rmlui.ColorFormat.A8,
        source, { x: 64, y: 64 }, { x: 0, y: 0 }, rmlui.ColorFormat.A8);
    }
  });
  assert.equal(steady.utilityEntries, 20);
  assert.equal(steady.utilityAllocations, 0);
  assert.equal(steady.utilityKernelWeights, 20 * 9);
  assert.equal(steady.utilityNegativePreflightPixels, 0);
  assert.equal(steady.nativeCallbacks, 0);
  assert.equal(output[65], 90);
  console.log('PASS utility-convolution-allocation-free-steady-state');
} finally {
  rmlui.shutdown();
  window.close();
}
