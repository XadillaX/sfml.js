'use strict';

/** Upstream cube vertices: XYZ position, RGBA color and UV coordinates. */
const vertices = new Float32Array([
  -0.5, -0.5, 0.5, 1, 0, 0, 1, 1, 0,
  0.5, -0.5, 0.5, 1, 0, 0, 1, 0, 0,
  0.5, 0.5, 0.5, 1, 0, 0, 1, 0, 1,
  -0.5, 0.5, 0.5, 1, 0, 0, 1, 1, 1,

  -0.5, -0.5, -0.5, 1, 1, 0, 1, 0, 0,
  0.5, -0.5, -0.5, 1, 1, 0, 1, 0, 1,
  0.5, 0.5, -0.5, 1, 1, 0, 1, 1, 1,
  -0.5, 0.5, -0.5, 1, 1, 0, 1, 1, 0,

  0.5, -0.5, -0.5, 0, 1, 0, 1, 1, 0,
  0.5, 0.5, -0.5, 0, 1, 0, 1, 0, 0,
  0.5, 0.5, 0.5, 0, 1, 0, 1, 0, 1,
  0.5, -0.5, 0.5, 0, 1, 0, 1, 1, 1,

  -0.5, -0.5, -0.5, 0, 1, 1, 1, 1, 1,
  -0.5, 0.5, -0.5, 0, 1, 1, 1, 1, 0,
  -0.5, 0.5, 0.5, 0, 1, 1, 1, 0, 0,
  -0.5, -0.5, 0.5, 0, 1, 1, 1, 0, 1,

  -0.5, -0.5, -0.5, 0, 0, 1, 1, 1, 0,
  0.5, -0.5, -0.5, 0, 0, 1, 1, 0, 0,
  0.5, -0.5, 0.5, 0, 0, 1, 1, 0, 1,
  -0.5, -0.5, 0.5, 0, 0, 1, 1, 1, 1,

  -0.5, 0.5, -0.5, 1, 0, 1, 1, 0, 1,
  0.5, 0.5, -0.5, 1, 0, 1, 1, 1, 1,
  0.5, 0.5, 0.5, 1, 0, 1, 1, 1, 0,
  -0.5, 0.5, 0.5, 1, 0, 1, 1, 0, 0,
]);

/** Two upstream triangles for each of the six independently colored faces. */
const indexes = new Uint16Array([
  0, 1, 2, 2, 3, 0,
  4, 5, 6, 6, 7, 4,
  8, 9, 10, 10, 11, 8,
  12, 13, 14, 14, 15, 12,
  16, 17, 18, 18, 19, 16,
  20, 21, 22, 22, 23, 20,
]);

/**
 * Multiply column-major matrices, preserving the C++ helper's operand order.
 * @param {Float32Array} left Left matrix.
 * @param {number[]} right Right matrix.
 * @return {Float32Array} Product without modifying either input.
 */
function multiply(left, right) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++) {
    const offset = column * 4;
    for (let row = 0; row < 4; row++) {
      result[offset + row] =
        left[row] * right[offset] +
        left[4 + row] * right[offset + 1] +
        left[8 + row] * right[offset + 2] +
        left[12 + row] * right[offset + 3];
    }
  }
  return result;
}

/**
 * Reproduce the original X, Y and Z rotations in degrees per second.
 * @param {number} elapsed Seconds since the example started.
 * @return {Float32Array} Column-major model rotation.
 */
function rotation(elapsed) {
  const x = elapsed * 59 * Math.PI / 180;
  const y = elapsed * 83 * Math.PI / 180;
  const z = elapsed * 109 * Math.PI / 180;
  const aroundX = new Float32Array([
    1, 0, 0, 0,
    0, Math.cos(x), Math.sin(x), 0,
    0, -Math.sin(x), Math.cos(x), 0,
    0, 0, 0, 1,
  ]);
  // The upstream Y rotation deliberately uses the same sine signs as X.
  const aroundY = [
    Math.cos(y), 0, Math.sin(y), 0,
    0, 1, 0, 0,
    -Math.sin(y), 0, Math.cos(y), 0,
    0, 0, 0, 1,
  ];
  const aroundZ = [
    Math.cos(z), Math.sin(z), 0, 0,
    -Math.sin(z), Math.cos(z), 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ];
  return multiply(multiply(aroundX, aroundY), aroundZ);
}

/**
 * Pack the original model, view and projection matrices for the vertex shader.
 * @param {number} elapsed Seconds since the example started.
 * @param {sf.Vector2i} mouse Window-relative cursor position.
 * @param {sf.Vector2u} size Nonzero drawable dimensions.
 * @return {Float32Array} Three column-major matrices, totaling 192 bytes.
 */
function uniforms(elapsed, mouse, size) {
  const model = rotation(elapsed);
  const x = Math.max(-1, Math.min(1, mouse.x * 2 / size.x - 1)) * 2;
  const y = Math.max(-1, Math.min(1, -mouse.y * 2 / size.y + 1)) * 1.5;
  model[12] -= x;
  model[14] += y;

  const data = new Float32Array(48);
  data.set(model);
  // lookAt(eye = (0, 4, 0), center = (0, 0, 0), up = (0, 0, 1)).
  data.set([
    -1, 0, 0, 0,
    0, 0, 1, 0,
    0, 1, 0, 0,
    0, 0, -4, 1,
  ], 16);

  const scale = 1 / Math.tan(45 * Math.PI / 180 / 2);
  const aspect = size.x / size.y;
  const near = 0.1;
  const far = 10;
  data.set([
    scale / aspect, 0, 0, 0,
    0, -scale, 0, 0,
    0, 0, -(far + near) / (far - near), -1,
    0, 0, -(2 * far * near) / (far - near), 0,
  ], 32);
  return data;
}

module.exports = { vertices, indexes, uniforms };
