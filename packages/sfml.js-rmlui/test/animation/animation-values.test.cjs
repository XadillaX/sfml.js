'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');

async function collect() {
  for (let index = 0; index < 12; index++) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function transition(rmlui, tween = new rmlui.Tween()) {
  return rmlui.makeTransitionList({
    none: false,
    transitions: [ rmlui.makeTransition({
      id: rmlui.PropertyId.Width, duration: 0.1, tween,
      reverseAdjustmentFactor: 1,
    }) ],
  });
}

const cases = {
  'defaults-equality-and-independent-tweens': ({ rmlui }) => {
    const a = rmlui.makeAnimation();
    assert.deepEqual({ ...a, tween: a.tween.toString() }, {
      duration: 0, tween: 'linear-out', delay: 0, alternate: false,
      paused: false, numIterations: 1, name: '',
    });
    const t = rmlui.makeTransition();
    assert.deepEqual({ ...t, tween: t.tween.toString() }, {
      id: rmlui.PropertyId.Invalid, tween: 'linear-out', duration: 0,
      delay: 0, reverseAdjustmentFactor: 0,
    });
    assert.deepEqual(rmlui.makeTransitionList(), {
      type: 'transitionlist', none: true, all: false, transitions: [],
    });
    assert.ok(rmlui.animationEquals(a, rmlui.makeAnimation(a)));
    assert.ok(rmlui.transitionEquals(t, rmlui.makeTransition(t)));
    assert.equal(rmlui.animationEquals(a, { ...a, paused: true }), false);
    assert.equal(rmlui.transitionEquals(t, { ...t, delay: 1 }), false);
    const list = transition(rmlui);
    const copy = rmlui.makeTransitionList(list);
    assert.ok(rmlui.transitionListEquals(list, copy));
    copy.transitions[0].tween.reverse();
    assert.equal(rmlui.transitionListEquals(list, copy), false);
    assert.equal(list.transitions[0].tween.toString(), 'linear-out');
  },

  'parsed-lists-property-conversion-attributes-and-events': ({
    rmlui, target,
  }) => {
    target.setProperty('transition', 'width 2s quadratic-in 0.5s');
    const parsed = target.getProperty('transition').value;
    assert.equal(parsed.type, 'transitionlist');
    assert.equal(parsed.none, false);
    assert.equal(parsed.transitions[0].duration, 2);
    assert.equal(parsed.transitions[0].delay, 0.5);
    assert.equal(parsed.transitions[0].tween.toString(), 'quadratic-in');
    target.setProperty('animation', '3s cubic-out 1s alternate paused 2 pulse');
    const animation = target.getProperty('animation').value;
    assert.equal(animation.type, 'animationlist');
    assert.equal(animation.animations[0].name, 'pulse');
    assert.equal(animation.animations[0].numIterations, 2);
    assert.equal(animation.animations[0].paused, true);
    for (const [ value, unit ] of [
      [ parsed, rmlui.Unit.TRANSITION ], [ animation, rmlui.Unit.ANIMATION ],
    ]) {
      const property = new rmlui.Property(value, unit);
      assert.ok(property.equals(property.clone()));
      target.setAttribute('motion', value);
      assert.ok(new rmlui.Property(target.getAttributeValue('motion'), unit)
        .equals(property));
      assert.ok(new rmlui.Property(target.getAttributes().motion, unit)
        .equals(property));
      const listener = event => {
        assert.ok(new rmlui.Property(event.parameters.motion, unit)
          .equals(property));
        assert.ok(new rmlui.Property(event.getParameter('motion', value), unit)
          .equals(property));
      };
      target.addEventListener('motion', listener);
      target.dispatchEvent('motion', { motion: value });
      target.removeEventListener('motion', listener);
      assert.ok(new rmlui.Property(target.getAttribute('absent', value), unit)
        .equals(property));
      const empty = new rmlui.Property('invalid').get(value);
      assert.deepEqual(empty, value.type === 'transitionlist'
        ? rmlui.makeTransitionList()
        : { type: 'animationlist', animations: [] });
      target.removeAttribute('motion');
    }
  },

  'native-style-callback-copy-and-replacement': async ({
    rmlui, context, target,
  }) => {
    let calls = 0;
    let callback = t => {
      calls++;
      return t * t;
    };
    const weak = new WeakRef(callback);
    let property = new rmlui.Property(
      transition(rmlui, new rmlui.Tween(callback)), rmlui.Unit.TRANSITION);
    assert.ok(target.setProperty(rmlui.PropertyId.Transition, property));
    context.update();
    property.value = rmlui.makeTransitionList();
    property = null;
    callback = null;
    await collect();
    assert.equal(typeof weak.deref(), 'function');
    target.setClass('wide', true);
    context.update();
    await delay(25);
    context.update();
    assert.ok(calls > 0);
    assert.ok(target.getProperty('width').value < 100);
    target.setProperty('transition', 'none');
    for (let index = 0; index < 3; index++) {
      await delay(100);
      context.update();
    }
    await collect();
    assert.equal(weak.deref(), undefined);
  },

  'property-copy-does-not-root-element-lease': async ({
    rmlui, target, context,
  }) => {
    let callback = t => t;
    let input = new rmlui.Property(
      transition(rmlui, new rmlui.Tween(callback)), rmlui.Unit.TRANSITION);
    const weak = new WeakRef(callback);
    target.setProperty(rmlui.PropertyId.Transition, input);
    let copy = target.getProperty('transition');
    target.setProperty('transition', 'none');
    context.update();
    input = null;
    callback = null;
    await collect();
    assert.equal(copy.value.transitions[0].tween.evaluate(0.5), 0.5);
    copy = null;
    await collect();
    assert.equal(weak.deref(), undefined);
  },

  'keyframe-animation-callback-pause-and-release': async ({
    rmlui, target, context,
  }) => {
    let calls = 0;
    let callback = t => {
      calls++;
      return t;
    };
    const weak = new WeakRef(callback);
    let value = {
      type: 'animationlist',
      animations: [ rmlui.makeAnimation({
        name: 'pulse', duration: 60, paused: true,
        tween: new rmlui.Tween(callback),
      }) ],
    };
    target.setProperty(rmlui.PropertyId.Animation,
      new rmlui.Property(value, rmlui.Unit.ANIMATION));
    context.update();
    assert.equal(calls, 0);
    value.animations[0].paused = false;
    target.setProperty(rmlui.PropertyId.Animation,
      new rmlui.Property(value, rmlui.Unit.ANIMATION));
    value = null;
    callback = null;
    await collect();
    context.update();
    await delay(25);
    context.update();
    assert.ok(calls > 0);
    target.setProperty('animation', 'none');
    context.update();
    await collect();
    assert.equal(weak.deref(), undefined);
  },

  'clone-rebinds-both-attribute-and-style-callbacks': async ({
    rmlui, document, context,
  }) => {
    const source = document.createElement('div');
    let callback = t => t * t;
    const weak = new WeakRef(callback);
    source.setAttribute('motion',
      transition(rmlui, new rmlui.Tween(callback)));
    source.setProperty(rmlui.PropertyId.Transition, new rmlui.Property(
      source.getAttributeValue('motion'), rmlui.Unit.TRANSITION));
    let clone = source.clone();
    document.appendChild(clone);
    source.removeAttribute('motion');
    source.removeProperty('transition');
    callback = null;
    await collect();
    assert.equal(clone.getAttributeValue('motion')
      .transitions[0].tween.evaluate(0.5), 0.25);
    clone.removeAttribute('motion');
    await collect();
    assert.equal(clone.getProperty('transition')
      .value.transitions[0].tween.evaluate(0.5), 0.25);
    document.removeChild(clone);
    clone = null;
    context.update();
    await collect();
    assert.equal(weak.deref(), undefined);
  },

  'native-accessors-cannot-install-expired-callbacks': ({ rmlui, window }) => {
    const native = require('../../build/Release/rmlui.node');
    const tween = native.createTween(t => t);
    assert.throws(() => native.makeAnimation({
      tween,
      get name() {
        rmlui.shutdown();
        return 'pulse';
      },
    }), /initialised|valid/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => native.makeTransitionList({
      transitions: [{ tween }],
    }), /valid/i);
  },

  'attribute-transfer-event-snapshot-and-cycle-collection': async ({
    rmlui, document, context,
  }) => {
    let child = document.createElement('div');
    document.appendChild(child);
    let callback = (owner => t => {
      assert.ok(owner);
      return t;
    })(child);
    const weak = new WeakRef(callback);
    child.setAttributes({
      motion: transition(rmlui, new rmlui.Tween(callback)),
    });
    callback = null;
    await collect();
    assert.equal(typeof weak.deref(), 'function');
    let snapshot;
    const capture = event => {
      snapshot = event.parameters.motion;
    };
    child.addEventListener('motion', capture);
    child.dispatchEvent('motion', {
      motion: child.getAttributeValue('motion'),
    });
    child.removeEventListener('motion', capture);
    document.removeChild(child);
    child = null;
    context.update();
    await collect();
    assert.equal(snapshot.transitions[0].tween.evaluate(0.5), 0.5);
    snapshot = null;
    await collect();
    assert.equal(weak.deref(), undefined);
  },

  'property-self-cycle-and-value-replacement': async ({ rmlui }) => {
    const make = () => {
      const property = new rmlui.Property();
      property.value = transition(rmlui, new rmlui.Tween(t => {
        assert.ok(property);
        return t;
      }));
      return new WeakRef(property);
    };
    const weak = make();
    await collect();
    assert.equal(weak.deref(), undefined);
    let callback = t => t;
    const callbackWeak = new WeakRef(callback);
    const property = new rmlui.Property(
      transition(rmlui, new rmlui.Tween(callback)));
    callback = null;
    await collect();
    assert.equal(typeof callbackWeak.deref(), 'function');
    property.value = null;
    await collect();
    assert.equal(callbackWeak.deref(), undefined);
  },

  'invalid-input-atomicity-and-shutdown': ({ rmlui, window, target }) => {
    const property = new rmlui.Property(transition(rmlui));
    assert.throws(() => {
      property.value = {
        type: 'transitionlist', none: false, all: false,
        transitions: [{}, { duration: Infinity }],
      };
    }, /finite/i);
    assert.equal(property.value.transitions.length, 1);
    assert.throws(() => rmlui.makeAnimation({ paused: 1 }), /boolean/i);
    assert.throws(() => rmlui.makeAnimation({ numIterations: 0.5 }),
      /integer/i);
    assert.throws(() => rmlui.makeTransition({ tween: {} }), /Tween/i);
    assert.throws(() => rmlui.makeTransition({ id: 100000 }), /id/i);
    const invalidAll = new rmlui.Property(rmlui.makeTransitionList({
      none: false, all: true,
    }), rmlui.Unit.TRANSITION);
    assert.throws(() => target.setProperty(rmlui.PropertyId.Transition,
      invalidAll), /first entry/i);
    const stale = transition(rmlui, new rmlui.Tween(t => t));
    rmlui.shutdown();
    assert.throws(() => stale.transitions[0].tween.evaluate(0.5),
      /valid|initialised/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => new rmlui.Property(stale), /valid/i);
    assert.throws(() => target.setAttribute('motion', stale), /valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)),
    'Motion values acceptance');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('motion-values', 320, 240);
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>#target { width:40px; height:20px; }' +
      '#target.wide { width:100px; }' +
      '@keyframes pulse { from { width:40px; } to { width:100px; } }' +
      '</style></head><body><div id="target"/></body></rml>');
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
  assert.equal(failures, 0, `${failures} motion value regressions failed`);
}
