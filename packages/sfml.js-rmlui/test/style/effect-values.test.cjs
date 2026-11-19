'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'font-effect-mutation-preserves-native-virtuals-and-snapshots': function({
    rmlui, target, context,
  }) {
    const base = new rmlui.FontEffect();
    assert.equal(base.hasUniqueTexture, false);
    assert.equal(base.layer, rmlui.FontEffectLayer.Back);
    assert.equal(base.fingerprint, 0n);
    assert.equal(base.colour.alpha, 255);
    const glyph = new rmlui.FontGlyph();
    glyph.bitmapDimensions = { x: 1, y: 1 };
    glyph.bitmapData = Uint8Array.of(255);
    assert.deepEqual(base.getGlyphMetrics(glyph), {
      supported: false, origin: { x: 0, y: 0 }, dimensions: { x: 1, y: 1 },
    });
    const output = new Uint8Array(4).fill(19);
    base.generateGlyphTexture(output, { x: 1, y: 1 }, 4, glyph);
    assert.deepEqual(Array.from(output), [ 19, 19, 19, 19 ]);
    const parsed = new rmlui.FontEffectList('outline(1px red)');
    const effect = parsed.list[0];
    assert.ok(effect instanceof rmlui.FontEffect);
    const value = new rmlui.FontEffectList([ effect ], 'manual');
    const saved = new rmlui.Property(value, rmlui.Unit.FONTEFFECT);
    assert.ok(target.setProperty(rmlui.PropertyId.FontEffect, saved));
    effect.colour = { type: 'colourb', red: 1, green: 2, blue: 3, alpha: 4 };
    effect.layer = rmlui.FontEffectLayer.Front;
    effect.fingerprint = 0xfedcba9876543210n;
    assert.equal(parsed.list[0].colour.red, 255);
    assert.equal(value.list[0].colour.red, 255);
    assert.equal(effect.colour.red, 1);
    assert.equal(effect.layer, rmlui.FontEffectLayer.Front);
    assert.equal(effect.fingerprint, 0xfedcba9876543210n);
    assert.equal(effect.hasUniqueTexture, true);
    assert.deepEqual(effect.getGlyphMetrics(glyph), {
      supported: true, origin: { x: -1, y: -1 }, dimensions: { x: 3, y: 3 },
    });
    assert.deepEqual(effect.getGlyphMetrics(glyph, { x: 10, y: 12 }), {
      supported: true, origin: { x: 9, y: 11 }, dimensions: { x: 3, y: 3 },
    });
    assert.throws(() => effect.getGlyphMetrics(glyph,
      { x: -2147483648, y: 0 }), /origin/i);
    const texture = new Uint8Array(3 * 16).fill(17);
    effect.generateGlyphTexture(texture, { x: 3, y: 3 }, 16, glyph);
    assert.equal(texture[16 + 4 + 3], 255);
    assert.deepEqual(Array.from(texture.subarray(12, 16)), [ 17, 17, 17, 17 ]);
    value.value = 'edited';
    value.list = [ effect, base ];
    assert.equal(saved.value.value, 'manual');
    assert.equal(saved.value.list.length, 1);
    assert.equal(target.getProperty('font-effect').value.list[0].colour.red,
      255);
    assert.equal(value.list[0].layer, rmlui.FontEffectLayer.Front);
    assert.equal(value.list[1].layer, rmlui.FontEffectLayer.Back);
    assert.ok(context.update());
    target.removeProperty('font-effect');
    const empty = new rmlui.FontEffectList([]);
    assert.equal(empty.isNull, false);
    const none = new rmlui.FontEffectList();
    none.list = [];
    assert.equal(none.isNull, false);
  },

  'glyph-weak-copy-retains-bitmap-and-independent-metrics': async function({
    rmlui,
  }) {
    let glyph = new rmlui.FontGlyph();
    glyph.bearing = { x: -2, y: 5 };
    glyph.advance = 7;
    glyph.bitmapDimensions = { x: 2, y: 1 };
    assert.equal(glyph.colorFormat, rmlui.ColorFormat.A8);
    assert.equal(glyph.bitmapData, null);
    const input = Uint8Array.of(99, 10, 20, 99);
    glyph.bitmapOwnedData = input.subarray(1, 3);
    input[1] = 88;
    assert.deepEqual(Array.from(glyph.bitmapData), [ 10, 20 ]);
    const weak = glyph.weakCopy();
    assert.equal(weak.bitmapOwnedData, null);
    assert.deepEqual(weak.bearing, { x: -2, y: 5 });
    assert.equal(weak.advance, 7);
    assert.deepEqual(weak.bitmapDimensions, { x: 2, y: 1 });
    glyph.bitmapData[0] = 42;
    assert.equal(weak.bitmapData[0], 42);
    glyph.advanceView[0] = 9;
    glyph.bearingView[0] = -4;
    assert.equal(glyph.advance, 9);
    assert.equal(glyph.bearing.x, -4);
    assert.equal(weak.advance, 7);
    const old = glyph.bitmapOwnedData;
    glyph.bitmapData = Uint8Array.of(3, 4);
    assert.deepEqual(Array.from(old), [ 42, 20 ]);
    assert.deepEqual(Array.from(weak.bitmapData), [ 42, 20 ]);
    const ref = new WeakRef(glyph);
    glyph = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(ref.deref(), undefined);
    rmlui.shutdown();
    assert.deepEqual(Array.from(weak.bitmapData), [ 42, 20 ]);
    weak.bitmapData = null;
    assert.equal(weak.bitmapData, null);
    assert.equal(old[0], 42);
  },

  'font-glyph-texture-validates-bounds-formats-and-buffer-lifetimes': function({
    rmlui,
  }) {
    const glyph = new rmlui.FontGlyph();
    const effect = new rmlui.FontEffectList('outline(1px red)').list[0];
    glyph.bitmapDimensions = { x: 1, y: 1 };
    assert.throws(() => effect.generateGlyphTexture(
      new Uint8Array(36), { x: 3, y: 3 }, 12, glyph), /bitmap/i);
    glyph.bitmapData = Uint8Array.of(255);
    for (const [ bytes, dimensions, stride ] of [
      [ new Uint8Array(35), { x: 3, y: 3 }, 12 ],
      [ new Uint8Array(36), { x: 3, y: 3 }, 11 ],
      [ new Uint8Array(36), { x: -1, y: 3 }, 12 ],
      [ new Uint8Array(36), { x: 2147483647, y: 3 }, 12 ],
    ]) {
      assert.throws(() => effect.generateGlyphTexture(
        bytes, dimensions, stride, glyph), /buffer|stride|dimensions/i);
    }
    glyph.colorFormatView[0] = 99;
    assert.throws(() => effect.getGlyphMetrics(glyph), /format/i);
    glyph.colorFormat = rmlui.ColorFormat.RGBA8;
    assert.throws(() => effect.generateGlyphTexture(
      new Uint8Array(36), { x: 3, y: 3 }, 12, glyph), /bitmap/i);
    glyph.bitmapData = Uint8Array.of(0, 0, 0, 255);
    assert.equal(new rmlui.FontEffectList('shadow(2px 3px blue)')
      .list[0].getGlyphMetrics(glyph).supported, false);
    const detached = new Uint8Array(36);
    structuredClone(detached.buffer, { transfer: [ detached.buffer ] });
    assert.throws(() => effect.generateGlyphTexture(
      detached, { x: 3, y: 3 }, 12, glyph), /detached/i);
    assert.throws(() => {
      glyph.bitmapData = new Uint8Array(new SharedArrayBuffer(4));
    }, /shared/i);
    const overlap = glyph.bitmapData;
    assert.throws(() => effect.generateGlyphTexture(
      overlap, { x: 1, y: 1 }, 4, glyph), /overlap/i);
    assert.throws(() => {
      effect.layer = 9;
    }, /layer/i);
    assert.throws(() => {
      effect.fingerprint = -1n;
    }, /fingerprint/i);
    assert.throws(() => {
      effect.fingerprint = 2n ** 64n;
    }, /fingerprint/i);
    assert.throws(() => {
      effect.colour = { red: 256 };
    }, /Variant/i);
    assert.throws(() => {
      effect.colour = {
        type: 'colourb', red: 256, green: 0, blue: 0, alpha: 255,
      };
    }, /colour/i);
  },

  'font-effect-handles-check-list-kind-and-late-runtime-restart': function({
    rmlui, window,
  }) {
    const native = require('../../build/Release/rmlui.node');
    const effect = new rmlui.FontEffect();
    const list = new rmlui.FontEffectList([ effect ]);
    assert.throws(() => {
      list.list = [{}];
    }, /font effect/i);
    const handle = native.createFontEffect();
    const values = [ handle ];
    Object.defineProperty(values, 1, { get() {
      rmlui.shutdown();
      rmlui.initialise(window, { highDpi: false });
      return native.createFontEffect();
    } });
    assert.throws(() => native.createEffectList('fonteffects', values, ''),
      /generation|valid/i);
    assert.throws(() => effect.layer, /valid/i);
    assert.throws(() => {
      list.list = [];
    }, /valid/i);
    const fresh = native.createFontEffect();
    assert.throws(() => native.writeFontEffect(fresh, 'colour', {
      type: 'colourb',
      get red() {
        rmlui.shutdown();
        rmlui.initialise(window, { highDpi: false });
        return 255;
      },
      green: 0, blue: 0, alpha: 255,
    }), /generation|valid/i);
  },

  'font-texture-rechecks-buffer-and-handle-after-vector-accessors': function({
    rmlui, window,
  }) {
    const glyph = new rmlui.FontGlyph();
    glyph.bitmapDimensions = { x: 1, y: 1 };
    glyph.bitmapData = Uint8Array.of(255);
    const effect = new rmlui.FontEffectList('outline(1px red)').list[0];
    const bytes = new Uint8Array(36);
    assert.throws(() => effect.generateGlyphTexture(bytes, {
      get x() {
        structuredClone(bytes.buffer, { transfer: [ bytes.buffer ] });
        return 3;
      },
      y: 3,
    }, 12, glyph), /detached/i);
    assert.throws(() => effect.generateGlyphTexture(new Uint8Array(36), {
      x: 3,
      get y() {
        rmlui.shutdown();
        rmlui.initialise(window, { highDpi: false });
        return 3;
      },
    }, 12, glyph), /valid/i);
  },

  'font-effect-repeated-edits-and-list-roundtrips-retain-virtual-behavior':
  function({ rmlui }) {
    const list = new rmlui.FontEffectList('shadow(2px 3px blue)');
    const glyph = new rmlui.FontGlyph();
    for (let index = 0; index < 10000; index++) {
      const effect = list.list[0];
      effect.fingerprint = BigInt(index);
      list.list = [ effect ];
    }
    assert.equal(list.list[0].fingerprint, 9999n);
    assert.deepEqual(list.list[0].getGlyphMetrics(glyph), {
      supported: true, origin: { x: 2, y: 3 }, dimensions: { x: 0, y: 0 },
    });
  },

  'font-texture-empty-areas-do-not-require-atlas-storage': function({ rmlui }) {
    const effect = new rmlui.FontEffectList('outline(1px red)').list[0];
    const glyph = new rmlui.FontGlyph();
    glyph.bitmapDimensions = { x: 1, y: 1 };
    effect.generateGlyphTexture(new Uint8Array(), { x: 0, y: 4 }, 16, glyph);
    effect.generateGlyphTexture(new Uint8Array(), { x: 4, y: 0 }, 16, glyph);
    effect.generateGlyphTexture(new Uint8Array(), { x: 0, y: 0 }, 0, glyph);
  },

  'effect-declaration-records-and-typed-instancers': function({ rmlui }) {
    const decorator = new rmlui.DecoratorDeclaration();
    assert.equal(decorator.type, '');
    assert.equal(decorator.instancer, null);
    assert.equal(decorator.paintArea, rmlui.BoxArea.Auto);
    assert.equal(decorator.isNamed, true);
    assert.deepEqual(decorator.properties, []);
    const filter = new rmlui.FilterDeclaration();
    assert.equal(filter.instancer, null);
    assert.deepEqual(filter.properties, []);
    assert.equal(rmlui.FilterInstancer.get('missing'), null);
    assert.equal(rmlui.DecoratorInstancer.get('missing'), null);
    const parsed = new rmlui.FilterList('blur(2px)').list[0];
    assert.ok(parsed instanceof rmlui.FilterDeclaration);
    assert.ok(parsed.instancer instanceof rmlui.FilterInstancer);
    assert.ok(rmlui.FilterInstancer.get('blur') instanceof
      rmlui.FilterInstancer);
    const image = new rmlui.DecoratorList('image(example.png)').list[0];
    assert.ok(image instanceof rmlui.DecoratorDeclaration);
    assert.ok(image.instancer instanceof rmlui.DecoratorInstancer);
  },

  'writable-effect-lists-retain-old-property-snapshots': function({
    rmlui, target, context,
  }) {
    for (const [ Class, text, unit, css ] of [
      [ rmlui.FilterList, 'blur(2px)', rmlui.Unit.FILTER, 'filter' ],
      [ rmlui.DecoratorList, 'image(example.png)',
        rmlui.Unit.DECORATOR, 'decorator' ],
    ]) {
      const source = new Class(text);
      const empty = new Class([]);
      assert.equal(empty.isNull, false);
      assert.deepEqual(empty.list, []);
      assert.equal(empty.value, '');
      const entries = source.list;
      const value = new Class(entries, 'manual\u0000source');
      assert.equal(value.value, 'manual\u0000source');
      assert.equal(value.list[0].type, entries[0].type);
      const old = new rmlui.Property(value, unit);
      assert.ok(target.setProperty(css === 'filter' ?
        rmlui.PropertyId.Filter : rmlui.PropertyId.Decorator, old));
      value.value = 'changed';
      assert.equal(old.value.value, 'manual\u0000source');
      assert.equal(value.value, 'changed');
      value.list = [];
      assert.equal(value.list.length, 0);
      assert.equal(value.value, 'changed');
      assert.equal(old.value.list.length, 1);
      assert.equal(target.getProperty(css).value.list.length, 1);
      value.list = entries;
      entries[0].type = 'edited-after-copy';
      entries[0].properties[0].property.value = 'edited-after-copy';
      assert.equal(value.list[0].type, source.list[0].type);
      assert.ok(context.update());
      target.removeProperty(css);
    }
    const named = new rmlui.DecoratorDeclaration();
    named.type = 'custom';
    named.paintArea = rmlui.BoxArea.Content;
    assert.equal(new rmlui.DecoratorList([ named ]).list[0].isNamed, true);
    const nullList = new rmlui.FilterList();
    nullList.value = 'metadata only';
    assert.equal(nullList.isNull, false);
    assert.deepEqual(nullList.list, []);
  },

  'programmatic-effect-validation-is-atomic': function({ rmlui }) {
    const value = new rmlui.FilterList('blur(2px)');
    const original = new rmlui.Property(value);
    const entry = value.list[0];
    for (const invalid of [
      { ...entry, instancer: rmlui.DecoratorInstancer.get('image') },
      { ...entry, instancer: null },
      { ...entry, instancer: {} },
      { ...entry, properties: [] },
      { ...entry, properties: [
        { id: 999999, property: entry.properties[0].property },
      ] },
      { ...entry, type: 3 },
    ]) {
      assert.throws(() => {
        value.list = [ invalid ];
      }, /instancer|property|properties|string/i);
      assert.ok(original.equals(new rmlui.Property(value)));
    }
    assert.throws(() => {
      value.value = 3;
    }, /string/i);
    const decorator = new rmlui.DecoratorList('image(example.png)');
    assert.throws(() => {
      decorator.list = [{ ...decorator.list[0], paintArea: 99 }];
    }, /area/i);
  },

  'effect-declaration-accessors-revalidate-all-native-references': function({
    rmlui, window,
  }) {
    const native = require('../../build/Release/rmlui.node');
    const value = native.parseEffectList('filters', 'blur(2px)');
    const [ entry ] = native.readEffectList(value.effectHandle, 'list');
    const oldInstancer = entry.instancer;
    const input = [{
      ...entry,
      properties: entry.properties.map(item => ({
        id: item.id, property: item.property.handle,
      })),
      get type() {
        rmlui.shutdown();
        rmlui.initialise(window, { highDpi: false });
        return 'blur';
      },
    }];
    assert.throws(() => native.createEffectList('filters', input, ''),
      /valid|generation/i);
    assert.throws(() => native.createEffectList('filters', [{
      type: 'blur', instancer: oldInstancer, properties: [],
    }], ''), /valid|generation/i);
  },

  'native-declarations-check-late-accessors-and-instancer-kind': function({
    rmlui, window,
  }) {
    const native = require('../../build/Release/rmlui.node');
    const decorator = native.parseEffectList(
      'decorators', 'image(example.png)');
    const [ entry ] = native.readEffectList(decorator.effectHandle, 'list');
    const properties = entry.properties.map(item => ({
      id: item.id, property: item.property.handle,
    }));
    const wrong = { ...entry, properties };
    assert.throws(() => native.createEffectList('filters', [ wrong ], ''),
      /instancer/i);
    const input = [{ ...entry, properties, get paintArea() {
      rmlui.shutdown();
      rmlui.initialise(window, { highDpi: false });
      return rmlui.BoxArea.Auto;
    } }];
    assert.throws(() => native.createEffectList('decorators', input, ''),
      /generation|valid/i);
    assert.throws(() => native.writeEffectList(
      decorator.effectHandle, 'list', []), /valid/i);
  },

  'native-declaration-conversion-retains-earlier-record-generations': function({
    rmlui, window,
  }) {
    const native = require('../../build/Release/rmlui.node');
    const source = native.parseEffectList('decorators', 'image(example.png)');
    const [ entry ] = native.readEffectList(source.effectHandle, 'list');
    const first = {
      ...entry,
      properties: entry.properties.map(item => ({
        id: item.id, property: item.property.handle,
      })),
    };
    const second = {
      type: 'named', instancer: null, properties: [],
      get paintArea() {
        rmlui.shutdown();
        rmlui.initialise(window, { highDpi: false });
        return rmlui.BoxArea.Auto;
      },
    };
    assert.throws(() => native.createEffectList(
      'decorators', [ first, second ], ''), /generation|valid/i);
  },

  'effect-lists-parse-and-preserve-native-pointer-equality': function({
    rmlui, target, context,
  }) {
    for (const [ Class, css, id, unit, text ] of [
      [ rmlui.DecoratorList, 'decorator', rmlui.PropertyId.Decorator,
        rmlui.Unit.DECORATOR, 'image(example.png) padding-box' ],
      [ rmlui.FilterList, 'filter', rmlui.PropertyId.Filter,
        rmlui.Unit.FILTER, 'blur(2px) brightness(75%)' ],
      [ rmlui.FontEffectList, 'font-effect', rmlui.PropertyId.FontEffect,
        rmlui.Unit.FONTEFFECT, 'outline(1px red)' ],
    ]) {
      assert.ok(target.setProperty(css, text));
      const property = target.getProperty(css);
      const value = property.value;
      assert.ok(value instanceof Class);
      assert.equal(value.value, text);
      assert.equal(value.isNull, false);
      assert.ok(property.equals(new rmlui.Property(value, unit)));
      assert.ok(property.equals(property.clone()));
      assert.ok(property.notEquals(new rmlui.Property(new Class(text), unit)),
        'independently parsed shared pointers have distinct identity');
      target.removeProperty(css);
      assert.ok(target.setProperty(id, new rmlui.Property(value, unit)));
      assert.ok(target.getProperty(css).equals(property));
    }
    assert.ok(context.update());
  },

  'effect-declarations-retain-order-area-and-copied-properties': function({
    rmlui,
  }) {
    const decorators = new rmlui.DecoratorList(
      'named-background content-box, image(example.png) padding-box');
    const entries = decorators.list;
    assert.equal(entries.length, 2);
    assert.equal(entries[0].type, 'named-background');
    assert.equal(entries[0].isNamed, true);
    assert.equal(entries[0].paintArea, rmlui.BoxArea.Content);
    assert.deepEqual(entries[0].properties, []);
    assert.equal(entries[1].type, 'image');
    assert.equal(entries[1].isNamed, false);
    assert.equal(entries[1].paintArea, rmlui.BoxArea.Padding);
    const src = entries[1].properties.find(entry => entry.name === 'image-src');
    assert.ok(src.property instanceof rmlui.Property);
    assert.equal(src.property.value, 'example.png');
    src.property.value = 'changed.png';
    assert.equal(decorators.list[1].properties.find(entry =>
      entry.name === 'image-src').property.value, 'example.png');
    entries.pop();
    assert.equal(decorators.list.length, 2);

    const filters = new rmlui.FilterList('blur(2px) brightness(75%)');
    assert.deepEqual(filters.list.map(entry => entry.type),
      [ 'blur', 'brightness' ]);
    const blur = filters.list[0].properties;
    assert.ok(blur.some(entry => entry.property.value === 2 &&
      entry.property.unit === rmlui.Unit.PX));
  },

  'font-effect-list-exposes-native-metadata': function({ rmlui }) {
    const effects = new rmlui.FontEffectList('outline(1px red)');
    const [ effect ] = effects.list;
    assert.equal(effect.hasUniqueTexture, true);
    assert.deepEqual(effect.colour,
      { type: 'colourb', red: 255, green: 0, blue: 0, alpha: 255 });
    assert.equal(effect.layer, rmlui.FontEffectLayer.Back);
    assert.equal(typeof effect.fingerprint, 'bigint');
    assert.notEqual(effect.fingerprint, 0n);
    effect.colour.red = 0;
    assert.equal(effects.list[0].colour.red, 255);
    const shadow = new rmlui.FontEffectList('shadow(2px 3px blue)');
    assert.equal(shadow.list[0].hasUniqueTexture, false);
    assert.equal(shadow.list[0].colour.blue, 255);
  },

  'effect-gradient-properties-retain-owned-nested-values': function({
    rmlui, document, context,
  }) {
    const value = new rmlui.DecoratorList(
      'linear-gradient(90deg, #ff000080, blue 75%)');
    const entry = value.list[0];
    const stops = entry.properties.find(item => item.name === 'color-stops');
    const snapshot = stops.property.value;
    assert.equal(snapshot.type, 'colorstoplist');
    assert.equal(snapshot.values.length, 2);
    assert.equal(snapshot.values[0].color.red, 128);
    assert.equal(snapshot.values[1].position.unit, rmlui.Unit.PERCENT);
    document.close();
    context.update();
    assert.equal(value.list[0].type, 'linear-gradient');
    rmlui.shutdown();
    assert.equal(snapshot.values[0].color.red, 128);
    assert.throws(() => stops.property.value, /initialised|valid/i);
    assert.throws(() => value.list, /initialised|valid/i);
  },

  'effect-null-pointers-and-template-fallbacks-retain-types': function({
    rmlui, target,
  }) {
    for (const Class of [
      rmlui.DecoratorList, rmlui.FilterList, rmlui.FontEffectList,
    ]) {
      const empty = new Class();
      assert.equal(empty.isNull, true);
      assert.equal(empty.value, '');
      assert.deepEqual(empty.list, []);
      const property = new rmlui.Property(empty);
      assert.ok(property.value instanceof Class);
      assert.ok(property.equals(new rmlui.Property(new Class())));
      assert.ok(new rmlui.Property('wrong type').get(empty) instanceof Class);
      assert.equal(new rmlui.Property('wrong type').get(empty).isNull, true);
      assert.ok(target.getProperty('absent', empty) instanceof Class);
    }
    assert.ok(target.setProperty('font-effect', 'none'));
    assert.equal(target.getProperty('font-effect').value, null,
      'upstream none font-effect parses to Variant NONE');
  },

  'effect-values-roundtrip-through-attributes-events-and-defaults': function({
    rmlui, target,
  }) {
    const value = new rmlui.FilterList('blur(3px)');
    const property = new rmlui.Property(value);
    target.setAttribute('effect', value);
    assert.ok(property.equals(new rmlui.Property(
      target.getAttributeValue('effect'))));
    assert.ok(target.getAttributes().effect instanceof rmlui.FilterList);
    assert.equal(target.getAttribute('effect'), 'blur(3px)');
    assert.equal(target.getAttribute('absent', value).value, 'blur(3px)');
    let retained;
    target.addEventListener('effect', event => {
      retained = event;
      assert.ok(event.parameters.effect instanceof rmlui.FilterList);
      assert.equal(event.getParameter('absent', value).value, 'blur(3px)');
    });
    target.dispatchEvent('effect', { effect: value });
    assert.ok(property.equals(new rmlui.Property(
      retained.parameters.effect)));
  },

  'effect-lists-reject-invalid-input-without-mutating-properties': function({
    rmlui,
  }) {
    for (const Class of [
      rmlui.DecoratorList, rmlui.FilterList, rmlui.FontEffectList,
    ]) {
      assert.throws(() => new Class(123), /string/i);
      assert.throws(() => new Class('missing-effect-type(1)'), /parse/i);
      assert.throws(() => new rmlui.Property(
        Object.create(Class.prototype)), /effect/i);
    }
    const property = new rmlui.Property(new rmlui.FilterList('blur(1px)'));
    assert.throws(() => {
      property.value = { type: 'filters', effectHandle: {} };
    }, /effect/i);
    assert.equal(property.value.value, 'blur(1px)');
  },

  'effect-resource-owners-survive-dom-close-and-wrapper-gc': async function({
    rmlui, target, document, context, window,
  }) {
    let value = new rmlui.FilterList('blur(2px)');
    const weak = new WeakRef(value);
    target.setAttribute('effect', value);
    const property = new rmlui.Property(value);
    value = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(target.getAttributeValue('effect').value, 'blur(2px)');
    document.close();
    context.update();
    const retained = property.value;
    assert.equal(retained.value, 'blur(2px)');
    rmlui.shutdown();
    assert.throws(() => retained.value, /initialised|valid/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => retained.list, /valid/i);
  },

  'native-effect-handles-recheck-tag-and-accessor-generation': function({
    rmlui,
  }) {
    const native = require('../../build/Release/rmlui.node');
    const value = native.parseEffectList('filters', 'blur(1px)');
    assert.throws(() => native.createProperty({
      type: 'decorators', effectHandle: value.effectHandle,
    }), /type/i);
    let calls = 0;
    const input = {
      type: 'filters',
      get effectHandle() {
        calls++;
        rmlui.shutdown();
        return value.effectHandle;
      },
    };
    assert.throws(() => native.createProperty(input), /initialised|valid/i);
    assert.equal(calls, 1);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Effect values');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('effect-values', 320, 240);
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
  assert.equal(failures, 0, `${failures} effect value regressions failed`);
}
