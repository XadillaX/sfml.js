import { Angle, positiveRemainder, radians } from './angle';
import { Time, checkedMicroseconds, scaleTime, remainderTime } from './time';
import { Vector2, Vector2i, Vector2u, Vector2f } from './vector2';
import { Vector3, Vector3i, Vector3u, Vector3f } from './vector3';
import { Color } from '../graphics/color';
import { Rect, FloatRect, IntRect } from '../graphics/rect';
import { Transform } from '../graphics/transform';
import { BlendMode } from '../graphics/blend-mode';
import { StencilMode } from '../graphics/stencil-mode';
import { VideoMode, compareVideoModes } from '../window/video-mode';
import { IpAddress } from '../network/ip-address';
import { Bvec2, Bvec3, BooleanVector } from '../graphics/boolean-vector';
import { glslStorage } from '../internal/glsl-value';
import {
  type ScalarType, type Scalar, type ScalarArray, type NumberScalar,
  toScalar, scalarProduct, isBigIntScalar, convertScalar,
} from '../internal/scalar';
import {
  angleStorage, timeStorage, vector2Storage, vector3Storage, colorStorage,
  rectStorage, transformStorage,
  type ReadonlyValue as R,
} from '../internal/value-storage';

type Intersect<U> = (U extends unknown ? (value: U) => void : never) extends
((value: infer I) => void) ? I : never;
type VectorAddition = Intersect<{ [T in ScalarType]: {
  (left: R<Vector2<T>>, right: R<Vector2<T>>): Vector2<T>;
  (left: R<Vector3<T>>, right: R<Vector3<T>>): Vector3<T>;
} }[ScalarType]>;
type VectorAdditionAssign = Intersect<{ [T in ScalarType]: {
  (left: Vector2<T>, right: R<Vector2<T>>): Vector2<T>;
  (left: Vector3<T>, right: R<Vector3<T>>): Vector3<T>;
} }[ScalarType]>;
type VectorNegation = Intersect<{ [T in ScalarType]: {
  (value: R<Vector2<T>>): Vector2<T>;
  (value: R<Vector3<T>>): Vector3<T>;
} }[ScalarType]>;
type VectorScale = Intersect<{ [T in ScalarType]: {
  (left: R<Vector2<T>>, right: Scalar<T>): Vector2<T>;
  (left: R<Vector3<T>>, right: Scalar<T>): Vector3<T>;
} }[ScalarType]>;
type VectorScaleAssign = Intersect<{ [T in ScalarType]: {
  (left: Vector2<T>, right: Scalar<T>): Vector2<T>;
  (left: Vector3<T>, right: Scalar<T>): Vector3<T>;
} }[ScalarType]>;
type VectorLeftScale = Intersect<{ [T in ScalarType]: {
  (left: Scalar<T>, right: R<Vector2<T>>): Vector2<T>;
  (left: Scalar<T>, right: R<Vector3<T>>): Vector3<T>;
} }[ScalarType]>;
type VectorEquality = Intersect<{ [T in ScalarType]: {
  (left: R<Vector2<T>>, right: R<Vector2<T>>): boolean;
  (left: R<Vector3<T>>, right: R<Vector3<T>>): boolean;
} }[ScalarType]>;

interface Addition extends VectorAddition {
  (left: R<Bvec2>, right: R<Bvec2>): Bvec2;
  (left: R<Bvec3>, right: R<Bvec3>): Bvec3;
  (left: R<Time>, right: R<Time>): Time;
  (left: R<Color>, right: R<Color>): Color;
  (left: R<Angle>, right: R<Angle>): Angle;
}

interface AdditionAssign extends VectorAdditionAssign {
  (left: Bvec2, right: R<Bvec2>): Bvec2;
  (left: Bvec3, right: R<Bvec3>): Bvec3;
  (left: Time, right: R<Time>): Time;
  (left: Color, right: R<Color>): Color;
  (left: Angle, right: R<Angle>): Angle;
}

