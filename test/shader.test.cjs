'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { setImmediate } = require('node:timers/promises');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const {
  graphicsNative, graphicsContext, shaderId, shaderTextures,
} = require('../dist/internal/graphics-state');
const {
  vector2Native, vector3Native,
} = require('../dist/internal/value-storage');
const { glslNative } = require('../dist/internal/glsl-value');

const G = sf.Glsl;
const F = sf.ShaderType.Fragment;
const vertexSource = `void main() {
  gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
  gl_TexCoord[0] = gl_TextureMatrix[0] * gl_MultiTexCoord0;
  gl_FrontColor = gl_Color;
}`;
const solid = color => `void main() { gl_FragColor = vec4(${color}, 1.0); }`;
const red = solid('1.0, 0.0, 0.0');
const blue = solid('0.0, 0.0, 1.0');
const sampler = 'uniform sampler2D source; void main() {' +
  'gl_FragColor = texture2D(source, gl_TexCoord[0].xy); }';
const tint = 'uniform vec4 tint; void main() { gl_FragColor = tint; }';
const size = (x, y = 1) => new sf.Vector2u(x, y);
const point = (x, y = 0) => new sf.Vector2f(x, y);
const target = (x = 4, y = 1) => new sf.RenderTexture(size(x, y));
const pixel = x => new sf.Vertex(point(x + 0.5, 0.5), sf.Color.White);
const bytes = output => native.readRenderTexturePixels(output[graphicsNative]);
const colors = output => {
  const data = bytes(output);
  return Array.from({ length: data.length / 4 },
    (_, i) => data.readUInt32BE(i * 4));
};
const tex = (color = sf.Color.White, n = 1) =>
  new sf.Texture(new sf.Image(size(n, n), color));
async function shader(source = red) {
  const result = new sf.Shader();
  assert.equal(await result.loadFromMemory(source, F), true);
  return result;
}
function draw(output, program, x = 0) {
  output.draw([ pixel(x) ], sf.PrimitiveType.Points, program);
}

test('Shader resources, RenderStates constructors, identity, defaults and bind',
  async () => {
    assert.equal(sf.Shader.isAvailable(), true);
    assert.equal(typeof sf.Shader.isGeometryAvailable(), 'boolean');
    assert.equal(sf.Shader.Type, sf.ShaderType);
    const empty = new sf.Shader();
    assert.equal(empty.getNativeHandle(), 0);
    const program = await shader();
    const states = new sf.RenderStates(program);
    assert.equal(states.shader, program);
    assert.equal(new sf.RenderStates(states).shader, program);
    assert.equal(new sf.RenderStates({ shader: program }).shader, program);
    assert.equal(sf.RenderStates.Default.shader, null);
    const output = target();
    assert.equal(output.setActive(), true);
    sf.Shader.bind(program);
    assert.equal(native.boundShader(), program.getNativeHandle());
    sf.Shader.bind(null);
    assert.equal(native.boundShader(), 0);
    output.clear();
    draw(output, empty);
    draw(output, program, 1);
    output.display();
    assert.deepEqual(colors(output), [ 0xffffffff, 0xff0000ff, 0xff, 0xff ]);
  });

