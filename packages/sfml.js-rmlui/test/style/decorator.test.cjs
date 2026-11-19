'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function documentWith(context, css = '') {
  const document = context.loadDocumentFromMemory(
    '<rml><head><style>body { width: 120px; height: 90px; }' +
    'div { display: block; width: 40px; height: 30px;' +
    `decorator: delegated(); }${css}` +
    '</style></head><body><div id="first"/><div id="second"/></body></rml>');
  document.show();
  context.update();
  return document;
}

function gradient(rmlui, active) {
  const instancer = rmlui.DecoratorInstancer.get('horizontal-gradient');
  const properties = new rmlui.PropertyDictionary();
  instancer.getPropertySpecification().setPropertyDefaults(properties);
  return instancer.instanceDecorator('horizontal-gradient', properties,
    active);
}

const cases = {
  'scoped-resources-delegation-and-cache': ({ rmlui, context }) => {
    let calls = 0;
    let savedInterface;
    let savedSprite;
    let savedTexture;
    let savedDecorator;
    let snapshot;
    let amount;
    const factory = new rmlui.DecoratorInstancer((name, properties, active) => {
      ++calls;
      assert.equal(name, 'delegated');
      assert.equal(properties.getProperty(amount.id).get(0), 7);
      snapshot = properties;
      assert.ok(active instanceof rmlui.DecoratorInstancerInterface);
      assert.equal(active.getSprite('missing'), null);
      savedSprite = active.getSprite('icon');
      assert.deepEqual(savedSprite.rectangle,
        { p0: { x: 2, y: 3 }, p1: { x: 12, y: 23 } });
      savedInterface = active;
      const filename = path.relative(process.cwd(), path.resolve(__dirname,
        '../../third_party/rmlui/Samples/assets/hello_world.png'));
      savedTexture = active.getTexture(filename);
      assert.ok(savedTexture.getDimensions().x > 0);
      assert.ok(active.getRenderManager() instanceof rmlui.RenderManager);
      savedDecorator = gradient(rmlui, active);
      assert.ok(savedDecorator instanceof rmlui.Decorator);
      return savedDecorator;
    });
    amount = factory.registerProperty('amount', '7').addParser('number');
    assert.equal(factory.registerProperty('amount', '99').id, amount.id);
    assert.notEqual(factory.registerShorthand('decorator', 'amount',
      rmlui.ShorthandType.FallThrough), 0);
    rmlui.DecoratorInstancer.register('delegated', factory);
    const document = documentWith(context, '@spritesheet icons {' +
      'src: missing.png; resolution: 2x; icon: 2px 3px 10px 20px; }');
    context.render();
    context.render();
    assert.equal(calls, 1);
    snapshot.clear();
    assert.throws(() => savedInterface.getSprite('icon'), /scope|active/i);
    assert.throws(() => savedInterface.getTexture('x'), /scope|active/i);
    assert.throws(() => savedInterface.getRenderManager(), /scope|active/i);
    assert.throws(() => factory.instanceDecorator('delegated',
      new rmlui.PropertyDictionary(), savedInterface), /scope|active/i);
    assert.equal(savedSprite.spriteSheet.name, 'icons');
    assert.equal(savedSprite.spriteSheet.displayScale, 0.5);
    assert.ok(savedTexture.getDimensions().x > 0);
    document.close();
    context.update();
    assert.equal(savedSprite.rectangle.p0.x, 2);
    assert.ok(savedDecorator);
  },

  'exceptions-reentry-and-typed-return': ({ rmlui, context }) => {
    let saved;
    const factory = new rmlui.DecoratorInstancer(
      (_name, _properties, active) => {
        saved = active;
        assert.throws(() => rmlui.shutdown(), /callback/i);
        assert.throws(() => factory.registerProperty('late', '0'), /callback/i);
        assert.throws(() => factory.instanceDecorator('recursive',
          new rmlui.PropertyDictionary(), active), /recurs/i);
        assert.throws(() => rmlui.DecoratorInstancer.get('image')
          .instanceDecorator('image', new rmlui.PropertyDictionary(), active),
        /required/i);
        return gradient(rmlui, active);
      });
    rmlui.DecoratorInstancer.register('delegated', factory);
    documentWith(context);
    context.render();
    assert.throws(() => saved.getRenderManager(), /scope|active/i);
    const sentinel = new Error('decorator factory sentinel');
    rmlui.DecoratorInstancer.register('throws',
      new rmlui.DecoratorInstancer((_name, _properties, active) => {
        saved = active;
        throw sentinel;
      }));
    assert.throws(() => context.loadDocumentFromMemory(
      '<rml><head><style>body { decorator: throws(); }</style></head>' +
      '<body/></rml>'), error => error === sentinel);
    assert.throws(() => saved.getRenderManager(), /scope|active/i);
    rmlui.DecoratorInstancer.register('invalid-return',
      new rmlui.DecoratorInstancer(() => Promise.resolve(null)));
    assert.throws(() => context.loadDocumentFromMemory(
      '<rml><head><style>body { decorator: invalid-return(); }</style></head>' +
      '<body/></rml>'), /decorator/i);
  },

  'manual-render-pixels-and-data-owner-gc': async options => {
    const { rmlui, context, sfml, window } = options;
    let decorator;
    let different;
    rmlui.DecoratorInstancer.register('delegated',
      new rmlui.DecoratorInstancer((_name, _properties, active) => {
        different = gradient(rmlui, active);
        decorator = gradient(rmlui, active);
        return decorator;
      }));
    const document = documentWith(context);
    context.render();
    const first = document.getElementById('first');
    const data = decorator.generateElementData(first);
    assert.throws(() => different.releaseElementData(data), /different/i);
    let collected;
    (() => {
      const transient = different.generateElementData(first);
      collected = new WeakRef(transient);
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(collected.deref(), undefined);
    window.clear(sfml.Color.Black);
    window.flush();
    decorator.renderElement(first, data);
    const capture = new sfml.Texture(window.getSize());
    capture.update(window);
    const pixels = capture.copyToImage();
    const white = pixels.getPixel(new sfml.Vector2u(20, 15));
    const black = pixels.getPixel(new sfml.Vector2u(70, 70));
    assert.deepEqual([ white.r, white.g, white.b ], [ 255, 255, 255 ]);
    assert.deepEqual([ black.r, black.g, black.b ], [ 0, 0, 0 ]);
    decorator.releaseElementData(data);
  },

  'manager-release-invalidates-live-data-and-decorators': options => {
    const { rmlui, context, window } = options;
    let decorator;
    const factory = new rmlui.DecoratorInstancer(
      (_name, _properties, active) => {
        decorator ??= gradient(rmlui, active);
        return decorator;
      });
    rmlui.DecoratorInstancer.register('delegated', factory);
    const document = documentWith(context);
    const element = document.getElementById('first');
    const data = decorator.generateElementData(element);
    rmlui.removeContext(context.name);
    rmlui.releaseRenderManagers();
    assert.equal(data.isValid, false);
    assert.throws(() => decorator.releaseElementData(data), /valid/i);
    const next = rmlui.createContext('next', 160, 120);
    assert.throws(() => documentWith(next), /valid/i);
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => factory.getPropertySpecification(), /valid/i);
    assert.throws(() => decorator.generateElementData(element), /valid/i);
  },

  'nested-scopes-null-and-readonly-builtins': ({ rmlui, context }) => {
    let outer;
    let inner;
    const nested = new rmlui.DecoratorInstancer(
      (_name, _properties, active) => {
        inner = active;
        assert.ok(outer.getRenderManager());
        return gradient(rmlui, active);
      });
    const absent = new rmlui.DecoratorInstancer(() => null);
    rmlui.DecoratorInstancer.register('delegated',
      new rmlui.DecoratorInstancer((_name, _properties, active) => {
        outer = active;
        const result = nested.instanceDecorator('nested',
          new rmlui.PropertyDictionary(), active);
        assert.throws(() => inner.getRenderManager(), /scope|active/i);
        assert.ok(active.getRenderManager());
        assert.equal(absent.instanceDecorator('absent',
          new rmlui.PropertyDictionary(), active), null);
        return result;
      }));
    documentWith(context);
    context.render();
    assert.throws(() => outer.getRenderManager(), /scope|active/i);
    const builtin = rmlui.DecoratorInstancer.get('image');
    assert.throws(() => builtin.registerProperty('unsafe', '0'), /read-only/i);
    assert.throws(() => builtin.registerShorthand('unsafe', 'image'),
      /read-only/i);
  },

  'native-data-has-checked-ownership': ({ rmlui, context }) => {
    let decorator;
    rmlui.DecoratorInstancer.register('delegated',
      new rmlui.DecoratorInstancer((_name, _properties, active) => {
        decorator = gradient(rmlui, active);
        return decorator;
      }));
    const document = documentWith(context);
    context.render();
    const first = document.getElementById('first');
    const second = document.getElementById('second');
    const data = decorator.generateElementData(first, rmlui.BoxArea.Padding);
    assert.ok(data instanceof rmlui.DecoratorData);
    assert.ok(data.isValid);
    decorator.renderElement(first, data);
    assert.throws(() => decorator.renderElement(second, data), /element/i);
    assert.throws(() => decorator.renderElement(first, {}), /data/i);
    assert.throws(() => decorator.generateElementData(first, -1), /area/i);
    decorator.releaseElementData(data);
    assert.equal(data.isValid, false);
    assert.throws(() => decorator.renderElement(first, data), /released/i);
    decorator.releaseElementData(data);
    const pending = decorator.generateElementData(first,
      rmlui.BoxArea.Padding);
    document.close();
    context.update();
    assert.throws(() => decorator.renderElement(first, pending), /valid/i);
    decorator.releaseElementData(pending);
    rmlui.removeContext(context.name);
    rmlui.releaseRenderManagers();
    assert.equal(pending.isValid, false);
  },

  'standalone-instancer-cycle-and-registered-lifetime': async ({ rmlui }) => {
    let unregistered;
    let registered;
    let stale;
    (() => {
      const owner = {};
      owner.factory = new rmlui.DecoratorInstancer(() => {
        void owner;
        return null;
      });
      unregistered = new WeakRef(owner);
    })();
    (() => {
      const owner = {};
      owner.factory = new rmlui.DecoratorInstancer(() => {
        void owner;
        return null;
      });
      registered = new WeakRef(owner);
      stale = owner.factory;
      rmlui.DecoratorInstancer.register('retained', owner.factory);
    })();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(unregistered.deref(), undefined);
    assert.ok(registered.deref());
    rmlui.shutdown();
    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(registered.deref(), undefined);
    assert.ok(stale);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Decorators');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('decorators', 160, 120);
  try {
    await cases[name]({ rmlui, context, window, sfml });
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
  assert.equal(failures, 0, `${failures} decorator failures`);
}