interface Negation extends VectorNegation {
  (value: R<Bvec2>): Bvec2;
  (value: R<Bvec3>): Bvec3;
  (value: R<Time>): Time;
  (value: R<Angle>): Angle;
}

interface Scale extends VectorScale {
  (left: R<Bvec2>, right: boolean): Bvec2;
  (left: R<Bvec3>, right: boolean): Bvec3;
  (left: R<Time>, right: number | bigint): Time;
  (left: R<Angle>, right: number): Angle;
}

interface ScaleAssign extends VectorScaleAssign {
  (left: Bvec2, right: boolean): Bvec2;
  (left: Bvec3, right: boolean): Bvec3;
  (left: Time, right: number | bigint): Time;
  (left: Angle, right: number): Angle;
}

interface LeftScale extends VectorLeftScale {
  (left: boolean, right: R<Bvec2>): Bvec2;
  (left: boolean, right: R<Bvec3>): Bvec3;
  (left: number | bigint, right: R<Time>): Time;
  (left: number, right: R<Angle>): Angle;
}

interface Equality extends VectorEquality {
  (left: IpAddress, right: IpAddress): boolean;
  (left: Readonly<VideoMode>, right: Readonly<VideoMode>): boolean;
  (left: Readonly<BlendMode>, right: Readonly<BlendMode>): boolean;
  (left: Readonly<StencilMode>, right: Readonly<StencilMode>): boolean;
  (left: R<Transform>, right: R<Transform>): boolean;
  (left: R<Bvec2>, right: R<Bvec2>): boolean;
  (left: R<Bvec3>, right: R<Bvec3>): boolean;
  (left: R<Time>, right: R<Time>): boolean;
  (left: R<FloatRect>, right: R<FloatRect>): boolean;
  (left: R<IntRect>, right: R<IntRect>): boolean;
  (left: R<Color>, right: R<Color>): boolean;
  (left: R<Angle>, right: R<Angle>): boolean;
}

type Value =
  | Time | Angle | Color | Vector2<ScalarType> | Vector3<ScalarType>
  | Bvec2 | Bvec3;
type Input =
  | R<Time> | R<Angle> | R<Color>
  | R<Vector2<ScalarType>> | R<Vector3<ScalarType>> | R<Bvec2> | R<Bvec3>;

function storage(value: Input) {
  if (value instanceof BooleanVector) return value[glslStorage];
  if (value instanceof Color) return value[colorStorage];
  if (value instanceof Angle) return value[angleStorage];
  if (value instanceof Vector2) return value[vector2Storage];
  if (value instanceof Vector3) return value[vector3Storage];
  throw new TypeError('Expected an Angle, Color, Vector2 or Vector3');
}

function scalarType(value: Input): ScalarType | 'bool' {
  if (value instanceof BooleanVector) return 'bool';
  if (value instanceof Angle) return 'f32';
  if (value instanceof Vector2 || value instanceof Vector3) {
    return value.scalarType;
  }
  throw new TypeError('Expected an Angle, Vector2 or Vector3');
}

function checkPair(left: Input, right: Input): void {
  if (left instanceof Time || right instanceof Time) {
    if (!(left instanceof Time) || !(right instanceof Time)) {
      throw new TypeError('Time operands must both be times');
    }
    return;
  }
  if (left instanceof Color || right instanceof Color) {
    if (!(left instanceof Color) || !(right instanceof Color)) {
      throw new TypeError('Color operands must both be colors');
    }
    return;
  }
  if (storage(left).length !== storage(right).length ||
      scalarType(left) !== scalarType(right)) {
    throw new TypeError('Operands must have the same value and scalar type');
  }
}

