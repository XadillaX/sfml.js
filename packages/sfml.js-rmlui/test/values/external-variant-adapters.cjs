'use strict';

// Explicit native-extension acceptance. The normal runtime suite remains
// portable; invoke this file after build with a POSIX C++ compiler and Python.
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const extension = process.env.SFML_RMLUI_EXTERNAL_FIXTURE ||
  path.join(os.tmpdir(), 'sfml-rmlui-external-variant-adapters.node');
const pointer = value => ({ type: 'voidptr', value });
const scriptPointer = value => ({ type: 'scriptinterface', value });

async function collect() {
  for (let index = 0; index < 16; ++index) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function opaqueVariant(rmlui, fixture, owner) {
  return new rmlui.Variant(fixture.copyOpaque(owner).handle);
}

function scriptElement(rmlui, fixture, object) {
  return rmlui.Element.wrap(fixture.createScriptElement(object));
}

function nativeScriptVariant(rmlui, fixture, source) {
  return new rmlui.Variant(fixture.copyScriptVariant(source).handle);
}

function parameterizedEvent(rmlui, fixture, value) {
  const { variantHandle } = require('../../dist/values/variant');
  return new rmlui.RmlEvent(
    fixture.createParameterizedEvent(variantHandle(value)));
}

const cases = {
  'external-variant-element-getter-rejects-expired-raw-script-pointer':
    ({ rmlui, fixture }) => {
      const { variantHandle } = require('../../dist/values/variant');
      const value = new rmlui.Variant(7);
      fixture.setExpiredVariantScriptValue(variantHandle(value), false);

      assert.throws(() => value.getElementValue(), /registered|pointer|typed/i);
    },

  'external-variant-element-getter-rejects-unregistered-script-guard':
    ({ rmlui, fixture }) => {
      const { variantHandle } = require('../../dist/values/variant');
      const value = new rmlui.Variant(7);
      fixture.setExpiredVariantScriptValue(variantHandle(value), true);

      assert.throws(() => value.getElementValue(), /registered|pointer|typed/i);
    },

  'external-property-element-getter-rejects-expired-raw-script-pointer':
    ({ rmlui, fixture }) => {
      const { propertyHandle } = require(
        '../../dist/style/properties/property');
      const value = new rmlui.Property(7, rmlui.Unit.NUMBER);
      fixture.setExpiredPropertyScriptValue(propertyHandle(value), false);

      assert.throws(() => value.getElementValue(), /registered|pointer|typed/i);
    },

  'external-property-element-getter-rejects-unregistered-script-guard':
    ({ rmlui, fixture }) => {
      const { propertyHandle } = require(
        '../../dist/style/properties/property');
      const value = new rmlui.Property(7, rmlui.Unit.NUMBER);
      fixture.setExpiredPropertyScriptValue(propertyHandle(value), true);

      assert.throws(() => value.getElementValue(), /registered|pointer|typed/i);
    },

  'external-element-getter-rejects-expired-raw-script-attribute':
    ({ rmlui, fixture }) => {
      const element = new rmlui.Element('div');

      assert.throws(() => {
        fixture.setExpiredElementScriptAttribute(element.handle, false);
        element.getElementAttribute('value');
      }, /registered|pointer|typed/i);
    },

  'external-element-getter-rejects-unregistered-script-attribute-guard':
    ({ rmlui, fixture }) => {
      const element = new rmlui.Element('div');

      assert.throws(() => {
        fixture.setExpiredElementScriptAttribute(element.handle, true);
        element.getElementAttribute('value');
      }, /registered|pointer|typed/i);
    },

  'external-element-getters-preserve-registered-non-element-null-results':
    ({ rmlui, fixture }) => {
      const object = {};
      const source = fixture.createScriptVariant(object);
      const value = nativeScriptVariant(rmlui, fixture, source);
      const property = new rmlui.Property(value);
      const owner = new rmlui.Element('div');
      owner.setAttribute('value', value);

      assert.equal(value.getElementValue(), null);
      assert.equal(property.getElementValue(), null);
      assert.equal(owner.getElementAttribute('value', owner), null);
      assert.equal(owner.getElementAttribute('missing', owner), owner);
      fixture.expireScriptVariant(source);
      assert.equal(value.getElementValue(), null);
      assert.equal(property.getElementValue(), null);
      assert.equal(owner.getElementAttribute('value', owner), null);
      owner.release();
    },

  'external-event-constructor-rejects-expired-unregistered-script-guard':
    ({ fixture }) => {
      assert.throws(() => fixture.createEventWithExpiredScriptParameter(true),
        /registered|pointer|typed/i);
    },

  'external-event-constructor-rejects-expired-raw-script-pointer':
    ({ fixture }) => {
      assert.throws(() => fixture.createEventWithExpiredScriptParameter(false),
        /registered|pointer|typed/i);
    },

  'external-event-constructor-rejects-raw-drag-key-outside-drag-events':
    ({ fixture }) => {
      assert.throws(() => fixture.createEventWithUnregisteredDragParameter(),
        /registered|pointer|typed/i);
    },

  'external-event-element-getter-rejects-unregistered-native-parameters':
    ({ rmlui, fixture }) => {
      const { eventHandle } = require('../../dist/events/event');

      for (const guarded of [ true, false ]) {
        const value = new rmlui.Variant(7);
        const event = parameterizedEvent(rmlui, fixture, value);
        fixture.setExpiredEventScriptParameter(eventHandle(event), guarded);

        assert.throws(() => event.getElementParameter('value'),
          /registered|pointer|native element/i);
        assert.throws(() => event.getParameter('value', scriptPointer(null)),
          /registered|pointer|typed/i);
        event.release();
      }
    },

  'external-event-generic-script-identity-expiry-and-element-default':
    ({ rmlui, fixture }) => {
      const object = {};
      const source = fixture.createScriptVariant(object);
      const value = nativeScriptVariant(rmlui, fixture, source);
      const event = parameterizedEvent(rmlui, fixture, value);
      const fallback = new rmlui.Element('div');

      assert.equal(event.parameters.value, object);
      assert.equal(event.getParameter('value', scriptPointer(null)), object);
      assert.equal(event.getElementParameter('missing', fallback), fallback);
      assert.throws(() => event.getElementParameter('value', fallback),
        /native element/i);

      fixture.expireScriptVariant(source);
      assert.equal(event.getParameter('value', scriptPointer(null)), null);
      assert.equal(event.getElementParameter('value', fallback), null);
      event.release();
      fallback.release();
    },

  'external-event-element-observer-still-rejects-destroyed-parameters':
    ({ rmlui, fixture }) => {
      const element = new rmlui.Element('div');
      const value = new rmlui.Variant(scriptPointer(element));
      const event = parameterizedEvent(rmlui, fixture, value);

      assert.equal(event.getElementParameter('value'), element);
      element.release();
      assert.throws(() => event.getElementParameter('value'), /destroyed/i);
      assert.throws(() => event.getParameter('value', scriptPointer(null)),
        /destroyed/i);
      event.release();
    },

  'external-script-variant-preserves-address-identity-and-expiry':
    ({ rmlui, fixture }) => {
      const object = {
        type: 'voidptr', elementHandle: {}, opaqueObject: {},
      };
      const source = fixture.createScriptVariant(object);
      const value = nativeScriptVariant(rmlui, fixture, source);
      const copy = value.clone().move();

      assert.ok(fixture.checkScriptVariantAddress(source));
      assert.equal(value.getType(), rmlui.VariantType.SCRIPTINTERFACE);
      assert.equal(value.value, object);
      assert.equal(copy.getReference(rmlui.VariantType.SCRIPTINTERFACE),
        object);
      assert.ok(value.equals(new rmlui.Variant(scriptPointer(object))));
      assert.ok(value.equals(new rmlui.Variant(value.value)));
      assert.deepEqual(value.getInto(scriptPointer(null)),
        { success: true, value: object });
      assert.equal(value.getElementValue(), null);
      assert.equal(fixture.takeScriptVariantReadCount(source), 0);

      fixture.expireScriptVariant(source);
      assert.equal(value.value, null);
      assert.equal(copy.value, null);
      assert.deepEqual(copy.getInto(scriptPointer(object)),
        { success: true, value: null });
    },

  'external-script-variant-typed-defaults-and-unregistered-rejection':
    ({ rmlui, fixture }) => {
      const object = {};
      const source = fixture.createScriptVariant(object);
      const value = nativeScriptVariant(rmlui, fixture, source);
      const property = new rmlui.Property(value);

      assert.equal(new rmlui.Variant(3).get(scriptPointer(object)), object);
      assert.equal(new rmlui.Property(3).get(scriptPointer(object)), null);
      assert.throws(() => value.get(object), /default|selector/i);
      assert.throws(() => property.get(object), /default|selector/i);
      assert.throws(() => value.get(''), /pointer|typed/i);
      assert.throws(() => new rmlui.Variant(scriptPointer({})),
        /script|pointer|handle/i);
      assert.throws(() => fixture.createScriptVariant(object),
        /identity|registered/i);

      fixture.expireScriptVariant(source);
      assert.throws(() => fixture.createScriptVariant(object),
        /identity|registered/i);
    },

  'external-script-selector-does-not-read-original-object-fields':
    ({ rmlui, fixture }) => {
      let reads = 0;
      const object = {
        get type() {
          ++reads;
          throw new Error('Original script-object fields must stay opaque');
        },
      };
      const source = fixture.createScriptVariant(object);
      const value = new rmlui.Variant(scriptPointer(object));

      assert.equal(value.value, object);
      assert.equal(value.get(scriptPointer(object)), object);
      assert.equal(reads, 0);
      fixture.expireScriptVariant(source);
      assert.equal(value.value, null);
    },

  'external-script-variant-dom-property-and-event-snapshots':
    ({ rmlui, fixture, document }) => {
      const object = {};
      const source = fixture.createScriptVariant(object);
      const value = nativeScriptVariant(rmlui, fixture, source);
      const property = new rmlui.Property(value);
      document.setAttributes({ first: value, second: value });
      let saved;

      document.addEventListener('script-value', event => {
        assert.equal(event.parameters.value, object);
        assert.equal(event.getParameter('value', scriptPointer(null)), object);
        saved = new rmlui.Variant(event.parameters.value);
      });
      document.dispatchEvent('script-value', { value });
      assert.equal(document.getAttribute('first', scriptPointer(null)), object);
      assert.equal(document.getAttributes().second, object);

      fixture.expireScriptVariant(source);
      assert.equal(property.value, null);
      assert.equal(saved.value, null);
      assert.equal(document.getAttributes().first, null);
    },

  'external-script-variant-lua-copy-keeps-guarded-native-storage':
    ({ rmlui, fixture, host, context }) => {
      context.setScriptHost(host);
      const document = context.loadDocumentFromMemory(
        '<rml><head><script>saved = nil</script></head><body/></rml>');
      const object = {};
      const source = fixture.createScriptVariant(object);
      document.setAttribute('native',
        nativeScriptVariant(rmlui, fixture, source));
      document.loadInlineScript(
        'saved = document:GetAttribute("native"); assert(saved ~= nil)',
        'external-script-save.lua');
      document.removeAttribute('native');
      let expected = object;
      let calls = 0;

      document.addEventListener('script-copy', event => {
        ++calls;
        assert.equal(event.parameters.value, expected);
      });
      document.loadInlineScript(
        'document:DispatchEvent("script-copy", {value = saved})',
        'external-script-echo.lua');
      fixture.expireScriptVariant(source);
      expected = null;
      document.loadInlineScript(
        'document:DispatchEvent("script-copy", {value = saved})',
        'external-script-expired.lua');
      assert.equal(calls, 2);
    },

  'external-script-variant-source-destruction-invalidates-copy':
    async ({ rmlui, fixture, context }) => {
      let copy;
      let sourceReference;
      let objectReference;
      (() => {
        const object = {};
        const source = fixture.createScriptVariant(object);
        copy = nativeScriptVariant(rmlui, fixture, source);
        sourceReference = new WeakRef(source);
        objectReference = new WeakRef(object);
      })();

      await collect();
      assert.equal(sourceReference.deref(), undefined);
      assert.equal(copy.value, null);
      context.update();
      await collect();
      assert.equal(objectReference.deref(), undefined);
    },

  'external-script-variant-source-and-object-cycle-collect':
    async ({ fixture, context }) => {
      let sourceReference;
      let objectReference;
      (() => {
        const object = {};
        const source = fixture.createScriptVariant(object);
        object.source = source;
        sourceReference = new WeakRef(source);
        objectReference = new WeakRef(object);
      })();

      context.update();
      await collect();
      assert.equal(sourceReference.deref(), undefined);
      assert.equal(objectReference.deref(), undefined);
    },

  'external-script-variant-stable-frames-and-shutdown-generation':
    ({ rmlui, fixture, native, document, context, window }) => {
      const object = {};
      const source = fixture.createScriptVariant(object);
      const value = nativeScriptVariant(rmlui, fixture, source);
      document.setAttribute('native', value);
      context.update();

      native.beginDataDiagnostics();
      for (let index = 0; index < 16; ++index) {
        context.update();
        assert.equal(document.getAttribute('native', scriptPointer(null)),
          object);
      }
      const counts = native.endDataDiagnostics();
      assert.equal(counts.callbackSnapshotVisits, 0);
      assert.equal(counts.elementOwnershipVisits, 0);

      rmlui.shutdown();
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => value.value, /valid/i);
      assert.equal(nativeScriptVariant(rmlui, fixture, source).value, null);
      assert.throws(() => new rmlui.Variant(scriptPointer(object)), /valid/i);
      fixture.expireScriptVariant(source);
    },

  'native-opaque-address-and-independent-copies': ({ rmlui, fixture }) => {
    const object = { nativePayload: 'actual C++ allocation' };
    const owner = fixture.createOpaque(object);
    const value = opaqueVariant(rmlui, fixture, owner);
    const copy = value.clone();
    const moved = copy.move();
    const assigned = new rmlui.Variant().moveAssign(moved);

    assert.ok(fixture.checkOpaqueAddress(owner));
    assert.equal(value.value, object);
    assert.equal(copy.value, object);
    assert.equal(assigned.getReference(rmlui.VariantType.VOIDPTR), object);
    assert.ok(value.equals(new rmlui.Variant(pointer(object))));
    assert.ok(value.equals(new rmlui.Variant(value.value)));
    assert.equal(value.get(pointer({})), object);
    assert.deepEqual(value.getInto(pointer(null)),
      { success: true, value: object });

    fixture.expireOpaque(owner);
    assert.equal(value.value, null);
    assert.equal(copy.value, null);
    assert.equal(assigned.value, null);
    assert.deepEqual(value.getInto(pointer({})),
      { success: true, value: null });
  },

  'native-opaque-dictionaries-properties-and-events':
    ({ rmlui, fixture, document }) => {
      const object = { value: 37 };
      const owner = fixture.createOpaque(object);
      const value = opaqueVariant(rmlui, fixture, owner);
      const property = new rmlui.Property(value, rmlui.Unit.NUMBER);
      const dictionary = new rmlui.PropertyDictionary();

      dictionary.setProperty(rmlui.PropertyId.Width, property);
      document.setAttribute('native', value);
      document.setAttributes({ second: value });
      assert.equal(dictionary.getProperty(rmlui.PropertyId.Width).value,
        object);
      assert.equal(document.getAttribute('native', pointer(null)), object);
      assert.equal(document.getAttributes().second, object);
      let calls = 0;
      document.addEventListener('external', event => {
        ++calls;
        assert.equal(event.parameters.value, object);
        assert.equal(event.getParameter('value', pointer(null)), object);
      });
      document.dispatchEvent('external', { value });
      assert.equal(calls, 1);

      fixture.expireOpaque(owner);
      assert.equal(property.value, null);
      assert.equal(dictionary.getProperty(rmlui.PropertyId.Width).value, null);
      assert.equal(document.getAttribute('native', pointer({})), null);
      assert.equal(document.getAttributes().second, null);
    },

  'native-opaque-lua-copy-shares-original-expiry':
    ({ rmlui, fixture, host, context }) => {
      context.setScriptHost(host);
      const document = context.loadDocumentFromMemory(
        '<rml><head><script>saved = nil</script></head><body/></rml>');
      const object = {};
      const owner = fixture.createOpaque(object);
      document.setAttribute('native', opaqueVariant(rmlui, fixture, owner));
      document.loadInlineScript(
        'saved = document:GetAttribute("native"); assert(saved ~= nil)',
        'external-native-copy.lua');
      document.removeAttribute('native');
      let expected = object;
      let calls = 0;
      document.addEventListener('external-copy', event => {
        ++calls;
        assert.equal(event.parameters.value, expected);
        assert.equal(event.getParameter('value', pointer({})), expected);
      });

      document.loadInlineScript(
        'document:DispatchEvent("external-copy", {value = saved})',
        'external-native-echo.lua');
      fixture.expireOpaque(owner);
      expected = null;
      document.loadInlineScript(
        'document:DispatchEvent("external-copy", {value = saved})',
        'external-native-expired.lua');
      assert.equal(calls, 2);
    },

  'native-opaque-owner-releases-private-roots-after-expiry':
    async ({ rmlui, fixture, context }) => {
      let owner;
      let reference;
      (() => {
        const object = {};
        reference = new WeakRef(object);
        owner = fixture.createOpaque(object);
      })();

      await collect();
      assert.ok(reference.deref());
      fixture.expireOpaque(owner);
      context.update();
      await collect();
      assert.equal(reference.deref(), undefined);
      assert.equal(opaqueVariant(rmlui, fixture, owner).value, null);
    },

  'native-opaque-source-destruction-invalidates-retained-copy':
    async ({ rmlui, fixture, context }) => {
      let copy;
      let ownerReference;
      let objectReference;
      (() => {
        const object = {};
        const owner = fixture.createOpaque(object);
        copy = opaqueVariant(rmlui, fixture, owner);
        ownerReference = new WeakRef(owner);
        objectReference = new WeakRef(object);
      })();

      await collect();
      assert.equal(ownerReference.deref(), undefined);
      assert.equal(copy.value, null);
      context.update();
      await collect();
      assert.equal(objectReference.deref(), undefined);
    },

  'native-opaque-source-and-object-cycle-collect':
    async ({ fixture, context }) => {
      let ownerReference;
      let objectReference;
      (() => {
        const object = {};
        const owner = fixture.createOpaque(object);
        object.owner = owner;
        ownerReference = new WeakRef(owner);
        objectReference = new WeakRef(object);
      })();

      context.update();
      await collect();
      assert.equal(ownerReference.deref(), undefined);
      assert.equal(objectReference.deref(), undefined);
    },

  'native-opaque-registration-does-not-alias-another-identity':
    ({ rmlui, fixture }) => {
      const object = {};
      const owner = fixture.createOpaque(object);
      assert.throws(() => fixture.createOpaque(object),
        /identity|registered/i);
      assert.ok(fixture.checkOpaqueAddress(owner));
      assert.equal(opaqueVariant(rmlui, fixture, owner).value, object);
      fixture.expireOpaque(owner);
      assert.throws(() => fixture.createOpaque(object),
        /identity|registered/i);

      const managed = {};
      new rmlui.Variant(pointer(managed));
      assert.throws(() => fixture.createOpaque(managed),
        /identity|registered/i);
    },

  'native-script-override-keeps-authoritative-owner':
    ({ rmlui, fixture }) => {
      const object = {};
      const element = scriptElement(rmlui, fixture, object);
      assert.equal(element.getScriptObject(), object);
      for (const replacement of [{}, null ]) {
        assert.throws(() => element.setScriptObject(replacement),
          /native|adapter|authoritative/i);
        assert.equal(element.getScriptObject(), object);
      }
      element.release();
    },

  'native-script-association-is-per-interface':
    ({ rmlui, fixture }) => {
      const first = {};
      const second = {};
      // Both real subclasses return the same native ScriptObject address.
      const left = scriptElement(rmlui, fixture, first);
      const right = scriptElement(rmlui, fixture, second);
      assert.equal(left.getScriptObject(), first);
      assert.equal(right.getScriptObject(), second);
      left.release();
      assert.equal(right.getScriptObject(), second);
      right.release();
    },

  'native-script-without-js-facade-retains-object-until-destruction':
    async ({ fixture }) => {
      let reference;
      (() => {
        const object = { value: 37 };
        reference = new WeakRef(object);
        fixture.createNativeScript(object);
      })();

      try {
        await collect();
        assert.equal(fixture.readNativeScript().value, 37);
      } finally {
        fixture.releaseNativeScript();
      }
      await collect();
      assert.equal(reference.deref(), undefined);
    },

  'native-script-reregistration-keeps-new-association':
    ({ rmlui, fixture }) => {
      const first = {};
      const second = {};
      const element = scriptElement(rmlui, fixture, first);
      fixture.registerScriptElement(element.handle, second);
      assert.equal(element.getScriptObject(), second);
      fixture.replaceScriptIdentity(element.handle);
      assert.throws(() => element.getScriptObject(),
        /native|adapter|valid/i);
      fixture.registerScriptElement(element.handle, first);
      assert.equal(element.getScriptObject(), first);
      assert.throws(() => fixture.registerWrongScriptIdentity(
        element.handle, second), /authoritative|match/i);
      assert.equal(element.getScriptObject(), first);
      element.release();
    },

  'native-script-query-calls-authoritative-getter-once':
    ({ fixture }) => {
      const object = {};
      fixture.createNativeScript(object);
      fixture.takeNativeScriptReadCount();

      try {
        assert.equal(fixture.readNativeScript(), object);
        assert.equal(fixture.takeNativeScriptReadCount(), 1);

        fixture.setNativeScriptNull(true);
        assert.equal(fixture.readNativeScript(), null);
        assert.equal(fixture.takeNativeScriptReadCount(), 1);

        fixture.setNativeScriptNull(false);
        assert.equal(fixture.readNativeScript(), object);
        assert.equal(fixture.takeNativeScriptReadCount(), 1);
      } finally {
        fixture.releaseNativeScript();
      }
    },

  'native-script-unregister-releases-null-transition-owner':
    async ({ fixture }) => {
      let reference;
      (() => {
        const object = {};
        fixture.createNativeScript(object);
        reference = new WeakRef(object);
      })();

      try {
        fixture.setNativeScriptNull(true);
        assert.equal(fixture.readNativeScript(), null);
        assert.equal(fixture.unregisterNativeScript(), true);
        assert.equal(fixture.unregisterNativeScript(), false);

        await collect();
        assert.equal(reference.deref(), undefined);
        fixture.setNativeScriptNull(false);
        assert.throws(() => fixture.readNativeScript(),
          /registered|adapter|valid/i);

        const replacement = {};
        fixture.registerNativeScript(replacement);
        assert.equal(fixture.readNativeScript(), replacement);
      } finally {
        fixture.releaseNativeScript();
      }
    },

  'native-context-override-root-retains-then-releases-object':
    async ({ rmlui, fixture, context }) => {
      let owned;
      let reference;
      (() => {
        const object = {};
        owned = new rmlui.Context(
          fixture.createScriptContext(context.handle, object));
        reference = new WeakRef(object);
      })();

      await collect();
      assert.ok(owned.getScriptObject());
      assert.throws(() => owned.setScriptObject(null), /native|adapter/i);
      owned.release();
      await collect();
      assert.equal(reference.deref(), undefined);
    },

  'native-context-override-root-allows-js-context-cycle-collection':
    async ({ rmlui, fixture, context }) => {
      let contextReference;
      let objectReference;
      (() => {
        const object = {};
        const owned = new rmlui.Context(
          fixture.createScriptContext(context.handle, object));
        object.context = owned;
        contextReference = new WeakRef(owned);
        objectReference = new WeakRef(object);
      })();

      await collect();
      assert.equal(contextReference.deref(), undefined);
      assert.equal(objectReference.deref(), undefined);
    },

  'native-event-override-follows-supplied-element-ownership-root':
    async ({ rmlui, fixture, document, context }) => {
      const root = new rmlui.Element('div');
      document.appendChild(root);
      let event;
      let reference;
      (() => {
        const object = {};
        event = new rmlui.RmlEvent(
          fixture.createScriptEvent(root.handle, object));
        reference = new WeakRef(object);
      })();

      context.update();
      await collect();
      assert.ok(event.getScriptObject());
      assert.throws(() => event.setScriptObject(null), /native|adapter/i);
      event.release();
      context.update();
      await collect();
      assert.equal(reference.deref(), undefined);
    },

  'native-event-override-detached-root-and-event-cycle-collect':
    async ({ rmlui, fixture }) => {
      let rootReference;
      let eventReference;
      let objectReference;
      (() => {
        const root = new rmlui.Element('div');
        const object = { root };
        const event = new rmlui.RmlEvent(
          fixture.createScriptEvent(root.handle, object));
        object.event = event;
        rootReference = new WeakRef(root);
        eventReference = new WeakRef(event);
        objectReference = new WeakRef(object);
      })();

      await collect();
      assert.equal(rootReference.deref(), undefined);
      assert.equal(eventReference.deref(), undefined);
      assert.equal(objectReference.deref(), undefined);
    },

  'native-script-detached-owner-and-cycle-collect':
    async ({ rmlui, fixture }) => {
      let elementReference;
      let objectReference;
      (() => {
        const object = {};
        const element = scriptElement(rmlui, fixture, object);
        object.element = element;
        elementReference = new WeakRef(element);
        objectReference = new WeakRef(object);
      })();

      await collect();
      assert.equal(elementReference.deref(), undefined);
      assert.equal(objectReference.deref(), undefined);
    },

  'native-script-attached-root-releases-after-native-destruction':
    async ({ rmlui, fixture, document, context }) => {
      let reference;
      (() => {
        const object = { value: 37 };
        const element = scriptElement(rmlui, fixture, object);
        element.id = 'external-child';
        document.appendChild(element);
        reference = new WeakRef(object);
      })();

      context.update();
      await collect();
      assert.equal(document.getElementById('external-child')
        .getScriptObject().value, 37);
      document.innerRML = '';
      context.update();
      await collect();
      assert.equal(reference.deref(), undefined);
    },

  'native-script-independent-context-cycle-collect':
    async ({ rmlui, fixture, context }) => {
      let contextReference;
      let objectReference;
      (() => {
        const owned = new rmlui.Context('native-script-cycle',
          context.getRenderManager(), null);
        const document = owned.createDocument();
        const object = { context: owned };
        document.appendChild(scriptElement(rmlui, fixture, object));
        contextReference = new WeakRef(owned);
        objectReference = new WeakRef(object);
      })();

      await collect();
      assert.equal(contextReference.deref(), undefined);
      assert.equal(objectReference.deref(), undefined);
    },

  'raw-unregistered-native-pointers-still-reject':
    ({ rmlui, fixture }) => {
      assert.throws(() => fixture.readRawOpaque(), /registered|pointer/i);
      assert.throws(() => fixture.readExpiredRawScriptVariant(),
        /registered|pointer/i);
      assert.throws(() => fixture.readExpiredUnregisteredScriptGuard(),
        /registered|pointer/i);
      const element = rmlui.Element.wrap(fixture.createRawScriptElement());
      assert.throws(() => element.getScriptObject(), /registered|adapter/i);
      element.release();
    },

  'native-adapter-static-frames-do-not-scan-owners':
    ({ rmlui, fixture, native, document, context }) => {
      const object = {};
      const owner = fixture.createOpaque(object);
      const element = scriptElement(rmlui, fixture, {});
      document.appendChild(element);
      document.setAttribute('external', opaqueVariant(rmlui, fixture, owner));
      context.update();

      native.beginDataDiagnostics();
      for (let index = 0; index < 16; ++index) {
        context.update();
        assert.equal(document.getAttribute('external', pointer(null)), object);
        assert.ok(element.getScriptObject());
      }
      const counts = native.endDataDiagnostics();
      assert.equal(counts.callbackSnapshotVisits, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
      assert.equal(counts.callbackOwnershipPasses.scriptObject, 0);
      assert.equal(counts.callbackLeaseVisits.scriptObject, 0);
    },

  'native-adapter-shutdown-restart-does-not-resurrect-address':
    ({ rmlui, fixture, window }) => {
      const owner = fixture.createOpaque({});
      const element = scriptElement(rmlui, fixture, {});
      const value = opaqueVariant(rmlui, fixture, owner);
      rmlui.shutdown();
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => element.getScriptObject(), /valid|initiali[sz]/i);
      assert.throws(() => value.value, /valid/i);
      assert.equal(opaqueVariant(rmlui, fixture, owner).value, null);
      fixture.expireOpaque(owner);
    },
};

