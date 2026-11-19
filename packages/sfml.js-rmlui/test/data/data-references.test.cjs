'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function schemas(model) {
  const register = model.getDataTypeRegister();
  const scalar = register.registerScalar('Real', 'float64');
  const array = register.registerArray('Reals', scalar);
  const record = register.registerStruct('Record');
  record.registerMember('values', array);
  return {
    register, scalar, array, record,
    scalarRef: register.registerReference('RealRef', scalar),
    arrayRef: register.registerReference('RealsRef', array),
    recordRef: register.registerReference('RecordRef', record),
  };
}

const cases = {
  'nullable-scalars-and-checked-reassignment': ({ context }) => {
    const model = context.createDataModel('refs');
    const types = schemas(model);
    model.bind('value', 4, types.scalar);
    assert.equal(model.bind('alias', null, types.scalarRef), true);
    const alias = model.getVariable('alias');
    assert.equal(alias.getReference(), null);
    assert.equal(alias.get(), null);
    assert.equal(alias.set(9), false);
    assert.equal(alias.setReference(model.getVariable('value')), true);
    assert.equal(alias.getReference().get(), 4);
    assert.equal(alias.get(), 4);
    assert.equal(alias.set(9), true);
    assert.equal(model.getVariable('value').get(), 9);
    assert.equal(alias.setReference(null), true);
    assert.equal(alias.get(), null);
    model.bind('text', 'different');
    assert.throws(() => alias.setReference(model.getVariable('text')),
      /schema|definition/i);
    assert.equal(alias.getReference(), null);
    assert.throws(() =>
      model.getVariable('value').getReference(), /reference/i);
    assert.equal(
      types.register.registerReference('RealRef', types.array), null);
    assert.throws(() =>
      types.register.registerReference('DoubleRef', types.scalarRef),
    /reference/i);
  },

  'array-and-struct-references-follow-current-storage': ({ context }) => {
    const model = context.createDataModel('refs');
    const types = schemas(model);
    model.bind('record', { values: [ 1, 2 ] }, types.record);
    model.bind('alias', model.getVariable('record'), types.recordRef);
    model.bind('items', model.getVariable('record.values'), types.arrayRef);
    const alias = model.getVariable('alias');
    assert.deepEqual(alias.reflectMemberNames(), [ 'values' ]);
    const values = alias.child('values');
    const child = values.child(1);
    const old = values.getNumericView();
    assert.equal(model.getVariable('items').size, 2);
    assert.equal(model.getVariable('items').resize(4), true);
    assert.deepEqual(Array.from(values.getNumericView()), [ 1, 2, 0, 0 ]);
    assert.equal(child.get(), 2);
    old[1] = 99;
    assert.equal(child.get(), 2);
    assert.equal(alias.setReference(null), true);
    assert.equal(alias.child('values'), null);
    assert.throws(() => child.get(), /path.*valid/i);
    const items = model.getVariable('items');
    items.setReference(null);
    assert.equal(items.size, 0);
    assert.equal(items.child('size'), null);
    assert.throws(() => items.getNumericView(), /null|reference/i);
  },

  'pointer-to-pointer-types-follow-core-registration-rejection':
    ({ context }) => {
      const model = context.createDataModel('refs');
      const types = schemas(model);
      model.bind('values', [ 1, 2 ], types.array);
      model.bind('first', model.getVariable('values'), types.arrayRef);
      const first = model.getVariable('first');
      assert.throws(() => types.register.registerReference('SecondRef',
        types.arrayRef), /recursive reference/i);
      assert.equal(types.register.getDefinition('SecondRef'), null);
      assert.equal(first.size, 2);
      assert.deepEqual(Array.from(first.getNumericView()), [ 1, 2 ]);
      assert.equal(first.child(1).get(), 2);
    },

  'recursive-member-references-and-real-rml-updates': ({ context }) => {
    const model = context.createDataModel('refs');
    const register = model.getDataTypeRegister();
    const text = register.registerScalar('Text', 'string');
    const node = register.registerStruct('Node');
    const ref = register.registerReference('NodeRef', node);
    node.registerMember('title', text);
    node.registerMember('next', ref);
    model.bind('first', { title: 'first', next: null }, node);
    model.bind('second', {
      title: 'second', next: model.getVariable('first'),
    }, node);
    const next = model.getVariable('first.next');
    next.setReference(model.getVariable('second'));
    assert.equal(model.getVariable('first.next.next.title').get(), 'first');
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="refs"><div id="title">{{first.next.title}}</div>' +
      '</body></rml>');
    assert.match(document.getElementById('title').innerRML, /second/);
    model.applyPatch({ '$.first.next.title': 'updated' });
    context.update();
    assert.match(document.getElementById('title').innerRML, /updated/);
    next.setReference(null);
    model.dirtyVariable('first');
    context.update();
    assert.equal(next.getReference(), null);
  },

  'same-register-cross-model-expiry-and-target-replacement': ({ context }) => {
    const source = context.createDataModel('source');
    const types = schemas(source);
    const model = context.createDataModel('refs');
    source.bind('value', 3, types.scalar);
    model.bind('alias', source.getVariable('value'), types.scalarRef);
    const alias = model.getVariable('alias');
    assert.equal(alias.get(), 3);
    context.removeDataModel('source');
    assert.throws(() => alias.get(), /model.*valid/i);
    alias.setReference(null);
    assert.equal(alias.get(), null);
    const foreign = new (require('../../dist').DataTypeRegister)();
    const scalar = foreign.registerScalar('Real', 'float64');
    const other = context.createDataModel('foreign', { typeRegister: foreign });
    other.bind('value', 5, scalar);
    assert.throws(() => alias.setReference(other.getVariable('value')),
      /register|schema|definition/i);
  },

  'reference-cycles-are-rejected-without-recursion-or-crashes':
    ({ context }) => {
      const model = context.createDataModel('refs');
      const types = schemas(model);
      model.bind('first', null, types.scalarRef);
      model.bind('second', null, types.scalarRef);
      const first = model.getVariable('first');
      const second = model.getVariable('second');
      assert.throws(() => first.setReference(first), /reference|schema/i);
      assert.throws(() => first.setReference(second), /reference|schema/i);
      assert.equal(first.get(), null);
    },

  'dependent-reference-path-recursion-and-array-target-expiry':
    ({ context }) => {
      const model = context.createDataModel('refs');
      const register = model.getDataTypeRegister();
      const scalar = register.registerScalar('Real', 'float64');
      const scalarRef = register.registerReference('RealRef', scalar);
      const array = register.registerArray('Reals', scalar);
      model.bind('values', [ 1 ], array);
      model.bind('alias', model.getVariable('values[0]'), scalarRef);
      model.getVariable('values').resize(0);
      assert.throws(() => model.getVariable('alias').get(), /path.*valid/i);
      model.getVariable('alias').setReference(null);
      const node = register.registerStruct('Node');
      const ref = register.registerReference('NodeRef', node);
      const nodes = register.registerArray('Nodes', node);
      node.registerMember('next', ref);
      node.registerMember('children', nodes);
      model.bind('root', {
        next: null, children: [{ next: null, children: [] }],
      }, node);
      const next = model.getVariable('root.next');
      next.setReference(model.getVariable('root'));
      const target = model.getVariable('root.next.children[0]');
      next.setReference(target);
      assert.throws(() => next.child('children'),
        error => error instanceof RangeError && /recursive depth/i.test(
          error.message));
      next.setReference(null);
      assert.equal(next.getReference(), null);
    },

  'visible-reference-edges-retain-and-release-owned-targets': async env => {
    const { rmlui, context } = env;
    const register = new rmlui.DataTypeRegister();
    const scalar = register.registerScalar('Real', 'float64');
    const ref = register.registerReference('RealRef', scalar);
    const model = context.createDataModel('refs', {
      typeRegister: register,
    });
    let targetWeak;
    (() => {
      const owned = rmlui.Factory.instanceContext(
        'reference-target', context.getRenderManager(), null);
      const target = owned.createDataModel('target', {
        typeRegister: register,
      });
      target.bind('value', 8, scalar);
      targetWeak = new WeakRef(owned);
      model.bind('alias', target.getVariable('value'), ref);
    })();
    await collect();
    assert.ok(targetWeak.deref());
    assert.equal(model.getVariable('alias').get(), 8);
    model.getVariable('alias').setReference(null);
    await collect();
    assert.equal(targetWeak.deref(), undefined);
  },

  'owned-context-reference-cycles-collect': async env => {
    const { rmlui, context } = env;
    let firstWeak;
    let secondWeak;
    (() => {
      const register = new rmlui.DataTypeRegister();
      const scalar = register.registerScalar('Real', 'float64');
      const ref = register.registerReference('RealRef', scalar);
      const first = rmlui.Factory.instanceContext(
        'reference-cycle-first', context.getRenderManager(), null);
      const second = rmlui.Factory.instanceContext(
        'reference-cycle-second', context.getRenderManager(), null);
      const a = first.createDataModel('a', { typeRegister: register });
      const b = second.createDataModel('b', { typeRegister: register });
      a.bind('value', 1, scalar);
      b.bind('value', 2, scalar);
      a.bind('alias', b.getVariable('value'), ref);
      b.bind('alias', a.getVariable('value'), ref);
      firstWeak = new WeakRef(first);
      secondWeak = new WeakRef(second);
    })();
    await collect();
    assert.equal(firstWeak.deref(), undefined);
    assert.equal(secondWeak.deref(), undefined);
  },

  'failed-bind-and-truncated-arrays-release-reference-edges': async env => {
    const { rmlui, context } = env;
    const register = new rmlui.DataTypeRegister();
    const scalar = register.registerScalar('Real', 'float64');
    const ref = register.registerReference('RealRef', scalar);
    const refs = register.registerArray('RealRefs', ref);
    const model = context.createDataModel('refs', {
      typeRegister: register,
    });
    model.bind('taken', 1);
    let targetWeak;
    (() => {
      const owned = rmlui.Factory.instanceContext(
        'truncated-reference-target', context.getRenderManager(), null);
      const target = owned.createDataModel('target', {
        typeRegister: register,
      });
      target.bind('value', 7, scalar);
      targetWeak = new WeakRef(owned);
      assert.equal(
        model.bind('taken', target.getVariable('value'), ref), false);
      model.bind('array', [ target.getVariable('value') ], refs);
    })();
    await collect();
    assert.ok(targetWeak.deref());
    model.getVariable('array').resize(0);
    await collect();
    assert.equal(targetWeak.deref(), undefined);
    model.getVariable('array').resize(2);
    assert.equal(model.getVariable('array[1]').getReference(), null);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Managed data references');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, context: rmlui.createContext('data-references', 200, 160),
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
  assert.equal(failures, 0, `${failures} managed data reference failures`);
}
