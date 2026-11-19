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
  'constructors-handles-and-context-invalidation': ({ rmlui, context }) => {
    assert.equal(context.getDataModel('missing'), null);
    assert.deepEqual(context.getDataModels(), {});
    const model = context.createDataModel('application');
    assert.ok(model instanceof rmlui.DataModelConstructor);
    assert.equal(context.createDataModel('application'), null);
    assert.equal(context.getDataModel('application'), model);
    assert.equal(context.getDataModels().application, model);
    const handle = model.getModelHandle();
    assert.ok(handle instanceof rmlui.DataModelHandle);
    assert.equal(handle.isValid, true);
    assert.equal(model.bind('count', 1), true);
    assert.equal(model.bind('count', 2), false);
    const variable = model.getVariable('count');
    assert.equal(variable.get(), 1);
    assert.equal(context.removeDataModel('absent'), false);
    assert.equal(context.removeDataModel('application'), true);
    assert.equal(handle.isValid, false);
    assert.throws(() => variable.get(), /model.*valid/i);
    assert.throws(() => handle.dirtyVariable('count'), /model.*valid/i);
    const replacement = context.createDataModel('application');
    assert.notEqual(replacement, model);
    assert.equal(replacement.bind('count', 5), true);
    assert.equal(replacement.getVariable('count').get(), 5);
    context.remove();
    assert.equal(replacement.isValid, false);
  },

  'native-scalars-dirty-roots-and-live-rml-views': ({ rmlui, context }) => {
    const model = context.createDataModel('application');
    assert.equal(model.bind('count', 4), true);
    assert.equal(model.bind('title', '初期'), true);
    assert.equal(model.bind('enabled', true), true);
    assert.equal(model.bind('large', 9007199254740993n), true);
    const count = model.getVariable('$.count');
    assert.equal(count.type, rmlui.DataVariableType.Scalar);
    assert.equal(model.getVariable('missing'), null);
    assert.equal(model.getVariable('count.child'), null);
    assert.equal(count.set('7'), true);
    assert.equal(count.get(), 7);
    // Upstream's String-to-double converter uses atof and returns true.
    assert.equal(count.set('invalid'), true);
    assert.equal(count.get(), 0);
    count.set(7);
    assert.equal(model.getVariable('large').get(), 9007199254740993n);
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="application"><div id="output">{{title}}:{{count}}</div>' +
      '<div id="visibility" data-visible="enabled">enabled</div></body></rml>');
    document.show();
    context.update();
    assert.match(document.getElementById('output').innerRML, /初期:7/);
    const handle = model.getModelHandle();
    assert.equal(handle.isVariableDirty('count'), false);
    count.set(12);
    assert.equal(handle.isVariableDirty('count'), false);
    handle.dirtyVariable('count');
    assert.equal(handle.isVariableDirty('count'), true);
    model.update();
    assert.equal(handle.isVariableDirty('count'), false);
    assert.match(document.getElementById('output').innerRML, /初期:12/);
    model.getVariable('title').set('更新');
    handle.dirtyAllVariables();
    context.update();
    assert.match(document.getElementById('output').innerRML, /更新:12/);
  },

  'native-function-bindings-transforms-and-two-way-controls': ({ context }) => {
    const model = context.createDataModel('application');
    let name = 'initial';
    assert.equal(model.bindFunc('name', () => name, value => {
      name = value;
    }), true);
    assert.equal(model.bindFunc('readonly', () => 11), true);
    model.registerTransformFunc('decorate',
      args => `${args[1]}${args[0]}${args[1]}`);
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="application">' +
      '<div id="output">{{name | decorate(\'!\')}}</div>' +
      '<input id="input" type="text" data-value="name"/>' +
      '<div id="readonly">{{readonly}}</div></body></rml>');
    document.show();
    context.update();
    assert.match(document.getElementById('output').innerRML, /!initial!/);
    assert.equal(model.getVariable('readonly').set(8), false);
    document.getElementById('input').dispatchEvent('change',
      { value: 'from-input' });
    assert.equal(name, 'from-input');
    context.update();
    assert.match(document.getElementById('output').innerRML, /!from-input!/);
    assert.equal(model.getVariable('name').set('direct'), true);
    model.getModelHandle().dirtyVariable('name');
    context.update();
    assert.match(document.getElementById('output').innerRML, /!direct!/);
  },

  'model-events-and-expiring-leases': ({ context }) => {
    const model = context.createDataModel('application');
    model.bind('count', 2);
    let retained;
    let calls = 0;
    model.bindEventCallback('increment', (handle, event, args) => {
      ++calls;
      retained = event;
      assert.deepEqual(args, [ 3, 'text' ]);
      assert.equal(event.currentTarget.id, 'button');
      assert.equal(handle.isValid, true);
      const count = model.getVariable('count');
      count.set(count.get() + args[0]);
      handle.dirtyVariable('count');
      assert.throws(() => context.removeDataModel('application'), /callback/i);
      assert.throws(() => context.remove(), /callback/i);
      event.stopPropagation();
    });
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="application"><button id="button" ' +
      'data-event-click="increment(3, \'text\')">click</button></body></rml>');
    document.show();
    context.update();
    document.getElementById('button').click();
    assert.equal(calls, 1);
    assert.equal(model.getVariable('count').get(), 5);
    assert.throws(() => retained.stopPropagation(), /expired|valid/i);
  },

  'callback-errors-and-recovery': ({ context }) => {
    const model = context.createDataModel('application');
    const failure = new Error('model getter failure');
    let fail = true;
    model.bindFunc('value', () => {
      if (fail) {
        throw failure;
      }
      return 6;
    });
    assert.throws(() => {
      context.loadDocumentFromMemory('<rml><head/><body ' +
        'data-model="application"><div>{{value}}</div></body></rml>');
    }, error => error === failure);
    const document = context.getDocument(0);
    assert.ok(document);
    fail = false;
    model.getModelHandle().dirtyAllVariables();
    context.update();
    document.show();
    assert.equal(model.getVariable('value').get(), 6);
    model.bindFunc('destructive', () => {
      context.removeDataModel('application');
      return 1;
    });
    assert.throws(() => model.getVariable('destructive').get(), /callback/i);
    assert.equal(model.isValid, true);
    model.bindFunc('setter', () => 1, () => {
      throw failure;
    });
    assert.throws(() => model.getVariable('setter').set(2),
      error => error === failure);
    assert.equal(model.getVariable('setter').get(), 1);
  },

  'callback-owners-live-and-removed-collect': async ({ context }) => {
    let getterWeak;
    let setterWeak;
    let callbackWeak;
    let transformWeak;
    const model = context.createDataModel('application');
    (() => {
      const getter = () => 1;
      const setter = () => {};
      const callback = () => {};
      const transform = args => String(args[0]);
      getterWeak = new WeakRef(getter);
      setterWeak = new WeakRef(setter);
      callbackWeak = new WeakRef(callback);
      transformWeak = new WeakRef(transform);
      model.bindFunc('value', getter, setter);
      model.bindEventCallback('handler', callback);
      model.registerTransformFunc('kept', transform);
    })();
    await collect();
    assert.equal(typeof getterWeak.deref(), 'function');
    assert.equal(typeof setterWeak.deref(), 'function');
    assert.equal(typeof callbackWeak.deref(), 'function');
    context.removeDataModel('application');
    await collect();
    assert.equal(getterWeak.deref(), undefined);
    assert.equal(setterWeak.deref(), undefined);
    assert.equal(callbackWeak.deref(), undefined);
    assert.equal(typeof transformWeak.deref(), 'function');
    const replacement = context.createDataModel('replacement');
    replacement.bind('value', 'retained');
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="replacement"><div>{{value | kept}}</div></body></rml>');
    document.show();
    context.update();
    assert.match(document.innerRML, /retained/);
    context.remove();
    await collect();
    assert.equal(transformWeak.deref(), undefined);
  },

  'owned-context-callback-cycles-collect': async ({ rmlui, context }) => {
    let contextWeak;
    let modelWeak;
    let callbackWeak;
    let retainedVariable;
    (() => {
      const owned = rmlui.Factory.instanceContext(
        'owned-data', context.getRenderManager(), null);
      const model = owned.createDataModel('application');
      const getter = () => {
        assert.equal(owned.name, 'owned-data');
        return 3;
      };
      contextWeak = new WeakRef(owned);
      modelWeak = new WeakRef(model);
      callbackWeak = new WeakRef(getter);
      model.bindFunc('value', getter);
      retainedVariable = model.getVariable('value');
    })();
    await collect();
    assert.ok(contextWeak.deref());
    assert.ok(callbackWeak.deref());
    assert.equal(retainedVariable.get(), 3);
    retainedVariable = null;
    await collect();
    assert.equal(contextWeak.deref(), undefined);
    assert.equal(modelWeak.deref(), undefined);
    assert.equal(callbackWeak.deref(), undefined);
  },

  'same-getter-recursion-rejects-and-callbacks-recover': ({ context }) => {
    const model = context.createDataModel('application');
    let recursive = true;
    model.bindFunc('value', () => {
      if (recursive) {
        return model.getVariable('value').get();
      }
      return 3;
    });
    assert.throws(() => model.getVariable('value').get(), /recursiv/i);
    recursive = false;
    assert.equal(model.getVariable('value').get(), 3);
  },

  'duplicate-transforms-retain-first-callback': async ({ context }) => {
    const model = context.createDataModel('application');
    let previousWeak;
    (() => {
      const previous = args => String(args[0]);
      previousWeak = new WeakRef(previous);
      model.registerTransformFunc('replaceable', previous);
    })();
    let rejectedWeak;
    (() => {
      const rejected = () => 'replacement';
      rejectedWeak = new WeakRef(rejected);
      model.registerTransformFunc('replaceable', rejected);
    })();
    await collect();
    assert.equal(typeof previousWeak.deref(), 'function');
    assert.equal(rejectedWeak.deref(), undefined);
    model.bind('value', 'initial');
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="application">' +
      '<div>{{value | replaceable}}</div></body></rml>');
    assert.match(document.innerRML, /initial/);
    model.registerTransformFunc('to_upper', () => 'rejected-builtin');
    document.innerRML = '<div>{{value | to_upper}}</div>';
    model.dirtyAllVariables();
    context.update();
    assert.match(document.innerRML, /INITIAL/);
  },

  'late-binding-and-shutdown': ({ rmlui, context }) => {
    const model = context.createDataModel('late',
      { allowMissingVariables: true });
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="late"><div id="late">{{future}}</div></body></rml>');
    document.show();
    context.update();
    assert.equal(model.bind('future', 'bound-later'), true);
    model.dirtyVariable('future');
    context.update();
    assert.match(document.getElementById('late').innerRML, /bound-later/);
    const variable = model.getVariable('future');
    rmlui.shutdown();
    assert.equal(model.isValid, false);
    assert.throws(() => variable.get(), /initiali[sz]|valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Data models');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('data-models', 200, 160);
    await cases[name]({ rmlui, context });
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
  assert.equal(failures, 0, `${failures} data model failures`);
}
