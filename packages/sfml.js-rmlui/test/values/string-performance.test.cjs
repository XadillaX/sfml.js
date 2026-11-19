'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

/**
 * Measure real native calls, allocation and copy counters.
 * @param {Function} action - Public operation to measure.
 * @param {boolean} trackMalloc - Enable actual macOS main-thread malloc counts.
 * @return {object} Actual diagnostics.
 */
function measure(action, trackMalloc = false) {
  native.beginDataDiagnostics(trackMalloc);
  let counts;
  try {
    action();
  } finally {
    counts = native.endDataDiagnostics();
  }

  return counts;
}

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(120, 80)), 'String batch contracts');
assert.ok(rmlui.initialise(window, { highDpi: false }));

try {
  const view = new rmlui.StringView('Aé中😀Z'.repeat(20000));
  const input = new Int32Array([ 0, 1, 2, 3, 4, 5, 100000 ]);
  const output = new Int32Array(input.length);

  let counts = measure(() =>
    rmlui.StringUtilities.convertCharacterOffsetsToByteOffsets(
      view, input, output));
  assert.deepEqual(Array.from(output), [ 0, 1, 3, 6, 10, 11, 220000 ]);
  assert.equal(counts.runtimeEntries, 1);
  assert.equal(counts.nativeCallbacks, 0);
  assert.equal(counts.stringIndexBuilds, 1);
  assert.equal(counts.stringOffsetRows, 7);
  console.log('PASS first-batch-builds-one-native-index');

  counts = measure(() =>
    rmlui.StringUtilities.convertCharacterOffsetsToByteOffsets(
      view, input, output));
  assert.equal(counts.runtimeEntries, 1);
  assert.equal(counts.nativeCallbacks, 0);
  assert.equal(counts.stringIndexBuilds, 0);
  assert.equal(counts.stringInputCopiedBytes, 0);
  assert.equal(counts.stringOutputAllocations, 0);
  assert.equal(counts.ownershipInstanceVisits, 0);
  console.log('PASS warm-batch-one-entry-no-copy-allocation-or-owner-scan');

  const iterator = new rmlui.StringIteratorU8(view);
  counts = measure(() => {
    for (let i = 0; i < 5; i++) {
      assert.equal(iterator.valid(), true);
      iterator.value();
      iterator.increment();
    }
  });
  assert.equal(iterator.offset(), 11);
  assert.equal(counts.runtimeEntries, 0);
  assert.equal(counts.nativeCallbacks, 0);
  assert.equal(counts.stringOutputAllocations, 0);
  console.log('PASS managed-iteration-has-zero-native-entries');

  if (process.platform === 'darwin') {
    const query = () =>
      rmlui.StringUtilities.convertCharacterOffsetsToByteOffsets(
        view, input, output);
    const calibration = [];
    for (let i = 0; i < 3; i++) {
      const warmup = measure(query, true);
      calibration.push({
        allocations: warmup.mallocAllocations,
        requestedBytes: warmup.mallocRequestedBytes,
      });
    }
    console.log(`INFO malloc-profiler-warmup ${JSON.stringify(calibration)}`);

    counts = measure(query, true);
    assert.equal(counts.runtimeEntries, 1);
    assert.equal(counts.mallocTracking, true);
    assert.equal(counts.mallocAllocations, 0);
    assert.equal(counts.mallocRequestedBytes, 0);
    console.log('PASS warm-native-batch-has-zero-main-thread-malloc');
  }
} finally {
  rmlui.shutdown();
  window.close();
}
