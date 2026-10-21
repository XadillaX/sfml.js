'use strict';

const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { test } = require('node:test');
const { setImmediate: nextTurn, setTimeout: delay } =
  require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  graphicsNative, graphicsContext, shapeState,
} = require('../dist/internal/graphics-state');
const { transformableState } = require('../dist/internal/transformable');
const { rectStorage, rectNative, vector2Native } =
  require('../dist/internal/value-storage');
const F = (x = 0, y = 0) => new sf.Vector2f(x, y);
const U = (x, y) => new sf.Vector2u(x, y);
const rect = (x, y, w, h) =>
  new sf.IntRect(new sf.Vector2i(x, y), new sf.Vector2i(w, h));
const box = value => [ ...value[rectStorage] ];
const xy = value => [ value.x, value.y ];
const handle = value => value[graphicsNative];
const read = target => native.readRenderTexturePixels(handle(target));
const texture = color => new sf.Texture(new sf.Image(U(2, 3), color));

class Polygon extends sf.Shape {
  constructor(points = []) {
    super();
    this.replace(points);
  }
  replace(points) {
    this.points = points.map(([ x, y ]) => F(x, y));
    this.update();
  }
  publish() { this.update(); }
  getPointCount() { return this.points.length; }
  getPoint(index) { return this.points[index]; }
}

function convex(points) {
  const shape = new sf.ConvexShape(points.length);
  points.forEach(([ x, y ], i) => shape.setPoint(i, F(x, y)));
  return shape;
}

function snapshot(shape, parent = sf.Transform.Identity) {
  const kind = shape instanceof sf.CircleShape ? 1
    : shape instanceof sf.RectangleShape ? 2
      : shape instanceof sf.ConvexShape ? 3 : 0;
  return {
    kind,
    dimensions: new Float32Array(kind === 1
      ? [ shape.getRadius(), shape.getPointCount() ]
      : kind === 2 ? xy(shape.getSize()) : []),
    points: new Float32Array(Array.from({ length: shape.getPointCount() },
      (_, i) => xy(shape.getPoint(i))).flat()),
    texture: shape.getTexture() ? handle(shape.getTexture()) : null,
    rect: new Int32Array(shape.getTextureRect()[rectStorage]),
    fill: shape.getFillColor().toInteger(),
    outline: shape.getOutlineColor().toInteger(),
    thickness: shape.getOutlineThickness(),
    miterLimit: shape.getMiterLimit(),
    transform: shape[transformableState].values.slice(),
    parent: new Float32Array(parent.getMatrix()),
  };
}

function near(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, i) => assert.ok(
    Math.abs(value - expected[i]) <= Math.max(1, Math.abs(expected[i])) * 3e-6,
    `${value} != ${expected[i]}`));
}

test('Shape defaults, geometry, centers and bounds match SFML', () => {
  const shapes = [
    new sf.CircleShape(), new sf.RectangleShape(), new sf.ConvexShape(),
    new Polygon(), new Polygon([[ 3, 5 ]]),
    new Polygon([[ 2, 4 ], [ 6, 8 ]]),
    new sf.CircleShape({ radius: -3, pointCount: 7 }),
    new sf.CircleShape({ radius: 5, pointCount: 0 }),
    new sf.CircleShape({ radius: 5, pointCount: 1 }),
    new sf.CircleShape({ radius: 5, pointCount: 2 }),
    new sf.RectangleShape(F(-8, 5)),
    convex([[ 0, 0 ], [ 20, 1 ], [ 0, 10 ]]),
    new Polygon([[ 0, 0 ], [ 0, 10 ], [ 20, 1 ]]),
  ];
  for (const shape of shapes) {
    assert.ok(shape instanceof sf.Shape);
    assert.ok(shape instanceof sf.Drawable);
    assert.equal(shape.getTexture(), null);
    assert.equal(shape.getFillColor().toInteger(), 0xffffffff);
    assert.equal(shape.getOutlineColor().toInteger(), 0xffffffff);
    assert.equal(shape.getOutlineThickness(), 0);
    assert.equal(shape.getMiterLimit(), 10);
    shape.setPosition(F(10.3, -7.1));
    shape.setOrigin(F(1.25, -0.5));
    shape.setScale(F(-2, 0.7));
    shape.setRotation(sf.degrees(37));
    for (const thickness of [ 0, 2, -1 ]) {
      shape.setOutlineThickness(thickness);
      for (const limit of [ 1, 2, 10 ]) {
        shape.setMiterLimit(limit);
        const expected = native.evaluateShape(snapshot(shape));
        near(box(shape.getLocalBounds()), expected.local);
        near(box(shape.getGlobalBounds()), expected.global);
        near(xy(shape.getGeometricCenter()), expected.center);
        const points = Array.from({ length: shape.getPointCount() },
          (_, i) => xy(shape.getPoint(i))).flat();
        near(points, expected.points);
      }
    }
  }
  assert.equal(shapes[0].getPointCount(), 30);
  assert.equal(shapes[1].getPointCount(), 4);
});

