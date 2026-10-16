'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const { execFileSync } = require('node:child_process');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  angleStorage, angleNative, colorStorage, colorNative,
  vector2Storage, vector2Native,
  vector3Storage, vector3Native, rectStorage, rectNative,
  vertexStorage, vertexNative,
} = require('../dist/internal/value-storage');

const roots = [
  [ 'Angle', () => sf.radians(0.25), angleStorage, angleNative, 'wrapAngle' ],
  [ 'Color', () => new sf.Color(0x12345678),
    colorStorage, colorNative, 'wrapColor' ],
  ...[ sf.Vector3i, sf.Vector3u, sf.Vector3f ].map(Constructor => [
    Constructor.name, () => new Constructor(1, 2, 3),
    vector3Storage, vector3Native, 'wrapVector3',
  ]),
  [ 'FloatRect', () => new sf.FloatRect(new sf.Vector2f(1, 2),
    new sf.Vector2f(3, 4)), rectStorage, rectNative, 'wrapRect' ],
  [ 'IntRect', () => new sf.IntRect(new sf.Vector2i(1, 2),
    new sf.Vector2i(3, 4)), rectStorage, rectNative, 'wrapRect' ],
  [ 'Vertex', () => new sf.Vertex(new sf.Vector2f(1, 2)),
    vertexStorage, vertexNative, 'wrapVertex' ],
];

for (const [ name, create, storage, key, method ] of roots) {
  test(`${name}: only native access wraps the existing BackingStore`, t => {
    const spy = t.mock.method(native, method, native[method]);
    const value = create();
    const old = value[storage];
    const bytes = [ ...new Uint8Array(old.buffer) ];
    assert.equal(spy.mock.callCount(), 0);
    const handle = value[key];
    const current = value[storage];
    assert.notEqual(old.buffer, current.buffer);
    assert.equal(native.sameBackingStore(old.buffer, current.buffer), true);
    assert.deepEqual([ ...new Uint8Array(current.buffer) ], bytes);
    assert.equal(value[key], handle);
    assert.equal(spy.mock.callCount(), 1);
    assert.equal(Object.getOwnPropertyDescriptor(value, key).value, handle);
    old[0] = 42;
    assert.equal(current[0], 42);
    current[0] = 7;
    assert.equal(old[0], 7);
  });
}

test('all value constructors, arithmetic and member views run without NAN',
  t => {
    for (const [ name, value ] of Object.entries(native)) {
      if (typeof value !== 'function') continue;
      t.mock.method(native, name, () => assert.fail(`Unexpected NAN: ${name}`));
    }
    const angle = sf.degrees(30);
    sf.addAssign(angle, sf.radians(0.25));
    angle.wrapSigned();
    sf.multiply(angle, 2);
    for (const Constructor of [ sf.Vector3i, sf.Vector3u, sf.Vector3f ]) {
      const value = new Constructor(3, 4, 5);
      sf.addAssign(value, value);
      sf.negate(value);
      value.cross(new Constructor(2, 3, 4));
    }
    new sf.Vector3f(1, 2, 3).normalized();
    sf.multiply(new sf.Color(10, 20, 30), sf.Color.White);
    for (const [ Rect, Vector ] of [
      [ sf.IntRect, sf.Vector2i ], [ sf.FloatRect, sf.Vector2f ],
    ]) {
      const rect = new Rect(new Vector(1, 2), new Vector(3, 4));
      sf.addAssign(rect.position, rect.size);
      rect.position = new Vector();
      rect.getCenter();
      rect.findIntersection(new Rect(rect));
    }
    const vertex = new sf.Vertex(new sf.Vector2f(1, 2), sf.Color.Red);
    vertex.color.g = 3;
    sf.addAssign(vertex.texCoords, vertex.position);
    const copy = new sf.Vertex(vertex);
    assert.equal(copy.color.g, 3);
    assert.equal(copy.texCoords.y, 2);
  });

