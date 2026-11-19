'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const scalar = (type, value) => ({ type, value });

const cases = {
  'native-storage-types-survive-copy-and-equality': ({ rmlui }) => {
    const values = [
      scalar('byte', 255), scalar('char', 65),
      scalar('float', 0.1), scalar('double', 0.1),
      scalar('int', -2147483648), scalar('uint', 4294967295),
      scalar('int64', -9223372036854775808n),
      scalar('uint64', 18446744073709551615n),
    ];
    for (const input of values) {
      const property = new rmlui.Property(input, rmlui.Unit.UNKNOWN);
      const expected = input.type === 'float'
        ? Math.fround(input.value) : input.value;
      assert.equal(property.value, expected);
      assert.equal(property.get(input), input.type === 'byte' ? 0 : expected,
        'upstream byte has no pass-through TypeConverter');
      assert.equal(property.clone().equals(property), true);
      const otherType = typeof input.value === 'bigint'
        ? input.type === 'int64' ? 'uint64' : 'int64'
        : input.type === 'double' ? 'float' : 'double';
      const comparable = typeof input.value === 'bigint' ? 1n : 1;
      assert.equal(new rmlui.Property(scalar(input.type, comparable))
        .equals(new rmlui.Property(scalar(otherType, comparable))), false,
      'native Variant equality includes the storage type');
    }
  },

  'property-and-element-template-conversions-use-native-defaults':
    ({ rmlui, document }) => {
      const property = new rmlui.Property('17 suffix');
      assert.equal(property.get(scalar('int', 91)), 17);
      assert.equal(property.get(scalar('uint', 91)), 17);
      assert.equal(property.get(scalar('byte', 91)), 17);
      assert.equal(property.get(scalar('char', 91)), 0,
        'upstream has no string-to-char converter');
      const negative = new rmlui.Property(' -1 suffix');
      assert.equal(negative.get(scalar('uint', 0)), 4294967295);
      assert.equal(negative.get(scalar('byte', 0)), 255);
      const unsupported = new rmlui.Property({ x: 1, y: 2 });
      for (const type of [ 'byte', 'char', 'float', 'int', 'uint' ]) {
        assert.equal(unsupported.get(scalar(type, 91)), 0,
          'Property::Get returns T{}, not the exemplar value');
        assert.equal(document.getAttribute('missing', scalar(type, 91)), 91);
      }
      document.setAttribute('fraction', 17.9);
      assert.equal(document.getAttribute('fraction', scalar('int', 91)), 17);
      assert.equal(document.getAttribute('fraction', scalar('byte', 91)), 91,
        'upstream has no double-to-byte converter');
      document.setAttributes({
        exact: scalar('uint64', 9n), byte: scalar('byte', 4),
        character: scalar('char', 65), fraction: scalar('float', 0.1),
      });
      assert.equal(document.getAttributeValue('exact'), 9n);
      assert.equal(document.getAttributeValue('byte'), 4);
      assert.equal(document.getAttribute('byte', scalar('byte', 91)), 91,
        'upstream byte-to-byte conversion keeps the original default');
      assert.equal(document.getAttributeValue('character'), 65);
      assert.equal(document.getAttributes().fraction, Math.fround(0.1));
      assert.equal(document.getAttribute('exact', scalar('uint64', 0n)), 9n);
      assert.equal(document.getProperty('missing', scalar('float', 91)), 0);
    },

  'event-parameters-preserve-explicit-types-and-fallbacks':
    ({ document }) => {
      let received = false;
      document.addEventListener('scalars', event => {
        received = true;
        assert.equal(event.parameters.float, Math.fround(0.1));
        assert.equal(event.parameters.uint64, 9n);
        assert.equal(event.getParameter('int', scalar('int', 0)), 17);
        assert.equal(event.getParameter('missing', scalar('uint', 91)), 91);
        assert.equal(event.getParameter('char', scalar('char', 0)), 65);
      });
      document.dispatchEvent('scalars', {
        float: scalar('float', 0.1), uint64: scalar('uint64', 9n),
        int: scalar('int', 17), char: scalar('char', 65),
      });
      assert.equal(received, true);
    },

  'input-ranges-and-unsafe-native-conversions-are-checked':
    ({ rmlui, document }) => {
      for (const input of [
        scalar('byte', -1), scalar('byte', 256), scalar('byte', 1.5),
        scalar('char', 256), scalar('char', 'a'),
        scalar('int', 2147483648), scalar('uint', -1),
        scalar('uint', 4294967296), scalar('float', 1e100),
        scalar('double', Infinity), scalar('int64', 1),
        scalar('int64', 9223372036854775808n),
        scalar('uint64', -1n),
      ]) {
        assert.throws(() => new rmlui.Property(input),
          /range|integer|number|bigint|finite|scalar/i);
      }
      assert.throws(() => document.setAttribute('bad',
        { type: 'int', value: 1, unrelated: 2 }), /scalar|tagged/i);
      for (const [ value, type ] of [
        [ 2147483648, 'int' ], [ -1, 'uint' ], [ 4294967296, 'uint' ],
        [ NaN, 'int' ], [ Infinity, 'uint' ],
        [ '2147483648 trailing', 'int' ], [ '4294967296', 'uint' ],
        [ '256', 'byte' ],
      ]) {
        document.setAttribute('unsafe', value);
        assert.throws(() => document.getAttribute('unsafe', scalar(type, 0)),
          /range|integer/i);
      }
    },

  'scalar-accessors-cannot-use-expired-receivers': ({ rmlui }) => {
    const property = new rmlui.Property(1);
    assert.throws(() => property.get({
      type: 'int',
      get value() {
        rmlui.shutdown();
        return 0;
      },
    }), /initialised|valid/i);
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Variant scalars');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('scalars', 160, 120);
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
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} scalar Variant regressions failed`);
}