test('concrete shape copies own geometry and share only texture resources',
  () => {
    const tex = texture(sf.Color.Cyan);
    for (const original of [
      new sf.CircleShape({ radius: 6, pointCount: 8 }),
      new sf.RectangleShape(F(8, 4)),
      convex([[ 1, 1 ], [ 9, 1 ], [ 1, 7 ]]),
    ]) {
      original.setTexture(tex);
      original.setTextureRect(rect(2, 3, -2, 5));
      original.setFillColor(sf.Color.Red);
      original.setOutlineColor(sf.Color.Blue);
      original.setOutlineThickness(2);
      original.setMiterLimit(3);
      original.setPosition(F(8, 9));
      original.setRotation(sf.degrees(15));
      const copy = new original.constructor(original);
      assert.notEqual(handle(copy), handle(original));
      assert.notEqual(copy[shapeState].id, original[shapeState].id);
      assert.deepEqual(snapshot(copy), snapshot(original));
      original.setTexture(null);
      original.setFillColor(sf.Color.Green);
      original.setPosition(F());
      if (original instanceof sf.CircleShape) original.setRadius(30);
      else if (original instanceof sf.RectangleShape) original.setSize(F(2, 1));
      else original.setPoint(1, F(2, 1));
      assert.equal(copy.getTexture(), tex);
      assert.equal(copy.getFillColor().toInteger(), sf.Color.Red.toInteger());
      assert.deepEqual(xy(copy.getPosition()), [ 8, 9 ]);
      assert.notDeepEqual(snapshot(copy).points, snapshot(original).points);
      copy.getFillColor().r = 0;
      copy.getLocalBounds().size.x = 999;
      assert.equal(copy.getFillColor().r, 255);
      assert.notEqual(copy.getLocalBounds().size.x, 999);
    }
  });

test('Shape texture reset and readonly rectangle follow SFML semantics',
  () => {
    const shape = new sf.RectangleShape(F(4, 6));
    const a = texture(sf.Color.White);
    const b = new sf.Texture(U(5, 7));
    const live = shape.getTextureRect();
    const position = live.position;
    assert.deepEqual(box(live), [ 0, 0, 0, 0 ]);
    shape.setTexture(a);
    assert.deepEqual(box(live), [ 0, 0, 2, 3 ]);
    shape.setTexture(b);
    assert.deepEqual(box(live), [ 0, 0, 2, 3 ]);
    shape.setTexture(b, true);
    assert.deepEqual(box(live), [ 0, 0, 5, 7 ]);
    shape.setTexture(null, true);
    assert.deepEqual(box(live), [ 0, 0, 5, 7 ]);
    shape.setTextureRect(rect(1, 2, -3, 4));
    shape.setTexture(a);
    assert.deepEqual(box(live), [ 1, 2, -3, 4 ]);
    assert.equal(position.x, 1);
    assert.equal(shape.getTextureRect(), live);
    assert.equal(native.shapeAliases(handle(shape),
      shape[transformableState].handle, live[rectNative]), true);
    assert.ok(position[vector2Native]);
    shape.setTexture(null);
    shape.setTextureRect(new sf.IntRect());
    shape.setTexture(b);
    assert.deepEqual(box(live), [ 0, 0, 5, 7 ]);
  });

