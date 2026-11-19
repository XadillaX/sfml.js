'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

async function collect() {
  for (let i = 0; i < 16; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function callbacks(rmlui, owner, released) {
  return {
    generateElementData(element, area) {
      assert.equal(area, rmlui.BoxArea.Padding);
      const data = { owner, element, serial: ++owner.generated };
      owner.lastData = data;
      return data;
    },
    renderElement(element, data) {
      assert.equal(data.element.handle, element.handle);
      ++owner.rendered;
    },
    releaseElementData(data) {
      released.push(data.serial);
    },
  };
}

const cases = {
  'environment-cleanup-with-live-decorators': options => {
    const { rmlui, context, element, window } = options;
    const decorator = new rmlui.Decorator(context.getRenderManager(), {
      generateElementData: () => ({}),
      renderElement() {},
      releaseElementData() {
        throw new Error('environment cleanup must not execute JavaScript');
      },
    });
    const data = decorator.generateElementData(element);
    rmlui.DecoratorInstancer.register('exit-managed',
      new rmlui.DecoratorInstancer(() => decorator));
    element.setProperty('decorator', 'exit-managed()');
    context.update();
    context.render();
    const container = new rmlui.StyleSheetContainer();
    container.loadStyleSheetContainer('div{}', '');
    container.updateCompiledStyleSheet(context);
    const sheet = container.getCompiledStyleSheet();
    sheet.instanceDecorators(context.getRenderManager(),
      new rmlui.DecoratorList('exit-managed()'));
    globalThis.decoratorExitResources = {
      window, decorator, data, container, sheet,
    };
  },

  'detached-tree-retains-and-collects-element-data': async options => {
    const { rmlui, context, document } = options;
    let reference;
    rmlui.DecoratorInstancer.register('detached-managed',
      new rmlui.DecoratorInstancer((_name, _properties, active) => {
        const owner = { generated: 0, rendered: 0 };
        owner.decorator = new rmlui.Decorator(active.getRenderManager(),
          callbacks(rmlui, owner, []));
        reference = new WeakRef(owner);
        return owner.decorator;
      }));
    let detached;
    (() => {
      const target = document.getElementById('target');
      target.setProperty('decorator', 'detached-managed()');
      context.update();
      context.render();
      document.removeChild(target);
      detached = target;
    })();
    document.close();
    context.update();
    await collect();
    assert.ok(reference.deref());
    assert.ok(reference.deref().rendered > 0);
    assert.ok(detached);
    detached = null;
    await collect();
    assert.equal(reference.deref(), undefined);
    context.update();
  },

  'shutdown-drops-edges-from-retained-sheets': async options => {
    const { rmlui, context } = options;
    let reference;
    rmlui.DecoratorInstancer.register('sheet-only',
      new rmlui.DecoratorInstancer((_name, _properties, active) => {
        const captured = {};
        reference = new WeakRef(captured);
        return new rmlui.Decorator(active.getRenderManager(), {
          generateElementData() {
            void captured;
            return null;
          },
          renderElement() {},
          releaseElementData() {},
        });
      }));
    const container = new rmlui.StyleSheetContainer();
    container.loadStyleSheetContainer('div{}', '');
    container.updateCompiledStyleSheet(context);
    const sheet = container.getCompiledStyleSheet();
    const owned = sheet.combineStyleSheet(sheet);
    owned.instanceDecorators(context.getRenderManager(),
      new rmlui.DecoratorList('sheet-only()'));
    await collect();
    assert.ok(reference.deref());
    rmlui.shutdown();
    await collect();
    assert.equal(reference.deref(), undefined);
    assert.ok(owned);
  },

  'void-virtuals-reject-promises': async ({ rmlui, context, element }) => {
    const rejection = new Error('unsupported async callback');
    const decorator = new rmlui.Decorator(context.getRenderManager(), {
      generateElementData: () => ({}),
      renderElement: () => Promise.reject(rejection),
      releaseElementData: () => Promise.reject(rejection),
    });
    const data = decorator.generateElementData(element);
    assert.throws(() => decorator.renderElement(element, data), /synchronous/i);
    assert.throws(() => decorator.releaseElementData(data), /synchronous/i);
    await new Promise(resolve => setImmediate(resolve));
  },

  'global-stylesheet-cache-retains-null-data-callbacks': async options => {
    const { rmlui, context } = options;
    let reference;
    let calls = 0;
    rmlui.DecoratorInstancer.register('global-managed',
      new rmlui.DecoratorInstancer((_name, _properties, active) => {
        ++calls;
        const owner = {};
        owner.decorator = new rmlui.Decorator(active.getRenderManager(), {
          generateElementData() {
            void owner;
            return null;
          },
          renderElement() {},
          releaseElementData() {},
        });
        reference = new WeakRef(owner);
        return owner.decorator;
      }));
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rml-decorator-'));
    try {
      fs.writeFileSync(path.join(directory, 'cache.rcss'),
        'body{decorator:global-managed();width:40px;height:40px;}');
      const file = path.join(directory, 'cache.rml');
      fs.writeFileSync(file,
        '<rml><head><link type="text/rcss" href="cache.rcss"/></head>' +
        '<body/></rml>');
      const document = context.loadDocument(file);
      document.show();
      context.update();
      context.render();
      document.close();
      context.update();
      await collect();
      assert.equal(calls, 1);
      assert.ok(reference.deref(), 'global CSS cache owns the callbacks');
      const next = context.loadDocument(file);
      next.show();
      context.update();
      context.render();
      assert.equal(calls, 1);
      rmlui.shutdown();
      await collect();
      assert.equal(reference.deref(), undefined);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },

  'exceptions-recursion-and-shutdown-release': async options => {
    const { rmlui, context, element } = options;
    const manager = context.getRenderManager();
    assert.throws(() => new rmlui.Decorator(manager, {}), /callbacks/i);
    const noOperation = {
      renderElement() {},
      releaseElementData() {},
    };
    for (const value of [ undefined, 0, false, Promise.resolve({}) ]) {
      const invalid = new rmlui.Decorator(manager, {
        ...noOperation,
        generateElementData: () => value,
      });
      assert.throws(() => invalid.generateElementData(element),
        /data|synchronous/i);
    }
    const recursive = new rmlui.Decorator(manager, {
      ...noOperation,
      generateElementData: () => recursive.generateElementData(element),
    });
    assert.throws(() => recursive.generateElementData(element), /recursive/i);
    const sentinel = new Error('render and release sentinel');
    const throwing = new rmlui.Decorator(manager, {
      generateElementData: () => ({}),
      renderElement() {
        throw sentinel;
      },
      releaseElementData() {
        throw sentinel;
      },
    });
    const data = throwing.generateElementData(element);
    assert.throws(() => throwing.renderElement(element, data),
      error => error === sentinel);
    assert.throws(() => throwing.releaseElementData(data),
      error => error === sentinel);
    assert.equal(data.isValid, false);
    throwing.releaseElementData(data);
    let reference;
    let stale;
    let liveData;
    let releases = 0;
    (() => {
      const owner = {};
      stale = new rmlui.Decorator(manager, {
        generateElementData: () => ({ geometry: manager.makeGeometry(
          new rmlui.Mesh()) }),
        renderElement() {
          void owner;
        },
        releaseElementData(payload) {
          payload.geometry.release();
          ++releases;
        },
      });
      reference = new WeakRef(owner);
      liveData = stale.generateElementData(element);
    })();
    rmlui.shutdown();
    await collect();
    assert.equal(reference.deref(), undefined);
    assert.equal(releases, 1);
    assert.throws(() => liveData.isValid, /initial|valid/i);
    assert.throws(() => stale.getNumTextures(), /initial|valid/i);
  },

  'pixels-protected-textures-and-callback-guards': options => {
    const { rmlui, context, element, window, sfml } = options;
    const manager = context.getRenderManager();
    const releases = [];
    const decorator = new rmlui.Decorator(manager, {
      generateElementData(target) {
        assert.equal(target.handle, element.handle);
        assert.throws(() => context.render(), /callback/i);
        assert.throws(() => target.setProperty('width', '90px'), /callback/i);
        assert.throws(() => rmlui.shutdown(), /callback/i);
        const mesh = new rmlui.Mesh(3, 3);
        const floats = new Float32Array(mesh.vertices.buffer);
        const positions = [[ 10, 10 ], [ 80, 10 ], [ 10, 80 ]];
        for (let i = 0; i < 3; ++i) {
          floats[i * 5] = positions[i][0];
          floats[i * 5 + 1] = positions[i][1];
          mesh.vertices.set([ 255, 0, 0, 255 ], i * 20 + 8);
        }
        mesh.indices.set([ 0, 1, 2 ]);
        return { geometry: manager.makeGeometry(mesh) };
      },
      renderElement(_target, data) {
        data.geometry.render({ x: 0, y: 0 });
      },
      releaseElementData(data) {
        data.geometry.release();
        releases.push(true);
      },
    });
    assert.equal(decorator.getNumTextures(), 0);
    assert.equal(decorator.addTexture(new rmlui.Texture()), -1);
    assert.equal(decorator.getTexture().isValid, false);
    const source = path.resolve(__dirname,
      '../../third_party/rmlui/Samples/assets/hello_world.png');
    const texture = manager.loadTexture(source);
    assert.equal(decorator.addTexture(texture), 0);
    assert.equal(decorator.addTexture(texture), 0);
    const secondTexture = manager.loadTexture(`${source}.second`);
    assert.equal(decorator.addTexture(secondTexture), 1);
    assert.equal(decorator.getNumTextures(), 2);
    assert.ok(decorator.getTexture(1).equals(secondTexture));
    assert.equal(decorator.getTexture(-1).isValid, false);
    assert.equal(decorator.getTexture(-2147483648).isValid, false);
    assert.equal(decorator.getTexture(2).isValid, false);
    assert.throws(() => decorator.getTexture(1.2), /integer/i);
    const other = new rmlui.RenderManager(rmlui.getRenderInterface());
    assert.throws(() => decorator.addTexture(other.loadTexture(source)),
      /manager/i);
    const data = decorator.generateElementData(element);
    window.clear(sfml.Color.Black);
    window.flush();
    decorator.renderElement(element, data);
    const capture = new sfml.Texture(window.getSize());
    capture.update(window);
    const image = capture.copyToImage();
    const inside = image.getPixel(new sfml.Vector2u(20, 20));
    const outside = image.getPixel(new sfml.Vector2u(100, 90));
    assert.deepEqual([ inside.r, inside.g, inside.b ], [ 255, 0, 0 ]);
    assert.deepEqual([ outside.r, outside.g, outside.b ], [ 0, 0, 0 ]);
    decorator.releaseElementData(data);
    assert.deepEqual(releases, [ true ]);
  },

  'manual-data-cycle-and-alias-lifetime': async options => {
    const { rmlui, context, element } = options;
    let cycle;
    let retained;
    let alias;
    (() => {
      const owner = {};
      owner.decorator = new rmlui.Decorator(context.getRenderManager(), {
        generateElementData: () => owner,
        renderElement() {},
        releaseElementData() {},
      });
      owner.data = owner.decorator.generateElementData(element);
      cycle = new WeakRef(owner);
    })();
    await collect();
    assert.equal(cycle.deref(), undefined);
    context.update();
    (() => {
      const owner = { generated: 0, rendered: 0 };
      owner.decorator = new rmlui.Decorator(context.getRenderManager(),
        callbacks(rmlui, owner, []));
      const factory = new rmlui.DecoratorInstancer(() => owner.decorator);
      const container = new rmlui.StyleSheetContainer();
      container.loadStyleSheetContainer('div{}', '');
      container.updateCompiledStyleSheet(context);
      const active = new rmlui.DecoratorInstancerInterface(
        context.getRenderManager(), container.getCompiledStyleSheet());
      alias = factory.instanceDecorator('direct',
        new rmlui.PropertyDictionary(), active);
      retained = new WeakRef(owner);
    })();
    await collect();
    assert.ok(retained.deref());
    const data = alias.generateElementData(element);
    alias.renderElement(element, data);
    alias.releaseElementData(data);
    alias = null;
    await collect();
    assert.equal(retained.deref(), undefined);
  },

  'sheet-container-interface-and-inactive-media-ownership': async options => {
    const { rmlui, context } = options;
    let reference;
    let calls = 0;
    rmlui.DecoratorInstancer.register('media-managed',
      new rmlui.DecoratorInstancer((_name, _properties, active) => {
        ++calls;
        const owner = { generated: 0, rendered: 0 };
        owner.decorator = new rmlui.Decorator(active.getRenderManager(),
          callbacks(rmlui, owner, []));
        reference = new WeakRef(owner);
        return owner.decorator;
      }));
    let active;
    context.setDimensions(50, 50);
    let container = new rmlui.StyleSheetContainer();
    container.loadStyleSheetContainer(
      'div{} @media (min-width: 100px) { div{width:20px;} }', '');
    container.updateCompiledStyleSheet(context);
    let sheet = container.getCompiledStyleSheet();
    const declarations = new rmlui.DecoratorList('media-managed()');
    sheet.instanceDecorators(context.getRenderManager(), declarations);
    context.setDimensions(160, 120);
    container.updateCompiledStyleSheet(context);
    sheet = null;
    await collect();
    assert.ok(reference.deref(), 'inactive media block retains its cache');
    context.setDimensions(50, 50);
    container.updateCompiledStyleSheet(context);
    sheet = container.getCompiledStyleSheet();
    sheet.instanceDecorators(context.getRenderManager(), declarations);
    assert.equal(calls, 1);
    // An owned interface retains a JS-visible path to the sheet's cache.
    active = new rmlui.DecoratorInstancerInterface(
      context.getRenderManager(), sheet);
    container = null;
    sheet = null;
    await collect();
    assert.ok(reference.deref());
    assert.ok(active.getRenderManager());
    active = null;
    await collect();
    assert.equal(reference.deref(), undefined);
  },

  'manual-data-identity-errors-and-release': async options => {
    const { rmlui, context, element } = options;
    const owner = { generated: 0, rendered: 0 };
    const released = [];
    const decorator = new rmlui.Decorator(
      context.getRenderManager(), callbacks(rmlui, owner, released));
    const first = decorator.generateElementData(element);
    decorator.renderElement(element, first);
    assert.equal(owner.rendered, 1);
    decorator.releaseElementData(first);
    decorator.releaseElementData(first);
    assert.deepEqual(released, [ 1 ]);
    assert.equal(first.isValid, false);
    assert.throws(() => decorator.renderElement(element, first), /released/i);
    const sentinel = new Error('decorator callback sentinel');
    const throwing = new rmlui.Decorator(context.getRenderManager(), {
      generateElementData() {
        throw sentinel;
      },
      renderElement() {},
      releaseElementData() {},
    });
    assert.throws(() => throwing.generateElementData(element),
      error => error === sentinel);
    const empty = new rmlui.Decorator(context.getRenderManager(), {
      generateElementData: () => null,
      renderElement() {
        assert.fail('null data cannot render');
      },
      releaseElementData() {
        assert.fail('null data cannot release');
      },
    });
    assert.equal(empty.generateElementData(element), null);
    let reference;
    (() => {
      const data = decorator.generateElementData(element);
      reference = new WeakRef(data);
    })();
    await collect();
    assert.equal(reference.deref(), undefined);
    // GC queues release; the next runtime boundary safely invokes JavaScript.
    context.update();
    assert.deepEqual(released, [ 1, 2 ]);
  },

  'cached-native-owner-and-standalone-cycles': async options => {
    const { rmlui, context, document } = options;
    let reference;
    let calls = 0;
    rmlui.DecoratorInstancer.register('managed',
      new rmlui.DecoratorInstancer((_name, _properties, active) => {
        ++calls;
        const owner = { generated: 0, rendered: 0 };
        owner.decorator = new rmlui.Decorator(active.getRenderManager(),
          callbacks(rmlui, owner, []));
        reference = new WeakRef(owner);
        return owner.decorator;
      }));
    document.getElementById('target').setProperty('decorator', 'managed()');
    context.update();
    context.render();
    await collect();
    assert.ok(reference.deref());
    assert.equal(calls, 1);
    document.getElementById('target').setProperty('decorator', 'none');
    context.update();
    context.render();
    await collect();
    assert.ok(reference.deref(), 'stylesheet cache still owns the callback');
    document.getElementById('target').setProperty('decorator', 'managed()');
    context.update();
    context.render();
    assert.equal(calls, 1);
    assert.ok(reference.deref().rendered >= 2);
    document.close();
    context.update();
    await collect();
    assert.equal(reference.deref(), undefined);
    let standalone;
    (() => {
      const owner = { generated: 0, rendered: 0 };
      owner.decorator = new rmlui.Decorator(context.getRenderManager(),
        callbacks(rmlui, owner, []));
      standalone = new WeakRef(owner);
    })();
    await collect();
    assert.equal(standalone.deref(), undefined);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Decorator callbacks');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('callbacks', 160, 120);
  const document = context.loadDocumentFromMemory(
    '<rml><head><style>div { display:block;width:40px;height:40px; }</style>' +
    '</head><body><div id="target"/></body></rml>');
  document.show();
  context.update();
  try {
    const options = { rmlui, context, document, sfml, window };
    if (name !== 'cached-native-owner-and-standalone-cycles' &&
        name !== 'detached-tree-retains-and-collects-element-data') {
      options.element = document.getElementById('target');
    }
    await cases[name](options);
  } finally {
    if (name !== 'environment-cleanup-with-live-decorators') {
      rmlui.shutdown();
      window.close();
    }
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
  assert.equal(failures, 0, `${failures} decorator callback failures`);
}
