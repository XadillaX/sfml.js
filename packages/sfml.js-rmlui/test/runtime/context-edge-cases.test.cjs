'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const cases = {
  'memory-source-url-resolves-relative-styles': ({ rmlui, context }) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-memory-url-'));
    try {
      fs.writeFileSync(path.join(root, 'theme.rcss'),
        '#target { width: 37px; height: 19px; }');
      const source = path.join(root, '水-ui.rml');
      const previous = process.cwd();
      const doc = context.loadDocumentFromMemory(
        '<rml><head><link type="text/rcss" href="theme.rcss"/></head>' +
        '<body><div id="target"/></body></rml>', source);
      assert.equal(doc.sourceURL, source);
      assert.equal(process.cwd(), previous);
      const computed = doc.getElementById('target').getComputedValues();
      assert.equal(computed.width.value, 37);
      assert.equal(computed.height.value, 19);
      doc.close();
      context.update();
      const empty = context.loadDocumentFromMemory(
        '<rml><head/><body/></rml>', '');
      assert.equal(empty.sourceURL, '');
      const unnamed = context.loadDocumentFromMemory(
        '<rml><head/><body/></rml>');
      assert.equal(unnamed.sourceURL, '[document from memory]');
      assert.ok(rmlui.getNumContexts() > 0);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  },

  'memory-source-url-rejects-invalid-values-without-loading': options => {
    const { context } = options;
    let loads = 0;
    context.addEventListener('load', () => loads++, true);
    for (const value of [ null, false, 0, {}, [], 'bad\0.rml' ]) {
      assert.throws(() => context.loadDocumentFromMemory(
        '<rml><body/></rml>', value), /source|url/i);
    }
    assert.equal(context.getNumDocuments(), 0);
    assert.equal(loads, 0);
  },

  'text-overloads-preserve-control-and-unicode-scalars': ({ context }) => {
    const received = [];
    context.addEventListener('textinput', event => {
      received.push(event.parameters.text);
      event.stopPropagation();
    });
    for (const value of [ 0, 9, 10, 65, 127, 128, 0xffff, 0x10ffff ]) {
      assert.equal(context.processTextInput(value), false);
    }
    assert.equal(context.processTextInput('A\0水😀'), false);
    assert.deepEqual(received, [
      '\0', '\t', '\n', 'A', '\x7f', '\x80', '\uffff', '\udbff\udfff',
      'A\0水😀',
    ]);
    for (const value of [ '\ud800', '\udc00', 'A\ud800B',
      -1, 0xdfff, 0x110000 ]) {
      assert.throws(() => context.processTextInput(value), /unicode|text/i);
    }
    assert.equal(received.length, 9);
  },

  'native-char-overload-accepts-ascii-and-ignores-high-bytes': options => {
    const { context } = options;
    const received = [];
    context.addEventListener('textinput', event => {
      received.push(event.parameters.text);
      event.stopPropagation();
    });
    for (let byte = 0; byte < 256; ++byte) {
      assert.equal(context.processTextInputChar(byte), false);
    }
    assert.deepEqual(received, Array.from({ length: 128 },
      (_, byte) => String.fromCharCode(byte)));
    for (const value of [ -1, 256, 1.5, NaN, Infinity,
      'A', null, undefined, true, 65n, {}]) {
      assert.throws(() => context.processTextInputChar(value), /byte|char/i);
    }
    assert.equal(received.length, 128);
    context.remove();
    assert.throws(() => context.processTextInputChar(65), /context|destroy/i);
  },

  'mouse-cursor-switch-validates-boolean-and-context-lifetime': options => {
    const { context } = options;
    const doc = context.loadDocumentFromMemory(
      '<rml><head><style>' +
      'body { width:160px; height:120px; cursor:cross; }' +
      '</style></head><body/></rml>');
    doc.show();
    for (const enabled of [ false, true, true, false ]) {
      assert.equal(context.enableMouseCursor(enabled), undefined);
      context.processMouseMove(10, 10);
      assert.equal(context.update(), true);
      assert.equal(context.render(), true);
    }
    for (const value of [ 0, 1, 'true', null, undefined, {}]) {
      assert.throws(() => context.enableMouseCursor(value), /boolean/i);
    }
    context.remove();
    assert.throws(() => context.enableMouseCursor(true), /context|destroy/i);
  },

  'mouse-cursor-survives-shutdown-and-next-system-generation': options => {
    const { context, rmlui, window } = options;
    const showCursor = (target, cursor) => {
      const doc = target.loadDocumentFromMemory(
        '<rml><head><style>' +
        `body { width:160px; height:120px; cursor:${cursor}; }` +
        '</style></head><body/></rml>');
      doc.show();
      target.processMouseMove(10, 10);
      assert.equal(target.update(), true);
    };
    const toggleCursor = () => {
      window.setMouseCursorVisible(false);
      window.setMouseCursorVisible(true);
      assert.equal(window.isOpen(), true);
    };

    showCursor(context, 'cross');
    rmlui.shutdown();
    toggleCursor();

    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const next = rmlui.createContext('next-cursor-generation', 160, 120);
    showCursor(next, 'text');
    rmlui.shutdown();
    toggleCursor();
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Context edge cases');
  assert.ok(rmlui.initialise(window, { highDpi: false, fileRoot: '/' }));
  try {
    const context = rmlui.createContext('context-edges', 160, 120);
    cases[name]({ rmlui, context, window });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]);
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [ __filename, name ], {
      encoding: 'utf8', timeout: 20000,
    });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} context edge failures`);
}
