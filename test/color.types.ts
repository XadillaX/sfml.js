import {
  Color, Angle, Vector2u, Vector3f, type ReadonlyValue,
  add, subtract, multiply, addAssign, subtractAssign, multiplyAssign,
  equal, notEqual, negate, divide, divideAssign, modulo, moduloAssign,
  less, lessEqual, greater, greaterEqual,
} from '..';

const color = new Color();
new Color(1, 2, 3);
new Color(1, 2, 3, 4);
new Color(0x12345678);
new Color(color);
new Color(Color.White);
const constant: ReadonlyValue<Color> = Color.Red;
const readonlyColor: Readonly<Color> = color;
new Color(readonlyColor);
const packed: number = constant.toInteger();
const sum: Color = add(color, constant);
const difference: Color = subtract(constant, color);
const product: Color = multiply(constant, readonlyColor);
const assigned: Color = addAssign(color, constant);
subtractAssign(color, readonlyColor);
multiplyAssign(color, constant);
const same: boolean = equal(constant, color);
const different: boolean = notEqual(color, constant);
color.r = 1;
color.g = 2;
color.b = 3;
color.a = 4;

// @ts-expect-error Color needs three or four components, or one packed value.
new Color(1, 2);
// @ts-expect-error Plain channel objects are not Color values.
new Color({ r: 1, g: 2, b: 3, a: 4 });
// @ts-expect-error Constants cannot be modified.
Color.Red.r = 0;
// @ts-expect-error Static constants cannot be replaced.
Color.White = color;
// @ts-expect-error Const value views cannot be modified.
constant.a = 0;
// @ts-expect-error Const values cannot be the target of +=.
addAssign(constant, color);
// @ts-expect-error Const values cannot be the target of -=.
subtractAssign(Color.White, color);
// @ts-expect-error Const values cannot be the target of *=.
multiplyAssign(constant, color);
// @ts-expect-error Color arithmetic does not accept Angle.
add(color, new Angle());
// @ts-expect-error Color arithmetic does not accept vectors.
subtract(color, new Vector2u());
// @ts-expect-error Color modulation does not accept vectors.
multiply(color, new Vector3f());
// @ts-expect-error Color equality requires Color on both sides.
equal(color, new Angle());
// @ts-expect-error Color does not have scalar multiplication.
multiply(color, 2);
// @ts-expect-error Color does not have scalar multiplication.
multiply(2, color);
// @ts-expect-error Color does not have scalar multiplication assignment.
multiplyAssign(color, 2);
// @ts-expect-error Color does not have unary negation.
negate(color);
// @ts-expect-error Color does not have division.
divide(color, 2);
// @ts-expect-error Color does not have division assignment.
divideAssign(color, 2);
// @ts-expect-error Color does not have modulo.
modulo(color, color);
// @ts-expect-error Color does not have modulo assignment.
moduloAssign(color, color);
// @ts-expect-error Colors do not have ordering comparisons.
less(color, color);
// @ts-expect-error Colors do not have ordering comparisons.
lessEqual(color, color);
// @ts-expect-error Colors do not have ordering comparisons.
greater(color, color);
// @ts-expect-error Colors do not have ordering comparisons.
greaterEqual(color, color);

export { packed, sum, difference, product, assigned, same, different };
