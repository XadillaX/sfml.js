import {
  Shader, ShaderType, RenderStates, RenderTexture, Texture, Sprite,
  Vector2u, Vector2f, MemoryInputStream, Glsl, Transform,
  type ReadonlyShader, type ReadonlyRenderStates, type ReadonlyValue,
} from '../src';

const shader = new Shader();
const read: ReadonlyShader = shader;
const states: ReadonlyRenderStates = new RenderStates(read);
const target = new RenderTexture(new Vector2u(4, 4));
const texture = new Texture(new Vector2u(1, 1));
target.draw(new Sprite(texture), read);
target.draw(new Sprite(texture), { shader: read });
new RenderStates(states).shader = shader;
const loads: Promise<boolean>[] = [
  shader.loadFromMemory('', ShaderType.Fragment),
  shader.loadFromMemory('', ''),
  shader.loadFromMemory('', '', ''),
  shader.loadFromFile('', Shader.Type.Vertex),
  shader.loadFromFile('', ''),
  shader.loadFromFile('', '', ''),
  shader.loadFromStream(new MemoryInputStream(), ShaderType.Geometry),
  shader.loadFromStream(new MemoryInputStream(), new MemoryInputStream()),
  shader.loadFromStream(new MemoryInputStream(), new MemoryInputStream(),
    new MemoryInputStream()),
];
shader.setUniform('float', 1);
shader.setUniform('int', 1, 'int');
shader.setUniform('float', 1, 'float');
shader.setUniform('bool', true);
shader.setUniform('vec2', new Glsl.Vec2());
shader.setUniform('vec3', new Glsl.Vec3());
shader.setUniform('vec4', new Glsl.Vec4());
shader.setUniform('ivec2', new Glsl.Ivec2());
shader.setUniform('ivec3', new Glsl.Ivec3());
shader.setUniform('ivec4', new Glsl.Ivec4());
shader.setUniform('bvec2', new Glsl.Bvec2());
shader.setUniform('bvec3', new Glsl.Bvec3());
shader.setUniform('bvec4', new Glsl.Bvec4());
shader.setUniform('mat3', new Glsl.Mat3(Transform.Identity));
shader.setUniform('mat4', new Glsl.Mat4(Transform.Identity));
shader.setUniform('texture', target.getTexture());
shader.setUniform('texture', Shader.CurrentTexture);
const point: ReadonlyValue<Vector2f> = new Vector2f();
shader.setUniform('readonly', point);
shader.setUniformArray('float', new Float32Array(2));
shader.setUniformArray('float', [ 1, 2 ]);
shader.setUniformArray('vec2', [ point ]);
shader.setUniformArray('vec3', [ new Glsl.Vec3() ]);
shader.setUniformArray('vec4', [ new Glsl.Vec4() ]);
shader.setUniformArray('mat3', [ new Glsl.Mat3(Transform.Identity) ]);
shader.setUniformArray('mat4', [ new Glsl.Mat4(Transform.Identity) ]);
Shader.bind(read);
Shader.bind(null);
const handle: number = read.getNativeHandle();
const availability: boolean = Shader.isAvailable() && Shader.isGeometryAvailable();
// @ts-expect-error No synchronous loading constructors.
new Shader('source', ShaderType.Fragment);
// @ts-expect-error Shader is noncopyable.
new Shader(shader);
// @ts-expect-error Const resources do not expose uniform setters.
read.setUniform('x', 1);
// @ts-expect-error Integer scalar disambiguation requires a number.
shader.setUniform('x', true, 'int');
// @ts-expect-error Unsigned vectors are not GLSL uniform overloads.
shader.setUniform('x', new Vector2u());
// @ts-expect-error Integer vector arrays have no SFML overload.
shader.setUniformArray('x', [ new Glsl.Ivec2() ]);
// @ts-expect-error Native handles are not Shader resources.
new RenderStates({ shader: 1 });
void [ loads, handle, availability ];
