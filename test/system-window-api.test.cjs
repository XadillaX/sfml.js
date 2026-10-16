'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate: nextTurn } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

async function collect() {
  for (let i = 0; i < 8; i++) { await nextTurn(); global.gc(); }
}

test('Version is a cached native-backed value matching sf::version()', t => {
  const value = sf.version();
  assert.deepEqual({ ...value }, native.inspectVersion());
  assert.ok(Object.isFrozen(value));
  for (const key of [ 'major', 'minor', 'patch', 'isRelease', 'string' ]) {
    assert.throws(() => { value[key] = 0; }, TypeError);
  }
  t.mock.method(native, 'getVersion', () => assert.fail('Must be cached'));
  assert.equal(sf.version(), value);
});

test('Clipboard uses SFML and validates text without replacing the clipboard',
  t => {
    assert.equal(typeof sf.Clipboard.getString(), 'string');
    const set = t.mock.method(native, 'setClipboardString', () => {});
    for (const text of [ '', '中文🙂\ntext', 'a\0b' ]) {
      sf.Clipboard.setString(text);
    }
    assert.deepEqual(set.mock.calls.map(call => call.arguments),
      [[ '' ], [ '中文🙂\ntext' ], [ 'a\0b' ]]);
    for (const invalid of [ null, undefined, 1, {}]) {
      assert.throws(() => sf.Clipboard.setString(invalid), TypeError);
    }
    assert.equal(set.mock.callCount(), 3);
  });

test('Context activation, identity, settings and GL function lookup', () => {
  const first = new sf.Context();
  assert.equal(sf.Context.getActiveContext(), first);
  const firstId = sf.Context.getActiveContextId();
  assert.ok(firstId > 0n);
  const second = new sf.Context({}, new sf.Vector2u(32, 24));
  assert.equal(sf.Context.getActiveContext(), second);
  assert.notEqual(sf.Context.getActiveContextId(), firstId);
  const settings = second.getSettings();
  assert.ok(Object.isFrozen(settings));
  assert.equal(second.getSettings(), settings);
  assert.deepEqual(Object.keys(settings).sort(), [
    'antiAliasingLevel', 'attributeFlags', 'depthBits', 'majorVersion',
    'minorVersion', 'sRgbCapable', 'stencilBits',
  ]);
  assert.ok(settings.majorVersion >= 1);
  assert.throws(() => { settings.majorVersion = 0; }, TypeError);
  assert.equal(typeof sf.Context.getFunction('glGetString'), 'bigint');
  assert.equal(sf.Context.isExtensionAvailable('GL_SFMLJS_missing'), false);
  assert.equal(first.setActive(true), true);
  assert.equal(sf.Context.getActiveContext(), first);
  assert.equal(sf.Context.getActiveContextId(), firstId);
  assert.equal(first.setActive(false), true);
  assert.equal(sf.Context.getActiveContext(), undefined);
  assert.equal(sf.Context.getActiveContextId(), 0n);
});

test('Context validates before activation', () => {
  const context = new sf.Context();
  const id = sf.Context.getActiveContextId();
  for (const make of [
    () => new sf.Context({}),
    () => new sf.Context({}, new sf.Vector2f()),
    () => new sf.Context(null, new sf.Vector2u()),
    () => context.setActive(1),
    () => sf.Context.getFunction(1),
  ]) assert.throws(make, TypeError);
  assert.throws(() => new sf.Context({ depthBits: -1 },
    new sf.Vector2u(1, 1)), RangeError);
  assert.throws(() => native.setContextActive({}, true), TypeError);
  assert.equal(sf.Context.getActiveContextId(), id);
  context.setActive(false);
});

test('Context settings retain native ownership after the wrapper is collected',
  async () => {
    let context = new sf.Context();
    const id = sf.Context.getActiveContextId();
    let settings = context.getSettings();
    const expected = { ...settings };
    const weak = new WeakRef(context);
    context = null;
    await collect();
    assert.equal(weak.deref(), undefined);
    assert.equal(sf.Context.getActiveContextId(), id);
    assert.deepEqual({ ...settings }, expected);
    let restored = sf.Context.getActiveContext();
    assert.ok(restored instanceof sf.Context);
    assert.deepEqual({ ...restored.getSettings() }, expected);
    assert.equal(sf.Context.getActiveContext(), restored);
    restored = null;
    settings = null;
    await collect();
    assert.equal(sf.Context.getActiveContext(), undefined);
    assert.equal(sf.Context.getActiveContextId(), 0n);
  });

test('Window settings remain valid after closing and recreating the window',
  () => {
    const window = new sf.Window(new sf.Vector2u(40, 30), 'Context settings');
    try {
      const settings = window.getSettings();
      const expected = { ...settings };
      window.close();
      window.create(new sf.Vector2u(48, 32), 'Context settings');
      assert.deepEqual({ ...settings }, expected);
      assert.ok(Object.isFrozen(window.getSettings()));
      // Window contexts need not have a corresponding sf::Context object.
      assert.equal(typeof sf.Context.getActiveContextId(), 'bigint');
    } finally { window.close(); }
  });

test('Touch forwards both coordinate overloads and returns independent values',
  t => {
    const window = new sf.Window();
    const get = t.mock.method(native, 'getTouchPosition', () => [ -8, 12 ]);
    const down = t.mock.method(native, 'isTouchDown', finger => finger === 2);
    assert.equal(sf.Touch.isDown(2), true);
    const a = sf.Touch.getPosition(2);
    const b = sf.Touch.getPosition(2, window);
    assert.ok(a instanceof sf.Vector2i);
    a.x = 99;
    assert.equal(b.x, -8);
    assert.deepEqual(get.mock.calls.map(call => call.arguments),
      [[ 2, undefined ], [ 2, window[graphicsNative] ]]);
    for (const index of [ -1, 0.5, NaN, Infinity, 0x100000000 ]) {
      assert.throws(() => sf.Touch.isDown(index), RangeError);
      assert.throws(() => sf.Touch.getPosition(index), RangeError);
    }
    assert.throws(() => sf.Touch.getPosition(0, {}), TypeError);
    assert.equal(down.mock.callCount(), 1);
    assert.equal(get.mock.callCount(), 2);
  });

test('Touch queries SFML on the current platform', () => {
  assert.equal(typeof sf.Touch.isDown(0), 'boolean');
  assert.ok(sf.Touch.getPosition(0) instanceof sf.Vector2i);
  assert.ok(sf.Touch.getPosition(0, new sf.Window()) instanceof sf.Vector2i);
});
