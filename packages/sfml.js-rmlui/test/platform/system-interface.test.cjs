'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { Worker } = require('node:worker_threads');
const { runWithPreservedClipboard } =
  require('../../tools/testing/preserve-clipboard.cjs');

function createWindow() {
  const sfml = require('sfml.js');
  return new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'System contracts');
}

const cases = {
  'native-default-clipboard-writes-utf8': ({ rmlui, window }) => {
    const { Clipboard } = require('sfml.js');
    const original = Clipboard.getString();
    const system = new rmlui.SystemInterface(window);

    try {
      system.setClipboardText('ASCII clipboard control');
      assert.equal(Clipboard.getString(), 'ASCII clipboard control');

      system.setClipboardText('日本語 λ é 😀');
      assert.equal(Clipboard.getString(), '日本語 λ é 😀');

      system.setClipboardText('');
      assert.equal(Clipboard.getString(), '');
    } finally {
      Clipboard.setString(original);
    }
  },

  'native-default-clipboard-reads-utf8': ({ rmlui, window }) => {
    const { Clipboard } = require('sfml.js');
    const original = Clipboard.getString();
    const system = new rmlui.SystemInterface(window);

    try {
      Clipboard.setString('ASCII clipboard control');
      assert.equal(system.getClipboardText(), 'ASCII clipboard control');

      Clipboard.setString('日本語 λ é 😀');
      assert.equal(system.getClipboardText(), '日本語 λ é 😀');

      Clipboard.setString('');
      assert.equal(system.getClipboardText(), '');
    } finally {
      Clipboard.setString(original);
    }
  },

  'pending-selection-and-native-default': ({ rmlui, window }) => {
    assert.equal(rmlui.getSystemInterface(), null);
    const system = new rmlui.SystemInterface(window);
    rmlui.setSystemInterface(system);
    assert.equal(rmlui.getSystemInterface(), system);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.equal(rmlui.getSystemInterface(), system);
    assert.ok(system.getElapsedTime() >= 0);
    assert.deepEqual(system.translateString('plain'), {
      value: 'plain', translations: 0,
    });
    assert.equal(system.joinPath('assets/document.rml', 'a.png'),
      'assets/a.png');
    assert.throws(() => rmlui.setSystemInterface(null), /before|initial/i);
    assert.throws(() => rmlui.setSystemInterface(system), /before|initial/i);
  },

  'default-identity-and-shutdown': ({ rmlui, window }) => {
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const system = rmlui.getSystemInterface();
    assert.ok(system instanceof rmlui.SystemInterface);
    assert.equal(rmlui.getSystemInterface(), system);
    const clock = system.clock;
    clock[0] = 5;
    assert.equal(system.getElapsedTime(), 5);
    rmlui.shutdown();
    assert.equal(rmlui.getSystemInterface(), null);
    assert.ok(Number.isNaN(clock[0]));
    assert.throws(() => system.getElapsedTime(), /valid/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.notEqual(rmlui.getSystemInterface(), system);
  },

  'setup-replacement-rejection-and-invalidation': ({ rmlui, window }) => {
    const first = new rmlui.SystemInterface(window);
    const second = new rmlui.SystemInterface(window);
    rmlui.setSystemInterface(first);
    rmlui.setSystemInterface(second);
    assert.equal(rmlui.getSystemInterface(), second);
    assert.throws(() => rmlui.initialise({}), /RenderWindow/);
    assert.equal(rmlui.getSystemInterface(), second);
    rmlui.setSystemInterface(null);
    assert.equal(rmlui.getSystemInterface(), null);
    rmlui.shutdown();
    for (const system of [ first, second ]) {
      assert.throws(() => rmlui.setSystemInterface(system), /valid/i);
      assert.throws(() => system.translateString('x'), /valid/i);
    }
  },

  'all-eight-host-hooks-use-native-virtuals': ({ rmlui, window }) => {
    const calls = [];
    const callbacks = {
      translateString(input) {
        assert.equal(this, callbacks);
        calls.push([ 'translate', input ]);
        return { value: `translated ${input}`, translations: 2 };
      },
      joinPath(document, resource) {
        calls.push([ 'join', document, resource ]);
        return `joined/${resource}`;
      },
      logMessage(type, message) {
        calls.push([ 'log', type, message ]);
        return true;
      },
      setMouseCursor(cursor) {
        calls.push([ 'cursor', cursor ]);
      },
      setClipboardText(text) {
        calls.push([ 'setClipboard', text ]);
      },
      getClipboardText() {
        return 'copied 日本語';
      },
      activateKeyboard(caret, height) {
        calls.push([ 'activate', caret, height ]);
      },
      deactivateKeyboard() {
        calls.push([ 'deactivate' ]);
      },
    };
    const system = new rmlui.SystemInterface(window, callbacks);
    rmlui.setSystemInterface(system);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    calls.length = 0;
    assert.deepEqual(system.translateString('abc'),
      { value: 'translated abc', translations: 2 });
    assert.equal(system.joinPath('a.rml', 'b.rcss'), 'joined/b.rcss');
    assert.equal(system.logMessage(rmlui.LogType.Info, 'info'), true);
    system.setMouseCursor('pointer');
    system.setClipboardText('Unicode λ');
    assert.equal(system.getClipboardText(), 'copied 日本語');
    system.activateKeyboard({ x: 2, y: 3 }, 16);
    system.deactivateKeyboard();
    assert.deepEqual(calls, [
      [ 'translate', 'abc' ], [ 'join', 'a.rml', 'b.rcss' ],
      [ 'log', rmlui.LogType.Info, 'info' ], [ 'cursor', 'pointer' ],
      [ 'setClipboard', 'Unicode λ' ],
      [ 'activate', { x: 2, y: 3 }, 16 ], [ 'deactivate' ],
    ]);
  },

  'native-document-translation-and-resource-path': ({ rmlui, window }) => {
    const calls = [];
    const system = new rmlui.SystemInterface(window, {
      translateString(input) {
        calls.push([ 'text', input ]);
        return { value: input.replace('TOKEN', '日本語'), translations: 1 };
      },
      joinPath(document, resource) {
        calls.push([ 'path', document, resource ]);
        return resource;
      },
    });
    rmlui.setSystemInterface(system);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const context = rmlui.createContext('virtuals', 160, 120);
    const document = context.loadDocumentFromMemory(
      '<rml><head><link type="text/rcss" href="missing.rcss"/></head>' +
      '<body><div id="text">TOKEN</div></body></rml>', 'source/document.rml');
    assert.ok(document);
    assert.ok(document.getElementById('text').innerRML.includes('日本語'));
    assert.ok(calls.some(row => row[0] === 'text' && row[1] === 'TOKEN'));
    assert.ok(calls.some(row => row[0] === 'path' &&
      row[2] === 'missing.rcss'));
  },

  'shared-clock-has-no-frame-callbacks-or-owner-scans':
    ({ rmlui, window }) => {
      const system = new rmlui.SystemInterface(window);
      rmlui.setSystemInterface(system);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const context = rmlui.createContext('clock', 160, 120);
      const document = context.loadDocumentFromMemory(
        '<rml><body><div id="animated" style="width:10px;height:10px"/>' +
        '</body></rml>');
      document.show();
      system.clock[0] = 0;
      const animated = document.getElementById('animated');
      assert.ok(animated.animate('width',
        new rmlui.Property(70, rmlui.Unit.PX), 60));
      context.update();
      const { native } = require('../../dist/internal/native');
      native.beginDataDiagnostics();
      for (let frame = 0; frame < 32; ++frame) {
        system.clock[0] = frame / 60;
        context.update();
      }
      const diagnostics = native.endDataDiagnostics();
      assert.equal(diagnostics.nativeCallbacks, 0);
      assert.equal(diagnostics.callbackSnapshotVisits, 0);
      assert.equal(diagnostics.elementOwnershipVisits, 0);
      assert.equal(system.getElapsedTime(), 31 / 60);
      assert.ok(Math.abs(animated.getProperty('width').value -
        (10 + 31 / 60)) < 0.001);
      system.clock[0] = Infinity;
      assert.throws(() => context.update(), /clock|finite/i);
      system.clock[0] = NaN;
      assert.ok(system.getElapsedTime() >= 0);
    },

  'event-clock-reads-preserve-provider-reentry-guards': ({ rmlui, window }) => {
    const system = new rmlui.SystemInterface(window, {
      translateString(input) {
        assert.throws(() => rmlui.getSystemInterface(), /callback/i);
        assert.throws(() => system.getElapsedTime(), /callback/i);
        return { value: input, translations: 0 };
      },
    });
    rmlui.setSystemInterface(system);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    system.clock[0] = 3.75;
    const context = rmlui.createContext('event-clock', 160, 120);
    const document = context.loadDocumentFromMemory(
      '<rml><body><button id="clock"/></body></rml>');
    const button = document.getElementById('clock');
    let events = 0;
    button.addEventListener('click', () => {
      events++;
      assert.equal(rmlui.getSystemInterface(), system);
      assert.equal(system.getElapsedTime(), 3.75);
      const { native } = require('../../dist/internal/native');
      const handle = native.getSystemInterface();
      assert.equal(native.getSystemClock(handle)[0], 3.75);
      assert.throws(() => rmlui.setSystemInterface(null), /callback/i);
      assert.throws(() => rmlui.shutdown(), /callback/i);
    });
    button.click();
    assert.equal(events, 1);
    assert.deepEqual(system.translateString('provider-guard'),
      { value: 'provider-guard', translations: 0 });
  },

  'exceptions-invalid-results-and-recursive-mutation':
    ({ rmlui, window }) => {
      const error = new Error('system hook failed');
      const system = new rmlui.SystemInterface(window, {
        translateString(input) {
          if (input === 'throw') {
            throw error;
          }
          if (input === 'bad') {
            return { value: 7, translations: -1 };
          }
          if (input === 'reenter') {
            rmlui.shutdown();
          }
          if (input === 'recursive') {
            return system.translateString('inner');
          }
          return { value: input, translations: 0 };
        },
        getClipboardText() {
          return Promise.resolve('async');
        },
      });
      rmlui.setSystemInterface(system);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => system.translateString('throw'),
        cause => cause === error);
      assert.throws(() => system.translateString('bad'), /translation|value/i);
      for (const input of [ 'reenter', 'recursive' ]) {
        assert.throws(() => system.translateString(input), /callback/i);
      }
      assert.throws(() => system.getClipboardText(), /synchronous/i);
      assert.equal(rmlui.getSystemInterface(), system);
      assert.deepEqual(system.translateString('recovered'),
        { value: 'recovered', translations: 0 });
    },

  'callback-getters-captured-once-and-input-authenticity':
    ({ rmlui, window }) => {
      let reads = 0;
      const system = new rmlui.SystemInterface(window, {
        get translateString() {
          ++reads;
          return input => ({ value: input, translations: 0 });
        },
      });
      assert.equal(reads, 1);
      assert.throws(() => new rmlui.SystemInterface({}, {}), /RenderWindow/i);
      assert.throws(() => new rmlui.SystemInterface(window,
        { logMessage: 1 }), /callback|function/i);
      assert.throws(() => rmlui.setSystemInterface({}), /SystemInterface/i);
      const { native } = require('../../dist/internal/native');
      assert.throws(() => native.systemTranslateString({}, 'x'), /handle/i);
      rmlui.setSystemInterface(system);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      for (const receiver of [{}, Object.create(system) ]) {
        assert.throws(() => rmlui.SystemInterface.prototype
          .getElapsedTime.call(receiver), /SystemInterface/i);
      }
      assert.throws(() => system.logMessage(6, 'x'), /log|type/i);
      assert.throws(() => system.translateString(1), /string/i);
      assert.throws(() => system.activateKeyboard({ x: NaN, y: 0 }, 1),
        /finite/i);
      assert.equal(reads, 1);
    },

  'unselected-cycles-collect-and-selected-callbacks-survive':
    async ({ rmlui, window }) => {
      let weak;
      (() => {
        const system = new rmlui.SystemInterface(window, {
          getClipboardText() {
            return String(system.clock[0]);
          },
        });
        weak = new WeakRef(system);
      })();
      (() => {
        const system = new rmlui.SystemInterface(window, {
          getClipboardText() {
            return 'retained';
          },
        });
        rmlui.setSystemInterface(system);
      })();
      for (let i = 0; i < 12; ++i) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
      assert.equal(weak.deref(), undefined);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.equal(rmlui.getSystemInterface().getClipboardText(), 'retained');
    },

  'retained-clock-and-wrapper-do-not-retain-shutdown-callbacks':
    async ({ rmlui, window }) => {
      let weakCallback;
      let system;
      (() => {
        const callback = () => 'clipboard';
        weakCallback = new WeakRef(callback);
        system = new rmlui.SystemInterface(window, {
          getClipboardText: callback,
        });
        rmlui.setSystemInterface(system);
      })();
      const clock = system.clock;
      rmlui.shutdown();
      for (let i = 0; i < 12; ++i) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
      assert.equal(weakCallback.deref(), undefined);
      assert.ok(Number.isNaN(clock[0]));
      assert.throws(() => system.getClipboardText(), /valid/i);
    },

  'preinit-native-virtuals-and-result-accessor-reentry':
    ({ rmlui, window }) => {
      let reads = 0;
      const system = new rmlui.SystemInterface(window, {
        translateString(input) {
          return {
            get value() {
              ++reads;
              if (input === 'reenter') {
                rmlui.shutdown();
              }
              return input;
            },
            get translations() {
              ++reads;
              return 1;
            },
          };
        },
        logMessage() {
          return false;
        },
      });
      assert.deepEqual(system.translateString('before'),
        { value: 'before', translations: 1 });
      assert.equal(reads, 2);
      assert.throws(() => system.translateString('reenter'), /callback/i);
      assert.equal(system.logMessage(rmlui.LogType.Debug, 'debug'), false);
      rmlui.setSystemInterface(system);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.deepEqual(system.translateString('after'),
        { value: 'after', translations: 1 });
    },

  'foreign-environment-cannot-read-or-replace-pending-interface':
    async ({ rmlui, window }) => {
      const system = new rmlui.SystemInterface(window);
      rmlui.setSystemInterface(system);
      const messages = [];
      const worker = new Worker(`
        const { parentPort, workerData } = require('node:worker_threads');
        const rmlui = require(workerData);
        const results = [];
        for (const operation of [
          () => rmlui.getSystemInterface(),
          () => rmlui.setSystemInterface(null),
          () => rmlui.shutdown(),
        ]) {
          try { operation(); results.push('allowed'); }
          catch (error) { results.push(error.message); }
        }
        parentPort.postMessage(results);
      `, { eval: true, workerData: path.resolve(__dirname, '../../dist') });
      worker.on('message', message => messages.push(message));
      await new Promise((resolve, reject) => {
        worker.once('error', reject);
        worker.once('exit', code => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`worker exited ${code}`));
          }
        });
      });
      assert.equal(messages.length, 1);
      assert.equal(messages[0].length, 3);
      for (const message of messages[0]) {
        assert.match(message, /owning environment/i);
      }
      assert.equal(rmlui.getSystemInterface(), system);
    },
};

async function run(name) {
  const rmlui = require('../../dist');
  const window = createWindow();
  try {
    await cases[name]({ rmlui, window });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.platform === 'darwin' &&
    !process.env.SFML_RMLUI_CLIPBOARD_PRESERVED) {
  process.exitCode = runWithPreservedClipboard(__filename);
} else if (process.argv[2]) {
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
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} system-interface failures`);
}
