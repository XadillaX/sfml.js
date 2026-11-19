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
  'shared-registers-and-real-family-identities': ({ rmlui, context }) => {
    const register = new rmlui.DataTypeRegister();
    const scalar = register.registerScalar('Real', 'float64');
    assert.equal(register.getDefinition('Real'), scalar);
    assert.equal(register.getDefinition('absent'), null);
    assert.equal(register.registerScalar('Real', 'int32'), null);
    const record = register.registerStruct('Record');
    assert.notEqual(record.familyId, scalar.familyId);
    assert.equal(record.registerMember('value', scalar), true);
    assert.equal(record.registerMember('value', scalar), false);
    const other = rmlui.createContext('other-data', 200, 160);
    const first = context.createDataModel('first', { typeRegister: register });
    const second = other.createDataModel('second', { typeRegister: register });
    assert.equal(first.getDataTypeRegister(), register);
    assert.equal(second.getDataTypeRegister(), register);
    assert.equal(first.bind('record', { value: 4 }, record), true);
    assert.equal(second.bind('record', { value: 8 }, record), true);
    assert.equal(first.getVariable('record.value').get(), 4);
    context.remove();
    assert.equal(scalar.isValid, true);
    assert.equal(second.getVariable('record.value').get(), 8);
    other.remove();
    assert.equal(register.isValid, true);
    rmlui.shutdown();
    assert.equal(register.isValid, false);
    assert.equal(scalar.isValid, false);
    assert.throws(() => register.registerStruct('After'), /valid|initiali/i);
  },

  'default-register-survives-model-removal-and-checks-provenance':
    ({ rmlui, context }) => {
      const first = context.createDataModel('first');
      const register = first.getDataTypeRegister();
      const scalar = register.registerScalar('Counter', 'int32');
      const record = register.registerStruct('Record');
      record.registerMember('counter', scalar);
      context.removeDataModel('first');
      const next = context.createDataModel('next');
      assert.equal(next.getDataTypeRegister(), register);
      assert.equal(next.bind('record', { counter: 3 }, record), true);
      const foreign = new rmlui.DataTypeRegister();
      const foreignScalar = foreign.registerScalar('Counter', 'int32');
      assert.throws(() => record.registerMember('foreign', foreignScalar),
        /register/i);
      assert.throws(() => next.bind('foreign', 1, foreignScalar), /register/i);
      context.remove();
      assert.equal(register.isValid, false);
      assert.equal(record.isValid, false);
    },

  'numeric-widths-shared-views-and-safe-native-controller-conversion':
    ({ context }) => {
      const model = context.createDataModel('numbers');
      const register = model.getDataTypeRegister();
      const fixtures = [
        [ 'int8', Int8Array, -128, 128 ],
        [ 'uint8', Uint8Array, 255, 256 ],
        [ 'int16', Int16Array, -32768, 32768 ],
        [ 'uint16', Uint16Array, 65535, 65536 ],
        [ 'int32', Int32Array, -2147483648, 2147483648 ],
        [ 'uint32', Uint32Array, 4294967295, 4294967296 ],
        [ 'int64', BigInt64Array, -9223372036854775808n, 2 ** 63 ],
        [ 'uint64', BigUint64Array, 18446744073709551615n, 2 ** 64 ],
        [ 'float32', Float32Array, 1.25, null ],
        [ 'float64', Float64Array, 1.25, null ],
      ];
      for (const [ kind, View, value, overflow ] of fixtures) {
        const scalar = register.registerScalar(kind, kind);
        const array = register.registerArray(`${kind}Array`, scalar);
        assert.doesNotThrow(() => {
          assert.equal(model.bind(kind, [ value, value ], array), true);
        }, kind);
        const variable = model.getVariable(kind);
        const view = variable.getNumericView();
        assert.ok(view instanceof View);
        assert.equal(view[0], value);
        assert.equal(variable.child(0).get(), value);
        view[1] = kind.endsWith('64') && kind.includes('int') ? 3n : 3;
        assert.equal(variable.child(1).get(), view[1]);
        if (overflow !== null) {
          assert.equal(variable.child(0).set(overflow), false);
          assert.equal(view[0], value);
        }
      }
      const document = context.loadDocumentFromMemory('<rml><head/><body ' +
        'data-model="numbers"><input id="byte" type="text" ' +
        'data-value="uint8[0]"/></body></rml>');
      document.getElementById('byte').dispatchEvent('change', { value: 300 });
      assert.equal(model.getVariable('uint8[0]').get(), 255);
      document.getElementById('byte').dispatchEvent('change', { value: 7 });
      assert.equal(model.getVariable('uint8[0]').get(), 7);
    },

  'recursive-record-arrays-reflection-and-native-for-view': ({ context }) => {
    const model = context.createDataModel('tree');
    const register = model.getDataTypeRegister();
    const text = register.registerScalar('Text', 'string');
    const node = register.registerStruct('Node');
    const nodes = register.registerArray('Nodes', node);
    assert.equal(node.registerMember('title', text), true);
    assert.equal(node.registerMember('children', nodes), true);
    assert.equal(model.bind('roots', [
      { title: 'parent', children: [{ title: 'child', children: [] }] },
    ], nodes), true);
    const roots = model.getVariable('roots');
    assert.equal(roots.size, 1);
    assert.equal(roots.child('size').get(), 1);
    assert.equal(roots.child(-1), null);
    assert.equal(roots.child(2), null);
    assert.deepEqual(roots.child(0).reflectMemberNames(),
      [ 'title', 'children' ]);
    assert.equal(model.getVariable('roots[0].children[0].title').get(),
      'child');
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="tree"><div data-for="node : roots">' +
      '<span>{{node.title}}</span><div data-for="child : node.children">' +
      '{{child.title}}</div></div></body></rml>');
    document.show();
    context.update();
    assert.match(document.innerRML, /parent/);
    assert.match(document.innerRML, /child/);
    const retained = model.getVariable('roots[0].children[0].title');
    roots.resize(0);
    model.dirtyVariable('roots');
    context.update();
    assert.throws(() => retained.get(), /path.*valid/i);
    roots.resize(1);
    model.dirtyVariable('roots');
    context.update();
    assert.equal(roots.size, 1);
    assert.equal(model.getVariable('roots[0].title').get(), '');
  },

  'resize-keeps-old-buffers-and-sparse-patches-touch-only-targets':
    async ({ context }) => {
      const model = context.createDataModel('patches');
      const register = model.getDataTypeRegister();
      const scalar = register.registerScalar('Real', 'float64');
      const array = register.registerArray('Reals', scalar);
      model.bind('values', [ 1, 2 ], array);
      model.bind('untouched', 11);
      const variable = model.getVariable('values');
      const child = variable.child(1);
      const old = variable.getNumericView();
      variable.resize(4);
      const current = variable.getNumericView();
      assert.notEqual(current.buffer, old.buffer);
      assert.deepEqual(Array.from(current), [ 1, 2, 0, 0 ]);
      old[1] = 99;
      assert.equal(child.get(), 2);
      current[1] = 8;
      assert.equal(child.get(), 8);
      model.update();
      assert.equal(model.applyPatch({ '$.values[1]': 12 }), true);
      assert.equal(child.get(), 12);
      assert.equal(model.isVariableDirty('values'), true);
      assert.equal(model.isVariableDirty('untouched'), false);
      const failure = new Error('conversion failed');
      assert.throws(() => model.applyPatch({
        '$.values[0]': 5,
        get '$.values[1]'() {
          throw failure;
        },
      }), error => error === failure);
      assert.equal(current[0], 1);
      context.remove();
      await collect();
      assert.deepEqual(Array.from(current), [ 1, 12, 0, 0 ]);
      assert.deepEqual(Array.from(old), [ 1, 99 ]);
    },

  'shared-register-owned-context-cycles-collect': async env => {
    const { rmlui, context } = env;
    let contextWeak;
    let registerWeak;
    let scalarWeak;
    (() => {
      const owned = rmlui.Factory.instanceContext(
        'owned-schema', context.getRenderManager(), null);
      const register = new rmlui.DataTypeRegister();
      const scalar = register.registerScalar('Number', 'float64');
      const array = register.registerArray('Numbers', scalar);
      const model = owned.createDataModel('cycle', { typeRegister: register });
      model.bind('values', [ 1, 2 ], array);
      model.bindFunc('cycle', () => {
        assert.equal(owned.name, 'owned-schema');
        assert.equal(scalar.isValid, true);
        return 1;
      });
      contextWeak = new WeakRef(owned);
      registerWeak = new WeakRef(register);
      scalarWeak = new WeakRef(scalar);
    })();
    await collect();
    assert.equal(contextWeak.deref(), undefined);
    assert.equal(registerWeak.deref(), undefined);
    assert.equal(scalarWeak.deref(), undefined);
  },

  'storage-accessors-cannot-leave-dangling-native-definitions': env => {
    const { rmlui, context } = env;
    const model = context.createDataModel('removed-model');
    const register = model.getDataTypeRegister();
    const scalar = register.registerScalar('Real', 'float64');
    const record = register.registerStruct('Record');
    record.registerMember('value', scalar);
    assert.throws(() => model.bind('record', {
      get value() {
        context.removeDataModel('removed-model');
        return 3;
      },
    }, record), /model.*valid/i);
    const next = context.createDataModel('removed-context');
    assert.throws(() => next.bind('record', {
      get value() {
        context.remove();
        return 3;
      },
    }, record), /schema.*valid/i);
    const independent = new rmlui.DataTypeRegister();
    const ownScalar = independent.registerScalar('Real', 'float64');
    const ownRecord = independent.registerStruct('Record');
    ownRecord.registerMember('value', ownScalar);
    const other = rmlui.createContext('shutdown-conversion', 200, 160);
    const otherModel = other.createDataModel('shutdown',
      { typeRegister: independent });
    assert.throws(() => otherModel.bind('record', {
      get value() {
        rmlui.shutdown();
        return 3;
      },
    }, ownRecord), /schema.*valid/i);
  },

  'boolean-string-arrays-and-schema-freezing': ({ context }) => {
    const model = context.createDataModel('scalars');
    const register = model.getDataTypeRegister();
    const boolean = register.registerScalar('Boolean', 'bool');
    const text = register.registerScalar('Text', 'string');
    const booleans = register.registerArray('Booleans', boolean);
    const texts = register.registerArray('Texts', text);
    const record = register.registerStruct('Record');
    record.registerMember('text', text);
    let reads = 0;
    model.bind('record', {
      text: 'kept',
      get unregistered() {
        ++reads;
        throw new Error('unregistered member was read');
      },
    }, record);
    assert.equal(reads, 0);
    assert.throws(() => record.registerMember('late', text), /frozen/i);
    assert.equal(model.bind('booleans', [ true, false ], booleans), true);
    assert.equal(model.bind('texts', [ 'first', '第二' ], texts), true);
    const values = model.getVariable('booleans');
    assert.equal(values.child(0).get(), true);
    values.child(1).set(true);
    assert.equal(values.child(1).get(), true);
    assert.throws(() => values.getNumericView(), /numeric/i);
    values.resize(3);
    assert.equal(values.child(2).get(), false);
    const strings = model.getVariable('texts');
    strings.resize(3);
    assert.equal(strings.child(1).get(), '第二');
    assert.equal(strings.child(2).get(), '');
    assert.equal(strings.child(0).set(5), true);
    assert.equal(strings.child(0).get(), '5');
  },

  'shared-transform-callbacks-survive-mixed-context-ownership': async env => {
    const { rmlui, context } = env;
    const register = new rmlui.DataTypeRegister();
    const owned = rmlui.Factory.instanceContext(
      'owned-transform-data', context.getRenderManager(), null);
    const first = context.createDataModel('first', { typeRegister: register });
    const second = owned.createDataModel('second', { typeRegister: register });
    let callbackWeak;
    (() => {
      const callback = args => `shared:${args[0]}`;
      callbackWeak = new WeakRef(callback);
      first.registerTransformFunc('shared', callback);
    })();
    await collect();
    assert.equal(typeof callbackWeak.deref(), 'function');
    second.bind('value', 'retained');
    context.removeDataModel('first');
    await collect();
    assert.equal(typeof callbackWeak.deref(), 'function');
    const document = owned.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="second"><div>{{value | shared}}</div></body></rml>');
    assert.match(document.innerRML, /shared:retained/);
    assert.equal(owned.removeDataModel('second'), true);
    await collect();
    // The independently owned register still retains its transform callback.
    assert.equal(typeof callbackWeak.deref(), 'function');
    rmlui.shutdown();
    await collect();
    assert.equal(callbackWeak.deref(), undefined);
  },

  'sparse-patch-guards-inferred-integers-and-removal-accessors':
    ({ context }) => {
      const model = context.createDataModel('patches');
      model.bind('signed', 3n);
      model.bind('unsigned', 18446744073709551615n);
      model.bind('later', 1);
      assert.throws(() => model.applyPatch({
        '$.signed': 2 ** 63,
        '$.later': 2,
      }), /integer range/i);
      assert.equal(model.getVariable('signed').get(), 3n);
      assert.equal(model.getVariable('later').get(), 1);
      assert.throws(() => model.applyPatch({
        get '$.unsigned'() {
          context.removeDataModel('patches');
          return 5n;
        },
      }), /model.*valid/i);
    },

  'invalid-leases-do-not-retain-owned-context': async env => {
    const { rmlui, context } = env;
    let contextWeak;
    let model;
    let variable;
    (() => {
      const owned = rmlui.Factory.instanceContext(
        'invalid-schema-owner', context.getRenderManager(), null);
      contextWeak = new WeakRef(owned);
      model = owned.createDataModel('removed');
      model.bind('value', 3);
      variable = model.getVariable('value');
      owned.removeDataModel('removed');
    })();
    await collect();
    assert.equal(model.isValid, false);
    assert.equal(contextWeak.deref(), undefined);
    assert.throws(() => variable.get(), /model.*valid/i);
  },

  'native-events-apply-sparse-scalar-patches': ({ context }) => {
    const model = context.createDataModel('events');
    const types = model.getDataTypeRegister();
    const real = types.registerScalar('Real', 'float64');
    const values = types.registerArray('Values', real);
    model.bind('values', [ 1, 2 ], values);
    model.bindEventCallback('change', () => {
      assert.equal(model.applyPatch({ '$.values[1]': 8 }), true);
      assert.equal(model.isVariableDirty('values'), true);
    });
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="events"><button id="change" ' +
      'data-event-click="change()">change</button>' +
      '<div id="value">{{values[1]}}</div></body></rml>');
    document.getElementById('change').click();
    context.update();
    assert.equal(model.getVariable('values[1]').get(), 8);
    assert.match(document.getElementById('value').innerRML, /8/);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Data schemas');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('data-schemas', 200, 160);
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
  assert.equal(failures, 0, `${failures} data schema failures`);
}
