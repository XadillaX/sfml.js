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
  'owned-scalars-arrays-and-resize-resolve-current-storage': ({ rmlui }) => {
    const types = new rmlui.DataTypeRegister();
    const scalar = types.registerScalar('Real', 'float64');
    const array = types.registerArray('Reals', scalar);
    const value = new rmlui.DataVariable(scalar, 3);
    assert.equal(value.getDefinition(), scalar);
    assert.equal(value.get(), 3);
    assert.equal(value.set(8), true);
    assert.equal(value.get(), 8);
    const values = new rmlui.DataVariable(array, [ 1, 2 ]);
    const child = values.child(1);
    const old = values.getNumericView();
    old[1] = 7;
    assert.equal(child.get(), 7);
    assert.equal(values.resize(4), true);
    assert.deepEqual(Array.from(values.getNumericView()), [ 1, 7, 0, 0 ]);
    old[1] = 99;
    assert.equal(child.get(), 7);
    const size = values.child('size');
    assert.equal(size.get(), 4);
    values.resize(1);
    assert.equal(size.get(), 1);
    assert.equal(child.isValid, false);
    assert.throws(() => child.get(), /path.*valid/i);
    const integer = types.registerScalar('Integer', 'int64');
    const exact = new rmlui.DataVariable(integer, 9007199254740993n);
    assert.equal(exact.get(), 9007199254740993n);
    assert.equal(exact.set('9223372036854775808'), false);
    assert.equal(exact.get(), 9007199254740993n);
    assert.equal(new rmlui.DataVariable(scalar).get(), 0);
  },

  'owned-and-model-references-share-checked-paths': ({ rmlui, context }) => {
    const types = new rmlui.DataTypeRegister();
    const scalar = types.registerScalar('Real', 'float64');
    const array = types.registerArray('Reals', scalar);
    const arrayRef = types.registerReference('RealsRef', array);
    const record = types.registerStruct('Record');
    record.registerMember('values', array);
    record.registerMember('alias', arrayRef);
    const values = new rmlui.DataVariable(array, [ 1, 2 ]);
    const source = new rmlui.DataVariable(record, {
      values: [], alias: values,
    });
    const alias = source.child('alias');
    assert.equal(alias.getReference().handle, values.handle);
    assert.equal(alias.child(1).get(), 2);
    alias.resize(3);
    assert.deepEqual(Array.from(values.getNumericView()), [ 1, 2, 0 ]);
    const model = context.createDataModel('owned', { typeRegister: types });
    assert.equal(model.bind('alias', values, arrayRef), true);
    assert.equal(model.bindCustomDataVariable('direct', values), true);
    assert.equal(model.getVariable('direct[1]').get(), 2);
    assert.equal(model.getVariable('alias[1]').set(9), true);
    assert.equal(values.child(1).get(), 9);
    model.bind('values', [ 4, 5 ], array);
    alias.setReference(model.getVariable('values'));
    assert.equal(alias.child(0).get(), 4);
    context.removeDataModel('owned');
    assert.throws(() => alias.child(0), /model.*valid/i);
    alias.setReference(values);
    assert.equal(alias.child(0).get(), 1);
    const other = new rmlui.DataTypeRegister();
    const foreign = other.registerArray('Reals',
      other.registerScalar('Real', 'float64'));
    assert.throws(() =>
      alias.setReference(new rmlui.DataVariable(foreign, [])), /definition/i);
    alias.setReference(null);
    assert.equal(alias.size, 0);
  },

  'owned-custom-and-member-callbacks-use-live-parent-leases': ({ rmlui }) => {
    const types = new rmlui.DataTypeRegister();
    const scalar = types.registerScalar('Real', 'float64');
    const custom = types.registerCustomDataVariableDefinition('Custom', {
      type: rmlui.DataVariableType.Struct,
      child: (payload, name) => (name === 'value' ? payload.value : null),
      reflectMemberNames: () => [ 'value' ],
    });
    const target = new rmlui.DataVariable(scalar, 7);
    const value = new rmlui.DataVariable(custom, { value: target });
    assert.equal(value.child('value').get(), 7);
    assert.equal(value.child('value').set(8), true);
    assert.equal(target.get(), 8);
    assert.equal(value.getPayload().value, target);
    const record = types.registerStruct('Record');
    record.registerMember('raw', scalar);
    record.registerMember('double', scalar,
      parent => Number(parent.child('raw').get()) * 2,
      (parent, input) => parent.child('raw').set(Number(input) / 2));
    const ref = types.registerReference('RealRef', scalar);
    record.registerMember('target', ref, () => target);
    const owned = new rmlui.DataVariable(record, { raw: 3 });
    assert.equal(owned.child('double').get(), 6);
    assert.equal(owned.child('double').set(10), true);
    assert.equal(owned.child('raw').get(), 5);
    assert.equal(owned.child('target').get(), 8);
    assert.equal(owned.child('target').set(9), true);
    assert.equal(target.get(), 9);
    const sentinel = new Error('owned getter');
    const throwing = types.registerCustomDataVariableDefinition('Throwing', {
      type: rmlui.DataVariableType.Scalar,
      get() {
        throw sentinel;
      },
    });
    assert.throws(() => new rmlui.DataVariable(throwing, {}).get(),
      error => error === sentinel);
  },

  'owned-child-and-reference-edges-retain-only-live-payloads':
    async ({ rmlui }) => {
      let payloadWeak;
      let registerWeak;
      const retained = (() => {
        const register = new rmlui.DataTypeRegister();
        registerWeak = new WeakRef(register.handle);
        const scalar = register.registerScalar('Scalar', {
          get: payload => payload.value,
        });
        const records = register.registerArray('Records', scalar);
        const payload = { value: 8 };
        payloadWeak = new WeakRef(payload);
        return new rmlui.DataVariable(records, [ payload ]).child(0);
      })();
      await collect();
      assert.ok(payloadWeak.deref());
      assert.ok(registerWeak.deref());
      assert.equal(retained.get(), 8);
      const types = new rmlui.DataTypeRegister();
      const scalar = types.registerScalar('Real', 'float64');
      const ref = types.registerReference('RealRef', scalar);
      const refs = types.registerArray('Refs', ref);
      let targetWeak;
      const array = (() => {
        const target = new rmlui.DataVariable(scalar, 4);
        targetWeak = new WeakRef(target.handle);
        return new rmlui.DataVariable(refs, [ target ]);
      })();
      await collect();
      assert.ok(targetWeak.deref());
      array.resize(0);
      await collect();
      assert.equal(targetWeak.deref(), undefined);
      assert.equal(retained.get(), 8);
    },

  'owned-reference-and-callback-cycles-collect': async ({ rmlui }) => {
    let firstWeak;
    let secondWeak;
    let payloadWeak;
    (() => {
      const types = new rmlui.DataTypeRegister();
      const node = types.registerStruct('Node');
      const ref = types.registerReference('NodeRef', node);
      node.registerMember('next', ref);
      const first = new rmlui.DataVariable(node, { next: null });
      const second = new rmlui.DataVariable(node, { next: first });
      first.child('next').setReference(second);
      firstWeak = new WeakRef(first.handle);
      secondWeak = new WeakRef(second.handle);
      const payload = {};
      const scalar = types.registerScalar('Cycle', {
        get: () => payload.value.get(),
      });
      payload.value = new rmlui.DataVariable(scalar, payload);
      payloadWeak = new WeakRef(payload);
    })();
    await collect();
    assert.equal(firstWeak.deref(), undefined);
    assert.equal(secondWeak.deref(), undefined);
    assert.equal(payloadWeak.deref(), undefined);
  },

  'owned-generation-and-borrowed-register-expiry': env => {
    const { rmlui, context, window } = env;
    const borrowed = context.createDataModel('borrowed').getDataTypeRegister();
    const schema = borrowed.registerScalar('BorrowedReal', 'float64');
    const value = new rmlui.DataVariable(schema, 3);
    const types = new rmlui.DataTypeRegister();
    const real = types.registerScalar('Real', 'float64');
    const array = types.registerArray('Reals', real);
    const values = new rmlui.DataVariable(array, [ 1, 2 ]);
    const view = values.getNumericView();
    rmlui.removeContext('data-owned');
    assert.equal(value.isValid, false);
    assert.throws(() => value.get(), /valid/i);
    assert.equal(values.child(1).get(), 2);
    rmlui.shutdown();
    assert.equal(values.isValid, false);
    assert.throws(() => values.getNumericView(), /valid|initialis/i);
    view[1] = 9;
    assert.deepEqual(Array.from(view), [ 1, 9 ]);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => new rmlui.DataVariable(real, 4), /valid/i);
    assert.equal(values.isValid, false);
  },

  'owned-callback-paths-map-arrays-and-reject-destructive-reentry':
    ({ rmlui, context }) => {
      const types = new rmlui.DataTypeRegister();
      const scalar = types.registerScalar('Real', 'float64');
      const array = types.registerArray('Reals', scalar);
      const values = new rmlui.DataVariable(array, [ 1, 2 ]);
      const custom = types.registerCustomDataVariableDefinition('Custom', {
        type: rmlui.DataVariableType.Struct,
        child: () => values,
      });
      const record = types.registerStruct('Record');
      record.registerMember('values', array, () => values);
      const owned = new rmlui.DataVariable(record);
      const indirect = owned.child('values');
      assert.deepEqual(Array.from(indirect.getNumericView()), [ 1, 2 ]);
      assert.equal(indirect.resize(3), true);
      const source = new rmlui.DataVariable(custom, {});
      assert.deepEqual(Array.from(source.child('values').getNumericView()),
        [ 1, 2, 0 ]);
      assert.deepEqual(context.getDataModels(), {});
      const unsafe = types.registerScalar('Unsafe', {
        get() {
          rmlui.shutdown();
          return 3;
        },
      });
      const value = new rmlui.DataVariable(unsafe, {});
      assert.throws(() => value.get(), /callback|reentran/i);
      assert.equal(value.isValid, true);
    },

  'owned-initialization-preserves-accessor-errors-and-expiry': env => {
    const { rmlui } = env;
    const types = new rmlui.DataTypeRegister();
    const scalar = types.registerScalar('Real', 'float64');
    const record = types.registerStruct('Record');
    record.registerMember('value', scalar);
    const sentinel = new Error('initial value');
    assert.throws(() => new rmlui.DataVariable(record, {
      get value() {
        throw sentinel;
      },
    }), error => error === sentinel);
    assert.throws(() => new rmlui.DataVariable(record, {
      get value() {
        rmlui.shutdown();
        return 7;
      },
    }), /valid|initialis/i);
    assert.equal(types.isValid, false);
  },

  'model-alias-retains-and-releases-owned-storage': async env => {
    const { rmlui, context } = env;
    const types = new rmlui.DataTypeRegister();
    const scalar = types.registerScalar('Scalar', {
      get: payload => payload.value,
    });
    const model = context.createDataModel('owned', { typeRegister: types });
    let weak;
    (() => {
      const payload = { value: 7 };
      weak = new WeakRef(payload);
      const value = new rmlui.DataVariable(scalar, payload);
      assert.equal(model.bindCustomDataVariable('value', value), true);
    })();
    await collect();
    assert.ok(weak.deref());
    assert.equal(model.getVariable('value').get(), 7);
    context.removeDataModel('owned');
    await collect();
    assert.equal(weak.deref(), undefined);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Owned data storage');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, window, context: rmlui.createContext('data-owned', 200, 160),
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
  assert.equal(failures, 0, `${failures} owned data storage failures`);
}
