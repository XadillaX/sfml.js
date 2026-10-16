'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  graphicsNative, graphicsContext, textureId,
} = require('../dist/internal/graphics-state');

const background = new sf.Color(24, 40, 72, 180);
const F = sf.BlendFactor;
const E = sf.BlendEquation;
const C = sf.StencilComparison;
const U = sf.StencilUpdateOperation;
const point = (x, y) => new sf.Vector2f(x, y);
const pixels = target =>
  native.readRenderTexturePixels(target[graphicsNative]);
const pixel = (bytes, x, y = 0, width = 64) =>
  [ ...bytes.subarray((y * width + x) * 4, (y * width + x) * 4 + 4) ];

function texture(rgba = [ 200, 80, 120, 160 ]) {
  const value = new sf.Texture(new sf.Vector2u(1, 1));
  value.update(new Uint8Array(rgba));
  return value;
}

class Group extends sf.Drawable {
  constructor(...children) {
    super();
    this.children = children;
    this.pose = new sf.Transformable();
  }

  draw(target, states) {
    states.transform.combine(this.pose.getTransform());
    for (const child of this.children) target.draw(child, states);
  }
}

function nested(target, image) {
  const sprite = new sf.Sprite(image);
  sprite.setPosition(point(3.25, 2.5));
  sprite.setScale(point(8, 6));
  sprite.setOrigin(point(0.25, 0.75));
  sprite.setRotation(sf.degrees(37));
  const inner = new Group(sprite);
  inner.pose.setPosition(point(10, 12));
  inner.pose.setRotation(sf.degrees(23));
  inner.pose.setScale(point(0.9, 1.25));
  const outer = new Group(inner, sprite);
  outer.pose.setPosition(point(6, 5));
  outer.pose.setScale(point(1.7, 0.8));
  const states = new sf.RenderStates(
    new sf.Transform().translate(point(2, 3)));
  target.draw(outer, states);
  outer.pose.move(point(21, 8));
  target.draw(outer, states);
  sprite.setPosition(point(200, 200));
  states.transform.translate(point(200, 200));
}

function blends(target, image) {
  const modes = [
    sf.BlendAlpha, sf.BlendAdd, sf.BlendMultiply, sf.BlendMin,
    sf.BlendMax, sf.BlendNone,
    new sf.BlendMode(F.One, F.One, E.Subtract,
      F.DstAlpha, F.OneMinusDstAlpha, E.ReverseSubtract),
    new sf.BlendMode(F.OneMinusDstColor, F.SrcColor, E.ReverseSubtract,
      F.OneMinusSrcColor, F.DstColor, E.Add),
  ];
  const sprite = new sf.Sprite(image);
  sprite.setScale(point(8, 32));
  for (let i = 0; i < modes.length; i++) {
    sprite.setPosition(point(i * 8, 0));
    target.draw(sprite, modes[i]);
    sprite.setPosition(point(i * 8, 32));
    target.draw(sprite);
    target.draw(sprite, modes[i]);
  }
}

function stencils(target, image) {
  const sprite = new sf.Sprite(image);
  sprite.setScale(point(8, 8));
  for (let comparison = 0; comparison < 8; comparison++) {
    for (let operation = 0; operation < 6; operation++) {
      target.clearStencil(2);
      sprite.setPosition(point(operation * 8, comparison * 8));
      target.draw(sprite, new sf.StencilMode({
        stencilComparison: C.Always, stencilUpdateOperation: operation,
        stencilReference: 5, stencilMask: 0xff, stencilOnly: true,
      }));
      target.draw(sprite, new sf.StencilMode({
        stencilComparison: comparison, stencilUpdateOperation: U.Keep,
        stencilReference: 2, stencilMask: 0xff,
      }));
    }
  }
  target.clearStencil(0x12);
  sprite.setPosition(point(48, 0));
  target.draw(sprite, new sf.StencilMode({
    stencilComparison: C.Equal, stencilReference: 0x02, stencilMask: 0x0f,
  }));
}