function copy(value: Input): Value {
  if (value instanceof Bvec2) return new Bvec2(value);
  if (value instanceof Bvec3) return new Bvec3(value);
  if (value instanceof Time) return new Time(value);
  if (value instanceof Color) return new Color(value);
  if (value instanceof Angle) return new Angle(value);
  if (value instanceof Vector2i) return new Vector2i(value);
  if (value instanceof Vector2u) return new Vector2u(value);
  if (value instanceof Vector2f) return new Vector2f(value);
  if (value instanceof Vector3i) return new Vector3i(value);
  if (value instanceof Vector3u) return new Vector3u(value);
  if (value instanceof Vector3f) return new Vector3f(value);
  if (value instanceof Vector2) return new Vector2(value);
  if (value instanceof Vector3) return new Vector3(value);
  throw new TypeError('Expected an Angle, Color, Vector2 or Vector3');
}

function checkMutable(value: Value): void {
  if (Object.isFrozen(value)) {
    throw new TypeError('Cannot modify a constant SFML value');
  }
}

function combine(
  left: Value, right: Input, operation: 'add' | 'subtract',
): Value {
  checkMutable(left);
  checkPair(left, right);
  if (left instanceof Time && right instanceof Time) {
    left[timeStorage] = checkedMicroseconds(operation === 'add'
      ? left.asMicroseconds() + right.asMicroseconds()
      : left.asMicroseconds() - right.asMicroseconds());
    return left;
  }
  const leftData = storage(left);
  const rightData = storage(right);
  if (leftData instanceof BigInt64Array || leftData instanceof BigUint64Array) {
    const b = rightData as BigInt64Array | BigUint64Array;
    for (let index = 0; index < leftData.length; index++) {
      leftData[index] = operation === 'add'
        ? leftData[index] + b[index] : leftData[index] - b[index];
    }
    return left;
  }
  const a = leftData;
  const b = rightData as ScalarArray<NumberScalar>;
  const isColor = left instanceof Color;
  const isBoolean = left instanceof BooleanVector;
  for (let index = 0; index < a.length; index++) {
    const result = operation === 'add'
      ? a[index] + b[index] : a[index] - b[index];
    a[index] = isColor ? Math.min(255, Math.max(0, result))
      : isBoolean ? Number(result !== 0) : result;
  }
  return left;
}

function modulate(
  left: Value, right: Input | number | bigint | boolean,
): Color {
  checkMutable(left);
  if (!(left instanceof Color) || !(right instanceof Color)) {
    throw new TypeError('Color multiplication requires two colors');
  }
  const a = left[colorStorage];
  const b = right[colorStorage];
  for (let index = 0; index < 4; index++) {
    // Uint8Array truncates the nonnegative quotient, matching SFML.
    a[index] = a[index] * b[index] / 255;
  }
  return left;
}

function scale(
  left: Value, right: number | bigint | boolean,
  operation: 'multiply' | 'divide',
): Value {
  checkMutable(left);
  if (left instanceof BooleanVector) {
    if (typeof right !== 'boolean') {
      throw new TypeError('Boolean vectors require a boolean scalar');
    }
    if (operation === 'divide' && !right) {
      throw new RangeError('Cannot divide by zero');
    }
    if (!right) left[glslStorage].fill(0);
    return left;
  }
  if (left instanceof Time) {
    if (typeof right === 'boolean') throw new TypeError('Expected a scalar');
    left[timeStorage] = scaleTime(left, right, operation);
    return left;
  }
  if (left instanceof Color) {
    throw new TypeError('Color does not support scalar arithmetic');
  }
  const type = scalarType(left) as ScalarType;
  if (isBigIntScalar(type)) {
    if (typeof right !== 'bigint') throw new TypeError('Expected a bigint scalar');
    const scalar = convertScalar(type, right) as bigint;
    if (operation === 'divide' && scalar === 0n) {
      throw new RangeError('Cannot divide by zero');
    }
    const data = storage(left) as BigInt64Array | BigUint64Array;
    for (let i = 0; i < data.length; i++) {
      data[i] = operation === 'multiply' ? data[i] * scalar : data[i] / scalar;
    }
    return left;
  }
  if (typeof right !== 'number') throw new TypeError('Expected a scalar');
  const scalar = toScalar(type, right);
  if (operation === 'divide' && scalar === 0) {
    throw new RangeError('Cannot divide by zero');
  }
  const a = storage(left) as ScalarArray<NumberScalar>;
  for (let index = 0; index < a.length; index++) {
    a[index] = operation === 'multiply'
      ? scalarProduct(type, a[index], scalar) : a[index] / scalar;
  }
  return left;
}

