'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function memoryCallbacks(bytes) {
  let data = Buffer.from(bytes);
  let position = 0;
  return {
    length: () => data.length,
    tell: () => position,
    seek(offset, origin) {
      const next = origin === 0 ? offset :
        (origin === 1 ? position : data.length) + offset;
      if (next < 0 || next > data.length) {
        return false;
      }
      position = next;
      return true;
    },
    read(output, count) {
      const copied = Math.min(count, data.length - position);
      output.set(data.subarray(position, position + copied));
      position += copied;
      return copied;
    },
    write(input, count) {
      const next = Buffer.alloc(Math.max(data.length, position + count));
      data.copy(next);
      next.set(input.subarray(0, count), position);
      data = next;
      position += count;
      return count;
    },
    truncate(length) {
      if (length > data.length) {
        return 0;
      }
      const removed = data.length - length;
      data = data.subarray(0, length);
      position = length;
      return removed;
    },
    isReadReady: () => position < data.length,
    isWriteReady: () => true,
  };
}

const cases = {
  'memory-stream-copies-input-and-peek-preserves-position': ({ rmlui }) => {
    const allocation = Uint8Array.of(99, 65, 66, 0, 67, 88);
    const stream = new rmlui.StreamMemory(allocation.subarray(1, 5));
    allocation.fill(0);
    structuredClone(allocation.buffer, { transfer: [ allocation.buffer ] });
    assert.equal(stream.length(), 4);
    assert.deepEqual(Array.from(stream.peek(8)), [ 65, 66, 0, 67 ]);
    assert.equal(stream.tell(), 0);
    assert.deepEqual(Array.from(stream.read(2)), [ 65, 66 ]);
    const output = new Uint8Array(6).fill(77);
    assert.equal(stream.read(output.subarray(1, 5), 4), 2);
    assert.deepEqual(Array.from(output), [ 77, 0, 67, 77, 77, 77 ]);
    assert.equal(stream.isEOS(), true);
    assert.equal(stream.isReadReady(), false);
    assert.equal(stream.isWriteReady(), false);
    assert.throws(() => stream.write('x'), /read.only|writ/i);
    stream.setSourceURL('assets/a.rml');
    assert.equal(stream.getSourceURL(), 'assets/a.rml');
    assert.equal(stream.getStreamMode(), rmlui.StreamMode.Read);
  },

  'memory-stream-writes-inserts-erases-and-truncates': ({ rmlui }) => {
    const stream = new rmlui.StreamMemory();
    const origin = rmlui.SeekOrigin;
    assert.equal(stream.write('ABC\0D'), 5);
    assert.equal(stream.seek(1, origin.Set), true);
    assert.equal(stream.write('x'), 1);
    assert.equal(stream.pushBack(Uint8Array.of(69, 70)), 2);
    assert.equal(stream.tell(), 2);
    assert.equal(stream.pushFront(Uint8Array.of(48, 49)), 2);
    assert.equal(stream.tell(), 4);
    assert.deepEqual(Array.from(stream.rawStream()),
      [ 48, 49, 65, 120, 67, 0, 68, 69, 70 ]);
    stream.erase(3, 2);
    assert.deepEqual(Array.from(stream.rawStream()),
      [ 48, 49, 65, 0, 68, 69, 70 ]);
    assert.equal(stream.popFront(2), 2);
    assert.deepEqual(Array.from(stream.rawStream()), [ 65, 0, 68, 69, 70 ]);
    assert.equal(stream.popBack(2), 2);
    assert.deepEqual(Array.from(stream.rawStream()), [ 65, 0, 68 ]);
    assert.equal(stream.truncate(2), 1);
    assert.equal(stream.seek(0, origin.Set), true);
    assert.equal(stream.readString(8, 'prefix:'), 'prefix:A\0');
    const snapshot = stream.rawStream();
    snapshot.fill(255);
    assert.equal(stream.seek(0, origin.Set), true);
    assert.deepEqual(Array.from(stream.read(4)), [ 65, 0 ]);
    assert.equal(stream.seek(0, origin.End), true);
    assert.equal(stream.tell(), 2);
    // StreamMemory uses end minus offset, unlike SEEK_END on a file.
    assert.equal(stream.seek(1, origin.End), true);
    assert.equal(stream.tell(), 1);
    assert.equal(stream.seek(9, origin.Set), false);
    assert.equal(stream.tell(), 1);
  },

  'stream-copy-and-c-string-write-preserve-native-counts': ({ rmlui }) => {
    const source = new rmlui.StreamMemory(Uint8Array.of(65, 66, 67));
    const destination = new rmlui.StreamMemory(1);
    assert.equal(source.read(destination, 10), 3);
    assert.equal(source.tell(), 3);
    assert.equal(destination.seek(0, rmlui.SeekOrigin.Set), true);
    assert.equal(destination.readString(10), 'ABC');
    assert.equal(source.seek(0, rmlui.SeekOrigin.Set), true);
    assert.equal(destination.write(source, 2), 2);
    assert.equal(destination.writeCString('x\0ignored'), 1);
    assert.equal(destination.write('y\0z'), 3);
    assert.deepEqual(Array.from(destination.rawStream()),
      [ 65, 66, 67, 65, 66, 120, 121, 0, 122 ]);
    assert.throws(() => destination.read(destination, 1), /same|itself/i);
  },

  'memory-and-file-streams-load-documents-and-styles': options => {
    const { rmlui, context } = options;
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-streams-'));
    try {
      const source = path.join(root, 'panel.rml');
      fs.writeFileSync(source,
        '<rml><head><title>Stream</title></head><body id="loaded"/></rml>');
      const file = new rmlui.StreamFile();
      assert.equal(file.open(source), true);
      assert.equal(file.open(source), true);
      assert.equal(file.getStreamMode(), rmlui.StreamMode.Read);
      const doc = context.loadDocument(file);
      assert.equal(doc.title, 'Stream');
      assert.equal(doc.id, 'loaded');
      assert.equal(file.tell(), file.length());
      file.close();
      assert.throws(() => file.read(1), /closed|open/i);
      assert.equal(file.open(source), true);
      assert.equal(file.isReadReady(), true);
      assert.equal(file.isWriteReady(), false);
      const memory = new rmlui.StreamMemory(Buffer.from(
        '<rml><head/><body id="memory"/></rml>'));
      memory.setSourceURL(source);
      assert.equal(context.loadDocument(memory).sourceURL, source);
      const styles = new rmlui.StreamMemory(Buffer.from(
        '#loaded { width: 73px; }'));
      styles.setSourceURL(path.join(root, 'theme.rcss'));
      const container = new rmlui.StyleSheetContainer();
      assert.equal(container.loadStyleSheetContainer(styles), true);
      doc.setStyleSheetContainer(container);
      doc.updateDocument();
      assert.equal(doc.getComputedValues().width.value, 73);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  },

  'custom-stream-parsing-snapshots-and-native-overloads': options => {
    const { rmlui, context } = options;
    const callbacks = memoryCallbacks(
      '<rml><head/><body id="custom"/></rml>');
    let scratch;
    const read = callbacks.read;
    callbacks.read = (output, count) => {
      scratch = output;
      return read(output, count);
    };
    const stream = new rmlui.Stream(callbacks, 'custom.rml');
    assert.equal(context.loadDocument(stream).id, 'custom');
    scratch.fill(255);
    assert.equal(stream.seek(0, rmlui.SeekOrigin.Set), true);
    assert.equal(stream.readString(4), '<rml');
    assert.equal(stream.seek(0, rmlui.SeekOrigin.Set), true);
    assert.deepEqual(Array.from(stream.peek(4)), [ 60, 114, 109, 108 ]);
    assert.equal(stream.tell(), 0);
    const input = Uint8Array.of(65, 66);
    callbacks.write = bytes => {
      bytes.fill(90);
      return bytes.length;
    };
    // Methods are captured once; later callback object edits have no effect.
    assert.equal(stream.write(input), 2);
    assert.deepEqual(Array.from(input), [ 65, 66 ]);
    const copy = new rmlui.StreamMemory();
    stream.seek(0, rmlui.SeekOrigin.Set);
    assert.equal(stream.read(copy, 2), 2);
    assert.deepEqual(Array.from(copy.rawStream()), [ 65, 66 ]);
    const styles = new rmlui.Stream(memoryCallbacks('body { width: 63px; }'));
    const container = new rmlui.StyleSheetContainer();
    assert.equal(container.loadStyleSheetContainer(styles), true);
    assert.throws(() => stream.pushFront('x'), /support|implement/i);
    assert.throws(() => stream.popFront(1), /support|implement/i);
    let closed = 0;
    const closable = new rmlui.Stream({
      ...memoryCallbacks('x'),
      close() {
        ++closed;
      },
    });
    closable.close();
    assert.equal(closed, 1);
    rmlui.shutdown();
    assert.equal(closed, 1);
  },

  'custom-stream-exceptions-promises-and-reentry': async options => {
    const { rmlui, context } = options;
    const exception = { reason: 'read callback failed' };
    const throwing = new rmlui.Stream({
      ...memoryCallbacks('x'),
      read() {
        throw exception;
      },
    });
    assert.throws(() => throwing.read(1), value => value === exception);
    assert.throws(() => context.loadDocument(throwing),
      value => value === exception);
    const bad = new rmlui.Stream({
      ...memoryCallbacks('x'),
      read: () => 2,
    });
    assert.throws(() => bad.read(1), /count|byte|size/i);
    const detached = new rmlui.Stream({
      ...memoryCallbacks('x'),
      read(output) {
        structuredClone(output.buffer, { transfer: [ output.buffer ] });
        return 1;
      },
    });
    assert.throws(() => detached.read(1), /detach|buffer/i);
    const recursive = new rmlui.Stream({
      ...memoryCallbacks('x'),
      read: () => recursive.read(1).length,
    });
    assert.throws(() => recursive.read(1), /callback|reent/i);
    const destructive = new rmlui.Stream({
      ...memoryCallbacks('x'),
      read() {
        rmlui.shutdown();
        return 1;
      },
    });
    assert.throws(() => destructive.read(1), /callback|reent/i);
    const asynchronous = new rmlui.Stream({
      ...memoryCallbacks('x'),
      read: () => Promise.reject(new Error('invalid async stream')),
    });
    assert.throws(() => asynchronous.read(1), /synchronous|promise/i);
    await new Promise(resolve => setImmediate(resolve));
    assert.throws(() => new rmlui.Stream({}), /callback|length/i);
    const invalidBoolean = new rmlui.Stream({
      ...memoryCallbacks('x'),
      isReadReady: () => 1,
    });
    assert.throws(() => invalidBoolean.isReadReady(), /boolean/i);
  },

  'failed-custom-stream-must-not-load-a-document': ({ rmlui, context }) => {
    let loads = 0;
    context.addEventListener('load', () => ++loads, true);
    const error = new Error('stream parse failed');
    const source = new rmlui.Stream({
      ...memoryCallbacks('<rml><head/><body/></rml>'),
      read() {
        throw error;
      },
    });
    const count = context.getNumDocuments();
    assert.throws(() => context.loadDocument(source), value => value === error);
    assert.equal(context.getNumDocuments(), count);
    assert.equal(loads, 0);
  },

  'stream-empty-mutations-and-callback-ownership': async ({ rmlui }) => {
    const empty = new rmlui.StreamMemory(0);
    assert.equal(empty.tell(), 0);
    assert.deepEqual(Array.from(empty.read(0)), []);
    assert.equal(empty.write(''), 0);
    const writable = new rmlui.StreamMemory();
    writable.write('abcdef');
    writable.erase(0, 4);
    assert.equal(writable.tell(), 2);
    assert.equal(writable.popFront(99), 2);
    assert.equal(writable.tell(), 0);
    writable.write('123');
    assert.equal(writable.popBack(99), 3);
    assert.equal(writable.tell(), 0);
    assert.throws(() => writable.erase(1, 0), /offset|range/i);
    const immutable = new rmlui.StreamMemory(Uint8Array.of(1));
    for (const mutate of [
      () => immutable.truncate(0),
      () => immutable.pushFront('x'),
      () => immutable.pushBack('x'),
      () => immutable.popFront(1),
      () => immutable.popBack(1),
      () => immutable.erase(0, 1),
    ]) {
      assert.throws(mutate, /read.only|writ/i);
    }
    let retained;
    let cycle;
    (() => {
      const value = new rmlui.Stream(memoryCallbacks('retained'));
      retained = new WeakRef(value);
      const self = new rmlui.Stream({
        ...memoryCallbacks('cycle'),
        read(output) {
          void self;
          output[0] = 1;
          return 1;
        },
      });
      cycle = new WeakRef(self);
    })();
    await collect();
    assert.equal(retained.deref(), undefined);
    assert.equal(cycle.deref(), undefined);
    const alive = new rmlui.Stream(memoryCallbacks('live'));
    await collect();
    assert.equal(alive.readString(4), 'live');
  },

  'stream-boundary-validation-and-shutdown': async ({ rmlui, window }) => {
    const stream = new rmlui.StreamMemory(Uint8Array.of(1, 2, 3));
    for (const size of [ -1, 0.5, NaN, Infinity, 2 ** 53, '3' ]) {
      assert.throws(() => stream.read(size), /size|byte|count/i);
    }
    const detached = new Uint8Array(4);
    structuredClone(detached.buffer, { transfer: [ detached.buffer ] });
    assert.throws(() => stream.read(detached), /detach|buffer/i);
    assert.throws(() => stream.peek(new Uint8Array(1), 2), /size|byte|bound/i);
    assert.throws(() => stream.seek(0, 9), /origin/i);
    assert.equal(stream.tell(), 0);
    const retained = stream.rawStream();
    rmlui.shutdown();
    await collect();
    assert.deepEqual(Array.from(retained), [ 1, 2, 3 ]);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => stream.read(1), /valid|generation/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'RmlUi streams');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('streams', 160, 120);
    await cases[name]({ rmlui, context, window });
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
  assert.equal(failures, 0, `${failures} stream failures`);
}
