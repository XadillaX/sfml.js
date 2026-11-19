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
  'real-inline-rml-replacement-removal-and-null':
    ({ rmlui, context }) => {
      const values = [];
      const notifications = [];
      const events = [];
      const instancer = new rmlui.EventListenerInstancer((value, element) => {
        values.push([ value, element.tagName ]);
        return new rmlui.EventListener(event => {
          events.push([ value, event.target.id, event.phase ]);
        }, snapshot => notifications.push([ 'attach', snapshot.tagName ]),
        snapshot => notifications.push([
          'detach', snapshot.tagName,
        ]));
      });
      rmlui.Factory.registerEventListenerInstancer(instancer);
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body>' +
        '<button id="inline" onclick="save(&quot;x&quot;)"/>' +
        '</body></rml>');
      const button = document.getElementById('inline');
      assert.deepEqual(values, [[ 'save("x")', 'button' ]]);
      assert.deepEqual(notifications, [[ 'attach', 'button' ]]);
      button.click();
      button.setAttribute('onclick', 'replace');
      button.click();
      button.removeAttribute('onclick');
      button.click();
      assert.deepEqual(events.map(value => value[0]),
        [ 'save("x")', 'replace' ]);
      assert.deepEqual(notifications.map(value => value[0]),
        [ 'attach', 'detach', 'attach', 'detach' ]);
      assert.equal(rmlui.Factory.instanceEventListener('direct', button)
        instanceof rmlui.EventListener, true);
      assert.equal(instancer.instanceEventListener('direct-own', button)
        instanceof rmlui.EventListener, true);
      rmlui.Factory.registerEventListenerInstancer(
        new rmlui.EventListenerInstancer(() => null));
      assert.equal(rmlui.Factory.instanceEventListener('none', button), null);
      rmlui.Factory.registerEventListenerInstancer(null);
      assert.equal(rmlui.Factory.instanceEventListener('none', button), null);
    },

  'multiple-attachments-deduplication-capture-and-function-identity':
    ({ rmlui, document }) => {
      document.innerRML = '<div id="parent"><button id="target"/></div>';
      const parent = document.getElementById('parent');
      const target = document.getElementById('target');
      const attaches = [];
      const detaches = [];
      const phases = [];
      const listener = new rmlui.EventListener(event =>
        phases.push([ event.currentTarget.id, event.phase ]),
      snapshot => attaches.push(snapshot.id),
      snapshot => detaches.push(snapshot.id));
      parent.addEventListener('multi', listener, true);
      parent.addEventListener('multi', listener, true);
      parent.addEventListener('multi', listener);
      target.addEventListener('multi', listener);
      target.addEventListener('other', listener);
      assert.deepEqual(attaches, [ 'parent', 'parent', 'target', 'target' ]);
      assert.throws(() => listener.release(), /attach/i);
      target.dispatchEvent('multi');
      assert.deepEqual(phases, [
        [ 'parent', rmlui.EventPhase.Capture ],
        [ 'target', rmlui.EventPhase.Target ],
        [ 'parent', rmlui.EventPhase.Bubble ],
      ]);
      parent.removeEventListener('multi', listener, true);
      parent.removeEventListener('multi', listener, true);
      parent.removeEventListener('multi', listener);
      target.removeEventListener('multi', listener);
      target.removeEventListener('other', listener);
      assert.deepEqual(detaches, [ 'parent', 'parent', 'target', 'target' ]);
      let calls = 0;
      const callback = () => ++calls;
      target.addEventListener('fn', callback);
      target.addEventListener('fn', callback);
      target.dispatchEvent('fn');
      target.removeEventListener('fn', callback);
      target.dispatchEvent('fn');
      assert.equal(calls, 1);
      listener.release();
      assert.throws(() => target.addEventListener('multi', listener), /valid/i);
    },

  'manual-hooks-owned-event-and-active-release-transfer-guards':
    ({ rmlui, document }) => {
      const target = document.getElementById('target');
      const allocator = new rmlui.EventInstancer();
      const id = rmlui.registerEventType('manual', true, true);
      const event = allocator.instanceEvent(target, id, 'manual', {}, true);
      const transfer = new rmlui.EventInstancer(() => event);
      const notices = [];
      let borrowed;
      const listener = new rmlui.EventListener(value => {
        borrowed = value;
        assert.equal(value.target, target);
        assert.throws(() => event.release(), /active/i);
        assert.throws(() => allocator.releaseEvent(event), /active/i);
        assert.throws(() => listener.release(), /active/i);
        assert.throws(() => listener.processEvent(event), /active/i);
        value.stopPropagation();
        assert.equal(transfer.instanceEvent(
          target, id, 'manual', {}, true), null);
      }, value => notices.push([ 'attach', value.id ]),
      value => notices.push([ 'detach', value.id ]));
      listener.onAttach(target);
      listener.onDetach(target);
      assert.deepEqual(notices,
        [[ 'attach', 'target' ], [ 'detach', 'target' ]]);
      assert.throws(() => listener.processEvent(event), /active/i);
      assert.equal(event.isPropagating, false);
      assert.throws(() => borrowed.isPropagating, /expired|valid/i);
      event.release();
      listener.release();
    },

  'detach-during-dispatch-and-default-action':
    ({ rmlui, document }) => {
      const target = document.getElementById('target');
      let victimCalls = 0;
      const victim = new rmlui.EventListener(() => ++victimCalls);
      target.addEventListener('remove', () => {
        target.removeEventListener('remove', victim);
        victim.release();
      });
      target.addEventListener('remove', victim);
      target.dispatchEvent('remove');
      assert.equal(victimCalls, 0);
      document.innerRML = '<input id="check" type="checkbox"/>';
      const check = document.getElementById('check');
      const cancel = new rmlui.EventListener(event => event.stopPropagation());
      check.addEventListener('click', cancel);
      check.click();
      assert.equal(check.hasAttribute('checked'), false);
      check.removeEventListener('click', cancel);
      check.click();
      assert.equal(check.hasAttribute('checked'), true);
    },

  'errors-wrong-handles-and-shutdown-generation':
    ({ rmlui, window, document }) => {
      const target = document.getElementById('target');
      assert.throws(() => new rmlui.EventListener(null), /callback/i);
      assert.throws(() => rmlui.Factory.registerEventListenerInstancer({}),
        /instancer/i);
      assert.throws(() => new rmlui.EventListenerInstancer(() => ({}))
        .instanceEventListener('wrong', target), /listener/i);
      const error = new Error('inline allocator error');
      rmlui.Factory.registerEventListenerInstancer(
        new rmlui.EventListenerInstancer(() => {
          throw error;
        }));
      assert.throws(() => target.setAttribute('onclick', 'bad'),
        value => value === error);
      rmlui.Factory.registerEventListenerInstancer(null);
      const listener = new rmlui.EventListener(() => {
        throw error;
      });
      target.addEventListener('error', listener);
      assert.throws(() => target.dispatchEvent('error'),
        value => value === error);
      const hook = new rmlui.EventListener(() => {}, () => {
        throw error;
      });
      assert.throws(() => target.addEventListener('hook', hook),
        value => value === error);
      const instancer = new rmlui.EventListenerInstancer(() => listener);
      rmlui.shutdown();
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const fresh = rmlui.createContext('fresh', 160, 120).createDocument();
      assert.throws(() => fresh.addEventListener('old', listener), /valid/i);
      assert.throws(() => instancer.instanceEventListener('old', fresh),
        /valid/i);
    },

  'native-roots-detached-cycles-and-registration-replacement':
    async ({ rmlui, document }) => {
      const target = document.getElementById('target');
      let calls = 0;
      let rootedCallback;
      (() => {
        const callback = () => ++calls;
        rootedCallback = new WeakRef(callback);
        target.addEventListener('rooted', new rmlui.EventListener(callback));
      })();
      await collect();
      assert.ok(rootedCallback.deref());
      target.dispatchEvent('rooted');
      assert.equal(calls, 1);
      document.innerRML = '';
      await collect();
      assert.equal(rootedCallback.deref(), undefined);
      let weakElement;
      let weakCallback;
      (() => {
        const element = document.createElement('div');
        const callback = () => element.id;
        weakElement = new WeakRef(element);
        weakCallback = new WeakRef(callback);
        element.addEventListener('cycle', new rmlui.EventListener(callback));
      })();
      await collect();
      assert.equal(weakElement.deref(), undefined);
      assert.equal(weakCallback.deref(), undefined);
      let weakAllocator;
      (() => {
        const callback = () => null;
        weakAllocator = new WeakRef(callback);
        rmlui.Factory.registerEventListenerInstancer(
          new rmlui.EventListenerInstancer(callback));
      })();
      await collect();
      assert.ok(weakAllocator.deref());
      rmlui.Factory.registerEventListenerInstancer(null);
      await collect();
      assert.equal(weakAllocator.deref(), undefined);
    },

  'shutdown-clears-retained-facade-callbacks-and-detach-errors':
    async ({ rmlui, document }) => {
      const target = document.getElementById('target');
      const error = new Error('detach hook error');
      const listener = new rmlui.EventListener(() => {}, undefined, () => {
        throw error;
      });
      target.addEventListener('detach-error', listener);
      assert.throws(() => target.removeEventListener('detach-error', listener),
        value => value === error);
      listener.release();
      let retainedListener;
      let retainedInstancer;
      let weakProcess;
      let weakCreate;
      (() => {
        const process = () => {};
        const create = () => null;
        weakProcess = new WeakRef(process);
        weakCreate = new WeakRef(create);
        retainedListener = new rmlui.EventListener(process);
        retainedInstancer = new rmlui.EventListenerInstancer(create);
      })();
      rmlui.shutdown();
      await collect();
      assert.equal(weakProcess.deref(), undefined);
      assert.equal(weakCreate.deref(), undefined);
      assert.ok(retainedListener);
      assert.ok(retainedInstancer);
    },

  'moving-final-detached-listener-clears-the-live-former-root':
    async ({ rmlui, document }) => {
      const root = document.createElement('div');
      let callbackWeak;
      (() => {
        const child = document.createElement('button');
        const callback = () => root.id;
        callbackWeak = new WeakRef(callback);
        child.addEventListener('click', new rmlui.EventListener(callback));
        root.appendChild(child);
      })();
      await collect();
      assert.ok(callbackWeak.deref());
      (() => {
        const removed = root.removeChild(root.getChild(0));
        assert.equal(removed.tagName, 'button');
      })();
      await collect();
      assert.equal(root.getNumChildren(), 0, 'former root stays reachable');
      assert.equal(callbackWeak.deref(), undefined,
        'former root must release its last callback edge');
    },

  'mixed-listener-roots-promote-on-attachment-and-release-independently':
    async ({ rmlui, document }) => {
      const refs = [];
      let calls = 0;
      const root = document.createElement('div');
      (() => {
        const child = document.createElement('button');
        const typed = () => {
          ++calls;
          assert.equal(child.tagName, 'button');
        };
        const plain = () => {
          ++calls;
          assert.equal(child.tagName, 'button');
        };
        refs.push(new WeakRef(typed), new WeakRef(plain));
        child.addEventListener('mixed', new rmlui.EventListener(typed));
        child.addEventListener('mixed', plain);
        root.appendChild(child);
      })();
      await collect();
      assert.ok(refs.every(ref => ref.deref()));
      document.appendChild(root);
      await collect();
      root.getChild(0).dispatchEvent('mixed');
      assert.equal(calls, 2);
      document.innerRML = '';
      await collect();
      assert.ok(refs.every(ref => ref.deref() === undefined));
    },

  'typed-listener-owned-context-cycle-remains-collectable':
    async ({ rmlui, context }) => {
      const allocator = new rmlui.ContextInstancer();
      let child;
      let contextWeak;
      let callbackWeak;
      (() => {
        const owned = allocator.instanceContext('typed-owned',
          context.getRenderManager(), null);
        contextWeak = new WeakRef(owned);
        const document = owned.createDocument();
        document.innerRML = '<button/>';
        child = document.getChild(0);
        const callback = () => assert.equal(owned.name, 'typed-owned');
        callbackWeak = new WeakRef(callback);
        child.addEventListener('owned', new rmlui.EventListener(callback));
      })();
      await collect();
      assert.ok(contextWeak.deref());
      child.dispatchEvent('owned');
      child = null;
      await collect();
      assert.equal(contextWeak.deref(), undefined);
      assert.equal(callbackWeak.deref(), undefined);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Listener instancers');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('listeners', 160, 120);
    const document = context.createDocument();
    document.innerRML = '<button id="target"/>';
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
  assert.equal(failures, 0, `${failures} listener instancer failures`);
}
