'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function documentFor(rmlui, context, value = 'A😀中B') {
  const document = context.loadDocumentFromMemory('<rml><head><style>' +
    'body{font-family:LatoLatin;font-size:16px;}' +
    'input,textarea{width:120px;height:30px;}</style></head><body>' +
    `<input id="a" value="${value}"/><textarea id="b">second</textarea>` +
    '</body></rml>');
  document.show();
  context.update();
  return document;
}

const cases = {
  'native-lifecycle-journal-and-canonical-context':
    ({ rmlui, context }) => {
      const handler = new rmlui.TextInputHandler();
      rmlui.setTextInputHandler(handler);
      assert.equal(rmlui.getTextInputHandler(), handler);
      const inputContext = rmlui.createContext('journal', 160, 120);
      assert.equal(inputContext.getTextInputHandler(), handler);
      const document = documentFor(rmlui, inputContext);
      const input = document.getElementById('a');
      input.focus();
      input.blur();
      input.focus();
      const batch = handler.drainEvents();
      assert.ok(batch.kinds instanceof Uint32Array);
      assert.deepEqual(Array.from(batch.kinds), [ 0, 1, 0 ]);
      assert.equal(batch.contexts[0], batch.contexts[1]);
      assert.equal(batch.contexts[1], batch.contexts[2]);
      const editing = batch.contexts[0];
      assert.ok(editing instanceof rmlui.TextInputContext);
      assert.equal(editing.isValid, true);
      inputContext.remove();
      const removed = handler.drainEvents();
      assert.equal(removed.kinds.at(-1), 2);
      assert.equal(removed.contexts.at(-1), editing);
      assert.equal(editing.isValid, false);
      assert.throws(() => editing.getSelectionRange(), /valid/i);
      assert.equal(context.getTextInputHandler().isValid, true);
    },

  'native-unicode-editing-selection-and-composition':
    ({ rmlui }) => {
      const handler = new rmlui.TextInputHandler();
      const context = rmlui.createContext('editing', 160, 120, null, handler);
      const document = documentFor(rmlui, context);
      const input = document.getElementById('a');
      input.focus();
      const editing = handler.drainEvents().contexts[0];
      editing.setSelectionRange(1, 3);
      assert.deepEqual(editing.getSelectionRange(), { start: 1, end: 3 });
      editing.setCursorPosition(2);
      assert.deepEqual(editing.getSelectionRange(), { start: 2, end: 2 });
      editing.setText('界', 1, 3);
      assert.equal(input.getValue(), 'A界B');
      editing.setCompositionRange(1, 2);
      editing.commitComposition('😀');
      assert.equal(input.getValue(), 'A😀B');
      editing.setCompositionRange(0, 0);
      editing.commitComposition('ignored');
      assert.equal(input.getValue(), 'A😀B');
      input.setAttribute('maxlength', 3);
      editing.setText('unrestricted', 0, 3);
      assert.equal(input.getValue(), 'unrestricted');
      const bounds = editing.getBoundingBox();
      assert.ok(bounds && bounds.width > 0 && bounds.height > 0);
      assert.throws(() => editing.setText('x', 3, 1), /range/i);
      assert.throws(() => editing.setCursorPosition(-1), /int32/i);
      assert.throws(() => editing.setSelectionRange(0.5, 1), /int32/i);
      assert.throws(() => editing.commitComposition({}), /string/i);
      assert.throws(() => new rmlui.TextInputContext(), /construct/i);
      input.blur();
      assert.equal(editing.isValid, true);
    },

  'explicit-immediate-callback-order-and-safe-reentry':
    ({ rmlui }) => {
      const calls = [];
      let editing;
      const handler = new rmlui.TextInputHandler({
        onActivate(input) {
          calls.push('activate');
          editing = input;
          input.setText('native callback', 0, 4);
          assert.throws(() => rmlui.shutdown(), /callback/i);
        },
        onDeactivate(input) {
          calls.push('deactivate');
          assert.equal(input, editing);
        },
        onDestroy(input) {
          calls.push('destroy');
          assert.equal(input, editing);
          assert.equal(input.isValid, false);
        },
      });
      const context = rmlui.createContext('immediate', 160, 120, null, handler);
      const document = documentFor(rmlui, context, 'test');
      const input = document.getElementById('a');
      input.focus();
      assert.equal(input.getValue(), 'native callback');
      assert.deepEqual(calls, [ 'activate' ]);
      input.blur();
      assert.deepEqual(calls, [ 'activate', 'deactivate' ]);
      context.remove();
      assert.deepEqual(calls, [ 'activate', 'deactivate', 'destroy' ]);
    },

  'replacement-preserves-captured-handler-and-runtime-invalidates':
    ({ rmlui, window }) => {
      const old = new rmlui.TextInputHandler();
      rmlui.setTextInputHandler(old);
      const first = rmlui.createContext('first', 160, 120);
      const next = new rmlui.TextInputHandler();
      rmlui.setTextInputHandler(next);
      const second = rmlui.createContext('second', 160, 120);
      assert.equal(first.getTextInputHandler(), old);
      assert.equal(second.getTextInputHandler(), next);
      const document = documentFor(rmlui, first);
      document.getElementById('a').focus();
      const editing = old.drainEvents().contexts[0];
      assert.equal(next.drainEvents().kinds.length, 0);
      first.remove();
      assert.equal(old.drainEvents().kinds.at(-1), 2);
      rmlui.shutdown();
      assert.equal(editing.isValid, false);
      assert.throws(() => old.drainEvents(), /initial|valid/i);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.notEqual(rmlui.getTextInputHandler(), old);
      assert.throws(() => rmlui.setTextInputHandler(old), /valid/i);
    },

  'type-replacement-invalidates-old-context-with-new-identity':
    ({ rmlui }) => {
      const handler = new rmlui.TextInputHandler();
      const context = rmlui.createContext('types', 160, 120, null, handler);
      const document = documentFor(rmlui, context);
      const input = document.getElementById('a');
      input.focus();
      const first = handler.drainEvents().contexts[0];
      input.setAttribute('type', 'checkbox');
      context.update();
      assert.equal(first.isValid, false);
      assert.equal(handler.drainEvents().kinds.at(-1), 2);
      input.setAttribute('type', 'text');
      input.blur();
      input.focus();
      const second = handler.drainEvents().contexts.at(-1);
      assert.ok(second.isValid);
      assert.notEqual(first, second);
    },

  'owned-context-callback-cycle-collects':
    async ({ rmlui, context }) => {
      let weak;
      (() => {
        let candidate;
        const handler = new rmlui.TextInputHandler({
          onActivate() {
            return candidate;
          },
        });
        candidate = new rmlui.Context('cycle',
          context.getRenderManager(), handler);
        weak = new WeakRef(candidate);
        const document = documentFor(rmlui, candidate);
        document.getElementById('a').focus();
        handler.drainEvents();
      })();
      await collect();
      assert.equal(weak.deref(), undefined);
    },

  'default-journal-and-unchanged-ownership-have-measured-crossings':
    ({ rmlui }) => {
      const native = require('../../build/Release/rmlui.node');
      const handler = new rmlui.TextInputHandler();
      const context = rmlui.createContext('counts', 160, 120, null, handler);
      const document = documentFor(rmlui, context);
      const input = document.getElementById('a');
      input.focus();
      const editing = handler.drainEvents().contexts[0];
      native.beginDataDiagnostics(false);
      for (let i = 0; i < 100; ++i) {
        input.blur();
        input.focus();
      }
      let counts = native.endDataDiagnostics();
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.runtimeEntries, 200);
      native.beginDataDiagnostics(false);
      const batch = handler.drainEvents();
      counts = native.endDataDiagnostics();
      assert.equal(batch.kinds.length, 200);
      assert.equal(counts.runtimeEntries, 1);
      assert.equal(counts.nativeCallbacks, 0);
      assert.ok(batch.contexts.every(entry => entry === editing));
      native.beginDataDiagnostics(false);
      for (let i = 0; i < 100; ++i) {
        assert.ok(editing.isValid);
      }
      counts = native.endDataDiagnostics();
      assert.equal(counts.callbackLeaseVisits.textInput, 0);
      assert.equal(counts.callbackOwnershipPasses.textInput, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
    },

  'registered-handler-survives-facade-gc-before-widget-creation':
    async ({ rmlui }) => {
      let calls = 0;
      let context;
      (() => {
        const handler = new rmlui.TextInputHandler({
          onActivate() {
            ++calls;
          },
        });
        context = rmlui.createContext('retained', 160, 120, null, handler);
      })();
      await collect();
      const document = documentFor(rmlui, context);
      document.getElementById('a').focus();
      assert.equal(calls, 1);
      assert.equal(context.getTextInputHandler().isValid, true);
    },

  'callback-error-propagates-and-next-input-remains-usable':
    ({ rmlui }) => {
      let first = true;
      const handler = new rmlui.TextInputHandler({
        onActivate() {
          if (first) {
            first = false;
            throw new Error('text-input-callback-probe');
          }
        },
      });
      const context = rmlui.createContext('errors', 160, 120, null, handler);
      const document = documentFor(rmlui, context);
      const input = document.getElementById('a');
      assert.throws(() => input.focus(), /text-input-callback-probe/);
      input.blur();
      assert.doesNotThrow(() => input.focus());
      assert.ok(handler.drainEvents().contexts.at(-1).isValid);
      assert.throws(() => new rmlui.TextInputHandler({
        onActivate: 19,
      }), /callback/i);
      assert.throws(() => rmlui.setTextInputHandler({}), /TextInputHandler/);
    },

  'composition-replacement-applies-maxlength-to-remaining-text':
    ({ rmlui }) => {
      const handler = new rmlui.TextInputHandler();
      const context = rmlui.createContext('maxlength', 160, 120, null, handler);
      const document = documentFor(rmlui, context, 'AB');
      const input = document.getElementById('a');
      input.setAttribute('maxlength', 3);
      input.focus();
      const editing = handler.drainEvents().contexts[0];
      editing.setCompositionRange(1, 2);
      editing.commitComposition('XYZ');
      assert.equal(input.getValue(), 'AXY');
      editing.setText('A😀B', 0, 3);
      editing.setCompositionRange(1, 2);
      editing.commitComposition('界🌙');
      assert.equal(input.getValue(), 'A界B');
    },

  'transferred-widget-retains-original-destroy-handler':
    async ({ rmlui }) => {
      const original = new rmlui.TextInputHandler();
      const current = new rmlui.TextInputHandler();
      const first = rmlui.createContext('source', 160, 120, null, original);
      const second = rmlui.createContext('target', 160, 120, null, current);
      const source = documentFor(rmlui, first);
      const target = documentFor(rmlui, second);
      const input = source.getElementById('a');
      input.focus();
      input.blur();
      const editing = original.drainEvents().contexts[0];
      source.removeChild(input);
      target.appendChild(input);
      first.remove();
      await collect();
      second.update();
      input.focus();
      const active = current.drainEvents();
      assert.deepEqual(Array.from(active.kinds), [ 0 ]);
      assert.equal(active.contexts[0], editing);
      second.remove();
      const destroyed = original.drainEvents();
      assert.deepEqual(Array.from(destroyed.kinds), [ 2 ]);
      assert.equal(destroyed.contexts[0], editing);
      assert.equal(editing.isValid, false);
      assert.ok(Array.from(current.drainEvents().kinds)
        .every(kind => kind !== 2));
    },

  'transformed-detached-input-reports-failed-bounds-projection':
    ({ rmlui }) => {
      const handler = new rmlui.TextInputHandler();
      const context = rmlui.createContext('bounds', 160, 120, null, handler);
      const document = documentFor(rmlui, context);
      const input = document.getElementById('a');
      input.setProperty('transform', 'translate(10px, 5px)');
      context.update();
      context.render();
      input.focus();
      const editing = handler.drainEvents().contexts[0];
      assert.ok(editing.getBoundingBox());
      input.blur();
      document.removeChild(input);
      assert.equal(editing.getBoundingBox(), null);
      assert.equal(editing.isValid, true);
    },

  'explicit-shutdown-delivers-destroy-after-native-invalidation':
    ({ rmlui }) => {
      const calls = [];
      let editing;
      const handler = new rmlui.TextInputHandler({
        onActivate(input) {
          editing = input;
        },
        onDestroy(input) {
          assert.equal(input, editing);
          assert.equal(input.isValid, false);
          calls.push('destroy');
        },
      });
      const context = rmlui.createContext('shutdown', 160, 120, null, handler);
      documentFor(rmlui, context).getElementById('a').focus();
      rmlui.shutdown();
      assert.deepEqual(calls, [ 'destroy' ]);
    },

  'environment-cleanup-does-not-dispatch-destroy-js':
    ({ rmlui }) => {
      const handler = new rmlui.TextInputHandler({
        onDestroy() {
          console.log('unexpected-text-input-cleanup-callback');
        },
      });
      const context = rmlui.createContext('cleanup', 160, 120, null, handler);
      documentFor(rmlui, context).getElementById('a').focus();
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Text input contracts');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    const context = rmlui.createContext('base', 160, 120);
    await cases[name]({ rmlui, window, context });
  } finally {
    if (name === 'environment-cleanup-does-not-dispatch-destroy-js') {
      // Keep the real SFML surface alive until the native environment hook.
      global.textInputCleanupWindow = window;
    } else {
      rmlui.shutdown();
      window.close();
    }
  }
}

if (process.argv[2]) {
  run(process.argv[2]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ], {
        encoding: 'utf8', timeout: 20000,
      });
    if (result.status !== 0 ||
        result.stdout.includes('unexpected-text-input-cleanup-callback')) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} text input failures`);
}
