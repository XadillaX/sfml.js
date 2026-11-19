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
  'owned-event-state-release-and-dispatch-lease':
    ({ rmlui, document }) => {
      const target = document.getElementById('target');
      const allocator = new rmlui.EventInstancer();
      const id = rmlui.registerEventType('owned', true, true);
      const event = allocator.instanceEvent(target, id, 'owned',
        { exact: 9223372036854775807n, vector: { x: 3, y: 4 } }, true);
      assert.ok(event instanceof rmlui.RmlEvent);
      assert.equal(event.target, target);
      assert.equal(event.phase, rmlui.EventPhase.None);
      assert.equal(event.getParameter('exact', 0n), 9223372036854775807n);
      event.setCurrentElement(target);
      event.setPhase(rmlui.EventPhase.Target);
      assert.equal(event.currentTarget, target);
      assert.equal(event.phase, rmlui.EventPhase.Target);
      assert.throws(() => event.setPhase(3), /phase/i);
      event.stopImmediatePropagation();
      assert.equal(event.isImmediatePropagating, false);
      allocator.releaseEvent(event);
      assert.equal(event.type, 'owned');
      assert.throws(() => event.stopPropagation(), /expired|valid/i);
      let retained;
      target.addEventListener('owned', value => {
        retained = value;
        assert.throws(() => allocator.releaseEvent(value), /owned/i);
      });
      assert.equal(target.dispatchEvent('owned'), true);
      assert.throws(() => retained.setPhase(rmlui.EventPhase.None),
        /expired|valid/i);
      const factoryEvent = rmlui.Factory.instanceEvent(
        target, id, 'owned', {}, true);
      factoryEvent.setCurrentElement(null);
      assert.equal(factoryEvent.currentTarget, null);
      factoryEvent.release();
      assert.throws(() => factoryEvent.release(), /owned/i);
    },

  'factory-custom-event-allocation-chain-and-real-dispatch':
    ({ rmlui, context, document }) => {
      const target = document.getElementById('target');
      const allocator = new rmlui.EventInstancer();
      const calls = [];
      const releases = [];
      let transferred;
      const inner = new rmlui.EventInstancer((element, id, type, parameters,
        interruptible) => {
        calls.push(`inner:${type}`);
        assert.equal(parameters.n, 42);
        return allocator.instanceEvent(element, id, type, parameters,
          interruptible);
      }, snapshot => releases.push(`inner:${snapshot.type}`));
      const outer = new rmlui.EventInstancer((element, id, type, parameters,
        interruptible) => {
        calls.push(`outer:${type}`);
        assert.equal(element, target);
        assert.throws(() => context.update(), /callback/i);
        assert.throws(() => outer.instanceEvent(element, id, type,
          parameters, interruptible), /recursive/i);
        transferred = inner.instanceEvent(element, id, type, parameters,
          interruptible);
        return transferred;
      }, snapshot => releases.push(`outer:${snapshot.type}`));
      rmlui.Factory.registerEventInstancer(outer);
      target.addEventListener('custom', event => {
        assert.equal(event.getParameter('n', 0), 42);
        assert.throws(() => outer.releaseEvent(transferred), /owned/i);
        event.stopPropagation();
      });
      assert.equal(target.dispatchEvent('custom', { n: 42 }), false);
      assert.deepEqual(calls, [ 'outer:custom', 'inner:custom' ]);
      assert.deepEqual(releases, [ 'outer:custom', 'inner:custom' ]);
      assert.throws(() => transferred.isPropagating, /valid|expired/i);
      rmlui.Factory.registerEventInstancer(new rmlui.EventInstancer());
    },

  'factory-event-null-errors-and-exact-allocation-owner':
    ({ rmlui, document }) => {
      const target = document.getElementById('target');
      const id = rmlui.registerEventType('checked', true, true);
      rmlui.Factory.registerEventInstancer(
        new rmlui.EventInstancer(() => null));
      target.addEventListener(id, () => assert.fail('Declined event ran'));
      assert.equal(target.dispatchEvent(id), false);
      assert.equal(rmlui.Factory.instanceEvent(target, id, 'checked', {}, true),
        null);
      const allocator = new rmlui.EventInstancer();
      const event = allocator.instanceEvent(target, id, 'checked', {}, true);
      assert.throws(() => new rmlui.EventInstancer().releaseEvent(event),
        /instancer/i);
      assert.throws(() => new rmlui.EventInstancer(() => ({}))
        .instanceEvent(target, id, 'checked', {}, true), /event|handle/i);
      const error = new Error('event allocation failed');
      rmlui.Factory.registerEventInstancer(new rmlui.EventInstancer(() => {
        throw error;
      }));
      assert.throws(() => target.dispatchEvent(id), value => value === error);
      const releaseError = new Error('event release failed');
      const custom = new rmlui.EventInstancer((...args) =>
        allocator.instanceEvent(...args), () => {
        throw releaseError;
      });
      const owned = custom.instanceEvent(target, id, 'checked', {}, true);
      assert.throws(() => custom.releaseEvent(owned),
        value => value === releaseError);
      assert.throws(() => owned.isPropagating, /valid|expired/i);
      allocator.releaseEvent(event);
      rmlui.Factory.registerEventInstancer(new rmlui.EventInstancer());
    },

  'owned-event-checks-destroyed-target-current-and-parameter-elements':
    ({ rmlui, document }) => {
      const allocator = new rmlui.EventInstancer();
      const id = rmlui.registerEventType('references', true, true);
      const target = document.getElementById('target');
      const current = document.getElementById('other');
      const event = allocator.instanceEvent(target, id, 'references', {}, true);
      event.setCurrentElement(current);
      const parameterEvent = allocator.instanceEvent(target, id, 'references',
        { element: current }, true);
      document.innerRML = '<div id="replacement"/>';
      assert.throws(() => event.setPhase(rmlui.EventPhase.Target),
        /element|valid|expired/i);
      assert.throws(() => parameterEvent.getParameter('element', 0),
        /element|valid|expired/i);
      allocator.releaseEvent(event);
      allocator.releaseEvent(parameterEvent);
    },

  'owned-event-independent-current-parameter-and-getter-guards':
    ({ rmlui, document }) => {
      document.innerRML = '<div id="target"/><div id="parent">' +
        '<div id="current"/><div id="parameter"/></div>';
      const allocator = new rmlui.EventInstancer();
      const id = rmlui.registerEventType('guards', true, true);
      const target = document.getElementById('target');
      const current = document.getElementById('current');
      const parameter = document.getElementById('parameter');
      const event = allocator.instanceEvent(target, id, 'guards', {}, true);
      event.setCurrentElement(current);
      const other = allocator.instanceEvent(target, id, 'guards',
        { reference: parameter }, true);
      assert.equal(other.parameters.reference, parameter);
      document.getElementById('parent').innerRML = '';
      assert.equal(target.id, 'target');
      assert.throws(() => event.isPropagating, /destroyed element/i);
      assert.throws(() => other.isPropagating, /destroyed element/i);
      event.release();
      other.release();
      const invalidated = allocator.instanceEvent(
        target, id, 'guards', {}, true);
      const fallback = { get x() {
        invalidated.release();
        return 1;
      }, y: 2 };
      assert.throws(() => invalidated.getParameter('fallback', fallback),
        /valid|expired/i);
      const parameters = { get destroy() {
        document.innerRML = '';
        return true;
      } };
      assert.throws(() => allocator.instanceEvent(
        target, id, 'guards', parameters, true), /valid/i);
    },

  'owned-event-default-action-retains-active-native-event':
    ({ rmlui, document }) => {
      document.innerRML = '<input id="check" type="checkbox"/>';
      const target = document.getElementById('check');
      const allocator = new rmlui.EventInstancer();
      const event = allocator.instanceEvent(
        target, rmlui.EventId.Click, 'click', {}, true);
      event.setPhase(rmlui.EventPhase.Target);
      event.setCurrentElement(target);
      rmlui.Factory.registerEventInstancer(
        new rmlui.EventInstancer((...args) => {
          return args[1] === rmlui.EventId.Click
            ? event : allocator.instanceEvent(...args);
        }));
      target.addEventListener('click', () => {});
      let changes = 0;
      target.addEventListener('change', () => {
        ++changes;
        assert.throws(() => event.release(), /active|default action/i);
        assert.throws(() => allocator.releaseEvent(event),
          /active|default action/i);
        assert.equal(target.dispatchEvent(rmlui.EventId.Click), false);
        assert.throws(() => {
          document.innerRML = '';
        }, /active|subtree/i);
      });
      assert.throws(() => target.processDefaultAction(event),
        /active|default action/i);
      assert.equal(changes, 1);
      assert.equal(event.isPropagating, true);
      event.release();
    },

  'event-instancer-owned-closure-cycles-and-generation':
    async ({ rmlui, window, document }) => {
      const target = document.getElementById('target');
      const allocator = new rmlui.EventInstancer();
      const id = rmlui.registerEventType('gc-event', true, true);
      let weakEvent;
      let weakCallback;
      (() => {
        let event;
        const callback = (...args) => allocator.instanceEvent(...args);
        const release = () => assert.equal(event.type, 'gc-event');
        weakCallback = new WeakRef(release);
        const custom = new rmlui.EventInstancer(callback, release);
        event = custom.instanceEvent(target, id, 'gc-event', {}, true);
        weakEvent = new WeakRef(event);
      })();
      await collect();
      assert.equal(weakEvent.deref(), undefined);
      assert.equal(weakCallback.deref(), undefined);
      const owned = allocator.instanceEvent(target, id, 'gc-event', {}, true);
      rmlui.shutdown();
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => owned.isPropagating, /valid|expired/i);
      const fresh = rmlui.createContext('fresh', 160, 120).createDocument();
      assert.throws(() => allocator.instanceEvent(fresh, 1, 'old', {}, true),
        /valid/i);
    },

  'transferred-event-snapshots-do-not-retain-instancer-callbacks':
    async ({ rmlui, document }) => {
      const target = document.getElementById('target');
      const allocator = new rmlui.EventInstancer();
      const id = rmlui.registerEventType('transfer-edges', true, true);
      let source;
      let weakRelease;
      (() => {
        const release = () => {};
        weakRelease = new WeakRef(release);
        const inner = new rmlui.EventInstancer((...args) =>
          allocator.instanceEvent(...args), release);
        const outer = new rmlui.EventInstancer((...args) => {
          source = inner.instanceEvent(...args);
          return source;
        });
        const event = outer.instanceEvent(
          target, id, 'transfer-edges', {}, true);
        event.release();
      })();
      await collect();
      assert.equal(source.type, 'transfer-edges');
      assert.equal(weakRelease.deref(), undefined);
    },

  'shutdown-clears-owned-event-callback-edges-with-snapshot-retained':
    async ({ rmlui, document }) => {
      const target = document.getElementById('target');
      const allocator = new rmlui.EventInstancer();
      const id = rmlui.registerEventType('shutdown-edges', true, true);
      let event;
      let weakRelease;
      (() => {
        const release = () => {};
        weakRelease = new WeakRef(release);
        const instancer = new rmlui.EventInstancer((...args) =>
          allocator.instanceEvent(...args), release);
        event = instancer.instanceEvent(
          target, id, 'shutdown-edges', {}, true);
      })();
      rmlui.shutdown();
      await collect();
      assert.equal(event.type, 'shutdown-edges');
      assert.equal(weakRelease.deref(), undefined);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Event instancers');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('events', 160, 120);
    const document = context.createDocument();
    document.innerRML = '<div id="target"/><div id="other"/>';
    await cases[name]({ rmlui, window, context, document });
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
  assert.equal(failures, 0, `${failures} event instancer failures`);
}
