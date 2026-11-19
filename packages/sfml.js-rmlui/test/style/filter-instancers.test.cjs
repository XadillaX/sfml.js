'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function defaults(rmlui, instancer) {
  const properties = new rmlui.PropertyDictionary();
  instancer.getPropertySpecification().setPropertyDefaults(properties);
  return properties;
}

const cases = {
  'native-filter-and-local-properties': ({ rmlui, element, context }) => {
    const { FilterInstancer, Filter, Property, PropertyDictionary,
      ShorthandType, Unit } = rmlui;
    const blur = FilterInstancer.get('blur');
    const parameters = defaults(rmlui, blur);
    const sigma = blur.getPropertySpecification().getProperty('sigma').id;
    parameters.setProperty(sigma, new Property(2, Unit.PX));
    const filter = blur.instanceFilter('blur', parameters);
    assert.ok(filter instanceof Filter);
    const overflow = { p0: { x: 10, y: 20 }, p1: { x: 30, y: 40 } };
    assert.deepEqual(filter.extendInkOverflow(element, overflow), {
      p0: { x: 4, y: 14 }, p1: { x: 36, y: 46 },
    });
    assert.deepEqual(overflow, {
      p0: { x: 10, y: 20 }, p1: { x: 30, y: 40 },
    });
    element.setProperty('font-size', '10px');
    context.update();
    parameters.setProperty(sigma, new Property(0.5, Unit.EM));
    const relative = blur.instanceFilter('blur', parameters);
    assert.deepEqual(relative.extendInkOverflow(element, overflow), {
      p0: { x: -5, y: 5 }, p1: { x: 45, y: 55 },
    });
    assert.deepEqual(filter.extendInkOverflow(element, overflow), {
      p0: { x: 4, y: 14 }, p1: { x: 36, y: 46 },
    });
    let received;
    let radius;
    const custom = new FilterInstancer((name, properties) => {
      assert.equal(name, 'custom-blur');
      received = properties;
      const translated = new PropertyDictionary();
      translated.setProperty(sigma, properties.getProperty(radius.id));
      return blur.instanceFilter('blur', translated);
    });
    radius = custom.registerProperty('radius', '4px').addParser('length');
    assert.equal(custom.registerProperty('radius', '99px').id, radius.id);
    assert.notEqual(custom.registerShorthand('filter', 'radius',
      ShorthandType.FallThrough), 0);
    const result = custom.instanceFilter('custom-blur',
      defaults(rmlui, custom));
    received.clear();
    assert.deepEqual(result.extendInkOverflow(element, overflow), {
      p0: { x: -2, y: 8 }, p1: { x: 42, y: 52 },
    });
    assert.throws(() => blur.registerProperty('unsafe', '0'), /read-only/i);
    assert.throws(() => custom.getPropertySpecification()
      .registerProperty('unsafe', '0', false, false), /read-only/i);
  },

  'native-render-instances-and-replacement': ({ rmlui, context, element }) => {
    const { FilterInstancer, Property, PropertyId, Unit } = rmlui;
    const blur = FilterInstancer.get('blur');
    const properties = defaults(rmlui, blur);
    const sigma = blur.getPropertySpecification().getProperty('sigma').id;
    let oldCalls = 0;
    let newCalls = 0;
    const old = new FilterInstancer((_name, dictionary) => {
      ++oldCalls;
      properties.setProperty(sigma, new Property(2, Unit.PX));
      assert.equal(dictionary.getNumProperties(), 0);
      return blur.instanceFilter('blur', properties);
    });
    FilterInstancer.register('custom-render', old);
    const declaration = new rmlui.FilterList('custom-render()');
    FilterInstancer.register('custom-render', new FilterInstancer(() => {
      ++newCalls;
      return blur.instanceFilter('blur', properties);
    }));
    element.setProperty(PropertyId.Filter,
      new Property(declaration, Unit.FILTER));
    context.update();
    context.render();
    assert.ok(oldCalls > 0);
    assert.equal(newCalls, 0);
    element.setProperty('filter', 'custom-render()');
    context.update();
    context.render();
    assert.ok(newCalls > 0);
    assert.ok(old.instanceFilter('old', new rmlui.PropertyDictionary()));
  },

  'errors-recursion-null-and-bounds': ({ rmlui, element }) => {
    const { FilterInstancer, FontEffect, PropertyDictionary,
      ShorthandType } = rmlui;
    const properties = new PropertyDictionary();
    const custom = new FilterInstancer(() => {
      assert.throws(() => rmlui.shutdown(), /callback/i);
      assert.throws(() => custom.registerProperty('late', '0'), /callback/i);
      assert.throws(() => custom.instanceFilter('recursive', properties),
        /recursive/i);
      assert.throws(() => element.setProperty('opacity', '0'), /callback/i);
      return null;
    });
    assert.equal(custom.instanceFilter('null', properties), null);
    const sentinel = new Error('filter callback sentinel');
    const throwing = new FilterInstancer(() => {
      throw sentinel;
    });
    assert.throws(() => throwing.instanceFilter('throws', properties),
      error => error === sentinel);
    for (const callback of [
      () => Promise.resolve(null), () => new FontEffect(), () => ({}),
    ]) {
      const invalid = new FilterInstancer(callback);
      assert.throws(() => invalid.instanceFilter('invalid', properties),
        /filter/i);
    }
    assert.equal(custom.registerShorthand('absent', 'missing',
      ShorthandType.FallThrough), 0);
    assert.equal(custom.getPropertySpecification().getShorthand('absent'),
      null);
    for (let i = 1; i < 128; ++i) {
      assert.equal(custom.registerProperty(`value-${i}`, '0')
        .addParser('number').id, i);
    }
    assert.throws(() => custom.registerProperty('overflow', '0'), /capacity/i);
    assert.throws(() => custom.instanceFilter('incomplete', properties),
      /required/i);
  },

  'generation-and-getter-invalidation': ({ rmlui, window, element }) => {
    const blur = rmlui.FilterInstancer.get('blur');
    const filter = blur.instanceFilter('blur', defaults(rmlui, blur));
    const custom = new rmlui.FilterInstancer(() => filter);
    const specification = custom.getPropertySpecification();
    const rectangle = {
      get p0() {
        rmlui.shutdown();
        assert.ok(rmlui.initialise(window, { highDpi: false }));
        return { x: 0, y: 0 };
      },
      p1: { x: 20, y: 20 },
    };
    assert.throws(() => filter.extendInkOverflow(element, rectangle),
      /valid/i);
    assert.throws(() => custom.instanceFilter('stale',
      new rmlui.PropertyDictionary()), /valid/i);
    assert.throws(() => specification.getRegisteredProperties(), /valid/i);
    assert.throws(() => rmlui.FilterInstancer.register('stale', blur),
      /valid/i);
  },

  'callback-cycle-registration-and-specification-lifetime': async options => {
    const { rmlui } = options;
    let cycle;
    let registered;
    let specification;
    let stale;
    (() => {
      const owner = {};
      owner.instancer = new rmlui.FilterInstancer(() => {
        void owner;
        return null;
      });
      owner.instancer.registerProperty('size', '5').addParser('number');
      specification = owner.instancer.getPropertySpecification();
      cycle = new WeakRef(owner);
    })();
    (() => {
      const owner = {};
      owner.instancer = new rmlui.FilterInstancer(() => {
        void owner;
        return null;
      });
      registered = new WeakRef(owner);
      rmlui.FilterInstancer.register('retained-filter', owner.instancer);
      stale = owner.instancer;
    })();
    for (let i = 0; i < 16; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(cycle.deref(), undefined);
    assert.equal(specification.getProperty('size').defaultValue.value, 5);
    assert.ok(registered.deref());
    rmlui.shutdown();
    for (let i = 0; i < 16; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(registered.deref(), undefined);
    assert.ok(stale);
  },

  'render-callback-errors-and-recovery': ({ rmlui, context, element }) => {
    const sentinel = new Error('render filter sentinel');
    rmlui.FilterInstancer.register('throwing-filter',
      new rmlui.FilterInstancer(() => {
        throw sentinel;
      }));
    element.setProperty('filter', 'throwing-filter()');
    assert.throws(() => {
      context.update();
      context.render();
    }, error => error === sentinel);
    element.setProperty('filter', 'none');
    context.update();
    context.render();
    const blur = rmlui.FilterInstancer.get('blur');
    const parameters = defaults(rmlui, blur);
    parameters.setProperty(127, new rmlui.Property(1, rmlui.Unit.NUMBER));
    assert.throws(() => blur.instanceFilter('blur', parameters),
      /unknown.*id/i);
    const filter = blur.instanceFilter('blur', defaults(rmlui, blur));
    assert.throws(() => filter.extendInkOverflow(element, {
      p0: { x: NaN, y: 0 }, p1: { x: 1, y: 1 },
    }), /finite/i);
    const basic = rmlui.FilterInstancer.get('opacity');
    const neutral = basic.instanceFilter('opacity', defaults(rmlui, basic));
    const rectangle = { p0: { x: 3, y: 4 }, p1: { x: -1, y: -2 } };
    assert.deepEqual(neutral.extendInkOverflow(element, rectangle), rectangle);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Filter instancers');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('filters', 160, 120);
  const document = context.loadDocumentFromMemory(
    '<rml><head/><body><div id="target" style="width: 30px; height: 30px;' +
    'background-color: red;"/></body></rml>');
  const element = document.getElementById('target');
  document.show();
  context.update();
  try {
    await cases[name]({ rmlui, window, context, element });
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
  assert.equal(failures, 0, `${failures} filter instancer failures`);
}
