'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate: nextTurn } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');
const { windowEvent } = require('../dist/window/event');
const V = sf.Vector2u;
const I = sf.Vector2i;

test('VideoMode copies, enumeration and six native comparisons', () => {
  const empty = new sf.VideoMode();
  assert.equal(empty.bitsPerPixel, 0);
  assert.equal(sf.equal(empty.size, new V()), true);
  assert.equal(empty.isValid(), false);
  const a = new sf.VideoMode(new V(800, 600));
  const b = new sf.VideoMode(a);
  b.size.x = 640;
  assert.equal(a.size.x, 800);
  assert.equal(a.bitsPerPixel, 32);
  const assigned = new V(640, 480);
  const oldSize = b.size;
  b.size = assigned;
  assigned.x = 100;
  assert.equal(b.size, oldSize);
  assert.equal(b.size.x, 640);
  const modes = [
    empty, a, b,
    new sf.VideoMode(new V(800, 601), 32),
    new sf.VideoMode(new V(1920, 1080), 24),
    new sf.VideoMode(new V(1, 1), 64),
  ];
  const operations = [
    sf.equal, sf.notEqual, sf.less, sf.greater, sf.lessEqual, sf.greaterEqual,
  ];
  for (const left of modes) {
    for (const right of modes) {
      assert.deepEqual(operations.map(op => op(left, right)),
        native.compareVideoModes(left.size.x, left.size.y, left.bitsPerPixel,
          right.size.x, right.size.y, right.bitsPerPixel));
    }
  }
  const desktop = sf.VideoMode.getDesktopMode();
  assert.ok(desktop.size.x > 0 && desktop.size.y > 0);
  const fullscreen = sf.VideoMode.getFullscreenModes();
  for (let i = 0; i < fullscreen.length; i++) {
    assert.equal(fullscreen[i].isValid(), true);
    if (i) {
      assert.equal(sf.greaterEqual(fullscreen[i - 1], fullscreen[i]), true);
    }
  }
  assert.throws(() => sf.equal(a, sf.Time.Zero), TypeError);
  assert.throws(() => new sf.VideoMode(new I(2, 2)), TypeError);
  assert.throws(() => new sf.VideoMode(new V(2, 2), -1), RangeError);
});

test('all 23 C++ event subtypes preserve their fields and vector types', () => {
  const raw = native.windowEventFixtures();
  const expected = [
    { kind: 'Closed' },
    { kind: 'Resized', size: new V(800, 600) },
    { kind: 'FocusLost' },
    { kind: 'FocusGained' },
    { kind: 'TextEntered', unicode: 0x1f642 },
    { kind: 'KeyPressed', code: sf.KeyboardKey.Unknown,
      scancode: sf.KeyboardScancode.A,
      alt: true, control: false, shift: true, system: false },
    { kind: 'KeyReleased', code: sf.KeyboardKey.Escape,
      scancode: sf.KeyboardScancode.Escape,
      alt: false, control: true, shift: false, system: true },
    { kind: 'MouseWheelScrolled', wheel: sf.MouseWheel.Horizontal,
      delta: -1.5, position: new I(-12, 34) },
    { kind: 'MouseButtonPressed', button: sf.MouseButton.Extra1,
      position: new I(-1, 2) },
    { kind: 'MouseButtonReleased', button: sf.MouseButton.Extra2,
      position: new I(3, -4) },
    { kind: 'MouseMoved', position: new I(-5, 6) },
    { kind: 'MouseMovedRaw', delta: new I(-7, 8) },
    { kind: 'MouseEntered' },
    { kind: 'MouseLeft' },
    { kind: 'JoystickButtonPressed', joystickId: 2, button: 17 },
    { kind: 'JoystickButtonReleased', joystickId: 3, button: 18 },
    { kind: 'JoystickMoved', joystickId: 4,
      axis: sf.JoystickAxis.PovY, position: -37.5 },
    { kind: 'JoystickConnected', joystickId: 5 },
    { kind: 'JoystickDisconnected', joystickId: 6 },
    { kind: 'TouchBegan', finger: 1, position: new I(-9, 10) },
    { kind: 'TouchMoved', finger: 2, position: new I(11, -12) },
    { kind: 'TouchEnded', finger: 3, position: new I(-13, 14) },
    { kind: 'SensorChanged', type: sf.SensorType.Gyroscope,
      value: new sf.Vector3f(1.25, -2.5, 3.75) },
  ];
  assert.equal(raw.length, 23);
  for (let i = 0; i < raw.length; i++) {
    const event = windowEvent(raw[i]);
    assert.ok(event instanceof sf.Event);
    assert.deepEqual(Object.keys(event.data).sort(),
      Object.keys(expected[i]).sort());
    for (const [ key, value ] of Object.entries(expected[i])) {
      if (value instanceof sf.Vector2 || value instanceof sf.Vector3) {
        assert.ok(event.data[key] instanceof value.constructor);
        assert.equal(sf.equal(event.data[key], value), true);
      } else assert.equal(event.data[key], value);
    }
    assert.equal(event.is(expected[i].kind), true);
    assert.equal(event.getIf(expected[i].kind), event.data);
    assert.equal(event.getIf('not-an-event'), undefined);
    assert.equal(event.visit(data => data.kind), expected[i].kind);
  }
  const event = new sf.Event(expected[1]);
  event.data.size.x = 50;
  assert.equal(expected[1].size.x, 800, 'Event constructor copies its payload');
});

