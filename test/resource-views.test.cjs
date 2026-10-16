'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { join } = require('node:path');
const { setImmediate: nextTurn } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');
const { nativeStruct } = require('../dist/internal/struct-view');

async function collect() {
  for (let i = 0; i < 8; i++) { await nextTurn(); global.gc(); }
}

test('Resource getters read shared native fields without binding calls', t => {
  const texture = new sf.Texture(new sf.Vector2u(3, 2));
  const target = new sf.RenderTexture(new sf.Vector2u(4, 5));
  const borrowed = target.getTexture();
  const buffer = new sf.VertexBuffer();
  const circle = new sf.CircleShape({ radius: 8, pointCount: 12 });
  const image = new sf.Image(new sf.Vector2u(6, 7));
  native.setTextureSmooth(texture[graphicsNative], true);
  native.resizeTexture(texture[graphicsNative], 8, 9, false);
  native.setRenderTextureRepeated(target[graphicsNative], true);
  native.setVertexBufferUsage(buffer[graphicsNative], 2);
  native.setVertexBufferPrimitiveType(buffer[graphicsNative], 3);
  native.allocateVertexBuffer(buffer[graphicsNative], 6);
  native.changeShapeGeometry(circle[graphicsNative], 2, 16);
  for (const [ name, method ] of Object.entries(native)) {
    if (typeof method === 'function') {
      t.mock.method(native, name, () => assert.fail(`Native getter: ${name}`));
    }
  }
  assert.deepEqual([ texture.getSize().x, texture.getSize().y ], [ 8, 9 ]);
  assert.equal(texture.isSmooth(), true);
  assert.equal(texture.isSrgb(), false);
  assert.ok(texture.getNativeHandle() > 0);
  assert.equal(target.isRepeated(), true);
  assert.equal(borrowed.isRepeated(), true);
  assert.equal(target.getSize().y, 5);
  assert.equal(buffer.getVertexCount(), 6);
  assert.equal(buffer.getUsage(), sf.VertexBufferUsage.Static);
  assert.equal(buffer.getPrimitiveType(), sf.PrimitiveType.Triangles);
  assert.ok(buffer.getNativeHandle() > 0);
  assert.equal(circle.getRadius(), 16);
  assert.equal(circle.getPointCount(), 12);
  assert.equal(circle.getLocalBounds().size.x, 32);
  assert.deepEqual([ image.getSize().x, image.getSize().y ], [ 6, 7 ]);
});

test('Resource metadata stays attached to object identity across swap/resize',
  () => {
    const a = new sf.Texture(new sf.Vector2u(2, 3));
    const b = new sf.Texture(new sf.Vector2u(4, 5));
    const aState = a.state;
    const bState = b.state;
    b.setSmooth(true);
    a.swap(b);
    assert.equal(a.state, aState);
    assert.equal(b.state, bState);
    assert.deepEqual([ aState.width, aState.height, aState.smooth ],
      [ 4, 5, true ]);
    a.resize(new sf.Vector2u(6, 7));
    assert.deepEqual([ aState.width, aState.height ], [ 6, 7 ]);
    const target = new sf.RenderTexture(new sf.Vector2u(8, 9));
    const view = target.getTexture();
    const state = view.state;
    target.resize(new sf.Vector2u(10, 11));
    assert.equal(view.state, state);
    assert.deepEqual([ state.width, state.height ], [ 10, 11 ]);
    const x = new sf.VertexBuffer(sf.PrimitiveType.Lines);
    const y = new sf.VertexBuffer(sf.VertexBufferUsage.Static);
    x.create(2);
    y.create(3);
    const info = x.info;
    x.swap(y);
    assert.equal(x.info, info);
    assert.equal(info.count, 3);
    assert.equal(info.usage, 2);
  });

test('Font info and atlas views share native state through reload and GC',
  async t => {
    let font = new sf.Font();
    const filename = join(__dirname, 'fixtures/fonts/DejaVuSansMono.ttf');
    assert.equal(await font.openFromFile(filename), true);
    const info = font.getInfo();
    const expected = { ...info };
    const atlas = font.getTexture(64);
    for (let i = 33; i < 256; i++) font.getGlyph(i, 64, false);
    native.setFontSmooth(font[graphicsNative], false);
    const size = atlas.getSize();
    const family = info.family;
    t.mock.method(native, 'getTextureInfo', () => assert.fail('Scalar copy'));
    assert.equal(font.isSmooth(), false);
    assert.equal(atlas.isSmooth(), false);
    assert.equal(atlas.getSize().x, size.x);
    assert.ok(Object.isFrozen(info));
    assert.equal(await font.openFromFile(filename), true);
    assert.deepEqual({ ...info }, expected);
    font = null;
    await collect();
    assert.equal(info.family, family);
    assert.equal(atlas.getSize().x, size.x);
    assert.equal(atlas.copyToImage().getSize().x, size.x);
  });