// Overloads enforce SFML's distinct specializations. The implementation
// checks them again for JavaScript callers before changing shared bytes.
/**
 * Return a new object adding values of the same type; vectors add
 * component-wise, and Color channels saturate at 255.
 * @zh 返回同类型值相加的新对象；向量逐分量相加，Color 通道饱和到 255。
 * @ja 同じ型の値を加算した新しいオブジェクトを返す。ベクトルは成分ごとに加算し、
 * Color チャンネルは 255 で飽和する。
 * @ko 같은 타입의 값을 더한 새 객체를 반환한다. 벡터는 성분별로 더하며
 * Color 채널은 255에서 포화된다.
 */
export const add = ((left: Input, right: Input) =>
  combine(copy(left), right, 'add')) as Addition;
/**
 * Return a new object subtracting values of the same type; Color channels
 * have a minimum of 0.
 * @zh 返回同类型值相减的新对象；Color 通道最低为 0。
 * @ja 同じ型の値を減算した新しいオブジェクトを返す。Color チャンネルの下限は 0。
 * @ko 같은 타입의 값을 뺀 새 객체를 반환한다. Color 채널의 최솟값은 0이다.
 */
export const subtract = ((left: Input, right: Input) =>
  combine(copy(left), right, 'subtract')) as Addition;
/**
 * Add right to left in place and return left; read-only constants cannot
 * be modified.
 * @zh 将 right 原地加到 left 并返回 left；不可修改只读常量。
 * @ja left に right を直接加算して left を返す。読み取り専用定数は変更できない。
 * @ko left에 right를 제자리에서 더하고 left를 반환한다. 읽기 전용 상수는 수정 불가.
 */
export const addAssign = ((left: Value, right: Input) =>
  combine(left, right, 'add')) as AdditionAssign;
/**
 * Subtract right from left in place and return left; each Color channel
 * has a minimum of 0.
 * @zh 从 left 原地减去 right 并返回 left；Color 各通道最低为 0。
 * @ja left から right を直接減算して left を返す。Color の各チャンネルの下限は 0。
 * @ko left에서 right를 제자리에서 빼고 left를 반환한다. 각 Color 채널의 최솟값은 0.
 */
export const subtractAssign = ((left: Value, right: Input) =>
  combine(left, right, 'subtract')) as AdditionAssign;

/**
 * Return a new negated object, converted to the original scalar type;
 * Color is unsupported, and boolean vector values remain unchanged.
 * @zh 返回取负后的新对象，按原标量类型转换；不支持 Color，布尔向量值保持不变。
 * @ja 元のスカラー型に変換した符号反転済みの新しいオブジェクトを返す。
 * Color は非対応で、ブールベクトルの値は変わらない。
 * @ko 부호를 반전하고 원래 스칼라 타입으로 변환한 새 객체를 반환한다.
 * Color는 지원하지 않으며 불리언 벡터 값은 그대로 유지된다.
 */
export const negate = ((value: Input) => {
  if (value instanceof Color) {
    throw new TypeError('Color does not support unary negation');
  }
  const result = copy(value);
  if (result instanceof Time) {
    result[timeStorage] = checkedMicroseconds(-result.asMicroseconds());
    return result;
  }
  const data = storage(result);
  if (!(result instanceof BooleanVector)) {
    for (let index = 0; index < data.length; index++) data[index] = -data[index];
  }
  return result;
}) as Negation;

