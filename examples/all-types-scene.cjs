'use strict';

const assert = require('node:assert/strict');
const { join } = require('node:path');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const keys = require('../dist/internal/value-storage');
const glslKeys = require('../dist/internal/glsl-value');
const { graphicsNative } = require('../dist/internal/graphics-state');
const { transformableState } = require('../dist/internal/transformable');

const paneSize = [ 480, 480 ];
const fields = [ 'x', 'y', 'z', 'w' ];
const vectorData = value =>
  fields.filter(field => field in value).map(field => Number(value[field]));

function binding(value) {
  let family;
  let symbols = keys;
  if (value instanceof sf.Angle) family = 'Angle';
  else if (value instanceof sf.Transform) family = 'Transform';
  else if (value instanceof sf.Color) family = 'Color';
  else if (value instanceof sf.Vertex) family = 'Vertex';
  else if (value instanceof sf.Glyph) family = 'Glyph';
  else if (value instanceof sf.FloatRect || value instanceof sf.IntRect) {
    family = 'Rect';
  } else if (value instanceof sf.Vector2) {
    family = 'Vector2';
  } else if (value instanceof sf.Vector3) family = 'Vector3';
  else if (value instanceof sf.Glsl.Mat3 || value instanceof sf.Glsl.Mat4) {
    family = value instanceof sf.Glsl.Mat3 ? 'Mat3' : 'Mat4';
    symbols = glslKeys;
  } else {
    family = `Vector${'w' in value ? 4 : 'z' in value ? 3 : 2}`;
    symbols = glslKeys;
  }
  const prefix = symbols === glslKeys ? 'glsl'
    : family[0].toLowerCase() + family.slice(1);
  return {
    family, storage: symbols[`${prefix}Storage`],
    handle: symbols[`${prefix}Native`],
  };
}

function snapshot(value, family) {
  if (family === 'Glyph') return [ ...value[keys.glyphStorage] ];
  if (family === 'Angle') return value.asRadians();
  if (family === 'Transform') return value.getMatrix();
  if (family === 'Mat3' || family === 'Mat4') return [ ...value.array ];
  if (family === 'Color') return value.toInteger();
  if (family === 'Rect') {
    return {
      position: vectorData(value.position), size: vectorData(value.size),
    };
  }
  if (family === 'Vertex') {
    return {
      position: vectorData(value.position), color: value.color.toInteger(),
      texCoords: vectorData(value.texCoords),
    };
  }
  return vectorData(value);
}

function makeTexture(width, height, color, circle = false) {
  const image = new sf.Image(new sf.Vector2u(width, height), color);
  const pixels = image.pixels;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = circle ? Math.max(0, Math.min(1, width / 2 -
        Math.hypot(x + 0.5 - width / 2, y + 0.5 - height / 2))) : 1;
      pixels.set([ color.r, color.g, color.b, color.a * alpha ],
        (y * width + x) * 4);
    }
  }
  const texture = new sf.Texture(image.getSize());
  texture.update(image.pixels);
  return texture;
}

