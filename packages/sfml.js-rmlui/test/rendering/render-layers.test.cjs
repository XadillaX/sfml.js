'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function quad(rmlui, manager, colour, size = 40) {
  const mesh = new rmlui.Mesh(4, 6);
  const floats = new Float32Array(mesh.vertices.buffer);
  const points = [[ 0, 0 ], [ size, 0 ], [ size, size ], [ 0, size ]];
  for (let i = 0; i < points.length; ++i) {
    floats[i * 5] = points[i][0];
    floats[i * 5 + 1] = points[i][1];
    mesh.vertices.set(colour, i * 20 + 8);
  }
  mesh.indices.set([ 0, 1, 2, 0, 2, 3 ]);
  return manager.makeGeometry(mesh);
}

function capture(sfml, window) {
  const texture = new sfml.Texture(window.getSize());
  texture.update(window);
  return texture.copyToImage();
}

function rgb(sfml, image, x, y) {
  const c = image.getPixel(new sfml.Vector2u(x, y));
  return [ c.r, c.g, c.b ];
}

const cases = {
  'balanced-stack-and-stale-pool-token': ({ manager, rmlui }) => {
    const base = manager.getTopLayer();
    assert.equal(manager.getTopLayer(), base);
    assert.throws(() => manager.getNextLayer(), /empty|layer/i);
    assert.throws(() => manager.popLayer(), /empty|layer/i);
    const first = manager.pushLayer();
    assert.equal(manager.getTopLayer(), first);
    assert.equal(manager.getNextLayer(), base);
    assert.throws(() => manager.prepareRender({ x: 160, y: 120 }),
      /balanced|layer/i);
    const second = manager.pushLayer();
    assert.equal(manager.getNextLayer(), first);
    manager.compositeLayers(second, first, rmlui.BlendMode.Blend);
    manager.popLayer();
    assert.equal(manager.getTopLayer(), first);
    manager.popLayer();
    const reused = manager.pushLayer();
    assert.notEqual(reused, first);
    assert.throws(() => manager.compositeLayers(first, base,
      rmlui.BlendMode.Blend), /valid|released|active/i);
    manager.popLayer();
    manager.prepareRender({ x: 160, y: 120 });
  },

  'nested-blend-and-replace-pixels': ({ manager, rmlui, sfml, window }) => {
    const base = manager.getTopLayer();
    const outer = manager.pushLayer();
    const blue = quad(rmlui, manager, [ 0, 0, 255, 255 ], 80);
    blue.render({ x: 10, y: 10 });
    const inner = manager.pushLayer();
    const red = quad(rmlui, manager, [ 128, 0, 0, 128 ]);
    red.render({ x: 10, y: 10 });
    manager.compositeLayers(inner, outer, rmlui.BlendMode.Blend);
    manager.popLayer();
    manager.compositeLayers(outer, base, rmlui.BlendMode.Replace);
    manager.popLayer();
    const image = capture(sfml, window);
    const blended = rgb(sfml, image, 20, 20);
    assert.ok(Math.abs(blended[0] - 128) <= 1);
    assert.ok(Math.abs(blended[2] - 127) <= 1);
    assert.deepEqual(rgb(sfml, image, 70, 70), [ 0, 0, 255 ]);
    red.release();
    blue.release();
  },

  'filters-consumed-in-order-and-self-composite': options => {
    const { manager, rmlui, sfml, window } = options;
    const base = manager.getTopLayer();
    const layer = manager.pushLayer();
    const red = quad(rmlui, manager, [ 255, 0, 0, 255 ]);
    red.render({ x: 30, y: 30 });
    const filters = new rmlui.FilterHandleList();
    const blur = manager.compileFilter('blur', { sigma: 3 });
    assert.ok(blur.isValid);
    blur.addHandleTo(filters);
    manager.compositeLayers(layer, layer, rmlui.BlendMode.Replace, filters);
    manager.compositeLayers(layer, base, rmlui.BlendMode.Replace);
    manager.popLayer();
    const image = capture(sfml, window);
    const edge = rgb(sfml, image, 28, 45)[0];
    assert.ok(edge > 10 && edge < 180, `Blur edge ${edge}`);
    assert.ok(rgb(sfml, image, 45, 45)[0] > 240);
    blur.release();
    filters.clear();
    red.release();
  },

  'invalid-resources-leave-layer-stack-unchanged': ({ manager, rmlui }) => {
    const base = manager.getTopLayer();
    const layer = manager.pushLayer();
    const other = new rmlui.RenderManager(rmlui.getRenderInterface());
    assert.throws(() => other.pushLayer(), /different|active|manager/i);
    assert.throws(() => manager.compositeLayers(layer, other.getTopLayer(),
      rmlui.BlendMode.Blend), /different.*manager/i);
    assert.throws(() => manager.compositeLayers({}, base,
      rmlui.BlendMode.Blend), /layer/i);
    assert.throws(() => manager.compositeLayers(layer, base, 7), /blend/i);
    manager.compositeLayers(base, layer, rmlui.BlendMode.Blend);
    const filters = new rmlui.FilterHandleList();
    const foreign = other.compileFilter('blur', { sigma: 1 });
    foreign.addHandleTo(filters);
    assert.throws(() => manager.compositeLayers(layer, base,
      rmlui.BlendMode.Blend, filters), /different.*manager/i);
    filters.clear();
    const own = manager.compileFilter('blur', { sigma: 1 });
    own.addHandleTo(filters);
    own.release();
    assert.throws(() => manager.compositeLayers(layer, base,
      rmlui.BlendMode.Blend, filters), /released|empty/i);
    assert.equal(manager.getTopLayer(), layer);
    manager.popLayer();
    foreign.release();
    filters.clear();
  },

  'saved-mask-snapshot-affects-pixels': options => {
    const { manager, rmlui, sfml, window } = options;
    const base = manager.getTopLayer();
    manager.setScissorRegion({
      p0: { x: 20, y: 20 }, p1: { x: 100, y: 100 },
    });
    const maskLayer = manager.pushLayer();
    const maskGeometry = quad(rmlui, manager, [ 255, 255, 255, 255 ], 20);
    maskGeometry.render({ x: 40, y: 40 });
    const mask = manager.saveLayerAsMaskImage();
    assert.ok(mask.isValid);
    manager.popLayer();
    const layer = manager.pushLayer();
    const red = quad(rmlui, manager, [ 255, 0, 0, 255 ], 100);
    red.render({ x: 0, y: 0 });
    const filters = new rmlui.FilterHandleList();
    mask.addHandleTo(filters);
    manager.compositeLayers(layer, base, rmlui.BlendMode.Blend, filters);
    manager.popLayer();
    const image = capture(sfml, window);
    assert.deepEqual(rgb(sfml, image, 45, 45), [ 255, 0, 0 ]);
    assert.deepEqual(rgb(sfml, image, 25, 25), [ 0, 0, 0 ]);
    assert.deepEqual(rgb(sfml, image, 75, 75), [ 0, 0, 0 ]);
    assert.throws(() => manager.compositeLayers(maskLayer, base,
      rmlui.BlendMode.Blend), /valid|released|active/i);
    manager.resetState();
    mask.release();
    filters.clear();
    red.release();
    maskGeometry.release();
  },

  'event-callback-cannot-mutate-layers': ({ manager, context }) => {
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><div id="target"/></body></rml>');
    document.getElementById('target').addEventListener('probe', () => {
      assert.ok(manager.getTopLayer());
      assert.throws(() => manager.pushLayer(), /callback/i);
      assert.throws(() => manager.popLayer(), /callback/i);
      assert.throws(() => manager.saveLayerAsMaskImage(), /callback/i);
    });
    document.getElementById('target').dispatchEvent('probe', {});
  },

  'decorator-layer-scope-and-upstream-ownership': options => {
    const { rmlui, manager, context } = options;
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>#target{display:block;width:40px;height:40px;' +
      'filter:blur(1px)}</style></head><body><div id="target"/></body></rml>');
    const geometry = quad(rmlui, manager, [ 255, 0, 0, 255 ]);
    let rendered = 0;
    const decorator = new rmlui.Decorator(manager, {
      generateElementData: () => ({}),
      releaseElementData() {},
      renderElement() {
        const destination = manager.getTopLayer();
        assert.throws(() => manager.popLayer(), /binding-owned|empty/i);
        const layer = manager.pushLayer();
        try {
          geometry.render({ x: 0, y: 0 });
          manager.compositeLayers(layer, destination, rmlui.BlendMode.Blend,
            new rmlui.FilterHandleList());
          ++rendered;
        } finally {
          manager.popLayer();
        }
      },
    });
    rmlui.DecoratorInstancer.register('layer-probe',
      new rmlui.DecoratorInstancer(() => decorator));
    document.getElementById('target').setProperty('decorator', 'layer-probe()');
    document.show();
    context.update();
    context.render();
    assert.ok(rendered > 0);
    assert.throws(() => manager.getNextLayer(), /empty/i);
    geometry.release();
  },

  'unbalanced-decorator-return-and-exception-restore-stack': options => {
    const { rmlui, manager, context } = options;
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>#target{display:block;width:40px;height:40px;' +
      'filter:blur(1px)}</style></head><body><div id="target"/></body></rml>');
    let mode = 1;
    const decorator = new rmlui.Decorator(manager, {
      generateElementData: () => ({}),
      releaseElementData() {},
      renderElement() {
        if (mode) {
          manager.pushLayer();
          manager.pushLayer();
        }
        if (mode === 2) {
          throw new Error('layer callback boom');
        }
      },
    });
    rmlui.DecoratorInstancer.register('unbalanced-probe',
      new rmlui.DecoratorInstancer(() => decorator));
    document.getElementById('target').setProperty('decorator',
      'unbalanced-probe()');
    document.show();
    context.update();
    assert.throws(() => context.render(), /unbalanced.*layer|layer.*balanced/i);
    assert.throws(() => manager.getNextLayer(), /empty/i);
    mode = 2;
    assert.throws(() => context.render(), /layer callback boom/);
    assert.throws(() => manager.getNextLayer(), /empty/i);
    mode = 0;
    assert.ok(context.render());
  },

  'shutdown-releases-unbalanced-owned-layers': async options => {
    const { rmlui, window } = options;
    let reference;
    let layer;
    (() => {
      const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
      reference = new WeakRef(manager);
      manager.prepareRender({ x: 160, y: 120 });
      layer = manager.pushLayer();
      manager.pushLayer();
    })();
    for (let i = 0; i < 10; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(reference.deref(), undefined);
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
    manager.prepareRender({ x: 160, y: 120 });
    const base = manager.getTopLayer();
    assert.throws(() => manager.compositeLayers(layer, base,
      rmlui.BlendMode.Blend), /valid|generation|manager/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Render layers',
    { settings: { stencilBits: 8 } });
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('render-layers', 160, 120);
  window.clear(sfml.Color.Black);
  window.flush();
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
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0 || /Leaking \w+ detected/.test(result.stderr)) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} render layer failures`);
}
