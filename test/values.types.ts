import {
  Angle, degrees, radians, Vector2, Vector2i, Vector2u, Vector2f,
  Vector3, Vector3i, Vector3u, Vector3f, type ReadonlyValue,
  add, subtract, negate, multiply, divide, modulo,
  addAssign, subtractAssign, multiplyAssign, divideAssign, moduloAssign,
  equal, notEqual, less, lessEqual, greater, greaterEqual,
} from '..';

const angle: Angle = degrees(90);
const ratio: number = divide(angle, radians(2));
const wrapped: Angle = angle.wrapSigned().wrapUnsigned();
const polar: Vector2f = new Vector2f(2, Angle.Zero);
const genericPolar: Vector2<'f32'> = new Vector2('f32', 3, angle);
const zeroCopy: Angle = new Angle(Angle.Zero);
const constant: ReadonlyValue<Angle> = Angle.Zero;
add(constant, angle);
subtract(angle, constant);
negate(constant);
multiply(3, constant);
divide(constant, 3);
modulo(constant, angle);
addAssign(angle, constant);
subtractAssign(angle, constant);
multiplyAssign(angle, 3);
divideAssign(angle, 3);
moduloAssign(angle, constant);
less(constant, angle);
lessEqual(constant, angle);
greater(constant, angle);
greaterEqual(constant, angle);

const v2: ReadonlyValue<Vector2f> = new Vector2f(3, 4);
const v3: ReadonlyValue<Vector3f> = new Vector3f(1, 2, 3);
const normal2: Vector2f = v2.normalized();
const normal3: Vector3f = v3.normalized();
v2.angleTo(v2);
v2.angle();
v2.rotatedBy(constant);
v2.projectedOnto(v2);
v3.length();
v3.dot(v3);
v3.cross(v3);
v3.componentWiseMul(v3);
v3.componentWiseDiv(v3);
const copy3: Vector3<'f32'> = new Vector3(v3);
const convert3: Vector3<'i32'> = new Vector3('i32', v3);
const convenient3: Vector3i = convert3;
new Vector3u(v3);
const sum3: Vector3f = add(copy3, v3);
const sum2: Vector2f = add(polar, v2);
const scaled3: Vector3u = multiply(3, new Vector3u());
const negated: Vector3i = negate(new Vector3i());
const quotient3: Vector3f = divide(v3, 3);
const sumInt: Vector3i = addAssign(convert3, new Vector3i());
equal(v3, new Vector3f());
notEqual(v2, new Vector2f());

// @ts-expect-error An Angle requires an explicit degree/radian factory.
new Angle(90);
// @ts-expect-error A const Angle cannot be the target of +=.
addAssign(Angle.Zero, angle);
// @ts-expect-error A const Angle cannot be the target of -=.
subtractAssign(constant, angle);
// @ts-expect-error A const Angle cannot be the target of *=.
multiplyAssign(constant, 3);
// @ts-expect-error A const Angle cannot be the target of /=.
divideAssign(constant, 3);
// @ts-expect-error A const Angle cannot be the target of %=.
moduloAssign(constant, angle);
// @ts-expect-error Const vectors cannot be assignment targets.
addAssign(v3, new Vector3f());
// @ts-expect-error Const vector coordinates are readonly.
v3.z = 4;
// @ts-expect-error Polar construction is float-only.
new Vector2i(3, angle);
// @ts-expect-error Generic polar construction is also float-only.
new Vector2('u32', 3, angle);
// @ts-expect-error Length is float-only.
new Vector2i().length();
// @ts-expect-error Normalization is float-only.
new Vector3u().normalized();
// @ts-expect-error Angles are float-only.
new Vector2u().angle();
// @ts-expect-error Rotation is float-only.
new Vector2i().rotatedBy(angle);
// @ts-expect-error Projection is float-only.
new Vector2i().projectedOnto(new Vector2i());
// @ts-expect-error angleTo requires a matching floating-point vector.
polar.angleTo(new Vector2u());
// @ts-expect-error Cannot mix scalar specializations.
add(new Vector2i(), new Vector2u());
// @ts-expect-error Cannot mix scalar specializations in equality.
equal(new Vector3u(), new Vector3f());
// @ts-expect-error Cannot mix dimensions.
add(polar, new Vector3f());
// @ts-expect-error There is no vector-vector multiplication operator.
multiply(v3, v3);
// @ts-expect-error There is no scalar/vector division operator.
divide(3, v3);
// @ts-expect-error There is no vector-vector division operator.
divide(v2, v2);
// @ts-expect-error Ordering is only available for Angle.
less(v2, v2);
// @ts-expect-error Modulo is only available for Angle.
modulo(new Vector3i(), new Vector3i());
// @ts-expect-error Vector3 coordinates must be supplied together.
new Vector3f(1, 2);
// @ts-expect-error Scalar conversion must be explicit.
const wrong3: Vector3f = new Vector3i();
// @ts-expect-error Cross product cannot mix scalar types.
new Vector3i().cross(new Vector3u());
// @ts-expect-error Generic copy construction preserves its scalar type.
new Vector3<'i32'>(v3);

export {
  ratio, wrapped, polar, genericPolar, zeroCopy, normal2, normal3,
  copy3, convert3, convenient3, sum3, sum2, scaled3, negated, quotient3,
  sumInt, wrong3,
};