// Persistent inputs are either entirely cold or explicitly native-wrapped.
function createScene(offset, wrapped = false) {
  const entries = [];
  const values = {};
  values.SFMLError = new sf.SFMLError('SFML runtime failure');
  function keep(name, value) {
    values[name] = value;
    const descriptor = binding(value);
    entries.push({
      name, value, ...descriptor, old: value[descriptor.storage],
    });
    return value;
  }
  const v = {
    offset: keep('Vector2', new sf.Vector2('f32', ...offset)),
    cell: keep('Vector2i', new sf.Vector2i()),
    size: keep('Vector2u', new sf.Vector2u(...paneSize)),
    point: keep('Vector2f', new sf.Vector2f()),
    space: keep('Vector3', new sf.Vector3('f32')),
    grid: keep('Vector3i', new sf.Vector3i(12, 12, 3)),
    palette: keep('Vector3u', new sf.Vector3u(61, 178, 240)),
    axis: keep('Vector3f', new sf.Vector3f(0.3, 0.6, 0.8).normalized()),
    angle: keep('Angle', new sf.Angle()),
    transform: keep('Transform', new sf.Transform()
      .translate(new sf.Vector2f(240, 216))
      .rotate(sf.degrees(12))
      .scale(new sf.Vector2f(0.9, 1))
      .translate(new sf.Vector2f(-240, -216))),
    color: keep('Color', new sf.Color(61, 178, 240)),
    bounds: keep('FloatRect', new sf.FloatRect(new sf.Vector2f(8, 8),
      new sf.Vector2f(paneSize[0] - 16, paneSize[1] - 64))),
    pixels: keep('IntRect', new sf.IntRect(new sf.Vector2i(8, 8),
      new sf.Vector2i(paneSize[0] - 16, paneSize[1] - 64))),
    vertex: keep('Vertex', new sf.Vertex()),
    uv: keep('Glsl.Vec2', new sf.Glsl.Vec2()),
    raster: keep('Glsl.Ivec2', new sf.Glsl.Ivec2()),
    visible: keep('Glsl.Bvec2', new sf.Glsl.Bvec2()),
    projected: keep('Glsl.Vec3', new sf.Glsl.Vec3()),
    channels: keep('Glsl.Ivec3', new sf.Glsl.Ivec3()),
    mask: keep('Glsl.Bvec3', new sf.Glsl.Bvec3()),
    uniform: keep('Glsl.Vec4', new sf.Glsl.Vec4()),
    rgba: keep('Glsl.Ivec4', new sf.Glsl.Ivec4()),
    enabled: keep('Glsl.Bvec4', new sf.Glsl.Bvec4()),
    pointMatrix: keep('Glsl.Mat3', new sf.Glsl.Mat3(
      new sf.Transform().translate(new sf.Vector2f(6, -4)))),
    colorMatrix: keep('Glsl.Mat4', new sf.Glsl.Mat4(sf.Transform.Identity)),
  };
  const triangle = values.VertexArray =
    new sf.VertexArray(sf.PrimitiveType.Triangles, 3);
  const triangleVertices = [ ...triangle ];
  const gpuTriangle = values.VertexBuffer = new sf.VertexBuffer(
    sf.PrimitiveType.Triangles, sf.VertexBuffer.Usage.Static);
  assert.equal(gpuTriangle.create(3), true);
  assert.equal(gpuTriangle.update([ 0, 1, 2 ].map(i => new sf.Vertex(
    new sf.Vector2f(offset[0] + [ 180, 190, 200 ][i],
      offset[1] + [ 440, 426, 440 ][i]), new sf.Color(87, 178, 255)))), true);
  class Diamond extends sf.Shape {
    constructor() { super(); this.update(); }
    getPointCount() { return 4; }
    getPoint(index) {
      return new sf.Vector2f(...[[ 6, 0 ], [ 12, 6 ], [ 6, 12 ],
        [ 0, 6 ]][index]);
    }
  }
  const shapes = [
    values.Shape = new Diamond(),
    values.CircleShape = new sf.CircleShape({ radius: 6, pointCount: 4 }),
    values.RectangleShape = new sf.RectangleShape(new sf.Vector2f(12, 10)),
    values.ConvexShape = new sf.ConvexShape(3),
  ];
  [[ 0, 10 ], [ 6, 0 ], [ 12, 10 ]].forEach((point, i) =>
    values.ConvexShape.setPoint(i, new sf.Vector2f(...point)));
  shapes.forEach((shape, i) => {
    shape.setPosition(new sf.Vector2f(offset[0] + 280 + i * 24,
      offset[1] + 428));
    shape.setFillColor(new sf.Color(87, 178, 255));
    if (wrapped) assert.ok(shape.getTextureRect()[keys.rectNative]);
  });
  // Save member identities before either parent or child is wrapped.
  const members = [
    v.bounds.position, v.bounds.size, v.pixels.position, v.pixels.size,
    v.vertex.position, v.vertex.color, v.vertex.texCoords,
    ...triangleVertices,
  ].map(value => {
    const descriptor = binding(value);
    return { value, ...descriptor, old: value[descriptor.storage] };
  });
  if (wrapped) {
    for (const entry of entries) {
      assert.ok(entry.value[entry.handle]);
      assert.equal(native.sameBackingStore(entry.old.buffer,
        entry.value[entry.storage].buffer), true);
    }
    for (const entry of members) assert.ok(entry.value[entry.handle]);
  }
  const palette = [
    new sf.Color(v.palette.x, 232, 151),
    new sf.Color(87, v.palette.y, 255),
    new sf.Color(255, 192, v.palette.z / 3),
  ];
  const textures = palette.map(color => makeTexture(9, 9, color, true));
  const dots = textures.map(texture => new sf.Sprite(texture));
  const marker = new sf.Sprite(makeTexture(2, 2, new sf.Color(75, 99, 121)));
  const strip = makeTexture(paneSize[0] - 16, 20, sf.Color.White);
  const stripSprite = new sf.Sprite(strip);
  const stripWidth = strip.getSize().x;
  const stripImage = values.Image = new sf.Image(
    new sf.Vector2u(stripWidth, 20));
  const stripPixels = stripImage.pixels;
  const stripRow = stripPixels.subarray(0, stripWidth * 4);
  const stream = values.MemoryInputStream = new sf.MemoryInputStream(stripRow);
  values.InputStream = stream;
  const window = values.Window = new sf.Window();
  const renderWindow = values.RenderWindow = new sf.RenderWindow();
  values.Context = new sf.Context();
  assert.equal(sf.Context.getActiveContext(), values.Context);
  assert.ok(sf.Context.getActiveContextId() > 0n);
  values.Context.setActive(false);
  const mode = values.VideoMode = new sf.VideoMode(v.size);
  values.Event = new sf.Event({ kind: 'Resized', size: mode.size });
  values.Cursor = new sf.Cursor(
    new Uint8Array(64).fill(255), new sf.Vector2u(4, 4), new sf.Vector2u());
  window.setMouseCursor(values.Cursor);
  const view = values.View = new sf.View();
  const time = new sf.Time();
  const clock = new sf.Clock();
  values.TimeoutWithPredicate =
    new sf.TimeoutWithPredicate(sf.milliseconds(16));
  values.SuspendAwareClock = new sf.SuspendAwareClock();
  if (native.suspendAwareClockSupported) {
    assert.equal(typeof sf.SuspendAwareClock.now(), 'bigint');
  } else {
    assert.throws(() => sf.SuspendAwareClock.now(), sf.SFMLError);
  }
  const placement = values.Transformable = new sf.Transformable();
  placement.setOrigin(new sf.Vector2f(4, 4));
  const dotScale = new sf.Vector2f();
  const renderStates = values.RenderStates = new sf.RenderStates();
  const shader = values.Shader = new sf.Shader();
  const font = values.Font = new sf.Font();
  const label = values.Text = new sf.Text({
    font, string: 'sfml.js', characterSize: 16,
  });
  const glyph = keep('Glyph', new sf.Glyph());
  if (wrapped) assert.ok(glyph[keys.glyphNative]);
  label.setPosition(new sf.Vector2f(offset[0] + 20, offset[1] + 12));
  label.setFillColor(new sf.Color(170, 205, 225));
  const fileStream = values.FileInputStream = new sf.FileInputStream();
  const ready = Promise.all([ shader.loadFromMemory(
    'uniform vec4 tint; void main() { gl_FragColor = gl_Color * tint; }',
    sf.ShaderType.Fragment).then(ok => {
    assert.equal(ok, true);
    shader.setUniform('tint', new sf.Glsl.Vec4(sf.Color.White));
  }), (async () => {
    try {
      assert.equal(await fileStream.open(__filename), true);
      const header = new Uint8Array(13);
      assert.equal(await fileStream.read(header), 13n);
      assert.equal(Buffer.from(header).toString(), "'use strict';");
    } finally {
      await fileStream.close();
    }
  })(), font.openFromFile(join(__dirname,
    '../test/fixtures/fonts/DejaVuSansMono.ttf')).then(ok => {
    assert.equal(ok, true);
    glyph[keys.glyphStorage].set(
      font.getGlyph(115, 16, false)[keys.glyphStorage]);
    label.setLetterSpacing(1 + glyph.advance / 100);
    label.getVertexData();
    font.getTexture(16);
  }) ]);
  values.BlendMode = renderStates.blendMode;
  values.StencilMode = renderStates.stencilMode;
  values.StencilValue = renderStates.stencilMode.stencilReference;
  const names = [
    ...entries.map(entry => entry.name),
    'Time', 'Clock', 'SFMLError', 'Transformable', 'Image',
    'TimeoutWithPredicate', 'SuspendAwareClock',
    'Texture', 'Sprite', 'RenderTexture', 'VertexArray', 'VertexBuffer',
    'Drawable', 'RenderTarget', 'RenderStates',
    'BlendMode', 'StencilMode', 'StencilValue',
    'InputStream', 'MemoryInputStream', 'FileInputStream', 'Window', 'View',
    'Shader', 'RenderWindow', 'Font', 'Text',
    'Shape', 'CircleShape', 'RectangleShape', 'ConvexShape',
    'VideoMode', 'Event', 'Cursor', 'Context',
  ];

  function prepare(elapsed) {
    sf.subtractAssign(time, time);
    sf.addAssign(time, elapsed);
    const seconds = sf.modulo(time, sf.seconds(60)).asSeconds();
    sf.subtractAssign(v.angle, v.angle);
    sf.addAssign(v.angle, sf.degrees(seconds * 26));
    // Pixel-aligned transforms keep translated panels exactly comparable.
    // Arbitrary angles/scales are covered by the same-coordinate C++ oracle.
    placement.setRotation(sf.degrees(Math.floor(seconds) * 90));
    v.color.r = v.palette.x + Math.sin(seconds) * 30;
    v.color.g = v.palette.y + Math.cos(seconds * 0.7) * 40;
    v.color.b = v.palette.z;
    // Apply the stored column-major Mat4 before Color-to-Vec4 normalization.
    const m = v.colorMatrix.array;
    const { r, g, b } = v.color;
    v.color.r = m[0] * r + m[4] * g + m[8] * b + m[12] * 255;
    v.color.g = m[1] * r + m[5] * g + m[9] * b + m[13] * 255;
    v.color.b = m[2] * r + m[6] * g + m[10] * b + m[14] * 255;
    v.color.a = m[3] * r + m[7] * g + m[11] * b + m[15] * 255;
    const normalized = new sf.Glsl.Vec4(v.color);
    const integer = new sf.Glsl.Ivec4(v.color);
    const enabled = new sf.Glsl.Bvec4(normalized);
    for (const field of fields) {
      v.uniform[field] = normalized[field];
      v.rgba[field] = integer[field];
      v.enabled[field] = enabled[field];
    }
    v.channels.x = v.rgba.x;
    v.channels.y = v.rgba.y;
    v.channels.z = v.rgba.z;
    const mask = new sf.Glsl.Bvec3(v.channels);
    v.mask.x = mask.x && v.enabled.x;
    v.mask.y = mask.y && v.enabled.y;
    v.mask.z = mask.z && v.enabled.z;
    // Exercise a real C++ write into the wrapped Vertex's Color member.
    // Both paths must produce identical texture pixels.
    if (wrapped) {
      native.setColor(v.vertex.color[keys.colorNative], v.color.toInteger());
    } else v.vertex.color = v.color;
    const red = Math.round((v.uniform.x * 255 + v.vertex.color.r) / 2);
    const green = Math.round((v.uniform.y * 255 + v.vertex.color.g) / 2);
    const blue = Math.round((v.uniform.z * 255 + v.vertex.color.b) / 2);
    for (let x = 0; x < stripWidth; x++) {
      const blend = 0.25 + 0.75 * x / (stripWidth - 1);
      stripRow[x * 4] = v.mask.x ? red * blend : 0;
      stripRow[x * 4 + 1] = v.mask.y ? green * blend : 0;
      stripRow[x * 4 + 2] = v.mask.z ? blue * blend : 0;
      stripRow[x * 4 + 3] = v.enabled.w
        ? Math.round(v.uniform.w * 255) : 0;
    }
    for (let y = 1; y < 20; y++) {
      stream.seek(0n);
      stream.read(stripPixels.subarray(y * stripWidth * 4,
        (y + 1) * stripWidth * 4));
    }
    strip.update(stripPixels);
    // A closed Window is a valid, no-op update source.
    strip.update(window);
  }

  function draw(target, states) {
    target.draw(label, states);
    const center = v.bounds.getCenter();
    const clip = v.bounds.findIntersection(new sf.FloatRect(v.pixels));
    const count = v.grid.x * v.grid.y;
    for (let i = 0; i < count; i++) {
      v.cell.x = i % v.grid.x;
      v.cell.y = Math.floor(i / v.grid.x);
      const phase = v.angle.asRadians() + i * 2.39996323;
      const radius = 25 + Math.sqrt(i / count) * 170;
      v.space.x = Math.cos(phase) * radius;
      v.space.y = Math.sin(phase) * radius * 0.7;
      v.space.z = Math.sin(phase * 0.7 + v.cell.y) * 80;
      v.projected.z = v.axis.dot(v.space);
      const perspective = 1 / (1 + v.projected.z / 600);
      v.projected.x = v.space.x * perspective;
      v.projected.y = v.space.y * perspective;
      v.point.x = center.x + v.projected.x;
      v.point.y = center.y + v.projected.y;
      const transformed = v.transform.transformPoint(v.point);
      const m = v.pointMatrix.array;
      const w = m[2] * transformed.x + m[5] * transformed.y + m[8];
      v.point.x = (m[0] * transformed.x + m[3] * transformed.y + m[6]) / w;
      v.point.y = (m[1] * transformed.x + m[4] * transformed.y + m[7]) / w;
      v.uv.x = v.point.x / v.size.x;
      v.uv.y = v.point.y / v.size.y;
      v.raster.x = v.uv.x * v.size.x;
      v.raster.y = v.uv.y * v.size.y;
      v.visible.x = clip.contains(v.point);
      v.visible.y = v.pixels.contains(v.raster);
      if (!v.visible.x || !v.visible.y) continue;
      v.vertex.position.x = v.raster.x;
      v.vertex.position.y = v.raster.y;
      v.vertex.texCoords.x = v.uv.x;
      v.vertex.texCoords.y = v.uv.y;
      const color = (v.cell.x + v.cell.y +
        Math.floor(v.vertex.texCoords.x * v.grid.z)) % dots.length;
      const sprite = dots[color];
      dotScale.x = 1 + i % 2;
      dotScale.y = 1;
      sprite.setScale(dotScale);
      sprite.setRotation(placement.getRotation());
      sprite.setOrigin(placement.getOrigin());
      sprite.setPosition(v.vertex.position);
      sprite.move(v.offset);
      target.draw(sprite, states);
    }
    // FloatRect member views and integer bounds define the visible frame.
    for (let x = 8; x <= v.size.x - 8; x += 8) {
      for (const y of [ v.bounds.position.y,
        v.bounds.position.y + v.bounds.size.y ]) {
        v.point.x = x;
        v.point.y = y;
        marker.setPosition(v.point);
        marker.move(v.offset);
        target.draw(marker, states);
      }
    }
    for (let y = 8; y <= 424; y += 8) {
      for (const x of [ 8, v.size.x - 8 ]) {
        v.point.x = x;
        v.point.y = y;
        marker.setPosition(v.point);
        marker.move(v.offset);
        target.draw(marker, states);
      }
    }
    v.point.x = 8;
    v.point.y = 448;
    stripSprite.setPosition(v.point);
    stripSprite.move(v.offset);
    target.draw(stripSprite, states);
    for (let i = 0; i < triangleVertices.length; i++) {
      const vertex = triangleVertices[i];
      vertex.position.x = v.offset.x + [ 220, 240, 260 ][i];
      vertex.position.y = v.offset.y + [ 440, 426, 440 ][i];
      vertex.color = v.color;
    }
    const triangleStates = new sf.RenderStates(states);
    triangleStates.shader = shader;
    target.draw(triangle, triangleStates);
    target.draw(gpuTriangle, triangleStates);
    for (const shape of shapes) {
      shape.setFillColor(v.color);
      target.draw(shape, triangleStates);
    }
    assert.equal(dots[0].getTexture(), textures[0]);
    assert.ok(Number.isFinite(dots[0].getPosition().x));
  }

  class Scene extends sf.Drawable {
    draw(target, states) {
      assert.ok(target instanceof sf.RenderTarget);
      draw(target, states);
    }
  }
  const scene = values.Drawable = new Scene();

  function verify() {
    assert.ok(values.SFMLError instanceof Error);
    assert.equal(values.SFMLError.name, 'SFMLError');
    assert.ok(values.Context.getSettings().majorVersion >= 1);
    assert.equal(typeof sf.version().string, 'string');
    assert.equal(sf.SuspendAwareClock.is_steady, true);
    assert.equal(values.TimeoutWithPredicate.getPredicate()(), false);
    assert.equal(values.TimeoutWithPredicate.getPeriod().asMicroseconds(),
      16000n);
    assert.ok(stream instanceof sf.InputStream);
    assert.equal(stream.tell(), BigInt(stripRow.length));
    assert.equal(stream.getSize(), BigInt(stripRow.length));
    assert.equal(window.isOpen(), false);
    assert.equal(renderWindow.isOpen(), false);
    assert.ok(renderWindow instanceof sf.RenderTarget);
    assert.equal(sf.equal(values.Event.getIf('Resized').size, mode.size), true);
    for (const entry of [ ...entries, ...members ]) {
      assert.deepEqual([ ...entry.old ], [ ...entry.value[entry.storage] ]);
      if (wrapped) {
        assert.deepEqual(native[`read${entry.family}`](
          entry.value[entry.handle]), snapshot(entry.value, entry.family));
      } else {
        assert.equal(Object.hasOwn(entry.value, entry.handle), false);
        assert.equal(entry.old, entry.value[entry.storage]);
      }
    }
    if (wrapped) {
      assert.equal(native.imageSharesPixels(
        stripImage[graphicsNative], stripPixels), true);
      assert.deepEqual(
        [ ...native.readImagePixels(stripImage[graphicsNative]) ],
        [ ...stripPixels ]);
      assert.equal(native.inspectTime(time.asMicroseconds()).microseconds,
        time.asMicroseconds());
      assert.equal(native.inspectTimeoutWithPredicate(16000n).period,
        values.TimeoutWithPredicate.getPeriod().asMicroseconds());
      const state = placement[transformableState];
      assert.deepEqual(native.readTransformable(state.handle).origin,
        vectorData(placement.getOrigin()));
      for (const sprite of dots) {
        const nativeState = native.readTransformable(
          sprite[transformableState].handle, false);
        assert.deepEqual(nativeState.position,
          vectorData(sprite.getPosition()));
        assert.deepEqual(nativeState.scale, vectorData(sprite.getScale()));
        assert.deepEqual(nativeState.origin, vectorData(sprite.getOrigin()));
        assert.equal(nativeState.rotation, sprite.getRotation().asRadians());
      }
    }
    return names;
  }
  return {
    prepare, draw: target => {
      view.setCenter(target.getDefaultView().getCenter());
      view.setSize(target.getDefaultView().getSize());
      target.setView(view);
      target.draw(scene, renderStates);
    },
    verify, names, clock, time, values, entries, members, ready,
  };
}

function comparePanels(target, left, right) {
  const size = target.getSize();
  const bytes = native.readRenderTexturePixels(target[graphicsNative]);
  let different = 0;
  for (let y = 0; y < paneSize[1]; y++) {
    for (let x = 0; x < paneSize[0]; x++) {
      const a = ((y + left[1]) * size.x + x + left[0]) * 4;
      const b = ((y + right[1]) * size.x + x + right[0]) * 4;
      if (bytes[a] !== bytes[b] || bytes[a + 1] !== bytes[b + 1] ||
          bytes[a + 2] !== bytes[b + 2] || bytes[a + 3] !== bytes[b + 3]) {
        different++;
      }
    }
  }
  assert.equal(different, 0,
    `${different} pixels differ between storage paths`);
  return bytes;
}

module.exports = { createScene, comparePanels, makeTexture, paneSize };
