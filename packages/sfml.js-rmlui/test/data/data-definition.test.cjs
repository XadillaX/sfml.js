'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'struct-handle-construction-checks-register-definition-and-generation':
    ({ rmlui, context }) => {
      const register = new rmlui.DataTypeRegister();
      const other = new rmlui.DataTypeRegister();
      const scalar = register.registerScalar('Number', 'int32');
      const struct = register.registerStruct('Record');
      const handle = new rmlui.DataStructHandle(register, struct);
      assert.equal(handle.isValid, true);
      assert.equal(handle.familyId, struct.familyId);
      assert.equal(handle.registerMember('value', scalar), true);
      assert.deepEqual(struct.reflectMemberNames(), [ 'value' ]);
      const owned = new rmlui.DataVariable(handle, { value: 7 });
      assert.equal(owned.child('value').get(), 7);
      const model = context.createDataModel('constructed', {
        typeRegister: register,
      });
      assert.equal(model.bindCustomDataVariable('record', owned), true);
      assert.equal(model.getVariable('record.value').get(), 7);
      assert.throws(() => new rmlui.DataStructHandle(other, struct),
        /register/i);
      assert.throws(() => new rmlui.DataStructHandle(register, scalar),
        /struct/i);
      const reference = register.registerReference('Reference', struct);
      const custom = register.registerCustomDataVariableDefinition('Custom', {
        type: rmlui.DataVariableType.Struct,
      });
      for (const definition of [ reference, custom, {}]) {
        assert.throws(() => new rmlui.DataStructHandle(register, definition),
          /struct|schema/i);
      }
      rmlui.shutdown();
      assert.equal(handle.isValid, false);
      assert.throws(() => new rmlui.DataStructHandle(register, struct),
        /valid|initialis/i);
    },

  'unregistered-definitions-retain-checked-variable-lifetimes':
    ({ rmlui, context }) => {
      const model = context.createDataModel('definitions');
      model.bind('inferred', 3);
      model.bindFunc('computed', () => 7);
      const literal = rmlui.makeLiteralIntVariable(-1);
      const literalDefinition = literal.getDefinition();
      const inferred = model.getVariable('inferred').getDefinition();
      const computed = model.getVariable('computed').getDefinition();
      for (const definition of [ literalDefinition, inferred, computed ]) {
        assert.ok(definition instanceof rmlui.DataDefinition);
        assert.equal(definition.isValid, true);
        assert.equal(definition.type, rmlui.DataVariableType.Scalar);
        assert.deepEqual(definition.reflectMemberNames(), []);
      }
      context.removeDataModel('definitions');
      assert.equal(inferred.isValid, false);
      assert.equal(computed.isValid, false);
      assert.throws(() => inferred.type, /valid/i);
      assert.throws(() => computed.reflectMemberNames(), /valid/i);
      rmlui.shutdown();
      assert.equal(literalDefinition.isValid, true);
      assert.equal(literalDefinition.type, rmlui.DataVariableType.Scalar);
      assert.deepEqual(literalDefinition.reflectMemberNames(), []);
    },

  'registered-definition-reflection-and-recursive-pointer-traits':
    ({ rmlui, context }) => {
      const model = context.createDataModel('traits');
      const types = model.getDataTypeRegister();
      const scalar = types.registerScalar('Real', 'float64');
      const node = types.registerStruct('Node');
      const reference = types.registerReference('NodeReference', node);
      node.registerMember('value', scalar);
      node.registerMember('next', reference);
      const array = types.registerArray('Nodes', node);
      model.bind('first', { value: 1, next: null }, node);
      model.bind('second', { value: 2, next: null }, node);
      const first = model.getVariable('first');
      const second = model.getVariable('second');
      first.child('next').setReference(second);
      assert.equal(first.getDefinition(), node);
      assert.ok(node instanceof rmlui.DataDefinition);
      assert.deepEqual(node.reflectMemberNames(), [ 'value', 'next' ]);
      assert.deepEqual(reference.reflectMemberNames(), [ 'value', 'next' ]);
      assert.equal(scalar.underlying, null);
      assert.equal(node.underlying, null);
      assert.equal(reference.underlying, node);
      assert.equal(array.underlying, node);
      const values = new rmlui.DataPointerTraits(node);
      const pointers = new rmlui.DataPointerTraits(reference);
      assert.equal(values.isPointer, false);
      assert.equal(values.elementType, node);
      assert.equal(values.dereference(first), first);
      assert.equal(pointers.isPointer, true);
      assert.equal(pointers.elementType, node);
      const dereferenced = pointers.dereference(first.child('next'));
      assert.equal(dereferenced.child('value').get(), 2);
      assert.equal(pointers.dereference(second.child('next')), null);
      assert.throws(() => values.dereference(first.child('value')),
        /definition/i);
      assert.throws(() => pointers.dereference(first), /definition/i);
      assert.throws(() => types.registerReference('Double', reference),
        /pointer|reference/i);
      context.removeDataModel('traits');
      assert.throws(() => pointers.dereference(first), /valid/i);
      rmlui.shutdown();
      assert.equal(node.isValid, false);
      assert.throws(() => node.reflectMemberNames(), /valid/i);
      assert.throws(() => reference.underlying, /valid/i);
    },

  'custom-reflection-preserves-errors-and-rejects-reentry':
    ({ rmlui, context }) => {
      const model = context.createDataModel('custom');
      const sentinel = new Error('reflection sentinel');
      const throwing = model.registerCustomDataVariableDefinition('Throwing', {
        type: rmlui.DataVariableType.Struct,
        reflectMemberNames() {
          throw sentinel;
        },
      });
      assert.throws(() => throwing.reflectMemberNames(),
        error => error === sentinel);
      const reentrant = model.registerCustomDataVariableDefinition(
        'Reentrant', {
          type: rmlui.DataVariableType.Struct,
          reflectMemberNames() {
            context.removeDataModel('custom');
            return [ 'value' ];
          },
        });
      assert.throws(() => reentrant.reflectMemberNames(), /callback|reentran/i);
      assert.equal(model.isValid, true);
    },

  'caller-selected-family-registration-rejects-duplicate-identities':
    ({ rmlui, context }) => {
      const first = new rmlui.DataTypeRegister();
      const second = new rmlui.DataTypeRegister();
      const family = first.createFamilyId();
      const definition = {
        type: rmlui.DataVariableType.Scalar,
        get: payload => ({ success: true, value: payload.value }),
        set: (payload, value) => {
          payload.value = Number(value);
          return true;
        },
      };
      assert.equal(first.registerDefinition(family, 'Value', definition), true);
      const schema = first.getDefinition(family);
      assert.equal(schema.familyId, family);
      assert.equal(first.getDefinition('Value'), schema);
      assert.equal(first.registerDefinition(family, 'Duplicate', definition),
        false);
      assert.equal(first.getDefinition('Duplicate'), null);
      assert.equal(second.registerDefinition(family, 'Other', definition),
        true);
      assert.equal(second.getDefinition(family).familyId, family);
      const model = context.createDataModel('family', { typeRegister: first });
      model.bindCustomDataVariable('value', { value: 3 }, schema);
      assert.equal(model.getVariable('value').get(), 3);
      assert.equal(model.getVariable('value').set(8), true);
      assert.equal(model.getVariable('value').get(), 8);
      for (const invalid of [ -1, 1.5, NaN, '1', 1n, 2147483647 ]) {
        assert.throws(() =>
          first.registerDefinition(invalid, 'Bad', definition),
        /family|identity|integer/i);
      }
      assert.equal(first.getDefinition(first.createFamilyId()), null);
      rmlui.shutdown();
      assert.throws(() => first.createFamilyId(), /valid|initialis/i);
    },

  'private-function-alias-underlying-reflection-survives-model-removal':
    ({ context }) => {
      const model = context.createDataModel('alias');
      model.bindFunc('value', () => 7);
      model.bindCustomDataVariable('alias', model.getVariable('value'));
      const alias = model.getVariable('alias').getDefinition();
      const underlying = alias.underlying;
      assert.deepEqual(underlying.reflectMemberNames(), []);
      context.removeDataModel('alias');
      assert.deepEqual(alias.reflectMemberNames(), []);
      assert.deepEqual(underlying.reflectMemberNames(), []);
    },

  'duplicate-family-registration-releases-rejected-callback-roots':
    async ({ rmlui }) => {
      const register = new rmlui.DataTypeRegister();
      const family = register.createFamilyId();
      const definition = { type: rmlui.DataVariableType.Scalar };
      assert.equal(register.registerDefinition(family, 'First', definition),
        true);
      const rejected = (() => {
        const payload = { value: 9 };
        const reference = new WeakRef(payload);
        assert.equal(register.registerDefinition(family, 'Rejected', {
          type: rmlui.DataVariableType.Scalar,
          get: () => ({ success: true, value: payload.value }),
        }), false);
        return reference;
      })();
      for (let i = 0; i < 12; ++i) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
      assert.equal(rejected.deref(), undefined);
      assert.equal(register.getDefinition(family).isValid, true);
    },

  'stale-family-identities-reject-after-runtime-reinitialization':
    ({ rmlui, window }) => {
      const register = new rmlui.DataTypeRegister();
      const family = register.createFamilyId();
      rmlui.shutdown();
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const replacement = new rmlui.DataTypeRegister();
      assert.throws(() => replacement.registerDefinition(family, 'Stale', {
        type: rmlui.DataVariableType.Scalar,
      }), /runtime/i);
      const current = replacement.createFamilyId();
      assert.notEqual(current, family);
      assert.equal(replacement.registerDefinition(current, 'Current', {
        type: rmlui.DataVariableType.Scalar,
      }), true);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Data definitions');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, window, context: rmlui.createContext('data-definitions', 200, 160),
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
  assert.equal(failures, 0, `${failures} data definition failures`);
}