/**
 * Return a new object from scalar scaling, transform composition, or point
 * transformation; Color channels are multiplied and then divided by 255.
 * @zh 返回标量缩放、变换组合或点变换的新对象；Color 按通道相乘再除以 255。
 * @ja スカラー倍、変換の合成、または点の変換による新しいオブジェクトを返す。
 * Color はチャンネルごとに乗算してから 255 で割る。
 * @ko 스칼라 배율 적용, 변환 합성 또는 점 변환으로 새 객체를 반환한다.
 * Color는 채널별로 곱한 뒤 255로 나눈다.
 */
export const multiply = ((
  left: Input | R<Transform> | number | bigint | boolean,
  right: Input | R<Transform> | number | bigint | boolean,
) => {
  if (left instanceof Transform) {
    if (right instanceof Transform) return new Transform(left).combine(right);
    if (right instanceof Vector2 && right.scalarType === 'f32') {
      return left.transformPoint(right as R<Vector2f>);
    }
    throw new TypeError('Transform multiplication requires Transform or Vector2f');
  }
  if (right instanceof Transform) {
    throw new TypeError('Transform must be the left multiplication operand');
  }
  if (left instanceof Color && right instanceof Color) {
    return modulate(new Color(left), right);
  }
  const leftScalar = typeof left === 'number' || typeof left === 'bigint' ||
    typeof left === 'boolean';
  const rightScalar = typeof right === 'number' || typeof right === 'bigint' ||
    typeof right === 'boolean';
  if (leftScalar && !rightScalar) {
    return scale(copy(right as Input), left, 'multiply');
  }
  if (!leftScalar && rightScalar) {
    return scale(copy(left as Input), right, 'multiply');
  }
  throw new TypeError('Multiplication requires one value and one scalar');
}) as Scale & LeftScale & {
  (left: R<Transform>, right: R<Transform>): Transform;
  (left: R<Transform>, right: R<Vector2f>): Vector2f;
  (left: R<Color>, right: R<Color>): Color;
};

/**
 * Scale, compose transforms, or modulate colors in place, returning the
 * left operand.
 * @zh 原地缩放、组合变换或调制颜色，返回左操作数。
 * @ja スケーリング、変換の合成、または色の変調を直接行い、左オペランドを返す。
 * @ko 배율 적용, 변환 합성 또는 색상 변조를 제자리에서 수행하고 왼쪽 피연산자를
 * 반환한다.
 */
export const multiplyAssign = ((
  left: Value | Transform,
  right: Input | R<Transform> | number | bigint | boolean,
) => {
  if (left instanceof Transform) {
    if (!(right instanceof Transform)) {
      throw new TypeError('Transform assignment requires another Transform');
    }
    return left.combine(right);
  }
  if (right instanceof Transform) {
    throw new TypeError('Expected a Transform left operand');
  }
  if (left instanceof Color || right instanceof Color) {
    return modulate(left, right as Input | number | bigint | boolean);
  }
  if (typeof right !== 'number' && typeof right !== 'bigint' &&
      typeof right !== 'boolean') {
    throw new TypeError('Expected a scalar');
  }
  return scale(left, right, 'multiply');
}) as ScaleAssign & {
  (left: Color, right: R<Color>): Color;
  (left: Transform, right: R<Transform>): Transform;
};
/**
 * Divide the left value by a scalar in place and return it; throw RangeError
 * if the divisor is zero.
 * @zh 将左值原地除以标量并返回左值；除数为零时抛出 RangeError。
 * @ja 左の値をスカラーで直接除算して返す。除数がゼロなら RangeError をスローする。
 * @ko 왼쪽 값을 스칼라로 제자리에서 나누고 반환한다. 제수가 0이면 RangeError를 던진다.
 */
export const divideAssign = ((left: Value, right: number | bigint | boolean) =>
  scale(left, right, 'divide')) as ScaleAssign;

