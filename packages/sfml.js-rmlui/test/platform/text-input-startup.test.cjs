'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { Worker } = require('node:worker_threads');

const nativePath = path.resolve(__dirname, '../../build/Release/rmlui.node');
const packagePath = path.resolve(__dirname, '../../dist');

function createWindow() {
  const sfml = require('sfml.js');
  return new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Input startup contracts');
}

async function workerResult(source) {
  const worker = new Worker(source, {
    eval: true, workerData: { nativePath, packagePath },
  });
  const messages = [];
  worker.on('message', message => messages.push(message));
  await new Promise((resolve, reject) => {
    worker.once('error', reject);
    worker.once('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`worker exit ${code}`));
      }
    });
  });
  return messages;
}

const cases = {
  'getter-and-null-selection-before-initialise': ({ rmlui }) => {
    assert.equal(rmlui.getTextInputHandler(), null);
    rmlui.setTextInputHandler(null);
    assert.equal(rmlui.getTextInputHandler(), null);
    rmlui.shutdown();
    assert.equal(rmlui.getTextInputHandler(), null);
  },

  'pending-handler-adopted-and-callback-retained': async ({ rmlui }) => {
    let activations = 0;
    (() => {
      const handler = new rmlui.TextInputHandler({
        onActivate() {
          ++activations;
        },
      });
      assert.equal(handler.isValid, true);
      assert.equal(handler.drainEvents().kinds.length, 0);
      rmlui.setTextInputHandler(handler);
      assert.equal(rmlui.getTextInputHandler(), handler);
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    const window = createWindow();
    try {
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const handler = rmlui.getTextInputHandler();
      const context = rmlui.createContext('pending', 160, 120);
      assert.equal(context.getTextInputHandler(), handler);
      assert.ok(handler.isValid);
      assert.ok(rmlui.loadFontFace(path.join(__dirname,
        '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
      const document = context.loadDocumentFromMemory(
        '<rml><head><style>body{font-family:LatoLatin}</style></head>' +
        '<body><input id="input"/></body></rml>');
      document.show();
      context.update();
      document.getElementById('input').focus();
      assert.equal(activations, 1);
      assert.deepEqual(Array.from(handler.drainEvents().kinds), [ 0 ]);
    } finally {
      rmlui.shutdown();
      window.close();
    }
  },

  'setup-shutdown-invalidates-uninstalled-and-selected-handlers':
    ({ rmlui }) => {
      const selected = new rmlui.TextInputHandler();
      const unused = new rmlui.TextInputHandler();
      rmlui.setTextInputHandler(selected);
      rmlui.shutdown();
      assert.equal(rmlui.getTextInputHandler(), null);
      for (const handler of [ selected, unused ]) {
        assert.throws(() => handler.isValid, /valid/i);
        assert.throws(() => rmlui.setTextInputHandler(handler), /valid/i);
      }
      const next = new rmlui.TextInputHandler();
      assert.ok(next.isValid);
      rmlui.setTextInputHandler(next);
      assert.equal(rmlui.getTextInputHandler(), next);
    },

  'rejected-initialise-preserves-pending-selection': ({ rmlui }) => {
    const handler = new rmlui.TextInputHandler();
    rmlui.setTextInputHandler(handler);
    assert.throws(() => rmlui.initialise({}), /RenderWindow/i);
    assert.equal(rmlui.getTextInputHandler(), handler);
    assert.ok(handler.isValid);
    const window = createWindow();
    try {
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.equal(rmlui.getTextInputHandler(), handler);
    } finally {
      rmlui.shutdown();
      window.close();
    }
  },

  'preinit-null-selects-default-and-live-null-disables-selection':
    ({ rmlui }) => {
      rmlui.setTextInputHandler(null);
      const window = createWindow();
      try {
        assert.ok(rmlui.initialise(window, { highDpi: false }));
        const fallback = rmlui.getTextInputHandler();
        assert.ok(fallback.isValid);
        rmlui.setTextInputHandler(null);
        assert.equal(rmlui.getTextInputHandler(), null);
        const context = rmlui.createContext('disabled', 160, 120);
        assert.equal(context.getTextInputHandler(), null);
        context.loadDocumentFromMemory('<rml><body><input/></body></rml>');
        context.remove();
        rmlui.shutdown();
        assert.throws(() => fallback.isValid, /valid/i);
        assert.ok(rmlui.initialise(window, { highDpi: false }));
        assert.ok(rmlui.getTextInputHandler().isValid);
      } finally {
        rmlui.shutdown();
        window.close();
      }
    },

  'foreign-worker-cannot-touch-pending-owner': async ({ rmlui }) => {
    const handler = new rmlui.TextInputHandler();
    rmlui.setTextInputHandler(handler);
    const messages = await workerResult(`
      const assert = require('node:assert/strict');
      const { parentPort, workerData } = require('node:worker_threads');
      const native = require(workerData.nativePath);
      for (const [name, args] of [
        ['createTextInputHandler', []],
        ['getTextInputHandler', []],
        ['setTextInputHandler', [null]],
        ['shutdown', []],
      ]) {
        assert.throws(() => native[name](...args),
          /owning.*(environment|thread)/i, name);
      }
      parentPort.postMessage('pending owner protected');
    `);
    assert.deepEqual(messages, [ 'pending owner protected' ]);
    assert.equal(rmlui.getTextInputHandler(), handler);
  },

  'worker-setup-cleanup-releases-owner-without-initialise':
    async ({ rmlui }) => {
      const messages = await workerResult(`
        const assert = require('node:assert/strict');
        const { parentPort, workerData } = require('node:worker_threads');
        const rmlui = require(workerData.packagePath);
        const handler = new rmlui.TextInputHandler({
          onDestroy() { throw new Error('unexpected startup destroy'); },
        });
        rmlui.setTextInputHandler(handler);
        assert.ok(handler.isValid);
        parentPort.postMessage('setup complete');
      `);
      assert.deepEqual(messages, [ 'setup complete' ]);
      assert.equal(rmlui.getTextInputHandler(), null);
      const handler = new rmlui.TextInputHandler();
      assert.ok(handler.isValid);
      rmlui.setTextInputHandler(handler);
    },

  'natural-pending-cleanup-never-dispatches-js': ({ rmlui }) => {
    rmlui.setTextInputHandler(new rmlui.TextInputHandler({
      onDestroy() {
        console.log('unexpected-startup-cleanup-callback');
      },
    }));
  },
};

async function run(name) {
  const rmlui = require('../../dist');
  try {
    await cases[name]({ rmlui });
  } finally {
    if (name !== 'natural-pending-cleanup-never-dispatches-js') {
      rmlui.shutdown();
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
        result.stdout.includes('unexpected-startup-cleanup-callback')) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} input startup failures`);
}
