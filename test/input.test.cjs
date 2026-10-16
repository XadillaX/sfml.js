'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');
const { Keyboard: K, Mouse: M, Joystick: J, Sensor: S } = sf;

test('input namespaces expose generated enums and counts', () => {
  assert.equal(K.Key, sf.KeyboardKey);
  assert.equal(K.Scan, sf.KeyboardScancode);
  assert.equal(K.Scancode, sf.KeyboardScancode);
  assert.equal(K.KeyCount, sf.KeyboardKeyCount);
  assert.equal(K.ScancodeCount, sf.KeyboardScancodeCount);
  assert.equal(M.Button, sf.MouseButton);
  assert.equal(M.Wheel, sf.MouseWheel);
  assert.equal(M.ButtonCount, sf.MouseButtonCount);
  assert.equal(J.Axis, sf.JoystickAxis);
  assert.equal(J.Count, sf.JoystickCount);
  assert.equal(J.ButtonCount, sf.JoystickButtonCount);
  assert.equal(J.AxisCount, sf.JoystickAxisCount);
  assert.equal(S.Type, sf.SensorType);
  assert.equal(S.Count, sf.SensorCount);
});

test('Keyboard queries native keys, scancodes and layout descriptions', () => {
  assert.equal(K.isKeyPressed(K.Key.Unknown), false);
  assert.equal(K.isKeyPressed(K.Scancode.Unknown, 'scancode'), false);
  assert.equal(K.localize(K.Scancode.Unknown), K.Key.Unknown);
  assert.equal(K.delocalize(K.Key.Unknown), K.Scancode.Unknown);
  for (let scan = 0; scan < K.ScancodeCount; scan++) {
    const key = K.localize(scan);
    assert.ok(Number.isInteger(key) && key >= -1 && key < K.KeyCount);
    assert.equal(typeof K.getDescription(scan), 'string');
    assert.equal(typeof K.isKeyPressed(scan, 'scancode'), 'boolean');
  }
  for (let key = 0; key < K.KeyCount; key++) {
    const scan = K.delocalize(key);
    assert.ok(Number.isInteger(scan) && scan >= -1 && scan < K.ScancodeCount);
    assert.equal(typeof K.isKeyPressed(key), 'boolean');
  }
  K.setVirtualKeyboardVisible(false);
});

test('Keyboard explicitly distinguishes overlapping key and scancode values',
  t => {
    const probe = t.mock.method(native, 'isKeyPressed', (code, scan) => scan);
    assert.equal(K.Key.A, K.Scancode.A);
    assert.equal(K.isKeyPressed(K.Key.A), false);
    assert.equal(K.isKeyPressed(K.Scancode.A, 'scancode'), true);
    assert.deepEqual(probe.mock.calls.map(call => call.arguments),
      [[ K.Key.A, false ], [ K.Scancode.A, true ]]);
    assert.throws(() => K.isKeyPressed(K.Key.A, 'unknown'), TypeError);
    assert.equal(probe.mock.callCount(), 2);
  });

test('Mouse keeps global and window coordinates distinct and returns copies',
  t => {
    const window = new sf.Window();
    const position = [ -10, 20 ];
    const get = t.mock.method(native, 'getMousePosition', () => position);
    const set = t.mock.method(native, 'setMousePosition', () => {});
    const a = M.getPosition();
    const b = M.getPosition(window);
    assert.ok(a instanceof sf.Vector2i);
    assert.ok(b instanceof sf.Vector2i);
    assert.equal(sf.equal(a, b), true);
    a.x = 90;
    assert.equal(b.x, -10);
    assert.deepEqual(position, [ -10, 20 ]);
    M.setPosition(b);
    M.setPosition(b, window);
    assert.deepEqual(get.mock.calls.map(call => call.arguments),
      [[ undefined ], [ window[graphicsNative] ]]);
    assert.deepEqual(set.mock.calls.map(call => call.arguments),
      [[ -10, 20, undefined ], [ -10, 20, window[graphicsNative] ]]);
  });

test('Mouse queries real button state and both native coordinate overloads',
  () => {
    for (let button = 0; button < M.ButtonCount; button++) {
      assert.equal(typeof M.isButtonPressed(button), 'boolean');
    }
    const original = M.getPosition();
    const window = new sf.Window(new sf.Vector2u(80, 60), 'Input API');
    try {
      const relative = M.getPosition(window);
      assert.ok(relative instanceof sf.Vector2i);
      assert.ok(Number.isInteger(relative.x) && Number.isInteger(relative.y));
      M.setPosition(relative, window);
      M.setPosition(original);
      window.close();
      assert.ok(M.getPosition(window) instanceof sf.Vector2i);
      M.setPosition(new sf.Vector2i(), window);
    } finally {
      M.setPosition(original);
      window.close();
    }
  });

