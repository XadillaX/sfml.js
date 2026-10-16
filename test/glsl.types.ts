import {
  Glsl, Vector2f, Vector3i, Vector2, Color,
  add, multiply, divide, equal, addAssign, type ReadonlyValue,
} from '../src';

const vector: Glsl.Vec2 = new Vector2f(1, 2);
const same: Vector2f = new Glsl.Vec2(vector);
const integer: Glsl.Ivec3 = new Vector3i();
const b2 = new Glsl.Bvec2(same);
const b3 = new Glsl.Bvec3(integer);
const flag: boolean = b3.dot(b3);
const cross: Glsl.Bvec3 = b3.cross(b3);
const summed: Glsl.Bvec2 = add(b2, b2);
const scaled: Glsl.Bvec3 = multiply(true, b3);
const divided: Glsl.Bvec2 = divide(b2, true);
new Glsl.Vec2(b2);
new Glsl.Ivec3(b3);
new Vector2('f32', b2);
equal(b2, b2);

const vec4: Glsl.Vec4 = new Glsl.Vec4(Color.White);
const int4: Glsl.Ivec4 = new Glsl.Ivec4(vec4);
const bool4: Glsl.Bvec4 = new Glsl.Bvec4(int4);
new Glsl.Vec4(bool4);
bool4.w = flag;
const readonly: ReadonlyValue<Glsl.Bvec3> = b3;
readonly.dot(cross);
new Glsl.Bvec3(readonly);
new Glsl.Vec4(Object.freeze(vec4));

// @ts-expect-error Boolean component properties require booleans.
b2.x = 1;
// @ts-expect-error Boolean scalars do not mix with numeric scalars.
multiply(b2, 1);
// @ts-expect-error Numeric vectors do not take boolean scalars.
multiply(same, true);
// @ts-expect-error Boolean arithmetic requires matching dimensions.
add(b2, b3);
// @ts-expect-error Conversion requires matching dimensions.
new Glsl.Vec2(b3);
// @ts-expect-error Four-dimensional constructors require four components.
new Glsl.Vec4(1, 2, 3);
// @ts-expect-error SFML does not define Color-to-Bvec4 construction.
new Glsl.Bvec4(Color.White);
// @ts-expect-error SFML's Vector4 has no dot product.
vec4.dot(vec4);
// @ts-expect-error SFML's Vector4 has no arithmetic operators.
add(vec4, vec4);
// @ts-expect-error SFML's Vector4 has no equality operator.
equal(bool4, bool4);
// @ts-expect-error Floating-only math is not available on boolean vectors.
b3.normalized();
// @ts-expect-error Const values cannot be changed.
readonly.x = false;
// @ts-expect-error Const values cannot be mutated by operators.
addAssign(readonly, b3);

void [ summed, scaled, divided ];