test('frozen constants acquire native handles once and remain readonly', t => {
  const colors = t.mock.method(native, 'wrapColor', native.wrapColor);
  const angles = t.mock.method(native, 'wrapAngle', native.wrapAngle);
  for (const name of [
    'Black', 'White', 'Red', 'Green', 'Blue', 'Yellow',
    'Magenta', 'Cyan', 'Transparent',
  ]) {
    const value = sf.Color[name];
    const handle = value[colorNative];
    assert.equal(value[colorNative], handle);
    assert.equal(native.readColor(handle), value.toInteger());
    assert.throws(() => { value.a = 0; }, TypeError);
  }
  assert.equal(colors.mock.callCount(), 9);
  const handle = sf.Angle.Zero[angleNative];
  assert.equal(sf.Angle.Zero[angleNative], handle);
  assert.equal(native.readAngle(handle), 0);
  assert.equal(angles.mock.callCount(), 1);
  assert.throws(() => sf.addAssign(sf.Angle.Zero, sf.radians(1)), TypeError);
});

const members = [
  [ 'Rect.position', () => new sf.FloatRect(
    new sf.Vector2f(1, 2), new sf.Vector2f(3, 4)),
  'position', rectStorage, rectNative, vector2Storage, vector2Native,
  'wrapRect', 'rectMember', 0, 8 ],
  [ 'Rect.size', () => new sf.IntRect(
    new sf.Vector2i(1, 2), new sf.Vector2i(3, 4)),
  'size', rectStorage, rectNative, vector2Storage, vector2Native,
  'wrapRect', 'rectMember', 8, 8 ],
  ...[
    [ 'position', vector2Storage, vector2Native, 0, 8 ],
    [ 'color', colorStorage, colorNative, 8, 4 ],
    [ 'texCoords', vector2Storage, vector2Native, 12, 8 ],
  ].map(([ field, storage, key, offset, length ]) => [
    `Vertex.${field}`, () => new sf.Vertex(new sf.Vector2f(1, 2)),
    field, vertexStorage, vertexNative, storage, key,
    'wrapVertex', 'vertexMember', offset, length,
  ]),
];

async function collect(reference) {
  for (let i = 0; i < 30; i++) {
    await setImmediate();
    global.gc();
    if (reference.deref() === undefined) return;
  }
  assert.fail('Parent JS wrapper should be collectible');
}

for (const [
  name, create, field, rootStorage, rootKey, storage, key,
  wrap, memberMethod, offset, length,
] of members) {
  test(`${name}: member-first access wraps its parent exactly once`, t => {
    const order = [];
    for (const method of [ wrap, memberMethod ]) {
      const original = native[method];
      t.mock.method(native, method, (...args) => {
        order.push(method);
        return original(...args);
      });
    }
    const parent = create();
    const child = parent[field];
    const old = child[storage];
    assert.equal(parent[field], child);
    assert.equal(old.buffer, parent[rootStorage].buffer);
    assert.equal(old.byteOffset, offset);
    assert.equal(old.byteLength, length);
    assert.deepEqual(order, []);
    const handle = child[key];
    assert.deepEqual(order, [ wrap, memberMethod ]);
    assert.ok(parent[rootKey]);
    assert.equal(child[key], handle);
    assert.equal(parent[field], child);
    assert.deepEqual(order, [ wrap, memberMethod ]);
    old[0] = 9;
    assert.equal(child[storage][0], 9);
    child[storage][1] = 7;
    assert.equal(old[1], 7);
  });

  test(`${name}: a cold member can wrap after its parent JS wrapper is gone`,
    async () => {
      let parent = create();
      const child = parent[field];
      const before = [ ...child[storage] ];
      const reference = new WeakRef(parent);
      parent = null;
      await collect(reference);
      assert.deepEqual([ ...child[storage] ], before);
      const handle = child[key];
      assert.ok(handle);
      assert.deepEqual([ ...child[storage] ], before);
      child[storage][0] = 42;
      if (key === colorNative) {
        assert.equal(native.readColor(handle), child.toInteger());
      } else {
        assert.deepEqual(native.readVector2(handle), [ child.x, child.y ]);
      }
    });
}

test('importing the package does not construct native value constants', () => {
  execFileSync(process.execPath, [ '-e', `
    const native = require('./build/Release/sfml.node');
    for (const [key, fn] of Object.entries(native)) {
      if (typeof fn === 'function') {
        native[key] = () => { throw new Error('Unexpected call: ' + key); };
      }
    }
    const sf = require('.');
    new sf.Angle(); new sf.Color(); new sf.Vector2f(); new sf.Vector3f();
    new sf.FloatRect().position; new sf.Vertex().color;
    if (sf.Color.White.toInteger() !== 0xffffffff) process.exit(1);
  ` ], { cwd: require('node:path').resolve(__dirname, '..') });
});
