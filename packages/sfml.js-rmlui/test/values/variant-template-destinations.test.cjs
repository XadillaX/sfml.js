'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const integerVector = (count, values) => Object.fromEntries([
  [ 'type', `vector${count}i` ],
  ...[ 'x', 'y', 'z', 'w' ].slice(0, count)
    .map((key, index) => [ key, values[index] ]),
]);
const components = (count, values) => Object.fromEntries(
  [ 'x', 'y', 'z', 'w' ].slice(0, count)
    .map((key, index) => [ key, values[index] ]));
const character = value => ({ type: 'character', value });

const cases = {
  'string-bool-and-float-conversions-retain-native-parse-rules':
    ({ rmlui, document }) => {
      for (const [ text, expected ] of [
        [ '1', true ], [ 'TRUE', true ], [ 'TrUe', true ],
        [ '0', false ], [ 'FALSE', false ], [ 'FaLsE', false ],
      ]) {
        assert.deepEqual(new rmlui.Variant(text).getInto(!expected),
          { success: true, value: expected });
      }

      for (const text of [ ' true', 'false ', '2', '' ]) {
        assert.deepEqual(new rmlui.Variant(text).getInto(true),
          { success: false, value: true });
        assert.equal(new rmlui.Property(text).get(true), false);
      }

      for (const type of [ 'float', 'double' ]) {
        const fallback = { type, value: 91 };
        for (const text of [ 'bad', '' ]) {
          assert.deepEqual(new rmlui.Variant(text).getInto(fallback),
            { success: true, value: 0 });
          document.setAttribute('float', text);
          assert.equal(document.getAttribute('float', fallback), 0);
        }
        assert.equal(new rmlui.Variant({ type, value: 1.23456 }).get(''),
          '1.235');
      }
    },

  'colour-string-failures-preserve-the-actual-native-destination':
    ({ rmlui, document }) => {
      const fallback = {
        type: 'colourb', red: 1, green: 2, blue: 3, alpha: 4,
      };
      const zero = {
        type: 'colourb', red: 0, green: 0, blue: 0, alpha: 255,
      };
      for (const [ text, success, expected ] of [
        [ '', false, fallback ],
        [ 'missing-colour', false, zero ],
        [ '#12345678', true,
          { type: 'colourb', red: 18, green: 52, blue: 86, alpha: 120 }],
        [ 'RED', true,
          { type: 'colourb', red: 255, green: 0, blue: 0, alpha: 255 }],
      ]) {
        assert.deepEqual(new rmlui.Variant(text).getInto(fallback),
          { success, value: expected });
        document.setAttribute('colour', text);
        assert.deepEqual(document.getAttribute('colour', fallback), expected);
        assert.deepEqual(fallback,
          { type: 'colourb', red: 1, green: 2, blue: 3, alpha: 4 });
      }

      assert.deepEqual(new rmlui.Property('').get(fallback), zero);
      const floats = {
        type: 'colourf', red: 91, green: 92, blue: 93, alpha: 94,
      };
      assert.deepEqual(new rmlui.Variant('1, bad, 3, 4').getInto(floats),
        { success: true,
          value: { type: 'colourf', red: 1, green: 0, blue: 3, alpha: 4 } });
    },

  'complex-string-destinations-preserve-append-and-replacement':
    ({ rmlui }) => {
      const transitions = rmlui.makeTransitionList({
        none: false,
        transitions: [ rmlui.makeTransition({
          id: rmlui.PropertyId.Width, duration: 2, delay: 0.5,
          reverseAdjustmentFactor: 0.25,
        }) ],
      });
      const animations = {
        type: 'animationlist',
        animations: [ rmlui.makeAnimation({
          duration: 2, name: 'pulse', numIterations: 3,
        }) ],
      };
      const filters = new rmlui.FilterList('blur(2px)');
      const decorators = new rmlui.DecoratorList('decorator-name');
      const fonts = new rmlui.FontEffectList('outline(1px red)');
      for (const [ input, expected ] of [
        [ rmlui.makeTransitionList(), 'none' ],
        [ transitions, 'prefix:width linear-out 2s 0.5s 0.25' ],
        [ animations, 'prefix:2s linear-out 3 pulse' ],
        [{ type: 'animationlist', animations: [] }, 'prefix:' ],
        [{ type: 'transform', primitives: [] }, '' ],
        [{ type: 'colorstoplist', values: [] }, '' ],
        [{ type: 'boxshadowlist', values: [] }, '' ],
        [ filters, `prefix:${filters.value}` ],
        [ decorators, `prefix:${decorators.value}` ],
        [ fonts, `prefix:${fonts.value}` ],
      ]) {
        assert.deepEqual(new rmlui.Variant(input).getInto('prefix:'),
          { success: true, value: expected });
        assert.equal(new rmlui.Variant(input).get('prefix:'), expected);
      }
    },

  'integer-vectors-use-actual-native-string-converters':
    ({ rmlui, document }) => {
      document.setAttribute('values', '17 suffix, -2, 3, 4, 99');
      for (const count of [ 2, 3, 4 ]) {
        const fallback = integerVector(count, [ 91, 92, 93, 94 ]);
        const expected = components(count, [ 17, -2, 3, 4 ]);
        assert.deepEqual(document.getAttribute('values', fallback), expected);
        assert.deepEqual(new rmlui.Property('17 suffix, -2, 3, 4')
          .get(fallback), expected);
        assert.deepEqual(document.getAttribute('missing', fallback),
          components(count, [ 91, 92, 93, 94 ]));
        assert.deepEqual(document.getProperty('missing', fallback),
          components(count, [ 0, 0, 0, 0 ]));
      }
    },

  'partial-failure-preserves-the-native-converted-prefix':
    ({ rmlui, document }) => {
      document.setAttribute('partial', '17, bad, 3, 4');
      document.setAttribute('short', '17');
      for (const count of [ 2, 3, 4 ]) {
        const fallback = integerVector(count, [ 91, 92, 93, 94 ]);
        assert.deepEqual(document.getAttribute('partial', fallback),
          components(count, [ 17, 92, 93, 94 ]));
        assert.deepEqual(document.getAttribute('short', fallback),
          components(count, [ 91, 92, 93, 94 ]));
        assert.deepEqual(new rmlui.Property('17, bad, 3, 4').get(fallback),
          components(count, [ 17, 0, 0, 0 ]));
        assert.deepEqual(new rmlui.Property({ x: 1, y: 2 }).get(fallback),
          components(count, [ 0, 0, 0, 0 ]));
      }
    },

  'character-uses-the-native-enum-int64-template':
    ({ rmlui, document }) => {
      for (const value of [ 0, 65, 0xfffd, 0x1f600, 0xffffffff ]) {
        const stored = new rmlui.Property(character(value));
        assert.equal(stored.value, BigInt(value));
        assert.equal(stored.get(character(91)), value);
        document.setAttribute('enum', character(value));
        assert.equal(document.getAttribute('enum', character(91)), value);
      }
      document.setAttribute('enum', '128512 suffix');
      assert.equal(document.getAttribute('enum', character(91)), 0x1f600);
      document.setAttribute('enum', { type: 'char', value: 65 });
      assert.equal(document.getAttribute('enum', character(91)), 91,
        'Variant enums use int64, not TypeConverter<char, Character>');
      document.setAttribute('enum', '-1');
      assert.equal(document.getAttribute('enum', character(91)), 0xffffffff);
      assert.equal(new rmlui.Property('bad').get(character(91)), 0);
      assert.equal(document.getAttribute('missing', character(91)), 91);
    },

  'event-template-defaults-preserve-prefix-and-enum-results':
    ({ document }) => {
      let count = 0;
      document.addEventListener('templates', event => {
        ++count;
        assert.deepEqual(event.getParameter('partial',
          integerVector(3, [ 91, 92, 93 ])), { x: 17, y: 92, z: 93 });
        assert.equal(event.getParameter('enum', character(91)), 0x1f600);
        assert.equal(event.getParameter('missing', character(91)), 91);
      });
      document.dispatchEvent('templates',
        { partial: '17, bad, 3', enum: '128512' });
      assert.equal(count, 1);
    },

  'selectors-do-not-invent-native-integer-vector-storage':
    ({ rmlui, document }) => {
      assert.throws(() => new rmlui.Property(integerVector(2, [ 1, 2 ])),
        /unsupported|storage|selector/i);
      assert.throws(() => document.setAttribute('bad',
        integerVector(2, [ 1, 2 ])), /unsupported|storage|selector/i);
      for (const value of [ -1, 0x100000000, 1.5, Infinity ]) {
        assert.throws(() => new rmlui.Property(character(value)),
          /range|integer|finite/i);
      }
      assert.throws(() => document.getAttribute('missing',
        integerVector(2, [ 2147483648, 0 ])), /range|integer/i);
      assert.throws(() => document.getAttribute('missing',
        { type: 'vector2i', x: 1, y: 2, z: 3 }), /selector|component/i);
      document.setAttribute('unsafe', '17, 2147483648');
      assert.throws(() => document.getAttribute('unsafe',
        integerVector(2, [ 0, 0 ])), /range|integer/i);
      document.setAttribute('unsafe', 'bad, 2147483648');
      assert.deepEqual(document.getAttribute('unsafe',
        integerVector(2, [ 91, 92 ])), { x: 91, y: 92 },
      'unreachable suffixes must not throw after an earlier failed conversion');
      document.setAttribute('unsafe', '17, -2147483649');
      assert.throws(() => document.getAttribute('unsafe',
        integerVector(2, [ 0, 0 ])), /range|integer/i);
      document.setAttribute('unsafe', '9223372036854775808');
      assert.throws(() => document.getAttribute('unsafe', character(0)),
        /range|integer/i);
    },

  'template-accessors-cannot-use-expired-receivers': ({ rmlui, document }) => {
    assert.throws(() => document.getAttribute('missing', {
      type: 'vector2i',
      get x() {
        rmlui.shutdown();
        return 0;
      },
      y: 0,
    }), /initialised|valid/i);
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Variant templates');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('templates', 160, 120);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    cases[name]({ rmlui, context, document });
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]);
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath, [ __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} Variant template regressions failed`);
}
