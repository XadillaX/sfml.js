'use strict';

// The z=0, unwrapped slice of upstream stb_perlin.h (Sean Barrett).
// Original permutation and gradient weights; see stb_perlin.LICENSE.
const permutation = [
  23, 125, 161, 52, 103, 117, 70, 37, 247, 101, 203, 169, 124, 126, 44, 123,
  152, 238, 145, 45, 171, 114, 253, 10, 192, 136, 4, 157, 249, 30, 35, 72,
  175, 63, 77, 90, 181, 16, 96, 111, 133, 104, 75, 162, 93, 56, 66, 240,
  8, 50, 84, 229, 49, 210, 173, 239, 141, 1, 87, 18, 2, 198, 143, 57,
  225, 160, 58, 217, 168, 206, 245, 204, 199, 6, 73, 60, 20, 230, 211, 233,
  94, 200, 88, 9, 74, 155, 33, 15, 219, 130, 226, 202, 83, 236, 42, 172,
  165, 218, 55, 222, 46, 107, 98, 154, 109, 67, 196, 178, 127, 158, 13, 243,
  65, 79, 166, 248, 25, 224, 115, 80, 68, 51, 184, 128, 232, 208, 151, 122,
  26, 212, 105, 43, 179, 213, 235, 148, 146, 89, 14, 195, 28, 78, 112, 76,
  250, 47, 24, 251, 140, 108, 186, 190, 228, 170, 183, 139, 39, 188, 244, 246,
  132, 48, 119, 144, 180, 138, 134, 193, 82, 182, 120, 121, 86, 220, 209, 3,
  91, 241, 149, 85, 205, 150, 113, 216, 31, 100, 41, 164, 177, 214, 153, 231,
  38, 71, 185, 174, 97, 201, 29, 95, 7, 92, 54, 254, 191, 118, 34, 221,
  131, 11, 163, 99, 234, 81, 227, 147, 156, 176, 17, 142, 69, 12, 110, 62,
  27, 255, 0, 194, 59, 116, 242, 252, 19, 21, 187, 53, 207, 129, 64, 135,
  61, 40, 167, 237, 102, 223, 106, 159, 197, 189, 215, 137, 36, 32, 22, 5,
];
const table = permutation.concat(permutation);
const basis = [
  [ 1, 1 ], [ -1, 1 ], [ 1, -1 ], [ -1, -1 ],
  [ 1, 0 ], [ -1, 0 ], [ 1, 0 ], [ -1, 0 ],
  [ 0, 1 ], [ 0, -1 ], [ 0, 1 ], [ 0, -1 ],
];
const indices = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 9, 1, 11,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
];

/**
 * Evaluate the original weighted gradient at z=0.
 * @param {number} hash - Permuted lattice index.
 * @param {number} x - Horizontal displacement.
 * @param {number} y - Vertical displacement.
 */
function gradient(hash, x, y) {
  const [ dx, dy ] = basis[indices[hash % 64]];
  return dx * x + dy * y;
}

/**
 * Evaluate stb_perlin_noise3(x, y, 0, 0, 0, 0).
 * @param {number} x - Horizontal noise coordinate.
 * @param {number} y - Vertical noise coordinate.
 */
function noise(x, y) {
  const px = Math.floor(x);
  const py = Math.floor(y);
  const x0 = (px % 256 + 256) % 256;
  const y0 = (py % 256 + 256) % 256;
  const r0 = table[x0];
  const r1 = table[(x0 + 1) % 256];
  const y1 = (y0 + 1) % 256;
  x -= px;
  y -= py;

  const u = ((x * 6 - 15) * x + 10) * x * x * x;
  const v = ((y * 6 - 15) * y + 10) * y * y * y;
  const n00 = gradient(table[table[r0 + y0]], x, y);
  const n01 = gradient(table[table[r0 + y1]], x, y - 1);
  const n10 = gradient(table[table[r1 + y0]], x - 1, y);
  const n11 = gradient(table[table[r1 + y1]], x - 1, y - 1);
  const n0 = n00 + (n01 - n00) * v;
  const n1 = n10 + (n11 - n10) * v;
  return n0 + (n1 - n0) * u;
}

module.exports = noise;
