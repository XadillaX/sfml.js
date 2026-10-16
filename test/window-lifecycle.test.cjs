'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate: nextTurn } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');
const V = sf.Vector2u;
const F = sf.Vector2f;

for (const Base of [ sf.Window, sf.RenderWindow ]) {
  test(`${Base.name} constructors never enter derived private fields`, () => {
    const calls = [];
    class Child extends Base {
      #ready = true;
      create(...args) {
        assert.equal(this.#ready, true);
        calls.push('create override');
        super.create(...args);
      }
      onCreate() {
        assert.equal(this.#ready, true);
        calls.push('onCreate');
        super.onCreate();
      }
      onResize() {
        assert.equal(this.#ready, true);
        calls.push('onResize');
        super.onResize();
      }
    }
    const window = new Child(new V(80, 60), 'Constructor hooks');
    try {
      assert.equal(window.isOpen(), true);
      assert.deepEqual(calls, []);
      if (window instanceof sf.RenderWindow) {
        assert.equal(sf.equal(window.getView().getSize(), new F(80, 60)),
          true);
      }
      const embedded = new Child(window.getNativeHandle());
      embedded.close();
      assert.deepEqual(calls, []);
      window.create(new V(96, 64), 'Explicit hooks');
      assert.deepEqual(calls, [ 'create override', 'onCreate' ]);
    } finally {
      window.close();
    }
  });

  test(`${Base.name} explicit create dispatches both overloads and reopen`,
    () => {
      class Child extends Base {
        #calls = [];
        constructor() {
          super();
          this.create(new V(80, 60), 'Ready fields');
        }
        onCreate() {
          super.onCreate();
          assert.equal(this.isOpen(), true);
          this.#calls.push('create');
        }
        get calls() { return this.#calls; }
      }
      const window = new Child();
      const embedded = new Child();
      try {
        assert.deepEqual(window.calls, [ 'create' ]);
        window.create(new V(96, 64), 'Recreated');
        assert.deepEqual(window.calls, [ 'create', 'create' ]);
        embedded.create(window.getNativeHandle());
        assert.deepEqual(embedded.calls, [ 'create', 'create' ]);
        embedded.close();
        window.close();
        window.create(new V(80, 60), 'Reopened');
        assert.deepEqual(window.calls, [ 'create', 'create', 'create' ]);
      } finally {
        embedded.close();
        window.close();
      }
    });

  test(`${Base.name} real resize hooks preserve poll, wait and handler events`,
    () => {
      class Child extends Base {
        calls = [];
        onResize() {
          super.onResize();
          this.calls.push('resize');
        }
      }
      const window = new Child(new V(80, 60), 'Resize hooks');
      try {
        window.handleEvents(() => {});
        for (const method of [ 'pollEvent', 'waitEvent', 'handleEvents' ]) {
          const size = window.getSize();
          window.calls.length = 0;
          window.setSize(new V(size.x + 20, size.y + 20));
          assert.deepEqual(window.calls, [ 'resize' ]);
          let resized = false;
          const visit = data => {
            if (data.kind === 'Resized') {
              resized = true;
              assert.ok(window.calls.length >= 2,
                'SFML event filtering must dispatch its resize notification');
              assert.equal(sf.equal(data.size, window.getSize()), true);
            }
          };
          const deadline = performance.now() + 2000;
          do {
            if (method === 'handleEvents') window.handleEvents(visit);
            else {
              const event = method === 'waitEvent' ?
                window.waitEvent(sf.milliseconds(5)) : window.pollEvent();
              if (event) visit(event.data);
            }
          } while (!resized && performance.now() < deadline);
          assert.equal(resized, true, method);
          window.handleEvents(() => {});
        }
      } finally {
        window.close();
      }
    });

  test(`${Base.name} hook exceptions propagate once and permit later creates`,
    () => {
      const failure = new Error('create hook failed');
      class Child extends Base {
        calls = 0;
        onCreate() {
          super.onCreate();
          this.calls++;
          if (this.calls === 1) throw failure;
        }
      }
      const window = new Child();
      try {
        assert.throws(() => window.create(new V(80, 60), 'Throwing hook'),
          error => error === failure);
        window.pollEvent();
        assert.equal(window.calls, 1);
        window.create(new V(96, 64), 'Recovered');
        assert.equal(window.calls, 2);
      } finally {
        window.close();
      }
    });

  test(`${Base.name} size constraints dispatch exactly the native notices`,
    t => {
      class Child extends Base {
        calls = [];
        onResize() {
          super.onResize();
          this.calls.push('resize');
        }
      }
      const window = new Child(new V(80, 60), 'Constraint notices');
      t.after(() => window.close());
      window.handleEvents(() => {});
      const expected = [];
      const take = native.takeWindowNotification;
      t.mock.method(native, 'takeWindowNotification', handle => {
        const notice = take(handle);
        if (notice !== undefined) expected.push(notice);
        return notice;
      });
      for (const [ method, size ] of [
        [ 'setMinimumSize', new V(100, 80) ],
        [ 'setMinimumSize', undefined ],
        [ 'setMaximumSize', new V(70, 50) ],
        [ 'setMaximumSize', undefined ],
        [ 'setSize', new V(90, 70) ],
        [ 'setSize', new V(90, 70) ],
      ]) {
        expected.length = 0;
        window.calls.length = 0;
        window[method](size);
        assert.deepEqual(window.calls, expected, method);
      }
    });

  test(`${Base.name} closing from resize discards queued native notices`,
    () => {
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
        }
      }
      const window = new Child(new V(80, 60), 'Queued notices');
      try {
        // Native-only calls leave two real SFML resize notices pending.
        native.windowCommand(window[graphicsNative], 'size', 90, 70);
        native.windowCommand(window[graphicsNative], 'size', 100, 80);
        window.setMinimumSize(undefined);
        assert.deepEqual(window.calls, [ 'resize' ]);
        assert.equal(window.isOpen(), false);
        window.create(new V(80, 60), 'New generation');
        assert.deepEqual(window.calls, [ 'resize', 'create' ]);
      } finally {
        window.close();
      }
    });

  test(`${Base.name} resize failures consume only the dispatched notice`,
    () => {
      const failure = new Error('resize hook failed');
      class Child extends Base {
        calls = 0;
        onResize() {
          super.onResize();
          this.calls++;
          if (this.calls === 1) throw failure;
        }
      }
      const window = new Child(new V(80, 60), 'Resize failure');
      try {
        native.windowCommand(window[graphicsNative], 'size', 90, 70);
        native.windowCommand(window[graphicsNative], 'size', 100, 80);
        assert.throws(() => window.setMinimumSize(undefined),
          error => error === failure);
        assert.equal(window.calls, 1);
        window.setMinimumSize(undefined);
        assert.equal(window.calls, 2);
        window.setMinimumSize(undefined);
        assert.equal(window.calls, 2);
      } finally {
        window.close();
      }
    });

  test(`${Base.name} close and recreate inside a hook are synchronous`, () => {
    class Child extends Base {
      calls = [];
      onCreate() {
        super.onCreate();
        this.calls.push(this.getSize().x);
        if (this.calls.length === 1) {
          this.close();
          this.create(new V(96, 64), 'Nested create');
          assert.deepEqual(this.calls, [ 80, 96 ]);
        }
      }
    }
    const window = new Child();
    try {
      window.create(new V(80, 60), 'Outer create');
      assert.deepEqual(window.calls, [ 80, 96 ]);
      assert.equal(window.getSize().x, 96);
    } finally {
      window.close();
    }
  });

  test(`${Base.name} hook registration does not retain its JS wrapper`,
    { skip: !global.gc }, async () => {
      class Child extends Base {
        onCreate() { super.onCreate(); }
      }
      let window = new Child(new V(80, 60), 'Collect hooks');
      const weak = new WeakRef(window);
      window.close();
      window = null;
      for (let i = 0; i < 20; i++) {
        await nextTurn();
        global.gc();
        if (!weak.deref()) break;
      }
      assert.equal(weak.deref(), undefined);
    });
}

test('RenderWindow initializes views before hooks without overwriting setView',
  () => {
    const custom = new sf.View(new F(7, 9), new F(40, 30));
    class Child extends sf.RenderWindow {
      calls = 0;
      onCreate() {
        this.calls++;
        const size = this.getSize();
        assert.equal(sf.equal(this.getDefaultView().getSize(),
          new F(size.x, size.y)), true);
        assert.equal(sf.equal(this.getView().getSize(),
          new F(size.x, size.y)), true);
        this.setView(custom);
        super.onCreate();
        assert.equal(sf.equal(this.getView().getSize(), custom.getSize()),
          true, 'super.onCreate must not reset the initialized views');
      }
    }
    const window = new Child();
    try {
      for (const width of [ 80, 96 ]) {
        window.create(new V(width, 60), 'View hook');
        assert.equal(sf.equal(window.getView().getCenter(), new F(7, 9)),
          true);
        window.clear(sf.Color.Green);
        const texture = new sf.Texture(window.getSize());
        texture.update(window);
        assert.equal(texture.copyToImage().getPixel(new V()).toInteger(),
          sf.Color.Green.toInteger());
      }
      assert.equal(window.calls, 2);
    } finally {
      window.close();
    }
  });
