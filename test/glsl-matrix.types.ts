import {
  Glsl, Transform, multiply, equal, type ReadonlyValue,
} from '../src';

const mat3 = new Glsl.Mat3(Transform.Identity);
const mat4 = new Glsl.Mat4(new Transform());
new Glsl.Mat3(mat3);
new Glsl.Mat4(mat4);
new Glsl.Mat3([ 1, 0, 0, 0, 1, 0, 0, 0, 1 ] as const);
new Glsl.Mat4(new Float32Array(16));
mat3.array = new Float64Array(9);
mat4.array = Array(16).fill(1);
mat3.array[0] = 2;
mat4.array.set(new Float32Array(16));
const view: Float32Array = mat3.array;
const readonly3: ReadonlyValue<Glsl.Mat3> = mat3;
const readonly4: ReadonlyValue<Glsl.Mat4> = mat4;
new Glsl.Mat3(readonly3);
new Glsl.Mat4(readonly4);
new Glsl.Mat3(readonly3.array);
mat3.array = readonly3.array;
readonly3.array.slice().fill(0);
const numbers: number[] = [ ...readonly4.array ];

// @ts-expect-error SFML GLSL matrices have no default constructor.
new Glsl.Mat3();
// @ts-expect-error SFML GLSL matrices have no default constructor.
new Glsl.Mat4();
// @ts-expect-error Matrix dimensions cannot be implicitly converted.
new Glsl.Mat3(mat4);
// @ts-expect-error Matrix dimensions cannot be implicitly converted.
new Glsl.Mat4(readonly3);
// @ts-expect-error Matrices are not vectors.
new Glsl.Mat4(new Glsl.Vec4());
// @ts-expect-error GLSL matrices have no multiplication operator.
multiply(mat3, mat3);
// @ts-expect-error GLSL matrices have no equality operator.
equal(mat4, mat4);
// @ts-expect-error Const arrays cannot be replaced.
readonly3.array = new Float32Array(9);
// @ts-expect-error Const elements cannot be modified.
readonly3.array[0] = 1;
// @ts-expect-error Const arrays do not expose mutating methods.
readonly3.array.set([ 1 ]);
// @ts-expect-error Const arrays do not expose mutating methods.
readonly3.array.fill(0);
// @ts-expect-error A subarray would permit mutating the original memory.
readonly3.array.subarray(0);
// @ts-expect-error A buffer would permit mutating the original memory.
readonly3.array.buffer;
// @ts-expect-error TypedArray callbacks expose the mutable source array.
readonly3.array.forEach((value: number) => value);
// @ts-expect-error Native wrapping is internal.
mat3.native();

void [ view, numbers ];
