'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function quad(rmlui, manager,
  uv = [[ 0, 0 ], [ 1, 0 ], [ 1, 1 ], [ 0, 1 ]]) {
  const mesh = new rmlui.Mesh(4, 6);
  const vertices = new Float32Array(mesh.vertices.buffer);
  const points = [[ 0, 0 ], [ 40, 0 ], [ 40, 40 ], [ 0, 40 ]];
  for (let i = 0; i < 4; ++i) {
    vertices[i * 5] = points[i][0];
    vertices[i * 5 + 1] = points[i][1];
    mesh.vertices.set([ 255, 255, 255, 255 ], i * 20 + 8);
    vertices[i * 5 + 3] = uv[i][0];
    vertices[i * 5 + 4] = uv[i][1];
  }
  mesh.indices.set([ 0, 1, 2, 0, 2, 3 ]);
  return manager.makeGeometry(mesh);
}

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const bytes = new Uint8Array([ 128, 0, 0, 128 ]);
const size = { x: 1, y: 1 };
const cases = {
  'generated-textures-preserve-upstream-repeat-addressing': options => {
    const { rmlui, manager, sfml, window } = options;
    const callback = manager.makeCallbackTexture(api => api.generateTexture(
      new Uint8Array([ 255, 0, 0, 255, 0, 0, 255, 255 ]),
      { x: 2, y: 1 }));
    // u=1.25 is the center of the repeated red texel. Clamped addressing
    // samples the blue right-hand edge instead.
    const geometry = quad(rmlui, manager,
      Array.from({ length: 4 }, () => [ 1.25, 0.5 ]));
    try {
      geometry.render({ x: 10, y: 10 }, callback.toTexture());
      const snapshot = new sfml.Texture(window.getSize());
      snapshot.update(window);
      const color = snapshot.copyToImage().getPixel(new sfml.Vector2u(20, 20));
      assert.deepEqual([ color.r, color.g, color.b ], [ 255, 0, 0 ]);
    } finally {
      geometry.release();
      callback.release();
    }
  },

  'lazy-generate-cache-scope-and-premultiplied-pixels': options => {
    const { rmlui, manager, sfml, window } = options;
    let calls = 0;
    let retained;
    const callback = manager.makeCallbackTexture(api => {
      ++calls;
      retained = api;
      assert.equal(api.getRenderManager(), manager);
      assert.ok(api.generateTexture(bytes, size));
      assert.throws(() => api.generateTexture(bytes, size), /already|once/i);
      return true;
    });
    const texture = callback.toTexture();
    assert.equal(calls, 0);
    assert.ok(callback.isValid);
    assert.deepEqual(texture.getDimensions(), size);
    assert.deepEqual(texture.getDimensions(), size);
    assert.equal(calls, 1);
    assert.throws(() => retained.getRenderManager(), /scope|active|expired/i);
    const geometry = quad(rmlui, manager);
    geometry.render({ x: 10, y: 10 }, texture);
    const snapshot = new sfml.Texture(window.getSize());
    snapshot.update(window);
    const colour = snapshot.copyToImage().getPixel(new sfml.Vector2u(20, 20));
    assert.ok(Math.abs(colour.r - 128) <= 1);
    assert.equal(colour.g, 0);
    assert.equal(colour.b, 0);
    geometry.release();
  },

  'failed-and-throwing-callbacks-do-not-retry': ({ manager }) => {
    for (const mode of [ 'false', 'throw', 'missing', 'promise' ]) {
      let calls = 0;
      const owned = manager.makeCallbackTexture(api => {
        ++calls;
        if (mode !== 'missing') {
          api.generateTexture(bytes, size);
        }
        if (mode === 'throw') {
          throw new Error('texture callback boom');
        }
        if (mode === 'promise') {
          return Promise.reject(new Error('async boom'));
        }
        return mode === 'missing';
      });
      const texture = owned.toTexture();
      if (mode === 'false') {
        assert.deepEqual(texture.getDimensions(), { x: 0, y: 0 });
      } else {
        assert.throws(() => texture.getDimensions(),
          /texture callback boom|submit|synchronous/i);
      }
      assert.deepEqual(texture.getDimensions(), { x: 0, y: 0 });
      assert.equal(calls, 1);
      owned.release();
    }
  },

  'resource-reentry-is-rejected-before-mutation': ({ manager, rmlui }) => {
    const geometry = quad(rmlui, manager);
    const owned = manager.makeCallbackTexture(api => {
      for (const operation of [
        () => owned.release(),
        () => owned.toTexture().getDimensions(),
        () => manager.makeCallbackTexture(() => false),
        () => geometry.release(),
        () => geometry.render({ x: 0, y: 0 }),
        () => rmlui.releaseTextures(),
        () => rmlui.shutdown(),
        () => manager.pushLayer(),
      ]) {
        assert.throws(operation, /callback|recursive/i);
      }
      return api.generateTexture(bytes, size);
    });
    geometry.render({ x: 0, y: 0 }, owned.toTexture());
    assert.ok(geometry.isValid);
    owned.release();
    geometry.release();
  },

  'released-alias-never-revives-on-index-reuse': ({ manager, rmlui }) => {
    const owned = manager.makeCallbackTexture(api =>
      api.generateTexture(bytes, size));
    const alias = owned.toTexture();
    owned.release();
    owned.release();
    assert.equal(owned.isValid, false);
    const next = manager.makeCallbackTexture(api =>
      api.generateTexture(new Uint8Array([ 0, 255, 0, 255 ]), size));
    assert.ok(next.isValid);
    assert.throws(() => alias.getDimensions(), /released|valid/i);
    assert.throws(() => alias.equals(next.toTexture()), /released|valid/i);
    const other = new rmlui.RenderManager(rmlui.getRenderInterface());
    const geometry = quad(rmlui, other);
    assert.throws(() => geometry.render({ x: 0, y: 0 }, next.toTexture()),
      /different.*manager/i);
    geometry.release();
  },

  'source-per-manager-cache-and-alias-owner-gc': async options => {
    const { manager, rmlui } = options;
    const other = new rmlui.RenderManager(rmlui.getRenderInterface());
    let calls = 0;
    let source = new rmlui.CallbackTextureSource(api => {
      ++calls;
      return api.generateTexture(bytes, size);
    });
    const alias = source.getTexture(manager);
    assert.ok(alias.equals(source.getTexture(manager)));
    const foreign = source.getTexture(other);
    assert.equal(alias.equals(foreign), false);
    assert.deepEqual(foreign.getDimensions(), size);
    const reference = new WeakRef(source);
    source = null;
    await collect();
    assert.equal(reference.deref(), undefined);
    assert.deepEqual(alias.getDimensions(), size);
    assert.equal(calls, 2);
    assert.equal(new rmlui.CallbackTextureSource()
      .getTexture(manager).isValid, false);
  },

  'callback-owner-gc-and-cycles': async ({ manager }) => {
    let alias;
    let owner;
    let fn;
    (() => {
      const callback = api => api.generateTexture(bytes, size);
      const owned = manager.makeCallbackTexture(callback);
      owner = new WeakRef(owned);
      fn = new WeakRef(callback);
      alias = owned.toTexture();
    })();
    await collect();
    assert.equal(owner.deref(), undefined);
    assert.ok(fn.deref());
    assert.deepEqual(alias.getDimensions(), size);
    alias = null;
    await collect();
    assert.equal(fn.deref(), undefined);
    let cyclic;
    (() => {
      const owned = manager.makeCallbackTexture(api => {
        assert.ok(owned.isValid);
        return api.generateTexture(bytes, size);
      });
      cyclic = new WeakRef(owned);
    })();
    await collect();
    assert.equal(cyclic.deref(), undefined);
  },

  'source-cache-survives-collected-temporary-views': async options => {
    const { manager, rmlui } = options;
    let calls = 0;
    const source = new rmlui.CallbackTextureSource(api => {
      ++calls;
      return api.generateTexture(bytes, size);
    });
    (() => {
      assert.ok(source.getTexture(manager).isValid);
    })();
    await collect();
    assert.deepEqual(source.getTexture(manager).getDimensions(), size);
    assert.equal(calls, 1);
    rmlui.releaseTextures();
    await collect();
    assert.deepEqual(source.getTexture(manager).getDimensions(), size);
    assert.equal(calls, 2);
  },

  'instancing-can-create-and-load-callback-textures': options => {
    const { manager, rmlui, context } = options;
    const container = new rmlui.StyleSheetContainer();
    container.loadStyleSheetContainer('div{}', '');
    container.updateCompiledStyleSheet(context);
    const active = new rmlui.DecoratorInstancerInterface(
      manager, container.getCompiledStyleSheet());
    const factory = new rmlui.DecoratorInstancer(() => {
      const source = new rmlui.CallbackTextureSource(api =>
        api.generateTexture(bytes, size));
      assert.deepEqual(source.getTexture(manager).getDimensions(), size);
      const owned = manager.makeCallbackTexture(api =>
        api.generateTexture(bytes, size));
      assert.deepEqual(owned.toTexture().getDimensions(), size);
      owned.release();
      return new rmlui.Decorator(manager, {
        generateElementData: () => ({}),
        renderElement() {},
        releaseElementData() {},
      });
    });
    assert.ok(factory.instanceDecorator('callback-texture',
      new rmlui.PropertyDictionary(), active));
    assert.ok(context.render());
  },

  'source-evicts-only-retired-manager-cache': options => {
    const { rmlui, manager, window } = options;
    const renderer = rmlui.createRenderInterface(window);
    const retired = rmlui.createContext('retired-texture', 160, 120, renderer);
    let calls = 0;
    const source = new rmlui.CallbackTextureSource(api => {
      ++calls;
      return api.generateTexture(bytes, size);
    });
    const previous = source.getTexture(retired.getRenderManager());
    assert.deepEqual(previous.getDimensions(), size);
    const live = source.getTexture(manager);
    assert.deepEqual(live.getDimensions(), size);
    retired.remove();
    rmlui.releaseRenderManagers();
    assert.throws(() => previous.getDimensions(), /valid/i);
    rmlui.releaseTextures();
    assert.deepEqual(live.getDimensions(), size);
    const replacement = rmlui.createContext(
      'retired-texture', 160, 120, renderer);
    assert.deepEqual(source.getTexture(
      replacement.getRenderManager()).getDimensions(), size);
    assert.equal(calls, 4);
  },

  'raw-handle-transfer-validates-owner-size-and-once': ({ manager, rmlui }) => {
    const handle = manager.generateTextureHandle(bytes, size);
    assert.ok(handle.isValid);
    const other = new rmlui.RenderManager(rmlui.getRenderInterface());
    const wrong = other.generateTextureHandle(bytes, size);
    const owned = manager.makeCallbackTexture(api => {
      assert.throws(() => api.setTextureHandle(wrong, size),
        /different.*manager/i);
      assert.throws(() => api.setTextureHandle(handle, { x: 2, y: 1 }),
        /dimensions|size/i);
      api.setTextureHandle(handle, size);
      assert.throws(() => api.setTextureHandle(handle, size),
        /already|once|transferred/i);
      return true;
    });
    assert.deepEqual(owned.toTexture().getDimensions(), size);
    assert.equal(handle.isValid, false);
    handle.release();
    wrong.release();
    owned.release();
  },

  'decorator-retains-callback-texture-view-and-gc-cycles': async options => {
    const { manager, rmlui } = options;
    let decorator = new rmlui.Decorator(manager, {
      generateElementData: () => ({}),
      renderElement() {},
      releaseElementData() {},
    });
    let functionReference;
    (() => {
      const fn = api => api.generateTexture(bytes, size);
      const owned = manager.makeCallbackTexture(fn);
      const texture = owned.toTexture();
      assert.equal(decorator.addTexture(texture), 0);
      assert.equal(decorator.addTexture(texture), 0);
      functionReference = new WeakRef(fn);
    })();
    await collect();
    assert.ok(functionReference.deref(), 'Decorator must retain its texture');
    assert.deepEqual(decorator.getTexture(0).getDimensions(), size);
    assert.equal(decorator.getNumTextures(), 1);
    decorator = null;
    await collect();
    assert.equal(functionReference.deref(), undefined);
    let cycleReference;
    (() => {
      const custom = new rmlui.Decorator(manager, {
        generateElementData: () => ({}),
        renderElement() {},
        releaseElementData() {},
      });
      const owned = manager.makeCallbackTexture(api => {
        void custom;
        return api.generateTexture(bytes, size);
      });
      custom.addTexture(owned.toTexture());
      cycleReference = new WeakRef(custom);
    })();
    await collect();
    assert.equal(cycleReference.deref(), undefined);
  },

  'save-layer-snapshot-and-invalid-scissor': options => {
    const { manager, rmlui, sfml, window } = options;
    const owned = manager.makeCallbackTexture(api => {
      assert.throws(() => api.saveLayerAsTexture(), /scissor/i);
      return false;
    });
    assert.deepEqual(owned.toTexture().getDimensions(), { x: 0, y: 0 });
    manager.setScissorRegion({
      p0: { x: 10, y: 20 }, p1: { x: 50, y: 60 },
    });
    const geometry = quad(rmlui, manager);
    geometry.render({ x: 10, y: 20 });
    const saved = manager.makeCallbackTexture(api => {
      api.saveLayerAsTexture();
      return true;
    });
    assert.deepEqual(saved.toTexture().getDimensions(), { x: 40, y: 40 });
    manager.resetState();
    geometry.render({ x: 80, y: 20 }, saved.toTexture());
    const snapshot = new sfml.Texture(window.getSize());
    snapshot.update(window);
    const pixel = snapshot.copyToImage().getPixel(new sfml.Vector2u(90, 30));
    assert.deepEqual([ pixel.r, pixel.g, pixel.b ], [ 255, 255, 255 ]);
    geometry.release();
    saved.release();
  },

  'buffer-bounds-accessors-and-shutdown': ({ manager, rmlui, window }) => {
    const owned = manager.makeCallbackTexture(api => {
      assert.throws(() => api.generateTexture(new Uint8Array(3), size),
        /size|bytes|length/i);
      assert.throws(() => api.generateTexture(bytes, { x: -1, y: 1 }),
        /dimensions|positive/i);
      assert.throws(() => api.generateTexture(bytes, { x: 1.2, y: 1 }),
        /integer|dimensions|int32/i);
      assert.throws(() => api.generateTexture(
        new Uint8Array(new SharedArrayBuffer(4)), size), /unshared|shared/i);
      return api.generateTexture(bytes, size);
    });
    const alias = owned.toTexture();
    assert.deepEqual(alias.getDimensions(), size);
    const source = new rmlui.CallbackTextureSource(() => false);
    const raw = manager.generateTextureHandle(bytes, size);
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => alias.getDimensions(), /valid/i);
    assert.throws(() => owned.release(), /valid/i);
    assert.throws(() => source.getTexture(manager), /valid/i);
    assert.throws(() => raw.release(), /valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Callback textures',
    { settings: { stencilBits: 8 } });
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('callback-textures', 160, 120);
  window.clear(sfml.Color.Black);
  window.flush();
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
  assert.equal(failures, 0, `${failures} callback texture failures`);
}
