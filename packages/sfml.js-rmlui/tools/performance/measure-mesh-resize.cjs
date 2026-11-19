'use strict';

const assert = require('node:assert/strict');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

/**
 * Measure resize storage and process allocator work in the active runtime.
 * @return {object[]} Samples for empty, small and growing destination vectors.
 */
function collectSamples() {
  // Warm up the binding before starting process allocator intervals.
  const warmup = new rmlui.Mesh(3, 9);
  warmup.resize(3, 9);
  const samples = [];

  for (const previousCount of [ 1000, 10000, 100000 ]) {
    for (const nextCount of [ 0, 3, previousCount * 2 ]) {
      for (const retained of [ false, true ]) {
        const mesh = new rmlui.Mesh(previousCount, previousCount * 3);
        const previous = retained ? mesh.vertices : null;
        native.beginDataDiagnostics(true);
        let counts;
        try {
          mesh.resize(nextCount, nextCount * 3);
        } finally {
          counts = native.endDataDiagnostics();
        }
        assert.equal(mesh.vertexCount, nextCount);
        assert.equal(mesh.indices.length, nextCount * 3);
        if (previous) {
          assert.equal(previous.length,
            previousCount * rmlui.Mesh.vertexStride);
        }

        samples.push({
          previousCount, nextCount, retained,
          prefixBytes: Math.min(previousCount, nextCount) * (20 + 3 * 4),
          targetBytes: nextCount * (20 + 3 * 4),
          nativePrefixCopies: counts.utilityMeshPrefixCopies,
          nativePrefixCopiedBytes: counts.utilityMeshPrefixCopiedBytes,
          nativeStorageAllocations: counts.utilityMeshReallocations,
          nativeStorageBytes: counts.utilityMeshReservedBytes,
          mallocTracking: counts.mallocTracking,
          mallocAllocations: counts.mallocAllocations,
          mallocRequestedBytes: counts.mallocRequestedBytes,
          mallocReallocations: counts.mallocReallocations,
        });
      }
    }
  }

  return samples;
}

module.exports = { collectSamples };

if (require.main === module) {
  const sfml = require('sfml.js');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(32, 32)), 'Mesh resize allocations');
  assert.ok(rmlui.initialise(window, { highDpi: false }));

  try {
    console.log(JSON.stringify({
      platform: process.platform,
      samples: collectSamples(),
    }, null, 2));
  } finally {
    rmlui.shutdown();
    window.close();
  }
}