for (const [ scenario, render ] of [ nested, blends, stencils ].entries()) {
  test(`${render.name} pixels match immediate SFML Drawable draws`, () => {
    const image = texture();
    const target = new sf.RenderTexture(
      new sf.Vector2u(64, 64), { stencilBits: 8 });
    target.clear(background, 0);
    render(target, image);
    target.display();
    const actual = pixels(target);
    const expected = native.renderDrawableOracle(image[graphicsNative],
      scenario);
    assert.deepEqual(actual, expected);
    assert.ok(actual.some((value, index) =>
      value !== [ 24, 40, 72, 180 ][index % 4]), 'Scene must draw pixels');
    if (scenario === 2) {
      assert.deepEqual(pixel(actual, 0), [ 24, 40, 72, 180 ]);
      assert.notDeepEqual(pixel(actual, 0, 56), [ 24, 40, 72, 180 ]);
    }
  });
}

test('callbacks run synchronously with independent value states', () => {
  const target = new sf.RenderTexture(new sf.Vector2u(1, 1));
  const image = texture();
  const original = new sf.RenderStates({ texture: image });
  const seen = [];
  class Leaf extends sf.Drawable {
    draw(receivedTarget, states) {
      assert.equal(receivedTarget, target);
      seen.push(states);
      assert.equal(states.texture, image);
      assert.deepEqual(states.transform.getMatrix(),
        sf.Transform.Identity.getMatrix());
      assert.equal(states.blendMode.colorSrcFactor, F.SrcAlpha);
      assert.equal(states.stencilMode.stencilReference.value, 0);
      states.transform.translate(point(100, 100));
      states.blendMode.colorSrcFactor = F.Zero;
      states.stencilMode.stencilReference.value = 99;
    }
  }
  const leaf = new Leaf();
  target.draw(new Group(leaf, new Group(leaf)), original);
  assert.equal(seen.length, 2);
  assert.notEqual(seen[0], seen[1]);
  assert.equal(original.blendMode.colorSrcFactor, F.SrcAlpha);
  assert.equal(original.stencilMode.stencilReference.value, 0);
  assert.deepEqual(original.transform.getMatrix(),
    sf.Transform.Identity.getMatrix());
});

test('states copy values, keep textures, and protect defaults', () => {
  const image = texture();
  const transform = new sf.Transform().translate(point(3, 4));
  const blend = new sf.BlendMode(sf.BlendAdd);
  const stencil = new sf.StencilMode({ stencilReference: 2 });
  const source = new sf.RenderStates({
    transform, blendMode: blend, stencilMode: stencil, texture: image,
    coordinateType: sf.CoordinateType.Normalized,
  });
  const copy = new sf.RenderStates(source);
  source.transform.translate(point(4, 5));
  source.blendMode.colorSrcFactor = F.Zero;
  source.stencilMode.stencilReference.value = 8;
  assert.equal(copy.texture, image);
  assert.equal(copy.coordinateType, sf.CoordinateType.Normalized);
  assert.equal(copy.shader, null);
  assert.deepEqual(copy.transform.getMatrix(), transform.getMatrix());
  assert.deepEqual(copy.blendMode, blend);
  assert.deepEqual(copy.stencilMode, stencil);
  copy.transform = transform;
  transform.translate(point(9, 9));
  assert.notDeepEqual(copy.transform.getMatrix(), transform.getMatrix());
  assert.equal(new sf.RenderStates(image).texture, image);
  assert.equal(new sf.RenderStates(null).texture, null);
  for (const mutate of [
    () => { sf.RenderStates.Default.texture = image; },
    () => { sf.RenderStates.Default.blendMode.colorSrcFactor = F.Zero; },
    () => { sf.RenderStates.Default.stencilMode.stencilReference.value = 3; },
    () => sf.RenderStates.Default.transform.translate(point(1, 1)),
    () => { sf.BlendNone.alphaEquation = E.Min; },
  ]) assert.throws(mutate, TypeError);
  const defaults = new sf.RenderStates(sf.RenderStates.Default);
  defaults.transform.translate(point(1, 1));
  defaults.stencilMode.stencilReference.value = 3;
  assert.equal(sf.RenderStates.Default.stencilMode.stencilReference.value, 0);
});

