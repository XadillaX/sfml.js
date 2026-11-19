'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function fixtures(rmlui) {
  return [
    [ null, rmlui.Unit.UNKNOWN ],
    [ true, rmlui.Unit.UNKNOWN ],
    [ 1.5, rmlui.Unit.UNKNOWN ],
    [ 9007199254740993n, rmlui.Unit.UNKNOWN ],
    [ 'text', rmlui.Unit.STRING ],
    [{ x: 1, y: 2 }, rmlui.Unit.UNKNOWN ],
    [{ x: 1, y: 2, z: 3 }, rmlui.Unit.UNKNOWN ],
    [{ x: 1, y: 2, z: 3, w: 4 }, rmlui.Unit.UNKNOWN ],
    [{ type: 'colourb', red: 1, green: 2, blue: 3, alpha: 4 },
      rmlui.Unit.COLOUR ],
    [{ type: 'colourf', red: 0.5, green: 1, blue: 0, alpha: 1 },
      rmlui.Unit.COLOUR ],
    [{ type: 'colorstoplist', values: [] }, rmlui.Unit.COLORSTOPLIST ],
    [{ type: 'boxshadowlist', values: [] }, rmlui.Unit.BOXSHADOWLIST ],
    [{ type: 'transform', primitives: [
      { type: rmlui.TransformPrimitiveType.SCALE2D, values: [ 2, 3 ] },
    ] }, rmlui.Unit.TRANSFORM ],
    [ rmlui.makeTransitionList({
      none: false, transitions: [ rmlui.makeTransition({
        id: rmlui.PropertyId.Width, duration: 2,
      }) ],
    }), rmlui.Unit.TRANSITION ],
    [{
      type: 'animationlist',
      animations: [ rmlui.makeAnimation({ name: 'pulse', duration: 3 }) ],
    }, rmlui.Unit.ANIMATION ],
    [ new rmlui.DecoratorList('image(example.png)'), rmlui.Unit.DECORATOR ],
    [ new rmlui.FilterList('blur(2px)'), rmlui.Unit.FILTER ],
    [ new rmlui.FontEffectList('outline(1px red)'), rmlui.Unit.FONTEFFECT ],
  ];
}

function sameValue(rmlui, actual, expected, unit) {
  if (expected?.type === 'transform') {
    assert.deepEqual(actual, expected);
  } else if (expected instanceof rmlui.FontEffectList) {
    assert.ok(actual instanceof rmlui.FontEffectList);
    assert.deepEqual(actual.list.map(value => value.fingerprint),
      expected.list.map(value => value.fingerprint));
  } else {
    assert.ok(new rmlui.Property(actual, unit)
      .equals(new rmlui.Property(expected, unit)), `Variant ${expected?.type}`);
  }
}

