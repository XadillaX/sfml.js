'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const specifications = [
  [ 'brightness', 0.5, [ 40, 60, 80 ]],
  [ 'contrast', 0.5, [ 104, 124, 144 ]],
  [ 'invert', 0.5, [ 128, 128, 128 ]],
  [ 'grayscale', 1, [ 114, 114, 114 ]],
  [ 'sepia', 1, [ 154, 137, 107 ]],
  [ 'hue-rotate', 0, [ 80, 120, 160 ]],
  [ 'saturate', 0, [ 114, 114, 114 ]],
  [ 'opacity', 0.5, [ 40, 60, 80 ]],
];

function quad(rmlui, manager, colour) {
  const mesh = new rmlui.Mesh(4, 6);
  const vertices = [
    [ 20, 20 ], [ 60, 20 ], [ 60, 60 ], [ 20, 60 ],
  ];
  for (let index = 0; index < vertices.length; ++index) {
    const vertex = mesh.getVertex(index);
    vertex.position = { x: vertices[index][0], y: vertices[index][1] };
    vertex.colour = {
      red: colour[0], green: colour[1], blue: colour[2], alpha: colour[3],
    };
  }
  mesh.indices.set([ 0, 1, 2, 0, 2, 3 ]);
  return manager.makeGeometry(mesh);
}

function capture(sfml, window) {
  const texture = new sfml.Texture(window.getSize());
  texture.update(window);
  return texture.copyToImage();
}

function checkPixel(sfml, image, x, y, expected) {
  const pixel = image.getPixel(new sfml.Vector2u(x, y));
  const actual = [ pixel.r, pixel.g, pixel.b ];
  for (let channel = 0; channel < 3; ++channel) {
    assert.ok(Math.abs(actual[channel] - expected[channel]) <= 2,
      `Pixel ${x},${y}: ${actual} != ${expected}`);
  }
}

function renderChain(options, effects, colour = [ 80, 120, 160, 255 ]) {
  const { rmlui, manager, sfml, window } = options;
  window.clear(sfml.Color.Black);
  window.flush();
  const base = manager.getTopLayer();
  const layer = manager.pushLayer();
  const geometry = quad(rmlui, manager, colour);
  const filters = new rmlui.FilterHandleList();
  const owned = [];
  try {
    geometry.render({ x: 0, y: 0 });
    for (const [ name, value ] of effects) {
      const filter = manager.compileFilter(name, { value });
      assert.ok(filter.isValid, `${name} must compile`);
      filter.addHandleTo(filters);
      owned.push(filter);
    }
    manager.compositeLayers(layer, base, rmlui.BlendMode.Replace, filters);
  } finally {
    manager.popLayer();
    filters.clear();
    for (const filter of owned) {
      filter.release();
    }
    geometry.release();
  }
  return capture(sfml, window);
}

const cases = {};
for (const [ name, value, expected ] of specifications) {
  cases[`${name}-native-parameter-and-pixels`] = options => {
    const image = renderChain(options, [[ name, value ]]);
    checkPixel(options.sfml, image, 40, 40, expected);
    checkPixel(options.sfml, image, 10, 10, [ 0, 0, 0 ]);
  };
}

cases['ordered-chain-and-premultiplied-constant-terms'] = options => {
  const first = renderChain(options, [[ 'brightness', 0.5 ], [ 'invert', 1 ]]);
  checkPixel(options.sfml, first, 40, 40, [ 215, 195, 175 ]);
  const second = renderChain(options, [[ 'invert', 1 ], [ 'brightness', 0.5 ]]);
  checkPixel(options.sfml, second, 40, 40, [ 88, 68, 48 ]);
  const translucent = renderChain(options, [[ 'invert', 1 ]],
    [ 40, 60, 80, 128 ]);
  checkPixel(options.sfml, translucent, 40, 40, [ 88, 68, 48 ]);
  checkPixel(options.sfml, translucent, 10, 10, [ 0, 0, 0 ]);
};

cases['nonzero-hue-rotation-and-invert-clamping'] = options => {
  const rotated = renderChain(options, [[ 'hue-rotate', Math.PI ]],
    [ 255, 0, 0, 255 ]);
  checkPixel(options.sfml, rotated, 40, 40, [ 0, 109, 109 ]);
  const clamped = renderChain(options, [[ 'invert', 4 ]]);
  checkPixel(options.sfml, clamped, 40, 40, [ 175, 135, 95 ]);
};

cases['translucent-matrix-preserves-upstream-channel-saturation'] = options => {
  // GL3 applies the matrix in premultiplied space, then the RGBA8 attachment
  // clamps channels to [0, 1]. Clamping RGB to source alpha changes the result.
  const sepia = renderChain(options, [[ 'sepia', 1 ]],
    [ 128, 128, 128, 128 ]);
  checkPixel(options.sfml, sepia, 40, 40, [ 173, 154, 120 ]);
  const bright = renderChain(options, [[ 'brightness', 2 ]],
    [ 128, 128, 128, 128 ]);
  checkPixel(options.sfml, bright, 40, 40, [ 255, 255, 255 ]);
};

cases['rcss-instancers-send-resolved-filter-values'] = options => {
  const { context, sfml, window } = options;
  const document = context.loadDocumentFromMemory(
    '<rml><head><style>body{margin:0}' +
    '#target{position:absolute;left:20px;top:20px;width:40px;height:40px;' +
    'background:#5078a0;filter:brightness(50%) invert(100%)}</style></head>' +
    '<body><div id="target"/></body></rml>');
  document.show();
  context.update();
  window.clear(sfml.Color.Black);
  window.flush();
  context.render();
  const image = capture(sfml, window);
  checkPixel(sfml, image, 40, 40, [ 215, 195, 175 ]);
  checkPixel(sfml, image, 10, 10, [ 0, 0, 0 ]);
};

cases['finite-parameters-and-independent-filter-lifetimes'] = options => {
  const { manager } = options;
  for (const [ name ] of specifications) {
    assert.throws(() => manager.compileFilter(name, { value: Infinity }),
      /finite|parameter/i);
    assert.throws(() => manager.compileFilter(name, { value: 'invalid' }),
      /finite|parameter/i);
    const defaults = manager.compileFilter(name, {});
    assert.ok(defaults.isValid, `${name} native default must compile`);
    defaults.release();
    defaults.release();
    assert.equal(defaults.isValid, false);
  }
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(80, 80)), 'Color filters',
    { settings: { stencilBits: 8 } });
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('color-filters', 80, 80);
  context.render();
  try {
    await cases[name]({
      rmlui, sfml, window, context, manager: context.getRenderManager(),
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
    const result = spawnSync(process.execPath, [ __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} color filter failures`);
}
