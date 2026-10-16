import {
  Transform, Vector2f, Vector2i, FloatRect, IntRect, degrees,
  multiply, multiplyAssign, equal, notEqual, add, divide, less,
  type ReadonlyValue,
} from '../src';

const transform = new Transform(1, 0, 3, 0, 1, 4, 0, 0, 1);
const readonly: ReadonlyValue<Transform> = transform;
const matrix: readonly number[] = readonly.getMatrix();
const point: Vector2f = readonly.transformPoint(new Vector2f());
const rectangle: FloatRect = readonly.transformRect(new FloatRect());
const inverse: Transform = readonly.getInverse();
const combined: Transform = multiply(readonly, Transform.Identity);
const transformed: Vector2f = multiply(readonly, new Vector2f());
new Transform(readonly);
transform.translate(new Vector2f()).rotate(degrees(30))
  .scale(new Vector2f(2, 3), new Vector2f())
  .combine(readonly);
inverse.translate(point);
multiplyAssign(transform, readonly);
equal(readonly, Transform.Identity);
notEqual(transform, readonly);

// @ts-expect-error Matrix entries are readonly.
matrix[0] = 4;
// @ts-expect-error A matrix view exposes no mutable array methods.
matrix.fill(0);
// @ts-expect-error Constructors take nine entries, not a raw array.
new Transform([ 1, 0, 0, 0, 1, 0, 0, 0, 1 ]);
// @ts-expect-error All nine components are required.
new Transform(1, 2, 3);
// @ts-expect-error Point arguments must be Vector2f.
readonly.transformPoint(new Vector2i());
// @ts-expect-error Rectangle arguments must be FloatRect.
readonly.transformRect(new IntRect());
// @ts-expect-error Rotation is an Angle, not a numeric degree count.
transform.rotate(30);
// @ts-expect-error Readonly transforms cannot be mutated.
readonly.translate(new Vector2f());
// @ts-expect-error Identity cannot be mutated.
Transform.Identity.combine(transform);
// @ts-expect-error Assignment needs a mutable transform.
multiplyAssign(readonly, transform);
// @ts-expect-error Only a Transform can be assigned through multiplication.
multiplyAssign(transform, point);
// @ts-expect-error Transform multiplication is not scalar scaling.
multiply(transform, 2);
// @ts-expect-error A vector cannot be the left operand.
multiply(point, transform);
// @ts-expect-error Addition is not defined for Transform.
add(transform, transform);
// @ts-expect-error Division is not defined for Transform.
divide(transform, transform);
// @ts-expect-error Ordering is not defined for Transform.
less(transform, transform);

void [ matrix, point, rectangle, combined, transformed ];