const serializationRoutes = {
  property: ({ value }) => value.toString(),

  definition: ({ value, rmlui }) => {
    const definition = new rmlui.PropertyDefinition(1, '', false, false);
    return definition.getValue(value);
  },

  dictionary: ({ value, rmlui, fixture }) => {
    const { propertyHandle } = require('../../dist/style/properties/property');
    const { propertyDictionaryHandle } = require(
      '../../dist/style/properties/property-dictionary');
    const specification = new rmlui.PropertySpecification(1, 0);
    specification.registerProperty('value', '', false, false, 1);
    const dictionary = new rmlui.PropertyDictionary();
    fixture.copySerializationPropertyToDictionary(
      propertyHandle(value), propertyDictionaryHandle(dictionary));
    return specification.propertiesToString(dictionary, true, ';');
  },

  'property-selector': ({ value }) => value.get(''),

  'variant-selector': ({ value, rmlui, fixture }) => {
    const { propertyHandle } = require('../../dist/style/properties/property');
    const { variantHandle } = require('../../dist/values/variant');
    const variant = new rmlui.Variant(7);
    fixture.copySerializationPropertyToVariant(
      propertyHandle(value), variantHandle(variant));
    return variant.get('');
  },

  'variant-get-into': ({ value, rmlui, fixture }) => {
    const { propertyHandle } = require('../../dist/style/properties/property');
    const { variantHandle } = require('../../dist/values/variant');
    const variant = new rmlui.Variant(7);
    fixture.copySerializationPropertyToVariant(
      propertyHandle(value), variantHandle(variant));
    return variant.getInto('');
  },
};