test('snapshots survive transform, blend, and stencil edits', () => {
  const sprite = new sf.Sprite(texture([ 255, 0, 0, 255 ]));
  const target = new sf.RenderTexture(
    new sf.Vector2u(64, 1), { stencilBits: 8 });
  const states = new sf.RenderStates({
    blendMode: sf.BlendNone,
    stencilMode: new sf.StencilMode({
      stencilComparison: C.Equal, stencilReference: 2,
    }),
  });
  target.clear(sf.Color.Black, 2);
  target.draw(sprite, states);
  states.transform.translate(point(2, 0));
  target.draw(sprite, states);
  states.transform.translate(point(20, 0));
  states.blendMode.colorSrcFactor = F.Zero;
  states.stencilMode.stencilReference.value = 9;
  target.display();
  assert.deepEqual(pixel(pixels(target), 0), [ 255, 0, 0, 255 ]);
  assert.deepEqual(pixel(pixels(target), 2), [ 255, 0, 0, 255 ]);
  assert.deepEqual(pixel(pixels(target), 22), [ 0, 0, 0, 255 ]);
});

test('Sprite super.draw preserves caller states', () => {
  const calls = [];
  class ShiftedSprite extends sf.Sprite {
    draw(target, states) {
      calls.push('sprite');
      states.transform.translate(point(3, 0));
      super.draw(target, states);
      states.transform.translate(point(2, 0));
      super.draw(target, states);
    }
  }
  const sprite = new ShiftedSprite(texture([ 255, 0, 0, 255 ]));
  const states = new sf.RenderStates();
  const target = new sf.RenderTexture(new sf.Vector2u(64, 1));
  target.clear();
  target.draw(sprite, states);
  assert.deepEqual(calls, [ 'sprite' ]);
  assert.deepEqual(states.transform.getMatrix(),
    sf.Transform.Identity.getMatrix());
  target.display();
  assert.deepEqual(pixel(pixels(target), 3), [ 255, 0, 0, 255 ]);
  assert.deepEqual(pixel(pixels(target), 5), [ 255, 0, 0, 255 ]);
});

test('invalid states reject even an empty callback before it runs', t => {
  const target = new sf.RenderTexture(new sf.Vector2u(1, 1));
  const submit = t.mock.method(native, 'submitRenderTexture');
  let calls = 0;
  class Empty extends sf.Drawable {
    draw() { calls++; }
  }
  for (const change of [
    s => { s.blendMode = {}; },
    s => { s.stencilMode.stencilMask.value = -1; },
    s => { s.coordinateType = 2; },
    s => { s.shader = {}; },
  ]) {
    const states = new sf.RenderStates();
    change(states);
    assert.throws(() => target.draw(new Empty(), states));
  }
  target.flush();
  assert.equal(calls, 0);
  assert.equal(submit.mock.callCount(), 0);
});

test('super.draw revalidates edited states before reserving a command',
  t => {
    let calls = 0;
    class InvalidSprite extends sf.Sprite {
      draw(target, states) {
        calls++;
        super.draw(target, states);
        states.transform.translate(point(1, 0));
        states.blendMode.colorSrcFactor = -1;
        super.draw(target, states);
      }
    }
    const target = new sf.RenderTexture(new sf.Vector2u(2, 1));
    const sprite = new InvalidSprite(texture([ 255, 0, 0, 255 ]));
    const submit = t.mock.method(native, 'submitRenderTexture');
    const states = new sf.RenderStates();
    target.clear();
    assert.throws(() => target.draw(sprite, states), RangeError);
    target.display();
    assert.equal(calls, 1);
    assert.equal(submit.mock.callCount(), 1);
    assert.equal(submit.mock.calls[0].arguments[1], 2);
    assert.equal(states.blendMode.colorSrcFactor, F.SrcAlpha);
    assert.deepEqual([ ...pixels(target) ],
      [ 255, 0, 0, 255, 0, 0, 0, 255 ]);
  });

