import { resolve } from 'node:path';
import { native, type NativeGraphicsHandle } from '../internal/native';
import {
  flushGraphics, graphicsContext, graphicsNative, shaderId, shaderTextures,
} from '../internal/graphics-state';
import {
  vector2Storage, vector3Storage, type ReadonlyValue as R,
} from '../internal/value-storage';
import { glslStorage } from '../internal/glsl-value';
import { InputStream } from '../system/input-stream';
import { Texture, type ReadonlyTexture } from './texture';
import * as Glsl from './glsl';

/** GLSL 着色器阶段。 */
export enum ShaderType {
  /** 顶点处理阶段。 */
  Vertex,
  /** 几何图元处理阶段。 */
  Geometry,
  /** 片元颜色处理阶段。 */
  Fragment,
}

type Uniform = number | boolean | R<Glsl.Vec2> | R<Glsl.Vec3> | R<Glsl.Vec4> |
R<Glsl.Ivec2> | R<Glsl.Ivec3> | R<Glsl.Ivec4> |
R<Glsl.Bvec2> | R<Glsl.Bvec3> | R<Glsl.Bvec4> |
R<Glsl.Mat3> | R<Glsl.Mat4> | ReadonlyTexture | typeof Shader.CurrentTexture;
type ArrayElement = number | R<Glsl.Vec2> | R<Glsl.Vec3> | R<Glsl.Vec4> |
R<Glsl.Mat3> | R<Glsl.Mat4>;
type Sources<T> = [ T, ShaderType ] | [ T, T ] | [ T, T, T ];

/** 同一个着色器程序的只读接口。 */
export type ReadonlyShader = Readonly<Pick<Shader,
typeof graphicsNative | typeof shaderId | typeof shaderTextures |
'getNativeHandle'>>;

function nameString(name: string): void {
  if (typeof name !== 'string' || name.includes('\0')) {
    throw new TypeError('Expected a uniform name without null bytes');
  }
}

function numeric(value: Uniform): { type: number; data: Float32Array | Int32Array } {
  if (typeof value === 'number') return { type: 0, data: new Float32Array([ value ]) };
  if (typeof value === 'boolean') return { type: 2, data: new Int32Array([ +value ]) };
  if (value instanceof Glsl.Vec2) return { type: 3, data: value[vector2Storage] as Float32Array };
  if (value instanceof Glsl.Vec3) return { type: 4, data: value[vector3Storage] as Float32Array };
  if (value instanceof Glsl.Vec4) return { type: 5, data: value[glslStorage] as Float32Array };
  if (value instanceof Glsl.Ivec2) return { type: 6, data: value[vector2Storage] as Int32Array };
  if (value instanceof Glsl.Ivec3) return { type: 7, data: value[vector3Storage] as Int32Array };
  if (value instanceof Glsl.Ivec4) return { type: 8, data: value[glslStorage] as Int32Array };
  if (value instanceof Glsl.Bvec2) return { type: 9, data: new Int32Array(value[glslStorage]) };
  if (value instanceof Glsl.Bvec3) return { type: 10, data: new Int32Array(value[glslStorage]) };
  if (value instanceof Glsl.Bvec4) return { type: 11, data: new Int32Array(value[glslStorage]) };
  if (value instanceof Glsl.Mat3) return { type: 12, data: value[glslStorage] };
  if (value instanceof Glsl.Mat4) return { type: 13, data: value[glslStorage] };
  throw new TypeError('Expected a Shader uniform value');
}

/** Native-owned program; source loading and compilation run asynchronously. */
export class Shader {
  /** 着色器阶段枚举。 */
  static readonly Type = ShaderType;
  /** uniform 纹理占位符，绘制时使用当前对象绑定的纹理。 */
  static readonly CurrentTexture: unique symbol = Symbol('Shader.CurrentTexture');
  readonly [graphicsNative]: NativeGraphicsHandle<'shader'>;
  readonly [shaderId]: number;
  /** OpenGL 程序标识的只读 Uint32 包装。 */
  private readonly program: Uint32Array;
  /** 已设置 uniform 的纹理引用，防止被 GC 回收。 */
  private readonly textures = new Map<number, ReadonlyTexture>();

  /** 创建尚未编译程序的空着色器。 */
  constructor() {
    const mapping = native.createShader(graphicsContext());
    this[graphicsNative] = mapping.handle;
    this[shaderId] = mapping.id;
    this.program = new Uint32Array(mapping.buffer);
  }

  get [shaderTextures](): ReadonlyMap<number, ReadonlyTexture> {
    return this.textures;
  }

  /** 异步编译文件；参数为文件及阶段、顶点/片元文件，或顶点/几何/片元文件。 */
  loadFromFile(...sources: Sources<string>): Promise<boolean> {
    return this.load(false, sources);
  }

  /** 异步编译 GLSL 源码；参数顺序同 loadFromFile，返回编译链接是否成功。 */
  loadFromMemory(...sources: Sources<string>): Promise<boolean> {
    return this.load(true, sources);
  }