test('file, memory and stream loading support single and paired stages',
  async t => {
    const directory = await mkdtemp(join(tmpdir(), 'sfml-shader-test-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    const paths = [ join(directory, '着色.vert'), join(directory, '着色.frag') ];
    await writeFile(paths[0], vertexSource);
    await writeFile(paths[1], blue);
    const program = new sf.Shader();
    for (const kind of [ 'File', 'Memory', 'Stream' ]) {
      const inputs = () => (kind === 'File' ? paths : kind === 'Memory'
        ? [ vertexSource, blue ]
        : [ vertexSource, blue ].map(code =>
          new sf.MemoryInputStream(Buffer.from(code))));
      for (const args of [ () => [ inputs()[1], F ], inputs,
        () => [ inputs()[0], sf.ShaderType.Vertex ] ]) {
        const loading = program[`loadFrom${kind}`](...args());
        assert.ok(loading instanceof Promise);
        assert.equal(await loading, true);
        assert.ok(program.getNativeHandle() > 0);
      }
    }
    class AsyncStream extends sf.MemoryInputStream {
      async getSize() {
        await setImmediate();
        return super.getSize();
      }
      async seek(position) {
        await setImmediate();
        return super.seek(position);
      }
      async read(data) { await setImmediate(); return super.read(data); }
    }
    assert.equal(await program.loadFromStream(
      new AsyncStream(Buffer.from(blue)), F), true);
    const output = target();
    output.clear();
    draw(output, program);
    output.display();
    assert.equal(colors(output)[0], 0x0000ffff);
  });

test('three-stage load overloads and geometry capability', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'sfml-shader-geometry-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const sources = [
    '#version 150\nvoid main(){gl_Position=vec4(0.0);}',
    '#version 150\nlayout(points) in; layout(points,max_vertices=1) out;' +
      'void main(){gl_Position=gl_in[0].gl_Position;' +
      'EmitVertex();EndPrimitive();}',
    '#version 150\nout vec4 color;void main(){color=vec4(1.0);}',
  ];
  const paths = sources.map((_, i) => join(directory, `${i}.glsl`));
  for (let i = 0; i < 3; i++) await writeFile(paths[i], sources[i]);
  const program = new sf.Shader();
  const expected = sf.Shader.isGeometryAvailable();
  assert.equal(await program.loadFromMemory(...sources), expected);
  assert.equal(await program.loadFromFile(...paths), expected);
  assert.equal(await program.loadFromStream(...sources.map(
    code => new sf.MemoryInputStream(Buffer.from(code)))), expected);
  assert.equal(await program.loadFromMemory(
    sources[1], sf.ShaderType.Geometry), expected);
});

test('failed loads preserve uniforms and program; stream failures propagate',
  async () => {
    const program = await shader(tint);
    program.setUniform('tint', new G.Vec4(sf.Color.Red));
    const handle = program.getNativeHandle();
    assert.equal(await program.loadFromMemory('invalid shader', F), false);
    assert.equal(await program.loadFromFile('/no-such-shader.frag', F), false);
    assert.equal(await program.loadFromStream(
      new sf.MemoryInputStream(), F), false);
    assert.equal(await program.loadFromStream(
      new sf.MemoryInputStream(new Uint8Array()), F), false);
    class ShortStream extends sf.MemoryInputStream {
      read(data) { super.read(data); return 1n; }
    }
    assert.equal(await program.loadFromStream(
      new ShortStream(Buffer.from(red)), F), false);
    class RejectedStream extends sf.MemoryInputStream {
      async read() { throw new Error('stream failed'); }
    }
    await assert.rejects(program.loadFromStream(
      new RejectedStream(Buffer.from(red)), F), /stream failed/);
    assert.equal(program.getNativeHandle(), handle);
    const output = target();
    output.clear();
    draw(output, program);
    output.display();
    assert.equal(colors(output)[0], 0xff0000ff);
  });

const uniforms = [
  [ 'float', 0.25, 'u == 0.25' ],
  [ 'int', 7, 'u == 7', 'int' ],
  [ 'bool', true, 'u' ],
  [ 'vec2', new G.Vec2(0.25, 0.5), 'u == vec2(0.25, 0.5)' ],
  [ 'vec3', new G.Vec3(0.25, 0.5, 0.75), 'u == vec3(0.25, 0.5, 0.75)' ],
  [ 'vec4', new G.Vec4(0.25, 0.5, 0.75, 1), 'u == vec4(0.25, 0.5, 0.75, 1.0)' ],
  [ 'ivec2', new G.Ivec2(2, -3), 'u == ivec2(2, -3)' ],
  [ 'ivec3', new G.Ivec3(2, -3, 4), 'u == ivec3(2, -3, 4)' ],
  [ 'ivec4', new G.Ivec4(2, -3, 4, 5), 'u == ivec4(2, -3, 4, 5)' ],
  [ 'bvec2', new G.Bvec2(true, false), 'u == bvec2(true, false)' ],
  [ 'bvec3', new G.Bvec3(true, false, true), 'u == bvec3(true, false, true)' ],
  [ 'bvec4', new G.Bvec4(true, false, true, false),
    'u == bvec4(true, false, true, false)' ],
  [ 'mat3', new G.Mat3([ 1, 2, 3, 4, 5, 6, 7, 8, 9 ]),
    'u == mat3(1,2,3,4,5,6,7,8,9)' ],
  [ 'mat4', new G.Mat4(Array.from({ length: 16 }, (_, i) => i + 1)),
    'u == mat4(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16)' ],
];
test('every numeric uniform overload reaches GLSL, cold and native-wrapped',
  async () => {
    const output = target();
    for (const [ type, value, condition, explicit ] of uniforms) {
      const program = await shader(`uniform ${type} u; void main() {
        gl_FragColor = (${condition}) ? vec4(0,1,0,1) : vec4(1,0,0,1);
      }`);
      for (const wrapped of [ false, true ]) {
        if (wrapped && typeof value === 'object') {
          assert.ok(value[value instanceof sf.Vector2 ? vector2Native
            : value instanceof sf.Vector3 ? vector3Native : glslNative]);
        }
        if (explicit) program.setUniform('u', value, explicit);
        else program.setUniform('u', value);
        output.clear();
        draw(output, program);
        output.display();
        assert.equal(colors(output)[0], 0x00ff00ff,
          `${type} wrapped=${wrapped}`);
      }
    }
  });

