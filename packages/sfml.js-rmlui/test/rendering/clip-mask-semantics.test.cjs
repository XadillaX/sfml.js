'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function quad(rmlui, manager, size = 70, duplicate = false) {
  const mesh = new rmlui.Mesh(4, duplicate ? 12 : 6);
  const floats = new Float32Array(mesh.vertices.buffer);
  const corners = [[ 0, 0 ], [ size, 0 ], [ size, size ], [ 0, size ]];
  for (let i = 0; i < 4; ++i) {
    floats.set(corners[i], i * 5);
    mesh.vertices.set([ 255, 0, 0, 255 ], i * 20 + 8);
  }
  mesh.indices.set([ 0, 1, 2, 0, 2, 3 ]);
  if (duplicate) {
    mesh.indices.set([ 0, 1, 2, 0, 2, 3 ], 6);
  }
  return manager.makeGeometry(mesh);
}

function mask(rmlui, geometry, operation, x = 0, y = 0) {
  return {
    operation: rmlui.ClipMaskOperation[operation], geometry,
    absoluteOffset: { x, y }, transform: null,
  };
}

function capture({ sfml, window }) {
  const texture = new sfml.Texture(window.getSize());
  texture.update(window);
  return texture.copyToImage();
}

function expectPixel(options, image, x, y, visible) {
  const color = image.getPixel(new options.sfml.Vector2u(x, y));
  assert.deepEqual([ color.r, color.g, color.b ],
    visible ? [ 255, 0, 0 ] : [ 0, 0, 0 ], `pixel ${x},${y}`);
}

const cases = {
  'duplicate-intersection-fragments-are-boolean': options => {
    const { rmlui, manager } = options;
    const fill = quad(rmlui, manager);
    const initial = quad(rmlui, manager, 50);
    const duplicate = quad(rmlui, manager, 25, true);
    manager.setClipMask([
      mask(rmlui, initial, 'Set'),
      mask(rmlui, duplicate, 'Intersect', 10, 10),
    ]);
    fill.render({ x: 0, y: 0 });
    const image = capture(options);
    expectPixel(options, image, 18, 20, true);
    expectPixel(options, image, 5, 5, false);
    expectPixel(options, image, 40, 40, false);
    manager.resetState();
    for (const geometry of [ fill, initial, duplicate ]) {
      geometry.release();
    }
  },

  'deep-intersections-normalize-eight-bit-stencil': options => {
    const { rmlui, manager } = options;
    const fill = quad(rmlui, manager);
    const initial = quad(rmlui, manager, 50);
    const inner = quad(rmlui, manager, 25);
    const final = quad(rmlui, manager, 10);
    const masks = [ mask(rmlui, initial, 'Set') ];
    for (let i = 0; i < 520; ++i) {
      masks.push(mask(rmlui, inner, 'Intersect', 10, 10));
    }
    masks.push(mask(rmlui, final, 'Intersect', 15, 15));
    manager.setClipMask(masks);
    fill.render({ x: 0, y: 0 });
    const image = capture(options);
    expectPixel(options, image, 18, 20, true);
    expectPixel(options, image, 30, 30, false);
    expectPixel(options, image, 5, 5, false);
    expectPixel(options, image, 40, 40, false);
    manager.resetState();
    for (const geometry of [ fill, initial, inner, final ]) {
      geometry.release();
    }
  },

  'mask-retains-definition-time-write-scissor': options => {
    const { rmlui, manager } = options;
    const fill = quad(rmlui, manager);
    const region = quad(rmlui, manager, 50);
    manager.setScissorRegion({ p0: { x: 10, y: 10 }, p1: { x: 30, y: 30 } });
    manager.setClipMask([ mask(rmlui, region, 'Set') ]);
    manager.disableScissorRegion();
    fill.render({ x: 0, y: 0 });
    const image = capture(options);
    expectPixel(options, image, 20, 20, true);
    expectPixel(options, image, 5, 5, false);
    expectPixel(options, image, 40, 40, false);
    manager.resetState();
    fill.release();
    region.release();
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Clip mask semantics',
    { settings: { stencilBits: 8 } });
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('clip-mask-semantics', 160, 120);
  context.render();
  window.clear(sfml.Color.Black);
  window.flush();
  try {
    cases[name]({
      sfml, rmlui, window, context, manager: context.getRenderManager(),
    });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]);
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
  assert.equal(failures, 0, `${failures} clip mask semantic failures`);
}
