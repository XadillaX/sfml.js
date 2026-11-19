'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

function loaded(rmlui, source) {
  const container = new rmlui.StyleSheetContainer();
  assert.equal(container.loadStyleSheetContainer(
    source, 'styles/test.rcss'), true);
  return container;
}

const cases = {
  'event-independent-sheet-swap-retains-borrowed-guards':
    ({ rmlui, context }) => {
      const document = context.loadDocumentFromMemory(
        '<rml><head><style>div { width: 10px; }</style></head>' +
        '<body><button id="change"/><div id="target"/></body></rml>');
      context.update();
      const borrowed = document.getStyleSheetContainer();
      const base = loaded(rmlui, 'div { height: 20px; }');
      let events = 0;
      document.getElementById('change').addEventListener('click', () => {
        events++;
        const custom = new rmlui.StyleSheetContainer();
        const stream = new rmlui.StreamMemory(
          Buffer.from('div { width: 40px; }'));
        stream.setSourceURL('sandbox://rcss');
        assert.ok(custom.loadStyleSheetContainer(stream));
        assert.throws(() => borrowed.loadStyleSheetContainer('div {}'),
          /borrow/i);
        assert.throws(() => borrowed.mergeStyleSheetContainer(custom),
          /callback/i);
        const combined = base.combineStyleSheetContainer(custom);
        document.setStyleSheetContainer(combined);
        assert.throws(() => combined.loadStyleSheetContainer('div {}'),
          /compiled/i);
        assert.throws(() => context.update(), /callback/i);
      });
      document.getElementById('change').click();
      context.update();
      assert.equal(events, 1);
      const target = document.getElementById('target');
      assert.equal(target.getProperty('width').value, 40);
      assert.equal(target.getProperty('height').value, 20);
      assert.ok(borrowed.getCompiledStyleSheet());
    },

  'duplicate-keyframe-times-use-the-last-native-block': options => {
    const { rmlui, context } = options;
    const container = loaded(rmlui,
      '@keyframes pulse {' +
      'to { opacity: 1; } 50% { width: 12px; }' +
      'from { opacity: 0; } 50% { height: 20px; } }');
    container.updateCompiledStyleSheet(context);

    const frames = container.getCompiledStyleSheet().getKeyframes('pulse');
    assert.deepEqual(frames.blocks.map(block => block.normalizedTime),
      [ 0, 0.5, 1 ]);
    assert.deepEqual(frames.propertyIds,
      [ rmlui.PropertyId.Height, rmlui.PropertyId.Opacity ]);
    assert.equal(frames.blocks[1].properties
      .getProperty(rmlui.PropertyId.Width), null);
    assert.equal(frames.blocks[1].properties
      .getProperty(rmlui.PropertyId.Height).get(0), 20);
  },

  'negated-media-query-evaluates-every-condition': ({ rmlui, context }) => {
    const document = context.loadDocumentFromMemory(
      '<rml><body><div id="target"/></body></rml>');
    const target = document.getElementById('target');
    const container = loaded(rmlui,
      'div { width: 1px; }' +
      '@media not (min-width: 100px) and (min-height: 200px)' +
      ' { div { width: 9px; } }');

    for (const [ width, height, expected, changed ] of [
      [ 160, 120, 9, true ],
      [ 160, 240, 1, true ],
      [ 80, 240, 9, true ],
      [ 80, 120, 9, false ],
    ]) {
      context.setDimensions(width, height);
      const compiled = container.updateCompiledStyleSheet(context);
      const sheet = container.getCompiledStyleSheet();
      assert.equal(sheet.getElementDefinition(target)
        .getProperty(rmlui.PropertyId.Width).get(0), expected,
      `Negated query at ${width}x${height}`);
      assert.equal(compiled, changed);
      assert.equal(container.updateCompiledStyleSheet(context), false);
    }
  },

  'decorator-cache-is-local-to-its-render-manager': options => {
    const { rmlui, context } = options;
    const container = loaded(rmlui, 'div { width: 20px; }');
    container.updateCompiledStyleSheet(context);
    const sheet = container.getCompiledStyleSheet();
    const manager = context.getRenderManager();
    const other = new rmlui.RenderManager(rmlui.getRenderInterface());
    const managers = [];
    const builtin = rmlui.DecoratorInstancer.get('horizontal-gradient');
    const instancer = new rmlui.DecoratorInstancer(
      (_name, _properties, active) => {
        managers.push(active.getRenderManager());
        const properties = new rmlui.PropertyDictionary();
        builtin.getPropertySpecification().setPropertyDefaults(properties);
        return builtin.instanceDecorator('horizontal-gradient',
          properties, active);
      });
    rmlui.DecoratorInstancer.register('cache-manager', instancer);
    const declarations = new rmlui.DecoratorList('cache-manager()');
    const first = sheet.instanceDecorators(manager, declarations);
    assert.equal(first.length, 1);
    assert.ok(first[0] instanceof rmlui.Decorator);
    sheet.instanceDecorators(manager, declarations);
    assert.equal(managers.length, 1);
    first.length = 0;
    assert.equal(sheet.instanceDecorators(manager, declarations).length, 1);
    sheet.instanceDecorators(other, declarations);
    assert.deepEqual(managers, [ manager, other ]);
    sheet.instanceDecorators(other, declarations);
    assert.equal(managers.length, 2);
    const source = { path: 'other/theme.rcss', lineNumber: 3, ruleName: '' };
    sheet.instanceDecorators(manager, declarations, source);
    assert.equal(managers.length, 3);
    const uncached = new rmlui.DecoratorList(declarations.list);
    sheet.instanceDecorators(manager, uncached);
    sheet.instanceDecorators(manager, uncached);
    assert.equal(managers.length, 5);
    assert.throws(() => sheet.instanceDecorators(manager,
      new rmlui.FilterList('opacity(0.5)')), /decorator/i);
  },

  'decorator-cache-is-cleared-by-merge-and-manager-release': options => {
    const { rmlui, context } = options;
    const container = loaded(rmlui,
      '@decorator tint : horizontal-gradient {' +
      'start-color: red; stop-color: blue; }');
    container.updateCompiledStyleSheet(context);
    const view = container.getCompiledStyleSheet();
    const sheet = view.combineStyleSheet(view);
    const named = new rmlui.DecoratorList('tint');
    let calls = 0;
    const instancer = new rmlui.DecoratorInstancer(
      (_name, _properties, active) => {
        ++calls;
        const builtin = rmlui.DecoratorInstancer.get('vertical-gradient');
        const properties = new rmlui.PropertyDictionary();
        builtin.getPropertySpecification().setPropertyDefaults(properties);
        return builtin.instanceDecorator('vertical-gradient',
          properties, active);
      });
    rmlui.DecoratorInstancer.register('replacement', instancer);
    const replacement = loaded(rmlui, '@decorator tint : replacement {}');
    replacement.updateCompiledStyleSheet(context);
    const first = sheet.instanceDecorators(context.getRenderManager(), named);
    assert.equal(first.length, 1);
    sheet.mergeStyleSheet(replacement.getCompiledStyleSheet());
    sheet.instanceDecorators(context.getRenderManager(), named);
    assert.equal(calls, 1);
    sheet.instanceDecorators(context.getRenderManager(), named);
    assert.equal(calls, 1);
    rmlui.removeContext(context.name);
    rmlui.releaseRenderManagers();
    const next = rmlui.createContext('replacement-manager', 160, 120);
    sheet.instanceDecorators(next.getRenderManager(), named);
    assert.equal(calls, 2);
    assert.throws(() => first[0].generateElementData(
      next.loadDocumentFromMemory('<rml><body/></rml>')), /valid/i);
  },

  'decorator-instancing-errors-and-result-retention': async options => {
    const { rmlui, context } = options;
    let container = loaded(rmlui, 'div { width: 20px; height: 20px; }');
    container.updateCompiledStyleSheet(context);
    let sheet = container.getCompiledStyleSheet();
    const manager = context.getRenderManager();
    const sentinel = new Error('stylesheet decorator sentinel');
    rmlui.DecoratorInstancer.register('throwing',
      new rmlui.DecoratorInstancer(() => {
        throw sentinel;
      }));
    assert.throws(() => sheet.instanceDecorators(manager,
      new rmlui.DecoratorList('throwing()')), error => error === sentinel);
    rmlui.DecoratorInstancer.register('absent',
      new rmlui.DecoratorInstancer(() => null));
    assert.deepEqual(sheet.instanceDecorators(manager,
      new rmlui.DecoratorList('absent()')), []);
    const [ decorator ] = sheet.instanceDecorators(manager,
      new rmlui.DecoratorList('horizontal-gradient(red blue)'));
    const weak = new WeakRef(container);
    container = null;
    sheet = null;
    for (let i = 0; i < 8; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>div { width: 20px; height: 20px; }</style></head>' +
      '<body><div id="target"/></body></rml>');
    document.updateDocument();
    const target = document.getElementById('target');
    const data = decorator.generateElementData(target);
    assert.ok(data?.isValid);
    decorator.renderElement(target, data);
    decorator.releaseElementData(data);
    assert.equal(data.isValid, false);
  },

  'shared-container-updates-every-document': ({ rmlui, context }) => {
    const source = '<rml><body><div id="target"/></body></rml>';
    const first = context.loadDocumentFromMemory(source);
    const second = context.loadDocumentFromMemory(source);
    const container = loaded(rmlui, 'div { width: 10px; }' +
      '@media (min-width: 200px) { div { width: 40px; } }');
    first.setStyleSheetContainer(container);
    second.setStyleSheetContainer(container);
    context.update();
    const targets = [ first, second ].map(doc => doc.getElementById('target'));
    assert.deepEqual(targets.map(el => el.getComputedValues().width.value),
      [ 10, 10 ]);
    const view = targets[1].getStyleSheet();
    const borrowed = second.getStyleSheetContainer();
    assert.throws(() => borrowed.updateCompiledStyleSheet(context), /borrow/i);
    assert.throws(() => borrowed.mergeStyleSheetContainer(container),
      /borrow/i);
    context.setDimensions(240, 120);
    context.update();
    assert.deepEqual(targets.map(el => el.getComputedValues().width.value),
      [ 40, 40 ]);
    assert.throws(() => view.getSprite('missing'), /valid/i);
    const detached = first.createElement('div');
    assert.equal(detached.getStyleSheet(), null);
  },

  'reload-preserves-elements-and-inline-style': ({ rmlui, context }) => {
    const filename = path.join(os.tmpdir(),
      `rmlui-stylesheet-${process.pid}.rml`);
    const source = width => '<rml><head><style>' +
      `div { width: ${width}px; height: 20px; }` +
      '</style></head><body><div id="target"/></body></rml>';
    try {
      fs.writeFileSync(filename, source(10));
      const document = context.loadDocument(filename);
      document.updateDocument();
      const target = document.getElementById('target');
      const old = document.getStyleSheet();
      target.setProperty('height', '35px');
      fs.writeFileSync(filename, source(50));
      document.reloadStyleSheet();
      document.updateDocument();
      assert.equal(document.getElementById('target'), target);
      assert.equal(target.getComputedValues().width.value, 50);
      assert.equal(target.getComputedValues().height.value, 35);
      assert.equal(old.getElementDefinition(target)
        .getProperty(rmlui.PropertyId.Width).get(0), 10);
      assert.equal(document.getStyleSheet().getElementDefinition(target)
        .getProperty(rmlui.PropertyId.Width)
        .get(0), 50);
    } finally {
      fs.rmSync(filename, { force: true });
    }
  },

  'element-definition-matches-hierarchy-and-survives-merge': options => {
    const { rmlui, context } = options;
    const document = context.loadDocumentFromMemory(
      '<rml><body><section><div id="target" class="item"/></section>' +
      '<div id="outside" class="item"/><span id="unmatched"/></body></rml>');
    const target = document.getElementById('target');
    const first = loaded(rmlui,
      '.item { width: 10px; --accent: red; }' +
      'section > .item { height: 20px; }');
    const second = loaded(rmlui, '.item { width: 30px; --accent: blue; }');
    first.updateCompiledStyleSheet(context);
    second.updateCompiledStyleSheet(context);
    const original = first.getCompiledStyleSheet();
    const sheet = original.combineStyleSheet(original);
    sheet.buildNodeIndex();
    const old = sheet.getElementDefinition(target);
    assert.ok(old instanceof rmlui.ElementDefinition);
    assert.equal(old.getProperty(rmlui.PropertyId.Width).get(0), 10);
    assert.equal(old.getProperty(rmlui.PropertyId.Height).get(0), 20);
    assert.equal(old.getCustomProperty('--accent').get(''), 'red');
    assert.deepEqual(old.getPropertyIds().sort((a, b) => a - b),
      [ rmlui.PropertyId.Width, rmlui.PropertyId.Height ]
        .sort((a, b) => a - b));
    const copy = old.getProperties();
    copy.clear();
    assert.equal(old.getProperty(rmlui.PropertyId.Width).get(0), 10);
    assert.equal(sheet.getElementDefinition(document.getElementById('outside'))
      .getProperty(rmlui.PropertyId.Height), null);
    const unmatched = document.getElementById('unmatched');
    assert.equal(sheet.getElementDefinition(unmatched), null);
    assert.equal(sheet.getElementDefinition(document.createTextNode('x')),
      null);
    sheet.mergeStyleSheet(second.getCompiledStyleSheet());
    sheet.buildNodeIndex();
    const fresh = sheet.getElementDefinition(target);
    assert.equal(fresh.getProperty(rmlui.PropertyId.Width).get(0), 30);
    assert.equal(fresh.getCustomProperty('--accent').get(''), 'blue');
    assert.equal(old.getProperty(rmlui.PropertyId.Width).get(0), 10);
    document.close();
    context.update();
    assert.equal(fresh.getProperty(rmlui.PropertyId.Height).get(0), 20);
    assert.throws(() => sheet.getElementDefinition(target), /valid/i);
    rmlui.shutdown();
    assert.throws(() => fresh.getProperties(), /valid|initial/i);
  },

  'document-stylesheet-ownership-media-and-clearing': async options => {
    const { rmlui, context } = options;
    const document = context.loadDocumentFromMemory(
      '<rml><body><div id="target"/></body></rml>');
    const target = document.getElementById('target');
    let container = loaded(rmlui,
      'div { width: 20px; }' +
      '@media (min-width: 200px) { div { width: 60px; } }');
    document.setStyleSheetContainer(container);
    document.updateDocument();
    assert.equal(target.getComputedValues().width.value, 20);
    const sheet = document.getStyleSheet();
    const alias = document.getStyleSheetContainer();
    assert.ok(alias instanceof rmlui.StyleSheetContainer);
    assert.throws(() => alias.loadStyleSheetContainer(''), /compiled|borrow/i);
    const active = new rmlui.DecoratorInstancerInterface(
      context.getRenderManager(), sheet);
    const weak = new WeakRef(container);
    container = null;
    for (let i = 0; i < 8; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    context.setDimensions(240, 120);
    document.updateDocument();
    assert.equal(target.getComputedValues().width.value, 60);
    assert.throws(() => sheet.getSprite('missing'), /valid/i);
    assert.throws(() => active.getSprite('missing'), /valid/i);
    const wide = alias.getCompiledStyleSheet();
    assert.equal(wide.getElementDefinition(target)
      .getProperty(rmlui.PropertyId.Width).get(0), 60);
    context.setDimensions(160, 120);
    context.setDimensions(240, 120);
    assert.throws(() => wide.getSprite('missing'), /valid/i);
    document.setStyleSheetContainer(null);
    document.updateDocument();
    assert.equal(document.getStyleSheet(), null);
    assert.equal(document.getStyleSheetContainer(), null);
    assert.notEqual(target.getComputedValues().width.value, 60);
    document.close();
    context.update();
    assert.equal(alias.getCompiledStyleSheet().getSprite('missing'), null);
  },

  'compile-media-invalidation-and-owned-combination': ({ rmlui, context }) => {
    const container = loaded(rmlui,
      '@spritesheet base { src: base.png; icon: 1px 2px 3px 4px; }' +
      '@media (min-width: 200px) {' +
      '@spritesheet wide { src: wide.png; wide: 5px 6px 7px 8px; }}');
    assert.equal(container.getCompiledStyleSheet(), null);
    assert.equal(container.updateCompiledStyleSheet(context), true);
    const sheet = container.getCompiledStyleSheet();
    assert.ok(sheet instanceof rmlui.StyleSheet);
    const sprite = sheet.getSprite('icon');
    assert.equal(sprite.rectangle.p0.x, 1);
    assert.equal(sheet.getSprite('wide'), null);
    assert.equal(container.updateCompiledStyleSheet(context), false);
    assert.equal(sheet.getSprite('icon').rectangle.p0.x, 1);
    const copy = sheet.combineStyleSheet(sheet);
    assert.throws(() => sheet.mergeStyleSheet(copy), /owned|borrow/i);
    assert.throws(() => sheet.buildNodeIndex(), /owned|borrow/i);
    context.setDimensions(240, 120);
    assert.equal(container.updateCompiledStyleSheet(context), true);
    assert.throws(() => sheet.getSprite('icon'), /valid/i);
    assert.equal(container.getCompiledStyleSheet()
      .getSprite('wide').rectangle.p0.x, 5);
    assert.equal(copy.getSprite('icon').rectangle.p0.x, 1);
    copy.buildNodeIndex();
    assert.equal(sprite.rectangle.p0.x, 1);
  },

  'container-merge-preconditions-and-stylesheet-precedence': options => {
    const { rmlui, context } = options;
    const a = loaded(rmlui,
      '@spritesheet a { src: a.png; one: 1px 2px 3px 4px; }');
    const b = loaded(rmlui,
      '@spritesheet b { src: b.png; two: 5px 6px 7px 8px; }');
    assert.throws(() => a.mergeStyleSheetContainer(a), /itself|same/i);
    const combined = a.combineStyleSheetContainer(b);
    a.mergeStyleSheetContainer(b);
    for (const container of [ a, combined ]) {
      assert.equal(container.updateCompiledStyleSheet(context), true);
      assert.ok(container.getCompiledStyleSheet().getSprite('one'));
      assert.ok(container.getCompiledStyleSheet().getSprite('two'));
      assert.throws(() => container.mergeStyleSheetContainer(b), /compiled/i);
      assert.throws(() => container.loadStyleSheetContainer(''), /compiled/i);
    }
    b.updateCompiledStyleSheet(context);
    const owned = b.getCompiledStyleSheet()
      .combineStyleSheet(b.getCompiledStyleSheet());
    owned.mergeStyleSheet(a.getCompiledStyleSheet());
    owned.buildNodeIndex();
    assert.ok(owned.getSprite('one'));
    assert.throws(() => owned.mergeStyleSheet(owned), /itself|same/i);
    assert.throws(() => b.updateCompiledStyleSheet({}), /context|handle/i);
    const empty = new rmlui.StyleSheetContainer();
    assert.throws(() => empty.loadStyleSheetContainer('', '', 0), /line/i);
  },

  'explicit-interface-retains-owners-and-copies-source': async options => {
    const { rmlui, context } = options;
    let active;
    let weakContainer;
    (() => {
      const container = loaded(rmlui,
        '@spritesheet icons { src: x.png; icon: 2px 3px 4px 5px; }');
      container.updateCompiledStyleSheet(context);
      const source = {
        path: path.resolve(__dirname,
          '../../third_party/rmlui/Samples/assets/source.rcss'),
        lineNumber: 4,
        ruleName: 'div',
      };
      active = new rmlui.DecoratorInstancerInterface(
        context.getRenderManager(), container.getCompiledStyleSheet(), source);
      source.path = '/does/not/exist/source.rcss';
      weakContainer = new WeakRef(container);
    })();
    for (let i = 0; i < 8; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weakContainer.deref(), undefined);
    assert.equal(active.getSprite('icon').rectangle.p0.x, 2);
    assert.ok(active.getTexture('hello_world.png').getDimensions().x > 0);
    const instancer = rmlui.DecoratorInstancer.get('horizontal-gradient');
    const properties = new rmlui.PropertyDictionary();
    instancer.getPropertySpecification().setPropertyDefaults(properties);
    const decorator = instancer.instanceDecorator(
      'horizontal-gradient', properties, active);
    assert.ok(decorator instanceof rmlui.Decorator);
    rmlui.removeContext(context.name);
    rmlui.releaseRenderManagers();
    assert.throws(() => active.getSprite('icon'), /valid/i);
  },

  'interface-invalidates-on-recompilation-and-restart': options => {
    const { rmlui, context, window } = options;
    const container = loaded(rmlui,
      '@media (min-width: 200px) { body { width: 10px; } }');
    container.updateCompiledStyleSheet(context);
    const sheet = container.getCompiledStyleSheet();
    const active = new rmlui.DecoratorInstancerInterface(
      context.getRenderManager(), sheet);
    assert.equal(active.getTexture('absent.png').isValid, false);
    context.setDimensions(240, 120);
    container.updateCompiledStyleSheet(context);
    assert.throws(() => active.getRenderManager(), /valid/i);
    assert.throws(() => new rmlui.DecoratorInstancerInterface(
      context.getRenderManager(), sheet), /valid/i);
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => container.getCompiledStyleSheet(), /valid/i);
    assert.throws(() => sheet.getSprite('x'), /valid/i);
  },

  'named-decorators-and-keyframes-are-independent-snapshots': options => {
    const { rmlui, context } = options;
    const a = loaded(rmlui,
      '@decorator tint : horizontal-gradient {' +
      'start-color: red; stop-color: blue; }' +
      '@keyframes fade { from { opacity: 0; } to { opacity: 1; } }');
    const b = loaded(rmlui,
      '@decorator tint : vertical-gradient {' +
      'start-color: green; stop-color: white; }' +
      '@keyframes fade { from { opacity: 0.25; } to { opacity: 0.75; } }');
    a.updateCompiledStyleSheet(context);
    b.updateCompiledStyleSheet(context);
    const sheet = a.getCompiledStyleSheet();
    const named = sheet.getNamedDecorator('tint');
    assert.equal(named.type, 'horizontal-gradient');
    assert.ok(named.instancer instanceof rmlui.DecoratorInstancer);
    const keyframes = sheet.getKeyframes('fade');
    assert.deepEqual(keyframes.propertyIds, [ rmlui.PropertyId.Opacity ]);
    assert.deepEqual(keyframes.blocks.map(block => block.normalizedTime),
      [ 0, 1 ]);
    assert.equal(keyframes.blocks[0].properties
      .getProperty(rmlui.PropertyId.Opacity).get(0), 0);
    keyframes.blocks[0].properties.clear();
    named.properties.clear();
    assert.ok(sheet.getNamedDecorator('tint').properties
      .getNumProperties() > 0);
    assert.equal(sheet.getKeyframes('fade').blocks[0].properties
      .getProperty(rmlui.PropertyId.Opacity).get(0), 0);
    const combined = sheet.combineStyleSheet(b.getCompiledStyleSheet());
    assert.equal(combined.getNamedDecorator('tint').type, 'vertical-gradient');
    assert.equal(combined.getKeyframes('fade').blocks[0].properties
      .getProperty(rmlui.PropertyId.Opacity).get(0), 0.25);
    assert.equal(sheet.getKeyframes('missing'), null);
    assert.equal(sheet.getNamedDecorator('missing'), null);
    assert.throws(() => sheet.getKeyframes({}), /name/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Style sheets');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('style-sheets', 160, 120);
  try {
    await cases[name]({ rmlui, context, window });
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
  assert.equal(failures, 0, `${failures} stylesheet failures`);
}
