'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'native-local-iterator-class-inline-custom-and-inheritance-filter':
    function({ document, context, rmlui }) {
      const target = document.getElementById('target');
      target.setClass('iterator-class', true);
      target.setProperty('height', '25px');
      target.setProperty('--spacing', '12px');
      target.setProperty('--accent', '#abcdef');
      target.setProperty('margin', 'var(--spacing)');
      const child = document.createElement('span');
      target.appendChild(child);
      context.update();
      const entries = target.iterateLocalProperties();
      const all = new Map(entries);
      assert.equal(all.get('width').value, 40);
      assert.equal(all.get('height').value, 25);
      assert.equal(all.get('opacity').value, 0.75);
      assert.equal(all.get('--spacing').value, '12px');
      assert.equal(all.has('margin'), true);
      assert.equal(all.has('color'), false, 'inherited values are not local');
      assert.equal(all.get('margin').unit, rmlui.Unit.VAR_EXPRESSION);
      const inherited = new Map(target.iterateLocalProperties(child));
      assert.equal(inherited.has('width'), false);
      assert.equal(inherited.has('--spacing'), true);
      child.setProperty('--accent', '#112233');
      context.update();
      const overridden = new Map(target.iterateLocalProperties(child));
      assert.equal(overridden.has('--accent'), false);
      assert.equal(overridden.has('--spacing'), true);
      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics(false);
      let counts;
      try {
        target.iterateLocalProperties(child);
      } finally {
        counts = native.endDataDiagnostics();
      }
      assert.equal(counts.runtimeEntries, 1);
      assert.equal(counts.nativeCallbacks, 0);
      all.get('width').value = 999;
      assert.equal(target.getProperty('width').value, 40);
      assert.throws(() => target.iterateLocalProperties({}), TypeError);
      target.setClass('iterator-class', false);
      context.update();
      assert.equal(new Map(target.iterateLocalProperties()).has('opacity'),
        false);
      assert.equal(all.get('opacity').value, 0.75);
      document.close();
      context.update();
      assert.equal(all.get('height').value, 25);
      assert.throws(() => target.iterateLocalProperties(), /valid/i);
    },

  'owned-property-fields-and-comparisons': function({ rmlui }) {
    const { Property, Unit } = rmlui;
    const empty = new Property();
    assert.equal(empty.value, null);
    assert.equal(empty.unit, Unit.UNKNOWN);
    assert.equal(empty.specificity, -1);
    assert.equal(empty.parserIndex, -1);
    assert.equal(empty.definition, null);
    assert.equal(empty.source, null);
    const value = new Property(12.5, Unit.PX, 10);
    assert.equal(value.toString(), '12.5px');
    assert.equal(value.getNumericValue().number, 12.5);
    assert.equal(value.getNumericValue().unit, Unit.PX);
    assert.equal(value.get(''), '12.5');
    assert.equal(new Property('invalid', Unit.STRING).get(123), 0);
    assert.equal(new Property(3).unit, Unit.KEYWORD);
    assert.equal(new Property(3).value, 3);
    const copy = value.clone();
    copy.specificity = 100;
    copy.parserIndex = 3;
    copy.source = { path: 'main.rcss', lineNumber: 7, ruleName: '#target' };
    assert.ok(value.equals(copy), 'metadata is excluded from equality');
    copy.value = 20;
    assert.ok(value.notEquals(copy));
    assert.equal(value.value, 12.5);
    const source = copy.source;
    source.path = 'mutated';
    assert.equal(copy.source.path, 'main.rcss');
    copy.source = null;
    assert.equal(copy.source, null);
    assert.equal(value.unitView[0], Unit.PX);
    value.unitView[0] = Unit.DP;
    value.specificityView[0] = 11;
    value.parserIndexView[0] = 2;
    assert.equal(value.toString(), '12.5dp');
    assert.equal(value.specificity, 11);
    assert.equal(value.parserIndex, 2);
  },

  'element-snapshots-inheritance-custom-and-overloads': function({
    rmlui, document, context,
  }) {
    const { Property, PropertyId, Unit } = rmlui;
    const target = document.getElementById('target');
    const width = target.getProperty('width');
    assert.equal(width.toString(), '40px');
    assert.equal(target.getProperty(PropertyId.Width).toString(), '40px');
    assert.equal(target.getProperty('color').toString(), '#ff0000');
    assert.equal(target.getProperty('width', 0), 40);
    assert.equal(target.getProperty('missing', 9), 0);
    assert.equal(target.getProperty('missing'), null);
    assert.equal(target.getLocalProperty('width').value, 40);
    assert.equal(target.getLocalProperty('color'), null);
    assert.equal(target.getLocalStyleProperties().has(PropertyId.Width), false);
    assert.ok(target.setProperty(PropertyId.Width,
      new Property(23, Unit.PX)));
    assert.equal(target.getLocalProperty(PropertyId.Width).value, 23);
    const local = target.getLocalStyleProperties();
    assert.ok(local instanceof Map);
    assert.equal(local.get(PropertyId.Width).value, 23);
    target.setProperty('width', '30px');
    context.update();
    assert.equal(width.toString(), '40px');
    assert.equal(local.get(PropertyId.Width).value, 23);
    target.removeProperty(PropertyId.Width);
    assert.equal(target.getLocalProperty('width').value, 40);
    assert.equal(target.getLocalStyleProperties().has(PropertyId.Width), false);
    assert.equal(target.getProperty('width').value, 40);
    target.setProperty('--spacing', '12px');
    assert.equal(target.getProperty('--spacing').toString(), '12px');
    target.removeProperty('--spacing');
    assert.equal(target.getProperty('--spacing'), null);
    assert.equal(target.setProperty(PropertyId.Invalid, width), false);
  },

  'definition-parsing-native-booleans-and-ownership': function({
    rmlui, document,
  }) {
    const { Property, PropertyDefinition, PropertyId, RelativeTarget, Unit } =
      rmlui;
    const width = document.getElementById('target').getProperty('width');
    const definition = width.definition;
    assert.equal(definition.id, PropertyId.Width);
    assert.equal(definition.isInherited, false);
    assert.equal(definition.isLayoutForced, true);
    assert.equal(definition.relativeTarget,
      RelativeTarget.ContainingBlockWidth);
    assert.equal(definition.defaultValue.toString(), 'auto');
    const parsed = new Property();
    assert.ok(definition.parseValue(parsed, '25%'));
    assert.equal(parsed.toString(), '25%');
    assert.deepEqual(definition.getValue(parsed),
      { success: true, value: '25%' });
    assert.ok(definition.parseValue(parsed, 'auto'));
    assert.deepEqual(definition.getValue(parsed),
      { success: false, value: 'auto' }, 'upstream keyword result is false');
    assert.equal(definition.parseValue(parsed, 'definitely-invalid'), false);
    assert.equal(parsed.unit, Unit.UNKNOWN);
    assert.throws(() => definition.addParser('number'), /read.only/i);
    assert.throws(() => definition.setRelativeTarget(RelativeTarget.None),
      /read.only/i);
    let owned = new PropertyDefinition(PropertyId.Width, '1', false, false);
    assert.equal(owned.addParser('number'), owned);
    assert.equal(owned.setRelativeTarget(RelativeTarget.FontSize), owned);
    assert.equal(owned.relativeTarget, RelativeTarget.FontSize);
    assert.equal(owned.defaultValue.value, 1);
    assert.ok(owned.parseValue(parsed, '2'));
    owned = null;
    global.gc();
    assert.equal(parsed.toString(), '2');
    parsed.definition = definition;
    assert.equal(parsed.definition.id, PropertyId.Width);
    parsed.definition = null;
    assert.equal(parsed.definition, null);
  },

  'native-complex-properties-preserve-typed-roundtrip': function({
    rmlui, document,
  }) {
    const { PropertyId } = rmlui;
    const target = document.getElementById('target');
    for (const [ name, id, value ] of [
      [ 'transform', PropertyId.Transform, 'translateX(10px)' ],
      [ 'box-shadow', PropertyId.BoxShadow, '1px 2px 3px #ff0000' ],
      [ 'transition', PropertyId.Transition, 'opacity 1s linear-in' ],
    ]) {
      assert.ok(target.setProperty(name, value));
      const copy = target.getLocalProperty(name).clone();
      target.removeProperty(name);
      assert.ok(target.setProperty(id, copy));
      assert.ok(target.getLocalProperty(id).equals(copy));
    }
  },

  'shutdown-clears-resources-and-retains-only-mapped-storage': function({
    rmlui, document, context, window,
  }) {
    const { Unit } = rmlui;
    const value = document.getElementById('target').getProperty('width');
    const definition = value.definition;
    const units = value.unitView;
    document.close();
    context.update();
    assert.throws(() => document.title, /no longer valid/i);
    assert.equal(value.toString(), '40px');
    rmlui.shutdown();
    assert.equal(units[0], Unit.UNKNOWN);
    assert.throws(() => value.toString(), /initialised|valid/i);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => value.clone(), /no longer valid/i);
    assert.throws(() => definition.defaultValue, /no longer valid/i);
    units[0] = Unit.PX;
    assert.equal(new rmlui.Property().unit, Unit.UNKNOWN);
  },

  'accessors-cannot-invalidate-receivers-or-escape-errors': function({
    rmlui, context, document,
  }) {
    const { Property, Unit } = rmlui;
    const value = new Property(2, Unit.PX);
    value.value = document;
    assert.equal(value.getElementValue(), document);
    value.value = 2;
    assert.throws(() => new Property(Infinity, Unit.PX), /finite/i);
    assert.throws(() => new Property(1.5), /keyword/i);
    assert.throws(() => {
      value.source = {
        get path() {
          rmlui.shutdown();
          return 'after-shutdown';
        },
        lineNumber: 1,
        ruleName: 'rule',
      };
    }, /initialised|valid/i);
    assert.throws(() => context.update(), /initialised|valid/i);
  },

  'invalid-handles-fields-and-property-ids': function({ rmlui, document }) {
    const { Property, PropertyId, Unit } = rmlui;
    const target = document.getElementById('target');
    const value = new Property(1, Unit.PX);
    for (const id of [ -1, PropertyId.MaxNumIds, 1.5, NaN ]) {
      assert.throws(() => target.getProperty(id), /property.*id/i);
      assert.throws(() => target.removeProperty(id), /property.*id/i);
      assert.throws(() => target.setProperty(id, value), /property.*id/i);
    }
    assert.throws(() => value.equals(Object.create(Property.prototype)),
      /Property/);
    assert.throws(() => {
      value.specificity = 1.5;
    }, /integer/i);
    assert.throws(() => new Property('999999999999999999', Unit.KEYWORD),
      /keyword/i);
    assert.throws(() => new Property(2n ** 40n, Unit.KEYWORD), /keyword/i);
    value.unitView[0] = -1;
    assert.throws(() => target.setProperty(PropertyId.Width, value), /unit/i);
    const native = require('../../dist/internal/native').native;
    assert.throws(() => native.cloneProperty({}), /handle/i);
  },

  'typed-style-storage-cannot-forge-native-lists': function({
    rmlui, context, document,
  }) {
    const { Property, PropertyId, Unit } = rmlui;
    const target = document.getElementById('target');
    for (const [ id, unit ] of [
      [ PropertyId.Animation, Unit.ANIMATION ],
      [ PropertyId.Transition, Unit.TRANSITION ],
      [ PropertyId.Transform, Unit.TRANSFORM ],
      [ PropertyId.Decorator, Unit.DECORATOR ],
      [ PropertyId.Filter, Unit.FILTER ],
      [ PropertyId.FontEffect, Unit.FONTEFFECT ],
      [ PropertyId.BoxShadow, Unit.BOXSHADOWLIST ],
    ]) {
      assert.throws(() => target.setProperty(id, new Property(1, unit)),
        /typed.*storage/i);
    }
    assert.ok(context.update());
  },

  'get-conversion-accessors-run-once-before-receiver-check': function({
    rmlui, document,
  }) {
    const value = new rmlui.Property({ x: 4, y: 5 }, rmlui.Unit.RATIO);
    let reads = 0;
    const selector = {
      get x() {
        reads++;
        return 100;
      },
      y: 200,
    };
    assert.deepEqual(value.get(selector), { x: 4, y: 5 });
    assert.equal(reads, 1);
    const target = document.getElementById('target');
    assert.throws(() => target.getProperty('width', {
      get x() {
        rmlui.shutdown();
        return 0;
      },
      y: 0,
    }), /initialised|valid/i);
  },

  'mapped-metadata-outlives-collected-wrapper': async function({ rmlui }) {
    let value = new rmlui.Property(7, rmlui.Unit.PX);
    const weak = new WeakRef(value);
    const units = value.unitView;
    value = null;
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(units[0], rmlui.Unit.PX);
    rmlui.shutdown();
    assert.equal(units[0], rmlui.Unit.UNKNOWN);
    units[0] = rmlui.Unit.DP;
    assert.equal(units[0], rmlui.Unit.DP);
  },

  'metadata-views-cannot-transfer-native-storage': function({ rmlui }) {
    const value = new rmlui.Property(7, rmlui.Unit.PX);
    const view = value.unitView;
    try {
      const copy = structuredClone(view, { transfer: [ view.buffer ] });
      // Older supported Node versions copy untransferable buffers.
      copy[0] = rmlui.Unit.DP;
    } catch (error) {
      assert.equal(error.name, 'DataCloneError');
    }
    assert.equal(view.length, 1, 'the native mapping must never detach');
    assert.equal(value.unit, rmlui.Unit.PX);
    const copy = structuredClone(view);
    copy[0] = rmlui.Unit.EM;
    assert.equal(value.unit, rmlui.Unit.PX);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Property acceptance');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('property', 320, 240);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 320px; height: 240px; color: #ff0000; }
#target { width: 40px; height: 20px; }
.iterator-class { opacity: 0.75; }
</style></head><body><div id="target"/></body></rml>`);
    document.show();
    context.update();
    await cases[name]({ rmlui, context, document, window });
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
  assert.equal(failures, 0, `${failures} property regressions failed`);
}
