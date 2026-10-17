import {
  GlslValue, BooleanComponents, glslStorage,
} from '../internal/glsl-value';
import { native } from '../internal/native';
import type { ReadonlyValue as R } from '../internal/value-storage';
import { Color } from './color';

export { Vector2f as Vec2, Vector2i as Ivec2 } from '../system/vector2';
export { Vector3f as Vec3, Vector3i as Ivec3 } from '../system/vector3';
export { Bvec2, Bvec3 } from './boolean-vector';
export { Mat3, Mat4 } from './glsl-matrix';

type Source4 = R<Vec4> | R<Ivec4> | R<Bvec4>;
type NumericArguments =
  | []
  | [ x: number, y: number, z: number, w: number ]
  | [ source: Source4 | R<Color> ];

/**
 * SFML's four-dimensional GLSL vectors expose data, not vector arithmetic.
 * @zh SFML 的四维 GLSL 向量只公开数据，不提供向量运算。
 * @ja SFML の四次元 GLSL ベクトルはデータを公開し、ベクトル演算は提供しません。
 * @ko SFML의 4차원 GLSL 벡터는 데이터만 노출하며 벡터 산술 연산은 제공하지 않습니다.
 */
class Vector4<T extends 'i32' | 'f32'>
  extends GlslValue<'vector4', Int32Array | Float32Array> {
  /**
   * Component storage type, i32 or f32.
   * @zh 分量存储类型，i32 或 f32。
   * @ja 成分の格納型。i32 または f32。
   * @ko 성분 저장 형식으로 i32 또는 f32입니다.
   */
  private readonly type: T;

  constructor(type: T, ...args: NumericArguments) {
    super(type === 'f32' ? new Float32Array(4) : new Int32Array(4),
      buffer => native.wrapVector4(type, buffer));
    this.type = type;
    const source = args[0];
    if (source instanceof Vector4 && source.scalarType === type) {
      // Same-scalar copies retain NaN payloads and signed zero verbatim.
      this[glslStorage].set(source[glslStorage]);
      return;
    }
    if (source instanceof Color) {
      const divisor = type === 'f32' ? 255 : 1;
      this.x = source.r / divisor;
      this.y = source.g / divisor;
      this.z = source.b / divisor;
      this.w = source.a / divisor;
    // Both vector classes are initialized before a public constructor runs.
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    } else if (source instanceof Vector4 || source instanceof Bvec4) {
      this.x = Number(source.x);
      this.y = Number(source.y);
      this.z = Number(source.z);
      this.w = Number(source.w);
    } else if (typeof source === 'number' && args.length === 4) {
      this.x = source;
      this.y = args[1];
      this.z = args[2];
      this.w = args[3];
    } else if (args.length !== 0) {
      throw new TypeError('Expected four numbers, a Glsl vector or a Color');
    }
  }

  /**
   * Storage type of components: i32 or f32.
   * @zh 分量的存储类型：i32 或 f32。
   * @ja 成分の格納型。i32 または f32。
   * @ko 성분의 저장 형식은 i32 또는 f32입니다.
   */
  get scalarType(): T { return this.type; }
  /**
   * X component.
   * @zh X 分量。
   * @ja X 成分。
   * @ko X 성분입니다.
   */
  get x(): number { return this[glslStorage][0]; }
  /**
   * Sets the X component, converting to the storage type.
   * @zh 设置 X 分量，按存储类型转换。
   * @ja X 成分を格納型に変換して設定します。
   * @ko X 성분을 저장 형식으로 변환하여 설정합니다.
   */
  set x(value: number) { this[glslStorage][0] = value; }
  /**
   * Y component.
   * @zh Y 分量。
   * @ja Y 成分。
   * @ko Y 성분입니다.
   */
  get y(): number { return this[glslStorage][1]; }
  /**
   * Sets the Y component, converting to the storage type.
   * @zh 设置 Y 分量，按存储类型转换。
   * @ja Y 成分を格納型に変換して設定します。
   * @ko Y 성분을 저장 형식으로 변환하여 설정합니다.
   */
  set y(value: number) { this[glslStorage][1] = value; }
  /**
   * Z component.
   * @zh Z 分量。
   * @ja Z 成分。
   * @ko Z 성분입니다.
   */
  get z(): number { return this[glslStorage][2]; }
  /**
   * Sets the Z component, converting to the storage type.
   * @zh 设置 Z 分量，按存储类型转换。
   * @ja Z 成分を格納型に変換して設定します。
   * @ko Z 성분을 저장 형식으로 변환하여 설정합니다.
   */
  set z(value: number) { this[glslStorage][2] = value; }
  /**
   * W component.
   * @zh W 分量。
   * @ja W 成分。
   * @ko W 성분입니다.
   */
  get w(): number { return this[glslStorage][3]; }
  /**
   * Sets the W component, converting to the storage type.
   * @zh 设置 W 分量，按存储类型转换。
   * @ja W 成分を格納型に変換して設定します。
   * @ko W 성분을 저장 형식으로 변환하여 설정합니다.
   */
  set w(value: number) { this[glslStorage][3] = value; }
}

