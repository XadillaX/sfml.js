'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'builtin-specifications-and-aliases': ({ rmlui }) => {
    for (const [ Type, name, list ] of [
      [ rmlui.DecoratorInstancer, 'image', rmlui.DecoratorList ],
      [ rmlui.FilterInstancer, 'blur', rmlui.FilterList ],
      [ rmlui.FontEffectInstancer, 'outline', rmlui.FontEffectList ],
    ]) {
      const instancer = Type.get(name);
      assert.ok(instancer instanceof Type);
      assert.equal(Type.get('absent'), null);
      const specification = instancer.getPropertySpecification();
      assert.ok(specification.getRegisteredProperties().length > 0);
      assert.throws(() => specification.registerProperty(
        'unsafe', '0', false, false), /read-only/i);
      Type.register('CUSTOM-' + name, instancer);
      assert.ok(Type.get('custom-' + name) instanceof Type);
      assert.equal(Type.get('CUSTOM-' + name), null);
      assert.ok(new list(`custom-${name}()`).list.length > 0);
      assert.throws(() => Type.register('bad', {}), /instancer/i);
    }
  },

  'font-callback-properties-and-snapshots': ({ rmlui }) => {
    const { FontEffectInstancer, FontEffect, FontEffectList,
      PropertyDictionary, ShorthandType } = rmlui;
    const returned = new FontEffect();
    returned.fingerprint = 123n;
    let input;
    let amount;
    const instancer = new FontEffectInstancer((name, properties) => {
      assert.equal(name, 'custom-font');
      assert.ok(properties instanceof PropertyDictionary);
      input = properties;
      returned.colour = {
        type: 'colourb', red: properties.getProperty(amount.id).get(0),
        green: 20, blue: 30, alpha: 255,
      };
      return returned;
    });
    amount = instancer.registerProperty('amount', '4', false)
      .addParser('number');
    assert.equal(instancer.registerProperty('amount', '999').id, amount.id);
    assert.notEqual(instancer.registerShorthand('font-effect', 'amount',
      ShorthandType.FallThrough), 0);
    const specification = instancer.getPropertySpecification();
    assert.equal(specification.getProperty('amount').defaultValue.value, 4);
    FontEffectInstancer.register('custom-font', instancer);
    const first = new FontEffectList('custom-font(7)').list[0];
    const second = new FontEffectList('custom-font()').list[0];
    assert.equal(first.colour.red, 7);
    assert.equal(second.colour.red, 4);
    assert.notEqual(first.fingerprint, second.fingerprint);
    assert.equal(returned.fingerprint, 123n);
    input.clear();
    returned.colour = {
      type: 'colourb', red: 99, green: 0, blue: 0, alpha: 255,
    };
    assert.equal(first.colour.red, 7);
    const dictionary = new PropertyDictionary();
    specification.setPropertyDefaults(dictionary);
    assert.equal(instancer.instanceFontEffect('custom-font', dictionary)
      .colour.red, 4);
    assert.equal(dictionary.getNumProperties(), 1);
  },

  'delegation-reentry-errors-and-null': ({ rmlui }) => {
    const { FontEffectInstancer, FontEffect, FontEffectList,
      PropertyDictionary } = rmlui;
    const builtin = FontEffectInstancer.get('outline');
    const dictionary = new PropertyDictionary();
    builtin.getPropertySpecification().setPropertyDefaults(dictionary);
    const custom = new FontEffectInstancer(() => {
      assert.throws(() => rmlui.shutdown(), /callback/i);
      assert.throws(() => custom.registerProperty('late', '0'), /callback/i);
      assert.throws(() => new FontEffectList('outline()'), /callback/i);
      assert.throws(() => custom.instanceFontEffect('recursive',
        new PropertyDictionary()), /recurs|callback/i);
      return builtin.instanceFontEffect('outline', dictionary);
    });
    FontEffectInstancer.register('delegate', custom);
    assert.equal(new FontEffectList('delegate()').list[0].hasUniqueTexture,
      true);
    const rejected = new FontEffectInstancer(() => null);
    assert.equal(rejected.instanceFontEffect('null', new PropertyDictionary()),
      null);
    const sentinel = new Error('instancer sentinel');
    FontEffectInstancer.register('throws', new FontEffectInstancer(() => {
      throw sentinel;
    }));
    assert.throws(() => new FontEffectList('throws()'), error =>
      error === sentinel);
    const invalid = new FontEffectInstancer(() => Promise.resolve(
      new FontEffect()));
    assert.throws(() => invalid.instanceFontEffect('async',
      new PropertyDictionary()), /font effect/i);
    assert.throws(() => builtin.instanceFontEffect('outline',
      new PropertyDictionary()), /required/i);
  },

  'registration-bounds-and-generation': ({ rmlui, window }) => {
    const { FontEffectInstancer, FontEffect, PropertyDictionary,
      ShorthandType } = rmlui;
    const instancer = new FontEffectInstancer(() => new FontEffect());
    assert.equal(instancer.registerShorthand('missing', 'absent',
      ShorthandType.FallThrough), 0);
    assert.equal(instancer.getPropertySpecification().getShorthand('missing'),
      null);
    assert.throws(() => instancer.registerShorthand('box', 'missing',
      ShorthandType.Box), /four/i);
    for (let i = 1; i < 128; ++i) {
      assert.equal(instancer.registerProperty(`value-${i}`, '0')
        .addParser('number').id, i);
    }
    assert.throws(() => instancer.registerProperty('overflow', '0'),
      /capacity/i);
    const specification = instancer.getPropertySpecification();
    const definition = specification.getProperty(1);
    const alias = FontEffectInstancer.get('outline');
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => instancer.getPropertySpecification(), /valid/i);
    assert.throws(() => specification.getProperty(1), /valid/i);
    assert.throws(() => definition.defaultValue, /valid/i);
    assert.throws(() => alias.instanceFontEffect('outline',
      new PropertyDictionary()), /valid/i);
  },

  'document-parsing-replacement-and-native-glyphs': ({ rmlui }) => {
    const { FontEffectInstancer, FontEffect, FontEffectList, FontGlyph,
      PropertyDictionary } = rmlui;
    const red = new FontEffect();
    red.colour = { type: 'colourb', red: 255, green: 0, blue: 0, alpha: 255 };
    const old = new FontEffectInstancer(() => red);
    FontEffectInstancer.register('document-effect', old);
    const context = rmlui.createContext('instancer-document', 160, 120);
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>body { font-effect: document-effect(); }' +
      '</style></head><body><div id="child"/></body></rml>');
    document.show();
    context.update();
    const child = document.getElementById('child');
    const saved = child.getProperty('font-effect').value;
    assert.equal(saved.list[0].colour.red, 255);
    FontEffectInstancer.register('document-effect',
      new FontEffectInstancer(() => new FontEffect()));
    const fresh = new FontEffectList('document-effect()');
    assert.equal(fresh.list[0].colour.green, 255);
    assert.equal(saved.list[0].colour.green, 0);
    assert.equal(old.instanceFontEffect('old', new PropertyDictionary())
      .colour.green, 0);
    const builtin = FontEffectInstancer.get('outline');
    assert.throws(() => builtin.registerProperty('unsafe', '0'), /read-only/i);
    assert.throws(() => builtin.getPropertySpecification()
      .getProperty('width').addParser('number'), /read-only/i);
    const dictionary = new PropertyDictionary();
    builtin.getPropertySpecification().setPropertyDefaults(dictionary);
    let effect = builtin.instanceFontEffect('outline', dictionary);
    const reuse = new FontEffectInstancer(() => effect);
    const empty = new PropertyDictionary();
    for (let i = 0; i < 2000; ++i) {
      effect = reuse.instanceFontEffect('reuse', empty);
    }
    const glyph = new FontGlyph();
    glyph.bitmapDimensions = { x: 1, y: 1 };
    glyph.bitmapData = Uint8Array.of(255);
    assert.deepEqual(effect.getGlyphMetrics(glyph).dimensions, { x: 3, y: 3 });
    const pixels = new Uint8Array(36);
    effect.generateGlyphTexture(pixels, { x: 3, y: 3 }, 12, glyph);
    assert.equal(pixels[19], 255);
    document.close();
    context.update();
    assert.equal(saved.list[0].colour.green, 0);
  },

  'callback-gc-and-shutdown': async ({ rmlui }) => {
    const { FontEffectInstancer, FontEffect, FontEffectList } = rmlui;
    let cycleWeak;
    let registeredWeak;
    let stale;
    let specification;
    (() => {
      const owner = {};
      owner.instancer = new FontEffectInstancer(() => {
        void owner;
        return new FontEffect();
      });
      owner.instancer.registerProperty('retained-definition', '5')
        .addParser('number');
      specification = owner.instancer.getPropertySpecification();
      cycleWeak = new WeakRef(owner);
    })();
    (() => {
      const owner = {};
      owner.instancer = new FontEffectInstancer(() => {
        void owner;
        return new FontEffect();
      });
      registeredWeak = new WeakRef(owner);
      FontEffectInstancer.register('retained', owner.instancer);
      stale = owner.instancer;
    })();
    for (let i = 0; i < 16; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(cycleWeak.deref(), undefined);
    assert.equal(specification.getProperty('retained-definition')
      .defaultValue.value, 5);
    assert.ok(registeredWeak.deref());
    assert.equal(new FontEffectList('retained()').list.length, 1);
    rmlui.shutdown();
    for (let i = 0; i < 16; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(registeredWeak.deref(), undefined);
    assert.ok(stale);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Effect instancers');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({ rmlui, window });
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
  assert.equal(failures, 0, `${failures} effect instancer failures`);
}