  /** 从输入流读取 UTF-8 GLSL 并异步编译，阶段顺序同 loadFromFile。 */
  async loadFromStream(...sources: Sources<InputStream>): Promise<boolean> {
    const stages = this.stages(sources);
    const code: (string | null)[] = [ null, null, null ];
    for (let i = 0; i < 3; i++) {
      const stream = stages[i];
      if (stream === null) continue;
      if (!(stream instanceof InputStream)) throw new TypeError('Expected an InputStream');
      const size = await stream.getSize();
      if (size === undefined || size === 0n) return false;
      if (typeof size !== 'bigint' || size < 0n || size > 0x7fffffffn) {
        throw new RangeError('Shader stream size exceeds the buffer limit');
      }
      if (await stream.seek(0n) === undefined) return false;
      const bytes = new Uint8Array(Number(size));
      if (await stream.read(bytes) !== size) return false;
      code[i] = Buffer.from(bytes.buffer).toString('utf8');
    }
    return this.compile(true, code);
  }

  /** 设置 uniform，number 默认为 float；纹理参数会保留引用，其他值同步复制。 */
  setUniform(name: string, value: Uniform): void;
  /** 设置数值 uniform，显式指定 GLSL float 或 int；先提交已录制绘制。 */
  setUniform(name: string, value: number, type: 'float' | 'int'): void;
  setUniform(name: string, value: Uniform, scalarType?: 'float' | 'int'): void {
    nameString(name);
    if (scalarType !== undefined &&
        (typeof value !== 'number' || ![ 'float', 'int' ].includes(scalarType))) {
      throw new TypeError('Expected a numeric uniform and float or int type');
    }
    if (value instanceof Texture || value === Shader.CurrentTexture) {
      flushGraphics();
      const location = native.setShaderTexture(this[graphicsNative], name,
        value instanceof Texture ? value[graphicsNative] : null);
      if (value instanceof Texture && location !== undefined) {
        this.textures.set(location, value);
      }
      return;
    }
    const { type, data } = scalarType === 'int'
      ? { type: 1, data: new Int32Array([ value as number ]) } : numeric(value);
    flushGraphics();
    native.setShaderUniform(this[graphicsNative], name, type, data, false);
  }

  /** 同步上传同类型的 float、浮点向量或矩阵数组，先提交已录制绘制。 */
  setUniformArray(name: string, values: Float32Array | readonly ArrayElement[]): void {
    nameString(name);
    let type = 0;
    let data: Float32Array;
    if (values instanceof Float32Array) data = values;
    else {
      if (!Array.isArray(values)) throw new TypeError('Expected a uniform array');
      const parts = Array.from(values, value => numeric(value));
      if (parts.length) type = parts[0].type;
      if (![ 0, 3, 4, 5, 12, 13 ].includes(type) ||
          parts.some(part => part.type !== type)) {
        throw new TypeError('Expected a homogeneous float, vector or matrix array');
      }
      const size = parts[0]?.data.length ?? 1;
      data = new Float32Array(parts.length * size);
      parts.forEach((part, i) => data.set(part.data, i * size));
    }
    flushGraphics();
    native.setShaderUniform(this[graphicsNative], name, type, data, true);
  }

  /** 返回 OpenGL 程序标识；尚未编译成功时为 0。 */
  getNativeHandle(): number {
    return this.program[0];
  }

  /** 为直接 OpenGL 操作绑定程序；null 解除绑定。 */
  static bind(shader: ReadonlyShader | null): void {
    if (shader !== null && !(shader instanceof Shader)) {
      throw new TypeError('Expected a Shader or null');
    }
    native.bindShader(shader?.[graphicsNative] ?? null);
  }

  /** 返回当前环境是否支持着色器。 */
  static isAvailable(): boolean { return native.isShaderAvailable(false); }
  /** 返回当前环境是否支持几何着色器。 */
  static isGeometryAvailable(): boolean { return native.isShaderAvailable(true); }

  /** 将阶段参数标准化为 [vertex, geometry, fragment] 三元组。 */
  private stages<T>(sources: Sources<T>): (T | null)[] {
    if (sources.length === 2 && typeof sources[1] === 'number') {
      if (!Number.isInteger(sources[1]) || sources[1] < 0 || sources[1] > 2) {
        throw new RangeError('Invalid shader type');
      }
      const result: (T | null)[] = [ null, null, null ];
      result[sources[1]] = sources[0];
      return result;
    }
    if (sources.length === 2) return [ sources[0], null, sources[1] as T ];
    if (sources.length === 3) return sources as T[];
    throw new TypeError('Expected a shader source and type, or two/three sources');
  }

  /** 从文件或内存加载源码并编译。 */
  private async load(memory: boolean, sources: Sources<string>): Promise<boolean> {
    const stages = this.stages(sources).map(source => {
      if (source === null) return null;
      if (typeof source !== 'string') throw new TypeError('Expected shader source strings');
      if (!memory && source.includes('\0')) throw new TypeError('Invalid shader path');
      return memory || !source ? source : resolve(source);
    });
    return this.compile(memory, stages);
  }

  /** 异步编译并链接着色器程序。 */
  private compile(memory: boolean, sources: (string | null)[]): Promise<boolean> {
    return new Promise((resolve, reject) => {
      native.compileShader(memory, sources, (error, program) => {
        if (error) return reject(error);
        if (!program) return resolve(false);
        try {
          flushGraphics();
          native.commitShader(this[graphicsNative], program);
          this.textures.clear();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
