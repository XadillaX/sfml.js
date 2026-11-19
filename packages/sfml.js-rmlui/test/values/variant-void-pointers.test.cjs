'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const packageRoot = path.resolve(__dirname, '../..');
const pointer = value => ({ type: 'voidptr', value });

async function collect() {
  for (let i = 0; i < 16; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'opaque-native-copies-preserve-object-identity': ({ rmlui, document }) => {
    const object = { message: 'owned script object' };
    const value = new rmlui.Variant(pointer(object));
    const copy = value.clone();
    const moved = copy.move();
    const assigned = new rmlui.Variant().moveAssign(moved);

    assert.equal(value.getType(), rmlui.VariantType.VOIDPTR);
    assert.equal(value.value, object);
    assert.equal(copy.value, object);
    assert.equal(assigned.getReference(rmlui.VariantType.VOIDPTR), object);
    assert.ok(value.equals(new rmlui.Variant(pointer(object))));
    assert.ok(value.equals(new rmlui.Variant(value.value)));
    assert.ok(value.notEquals(new rmlui.Variant(pointer({}))));

    document.setScriptObject(object);
    assert.equal(document.getScriptObject(), value.value);
    object.message = 'changed through the original object';
    assert.equal(assigned.value.message, 'changed through the original object');

    value.clear();
    copy.clear();
    assert.equal(assigned.value, object);
    assigned.assign(pointer(null));
    assert.equal(assigned.value, null);
  },

  'opaque-destinations-preserve-native-default-contracts':
    ({ rmlui, document }) => {
      const object = {};
      const fallback = {};
      const value = new rmlui.Variant(pointer(object));

      assert.equal(value.get(pointer(fallback)), object);
      assert.deepEqual(value.getInto(pointer(null)),
        { success: true, value: object });
      assert.deepEqual(new rmlui.Variant(3).getInto(pointer(fallback)),
        { success: false, value: fallback });
      assert.equal(new rmlui.Variant(3).get(pointer(fallback)), fallback);
      assert.equal(new rmlui.Property(3).get(pointer(fallback)), null);
      assert.equal(document.getAttribute('missing', pointer(fallback)),
        fallback);
      assert.equal(value.get(17), 17);
      assert.throws(() => value.get(''), /pointer|typed/i);
      assert.deepEqual(new rmlui.Variant(pointer(null)).getInto(
        pointer(fallback)), { success: true, value: null });
      assert.deepEqual(value.getInto({ type: 'scriptinterface', value: null }),
        { success: false, value: null });
    },

  'opaque-properties-dictionaries-and-event-parameters':
    ({ rmlui, document }) => {
      const object = { nativeOwner: 'dictionary' };
      const property = new rmlui.Property(pointer(object), rmlui.Unit.NUMBER);
      const dictionary = new rmlui.PropertyDictionary();

      dictionary.setProperty(rmlui.PropertyId.Width, property);
      assert.equal(dictionary.getProperty(rmlui.PropertyId.Width).value,
        object);
      document.setAttribute('opaque', pointer(object));
      assert.equal(document.getAttribute('opaque', pointer(null)), object);

      let calls = 0;
      document.addEventListener('opaque', event => {
        ++calls;
        assert.equal(event.parameters.object, object);
        assert.equal(event.getParameter('object', pointer(null)), object);
      });
      document.dispatchEvent('opaque', { object: pointer(object) });
      assert.equal(calls, 1);
      assert.equal(property.value, object);
      assert.equal(property.get(pointer(null)), object);
    },

  'opaque-copy-retains-object-until-last-clear': async ({ rmlui }) => {
    let reference;
    let value;
    let copy;

    (() => {
      const object = {};
      reference = new WeakRef(object);
      value = new rmlui.Variant(pointer(object));
      copy = value.clone();
    })();

    value.clear();
    await collect();
    assert.ok(reference.deref());
    assert.ok(copy.value);

    copy.clear();
    await collect();
    assert.equal(reference.deref(), undefined);
  },

  'opaque-object-and-variant-cycle-collect': async ({ rmlui }) => {
    let objectRef;
    let valueRef;

    (() => {
      const object = {};
      const value = new rmlui.Variant(pointer(object));
      object.value = value;
      objectRef = new WeakRef(object);
      valueRef = new WeakRef(value);
    })();

    await collect();
    assert.equal(objectRef.deref(), undefined);
    assert.equal(valueRef.deref(), undefined);
  },

  'opaque-detached-element-self-cycle-collect': async ({ rmlui }) => {
    let elementRef;
    let objectRef;

    (() => {
      const element = new rmlui.Element('div');
      const object = { element };
      element.setAttribute('opaque', pointer(object));
      elementRef = new WeakRef(element);
      objectRef = new WeakRef(object);
    })();

    await collect();
    assert.equal(elementRef.deref(), undefined);
    assert.equal(objectRef.deref(), undefined);
  },

  'opaque-independent-context-document-cycle-collect':
    async ({ rmlui, context }) => {
      let contextRef;
      let objectRef;

      (() => {
        const owned = new rmlui.Context('opaque-cycle',
          context.getRenderManager(), null);
        const document = owned.createDocument();
        const object = { context: owned, document };
        document.setAttribute('opaque', pointer(object));
        contextRef = new WeakRef(owned);
        objectRef = new WeakRef(object);
      })();

      await collect();
      assert.equal(contextRef.deref(), undefined);
      assert.equal(objectRef.deref(), undefined);
    },

  'opaque-native-document-root-releases-after-removal':
    async ({ context }) => {
      const document = context.createDocument();
      let objectRef;

      (() => {
        const object = {};
        objectRef = new WeakRef(object);
        document.setAttribute('opaque', pointer(object));
      })();

      await collect();
      assert.ok(objectRef.deref());
      document.close();
      context.update();
      await collect();
      assert.equal(objectRef.deref(), undefined);
    },

  'opaque-removed-independent-context-clears-private-roots':
    async ({ rmlui, context }) => {
      const owned = new rmlui.Context('opaque-removed',
        context.getRenderManager(), null);
      const document = owned.createDocument();
      let objectRef;

      (() => {
        const object = {};
        objectRef = new WeakRef(object);
        document.setAttribute('opaque', pointer(object));
      })();

      await collect();
      assert.ok(objectRef.deref());

      owned.remove();
      await collect();
      assert.equal(objectRef.deref(), undefined);
    },

  'opaque-type-checks-reject-addresses-and-data-values':
    ({ rmlui, context }) => {
      const value = new rmlui.Variant(pointer(null));
      assert.equal(value.getType(), rmlui.VariantType.VOIDPTR);

      for (const input of [ 1, 1n, '0x123', undefined, true ]) {
        assert.throws(() => new rmlui.Variant(pointer(input)),
          /object|null|pointer/i);
      }
      assert.throws(() => new rmlui.Variant({
        type: 'voidptr', value: {}, address: 1n,
      }), /type|value|pointer/i);

      const model = context.createDataModel('opaque-data');
      assert.ok(model.bindFunc('pointer', () => pointer({})));
      assert.throws(() => model.getVariable('pointer').get(),
        /pointer|owned|variant/i);
    },

  'opaque-objects-do-not-dispatch-on-public-facade-fields':
    ({ rmlui, document }) => {
      for (const object of [
        { type: 'animationlist', animations: 'ordinary host data' },
        { elementHandle: {}, contextHandle: {}, eventHandle: {} },
      ]) {
        const value = new rmlui.Variant(pointer(object));
        const copy = new rmlui.Variant(value.value);

        assert.equal(value.value, object);
        assert.equal(copy.value, object);
        assert.equal(copy.getType(), rmlui.VariantType.VOIDPTR);
        assert.ok(value.equals(copy));
        assert.throws(() => value.get(object), /default|selector/i);
      }

      const opaque = new rmlui.Variant(pointer(document));
      assert.equal(opaque.value, document);
      assert.equal(opaque.getType(), rmlui.VariantType.VOIDPTR);
      assert.equal(new rmlui.Variant(document).getType(),
        rmlui.VariantType.SCRIPTINTERFACE);
      assert.equal(new rmlui.Variant({
        type: 'scriptinterface', value: document,
      }).value, document);
    },

  'opaque-drag-field-is-not-a-native-element-pointer':
    ({ rmlui, document }) => {
      const object = { drag: 'host data' };
      let calls = 0;
      document.addEventListener('drag', event => {
        ++calls;
        assert.equal(event.parameters.drag_element, object);
        assert.equal(event.getParameter('drag_element', pointer(null)),
          object);
        assert.throws(() => event.getElementParameter('drag_element'),
          /pointer|typed|element/i);
      });

      document.dispatchEvent('drag', { drag_element: pointer(object) });
      assert.equal(calls, 1);

      const allocator = new rmlui.EventInstancer();
      const event = allocator.instanceEvent(document, rmlui.EventId.Drag,
        'drag', { drag_element: pointer(object) }, true);
      assert.equal(event.parameters.drag_element, object);
      assert.throws(() => event.getElementParameter('drag_element'),
        /pointer|typed|element/i);
      event.release();
    },

  'unchanged-opaque-frames-do-not-scan-owners':
    ({ document, context }) => {
      const object = { value: 3 };
      document.setAttribute('opaque', pointer(object));
      context.update();

      const native = require(path.join(packageRoot,
        'build/Release/rmlui.node'));
      native.beginDataDiagnostics();
      for (let i = 0; i < 16; ++i) {
        context.update();
        assert.equal(document.getAttribute('opaque', pointer(null)), object);
      }

      const counts = native.endDataDiagnostics();
      assert.equal(counts.callbackSnapshotVisits, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
    },
};

async function run(name) {
  const sfml = require(path.join(packageRoot, 'node_modules/sfml.js'));
  const rmlui = require(path.join(packageRoot, 'dist'));
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)),
    'Variant opaque object ownership');
  assert.ok(rmlui.initialise(window, { highDpi: false }));

  try {
    const context = rmlui.createContext('opaque', 160, 120);
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

  assert.equal(failures, 0, `${failures} opaque Variant failures`);
}
