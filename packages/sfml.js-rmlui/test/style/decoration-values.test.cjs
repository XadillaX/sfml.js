'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const color = {
  type: 'colourb-premultiplied', red: 128, green: 64, blue: 0, alpha: 128,
};

function stops(rmlui) {
  return {
    type: 'colorstoplist',
    values: [
      {
        color: { ...color }, position: { number: 0, unit: rmlui.Unit.UNKNOWN },
      },
      {
        color: { ...color }, position: { number: 75, unit: rmlui.Unit.PERCENT },
      },
    ],
  };
}

function shadows(rmlui) {
  const length = number => ({ number, unit: rmlui.Unit.PX });
  return {
    type: 'boxshadowlist',
    values: [{
      color: { ...color },
      offsetX: length(-3), offsetY: length(4),
      blurRadius: length(5), spreadDistance: length(-2), inset: true,
    }],
  };
}

const cases = {
  'decoration-lists-own-copies-and-preserve-native-equality': function({
    rmlui,
  }) {
    for (const [ input, unit ] of [
      [ stops(rmlui), rmlui.Unit.COLORSTOPLIST ],
      [ shadows(rmlui), rmlui.Unit.BOXSHADOWLIST ],
    ]) {
      const expected = structuredClone(input);
      const property = new rmlui.Property(input, unit);
      input.values[0].color.red = 1;
      assert.deepEqual(property.value, expected);
      const read = property.value;
      read.values.splice(0);
      assert.deepEqual(property.value, expected);
      assert.ok(property.equals(new rmlui.Property(expected, unit)));
      const copy = property.clone();
      copy.value = { type: expected.type, values: [] };
      assert.ok(property.notEquals(copy));
      assert.deepEqual(property.get(expected), expected);
      assert.deepEqual(new rmlui.Property('invalid').get(expected),
        { type: expected.type, values: [] }, 'Get<T> uses T{}, not exemplar');
      for (const field of Object.keys(expected.values[0])) {
        const changed = structuredClone(expected);
        const entry = changed.values[0];
        if (field === 'color') {
          entry.color.red--;
        } else if (field === 'inset') {
          entry.inset = !entry.inset;
        } else {
          entry[field].number++;
        }
        const different = new rmlui.Property(changed, unit);
        assert.equal(property.equals(different), false, field);
        assert.equal(property.notEquals(different), true, field);
      }
      assert.ok(property.equals(new rmlui.Property(expected, unit)));
      assert.equal(property.notEquals(new rmlui.Property(expected, unit)),
        false);
    }
  },

  'parsed-shadows-preserve-premultiplication-units-and-order': function({
    rmlui, target, context,
  }) {
    assert.ok(target.setProperty('box-shadow',
      'inset -3px 4px 5px -2px #ff800080, 1em 2dp #00ff00'));
    const property = target.getProperty('box-shadow');
    const value = property.value;
    assert.equal(value.type, 'boxshadowlist');
    assert.equal(value.values.length, 2);
    assert.deepEqual(value.values[0], shadows(rmlui).values[0]);
    assert.equal(value.values[1].offsetX.unit, rmlui.Unit.EM);
    assert.equal(value.values[1].offsetY.unit, rmlui.Unit.DP);
    assert.equal(value.values[1].inset, false);
    target.removeProperty('box-shadow');
    assert.ok(target.setProperty(rmlui.PropertyId.BoxShadow,
      new rmlui.Property(value, rmlui.Unit.BOXSHADOWLIST)));
    assert.ok(target.getProperty('box-shadow').equals(property));
    assert.ok(context.update());
    assert.ok(context.render());
  },

  'color-stop-parser-preserves-omitted-and-double-positions': function({
    rmlui,
  }) {
    const definition = new rmlui.PropertyDefinition(
      rmlui.PropertyId.Invalid, '', false, false);
    definition.addParser('color_stop_list', 'length');
    const property = new rmlui.Property();
    assert.ok(definition.parseValue(property, '#ff800080, blue 20% 80%'));
    const { values } = property.value;
    assert.equal(values.length, 3);
    assert.deepEqual(values[0], stops(rmlui).values[0]);
    assert.deepEqual(values[1].position,
      { number: 20, unit: rmlui.Unit.PERCENT });
    assert.deepEqual(values[2].position,
      { number: 80, unit: rmlui.Unit.PERCENT });
    assert.ok(property.equals(
      new rmlui.Property(property.value, rmlui.Unit.COLORSTOPLIST)));
  },

  'decoration-attributes-and-event-defaults-use-native-lists': function({
    rmlui, target,
  }) {
    const value = stops(rmlui);
    target.setAttribute('stops', value);
    value.values[0].color.red = 1;
    assert.deepEqual(target.getAttributeValue('stops'), stops(rmlui));
    assert.deepEqual(target.getAttribute('stops', value), stops(rmlui));
    assert.equal(typeof target.getAttribute('stops'), 'string');
    assert.deepEqual(target.getAttribute('absent', value), value);
    assert.deepEqual(target.getProperty('absent', value),
      { type: 'colorstoplist', values: [] });
    let saved;
    target.addEventListener('custom', event => {
      saved = event.parameters.shadow;
      assert.deepEqual(event.getParameter('shadow', shadows(rmlui)),
        shadows(rmlui));
      assert.deepEqual(event.getParameter('absent', value), value);
    });
    target.dispatchEvent('custom', { shadow: shadows(rmlui) });
    assert.deepEqual(saved, shadows(rmlui));
    assert.deepEqual(target.getAttributes().stops, stops(rmlui));
  },

  'decoration-input-validation-and-nested-errors': function({ rmlui }) {
    const { Property, Unit } = rmlui;
    for (const invalid of [ null, {}, [ null ], new Array(2) ]) {
      assert.throws(() => new Property(
        { type: 'colorstoplist', values: invalid }, Unit.COLORSTOPLIST),
      /array|object|color|position/i);
    }
    for (const invalid of [ NaN, Infinity, 1e40 ]) {
      const value = stops(rmlui);
      value.values[0].position.number = invalid;
      assert.throws(() => new Property(value, Unit.COLORSTOPLIST), /finite/i);
    }
    const property = new Property(stops(rmlui), Unit.COLORSTOPLIST);
    const invalidUnit = stops(rmlui);
    invalidUnit.values[0].position.unit = -1;
    assert.throws(() => {
      property.value = invalidUnit;
    }, /unit/i);
    assert.deepEqual(property.value, stops(rmlui));
    const numeric = stops(rmlui);
    numeric.values[0].position = new rmlui.NumericValue(0.1, Unit.PERCENT);
    assert.deepEqual(new Property(numeric, Unit.COLORSTOPLIST)
      .value.values[0].position,
    { number: Math.fround(0.1), unit: Unit.PERCENT });
    for (const invalid of [ -1, 1.5, 256 ]) {
      const value = shadows(rmlui);
      value.values[0].color.red = invalid;
      assert.throws(() => new Property(value, Unit.BOXSHADOWLIST), /colour/i);
    }
    const value = shadows(rmlui);
    value.values[0].inset = 1;
    assert.throws(() => new Property(value, Unit.BOXSHADOWLIST), /boolean/i);
    const source = stops(rmlui);
    const error = new Error('nested getter');
    Object.defineProperty(source.values[1], 'position', {
      get() {
        throw error;
      },
    });
    assert.throws(() => new Property(source, Unit.COLORSTOPLIST),
      actual => actual === error);
  },

  'decoration-nested-getter-cannot-revive-destroyed-receiver': function({
    rmlui, target,
  }) {
    const value = stops(rmlui);
    let reads = 0;
    Object.defineProperty(value.values[1].position, 'number', {
      get() {
        reads++;
        rmlui.shutdown();
        return 50;
      },
    });
    assert.throws(() => target.setAttribute('stops', value),
      /initialised|valid/i);
    assert.equal(reads, 1);
  },

  'decoration-snapshots-survive-gc-close-and-shutdown': async function({
    rmlui, target, document, context,
  }) {
    let property = new rmlui.Property(shadows(rmlui), rmlui.Unit.BOXSHADOWLIST);
    const weak = new WeakRef(property);
    const snapshot = property.value;
    target.setAttribute('shadow', snapshot);
    property = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    assert.deepEqual(target.getAttributeValue('shadow'), snapshot);
    document.close();
    context.update();
    rmlui.shutdown();
    assert.deepEqual(structuredClone(snapshot), shadows(rmlui));
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Decoration values');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('decoration-values', 320, 240);
    const document = context.loadDocumentFromMemory(`
      <rml><body>
        <div id="target" style="width:40px;height:20px"/>
      </body></rml>`);
    document.show();
    context.update();
    await cases[name]({
      rmlui, context, document, target: document.getElementById('target'),
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
  assert.equal(failures, 0, `${failures} decoration value regressions failed`);
}
