'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

async function collect() {
  for (let i = 0; i < 8; i++) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'keyframe-output-storage-releases-callback-edges-at-shutdown':
    async ({ rmlui, style }) => {
      let weak;
      const parser = new rmlui.PropertyParser(property => {
        const callback = t => t * t;
        weak = new WeakRef(callback);
        property.value = {
          type: 'transitionlist', none: false, all: false,
          transitions: [ rmlui.makeTransition({
            id: rmlui.PropertyId.Opacity, duration: 1,
            tween: new rmlui.Tween(callback),
          }) ],
        };
        property.unit = rmlui.Unit.TRANSITION;
        return true;
      });
      const specification = rmlui.StyleSheetSpecification;
      assert.equal(specification.registerParser('style-storage', parser), true);
      const definition = specification.registerProperty(
        'style-storage', 'default', false, false).addParser('style-storage');
      const block = new rmlui.PropertyDictionary();
      block.setCustomProperty('--a',
        new rmlui.Property('resolved', rmlui.Unit.STRING));
      const resolver = new rmlui.KeyFramePropertyResolver();
      let result = style.resolveKeyFrameProperty(
        definition.id,
        new rmlui.Property('var(--a)', rmlui.Unit.VAR_EXPRESSION),
        block, resolver);
      assert.equal(result.value.transitions[0].tween.evaluate(0.5), 0.25);
      result = null;
      await collect();
      assert.equal(typeof weak.deref(), 'function');
      rmlui.shutdown();
      await collect();
      assert.equal(weak.deref(), undefined);
      assert.throws(() => resolver.variableDependencies, /initial/i);
    },

  'owned-computation-rejects-released-font-handles': ({
    rmlui, style, target, context, parent,
  }) => {
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf'),
    'style-face', rmlui.FontStyle.Normal));
    target.setProperty('font-family', 'style-face');
    context.update();
    const owned = new rmlui.ComputedValues(target);
    owned.copyInherited(target.getComputedValues());
    const parentOwned = new rmlui.ComputedValues(parent);
    parentOwned.fontFaceHandle = target.getFontFaceHandle();
    rmlui.releaseFontResources();
    style.dirtyProperty(rmlui.PropertyId.Width);
    assert.throws(() => style.computeValues(
      owned, null, null, false, 1, { x: 320, y: 240 }), /expired.*font/i);
    assert.equal(style.anyPropertiesDirty(), true);
    owned.fontFaceHandle = null;
    assert.throws(() => style.computeValues(
      owned, parentOwned, null, false, 1, { x: 320, y: 240 }),
    /expired.*font/i);
    parentOwned.fontFaceHandle = null;
    style.computeValues(owned, parentOwned, null, false, 1,
      { x: 320, y: 240 });
    assert.equal(style.anyPropertiesDirty(), false);
  },

  'event-handler-style-mutations-follow-native-state': ({
    rmlui: { Property, PropertyId: Id, Unit }, target, style,
  }) => {
    target.addEventListener('style-edit', () => {
      style.setClass('wide', true);
      style.updateDefinition();
      assert.equal(style.getProperty(Id.Width).value, 44);
      style.setProperty(Id.Width, new Property(17, Unit.PX));
      style.dirtyProperty(Id.Opacity);
    });
    assert.equal(target.dispatchEvent('style-edit'), true);
    assert.equal(style.getProperty(Id.Width).value, 17);
  },

  'resolver-failure-cycle-null-and-runtime-generations': ({
    rmlui, style, window, document, context,
  }) => {
    const { Property, PropertyId: Id, Unit, PropertyDictionary,
      KeyFramePropertyResolver } = rmlui;
    const resolver = new KeyFramePropertyResolver();
    const block = new PropertyDictionary();
    const variable = new Property('var(--missing)', Unit.VAR_EXPRESSION);
    assert.equal(style.resolveKeyFrameProperty(
      Id.Width, variable, block, resolver), null);
    block.setCustomProperty('--missing',
      new Property('var(--missing)', Unit.VAR_EXPRESSION));
    assert.equal(style.resolveKeyFrameProperty(
      Id.Width, variable, block, resolver), null);
    block.setCustomProperty('--missing', new Property('bad', Unit.STRING));
    assert.equal(style.resolveKeyFrameProperty(
      Id.Width, variable, block, resolver), null);
    document.close();
    context.update();
    assert.throws(() => style.iterate(), /valid/i);
    resolver.reset();
    rmlui.shutdown();
    assert.throws(() => resolver.variableDependencies, /initial/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => resolver.reset(), /valid/i);
    assert.throws(() => style.getClassNames(), /valid/i);
  },

  'style-dictionary-iterator-and-keyframe-callback-copies-survive-gc':
    async ({ rmlui, target, style, document, context }) => {
      let callback = t => t * t;
      const weak = new WeakRef(callback);
      const value = new rmlui.Property({
        type: 'transitionlist', none: false, all: false,
        transitions: [ rmlui.makeTransition({
          id: rmlui.PropertyId.Opacity, duration: 1,
          tween: new rmlui.Tween(callback),
        }) ],
      }, rmlui.Unit.TRANSITION);
      style.setProperty(rmlui.PropertyId.Transition, value);
      let dictionary = style.getLocalStyleProperties();
      let entries = style.iterate();
      let resolved = style.resolveKeyFrameProperty(
        rmlui.PropertyId.Transition, value, dictionary,
        new rmlui.KeyFramePropertyResolver());
      callback = null;
      document.close();
      context.update();
      await collect();
      assert.equal(dictionary.getProperty(rmlui.PropertyId.Transition)
        .value.transitions[0].tween.evaluate(0.5), 0.25);
      assert.equal(entries.find(([ id ]) => id === rmlui.PropertyId.Transition)
        [1].value.transitions[0].tween.evaluate(0.5), 0.25);
      assert.equal(resolved.value.transitions[0].tween.evaluate(0.5), 0.25);
      dictionary = null;
      entries = null;
      resolved = null;
      value.value = null;
      await collect();
      assert.equal(weak.deref(), undefined);
      assert.throws(() => target.getStyle(), /valid/i);
    },

  'raw-class-and-pseudo-state-with-explicit-definition-update': ({
    rmlui, target, style,
  }) => {
    assert.ok(style instanceof rmlui.ElementStyle);
    assert.equal(target.getStyle(), style);
    assert.equal(style.setClass('wide', true), true);
    assert.equal(style.setClass('wide', true), false);
    assert.equal(style.isClassSet('wide'), true);
    assert.equal(style.getLocalProperty(rmlui.PropertyId.Width).value, 20);
    style.updateDefinition();
    assert.equal(style.getLocalProperty(rmlui.PropertyId.Width).value, 44);
    style.setClassNames('first second');
    assert.equal(style.getClassNames(), 'first second');
    const classes = style.getClassNameList();
    style.setClass('third', true);
    assert.deepEqual(classes, [ 'first', 'second' ]);
    assert.equal(style.setPseudoClass('hover', true), true);
    assert.equal(style.setPseudoClass('hover', true, true), false);
    assert.equal(style.getActivePseudoClasses().get('hover'), 3);
    assert.equal(style.setPseudoClass('hover', false), false);
    assert.equal(style.getActivePseudoClasses().get('hover'), 2);
    assert.equal(style.isPseudoClassSet('hover'), true);
    assert.equal(style.setPseudoClass('hover', false, true), true);
    assert.equal(style.isPseudoClassSet('hover'), false);
  },

  'cascade-variable-lookups-and-independent-dictionary-snapshots': ({
    rmlui: { Property, PropertyId: Id, Unit }, target, style, parent,
  }) => {
    parent.getStyle().setCustomProperty('--size',
      new Property('31px', Unit.STRING));
    style.setProperty(Id.Width,
      new Property('var(--size)', Unit.VAR_EXPRESSION));
    assert.equal(style.getProperty(Id.Width).value, 31);
    assert.equal(style.getLocalProperty(Id.Width).unit, Unit.VAR_EXPRESSION);
    assert.equal(
      style.getLocalPropertyWithResolvedVariables(Id.Width).value, 31);
    assert.equal(
      style.getSpecifiedProperty(Id.Width).unit, Unit.VAR_EXPRESSION);
    assert.equal(style.getLocalCustomProperty('--size'), null);
    assert.equal(style.getCustomProperty('--size').value, '31px');
    assert.equal(style.getSpecifiedCustomProperty('--size').value, '31px');
    style.setCustomProperty('--alias',
      new Property('var(--size)', Unit.VAR_EXPRESSION));
    assert.equal(style.getCustomProperty('--alias').value, '31px');
    assert.equal(style.getSpecifiedCustomProperty('--alias').unit,
      Unit.VAR_EXPRESSION);
    const snapshot = style.getLocalStyleProperties();
    const value = style.getProperty(Id.Width);
    style.removeProperty(Id.Width);
    style.removeCustomProperty('--alias');
    parent.getStyle().removeCustomProperty('--size');
    assert.equal(style.getProperty(Id.Width).value, 20);
    assert.equal(snapshot.getCustomProperty('--alias').unit,
      Unit.VAR_EXPRESSION);
    assert.equal(snapshot.getProperty(Id.Width).unit, Unit.VAR_EXPRESSION);
    assert.equal(value.value, 31);
    assert.equal(style.getProperty(Id.Color).toString(),
      parent.getProperty(Id.Color).toString());
    assert.equal(style.getLocalProperty(Id.Color), null);
    assert.equal(style.getLocalProperty(Id.Height), null);
    assert.equal(target.getStyle(), style);
  },

  'shorthand-iteration-filter-and-reusable-native-keyframe-cache': ({
    rmlui: { Property, PropertyId: Id, ShorthandId, Unit,
      PropertyDictionary, KeyFramePropertyResolver }, style, child,
  }) => {
    const margin = ShorthandId.Margin;
    style.setCustomProperty('--gap', new Property('3px 7px', Unit.STRING));
    style.setVarShorthand(margin,
      new Property('var(--gap)', Unit.VAR_EXPRESSION));
    style.setProperty(Id.MarginTop,
      new Property(0, Unit.SHORTHAND_PLACEHOLDER));
    assert.equal(style.getLocalShorthand(margin).unit, Unit.VAR_EXPRESSION);
    assert.equal(style.getSpecifiedShorthand(margin).unit, Unit.VAR_EXPRESSION);
    const all = style.iterateAll();
    assert.ok(all.some(([ key ]) => key === '--gap'));
    assert.ok(all.some(([ key ]) => key === 'margin'));
    assert.ok(!all.some(([ key ]) => key === 'margin-top'));
    const plain = style.iterate();
    assert.equal(new Set(plain.map(([ key ]) => key)).size, plain.length);
    assert.ok(plain.some(([ key ]) => key === Id.MarginTop));
    child.getStyle().setCustomProperty('--gap',
      new Property('9px', Unit.STRING));
    assert.ok(!style.iterateAll(child).some(([ key ]) => key === '--gap'));
    const block = new PropertyDictionary();
    block.setCustomProperty('--gap', new Property('3px 7px', Unit.STRING));
    block.setVarShorthand(margin,
      new Property('var(--gap)', Unit.VAR_EXPRESSION));
    const resolver = new KeyFramePropertyResolver();
    const placeholder = new Property(0, Unit.SHORTHAND_PLACEHOLDER);
    const resolve = id =>
      style.resolveKeyFrameProperty(id, placeholder, block, resolver);
    const top = resolve(Id.MarginTop);
    assert.equal(top.value, 3);
    assert.equal(resolver.hasSubstitutedShorthands, true);
    assert.equal(resolve(Id.MarginRight).value, 7);
    assert.deepEqual(resolver.variableDependencies, []);
    block.setCustomProperty('--gap', new Property('13px', Unit.STRING));
    style.setCustomProperty('--gap', new Property('13px', Unit.STRING));
    assert.equal(resolve(Id.MarginTop).value, 3);
    resolver.reset();
    assert.equal(resolve(Id.MarginTop).value, 13);
    const variable = new Property('var(--gap)', Unit.VAR_EXPRESSION);
    assert.equal(style.resolveKeyFrameProperty(
      Id.Width, variable, block, resolver).value, 13);
    assert.deepEqual(resolver.variableDependencies, [ '--gap' ]);
    assert.equal(style.resolveKeyFrameProperty(
      Id.Width, null, block, resolver), null);
    assert.deepEqual(resolver.variableDependencies, []);
    style.removeVarShorthand(margin);
    assert.equal(style.getLocalShorthand(margin), null);
    assert.equal(top.value, 3);
    assert.ok(all.some(([ key ]) => key === 'margin'));
  },

  'native-compute-consumes-dirty-state-and-propagates-inheritance': ({
    rmlui, style, target, parent, child, context, document,
  }) => {
    const { Property, PropertyId: Id, Unit, ComputedValues } = rmlui;
    const parentStyle = parent.getStyle();
    const parentValues = new ComputedValues(parent);
    parentValues.copyInherited(parent.getComputedValues());
    parentValues.copyNonInherited(parent.getComputedValues());
    parentStyle.setProperty(Id.FontSize, new Property(18, Unit.PX));
    assert.ok(parentStyle.computeValues(parentValues,
      document.getComputedValues(), document.getComputedValues(), false, 1,
      { x: 320, y: 240 }).has(Id.FontSize));
    assert.equal(parentValues.fontSize, 18);
    assert.equal(style.anyPropertiesDirty(), true);
    const owned = new ComputedValues(target);
    style.setProperty(Id.Width, new Property(2, Unit.EM));
    const dirty = style.computeValues(owned, parentValues,
      document.getComputedValues(), true, 2, { x: 320, y: 240 });
    assert.ok(dirty.has(Id.Width));
    assert.equal(owned.fontSize, 18);
    assert.equal(owned.width.value, 36);
    assert.equal(style.anyPropertiesDirty(), false);
    assert.equal(child.getStyle().anyPropertiesDirty(), true);
    assert.equal(style.computeValues(owned, parentValues, null, false, 1,
      { x: 320, y: 240 }).size, 0);
    // ComputeValues consumed the real dirty set into owned storage. Redirty
    // before requesting layout so Element::UpdateProperties can apply it.
    for (const id of dirty) {
      style.dirtyProperty(id);
    }
    parentStyle.dirtyProperty(Id.FontSize);
    context.update();
    assert.equal(target.getComputedValues().width.value, 36);
    style.removeProperty(Id.Width);
    style.computeValues(owned, parentValues, null, false, 1,
      { x: 320, y: 240 });
    assert.equal(owned.width.value, 20);
    assert.throws(() => style.computeValues(target.getComputedValues(),
      null, null, false, 1, { x: 320, y: 240 }), /read.only/i);
    assert.throws(() => style.computeValues(new ComputedValues(child),
      null, null, true, 1, { x: 320, y: 240 }), /associated|element/i);
    assert.throws(() => style.computeValues(owned, null, null, false, 0,
      { x: 320, y: 240 }), /positive/i);
  },

  'dirty-units-local-recursive-and-single-unit-arithmetic': ({
    rmlui: { Property, PropertyId: Id, NumericValue, Unit, RelativeTarget },
    style, child, target, context,
  }) => {
    style.setProperty(Id.Width, new Property(25, Unit.PX));
    child.getStyle().setProperty(Id.Width, new Property(2, Unit.EM));
    context.update();
    assert.equal(style.anyPropertiesDirty(), false);
    style.dirtyPropertiesWithUnits(Unit.EM);
    assert.equal(style.anyPropertiesDirty(), false);
    style.dirtyPropertiesWithUnitsRecursive(Unit.EM + Unit.PX);
    assert.equal(style.anyPropertiesDirty(), true);
    assert.equal(child.getStyle().anyPropertiesDirty(), true);
    context.update();
    style.dirtyInheritedProperties();
    assert.equal(style.anyPropertiesDirty(), true);
    context.update();
    assert.equal(style.resolveNumericValue(
      new NumericValue(25, Unit.PERCENT), 80), 20);
    assert.equal(style.resolveRelativeLength(new NumericValue(2, Unit.NUMBER),
      RelativeTarget.FontSize), target.getComputedValues().fontSize * 2);
    assert.throws(() => style.resolveNumericValue(
      new NumericValue(1, Unit.PX + Unit.EM), 1), /single/i);
    assert.throws(() => style.resolveRelativeLength(
      new NumericValue(1, Unit.NUMBER), 6), /target/i);
    assert.throws(() => style.dirtyProperty(Id.Invalid), /property/i);
  },

  'typed-storage-validation-and-native-owned-lifetimes': ({
    rmlui: { Property, PropertyId: Id, Unit, ComputedValues }, style, target,
    document, context,
  }) => {
    assert.throws(() => style.setProperty(Id.Transform,
      new Property('bad', Unit.TRANSFORM)), /typed.*storage/i);
    assert.throws(() => style.setCustomProperty('bad',
      new Property('1px', Unit.STRING)), /custom.*name/i);
    assert.throws(() => style.setVarShorthand(0,
      new Property('var(--a)', Unit.VAR_EXPRESSION)), /shorthand/i);
    const values = new ComputedValues(target);
    const viewport = { get x() {
      document.innerRML = '';
      return 320;
    }, y: 240 };
    assert.throws(() => style.computeValues(values, null, null, true, 1,
      viewport), /valid|destroyed/i);
    assert.throws(() => style.anyPropertiesDirty(), /valid|destroyed/i);
    context.update();
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Element style');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('style', 320, 240);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 320px; height: 240px; margin: 0; }
#parent { display: block; color: #123456; font-size: 12px; }
#target { width: 20px; }
#target.wide { width: 44px; }
</style></head><body><div id="parent">
<div id="target"><div id="child"/></div></div></body></rml>`);
    document.show();
    context.update();
    const target = document.getElementById('target');
    await cases[name]({
      rmlui, window, context, document, target, style: target.getStyle(),
      parent: document.getElementById('parent'),
      child: document.getElementById('child'),
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
    const result = spawnSync(process.execPath, [
      '--expose-gc', __filename, name,
    ], { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}`, result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0);
}
