import {
  Vector2, Vector2f, Vector3, Glsl, Transformable, type ReadonlyValue,
  add, subtract, negate, multiply, divide, equal, notEqual,
  addAssign, subtractAssign, multiplyAssign, divideAssign, degrees,
} from '..';

const double = new Vector2('f64', 0.1, 0.2);
const double3 = new Vector3('f64', 0.1, 0.2, 0.3);
const signed = new Vector2('i64', 9007199254740993n, -1n);
const unsigned = new Vector3('u64', 1n, 2n, 3n);
const narrow = new Vector2('i8', 1, 2);
const narrow3 = new Vector3('u16', 1, 2, 3);
new Vector2('u8', 1, 2);
new Vector3('i16', 1, 2, 3);
new Vector2('i64', double);
new Vector3('f64', unsigned);
new Vector2f(signed);
new Glsl.Bvec2(signed);
new Glsl.Bvec3(unsigned);

const component: bigint = signed.x;
const dot: bigint = unsigned.dot(unsigned);
const lengthSquared: bigint = signed.lengthSquared();
const cross2: bigint = signed.cross(signed);
const cross3: Vector3<'u64'> = unsigned.cross(unsigned);
const length: number = double.length();
const normalized: Vector3<'f64'> = double3.normalized();
const polar = new Vector2('f64', 2, degrees(30));
const rotated: Vector2<'f64'> = double.rotatedBy(degrees(30));
const projected: Vector2<'f64'> = double.projectedOnto(double);
double.angleTo(double);
const ro: ReadonlyValue<Vector2<'i64'>> = signed;
const a: Vector2<'i64'> = add(ro, signed);
const b: Vector3<'u16'> = subtract(narrow3, narrow3);
const c: Vector2<'i8'> = negate(narrow);
const d: Vector2<'i64'> = multiply(ro, 3n);
const e: Vector3<'u64'> = multiply(3n, unsigned);
const f: Vector2<'f64'> = divide(double, 2);
const same: boolean = equal(signed, ro);
notEqual(double3, double3);
addAssign(signed, ro);
subtractAssign(narrow3, narrow3);
multiplyAssign(unsigned, 3n);
divideAssign(signed, 2n);
signed.x = 1n;
double.x = 0.1;

// @ts-expect-error bigint components are required for int64
new Vector2('i64', 1, 2);
// @ts-expect-error all components must use the same scalar representation
new Vector3('u64', 1n, 2, 3n);
// @ts-expect-error number components are required for f64
new Vector2('f64', 1n, 2n);
// @ts-expect-error bigint scalars are required for int64 arithmetic
multiply(signed, 2);
// @ts-expect-error number scalars are required for f64 arithmetic
multiply(double, 2n);
// @ts-expect-error bigint and number vectors cannot mix
add(signed, double);
// @ts-expect-error same-width signed and unsigned vectors cannot mix
add(signed, new Vector2('u64'));
// @ts-expect-error narrow and wide vectors cannot mix
equal(narrow, new Vector2('i32'));
// @ts-expect-error methods also enforce scalar type
double.dot(new Vector2f());
// @ts-expect-error readonly input cannot be assigned through an operator
addAssign(ro, signed);
// @ts-expect-error component is readonly
ro.x = 2n;
// @ts-expect-error int64 components cannot be assigned numbers
signed.y = 1;
// @ts-expect-error length is floating-point only
unsigned.length();
// @ts-expect-error normalization is floating-point only
signed.normalized();
// @ts-expect-error polar construction is floating-point only
new Vector2('i16', 2, degrees(30));
// @ts-expect-error graphics still requires f32 vectors
new Transformable().setPosition(double);
// @ts-expect-error long double is outside the selected scalar set
new Vector3('f128');

void [ component, dot, lengthSquared, cross2, cross3, length, normalized,
  polar, rotated, projected, a, b, c, d, e, f, same ];
