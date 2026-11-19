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
  'enum-widths-conversions-and-numeric-views': ({ context, rmlui }) => {
    const model = context.createDataModel('custom');
    const kinds = [
      [ 'int8', -128, 127, Int8Array ],
      [ 'uint8', 0, 255, Uint8Array ],
      [ 'int16', -32768, 32767, Int16Array ],
      [ 'uint16', 0, 65535, Uint16Array ],
      [ 'int32', -2147483648, 2147483647, Int32Array ],
      [ 'uint32', 0, 4294967295, Uint32Array ],
      [ 'int64', -(2n ** 63n), (2n ** 63n) - 1n, BigInt64Array ],
      [ 'uint64', 0n, (2n ** 64n) - 1n, BigUint64Array ],
    ];
    for (const [ kind, low, high, View ] of kinds) {
      const schema = model.registerEnum(kind, kind);
      assert.equal(schema.isEnum, true);
      const array = model.registerArray(`${kind}Array`, schema);
      assert.equal(model.bind('values_' + kind, [ low, high ], array), true);
      const values = model.getVariable('values_' + kind);
      assert.ok(values.getNumericView() instanceof View);
      assert.deepEqual(Array.from(values.getNumericView()), [ low, high ]);
      const first = values.child(0);
      assert.equal(first.set(high), true);
      assert.equal(first.get(), high);
      const overflow = typeof high === 'bigint' ? high + 1n : high + 1;
      if (kind === 'uint64') {
        assert.throws(() => first.set(overflow), RangeError);
      } else {
        assert.equal(first.set(overflow), false);
      }
      assert.equal(first.get(), high);
    }
    assert.equal(model.registerEnum('int8', 'uint8'), null);
    assert.throws(() => model.registerEnum('Bool', 'bool'), /integer|enum/i);
    const foreign = new rmlui.DataTypeRegister();
    const outside = foreign.registerEnum('Outside', 'uint8');
    assert.throws(() => model.registerArray('Foreign', outside), /register/i);
  },

  'constructor-registration-and-enum-two-way-controller': ({ context }) => {
    const model = context.createDataModel('custom');
    const text = model.registerScalar('Text', 'string');
    const status = model.registerEnum('Status', 'uint8');
    const record = model.registerStruct('Record');
    assert.equal(record.registerMember('title', text), true);
    assert.equal(record.registerMember('status', status), true);
    model.bind('record', { title: 'native', status: 2 }, record);
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="custom"><input id="status" data-value="record.status"/>' +
      '<span id="status-text">{{record.status}}</span></body></rml>');
    const input = document.getElementById('status');
    assert.equal(input.dispatchEvent('change', { value: '7' }), true);
    context.update();
    assert.equal(model.getVariable('record.status').get(), 7);
    assert.match(document.getElementById('status-text').innerRML, /7/);
    input.dispatchEvent('change', { value: '256' });
    assert.equal(model.getVariable('record.status').get(), 7);
    const register = model.getDataTypeRegister();
    assert.equal(register.getDefinition('Text'), text);
    assert.equal(register.getDefinition('Record'), record);
    assert.equal(register.getDefinition('Status'), status);
  },

  'custom-scalar-owned-values-and-explicit-results': ({ context, rmlui }) => {
    const model = context.createDataModel('custom');
    const payload = { value: 'initial', accepted: true };
    const schema = model.registerCustomDataVariableDefinition('Custom', {
      type: rmlui.DataVariableType.Scalar,
      get: data => ({ success: data.accepted, value: data.value }),
      set: (data, value) => {
        if (value === 'reject') {
          return false;
        }
        data.value = value;
        return true;
      },
    });
    assert.equal(schema.isCustom, true);
    assert.equal(model.bindCustomDataVariable('value', payload, schema), true);
    const value = model.getVariable('value');
    assert.equal(value.getPayload(), payload);
    assert.equal(value.get(), 'initial');
    assert.equal(value.set('changed'), true);
    assert.equal(value.set('reject'), false);
    assert.equal(value.get(), 'changed');
    payload.accepted = false;
    assert.equal(value.get(), undefined);
    payload.accepted = true;
    payload.value = null;
    assert.equal(value.get(), null);
    payload.value = { x: 3, y: 4 };
    assert.deepEqual(value.get(), { x: 3, y: 4 });
    const colour = {
      type: 'colourb', red: 5, green: 6, blue: 7, alpha: 8,
    };
    assert.equal(value.set(colour), true);
    assert.deepEqual(value.get(), colour);
    model.bind('ordinary', 3);
    assert.throws(() => model.getVariable('ordinary').getPayload(),
      /custom|storage/i);
  },

  'custom-array-struct-reflection-and-checked-paths': ({ context, rmlui }) => {
    const model = context.createDataModel('custom');
    const number = model.registerScalar('Real', 'float64');
    const array = model.registerArray('Reals', number);
    model.bind('numbers', [ 1, 2 ], array);
    const source = model.getVariable('numbers');
    const customArray = model.registerCustomDataVariableDefinition('Indirect', {
      type: rmlui.DataVariableType.Array,
      size: data => data.variable.size,
      child: (data, address) => data.variable.child(address),
    });
    model.bindCustomDataVariable('indirect', { variable: source }, customArray);
    const indirect = model.getVariable('indirect');
    assert.equal(indirect.size, 2);
    assert.equal(indirect.child(1).get(), 2);
    assert.equal(indirect.child('size').get(), 2);
    assert.equal(indirect.child(8), null);
    const container = model.registerCustomDataVariableDefinition('Container', {
      type: rmlui.DataVariableType.Struct,
      child: (data, address) => (address === 'values' ? data.variable : null),
      reflectMemberNames: () => [ 'values' ],
    });
    model.bindCustomDataVariable('container', { variable: source }, container);
    const wrapped = model.getVariable('container');
    assert.deepEqual(wrapped.reflectMemberNames(), [ 'values' ]);
    const values = wrapped.child('values');
    const old = values.getNumericView();
    assert.equal(values.resize(3), true);
    assert.deepEqual(Array.from(values.getNumericView()), [ 1, 2, 0 ]);
    old[0] = 99;
    assert.equal(model.getVariable('container.values[0]').get(), 1);
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="custom"><span id="value">{{container.values[1]}}</span>' +
      '</body></rml>');
    model.applyPatch({ '$.container.values[1]': 9 });
    context.update();
    assert.match(document.getElementById('value').innerRML, /9/);
    const retained = values.child(2);
    source.resize(0);
    assert.throws(() => retained.get(), /path.*valid/i);
  },

  'custom-contract-errors-recursion-and-destructive-callbacks':
    ({ context, rmlui }) => {
      const model = context.createDataModel('custom');
      let read = () => ({ success: true, value: 1 });
      const schema = model.registerCustomDataVariableDefinition('Custom', {
        type: rmlui.DataVariableType.Scalar,
        get: () => read(),
        set: () => 'true',
      });
      model.bindCustomDataVariable('value', {}, schema);
      const value = model.getVariable('value');
      assert.throws(() => value.set(1), /boolean/i);
      read = () => 1;
      assert.throws(() => value.get(), /result|success/i);
      read = () => ({ success: 'true', value: 1 });
      assert.throws(() => value.get(), /boolean/i);
      read = () => ({ success: true, get value() {
        return value.get();
      } });
      assert.throws(() => value.get(), /recurs/i);
      read = () => {
        context.removeDataModel('custom');
        return { success: true, value: 1 };
      };
      assert.throws(() => value.get(), /callback|mutation/i);
      assert.equal(model.isValid, true);
      const sentinel = new Error('first custom error');
      read = () => {
        throw sentinel;
      };
      assert.throws(() => value.get(), error => error === sentinel);
      read = () => ({ success: true, value: 5 });
      assert.equal(value.get(), 5);
      const invalidArray = model.registerCustomDataVariableDefinition('Bad', {
        type: rmlui.DataVariableType.Array,
        size: () => -1,
        child: () => 'pointer',
      });
      model.bindCustomDataVariable('bad', {}, invalidArray);
      assert.throws(() => model.getVariable('bad').size, /size|length/i);
      assert.throws(() => model.getVariable('bad').child(0),
        /variable|handle/i);
      assert.throws(() =>
        model.registerCustomDataVariableDefinition('Invalid', { type: 99 }),
      /type|category/i);
    },

  'custom-registration-accessors-and-rejected-callback-release': async env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('custom');
    model.registerCustomDataVariableDefinition('Taken', {
      type: rmlui.DataVariableType.Scalar,
      get: () => ({ success: true, value: 1 }),
    });
    let callbackWeak;
    (() => {
      const get = () => ({ success: true, value: 2 });
      callbackWeak = new WeakRef(get);
      assert.equal(model.registerCustomDataVariableDefinition('Taken', {
        type: rmlui.DataVariableType.Scalar, get,
      }), null);
    })();
    await collect();
    assert.equal(callbackWeak.deref(), undefined);
    const sentinel = new Error('registration accessor');
    assert.throws(() => model.registerCustomDataVariableDefinition('Error', {
      type: rmlui.DataVariableType.Scalar,
      get get() {
        throw sentinel;
      },
    }), error => error === sentinel);
    assert.equal(model.getDataTypeRegister().getDefinition('Error'), null);
  },

  'custom-payload-lifetime-failed-bind-and-owned-cycles': async env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('custom');
    const schema = model.registerCustomDataVariableDefinition('Custom', {
      type: rmlui.DataVariableType.Scalar,
      get: payload => ({ success: true, value: payload.value }),
    });
    let acceptedWeak;
    let rejectedWeak;
    (() => {
      const accepted = { value: 2 };
      const rejected = { value: 9 };
      acceptedWeak = new WeakRef(accepted);
      rejectedWeak = new WeakRef(rejected);
      assert.equal(
        model.bindCustomDataVariable('value', accepted, schema), true);
      assert.equal(
        model.bindCustomDataVariable('value', rejected, schema), false);
    })();
    await collect();
    assert.ok(acceptedWeak.deref());
    assert.equal(rejectedWeak.deref(), undefined);
    context.removeDataModel('custom');
    await collect();
    assert.equal(acceptedWeak.deref(), undefined);
    let ownedWeak;
    (() => {
      const owned = rmlui.Factory.instanceContext(
        'custom-cycle', context.getRenderManager(), null);
      const constructor = owned.createDataModel('cycle');
      const custom = constructor.registerCustomDataVariableDefinition('Cycle', {
        type: rmlui.DataVariableType.Scalar,
        get: payload => ({
          success: true, value: payload.owner.name,
        }),
      });
      constructor.bindCustomDataVariable('value', { owner: owned }, custom);
      ownedWeak = new WeakRef(owned);
    })();
    await collect();
    assert.equal(ownedWeak.deref(), undefined);
  },

  'custom-child-leases-survive-later-native-callbacks': async env => {
    const { context, rmlui } = env;
    const register = new rmlui.DataTypeRegister();
    const scalar = register.registerScalar('Real', 'float64');
    const model = context.createDataModel('custom', { typeRegister: register });
    let target;
    let weak;
    const root = register.registerCustomDataVariableDefinition('Root', {
      type: rmlui.DataVariableType.Struct,
      child: (payload, address) => {
        target = null;
        global.gc();
        // This runs after the outer custom Child returned a borrowed pointer.
        assert.ok(weak.deref());
        return address === 'value' ? payload.value : null;
      },
    });
    (() => {
      const owned = rmlui.Factory.instanceContext(
        'custom-borrowed', context.getRenderManager(), null);
      target = owned.createDataModel('target', { typeRegister: register });
      target.bind('value', 11, scalar);
      target.bindCustomDataVariable('root', {
        value: target.getVariable('value'),
      }, root);
      weak = new WeakRef(owned);
    })();
    const custom = register.registerCustomDataVariableDefinition('Borrowed', {
      type: rmlui.DataVariableType.Struct,
      child: (_payload, address) => {
        if (address !== 'root' || !target) {
          return null;
        }
        return target.getVariable('root');
      },
    });
    model.bindCustomDataVariable('borrowed', {}, custom);
    const retained = model.getVariable('borrowed.root.value');
    assert.ok(retained);
    await collect();
    assert.equal(weak.deref(), undefined);
    assert.throws(() => retained.get(), /path.*valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Custom native data');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, context: rmlui.createContext('data-custom', 200, 160),
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
  assert.equal(failures, 0, `${failures} custom data failures`);
}
