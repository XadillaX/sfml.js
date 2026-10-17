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

/**
 * GLSL shader stages.
 * @zh GLSL 着色器阶段。
 * @ja GLSL シェーダーステージ。
 * @ko GLSL 셰이더 단계입니다.
 */
export enum ShaderType {
  /**
   * Vertex processing stage.
   * @zh 顶点处理阶段。
   * @ja 頂点処理ステージ。
   * @ko 꼭짓점 처리 단계입니다.
   */
  Vertex,
  /**
   * Geometry primitive processing stage.
   * @zh 几何图元处理阶段。
   * @ja ジオメトリプリミティブ処理ステージ。
   * @ko 기하 프리미티브 처리 단계입니다.
   */
  Geometry,
  /**
   * Fragment color processing stage.
   * @zh 片元颜色处理阶段。
   * @ja フラグメント色処理ステージ。
   * @ko 프래그먼트 색상 처리 단계입니다.
   */
  Fragment,
}

type Uniform = number | boolean | R<Glsl.Vec2> | R<Glsl.Vec3> | R<Glsl.Vec4> |
R<Glsl.Ivec2> | R<Glsl.Ivec3> | R<Glsl.Ivec4> |
R<Glsl.Bvec2> | R<Glsl.Bvec3> | R<Glsl.Bvec4> |
R<Glsl.Mat3> | R<Glsl.Mat4> | ReadonlyTexture | typeof Shader.CurrentTexture;
type ArrayElement = number | R<Glsl.Vec2> | R<Glsl.Vec3> | R<Glsl.Vec4> |
R<Glsl.Mat3> | R<Glsl.Mat4>;
type Sources<T> = [ T, ShaderType ] | [ T, T ] | [ T, T, T ];

/**
 * Read-only interface to the same shader program.
 * @zh 同一个着色器程序的只读接口。
 * @ja 同じシェーダープログラムへの読み取り専用インターフェース。
 * @ko 동일한 셰이더 프로그램의 읽기 전용 인터페이스입니다.
 */
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

/**
 * Native-owned program; source loading and compilation run asynchronously.
 * @zh 原生层拥有的程序；源码加载和编译异步执行。
 * @ja ネイティブ所有のプログラム。ソースの読み込みとコンパイルは非同期に実行されます。
 * @ko 네이티브 소유 프로그램입니다. 소스 로드와 컴파일은 비동기로 실행됩니다.
 */
export class Shader {
  /**
   * Shader stage enumeration.
   * @zh 着色器阶段枚举。
   * @ja シェーダーステージの列挙型。
   * @ko 셰이더 단계 열거형입니다.
   */
  static readonly Type = ShaderType;
  /**
   * Texture uniform placeholder using the texture bound to the current object
   * at draw time.
   * @zh uniform 纹理占位符，绘制时使用当前对象绑定的纹理。
   * @ja 描画時に現在のオブジェクトにバインドされたテクスチャを使う uniform テクスチャのプレースホルダー。
   * @ko 그릴 때 현재 객체에 바인딩된 텍스처를 사용하는 텍스처 uniform 자리표시자입니다.
   */
  static readonly CurrentTexture: unique symbol = Symbol('Shader.CurrentTexture');
  readonly [graphicsNative]: NativeGraphicsHandle<'shader'>;
  readonly [shaderId]: number;
  /**
   * Read-only Uint32 wrapper for the OpenGL program identifier.
   * @zh OpenGL 程序标识的只读 Uint32 包装。
   * @ja OpenGL プログラム識別子の読み取り専用 Uint32 ラッパー。
   * @ko OpenGL 프로그램 식별자의 읽기 전용 Uint32 래퍼입니다.
   */
  private readonly program: Uint32Array;
  /**
   * Texture references set as uniforms, preventing garbage collection.
   * @zh 已设置 uniform 的纹理引用，防止被 GC 回收。
   * @ja GC による回収を防ぐ、uniform に設定されたテクスチャ参照。
   * @ko GC 수거를 방지하는 uniform에 설정된 텍스처 참조입니다.
   */
  private readonly textures = new Map<number, ReadonlyTexture>();

  /**
   * Creates an empty shader with no compiled program.
   * @zh 创建尚未编译程序的空着色器。
   * @ja コンパイル済みプログラムのない空のシェーダーを作成します。
   * @ko 컴파일된 프로그램이 없는 빈 셰이더를 만듭니다.
   */
  constructor() {
    const mapping = native.createShader(graphicsContext());
    this[graphicsNative] = mapping.handle;
    this[shaderId] = mapping.id;
    this.program = new Uint32Array(mapping.buffer);
  }

  get [shaderTextures](): ReadonlyMap<number, ReadonlyTexture> {
    return this.textures;
  }

  /**
   * Compiles files asynchronously; accepts a file and stage, vertex/fragment
   * files, or vertex/geometry/fragment files.
   * @zh 异步编译文件；参数为文件及阶段、顶点/片元文件，或顶点/几何/片元文件。
   * @ja ファイルを非同期にコンパイルします。引数はファイルとステージ、頂点/フラグメントファイル、または頂点/ジオメトリ/フラグメントファイルです。
   * @ko 파일을 비동기로 컴파일합니다. 인수는 파일과 단계, 꼭짓점/프래그먼트 파일 또는 꼭짓점/기하/프래그먼트 파일입니다.
   */
  loadFromFile(...sources: Sources<string>): Promise<boolean> {
    return this.load(false, sources);
  }

