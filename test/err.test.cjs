'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Writable } = require('node:stream');
const { finished } = require('node:stream/promises');
const { setImmediate: nextTurn } = require('node:timers/promises');
const { spawnSync } = require('node:child_process');
const { Worker } = require('node:worker_threads');
const { once } = require('node:events');
const { mkdtemp, readFile, rm } = require('node:fs/promises');
const { createWriteStream } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const sf = require('..');
const native = require('../build/Release/sfml.node');

const entry = JSON.stringify(require.resolve('..'));

function output() {
  const chunks = [];
  const stream = new Writable({
    write(chunk, encoding, done) { chunks.push(chunk); done(); },
  });
  return { stream, bytes: () => Buffer.concat(chunks) };
}

async function drain() {
  for (let i = 0; i < 4; i++) await nextTurn();
}

function child(source) {
  const result = spawnSync(process.execPath, [ '-e', source ], {
    encoding: 'utf8', timeout: 10000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  return result;
}

test('err is a singleton Writable carrying exact bytes through sf::err',
  async t => {
    t.after(() => sf.setErrorOutput());
    const out = output();
    sf.setErrorOutput(out.stream);
    assert.ok(sf.err() instanceof Writable);
    assert.equal(sf.err(), sf.err());
    const bytes = Buffer.from('中文🙂\0tail\n');
    const expected = Buffer.from(bytes);
    assert.equal(sf.err().write(bytes), true);
    bytes.fill(0);
    await drain();
    assert.deepEqual(out.bytes(), expected);
    const large = Buffer.from('a'.repeat(65535) + '🙂中文\n'.repeat(10000));
    sf.err().write(large);
    await drain();
    global.gc();
    assert.deepEqual(out.bytes(), Buffer.concat([ expected, large ]));
  });

test('switching output preserves queued destinations and supports mute',
  async t => {
    t.after(() => sf.setErrorOutput());
    const first = output();
    const second = output();
    sf.setErrorOutput(first.stream);
    sf.err().write('first');
    sf.setErrorOutput(second.stream);
    sf.err().write('second');
    sf.setErrorOutput(null);
    sf.err().write('muted');
    await drain();
    assert.equal(first.bytes().toString(), 'first');
    assert.equal(second.bytes().toString(), 'second');
    sf.setErrorOutput(first.stream);
    sf.err().write(' resumed');
    await drain();
    assert.equal(first.bytes().toString(), 'first resumed');
  });

test('real SFML diagnostics from the background font loader reach Writable',
  async t => {
    t.after(() => sf.setErrorOutput());
    const out = output();
    sf.setErrorOutput(out.stream);
    assert.equal(await new sf.Font().openFromMemory(
      new Uint8Array([ 1, 2, 3 ])), false);
    await drain();
    assert.match(out.bytes().toString(), /font/i);
    assert.throws(() => native.throwNativeException(3), sf.SFMLError);
    await drain();
    assert.match(out.bytes().toString(), /font/i);
  });

test('err writes use the native binding and preserve its error object',
  async t => {
    // Keep the exported singleton usable for other tests by testing in a child.
    const result = child(`
      const assert = require('node:assert/strict');
      const sf = require(${entry});
      const native = require(${JSON.stringify(
    require.resolve('../build/Release/sfml.node'))});
      const expected = new sf.SFMLError('write failed');
      native.writeError = () => { throw expected; };
      sf.err().on('error', error => assert.equal(error, expected));
      sf.err().write('test', error => {
        assert.equal(error, expected);
        console.log('same error');
      });
    `);
    assert.match(result.stdout, /same error/);
    t.after(() => sf.setErrorOutput());
    sf.setErrorOutput(null);
    const callback = new Promise(resolve => sf.err().write('silent', resolve));
    assert.equal(await callback, null);
  });

test('output validation leaves the current destination intact', async t => {
  t.after(() => sf.setErrorOutput());
  const out = output();
  sf.setErrorOutput(out.stream);
  for (const value of [{}, 1, 'file.log', () => {}, sf.err() ]) {
    assert.throws(() => sf.setErrorOutput(value), TypeError);
  }
  const closed = output().stream;
  closed.end();
  assert.throws(() => sf.setErrorOutput(closed), TypeError);
  assert.throws(() => native.setErrorOutput(1), TypeError);
  assert.throws(() => native.writeError('text'), TypeError);
  sf.err().write('still here');
  await drain();
  assert.equal(out.bytes().toString(), 'still here');
});

test('default output and restoration affect SFML without redirecting stderr',
  () => {
    const result = child(`
      const sf = require(${entry});
      const { Writable } = require('node:stream');
      sf.err().write('default\\n');
      sf.setErrorOutput(new Writable({
        write(bytes, _, done) { process.stdout.write(bytes); done(); }
      }));
      sf.err().write('captured\\n');
      process.stderr.write('ordinary stderr\\n');
      sf.setErrorOutput(null);
      sf.err().write('hidden\\n');
      sf.setErrorOutput();
      sf.err().write('restored\\n');
    `);
    assert.equal(result.stdout, 'captured\n');
    assert.equal(result.stderr.replace(/\r\n/g, '\n'),
      'default\nordinary stderr\nrestored\n');
  });

test('an idle redirect does not keep Node alive and beforeExit drains logs',
  () => {
    const result = child(`
      const sf = require(${entry});
      const { Writable } = require('node:stream');
      sf.setErrorOutput(new Writable({
        write(bytes, _, done) { process.stdout.write(bytes); done(); }
      }));
      sf.err().write('last message');
    `);
    assert.equal(result.stdout, 'last message');
    assert.equal(result.stderr, '');
  });

test('file destinations retain all chunks and are closed by the caller',
  async t => {
    const directory = await mkdtemp(join(tmpdir(), 'sfml-err-'));
    t.after(async () => {
      sf.setErrorOutput();
      await rm(directory, { recursive: true, force: true });
    });
    const path = join(directory, 'output.log');
    const stream = createWriteStream(path, { highWaterMark: 16 });
    sf.setErrorOutput(stream);
    const expected = '中文🙂\n'.repeat(10000);
    sf.err().write(expected);
    // Switching hands pending bytes to this environment's old destination.
    sf.setErrorOutput();
    assert.equal(stream.writableEnded, false);
    stream.end();
    await finished(stream);
    assert.equal(await readFile(path, 'utf8'), expected);
  });

test('Node Workers share the route and termination restores the original sink',
  async t => {
    t.after(() => sf.setErrorOutput());
    const out = output();
    sf.setErrorOutput(out.stream);
    const worker = new Worker(`
      const sf = require(${entry});
      sf.err().write('from worker');
    `, { eval: true });
    assert.equal((await once(worker, 'exit'))[0], 0);
    await drain();
    assert.equal(out.bytes().toString(), 'from worker');
    const owner = new Worker(`
      const { parentPort } = require('node:worker_threads');
      const { Writable } = require('node:stream');
      const sf = require(${entry});
      sf.setErrorOutput(new Writable({
        write(bytes, _, done) {
          parentPort.postMessage(bytes.toString());
          done();
        }
      }));
      parentPort.postMessage('ready');
      setInterval(() => {}, 1000);
    `, { eval: true });
    assert.equal((await once(owner, 'message'))[0], 'ready');
    const received = once(owner, 'message');
    sf.err().write('cross-thread');
    assert.equal((await received)[0], 'cross-thread');
    await owner.terminate();
    // Verify there are no dangling routes by installing and using a new sink.
    sf.setErrorOutput(out.stream);
    sf.err().write(' after termination');
    await drain();
    assert.equal(out.bytes().toString(), 'from worker after termination');
  });

test('a destination can change routing from its write callback', async t => {
  t.after(() => sf.setErrorOutput());
  const out = output();
  const first = new Writable({
    write(bytes, _, done) {
      assert.equal(bytes.toString(), 'first');
      sf.setErrorOutput(out.stream);
      sf.err().write('second');
      done();
    },
  });
  sf.setErrorOutput(first);
  sf.err().write('first');
  await drain();
  assert.equal(out.bytes().toString(), 'second');
});

test('destination callback failures retain the original JS error object',
  () => {
    const result = child(`
      const assert = require('node:assert/strict');
      const { Writable } = require('node:stream');
      const sf = require(${entry});
      const expected = new Error('destination failed');
      const target = new Writable({
        write() { throw expected; }
      });
      sf.setErrorOutput(target);
      sf.err().write('queued');
      assert.throws(() => sf.setErrorOutput(), error => error === expected);
      console.log('original error');
    `);
    assert.equal(result.stdout, 'original error\n');
  });

test('termination releases a Worker-owned route back to the original output',
  () => {
    const result = child(`
      const { once } = require('node:events');
      const { Worker } = require('node:worker_threads');
      const sf = require(${entry});
      (async () => {
        const worker = new Worker(\`
          const { parentPort, workerData } = require('node:worker_threads');
          const sf = require(workerData);
          sf.setErrorOutput(null);
          parentPort.postMessage('ready');
          setInterval(() => {}, 1000);
        \`, { eval: true, workerData: ${entry} });
        await once(worker, 'message');
        sf.err().write('hidden');
        await worker.terminate();
        sf.err().write('restored after worker\\n');
      })();
    `);
    assert.equal(result.stderr.replace(/\r\n/g, '\n'),
      'restored after worker\n');
  });

test('redirected streams stay alive until reset and are then released',
  async t => {
    t.after(() => sf.setErrorOutput());
    let stream = output().stream;
    const weak = new WeakRef(stream);
    sf.setErrorOutput(stream);
    stream = null;
    for (let i = 0; i < 4; i++) { await nextTurn(); global.gc(); }
    assert.ok(weak.deref());
    sf.setErrorOutput();
    for (let i = 0; i < 8; i++) { await nextTurn(); global.gc(); }
    assert.equal(weak.deref(), undefined);
  });
