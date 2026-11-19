'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

function count(action, allocations = false) {
  native.beginDataDiagnostics(allocations);
  let counts;
  try {
    action();
  } finally {
    counts = native.endDataDiagnostics();
  }
  return counts;
}

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Performance counters');
assert.ok(rmlui.initialise(window, { highDpi: false }));
try {
  const context = rmlui.createContext('performance', 200, 160);
  const model = context.createDataModel('numbers');
  const types = model.getDataTypeRegister();
  const array = types.registerArray('Reals',
    types.registerScalar('Real', 'float64'));
  model.bind('values', [ 1, 2, 3 ], array);
  const values = model.getVariable('values');
  const view = values.getNumericView();
  let seen = 0;
  model.bindFunc('callback', () => {
    ++seen;
    return 9;
  });
  let counts = count(() => model.getVariable('callback').get());
  assert.equal(seen, 1);
  assert.equal(counts.nativeCallbacks, 1);
  assert.equal(counts.callbacks.dataGetter, 1);
  assert.equal(counts.runtimeEntries, 2);
  counts = count(() => {
    view.fill(7);
    model.dirtyAllVariables();
    model.update();
  });
  assert.equal(counts.nativeCallbacks, 0);
  assert.equal(counts.runtimeEntries, 2);
  assert.equal(counts.backingAllocations, 0);
  console.log('PASS bidirectional-counters-distinguish-shared-and-getters');

  model.bind('values0', [ 1, 2, 3 ], array);
  const nativeView = model.getVariable('values0').getNumericView();
  counts = count(() => native.fillDiagnosticArrays(model.handle, 4, 1));
  assert.deepEqual([ ...nativeView ], [ 4, 4, 4 ]);
  assert.equal(counts.nativeNumericWrites, 3);
  assert.equal(counts.scalarWrites, 0);
  assert.equal(counts.backingAllocations, 0);
  assert.equal(counts.runtimeEntries, 1);
  console.log('PASS native-baseline-writes-the-same-retained-storage');

  const document = context.loadDocumentFromMemory('<rml><head><style>' +
    'body { display: block; width: 200px; height: 160px; }' +
    'i { display: block; width: 40px; height: 40px;' +
    'background-color: #abcdef; }' +
    '</style></head><body><i data-value="7"/></body></rml>');
  document.show();
  context.update();
  counts = count(() => {
    context.render();
    window.display();
  }, process.platform === 'darwin');
  assert.ok(counts.geometryCompiles > 0);
  assert.equal(counts.geometryUploads, counts.geometryCompiles);
  assert.ok(counts.geometryUploadBytes > 0);
  assert.equal(counts.geometryExpansionBytes, counts.geometryUploadBytes);
  assert.ok(counts.geometryDraws > 0);
  counts = count(() => context.render());
  assert.equal(counts.geometryCompiles, 0);
  assert.equal(counts.geometryUploads, 0);
  assert.equal(counts.geometryExpansionBytes, 0);
  assert.ok(counts.geometryDraws > 0);
  assert.equal(counts.nativeCallbacks, 0);
  console.log('PASS steady-render-reuses-geometry-without-reupload');
  assert.equal(native.checkDiagnosticRows(document.handle, 1, 7, 1), true);
  assert.equal(native.checkDiagnosticRows(document.handle, 2, 7, 2), false);
  assert.equal(native.checkDiagnosticRows(document.handle, 1, 9, 1), false);
  assert.equal(native.checkDiagnosticRows(document.handle, 1, 7, 1, true),
    false, 'Equal attributes must not hide a wrong rendered width');
  const checkedItem = document.querySelector('i');
  checkedItem.setProperty('width', '8px');
  assert.equal(native.checkDiagnosticRows(document.handle, 1, 7, 1, true),
    true);
  checkedItem.setProperty('width', '40px');
  console.log('PASS native-row-checker-verifies-values-and-real-scale');
  const item = document.querySelector('i');
  counts = count(() => item.setAttribute('data-value', 7));
  assert.equal(counts.elementOwnershipPasses, 0);
  assert.equal(counts.elementOwnershipVisits, 0);
  console.log('PASS numeric-attribute-mutation-skips-wrapper-ownership-work');

  if (process.platform === 'darwin') {
    native.beginDataDiagnostics(true);
    try {
      assert.equal(native.probeDiagnosticMalloc(), 4096);
    } finally {
      native.endDataDiagnostics();
    }
    counts = count(() => values.resize(10000), true);
    assert.equal(counts.mallocTracking, true);
    assert.ok(counts.mallocAllocations > 0);
    assert.ok(counts.mallocRequestedBytes >= 80000);
    assert.equal(counts.resizeCopiedBytes, 24);
    const resizeCounts = counts;
    counts = count(() => {}, true);
    // Entering the end diagnostic itself has measurable V8/Nan overhead.
    // Result-object construction happens after the logger is disabled.
    assert.ok(counts.mallocAllocations < resizeCounts.mallocAllocations);
    assert.ok(counts.mallocRequestedBytes < resizeCounts.mallocRequestedBytes);
    counts = count(() => values.resize(11000));
    assert.equal(counts.mallocTracking, false);
    assert.equal(counts.mallocAllocations, 0);
    console.log('PASS opt-in-main-thread-malloc-counts-exclude-result-objects');
  }
} finally {
  rmlui.shutdown();
  window.close();
}
