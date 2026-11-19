'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function identity() {
  return new Float32Array([ 1, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 1, 0, 0, 0, 0, 1 ]);
}

function rectangle(x0, y0, x1, y1) {
  return { p0: { x: x0, y: y0 }, p1: { x: x1, y: y1 } };
}

function square(rmlui, manager, size = 70) {
  const mesh = new rmlui.Mesh(4, 6);
  const floats = new Float32Array(mesh.vertices.buffer);
  const positions = [[ 0, 0 ], [ size, 0 ], [ size, size ], [ 0, size ]];
  for (let i = 0; i < 4; ++i) {
    floats[i * 5] = positions[i][0];
    floats[i * 5 + 1] = positions[i][1];
    mesh.vertices.set([ 255, 0, 0, 255 ], i * 20 + 8);
  }
  mesh.indices.set([ 0, 1, 2, 0, 2, 3 ]);
  return manager.makeGeometry(mesh);
}

function pixels(sfml, window) {
  const capture = new sfml.Texture(window.getSize());
  capture.update(window);
  return capture.copyToImage();
}

function rgb(image, sfml, x, y) {
  const color = image.getPixel(new sfml.Vector2u(x, y));
  return [ color.r, color.g, color.b ];
}

const cases = {
  'viewport-and-scissor-native-defaults': ({ manager }) => {
    manager.prepareRender({ x: 160, y: 120 });
    assert.deepEqual(manager.getViewport(), { x: 160, y: 120 });
    assert.equal(manager.getScissorRegion(), null);
    manager.setScissorRegion(rectangle(-10, 8, 190, 130));
    assert.deepEqual(manager.getScissorRegion(), rectangle(0, 8, 160, 120));
    manager.setViewport({ x: 100, y: 90 });
    assert.deepEqual(manager.getViewport(), { x: 100, y: 90 });
    manager.setScissorRegion(rectangle(0, 0, 150, 100));
    assert.deepEqual(manager.getScissorRegion(), rectangle(0, 0, 100, 90));
    manager.disableScissorRegion();
    assert.equal(manager.getScissorRegion(), null);
    manager.setScissorRegion(null);
    assert.equal(manager.getState().scissorRegion, null);
  },

  'state-transform-copy-and-reset': ({ manager }) => {
    const matrix = identity();
    matrix[12] = 13;
    manager.setTransform(matrix);
    matrix[12] = 99;
    assert.equal(manager.getState().transform[12], 13);
    const saved = manager.getState();
    saved.scissorRegion = rectangle(2, 3, 40, 50);
    saved.transform[13] = 17;
    manager.setState(saved);
    saved.transform[13] = 80;
    const actual = manager.getState();
    assert.deepEqual(actual.scissorRegion, rectangle(2, 3, 40, 50));
    assert.equal(actual.transform[13], 17);
    assert.deepEqual(actual.clipMaskList, []);
    manager.resetState();
    assert.deepEqual(manager.getState(), {
      scissorRegion: null, clipMaskList: [], transform: identity(),
    });
    manager.setTransform(null);
    assert.deepEqual(manager.getState().transform, identity());
  },

  'clip-mask-list-owned-roundtrip': ({ rmlui, manager }) => {
    const geometry = square(rmlui, manager);
    const matrix = identity();
    matrix[12] = 7;
    const mask = {
      operation: rmlui.ClipMaskOperation.Set, geometry,
      absoluteOffset: { x: 10, y: 11 }, transform: matrix,
    };
    manager.setClipMask([ mask ]);
    const saved = manager.getState();
    assert.equal(saved.clipMaskList.length, 1);
    const copied = saved.clipMaskList[0];
    assert.equal(copied.operation, mask.operation);
    assert.deepEqual(copied.absoluteOffset, mask.absoluteOffset);
    assert.notEqual(copied.geometry, geometry);
    assert.deepEqual(copied.geometry.getMesh().indices,
      new Int32Array([ 0, 1, 2, 0, 2, 3 ]));
    matrix[12] = 99;
    geometry.release();
    assert.equal(manager.getState().clipMaskList[0].transform[12], 7);
    manager.disableClipMask();
    assert.equal(manager.getState().clipMaskList.length, 0);
    manager.setState(saved);
    copied.geometry.release();
    assert.ok(manager.getState().clipMaskList[0].geometry.isValid);
    manager.resetState();
  },

  'scissor-and-transform-pixels': options => {
    const { rmlui, manager, sfml, window, context } = options;
    window.clear(sfml.Color.Black);
    window.flush();
    context.render();
    const geometry = square(rmlui, manager);
    manager.setScissorRegion(rectangle(20, 20, 40, 40));
    geometry.render({ x: 0, y: 0 });
    let image = pixels(sfml, window);
    assert.deepEqual(rgb(image, sfml, 25, 25), [ 255, 0, 0 ]);
    assert.deepEqual(rgb(image, sfml, 10, 10), [ 0, 0, 0 ]);
    manager.disableScissorRegion();
    window.clear(sfml.Color.Black);
    window.flush();
    const matrix = identity();
    matrix[12] = 80;
    manager.setTransform(matrix);
    geometry.render({ x: 0, y: 0 });
    image = pixels(sfml, window);
    assert.deepEqual(rgb(image, sfml, 90, 10), [ 255, 0, 0 ]);
    assert.deepEqual(rgb(image, sfml, 10, 10), [ 0, 0, 0 ]);
    manager.resetState();
    geometry.release();
  },

  'single-mask-and-list-transform-pixels': options => {
    const { rmlui, manager, sfml, window, context } = options;
    window.clear(sfml.Color.Black);
    window.flush();
    context.render();
    const geometry = square(rmlui, manager);
    const mask = square(rmlui, manager, 20);
    manager.setClipMask(rmlui.ClipMaskOperation.Set, mask, { x: 20, y: 20 });
    geometry.render({ x: 0, y: 0 });
    let image = pixels(sfml, window);
    assert.deepEqual(rgb(image, sfml, 25, 25), [ 255, 0, 0 ]);
    assert.deepEqual(rgb(image, sfml, 10, 10), [ 0, 0, 0 ]);
    manager.disableClipMask();
    window.clear(sfml.Color.Black);
    window.flush();
    const matrix = identity();
    matrix[12] = 30;
    manager.setClipMask([{
      operation: rmlui.ClipMaskOperation.Set, geometry: mask,
      absoluteOffset: { x: 0, y: 10 }, transform: matrix,
    }]);
    geometry.render({ x: 0, y: 0 });
    image = pixels(sfml, window);
    assert.deepEqual(rgb(image, sfml, 35, 15), [ 255, 0, 0 ]);
    assert.deepEqual(rgb(image, sfml, 10, 15), [ 0, 0, 0 ]);
    assert.deepEqual(manager.getState().transform, identity());
    manager.resetState();
    mask.release();
    geometry.release();
  },

  'inverse-and-intersect-mask-pixels-and-disable': options => {
    const { rmlui, manager, sfml, window } = options;
    const geometry = square(rmlui, manager);
    const mask = square(rmlui, manager, 20);

    window.clear(sfml.Color.Black);
    window.flush();
    manager.setClipMask(rmlui.ClipMaskOperation.SetInverse, mask,
      { x: 20, y: 20 });
    geometry.render({ x: 0, y: 0 });

    let image = pixels(sfml, window);
    assert.deepEqual(rgb(image, sfml, 25, 25), [ 0, 0, 0 ]);
    assert.deepEqual(rgb(image, sfml, 10, 10), [ 255, 0, 0 ]);
    assert.deepEqual(rgb(image, sfml, 45, 45), [ 255, 0, 0 ]);
    manager.disableClipMask();

    window.clear(sfml.Color.Black);
    window.flush();
    manager.setClipMask([
      {
        operation: rmlui.ClipMaskOperation.Set, geometry: mask,
        absoluteOffset: { x: 20, y: 20 }, transform: null,
      },
      {
        operation: rmlui.ClipMaskOperation.Intersect, geometry: mask,
        absoluteOffset: { x: 30, y: 30 }, transform: null,
      },
    ]);
    geometry.render({ x: 0, y: 0 });

    image = pixels(sfml, window);
    assert.deepEqual(rgb(image, sfml, 35, 35), [ 255, 0, 0 ]);
    assert.deepEqual(rgb(image, sfml, 25, 25), [ 0, 0, 0 ]);
    assert.deepEqual(rgb(image, sfml, 45, 45), [ 0, 0, 0 ]);

    manager.disableClipMask();
    geometry.render({ x: 0, y: 0 });
    image = pixels(sfml, window);
    assert.deepEqual(rgb(image, sfml, 25, 25), [ 255, 0, 0 ]);
    assert.deepEqual(rgb(image, sfml, 45, 45), [ 255, 0, 0 ]);
    mask.release();
    geometry.release();
  },

  'mask-pointer-equality': ({ rmlui, manager }) => {
    const geometry = square(rmlui, manager);
    const a = {
      operation: rmlui.ClipMaskOperation.Set, geometry,
      absoluteOffset: { x: 3, y: 4 }, transform: identity(),
    };
    assert.ok(rmlui.clipMaskGeometryEquals(a, {
      ...a, absoluteOffset: { x: 3, y: 4 },
    }));
    assert.ok(!rmlui.clipMaskGeometryEquals(a, {
      ...a, transform: identity(),
    }));
    assert.ok(!rmlui.clipMaskGeometryEquals(a, {
      ...a, geometry: square(rmlui, manager),
    }));
    assert.ok(!rmlui.clipMaskGeometryEquals(a, {
      ...a, absoluteOffset: { x: 3, y: 5 },
    }));
    const b = { ...a, transform: null };
    assert.ok(rmlui.clipMaskGeometryEquals(b, { ...b }));
    geometry.release();
  },

  'invalid-input-transaction-and-manager-ownership': ({ rmlui, manager }) => {
    manager.setScissorRegion(rectangle(1, 2, 30, 40));
    const previous = manager.getState();
    assert.throws(() => manager.setViewport({ x: -1, y: 120 }), /dimension/i);
    assert.throws(() => manager.setViewport({ x: 1.5, y: 120 }), /integer/i);
    assert.throws(() => manager.setScissorRegion(rectangle(0.5, 0, 2, 3)),
      /integer/i);
    assert.throws(() => manager.setTransform(new Float32Array(15)),
      /16|matrix/i);
    const infinite = identity();
    infinite[5] = Infinity;
    assert.throws(() => manager.setTransform(infinite), /finite/i);
    const other = new rmlui.RenderManager(rmlui.getRenderInterface());
    assert.throws(() => manager.setClipMask(rmlui.ClipMaskOperation.Set,
      square(rmlui, other), { x: 0, y: 0 }), /different.*manager/i);
    assert.throws(() => manager.setClipMask(rmlui.ClipMaskOperation.Set,
      new rmlui.Geometry(), { x: 0, y: 0 }), /empty|released/i);
    assert.throws(() => manager.setState({
      scissorRegion: null, clipMaskList: [], transform: infinite,
    }), /finite/i);
    assert.deepEqual(manager.getState(), previous);
    manager.resetState();
  },

  'state-getter-restart-revalidates-manager': options => {
    const { rmlui, manager, window } = options;
    const state = {
      scissorRegion: null, clipMaskList: [],
      get transform() {
        rmlui.shutdown();
        assert.ok(rmlui.initialise(window, { highDpi: false }));
        return identity();
      },
    };
    assert.throws(() => manager.setState(state), /valid/i);
  },

  'integer-coordinates-preserve-full-int32-precision': ({ manager }) => {
    manager.setViewport({ x: 16777217, y: 120 });
    assert.equal(manager.getViewport().x, 16777217);
    manager.setScissorRegion(rectangle(16777216, 0, 16777217, 100));
    assert.equal(manager.getScissorRegion().p1.x, 16777217);
    assert.throws(() => manager.setViewport({ x: 16777216.5, y: 120 }),
      /integer/i);
    assert.throws(() => manager.setScissorRegion(
      rectangle(0, 0, 16777216.5, 100)), /integer/i);
    manager.resetState();
  },

  'matrix-buffer-boundaries': ({ manager }) => {
    const buffer = new ArrayBuffer(80);
    const view = new Float32Array(buffer, 8, 16);
    view.set(identity());
    view[12] = 14;
    manager.setTransform(view);
    assert.equal(manager.getState().transform[12], 14);
    structuredClone(buffer, { transfer: [ buffer ] });
    assert.throws(() => manager.setTransform(view), /16|matrix/i);
    const shared = new Float32Array(new SharedArrayBuffer(64));
    shared.set(identity());
    assert.throws(() => manager.setTransform(shared), /shared|unshared/i);
    const resizable = new Float32Array(new ArrayBuffer(64, {
      maxByteLength: 128,
    }));
    resizable.set(identity());
    assert.throws(() => manager.setTransform(resizable), /fixed|resiz/i);
    manager.resetState();
  },

  'event-callback-state-mutation-guard': ({ manager, context }) => {
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><div id="target"/></body></rml>');
    const element = document.getElementById('target');
    element.addEventListener('probe', () => {
      assert.throws(() => manager.resetState(), /callback/i);
      assert.throws(() => manager.setClipMask([]), /callback/i);
      assert.ok(manager.getState().transform instanceof Float32Array);
    });
    element.dispatchEvent('probe', {});
  },

  'active-borrowed-mask-survives-manager-wrapper-gc': async options => {
    const { rmlui, context } = options;
    let reference;
    (() => {
      const manager = options.manager;
      reference = new WeakRef(manager);
      options.manager = null;
      const geometry = square(rmlui, manager, 20);
      manager.setClipMask(rmlui.ClipMaskOperation.Set, geometry,
        { x: 20, y: 20 });
      geometry.release();
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(reference.deref(), undefined);
    const manager = context.getRenderManager();
    const saved = manager.getState();
    assert.equal(saved.clipMaskList.length, 1);
    assert.deepEqual(saved.clipMaskList[0].geometry.getMesh().indices,
      new Int32Array([ 0, 1, 2, 0, 2, 3 ]));
    manager.resetState();
    saved.clipMaskList[0].geometry.release();
  },

  'decorator-render-state-scope': ({ rmlui, manager, context }) => {
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>#target{display:block;width:20px;height:20px}' +
      '</style></head><body><div id="target"/></body></rml>');
    const element = document.getElementById('target');
    let rendered = 0;
    const decorator = new rmlui.Decorator(manager, {
      generateElementData: () => ({}),
      releaseElementData() {},
      renderElement() {
        const saved = manager.getState();
        try {
          manager.setTransform(identity());
          manager.setScissorRegion(rectangle(0, 0, 20, 20));
          manager.setClipMask([]);
          ++rendered;
        } finally {
          manager.setState(saved);
          for (const mask of saved.clipMaskList) {
            mask.geometry.release();
          }
        }
      },
    });
    rmlui.DecoratorInstancer.register('state-probe',
      new rmlui.DecoratorInstancer(() => decorator));
    assert.ok(element.setProperty('decorator', 'state-probe()'));
    document.show();
    context.update();
    context.render();
    assert.ok(rendered > 0);
  },

  'retained-state-after-source-document-close': options => {
    const { rmlui, context, manager } = options;
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>body{width:100px;height:100px}' +
      '#clip{display:block;width:50px;height:50px;overflow:hidden;' +
      'border-radius:10px}#child{display:block;width:100px;height:100px}' +
      '</style></head><body><div id="clip"><div id="child"/>' +
      '</div></body></rml>');
    document.show();
    context.update();
    const result = rmlui.ElementUtilities.getClippingRegion(
      document.getElementById('child'), true);
    assert.equal(result.clipMask.length, 1);
    manager.setClipMask(result.clipMask);
    const saved = manager.getState();
    document.close();
    context.update();
    manager.setState(saved);
    assert.ok(manager.getState().clipMaskList[0].geometry.isValid);
    manager.resetState();
  },

  'state-gc-and-shutdown-release': async ({ rmlui }) => {
    let reference;
    let state;
    (() => {
      const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
      reference = new WeakRef(manager);
      manager.prepareRender({ x: 160, y: 120 });
      const geometry = square(rmlui, manager);
      manager.setClipMask(rmlui.ClipMaskOperation.Set, geometry,
        { x: 0, y: 0 });
      state = manager.getState();
      geometry.release();
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(reference.deref(), undefined);
    assert.ok(state.clipMaskList[0].geometry.isValid);
    const matrix = state.transform;
    rmlui.shutdown();
    assert.throws(() => state.clipMaskList[0].geometry.isValid,
      /initial|valid/i);
    matrix[0] = 2;
    assert.equal(matrix[0], 2);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Render state',
    { settings: { stencilBits: 8 } });
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('render-state', 160, 120);
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
  assert.equal(failures, 0, `${failures} render state failures`);
}