test('six uniform array overloads upload vectors and column-major matrices',
  async () => {
    const output = target();
    for (const [ type, value, condition ] of uniforms.filter(
      ([ type ]) => /^(float|vec|mat)/.test(type))) {
      const program = await shader(`uniform ${type} u[2]; void main() {
        bool ok = (${condition.replaceAll('u ==', 'u[0] ==')}) &&
          (${condition.replaceAll('u ==', 'u[1] ==')});
        gl_FragColor = ok ? vec4(0,1,0,1) : vec4(1,0,0,1);
      }`);
      program.setUniformArray('u', [ value, value ]);
      if (type === 'float') {
        const padded = new Float32Array([ 99, value, value, 99 ]);
        program.setUniformArray('u', padded.subarray(1, 3));
      }
      output.clear();
      draw(output, program);
      output.display();
      assert.equal(colors(output)[0], 0x00ff00ff, type);
      program.setUniformArray('u', []);
    }
  });

const drawTypes = [ 'Sprite', 'VertexArray', 'raw vertices', 'VertexBuffer' ];
for (const [ mode, name ] of drawTypes.entries()) {
  test(`${name} shader draw matches direct SFML pixels`, async () => {
    const program = await shader(`uniform sampler2D current; uniform vec4 tint;
      void main() { gl_FragColor = texture2D(current, gl_TexCoord[0].xy)
        * gl_Color * tint; }`);
    const texture = tex(new sf.Color(255, 128, 192), 4);
    program.setUniform('current', sf.Shader.CurrentTexture);
    program.setUniform('tint', new G.Vec4(0.5, 1, 0.75, 1));
    const states = new sf.RenderStates({
      shader: program, texture, blendMode: sf.BlendNone,
      transform: new sf.Transform().translate(point(2, 1))
        .scale(point(0.75, 1.25)),
    });
    const vertices = [[ 0, 0 ], [ 4, 0 ], [ 0, 4 ], [ 4, 4 ]].map(
      ([ x, y ]) => new sf.Vertex(
        point(x, y), new sf.Color(128, 255, 64), point(x, y)));
    const output = target(8, 8);
    output.clear(new sf.Color(20, 40, 60));
    if (mode === 0) {
      const sprite = new sf.Sprite(texture);
      sprite.setColor(new sf.Color(128, 255, 64));
      output.draw(sprite, states);
    } else if (mode === 1) {
      const array = new sf.VertexArray(sf.PrimitiveType.TriangleStrip);
      vertices.forEach(value => array.append(value));
      output.draw(array, states);
    } else if (mode === 2) {
      output.draw(vertices, sf.PrimitiveType.TriangleStrip, states);
    } else {
      const buffer = new sf.VertexBuffer(sf.PrimitiveType.TriangleStrip);
      assert.equal(buffer.create(4), true);
      assert.equal(buffer.update(vertices), true);
      output.draw(buffer, 0, 4, states);
    }
    output.display();
    assert.deepEqual(bytes(output), native.renderShaderOracle(
      program[graphicsNative], texture[graphicsNative], mode));
    assert.notEqual(colors(output)[10], 0x14283cff);
  });
}