/**
 * GLSL vec4 with four float32 components.
 * @zh GLSL vec4，四个 float32 分量。
 * @ja 四つの float32 成分を持つ GLSL vec4。
 * @ko float32 성분 4개의 GLSL vec4입니다.
 */
export class Vec4 extends Vector4<'f32'> {
  /**
   * Creates a zero vector, specifies four components, or copies a vector;
   * construction from Color normalizes RGBA to [0, 1].
   * @zh 创建零向量、指定四个分量或复制向量；从 Color 创建时将 RGBA 归一化到 [0, 1]。
   * @ja ゼロベクトルを作成するか、四成分を指定するか、ベクトルをコピーします。Color からの作成では RGBA を [0, 1] に正規化します。
   * @ko 영벡터를 만들거나 네 성분을 지정하거나 벡터를 복사합니다. Color로 만들면 RGBA를 [0, 1]로 정규화합니다.
   */
  constructor(...args: NumericArguments) { super('f32', ...args); }
}

/**
 * GLSL ivec4 with four signed 32-bit integer components.
 * @zh GLSL ivec4，四个有符号 32 位整数分量。
 * @ja 四つの符号付き 32 ビット整数成分を持つ GLSL ivec4。
 * @ko 부호 있는 32비트 정수 성분 4개의 GLSL ivec4입니다.
 */
export class Ivec4 extends Vector4<'i32'> {
  /**
   * Creates a zero vector, specifies four components, or copies a vector;
   * construction from Color preserves RGBA values from 0 to 255.
   * @zh 创建零向量、指定四个分量或复制向量；从 Color 创建时保留 0～255 的 RGBA。
   * @ja ゼロベクトルを作成するか、四成分を指定するか、ベクトルをコピーします。Color からの作成では 0～255 の RGBA を保持します。
   * @ko 영벡터를 만들거나 네 성분을 지정하거나 벡터를 복사합니다. Color로 만들면 0~255의 RGBA 값을 유지합니다.
   */
  constructor(...args: NumericArguments) { super('i32', ...args); }
}

type BooleanArguments =
  | []
  | [ x: boolean, y: boolean, z: boolean, w: boolean ]
  | [ source: Source4 ];

/**
 * GLSL bvec4 with four boolean components.
 * @zh GLSL bvec4，四个布尔分量。
 * @ja 四つのブール成分を持つ GLSL bvec4。
 * @ko 불리언 성분 4개의 GLSL bvec4입니다.
 */
export class Bvec4 extends BooleanComponents<'vector4'> {
  /**
   * Creates an all-false vector, specifies four components, or copies a vector
   * with nonzero converted to true.
   * @zh 创建全 false 向量、指定四个分量，或按非零为 true 转换复制向量。
   * @ja 全成分 false のベクトルを作成するか、四成分を指定するか、非ゼロを true に変換してベクトルをコピーします。
   * @ko 모든 성분이 false인 벡터를 만들거나 네 성분을 지정하거나 0이 아닌 값을 true로 변환하여 벡터를 복사합니다.
   */
  constructor(...args: BooleanArguments) {
    const source = args[0];
    if (source instanceof Vector4 || source instanceof Bvec4) {
      super([ source.x, source.y, source.z, source.w ],
        buffer => native.wrapVector4('bool', buffer));
    } else if (args.length === 0 ||
        (args.length === 4 && args.every(value => typeof value === 'boolean'))) {
      super(args.length === 0 ? [ false, false, false, false ]
        : args as [ boolean, boolean, boolean, boolean ],
      buffer => native.wrapVector4('bool', buffer));
    } else {
      throw new TypeError('Expected four booleans or a four-dimensional vector');
    }
  }

  /**
   * Z boolean component.
   * @zh Z 布尔分量。
   * @ja Z ブール成分。
   * @ko Z 불리언 성분입니다.
   */
  get z(): boolean { return this[glslStorage][2] !== 0; }
  /**
   * Sets the Z component.
   * @zh 设置 Z 分量。
   * @ja Z 成分を設定します。
   * @ko Z 성분을 설정합니다.
   */
  set z(value: boolean) { this[glslStorage][2] = value ? 1 : 0; }
  /**
   * W boolean component.
   * @zh W 布尔分量。
   * @ja W ブール成分。
   * @ko W 불리언 성분입니다.
   */
  get w(): boolean { return this[glslStorage][3] !== 0; }
  /**
   * Sets the W component.
   * @zh 设置 W 分量。
   * @ja W 成分を設定します。
   * @ko W 성분을 설정합니다.
   */
  set w(value: boolean) { this[glslStorage][3] = value ? 1 : 0; }
}