test('escaped callback states stay independent across later draws and edits',
  () => {
    const target = new sf.RenderTexture(new sf.Vector2u(1, 1));
    const seen = [];
    class Capture extends sf.Drawable {
      draw(target, states) { seen.push(states); }
    }
    const drawable = new Capture();
    for (const source of [ undefined, sf.RenderStates.Default,
      new sf.RenderStates() ]) {
      target.draw(drawable, source);
      const first = seen.at(-1);
      if (source && source !== sf.RenderStates.Default) {
        source.transform.translate(point(10, 0));
        source.blendMode.colorSrcFactor = F.Zero;
        source.stencilMode.stencilReference.value = 3;
        source.stencilMode.stencilMask.value = 7;
      }
      target.draw(drawable, source);
      const second = seen.at(-1);
      assert.notEqual(first, second);
      second.transform.translate(point(20, 0));
      second.blendMode.colorSrcFactor = F.One;
      second.stencilMode.stencilReference.value = 8;
      second.stencilMode.stencilMask.value = 15;
      assert.deepEqual(first.transform.getMatrix(),
        sf.Transform.Identity.getMatrix());
      assert.equal(first.blendMode.colorSrcFactor, F.SrcAlpha);
      assert.equal(first.stencilMode.stencilReference.value, 0);
      assert.equal(first.stencilMode.stencilMask.value, 0xffffffff);
      first.transform.translate(point(40, 0));
      assert.notDeepEqual(first.transform.getMatrix(),
        second.transform.getMatrix());
    }
    assert.equal(new Set(seen).size, 6);
  });

test('Sprite overrides incoming texture and coordinates', () => {
  const own = new sf.Texture(new sf.Vector2u(2, 1));
  own.update(new Uint8Array([ 255, 0, 0, 255, 0, 0, 255, 255 ]));
  const other = texture([ 0, 255, 0, 255 ]);
  const sprite = new sf.Sprite(own);
  const target = new sf.RenderTexture(new sf.Vector2u(64, 1));
  target.clear();
  target.draw(sprite, {
    texture: other, coordinateType: sf.CoordinateType.Normalized,
  });
  target.display();
  assert.deepEqual(pixel(pixels(target), 0), [ 255, 0, 0, 255 ]);
  assert.deepEqual(pixel(pixels(target), 1), [ 0, 0, 255, 255 ]);
});

test('nested draw does not enter NAN below capacity', t => {
  const target = new sf.RenderTexture(new sf.Vector2u(8, 8));
  const group = new Group(new sf.Sprite(texture()));
  const calls = [];
  for (const [ name, fn ] of Object.entries(native)) {
    if (typeof fn !== 'function') continue;
    t.mock.method(native, name, (...args) => {
      calls.push(name);
      return fn(...args);
    });
  }
  target.clear();
  for (let i = 0; i < 256; i++) target.draw(group);
  assert.deepEqual(calls, []);
  target.display();
  assert.deepEqual(calls, [ 'submitRenderTexture' ]);
});

test('callback exceptions preserve prior draws without replay', () => {
  const target = new sf.RenderTexture(new sf.Vector2u(64, 1));
  const sprite = new sf.Sprite(texture([ 255, 0, 0, 255 ]));
  let calls = 0;
  class Broken extends sf.Drawable {
    draw(target, states) {
      calls++;
      target.draw(sprite, states);
      throw new Error('callback failed');
    }
  }
  target.clear();
  assert.throws(() => target.draw(new Broken()), /callback failed/);
  target.display();
  assert.equal(calls, 1);
  assert.deepEqual(pixel(pixels(target), 0), [ 255, 0, 0, 255 ]);
});

test('full blocks preserve per-draw parent states and explicit flush is idle',
  t => {
    const target = new sf.RenderTexture(new sf.Vector2u(64, 1));
    const sprite = new sf.Sprite(texture([ 255, 0, 0, 255 ]));
    const states = new sf.RenderStates(sf.BlendNone);
    const submit = t.mock.method(native, 'submitRenderTexture');
    target.clear();
    for (let i = 0; i < 4096; i++) {
      states.transform = new sf.Transform().translate(point(i % 64, 0));
      target.draw(sprite, states);
    }
    assert.equal(submit.mock.callCount(), 1);
    assert.equal(submit.mock.calls[0].arguments[1], 4096);
    target.flush();
    target.flush();
    assert.equal(submit.mock.callCount(), 2);
    assert.equal(submit.mock.calls[1].arguments[2], false);
    target.display();
    for (let i = 0; i < 64; i++) {
      assert.deepEqual(pixel(pixels(target), i), [ 255, 0, 0, 255 ]);
    }
  });