test('A resource metadata view retains and releases its native allocation',
  async () => {
    const context = native.createGraphicsContext();
    let mapping = native.createVertexBuffer(context, 0, 0);
    native.allocateVertexBuffer(mapping.handle, 5);
    let info = nativeStruct(mapping.info);
    mapping = null;
    await collect();
    assert.equal(native.vertexBufferRegistrySize(context), 1);
    assert.equal(info.count, 5);
    info = null;
    await collect();
    assert.equal(native.vertexBufferRegistrySize(context), 0);
  });

test('Shader program ID buffer follows successful native commits', async t => {
  const shader = new sf.Shader();
  assert.equal(shader.getNativeHandle(), 0);
  const buffer = shader.program.buffer;
  for (const color of [ '1.0, 0.0, 0.0', '0.0, 0.0, 1.0' ]) {
    assert.equal(await shader.loadFromMemory(
      `void main() { gl_FragColor = vec4(${color}, 1.0); }`,
      sf.ShaderType.Fragment), true);
    assert.equal(shader.program.buffer, buffer);
    const id = native.getShaderNativeHandle(shader[graphicsNative]);
    t.mock.method(native, 'getShaderNativeHandle',
      () => assert.fail('Read the buffer'));
    assert.equal(shader.getNativeHandle(), id);
    assert.ok(id > 0);
    t.mock.reset();
  }
});

test('GPU uploads remain visible when no user GL context is active', () => {
  const target = new sf.RenderTexture(new sf.Vector2u(2, 1));
  const context = new sf.Context();
  context.setActive(false);
  assert.equal(sf.Context.getActiveContextId(), 0n);
  const buffer = new sf.VertexBuffer();
  const vertex = new sf.Vertex(new sf.Vector2f(0.5, 0.5), sf.Color.Red);
  assert.equal(buffer.create(1), true);
  assert.equal(buffer.update([ vertex ]), true);
  const copy = new sf.VertexBuffer(buffer);
  assert.equal(sf.Context.getActiveContextId(), 0n);
  target.setActive(true);
  target.clear();
  target.draw(copy);
  target.display();
  assert.deepEqual([ ...target.getTexture().copyToImage().pixels.slice(0, 4) ],
    [ 255, 0, 0, 255 ]);
});

test('Image size and pixel views retain the same allocation across replacement',
  async () => {
    let image = new sf.Image(new sf.Vector2u(2, 3), sf.Color.Red);
    const state = image.state;
    image.resize(new sf.Vector2u(4, 5), sf.Color.Blue);
    assert.deepEqual([ state.width, state.height, state.pixels.length ],
      [ 2, 3, 24 ]);
    image = null;
    await collect();
    assert.deepEqual([ ...state.pixels.subarray(0, 4) ], [ 255, 0, 0, 255 ]);
    assert.equal(state.width, 2);
  });

test('Buffered value properties preserve copying, enumeration and validation',
  () => {
    const blend = new sf.BlendMode();
    const copy = new sf.BlendMode(blend);
    blend.colorSrcFactor = sf.BlendFactor.Zero;
    assert.equal(copy.colorSrcFactor, sf.BlendFactor.SrcAlpha);
    assert.equal(Object.keys(blend).length, 6);
    assert.deepEqual({ ...new sf.StencilMode() }, {
      stencilComparison: sf.StencilComparison.Always,
      stencilUpdateOperation: sf.StencilUpdateOperation.Keep,
      stencilReference: new sf.StencilValue(0),
      stencilMask: new sf.StencilValue(0xffffffff), stencilOnly: false,
    });
    const sealed = Object.seal(new sf.BlendMode());
    sealed.colorSrcFactor = sf.BlendFactor.One;
    assert.equal(sealed.colorSrcFactor, sf.BlendFactor.One);
    Object.freeze(sealed);
    assert.throws(() => { sealed.colorSrcFactor = 0; }, TypeError);
    const target = new sf.RenderTexture(new sf.Vector2u(1, 1));
    for (const invalid of [ NaN, Infinity, 0.5, 2 ** 32, '1', null ]) {
      const states = new sf.RenderStates();
      states.blendMode.colorSrcFactor = invalid;
      assert.equal(states.blendMode.colorSrcFactor, invalid);
      assert.throws(() => target.draw(new sf.VertexArray(), states),
        RangeError);
    }
    const mode = new sf.VideoMode(new sf.Vector2u(20, 30));
    mode.bitsPerPixel = NaN;
    assert.ok(Number.isNaN(mode.bitsPerPixel));
    assert.throws(() => mode.isValid(), RangeError);
  });
