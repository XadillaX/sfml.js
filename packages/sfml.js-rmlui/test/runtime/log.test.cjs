'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

const cases = {
  'log-routes-through-selected-native-system-before-and-after-initialisation':
    ({ rmlui, window, messages }) => {
      rmlui.Log.message(rmlui.LogType.Info, '%s:%04d %%', '日本語', 7);
      assert.deepEqual(messages, [[ rmlui.LogType.Info, '日本語:0007 %' ]]);

      assert.equal(rmlui.initialise(window, { highDpi: false }), true);
      assert.deepEqual(messages.slice(1), [
        [ rmlui.LogType.Info, 'SVG plugin initialised.' ],
        [ rmlui.LogType.Info, 'Lottie plugin initialised.' ],
      ]);
      const initializedCount = messages.length;

      rmlui.Log.message(rmlui.LogType.Warning, '%*.*f', 7, 2, 1.25);
      assert.deepEqual(messages.slice(initializedCount), [
        [ rmlui.LogType.Warning, '   1.25' ],
      ]);
    },

  'log-parse-errors-use-native-filename-and-negative-line-rules':
    ({ rmlui, messages }) => {
      rmlui.Log.parseError('panel.rml', 12, 'Invalid %s', 'width');
      rmlui.Log.parseError('日本語.rml', -1, '%s', 'missing');
      rmlui.Log.parseError('zero.rml', 0, 'value %d', 3);
      assert.deepEqual(messages, [
        [ rmlui.LogType.Error, 'panel.rml:12: Invalid width' ],
        [ rmlui.LogType.Error, '日本語.rml: missing' ],
        [ rmlui.LogType.Error, 'zero.rml:0: value 3' ],
      ]);
    },

  'log-keeps-native-byte-truncation-percent-and-nul-semantics':
    ({ rmlui, messages }) => {
      rmlui.Log.message(rmlui.LogType.Debug, '%s', '100% complete');
      rmlui.Log.message(rmlui.LogType.Debug, 'a%cb%s', 0, 'unused tail');
      rmlui.Log.message(rmlui.LogType.Info, '%s', 'x'.repeat(2000));
      rmlui.Log.parseError('f.rml', 9, '%s', 'z'.repeat(2000));
      assert.deepEqual(messages, [
        [ rmlui.LogType.Debug, '100% complete' ],
        [ rmlui.LogType.Debug, 'a' ],
        [ rmlui.LogType.Info, 'x'.repeat(1021) ],
        [ rmlui.LogType.Error, 'f.rml:9: ' + 'z'.repeat(1012) ],
      ]);
    },

  'log-rejects-invalid-input-before-dispatch':
    ({ rmlui, messages }) => {
      for (const type of [ -1, 0.5, NaN, Infinity, 6, '4' ]) {
        assert.throws(() => rmlui.Log.message(type, 'invalid'), /integer/i);
      }
      for (const line of [ 0.5, NaN, 2147483648, -2147483649, '1' ]) {
        assert.throws(() => rmlui.Log.parseError('f.rml', line, 'invalid'),
          /integer/i);
      }
      assert.throws(() => rmlui.Log.parseError({}, 1, 'invalid'), /string/i);
      assert.throws(() => rmlui.Log.message(rmlui.LogType.Info, '%p', 1),
        /specifier/i);
      assert.throws(() => rmlui.Log.message(rmlui.LogType.Info, '%d'),
        /missing/i);
      assert.throws(() => rmlui.Log.message(rmlui.LogType.Info, 'ok', 1),
        /unused/i);
      assert.deepEqual(messages, []);
    },

  'log-callback-exceptions-and-reentry-return-to-the-owning-boundary':
    ({ rmlui, window }) => {
      const failure = new Error('log callback failed');
      const system = new rmlui.SystemInterface(window, {
        logMessage(type, text) {
          if (text === 'throw') {
            throw failure;
          }
          if (text === 'reenter') {
            rmlui.Log.message(type, 'nested');
          }
          return false;
        },
      });
      rmlui.setSystemInterface(system);

      assert.throws(() => rmlui.Log.message(rmlui.LogType.Error, 'throw'),
        error => error === failure);
      assert.throws(() => rmlui.Log.message(rmlui.LogType.Info, 'reenter'),
        /callback/i);
      assert.equal(rmlui.Log.message(rmlui.LogType.Assert, 'continue'),
        undefined);
      assert.equal(rmlui.getSystemInterface(), system);
    },

  'log-foreign-worker-cannot-dispatch-through-the-selected-interface':
    async ({ messages }) => {
      const worker = new Worker(`
        const { parentPort, workerData } = require('node:worker_threads');
        const rmlui = require(workerData);
        const results = [];
        for (const operation of [
          () => rmlui.Log.message(rmlui.LogType.Info, 'foreign'),
          () => rmlui.Log.parseError('f.rml', 1, 'foreign'),
        ]) {
          try { operation(); results.push('allowed'); }
          catch (error) { results.push(error.message); }
        }
        parentPort.postMessage(results);
      `, { eval: true, workerData: path.resolve(__dirname, '../../dist') });

      const result = await new Promise((resolve, reject) => {
        let response;
        worker.once('message', value => {
          response = value;
        });
        worker.once('error', reject);
        worker.once('exit', code => {
          if (code === 0) {
            resolve(response);
          } else {
            reject(new Error(`worker exited ${code}`));
          }
        });
      });
      assert.equal(result.length, 2);
      for (const message of result) {
        assert.match(message, /owning environment/i);
      }
      assert.deepEqual(messages, []);
    },
};

async function run(name) {
  const rmlui = require('../../dist');
  const sfml = require('sfml.js');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Log contracts');
  const messages = [];
  const system = new rmlui.SystemInterface(window, {
    logMessage(type, text) {
      messages.push([ type, text ]);
      return true;
    },
  });

  try {
    rmlui.setSystemInterface(system);
    await cases[name]({ rmlui, window, messages });
  } finally {
    rmlui.shutdown();
    window.close();
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
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} logging failures`);
}
