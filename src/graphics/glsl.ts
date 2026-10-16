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

/** SFML's four-dimensional GLSL vectors expose data, not vector arithmetic. */
class Vector4<T extends 'i32' | 'f32'>
  extends GlslValue<'vector4', Int32Array | Float32Array> {
  /** 分量存储类型，i32 或 f32。 */
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

  /** 分量的存储类型：i32 或 f32。 */
  get scalarType(): T { return this.type; }
  /** X 分量。 */
  get x(): number { return this[glslStorage][0]; }
  /** 设置 X 分量，按存储类型转换。 */
  set x(value: number) { this[glslStorage][0] = value; }
  /** Y 分量。 */
  get y(): number { return this[glslStorage][1]; }
  /** 设置 Y 分量，按存储类型转换。 */
  set y(value: number) { this[glslStorage][1] = value; }
  /** Z 分量。 */
  get z(): number { return this[glslStorage][2]; }
  /** 设置 Z 分量，按存储类型转换。 */
  set z(value: number) { this[glslStorage][2] = value; }
  /** W 分量。 */
  get w(): number { return this[glslStorage][3]; }
  /** 设置 W 分量，按存储类型转换。 */
  set w(value: number) { this[glslStorage][3] = value; }
}

/** GLSL vec4，四个 float32 分量。 */
export class Vec4 extends Vector4<'f32'> {
  /** 创建零向量、指定四个分量或复制向量；从 Color 创建时将 RGBA 归一化到 [0, 1]。 */
  constructor(...args: NumericArguments) { super('f32', ...args); }
}

/** GLSL ivec4，四个有符号 32 位整数分量。 */
export class Ivec4 extends Vector4<'i32'> {
  /** 创建零向量、指定四个分量或复制向量；从 Color 创建时保留 0～255 的 RGBA。 */
  constructor(...args: NumericArguments) { super('i32', ...args); }
}

type BooleanArguments =
  | []
  | [ x: boolean, y: boolean, z: boolean, w: boolean ]
  | [ source: Source4 ];

/** GLSL bvec4，四个布尔分量。 */
export class Bvec4 extends BooleanComponents<'vector4'> {
  /** 创建全 false 向量、指定四个分量，或按非零为 true 转换复制向量。 */
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

  /** Z 布尔分量。 */
  get z(): boolean { return this[glslStorage][2] !== 0; }
  /** 设置 Z 分量。 */
  set z(value: boolean) { this[glslStorage][2] = value ? 1 : 0; }
  /** W 布尔分量。 */
  get w(): boolean { return this[glslStorage][3] !== 0; }
  /** 设置 W 分量。 */
  set w(value: boolean) { this[glslStorage][3] = value ? 1 : 0; }
}
