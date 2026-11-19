'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function measure(native, action) {
  native.beginDataDiagnostics(false);
  let counts;
  try {
    action();
  } finally {
    counts = native.endDataDiagnostics();
  }
  return counts;
}

function pixel(sfml, window, x, y) {
  const texture = new sfml.Texture(window.getSize());
  texture.update(window);
  const value = texture.copyToImage().getPixel(new sfml.Vector2u(x, y));
  return [ value.r, value.g, value.b ];
}

function load(context, style, body) {
  const document = context.loadDocumentFromMemory(
    '<rml><head><style>body{display:block;margin:0;width:160px;' +
    'height:120px;overflow:visible}' + style +
    '</style></head><body>' + body + '</body></rml>');
  document.show();
  context.update();
  return document;
}

const cases = {
  'distinct-geometry-dirty-and-static-bounded-batches': options => {
    const { context, native } = options;
    for (const size of [ 1000, 10000, 100000 ]) {
      const document = load(context,
        'i{display:block;height:1px;width:20px;background-color:#56a6c4}',
        '<i/>'.repeat(size));
      const first = measure(native, () => context.render());
      assert.equal(first.geometryCompiles, size);
      assert.ok(first.geometryDraws <= Math.ceil(size * 6 / 65535) + 1,
        `${size}: ${JSON.stringify(first)}`);
      assert.equal(first.geometryUploadBytes, size * 6 * 20);
      assert.equal(first.geometryBatchCommands, size);
      const clean = measure(native, () => context.render());
      assert.equal(clean.geometryCompiles, 0);
      assert.equal(clean.geometryUploads, 0);
      assert.equal(clean.geometryBatchCopiedBytes, 0);
      assert.ok(clean.geometryBatchCacheHits > 0);
      assert.ok(clean.geometryBatchCacheBytes <= 32 * 1024 * 1024);
      const elements = document.getElementsByTagName('i');
      const commands = new options.rmlui.ElementCommandBuffer(
        context, elements, size);
      commands.opcodes.fill(options.rmlui.ElementCommandOpcode.SetNumeric);
      commands.properties.fill(options.rmlui.PropertyId.Width);
      commands.units.fill(options.rmlui.Unit.PX);
      commands.numbers.fill(21);
      for (let i = 0; i < size; ++i) {
        commands.elements[i] = i;
      }
      commands.submit(size);
      context.update();
      const dirty = measure(native, () => context.render());
      assert.equal(dirty.geometryCompiles, size);
      assert.equal(dirty.geometryUploadBytes, size * 6 * 20);
      assert.ok(dirty.geometryDraws <= Math.ceil(size * 6 / 65535) + 1);
      assert.equal(dirty.geometryBatchCommands, size);
      const sparseSize = size / 100;
      commands.numbers.fill(22, 0, sparseSize);
      commands.submit(sparseSize);
      context.update();
      const sparse = measure(native, () => context.render());
      assert.equal(sparse.geometryCompiles, sparseSize);
      assert.equal(sparse.geometryUploadBytes, sparseSize * 6 * 20);
      assert.equal(sparse.geometryBatchCopiedBytes, sparseSize * 6 * 20);
      console.log(JSON.stringify({ size, first, clean, dirty }));
      document.close();
      context.update();
    }
  },

  'ordered-alpha-scissor-transform-and-frame-end': options => {
    const { context, sfml, window } = options;
    load(context,
      'i{position:absolute;display:block;width:40px;height:40px;' +
      'background-color:#ff000080}' +
      'b{position:absolute;display:block;width:40px;height:40px;' +
      'background-color:#0000ff80;left:20px}' +
      '#clip{position:absolute;left:80px;top:10px;width:20px;' +
      'height:20px;overflow:hidden}' +
      '#clip i{position:relative;width:40px;height:40px;' +
      'background-color:#00ff00}' +
      '#move{position:absolute;left:5px;top:70px;width:10px;height:10px;' +
      'background-color:#ffffff;transform:translateX(20px)}',
      '<i/><b/><div id="clip"><i/></div><div id="move"/>');
    context.render();
    const overlap = pixel(sfml, window, 25, 15);
    assert.ok(Math.abs(overlap[0] - 64) <= 2, overlap);
    assert.ok(Math.abs(overlap[2] - 128) <= 2, overlap);
    assert.deepEqual(pixel(sfml, window, 85, 15), [ 0, 255, 0 ]);
    assert.deepEqual(pixel(sfml, window, 105, 15), [ 0, 0, 0 ]);
    assert.deepEqual(pixel(sfml, window, 27, 72), [ 255, 255, 255 ]);
    assert.deepEqual(pixel(sfml, window, 7, 72), [ 0, 0, 0 ]);
  },

  'callback-keeps-host-untouched-and-exception-recovers': options => {
    const { context, manager, rmlui, sfml, window } = options;
    const document = load(context,
      'i{position:absolute;display:block;width:20px;height:20px;' +
      'background-color:#ff0000}' +
      '#callback{position:absolute;left:50px;width:10px;height:10px}',
      '<i/><i/><div id="callback"/>');
    let fail = false;
    let calls = 0;
    const decorator = new rmlui.Decorator(manager, {
      generateElementData: () => ({}),
      releaseElementData() {},
      renderElement() {
        ++calls;
        assert.deepEqual(pixel(sfml, window, 5, 5),
          fail ? [ 255, 0, 0 ] : [ 0, 0, 0 ]);
        if (fail) {
          throw new Error('batch callback marker');
        }
      },
    });
    rmlui.DecoratorInstancer.register('batch-probe',
      new rmlui.DecoratorInstancer(() => decorator));
    document.getElementById('callback')
      .setProperty('decorator', 'batch-probe()');
    context.update();
    context.render();
    assert.ok(calls > 0);
    fail = true;
    assert.throws(() => context.render(), /batch callback marker/);
    fail = false;
    window.clear(sfml.Color.Black);
    window.flush();
    context.render();
    assert.deepEqual(pixel(sfml, window, 5, 5), [ 255, 0, 0 ]);
  },

  'shared-texture-switch-and-released-source-snapshots': async options => {
    const { context, rmlui, native, sfml, window } = options;
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-textures-'));
    try {
      const sources = [ 'red', 'blue' ].map((name, i) => {
        const source = path.join(directory, `${name}.png`);
        const image = new sfml.Image(new sfml.Vector2u(1, 1),
          i ? sfml.Color.Blue : sfml.Color.Red);
        return image.saveToFile(source).then(() => source);
      });
      const [ red, blue ] = (await Promise.all(sources))
        .map(source => path.relative(os.tmpdir(), source));
      const document = load(context,
        'img{display:inline-block;width:20px;height:20px}',
        `<img src="${red}"/><img src="${red}"/><img src="${blue}"/>` +
        `<img src="${blue}"/><img src="${red}"/><img src="${red}"/>`);
      context.render();
      assert.deepEqual(pixel(sfml, window, 5, 5), [ 255, 0, 0 ]);
      assert.deepEqual(pixel(sfml, window, 45, 5), [ 0, 0, 255 ]);
      assert.deepEqual(pixel(sfml, window, 85, 5), [ 255, 0, 0 ]);
      const clean = measure(native, () => context.render());
      assert.equal(clean.geometryUploads, 0);
      assert.equal(clean.geometryDraws, 3);
      assert.equal(clean.geometryBatchCacheHits, 3);
      rmlui.releaseTextures();
      context.render();
      assert.deepEqual(pixel(sfml, window, 45, 5), [ 0, 0, 255 ]);
      document.close();
      context.update();
      context.render();
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },

  'native-layer-filter-and-stencil-boundaries': options => {
    const { context, sfml, window } = options;
    load(context,
      'i{display:block;position:absolute;width:40px;height:40px;' +
      'background-color:#ff0000}' +
      '#layer{position:absolute;width:40px;height:40px;opacity:0.5;' +
      'filter:blur(0px)}' +
      '#layer i{background-color:#0000ff}' +
      '#mask{position:absolute;left:80px;top:10px;width:30px;height:30px;' +
      'overflow:hidden;border-radius:10px}' +
      '#mask i{position:relative;background-color:#00ff00}',
      '<i/><i/><div id="layer"><i/><i/></div>' +
      '<div id="mask"><i/><i/></div>');
    context.render();
    const blend = pixel(sfml, window, 10, 10);
    // RmlUi propagates opacity to both overlapping descendants.
    assert.ok(Math.abs(blend[0] - 64) <= 2, blend);
    assert.ok(Math.abs(blend[2] - 191) <= 2, blend);
    assert.deepEqual(pixel(sfml, window, 95, 25), [ 0, 255, 0 ]);
    assert.deepEqual(pixel(sfml, window, 80, 10), [ 0, 0, 0 ]);
    assert.deepEqual(pixel(sfml, window, 115, 25), [ 0, 0, 0 ]);
  },

  'cache-slot-overflow-streams-and-frame-trims-unused-buffers': options => {
    const { context, native } = options;
    const containers = Array.from({ length: 1000 }, (_, i) =>
      `<div style="left:${i % 100}px;top:${Math.floor(i / 100)}px">` +
      '<i/><i/></div>').join('');
    const document = load(context,
      'div{position:absolute;display:block;width:1px;height:1px;' +
      'overflow:hidden}' +
      'i{position:relative;display:block;height:1px;width:1px;' +
      'background-color:#ffffff}',
      containers);
    context.render();
    const clean = measure(native, () => context.render());
    assert.equal(clean.geometryBatchCacheHits, 512);
    assert.equal(clean.geometryBatchCacheMisses, 488);
    assert.equal(clean.geometryDraws, 1000);
    assert.equal(clean.geometryUploads, 488);
    assert.ok(clean.geometryBatchCacheBytes <= 32 * 1024 * 1024);
    document.close();
    context.update();
    const empty = measure(native, () => context.render());
    assert.equal(empty.geometryBatchCacheBytes, 0);
    assert.equal(empty.geometryDraws, 0);
  },

  'partial-upload-offsets-and-shape-change-pixels': options => {
    const { context, native, sfml, window } = options;
    const document = load(context,
      'i{display:block;width:20px;height:20px;background-color:#ffffff}',
      '<i id="first"/><i id="second"/><i/>');
    context.render();
    document.getElementById('first').setProperty('width', '22px');
    context.update();
    window.clear(sfml.Color.Black);
    window.flush();
    let counts = measure(native, () => context.render());
    assert.equal(counts.geometryUploadBytes, 120);
    assert.deepEqual(pixel(sfml, window, 21, 5), [ 255, 255, 255 ]);
    assert.deepEqual(pixel(sfml, window, 21, 25), [ 0, 0, 0 ]);
    document.getElementById('second').setProperty('height', '21px');
    context.update();
    window.clear(sfml.Color.Black);
    window.flush();
    counts = measure(native, () => context.render());
    assert.equal(counts.geometryUploadBytes, 240);
    assert.deepEqual(pixel(sfml, window, 5, 60), [ 255, 255, 255 ]);
    assert.deepEqual(pixel(sfml, window, 5, 61), [ 0, 0, 0 ]);
    const first = document.getElementById('first');
    first.setProperty('border-width', '1px');
    first.setProperty('border-color', '#ff0000');
    context.update();
    window.clear(sfml.Color.Black);
    window.flush();
    counts = measure(native, () => context.render());
    assert.ok(counts.geometryUploadBytes > 360);
    assert.equal(counts.geometryDraws, 1);
    assert.deepEqual(pixel(sfml, window, 0, 0), [ 255, 0, 0 ]);
    assert.deepEqual(pixel(sfml, window, 1, 1), [ 255, 255, 255 ]);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const native = require('../../build/Release/rmlui.node');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Geometry batching',
    { settings: { stencilBits: 8 } });
  assert.ok(rmlui.initialise(window, {
    highDpi: false, fileRoot: os.tmpdir(),
  }));
  const context = rmlui.createContext('render-batching', 160, 120);
  window.clear(sfml.Color.Black);
  window.flush();
  try {
    await cases[name]({
      rmlui, sfml, native, window, context,
      manager: context.getRenderManager(),
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
      encoding: 'utf8', timeout: 300000,
    });
    if (result.status !== 0 || /Leaking \w+ detected/.test(result.stderr)) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`, result.stdout);
    }
  }
  assert.equal(failures, 0, `${failures} batching failures`);
}
