'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'registration-lookup-and-id-sets': function({ rmlui }) {
    const { PropertySpecification, PropertyDictionary, Property, Unit,
      RelativeTarget } = rmlui;
    const spec = new PropertySpecification(4, 2);
    assert.equal(spec.getProperty('missing'), null);
    assert.equal(spec.getProperty(0), null);
    const x = spec.registerProperty('x', '2px', true, false);
    x.addParser('length').setRelativeTarget(RelativeTarget.FontSize);
    const y = spec.registerProperty('y', '3px', false, true);
    y.addParser('length');
    assert.equal(x.id, 1);
    assert.equal(y.id, 2);
    assert.equal(spec.getProperty('x').id, x.id);
    assert.equal(spec.getProperty(x.id).defaultValue.toString(), '2px');
    assert.equal(spec.getProperty('x').relativeTarget, RelativeTarget.FontSize);
    assert.equal(spec.registerProperty('x', '9px', false, true).id, x.id);
    assert.equal(spec.getProperty('x').defaultValue.toString(), '2px');
    assert.deepEqual(spec.getRegisteredProperties(), [ 1, 2 ]);
    assert.deepEqual(spec.getRegisteredInheritedProperties(), [ 1 ]);
    assert.deepEqual(spec.getRegisteredPropertiesForcingLayout(), [ 2 ]);
    const ids = spec.getRegisteredProperties();
    ids.pop();
    assert.deepEqual(spec.getRegisteredProperties(), [ 1, 2 ]);
    const values = new PropertyDictionary();
    values.setProperty(y.id, new Property(9, Unit.PX));
    spec.setPropertyDefaults(values);
    assert.equal(values.getProperty(x.id).value, 2);
    assert.equal(values.getProperty(y.id).value, 9);
    assert.equal(spec.propertiesToString(values, true, ';'), 'x: 2px;y: 9px');
    assert.equal(spec.propertiesToString(values, false, ','), '2px,9px');
    assert.equal(spec.propertiesToString(new PropertyDictionary(), true, ';'),
      '');
    assert.throws(() => spec.propertiesToString(values, true, '🙂'), /byte/i);
    assert.throws(() => spec.propertiesToString(values, true, ''), /byte/i);
    assert.throws(() => spec.propertiesToString(values, true, 'é'), /byte/i);
  },

  'shorthand-parsing-and-owned-snapshots': function({ rmlui }) {
    const { PropertySpecification, PropertyDictionary, ShorthandType, Unit } =
      rmlui;
    const spec = new PropertySpecification(4, 4);
    for (const name of [ 'top', 'right', 'bottom', 'left' ]) {
      spec.registerProperty(name, '0px', name === 'top', false)
        .addParser('length');
    }
    const edge = spec.registerShorthand('edge', 'top,right,bottom,left',
      ShorthandType.Box);
    assert.equal(edge, 1);
    const copy = spec.getShorthand('edge');
    assert.equal(copy.id, edge);
    assert.equal(copy.type, ShorthandType.Box);
    assert.equal(copy.inherited, true);
    assert.deepEqual(copy.items.map(item => item.propertyId), [ 1, 2, 3, 4 ]);
    assert.equal(copy.items[0].type, 'property');
    assert.equal(copy.items[0].definition.defaultValue.toString(), '0px');
    assert.equal(copy.items[0].optional, false);
    copy.items.length = 0;
    assert.equal(spec.getShorthand(edge).items.length, 4);
    const all = spec.registerShorthand('all', 'edge',
      ShorthandType.RecursiveRepeat);
    assert.equal(spec.getShorthand(all).items[0].type, 'shorthand');
    assert.equal(spec.getShorthand(all).items[0].definition.id, edge);
    const dictionary = new PropertyDictionary();
    assert.ok(spec.parsePropertyDeclaration(dictionary, 'edge', '1px 2px'));
    assert.deepEqual([ ...dictionary.getProperties().values() ]
      .map(property => property.value).sort(), [ 1, 1, 2, 2 ]);
    assert.ok(spec.parseShorthandDeclaration(dictionary, all, '3px'));
    assert.equal(dictionary.getProperty(4).value, 3);
    assert.ok(spec.parsePropertyDeclaration(dictionary, 2, '7px'));
    assert.ok(spec.parsePropertyDeclaration(dictionary, 'top', '8px'));
    assert.equal(dictionary.getProperty(1).value, 8);
    assert.equal(dictionary.getProperty(2).value, 7);
    assert.equal(spec.parsePropertyDeclaration(dictionary, 'absent', '1px'),
      false);
    assert.equal(spec.parsePropertyDeclaration(dictionary, 0, '1px'), false);
    assert.equal(spec.parseShorthandDeclaration(dictionary, 0, '1px'), false);
    assert.equal(spec.parsePropertyDeclaration(dictionary, 'top', 'garbage'),
      false);
    assert.ok(spec.parsePropertyDeclaration(dictionary, '--gap', ''));
    assert.equal(dictionary.getCustomProperty('--gap').value, '');
    assert.ok(spec.parseShorthandDeclaration(dictionary, edge, 'var(--gap)'));
    assert.equal(dictionary.getVarShorthand(edge).unit, Unit.VAR_EXPRESSION);
    assert.equal(dictionary.getProperty(1).unit, Unit.SHORTHAND_PLACEHOLDER);
  },

  'all-shorthand-types-and-partial-failure': function({ rmlui }) {
    const { PropertySpecification, PropertyDictionary, ShorthandType } = rmlui;
    const spec = new PropertySpecification(3, 5);
    for (const name of [ 'a', 'b', 'c' ]) {
      spec.registerProperty(name, '1', false, false).addParser('number');
    }
    const dictionary = new PropertyDictionary();
    const replicate = spec.registerShorthand('replicate', 'a,b,c',
      ShorthandType.Replicate);
    assert.ok(spec.parseShorthandDeclaration(dictionary, replicate, '2 3'));
    assert.deepEqual([ 1, 2, 3 ].map(id => dictionary.getProperty(id).value),
      [ 2, 3, 3 ]);
    const fall = spec.registerShorthand('fall', 'a,b,c',
      ShorthandType.FallThrough);
    assert.equal(spec.parseShorthandDeclaration(dictionary, fall, '4 bad'),
      false);
    assert.equal(dictionary.getProperty(1).value, 4);
    const comma = spec.registerShorthand('comma', 'a,b?,c',
      ShorthandType.RecursiveCommaSeparated);
    assert.ok(spec.getShorthand(comma).items[1].optional);
    assert.ok(spec.parseShorthandDeclaration(dictionary, comma, '5,6,7'));
    assert.deepEqual([ 1, 2, 3 ].map(id => dictionary.getProperty(id).value),
      [ 5, 6, 7 ]);
    const flex = spec.registerShorthand('flex', 'a,b,c', ShorthandType.Flex);
    assert.ok(spec.parseShorthandDeclaration(dictionary, flex, '2'));
    assert.deepEqual([ 1, 2, 3 ].map(id => dictionary.getProperty(id).value),
      [ 2, 1, 0 ]);
  },

  'bounded-ids-collisions-and-invalid-shorthands': function({ rmlui }) {
    const { PropertySpecification, ShorthandType, ShorthandId, PropertyId } =
      rmlui;
    const spec = new PropertySpecification(0, 0);
    const high = spec.registerProperty('high', '1', false, false, 125)
      .addParser('number');
    assert.equal(high.id, 125);
    assert.equal(spec.registerProperty('next', '2', false, false).id, 126);
    assert.throws(() => spec.registerProperty('collision', '3', false, false,
      125), /already|collision/i);
    assert.throws(() => spec.registerProperty('high', '3', false, false, 2),
      /already|collision/i);
    assert.equal(spec.registerProperty('last', '3', false, false).id, 127);
    assert.throws(() => spec.registerProperty('overflow', '4', false, false),
      /maximum|capacity/i);
    assert.equal(spec.getProperty('overflow'), null);
    assert.equal(spec.registerShorthand('bad', 'missing',
      ShorthandType.Replicate), ShorthandId.Invalid);
    assert.throws(() => spec.registerShorthand('box', 'high',
      ShorthandType.Box), /four|4/i);
    assert.throws(() => spec.registerShorthand('flex', 'high',
      ShorthandType.Flex), /three|3/i);
    assert.equal(spec.registerShorthand('empty', '', ShorthandType.FallThrough),
      ShorthandId.Invalid);
    assert.equal(spec.registerShorthand('one', 'high',
      ShorthandType.Replicate, 253), 253);
    assert.equal(spec.registerShorthand('one', 'high',
      ShorthandType.Replicate), ShorthandId.Invalid);
    assert.equal(spec.registerShorthand('two', 'high',
      ShorthandType.Replicate), 254);
    assert.throws(() => spec.registerShorthand('overflow', 'high',
      ShorthandType.Replicate), /maximum|capacity/i);
    assert.throws(() => spec.registerProperty('invalid', '1', false, false),
      /reserved/i);
    assert.throws(() => new PropertySpecification(PropertyId.MaxNumIds, 0),
      /reserve/i);
    assert.throws(() => new PropertySpecification(0, ShorthandId.MaxNumIds),
      /reserve/i);
    assert.throws(() => spec.getProperty(-1));
    assert.throws(() => spec.getProperty.call({}, 'high'),
      /PropertySpecification/);
  },

  'gc-borrowed-definitions-and-generation-invalidation':
  async function({ rmlui, window }) {
    const { PropertySpecification, PropertyDictionary, ShorthandType } = rmlui;
    let spec = new PropertySpecification(1, 1);
    const definition = spec.registerProperty('size', '3px', false, false)
      .addParser('length');
    spec.registerShorthand('size-pair', 'size', ShorthandType.Replicate);
    const shorthand = spec.getShorthand('size-pair');
    const dictionary = new PropertyDictionary();
    assert.ok(spec.parsePropertyDeclaration(dictionary, 'size', '9px'));
    const property = dictionary.getProperty(definition.id);
    const weak = new WeakRef(spec);
    spec = null;
    for (let i = 0; i < 16; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(property.definition.defaultValue.toString(), '3px');
    assert.equal(property.toString(), '9px');
    definition.setRelativeTarget(rmlui.RelativeTarget.FontSize);
    assert.equal(shorthand.items[0].definition.relativeTarget,
      rmlui.RelativeTarget.FontSize);
    const stale = new PropertySpecification(0, 0);
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => definition.id, /no longer valid/i);
    assert.throws(() => stale.getProperty(1), /no longer valid/i);
    assert.throws(() => shorthand.items[0].definition.id, /no longer valid/i);
    assert.throws(() => property.toString(), /no longer valid/i);
    assert.equal(new PropertySpecification(0, 0).getProperty(1), null);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Property specification');
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
  assert.equal(failures, 0, `${failures} property specification failures`);
}