/**
 * Return a new object divided by a scalar; dividing two Time or two Angle
 * values returns a numeric ratio.
 * @zh 返回除以标量的新对象；两个 Time 或两个 Angle 相除返回数值比率。
 * @ja スカラーで除算した新しいオブジェクトを返す。2 つの Time または
 * 2 つの Angle の除算では数値の比率を返す。
 * @ko 스칼라로 나눈 새 객체를 반환한다. 두 Time 또는 두 Angle을 나누면
 * 수치 비율을 반환한다.
 */
export const divide = ((
  left: Input, right: Input | number | bigint | boolean,
) => {
  if (typeof right === 'number' || typeof right === 'bigint' ||
      typeof right === 'boolean') {
    return scale(copy(left), right, 'divide');
  }
  if (left instanceof Time || right instanceof Time) {
    checkPair(left, right);
    const lhs = left as Time;
    const rhs = right as Time;
    if (rhs.asMicroseconds() === 0n) {
      throw new RangeError('Cannot divide by zero');
    }
    return Math.fround(lhs.asSeconds() / rhs.asSeconds());
  }
  if (!(left instanceof Angle) || !(right instanceof Angle)) {
    throw new TypeError('Only two angles can be divided to obtain a ratio');
  }
  if (right.asRadians() === 0) throw new RangeError('Cannot divide by zero');
  return Math.fround(left.asRadians() / right.asRadians());
}) as Scale & {
  (left: R<Time>, right: R<Time>): number;
  (left: R<Angle>, right: R<Angle>): number;
};

/**
 * Return the duration remainder of integer microsecond division, with the
 * remainder taking the sign of left.
 * @zh 返回微秒数整数除法的余数时长，余数符号跟随 left。
 * @ja マイクロ秒数の整数除算の剰余を時間長として返す。剰余の符号は left に従う。
 * @ko 정수 마이크로초 나눗셈의 나머지를 시간 길이로 반환한다. 부호는 left를 따른다.
 */
export function modulo(left: R<Time>, right: R<Time>): Time;
/**
 * Return the non-negative angle remainder; right must be a positive angle.
 * @zh 返回角度的非负余数，right 必须为正角度。
 * @ja 非負の角度の剰余を返す。right は正の角度でなければならない。
 * @ko 음이 아닌 각도 나머지를 반환한다. right는 양의 각도여야 한다.
 */
export function modulo(left: R<Angle>, right: R<Angle>): Angle;
export function modulo(
  left: R<Time> | R<Angle>, right: R<Time> | R<Angle>,
): Time | Angle {
  checkPair(left, right);
  if (left instanceof Time && right instanceof Time) {
    return new Time(remainderTime(left, right));
  }
  if (!(left instanceof Angle) || !(right instanceof Angle)) {
    throw new TypeError('Expected matching Time or Angle operands');
  }
  return radians(positiveRemainder(left.asRadians(), right.asRadians()));
}

/**
 * Write the duration remainder back to left and return left.
 * @zh 将时长余数写回 left 并返回 left。
 * @ja 時間長の剰余を left に書き戻し、left を返す。
 * @ko 시간 길이의 나머지를 left에 다시 쓰고 left를 반환한다.
 */
export function moduloAssign(left: Time, right: R<Time>): Time;
/**
 * Write the non-negative angle remainder back to left and return left;
 * right must be a positive angle.
 * @zh 将非负角度余数写回 left 并返回 left，right 必须为正角度。
 * @ja 非負の角度の剰余を left に書き戻し、left を返す。
 * right は正の角度でなければならない。
 * @ko 음이 아닌 각도 나머지를 left에 다시 쓰고 left를 반환한다.
 * right는 양의 각도여야 한다.
 */
