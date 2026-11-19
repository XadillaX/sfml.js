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
  'value-members-use-current-parent-and-checked-conversions': ({ context }) => {
    const model = context.createDataModel('members');
    const number = model.registerScalar('Byte', 'uint8');
    const record = model.registerStruct('Record');
    record.registerMember('source', number);
    record.registerMember('value', number,
      parent => parent.child('source').get(),
      (parent, value) => {
        assert.equal(typeof value, 'number');
        assert.equal(parent.child('source').set(value), true);
      });
    let reads = 0;
    model.bind('record', {
      source: 3,
      get value() {
        ++reads;
        throw new Error('initial accessor must not be read');
      },
    }, record);
    assert.equal(reads, 0);
    const value = model.getVariable('record.value');
    assert.equal(value.get(), 3);
    model.getVariable('record.source').set(7);
    assert.equal(value.get(), 7);
    assert.equal(value.set('12'), true);
    assert.equal(model.getVariable('record.source').get(), 12);
    assert.equal(value.set(256), false);
    assert.equal(value.get(), 12);
    assert.deepEqual(model.getVariable('record').reflectMemberNames(),
      [ 'source', 'value' ]);
    assert.throws(() => value.getNumericView(), /value|array|storage/i);
  },

  'readonly-setteronly-enum-and-real-two-way-controller': ({ context }) => {
    const model = context.createDataModel('members');
    const status = model.registerEnum('Status', 'uint8');
    const record = model.registerStruct('Record');
    record.registerMember('status', status);
    record.registerMember('display', status,
      parent => parent.child('status').get(),
      (parent, value) => parent.child('status').set(value));
    record.registerMember('readonly', status, () => 4);
    record.registerMember('writeonly', status, undefined,
      (parent, value) => parent.child('status').set(value));
    model.bind('record', { status: 2 }, record);
    const read = model.getVariable('record.readonly');
    const write = model.getVariable('record.writeonly');
    assert.equal(read.get(), 4);
    assert.equal(read.set(1), false);
    assert.equal(write.get(), undefined);
    assert.equal(write.set(5), true);
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="members"><input id="input" data-value="record.display"/>' +
      '<span id="result">{{record.display}}</span></body></rml>');
    document.getElementById('input').dispatchEvent('change', { value: '8' });
    context.update();
    assert.equal(model.getVariable('record.status').get(), 8);
    assert.match(document.getElementById('result').innerRML, /8/);
    document.getElementById('input').dispatchEvent('change', { value: '256' });
    assert.equal(model.getVariable('record.status').get(), 8);
  },

  'reference-members-retarget-null-resize-and-forward-suffix': env => {
    const { context } = env;
    const model = context.createDataModel('members');
    const number = model.registerScalar('Number', 'float64');
    const numbers = model.registerArray('Numbers', number);
    const types = model.getDataTypeRegister();
    const pointer = types.registerReference('Ref', number);
    const record = model.registerStruct('Record');
    let target = null;
    let scalar = null;
    record.registerMember('numbers', numbers, () => target);
    record.registerMember('selected', pointer, () => scalar);
    model.bind('left', [ 1, 2 ], numbers);
    model.bind('right', [ 8 ], numbers);
    model.bind('record', {}, record);
    const wrapped = model.getVariable('record');
    const indirect = wrapped.child('numbers');
    assert.equal(indirect.size, 0);
    assert.equal(indirect.child(0), null);
    assert.equal(wrapped.child('selected').get(), null);
    assert.equal(wrapped.child('selected').set(1), false);
    target = model.getVariable('left');
    scalar = target.child(1);
    assert.equal(indirect.size, 2);
    assert.deepEqual(Array.from(indirect.getNumericView()), [ 1, 2 ]);
    assert.equal(wrapped.child('selected').set(4), true);
    assert.equal(target.child(1).get(), 4);
    const retained = indirect.child(1);
    assert.equal(indirect.resize(3), true);
    assert.equal(retained.get(), 4);
    target = model.getVariable('right');
    assert.equal(indirect.child(0).get(), 8);
    assert.throws(() => retained.get(), /path.*valid/i);
    target = null;
    assert.throws(() => indirect.getNumericView(), /null|target|path/i);
  },

  'recursive-array-parents-grow-truncate-and-reject-foreign-definitions':
    ({ context, rmlui }) => {
      const model = context.createDataModel('members');
      const number = model.registerScalar('Number', 'float64');
      const node = model.registerStruct('Node');
      const nodes = model.registerArray('Nodes', node);
      node.registerMember('source', number);
      node.registerMember('double', number,
        parent => parent.child('source').get() * 2);
      node.registerMember('children', nodes);
      model.bind('nodes', [
        { source: 3, children: [{ source: 4, children: [] }] },
      ], nodes);
      const values = model.getVariable('nodes');
      assert.equal(values.child(0).child('double').get(), 6);
      assert.equal(model.getVariable('nodes[0].children[0].double').get(), 8);
      values.resize(2);
      values.child(1).child('source').set(5);
      assert.equal(values.child(1).child('double').get(), 10);
      const retained = values.child(1).child('double');
      values.resize(1);
      assert.throws(() => retained.get(), /path.*valid/i);
      const other = new rmlui.DataTypeRegister();
      const outside = other.registerScalar('Outside', 'float64');
      const fresh = model.registerStruct('Fresh');
      assert.throws(() => fresh.registerMember('outside', outside, () => 1),
        /register/i);
      assert.throws(() =>
        fresh.registerMember('bad', nodes, () => values, () => {}),
      /scalar|setter/i);
    },

  'member-errors-first-identity-recursion-and-current-schema': env => {
    const { context } = env;
    const model = context.createDataModel('members');
    const number = model.registerScalar('Number', 'int32');
    const record = model.registerStruct('Record');
    let getter = () => 1;
    record.registerMember('value', number, () => getter());
    model.bind('record', {}, record);
    const value = model.getVariable('record.value');
    getter = () => value.get();
    assert.throws(() => value.get(), /recurs/i);
    getter = () => {
      context.removeDataModel('members');
      return 1;
    };
    assert.throws(() => value.get(), /callback|mutation/i);
    assert.equal(model.isValid, true);
    const sentinel = new Error('first member failure');
    getter = () => {
      throw sentinel;
    };
    assert.throws(() => value.get(), error => error === sentinel);
    getter = () => 2147483648;
    assert.equal(value.get(), undefined);
    getter = () => 7;
    assert.equal(value.get(), 7);
  },

  'registered-scalar-callbacks-and-custom-scalar-member-values':
    ({ context, rmlui }) => {
      const model = context.createDataModel('members');
      const payload = { status: 1 };
      const labels = [ 'idle', 'ready', 'done' ];
      const scalar = model.registerScalar('Label', {
        get: value => labels[value.status],
        set: (value, label) => {
          value.status = labels.indexOf(label);
        },
      });
      assert.equal(scalar.isCustom, true);
      assert.equal(scalar.type, rmlui.DataVariableType.Scalar);
      model.bindCustomDataVariable('label', payload, scalar);
      const value = model.getVariable('label');
      assert.equal(value.get(), 'ready');
      assert.equal(value.set('done'), true);
      assert.equal(payload.status, 2);
      const record = model.registerStruct('Record');
      record.registerMember('label', scalar, () => labels[payload.status],
        (_parent, label) => {
          payload.status = labels.indexOf(label);
        });
      model.bind('record', {}, record);
      assert.equal(model.getVariable('record.label').get(), 'done');
      assert.equal(model.getVariable('record.label').set('idle'), true);
      assert.equal(value.get(), 'idle');
      const readonly = model.getDataTypeRegister().registerScalar('Read', {
        get: data => data,
      });
      model.bindCustomDataVariable('read', { x: 2, y: 3 }, readonly);
      assert.deepEqual(model.getVariable('read').get(), { x: 2, y: 3 });
      assert.equal(model.getVariable('read').set(4), false);
    },

  'reference-getters-check-definition-errors-and-retained-parent': env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('members');
    const types = model.getDataTypeRegister();
    const scalar = types.registerScalar('Number', 'float64');
    const otherScalar = types.registerScalar('Other', 'float64');
    const reference = types.registerReference('Ref', scalar);
    const record = types.registerStruct('Record');
    let target = null;
    let parent;
    record.registerMember('target', reference, current => {
      parent = current;
      return target;
    });
    model.bind('record', {}, record);
    model.bind('number', 1, scalar);
    model.bind('other', 2, otherScalar);
    const value = model.getVariable('record.target');
    target = model.getVariable('other');
    assert.throws(() => value.get(), /definition|schema/i);
    const foreignTypes = new rmlui.DataTypeRegister();
    const foreignNumber = foreignTypes.registerScalar('Number', 'float64');
    const foreign = context.createDataModel('foreign',
      { typeRegister: foreignTypes });
    foreign.bind('number', 3, foreignNumber);
    target = foreign.getVariable('number');
    assert.throws(() => value.get(), /definition|schema/i);
    const sentinel = new Error('member result accessor');
    target = {
      get handle() {
        throw sentinel;
      },
    };
    assert.throws(() => value.get(), error => error === sentinel);
    target = {
      get handle() {
        return value.get();
      },
    };
    assert.throws(() => value.get(), /recurs/i);
    target = model.getVariable('number');
    assert.equal(value.get(), 1);
    context.removeDataModel('members');
    assert.throws(() => parent.child('target'), /valid/i);
  },

  'scalar-callback-contracts-setteronly-and-rejected-registration-gc':
    async ({ context }) => {
      const model = context.createDataModel('members');
      let read = () => 1;
      const scalar = model.registerScalar('Custom', {
        get: () => read(),
      });
      model.bindCustomDataVariable('custom', {}, scalar);
      const value = model.getVariable('custom');
      read = () => value.get();
      assert.throws(() => value.get(), /recurs/i);
      const sentinel = new Error('scalar callback accessor');
      read = () => {
        throw sentinel;
      };
      assert.throws(() => value.get(), error => error === sentinel);
      let assigned;
      const writeonly = model.registerScalar('Write', {
        set: (payload, input) => {
          assigned = input;
          payload.value = input;
        },
      });
      model.bindCustomDataVariable('write', {}, writeonly);
      assert.equal(model.getVariable('write').get(), undefined);
      assert.equal(model.getVariable('write').set({ x: 2, y: 3 }), true);
      assert.deepEqual(assigned, { x: 2, y: 3 });
      let rejected;
      (() => {
        const get = () => 4;
        rejected = new WeakRef(get);
        assert.equal(model.registerScalar('Custom', { get }), null);
      })();
      await collect();
      assert.equal(rejected.deref(), undefined);
      assert.throws(() => model.registerScalar('Throw', {
        get get() {
          throw sentinel;
        },
      }), error => error === sentinel);
      assert.equal(model.getDataTypeRegister().getDefinition('Throw'), null);
    },

  'advanced-aliases-inferred-func-custom-and-resized-storage': env => {
    const { context } = env;
    const model = context.createDataModel('members');
    model.bind('inferred', 3);
    assert.equal(model.bindCustomDataVariable('alias',
      model.getVariable('inferred')), true);
    assert.equal(model.getVariable('alias').get(), 3);
    assert.equal(model.getVariable('alias').set(5), true);
    assert.equal(model.getVariable('inferred').get(), 5);
    model.bind('integer', -(2n ** 63n));
    model.bindCustomDataVariable('integer_alias', model.getVariable('integer'));
    assert.throws(() => model.getVariable('integer_alias').set(2 ** 63),
      RangeError);
    assert.equal(model.getVariable('integer').get(), -(2n ** 63n));
    let computed = 7;
    model.bindFunc('computed', () => computed, value => {
      computed = value;
    });
    model.bindCustomDataVariable('computed_alias',
      model.getVariable('computed'));
    assert.equal(model.getVariable('computed_alias').set(9), true);
    assert.equal(computed, 9);
    const scalar = model.registerScalar('Custom', {
      get: payload => payload.value,
    });
    const payload = { value: 4 };
    model.bindCustomDataVariable('custom', payload, scalar);
    model.bindCustomDataVariable('custom_alias', model.getVariable('custom'));
    assert.equal(model.getVariable('custom_alias').getPayload(), payload);
    const number = model.registerScalar('Number', 'float64');
    const array = model.registerArray('Numbers', number);
    model.bind('numbers', [ 1, 2 ], array);
    model.bindCustomDataVariable('numbers_alias', model.getVariable('numbers'));
    model.bindCustomDataVariable('second', model.getVariable('numbers[1]'));
    const indirect = model.getVariable('numbers_alias');
    indirect.resize(3);
    assert.deepEqual(Array.from(indirect.getNumericView()), [ 1, 2, 0 ]);
    assert.equal(model.getVariable('second').get(), 2);
    indirect.resize(1);
    assert.throws(() => model.getVariable('second').get(), /path.*valid/i);
    assert.equal(model.bindCustomDataVariable('alias',
      model.getVariable('inferred')), false);
    assert.throws(() => model.bindCustomDataVariable('invalid', null),
      /variable/i);
  },

  'callback-release-alias-target-ownership-and-owned-context-cycles':
    async ({ context, rmlui }) => {
      const register = new rmlui.DataTypeRegister();
      const number = register.registerScalar('Number', 'float64');
      const record = register.registerStruct('Record');
      record.registerMember('taken', number, () => 1);
      let rejected;
      (() => {
        const get = () => 2;
        rejected = new WeakRef(get);
        assert.equal(record.registerMember('taken', number, get), false);
      })();
      await collect();
      assert.equal(rejected.deref(), undefined);
      const model = context.createDataModel('members',
        { typeRegister: register });
      let targetWeak;
      (() => {
        const owned = rmlui.Factory.instanceContext(
          'member-target', context.getRenderManager(), null);
        const target = owned.createDataModel('target',
          { typeRegister: register });
        target.bind('value', 11, number);
        model.bindCustomDataVariable('alias', target.getVariable('value'));
        targetWeak = new WeakRef(owned);
      })();
      await collect();
      assert.ok(targetWeak.deref());
      assert.equal(model.getVariable('alias').get(), 11);
      context.removeDataModel('members');
      await collect();
      assert.equal(targetWeak.deref(), undefined);
      let cycleWeak;
      (() => {
        const owned = rmlui.Factory.instanceContext(
          'member-cycle', context.getRenderManager(), null);
        const ownModel = owned.createDataModel('cycle');
        const scalar = ownModel.registerScalar('Number', 'float64');
        const schema = ownModel.registerStruct('Record');
        schema.registerMember('value', scalar, () => owned.dimensions.x);
        ownModel.bind('record', {}, schema);
        ownModel.bindCustomDataVariable('alias',
          ownModel.getVariable('record.value'));
        cycleWeak = new WeakRef(owned);
      })();
      await collect();
      assert.equal(cycleWeak.deref(), undefined);
    },

  'expired-alias-function-definition-and-public-register-names': env => {
    const { context } = env;
    const register = context.createDataModel('register').getDataTypeRegister();
    const source = context.createDataModel('source');
    source.bindFunc('function', () => 3);
    const target = context.createDataModel('target');
    target.bindCustomDataVariable('alias', source.getVariable('function'));
    assert.equal(register.getDefinition(''), null);
    const alias = target.getVariable('alias');
    assert.deepEqual(alias.reflectMemberNames(), []);
    context.removeDataModel('source');
    assert.deepEqual(alias.reflectMemberNames(), []);
    assert.throws(() => alias.get(), /valid/i);
    assert.throws(() => alias.set(1), /valid/i);
  },

  'references-and-aliases-preserve-custom-scalar-reflection': env => {
    const { context, rmlui } = env;
    const model = context.createDataModel('members');
    const custom = model.registerCustomDataVariableDefinition('Custom', {
      type: rmlui.DataVariableType.Scalar,
      get: () => ({ success: true, value: 1 }),
      reflectMemberNames: () => [ 'exposed' ],
    });
    model.bindCustomDataVariable('custom', {}, custom);
    const reference = model.getDataTypeRegister()
      .registerReference('Reference', custom);
    model.bind('reference', model.getVariable('custom'), reference);
    model.bindCustomDataVariable('alias', model.getVariable('custom'));
    assert.deepEqual(model.getVariable('reference').reflectMemberNames(),
      [ 'exposed' ]);
    assert.deepEqual(model.getVariable('alias').reflectMemberNames(),
      [ 'exposed' ]);
  },

  'alias-target-conversion-revalidates-destroyed-model': env => {
    const { context } = env;
    const { native } = require('../../dist/internal/native');
    const source = context.createDataModel('source');
    source.bind('value', 1);
    const target = context.createDataModel('target');
    const handle = target.handle;
    const variable = source.getVariable('value');
    assert.throws(() => native.dataModelBindAlias(handle, 'alias', {
      get handle() {
        context.removeDataModel('target');
        return variable.handle;
      },
    }), /model.*valid/i);
    assert.equal(target.isValid, false);
    assert.equal(source.getVariable('value').get(), 1);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Native data members');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, context: rmlui.createContext('data-members', 200, 160),
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
  assert.equal(failures, 0, `${failures} data member failures`);
}