test('shape appearance, transforms and shear match immediate SFML pixels',
  () => {
    const shapes = [
      new sf.CircleShape({ radius: 5, pointCount: 9 }),
      new sf.RectangleShape(F(8, 6)),
      convex([[ 0, 0 ], [ 8, 1 ], [ 2, 8 ]]),
      new Polygon([[ 0, 0 ], [ 8, 1 ], [ 2, 8 ]]),
    ];
    const a = texture(sf.Color.White);
    const b = texture(sf.Color.Cyan);
    const targets = [ 0, 1 ].map(() => new sf.RenderTexture(U(64, 64)));
    const states = new sf.RenderStates({
      transform: new sf.Transform(1, 0.17, 4, -0.09, 1, 5, 0, 0, 1),
    });
    const shots = [];
    targets.forEach(target => target.clear());
    for (let i = 0; i < 16; i++) {
      const shape = shapes[i % 4];
      shape.setTexture(i % 3 === 0 ? null : i % 2 ? a : b);
      shape.setTextureRect(rect(1, 2, -2, 3));
      shape.setFillColor(new sf.Color(255, 90 + i * 8, 200, 150));
      shape.setOutlineColor(new sf.Color(80, 160, 250, 200));
      shape.setOutlineThickness(i % 2 ? 1 : -1);
      shape.setPosition(F((i % 4) * 12, Math.floor(i / 4) * 12));
      shape.setRotation(sf.degrees(i * 7));
      shape.setScale(F(0.9, 1.1));
      shots.push(snapshot(shape, states.transform));
      targets.forEach(target => target.draw(shape, states));
    }
    const expected = native.renderShapeOracle(shots);
    for (const shape of shapes) {
      shape.setTexture(a);
      shape.setPosition(F(60, 60));
      shape.setFillColor(sf.Color.Red);
    }
    for (const target of targets.reverse()) {
      target.display();
      assert.deepEqual(read(target), expected);
    }
    for (const shape of shapes) {
      const current = native.readShape(handle(shape));
      assert.equal(current.currentTexture, true);
      assert.equal(current.fill, sf.Color.Red.toInteger());
      near(current.global, box(shape.getGlobalBounds()));
    }
  });

test('geometry, outline and miter changes preserve both target queues',
  () => {
    const circle = new sf.CircleShape({ radius: 6, pointCount: 3 });
    const rectangle = new sf.RectangleShape(F(8, 6));
    const polygon = convex([[ 0, 0 ], [ 15, 1 ], [ 0, 5 ]]);
    const custom = new Polygon([[ 0, 0 ], [ 8, 0 ], [ 0, 8 ]]);
    const targets = [ 0, 1 ].map(() => new sf.RenderTexture(U(64, 64)));
    const shots = [];
    targets.forEach(target => target.clear());
    const record = (shape, x, y) => {
      shape.setPosition(F(x, y));
      shape.setFillColor(sf.Color.Green);
      shape.setOutlineColor(sf.Color.Red);
      shots.push(snapshot(shape));
      targets.forEach(target => target.draw(shape));
    };
    record(circle, 2, 2);
    circle.setRadius(3);
    circle.setPointCount(12);
    record(circle, 18, 2);
    record(rectangle, 2, 20);
    rectangle.setSize(F(12, 3));
    record(rectangle, 18, 20);
    record(polygon, 2, 35);
    polygon.setPoint(1, F(10, 2));
    polygon.setOutlineThickness(2);
    record(polygon, 22, 35);
    polygon.setMiterLimit(1);
    record(polygon, 42, 35);
    record(custom, 2, 50);
    custom.replace([[ 0, 0 ], [ 12, 0 ], [ 0, 4 ]]);
    record(custom, 22, 50);
    targets.forEach(target => {
      target.display();
      assert.deepEqual(read(target), native.renderShapeOracle(shots));
    });
  });

