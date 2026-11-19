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
  'canonical-component-and-shared-registration-index':
    ({ document, rmlui }) => {
      const target = document.getElementById('target');
      const dispatcher = target.getEventDispatcher();
      assert.ok(dispatcher instanceof rmlui.EventDispatcher);
      assert.strictEqual(target.getEventDispatcher(), dispatcher);
      const calls = [];
      const callback = event => calls.push(event.type);
      const id = rmlui.registerEventType('shared', true, true);
      dispatcher.attachEvent(id, callback);
      target.addEventListener('shared', callback);
      dispatcher.attachEvent(id, callback, true);
      assert.equal(dispatcher.toString(), 'shared (2)');
      assert.equal(dispatcher.toString(), target.getEventDispatcherSummary());
      target.removeEventListener('shared', callback, true);
      target.dispatchEvent(id);
      dispatcher.detachEvent(id, callback);
      dispatcher.detachEvent(id, callback);
      assert.equal(dispatcher.toString(), '');
      target.dispatchEvent(id);
      target.addEventListener(id, callback);
      dispatcher.detachEvent('shared', callback);
      target.dispatchEvent(id);
      assert.deepEqual(calls, [ 'shared' ]);
    },

  'typed-listeners-recurse-through-dom-and-native-scrollbars':
    ({ document, rmlui }) => {
      const parent = document.getElementById('parent');
      const target = document.getElementById('target');
      const vertical = parent.getElementScroll().getScrollbar(0);
      assert.ok(vertical);
      const notices = [];
      let calls = 0;
      const listener = new rmlui.EventListener(() => calls++, undefined,
        value => notices.push(value.id || value.tagName));
      for (const element of [ parent, target, vertical ]) {
        element.getEventDispatcher().attachEvent('recursive', listener);
        element.getEventDispatcher().attachEvent('recursive', listener, true);
      }
      parent.getEventDispatcher().detachAllEvents();
      assert.equal(notices.length, 6);
      assert.deepEqual(notices.sort(), [
        'parent', 'parent', 'scrollbarvertical', 'scrollbarvertical',
        'target', 'target',
      ]);
      for (const element of [ parent, target, vertical ]) {
        assert.equal(element.getEventDispatcher().toString(), '');
        element.dispatchEvent('recursive');
      }
      assert.equal(calls, 0);
      listener.release();
      parent.getEventDispatcher().detachAllEvents();
      assert.equal(notices.length, 6);
    },

  'recursive-detach-during-active-dispatch-defers-notifications':
    ({ document, rmlui }) => {
      const parent = document.getElementById('parent');
      const target = document.getElementById('target');
      const order = [];
      let active = false;
      const listener = new rmlui.EventListener(() => {
        active = true;
        order.push('active');
        parent.getEventDispatcher().detachAllEvents();
        assert.deepEqual(order, [ 'active' ]);
        assert.throws(() => listener.release(), /active/i);
        global.gc();
        order.push('returned');
        active = false;
      }, undefined, value => {
        assert.equal(active, false);
        order.push(`detach:${value.id}`);
      });
      target.getEventDispatcher().attachEvent('during', listener);
      target.addEventListener('during', () => order.push('victim'));
      parent.addEventListener('during', () => order.push('ancestor'));
      target.dispatchEvent('during');
      target.dispatchEvent('during');
      assert.deepEqual(order, [ 'active', 'returned', 'detach:target' ]);
      listener.release();
    },

  'detach-notification-errors-unwind-and-can-reregister':
    ({ document, rmlui }) => {
      const target = document.getElementById('target');
      const failure = new Error('dispatcher detach notification');
      const listener = new rmlui.EventListener(() => {}, undefined, () => {
        assert.equal(target.getEventDispatcher().toString(), '');
        throw failure;
      });
      target.getEventDispatcher().attachEvent('failure', listener);
      assert.throws(() => target.getEventDispatcher().detachAllEvents(),
        error => error === failure);
      assert.equal(target.getEventDispatcher().toString(), '');
      listener.release();
      let calls = 0;
      target.getEventDispatcher().attachEvent('again', () => calls++);
      target.dispatchEvent('again');
      assert.equal(calls, 1);
    },

  'explicit-native-default-action-phases':
    ({ document, rmlui }) => {
      const { EventDispatcher, EventId, DefaultActionPhase } = rmlui;
      const tabs = document.getElementById('tabs');
      const second = document.getElementById('second');
      const check = document.getElementById('check');
      for (const phase of [
        DefaultActionPhase.None, DefaultActionPhase.Target,
      ]) {
        assert.equal(EventDispatcher.dispatchEvent(
          second, EventId.Click, 'click', {}, true, true, phase), true);
        assert.equal(tabs.getActiveTab(), 0);
      }
      // Upstream default-action ancestors execute independently of bubbles.
      assert.equal(EventDispatcher.dispatchEvent(
        second, EventId.Click, 'click', {}, true, false,
        DefaultActionPhase.TargetAndBubble), true);
      assert.equal(tabs.getActiveTab(), 1);
      EventDispatcher.dispatchEvent(
        check, EventId.Click, 'click', {}, true, true,
        DefaultActionPhase.None);
      assert.equal(check.hasAttribute('checked'), false);
      EventDispatcher.dispatchEvent(
        check, EventId.Click, 'click', {}, true, true,
        DefaultActionPhase.Target);
      assert.equal(check.hasAttribute('checked'), true);
    },

  'explicit-name-id-parameters-and-propagation':
    ({ document, rmlui }) => {
      const { EventDispatcher, DefaultActionPhase, EventPhase } = rmlui;
      const parent = document.getElementById('parent');
      const target = document.getElementById('target');
      const id = rmlui.registerEventType('registered', true, true);
      const order = [];
      let saved;
      parent.addEventListener(id, event => order.push(event.phase), true);
      parent.addEventListener(id, event => order.push(event.phase));
      target.addEventListener(id, event => {
        saved = event;
        order.push(event.phase);
        assert.equal(event.id, id);
        assert.equal(event.type, 'explicit-alias');
        assert.equal(event.parameters.integer, 9007199254740993n);
        assert.strictEqual(event.parameters.reference, parent);
        event.stopPropagation();
      });
      assert.equal(EventDispatcher.dispatchEvent(
        target, id, 'explicit-alias',
        { integer: 9007199254740993n, reference: parent },
        true, true, DefaultActionPhase.None), false);
      assert.deepEqual(order, [ EventPhase.Capture, EventPhase.Target ]);
      assert.throws(() => saved.isPropagating, /expired|valid/i);
      order.length = 0;
      assert.equal(EventDispatcher.dispatchEvent(
        target, id, 'explicit-alias',
        { integer: 9007199254740993n, reference: parent },
        false, true, DefaultActionPhase.None), true);
      assert.deepEqual(order, [
        EventPhase.Capture, EventPhase.Target, EventPhase.Bubble,
      ]);
    },

  'static-dispatch-nested-registration-and-reference-guards':
    ({ document, rmlui }) => {
      const { EventDispatcher, DefaultActionPhase } = rmlui;
      const target = document.getElementById('target');
      const parent = document.getElementById('parent');
      const id = rmlui.registerEventType('nested', true, true);
      const names = [];
      target.addEventListener(id, event => {
        names.push(event.type);
        assert.throws(() => {
          document.innerRML = '';
        }, /active|subtree|callback/i);
        if (event.type === 'outer') {
          rmlui.registerEventType('grown-registry', false, false);
          assert.equal(EventDispatcher.dispatchEvent(
            target, id, 'inner', { reference: parent }, true, true,
            DefaultActionPhase.None), true);
        }
      });
      EventDispatcher.dispatchEvent(
        target, id, 'outer', { reference: parent }, true, true,
        DefaultActionPhase.None);
      assert.deepEqual(names, [ 'outer', 'inner' ]);
    },

  'invalid-inputs-and-getter-driven-receiver-destruction':
    ({ document, context, rmlui }) => {
      const { EventDispatcher, EventId, DefaultActionPhase } = rmlui;
      const target = document.getElementById('target');
      const dispatcher = target.getEventDispatcher();
      assert.throws(() => dispatcher.attachEvent('click', {}), /listener/i);
      for (const phase of [ 1, 3, 4, 7, 0.5, '2', NaN ]) {
        assert.throws(() => EventDispatcher.dispatchEvent(
          target, EventId.Click, 'click', {}, true, true, phase), /phase/i);
      }
      assert.throws(() => EventDispatcher.dispatchEvent(
        target, -1, 'click', {}, true, true, DefaultActionPhase.None), /id/i);
      assert.throws(() => EventDispatcher.dispatchEvent(
        target, EventId.Click, 'click', {}, 'true', true,
        DefaultActionPhase.None), /boolean/i);
      const native = require('../../build/Release/rmlui.node');
      assert.throws(() => native.dispatcherDispatchEvent(
        target.handle, EventId.Click, 'click', {
          get value() {
            document.close();
            context.update();
            return 1;
          },
        }, true, true, DefaultActionPhase.None), /no longer valid/i);
      assert.throws(() => dispatcher.toString(), /no longer valid/i);
      assert.throws(() => dispatcher.detachAllEvents(), /no longer valid/i);
    },

  'recursive-detach-releases-functions-and-captured-payloads':
    async ({ document }) => {
      const target = document.getElementById('target');
      const refs = [];
      (() => {
        for (let i = 0; i < 12; ++i) {
          const payload = new Uint8Array(1024);
          const callback = () => payload[i];
          refs.push(new WeakRef(callback), new WeakRef(payload));
          target.getEventDispatcher().attachEvent('release', callback);
        }
      })();
      document.getEventDispatcher().detachAllEvents();
      await collect();
      assert.equal(refs.filter(ref => ref.deref() !== undefined).length, 0);
    },

  'detached-component-retains-owner-and-generation-checks':
    async ({ document, context, rmlui, window }) => {
      let element = document.createElement('div');
      const dispatcher = element.getEventDispatcher();
      const weak = new WeakRef(element);
      element = null;
      await collect();
      assert.ok(weak.deref());
      dispatcher.attachEvent('detached', () => {});
      assert.equal(dispatcher.toString(), 'detached (1)');
      document.close();
      context.update();
      dispatcher.detachAllEvents();
      assert.equal(dispatcher.toString(), '');
      rmlui.shutdown();
      assert.throws(() => dispatcher.toString(), /initiali[sz]/i);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => dispatcher.toString(), /no longer valid/i);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 200)), 'Event dispatcher');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('dispatcher', 240, 200);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 240px; height: 200px; margin: 0; }
#parent { display: block; width: 100px; height: 100px; overflow: auto; }
#target { display: block; width: 300px; height: 400px; }
scrollbarvertical { width: 12px; }
scrollbarhorizontal { height: 9px; }
</style></head><body>
<div id="parent"><div id="target"/></div>
<input id="check" type="checkbox"/>
<tabset id="tabs"><tabs><tab/><tab id="second"/></tabs>
<panels><panel/><panel/></panels></tabset>
</body></rml>`);
    document.show();
    context.update();
    await cases[name]({ document, context, rmlui, window });
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
    const result = spawnSync(process.execPath, [
      '--expose-gc', __filename, name,
    ], { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} dispatcher regressions failed`);
}
