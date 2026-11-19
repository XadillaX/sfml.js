'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const pointer = value => ({ type: 'scriptinterface', value });

async function collect() {
  for (let i = 0; i < 16; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'context-pointers-share-native-copy-and-removal':
    ({ rmlui, context, document }) => {
      const other = rmlui.createContext('other', 160, 120);
      const value = new rmlui.Variant(other);
      const copy = value.clone();
      const property = new rmlui.Property(other);

      document.setAttribute('context', other);
      assert.equal(value.getType(), rmlui.VariantType.SCRIPTINTERFACE);
      assert.equal(value.value, other);
      assert.equal(copy.getReference(rmlui.VariantType.SCRIPTINTERFACE), other);
      assert.equal(property.value, other);
      assert.equal(value.get(pointer(context)), other);
      assert.deepEqual(value.getInto(pointer(context)),
        { success: true, value: other });
      assert.equal(document.getAttribute('context', pointer(context)), other);
      assert.equal(document.getAttribute('missing', pointer(context)), context);
      assert.equal(value.getElementValue(), null);
      assert.throws(() => value.get(''), /pointer|typed/i);

      other.remove();
      assert.equal(value.value, null);
      assert.equal(copy.value, null);
      assert.equal(property.value, null);
      assert.deepEqual(copy.getInto(pointer(context)),
        { success: true, value: null });
      assert.equal(document.getAttribute('context', pointer(context)), null);
    },

  'base-pointer-template-preserves-native-failure-defaults':
    ({ rmlui, context, document }) => {
      for (const target of [ document, context, new rmlui.RmlEvent(), null ]) {
        const value = new rmlui.Variant(pointer(target));
        assert.equal(value.value, target);
        assert.deepEqual(value.getInto(pointer(null)),
          { success: true, value: target });
        assert.deepEqual(new rmlui.Variant(3).getInto(pointer(target)),
          { success: false, value: target });
        assert.equal(new rmlui.Property(3).get(pointer(target)), null,
          'Property::Get uses a zero-initialized native destination');
        assert.equal(new rmlui.Variant(target).get(17), 17,
          'unsupported pointer-to-scalar conversion preserves fallback');
        if (target !== null) {
          assert.throws(() => value.get(target), /default|selector/i);
          assert.throws(() => value.getInto(target), /default|selector/i);
          assert.throws(() => new rmlui.Property(3).get(target),
            /default|selector/i);
        }

        if (target instanceof rmlui.RmlEvent) {
          target.release();
        }
      }
      assert.throws(() => new rmlui.Variant(pointer({})),
        /script|pointer|handle/i);
    },

  'owned-event-pointers-null-on-release': ({ rmlui, context, document }) => {
    const event = new rmlui.RmlEvent();
    const value = new rmlui.Variant(event);
    const copy = value.clone();
    const property = new rmlui.Property(event);

    document.setAttribute('event', event);
    assert.equal(value.value, event);
    assert.equal(copy.value, event);
    assert.equal(property.get(pointer(context)), event);

    event.release();
    assert.equal(value.value, null);
    assert.equal(copy.value, null);
    assert.equal(property.value, null);
    assert.equal(document.getAttribute('event', pointer(context)), null);
  },

  'dispatch-pointers-expire-at-their-own-listener-boundary':
    ({ rmlui, context, document }) => {
      let outer;
      let inner;
      let saved;
      const owner = new rmlui.Element('div');

      document.addEventListener('inner', event => {
        inner = new rmlui.Variant(event);
        assert.equal(inner.value, event);
        assert.equal(outer.value, saved);
        owner.setAttribute('inner-event', event);
      });

      document.addEventListener('outer', event => {
        saved = event;
        outer = new rmlui.Variant(event);
        document.dispatchEvent('inner');
        assert.equal(inner.value, null);
        assert.equal(outer.value, event);
        assert.equal(owner.getAttribute('inner-event', pointer(context)),
          null);
      });

      document.dispatchEvent('outer');
      assert.equal(outer.value, null);
      assert.equal(inner.value, null);
      assert.throws(() => new rmlui.Variant(saved), /expired|invalid/i);
      owner.release();
    },

  'event-parameters-carry-context-and-owned-event':
    ({ rmlui, context, document }) => {
      const owned = new rmlui.RmlEvent();
      let called = 0;

      document.addEventListener('pointers', event => {
        ++called;
        assert.equal(event.parameters.context, context);
        assert.equal(event.parameters.owned, owned);
        assert.equal(event.getParameter('context', pointer(null)), context);
        assert.equal(event.getParameter('owned', pointer(null)), owned);
      });

      document.dispatchEvent('pointers', { context, owned });
      assert.equal(called, 1);
      owned.release();
    },

  'copied-owner-retains-an-event-until-clear': async ({ rmlui }) => {
    let reference;
    let value;

    (() => {
      const event = new rmlui.RmlEvent();
      reference = new WeakRef(event);
      value = new rmlui.Variant(event);
    })();

    await collect();
    assert.ok(reference.deref());
    assert.ok(value.value instanceof rmlui.RmlEvent);

    value.clear();
    await collect();
    assert.equal(reference.deref(), undefined);
  },

  'event-and-variant-cycles-collect': async ({ rmlui }) => {
    let eventRef;
    let valueRef;

    (() => {
      const event = new rmlui.RmlEvent();
      const value = new rmlui.Variant(event);
      event.value = value;
      eventRef = new WeakRef(event);
      valueRef = new WeakRef(value);
    })();

    await collect();
    assert.equal(eventRef.deref(), undefined);
    assert.equal(valueRef.deref(), undefined);
  },

  'owned-context-document-pointer-cycles-collect':
    async ({ rmlui, context }) => {
      let contextRef;
      let documentRef;

      (() => {
        const owned = new rmlui.Context('pointer-cycle',
          context.getRenderManager(), null);
        const document = owned.createDocument();
        document.setAttribute('context', owned);
        contextRef = new WeakRef(owned);
        documentRef = new WeakRef(document);
      })();

      await collect();
      assert.equal(contextRef.deref(), undefined);
      assert.equal(documentRef.deref(), undefined);
      assert.equal(context.update(), true);
    },

  'copied-owner-retains-an-independent-context-until-clear':
    async ({ rmlui, context }) => {
      let contextRef;
      let value;

      (() => {
        const owned = new rmlui.Context('pointer-owned',
          context.getRenderManager(), null);
        contextRef = new WeakRef(owned);
        value = new rmlui.Variant(owned);
      })();

      await collect();
      assert.ok(contextRef.deref());
      assert.equal(value.value.name, 'pointer-owned');

      value.clear();
      await collect();
      assert.equal(contextRef.deref(), undefined);
    },

  'removed-context-releases-its-document-pointer-targets':
    async ({ rmlui, context }) => {
      const owned = new rmlui.Context('pointer-document-owner',
        context.getRenderManager(), null);
      const document = owned.createDocument();
      let eventRef;

      (() => {
        const event = new rmlui.RmlEvent();
        eventRef = new WeakRef(event);
        document.setAttribute('event', event);
      })();

      await collect();
      assert.ok(eventRef.deref());

      owned.remove();
      await collect();
      assert.equal(eventRef.deref(), undefined);
      assert.throws(() => document.getAttributes(), /valid/i);
    },

  'factory-transfer-invalidates-the-original-event-pointer':
    ({ rmlui, document }) => {
      const allocator = new rmlui.EventInstancer();
      let pointerValue;
      let calls = 0;

      const instancer = new rmlui.EventInstancer((...arguments_) => {
        const event = allocator.instanceEvent(...arguments_);
        pointerValue = new rmlui.Variant(event);
        assert.equal(pointerValue.value, event);
        return event;
      });
      rmlui.Factory.registerEventInstancer(instancer);
      document.addEventListener('transferred-pointer', event => {
        ++calls;
        assert.equal(pointerValue.value, null);
        assert.equal(event.type, 'transferred-pointer');
      });

      document.dispatchEvent('transferred-pointer');
      assert.equal(calls, 1);
      assert.equal(pointerValue.value, null);
      rmlui.Factory.registerEventInstancer(new rmlui.EventInstancer());
    },

  'dictionary-getters-cannot-retain-an-expired-event':
    ({ rmlui, document }) => {
      const event = new rmlui.RmlEvent();
      const { eventHandle } = require('../../dist/events/event');
      const native = require('../../build/Release/rmlui.node');

      assert.throws(() => native.setAttributes(document.handle, {
        event: eventHandle(event),
        get later() {
          event.release();
          return 1;
        },
      }), /expired|invalid/i);
      assert.equal(document.hasAttribute('event'), false);
    },

  'unchanged-script-pointer-frames-do-not-scan-owners':
    ({ rmlui, context, document }) => {
      const event = new rmlui.RmlEvent();
      document.setAttributes({ context, event });
      context.update();

      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics();
      for (let i = 0; i < 16; ++i) {
        context.update();
        assert.equal(document.getAttribute('event', pointer(null)), event);
        assert.equal(document.getAttribute('context', pointer(null)), context);
      }

      const counts = native.endDataDiagnostics();
      assert.equal(counts.callbackSnapshotVisits, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
      event.release();
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)),
    'Variant script interfaces');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('pointers', 160, 120);
    await cases[name]({ rmlui, window, context,
      document: context.createDocument() });
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
  assert.equal(failures, 0, `${failures} script interface Variant failures`);
}
