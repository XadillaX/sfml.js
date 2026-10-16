import { Vector2, Vector2i, Vector2u, Vector2f, type ScalarType } from '..';

const integer = new Vector2('i32', 1, 2);
const unsigned = new Vector2('u32');
const float = new Vector2('f32', 0.1, 0.2);
const integerType: 'i32' = integer.scalarType;
const unsignedType: 'u32' = unsigned.scalarType;
const floatType: 'f32' = float.scalarType;
const integerCopy: Vector2<'i32'> = new Vector2(integer);
const specializedCopy: Vector2<'f32'> = new Vector2(new Vector2f());
const converted: Vector2<'u32'> = new Vector2('u32', integer);
const specialized: Vector2i = integer;
const generic: Vector2<'i32'> = new Vector2i();
const anyScalar: Vector2<ScalarType> = float;
const readonlySource: Readonly<Vector2f> = new Vector2f();
new Vector2(readonlySource);
new Vector2i(readonlySource);
new Vector2u(readonlySource);
new Vector2f(integer);
integer.x = 3;
integer.y = 4;

const squared: number = integer.lengthSquared();
const dot: number = float.dot(readonlySource);
const cross: number = float.cross(readonlySource);
const perpendicular: Vector2<'i32'> = integer.perpendicular();
const product: Vector2<'f32'> = float.componentWiseMul(readonlySource);
const quotient: Vector2<'f32'> = float.componentWiseDiv(readonlySource);
const specializedResult: Vector2u = new Vector2u(3, 4).perpendicular();
const readonlyResult: Vector2<'f32'> = readonlySource.perpendicular();

// @ts-expect-error Arithmetic must retain its input scalar type.
const wrongResult: Vector2<'u32'> = integer.componentWiseMul(integer);
// @ts-expect-error Dot requires the same scalar type.
integer.dot(float);
// @ts-expect-error Cross requires the same scalar type.
integer.cross(unsigned);
// @ts-expect-error Component-wise multiplication requires the same scalar type.
float.componentWiseMul(integer);
// @ts-expect-error Component-wise division requires the same scalar type.
unsigned.componentWiseDiv(float);
// @ts-expect-error Scalar specializations cannot be implicitly interchanged.
const wrongScalar: Vector2<'f32'> = integer;
// @ts-expect-error The convenient classes retain their scalar distinction.
const wrongSpecialization: Vector2i = new Vector2u();
// @ts-expect-error Copy construction preserves the source scalar type.
const wrongCopy: Vector2<'f32'> = new Vector2(integer);
// @ts-expect-error An explicit generic parameter must match the runtime tag.
new Vector2<'f32'>('i32', 1, 2);
// @ts-expect-error Conversion requires specifying the destination scalar tag.
new Vector2<'i32'>(float);
// @ts-expect-error A generic vector needs a runtime scalar tag or a source.
new Vector2();
// @ts-expect-error Coordinates must be supplied as a pair.
new Vector2('i32', 1);
// @ts-expect-error Coordinates must be supplied as a pair.
new Vector2i(1);
// @ts-expect-error Only the supported scalar tags are accepted.
new Vector2('f128');
// @ts-expect-error The scalar tag cannot change after construction.
integer.scalarType = 'u32';
// @ts-expect-error Readonly input coordinates cannot be assigned.
readonlySource.x = 1;

export {
  integerType,
  unsignedType,
  floatType,
  integerCopy,
  specializedCopy,
  converted,
  specialized,
  generic,
  anyScalar,
  squared,
  dot,
  cross,
  perpendicular,
  product,
  quotient,
  specializedResult,
  readonlyResult,
  wrongResult,
  wrongScalar,
  wrongSpecialization,
  wrongCopy,
};
