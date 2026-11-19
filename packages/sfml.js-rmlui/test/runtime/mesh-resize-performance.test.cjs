'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const { collectSamples } =
  require('../../tools/performance/measure-mesh-resize.cjs');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(32, 32)),
  'Mesh resize performance contracts');
assert.ok(rmlui.initialise(window, { highDpi: false }));

try {
  const samples = collectSamples();
  assert.equal(samples.length, 18);

  // A small destination must not allocate in proportion to discarded data.
  for (const sample of samples) {
    if (sample.mallocTracking) {
      assert.ok(sample.mallocRequestedBytes <= sample.targetBytes + 16384,
        `resize ${sample.previousCount} -> ${sample.nextCount}, ` +
        `retained=${sample.retained}: ${sample.mallocRequestedBytes} bytes`);
      assert.equal(sample.mallocReallocations, 0);
    }
  }
  console.log(process.platform === 'darwin'
    ? 'PASS mesh-resize-process-allocation-bounded-by-destination'
    : 'SKIP mesh-resize-process-allocation-macos-only');

  for (const sample of samples) {
    assert.equal(sample.nativePrefixCopies, sample.prefixBytes ? 1 : 0);
    assert.equal(sample.nativePrefixCopiedBytes, sample.prefixBytes);
    assert.equal(sample.nativeStorageAllocations, sample.targetBytes ? 2 : 0);
    assert.equal(sample.nativeStorageBytes, sample.targetBytes);
  }
  console.log('PASS mesh-resize-prefix-and-storage-diagnostic-accounting');
} finally {
  rmlui.shutdown();
  window.close();
}
