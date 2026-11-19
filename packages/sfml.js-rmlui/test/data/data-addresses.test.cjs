'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'default-handles-report-invalid-and-reject-use': ({ rmlui, context }) => {
    const model = new rmlui.DataModelConstructor();
    const handle = new rmlui.DataModelHandle();
    const variable = new rmlui.DataVariable();
    assert.equal(model.isValid, false);
    assert.equal(handle.isValid, false);
    assert.equal(variable.isValid, false);
    assert.throws(() => model.bind('value', 1), /valid/i);
    assert.throws(() => handle.dirtyVariable('value'), /valid/i);
    assert.throws(() => variable.get(), /valid/i);
    const live = context.createDataModel('live');
    live.bind('value', 3);
    const value = live.getVariable('value');
    assert.equal(value.isValid, true);
    context.removeDataModel('live');
    assert.equal(value.isValid, false);
  },

  'literal-int-values-bind-and-survive-runtime-shutdown': env => {
    const { rmlui, context } = env;
    const model = context.createDataModel('literal');
    for (const input of [ 0, -1, -2147483648, 2147483647 ]) {
      const value = rmlui.makeLiteralIntVariable(input);
      assert.equal(value.isValid, true);
      assert.equal(value.type, rmlui.DataVariableType.Scalar);
      assert.equal(value.get(), input);
      assert.equal(value.set(9), false);
      assert.equal(value.size, 0);
      assert.equal(value.child('missing'), null);
      assert.deepEqual(value.reflectMemberNames(), []);
      assert.equal(value.getDefinition().type, rmlui.DataVariableType.Scalar);
      assert.throws(() => value.getNumericView(), /storage/i);
      assert.throws(() => value.getReference(), /storage/i);
      assert.equal(model.bindCustomDataVariable(`value${input < 0 ? 'n' : 'p'}${
        Math.abs(input)}`, value), true);
    }
    const retained = rmlui.makeLiteralIntVariable(-7);
    model.bindCustomDataVariable('constant', retained);
    model.bindCustomDataVariable('alias', model.getVariable('constant'));
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="literal"><span id="value">{{alias}}</span></body></rml>');
    assert.match(document.getElementById('value').innerRML, /-7/);
    assert.equal(model.getVariable('alias').set(3), false);
    assert.equal(model.bindCustomDataVariable('constant', retained), false);
    context.removeDataModel('literal');
    assert.equal(retained.get(), -7);
    rmlui.shutdown();
    assert.equal(retained.get(), -7);
    assert.equal(retained.isValid, true);
    assert.equal(new rmlui.DataVariable().isValid, false);
    assert.equal(new rmlui.DataModelConstructor().isValid, false);
    assert.equal(rmlui.makeLiteralIntVariable(0).get(), 0);
    for (const invalid of [ 1.5, 2147483648, -2147483649, NaN, '1', 1n ]) {
      assert.throws(() => rmlui.makeLiteralIntVariable(invalid), /integer/i);
    }
  },

  'explicit-address-entries-copy-fields-and-follow-resized-storage':
    ({ rmlui, context }) => {
      const model = context.createDataModel('addresses');
      const number = model.registerScalar('Real', 'float64');
      const row = model.registerStruct('Row');
      row.registerMember('value.with.dot', number);
      const rows = model.registerArray('Rows', row);
      model.bind('rows', [{ 'value.with.dot': 4 }], rows);
      const root = new rmlui.DataAddressEntry('rows');
      const index = new rmlui.DataAddressEntry(0);
      const member = new rmlui.DataAddressEntry('value.with.dot');
      assert.equal(root.name, 'rows');
      assert.equal(root.index, -1);
      assert.equal(index.name, '');
      assert.equal(index.index, 0);
      const address = [ root, index, member ];
      const value = model.getVariable(address);
      assert.equal(value.get(), 4);
      const child = model.getVariable('rows').child(index).child(member);
      assert.equal(child.get(), 4);
      index.index = 2;
      root.name = 'other';
      assert.equal(value.get(), 4);
      model.getVariable('rows').resize(2);
      assert.equal(value.set(8), true);
      assert.equal(model.getVariable([
        new rmlui.DataAddressEntry('rows'), new rmlui.DataAddressEntry(0),
        member,
      ]).get(), 8);
      assert.equal(model.getVariable([]), null);
      assert.equal(model.getVariable([ member ]), null);
      assert.throws(() => model.getVariable([{}]), /address/i);
      assert.throws(() => model.getVariable([ 0 ]), /address/i);
      assert.throws(() => model.getVariable([
        { name: 'rows', index: 1.5 },
      ]), /address/i);
      assert.throws(() => new rmlui.DataAddressEntry(1.5), /integer/i);
      model.getVariable('rows').resize(0);
      assert.equal(value.isValid, false);
      assert.throws(() => value.get(), /path.*valid/i);
    },

  'address-accessors-revalidate-owner-and-preserve-first-error':
    ({ context }) => {
      const model = context.createDataModel('addresses');
      model.bind('value', 3);
      const sentinel = new Error('address getter');
      assert.throws(() => model.getVariable([{
        get name() {
          throw sentinel;
        },
        index: -1,
      }]), error => error === sentinel);
      assert.throws(() => model.getVariable([{
        get name() {
          context.removeDataModel('addresses');
          return 'value';
        },
        index: -1,
      }]), /model.*valid/i);
    },

  'root-snapshots-and-definition-reflection-use-native-identities':
    ({ rmlui, context }) => {
      const model = context.createDataModel('reflection');
      const scalar = model.registerScalar('Real', 'float64');
      const record = model.registerStruct('Record');
      record.registerMember('value', scalar);
      const ref = model.getDataTypeRegister().registerReference('Ref', record);
      model.bind('record', { value: 3 }, record);
      model.bind('ref', model.getVariable('record'), ref);
      model.bindFunc('computed', () => 7);
      model.bindCustomDataVariable('constant', rmlui.makeLiteralIntVariable(0));
      const roots = model.getAllVariables();
      assert.deepEqual(Object.keys(roots).sort(),
        [ 'computed', 'constant', 'record', 'ref' ]);
      assert.equal(roots.record.getDefinition(), record);
      assert.equal(roots.record.child('value').getDefinition(), scalar);
      assert.equal(roots.ref.getDefinition(), ref);
      assert.equal(roots.computed.getDefinition().type,
        rmlui.DataVariableType.Scalar);
      assert.equal(roots.constant.getDefinition().type,
        rmlui.DataVariableType.Scalar);
      model.bind('later', 9);
      assert.equal(roots.later, undefined);
      assert.equal(model.getAllVariables().later.get(), 9);
      roots.record.child('value').set(5);
      assert.equal(model.getVariable('record.value').get(), 5);
      context.removeDataModel('reflection');
      assert.equal(roots.record.isValid, false);
      assert.throws(() => roots.record.getDefinition(), /valid/i);
    },

  'bound-host-member-receivers-use-native-functions-and-events':
    ({ context }) => {
      const model = context.createDataModel('receiver');
      const receiver = {
        value: 3,
        get() {
          return this.value;
        },
        set(value) {
          this.value = value;
        },
        increment(current, event, args) {
          this.value += Number(args[0]);
          current.dirtyVariable('value');
          event.stopPropagation();
        },
      };
      model.bindFunc('value', receiver.get.bind(receiver),
        receiver.set.bind(receiver));
      model.bindEventCallback('increment', receiver.increment.bind(receiver));
      const document = context.loadDocumentFromMemory('<rml><head/><body ' +
        'data-model="receiver"><span id="value">{{value}}</span>' +
        '<button id="button" data-event-click="increment(2)"/>' +
        '<input id="input" data-value="value"/></body></rml>');
      document.getElementById('button').dispatchEvent('click');
      context.update();
      assert.equal(receiver.value, 5);
      assert.match(document.getElementById('value').innerRML, /5/);
      document.getElementById('input').dispatchEvent('change', { value: '9' });
      context.update();
      assert.equal(receiver.value, '9');
      assert.match(document.getElementById('value').innerRML, /9/);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Data addresses');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, context: rmlui.createContext('data-addresses', 200, 160),
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
  assert.equal(failures, 0, `${failures} data address failures`);
}
