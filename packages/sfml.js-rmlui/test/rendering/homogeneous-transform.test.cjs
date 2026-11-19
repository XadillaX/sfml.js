'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function identity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

function quad(rmlui, manager, width = 60, height = 50,
  color = [ 255, 0, 0, 255 ]) {
  const mesh = new rmlui.Mesh(4, 6);
  const floats = new Float32Array(mesh.vertices.buffer);
  const corners = [[ 0, 0 ], [ width, 0 ], [ width, height ], [ 0, height ]];
  for (let i = 0; i < corners.length; ++i) {
    const [ x, y ] = corners[i];
    floats.set([ x, y ], i * 5);
    mesh.vertices.set(color, i * 20 + 8);
    floats.set([ x / width, y / height ], i * 5 + 3);
  }
  mesh.indices.set([ 0, 1, 2, 0, 2, 3 ]);
  return manager.makeGeometry(mesh);
}

// Invert the planar homography at pixel centers, independently of GPU draws.
function localPoint(matrix, translation, x, y) {
  const a = matrix[0] - x * matrix[3];
  const b = matrix[4] - x * matrix[7];
  const c = x * matrix[15] - matrix[12];
  const d = matrix[1] - y * matrix[3];
  const e = matrix[5] - y * matrix[7];
  const f = y * matrix[15] - matrix[13];
  const determinant = a * e - b * d;
  return {
    x: (c * e - b * f) / determinant - translation.x,
    y: (a * f - c * d) / determinant - translation.y,
  };
}

function checkCoverage(options, matrix, translation, mask = false) {
  const { sfml, rmlui, manager, window } = options;
  const geometry = quad(rmlui, manager);
  window.clear(sfml.Color.Black);
  window.flush();

  if (mask) {
    manager.setClipMask([{
      operation: rmlui.ClipMaskOperation.Set,
      geometry,
      absoluteOffset: translation,
      transform: matrix,
    }]);
    const fill = quad(rmlui, manager, 160, 120);
    fill.render({ x: 0, y: 0 });
    fill.release();
  } else {
    manager.setTransform(matrix);
    geometry.render(translation);
  }

  const capture = new sfml.Texture(window.getSize());
  capture.update(window);
  const image = capture.copyToImage();
  let interior = 0;
  let exterior = 0;
  for (let y = 2; y < 118; y += 3) {
    for (let x = 2; x < 158; x += 3) {
      const point = localPoint(matrix, translation, x + 0.5, y + 0.5);
      const w = matrix[3] * (point.x + translation.x) +
        matrix[7] * (point.y + translation.y) + matrix[15];
      const z = matrix[2] * (point.x + translation.x) +
        matrix[6] * (point.y + translation.y) + matrix[14];
      const inside = point.x > 1 && point.x < 59 &&
        point.y > 1 && point.y < 49 && w > 0 && Math.abs(z) < 10000 * w;
      const outside = point.x < -1 || point.x > 61 ||
        point.y < -1 || point.y > 51 || w < 0 || Math.abs(z) > 10000 * w;
      if (!inside && !outside) {
        continue;
      }
      const color = image.getPixel(new sfml.Vector2u(x, y));
      assert.deepEqual([ color.r, color.g, color.b ],
        inside ? [ 255, 0, 0 ] : [ 0, 0, 0 ], `pixel ${x},${y}`);
      if (inside) {
        ++interior;
      } else {
        ++exterior;
      }
    }
  }
  assert.ok(exterior > 100);
  if (matrix[15] > 0 && Math.abs(matrix[14]) < 10000) {
    assert.ok(interior > 20, 'oracle must expect nonempty content');
  }
  manager.resetState();
  geometry.release();
}