test('a discarded composite retains its leaves until texture-update flush',
  async () => {
    const image = texture([ 255, 0, 0, 255 ]);
    const target = new sf.RenderTexture(new sf.Vector2u(64, 1));
    let sprite = new sf.Sprite(image);
    const reference = new WeakRef(sprite);
    target.clear();
    target.draw(new Group(sprite));
    sprite = null;
    await setImmediate();
    global.gc();
    assert.ok(reference.deref());
    image.update(new Uint8Array([ 0, 255, 0, 255 ]));
    for (let i = 0; i < 30; i++) {
      await setImmediate();
      global.gc();
      if (!reference.deref()) break;
    }
    assert.equal(reference.deref(), undefined);
    target.draw(new sf.Sprite(image),
      new sf.Transform().translate(point(2, 0)));
    target.display();
    assert.deepEqual(pixel(pixels(target), 0), [ 255, 0, 0, 255 ]);
    assert.deepEqual(pixel(pixels(target), 2), [ 0, 255, 0, 255 ]);
  });

test('color and stencil clear independently', () => {
  const target = new sf.RenderTexture(
    new sf.Vector2u(64, 1), { stencilBits: 8 });
  const sprite = new sf.Sprite(texture([ 255, 0, 0, 255 ]));
  const states = new sf.RenderStates(new sf.StencilMode({
    stencilComparison: C.Equal, stencilReference: 7,
  }));
  target.clear(sf.Color.Black, new sf.StencilValue(7));
  target.clear(sf.Color.Green);
  target.draw(sprite, states);
  target.clearStencil();
  sprite.setPosition(point(2, 0));
  target.draw(sprite, states);
  target.display();
  assert.deepEqual(pixel(pixels(target), 0), [ 255, 0, 0, 255 ]);
  assert.deepEqual(pixel(pixels(target), 2), [ 0, 255, 0, 255 ]);
});

test('invalid states fail before reserving commands and stencil values narrow',
  () => {
    const target = new sf.RenderTexture(new sf.Vector2u(1, 1));
    const sprite = new sf.Sprite(texture());
    for (const change of [
      s => { s.blendMode.colorSrcFactor = -1; },
      s => { s.blendMode.alphaDstFactor = 10; },
      s => { s.blendMode.alphaEquation = 5; },
      s => { s.stencilMode.stencilComparison = 8; },
      s => { s.stencilMode.stencilUpdateOperation = 6; },
      s => { s.stencilMode.stencilReference.value = -1; },
      s => { s.stencilMode.stencilMask.value = 1.5; },
      s => { s.stencilMode.stencilOnly = 1; },
      s => { s.coordinateType = 2; },
      s => { s.texture = {}; },
      s => { s.shader = {}; },
    ]) {
      const states = new sf.RenderStates();
      change(states);
      assert.throws(() => target.draw(sprite, states));
    }
    assert.throws(() => new sf.RenderStates({ shader: {} }), /Shader/);
    assert.throws(() => target.draw(new sf.Transformable()), TypeError);
    for (const value of [ NaN, Infinity, 0.5, -0x80000001, 0x100000000 ]) {
      assert.throws(() => new sf.StencilValue(value), RangeError);
    }
    assert.equal(new sf.StencilValue(-1).value, 0xffffffff);
    assert.equal(new sf.StencilValue(-0).value, 0);
    assert.equal(new sf.StencilValue(-0x80000000).value, 0x80000000);
    assert.throws(() => new sf.RenderTexture(
      new sf.Vector2u(1, 1), { stencilBits: 33 }), RangeError);
    target.clear(sf.Color.Green);
    target.display();
    assert.deepEqual(pixel(pixels(target), 0), [ 0, 255, 0, 255 ]);
  });

test('native validates state enum words before executing any command', () => {
  const image = texture();
  const sprite = native.createSprite(
    graphicsContext(), image[graphicsNative], image[textureId]);
  const target = native.createRenderTexture(graphicsContext(), 1, 1, 0);
  const words = new Uint32Array(target.buffer);
  words[0] = 0;
  words[1] = 0xff0000ff;
  native.submitRenderTexture(target.handle, 1, true);
  words[1] = 0x00ff00ff;
  words[43] = 1;
  words[44] = sprite.id;
  words[43 + 25] = 10;
  assert.throws(() =>
    native.submitRenderTexture(target.handle, 2, true), TypeError);
  assert.deepEqual([ ...native.readRenderTexturePixels(target.handle) ],
    [ 255, 0, 0, 255 ]);
});

