'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let index = 0; index < 16; ++index) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function makeValue(rmlui, kind, owner) {
  if (kind === 'nested-decorator' || kind === 'nested-filter') {
    const values = [
      { type: 'voidptr', value: owner },
      makeValue(rmlui, 'font', owner),
      makeValue(rmlui, 'transition', owner),
      makeValue(rmlui, 'animation', owner),
    ];

    if (kind === 'nested-decorator') {
      const declaration = new rmlui.DecoratorDeclaration();
      declaration.type = 'lua-callback-values';
      declaration.properties = values.map((value, index) => ({
        id: index + 1,
        property: new rmlui.Property(value),
      }));
      return new rmlui.DecoratorList([ declaration ]);
    }

    let nested;

    for (const value of values.reverse()) {
      const entry = new rmlui.FilterList('blur(2px)').list[0];
      entry.properties[0].property = new rmlui.Property(nested ?? value);
      nested = new rmlui.FilterList([ entry ]);
    }

    // Named declarations retain all filter branches in one native snapshot.
    const declaration = new rmlui.DecoratorDeclaration();
    declaration.type = 'lua-nested-filters';
    declaration.properties = values.map((value, index) => {
      const entry = new rmlui.FilterList('blur(2px)').list[0];
      entry.properties[0].property = new rmlui.Property(value);
      return {
        id: index + 1,
        property: new rmlui.Property(new rmlui.FilterList([ entry ])),
      };
    });
    declaration.properties.push({
      id: 5,
      property: new rmlui.Property(nested),
    });
    return new rmlui.DecoratorList([ declaration ]);
  }

  if (kind === 'font') {
    return new rmlui.FontEffectList([
      new rmlui.FontEffect({
        hasUniqueTexture() {
          ++owner.calls;
          return true;
        },
      }),
    ]);
  }

  const tween = new rmlui.Tween(t => {
    ++owner.calls;
    return t * t;
  });

  if (kind === 'transition') {
    return rmlui.makeTransitionList({
      none: false,
      transitions: [
        rmlui.makeTransition({
          id: rmlui.PropertyId.Width, duration: 1, tween,
        }),
      ],
    });
  }

  return {
    type: 'animationlist',
    animations: [ rmlui.makeAnimation({ duration: 1, tween }) ],
  };
}

function invokeValue(rmlui, value, owner) {
  if (value instanceof rmlui.DecoratorList ||
      value instanceof rmlui.FilterList) {
    for (const declaration of value.list) {
      for (const entry of declaration.properties) {
        invokeValue(rmlui, entry.property.value, owner);
      }
    }
  } else if (value instanceof rmlui.FontEffectList) {
    assert.equal(value.list[0].hasUniqueTexture, true);
  } else if (value.type === 'transitionlist') {
    assert.equal(value.transitions[0].tween.evaluate(0.5), 0.25);
  } else if (value.type === 'animationlist') {
    assert.equal(value.animations[0].tween.evaluate(0.5), 0.25);
  } else {
    assert.equal(value, owner);
  }
}

