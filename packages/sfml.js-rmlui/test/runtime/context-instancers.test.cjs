'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'direct-context-constructor-preserves-native-defaults-and-ownership':
    ({ rmlui, context }) => {
      const manager = context.getRenderManager();
      const owned = new rmlui.Context(context.name, manager, null);
      assert.equal(owned.name, context.name);
      assert.equal(owned.getRenderManager(), manager);
      assert.equal(owned.getTextInputHandler(), null);
      assert.deepEqual([ owned.dimensions.width, owned.dimensions.height ],
        [ 0, 0 ]);
      assert.equal(owned.densityIndependentPixelRatio, 1);
      assert.equal(rmlui.getContext(context.name), context);
      owned.setDimensions(160, 120);
      const document = owned.createDocument();
      document.innerRML = '<div id="owned"/>';
      assert.equal(owned.update(), true);
      assert.equal(owned.remove(), true);
      assert.throws(() => document.title, /valid/i);
      assert.throws(() => owned.getTextInputHandler(), /valid/i);
      assert.equal(rmlui.getContext(context.name), context);
    },

  'direct-context-constructor-delegates-with-the-exact-input-handler':
    ({ rmlui, context }) => {
      const handler = context.getTextInputHandler();
      assert.ok(handler instanceof rmlui.TextInputHandler);
      const calls = [];
      rmlui.Factory.registerContextInstancer(
        new rmlui.ContextInstancer((name, manager, input) => {
          calls.push(name);
          assert.equal(input, handler);
          return new rmlui.Context(name, manager, input);
        }));
      const created = rmlui.createContext('direct-custom', 160, 120);
      assert.deepEqual(calls, [ 'direct-custom' ]);
      assert.equal(created.getTextInputHandler(), handler);
      const owned = new rmlui.Context('direct-owned',
        created.getRenderManager(), handler);
      assert.equal(owned.getTextInputHandler(), handler);
      assert.equal(rmlui.getContext('direct-owned'), null);
      owned.remove();
      created.remove();
    },

  'direct-context-constructor-checks-arguments-and-runtime-restarts':
    ({ rmlui, context, window }) => {
      const manager = context.getRenderManager();
      const handler = context.getTextInputHandler();
      assert.throws(() => new rmlui.Context('bad', {}, null), /manager/i);
      assert.throws(() => new rmlui.Context('bad', manager, {}), /handler/i);
      assert.throws(() => new rmlui.Context('bad', manager),
        /handler/i);
      const owned = new rmlui.Context('stale', manager, handler);
      rmlui.shutdown();
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => owned.name, /valid/i);
      const fresh = rmlui.createContext('fresh', 160, 120);
      assert.throws(() => new rmlui.Context('bad', manager, null), /valid/i);
      assert.throws(() => new rmlui.Context('bad',
        fresh.getRenderManager(), handler), /valid/i);
      const next = new rmlui.Context('new',
        fresh.getRenderManager(), fresh.getTextInputHandler());
      assert.equal(next.update(), true);
      next.remove();
    },

  'direct-context-construction-has-one-native-entry-and-no-host-callback':
    ({ rmlui, context }) => {
      const native = require('../../build/Release/rmlui.node');
      const manager = context.getRenderManager();
      native.beginDataDiagnostics(false);
      const owned = new rmlui.Context('measured', manager, null);
      const construction = native.endDataDiagnostics();
      assert.equal(construction.runtimeEntries, 1);
      assert.equal(construction.nativeCallbacks, 0);
      native.beginDataDiagnostics(false);
      owned.remove();
      const destruction = native.endDataDiagnostics();
      assert.equal(destruction.runtimeEntries, 1);
      assert.equal(destruction.nativeCallbacks, 0);
    },

  'owned-context-tween-closure-and-native-input-leases-collect':
    async ({ rmlui, context }) => {
      let contextWeak;
      let callbackWeak;
      (() => {
        const owned = new rmlui.Context('cycle',
          context.getRenderManager(), context.getTextInputHandler());
        contextWeak = new WeakRef(owned);
        const document = owned.createDocument();
        document.innerRML = '<div id="animated"/>';
        const child = document.getElementById('animated');
        const callback = t => {
          assert.equal(owned.name, 'cycle');
          return t;
        };
        callbackWeak = new WeakRef(callback);
        child.animate('width', new rmlui.Property(40, rmlui.Unit.PX),
          60, new rmlui.Tween(callback), 1, false, 0,
          new rmlui.Property(1, rmlui.Unit.PX));
      })();
      await collect();
      assert.equal(contextWeak.deref(), undefined);
      assert.equal(callbackWeak.deref(), undefined);
      assert.equal(context.update(), true);
    },

  'factory-context-is-owned-unregistered-and-exact-manager':
    ({ rmlui, context }) => {
      const manager = context.getRenderManager();
      const owned = rmlui.Factory.instanceContext('standalone', manager, null);
      assert.ok(owned instanceof rmlui.Context);
      assert.equal(owned.name, 'standalone');
      assert.equal(owned.getRenderManager(), manager);
      assert.equal(rmlui.getContext('standalone'), null);
      assert.equal(rmlui.getNumContexts(), 1);
      owned.setDimensions(140, 100);
      const dimensions = owned.dimensions;
      assert.equal(dimensions.width, 140);
      const document = owned.createDocument();
      document.innerRML = '<input id="field" type="text" value="原生"/>';
      assert.equal(document.getElementById('field').getValue(), '原生');
      assert.equal(owned.update(), true);
      assert.equal(owned.remove(), true);
      assert.equal(dimensions.width, 0);
      assert.throws(() => owned.name, /valid/i);
      assert.throws(() => document.title, /valid/i);
      assert.equal(rmlui.getNumContexts(), 1);
    },

  'custom-context-instancer-real-core-creation-and-release-order':
    ({ rmlui, context }) => {
      const allocator = new rmlui.ContextInstancer();
      const calls = [];
      const releases = [];
      let inputHandler;
      const inner = new rmlui.ContextInstancer((name, manager, handler) => {
        calls.push(`inner:${name}`);
        assert.equal(handler, inputHandler);
        assert.ok(handler instanceof rmlui.TextInputHandler);
        assert.equal(handler.isValid, true);
        return allocator.instanceContext(name, manager, handler);
      }, snapshot => releases.push(`inner:${snapshot.name}`));
      const outer = new rmlui.ContextInstancer((name, manager, handler) => {
        calls.push(`outer:${name}`);
        inputHandler = handler;
        assert.throws(() => context.update(), /callback/i);
        assert.throws(() => rmlui.Factory.registerContextInstancer(outer),
          /callback/i);
        assert.throws(() => outer.instanceContext(name, manager, handler),
          /recursive/i);
        return inner.instanceContext(name, manager, handler);
      }, snapshot => releases.push(`outer:${snapshot.name}`));
      rmlui.Factory.registerContextInstancer(outer);
      const created = rmlui.createContext('custom', 123, 87);
      assert.equal(created.dimensions.width, 123);
      assert.equal(rmlui.getContext('custom'), created);
      assert.deepEqual(calls, [ 'outer:custom', 'inner:custom' ]);
      assert.throws(() => outer.releaseContext(created), /owned|registered/i);
      const next = new rmlui.ContextInstancer(() => null);
      rmlui.Factory.registerContextInstancer(next);
      assert.equal(created.remove(), true);
      assert.deepEqual(releases, [ 'outer:custom', 'inner:custom' ]);
      assert.throws(() => rmlui.createContext('declined', 10, 10),
        /create|instancer/i);
      assert.equal(rmlui.Factory.instanceContext('declined',
        context.getRenderManager(), null), null);
    },

  'owned-context-release-is-exact-and-name-collision-preserves-registry':
    ({ rmlui, context }) => {
      const first = new rmlui.ContextInstancer();
      const second = new rmlui.ContextInstancer();
      const owned = first.instanceContext(context.name,
        context.getRenderManager(), null);
      assert.throws(() => second.releaseContext(owned), /instancer/i);
      assert.equal(owned.remove(), true);
      assert.equal(rmlui.getContext(context.name), context);
      assert.equal(rmlui.getNumContexts(), 1);
      assert.throws(() => first.releaseContext(owned), /valid/i);
      assert.throws(() => new rmlui.ContextInstancer(4), /callback/i);
      assert.throws(() => rmlui.Factory.registerContextInstancer(null),
        /instancer/i);
    },

  'owned-context-descendants-retain-owner-and-closure-cycles-collect':
    async ({ rmlui, context }) => {
      const allocator = new rmlui.ContextInstancer();
      let weak;
      let child;
      let callbackWeak;
      (() => {
        const owned = allocator.instanceContext('collectable',
          context.getRenderManager(), null);
        weak = new WeakRef(owned);
        const document = owned.createDocument();
        document.innerRML = '<div id="child"/>';
        child = document.getElementById('child');
        const callback = () => assert.equal(owned.name, 'collectable');
        callbackWeak = new WeakRef(callback);
        child.addEventListener('owner', callback);
      })();
      await collect();
      assert.ok(weak.deref());
      child.dispatchEvent('owner');
      child = null;
      await collect();
      assert.equal(weak.deref(), undefined);
      assert.equal(callbackWeak.deref(), undefined);
      assert.equal(context.update(), true);
    },

  'context-instancer-exceptions-and-invalid-results-are-checked':
    ({ rmlui, context }) => {
      const manager = context.getRenderManager();
      const error = new Error('context allocation failed');
      const bad = new rmlui.ContextInstancer(() => {
        throw error;
      });
      rmlui.Factory.registerContextInstancer(bad);
      assert.throws(() => rmlui.createContext('throws', 10, 10),
        value => value === error);
      for (const result of [ context, {}, undefined ]) {
        const instancer = new rmlui.ContextInstancer(() => result);
        assert.throws(() => instancer.instanceContext('bad', manager, null),
          /owned|context|handle/i);
      }
      const allocator = new rmlui.ContextInstancer();
      const wrongName = new rmlui.ContextInstancer((name, renderer, handler) =>
        allocator.instanceContext(`${name}-wrong`, renderer, handler));
      assert.throws(() => wrongName.instanceContext('checked', manager, null),
        /name/i);
      const custom = new rmlui.ContextInstancer((name, renderer, handler) =>
        allocator.instanceContext(name, renderer, handler), () => {
        throw new Error('context release failed');
      });
      const owned = custom.instanceContext('release', manager, null);
      assert.throws(() => custom.releaseContext(owned),
        /context release failed/);
      assert.throws(() => owned.name, /valid/i);
      assert.equal(rmlui.getNumContexts(), 1);
    },

  'context-instancers-and-factory-documents-die-before-runtime-restart':
    async ({ rmlui, window, context }) => {
      const allocator = new rmlui.ContextInstancer();
      let releases = 0;
      const custom = new rmlui.ContextInstancer((name, manager, handler) =>
        allocator.instanceContext(name, manager, handler),
      () => ++releases);
      rmlui.Factory.registerContextInstancer(custom);
      const owned = rmlui.Factory.instanceContext('shutdown',
        context.getRenderManager(), null);
      const document = rmlui.Factory.instanceDocumentStream(owned,
        new rmlui.StreamMemory(Buffer.from(
          '<rml><head/><body><div id="child"/></body></rml>')), 'body');
      const child = document.getElementById('child');
      rmlui.shutdown();
      assert.equal(releases, 1);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => owned.name, /valid/i);
      assert.throws(() => document.title, /valid/i);
      assert.throws(() => child.id, /valid/i);
      const fresh = rmlui.createContext('fresh', 160, 120);
      assert.throws(() => allocator.instanceContext('old',
        fresh.getRenderManager(), null), /valid/i);
      await collect();
    },

  'owned-context-borrowed-manager-cannot-be-released-while-used':
    ({ rmlui, context }) => {
      const manager = context.getRenderManager();
      const owned = rmlui.Factory.instanceContext('orphan', manager, null);
      const document = owned.createDocument();
      rmlui.removeContext(context.name);
      assert.throws(() => rmlui.releaseRenderManagers(),
        /owned context|borrowed render manager/i);
      owned.setDimensions(120, 80);
      document.innerRML = '<div id="still-live"/>';
      assert.equal(document.getElementById('still-live').id, 'still-live');
      assert.equal(owned.update(), true);
      owned.remove();
      rmlui.releaseRenderManagers();
      assert.throws(() => manager.getViewport(), /valid/i);
    },

  'first-core-context-custom-instancer-receives-correct-renderer':
    ({ rmlui, context }) => {
      const allocator = new rmlui.ContextInstancer();
      rmlui.removeContext(context.name);
      rmlui.releaseRenderManagers();
      rmlui.Factory.registerContextInstancer(
        new rmlui.ContextInstancer((name, manager, handler) =>
          allocator.instanceContext(name, manager, handler)));
      const created = rmlui.createContext('first', 160, 120);
      assert.equal(created.renderInterface, rmlui.getRenderInterface());
      assert.equal(created.update(), true);
      created.remove();
    },

  'reparented-element-does-not-retain-its-old-owned-context':
    async ({ rmlui, context }) => {
      const allocator = new rmlui.ContextInstancer();
      const destination = context.createDocument();
      let moved;
      let weak;
      (() => {
        const owned = allocator.instanceContext('source',
          context.getRenderManager(), null);
        weak = new WeakRef(owned);
        const document = owned.createDocument();
        document.innerRML = '<div id="moved"/>';
        moved = document.getElementById('moved');
        document.removeChild(moved);
        destination.appendChild(moved);
      })();
      await collect();
      assert.equal(weak.deref(), undefined);
      assert.equal(moved.getOwnerDocument(), destination);
      assert.equal(moved.id, 'moved');
    },

  'reparented-rendered-element-retains-original-owned-manager':
    async ({ rmlui, context }) => {
      const allocator = new rmlui.ContextInstancer();
      const destination = context.createDocument();
      destination.show();
      let moved;
      let weak;
      (() => {
        const manager = new rmlui.RenderManager(context.renderInterface);
        const owned = allocator.instanceContext('render-source', manager, null);
        weak = new WeakRef(owned);
        owned.setDimensions(160, 120);
        const document = owned.createDocument();
        document.innerRML = '<div id="moved" style="' +
          'width:80px;height:40px;background:#eab541"/>';
        document.show();
        owned.update();
        owned.render();
        moved = document.getElementById('moved');
        document.removeChild(moved);
        destination.appendChild(moved);
      })();
      await collect();
      assert.equal(weak.deref(), undefined);
      context.update();
      assert.equal(context.render(), true);
      assert.equal(moved.id, 'moved');
      destination.innerRML = '';
      context.update();
      assert.throws(() => moved.id, /valid/i);
    },

  'owned-manager-font-textures-release-before-manager-and-runtime':
    async ({ rmlui, context, window }) => {
      assert.ok(rmlui.loadFontFace(path.join(__dirname,
        '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
      let weak;
      (() => {
        const manager = new rmlui.RenderManager(context.renderInterface);
        weak = new WeakRef(manager);
        const owned = rmlui.Factory.instanceContext('fonts', manager, null);
        owned.setDimensions(160, 120);
        const document = owned.createDocument();
        document.innerRML = '<div style="font-family:LatoLatin;' +
          'font-size:16px;color:white;">Cached native glyphs</div>';
        document.show();
        assert.equal(owned.update(), true);
        assert.equal(owned.render(), true);
        owned.remove();
      })();
      await collect();
      assert.equal(weak.deref(), undefined);
      rmlui.shutdown();
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.equal(rmlui.createContext('fresh-fonts', 160, 120).update(), true);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Context instancers');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('instancers', 160, 120);
    await cases[name]({ rmlui, window, context });
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
  assert.equal(failures, 0, `${failures} context instancer failures`);
}