test('Joystick queries every slot, axis and button and copies identification',
  () => {
    J.update();
    for (let id = 0; id < J.Count; id++) {
      const connected = J.isConnected(id);
      assert.equal(typeof connected, 'boolean');
      const count = J.getButtonCount(id);
      assert.ok(Number.isInteger(count) &&
        count >= 0 && count <= J.ButtonCount);
      const identification = J.getIdentification(id);
      assert.deepEqual(Object.keys(identification).sort(),
        [ 'name', 'productId', 'vendorId' ]);
      assert.equal(typeof identification.name, 'string');
      assert.ok(Number.isInteger(identification.vendorId));
      assert.ok(Number.isInteger(identification.productId));
      const copy = J.getIdentification(id);
      identification.name = 'changed';
      assert.notEqual(copy.name, 'changed');
      if (!connected) {
        assert.equal(count, 0);
        assert.deepEqual(copy,
          { name: 'No Joystick', vendorId: 0, productId: 0 });
      }
      for (let axis = 0; axis < J.AxisCount; axis++) {
        const supported = J.hasAxis(id, axis);
        const position = J.getAxisPosition(id, axis);
        assert.equal(typeof supported, 'boolean');
        assert.ok(Number.isFinite(position));
        if (!connected) {
          assert.equal(supported, false);
          assert.equal(position, 0);
        }
      }
      for (let button = 0; button < J.ButtonCount; button++) {
        const pressed = J.isButtonPressed(id, button);
        assert.equal(typeof pressed, 'boolean');
        if (!connected) assert.equal(pressed, false);
      }
    }
  });

test('Sensor exposes native availability, enable control and readings', () => {
  for (let type = 0; type < S.Count; type++) {
    const available = S.isAvailable(type);
    assert.equal(typeof available, 'boolean');
    try {
      S.setEnabled(type, true);
      const value = S.getValue(type);
      assert.ok(value instanceof sf.Vector3f);
      assert.ok([ value.x, value.y, value.z ].every(Number.isFinite));
    } finally {
      S.setEnabled(type, false);
    }
  }
});

test('Sensor returns independent Vector3f values and forwards enable state',
  t => {
    const values = [ 1.25, -2.5, 3.75 ];
    const get = t.mock.method(native, 'getSensorValue', () => values);
    const set = t.mock.method(native, 'setSensorEnabled', () => {});
    const a = S.getValue(S.Type.Gyroscope);
    const b = S.getValue(S.Type.Gyroscope);
    assert.deepEqual([ a.x, a.y, a.z ], values);
    a.x = 10;
    assert.equal(b.x, 1.25);
    S.setEnabled(S.Type.Gyroscope, true);
    S.setEnabled(S.Type.Gyroscope, false);
    assert.deepEqual(get.mock.calls[0].arguments, [ S.Type.Gyroscope ]);
    assert.deepEqual(set.mock.calls.map(call => call.arguments),
      [[ S.Type.Gyroscope, true ], [ S.Type.Gyroscope, false ]]);
  });

test('input bindings reject invalid indices, booleans and window handles',
  () => {
    const checks = [
      [ K.KeyCount, key => K.isKeyPressed(key), -2 ],
      [ K.KeyCount, key => K.delocalize(key), -2 ],
      [ K.ScancodeCount, scan => K.isKeyPressed(scan, 'scancode'), -2 ],
      [ K.ScancodeCount, scan => K.localize(scan), -2 ],
      [ K.ScancodeCount, scan => K.getDescription(scan), -2 ],
      [ M.ButtonCount, button => M.isButtonPressed(button), -1 ],
      [ J.Count, id => J.isConnected(id), -1 ],
      [ J.Count, id => J.getButtonCount(id), -1 ],
      [ J.Count, id => J.hasAxis(id, J.Axis.X), -1 ],
      [ J.Count, id => J.isButtonPressed(id, 0), -1 ],
      [ J.Count, id => J.getAxisPosition(id, J.Axis.X), -1 ],
      [ J.Count, id => J.getIdentification(id), -1 ],
      [ J.AxisCount, axis => J.hasAxis(0, axis), -1 ],
      [ J.AxisCount, axis => J.getAxisPosition(0, axis), -1 ],
      [ J.ButtonCount, button => J.isButtonPressed(0, button), -1 ],
      [ S.Count, type => S.isAvailable(type), -1 ],
      [ S.Count, type => S.setEnabled(type, true), -1 ],
      [ S.Count, type => S.getValue(type), -1 ],
    ];
    for (const [ count, invoke, minimum ] of checks) {
      const invalid = [ minimum, count, 0.5, NaN, Infinity, '0', undefined ];
      for (const value of invalid) {
        assert.throws(() => invoke(value), RangeError);
      }
    }
    assert.throws(() => K.setVirtualKeyboardVisible(1), TypeError);
    assert.throws(() => S.setEnabled(S.Type.Gravity, 1), TypeError);
    assert.throws(() => native.isKeyPressed(0, 1), TypeError);
    assert.throws(() => M.getPosition({}), TypeError);
    assert.throws(() => M.getPosition(null), TypeError);
    assert.throws(() => M.setPosition(new sf.Vector2u()), TypeError);
    assert.throws(() => M.setPosition({ x: 0, y: 0 }), TypeError);
    assert.throws(() => M.setPosition(new sf.Vector2i(), {}), TypeError);
    assert.throws(() => native.getMousePosition({}), TypeError);
    assert.throws(() => native.setMousePosition(0, 0, {}), TypeError);
    assert.throws(() => native.setMousePosition(0.5, 0), TypeError);
  });