test('each target keeps its own reusable batch across interleaved submissions',
  () => {
    const a = new sf.RenderTexture(
      new sf.Vector2u(64, 1), { stencilBits: 8 });
    const b = new sf.RenderTexture(
      new sf.Vector2u(64, 1), { stencilBits: 8 });
    const sprite = new sf.Sprite(texture([ 255, 0, 0, 255 ]));
    const group = new Group(sprite);
    const states = new sf.RenderStates(new sf.StencilMode({
      stencilComparison: C.Equal,
    }));
    for (let frame = 0; frame < 3; frame++) {
      a.clear(sf.Color.Black, 1);
      b.clear(sf.Color.Blue, 2);
      group.pose.setPosition(point(frame + 1, 0));
      states.stencilMode.stencilReference.value = 1;
      a.draw(group, states);
      group.pose.setPosition(point(frame + 8, 0));
      states.stencilMode.stencilReference.value = 2;
      b.draw(group, states);
      group.pose.setPosition(point(50, 0));
      // Flush one target while the other still holds an unsubmitted batch.
      if (frame % 2) b.flush();
      else a.flush();
      b.display();
      a.display();
      const aPixels = pixels(a);
      const bPixels = pixels(b);
      for (let x = 0; x < 64; x++) {
        assert.deepEqual(pixel(aPixels, x), x === frame + 1
          ? [ 255, 0, 0, 255 ] : [ 0, 0, 0, 255 ]);
        assert.deepEqual(pixel(bPixels, x), x === frame + 8
          ? [ 255, 0, 0, 255 ] : [ 0, 0, 255, 255 ]);
      }
    }
  });

test('native batch releases resolved resources after rejection and success',
  () => {
    const image = texture([ 0, 0, 255, 255 ]);
    const sprite = native.createSprite(
      graphicsContext(), image[graphicsNative], image[textureId]);
    const target = native.createRenderTexture(graphicsContext(), 2, 1, 0);
    const words = new Uint32Array(target.buffer);
    const floats = new Float32Array(target.buffer);
    const useCount = () =>
      native.transformableUseCount(sprite.transformable);
    const initialOwners = useCount();
    words[0] = 0;
    words[1] = 0xff0000ff;
    native.submitRenderTexture(target.handle, 1, true);
    words[1] = 0x00ff00ff;
    words[43] = 1;
    words[44] = sprite.id;
    floats.set([ 0, 0, 0, 1, 1, 0, 0 ], 45);
    floats.set(sf.Transform.Identity.getMatrix(), 52);
    words.set([ 1, 0, 0, 1, 0, 0, 7, 0, 0, 0xffffffff, 0 ], 68);
    words.set(new Uint32Array(sprite.appearance), 79);
    words.set(words.subarray(43, 86), 86);
    // The first sprite is resolved before rejecting the trailing command.
    for (const [ type, id ] of [[ 99, sprite.id ], [ 1, 0xffffffff ]]) {
      words[86] = type;
      words[87] = id;
      assert.throws(() =>
        native.submitRenderTexture(target.handle, 3, true), TypeError);
      assert.equal(useCount(), initialOwners);
      assert.deepEqual([ ...native.readRenderTexturePixels(target.handle) ],
        [ 255, 0, 0, 255, 255, 0, 0, 255 ]);
    }
    // Reuse the original mapped view after failure, then after success.
    for (const x of [ 0, 1 ]) {
      floats[45] = x;
      native.submitRenderTexture(target.handle, 2, true);
      assert.equal(useCount(), initialOwners);
      const bytes = native.readRenderTexturePixels(target.handle);
      assert.deepEqual(pixel(bytes, x, 0, 2), [ 0, 0, 255, 255 ]);
      assert.deepEqual(pixel(bytes, 1 - x, 0, 2), [ 0, 255, 0, 255 ]);
      native.submitRenderTexture(target.handle, 0, true);
      assert.deepEqual(native.readRenderTexturePixels(target.handle), bytes);
    }
  });