test('Shape property recording has no per-draw native calls', t => {
  const shape = new sf.RectangleShape(F(4, 4));
  const target = new sf.RenderTexture(U(32, 32));
  const area = rect(0, 0, 1, 1);
  const calls = [];
  for (const [ name, fn ] of Object.entries(native)) {
    if (typeof fn === 'function') {
      t.mock.method(native, name, (...args) => {
        calls.push(name);
        return fn(...args);
      });
    }
  }
  target.clear();
  for (let i = 0; i < 128; i++) {
    shape.setPosition(F(i % 16, i % 24));
    shape.setTextureRect(area);
    shape.setFillColor(sf.Color.Green);
    shape.setOutlineColor(sf.Color.Red);
    shape.getFillColor();
    shape.getOutlineColor();
    shape.getLocalBounds();
    shape.getGlobalBounds();
    shape.getTextureRect();
    target.draw(shape);
  }
  assert.deepEqual(calls, []);
  target.display();
  assert.deepEqual(calls, [ 'submitRenderTexture' ]);
});

test('geometry mutation flushes only targets using that shape', t => {
  const a = new sf.RectangleShape(F(2, 2));
  const b = new sf.RectangleShape(F(2, 2));
  const left = new sf.RenderTexture(U(4, 4));
  const right = new sf.RenderTexture(U(4, 4));
  left.draw(a);
  right.draw(b);
  const submit = t.mock.method(native, 'submitRenderTexture');
  a.setSize(F(3, 3));
  assert.equal(submit.mock.callCount(), 1);
  assert.equal(submit.mock.calls[0].arguments[0], handle(left));
  right.display();
  assert.equal(submit.mock.callCount(), 2);
});

test('custom update snapshots JS points without callbacks during submission',
  t => {
    const shape = new Polygon([[ 0, 0 ], [ 8, 0 ], [ 0, 8 ]]);
    const target = new sf.RenderTexture(U(64, 64));
    target.clear();
    target.draw(shape);
    const expected = native.renderShapeOracle([ snapshot(shape) ]);
    shape.points[1].x = 50;
    t.mock.method(shape, 'getPoint', () => assert.fail('JS point callback'));
    t.mock.method(shape, 'getPointCount',
      () => assert.fail('JS count callback'));
    target.display();
    assert.deepEqual(read(target), expected);
  });

test('Shape rejects invalid geometry before flushing pending commands', t => {
  const shape = convex([[ 0, 0 ], [ 8, 0 ], [ 0, 8 ]]);
  const custom = new Polygon([[ 0, 0 ], [ 8, 0 ], [ 0, 8 ]]);
  const target = new sf.RenderTexture(U(16, 16));
  target.draw(shape);
  target.draw(custom);
  const submit = t.mock.method(native, 'submitRenderTexture');
  for (const value of [ -1, 1.5, NaN, Infinity, 0xffffffff ]) {
    assert.throws(() => shape.setPointCount(value), RangeError);
    assert.throws(() => shape.getPoint(value), RangeError);
  }
  for (const value of [ NaN, Infinity, 1e100 ]) {
    assert.throws(() => shape.setOutlineThickness(value), RangeError);
    assert.throws(() => shape.setPoint(0, F(value, 0)), RangeError);
  }
  assert.throws(() => shape.setPoint(3, F()), RangeError);
  assert.throws(() => shape.setMiterLimit(0.9), RangeError);
  assert.throws(() => shape.setTexture({}), TypeError);
  assert.throws(() => shape.setTexture(null, 1), TypeError);
  assert.throws(() => shape.setTextureRect(new sf.FloatRect()), TypeError);
  assert.throws(() => shape.setFillColor({}), TypeError);
  assert.throws(() => shape.setOutlineColor({}), TypeError);
  assert.throws(() => new sf.RectangleShape(U(3, 4)), TypeError);
  assert.throws(() => new sf.CircleShape(5), TypeError);
  assert.throws(() => new sf.CircleShape(shape), TypeError);
  assert.throws(() => new sf.ConvexShape(new sf.RectangleShape()), RangeError);
  custom.points[0].x = Infinity;
  assert.throws(() => custom.publish(), RangeError);
  assert.equal(submit.mock.callCount(), 0);
  target.display();
});

