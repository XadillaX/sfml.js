'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

if (![ 'darwin', 'linux' ].includes(process.platform)) {
  console.log('SKIP runtime input probe: host build unavailable');
} else {
  const packageRoot = path.resolve(__dirname, '../..');
  const output = path.join(os.tmpdir(), 'sfmljs-rmlui-runtime-input');
  fs.mkdirSync(output, { recursive: true });
  const build = spawnSync('python3', [
    path.join(packageRoot, 'test/native/platform/build-runtime-input.py'),
    output,
  ], { cwd: packageRoot, encoding: 'utf8', timeout: 90000 });
  assert.equal(build.error, undefined);
  assert.equal(build.status, 0, build.stdout + build.stderr);

  const sf = require('sfml.js');
  const rmlui = require('../../dist');
  require('../../build/Release/rmlui.node')._promoteNativeSymbols();
  const probe = require(path.join(output, 'runtime-input-contracts.node'));
  const window = new sf.RenderWindow(
    new sf.VideoMode(new sf.Vector2u(160, 120)), 'Runtime input contracts');
  window.visible = false;
  try {
    assert(rmlui.initialise(window, { highDpi: false }));
    const context = rmlui.createContext('runtime-input', 160, 120);
    assert.deepEqual(probe.inspect(), { depth: 0, canInvoke: false });
    const order = [];
    probe.enqueue(() => {
      assert.deepEqual(probe.inspect(), { depth: 1, canInvoke: true });
      order.push('first');
      probe.poll();
      assert.deepEqual(order, [ 'first' ]);
    });
    probe.enqueue(() => {
      order.push('second');
    });
    probe.poll();
    assert.deepEqual(order, [ 'first', 'second' ]);
    assert.deepEqual(probe.inspect(), { depth: 0, canInvoke: false });
    console.log('PASS guarded input owns its runtime and prevents nested poll');

    const error = new Error('first input callback failure');
    probe.enqueue(() => {
      throw error;
    });
    probe.enqueue(() => {
      order.push('after-exception');
    });
    assert.throws(() => probe.poll(), caught => caught === error);
    assert.deepEqual(order, [ 'first', 'second' ]);
    assert.deepEqual(probe.inspect(), { depth: 0, canInvoke: false });
    probe.poll();
    assert.equal(order.at(-1), 'after-exception');
    console.log('PASS input exceptions preserve identity and stop later input');

    const document = context.loadDocumentFromMemory(
      '<rml><body><input id="input"/></body></rml>');
    document.show();
    context.update();
    const input = document.getElementById('input');
    input.focus();
    probe.enqueue(() => {
      order.push('after-rejection');
    });
    input.addEventListener('keydown', () => {
      assert.throws(() => probe.poll(), /mutation.*callback/i);
      assert.equal(order.at(-1), 'after-exception');
    });
    context.processKeyDown(rmlui.KeyIdentifier.KI_A);
    probe.poll();
    assert.equal(order.at(-1), 'after-rejection');
    console.log('PASS callback rejection retains its original input delivery');

    const exitError = new Error('input ownership refresh failed');
    let destroyedInputs = 0;
    const handler = new rmlui.TextInputHandler({
      onDestroy() {
        ++destroyedInputs;
        throw exitError;
      },
    });
    const retiringContext = rmlui.createContext(
      'input-retirement', 160, 120, null, handler);
    const retiringDocument = retiringContext.loadDocumentFromMemory(
      '<rml><body><input id="retiring"/></body></rml>');
    retiringDocument.show();
    retiringContext.update();
    retiringDocument.getElementById('retiring').focus();
    probe.enqueue(() => {
      retiringDocument.innerRML = '<div/>';
    });
    probe.enqueue(() => {
      order.push('after-runtime-exit');
    });
    let exitFailure;
    try {
      probe.poll();
    } catch (caught) {
      exitFailure = caught;
    }
    assert.equal(destroyedInputs, 1);
    assert.equal(exitFailure, exitError);
    assert.notEqual(order.at(-1), 'after-runtime-exit');
    probe.poll();
    assert.equal(order.at(-1), 'after-runtime-exit');
    console.log('PASS runtime exit exceptions stop the next native delivery');

    rmlui.shutdown();
    const metrics = {
      size: 20, ascent: 15, descent: 5, lineSpacing: 20, xHeight: 10,
      underlinePosition: 2, underlineThickness: 1, hasEllipsis: true,
    };
    let face;
    let verifyReceiver = false;
    let rejectFont = false;
    let measurements = 0;
    let editingDocument;
    const fontError = new Error('input layout font callback failed');
    const engine = new rmlui.FontEngineInterface({
      initialize() {
        face = engine.createFontFace(metrics);
      },
      getFontFaceHandle() {
        return face.handle;
      },
      measureStrings(handle, packed, count) {
        ++measurements;
        assert.equal(handle, face.handle);
        if (verifyReceiver) {
          assert.ok(probe.receiverCount() >= 1);
          assert.deepEqual(probe.inspect(), { depth: 1, canInvoke: true });
          assert.throws(() => {
            editingDocument.innerRML = '<div/>';
          }, /mutation.*callback|active native subtree/i);
        }
        if (rejectFont) {
          throw fontError;
        }
        for (let i = 0; i < count; ++i) {
          packed.widths[i] = (packed.offsets[i + 1] - packed.offsets[i]) * 7;
        }
      },
    });
    rmlui.setFontEngineInterface(engine);
    assert(rmlui.initialise(window, { highDpi: false }));
    const editingContext = rmlui.createContext('input-layout', 160, 120);
    editingDocument = editingContext.loadDocumentFromMemory(
      '<rml><head><style>textarea{width:120px;height:80px;' +
      'font-family:custom;font-size:20px;}</style></head>' +
      '<body><textarea id="edit">old</textarea></body></rml>');
    editingDocument.show();
    editingContext.update();
    const editable = editingDocument.getElementById('edit');
    editable.focus();
    probe.enableEdits(editingContext.handle);
    verifyReceiver = true;
    const before = measurements;
    probe.enqueueEdit('WiWi\niiiiWW');
    probe.poll();
    assert.ok(measurements > before);
    assert.equal(editable.getValue(), 'WiWi\niiiiWWold');
    assert.equal(probe.receiverCount(), 0);
    console.log('PASS synchronous input layout protects its actual receiver');

    rejectFont = true;
    const failureStart = measurements;
    probe.enqueueEdit('new\ntext');
    probe.enqueue(() => {
      order.push('after-font-error');
    });
    assert.throws(() => probe.poll(), caught => caught === fontError);
    assert.equal(measurements, failureStart + 1);
    assert.equal(probe.receiverCount(), 0);
    assert.notEqual(order.at(-1), 'after-font-error');
    rejectFont = false;
    verifyReceiver = false;
    probe.poll();
    assert.equal(order.at(-1), 'after-font-error');
    probe.resetEdits();
    console.log(
      'PASS layout font failure stops callbacks and retains input order');
  } finally {
    probe.resetEdits();
    rmlui.shutdown();
    window.close();
  }
}
