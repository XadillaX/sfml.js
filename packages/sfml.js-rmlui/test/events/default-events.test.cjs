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
  'upstream-defaults-propagation-and-parameter-conversions': ({ rmlui }) => {
    const event = new rmlui.RmlEvent();
    assert.equal(event.target, null);
    assert.equal(event.currentTarget, null);
    assert.equal(event.targetId, '');
    assert.equal(event.type, '');
    assert.equal(event.id, rmlui.EventId.Invalid);
    assert.equal(event.phase, rmlui.EventPhase.None);
    assert.equal(event.isInterruptible, false);
    assert.deepEqual(event.parameters, {});
    assert.deepEqual(event.unprojectedMouseScreenPosition, { x: 0, y: 0 });
    assert.equal(event.isPropagating, true);
    assert.equal(event.isImmediatePropagating, true);
    event.stopPropagation();
    event.stopImmediatePropagation();
    assert.equal(event.isPropagating, true);
    assert.equal(event.isImmediatePropagating, true);
    assert.equal(event.getParameter('absent', 42), 42);
    assert.equal(event.getParameter('absent', 42n), 42n);
    assert.equal(event.getParameter('absent', 'text'), 'text');
    assert.deepEqual(event.getParameter('absent', { x: 3, y: 4 }),
      { x: 3, y: 4 });
    assert.equal(event.isType(''), true);
    assert.equal(event.isType(rmlui.EventId.Invalid), true);
    assert.equal(event.isType('click'), false);
    assert.equal(event.isType(rmlui.EventId.Click), false);
    event.setCurrentElement(null);
    event.setPhase(rmlui.EventPhase.Target);
    assert.equal(event.phase, rmlui.EventPhase.Target);
    event.release();
    assert.equal(event.isType(''), true);
    assert.throws(() => event.getParameter('absent', 0), /expired|valid/i);
    assert.throws(() => event.release(), /owned/i);
  },

  'targetless-current-replacement-clear-and-destruction':
    ({ rmlui, document }) => {
      document.innerRML = '<div id="first-parent"><div id="first"/></div>' +
        '<div id="second-parent"><div id="second"/></div>';
      const event = new rmlui.RmlEvent();
      const first = document.getElementById('first');
      const second = document.getElementById('second');
      event.setCurrentElement(first);
      assert.equal(event.currentTarget, first);
      event.setCurrentElement(second);
      document.getElementById('first-parent').innerRML = '';
      assert.equal(event.isPropagating, true);
      event.setCurrentElement(null);
      document.getElementById('second-parent').innerRML = '';
      assert.equal(event.isPropagating, true);
      assert.equal(event.currentTarget, null);
      document.innerRML = '<div id="current"/>';
      event.setCurrentElement(document.getElementById('current'));
      document.innerRML = '';
      assert.throws(() => event.isPropagating, /destroyed element/i);
      event.release();
    },

  'manual-listener-targetless-event-lease-and-release-guards':
    ({ rmlui }) => {
      const event = new rmlui.RmlEvent();
      let saved;
      const listener = new rmlui.EventListener(value => {
        saved = value;
        assert.equal(value.target, null);
        assert.equal(value.currentTarget, null);
        assert.equal(value.isType(rmlui.EventId.Invalid), true);
        assert.equal(value.getParameter('missing', true), true);
        assert.throws(() => event.release(), /active/i);
        assert.throws(() => listener.processEvent(event), /active/i);
      });
      listener.processEvent(event);
      assert.equal(event.isPropagating, true);
      assert.throws(() => saved.isPropagating, /expired|valid/i);
      event.release();
      listener.release();
    },

  'targetless-event-current-callback-keeps-native-node-alive':
    ({ rmlui, document }) => {
      document.innerRML = '<div id="parent"><div id="current"/></div>';
      const event = new rmlui.RmlEvent();
      const current = document.getElementById('current');
      event.setCurrentElement(current);
      const listener = new rmlui.EventListener(value => {
        assert.equal(value.currentTarget, current);
        assert.throws(() => {
          document.getElementById('parent').innerRML = '';
        }, /active|subtree|callback/i);
      });
      listener.processEvent(event);
      assert.equal(current.id, 'current');
      event.release();
      listener.release();
    },

  'default-event-gc-shutdown-and-restart':
    async ({ rmlui, window }) => {
      let weak;
      (() => {
        weak = new WeakRef(new rmlui.RmlEvent());
      })();
      await collect();
      assert.equal(weak.deref(), undefined);
      const retained = new rmlui.RmlEvent();
      rmlui.shutdown();
      assert.equal(retained.target, null);
      assert.throws(() => retained.isPropagating, /expired|valid/i);
      assert.throws(() => new rmlui.RmlEvent(), /initiali[sz]/i);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const fresh = new rmlui.RmlEvent();
      assert.equal(fresh.isPropagating, true);
      fresh.release();
      assert.throws(() => retained.release(), /owned/i);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Default events');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('defaults', 160, 120);
    const document = context.createDocument();
    await cases[name]({ rmlui, window, document });
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
  assert.equal(failures, 0, `${failures} default event failures`);
}