test('uniform, array and reload mutations preserve cross-target snapshots',
  async () => {
    const a = target();
    const b = target();
    const program = await shader(tint);
    program.setUniform('tint', new G.Vec4(sf.Color.Red));
    for (const output of [ a, b ]) { output.clear(); draw(output, program); }
    program.setUniform('tint', new G.Vec4(sf.Color.Green));
    for (const output of [ a, b ]) draw(output, program, 1);
    const loading = program.loadFromMemory(blue, F);
    for (const output of [ a, b ]) draw(output, program, 2);
    assert.equal(await loading, true);
    for (const output of [ a, b ]) {
      draw(output, program, 3);
      output.display();
      assert.deepEqual(colors(output),
        [ 0xff0000ff, 0x00ff00ff, 0x00ff00ff, 0x0000ffff ]);
    }
    assert.equal(await program.loadFromMemory(
      'uniform vec4 c[2]; void main(){gl_FragColor=c[0]+c[1];}', F), true);
    program.setUniformArray('c',
      [ new G.Vec4(1, 0, 0, 0), new G.Vec4(0, 0, 0, 1) ]);
    a.clear();
    draw(a, program);
    program.setUniformArray('c',
      [ new G.Vec4(0, 1, 0, 0), new G.Vec4(0, 0, 0, 1) ]);
    draw(a, program, 1);
    a.display();
    assert.deepEqual(colors(a).slice(0, 2), [ 0xff0000ff, 0x00ff00ff ]);
  });

test('external sampler replacement and Texture mutations preserve snapshots',
  async () => {
    const program = await shader(sampler);
    const first = tex(sf.Color.Red);
    const second = tex(sf.Color.Blue);
    const output = target();
    program.setUniform('source', first);
    output.clear();
    draw(output, program);
    first.update(new sf.Image(size(1), sf.Color.Green));
    draw(output, program, 1);
    program.setUniform('source', second);
    draw(output, program, 2);
    second.swap(first);
    draw(output, program, 3);
    output.display();
    assert.deepEqual(colors(output),
      [ 0xff0000ff, 0x00ff00ff, 0x0000ffff, 0x00ff00ff ]);
  });

test('sampler target dependencies flush consumers and reject feedback/cycles',
  async () => {
    const source = target(1);
    const output = target(2);
    source.clear(sf.Color.Red);
    source.display();
    const program = await shader(sampler);
    program.setUniform('source', source.getTexture());
    output.clear();
    draw(output, program);
    source.clear(sf.Color.Green);
    source.display();
    draw(output, program, 1);
    output.display();
    assert.deepEqual(colors(output), [ 0xff0000ff, 0x00ff00ff ]);
    assert.throws(() => draw(source, program), /own texture/);
    const sprite = new sf.Sprite(tex());
    assert.throws(() => source.draw(sprite, program), /own texture/);
    const buffer = new sf.VertexBuffer();
    buffer.create(1);
    buffer.update([ pixel(0) ]);
    assert.throws(() => source.draw(buffer, program), /own texture/);
    const other = await shader(sampler);
    other.setUniform('source', output.getTexture());
    draw(output, program);
    assert.throws(() => draw(source, other), /Cyclic/);
    output.display();
  });

test('sampler aliases, ignored names and CurrentTexture match SFML retention',
  async () => {
    const program = await shader(
      'uniform sampler2D source[1]; void main(){' +
      'gl_FragColor=texture2D(source[0],vec2(0));}');
    const first = tex(sf.Color.Red);
    const second = tex(sf.Color.Blue);
    program.setUniform('missing', first);
    assert.equal(program[shaderTextures].size, 0);
    program.setUniform('source', first);
    program.setUniform('source[0]', second);
    assert.equal(program[shaderTextures].size, 1);
    assert.deepEqual([ ...program[shaderTextures].values() ], [ second ]);
    program.setUniform('source', sf.Shader.CurrentTexture);
    assert.equal(program[shaderTextures].size, 1);
    program.setUniform('source', 0, 'int');
    assert.equal(program[shaderTextures].size, 1);
    const output = target();
    const sprite = new sf.Sprite(first);
    output.clear();
    output.draw(sprite, program);
    output.display();
    assert.equal(colors(output)[0], 0xff0000ff);
    assert.equal(await program.loadFromMemory(red, F), true);
    assert.equal(program[shaderTextures].size, 0);
  });

