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
  'plugin-late-registration-and-fixed-event-mask': ({ rmlui }) => {
    const calls = [];
    let masks = 0;
    const callbacks = {
      getEventClasses() {
        ++masks;
        return rmlui.PluginEventClasses.Document;
      },
      onInitialise() {
        calls.push('initialise');
      },
      onShutdown() {
        calls.push('shutdown');
      },
      onContextCreate() {
        calls.push('context');
      },
      onDocumentLoad(document) {
        calls.push(document.tagName);
        assert.equal(document.title, '');
      },
    };
    const plugin = new rmlui.Plugin(callbacks);
    rmlui.registerPlugin(plugin);
    callbacks.onInitialise = () => assert.fail('callback table not captured');
    callbacks.getEventClasses = () => rmlui.PluginEventClasses.All;
    const context = rmlui.createContext('late', 160, 120);
    context.createDocument();
    assert.deepEqual(calls, [ 'initialise', 'body' ]);
    assert.equal(masks, 1);
    assert.equal(rmlui.unregisterPlugin(plugin), true);
    assert.equal(rmlui.unregisterPlugin(plugin), false);
    assert.deepEqual(calls, [ 'initialise', 'body', 'shutdown' ]);
    assert.equal(masks, 1);
  },

  'plugin-self-removal-keeps-notification-order': ({ rmlui }) => {
    const calls = [];
    const first = new rmlui.Plugin({
      getEventClasses: () => rmlui.PluginEventClasses.Basic,
      onContextCreate(context) {
        calls.push(`first:${context.name}`);
        assert.equal(rmlui.unregisterPlugin(first), true);
      },
      onShutdown() {
        calls.push('first:shutdown');
      },
    });
    const second = new rmlui.Plugin({
      getEventClasses: () => rmlui.PluginEventClasses.Basic,
      onContextCreate(context) {
        calls.push(`second:${context.name}`);
      },
    });
    rmlui.registerPlugin(first);
    rmlui.registerPlugin(second);
    rmlui.createContext('self-removal', 160, 120);
    rmlui.createContext('remaining', 160, 120);
    assert.deepEqual(calls, [
      'first:self-removal', 'first:shutdown', 'second:self-removal',
      'second:remaining',
    ]);
  },

  'plugin-context-and-element-borrows-expire': ({ rmlui }) => {
    let borrowedContext;
    let borrowedDimensions;
    let borrowedElement;
    const plugin = new rmlui.Plugin({
      onContextCreate(context) {
        borrowedContext = context;
        borrowedDimensions = context.dimensions;
        assert.equal(context.name, 'borrowed');
        assert.deepEqual([
          context.dimensions.width, context.dimensions.height,
        ], [ 160, 120 ]);
        assert.throws(() => context.remove(), /callback/i);
        assert.throws(() => context.update(), /callback/i);
      },
      onElementDestroy(element) {
        if (element.id === 'destroy-me') {
          borrowedElement = element;
          assert.equal(element.tagName, 'div');
          assert.equal(element.getAttribute('data-value'), 'alive');
          assert.throws(() => {
            element.id = 'changed';
          }, /callback/i);
        }
      },
    });
    rmlui.registerPlugin(plugin);
    const context = rmlui.createContext('borrowed', 160, 120);
    assert.throws(() => borrowedContext.name, /valid/i);
    assert.deepEqual([
      borrowedDimensions.width, borrowedDimensions.height,
    ], [ 0, 0 ]);
    const document = context.createDocument();
    document.innerRML = '<div id="destroy-me" data-value="alive"/>';
    document.innerRML = '';
    assert.ok(borrowedElement);
    assert.throws(() => borrowedElement.tagName, /valid/i);
    assert.equal(context.name, 'borrowed');
  },

  'plugin-preinitialisation-and-global-shutdown-masks': ({ rmlui, window }) => {
    rmlui.shutdown();
    const calls = [];
    const basic = new rmlui.Plugin({
      getEventClasses: () => rmlui.PluginEventClasses.Basic,
      onInitialise() {
        calls.push('basic:init');
      },
      onShutdown() {
        calls.push('basic:shutdown');
      },
    });
    const document = new rmlui.Plugin({
      getEventClasses: () => rmlui.PluginEventClasses.Document,
      onInitialise() {
        calls.push('document:init');
      },
      onShutdown() {
        calls.push('document:shutdown');
      },
    });
    rmlui.registerPlugin(basic);
    rmlui.registerPlugin(document);
    assert.deepEqual(calls, []);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.deepEqual(calls, [ 'basic:init' ]);
    rmlui.shutdown();
    assert.deepEqual(calls, [ 'basic:init', 'basic:shutdown' ]);
    assert.throws(() => rmlui.registerPlugin(basic), /valid/i);
  },

  'plugin-all-eleven-notifications-use-live-native-objects': ({ rmlui }) => {
    const calls = [];
    const documentFile = path.join(__dirname,
      '../../examples/streams/panel.rml');
    // Rml::StreamFile replaces colons with pipes in its source URL.
    const documentURL = documentFile.replace(/:/g, '|');
    let createdModel;
    let destroyedModel;
    let createdElement;
    let destroyedContext;
    const plugin = new rmlui.Plugin({
      onInitialise() {
        calls.push('initialise');
      },
      onShutdown() {
        calls.push('shutdown');
      },
      onContextCreate(context) {
        calls.push(`context-create:${context.name}`);
      },
      onContextDestroy(context) {
        destroyedContext = context;
        calls.push(`context-destroy:${context.name}`);
      },
      onDocumentOpen(context, documentPath) {
        assert.equal(context.name, 'all-notices');
        assert.equal(documentPath, documentURL);
        calls.push('document-open');
      },
      onDocumentLoad(document) {
        assert.equal(document.tagName, 'body');
        calls.push('document-load');
      },
      onDocumentUnload(document) {
        assert.equal(document.tagName, 'body');
        calls.push('document-unload');
      },
      onElementCreate(element) {
        if (element.id === 'native-element') {
          createdElement = element;
          calls.push('element-create');
        }
      },
      onElementDestroy(element) {
        if (element.id === 'native-element') {
          calls.push('element-destroy');
        }
      },
      onDataModelCreate(context, name) {
        assert.equal(name, 'native-model');
        createdModel = context.getDataModel(name);
        assert.ok(createdModel);
        calls.push('model-create');
      },
      onDataModelDestroy(context, name) {
        assert.equal(context.name, 'all-notices');
        assert.equal(name, 'native-model');
        destroyedModel = context.getDataModel(name);
        assert.equal(destroyedModel, createdModel);
        calls.push('model-destroy');
      },
    });
    rmlui.registerPlugin(plugin);
    const context = rmlui.createContext('all-notices', 160, 120);
    const document = context.createDocument();
    document.innerRML = '<div id="native-element"/>';
    assert.ok(createdElement);
    assert.throws(() => createdElement.tagName, /valid/i);
    context.createDataModel('native-model');
    assert.equal(context.removeDataModel('native-model'), true);
    assert.ok(destroyedModel);
    document.innerRML = '';
    context.loadDocument(documentFile);
    context.remove();
    assert.throws(() => destroyedContext.name, /valid/i);
    rmlui.unregisterPlugin(plugin);
    for (const expected of [
      'initialise', 'shutdown', 'context-create:all-notices',
      'context-destroy:all-notices', 'document-open', 'document-load',
      'document-unload', 'element-create', 'element-destroy',
      'model-create', 'model-destroy',
    ]) {
      assert.ok(calls.includes(expected), expected);
    }
    assert.ok(calls.indexOf('document-open') <
      calls.lastIndexOf('document-load'));
  },

  'plugin-late-initialise-can-cancel-its-own-registration': ({ rmlui }) => {
    const calls = [];
    const plugin = new rmlui.Plugin({
      onInitialise() {
        calls.push('initialise');
        assert.equal(rmlui.unregisterPlugin(plugin), true);
        assert.equal(rmlui.unregisterPlugin(plugin), false);
        assert.throws(() => rmlui.registerPlugin(plugin), /changing/i);
      },
      onShutdown() {
        calls.push('shutdown');
        assert.equal(rmlui.unregisterPlugin(plugin), false);
      },
      onContextCreate() {
        assert.fail('cancelled plugin received a notification');
      },
    });
    rmlui.registerPlugin(plugin);
    rmlui.createContext('cancelled', 160, 120);
    assert.deepEqual(calls, [ 'initialise', 'shutdown' ]);
    assert.equal(rmlui.unregisterPlugin(plugin), false);
  },

  'plugin-removal-and-addition-during-traversal': ({ rmlui }) => {
    const calls = [];
    const appended = new rmlui.Plugin({
      onInitialise() {
        calls.push('appended:init');
      },
      onContextCreate(context) {
        calls.push(`appended:${context.name}`);
      },
    });
    const removed = new rmlui.Plugin({
      onContextCreate() {
        assert.fail('removed subscriber called');
      },
    });
    const first = new rmlui.Plugin({
      onContextCreate(context) {
        calls.push(`first:${context.name}`);
        if (context.name === 'edit-registry') {
          rmlui.unregisterPlugin(removed);
          rmlui.registerPlugin(appended);
        }
      },
    });
    rmlui.registerPlugin(first);
    rmlui.registerPlugin(removed);
    rmlui.createContext('edit-registry', 160, 120);
    assert.deepEqual(calls, [ 'first:edit-registry', 'appended:init' ]);
    rmlui.createContext('following', 160, 120);
    assert.deepEqual(calls, [
      'first:edit-registry', 'appended:init',
      'first:following', 'appended:following',
    ]);
  },

  'plugin-errors-preserve-native-teardown-and-expire-borrows': ({ rmlui }) => {
    let borrowed;
    const failure = new Error('plugin-destroy-failure');
    const plugin = new rmlui.Plugin({
      onContextDestroy(context) {
        borrowed = context;
        assert.equal(context.name, 'throwing');
        throw failure;
      },
    });
    rmlui.registerPlugin(plugin);
    const context = rmlui.createContext('throwing', 160, 120);
    assert.throws(() => context.remove(), error => error === failure);
    assert.throws(() => borrowed.name, /valid/i);
    assert.throws(() => context.name, /valid/i);
    assert.equal(rmlui.getContext('throwing'), null);
    rmlui.unregisterPlugin(plugin);
    assert.equal(rmlui.createContext('after-error', 160, 120).name,
      'after-error');
  },

  'plugin-rejects-invalid-masks-callbacks-and-async-returns':
    async ({ rmlui }) => {
      assert.throws(() => new rmlui.Plugin(null), /callbacks/i);
      assert.throws(() => new rmlui.Plugin({ onShutdown: 3 }), /functions/i);
      assert.throws(() => rmlui.registerPlugin({}), /Plugin/i);
      for (const mask of [ -1, 16, 1.5, NaN, '1', Promise.resolve(1) ]) {
        const plugin = new rmlui.Plugin({ getEventClasses: () => mask });
        assert.throws(() => rmlui.registerPlugin(plugin), /mask/i);
        assert.equal(rmlui.unregisterPlugin(plugin), false);
      }
      const plugin = new rmlui.Plugin({
        onContextCreate: async () => {
          throw new Error('async-rejection-must-be-consumed');
        },
      });
      rmlui.registerPlugin(plugin);
      assert.throws(() => rmlui.createContext('async', 160, 120),
        /undefined synchronously/i);
      assert.ok(rmlui.getContext('async'));
      rmlui.unregisterPlugin(plugin);
      await new Promise(resolve => setImmediate(resolve));
    },

  'plugin-registered-native-owner-and-collected-unregistered-cycle':
    async ({ rmlui }) => {
      let notifications = 0;
      let registered;
      (() => {
        const payload = {};
        registered = new WeakRef(payload);
        rmlui.registerPlugin(new rmlui.Plugin({
          onContextCreate() {
            assert.ok(payload);
            ++notifications;
          },
        }));
      })();
      await collect();
      assert.ok(registered.deref());
      rmlui.createContext('gc-registration', 160, 120);
      assert.equal(notifications, 1);
      let cycle;
      (() => {
        const plugin = new rmlui.Plugin({
          onInitialise() {
            assert.ok(plugin);
          },
        });
        cycle = new WeakRef(plugin);
        rmlui.registerPlugin(plugin);
        rmlui.unregisterPlugin(plugin);
      })();
      await collect();
      assert.equal(cycle.deref(), undefined);
      rmlui.shutdown();
      await collect();
      assert.equal(registered.deref(), undefined);
    },

  'plugin-static-frames-add-zero-host-callbacks': ({ rmlui }) => {
    const native = require('../../build/Release/rmlui.node');
    const context = rmlui.createContext('static-plugin', 160, 120);
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>body{display:block;margin:0;width:160px;' +
      'height:120px;}div{display:block;width:20px;height:20px;' +
      'background-color:#f00;}</style></head><body><div/></body></rml>');
    document.show();
    context.update();
    context.render();
    rmlui.registerPlugin(new rmlui.Plugin({
      getEventClasses: () => rmlui.PluginEventClasses.DataModel,
      onElementCreate() {
        assert.fail('unsubscribed element callback');
      },
      onContextCreate() {
        assert.fail('unsubscribed context callback');
      },
    }));
    native.beginDataDiagnostics(false);
    for (let i = 0; i < 20; ++i) {
      context.update();
      context.render();
    }
    const counters = native.endDataDiagnostics();
    assert.equal(counters.runtimeEntries, 40);
    assert.equal(counters.nativeCallbacks, 0);
    assert.equal(counters.callbacks.plugin, 0);
    assert.equal(counters.geometryUploads, 0);
    assert.equal(counters.geometryDraws, 20);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Plugin contracts');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
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
  assert.equal(failures, 0, `${failures} plugin failures`);
}