test('Shape texture feedback rejects before reserving commands', t => {
  const target = new sf.RenderTexture(U(4, 4));
  const shape = new sf.RectangleShape(F(4, 4));
  shape.setTexture(target.getTexture());
  const submit = t.mock.method(native, 'submitRenderTexture');
  assert.throws(() => target.draw(shape), /own texture/);
  target.flush();
  assert.equal(submit.mock.callCount(), 0);
  shape.setTexture(null);
  target.draw(shape, { texture: target.getTexture() });
  target.display();
  assert.deepEqual([ ...read(target).subarray(0, 4) ], [ 255, 255, 255, 255 ]);
});

test('Shape draw overrides receive independent RenderStates', () => {
  class Shifted extends sf.RectangleShape {
    draw(target, states) {
      states.transform.translate(F(4, 0));
      super.draw(target, states);
    }
  }
  const shape = new Shifted(F(2, 2));
  const states = new sf.RenderStates();
  const target = new sf.RenderTexture(U(8, 2));
  target.clear();
  target.draw(shape, states);
  target.draw(shape, states);
  target.display();
  assert.equal(sf.equal(states.transform, sf.Transform.Identity), true);
  const image = target.getTexture().copyToImage();
  assert.equal(image.getPixel(U(4, 0)).toInteger(), 0xffffffff);
  assert.equal(image.getPixel(U(0, 0)).toInteger(), 0x000000ff);
});

test('Shape batching survives capacity rollover and texture changes', () => {
  const shape = new sf.RectangleShape(F(1, 1));
  const a = texture(sf.Color.Red);
  const b = texture(sf.Color.Blue);
  const target = new sf.RenderTexture(U(2, 1));
  target.clear();
  for (let i = 0; i < 4100; i++) {
    shape.setTexture(i % 2 ? b : a);
    shape.setPosition(F(i % 2, 0));
    target.draw(shape);
  }
  target.display();
  assert.deepEqual([ ...read(target) ],
    [ 255, 0, 0, 255, 0, 0, 255, 255 ]);
});

test('Shape queued resources survive GC and release after submission',
  async () => {
    let a = texture(sf.Color.Red);
    let shape = new sf.RectangleShape(F(2, 3));
    const b = texture(sf.Color.Blue);
    const references = [ new WeakRef(a), new WeakRef(shape) ];
    const target = new sf.RenderTexture(U(4, 3));
    shape.setTexture(a);
    target.clear();
    target.draw(shape);
    shape.setTexture(b);
    shape.setPosition(F(2, 0));
    target.draw(shape);
    a = null;
    shape = null;
    await nextTurn();
    global.gc();
    assert.equal(references.every(ref => !!ref.deref()), true);
    b.update(new sf.Image(U(2, 3), sf.Color.Green));
    target.display();
    const image = target.getTexture().copyToImage();
    assert.equal(image.getPixel(U(0, 0)).toInteger(), sf.Color.Red.toInteger());
    assert.equal(image.getPixel(U(2, 0)).toInteger(),
      sf.Color.Blue.toInteger());
    for (let i = 0; i < 30; i++) {
      await nextTurn();
      global.gc();
      if (references.every(ref => !ref.deref())) break;
    }
    assert.equal(references.every(ref => !ref.deref()), true);
  });

