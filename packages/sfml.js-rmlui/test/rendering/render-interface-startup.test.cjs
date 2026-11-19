'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { Worker } = require('node:worker_threads');

async function collect() {
  for (let attempt = 0; attempt < 12; ++attempt) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'preinit-selection-survives-initialization': ({ rmlui, window }) => {
    assert.equal(rmlui.getRenderInterface(), null);
    const renderer = rmlui.createRenderInterface(window);
    rmlui.setRenderInterface(renderer);
    assert.equal(rmlui.getRenderInterface(), renderer);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.equal(rmlui.getRenderInterface(), renderer);
    const context = rmlui.createContext('selected', 80, 60);
    assert.equal(context.renderInterface, renderer);
    const document = context.loadDocumentFromMemory(
      '<rml><body style="background:#f00;width:80px;height:60px"/></rml>');
    document.show();
    context.update();
    context.render();
    assert.throws(() => rmlui.setRenderInterface(null), /before|initial/i);
  },

  'reset-and-unselected-generations': ({ rmlui, window }) => {
    const unused = rmlui.createRenderInterface(window);
    rmlui.setRenderInterface(unused);
    rmlui.setRenderInterface(null);
    assert.equal(rmlui.getRenderInterface(), null);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const fallback = rmlui.getRenderInterface();
    assert.notEqual(fallback, unused);
    const context = rmlui.createContext('unused', 80, 60, unused);
    assert.equal(context.renderInterface, unused);
    rmlui.shutdown();
    assert.equal(rmlui.getRenderInterface(), null);
    assert.throws(() => rmlui.setRenderInterface(unused), /valid/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => rmlui.createContext('stale', 80, 60, fallback),
      /valid/i);
  },

  'distinct-system-and-render-windows': ({ rmlui, sfml, window }) => {
    const target = new sfml.RenderWindow(
      new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Selected target');
    try {
      const renderer = rmlui.createRenderInterface(target);
      rmlui.setRenderInterface(renderer);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const context = rmlui.createContext('target-window', 80, 60);
      const document = context.loadDocumentFromMemory(
        '<rml><body style="margin:0;background:#f00;' +
        'width:80px;height:60px"/></rml>');
      document.show();
      context.update();
      window.clear(sfml.Color.Blue);
      window.flush();
      target.clear(sfml.Color.Black);
      target.flush();
      context.render();
      const pixel = source => {
        const texture = new sfml.Texture(new sfml.Vector2u(80, 60));
        texture.update(source);
        return texture.copyToImage().getPixel(new sfml.Vector2u(10, 10));
      };
      const selectedPixel = pixel(target);
      const systemPixel = pixel(window);
      assert.deepEqual([ selectedPixel.r, selectedPixel.g, selectedPixel.b ],
        [ 255, 0, 0 ]);
      assert.deepEqual([ systemPixel.r, systemPixel.g, systemPixel.b ],
        [ 0, 0, 255 ]);
    } finally {
      rmlui.shutdown();
      target.close();
    }
  },

  'shutdown-clears-setup-and-invalidates-retained-tokens':
    ({ rmlui, window }) => {
      const renderer = rmlui.createRenderInterface(window);
      rmlui.setRenderInterface(renderer);
      rmlui.shutdown();
      assert.equal(rmlui.getRenderInterface(), null);
      assert.throws(() => rmlui.setRenderInterface(renderer), /valid/i);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.notEqual(rmlui.getRenderInterface(), renderer);
    },

  'unused-renderer-releases-native-window': async ({ rmlui, sfml, window }) => {
    const { windowNativeHandle } = require('../../dist/internal/sfml-interop');
    let reference;
    (() => {
      const unusedWindow = new sfml.RenderWindow(
        new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Unused renderer');
      reference = new WeakRef(windowNativeHandle(unusedWindow));
      rmlui.createRenderInterface(unusedWindow);
    })();
    await collect();
    assert.equal(reference.deref(), undefined);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    (() => {
      const unusedWindow = new sfml.RenderWindow(
        new sfml.VideoMode(new sfml.Vector2u(80, 60)),
        'Unused active renderer');
      reference = new WeakRef(windowNativeHandle(unusedWindow));
      rmlui.createRenderInterface(unusedWindow);
    })();
    await collect();
    assert.equal(reference.deref(), undefined);
  },

  'selected-native-window-and-manager-borrow-survive-gc':
    async ({ rmlui, sfml, window }) => {
      const { windowNativeHandle } = require(
        '../../dist/internal/sfml-interop');
      let reference;
      let selected = (() => {
        const target = new sfml.RenderWindow(
          new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Selected renderer');
        reference = new WeakRef(windowNativeHandle(target));
        return rmlui.createRenderInterface(target);
      })();
      rmlui.setRenderInterface(selected);
      selected = null;
      await collect();
      assert.ok(reference.deref());
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const context = rmlui.createContext('native-selected', 80, 60);
      const manager = new rmlui.RenderManager(context.renderInterface);
      context.remove();
      rmlui.releaseRenderManagers();
      manager.makeGeometry(new rmlui.Mesh()).render({ x: 0, y: 0 });
      rmlui.shutdown();
      await collect();
      assert.equal(reference.deref(), undefined);
    },

  'unselected-window-token-cycles-are-collectible':
    async ({ rmlui, sfml }) => {
      const { windowNativeHandle } = require(
        '../../dist/internal/sfml-interop');
      const reference = (() => {
        const target = new sfml.RenderWindow(
          new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Cyclic renderer');
        const handle = windowNativeHandle(target);
        handle.renderer = rmlui.createRenderInterface(target);
        rmlui.setRenderInterface(handle.renderer);
        rmlui.setRenderInterface(null);
        return new WeakRef(handle);
      })();
      await collect();
      assert.equal(reference.deref(), undefined);
    },

  'forged-values-and-callback-selection-reject': ({ rmlui, window }) => {
    for (const value of [{}, 1, false, undefined ]) {
      assert.throws(() => rmlui.setRenderInterface(value), /handle/i);
    }
    const renderer = rmlui.createRenderInterface(window);
    rmlui.setRenderInterface(renderer);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const context = rmlui.createContext('callback', 80, 60);
    const document = context.createDocument();
    document.addEventListener('test', () => {
      assert.equal(rmlui.getRenderInterface(), renderer);
      assert.throws(() => rmlui.setRenderInterface(null), /callback/i);
    });
    document.dispatchEvent('test');
  },

  'retained-shutdown-token-releases-window-edge':
    async ({ rmlui, sfml, window }) => {
      const { windowNativeHandle } = require(
        '../../dist/internal/sfml-interop');
      let reference;
      const renderer = (() => {
        const target = new sfml.RenderWindow(
          new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Retained token');
        reference = new WeakRef(windowNativeHandle(target));
        return rmlui.createRenderInterface(target);
      })();
      rmlui.setRenderInterface(renderer);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      rmlui.shutdown();
      await collect();
      assert.equal(reference.deref(), undefined);
      assert.throws(() => rmlui.setRenderInterface(renderer), /valid/i);
    },

  'static-selected-renderer-does-not-add-host-callbacks':
    ({ rmlui, window }) => {
      const renderer = rmlui.createRenderInterface(window);
      rmlui.setRenderInterface(renderer);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      const context = rmlui.createContext('static-renderer', 80, 60);
      const document = context.loadDocumentFromMemory(
        '<rml><body><div style="background:red;width:10px;height:10px"/>' +
        '</body></rml>');
      document.show();
      context.update();
      context.render();
      const { native } = require('../../dist/internal/native');
      native.beginDataDiagnostics(false);
      for (let frame = 0; frame < 32; ++frame) {
        context.update();
        context.render();
      }
      const counts = native.endDataDiagnostics();
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.callbackSnapshotVisits, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
    },

  'foreign-worker-cannot-read-or-change-setup': async ({ rmlui, window }) => {
    const renderer = rmlui.createRenderInterface(window);
    rmlui.setRenderInterface(renderer);
    const worker = new Worker(`
      const { parentPort, workerData } = require('node:worker_threads');
      const rmlui = require(workerData);
      const results = [];
      for (const operation of [
        () => rmlui.getRenderInterface(),
        () => rmlui.setRenderInterface(null),
        () => rmlui.shutdown(),
      ]) {
        try { operation(); results.push('allowed'); }
        catch (error) { results.push(error.message); }
      }
      parentPort.postMessage(results);
    `, { eval: true, workerData: path.resolve(__dirname, '../../dist') });
    const exited = new Promise((resolve, reject) => {
      worker.once('exit', code => (code === 0 ? resolve() :
        reject(new Error(`worker exit ${code}`))));
    });
    const results = await new Promise((resolve, reject) => {
      worker.once('message', resolve);
      worker.once('error', reject);
    });
    await exited;
    for (const message of results) {
      assert.match(message, /owning environment/i);
    }
    assert.equal(rmlui.getRenderInterface(), renderer);
  },
};

async function run(name) {
  const rmlui = require('../../dist');
  const sfml = require('sfml.js');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(80, 60)), 'Renderer setup');
  try {
    await cases[name]({ rmlui, sfml, window });
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
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} render-interface setup failures`);
}
