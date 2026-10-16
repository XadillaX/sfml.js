import {
  FloatRect, IntRect, Vector2f, Vector2i, Vector2u, type ReadonlyValue,
  equal, notEqual, add, addAssign, multiply, less,
} from '..';

const float = new FloatRect(new Vector2f(), new Vector2f(10, 10));
const integer = new IntRect(new Vector2i(), new Vector2i(10, 10));
const readonlyFloat: ReadonlyValue<FloatRect> = float;
const readonlyInt: ReadonlyValue<IntRect> = integer;
const floatMember: Vector2f = float.position;
const intMember: Vector2i = integer.size;
float.position = readonlyFloat.position;
float.size = readonlyFloat.size;
integer.position = readonlyInt.position;
integer.size = readonlyInt.size;
const center: Vector2f = readonlyFloat.getCenter();
const intCenter: Vector2i = readonlyInt.getCenter();
const intersection: FloatRect | undefined =
  readonlyFloat.findIntersection(readonlyFloat);
const intIntersection: IntRect | undefined =
  readonlyInt.findIntersection(readonlyInt);
const contains: boolean = readonlyFloat.contains(readonlyFloat.position);
readonlyInt.contains(readonlyInt.position);
readonlyFloat.position.length();
readonlyFloat.position.normalized().x = 3;
readonlyFloat.getCenter().x = 4;
readonlyFloat.findIntersection(float)!.size.y = 5;
new FloatRect(readonlyFloat);
new FloatRect(readonlyInt);
new IntRect(readonlyFloat);
new IntRect(readonlyInt);
new FloatRect(readonlyFloat.position, readonlyFloat.size);
new IntRect(readonlyInt.position, readonlyInt.size);
new Vector2f(readonlyFloat.position);
new Vector2i(readonlyInt.size);
equal(readonlyFloat, float);
notEqual(readonlyInt, integer);
addAssign(float.position, readonlyFloat.size);
addAssign(integer.size, readonlyInt.position);

// @ts-expect-error Nested const vector members cannot be modified.
readonlyFloat.position.x = 3;
// @ts-expect-error Nested const vector members cannot be modified.
readonlyInt.size.y = 3;
// @ts-expect-error Const members cannot be replaced.
readonlyFloat.position = new Vector2f();
// @ts-expect-error Const members cannot be passed to mutating operators.
addAssign(readonlyFloat.position, new Vector2f());
// @ts-expect-error A nested const view cannot become a mutable alias.
const mutableMember: Vector2f = readonlyFloat.position;
// @ts-expect-error A const rectangle cannot become a mutable alias.
const mutableRect: FloatRect = readonlyFloat;
// @ts-expect-error Specializations remain distinct.
const wrongRect: FloatRect = integer;
// @ts-expect-error FloatRect requires floating point member vectors.
new FloatRect(new Vector2i(), new Vector2i());
// @ts-expect-error IntRect requires signed integer member vectors.
new IntRect(new Vector2u(), new Vector2u());
// @ts-expect-error Both position and size are required.
new FloatRect(new Vector2f());
// @ts-expect-error SFML 3 uses position/size vector construction.
new IntRect(1, 2, 3, 4);
// @ts-expect-error Member assignment cannot convert scalar types implicitly.
float.position = readonlyInt.position;
// @ts-expect-error Member assignment cannot convert scalar types implicitly.
integer.size = new Vector2u();
// @ts-expect-error contains requires a matching vector scalar type.
float.contains(new Vector2i());
// @ts-expect-error Intersections require matching rectangle specializations.
readonlyFloat.findIntersection(readonlyInt);
// @ts-expect-error Equality requires matching rectangle specializations.
equal(float, integer);
// @ts-expect-error Rectangles do not support addition.
add(float, float);
// @ts-expect-error Rectangles do not support scalar multiplication.
multiply(integer, 2);
// @ts-expect-error Rectangles do not support ordering.
less(float, float);
// @ts-expect-error Integer member vectors retain float-only method restrictions.
readonlyInt.position.length();

export {
  floatMember, intMember, center, intCenter, intersection, intIntersection,
  contains, mutableMember, mutableRect, wrongRect,
};
