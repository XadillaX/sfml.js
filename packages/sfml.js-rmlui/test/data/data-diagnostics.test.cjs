'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

function measure(action) {
  native.beginDataDiagnostics();
  let counts;
  try {
    action();
  } finally {
    counts = native.endDataDiagnostics();
  }
  return counts;
}

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Data diagnostics');
assert.ok(rmlui.initialise(window, { highDpi: false }));
try {
  const context = rmlui.createContext('diagnostics', 200, 160);
  const model = context.createDataModel('numbers');
  const types = model.getDataTypeRegister();
  const scalar = types.registerScalar('Real', 'float64');
  const array = types.registerArray('Reals', scalar);
  let counts = measure(() => model.bind('values', [ 1, 2, 3 ], array));
  assert.equal(counts.runtimeEntries, 1);
  assert.equal(counts.storageNodes, 1);
  assert.equal(counts.backingAllocations, 1);
  assert.equal(counts.backingBytes, 24);
  assert.equal(counts.scalarWrites, 3);
  assert.equal(counts.resizeCopies, 0);
  assert.equal(counts.resizeCopiedBytes, 0);
  console.log('PASS measured-initial-storage-and-conversion');

  const values = model.getVariable('values');
  let view;
  counts = measure(() => {
    view = values.getNumericView();
    view[0] = 8;
  });
  assert.equal(counts.runtimeEntries, 1);
  assert.equal(counts.backingAllocations, 0);
  assert.equal(counts.scalarWrites, 0, 'direct JS writes bypass definitions');
  assert.equal(counts.resizeCopiedBytes, 0);
  assert.equal(values.child(0).get(), 8);
  console.log('PASS shared-view-has-no-storage-copy');

  counts = measure(() => values.resize(5));
  assert.equal(counts.runtimeEntries, 1);
  assert.equal(counts.backingAllocations, 1);
  assert.equal(counts.backingBytes, 40);
  assert.equal(counts.resizeCopies, 1);
  assert.equal(counts.resizeCopiedBytes, 24);
  assert.deepEqual([ ...values.getNumericView() ], [ 8, 2, 3, 0, 0 ]);
  assert.deepEqual([ ...view ], [ 8, 2, 3 ]);
  counts = measure(() => values.resize(5));
  assert.equal(counts.backingAllocations, 0);
  assert.equal(counts.resizeCopies, 0);
  console.log('PASS resize-counts-real-prefix-copy-and-noop');

  counts = measure(() => model.applyPatch({ 'values[1]': 7 }));
  assert.equal(counts.runtimeEntries, 1);
  assert.equal(counts.scalarWrites, 1);
  assert.equal(counts.backingAllocations, 0);
  assert.equal(counts.resizeCopies, 0);
  console.log('PASS sparse-patch-counts-one-native-write');

  native.beginDataDiagnostics();
  assert.throws(() => native.beginDataDiagnostics(), /active/i);
  native.endDataDiagnostics();
  assert.throws(() => native.endDataDiagnostics(), /active/i);
  measure(() => context.update());
  counts = measure(() => {});
  assert.equal(counts.runtimeEntries, 0);
  assert.equal(counts.scalarReads, 0);
  console.log('PASS sessions-reset-and-exclude-diagnostic-entrypoints');
} finally {
  rmlui.shutdown();
  window.close();
}
