'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Worker } = require('node:worker_threads');
const sf = require('..');
const native = require('../build/Release/sfml.node');

const cases = [
  [ 'SFML', 0, /^SFML exception message$/ ],
  [ 'standard C++', 1, /^C\+\+ exception message$/ ],
  [ 'non-standard C++', 2, /^Unknown native exception$/ ],
  [ 'SFML constructor', 3, /font/i ],
];

function checkError(pattern) {
  return error => {
    assert.ok(error instanceof Error);
    assert.ok(error instanceof sf.SFMLError);
    assert.equal(error.name, 'SFMLError');
    assert.equal(Object.getPrototypeOf(error), sf.SFMLError.prototype);
    assert.match(error.stack, /^SFMLError:/);
    assert.match(error.message, pattern);
    assert.equal(native.readExceptionScopes(), 0, 'C++ stack must unwind');
    return true;
  };
}

function runWorker(kind, completion) {
  return new Promise((resolve, reject) => {
    native.queueNativeException(kind, completion, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}

for (const [ label, kind, pattern ] of cases) {
  test(`${label} exception becomes a synchronous SFMLError`, () => {
    assert.throws(() => native.throwNativeException(kind), checkError(pattern));
  });

  for (const completion of [ false, true ]) {
    const stage = completion ? 'completion callback' : 'worker thread';
    test(`${label} exception in ${stage} rejects the Promise`, async () => {
      await assert.rejects(runWorker(kind, completion), checkError(pattern));
    });
  }
}

test('exception boundary preserves JS callback errors', () => {
  const expected = new RangeError('JS callback error');
  assert.throws(() => native.passJsException(() => {
    throw expected;
  }), error => error === expected);
  assert.throws(() => native.passJsException(null), TypeError);
});

test('exception boundaries preserve successful false and undefined results',
  async () => {
    assert.equal(native.throwNativeException(4), false);
    assert.equal(native.passJsException(() => {}), undefined);
    assert.equal(await runWorker(4, false), false);
    assert.equal(await runWorker(4, true), false);
    assert.equal(native.readExceptionScopes(), 0);
  });

test('SFMLError distinguishes runtime failures from parameter validation',
  async () => {
    const explicit = new sf.SFMLError('runtime failure');
    assert.ok(explicit instanceof Error);
    assert.equal(explicit.message, 'runtime failure');
    assert.equal(explicit.name, 'SFMLError');
    assert.throws(() => new sf.Texture(new sf.Image()), sf.SFMLError);
    const text = new sf.Text({ font: new sf.Font(), string: 'A' });
    assert.throws(() => text.getLocalBounds(), sf.SFMLError);
    assert.throws(() => text.setCharacterSize(-1), error => {
      assert.ok(error instanceof RangeError);
      assert.equal(error instanceof sf.SFMLError, false);
      return true;
    });
    assert.equal(await new sf.Font().openFromMemory(
      new Uint8Array([ 1, 2, 3 ])), false);
  });

test('SFMLError prototypes belong to their Node worker realm', async () => {
  const result = await new Promise((resolve, reject) => {
    const worker = new Worker(`
      const { parentPort } = require('node:worker_threads');
      const sf = require(${JSON.stringify(require.resolve('..'))});
      const native = require(${JSON.stringify(
    require.resolve('../build/Release/sfml.node'))});
      let sync;
      try { native.throwNativeException(3); }
      catch (error) { sync = error instanceof sf.SFMLError; }
      native.queueNativeException(3, false, error => {
        parentPort.postMessage({
          sync, async: error instanceof sf.SFMLError, name: error.name,
        });
        parentPort.close();
      });
    `, { eval: true });
    worker.once('message', resolve);
    worker.once('error', reject);
    worker.once('exit', code => {
      if (code) reject(new Error(`Worker exited with ${code}`));
    });
  });
  assert.deepEqual(result, { sync: true, async: true, name: 'SFMLError' });
});
