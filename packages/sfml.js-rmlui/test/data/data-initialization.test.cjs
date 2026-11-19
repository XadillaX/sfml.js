'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

/**
 * Measure real dependency registration separately from input and rendering.
 * All rows must continue reacting to the shared scalar after construction.
 * @param {number} rows - Number of elements sharing the scalar dependency.
 * @param {number|string} iteration - Unique fixture identity.
 * @return {number} Native document construction time in milliseconds.
 */
function loadFixture(rows, iteration) {
  const name = `initialization-${rows}-${iteration}`;
  const context = rmlui.createContext(name, 320, 240);
  try {
    const model = context.createDataModel('measured');
    model.bind('value', 1);
    const source = '<rml><head><style>' +
      'body{display:block;margin:0;width:320px;height:240px;overflow:hidden}' +
      'i{display:block;height:1px;background-color:#56a6c4}' +
      '</style></head><body data-model="measured">' +
      ('<i data-attr-data-value="value" ' +
        'data-style-width="(value + 1) + \'px\'"/>').repeat(rows) +
      '</body></rml>';
    if (global.gc) {
      global.gc();
    }
    const start = process.hrtime.bigint();
    const document = context.loadDocumentFromMemory(source);
    const milliseconds = Number(process.hrtime.bigint() - start) / 1e6;
    document.show();
    context.update();
    assert.ok(native.checkDiagnosticRows(
      document.handle, rows, 1, rows, true));
    model.getVariable('value').set(4);
    model.dirtyVariable('value');
    model.update();
    context.update();
    assert.ok(native.checkDiagnosticRows(
      document.handle, rows, 4, rows, true));
    return milliseconds;
  } finally {
    rmlui.removeContext(name);
  }
}

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Data initialization');
assert.ok(rmlui.initialise(window, { highDpi: false }));
try {
  loadFixture(100, 'warmup');
  const measurements = { small: [], large: [] };
  for (let iteration = 0; iteration < 3; iteration++) {
    measurements.small.push(loadFixture(1000, iteration));
    measurements.large.push(loadFixture(10000, iteration));
  }
  const median = values => [ ...values ].sort((a, b) => a - b)[1];
  const ratio = median(measurements.large) /
    Math.max(1, median(measurements.small));
  console.log(JSON.stringify({ measurements, ratio }));
  // Ten times as many rows may pay three times the linear multiplier.
  // Reintroducing a duplicate-key insertion scan makes this grow about 100x.
  assert.ok(ratio < 30,
    `Repeated scalar dependencies must avoid quadratic construction: ${ratio}`);
  console.log('PASS shared-scalar-dependency-registration-scales-with-rows');
} finally {
  rmlui.shutdown();
  window.close();
}
