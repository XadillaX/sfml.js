'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 0.00001,
    `${actual} differs from ${expected}`);
}

async function collect() {
  for (let index = 0; index < 12; index++) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'tween-types-directions-and-dual-type': function({ rmlui }) {
    const { Tween, TweenType: T, TweenDirection: D } = rmlui;
    assert.equal(new Tween().toString(), 'linear-out');
    const curves = [
      [ T.None, 0.25 ], [ T.Linear, 0.25 ], [ T.Quadratic, 0.0625 ],
      [ T.Cubic, 0.015625 ], [ T.Quartic, 0.00390625 ],
      [ T.Quintic, 0.0009765625 ], [ T.Circular, 1 - Math.sqrt(0.9375) ],
      [ T.Sine, 1 - Math.cos(Math.PI / 8) ],
      [ T.Back, 0.0625 * (2.70158 * 0.25 - 1.70158) ],
      [ T.Exponential, Math.exp(7.24 * (0.25 - 1)) ],
      [ T.Elastic, -Math.exp(7.24 * -0.75) *
        Math.sin((0.25 - 1.1) * 2 * Math.PI / 0.4) ],
      [ T.Bounce, 0.02734375 ],
      [ T.Callback, 0.25 ],
    ];
    for (const [ type, value ] of curves) {
      const tween = new Tween(type, D.In);
      near(tween.evaluate(0.25), value);
      for (const direction of [ D.In, D.Out, D.InOut ]) {
        const curve = new Tween(type, direction);
        near(curve.evaluate(0), 0);
        near(curve.evaluate(1), 1);
      }
    }
    near(new Tween(T.Bounce, D.In).evaluate(0.25), 0.02734375);
    const dual = new Tween(T.Quadratic, { out: T.Cubic });
    near(dual.evaluate(0.25), 0.125);
    near(dual.evaluate(0.75), 0.9375);
    assert.equal(dual.toString(), 'quadratic-in-cubic-out');
    const copy = dual.clone();
    assert.ok(copy.equals(dual));
    copy.reverse();
    assert.equal(copy.toString(), 'cubic-in-quadratic-out');
    assert.ok(copy.notEquals(dual));
    assert.equal(dual.toString(), 'quadratic-in-cubic-out');
  },

  'callback-directions-identity-and-nesting': function({ rmlui }) {
    const { Tween, TweenDirection: D } = rmlui;
    const callback = t => t * t;
    const a = new Tween(callback);
    assert.equal(a.toString(), 'callback-in');
    near(a.evaluate(0.5), 0.25);
    near(new Tween(callback, D.Out).evaluate(0.5), 0.75);
    near(new Tween(callback, D.InOut).evaluate(0.25), 0.125);
    assert.ok(a.equals(new Tween(callback)));
    assert.ok(a.notEquals(new Tween(t => t * t)));
    assert.ok(a.equals(a.clone()));
    const nested = new Tween(t => a.evaluate(t));
    near(nested.evaluate(0.5), 0.25);
  },

  'callback-errors-results-and-reentry': function({ rmlui, context }) {
    const marker = new Error('tween callback marker');
    assert.throws(() => new rmlui.Tween(() => {
      throw marker;
    }).evaluate(0.5), error => error === marker);
    for (const result of [ NaN, Infinity, '0.5', Promise.resolve(0.5) ]) {
      assert.throws(() => new rmlui.Tween(() => result).evaluate(0.5),
        /finite|synchronous/i);
    }
    assert.throws(() => new rmlui.Tween(() => {
      context.update();
      return 0;
    }).evaluate(0.5), /callback/i);
    assert.throws(() => new rmlui.Tween(() => {
      rmlui.shutdown();
      return 0;
    }).evaluate(0.5), /callback/i);
    assert.ok(context.update());
  },

  'animation-overloads-start-delay-key-sequence-and-snapshots': async function({
    rmlui, context, target,
  }) {
    const { Property: P, PropertyId: I, Unit: U, Tween, TweenType: T } = rmlui;
    const targetValue = new P(80, U.PX);
    const startValue = new P(20, U.PX);
    assert.equal(target.addAnimationKey('width', targetValue, 0.02), false);
    assert.equal(target.animate('missing', targetValue, 0.02), false);
    assert.ok(target.animate('width', targetValue, 0.03,
      new Tween(T.Linear), 1, true, 0.04, startValue));
    targetValue.value = 999;
    startValue.value = 999;
    context.update();
    assert.equal(target.getProperty('width').value, 40,
      'delay keeps old style');
    assert.ok(target.addAnimationKey(I.Width, new P(100, U.PX), 0.03));
    await delay(150);
    context.update();
    near(target.getProperty('width').value, 100);
    assert.equal(target.addAnimationKey(I.Width, new P(200, U.PX), 0.02),
      false);
    assert.ok(target.animate(I.Width, new P(60, U.PX), 0.03));
    assert.ok(target.addAnimationKey('width', new P(30, U.PX), 0.03));
    await delay(100);
    context.update();
    near(target.getProperty('width').value, 30);
  },

  'alternate-iterations-and-animationend': async function({
    rmlui, context, target,
  }) {
    const ends = [];
    target.addEventListener('animationend',
      event => ends.push(event.parameters));
    const { Property: P, Unit: U } = rmlui;
    assert.ok(target.animate('width', new P(90, U.PX), 0.025,
      undefined, 2, true, 0, new P(10, U.PX)));
    await delay(100);
    context.update();
    near(target.getProperty('width').value, 10);
    // RmlUi caps dt at 100 ms and advances at most one iteration per update.
    assert.equal(ends.length, 0);
    await delay(10);
    context.update();
    assert.equal(ends.length, 1);
    assert.ok(target.animate('width', new P(70, U.PX), 0.025,
      undefined, 2, false));
    await delay(100);
    context.update();
    await delay(10);
    context.update();
    near(target.getProperty('width').value, 70);
    assert.equal(ends.length, 2);
  },

  'animation-callback-lifetime-replacement-and-exception': async function({
    rmlui, context, target,
  }) {
    const { Property: P, Unit: U, Tween } = rmlui;
    let calls = 0;
    let callback = t => {
      calls++;
      return t * t;
    };
    const weak = new WeakRef(callback);
    let tween = new Tween(callback);
    assert.ok(target.animate('width', new P(90, U.PX), 60, tween));
    callback = null;
    tween = null;
    await collect();
    context.update();
    assert.ok(calls > 0);
    assert.equal(typeof weak.deref(), 'function');
    assert.ok(target.animate('width', new P(80, U.PX), 0.01));
    await collect();
    assert.equal(weak.deref(), undefined);
    const marker = new Error('animation callback marker');
    assert.ok(target.animate('width', new P(50, U.PX), 0.1,
      new Tween(() => {
        throw marker;
      })));
    assert.throws(() => context.update(), error => error === marker);
    assert.ok(target.animate('width', new P(60, U.PX), 0.01));
    assert.ok(context.update());
  },

  'detached-callback-cycles-are-collectable': async function({
    rmlui, document, context,
  }) {
    let child = document.createElement('div');
    child.setProperty('width', '40px');
    document.appendChild(child);
    context.update();
    let captured = child;
    let callback = (owner => t => {
      assert.ok(owner);
      return t;
    })(captured);
    const weak = new WeakRef(callback);
    let tween = new rmlui.Tween(callback);
    child.animate('width', new rmlui.Property(80, rmlui.Unit.PX), 60, tween);
    document.removeChild(child);
    callback = null;
    tween = null;
    child = null;
    captured = null;
    await collect();
    assert.equal(weak.deref(), undefined);
  },

  'shared-callback-survives-one-owner-and-releases-on-completion':
    async function({ rmlui, document, context, target }) {
      const { Property: P, Unit: U, Tween } = rmlui;
      const other = document.createElement('div');
      other.setProperty('width', '10px');
      document.appendChild(other);
      context.update();
      let calls = 0;
      let callback = t => {
        calls++;
        return t;
      };
      const weak = new WeakRef(callback);
      let tween = new Tween(callback);
      target.animate('width', new P(90, U.PX), 60, tween);
      other.animate('width', new P(20, U.PX), 0.02, tween);
      tween = null;
      callback = null;
      target.animate('width', new P(30, U.PX), 0.02);
      // Collection preserves the callback needed by the other native owner.
      await collect();
      await delay(30);
      context.update();
      assert.ok(calls > 0);
      await collect();
      assert.equal(weak.deref(), undefined);
    },

  'callback-wrapper-self-cycle-is-collectable': async function({ rmlui }) {
    const make = () => {
      const tween = new rmlui.Tween(t => {
        tween.toString();
        return t;
      });
      return new WeakRef(tween);
    };
    const weak = make();
    await collect();
    assert.equal(weak.deref(), undefined);
  },

  'active-animation-cannot-be-mutated-from-value-callback': function({
    rmlui, target, context,
  }) {
    const targetValue = new rmlui.Property(80, rmlui.Unit.PX);
    target.animate('width', targetValue, 60, new rmlui.Tween(() => {
      target.animate('width', targetValue, 1);
      return 0;
    }));
    assert.throws(() => context.update(), /callback/i);
    target.animate('width', targetValue, 1, new rmlui.Tween(() => {
      target.setProperty('width', '100px');
      return 0;
    }));
    assert.throws(() => context.update(), /callback/i);
    assert.ok(target.animate('width', targetValue, 1));
    assert.ok(context.update());
  },

  'shutdown-invalidates-callbacks-and-retains-pure-tweens': function({
    rmlui, window,
  }) {
    const callback = new rmlui.Tween(t => t);
    const pure = new rmlui.Tween();
    rmlui.shutdown();
    near(pure.evaluate(0.5), 0.5);
    assert.throws(() => callback.evaluate(0.5), /valid|initialised/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => callback.evaluate(0.5), /valid/i);
  },

  'invalid-input-and-typed-storage': function({ rmlui, target }) {
    const { Tween, Property: P, Unit: U, PropertyId: I } = rmlui;
    for (const type of [ -1, 13, 0.5, NaN ]) {
      assert.throws(() => new Tween(type), /type/i);
    }
    assert.throws(() => new Tween(7, 4), /direction/i);
    assert.throws(() => new Tween(7, { out: 14 }), /type/i);
    for (const time of [ -0.1, 1.1, Infinity, NaN ]) {
      assert.throws(() => new Tween().evaluate(time), /finite|range|\[0, 1\]/i);
    }
    assert.throws(() => target.animate('width', new P(4, U.PX), -1),
      /duration/i);
    assert.throws(() => target.animate(I.Transform, new P(1, U.TRANSFORM), 1),
      /typed.*storage/i);
    assert.throws(() => target.animate('width', new P(1, U.PX), 1,
      Object.create(Tween.prototype)), /Tween/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Animation acceptance');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('animation', 320, 240);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><div id="target" style="width:40px;height:20px"/>' +
      '</body></rml>');
    document.show();
    context.update();
    await cases[name]({
      rmlui, window, context, document,
      target: document.getElementById('target'),
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
      [ '--expose-gc', __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} animation regressions failed`);
}