test('pending draws retain shaders and sampler owners until submission',
  async () => {
    const output = target();
    let source = target(1);
    source.clear(sf.Color.Red);
    source.display();
    let program = await shader(sampler);
    program.setUniform('source', source.getTexture());
    const references = [ new WeakRef(program), new WeakRef(source) ];
    output.clear();
    draw(output, program);
    source = null;
    program = null;
    await setImmediate();
    global.gc();
    references.forEach(reference => assert.ok(reference.deref()));
    output.display();
    assert.equal(colors(output)[0], 0xff0000ff);
    await setImmediate();
    global.gc();
    references.forEach(reference => assert.equal(reference.deref(), undefined));
    const context = native.createGraphicsContext();
    let mapping = native.createShader(context);
    assert.equal(native.shaderRegistrySize(context), 1);
    assert.ok(mapping.handle);
    mapping = null;
    for (let i = 0; i < 8; i++) { await setImmediate(); global.gc(); }
    assert.equal(native.shaderRegistrySize(context), 0);
  });

test('Shader recording does not call Native and preserves resource selection',
  async t => {
    const a = await shader();
    const b = await shader(blue);
    const output = target();
    const sprite = new sf.Sprite(tex());
    const states = new sf.RenderStates(a);
    const calls = [];
    for (const [ name, fn ] of Object.entries(native)) {
      if (typeof fn === 'function') {
        t.mock.method(native, name, (...args) => {
          calls.push(name);
          return fn(...args);
        });
      }
    }
    output.clear();
    output.draw(sprite, states);
    states.shader = b;
    sprite.setPosition(point(1));
    output.draw(sprite, states);
    assert.deepEqual(calls, []);
    output.display();
    assert.deepEqual(calls, [ 'submitRenderTexture' ]);
    assert.deepEqual(colors(output).slice(0, 2), [ 0xff0000ff, 0x0000ffff ]);
  });

test('invalid Shader input and native IDs reject without partial submission',
  async () => {
    const program = await shader();
    const output = native.createRenderTexture(graphicsContext(), 1, 1);
    const words = new Uint32Array(output.buffer);
    const floats = new Float32Array(output.buffer);
    native.allocateRenderTextureVertices(output.handle, 1);
    words[1] = 0xff0000ff;
    native.submitRenderTexture(output.handle, 1, true);
    words[1] = 0x00ff00ff;
    words[43] = 4;
    words[44] = 0;
    floats.set(sf.Transform.Identity.getMatrix(), 52);
    words.set([ 1, 0, 0, 1, 0, 0, 7, 0, 0, 0xffffffff, 0 ], 68);
    words[85] = 0xffffffff;
    assert.throws(() => native.submitRenderTexture(output.handle, 2, true),
      TypeError);
    assert.equal(native.readRenderTexturePixels(output.handle).readUInt32BE(0),
      0xff0000ff);
    words[85] = program[shaderId];
    native.submitRenderTexture(output.handle, 2, true);
    assert.equal(native.readRenderTexturePixels(output.handle).readUInt32BE(0),
      0x00ff00ff);
    // Bypass JS dependency checks and verify native sampler feedback rejection.
    assert.equal(await program.loadFromMemory(sampler, F), true);
    const view = native.getRenderTextureTexture(output.handle);
    native.setShaderTexture(program[graphicsNative], 'source', view.handle);
    words[1] = 0x0000ffff;
    assert.throws(() => native.submitRenderTexture(output.handle, 2, true),
      TypeError);
    assert.equal(native.readRenderTexturePixels(output.handle).readUInt32BE(0),
      0x00ff00ff);
    assert.throws(() => program.setUniform('x', {}), TypeError);
    assert.throws(() => program.setUniform('x', new sf.Vector2u()), TypeError);
    assert.throws(() => program.setUniform('x', true, 'int'), TypeError);
    assert.throws(() => program.setUniform('x\0', 1), TypeError);
    assert.throws(() => program.setUniformArray('x', [ 1, new G.Vec2() ]),
      TypeError);
    assert.throws(() => program.setUniformArray('x', new Array(1)), TypeError);
    assert.throws(() => program.setUniformArray('x', [ new G.Ivec2() ]),
      TypeError);
    assert.throws(() => sf.Shader.bind({}), TypeError);
    await assert.rejects(program.loadFromMemory(red, 3), RangeError);
    await assert.rejects(program.loadFromMemory(123, F), TypeError);
    await assert.rejects(program.loadFromStream({}, F), TypeError);
    await assert.rejects(program.loadFromFile('x\0', F), TypeError);
    assert.throws(() => native.setShaderUniform(
      program[graphicsNative], 'x', 0, new Float32Array(0), false), RangeError);
  });
