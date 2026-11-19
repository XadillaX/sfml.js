'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { setImmediate: nextTurn } = require('node:timers/promises');

function quad(rmlui, manager, colour, size = 40) {
  const mesh = new rmlui.Mesh(4, 6);
  const points = [[ 0, 0 ], [ size, 0 ], [ size, size ], [ 0, size ]];
  for (let index = 0; index < points.length; ++index) {
    const vertex = mesh.getVertex(index);
    vertex.position = { x: points[index][0], y: points[index][1] };
    vertex.colour = {
      red: colour[0], green: colour[1], blue: colour[2], alpha: colour[3],
    };
  }
  mesh.indices.set([ 0, 1, 2, 0, 2, 3 ]);
  return manager.makeGeometry(mesh);
}

function pixel(sfml, window, x, y) {
  const texture = new sfml.Texture(window.getSize());
  texture.update(window);
  const value = texture.copyToImage().getPixel(new sfml.Vector2u(x, y));
  return [ value.r, value.g, value.b ];
}

function install(options, render) {
  const { rmlui, manager, context } = options;
  const document = context.loadDocumentFromMemory(
    '<rml><head><style>body{margin:0}#target{width:40px;height:40px}' +
    '</style></head><body><div id="target"/></body></rml>');
  const decorator = new rmlui.Decorator(manager, {
    generateElementData: () => ({}),
    releaseElementData() {},
    renderElement: render,
  });
  rmlui.DecoratorInstancer.register('session-probe',
    new rmlui.DecoratorInstancer(() => decorator));
  document.getElementById('target').setProperty('decorator', 'session-probe()');
  document.show();
  context.update();
  return document;
}

