'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'context-inherits-actual-native-script-interface':
    ({ rmlui, document }) => {
      const context = document.getContext();
      const base = rmlui.ScriptInterface.getStaticClassIdentifier();
      assert.ok(context instanceof rmlui.ScriptInterface);
      assert.equal(rmlui.Context.getStaticClassIdentifier(), base);
      assert.equal(context.getClassIdentifier(), base);
      assert.equal(context.isClass(base), true);
      assert.equal(context.isClass(
        rmlui.Element.getStaticClassIdentifier()), false);
      assert.equal(context.getScriptObject(), null);
      const object = { value: 61 };
      context.setScriptObject(object);
      assert.equal(context.getScriptObject(), object);
      context.setScriptObject(null);
      assert.equal(context.getScriptObject(), null);
      assert.throws(() => context.release(), /owned|registered/i);
      assert.equal(context.name, 'scripts');
    },

  'registered-context-retains-script-until-removal':
    async ({ rmlui }) => {
      let weak;
      (() => {
        const context = rmlui.createContext('script-root', 160, 120);
        const object = { context };
        context.setScriptObject(object);
        weak = new WeakRef(object);
      })();
      await collect();
      const context = rmlui.getContext('script-root');
      assert.equal(context.getScriptObject().context, context);
      context.remove();
      assert.throws(() => context.getScriptObject(), /valid/i);
      await collect();
      assert.equal(weak.deref(), undefined);
    },

  'owned-context-script-cycle-is-collectible':
    async ({ rmlui, document }) => {
      let weakContext;
      let weakObject;
      (() => {
        const context = new rmlui.Context(
          'script-owned', document.getContext().getRenderManager(), null);
        const object = { context };
        context.setScriptObject(object);
        assert.equal(context.getScriptObject(), object);
        weakContext = new WeakRef(context);
        weakObject = new WeakRef(object);
      })();
      await collect();
      assert.equal(weakContext.deref(), undefined);
      assert.equal(weakObject.deref(), undefined);
    },

  'owned-context-root-retains-script-through-gc':
    async ({ rmlui, document }) => {
      const context = new rmlui.Context(
        'live-script-owned', document.getContext().getRenderManager(), null);
      let weak;
      (() => {
        const object = { value: 79 };
        context.setScriptObject(object);
        weak = new WeakRef(object);
      })();
      await collect();
      assert.equal(context.getScriptObject().value, 79);
      context.setScriptObject(null);
      await collect();
      assert.equal(weak.deref(), undefined);
      context.release();
    },

  'context-script-retention-survives-factory-transfer':
    async ({ rmlui }) => {
      const allocator = new rmlui.ContextInstancer();
      let weak;
      const custom = new rmlui.ContextInstancer((...args) => {
        const context = allocator.instanceContext(...args);
        const object = { context, value: 83 };
        weak = new WeakRef(object);
        context.setScriptObject(object);
        return context;
      });
      rmlui.Factory.registerContextInstancer(custom);
      const context = rmlui.createContext('script-transferred', 160, 120);
      rmlui.Factory.registerContextInstancer(new rmlui.ContextInstancer());
      await collect();
      assert.equal(context.getScriptObject().value, 83);
      context.remove();
      await collect();
      assert.equal(weak.deref(), undefined);
    },

  'owned-context-script-release-does-not-remove-registration':
    ({ rmlui, document }) => {
      const registered = document.getContext();
      const context = new rmlui.Context(
        registered.name, registered.getRenderManager(), null);
      context.setScriptObject({ value: 67 });
      context.release();
      assert.throws(() => context.getScriptObject(), /valid/i);
      assert.equal(rmlui.getContext('scripts'), registered);
    },

  'native-script-object-identity-replacement-and-clone':
    ({ rmlui, document }) => {
      const element = document.createElement('input');
      const object = { read: () => element.tagName };
      const replacement = {};
      element.setScriptObject(object);
      assert.equal(element.getScriptObject(), object);
      assert.equal(element.getScriptObject().read(), 'input');
      assert.equal(element.isClass(
        rmlui.Element.getStaticClassIdentifier()), true);
      assert.equal(element.clone().getScriptObject(), null);
      element.setScriptObject(replacement);
      assert.equal(element.getScriptObject(), replacement);
      for (const invalid of [ undefined, 1, 'object', true ]) {
        assert.throws(() => element.setScriptObject(invalid), /object|null/i);
        assert.equal(element.getScriptObject(), replacement);
      }
      element.setScriptObject(null);
      assert.equal(element.getScriptObject(), null);
      element.release();
      assert.throws(() => element.setScriptObject({}), /valid/i);
    },

  'native-tree-retains-script-object-without-wrapper':
    async ({ document }) => {
      let weak;
      (() => {
        const child = document.createElement('div');
        child.id = 'script-owner';
        const object = { child, value: 73 };
        child.setScriptObject(object);
        weak = new WeakRef(object);
        document.appendChild(child);
      })();
      await collect();
      assert.equal(document.getElementById('script-owner')
        .getScriptObject().value, 73);
      assert.ok(weak.deref());
      document.innerRML = '';
      await collect();
      assert.equal(weak.deref(), undefined);
    },

  'detached-script-object-survives-parent-transfer':
    async ({ document }) => {
      const parent = document.createElement('div');
      (() => {
        const child = document.createElement('span');
        child.setScriptObject({ value: 89 });
        parent.appendChild(child);
      })();
      await collect();
      assert.equal(parent.getChild(0).getScriptObject().value, 89);
      document.appendChild(parent);
      await collect();
      const detached = parent.removeChild(parent.getChild(0));
      assert.equal(detached.getScriptObject().value, 89);
      detached.release();
      document.removeChild(parent);
      parent.release();
    },

  'detached-script-object-wrapper-cycle-is-collectible':
    async ({ rmlui }) => {
      let weakElement;
      let weakObject;
      (() => {
        const element = new rmlui.Element('div');
        const object = { element };
        element.setScriptObject(object);
        weakElement = new WeakRef(element);
        weakObject = new WeakRef(object);
      })();
      await collect();
      assert.equal(weakElement.deref(), undefined);
      assert.equal(weakObject.deref(), undefined);
    },

  'owned-event-script-object-cycle-is-collectible': async ({ rmlui }) => {
    let weakEvent;
    let weakObject;
    (() => {
      const event = new rmlui.RmlEvent();
      const object = { event };
      event.setScriptObject(object);
      assert.equal(event.getScriptObject(), object);
      weakEvent = new WeakRef(event);
      weakObject = new WeakRef(object);
    })();
    await collect();
    assert.equal(weakEvent.deref(), undefined);
    assert.equal(weakObject.deref(), undefined);
  },

  'borrowed-script-object-is-shared-by-native-event':
    ({ document }) => {
      const target = document.createElement('div');
      let first;
      let script;
      target.addEventListener('script', event => {
        first = event;
        script = { value: 31 };
        event.setScriptObject(script);
      });
      target.addEventListener('script', event => {
        assert.throws(() => first.getScriptObject(), /expired/i);
        assert.equal(event.getScriptObject(), script);
        event.setScriptObject(null);
        assert.equal(event.getScriptObject(), null);
      });
      target.dispatchEvent('script');
      assert.throws(() => first.setScriptObject({}), /expired/i);
      target.release();
    },

  'script-object-survives-native-event-allocation-transfer':
    async ({ rmlui, document }) => {
      const allocator = new rmlui.EventInstancer();
      let transferred;
      let weak;
      const custom = new rmlui.EventInstancer((...args) => {
        transferred = allocator.instanceEvent(...args);
        const object = { value: 47 };
        weak = new WeakRef(object);
        transferred.setScriptObject(object);
        global.gc();
        return transferred;
      });
      rmlui.Factory.registerEventInstancer(custom);
      const target = document.createElement('div');
      target.addEventListener('script-transfer', event => {
        global.gc();
        assert.equal(event.getScriptObject().value, 47);
        assert.throws(() => transferred.getScriptObject(), /expired|valid/i);
      });
      target.dispatchEvent('script-transfer');
      rmlui.Factory.registerEventInstancer(new rmlui.EventInstancer());
      target.release();
      await collect();
      assert.equal(weak.deref(), undefined);
    },

  'script-object-steady-state-has-no-ownership-scans':
    ({ document }) => {
      const { native } = require('../../dist/internal/native');
      const element = document.createElement('div');
      element.setScriptObject({ value: 101 });
      document.appendChild(element);
      native.beginDataDiagnostics(false);
      for (let i = 0; i < 1000; ++i) {
        assert.equal(element.getScriptObject().value, 101);
      }
      const counts = native.endDataDiagnostics();
      assert.equal(counts.callbackOwnershipPasses.scriptObject, 0);
      assert.equal(counts.callbackLeaseVisits.scriptObject, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
    },

  'script-object-shutdown-restart-rejects-stale-owner':
    ({ rmlui, window, document }) => {
      const event = new rmlui.RmlEvent();
      document.setScriptObject({});
      event.setScriptObject({});
      rmlui.shutdown();
      assert.throws(() => document.setScriptObject({}), /initiali[sz]|valid/i);
      assert.throws(() => event.getScriptObject(), /expired|valid/i);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const fresh = new rmlui.Element('div');
      assert.equal(fresh.getScriptObject(), null);
      assert.throws(() => document.getScriptObject(), /valid/i);
      fresh.release();
    },

  'base-identity-before-initialization': ({ rmlui, base }) => {
    assert.equal(typeof base, 'symbol');
    assert.equal(rmlui.ScriptInterface.getStaticClassIdentifier(), base);
    assert.equal(rmlui.RmlEvent.getStaticClassIdentifier(), base);
    assert.notEqual(rmlui.Element.getStaticClassIdentifier(), base);
    assert.throws(() => new rmlui.ScriptInterface(), /concrete|abstract/i);
  },

  'actual-element-inheritance-and-null-script-object':
    ({ rmlui, document }) => {
      const base = rmlui.ScriptInterface.getStaticClassIdentifier();
      const elements = [
        document, document.createElement('div'),
        document.createElement('input'),
        document.createTextNode('text'), document.createElement('img'),
      ];
      for (const element of elements) {
        assert.ok(element instanceof rmlui.ScriptInterface);
        assert.equal(element.isClass(base), true);
        assert.equal(element.getScriptObject(), null);
        assert.equal(element.clone().getScriptObject(), null);
      }
      const detached = new rmlui.Element('div');
      detached.release();
      assert.throws(() => detached.getScriptObject(), /valid/i);
    },

  'event-inherits-native-base-identity': ({ rmlui }) => {
    const event = new rmlui.RmlEvent();
    const base = rmlui.ScriptInterface.getStaticClassIdentifier();
    assert.ok(event instanceof rmlui.ScriptInterface);
    assert.equal(event.getClassIdentifier(), base);
    assert.equal(event.isClass(base), true);
    assert.equal(event.isClass(
      rmlui.Element.getStaticClassIdentifier()), false);
    assert.equal(event.getScriptObject(), null);
    for (const forged of [ Symbol('RmlUi class'), 0, {}, null ]) {
      assert.throws(() => event.isClass(forged), /class.*identifier/i);
    }
    event.release();
    for (const operation of [
      () => event.getClassIdentifier(), () => event.isClass(base),
      () => event.getScriptObject(),
    ]) {
      assert.throws(operation, /expired|valid/i);
    }
  },

  'borrowed-and-nested-event-leases': ({ rmlui, document }) => {
    let outer;
    let inner;
    const target = document.createElement('div');
    target.addEventListener('inner', event => {
      inner = event;
      assert.equal(event.getScriptObject(), null);
      assert.equal(outer.getScriptObject(), null);
    });
    target.addEventListener('outer', event => {
      outer = event;
      const base = rmlui.ScriptInterface.getStaticClassIdentifier();
      assert.equal(event.isClass(base), true);
      target.dispatchEvent('inner');
      assert.throws(() => inner.getScriptObject(), /expired/i);
      assert.equal(event.getScriptObject(), null);
      assert.throws(() => event.release(), /owned/i);
    });
    target.dispatchEvent('outer');
    assert.throws(() => outer.getClassIdentifier(), /expired/i);
    assert.throws(() => outer.getScriptObject(), /expired/i);
    target.release();
  },

  'typed-element-parameters-fallback-and-canonical-identity':
    ({ document }) => {
      const target = document.createElement('div');
      const element = document.createElement('input');
      target.addEventListener('values', event => {
        assert.equal(event.getElementParameter('element'), element);
        assert.equal(event.getElementParameter('element', target), element);
        assert.equal(event.getElementParameter('missing'), null);
        assert.equal(event.getElementParameter('missing', target), target);
        assert.equal(event.getElementParameter('none', target), target);
        assert.equal(event.getElementParameter('number', target), target);
        assert.equal(event.getElementParameter('text'), null);
        assert.equal(event.getElementParameter('__proto__'), element);
        event.parameters.element = target;
        assert.equal(event.getElementParameter('element'), element);
        assert.throws(() => event.getElementParameter('missing', {}),
          /element|handle/i);
        assert.throws(() => event.getElementParameter(0), /name/i);
      });
      target.dispatchEvent('values', {
        element, none: null, number: 7, text: 'text',
        ['__proto__']: element,
      });
      target.release();
      element.release();
    },

  'owned-element-parameter-guards-destruction': ({ rmlui, document }) => {
    document.innerRML = '<div id="target"/><div id="parameter"/>';
    const target = document.getElementById('target');
    const parameter = document.getElementById('parameter');
    const id = rmlui.registerEventType('owned-pointer', true, true);
    const event = rmlui.Factory.instanceEvent(
      target, id, 'owned-pointer', { element: parameter }, true);
    assert.equal(event.getElementParameter('element'), parameter);
    assert.equal(event.getScriptObject(), null);
    document.innerRML = '';
    assert.throws(() => event.getElementParameter('element'), /destroyed/i);
    assert.throws(() => event.getScriptObject(), /destroyed/i);
    event.release();
  },

  'borrowed-parameter-cannot-be-released-during-dispatch':
    ({ rmlui }) => {
      const target = new rmlui.Element('div');
      const parameter = new rmlui.Element('div');
      const read = event => {
        assert.equal(event.getElementParameter('element'), parameter);
        assert.throws(() => parameter.release(), /active|callback/i);
        assert.equal(event.getElementParameter('element'), parameter);
      };
      target.addEventListener('borrowed-pointer', read);
      target.addEventListener('borrowed-pointer', event => {
        assert.equal(event.getElementParameter('element'), parameter);
      });
      target.dispatchEvent('borrowed-pointer', { element: parameter });
      const owned = rmlui.Factory.instanceEvent(
        target, rmlui.registerEventType('owned-callback', true, true),
        'owned-callback', { element: parameter }, true);
      const listener = new rmlui.EventListener(read);
      listener.processEvent(owned);
      owned.release();
      listener.release();
      parameter.release();
      target.release();
    },

  'receiver-and-native-capability-authenticity': ({ rmlui, document }) => {
    const { native } = require('../../dist/internal/native');
    const event = new rmlui.RmlEvent();
    for (const receiver of [{}, document, Object.create(event) ]) {
      assert.throws(() => rmlui.RmlEvent.prototype.getScriptObject
        .call(receiver), /RmlEvent/i);
      assert.throws(() => rmlui.RmlEvent.prototype.getClassIdentifier
        .call(receiver), /RmlEvent/i);
    }
    assert.throws(() => native.getEventScriptObject(document.handle),
      /handle/i);
    assert.throws(() => native.getElementScriptObject({}), /handle/i);
    event.release();
  },

  'shutdown-restart-and-dead-default-element':
    ({ rmlui, window, document }) => {
      const event = new rmlui.RmlEvent();
      const dead = new rmlui.Element('div');
      dead.release();
      assert.throws(() => event.getElementParameter('missing', dead), /valid/i);
      const base = rmlui.ScriptInterface.getStaticClassIdentifier();
      rmlui.shutdown();
      assert.throws(() => document.getScriptObject(), /initiali[sz]|valid/i);
      assert.throws(() => event.getScriptObject(), /expired|valid/i);
      assert.equal(rmlui.ScriptInterface.getStaticClassIdentifier(), base);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => document.getScriptObject(), /valid/i);
      const fresh = new rmlui.RmlEvent();
      assert.equal(fresh.getClassIdentifier(), base);
      assert.equal(fresh.getScriptObject(), null);
      fresh.release();
      assert.throws(() => event.getClassIdentifier(), /expired|valid/i);
    },

  'owned-event-element-edges-remain-collectible': async ({ rmlui }) => {
    let weakEvent;
    let weakElement;
    (() => {
      const element = new rmlui.Element('div');
      const id = rmlui.registerEventType('collectible', true, true);
      const event = rmlui.Factory.instanceEvent(
        element, id, 'collectible', { element }, true);
      assert.equal(event.getElementParameter('element'), element);
      weakEvent = new WeakRef(event);
      weakElement = new WeakRef(element);
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weakEvent.deref(), undefined);
    assert.equal(weakElement.deref(), undefined);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const base = name === 'base-identity-before-initialization'
    ? rmlui.ScriptInterface.getStaticClassIdentifier() : undefined;
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Script interface');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('scripts', 160, 120);
    await cases[name]({
      rmlui, base, window, document: context.createDocument(),
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
  assert.equal(failures, 0, `${failures} script-interface failures`);
}
