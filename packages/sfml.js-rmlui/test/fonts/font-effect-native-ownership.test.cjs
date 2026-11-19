'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

async function collect() {
  for (let i = 0; i < 16; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function customEffect(rmlui, owner) {
  return new rmlui.FontEffect({
    hasUniqueTexture: () => Boolean(owner),
    getGlyphMetrics(_glyph, origin, dimensions) {
      ++owner.metrics;
      return { supported: true, origin, dimensions };
    },
    generateGlyphTexture(bytes, dimensions, stride) {
      ++owner.textures;
      for (let y = 0; y < dimensions.y; ++y) {
        for (let x = 0; x < dimensions.x; ++x) {
          bytes.set([ 0, 255, 0, 255 ], y * stride + x * 4);
        }
      }
    },
  });
}

function register(rmlui, references) {
  rmlui.FontEffectInstancer.register('native-owner',
    new rmlui.FontEffectInstancer(() => {
      const owner = { metrics: 0, textures: 0 };
      references.push(new WeakRef(owner));
      return customEffect(rmlui, owner);
    }));
}

function loaded(rmlui, source) {
  const container = new rmlui.StyleSheetContainer();
  assert.ok(container.loadStyleSheetContainer(source, 'owner.rcss'));
  return container;
}

const cases = {
  'inactive-media-and-expired-views-retain-callbacks': async options => {
    const { rmlui, context } = options;
    const references = [];
    register(rmlui, references);
    let container = loaded(rmlui, 'body { width: 20px; }' +
      '@media (min-width: 200px) { div { font-effect: native-owner(); } }');
    container.updateCompiledStyleSheet(context);
    let view = container.getCompiledStyleSheet();
    context.setDimensions(240, 120);
    container.updateCompiledStyleSheet(context);
    container = null;
    await collect();
    assert.equal(references.length, 1);
    assert.ok(references[0].deref(), 'expired view still owns its container');
    assert.throws(() => view.getSprite('x'), /valid/i);
    view = null;
    await collect();
    assert.equal(references[0].deref(), undefined);
  },

  'element-definition-outlives-sheet': async ({ rmlui, context }) => {
    const references = [];
    register(rmlui, references);
    let definition;
    (() => {
      const container = loaded(rmlui, 'div { font-effect: native-owner(); }');
      container.updateCompiledStyleSheet(context);
      const doc = context.loadDocumentFromMemory(
        '<rml><body><div/></body></rml>');
      definition = container.getCompiledStyleSheet()
        .getElementDefinition(doc.getChild(0));
      doc.close();
      context.update();
    })();
    await collect();
    assert.ok(references[0].deref());
    assert.equal(definition.getProperty(rmlui.PropertyId.FontEffect)
      .value.list[0].hasUniqueTexture, true);
    definition = null;
    await collect();
    assert.equal(references[0].deref(), undefined);
  },

  'closed-documents-retain-until-update': async ({ rmlui, context }) => {
    const references = [];
    register(rmlui, references);
    let doc = context.loadDocumentFromMemory(
      '<rml><head><style>div { font-effect: native-owner(); }</style></head>' +
      '<body><div/></body></rml>');
    doc.close();
    doc = null;
    await collect();
    assert.ok(references[0].deref(), 'unloaded document is still native-owned');
    context.update();
    await collect();
    assert.equal(references[0].deref(), undefined);
  },

  'cursor-proxy-retains-drag-clone-callbacks': async options => {
    const { rmlui, context } = options;
    const references = [];
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    let document = context.loadDocumentFromMemory(
      '<rml><head><style>#drag { position: absolute; left: 10px; top: 10px;' +
      'width: 48px; height: 32px; font-family: LatoLatin; font-size: 20px;' +
      'drag: clone; }</style></head>' +
      '<body><div id="drag"></div></body></rml>');
    (() => {
      const owner = { metrics: 0, textures: 0 };
      references.push(new WeakRef(owner));
      const target = document.getElementById('drag');
      target.setProperty(rmlui.PropertyId.FontEffect, new rmlui.Property(
        new rmlui.FontEffectList([ customEffect(rmlui, owner) ]),
        rmlui.Unit.FONTEFFECT));
    })();
    document.show();
    context.update();
    context.processMouseMove(20, 20);
    context.processMouseButtonDown(0);
    context.processMouseMove(30, 25);
    document.getElementById('drag')
      .removeProperty(rmlui.PropertyId.FontEffect);
    document = null;
    await collect();
    assert.ok(references[0].deref(), 'cursor proxy owns the drag clone');
    context.processMouseButtonUp(0);
    await collect();
    assert.equal(references[0].deref(), undefined);
  },

  'detached-subtree-retains-and-collects-cycles': async options => {
    const { rmlui, context } = options;
    const doc = context.loadDocumentFromMemory('<rml><body/></rml>');
    let detached;
    let reference;
    (() => {
      const owner = { metrics: 0, textures: 0 };
      detached = doc.createElement('div');
      owner.tree = detached;
      const child = doc.createElement('div');
      detached.appendChild(child);
      child.setProperty(rmlui.PropertyId.FontEffect, new rmlui.Property(
        new rmlui.FontEffectList([ customEffect(rmlui, owner) ]),
        rmlui.Unit.FONTEFFECT));
      reference = new WeakRef(owner);
    })();
    await collect();
    assert.ok(reference.deref());
    assert.equal(detached.getChild(0).getProperty(rmlui.PropertyId.FontEffect)
      .value.list[0].hasUniqueTexture, true);
    detached = null;
    await collect();
    assert.equal(reference.deref(), undefined);
  },

  'specification-and-definition-defaults-retain-callbacks': async options => {
    const { rmlui } = options;
    const references = [];
    register(rmlui, references);
    let specification = new rmlui.PropertySpecification(1, 0);
    let definition = specification.registerProperty(
      'effect', 'native-owner()', false, false).addParser('font_effect');
    await collect();
    assert.equal(references.length, 1);
    assert.ok(references[0].deref());
    definition = null;
    await collect();
    definition = specification.getProperty('effect');
    assert.equal(definition.defaultValue.value.list[0].hasUniqueTexture, true);
    specification = null;
    await collect();
    assert.equal(definition.defaultValue.value.list[0].hasUniqueTexture, true);
    definition = null;
    await collect();
    assert.equal(references[0].deref(), undefined);
  },

  'unregistered-instancer-defaults-have-visible-edges': async ({ rmlui }) => {
    const references = [];
    register(rmlui, references);
    let instancer = new rmlui.FontEffectInstancer(() => null);
    instancer.registerProperty('effect', 'native-owner()', false)
      .addParser('font_effect');
    await collect();
    assert.ok(references[0].deref());
    let specification = instancer.getPropertySpecification();
    instancer = null;
    await collect();
    assert.equal(specification.getProperty('effect')
      .defaultValue.value.list[0].hasUniqueTexture, true);
    specification = null;
    await collect();
    assert.equal(references[0].deref(), undefined);
  },

  'instancer-handoff-survives-gc-in-next-callback': async ({ rmlui }) => {
    const references = [];
    rmlui.FontEffectInstancer.register('handoff',
      new rmlui.FontEffectInstancer(() => {
        global.gc();
        global.gc();
        const owner = {};
        references.push(new WeakRef(owner));
        return customEffect(rmlui, owner);
      }));
    let value = new rmlui.FontEffectList('handoff(), handoff(), handoff()');
    await collect();
    assert.equal(references.length, 3);
    assert.ok(references.every(ref => ref.deref()));
    assert.ok(value.list.every(effect => effect.hasUniqueTexture));
    value = null;
    await collect();
    assert.ok(references.every(ref => ref.deref() === undefined));
  },

  'parser-handoff-keyframes-and-stylesheet-cycles': async options => {
    const { rmlui, context } = options;
    const references = [];
    const parser = new rmlui.PropertyParser((property, text) => {
      global.gc();
      if (!text) {
        property.value = '';
        property.unit = rmlui.Unit.STRING;
        return true;
      }
      const owner = {};
      references.push(new WeakRef(owner));
      property.value = new rmlui.FontEffectList([ customEffect(rmlui, owner) ]);
      property.unit = rmlui.Unit.FONTEFFECT;
      return true;
    });
    rmlui.StyleSheetSpecification.registerParser('owner-parser', parser);
    const id = rmlui.StyleSheetSpecification.registerProperty(
      'owner-effect', '', false).addParser('owner-parser').id;
    let container = loaded(rmlui, 'div { owner-effect: first; }' +
      '@keyframes effects { from { owner-effect: second; }' +
      'to { owner-effect: third; } }');
    container.updateCompiledStyleSheet(context);
    (() => {
      for (const reference of references) {
        reference.deref().container = container;
      }
    })();
    await collect();
    assert.equal(references.length, 3);
    assert.ok(references.every(ref => ref.deref()));
    assert.equal(container.getCompiledStyleSheet().getKeyframes('effects')
      .blocks[0].properties.getProperty(id).value.list[0]
      .hasUniqueTexture, true);
    container = null;
    await collect();
    assert.ok(references.every(ref => ref.deref() === undefined));
  },

  'property-metadata-retains-default-definition': async ({ rmlui }) => {
    const references = [];
    register(rmlui, references);
    let property;
    (() => {
      const spec = new rmlui.PropertySpecification(1, 0);
      const definition = spec.registerProperty(
        'effect', 'native-owner()', false, false).addParser('font_effect');
      property = definition.defaultValue;
      property.value = new rmlui.FontEffectList();
    })();
    await collect();
    assert.ok(references[0].deref());
    assert.equal(property.definition.defaultValue.value.list[0]
      .hasUniqueTexture, true);
    property = null;
    await collect();
    assert.equal(references[0].deref(), undefined);
  },

  'nested-property-metadata-retains-default-definition': async ({ rmlui }) => {
    const references = [];
    register(rmlui, references);
    let value;
    (() => {
      const spec = new rmlui.PropertySpecification(1, 0);
      const definition = spec.registerProperty(
        'effect', 'native-owner()', false, false).addParser('font_effect');
      const property = definition.defaultValue;
      property.value = new rmlui.FontEffectList();
      const declaration = new rmlui.DecoratorDeclaration();
      declaration.type = 'metadata-owner';
      declaration.properties = [{
        id: rmlui.PropertyId.FontEffect, name: 'font-effect', property,
      }];
      value = new rmlui.DecoratorList([ declaration ]);
    })();
    await collect();
    assert.ok(references[0].deref());
    assert.equal(value.list[0].properties[0].property.definition
      .defaultValue.value.list[0].hasUniqueTexture, true);
    value = null;
    await collect();
    assert.equal(references[0].deref(), undefined);
  },

  'registered-defaults-and-shutdown-restart': async ({ rmlui, window }) => {
    const references = [];
    register(rmlui, references);
    let container = loaded(rmlui, 'div { font-effect: native-owner(); }');
    rmlui.StyleSheetSpecification.registerProperty(
      'global-effect', 'native-owner()', false).addParser('font_effect');
    const instancer = new rmlui.FontEffectInstancer(() => null);
    instancer.registerProperty('effect', 'native-owner()', false)
      .addParser('font_effect');
    rmlui.FontEffectInstancer.register('rooted-default', instancer);
    await collect();
    assert.equal(references.length, 3);
    assert.ok(references.every(ref => ref.deref()));
    rmlui.shutdown();
    await collect();
    assert.ok(references.every(ref => ref.deref() === undefined));
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => container.getCompiledStyleSheet(), /valid/i);
    container = null;
    register(rmlui, []);
    assert.equal(new rmlui.FontEffectList('native-owner()').list[0]
      .hasUniqueTexture, true);
  },

  'definition-default-cycles-are-collectable': async ({ rmlui }) => {
    const references = [];
    register(rmlui, references);
    (() => {
      const definition = new rmlui.PropertyDefinition(
        rmlui.PropertyId.FontEffect, 'native-owner()', false, false)
        .addParser('font_effect');
      references[0].deref().definition = definition;
    })();
    await collect();
    assert.equal(references[0].deref(), undefined);
  },

  'shutdown-clears-callbacks-before-last-native-owner-dies': async options => {
    const { rmlui, context } = options;
    const references = [];
    const retained = [];
    (() => {
      const doc = context.loadDocumentFromMemory('<rml><body/></rml>');
      const first = {};
      references.push(new WeakRef(first));
      retained.push(new rmlui.FontEffectList([ customEffect(rmlui, first) ]));
      const second = {};
      references.push(new WeakRef(second));
      const tree = doc.createElement('div');
      tree.setProperty(rmlui.PropertyId.FontEffect, new rmlui.Property(
        new rmlui.FontEffectList([ customEffect(rmlui, second) ]),
        rmlui.Unit.FONTEFFECT));
      retained.push(tree);
    })();
    await collect();
    assert.ok(references.every(ref => ref.deref()));
    rmlui.shutdown();
    await collect();
    assert.ok(references.every(ref => ref.deref() === undefined));
    assert.equal(retained.length, 2);
  },

  'native-attributes-follow-tree-ownership': async ({ rmlui, context }) => {
    const references = [];
    register(rmlui, references);
    const doc = context.loadDocumentFromMemory(
      '<rml><body><div/></body></rml>');
    (() => {
      const child = doc.getChild(0);
      child.setAttribute('font-owner',
        new rmlui.FontEffectList('native-owner()'));
    })();
    await collect();
    assert.ok(references[0].deref());
    const detached = doc.removeChild(doc.getChild(0));
    await collect();
    assert.equal(detached.getAttributeValue('font-owner')
      .list[0].hasUniqueTexture, true);
    detached.removeAttribute('font-owner');
    await collect();
    assert.equal(references[0].deref(), undefined);
  },

  'external-stylesheet-cache-is-a-native-root': async ({ rmlui, context }) => {
    const references = [];
    register(rmlui, references);
    const filename = path.join(os.tmpdir(),
      `rmlui-font-owner-${process.pid}.rcss`);
    try {
      fs.writeFileSync(filename, 'div { font-effect: native-owner(); }');
      const doc = context.loadDocumentFromMemory(
        '<rml><head><link type="text/rcss" ' +
        `href="${path.basename(filename)}"/></head>` +
        '<body><div/></body></rml>');
      doc.close();
      context.update();
      await collect();
      assert.equal(references.length, 1);
      assert.ok(references[0].deref());
      rmlui.shutdown();
      await collect();
      assert.equal(references[0].deref(), undefined);
    } finally {
      fs.rmSync(filename, { force: true });
    }
  },

  'environment-cleanup-with-live-font-layers': async options => {
    const { rmlui, context } = options;
    register(rmlui, []);
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    const doc = context.loadDocumentFromMemory(
      '<rml><head><style>body { font-family: LatoLatin; font-size: 24px;' +
      'font-effect: native-owner(); }</style></head><body>Live atlas</body>' +
      '</rml>');
    doc.show();
    await collect();
    context.update();
    context.render();
  },

  'render-metrics-getter-errors-propagate-and-recover': options => {
    const { rmlui, context } = options;
    const sentinel = new Error('native font metrics getter');
    let fail = true;
    let metrics = 0;
    rmlui.FontEffectInstancer.register('render-error',
      new rmlui.FontEffectInstancer(() => new rmlui.FontEffect({
        hasUniqueTexture: () => false,
        getGlyphMetrics(_glyph, origin, dimensions) {
          ++metrics;
          return {
            supported: true,
            get origin() {
              if (fail) {
                throw sentinel;
              }
              return origin;
            },
            dimensions,
          };
        },
      })));
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    const doc = context.loadDocumentFromMemory(
      '<rml><head><style>body { font-family: LatoLatin; font-size: 24px; }' +
      '</style></head><body>Recoverable text</body></rml>');
    doc.show();
    assert.throws(() => {
      doc.setProperty('font-effect', 'render-error()');
      context.update();
      context.render();
    }, error => error === sentinel);
    assert.ok(metrics > 0);
    const previous = metrics;
    fail = false;
    rmlui.releaseFontResources();
    context.update();
    context.render();
    assert.ok(metrics > previous, 'font resources regenerate after failure');
  },

  'real-atlas-pixels-cache-reuse-and-font-resource-release': async options => {
    const { rmlui, sfml, context, window } = options;
    const references = [];
    register(rmlui, references);
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    let doc = context.loadDocumentFromMemory(
      '<rml><head><style>body { font-family: LatoLatin; font-size: 24px; }' +
      'div { font-effect: native-owner(); }</style></head>' +
      '<body><div id="text">ABC</div></body></rml>');
    doc.show();
    await collect();
    const draw = () => {
      window.clear(sfml.Color.Black);
      window.flush();
      context.update();
      context.render();
    };
    draw();
    const texture = new sfml.Texture(new sfml.Vector2u(160, 120));
    texture.update(window);
    const pixels = texture.copyToImage().pixels;
    let green = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] < 10 && pixels[i + 1] > 240 && pixels[i + 2] < 10) {
        ++green;
      }
    }
    assert.ok(green > 20, `custom atlas must render green pixels: ${green}`);
    const counts = references.map(ref => ({
      metrics: ref.deref().metrics, textures: ref.deref().textures,
    }));
    assert.ok(counts[0].metrics > 0 && counts[0].textures > 0);
    draw();
    assert.deepEqual(references.map(ref => ({
      metrics: ref.deref().metrics, textures: ref.deref().textures,
    })), counts, 'stable native effect identity reuses the atlas');
    doc.close();
    context.update();
    doc = null;
    await collect();
    assert.ok(references[0].deref(), 'font layer owns its effect after close');
    rmlui.releaseFontResources();
    await collect();
    assert.equal(references[0].deref(), undefined);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Native font ownership');
  assert.ok(rmlui.initialise(window, {
    highDpi: false,
    fileRoot: name === 'external-stylesheet-cache-is-a-native-root'
      ? os.tmpdir() : undefined,
  }));
  const context = rmlui.createContext('native-font-owners', 160, 120);
  try {
    await cases[name]({ rmlui, sfml, context, window });
  } finally {
    if (name !== 'environment-cleanup-with-live-font-layers') {
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
  assert.equal(failures, 0, `${failures} native font ownership failures`);
}
