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
  'every-computed-getter-reads-native-defaults': function({
    rmlui, target,
  }) {
    const view = target.getComputedValues();
    const owned = new rmlui.ComputedValues(target);
    const fields = Object.getOwnPropertyDescriptors(
      Object.getPrototypeOf(rmlui.ComputedValues.prototype));
    const getters = Object.entries(fields).filter(([ , value ]) => value.get);
    assert.equal(getters.length, 98);
    for (const [ name ] of getters) {
      assert.notEqual(view[name], undefined, `element getter ${name}`);
      assert.notEqual(owned[name], undefined, `owned getter ${name}`);
    }
    assert.equal(owned.maxWidth.value, 3.4028234663852886e38);
    assert.equal(owned.width.type,
      rmlui.Style.LengthPercentageAutoType.Auto);
    assert.equal(owned.lineHeight.value, Math.fround(12 * Math.fround(1.2)));
    assert.equal(owned.fontFaceHandle, null);
    assert.equal(target.getFontFaceHandle(), null);
    assert.equal(owned.perspectiveOriginX.value, 50);
    assert.equal(owned.perspectiveOriginX.type,
      rmlui.Style.LengthPercentageType.Percentage);
    assert.equal(owned.hasLocalTransform, false);
    assert.equal(owned.hasMaskImage, false);
    assert.equal(owned.color.alpha, 255);
    assert.equal(owned.backgroundColor.alpha, 0);
  },

  'computed-view-follows-style-updates-and-rejects-writes': function({
    rmlui, target, context,
  }) {
    const { Style } = rmlui;
    const view = target.getComputedValues();
    target.setProperty('width', '25%');
    target.setProperty('opacity', '0.75');
    context.update();
    assert.equal(view.width.type, Style.LengthPercentageAutoType.Percentage);
    assert.equal(view.width.value, 25);
    assert.equal(view.opacity, 0.75);
    assert.throws(() => {
      view.opacity = 0.5;
    }, /read.only/i);
    assert.throws(() => view.copyInherited(view), /read.only/i);
    const width = view.width;
    width.value = 80;
    assert.equal(view.width.value, 25);
  },

  'computed-owned-defaults-setters-and-copy-partitions': function({
    rmlui, target, document, context,
  }) {
    const { Style, ComputedValues } = rmlui;
    target.setProperty('font-family', 'source-family');
    target.setProperty('width', '42px');
    target.setProperty('opacity', '0.25');
    document.setProperty('font-family', 'destination-family');
    context.update();
    const value = new ComputedValues(document);
    assert.equal(value.width.type, Style.LengthPercentageAutoType.Auto);
    assert.equal(value.fontSize, 12);
    assert.equal(value.opacity, 1);
    const source = target.getComputedValues();
    value.copyNonInherited(source);
    assert.equal(value.width.value, 42);
    assert.equal(value.opacity, 1);
    value.copyInherited(source);
    assert.equal(value.opacity, 0.25);
    assert.equal(value.fontFamily, 'destination-family',
      'CopyInherited must not replace the associated element');
    value.width = new Style.LengthPercentageAuto(
      Style.LengthPercentageAutoType.Percentage, 75);
    value.borderTopWidth = -1;
    value.borderTopLeftRadius = 3.9;
    value.lineHeight = new Style.LineHeight(30,
      Style.LineHeightInheritType.Number, 1.5);
    value.language = '日本語';
    value.fontWeight = 537;
    assert.equal(value.width.value, 75);
    assert.equal(value.borderTopWidth, 65535,
      'upstream int16 setter assigns a uint16 field');
    assert.equal(value.borderTopLeftRadius, 3);
    assert.deepEqual(value.borderRadius, [ 3, 0, 0, 0 ]);
    assert.equal(value.lineHeight.inheritValue, 1.5);
    assert.equal(value.language, '日本語');
    assert.equal(value.fontWeight, 537);
    assert.equal(source.width.value, 42);
    assert.equal(source.opacity, 0.25);
  },

  'style-values-defaults-resolve-overloads-and-shared-storage': async function({
    rmlui,
  }) {
    const { Style, resolveValue, resolveValueOr } = rmlui;
    for (const [ Class, Type ] of [
      [ Style.LengthPercentage, Style.LengthPercentageType ],
      [ Style.LengthPercentageAuto, Style.LengthPercentageAutoType ],
    ]) {
      assert.equal(new Class().type, Type.Length);
      let value = new Class(Type.Percentage, 25);
      assert.equal(resolveValue(value, 200), 50);
      assert.equal(resolveValue(value, -1), 0);
      assert.equal(resolveValueOr(value, -1, 17), 17);
      assert.equal(resolveValueOr(new Class(Type.Length, -10), -1, 17), -10);
      const weak = new WeakRef(value);
      const numbers = value.valueView;
      value = null;
      for (let i = 0; i < 6; i++) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
      assert.equal(weak.deref(), undefined);
      assert.equal(numbers[0], 25);
      numbers[0] = 90;
      assert.equal(numbers[0], 90);
    }
    assert.equal(resolveValueOr(new Style.LengthPercentageAuto(
      Style.LengthPercentageAutoType.Auto), 200, 8), 8);
    const clip = new Style.Clip(Style.ClipType.Number, 0);
    assert.equal(clip.getType(), Style.ClipType.Auto);
    assert.ok(clip.equals(Style.ClipType.Auto));
    assert.equal(new Style.Clip(Style.ClipType.Number, -1).getType(),
      Style.ClipType.None);
    assert.equal(new Style.VerticalAlign(12.5).type,
      Style.VerticalAlignType.Length);
    assert.equal(new Style.VerticalAlign().type,
      Style.VerticalAlignType.Baseline);
  },

  'computed-local-properties-motion-transform-and-null-values': function({
    rmlui, target, context,
  }) {
    const value = target.getComputedValues();
    assert.equal(value.animation, null);
    assert.equal(value.transition, null);
    assert.equal(value.transform, null);
    assert.equal(value.flexGrow, 0);
    assert.equal(value.flexShrink, 1);
    target.setProperty('flex-grow', '2');
    target.setProperty('align-self', 'center');
    target.setProperty('transform', 'translateX(7px)');
    assert.ok(target.setProperty('transition', 'opacity 1s linear-in'));
    assert.ok(target.setProperty('animation', '2s linear-in animation-name'));
    target.setProperty('cursor', 'cross');
    context.update();
    assert.equal(value.flexGrow, 2);
    assert.equal(value.alignSelf, rmlui.Style.AlignSelf.Center);
    assert.equal(value.cursor, 'cross');
    assert.equal(value.transition.transitions[0].duration, 1);
    assert.equal(value.animation.animations[0].name, 'animation-name');
    assert.equal(value.transform.type, 'transform');
    const transform = value.transform;
    target.removeProperty('transform');
    context.update();
    assert.equal(value.transform, null);
    assert.equal(transform.primitives.length, 1);
  },

  'computed-value-categories-and-byte-ranges': function({
    rmlui, target, context,
  }) {
    const { Style } = rmlui;
    const owned = new rmlui.ComputedValues(target);
    owned.zIndex = new Style.NumberAuto(Style.NumberAutoType.Number, -3);
    owned.verticalAlign = new Style.VerticalAlign(12.5);
    owned.clip = new Style.Clip(Style.ClipType.Number, 4);
    owned.backgroundColor =
      { type: 'colourb', red: 10, green: 20, blue: 30, alpha: 40 };
    owned.hasFilter = true;
    owned.direction = Style.Direction.Rtl;
    assert.equal(owned.zIndex.value, -3);
    assert.equal(owned.verticalAlign.value, 12.5);
    assert.equal(owned.clip.getNumber(), 4);
    assert.equal(owned.backgroundColor.blue, 30);
    assert.equal(owned.hasFilter, true);
    assert.equal(owned.direction, Style.Direction.Rtl);
    const length = new Style.LengthPercentageAuto();
    length.typeView[0] = 255;
    assert.throws(() => {
      owned.width = length;
    }, /enum/i);
    assert.throws(() => {
      length.type = 256;
    }, /enum/i);
    assert.throws(() => new Style.Clip(Style.ClipType.Number, 128), /range/i);
    assert.ok(target.setProperty('letter-spacing', '4px'));
    context.update();
    assert.equal(owned.letterSpacing, 0);
    owned.setHasLetterSpacing(true);
    assert.equal(owned.letterSpacing, 4);
  },

  'computed-motion-copies-retain-and-release-callbacks': async function({
    rmlui, target, document, context,
  }) {
    let callback = t => t * t;
    const weak = new WeakRef(callback);
    target.setProperty(rmlui.PropertyId.Transition, new rmlui.Property({
      type: 'transitionlist', none: false, all: false,
      transitions: [ rmlui.makeTransition({
        id: rmlui.PropertyId.Opacity, duration: 1,
        tween: new rmlui.Tween(callback),
      }) ],
    }, rmlui.Unit.TRANSITION));
    let snapshot = target.getComputedValues().transition;
    callback = null;
    document.close();
    context.update();
    await collect();
    assert.equal(snapshot.transitions[0].tween.evaluate(0.5), 0.25);
    snapshot = null;
    await collect();
    assert.equal(weak.deref(), undefined);
  },

  'computed-observer-does-not-retain-detached-element': async function({
    rmlui, document,
  }) {
    let detached = document.createElement('div');
    const weak = new WeakRef(detached);
    const computed = new rmlui.ComputedValues(detached);
    const snapshot = computed.width;
    detached = null;
    await collect();
    assert.equal(weak.deref(), undefined);
    assert.throws(() => computed.cursor, /valid|destroyed/i);
    assert.equal(snapshot.type, rmlui.Style.LengthPercentageAutoType.Auto);
  },

  'computed-font-tokens-preserve-native-handles-and-reject-old-generations':
  function({ rmlui, target, context, window }) {
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf'),
    'computed-face', rmlui.FontStyle.Normal));
    target.setProperty('font-family', 'computed-face');
    context.update();
    const token = target.getFontFaceHandle();
    assert.equal(typeof token, 'object');
    assert.notEqual(token, null);
    const inherited = new rmlui.Style.InheritedValues();
    inherited.fontFaceHandle = token;
    assert.notEqual(inherited.fontFaceHandle, null);
    const owned = new rmlui.ComputedValues(target);
    owned.fontFaceHandle = token;
    assert.notEqual(owned.fontFaceHandle, null);
    owned.fontFaceHandle = null;
    assert.equal(owned.fontFaceHandle, null);
    rmlui.shutdown();
    assert.throws(() => inherited.fontFaceHandle, /initial|runtime|valid/i);
    inherited.fontFaceHandle = null;
    inherited.opacity = 0.5;
    assert.equal(inherited.fontFaceHandle, null);
    assert.equal(inherited.opacity, 0.5);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const replacement = rmlui.createContext('replacement', 320, 240)
      .loadDocumentFromMemory('<rml><body/></rml>');
    const fresh = new rmlui.ComputedValues(replacement);
    assert.throws(() => {
      fresh.fontFaceHandle = token;
    }, /valid/i);
    assert.equal(fresh.fontFaceHandle, null);
  },

  'font-resource-release-invalidates-owned-and-standalone-tokens': function({
    rmlui, target, context,
  }) {
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf'),
    'release-face', rmlui.FontStyle.Normal));
    target.setProperty('font-family', 'release-face');
    context.update();
    const owned = new rmlui.ComputedValues(target);
    const copied = new rmlui.ComputedValues(target);
    const inherited = new rmlui.Style.InheritedValues();
    for (const release of [
      rmlui.releaseFontResources, rmlui.releaseRenderManagers,
    ]) {
      const token = target.getFontFaceHandle();
      assert.notEqual(token, null);
      owned.fontFaceHandle = token;
      copied.copyInherited(owned);
      inherited.fontFaceHandle = token;
      release();
      assert.throws(() => {
        owned.fontFaceHandle = token;
      }, /valid/i);
      assert.throws(() => owned.fontFaceHandle, /valid/i);
      assert.throws(() => copied.fontFaceHandle, /valid/i);
      assert.throws(() => inherited.fontFaceHandle, /valid/i);
      inherited.fontFaceHandle = target.getFontFaceHandle();
      assert.notEqual(inherited.fontFaceHandle, null);
      assert.equal(owned.opacity, 1);
    }
  },

  'font-release-rejects-detached-trees-before-invalidating-tokens': function({
    rmlui, target, context, document,
  }) {
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf'),
    'detached-face', rmlui.FontStyle.Normal));
    target.setProperty('font-family', 'detached-face');
    context.update();
    const inherited = new rmlui.Style.InheritedValues();
    inherited.fontFaceHandle = target.getFontFaceHandle();
    const detached = document.removeChild(target);
    for (const release of [
      rmlui.releaseFontResources, rmlui.releaseRenderManagers,
    ]) {
      assert.throws(release, /detached/i);
      assert.notEqual(inherited.fontFaceHandle, null,
        'rejected release must preserve the font generation');
    }
    document.appendChild(detached);
    rmlui.releaseFontResources();
    assert.throws(() => inherited.fontFaceHandle, /valid/i);
  },

  'computed-lifetimes-reentrancy-and-invalid-native-handles': function({
    rmlui, target, document, context, window,
  }) {
    const view = target.getComputedValues();
    const owned = new rmlui.ComputedValues(target);
    const width = owned.width;
    assert.throws(() => {
      owned.opacity = NaN;
    }, /finite/i);
    assert.throws(() => {
      owned.display = 255;
    }, /range|enum/i);
    assert.throws(() => {
      owned.borderTopLeftRadius = 32768;
    }, /range/i);
    assert.throws(() => {
      owned.fontFaceHandle = 123n;
    }, /font/i);
    width.valueView[0] = Infinity;
    assert.throws(() => {
      owned.width = width;
    }, /finite/i);
    assert.throws(() => {
      owned.width = new rmlui.Style.LengthPercentage();
    }, /style|type|handle/i);
    const native = require('../../build/Release/rmlui.node');
    assert.throws(() => native.computedGetOpacity({}), /computed/i);
    const colour = {
      type: 'colourb',
      get red() {
        document.close();
        context.update();
        return 10;
      },
      green: 20, blue: 30, alpha: 255,
    };
    assert.throws(() => {
      owned.color = colour;
    }, /valid|destroyed/i);
    assert.throws(() => view.cursor, /valid|destroyed/i);
    assert.throws(() => owned.fontSize, /valid|destroyed/i);
    rmlui.shutdown();
    assert.equal(width.valueView[0], Infinity);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => view.width, /valid/i);
    assert.throws(() => owned.opacity, /valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Computed values');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('computed-values', 320, 240);
    const document = context.loadDocumentFromMemory(
      '<rml><body><div id="target"/></body></rml>');
    document.show();
    context.update();
    await cases[name]({
      rmlui, context, document, window,
      target: document.getElementById('target'),
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
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} computed value regressions failed`);
}
