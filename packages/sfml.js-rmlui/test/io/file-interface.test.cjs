'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

const bytes = value => Buffer.from(value);
const cases = {
  'setup-selection-and-native-byte-snapshots': ({ rmlui, window }) => {
    assert.equal(rmlui.getFileInterface(), null);
    const source = bytes('abcdef');
    const files = new rmlui.FileInterface({ open: () => source });
    rmlui.setFileInterface(files);
    const file = files.open('virtual');
    assert.ok(file instanceof rmlui.FileHandle);
    source.fill(0);
    assert.equal(files.length(file), 6);
    const output = new Uint8Array(4);
    assert.equal(files.read(output, 4, file), 4);
    assert.equal(Buffer.from(output).toString(), 'abcd');
    assert.equal(files.tell(file), 4);
    assert.ok(files.seek(file, -1, rmlui.SeekOrigin.End));
    assert.equal(files.tell(file), 5);
    files.close(file);
    assert.throws(() => files.tell(file), /closed|valid/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.equal(rmlui.getFileInterface(), files);
    assert.throws(() => rmlui.setFileInterface(null), /before|initial/i);
  },

  'all-seven-virtuals-and-checked-handle-identity': ({ rmlui }) => {
    let cursor = 0;
    let opened;
    const calls = [];
    const callbacks = {
      open(path) {
        assert.equal(this, callbacks);
        calls.push([ 'open', path ]);
        return bytes('abcd');
      },
      close(file) {
        assert.equal(file, opened);
        calls.push([ 'close' ]);
      },
      read(output, size, file) {
        assert.equal(file, opened);
        output.set(bytes('abcd').subarray(cursor, cursor + size));
        cursor += size;
        calls.push([ 'read', size ]);
        return size;
      },
      seek(file, offset, origin) {
        assert.equal(file, opened);
        cursor = origin === 2 ? 4 + offset :
          origin === 1 ? cursor + offset : offset;
        calls.push([ 'seek', offset, origin ]);
        return true;
      },
      tell(file) {
        assert.equal(file, opened);
        calls.push([ 'tell' ]);
        return cursor;
      },
      length(file) {
        assert.equal(file, opened);
        calls.push([ 'length' ]);
        return 4;
      },
      loadFile(path) {
        calls.push([ 'loadFile', path ]);
        return bytes('loaded');
      },
    };
    const files = new rmlui.FileInterface(callbacks);
    opened = files.open('source');
    assert.equal(files.length(opened), 4);
    assert.ok(files.seek(opened, 1, rmlui.SeekOrigin.Set));
    assert.equal(files.tell(opened), 1);
    const output = new Uint8Array(2);
    assert.equal(files.read(output, 2, opened), 2);
    assert.equal(Buffer.from(output).toString(), 'bc');
    assert.equal(Buffer.from(files.loadFile('other')).toString(), 'loaded');
    files.close(opened);
    assert.deepEqual(calls, [
      [ 'open', 'source' ], [ 'length' ], [ 'seek', 1, 0 ],
      [ 'tell' ], [ 'read', 2 ], [ 'loadFile', 'other' ], [ 'close' ],
    ]);
  },

  'native-document-and-stream-use-selected-provider': ({ rmlui, window }) => {
    const paths = [];
    const files = new rmlui.FileInterface({
      open(path) {
        paths.push(path);
        return path.endsWith('.rml') ?
          bytes('<rml><body><div id="found">virtual</div></body></rml>') :
          bytes('stream');
      },
    });
    rmlui.setFileInterface(files);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const context = rmlui.createContext('virtual', 160, 120);
    const document = context.loadDocument('virtual.rml');
    assert.ok(document.getElementById('found'));
    const stream = new rmlui.StreamFile();
    assert.ok(stream.open('virtual.bin'));
    const output = new Uint8Array(6);
    assert.equal(stream.read(output, 6), 6);
    assert.equal(Buffer.from(output).toString(), 'stream');
    stream.close();
    assert.deepEqual(paths, [ 'virtual.rml', 'virtual.bin' ]);
  },

  'empty-missing-files-and-foreign-tokens': ({ rmlui }) => {
    const first = new rmlui.FileInterface({
      open: path => (path === 'missing' ? null : new Uint8Array()),
    });
    const second = new rmlui.FileInterface({ open: () => bytes('x') });
    assert.equal(first.open('missing'), null);
    assert.equal(first.loadFile('missing'), null);
    assert.deepEqual(first.loadFile('empty'), new Uint8Array());
    const file = first.open('empty');
    assert.throws(() => second.tell(file), /belong|interface/i);
    assert.throws(() => first.tell({}), /FileHandle|file handle/i);
    assert.throws(() => first.open('a\0b'), /null/i);
    first.close(file);
  },

  'callback-errors-promises-and-reentry': ({ rmlui }) => {
    const error = new Error('provider identity');
    const files = new rmlui.FileInterface({
      open(path) {
        if (path === 'throw') {
          throw error;
        }
        if (path === 'async') {
          return Promise.reject(error);
        }
        if (path === 'reenter') {
          rmlui.shutdown();
        }
        return bytes('ok');
      },
    });
    assert.throws(() => files.open('throw'), value => value === error);
    assert.throws(() => files.open('async'), /synchronous/i);
    assert.throws(() => files.open('reenter'), /callback/i);
    const file = files.open('ok');
    assert.equal(files.length(file), 2);
    files.close(file);
  },

  'shutdown-invalidates-open-files-and-unused-setup': ({ rmlui, window }) => {
    let closes = 0;
    const files = new rmlui.FileInterface({
      open: () => bytes('x'), close: () => ++closes,
    });
    const unused = new rmlui.FileInterface('');
    rmlui.setFileInterface(files);
    const file = files.open('x');
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    rmlui.shutdown();
    assert.equal(closes, 1);
    assert.equal(rmlui.getFileInterface(), null);
    assert.throws(() => files.tell(file), /valid/i);
    assert.throws(() => unused.open('x'), /valid/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.ok(rmlui.getFileInterface() instanceof rmlui.FileInterface);
  },

  'root-default-and-conflicting-init-options': ({ rmlui, window }) => {
    const root = path.resolve(__dirname,
      '../../third_party/rmlui/Samples/assets');
    const files = new rmlui.FileInterface(root);
    rmlui.setFileInterface(files);
    assert.throws(() => rmlui.initialise(window,
      { fileRoot: 'conflicting', highDpi: false }), /conflict/i);
    assert.equal(rmlui.getFileInterface(), files);
    assert.ok(rmlui.initialise(window, { fileRoot: root, highDpi: false }));
    assert.deepEqual(Buffer.from(files.loadFile('/hello_world.png')),
      fs.readFileSync(path.join(root, 'hello_world.png')));
  },

  'custom-preload-snapshot-dedup-and-worker-decode':
    async ({ rmlui, window }) => {
      const source = fs.readFileSync(path.resolve(__dirname,
        '../../third_party/rmlui/Samples/assets/hello_world.png'));
      let reads = 0;
      const files = new rmlui.FileInterface({
        open(name) {
          assert.equal(name, 'virtual.png');
          ++reads;
          return source;
        },
      });
      rmlui.setFileInterface(files);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const { native } = require('../../dist/internal/native');
      native.beginDataDiagnostics(false);
      await Promise.all([
        rmlui.preloadResources({ textures: [ 'virtual.png', 'virtual.png' ] }),
        rmlui.preloadResources({ textures: [ 'virtual.png' ] }),
      ]);
      const cold = native.endDataDiagnostics();
      assert.equal(reads, 1);
      assert.equal(cold.preloadProviderSnapshots, 1);
      assert.equal(cold.preloadFileReads, 0);
      assert.equal(cold.preloadImageDecodes, 1);
      assert.equal(cold.preloadMainThreadPreparations, 0);
      const context = rmlui.createContext('preloaded', 160, 120);
      native.beginDataDiagnostics(false);
      const document = context.loadDocumentFromMemory(
        '<rml><body><img src="virtual.png" style="width:20px;height:20px"/>' +
        '</body></rml>');
      document.show();
      context.update();
      context.render();
      const hot = native.endDataDiagnostics();
      assert.equal(reads, 1);
      assert.equal(hot.resourceMainThreadReads, 0);
      assert.equal(hot.preloadTextureCacheHits, 1);
    },

  'existing-memory-stream-retains-native-owner': ({ rmlui, window }) => {
    let stream;
    const files = new rmlui.FileInterface({ open: () => stream });
    rmlui.setFileInterface(files);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    stream = new rmlui.StreamMemory(bytes('stream-owner'));
    const file = files.open('memory');
    stream = undefined;
    global.gc();
    assert.equal(files.length(file), 12);
    const output = new Uint8Array(12);
    assert.equal(files.read(output, 12, file), 12);
    assert.equal(Buffer.from(output).toString(), 'stream-owner');
    files.close(file);
  },

  'closed-file-releases-private-callback-and-stream-edges':
    async ({ rmlui, window }) => {
      let sentinel = {};
      const reference = new WeakRef(sentinel);
      let callbacks = (retained => ({
        open: () => bytes('x'),
        close() {
          assert.ok(retained);
        },
      }))(sentinel);
      const files = new rmlui.FileInterface(callbacks);
      rmlui.setFileInterface(files);
      const file = files.open('x');
      sentinel = null;
      callbacks = null;
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      rmlui.shutdown();
      for (let attempt = 0; attempt < 20; ++attempt) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
      assert.equal(reference.deref(), undefined);
      assert.throws(() => files.length(file), /valid/i);
    },

  'unselected-open-file-cycles-are-collectible': async ({ rmlui }) => {
    const reference = (() => {
      let files;
      const callbacks = {
        open() {
          assert.ok(files);
          return bytes('x');
        },
      };
      files = new rmlui.FileInterface(callbacks);
      files.open('x');
      return new WeakRef(files);
    })();
    for (let attempt = 0; attempt < 20; ++attempt) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(reference.deref(), undefined);
  },

  'foreign-worker-cannot-change-setup-provider': async ({ rmlui }) => {
    const files = new rmlui.FileInterface('');
    rmlui.setFileInterface(files);
    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      const rmlui = require(workerData);
      const results = [];
      for (const operation of [
        () => rmlui.getFileInterface(),
        () => rmlui.setFileInterface(null),
        () => new rmlui.FileInterface(''),
        () => rmlui.shutdown(),
      ]) {
        try { operation(); results.push('allowed'); }
        catch (error) { results.push(error.message); }
      }
      parentPort.postMessage(results);
    `, { eval: true, workerData: path.resolve(__dirname, '../../dist') });
    const results = await new Promise((resolve, reject) => {
      worker.once('message', resolve);
      worker.once('error', reject);
    });
    await new Promise((resolve, reject) => {
      worker.once('exit', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`worker exit ${code}`));
        }
      });
    });
    assert.equal(results.length, 4);
    for (const message of results) {
      assert.match(message, /owning environment/i);
    }
    assert.equal(rmlui.getFileInterface(), files);
  },

  'static-native-frames-do-not-visit-file-callbacks': ({ rmlui, window }) => {
    const files = new rmlui.FileInterface({
      open: () => bytes('<rml><body><div style="width:10px;height:10px"/>' +
        '</body></rml>'),
    });
    rmlui.setFileInterface(files);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const context = rmlui.createContext('file-static', 160, 120);
    const document = context.loadDocument('virtual.rml');
    document.show();
    context.update();
    const { native } = require('../../dist/internal/native');
    native.beginDataDiagnostics(false);
    for (let frame = 0; frame < 32; ++frame) {
      context.update();
    }
    const counts = native.endDataDiagnostics();
    assert.equal(counts.nativeCallbacks, 0);
    assert.equal(counts.callbackSnapshotVisits, 0);
    assert.equal(counts.elementOwnershipVisits, 0);
    assert.equal(counts.callbacks.file, 0);
  },

  'custom-read-failure-does-not-discard-another-live-preload':
    async ({ rmlui, window }) => {
      const source = fs.readFileSync(path.resolve(__dirname,
        '../../third_party/rmlui/Samples/assets/hello_world.png'));
      const error = new Error('custom source failure');
      let reads = 0;
      const files = new rmlui.FileInterface({
        open(name) {
          if (name === 'bad.png') {
            throw error;
          }
          ++reads;
          return source;
        },
      });
      rmlui.setFileInterface(files);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const first = rmlui.preloadResources({ textures: [ 'good.png' ] });
      assert.throws(() => rmlui.preloadResources({
        textures: [ 'good.png', 'bad.png' ],
      }), value => value === error);
      await first;
      await rmlui.preloadResources({ textures: [ 'good.png' ] });
      assert.equal(reads, 1);
      const controller = new AbortController();
      const pending = rmlui.preloadResources(
        { textures: [ 'cancel.png' ] }, { signal: controller.signal });
      controller.abort();
      await assert.rejects(pending, { name: 'AbortError' });
      const stale = rmlui.preloadResources({ textures: [ 'shutdown.png' ] });
      const rejected = assert.rejects(stale, /shutdown|invalidated/i);
      rmlui.shutdown();
      await rejected;
    },

  'read-count-and-buffer-invariants': ({ rmlui }) => {
    let caller;
    let retained;
    let mode = 'short';
    const files = new rmlui.FileInterface({
      open: () => bytes('abcd'),
      read(output, count) {
        retained = output;
        output.fill(7);
        if (mode === 'large') {
          return count + 1;
        }
        if (mode === 'scratch') {
          structuredClone(output.buffer, { transfer: [ output.buffer ] });
        }
        if (mode === 'caller') {
          structuredClone(caller.buffer, { transfer: [ caller.buffer ] });
        }
        return Math.min(2, count);
      },
    });
    const file = files.open('source');
    assert.equal(files.read(new Uint8Array(), 0, file), 0);
    caller = new Uint8Array([ 1, 1, 1, 1 ]);
    assert.equal(files.read(caller, 4, file), 2);
    retained.fill(0);
    assert.deepEqual(caller, new Uint8Array([ 7, 7, 1, 1 ]));
    mode = 'large';
    assert.throws(() => files.read(caller, 4, file), /byte count/i);
    mode = 'scratch';
    assert.throws(() => files.read(caller, 4, file), /detach/i);
    mode = 'caller';
    assert.throws(() => files.read(caller, 4, file), /detach/i);
    files.close(file);
    assert.throws(() => new rmlui.FileInterface({
      open: () => new Uint8Array(new SharedArrayBuffer(4)),
    }).open('shared'), /unshared/i);
  },

  'default-original-path-and-explicit-empty-root-are-distinct': () => {
    // Two tiny resource fixtures; child uses the same built workspace module.
    const directory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'rmlui-file-policy-'));
    try {
      const original = path.join(directory, 'original.png');
      const cwd = path.join(directory, 'cwd');
      const shadow = path.join(cwd, original.replace(/^[/\\]+/, ''));
      const image = fs.readFileSync(path.resolve(__dirname,
        '../../third_party/rmlui/Samples/assets/hello_world.png'));
      fs.mkdirSync(path.dirname(shadow), { recursive: true });
      fs.writeFileSync(original, image);
      fs.writeFileSync(shadow, 'root-shadow');
      const distribution = path.resolve(__dirname, '../../dist');
      const script = `
        const assert = require('node:assert/strict');
        const rmlui = require(${JSON.stringify(distribution)});
        const sfml = require(${JSON.stringify(require.resolve('sfml.js'))});
        const source = ${JSON.stringify(original)};
        const renderWindow = new sfml.RenderWindow(
          new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Path policy');
        (async () => {
          try {
            assert.ok(rmlui.initialise(renderWindow, { highDpi: false }));
            assert.equal(rmlui.getFileInterface().loadFile(source)[0], 137);
            await rmlui.preloadResources({ textures: [source] });
            rmlui.shutdown();
            const files = new rmlui.FileInterface('');
            rmlui.setFileInterface(files);
            assert.ok(rmlui.initialise(renderWindow, { highDpi: false }));
            assert.equal(Buffer.from(files.loadFile(source)).toString(),
              'root-shadow');
            await assert.rejects(rmlui.preloadResources({ textures: [source] }),
              /decode/i);
          } finally {
            rmlui.shutdown();
            renderWindow.close();
          }
        })().catch(error => { console.error(error); process.exitCode = 1; });
      `;
      const result = spawnSync(process.execPath, [ '-e', script ],
        { cwd, encoding: 'utf8', timeout: 20000 });
      assert.equal(result.status, 0, result.stdout + result.stderr);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },

  'callback-accessors-are-captured-once-and-close-errors-release-tokens':
    ({ rmlui }) => {
      let captures = 0;
      const error = new Error('close identity');
      const callbacks = {
        get open() {
          ++captures;
          return () => bytes('captured');
        },
        close() {
          throw error;
        },
      };
      const files = new rmlui.FileInterface(callbacks);
      assert.equal(captures, 1);
      const file = files.open('source');
      assert.equal(captures, 1);
      assert.throws(() => files.close(file), value => value === error);
      assert.throws(() => files.read(new Uint8Array(1), 1, file), /closed/i);
      const { native } = require('../../dist/internal/native');
      assert.throws(() => native.createFileInterface('', []), /seven/i);
    },

  'load-file-preserves-upstream-zero-and-short-read-semantics':
    ({ rmlui, window }) => {
      const logs = [];
      rmlui.setSystemInterface(new rmlui.SystemInterface(window, {
        logMessage(type, text) {
          logs.push([ type, text ]);
          return true;
        },
      }));
      const reads = [];
      let closes = 0;
      const files = new rmlui.FileInterface({
        open: name => (name === 'empty' ? new Uint8Array() : bytes('abcd')),
        read(output, size) {
          reads.push(size);
          const count = Math.min(size, 2);
          output.fill(9, 0, count);
          return count;
        },
        close() {
          ++closes;
        },
      });
      assert.deepEqual(files.loadFile('empty'), new Uint8Array());
      assert.deepEqual(files.loadFile('short'), new Uint8Array([ 9, 9, 0, 0 ]));
      assert.deepEqual(reads, [ 0, 4 ]);
      assert.equal(closes, 2);
      assert.equal(logs.length, 1);
      assert.equal(logs[0][0], rmlui.LogType.Warning);
      assert.match(logs[0][1], /read 2 of 4 bytes.*short/i);
    },
};

async function run(name) {
  const rmlui = require('../../dist');
  const sfml = require('sfml.js');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'File contracts');
  try {
    await cases[name]({ rmlui, window });
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
      [ '--expose-gc', __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} file-interface failures`);
}