export function moduloAssign(left: Angle, right: R<Angle>): Angle;
export function moduloAssign(
  left: Time | Angle, right: R<Time> | R<Angle>,
): Time | Angle {
  checkMutable(left);
  checkPair(left, right);
  if (left instanceof Time && right instanceof Time) {
    left[timeStorage] = remainderTime(left, right);
    return left;
  }
  if (!(left instanceof Angle) || !(right instanceof Angle)) {
    throw new TypeError('Expected matching Time or Angle operands');
  }
  left[angleStorage][0] = positiveRemainder(
    left.asRadians(), right.asRadians(),
  );
  return left;
}

type EqualityInput = Input | R<FloatRect> | R<IntRect> | R<Transform> |
Readonly<BlendMode> | Readonly<StencilMode> | Readonly<VideoMode> | IpAddress;
const transformElements = [ 0, 1, 3, 4, 5, 7, 12, 13, 15 ];

function equals(left: EqualityInput, right: EqualityInput): boolean {
  if (left instanceof IpAddress || right instanceof IpAddress) {
    if (!(left instanceof IpAddress) || !(right instanceof IpAddress)) {
      throw new TypeError('IP equality requires two addresses');
    }
    return left.compare(right) === 0;
  }
  if (left instanceof VideoMode || right instanceof VideoMode) {
    return compareVideoModes(left as VideoMode, right as VideoMode) === 0;
  }
  if (left instanceof BlendMode || right instanceof BlendMode) {
    if (!(left instanceof BlendMode) || !(right instanceof BlendMode)) {
      throw new TypeError('BlendMode equality requires two blend modes');
    }
    return left.colorSrcFactor === right.colorSrcFactor &&
      left.colorDstFactor === right.colorDstFactor &&
      left.colorEquation === right.colorEquation &&
      left.alphaSrcFactor === right.alphaSrcFactor &&
      left.alphaDstFactor === right.alphaDstFactor &&
      left.alphaEquation === right.alphaEquation;
  }
  if (left instanceof StencilMode || right instanceof StencilMode) {
    if (!(left instanceof StencilMode) || !(right instanceof StencilMode)) {
      throw new TypeError('StencilMode equality requires two stencil modes');
    }
    return left.stencilComparison === right.stencilComparison &&
      left.stencilUpdateOperation === right.stencilUpdateOperation &&
      left.stencilReference.value === right.stencilReference.value &&
      left.stencilMask.value === right.stencilMask.value &&
      left.stencilOnly === right.stencilOnly;
  }
  if (left instanceof Transform || right instanceof Transform) {
    if (!(left instanceof Transform) || !(right instanceof Transform)) {
      throw new TypeError('Transform equality requires two transforms');
    }
    const a = left[transformStorage];
    const b = right[transformStorage];
    return transformElements.every(index => a[index] === b[index]);
  }
  if (left instanceof Rect || right instanceof Rect) {
    if (!(left instanceof Rect) || !(right instanceof Rect) ||
        left.scalarType !== right.scalarType) {
      throw new TypeError('Rect operands must have the same scalar type');
    }
    const a = left[rectStorage];
    const b = right[rectStorage];
    return a[0] === b[0] && a[1] === b[1] &&
      a[2] === b[2] && a[3] === b[3];
  }
  checkPair(left as Input, right as Input);
  if (left instanceof Time && right instanceof Time) {
    return left.asMicroseconds() === right.asMicroseconds();
  }
  const a = storage(left as Input);
  const b = storage(right as Input);
  for (let index = 0; index < a.length; index++) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}

/**
 * Compare same-type operands by value; floating-point comparisons are exact,
 * and vectors require the same scalar type.
 * @zh 按值比较同类型操作数；浮点数精确比较，向量要求相同标量类型。
 * @ja 同じ型のオペランドを値で比較する。浮動小数点数は厳密に比較し、
 * ベクトルは同じスカラー型でなければならない。
 * @ko 같은 타입의 피연산자를 값으로 비교한다. 부동소수점은 정확히 비교하며
 * 벡터는 같은 스칼라 타입이어야 한다.
 */
