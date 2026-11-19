'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'plain-custom-and-shorthand-snapshots': function({ rmlui }) {
    const { PropertyDictionary, Property, PropertyId, ShorthandId, Unit } =
      rmlui;
    const dictionary = new PropertyDictionary();
    assert.ok(dictionary.empty());
    assert.equal(dictionary.getNumProperties(), 0);
    assert.equal(dictionary.getProperty(PropertyId.Width), null);
    assert.equal(dictionary.getCustomProperty('--gap'), null);
    assert.equal(dictionary.getVarShorthand(ShorthandId.Margin), null);
    const width = new Property(20, Unit.PX, 7);
    dictionary.setProperty(PropertyId.Width, width);
    width.value = 90;
    assert.equal(dictionary.getProperty(PropertyId.Width).value, 20);
    const properties = dictionary.getProperties();
    properties.get(PropertyId.Width).value = 80;
    assert.equal(dictionary.getProperty(PropertyId.Width).value, 20);
    dictionary.setCustomProperty('--gap', new Property('5px', Unit.STRING));
    dictionary.setVarShorthand(ShorthandId.Margin,
      new Property('var(--gap)', Unit.VAR_EXPRESSION));
    assert.equal(dictionary.getNumProperties(), 1);
    assert.equal(dictionary.getCustomProperties().get('--gap').value, '5px');
    assert.equal(dictionary.getVarShorthands().get(ShorthandId.Margin).value,
      'var(--gap)');
    dictionary.removeProperty(PropertyId.Width);
    dictionary.removeProperty(PropertyId.Width);
    assert.equal(dictionary.getNumProperties(), 0);
    assert.equal(dictionary.empty(), false);
    assert.equal(dictionary.removeCustomProperty('--gap'), true);
    assert.equal(dictionary.removeCustomProperty('--gap'), false);
    assert.equal(dictionary.removeVarShorthand(ShorthandId.Margin), true);
    assert.equal(dictionary.removeVarShorthand(ShorthandId.Margin), false);
    assert.ok(dictionary.empty());
    assert.equal(properties.get(PropertyId.Width).value, 80);
  },

  'import-merge-specificity-and-atomic-overflow': function({ rmlui }) {
    const { PropertyDictionary, Property, PropertyId, ShorthandId, Unit } =
      rmlui;
    const target = new PropertyDictionary();
    const source = new PropertyDictionary();
    const put = (dictionary, text, specificity) => {
      dictionary.setProperty(PropertyId.Width,
        new Property(Number(text), Unit.PX, specificity));
      dictionary.setCustomProperty('--x',
        new Property(text, Unit.STRING, specificity));
      dictionary.setVarShorthand(ShorthandId.Margin,
        new Property(text, Unit.VAR_EXPRESSION, specificity));
    };
    const expect = (text, specificity) => {
      assert.equal(target.getProperty(PropertyId.Width).value, Number(text));
      assert.equal(target.getCustomProperty('--x').value, text);
      assert.equal(target.getVarShorthand(ShorthandId.Margin).value, text);
      assert.equal(target.getProperty(PropertyId.Width).specificity,
        specificity);
      assert.equal(target.getCustomProperty('--x').specificity, specificity);
      assert.equal(target.getVarShorthand(ShorthandId.Margin).specificity,
        specificity);
    };
    put(target, '20', 10);
    put(source, '30', 5);
    target.import(source);
    expect('20', 10);
    target.import(source, 0);
    expect('20', 10); // Upstream only forces specificity when it is > 0.
    target.import(source, 10);
    expect('30', 10);
    put(source, '40', 5);
    target.merge(source, 4);
    expect('30', 10);
    target.merge(source, 5);
    expect('40', 10);
    target.merge(target, 2);
    expect('40', 12);
    assert.throws(() => target.merge(source, 2147483647), /specificity/i);
    expect('40', 12);
    put(source, '50', -2147483648);
    assert.throws(() => target.merge(source, -1), /specificity/i);
    expect('40', 12);
    target.clear();
    target.merge(source);
    expect('50', -2147483648);
    target.clear();
    assert.ok(target.empty());
  },

  'source-metadata-and-late-restart': function({ rmlui, window }) {
    const { PropertyDictionary, Property, PropertyId, ShorthandId, Unit } =
      rmlui;
    const dictionary = new PropertyDictionary();
    dictionary.setProperty(PropertyId.Width, new Property(1, Unit.PX));
    dictionary.setCustomProperty('--x', new Property('1px', Unit.STRING));
    dictionary.setVarShorthand(ShorthandId.Margin,
      new Property('var(--x)', Unit.VAR_EXPRESSION));
    const source = { path: 'theme.rcss', lineNumber: 8, ruleName: '.item' };
    dictionary.setSourceOfAllProperties(source);
    source.path = 'changed';
    for (const values of [
      dictionary.getProperties(), dictionary.getCustomProperties(),
      dictionary.getVarShorthands(),
    ]) {
      assert.deepEqual([ ...values.values() ][0].source,
        { path: 'theme.rcss', lineNumber: 8, ruleName: '.item' });
    }
    dictionary.setSourceOfAllProperties(null);
    assert.equal(dictionary.getCustomProperty('--x').source, null);
    assert.throws(() => dictionary.setSourceOfAllProperties({
      path: 'theme.rcss', lineNumber: 8,
      get ruleName() {
        rmlui.shutdown();
        assert.ok(rmlui.initialise(window, { highDpi: false }));
        return '.item';
      },
    }), /no longer valid/i);
    assert.throws(() => dictionary.empty(), /no longer valid/i);
    assert.ok(new PropertyDictionary().empty());
  },

  'validation-and-shutdown-resource-values': function({ rmlui, window }) {
    const { PropertyDictionary, Property, PropertyId, ShorthandId, Unit } =
      rmlui;
    const dictionary = new PropertyDictionary();
    for (const id of [ -1, 0, 128, 1.5, NaN ]) {
      assert.throws(() => dictionary.setProperty(id, new Property()));
      assert.throws(() => dictionary.removeProperty(id));
    }
    for (const id of [ -1, 0, 255, 1.5, NaN ]) {
      assert.throws(() => dictionary.setVarShorthand(id,
        new Property('var(--x)', Unit.VAR_EXPRESSION)));
    }
    assert.throws(() => dictionary.setVarShorthand(ShorthandId.Margin,
      new Property('var(--x)', Unit.STRING)), /VAR_EXPRESSION/);
    assert.throws(() => dictionary.setProperty(PropertyId.Width, {}),
      /Property/);
    assert.throws(() => dictionary.import({}), /PropertyDictionary/);
    assert.throws(() => dictionary.getProperties.call({}),
      /PropertyDictionary/);
    dictionary.setProperty(PropertyId.FontEffect,
      new Property(new rmlui.FontEffectList('outline(1px red)'),
        Unit.FONTEFFECT));
    const retained = dictionary.getProperty(PropertyId.FontEffect);
    dictionary.clear();
    assert.equal(retained.value.list.length, 1);
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => retained.value, /no longer valid/i);
    assert.throws(() => dictionary.clear(), /no longer valid/i);
  },

  'callback-retention-and-cycle-collection': async function({ rmlui }) {
    const { PropertyDictionary, Property, PropertyId, Unit } = rmlui;
    let callback;
    let dictionaryRef;
    let dictionary = new PropertyDictionary();
    (() => {
      const fn = t => t * t;
      callback = new WeakRef(fn);
      const tween = new rmlui.Tween(fn);
      const value = new Property({
        type: 'animationlist',
        animations: [ rmlui.makeAnimation({ name: 'test', tween }) ],
      }, Unit.ANIMATION);
      dictionary.setProperty(PropertyId.Animation, value);
    })();
    for (let i = 0; i < 8; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.ok(callback.deref());
    assert.equal(dictionary.getProperty(PropertyId.Animation)
      .value.animations[0].tween.evaluate(0.5), 0.25);
    dictionary.clear();
    await new Promise(resolve => setImmediate(resolve));
    for (let i = 0; i < 16; ++i) {
      global.gc();
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(callback.deref(), undefined);
    (() => {
      const captured = dictionary;
      const tween = new rmlui.Tween(t => {
        assert.ok(captured);
        return t;
      });
      dictionary.setCustomProperty('--cycle', new Property({
        type: 'animationlist',
        animations: [ rmlui.makeAnimation({ name: 'cycle', tween }) ],
      }, Unit.ANIMATION));
      dictionaryRef = new WeakRef(dictionary);
    })();
    dictionary = null;
    for (let i = 0; i < 16; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(dictionaryRef.deref(), undefined);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Property dictionary');
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
  assert.equal(failures, 0, `${failures} property dictionary failures`);
}
