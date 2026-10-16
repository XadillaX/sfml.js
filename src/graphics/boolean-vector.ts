import { BooleanComponents, glslStorage } from '../internal/glsl-value';
import { native } from '../internal/native';
import type { ReadonlyValue as R } from '../internal/value-storage';
import { Vector2 } from '../system/vector2';
import { Vector3 } from '../system/vector3';
import type { ScalarType } from '../internal/scalar';

/** 布尔向量运算基类，数值结果以非零为 true 转换。 */
export abstract class BooleanVector<K extends 'vector2' | 'vector3'>
  extends BooleanComponents<K> {
  protected checkPair(rhs: R<BooleanVector<K>>): void {
    if (!(rhs instanceof BooleanVector) ||
        this[glslStorage].length !== rhs[glslStorage].length) {
      throw new TypeError('Boolean vector operands must have the same dimension');
    }
  }

  /** 计算点积后转换为布尔值；任一对应分量同时为 true 时返回 true。 */
  dot(rhs: R<BooleanVector<K>>): boolean {
    this.checkPair(rhs);
    const a = this[glslStorage];
    const b = rhs[glslStorage];
    let sum = 0;
    for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
    return sum !== 0;
  }

  /** 返回是否至少有一个分量为 true。 */
  lengthSquared(): boolean {
    return this.dot(this);
  }

  protected checkDivisor(rhs: R<BooleanVector<K>>): void {
    this.checkPair(rhs);
    if (rhs[glslStorage].includes(0)) {
      throw new RangeError('Cannot divide by zero');
    }
  }
}

type Source2 = R<Bvec2> | R<Vector2<ScalarType>>;
type Arguments2 = [] | [ x: boolean, y: boolean ] | [ source: Source2 ];

/** sf::Vector2<bool>; each component occupies one canonical 0/1 byte. */
export class Bvec2 extends BooleanVector<'vector2'> {
  /** 创建全 false 向量，指定 x/y，或按非零为 true 转换复制二维向量。 */
  constructor(...args: Arguments2) {
    const source = args[0];
    const components = args.length === 0 || (args.length === 2 &&
      typeof source === 'boolean' && typeof args[1] === 'boolean');
    const copy = args.length === 1 &&
      (source instanceof Bvec2 || source instanceof Vector2);
    if (!components && !copy) {
      throw new TypeError('Expected a boolean pair or a two-dimensional vector');
    }
    super(typeof source === 'object'
      ? [ source.x, source.y ] : [ source ?? false, args[1] ?? false ],
    buffer => native.wrapVector2('bool', buffer));
  }

  /** 返回 (-y, x) 转换为布尔分量后的新向量，即 (y, x)。 */
  perpendicular(): Bvec2 {
    // Negating a bool promotes to int and converts back to the same bool.
    return new Bvec2(this.y, this.x);
  }

  /** 计算二维叉积并按非零为 true 转换。 */
  cross(rhs: R<Bvec2>): boolean {
    this.checkPair(rhs);
    const a = this[glslStorage];
    const b = rhs[glslStorage];
    return a[0] * b[1] - a[1] * b[0] !== 0;
  }

  /** 返回逐分量逻辑与的新向量。 */
  componentWiseMul(rhs: R<Bvec2>): Bvec2 {
    this.checkPair(rhs);
    return new Bvec2(this.x && rhs.x, this.y && rhs.y);
  }

  /** 返回本向量副本；rhs 任一分量为 false 时抛出 RangeError。 */
  componentWiseDiv(rhs: R<Bvec2>): Bvec2 {
    this.checkDivisor(rhs);
    return new Bvec2(this);
  }
}

type Source3 = R<Bvec3> | R<Vector3<ScalarType>>;
type Arguments3 =
  [] | [ x: boolean, y: boolean, z: boolean ] | [ source: Source3 ];

/** sf::Vector3<bool>, sharing the same native family as numeric Vector3. */
export class Bvec3 extends BooleanVector<'vector3'> {
  /** 创建全 false 向量，指定 x/y/z，或按非零为 true 转换复制三维向量。 */
  constructor(...args: Arguments3) {
    const source = args[0];
    const components = args.length === 0 || (args.length === 3 &&
      typeof source === 'boolean' && typeof args[1] === 'boolean' &&
      typeof args[2] === 'boolean');
    const copy = args.length === 1 &&
      (source instanceof Bvec3 || source instanceof Vector3);
    if (!components && !copy) {
      throw new TypeError('Expected a boolean triple or a three-dimensional vector');
    }
    super(typeof source === 'object'
      ? [ source.x, source.y, source.z ]
      : [ source ?? false, args[1] ?? false, args[2] ?? false ],
    buffer => native.wrapVector3('bool', buffer));
  }

  /** Z 布尔分量。 */
  get z(): boolean { return this[glslStorage][2] !== 0; }
  /** 设置 Z 分量，按 0/1 字节存储。 */
  set z(value: boolean) { this[glslStorage][2] = value ? 1 : 0; }

  /** 计算三维叉积后将各分量按非零为 true 转换。 */
  cross(rhs: R<Bvec3>): Bvec3 {
    this.checkPair(rhs);
    const a = this[glslStorage];
    const b = rhs[glslStorage];
    return new Bvec3(
      a[1] * b[2] - a[2] * b[1] !== 0,
      a[2] * b[0] - a[0] * b[2] !== 0,
      a[0] * b[1] - a[1] * b[0] !== 0,
    );
  }

  /** 返回逐分量逻辑与的新向量。 */
  componentWiseMul(rhs: R<Bvec3>): Bvec3 {
    this.checkPair(rhs);
    return new Bvec3(this.x && rhs.x, this.y && rhs.y, this.z && rhs.z);
  }

  /** 返回本向量副本；rhs 任一分量为 false 时抛出 RangeError。 */
  componentWiseDiv(rhs: R<Bvec3>): Bvec3 {
    this.checkDivisor(rhs);
    return new Bvec3(this);
  }
}