const cases = {
  'transparent-base-source-self-and-host-presentation': options => {
    const { rmlui, manager, context, sfml, window } = options;
    const geometry = quad(rmlui, manager, [ 128, 0, 0, 128 ]);
    let calls = 0;
    install(options, () => {
      ++calls;
      const base = manager.getTopLayer();
      geometry.render({ x: 10, y: 10 });
      assert.deepEqual(pixel(sfml, window, 20, 20), [ 0, 0, 255 ]);
      const copy = manager.pushLayer();
      manager.compositeLayers(base, copy, rmlui.BlendMode.Replace);
      manager.compositeLayers(copy, base, rmlui.BlendMode.Replace);
      manager.popLayer();
      const filters = new rmlui.FilterHandleList();
      const brightness = manager.compileFilter('brightness', { value: 0.5 });
      brightness.addHandleTo(filters);
      manager.compositeLayers(base, base, rmlui.BlendMode.Replace, filters);
      filters.clear();
      brightness.release();
    });
    context.render();
    assert.ok(calls > 0);
    const value = pixel(sfml, window, 20, 20);
    assert.ok(Math.abs(value[0] - 64) <= 1, value);
    assert.ok(Math.abs(value[2] - 127) <= 1, value);
    assert.deepEqual(pixel(sfml, window, 100, 80), [ 0, 0, 255 ]);
    geometry.release();
  },

  'base-mask-snapshot-survives-overwrite': options => {
    const { rmlui, manager, context, sfml, window } = options;
    const maskGeometry = quad(rmlui, manager, [ 255, 255, 255, 255 ], 20);
    const red = quad(rmlui, manager, [ 255, 0, 0, 255 ], 100);
    install(options, () => {
      const base = manager.getTopLayer();
      maskGeometry.render({ x: 40, y: 40 });
      manager.setScissorRegion({
        p0: { x: 20, y: 20 }, p1: { x: 100, y: 100 },
      });
      const mask = manager.saveLayerAsMaskImage();
      assert.ok(mask.isValid);
      manager.disableScissorRegion();
      const layer = manager.pushLayer();
      red.render({ x: 0, y: 0 });
      const filters = new rmlui.FilterHandleList();
      mask.addHandleTo(filters);
      manager.compositeLayers(layer, base, rmlui.BlendMode.Replace, filters);
      manager.popLayer();
      filters.clear();
      mask.release();
    });
    context.render();
    assert.deepEqual(pixel(sfml, window, 45, 45), [ 255, 0, 0 ]);
    assert.deepEqual(pixel(sfml, window, 25, 25), [ 0, 0, 255 ]);
    assert.deepEqual(pixel(sfml, window, 75, 75), [ 0, 0, 255 ]);
    red.release();
    maskGeometry.release();
  },

  'callback-failure-rolls-back-pixels-and-recovers': options => {
    const { rmlui, manager, context, sfml, window } = options;
    const geometry = quad(rmlui, manager, [ 255, 0, 0, 255 ]);
    let fail = true;
    install(options, () => {
      geometry.render({ x: 10, y: 10 });
      if (fail) {
        manager.pushLayer();
        throw new Error('session rollback marker');
      }
    });
    assert.throws(() => context.render(), /session rollback marker/);
    assert.deepEqual(pixel(sfml, window, 20, 20), [ 0, 0, 255 ]);
    assert.throws(() => manager.getNextLayer(), /empty/i);
    fail = false;
    assert.ok(context.render());
    assert.deepEqual(pixel(sfml, window, 20, 20), [ 255, 0, 0 ]);
    geometry.release();
  },

  'host-view-restored-after-presentation-and-failure': options => {
    const { context, manager, rmlui, sfml, window } = options;
    const geometry = quad(rmlui, manager, [ 255, 0, 0, 255 ], 10);
    const view = new sfml.View(new sfml.FloatRect(
      new sfml.Vector2f(100, 100), new sfml.Vector2f(160, 120)));
    window.setView(view);
    window.flush();
    let fail = false;
    install(options, () => {
      geometry.render({ x: 40, y: 40 });
      if (fail) {
        throw new Error('view rollback marker');
      }
    });
    context.render();
    fail = true;
    assert.throws(() => context.render(), /view rollback marker/);
    const shape = new sfml.RectangleShape(new sfml.Vector2f(10, 10));
    shape.setPosition(new sfml.Vector2f(110, 110));
    shape.setFillColor(sfml.Color.Green);
    window.draw(shape);
    window.flush();
    assert.deepEqual(pixel(sfml, window, 15, 15), [ 0, 255, 0 ]);
    assert.deepEqual(pixel(sfml, window, 115, 115), [ 0, 0, 255 ]);
    geometry.release();
  },

  'manager-state-restored-after-success-and-exception': options => {
    const { context, manager, rmlui, sfml, window } = options;
    const geometry = quad(rmlui, manager, [ 255, 0, 0, 255 ], 20);
    const matrix = new Float32Array([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 80, 10, 0, 1,
    ]);
    manager.setTransform(matrix);
    manager.setScissorRegion({
      p0: { x: 85, y: 0 }, p1: { x: 100, y: 40 },
    });
    const saved = manager.getState();
    let fail = false;
    install(options, () => {
      geometry.render({ x: 10, y: 50 });
      if (fail) {
        throw new Error('state rollback marker');
      }
    });
    context.render();
    assert.deepEqual(manager.getState(), saved);
    fail = true;
    assert.throws(() => context.render(), /state rollback marker/);
    assert.deepEqual(manager.getState(), saved);
    geometry.render({ x: 0, y: 0 });
    assert.deepEqual(pixel(sfml, window, 90, 15), [ 255, 0, 0 ]);
    assert.deepEqual(pixel(sfml, window, 81, 15), [ 0, 0, 255 ]);
    manager.resetState();
    geometry.release();
  },

  'direct-manager-base-read-retains-host-domain': options => {
    const { rmlui, manager, sfml, window } = options;
    const base = manager.getTopLayer();
    const layer = manager.pushLayer();
    manager.compositeLayers(base, layer, rmlui.BlendMode.Replace);
    const filters = new rmlui.FilterHandleList();
    const invert = manager.compileFilter('invert', { value: 1 });
    invert.addHandleTo(filters);
    manager.compositeLayers(layer, base, rmlui.BlendMode.Replace, filters);
    manager.popLayer();
    assert.deepEqual(pixel(sfml, window, 20, 20), [ 255, 255, 0 ]);
    manager.compositeLayers(base, base, rmlui.BlendMode.Replace, filters);
    assert.deepEqual(pixel(sfml, window, 20, 20), [ 0, 0, 255 ]);
    filters.clear();
    invert.release();
  },

  'resize-reallocates-base-and-clears-prior-frame': async options => {
    const { rmlui, manager, context, sfml, window } = options;
    const geometry = quad(rmlui, manager, [ 255, 0, 0, 255 ]);
    let draw = true;
    install(options, () => {
      if (draw) {
        geometry.render({ x: 10, y: 10 });
      }
    });
    context.render();
    draw = false;
    window.setSize(new sfml.Vector2u(180, 140));
    let resized = false;
    const resizeHandlers = {
      Resized({ size }) {
        resized = size.x === 180 && size.y === 140;
      },
    };
    // X11 delivers ConfigureNotify after the native resize request returns.
    const deadline = performance.now() + 2000;
    while (!resized && performance.now() < deadline) {
      window.handleEvents(resizeHandlers);
      if (!resized) {
        await nextTurn();
      }
    }
    assert.equal(resized, true);
    assert.equal(
      sfml.equal(window.getSize(), new sfml.Vector2u(180, 140)), true);
    // GLX refreshes the resized drawable when its buffers are first swapped.
    window.display();

    context.setDimensions(180, 140);
    window.clear(sfml.Color.Blue);
    window.flush();
    assert.ok(context.render());
    assert.deepEqual(pixel(sfml, window, 20, 20), [ 0, 0, 255 ]);
    assert.deepEqual(pixel(sfml, window, 170, 130), [ 0, 0, 255 ]);
    geometry.release();
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Render session',
    { settings: { stencilBits: 8 } });
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('render-session', 160, 120);
  window.clear(sfml.Color.Blue);
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
  assert.equal(failures, 0, `${failures} render session failures`);
}