test('handleEvents prefers subtype handlers, preserves FIFO and propagates',
  t => {
    const window = new sf.Window();
    let events = native.windowEventFixtures();
    t.mock.method(native, 'pollWindowEvent', () => events.shift());
    const seen = [];
    window.handleEvents({
      Resized: event => seen.push([ 'resize', event.size.x ]),
      SensorChanged: event => seen.push([ 'sensor', event.type ]),
    }, event => seen.push(event.kind));
    assert.equal(seen.length, 23);
    assert.equal(seen[0], 'Closed');
    assert.deepEqual(seen[1], [ 'resize', 800 ]);
    assert.deepEqual(seen[22], [ 'sensor', sf.SensorType.Gyroscope ]);
    events = native.windowEventFixtures().slice(0, 3);
    assert.throws(() => window.handleEvents(() => {
      throw new Error('handler failure');
    }), /handler failure/);
    assert.equal(events.length, 2);
    window.handleEvents(event => seen.push(event.kind));
    assert.equal(events.length, 0);
  });

test('closed windows allow events and controls, and reject invalid arguments',
  () => {
    const window = new sf.Window();
    assert.equal(window.getNativeHandle(), 0n);
    assert.equal(window.pollEvent(), undefined);
    assert.equal(window.waitEvent(), undefined);
    assert.equal(window.hasFocus(), false);
    window.setMinimumSize(undefined);
    window.setMaximumSize(undefined);
    window.setPosition(new I(0, 0));
    window.setTitle('标题🙂');
    window.setVisible(false);
    window.setMouseCursorVisible(true);
    window.setMouseCursorGrabbed(false);
    window.setKeyRepeatEnabled(false);
    window.setJoystickThreshold(0.5);
    window.setVerticalSyncEnabled(false);
    window.setFramerateLimit(0);
    window.requestFocus();
    window.display();
    assert.throws(() => window.setSize(new V()), RangeError);
    assert.throws(() => window.setMinimumSize(new I(1, 1)), TypeError);
    assert.throws(() => window.setPosition(new V()), TypeError);
    assert.throws(() => window.setVisible(1), TypeError);
    assert.throws(() => window.setFramerateLimit(-1), RangeError);
    assert.throws(() => window.setJoystickThreshold(101), RangeError);
    assert.throws(() => window.setTitle(1), TypeError);
    assert.throws(() => window.waitEvent(1), TypeError);
    assert.throws(() => window.setMouseCursor({}), TypeError);
    assert.throws(() => window.setIcon(new V(2, 2), Buffer.alloc(15)),
      RangeError);
    assert.throws(() => window.create(new V(64, 64), '', { style: 8 }),
      RangeError);
    assert.throws(() => window.create(new V(64, 64), '', { state: 2 }),
      RangeError);
    assert.throws(() => window.create(0n), RangeError);
    assert.throws(() => window.create(2n ** 64n), RangeError);
    assert.throws(() => window.createVulkanSurface(0n), RangeError);
  });

