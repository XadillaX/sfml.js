'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'compile-defers-side-effects-and-preserves-varargs': ({ rmlui }) => {
    const host = new rmlui.LuaScriptHost();
    host.setGlobal('runs', 0n);
    const chunk = host.compile(
      'runs=runs+1; local a,b=...; return a+b, runs, "zero\\0suffix"',
      'compiled.lua', 6);
    assert.ok(chunk instanceof rmlui.LuaFunction);
    assert.equal(host.getGlobal('runs'), 0n);
    assert.deepEqual(chunk.callResults(3, 9007199254740993n, 2n),
      [ 9007199254740995n, 1n, 'zero\0suffix' ]);
    assert.equal(chunk.call(2n, 3n), 5n);
    assert.equal(host.getGlobal('runs'), 2n);
  },

  'captured-function-keeps-identity-after-global-replacement': ({ rmlui }) => {
    const host = new rmlui.LuaScriptHost();
    host.execute('function value(x) return "original", x end');
    const original = host.getFunction('value');
    host.execute('function value(x) return "replacement", x end');
    assert.equal(host.call('value'), 'replacement');
    assert.deepEqual(original.callResults(2, true), [ 'original', true ]);
    host.execute('value=nil; collectgarbage("collect")');
    assert.equal(original.call(), 'original');
    assert.throws(() => host.getFunction('value'), /named.*function/i);
  },

  'exact-result-count-discards-and-pads-with-nil': ({ rmlui }) => {
    const host = new rmlui.LuaScriptHost();
    const chunk = host.compile('runs=(runs or 0)+1; return 3, false');
    assert.deepEqual(chunk.callResults(), []);
    assert.equal(host.getGlobal('runs'), 1n);
    assert.deepEqual(chunk.callResults(4), [ 3n, false, null, null ]);
    assert.equal(chunk.call(), 3n);
    for (const count of [ -1, 1.5, NaN, Infinity, 2 ** 32, 2147483647 ]) {
      assert.throws(() => chunk.callResults(count), /results|stack|count/i);
    }
    assert.equal(host.getGlobal('runs'), 3n);
  },

  'compile-and-call-errors-restore-stack-and-source-lines': ({ rmlui }) => {
    const host = new rmlui.LuaScriptHost();
    assert.throws(() => host.compile('local =', 'syntax.lua', 9),
      /syntax.lua:9/);
    const chunk = host.compile('error("runtime")', 'runtime.lua', 12);
    assert.throws(() => chunk.callResults(2), /runtime.lua:12.*runtime/s);
    const unsupported = host.compile('return 1, {}');
    assert.throws(() => unsupported.callResults(2), /scalar/);
    const nonfinite = host.compile('return 1, math.huge');
    assert.throws(() => nonfinite.callResults(2), /finite/);
    assert.throws(() => host.compile('return 1', 'null\0path'), /null byte/);
    assert.throws(() => host.compile('return 1', '', 0), /positive line/);
    assert.equal(host.compile('return 7').call(), 7n);
  },

  'released-function-is-invalid-and-other-references-survive': ({ rmlui }) => {
    const host = new rmlui.LuaScriptHost();
    host.execute('function value() return 8 end');
    const first = host.getFunction('value');
    const second = host.getFunction('value');
    first.release();
    assert.throws(() => first.call(), /no longer valid|released/);
    assert.throws(() => first.release(), /no longer valid|released/);
    assert.equal(second.call(), 8n);
    assert.throws(() => rmlui.LuaFunction.prototype.call.call({}), /function/i);
    assert.throws(() => new rmlui.LuaFunction({}), /construction|function/i);
    assert.throws(() => host.getFunction('value.bad'), /identifier/);
  },

  'captured-reference-retains-vm-after-host-gc':
    async ({ rmlui, context }) => {
      let reference;
      let weak;
      (() => {
        const host = new rmlui.LuaScriptHost();
        reference = host.compile('return 23');
        weak = new WeakRef(host);
      })();
      for (let i = 0; i < 8; ++i) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
        context.update();
      }
      assert.equal(weak.deref(), undefined);
      assert.equal(reference.call(), 23n);
      reference.release();
    },

  'released-reference-allows-native-vm-finalization':
    async ({ rmlui, context }) => {
      let destroyed = 0;
      rmlui.registerPlugin(new rmlui.Plugin({
        getEventClasses: () => rmlui.PluginEventClasses.Element,
        onElementDestroy(element) {
          if (element.tagName === 'captured-vm') {
            ++destroyed;
          }
        },
      }));
      let reference;
      (() => {
        const host = new rmlui.LuaScriptHost();
        host.execute('owned=Element.new("captured-vm")');
        reference = host.compile('return 11');
      })();
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
      context.update();
      assert.equal(reference.call(), 11n);
      assert.equal(destroyed, 0);
      reference.release();
      context.update();
      assert.equal(destroyed, 1);
    },

  'captured-calls-preserve-enclosing-lua-globals': ({ rmlui, context }) => {
    const host = new rmlui.LuaScriptHost();
    host.execute('function inside() return event.type, document.title end;' +
      'function outside(e, el, doc)' +
      'el:DispatchEvent("inside", {}); assert(event==e);' +
      'assert(document==doc); doc.title="restored" end');
    const inside = host.getFunction('inside');
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body title="unused">' +
      '<button id="go" onclick="outside"/></body></rml>');
    document.title = 'before';
    document.getElementById('go').addEventListener('inside', () => {
      // A Node listener does not select a new Lua document/event scope.
      assert.deepEqual(inside.callResults(2), [ 'click', 'before' ]);
    });
    document.getElementById('go').click();
    assert.equal(document.title, 'restored');
    assert.equal(host.getGlobal('event'), null);
    assert.equal(host.getGlobal('document'), null);
  },

  'argument-getter-release-revalidates-before-vm-access': () => {
    const native = require('../../build/Release/rmlui.node');
    const args = [ 1 ];
    const handle = native.compileLuaFunction(
      native.createLuaScriptHost(false, false), 'return ...', '', 1);
    Object.defineProperty(args, 0, {
      get() {
        native.releaseLuaFunction(handle);
        return 1;
      },
    });
    assert.throws(() => native.invokeLuaFunction(handle, args, 1),
      /no longer valid|released/);
  },

  'oversized-call-rejects-before-reading-argument-getters': () => {
    const native = require('../../build/Release/rmlui.node');
    const handle = native.compileLuaFunction(
      native.createLuaScriptHost(false, false), 'return 1', '', 1);
    const args = new Array(1000000);
    Object.defineProperty(args, 0, {
      get() {
        throw new Error('Oversized arguments must not invoke getters');
      },
    });
    assert.throws(() => native.invokeLuaFunction(handle, args, 0),
      /Too many Lua arguments/);
    assert.deepEqual(native.invokeLuaFunction(handle, [], 1), [ 1n ]);
  },

  'file-execution-uses-selected-file-interface': ({ rmlui, files }) => {
    const host = new rmlui.LuaScriptHost();
    host.executeFile('virtual.lua');
    assert.equal(host.getGlobal('fileValue'), 31n);
    assert.deepEqual(files, [ 'virtual.lua' ]);
    assert.throws(() => host.executeFile('missing.lua'), /Failed to open/);
    assert.throws(() => host.executeFile('error.lua'),
      /error.lua:2.*file failure/s);
    assert.throws(() => host.executeFile('invalid\0path'), /null byte/);
    assert.equal(host.compile('return fileValue').call(), 31n);
  },

  'file-syntax-errors-are-not-silent': ({ rmlui }) => {
    const host = new rmlui.LuaScriptHost();
    assert.throws(() => host.executeFile('syntax.lua'), /syntax.lua:2/);
    host.executeFile('virtual.lua');
    assert.equal(host.getGlobal('fileValue'), 31n);
  },

  'shutdown-invalidates-captured-vm-generation': ({ rmlui, window }) => {
    const host = new rmlui.LuaScriptHost();
    const reference = host.compile('return 1');
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => reference.call(), /no longer valid/);
    assert.throws(() => reference.release(), /no longer valid/);
    assert.throws(() => host.compile('return 2'), /no longer valid/);
    assert.equal(new rmlui.LuaScriptHost().compile('return 3').call(), 3n);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const files = [];
  if (name.startsWith('file-')) {
    rmlui.setFileInterface(new rmlui.FileInterface({
      open(source) {
        files.push(source);
        if (source === 'virtual.lua') {
          return Buffer.from('fileValue=31');
        }
        if (source === 'error.lua') {
          return Buffer.from('\nerror("file failure")');
        }
        if (source === 'syntax.lua') {
          return Buffer.from('\nlocal =');
        }
        return null;
      },
    }));
  }
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(180, 120)), 'Lua functions');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, window, files,
      context: rmlui.createContext('lua-functions', 180, 120),
    });
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
    const result = spawnSync(
      process.execPath, [ '--expose-gc', __filename, name ], {
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
  assert.equal(failures, 0, `${failures} Lua function failures`);
}
