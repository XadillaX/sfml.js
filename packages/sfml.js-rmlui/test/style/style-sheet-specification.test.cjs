'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'global-registration-and-declarations': function({ rmlui }) {
    const { StyleSheetSpecification: styles, PropertyId, ShorthandId,
      PropertyDictionary, ShorthandType } = rmlui;
    const width = styles.getProperty('width');
    assert.equal(width.id, PropertyId.Width);
    assert.equal(styles.getProperty(PropertyId.Width).id, width.id);
    assert.equal(styles.getPropertyId('width'), width.id);
    assert.equal(styles.getPropertyName(width.id), 'width');
    assert.equal(styles.getProperty('missing'), null);
    assert.equal(styles.getPropertyId('missing'), PropertyId.Invalid);
    assert.equal(styles.getPropertyName(0), 'invalid');
    assert.throws(() => width.addParser('number'), /read-only/i);
    assert.throws(() => styles.registerProperty('width', '0', false),
      /reserved|built-in/i);
    const custom = styles.registerProperty('custom-size', '3px', true, true)
      .addParser('length');
    assert.equal(styles.registerProperty('custom-size', '9px', false).id,
      custom.id);
    assert.ok(styles.getRegisteredProperties().includes(custom.id));
    assert.ok(styles.getRegisteredInheritedProperties().includes(custom.id));
    assert.ok(styles.getRegisteredPropertiesForcingLayout()
      .includes(custom.id));
    const shorthand = styles.registerShorthand('custom-pair',
      'custom-size, width', ShorthandType.Replicate);
    assert.notEqual(shorthand, ShorthandId.Invalid);
    assert.equal(styles.getShorthandId('custom-pair'), shorthand);
    assert.equal(styles.getShorthandName(shorthand), 'custom-pair');
    assert.equal(styles.getShorthand(shorthand).items.length, 2);
    assert.equal(styles.getShorthand('custom-pair').id, shorthand);
    assert.deepEqual(styles.getShorthandUnderlyingProperties(shorthand),
      [ width.id, custom.id ].sort((a, b) => a - b));
    assert.deepEqual(styles.getShorthandUnderlyingProperties(0), []);
    const dictionary = new PropertyDictionary();
    assert.ok(styles.parsePropertyDeclaration(
      dictionary, 'custom-pair', '8px'));
    assert.equal(dictionary.getProperty(custom.id).value, 8);
    assert.equal(dictionary.getProperty(width.id).value, 8);
    const borrowed = styles.getPropertySpecification();
    assert.equal(borrowed.getProperty(custom.id).defaultValue.value, 3);
    assert.throws(() => borrowed.registerProperty('new', '', false, false),
      /read-only/i);
    assert.throws(() => styles.registerShorthand('width', 'width',
      ShorthandType.Replicate), /property/i);
    assert.equal(styles.registerShorthand('broken', 'absent',
      ShorthandType.Replicate), ShorthandId.Invalid);
    assert.equal(styles.getShorthandId('broken'), ShorthandId.Invalid);
  },

  'custom-and-builtin-parsers': function({ rmlui }) {
    const { StyleSheetSpecification: styles, PropertyParser, Property,
      PropertyDictionary, Unit } = rmlui;
    const number = styles.getParser('number');
    assert.ok(number instanceof PropertyParser);
    const value = new Property();
    assert.ok(number.parseValue(value, '4.5', {}));
    assert.equal(value.value, 4.5);
    assert.equal(styles.getParser('absent'), null);
    let retained;
    const parser = new PropertyParser((property, text, parameters) => {
      assert.ok(property instanceof Property);
      assert.deepEqual(parameters, { double: 2, triple: 3 });
      if (!text.startsWith('custom:')) {
        return false;
      }
      property.value = Number(text.slice(7)) * parameters.double;
      property.unit = Unit.NUMBER;
      retained = property;
      return true;
    });
    assert.ok(styles.registerParser('custom-number', parser));
    assert.equal(styles.registerParser('number', parser), false);
    assert.equal(styles.registerParser('custom-number', parser), false);
    const definition = styles.registerProperty('custom-value',
      'custom:2', false).addParser('custom-number', 'double=2,triple');
    assert.equal(definition.defaultValue.value, 4);
    const dictionary = new PropertyDictionary();
    assert.ok(styles.parsePropertyDeclaration(dictionary,
      'custom-value', 'custom:7'));
    assert.equal(dictionary.getProperty(definition.id).value, 14);
    retained.value = 99;
    assert.equal(dictionary.getProperty(definition.id).value, 14);
    assert.ok(styles.getParser('custom-number').parseValue(
      value, 'custom:5', { double: 2, triple: 3 }));
    assert.equal(value.value, 10);
    assert.throws(() => number.parseValue(value, '1', { bad: 1.5 }),
      /integer/i);
    const keywords = Object.create(null);
    Object.defineProperty(keywords, '__proto__', { value: 7 });
    assert.ok(styles.getParser('keyword').parseValue(value,
      '__proto__', keywords));
    assert.equal(value.value, 7);
    const rejected = new PropertyParser((property, text, parameters) => {
      assert.equal(Object.getOwnPropertyDescriptor(parameters, '__proto__')
        .value, 7);
      property.value = 17;
      property.unit = Unit.NUMBER;
      return false;
    });
    assert.equal(rejected.parseValue(value, '', keywords), false);
    assert.equal(value.value, 17);
  },

  'callback-errors-and-reentrancy': function({ rmlui }) {
    const { StyleSheetSpecification: styles, PropertyParser, Property,
      PropertySpecification, Unit } = rmlui;
    const marker = new Error('parser sentinel');
    const value = new Property(7, Unit.NUMBER);
    const failing = new PropertyParser(property => {
      property.value = 99;
      throw marker;
    });
    assert.throws(() => failing.parseValue(value, 'x', {}), e => e === marker);
    assert.equal(value.value, 7);
    const invalid = new PropertyParser(() => Promise.resolve(true));
    assert.throws(() => invalid.parseValue(value, 'x', {}), /boolean/i);
    const wrongStorage = new PropertyParser(property => {
      property.value = 3;
      property.unit = Unit.TRANSFORM;
      return true;
    });
    assert.throws(() => wrongStorage.parseValue(value, 'x', {}), /storage/i);
    const spec = new PropertySpecification(1, 0);
    const definition = spec.registerProperty('x', '1', false, false);
    const actions = [
      () => rmlui.shutdown(),
      () => definition.addParser('number'),
      () => styles.registerProperty('reentrant', '1', false),
      () => styles.getParser('number'),
      () => failing.parseValue(value, 'x', {}),
    ];
    const guarded = new PropertyParser(property => {
      for (const action of actions) {
        assert.throws(action, /callback/i);
      }
      property.value = 11;
      property.unit = Unit.NUMBER;
      return true;
    });
    assert.ok(guarded.parseValue(value, 'x', {}));
    assert.equal(value.value, 11);
    assert.ok(styles.registerParser('failing', failing));
    assert.throws(() => definition.addParser('failing'), e => e === marker);
    definition.addParser('number');
    assert.equal(definition.defaultValue.value, 1);
  },

  'parser-retention-and-generation': async function({ rmlui, window }) {
    const { StyleSheetSpecification: styles, PropertyParser, Property, Unit } =
      rmlui;
    let parser = new PropertyParser(property => {
      property.value = 42;
      property.unit = Unit.NUMBER;
      return true;
    });
    assert.ok(styles.registerParser('retained', parser));
    const stale = styles.getParser('number');
    const callbackWeak = new WeakRef((() => {
      const callback = () => true;
      const transient = new PropertyParser(callback);
      assert.ok(styles.registerParser('released-callback', transient));
      return callback;
    })());
    const staleCustom = styles.getParser('released-callback');
    let unused = (() => {
      const circular = new PropertyParser(() => !!circular);
      return circular;
    })();
    const weak = new WeakRef(unused);
    unused = null;
    parser = null;
    for (let i = 0; i < 16; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    const output = new Property();
    assert.ok(styles.getParser('retained').parseValue(output, '', {}));
    assert.equal(output.value, 42);
    const borrowed = styles.getPropertySpecification();
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.equal(styles.getParser('retained'), null);
    assert.throws(() => stale.parseValue(new Property(), '', {}),
      /no longer valid/i);
    assert.throws(() => borrowed.getProperty('width'), /no longer valid/i);
    assert.throws(() => staleCustom.parseValue(new Property(), '', {}),
      /no longer valid/i);
    for (let i = 0; i < 16; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(callbackWeak.deref(), undefined);
  },

  'document-parsing-inheritance-and-exceptions': function({ rmlui }) {
    const { StyleSheetSpecification: styles, PropertyParser, Unit } = rmlui;
    let calls = 0;
    const marker = new Error('document parser sentinel');
    styles.registerParser('tagged-number', new PropertyParser(
      (property, value) => {
        ++calls;
        if (value === 'throw') {
          throw marker;
        }
        if (!/^tag:\d+$/.test(value)) {
          return false;
        }
        property.value = Number(value.slice(4));
        property.unit = Unit.NUMBER;
        return true;
      }));
    const definition = styles.registerProperty('custom-tag', 'tag:2', true)
      .addParser('tagged-number');
    const context = rmlui.createContext('custom-style', 160, 120);
    const document = context.loadDocumentFromMemory(`
      <rml><head><style>
        #parent { custom-tag: tag:8; }
      </style></head><body>
        <div id="parent"><div id="child"/></div>
      </body></rml>`);
    assert.ok(document);
    document.show();
    context.update();
    const child = document.getElementById('child');
    const parent = document.getElementById('parent');
    assert.equal(parent.getProperty(definition.id).value, 8);
    assert.equal(child.getProperty(definition.id).value, 8);
    assert.ok(parent.setProperty('custom-tag', 'tag:13'));
    context.update();
    assert.equal(child.getProperty(definition.id).value, 13);
    assert.throws(() => parent.setProperty('custom-tag', 'throw'),
      error => error === marker);
    assert.equal(parent.getProperty(definition.id).value, 13);
    assert.ok(parent.setProperty('custom-tag', 'tag:21'));
    context.update();
    assert.equal(child.getProperty(definition.id).value, 21);
    assert.ok(calls >= 5);
  },

  'global-capacity-and-invalid-registration': function({ rmlui }) {
    const { StyleSheetSpecification: styles, ShorthandType,
      PropertyId, ShorthandId } = rmlui;
    assert.throws(() => styles.registerProperty('', '', false), /reserved/i);
    assert.throws(() => styles.registerProperty('invalid', '', false),
      /reserved/i);
    assert.throws(() => styles.registerProperty('margin', '', false),
      /shorthand/i);
    assert.throws(() => styles.registerShorthand('bad-box', 'width',
      ShorthandType.Box), /four/i);
    assert.equal(styles.getShorthandId('bad-box'), 0);
    for (let id = PropertyId.FirstCustomId; id < PropertyId.MaxNumIds; ++id) {
      const definition = styles.registerProperty(`custom-${id}`, '0', false)
        .addParser('number');
      assert.equal(definition.id, id);
    }
    assert.throws(() =>
      styles.registerProperty('capacity-overflow', '0', false), /capacity/i);
    assert.equal(styles.getPropertyId('capacity-overflow'), 0);
    for (let id = ShorthandId.FirstCustomId; id < ShorthandId.MaxNumIds; ++id) {
      assert.equal(styles.registerShorthand(`short-${id}`, 'width',
        ShorthandType.Replicate), id);
    }
    assert.throws(() => styles.registerShorthand('capacity-overflow', 'width',
      ShorthandType.Replicate), /capacity/i);
    assert.equal(styles.getShorthandId('capacity-overflow'), 0);
  },

  'parser-produced-tween-retention': async function({ rmlui }) {
    const { StyleSheetSpecification: styles, PropertyParser, Property,
      PropertyDictionary, PropertyId, Tween, Unit } = rmlui;
    let weak;
    const parser = new PropertyParser(property => {
      const callback = t => t * t;
      weak = new WeakRef(callback);
      property.value = {
        type: 'animationlist',
        animations: [ rmlui.makeAnimation({
          name: 'parser-motion', tween: new Tween(callback),
        }) ],
      };
      property.unit = Unit.ANIMATION;
      return true;
    });
    styles.registerParser('motion-value', parser);
    const definition = styles.registerProperty('custom-motion', '', false)
      .addParser('motion-value');
    for (let i = 0; i < 16; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.ok(weak.deref());
    assert.equal(definition.defaultValue.value.animations[0]
      .tween.evaluate(0.5), 0.25);
    let output = new Property();
    const weakOwner = new WeakRef(output);
    const cyclic = new PropertyParser(property => {
      const owner = weakOwner.deref();
      property.value = {
        type: 'animationlist',
        animations: [ rmlui.makeAnimation({
          tween: new Tween(t => {
            assert.ok(owner);
            return t;
          }),
        }) ],
      };
      property.unit = Unit.ANIMATION;
      return true;
    });
    assert.ok(cyclic.parseValue(output, '', {}));
    const dictionary = new PropertyDictionary();
    dictionary.setProperty(PropertyId.Animation, output);
    dictionary.clear();
    output = null;
    for (let i = 0; i < 16; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weakOwner.deref(), undefined);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Style specification');
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
  assert.equal(failures, 0, `${failures} style specification failures`);
}