test('real window resize, settings, wait timeout and recreation', () => {
  const window = new sf.Window(new sf.VideoMode(new V(160, 120)), '窗口🙂', {
    style: sf.Style.Titlebar,
    state: sf.State.Windowed,
    settings: { depthBits: 24, stencilBits: 8 },
  });
  try {
    assert.equal(window.isOpen(), true);
    assert.ok(window.getNativeHandle() > 0n);
    const settings = window.getSettings();
    assert.ok(settings.depthBits >= 24);
    assert.ok(settings.stencilBits >= 8);
    assert.equal(Object.keys(settings).length, 7);
    const position = window.getPosition();
    window.setPosition(position);
    assert.equal(sf.equal(window.getPosition(), position), true);
    const size = window.getSize();
    window.setMinimumSize(new V(40, 40));
    window.setMaximumSize(new V(size.x + 200, size.y + 200));
    window.setSize(new V(size.x + 20, size.y + 20));
    let resized;
    window.handleEvents({
      Resized: data => { resized = data; },
    });
    assert.ok(resized);
    assert.equal(sf.equal(resized.size, window.getSize()), true);
    assert.ok(window.getSize().x > size.x);
    window.setMinimumSize(undefined);
    window.setMaximumSize(undefined);
    window.setIcon(new V(2, 2), Buffer.alloc(16, 255));
    window.setKeyRepeatEnabled(false);
    window.setJoystickThreshold(1);
    window.setMouseCursorVisible(false);
    window.setMouseCursorVisible(true);
    window.setMouseCursorGrabbed(false);
    window.setVisible(false);
    assert.equal(window.isOpen(), true);
    window.handleEvents(() => {});
    // Pending OS notifications may precede the eventual timeout.
    const deadline = performance.now() + 2000;
    let event;
    do {
      event = window.waitEvent(sf.milliseconds(5));
    } while (event && performance.now() < deadline);
    assert.equal(event, undefined);
    window.setVisible(true);
    window.setFramerateLimit(120);
    window.setVerticalSyncEnabled(false);
    assert.equal(window.setActive(), true);
    window.display();
    window.create(new V(96, 64), 'recreated');
    assert.equal(window.isOpen(), true);
    const embedded = new sf.Window(window.getNativeHandle());
    try {
      assert.equal(embedded.isOpen(), true);
      assert.equal(embedded.getNativeHandle(), window.getNativeHandle());
      assert.equal(sf.equal(embedded.getSize(), window.getSize()), true);
    } finally {
      embedded.close();
    }
    assert.equal(window.setActive(), true);
  } finally {
    window.close();
  }
  assert.equal(window.pollEvent(), undefined);
  assert.equal(window.waitEvent(), undefined);
  assert.equal(window.getNativeHandle(), 0n);
});

test('demo presents offscreen pixels without consuming the JS event queue',
  () => {
    const window = new sf.Window(new V(80, 60), 'Window presentation');
    try {
      const target = new sf.RenderTexture(new V(2, 2));
      const pixels = new sf.Image(new V(2, 2), sf.Color.Red);
      pixels.setPixel(new V(1, 0), sf.Color.Green);
      pixels.setPixel(new V(0, 1), sf.Color.Blue);
      pixels.setPixel(new V(1, 1), sf.Color.White);
      target.draw(new sf.Sprite(new sf.Texture(pixels)));
      target.display();
      window.handleEvents(() => {});
      const before = window.getSize();
      window.setSize(new V(before.x + 20, before.y + 20));
      native.drawWindowTexture(window[graphicsNative],
        target.getTexture()[graphicsNative]);
      const size = window.getSize();
      const copy = new sf.Texture(size);
      copy.update(window);
      const image = copy.copyToImage();
      for (const [ x, y, color ] of [
        [ 0, 0, sf.Color.Red ],
        [ size.x - 1, 0, sf.Color.Green ],
        [ 0, size.y - 1, sf.Color.Blue ],
        [ size.x - 1, size.y - 1, sf.Color.White ],
      ]) {
        assert.equal(image.getPixel(new V(x, y)).toInteger(),
          color.toInteger());
      }
      let resized = false;
      window.handleEvents({ Resized: () => { resized = true; } });
      assert.equal(resized, true);
    } finally {
      window.close();
    }
  });

test('native window retains its cursor after GC and releases it on close',
  async () => {
    const window = new sf.Window(new V(80, 60), 'Cursor lifetime');
    try {
      let cursor = sf.Cursor.createFromSystem(sf.Cursor.Type.Hand);
      assert.ok(cursor instanceof sf.Cursor);
      native.watchCursor(cursor[graphicsNative]);
      window.setMouseCursor(cursor);
      const weak = new WeakRef(cursor);
      cursor = null;
      await nextTurn();
      global.gc();
      assert.equal(weak.deref(), undefined);
      assert.equal(native.isWatchedCursorAlive(), true);
      window.setMouseCursorVisible(false);
      window.setMouseCursorVisible(true);
      window.close();
      assert.equal(native.isWatchedCursorAlive(), false);
      const bytes = Buffer.alloc(4 * 4 * 4, 255);
      const custom = new sf.Cursor(bytes, new V(4, 4), new V());
      assert.ok(custom instanceof sf.Cursor);
      assert.ok(sf.Cursor.createFromPixels(bytes, new V(4, 4), new V()));
      assert.throws(() => new sf.Cursor(99), RangeError);
      assert.throws(() => sf.Cursor.createFromPixels(
        bytes, new V(4, 4), new V(4, 0)), RangeError);
    } finally {
      window.close();
    }
  });