const cases = {
  'nonuniform-skew-translation-order': options => {
    const matrix = identity();
    matrix[0] = 1.3;
    matrix[1] = 0.3;
    matrix[4] = -0.2;
    matrix[5] = 0.8;
    matrix[12] = 25;
    matrix[13] = 12;
    checkCoverage(options, matrix, { x: 8, y: 9 });
  },

  'perspective-coverage': options => {
    const matrix = identity();
    matrix[3] = 0.015;
    matrix[7] = 0.005;
    matrix[12] = 18;
    matrix[13] = 12;
    checkCoverage(options, matrix, { x: 8, y: 9 });
  },

  'perspective-mask-coverage': options => {
    const matrix = identity();
    matrix[3] = 0.015;
    matrix[7] = 0.005;
    matrix[12] = 18;
    matrix[13] = 12;
    checkCoverage(options, matrix, { x: 8, y: 9 }, true);
  },

  'z-outside-official-projection': options => {
    const matrix = identity();
    matrix[14] = 11000;
    checkCoverage(options, matrix, { x: 8, y: 9 });
  },

  'homogeneous-z-clipping-with-varying-w': options => {
    const matrix = identity();
    matrix[3] = -0.01;
    matrix[14] = 6500;
    checkCoverage(options, matrix, { x: 0, y: 0 });
  },

  'negative-w-is-clipped': options => {
    const matrix = identity();
    matrix[15] = -1;
    checkCoverage(options, matrix, { x: 8, y: 9 });
  },

  'perspective-correct-texture-interpolation-and-upload-snapshot': options => {
    const { sfml, rmlui, manager, window } = options;
    const matrix = identity();
    matrix[3] = 0.015;
    matrix[7] = 0.005;
    matrix[12] = 18;
    matrix[13] = 12;
    const translation = { x: 8, y: 9 };
    const bytes = new Uint8Array(64 * 64 * 4);
    for (let y = 0; y < 64; ++y) {
      for (let x = 0; x < 64; ++x) {
        bytes.set([ x * 4, y * 4, 0, 255 ], (y * 64 + x) * 4);
      }
    }
    const owned = manager.makeCallbackTexture(api =>
      api.generateTexture(bytes, { x: 64, y: 64 }));
    const texture = owned.toTexture();
    assert.deepEqual(texture.getDimensions(), { x: 64, y: 64 });
    bytes.fill(0);
    const geometry = quad(rmlui, manager, 60, 50, [ 255, 255, 255, 255 ]);

    window.clear(sfml.Color.Black);
    window.flush();
    manager.setTransform(matrix);
    matrix[12] = 99;
    const snapshot = manager.getState().transform;
    geometry.render(translation, texture);
    const capture = new sfml.Texture(window.getSize());
    capture.update(window);
    const image = capture.copyToImage();
    let samples = 0;
    for (let y = 2; y < 118; ++y) {
      for (let x = 2; x < 158; ++x) {
        const point = localPoint(snapshot, translation, x + 0.5, y + 0.5);
        if (point.x < 3 || point.x > 57 || point.y < 3 || point.y > 47) {
          continue;
        }
        const color = image.getPixel(new sfml.Vector2u(x, y));
        const expected = [ (point.x / 60 * 64 - 0.5) * 4,
          (point.y / 50 * 64 - 0.5) * 4 ];
        assert.ok(Math.abs(color.r - expected[0]) <= 2, `red ${x},${y}`);
        assert.ok(Math.abs(color.g - expected[1]) <= 2, `green ${x},${y}`);
        assert.equal(color.b, 0);
        ++samples;
      }
    }
    assert.ok(samples > 100, 'UV oracle must inspect nonempty content');
    manager.resetState();
    geometry.release();
    owned.release();
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Homogeneous transforms',
    { settings: { stencilBits: 8 } });
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('homogeneous-transform', 160, 120);
  context.render();
  try {
    await cases[name]({
      sfml, rmlui, window, context, manager: context.getRenderManager(),
    });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [ __filename, name ], {
      encoding: 'utf8', timeout: 20000,
    });
    if (result.status === 0) {
      console.log(`PASS ${name}`);
    } else {
      ++failures;
      console.error(`FAIL ${name}`, result.stdout, result.stderr);
    }
  }
  assert.equal(failures, 0, `${failures} homogeneous transform failures`);
}
