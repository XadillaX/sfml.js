'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'builtin-shader-dictionaries-and-complete-stops': ({ rmlui, context }) => {
    const manager = context.getRenderManager();
    const stops = {
      type: 'colorstoplist',
      values: Array.from({ length: 21 }, (_, index) => ({
        color: { type: 'colourb-premultiplied',
          red: index % 2 ? 0 : 128, green: 0,
          blue: index % 2 ? 128 : 0, alpha: 128 },
        position: { number: index / 20, unit: rmlui.Unit.NUMBER },
      })),
    };
    const parameters = {
      p0: { x: 0, y: 0 }, p1: { x: 80, y: 0 },
      center: { x: 40, y: 40 }, radius: { x: 20, y: 40 },
      angle: 0.3, color_stop_list: stops,
    };
    for (const name of [
      'linear-gradient', 'radial-gradient', 'conic-gradient',
    ]) {
      for (const repeating of [ false, true ]) {
        const shader = manager.compileShader(name,
          { ...parameters, repeating });
        assert.equal(shader.isValid, true, `${name}/${repeating}`);
        shader.release();
        assert.equal(shader.isValid, false);
      }
    }
    const creation = manager.compileShader('shader', {
      value: 'creation', dimensions: { x: 80, y: 40 },
    });
    assert.ok(creation.isValid);
    creation.release();
    assert.equal(manager.compileShader('shader', {
      value: 'creation', dimensions: { x: 0, y: 40 },
    }).isValid, false);
    const custom = manager.compileShader('shader', {
      vertex_shader: 'void main(){gl_Position=gl_ModelViewProjectionMatrix*' +
        'gl_Vertex;}',
      fragment_shader: 'void main(){gl_FragColor=vec4(1.0);}',
    });
    assert.ok(custom.isValid);
    custom.release();
  },

  'core-gradient-decorator-positive-pixels': ({ context, window }) => {
    const sfml = require('sfml.js');
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>body{margin:0;padding:0;}#paint{' +
      'position:absolute;left:0;top:0;width:80px;height:80px;' +
      'decorator:linear-gradient(90deg,red 0%,blue 100%);}' +
      '</style></head><body><div id="paint"/></body></rml>');
    document.show();
    context.update();
    window.clear(sfml.Color.Black);
    window.flush();
    context.render();
    const capture = new sfml.Texture(window.getSize());
    capture.update(window);
    const image = capture.copyToImage();
    const pixel = image.getPixel(new sfml.Vector2u(20, 30));
    const ratio = 20.5 / 80;
    const blue = ratio * ratio * (3 - 2 * ratio);
    assert.ok(Math.abs(pixel.r - 255 * (1 - blue)) <= 2);
    assert.ok(Math.abs(pixel.b - 255 * blue) <= 2);
    assert.equal(pixel.g, 0);
    assert.ok(pixel.r + pixel.b >= 253);
    document.close();
  },

  'native-compilation-and-unique-release': ({ rmlui, context, element }) => {
    const manager = context.getRenderManager();
    assert.ok(manager instanceof rmlui.RenderManager);
    assert.equal(manager, context.getRenderManager());
    assert.equal(manager, element.getRenderManager());
    const filter = manager.compileFilter('blur', { sigma: 2 });
    assert.ok(filter instanceof rmlui.CompiledFilter);
    assert.equal(filter.isValid, true);
    const list = new rmlui.FilterHandleList();
    filter.addHandleTo(list);
    filter.addHandleTo(list);
    assert.equal(list.size, 2);
    const empty = new rmlui.CompiledFilter();
    assert.equal(empty.isValid, false);
    empty.addHandleTo(list);
    assert.equal(list.size, 2);
    empty.release();
    filter.release();
    filter.release();
    assert.equal(filter.isValid, false);
    list.clear();
    assert.equal(list.size, 0);
    assert.equal(rmlui.CompiledFilter.invalidHandle(), 0n);
    assert.equal(rmlui.CompiledShader.invalidHandle(), 0n);
    const shader = manager.compileShader('uniform-colour', {
      vertex_shader: 'void main(){gl_Position=gl_ModelViewProjectionMatrix*' +
        'gl_Vertex;}',
      fragment_shader: 'void main(){gl_FragColor=vec4(1.0);}',
    });
    assert.equal(shader.isValid, true);
    shader.release();
    shader.release();
    assert.equal(shader.isValid, false);
    assert.equal(new rmlui.CompiledShader().isValid, false);
    assert.equal(manager.compileFilter('not-supported', {}).isValid, false);
    assert.equal(manager.compileShader('missing-source', {}).isValid, false);
    const blur = rmlui.FilterInstancer.get('blur');
    const parameters = new rmlui.PropertyDictionary();
    blur.getPropertySpecification().setPropertyDefaults(parameters);
    const owned = blur.instanceFilter('blur', parameters)
      .compileFilter(element);
    assert.equal(owned.isValid, true);
    owned.release();
  },

  'unused-manager-and-shared-context-lifetime': ({ rmlui, context }) => {
    const shared = rmlui.createContext('shared', 160, 120);
    const manager = context.getRenderManager();
    const filter = manager.compileFilter('blur', { sigma: 3 });
    assert.equal(manager, shared.getRenderManager());
    context.remove();
    rmlui.releaseRenderManagers();
    assert.equal(filter.isValid, true);
    assert.equal(manager.compileFilter('blur', { sigma: 1 }).isValid, true);
    shared.remove();
    rmlui.releaseRenderManagers();
    assert.throws(() => filter.isValid, /valid/i);
    assert.throws(() => filter.release(), /valid/i);
    assert.throws(() => manager.compileFilter('blur', { sigma: 1 }), /valid/i);
    const replacement = rmlui.createContext('replacement', 160, 120);
    assert.notEqual(replacement.getRenderManager(), manager);
    assert.equal(replacement.getRenderManager()
      .compileFilter('blur', { sigma: 1 }).isValid, true);
  },

  'owned-manager-and-resource-gc': async ({ rmlui }) => {
    let managerRef;
    let filter;
    (() => {
      const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
      managerRef = new WeakRef(manager);
      filter = manager.compileFilter('blur', { sigma: 1 });
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(managerRef.deref(), undefined);
    assert.equal(filter.isValid, true);
    rmlui.releaseRenderManagers();
    assert.equal(filter.isValid, true);
    filter.release();
    const list = new rmlui.FilterHandleList();
    let filterRef;
    (() => {
      const manager = new rmlui.RenderManager(rmlui.getRenderInterface());
      const retained = manager.compileFilter('blur', { sigma: 2 });
      retained.addHandleTo(list);
      filterRef = new WeakRef(retained);
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(filterRef.deref(), undefined);
    assert.equal(list.size, 1);
    list.clear();
    rmlui.shutdown();
    assert.throws(() => filter.isValid, /initial|valid/i);
  },

  'late-getters-stale-handles-and-invalid-input': options => {
    const { rmlui, window, context, element } = options;
    const manager = context.getRenderManager();
    const filter = manager.compileFilter('blur', { sigma: 1 });
    const list = new rmlui.FilterHandleList();
    assert.throws(() => manager.compileFilter('blur', {}), /sigma/i);
    assert.throws(() => manager.compileFilter('blur', { sigma: NaN }),
      /finite/i);
    assert.throws(() => filter.addHandleTo({}), /list/i);
    const blur = rmlui.FilterInstancer.get('blur');
    const properties = new rmlui.PropertyDictionary();
    blur.getPropertySpecification().setPropertyDefaults(properties);
    const native = blur.instanceFilter('blur', properties);
    const detached = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>').createElement('div');
    assert.equal(detached.getRenderManager(), null);
    assert.throws(() => native.compileFilter(detached), /manager/i);
    const parameters = {
      get sigma() {
        rmlui.shutdown();
        assert.ok(rmlui.initialise(window, { highDpi: false }));
        return 2;
      },
    };
    assert.throws(() => manager.compileFilter('blur', parameters), /valid/i);
    assert.throws(() => native.compileFilter(element), /valid/i);
    assert.throws(() => filter.addHandleTo(list), /valid/i);
    assert.throws(() => list.size, /valid/i);
    const binding = require('../../dist/internal/native').native;
    assert.throws(() => binding.compileRenderFilter({}, 'blur', { sigma: 1 }),
      /manager/i);
    assert.throws(() => binding.releaseCompiledFilter({}), /filter/i);
    assert.throws(() => binding.releaseCompiledShader(filter), /shader/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Compiled resources');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('resources', 160, 120);
  const document = context.loadDocumentFromMemory(
    '<rml><head/><body><div id="target"/></body></rml>');
  document.show();
  context.update();
  try {
    await cases[name]({
      rmlui, window, context, element: document.getElementById('target'),
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
  assert.equal(failures, 0, `${failures} compiled resource failures`);
}