  /**
   * Compiles GLSL source asynchronously; argument order matches loadFromFile.
   * Returns whether compilation and linking succeeded.
   * @zh 异步编译 GLSL 源码；参数顺序同 loadFromFile，返回编译链接是否成功。
   * @ja GLSL ソースを非同期にコンパイルします。引数順は loadFromFile と同じです。コンパイルとリンクが成功したかを返します。
   * @ko GLSL 소스를 비동기로 컴파일합니다. 인수 순서는 loadFromFile과 같으며 컴파일 및 링크 성공 여부를 반환합니다.
   */
  loadFromMemory(...sources: Sources<string>): Promise<boolean> {
    return this.load(true, sources);
  }

  /**
   * Reads UTF-8 GLSL from input streams and compiles asynchronously; stage
   * order matches loadFromFile.
   * @zh 从输入流读取 UTF-8 GLSL 并异步编译，阶段顺序同 loadFromFile。
   * @ja 入力ストリームから UTF-8 GLSL を読み、非同期にコンパイルします。ステージ順は loadFromFile と同じです。
   * @ko 입력 스트림에서 UTF-8 GLSL을 읽고 비동기로 컴파일합니다. 단계 순서는 loadFromFile과 같습니다.
   */
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

  /**
   * Sets a uniform; number defaults to float. Texture arguments retain
   * references; other values are copied synchronously.
   * @zh 设置 uniform，number 默认为 float；纹理参数会保留引用，其他值同步复制。
   * @ja uniform を設定します。number の既定は float です。テクスチャ引数は参照を保持し、他の値は同期的にコピーします。
   * @ko uniform을 설정합니다. number의 기본 형식은 float입니다. 텍스처 인수는 참조를 유지하고 다른 값은 동기적으로
   * 복사합니다.
   */
  setUniform(name: string, value: Uniform): void;
  /**
   * Sets a numeric uniform explicitly as GLSL float or int, first submitting
   * recorded draws.
   * @zh 设置数值 uniform，显式指定 GLSL float 或 int；先提交已录制绘制。
   * @ja 記録済み描画を先に送信してから、GLSL float または int を明示して数値 uniform を設定します。
   * @ko 기록된 그리기를 먼저 제출한 후 GLSL float 또는 int를 명시하여 숫자 uniform을 설정합니다.
   */
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

  /**
   * Synchronously uploads a homogeneous array of floats, floating-point vectors
   * or matrices, first submitting recorded draws.
   * @zh 同步上传同类型的 float、浮点向量或矩阵数组，先提交已录制绘制。
   * @ja 記録済み描画を先に送信し、同じ型の float、浮動小数点ベクトル、または行列の配列を同期的にアップロードします。
   * @ko 기록된 그리기를 먼저 제출한 후 동일 형식의 float, 부동소수점 벡터 또는 행렬 배열을 동기적으로 업로드합니다.
   */
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

  /**
   * Returns the OpenGL program identifier, or 0 if compilation has not
   * succeeded.
   * @zh 返回 OpenGL 程序标识；尚未编译成功时为 0。
   * @ja OpenGL プログラム識別子を返します。コンパイルがまだ成功していなければ 0 です。
   * @ko OpenGL 프로그램 식별자를 반환합니다. 아직 컴파일에 성공하지 않았으면 0입니다.
   */
  getNativeHandle(): number {
    return this.program[0];
  }

  /**
   * Binds a program for direct OpenGL operations; null unbinds it.
   * @zh 为直接 OpenGL 操作绑定程序；null 解除绑定。
   * @ja OpenGL 直接操作用にプログラムをバインドします。null はバインドを解除します。
   * @ko 직접 OpenGL 작업을 위해 프로그램을 바인딩합니다. null은 바인딩을 해제합니다.
   */
  static bind(shader: ReadonlyShader | null): void {
    if (shader !== null && !(shader instanceof Shader)) {
      throw new TypeError('Expected a Shader or null');
    }
    native.bindShader(shader?.[graphicsNative] ?? null);
  }

  /**
   * Returns whether the current environment supports shaders.
   * @zh 返回当前环境是否支持着色器。
   * @ja 現在の環境がシェーダーに対応しているかを返します。
   * @ko 현재 환경의 셰이더 지원 여부를 반환합니다.
   */
  static isAvailable(): boolean { return native.isShaderAvailable(false); }
  /**
   * Returns whether the current environment supports geometry shaders.
   * @zh 返回当前环境是否支持几何着色器。
   * @ja 現在の環境がジオメトリシェーダーに対応しているかを返します。
   * @ko 현재 환경의 기하 셰이더 지원 여부를 반환합니다.
   */
  static isGeometryAvailable(): boolean { return native.isShaderAvailable(true); }

  /**
   * Normalizes stage arguments into a [vertex, geometry, fragment] tuple.
   * @zh 将阶段参数标准化为 [vertex, geometry, fragment] 三元组。
   * @ja ステージ引数を [vertex, geometry, fragment] の組に正規化します。
   * @ko 단계 인수를 [vertex, geometry, fragment] 튜플로 정규화합니다.
   */
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

  /**
   * Loads source from files or memory and compiles it.
   * @zh 从文件或内存加载源码并编译。
   * @ja ファイルまたはメモリからソースを読み込み、コンパイルします。
   * @ko 파일 또는 메모리에서 소스를 로드하고 컴파일합니다.
   */
  private async load(memory: boolean, sources: Sources<string>): Promise<boolean> {
    const stages = this.stages(sources).map(source => {
      if (source === null) return null;
      if (typeof source !== 'string') throw new TypeError('Expected shader source strings');
      if (!memory && source.includes('\0')) throw new TypeError('Invalid shader path');
      return memory || !source ? source : resolve(source);
    });
    return this.compile(memory, stages);
  }

  /**
   * Compiles and links a shader program asynchronously.
   * @zh 异步编译并链接着色器程序。
   * @ja シェーダープログラムを非同期にコンパイルしてリンクします。
   * @ko 셰이더 프로그램을 비동기로 컴파일하고 링크합니다.
   */
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