test('Shape rectangle views retain native storage after wrapper collection',
  async () => {
    let shape = new sf.CircleShape();
    shape.setTextureRect(rect(1, 2, 3, 4));
    const live = shape.getTextureRect();
    const size = live.size;
    assert.ok(live[rectNative]);
    assert.ok(size[vector2Native]);
    const weak = new WeakRef(shape);
    shape = null;
    for (let i = 0; i < 30; i++) {
      await nextTurn();
      global.gc();
      if (!weak.deref()) break;
    }
    assert.equal(weak.deref(), undefined);
    assert.deepEqual(box(live), [ 1, 2, 3, 4 ]);
    assert.deepEqual(xy(size), [ 3, 4 ]);
  });

test('Shape last owned by buffers defers destruction to its environment',
  async () => {
    const context = graphicsContext();
    let tex = native.createTexture(context, 2, 3, false);
    let shape = native.createShape(context, 2, 2, 3);
    native.setShapeTexture(shape.handle, tex.handle, tex.id);
    const id = tex.id;
    // Keep every backing store until all native handles have been collected.
    const metadata = [ ...shape.info.buffers, ...tex.info.buffers ];
    const pose = shape.buffer;
    const appearance = shape.appearance;
    const refs = [
      new WeakRef(shape.handle),
      new WeakRef(shape.transformable),
      new WeakRef(tex.handle),
    ];
    shape = null;
    tex = null;
    const gcDeadline = performance.now() + 1000;
    do {
      await delay(5);
      global.gc();
      if (refs.every(ref => !ref.deref())) break;
    } while (performance.now() < gcDeadline);
    assert.equal(refs.every(ref => !ref.deref()), true,
      'Native handles must collect before releasing backing stores');
    for (const buffer of metadata) {
      native.releaseBackingOffThread(buffer);
      assert.equal(buffer.byteLength, 0);
    }
    assert.equal(native.textureRegistered(context, id), true);
    native.releaseBackingOffThread(pose);
    // Appearance is now the last owner; dispatch needs an event-loop turn.
    native.releaseBackingOffThread(appearance);
    assert.equal(pose.byteLength, 0);
    assert.equal(appearance.byteLength, 0);
    assert.equal(native.textureRegistered(context, id), true);
    const deadline = performance.now() + 1000;
    while (native.textureRegistered(context, id) &&
        performance.now() < deadline) {
      await delay(5);
    }
    assert.equal(native.textureRegistered(context, id), false);
  });

test('Shape shader uniforms retain draw snapshots', async () => {
  const shape = new sf.RectangleShape(F(2, 2));
  const target = new sf.RenderTexture(U(4, 2));
  const shader = new sf.Shader();
  assert.equal(await shader.loadFromMemory(
    'uniform vec4 tint; void main(){gl_FragColor=gl_Color*tint;}',
    sf.ShaderType.Fragment), true);
  shader.setUniform('tint', new sf.Glsl.Vec4(sf.Color.Red));
  target.clear();
  target.draw(shape, shader);
  shader.setUniform('tint', new sf.Glsl.Vec4(sf.Color.Green));
  shape.setPosition(F(2, 0));
  target.draw(shape, shader);
  target.display();
  const image = target.getTexture().copyToImage();
  assert.equal(image.getPixel(U(0, 0)).toInteger(), sf.Color.Red.toInteger());
  assert.equal(image.getPixel(U(2, 0)).toInteger(), sf.Color.Green.toInteger());
});

test('RenderWindow draws shapes with geometry snapshots', t => {
  const window = new sf.RenderWindow(U(80, 60), 'Shape test');
  t.after(() => window.close());
  const shape = new sf.RectangleShape(F(8, 6));
  shape.setFillColor(sf.Color.Green);
  window.clear();
  window.draw(shape);
  shape.setSize(F(2, 2));
  shape.setFillColor(sf.Color.Red);
  shape.setPosition(F(12, 0));
  window.draw(shape);
  const capture = new sf.Texture(window.getSize());
  capture.update(window);
  const image = capture.copyToImage();
  assert.equal(image.getPixel(U(7, 5)).toInteger(), sf.Color.Green.toInteger());
  assert.equal(image.getPixel(U(12, 0)).toInteger(), sf.Color.Red.toInteger());
});
