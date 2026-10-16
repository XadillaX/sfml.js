'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');
const V = sf.Vector2u;
const F = sf.Vector2f;

// Model only the notification boundary; windows and views remain real.
// This suite checks JS dispatch, not whether SFML emitted a notification.
function notifications(t) {
  const queues = new WeakMap();
  const descriptor = Object.getOwnPropertyDescriptor(native,
    'takeWindowNotification');
  Object.defineProperty(native, 'takeWindowNotification', {
    configurable: true,
    value: handle => queues.get(handle)?.shift(),
  });
  t.after(() => {
    if (descriptor) {
      Object.defineProperty(native, 'takeWindowNotification', descriptor);
    } else delete native.takeWindowNotification;
  });
  for (const name of [ 'openWindow', 'openWindowHandle', 'closeWindow' ]) {
    const original = native[name];
    t.mock.method(native, name, (handle, ...args) => {
      queues.set(handle, []);
      const result = original(handle, ...args);
      if (name !== 'closeWindow') queues.get(handle).push('create');
      return result;
    });
  }
  return (window, ...kinds) => {
    const handle = window[graphicsNative];
    if (!queues.has(handle)) queues.set(handle, []);
    queues.get(handle).push(...kinds);
  };
}

for (const Base of [ sf.Window, sf.RenderWindow ]) {
  test(`${Base.name} JS dispatch suppresses constructor overrides`, t => {
    notifications(t);
    const calls = [];
    class Child extends Base {
      #ready = true;
      create(...args) {
        assert.equal(this.#ready, true);
        calls.push('create');
        super.create(...args);
      }
      onCreate() {
        super.onCreate();
        assert.equal(this.#ready, true);
        calls.push('hook');
      }
    }
    const window = new Child(new V(80, 60), 'JS construction');
    t.after(() => window.close());
    assert.deepEqual(calls, []);
    window.create(new V(96, 64), 'JS explicit');
    assert.deepEqual(calls, [ 'create', 'hook' ]);
    window.onCreate = () => calls.push('replacement');
    window.create(new V(80, 60), 'JS dynamic override');
    assert.deepEqual(calls, [ 'create', 'hook', 'create', 'replacement' ]);
  });

  test(`${Base.name} JS dispatch follows notifications, not size requests`,
    t => {
      const emit = notifications(t);
      class Child extends Base {
        calls = [];
        onResize() {
          super.onResize();
          this.calls.push('resize');
        }
      }
      const window = new Child(new V(80, 60), 'JS sizes');
      t.after(() => window.close());
      for (const [ method, argument ] of [
        [ 'setSize', new V(90, 70) ],
        [ 'setMinimumSize', new V(40, 30) ],
        [ 'setMaximumSize', new V(120, 100) ],
        [ 'setMinimumSize', undefined ],
        [ 'setMaximumSize', undefined ],
      ]) {
        window.calls.length = 0;
        window[method](argument);
        assert.deepEqual(window.calls, [], 'no synthetic resize callback');
        emit(window, 'resize', 'resize');
        window[method](argument);
        assert.deepEqual(window.calls, [ 'resize', 'resize' ]);
      }
    });

  test(`${Base.name} JS event boundaries retain events and consume failures`,
    t => {
      const emit = notifications(t);
      const failure = new Error('resize failed');
      class Child extends Base {
        calls = [];
        fail = false;
        onResize() {
          super.onResize();
          this.calls.push('hook');
          if (this.fail) throw failure;
        }
      }
      const window = new Child();
      for (const [ method, binding ] of [
        [ 'pollEvent', 'pollWindowEvent' ],
        [ 'waitEvent', 'waitWindowEvent' ],
      ]) {
        t.mock.method(native, binding, () => {
          emit(window, 'resize');
          return { kind: 'Resized', size: [ 96, 64 ] };
        });
        window.calls.length = 0;
        const event = window[method]();
        assert.deepEqual(window.calls, [ 'hook' ]);
        assert.equal(event.kind, 'Resized');
        assert.equal(event.data.size.x, 96);
        window.fail = true;
        assert.throws(() => window[method](), error => error === failure);
        window.fail = false;
        window.setMinimumSize(undefined);
        assert.deepEqual(window.calls, [ 'hook', 'hook' ],
          'already consumed notifications cannot replay after an exception');
      }
      let remaining = 1;
      t.mock.method(native, 'pollWindowEvent', () => {
        if (!remaining--) return undefined;
        emit(window, 'resize');
        return { kind: 'Resized', size: [ 96, 64 ] };
      });
      window.calls.length = 0;
      window.handleEvents({ Resized: () => window.calls.push('event') });
      assert.deepEqual(window.calls, [ 'hook', 'event' ]);
    });

  test(`${Base.name} JS reentry discards old-generation pending hooks`, t => {
    const emit = notifications(t);
    class Child extends Base {
      calls = [];
      onCreate() {
        super.onCreate();
        this.calls.push('create');
      }
      onResize() {
        super.onResize();
        this.calls.push('resize');
        this.close();
        this.create(new V(96, 64), 'Nested generation');
        assert.deepEqual(this.calls, [ 'resize', 'create' ]);
      }
    }
    const window = new Child(new V(80, 60), 'Initial generation');
    t.after(() => window.close());
    emit(window, 'resize', 'resize');
    window.setMinimumSize(undefined);
    assert.deepEqual(window.calls, [ 'resize', 'create' ]);
    assert.equal(window.getSize().x, 96);
  });
}

test('RenderWindow JS view initialization precedes hooks and nested creation',
  t => {
    notifications(t);
    class Child extends sf.RenderWindow {
      calls = 0;
      onCreate() {
        super.onCreate();
        this.calls++;
        assert.equal(sf.equal(this.getView().getSize(),
          new F(this.getSize().x, this.getSize().y)), true);
        this.setView(new sf.View(new F(7, 9), new F(40, 30)));
        if (this.calls === 1) {
          this.create(new V(96, 64), 'Nested view');
        }
      }
    }
    const window = new Child(new V(80, 60), 'Base views');
    t.after(() => window.close());
    assert.equal(sf.equal(window.getDefaultView().getSize(), new F(80, 60)),
      true);
    assert.equal(window.calls, 0);
    window.create(new V(80, 60), 'View hooks');
    assert.equal(window.calls, 2);
    assert.equal(sf.equal(window.getDefaultView().getSize(), new F(96, 64)),
      true);
    assert.equal(sf.equal(window.getView().getSize(), new F(40, 30)), true);
  });