const cases = {
  'getters-and-setters-support-owned-variant-values': ({ rmlui, context }) => {
    const model = context.createDataModel('variants');
    for (const [ index, [ initial, unit ]] of fixtures(rmlui).entries()) {
      let value = initial;
      const name = `value${index}`;
      assert.equal(model.bindFunc(name, () => value, input => {
        value = input;
      }), true);
      const variable = model.getVariable(name);
      sameValue(rmlui, variable.get(), initial, unit);
      assert.equal(variable.set(initial), true);
      sameValue(rmlui, value, initial, unit);
      sameValue(rmlui, variable.get(), initial, unit);
    }
  },

  'direct-register-call-output-and-shared-rml-expressions':
    ({ rmlui, context }) => {
      const register = new rmlui.DataTypeRegister();
      const transforms = register.getTransformFuncRegister();
      assert.equal(register.getTransformFuncRegister(), transforms);
      assert.ok(transforms instanceof rmlui.TransformFuncRegister);
      assert.deepEqual(transforms.call('missing', [ 1 ]),
        { success: false, value: null });
      assert.deepEqual(transforms.call('round', [ 1.8 ]),
        { success: true, value: 2 });
      transforms.register('decorate', args => `direct:${args[0]}`);
      const model = context.createDataModel('shared',
        { typeRegister: register });
      model.bind('name', 'first');
      const document = context.loadDocumentFromMemory('<rml><head/><body ' +
        'data-model="shared"><div id="value">{{name | decorate}}</div>' +
        '</body></rml>');
      assert.match(document.getElementById('value').innerRML, /direct:first/);
      model.registerTransformFunc('vector', () => ({ x: 3, y: 4 }));
      assert.deepEqual(transforms.call('vector', []),
        { success: true, value: { x: 3, y: 4 } });
      context.remove();
      assert.deepEqual(transforms.call('decorate', [ 'alive' ]),
        { success: true, value: 'direct:alive' });
      rmlui.shutdown();
      assert.equal(transforms.isValid, false);
      assert.throws(() => transforms.call('decorate', []), /valid|initial/i);
    },

  'direct-transforms-convert-every-owned-input-and-output':
    ({ rmlui, context }) => {
      const register = context.createDataModel('all').getDataTypeRegister();
      const transforms = register.getTransformFuncRegister();
      transforms.register('identity', args => args[0]);
      for (const [ value, unit ] of fixtures(rmlui)) {
        const result = transforms.call('identity', [ value ]);
        assert.equal(result.success, true);
        sameValue(rmlui, result.value, value, unit);
      }
    },

  'native-rml-vector-transform-and-colour-style-view': ({ context }) => {
    const model = context.createDataModel('styles');
    let red = 20;
    model.bindFunc('vector', () => ({ x: red, y: 40 }));
    const transforms = model.getDataTypeRegister().getTransformFuncRegister();
    transforms.register('colour', args => ({
      type: 'colourb', red: args[0].x, green: args[0].y, blue: 60, alpha: 255,
    }));
    transforms.register('label', args => `${args[0].x},${args[0].y}`);
    const document = context.loadDocumentFromMemory('<rml><head/><body ' +
      'data-model="styles"><div id="value" ' +
      'data-style-color="vector | colour">{{vector | label}}</div>' +
      '</body></rml>');
    document.show();
    context.update();
    const target = document.getElementById('value');
    assert.deepEqual(target.getProperty('color').value,
      { type: 'colourb', red: 20, green: 40, blue: 60, alpha: 255 });
    assert.equal(target.innerRML, '20,40');
    red = 80;
    model.dirtyVariable('vector');
    context.update();
    assert.deepEqual(target.getProperty('color').value,
      { type: 'colourb', red: 80, green: 40, blue: 60, alpha: 255 });
    assert.equal(target.innerRML, '80,40');
  },

  'getter-and-direct-call-return-independent-value-storage':
    ({ rmlui, context }) => {
      const model = context.createDataModel('copies');
      const input = { x: 3, y: 4 };
      model.bindFunc('vector', () => input);
      const retained = model.getVariable('vector').get();
      input.x = 99;
      assert.equal(retained.x, 3);
      assert.equal(model.getVariable('vector').get().x, 99);
      const transforms = model.getDataTypeRegister().getTransformFuncRegister();
      const motion = rmlui.makeTransitionList({
        none: false, transitions: [ rmlui.makeTransition({
          id: rmlui.PropertyId.Width, duration: 2,
        }) ],
      });
      transforms.register('motion', () => motion);
      const snapshot = transforms.call('motion', []).value;
      motion.transitions[0].duration = 99;
      motion.transitions[0].tween.reverse();
      context.removeDataModel('copies');
      assert.equal(snapshot.transitions[0].duration, 2);
      assert.equal(snapshot.transitions[0].tween.toString(), 'linear-out');
      context.remove();
      assert.deepEqual(retained, { x: 3, y: 4 });
      assert.equal(snapshot.transitions[0].duration, 2);
    },

  'argument-conversion-failures-never-invoke-transform': ({ rmlui }) => {
    const transforms = new rmlui.DataTypeRegister().getTransformFuncRegister();
    let calls = 0;
    transforms.register('count', () => ++calls);
    const failure = new Error('argument conversion');
    assert.throws(() => transforms.call('count', [{
      get x() {
        throw failure;
      },
      y: 2,
    }]), error => error === failure);
    assert.equal(calls, 0);
    assert.throws(() => transforms.call('count', [ 2n ** 70n ]),
      /64-bit range/i);
    assert.equal(calls, 0);
    assert.equal(transforms.call('count', []).value, 1);
  },

  'duplicate-transforms-preserve-first-and-release-rejected-callbacks':
    async ({ rmlui }) => {
      const register = new rmlui.DataTypeRegister();
      const transforms = register.getTransformFuncRegister();
      transforms.register('first', () => 7);
      let rejected;
      let builtinRejected;
      (() => {
        const callback = () => 8;
        const builtin = () => 999;
        rejected = new WeakRef(callback);
        builtinRejected = new WeakRef(builtin);
        transforms.register('first', callback);
        transforms.register('round', builtin);
      })();
      await collect();
      assert.equal(rejected.deref(), undefined);
      assert.equal(builtinRejected.deref(), undefined);
      assert.deepEqual(transforms.call('first', []),
        { success: true, value: 7 });
      assert.deepEqual(transforms.call('round', [ 1.8 ]),
        { success: true, value: 2 });
    },

  'conversion-accessors-stay-inside-active-callback-and-recover':
    ({ rmlui, context }) => {
      const model = context.createDataModel('conversion');
      const transforms = model.getDataTypeRegister().getTransformFuncRegister();
      let recursive = true;
      transforms.register('recursive', () => ({
        get x() {
          if (recursive) {
            transforms.call('recursive', []);
          }
          return 1;
        },
        y: 2,
      }));
      assert.throws(() => transforms.call('recursive', []), /recursiv/i);
      recursive = false;
      assert.deepEqual(transforms.call('recursive', []),
        { success: true, value: { x: 1, y: 2 } });
      model.bindFunc('protected', () => ({
        get x() {
          context.removeDataModel('conversion');
          return 1;
        },
        y: 2,
      }));
      assert.throws(() => model.getVariable('protected').get(), /callback/i);
      assert.equal(model.isValid, true);
      const failure = new Error('owned transform failed');
      transforms.register('failure', () => {
        throw failure;
      });
      assert.throws(() => transforms.call('failure', []),
        error => error === failure);
      transforms.register('later', () => 3);
      assert.equal(transforms.call('later', []).value, 3);
      const native = require('../../dist/internal/native').native;
      transforms.register('pointer',
        () => native.getRootElement(context.handle));
      assert.throws(() => transforms.call('pointer', []), /owned|pointer/i);
      rmlui.shutdown();
    },

  'argument-accessors-validate-owner-after-conversion': ({ context }) => {
    const model = context.createDataModel('conversion');
    const transforms = model.getDataTypeRegister().getTransformFuncRegister();
    transforms.register('identity', args => args[0]);
    assert.throws(() => transforms.call('identity', [{
      get x() {
        context.remove();
        return 1;
      },
      y: 2,
    }]), /valid/i);
  },

  'owned-context-and-register-transform-cycles-collect':
    async ({ rmlui, context }) => {
      let contextWeak;
      let registerWeak;
      let callbackWeak;
      (() => {
        const owned = rmlui.Factory.instanceContext(
          'owned-transform-cycle', context.getRenderManager(), null);
        const register = new rmlui.DataTypeRegister();
        const transforms = register.getTransformFuncRegister();
        owned.createDataModel('cycle', { typeRegister: register });
        const callback = () => owned.name;
        transforms.register('cycle', callback);
        contextWeak = new WeakRef(owned);
        registerWeak = new WeakRef(register);
        callbackWeak = new WeakRef(callback);
      })();
      await collect();
      assert.equal(contextWeak.deref(), undefined);
      assert.equal(registerWeak.deref(), undefined);
      assert.equal(callbackWeak.deref(), undefined);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Data transforms');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('data-transforms', 200, 160);
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
  assert.equal(failures, 0, `${failures} data transform failures`);
}