async function run(kind) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Lua callback ownership');
  assert.ok(rmlui.initialise(window, { highDpi: false }));

  try {
    const context = rmlui.createContext('lua-callback-owners', 160, 120);
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    let ownerRef;

    (() => {
      const owner = { calls: 0 };
      ownerRef = new WeakRef(owner);
      document.setAttribute('callbacks', makeValue(rmlui, kind, owner));
    })();

    document.loadInlineScript(
      'savedCallbacks = document:GetAttribute("callbacks")',
      'callback-copy.lua');
    document.removeAttribute('callbacks');
    document.close();
    context.update();
    context.setScriptHost(null);
    await collect();
    assert.ok(ownerRef.deref(), `${kind}: Lua copy lost its callback owner`);

    context.setScriptHost(host);
    const receiver = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    let calls = 0;
    receiver.addEventListener('callback-copy', event => {
      ++calls;
      const value = event.parameters.value;

      invokeValue(rmlui, value, ownerRef.deref());
    });
    receiver.loadInlineScript(
      'document:DispatchEvent("callback-copy", {value = savedCallbacks})',
      'callback-echo.lua');
    assert.equal(calls, 1);
    assert.equal(ownerRef.deref().calls,
      kind === 'nested-decorator' ? 3 : kind === 'nested-filter' ? 4 : 1);

    const native = require('../../build/Release/rmlui.node');
    native.beginDataDiagnostics();

    for (let index = 0; index < 16; ++index) {
      context.update();
    }

    const counts = native.endDataDiagnostics();
    assert.equal(counts.luaVariantOwnerPasses, 0);
    assert.equal(counts.callbackSnapshotVisits, 0);
    assert.equal(counts.elementOwnershipVisits, 0);

    host.execute('savedCallbacks = nil; collectgarbage("collect")');
    await collect();
    assert.equal(ownerRef.deref(), undefined,
      `${kind}: cleared Lua copy retained its callback owner`);
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

async function runOwner(mode, kind = 'nested-decorator') {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Lua callback VM owners');
  assert.ok(rmlui.initialise(window, { highDpi: false }));

  try {
    const context = mode === 'owned-selection'
      ? new rmlui.Context('lua-callback-selection',
        rmlui.createContext('render-owner', 160, 120).getRenderManager(), null)
      : rmlui.createContext('lua-callback-roots', 160, 120);
    let ownerRef;
    let hostRef;
    let clearFunction;
    let allocated;
    let facade;

    (() => {
      const host = new rmlui.LuaScriptHost({ allowInline: true });
      const owner = { calls: 0 };
      ownerRef = new WeakRef(owner);
      hostRef = new WeakRef(host);
      context.setScriptHost(host);
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body/></rml>');

      if (mode === 'host-cycle') {
        owner.host = host;
      }

      document.setAttribute('callbacks',
        makeValue(rmlui, kind, owner));
      document.loadInlineScript(
        'savedCallbacks = document:GetAttribute("callbacks")',
        'callback-owner-copy.lua');
      document.removeAttribute('callbacks');

      if (mode === 'native-listener') {
        document.loadInlineScript(
          'context:AddEventListener("vm-callback", ' +
          'function(event, element) ' +
          'element:DispatchEvent("callback-copy", ' +
          '{value = savedCallbacks}) end)', 'callback-native-listener.lua');
      } else if (mode === 'native-model') {
        document.loadInlineScript(
          'context:OpenDataModel("callback-owner", {value = 5})',
          'callback-model.lua');
      } else if (mode === 'owned-selection') {
        host.execute('function clearSaved() ' +
          'savedCallbacks = nil; collectgarbage("collect") end');
        clearFunction = host.getFunction('clearSaved');
      } else if (mode === 'allocated' || mode === 'shutdown-instancer') {
        host.execute('allocator = ElementInstancer.new(function(tag) ' +
          'assert(savedCallbacks ~= nil); return Element.new(tag) end); ' +
          'rmlui:RegisterTag("callback-allocation", allocator)');
        facade = rmlui.Factory.getElementInstancer('callback-allocation');
        allocated = facade.instanceElement(null, 'callback-allocated', {});
        rmlui.Factory.registerElementInstancer('callback-allocation', null);

        if (mode === 'allocated') {
          facade = null;
        }
      }

      document.close();
      context.update();

      if (mode !== 'owned-selection') {
        context.setScriptHost(null);
      }
    })();

    await collect();
    assert.equal(hostRef.deref(), undefined);

    if (mode === 'host-cycle') {
      assert.equal(ownerRef.deref(), undefined);
      return;
    }

    assert.ok(ownerRef.deref(), `${mode}: native VM lost callback owners`);

    if (mode === 'native-listener') {
      let calls = 0;
      const root = context.getRootElement();
      root.addEventListener('callback-copy', event => {
        ++calls;
        invokeValue(rmlui, event.parameters.value, ownerRef.deref());
      });
      root.dispatchEvent('vm-callback', {});
      assert.equal(calls, 1);
      assert.equal(ownerRef.deref().calls, 3);
      context.remove();
    } else if (mode === 'native-model') {
      assert.equal(context.removeDataModel('callback-owner'), true);
    } else if (mode === 'owned-selection') {
      clearFunction.call();
    } else if (mode === 'allocated') {
      allocated.release();
    } else {
      rmlui.shutdown();
      assert.throws(() => facade.instanceElement(null, 'expired', {}),
        /not initialised|no longer valid/i);
    }

    await collect();
    assert.equal(ownerRef.deref(), undefined,
      `${mode}: released or empty native VM retained callback owners`);
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  const operation = process.argv[2].startsWith('owner:')
    ? runOwner(...process.argv[2].slice(6).split(':')) : run(process.argv[2]);
  operation.catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;

  for (const kind of [
    'transition', 'animation', 'font', 'nested-decorator', 'nested-filter',
    'owner:host-cycle', 'owner:native-listener', 'owner:native-model',
    'owner:owned-selection', 'owner:allocated', 'owner:shutdown-instancer',
    'owner:owned-selection:font', 'owner:owned-selection:transition',
    'owner:owned-selection:animation',
  ]) {
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, kind ],
      { encoding: 'utf8', timeout: 20000 });

    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${kind}: ${result.status}`, result.stderr);
    } else {
      console.log(`PASS ${kind}`);
    }
  }

  assert.equal(failures, 0, `${failures} Lua callback failures`);
}
