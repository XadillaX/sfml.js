'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const pointer = value => ({ type: 'voidptr', value });

async function collect() {
  for (let index = 0; index < 16; ++index) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function saveAttribute(document, name, globalName = 'saved') {
  document.loadInlineScript(
    `${globalName} = document:GetAttribute("${name}"); ` +
    `assert(${globalName} ~= nil, "native Variant became nil"); ` +
    `assert(${globalName} == document:GetAttribute("${name}"), ` +
    '"native copies changed identity")',
    'variant-copy.lua');
}

function echoAttribute(document, name, check) {
  let calls = 0;
  const listener = event => {
    ++calls;
    check(event.parameters.value);
  };
  document.addEventListener('variant-copy', listener);

  try {
    document.loadInlineScript(
      'document:DispatchEvent("variant-copy", ' +
      `{value = document:GetAttribute("${name}")})`,
      'variant-echo.lua');
    assert.equal(calls, 1);
  } finally {
    document.removeEventListener('variant-copy', listener);
  }
}

const cases = {
  'opaque-attributes-and-event-parameters-retain-native-identity':
    ({ rmlui, document }) => {
      const object = { label: 'native object' };
      const source = new rmlui.Variant(pointer(object));
      document.setAttribute('opaque', source);

      saveAttribute(document, 'opaque');
      echoAttribute(document, 'opaque', value => {
        assert.equal(value, object);
        assert.ok(source.equals(new rmlui.Variant(pointer(value))));
      });
    },

  'script-pointers-round-trip-with-exact-owner-types':
    ({ rmlui, context, document }) => {
      const event = new rmlui.RmlEvent();

      try {
        for (const target of [ document, context, event ]) {
          document.setAttribute('script', target);
          saveAttribute(document, 'script');
          echoAttribute(document, 'script', value => {
            assert.equal(value, target);
            assert.ok(new rmlui.Variant(value).equals(
              new rmlui.Variant(target)));
          });
        }
      } finally {
        event.release();
      }
    },

  'lua-copies-share-pointer-invalidation-after-native-release':
    ({ rmlui, host, document }) => {
      const target = rmlui.createContext('lua-variant-target', 160, 120);
      document.setAttribute('script', target);
      saveAttribute(document, 'script');
      document.removeAttribute('script');

      target.remove();
      let calls = 0;
      document.addEventListener('expired-copy', event => {
        ++calls;
        assert.equal(event.parameters.value, null);
        assert.equal(event.getParameter('value', {
          type: 'scriptinterface', value: document,
        }), null);
      });

      document.loadInlineScript(
        'document:DispatchEvent("expired-copy", {value = saved})',
        'expired-copy.lua');
      assert.equal(calls, 1);
      host.execute('saved = nil; collectgarbage("collect")');
    },

  'native-aggregates-do-not-disappear-at-the-lua-boundary':
    ({ rmlui, document }) => {
      const inputs = [
        { x: 1, y: 2, z: 3 },
        { x: 1, y: 2, z: 3, w: 4 },
        { type: 'transform', primitives: [] },
        rmlui.makeTransitionList(),
        { type: 'animationlist', animations: [] },
        new rmlui.DecoratorList(),
        new rmlui.FilterList(),
        new rmlui.FontEffectList(),
        { type: 'colorstoplist', values: [] },
        { type: 'boxshadowlist', values: [] },
      ];

      for (const input of inputs) {
        const source = new rmlui.Variant(input);
        document.setAttribute('aggregate', source);
        saveAttribute(document, 'aggregate');

        echoAttribute(document, 'aggregate', value => {
          assert.deepEqual(value, source.value,
            `native storage ${source.getType()} changed during Lua copy`);
        });
      }
    },

  'native-byte-and-char-read-their-actual-storage':
    ({ host, document }) => {
      for (const [ type, value ] of [
        [ 'byte', 255 ], [ 'char', 65 ],
      ]) {
        document.setAttribute('scalar', { type, value });
        saveAttribute(document, 'scalar');
        assert.equal(host.getGlobal('saved'), BigInt(value));
        echoAttribute(document, 'scalar', result => {
          assert.equal(result, BigInt(value));
        });
      }
    },

  'unsigned-64-bit-values-never-wrap-to-negative-lua-integers':
    ({ rmlui, document }) => {
      const value = 2n ** 64n - 1n;
      const source = new rmlui.Variant({ type: 'uint64', value });
      document.setAttribute('unsigned', source);
      saveAttribute(document, 'unsigned');

      echoAttribute(document, 'unsigned', result => {
        assert.equal(result, value);
      });
    },

  'scalar-and-null-values-survive-attribute-and-event-sources':
    ({ rmlui, document }) => {
      const inputs = [
        [ true, true ],
        [ false, false ],
        [{ type: 'byte', value: 0 }, 0n ],
        [{ type: 'byte', value: 255 }, 255n ],
        [{ type: 'char', value: -128 }, -128n ],
        [{ type: 'char', value: 127 }, 127n ],
        [{ type: 'int', value: -2147483648 }, -2147483648n ],
        [{ type: 'uint', value: 4294967295 }, 4294967295n ],
        [{ type: 'int64', value: -(2n ** 63n) }, -(2n ** 63n) ],
        [{ type: 'int64', value: 2n ** 63n - 1n }, 2n ** 63n - 1n ],
        [{ type: 'uint64', value: 2n ** 63n - 1n }, 2n ** 63n - 1n ],
        [{ type: 'uint64', value: 2n ** 63n }, 2n ** 63n ],
        [{ type: 'uint64', value: 2n ** 64n - 1n }, 2n ** 64n - 1n ],
        [{ type: 'float', value: 1.25 }, 1.25 ],
        [{ type: 'double', value: -1.125 }, -1.125 ],
        [ 'A\0B — 日本語', 'A\0B — 日本語' ],
        [ '', '' ],
        [ null, undefined ],
        [{ type: 'voidptr', value: null }, null ],
        [{ type: 'scriptinterface', value: null }, null ],
      ];
      let expected;
      let calls = 0;

      document.addEventListener('scalar-echo', event => {
        ++calls;
        assert.equal(event.parameters.value, expected);
      });
      document.loadInlineScript(
        'document:AddEventListener("scalar-source", function(event) ' +
        'document:DispatchEvent("scalar-echo", ' +
        '{value = event.parameters.value}) end)', 'scalar-source.lua');

      for (const [ input, result ] of inputs) {
        expected = result;
        document.setAttribute('scalar', new rmlui.Variant(input));
        echoAttribute(document, 'scalar', value => {
          assert.equal(value, result);
        });
        document.dispatchEvent('scalar-source', {
          value: new rmlui.Variant(input),
        });
      }

      assert.equal(calls, inputs.length);
    },

  'lua-table-and-nil-parameters-follow-the-native-none-contract':
    ({ document }) => {
      let calls = 0;

      document.addEventListener('lua-none', event => {
        ++calls;
        assert.equal(event.parameters.table, null);
        assert.equal(event.getParameter('table', 73), 73);
        assert.equal(Object.hasOwn(event.parameters, 'table'), true);
        assert.equal(event.getParameter('omitted', 73), 73);
        assert.equal(Object.hasOwn(event.parameters, 'omitted'), false);
      });
      document.loadInlineScript(
        'document:DispatchEvent("lua-none", ' +
        '{table = {value = 5}, omitted = nil})', 'none-source.lua');

      assert.equal(calls, 1);
    },

  'nonempty-native-lists-survive-attribute-and-event-sources':
    ({ rmlui, document }) => {
      const inputs = [
        new rmlui.DecoratorList('image(example.png)'),
        new rmlui.FilterList('blur(2px) brightness(75%)'),
        new rmlui.FontEffectList([
          new rmlui.FontEffectList('outline(1px red)').list[0],
          new rmlui.FontEffectList('shadow(2px 3px blue)').list[0],
        ]),
        { type: 'transform', primitives: [
          rmlui.makeTransformPrimitive(
            rmlui.TransformPrimitiveType.TRANSLATE3D,
            [ 1, 2, 3 ].map(number => ({ number, unit: rmlui.Unit.PX }))),
        ] },
        { type: 'colorstoplist', values: [{
          color: {
            type: 'colourb-premultiplied',
            red: 128, green: 64, blue: 0, alpha: 128,
          },
          position: { number: 75, unit: rmlui.Unit.PERCENT },
        }] },
        { type: 'boxshadowlist', values: [{
          color: {
            type: 'colourb-premultiplied',
            red: 128, green: 64, blue: 0, alpha: 128,
          },
          offsetX: { number: -3, unit: rmlui.Unit.PX },
          offsetY: { number: 4, unit: rmlui.Unit.PX },
          blurRadius: { number: 5, unit: rmlui.Unit.PX },
          spreadDistance: { number: -2, unit: rmlui.Unit.PX },
          inset: true,
        }] },
      ];
      let expected;
      let source;
      let calls = 0;

      document.addEventListener('aggregate-echo', event => {
        ++calls;
        const actual = event.parameters.value;

        if (actual instanceof rmlui.DecoratorList ||
            actual instanceof rmlui.FilterList ||
            actual instanceof rmlui.FontEffectList) {
          assert.equal(actual.value, expected.value);
          assert.equal(actual.list.length, expected.list.length);
          assert.ok(source.equals(new rmlui.Variant(actual)));
        } else {
          assert.deepEqual(actual, expected);
        }
      });
      document.loadInlineScript(
        'document:AddEventListener("aggregate-source", function(event) ' +
        'document:DispatchEvent("aggregate-echo", ' +
        '{value = event.parameters.value}) end)', 'aggregate-source.lua');

      for (const input of inputs) {
        source = new rmlui.Variant(input);
        expected = source.value;
        document.setAttribute('aggregate', source);
        saveAttribute(document, 'aggregate');
        document.loadInlineScript(
          'document:DispatchEvent("aggregate-echo", ' +
          '{value = document:GetAttribute("aggregate")})',
          'aggregate-attribute.lua');
        document.dispatchEvent('aggregate-source', { value: source });
      }

      assert.equal(calls, inputs.length * 2);
    },

  'lua-native-tuples-round-trip-through-event-parameters':
    ({ rmlui, document }) => {
      const values = [
        [ 'Vector2f.new(2.5, -4)', { x: 2.5, y: -4 }],
        [ 'Colourb.new(12, 34, 56, 78)',
          { type: 'colourb', red: 12, green: 34, blue: 56, alpha: 78 }],
        [ 'Colourf.new(0.25, 0.5, 0.75, 1)',
          { type: 'colourf', red: 0.25, green: 0.5, blue: 0.75, alpha: 1 }],
      ];

      for (const [ expression, expected ] of values) {
        const source = new rmlui.Variant(expected);
        document.setAttribute('tuple', source);
        saveAttribute(document, 'tuple');
        echoAttribute(document, 'tuple', value => {
          assert.deepEqual(value, source.value);
        });

        let calls = 0;
        const listener = event => {
          ++calls;
          assert.deepEqual(event.parameters.value, source.value);
        };
        document.addEventListener('lua-tuple', listener);

        try {
          document.loadInlineScript(
            `document:DispatchEvent("lua-tuple", {value = ${expression}})`,
            'native-tuple.lua');
          assert.equal(calls, 1);
        } finally {
          document.removeEventListener('lua-tuple', listener);
        }
      }
    },

  'lua-runtime-objects-become-guarded-native-parameters':
    ({ rmlui, context, document }) => {
      let calls = 0;
      let eventCopy;

      document.addEventListener('native-objects', event => {
        ++calls;
        assert.equal(event.parameters.document, document);
        assert.equal(event.parameters.context, context);
        assert.equal(event.parameters.element, document);
        eventCopy = new rmlui.Variant(event.parameters.event);
      });
      document.loadInlineScript(
        'document:AddEventListener("source", function(event, element) ' +
        'document:DispatchEvent("native-objects", {' +
        'document = document, context = context, element = element, ' +
        'event = event}) end); document:DispatchEvent("source", {})',
        'native-objects.lua');

      assert.equal(calls, 1);
      assert.equal(eventCopy.getType(), rmlui.VariantType.SCRIPTINTERFACE);
      assert.equal(eventCopy.value, null);
    },

  'captured-function-keeps-lua-values-after-host-facade-gc':
    async ({ rmlui, context }) => {
      let objectRef;
      let hostRef;
      let fn;

      (() => {
        const host = new rmlui.LuaScriptHost({ allowInline: true });
        context.setScriptHost(host);
        const document = context.loadDocumentFromMemory(
          '<rml><head/><body/></rml>');
        const object = {};
        objectRef = new WeakRef(object);
        hostRef = new WeakRef(host);
        document.setAttribute('opaque', pointer(object));
        saveAttribute(document, 'opaque');
        host.execute('function retained() return saved ~= nil end');
        fn = host.getFunction('retained');
        document.close();
        context.update();
        context.setScriptHost(null);
      })();

      await collect();
      assert.equal(hostRef.deref(), undefined);
      assert.ok(objectRef.deref());
      assert.equal(fn.call(), true);

      fn.release();
      await collect();
      assert.equal(objectRef.deref(), undefined);
    },

  'shutdown-clears-lua-values-from-retained-host-facades':
    async ({ rmlui, host, document }) => {
      let objectRef;

      (() => {
        const object = {};
        objectRef = new WeakRef(object);
        document.setAttribute('opaque', pointer(object));
      })();

      saveAttribute(document, 'opaque');
      document.removeAttribute('opaque');
      rmlui.shutdown();
      await collect();

      assert.equal(objectRef.deref(), undefined);
      assert.throws(() => host.execute('return saved'),
        /not initialised|no longer valid/i);
    },

  'native-listener-keeps-lua-values-without-a-script-document':
    async ({ rmlui, context }) => {
      let objectRef;
      let hostRef;

      (() => {
        const host = new rmlui.LuaScriptHost({ allowInline: true });
        context.setScriptHost(host);
        const document = context.loadDocumentFromMemory(
          '<rml><head/><body/></rml>');
        const object = {};
        objectRef = new WeakRef(object);
        hostRef = new WeakRef(host);
        document.setAttribute('opaque', pointer(object));
        saveAttribute(document, 'opaque');
        document.loadInlineScript(
          'context:AddEventListener("vm-root", function() ' +
          'assert(saved ~= nil) end)', 'root-listener.lua');
        document.close();
        context.update();
        context.setScriptHost(null);
      })();

      await collect();
      assert.equal(hostRef.deref(), undefined);
      assert.ok(objectRef.deref());
      context.getRootElement().dispatchEvent('vm-root', {});

      context.remove();
      await collect();
      assert.equal(objectRef.deref(), undefined);
    },

  'native-data-model-keeps-lua-values-without-a-script-document':
    async ({ rmlui, context }) => {
      let objectRef;
      let hostRef;

      (() => {
        const host = new rmlui.LuaScriptHost({ allowInline: true });
        context.setScriptHost(host);
        const document = context.loadDocumentFromMemory(
          '<rml><head/><body/></rml>');
        const object = {};
        objectRef = new WeakRef(object);
        hostRef = new WeakRef(host);
        document.setAttribute('opaque', pointer(object));
        saveAttribute(document, 'opaque');
        document.loadInlineScript(
          'model = context:OpenDataModel("vm-values", {value = 5})',
          'model-owner.lua');
        document.close();
        context.update();
        context.setScriptHost(null);
      })();

      await collect();
      assert.equal(hostRef.deref(), undefined);
      assert.ok(objectRef.deref());

      assert.equal(context.removeDataModel('vm-values'), true);
      await collect();
      assert.equal(objectRef.deref(), undefined);
    },

  'registered-instancer-keeps-lua-values-after-host-facade-gc':
    async ({ rmlui, context }) => {
      let objectRef;
      let hostRef;

      (() => {
        const host = new rmlui.LuaScriptHost({ allowInline: true });
        context.setScriptHost(host);
        const document = context.loadDocumentFromMemory(
          '<rml><head/><body/></rml>');
        const object = {};
        objectRef = new WeakRef(object);
        hostRef = new WeakRef(host);
        document.setAttribute('opaque', pointer(object));
        saveAttribute(document, 'opaque');
        host.execute('allocator = ElementInstancer.new(function(tag) ' +
          'assert(saved ~= nil); return Element.new(tag) end); ' +
          'rmlui:RegisterTag("variant-owner", allocator)');
        document.close();
        context.update();
        context.setScriptHost(null);
      })();

      await collect();
      assert.equal(hostRef.deref(), undefined);
      assert.ok(objectRef.deref());

      rmlui.Factory.registerElementInstancer('variant-owner', null);
      await collect();
      assert.equal(objectRef.deref(), undefined);
    },

  'instancer-facade-keeps-lua-values-after-registration-removal':
    async ({ rmlui, context }) => {
      let objectRef;
      let hostRef;
      let facade;

      (() => {
        const host = new rmlui.LuaScriptHost({ allowInline: true });
        context.setScriptHost(host);
        const document = context.loadDocumentFromMemory(
          '<rml><head/><body/></rml>');
        const object = {};
        objectRef = new WeakRef(object);
        hostRef = new WeakRef(host);
        document.setAttribute('opaque', pointer(object));
        saveAttribute(document, 'opaque');
        host.execute('allocator = ElementInstancer.new(function(tag) ' +
          'assert(saved ~= nil); return Element.new(tag) end); ' +
          'rmlui:RegisterTag("variant-facade", allocator)');
        facade = rmlui.Factory.getElementInstancer('variant-facade');
        rmlui.Factory.registerElementInstancer('variant-facade', null);
        document.close();
        context.update();
        context.setScriptHost(null);
      })();

      await collect();
      assert.equal(hostRef.deref(), undefined);
      assert.ok(objectRef.deref());
      const element = facade.instanceElement(null, 'alive', {});
      facade.releaseElement(element);

      facade = null;
      await collect();
      assert.equal(objectRef.deref(), undefined);
    },

  'allocated-element-keeps-lua-values-without-an-instancer-facade':
    async ({ rmlui, context }) => {
      let objectRef;
      let element;

      (() => {
        const host = new rmlui.LuaScriptHost({ allowInline: true });
        context.setScriptHost(host);
        const document = context.loadDocumentFromMemory(
          '<rml><head/><body/></rml>');
        const object = {};
        objectRef = new WeakRef(object);
        document.setAttribute('opaque', pointer(object));
        saveAttribute(document, 'opaque');
        host.execute('allocator = ElementInstancer.new(function(tag) ' +
          'assert(saved ~= nil); return Element.new(tag) end); ' +
          'rmlui:RegisterTag("variant-allocation", allocator)');
        const facade = rmlui.Factory.getElementInstancer('variant-allocation');
        element = facade.instanceElement(null, 'allocated', {});
        rmlui.Factory.registerElementInstancer('variant-allocation', null);
        document.close();
        context.update();
        context.setScriptHost(null);
      })();

      await collect();
      assert.ok(objectRef.deref());
      assert.equal(element.tagName, 'allocated');

      element.release();
      await collect();
      assert.equal(objectRef.deref(), undefined);
    },

  'independent-context-model-listener-and-vm-cycles-remain-collectible':
    async ({ rmlui, context }) => {
      let objectRef;
      let contextRef;
      let hostRef;

      (() => {
        const owned = new rmlui.Context('lua-owner-cycle',
          context.getRenderManager(), null);
        const host = new rmlui.LuaScriptHost({ allowInline: true });
        owned.setScriptHost(host);
        const document = owned.loadDocumentFromMemory(
          '<rml><head/><body/></rml>');
        const object = { owned, host };
        objectRef = new WeakRef(object);
        contextRef = new WeakRef(owned);
        hostRef = new WeakRef(host);
        document.setAttribute('opaque', pointer(object));
        saveAttribute(document, 'opaque');
        document.loadInlineScript(
          'context:OpenDataModel("cycle", {value = 5}); ' +
          'context:AddEventListener("cycle", function() ' +
          'assert(saved ~= nil) end)', 'owner-cycle.lua');
        document.close();
        owned.update();
        owned.setScriptHost(null);
      })();

      await collect();
      assert.equal(objectRef.deref(), undefined);
      assert.equal(contextRef.deref(), undefined);
      assert.equal(hostRef.deref(), undefined);
    },

  'lua-owned-copy-retains-an-opaque-object-until-lua-gc':
    async ({ host, document }) => {
      let reference;

      (() => {
        const object = {};
        reference = new WeakRef(object);
        document.setAttribute('opaque', pointer(object));
      })();

      saveAttribute(document, 'opaque');
      document.removeAttribute('opaque');
      await collect();
      assert.ok(reference.deref());

      host.execute('saved = nil; collectgarbage("collect")');
      await collect();
      assert.equal(reference.deref(), undefined);
    },

  'native-document-keeps-lua-copy-after-host-facade-gc':
    async ({ rmlui, context }) => {
      let objectRef;
      let hostRef;
      let document;

      (() => {
        const host = new rmlui.LuaScriptHost({ allowInline: true });
        context.setScriptHost(host);
        document = context.loadDocumentFromMemory(
          '<rml><head/><body/></rml>');
        const object = {};
        objectRef = new WeakRef(object);
        hostRef = new WeakRef(host);
        document.setAttribute('opaque', pointer(object));
        saveAttribute(document, 'opaque');
        document.removeAttribute('opaque');
      })();

      await collect();
      assert.equal(hostRef.deref(), undefined);
      assert.ok(objectRef.deref());

      let calls = 0;
      document.addEventListener('saved-copy', event => {
        ++calls;
        assert.equal(event.parameters.value, objectRef.deref());
      });
      document.loadInlineScript(
        'document:DispatchEvent("saved-copy", {value = saved})',
        'saved-copy.lua');
      assert.equal(calls, 1);

      document.close();
      context.update();
      context.setScriptHost(null);
      await collect();
      assert.equal(objectRef.deref(), undefined);
    },

  'lua-host-and-opaque-object-self-cycle-remains-collectible':
    async ({ rmlui, context }) => {
      let objectRef;
      let hostRef;

      (() => {
        const host = new rmlui.LuaScriptHost({ allowInline: true });
        context.setScriptHost(host);
        const document = context.loadDocumentFromMemory(
          '<rml><head/><body/></rml>');
        const object = { host };
        objectRef = new WeakRef(object);
        hostRef = new WeakRef(host);
        document.setAttribute('opaque', pointer(object));
        saveAttribute(document, 'opaque');
        document.removeAttribute('opaque');
        document.close();
        context.update();
        context.setScriptHost(null);
      })();

      await collect();
      assert.equal(hostRef.deref(), undefined);
      assert.equal(objectRef.deref(), undefined);
    },

  'unchanged-lua-copies-do-not-scan-all-owners':
    ({ context, document }) => {
      document.setAttribute('opaque', pointer({ value: 3 }));
      saveAttribute(document, 'opaque');
      context.update();

      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics();
      for (let index = 0; index < 16; ++index) {
        context.update();
      }
      const counts = native.endDataDiagnostics();

      assert.equal(counts.callbackSnapshotVisits, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Lua native Variants');
  assert.ok(rmlui.initialise(window, { highDpi: false }));

  try {
    const context = rmlui.createContext('lua-variants', 160, 120);
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    await cases[name]({ rmlui, window, context, host, document });
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

  assert.equal(failures, 0, `${failures} Lua Variant failures`);
}