for (const [ shape, listKind ] of [
  [ 'direct', 0 ], [ 'decorator', 1 ], [ 'filter', 2 ],
]) {
  for (const [ kind, pointerKind ] of [
    [ 'raw-script', 0 ], [ 'guarded-script', 1 ],
    [ 'raw-opaque', 2 ], [ 'guarded-opaque', 3 ],
  ]) {
    for (const [ route, serialize ] of Object.entries(serializationRoutes)) {
      const name = `external-${route}-rejects-${shape}-${kind}-serialization`;
      cases[name] = environment => {
        const { rmlui, fixture } = environment;
        const { propertyHandle } = require(
          '../../dist/style/properties/property');
        const value = new rmlui.Property('safe', rmlui.Unit.STRING);
        fixture.setPropertySerializationValue(
          propertyHandle(value), pointerKind, listKind, false);

        assert.throws(() => serialize({ ...environment, value }),
          /pointer|typed|registered/i);
      };
    }
  }
}

for (const [ shape, listKind ] of [[ 'decorator', 1 ], [ 'filter', 2 ]]) {
  cases[`external-${shape}-cached-text-does-not-read-hidden-pointers`] =
    environment => {
      const { rmlui, fixture } = environment;
      const { propertyHandle } = require(
        '../../dist/style/properties/property');
      const value = new rmlui.Property('safe', rmlui.Unit.STRING);
      fixture.setPropertySerializationValue(
        propertyHandle(value), 0, listKind, true);

      assert.equal(value.toString(), 'cached-native-text');
      assert.equal(value.get(''), 'cached-native-text');
      assert.equal(serializationRoutes['variant-selector'](
        { ...environment, value }), 'cached-native-text');
      assert.deepEqual(serializationRoutes['variant-get-into'](
        { ...environment, value }),
      { success: true, value: 'cached-native-text' });
      assert.deepEqual(serializationRoutes.definition(
        { ...environment, value }),
      { success: true, value: 'cached-native-text' });
      assert.equal(serializationRoutes.dictionary({ ...environment, value }),
        'value: cached-native-text');
    };
}

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const { native } = require('../../dist/internal/native');
  const fixture = require(extension);
  fixture.openNative(path.join(root, 'build/Release/rmlui.node'));
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Native pointer adapters');
  assert.ok(rmlui.initialise(window, { highDpi: false }));

  try {
    const context = rmlui.createContext('native-adapters', 160, 120);
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    await cases[name]({ rmlui, fixture, native, window, host,
      context, document: context.createDocument() });
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
  const compiled = spawnSync('python3',
    [ path.join(__dirname,
      '../native/values/build-external-variant-adapters.py'),
    extension ], { encoding: 'utf8' });
  assert.equal(compiled.status, 0, compiled.stderr);

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
  assert.equal(failures, 0, `${failures} external native adapter failures`);
}