export const equal = equals as Equality;
/**
 * Return whether same-type operands are unequal by value.
 * @zh 返回同类型操作数是否按值不相等。
 * @ja 同じ型のオペランドの値が等しくないかどうかを返す。
 * @ko 같은 타입의 피연산자가 값으로 같지 않은지 반환한다.
 */
export const notEqual = ((left: EqualityInput, right: EqualityInput) =>
  !equals(left, right)) as Equality;
interface Ordering {
  (left: IpAddress, right: IpAddress): boolean;
  (left: Readonly<VideoMode>, right: Readonly<VideoMode>): boolean;
  (left: R<Time>, right: R<Time>): boolean;
  (left: R<Angle>, right: R<Angle>): boolean;
}

function compare(
  left: R<Time> | R<Angle> | Readonly<VideoMode> | IpAddress,
  right: R<Time> | R<Angle> | Readonly<VideoMode> | IpAddress,
  operation: (a: number | bigint, b: number | bigint) => boolean,
): boolean {
  if (left instanceof IpAddress || right instanceof IpAddress) {
    if (!(left instanceof IpAddress) || !(right instanceof IpAddress)) {
      throw new TypeError('IP ordering requires two addresses');
    }
    return operation(left.compare(right), 0);
  }
  if (left instanceof VideoMode || right instanceof VideoMode) {
    return operation(compareVideoModes(left as VideoMode, right as VideoMode), 0);
  }
  if (left instanceof Time && right instanceof Time) {
    return operation(left.asMicroseconds(), right.asMicroseconds());
  }
  if (left instanceof Angle && right instanceof Angle) {
    return operation(left.asRadians(), right.asRadians());
  }
  throw new TypeError('Ordering requires matching Time or Angle operands');
}

/**
 * Test whether the left value is less than the right; supports Time, Angle,
 * VideoMode, and IpAddress.
 * @zh 判断左值是否小于右值；支持 Time、Angle、VideoMode 和 IpAddress。
 * @ja 左の値が右の値より小さいか判定する。Time、Angle、VideoMode、
 * IpAddress に対応する。
 * @ko 왼쪽 값이 오른쪽 값보다 작은지 판별한다. Time, Angle, VideoMode,
 * IpAddress를 지원한다.
 */
export const less = ((left, right) =>
  compare(left, right, (a, b) => a < b)) as Ordering;
/**
 * Test whether the left value is less than or equal to the right; both must
 * have the same orderable type.
 * @zh 判断左值是否小于等于右值；两者须具有相同可排序类型。
 * @ja 左の値が右の値以下か判定する。両者は同じ順序付け可能な型でなければならない。
 * @ko 왼쪽 값이 오른쪽 값 이하인지 판별한다. 둘 다 같은 정렬 가능한 타입이어야 한다.
 */
export const lessEqual = ((left, right) =>
  compare(left, right, (a, b) => a <= b)) as Ordering;
/**
 * Test whether the left value is greater than the right; both must have the
 * same orderable type.
 * @zh 判断左值是否大于右值；两者须具有相同可排序类型。
 * @ja 左の値が右の値より大きいか判定する。両者は同じ順序付け可能な型で
 * なければならない。
 * @ko 왼쪽 값이 오른쪽 값보다 큰지 판별한다. 둘 다 같은 정렬 가능한 타입이어야 한다.
 */
export const greater = ((left, right) =>
  compare(left, right, (a, b) => a > b)) as Ordering;
/**
 * Test whether the left value is greater than or equal to the right; both
 * must have the same orderable type.
 * @zh 判断左值是否大于等于右值；两者须具有相同可排序类型。
 * @ja 左の値が右の値以上か判定する。両者は同じ順序付け可能な型でなければならない。
 * @ko 왼쪽 값이 오른쪽 값 이상인지 판별한다. 둘 다 같은 정렬 가능한 타입이어야 한다.
 */
export const greaterEqual = ((left, right) =>
  compare(left, right, (a, b) => a >= b)) as Ordering;
