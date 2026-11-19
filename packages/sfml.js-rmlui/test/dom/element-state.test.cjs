'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'classes-pseudo-address': function({ document }) {
    const element = document.querySelector('#target');
    element.setClassNames('one two one');
    assert.deepEqual(new Set(element.getClassNames().split(' ')),
      new Set([ 'one', 'two' ]));
    element.setClassNames('final');
    assert.equal(element.isClassSet('one'), false);
    element.setPseudoClass('selected', true);
    element.setPseudoClass('invalid', true);
    assert.equal(element.isPseudoClassSet('selected'), true);
    assert.equal(element.arePseudoClassesSet([ 'selected', 'invalid' ]), true);
    assert.equal(element.arePseudoClassesSet([]), true);
    assert.equal(element.arePseudoClassesSet([ 'missing' ]), false);
    const snapshot = element.getActivePseudoClasses();
    element.setPseudoClass('invalid', false);
    assert.ok(snapshot.includes('invalid'));
    assert.equal(element.isPseudoClassSet('invalid'), false);
    assert.equal(element.getAddress(false, false), 'div#target.final');
    assert.equal(element.getAddress(true, false),
      'div#target.final:selected');
    assert.match(element.getAddress(), /^div#target.final < body/);
  },

  'raw-attributes-and-merge': function({ document }) {
    const element = document.querySelector('#target');
    const values = {
      enabled: false, number: 12.5, signed: -(2n ** 63n),
      unsigned: 2n ** 64n - 1n, empty: null, text: '世界',
      point: { x: 3, y: 4 }, spatial: { x: 1, y: 2, z: 3 },
      vector: { x: 1, y: 2, z: 3, w: 4 },
      colour: { type: 'colourb', red: 1, green: 2, blue: 3, alpha: 255 },
    };
    element.setAttributes(values);
    for (const [ key, value ] of Object.entries(values)) {
      assert.deepEqual(element.getAttributeValue(key), value);
      assert.equal(element.hasAttribute(key), true);
    }
    assert.equal(element.hasAttribute('missing'), false);
    assert.equal(element.getAttributeValue('missing'), null);
    assert.equal(element.getAttribute('number'), '12.5');
    const snapshot = element.getAttributes();
    const count = element.getNumAttributes();
    element.setAttributes({ text: 'changed', added: true });
    assert.equal(element.id, 'target');
    assert.equal(element.getNumAttributes(), count + 1);
    assert.equal(snapshot.text, '世界');
    snapshot.point.x = 999;
    assert.deepEqual(element.getAttributeValue('point'), { x: 3, y: 4 });
    element.setAttribute('point', { x: 5, y: 6 });
    assert.deepEqual(element.getAttributeValue('point'), { x: 5, y: 6 });
    element.removeAttribute('empty');
    assert.equal(element.hasAttribute('empty'), false);
  },

  'native-default-conversions': function({ document }) {
    const element = document.querySelector('#target');
    assert.equal(element.getAttribute('missing', 23), 23);
    element.setAttributes({
      numeric: '42.5', invalid: 'not a number', truth: '1',
      wide: '9223372036854775807', point: '3, 4',
    });
    assert.equal(element.getAttribute('numeric', 0), 42.5);
    // The native double converter uses atof and reports success for this.
    assert.equal(element.getAttribute('invalid', 17), 0);
    assert.equal(element.getAttribute('invalid', 17n), 17n);
    assert.equal(element.getAttribute('invalid', true), true);
    assert.equal(element.getAttribute('truth', false), true);
    assert.equal(element.getAttribute('wide', 0n), 9223372036854775807n);
    assert.deepEqual(element.getAttribute('point', { x: 0, y: 0 }),
      { x: 3, y: 4 });
    assert.equal(element.getAttribute('missing', 'fallback'), 'fallback');
    assert.deepEqual(element.getAttribute('missing', { x: 3, y: 4 }),
      { x: 3, y: 4 });
  },

  'bulk-control-side-effects': function({ document, context }) {
    const input = document.createElement('input');
    input.setAttributes({ type: 'text', value: 'hello' });
    document.appendChild(input);
    context.update();
    const internal = input.getChild(0);
    assert.ok(internal);
    input.setAttributes({ type: 'checkbox', checked: '' });
    assert.throws(() => internal.tagName, /no longer valid/i);
    assert.equal(input.hasAttribute('checked'), true);
    input.click();
    assert.equal(input.hasAttribute('checked'), false);
    input.addEventListener('probe', () => {
      assert.throws(() => input.setAttributes({ type: 'text' }),
        /active|callback/i);
      assert.throws(() => input.setAttributes({ title: 'mutation' }),
        /active|callback/i);
      const unrelated = document.createElement('div');
      unrelated.setAttributes({ title: 'safe mutation' });
      assert.equal(unrelated.getAttribute('title'), 'safe mutation');
    });
    input.dispatchEvent('probe');
    assert.equal(input.getAttribute('title'), null);
  },

  'getter-lifetime-and-atomic-conversion': function({ document, context }) {
    const element = document.querySelector('#target');
    assert.throws(() => element.setAttributes({
      title: 'must not be applied', broken: { invalid: true },
    }), /Variant/i);
    assert.equal(element.hasAttribute('title'), false);
    const sentinel = new Error('getter sentinel');
    assert.throws(() => element.setAttributes({
      get title() {
        throw sentinel;
      },
    }), error => error === sentinel);
    const vector = {
      get x() {
        document.close();
        context.update();
        return 1;
      },
      y: 2,
    };
    assert.throws(() => element.setAttribute('position', vector),
      /no longer valid/i);
  },

  'pseudo-getters-invalidate': function({ document, context }) {
    const element = document.querySelector('#target');
    assert.equal(typeof element.arePseudoClassesSet, 'function');
    const names = [ 'hover' ];
    Object.defineProperty(names, 0, {
      get() {
        document.close();
        context.update();
        return 'hover';
      },
    });
    assert.throws(() => element.arePseudoClassesSet(names),
      /no longer valid/i);
  },

  'default-getters-invalidate': function({ document, context }) {
    const element = document.querySelector('#target');
    const fallback = {
      get x() {
        document.close();
        context.update();
        return 1;
      },
      y: 2,
    };
    assert.throws(() => element.getAttribute('missing', fallback),
      /no longer valid/i);
  },

  'integer-boundaries-and-owned-values': function({ document }) {
    const element = document.querySelector('#target');
    element.setAttribute('huge', '184467440737095516160');
    assert.throws(() => element.getAttribute('huge', 0n), /integer range/i);
    assert.throws(() => element.getAttribute('huge', 2n ** 64n - 1n),
      /integer range/i);
    element.setAttribute('huge', 2 ** 64);
    assert.throws(() => element.getAttribute('huge', 0n), /integer range/i);
    element.setAttribute('huge', Infinity);
    assert.throws(() => element.getAttribute('huge', 0n), /integer range/i);
    element.setAttribute('finite', 12.75);
    assert.equal(element.getAttribute('finite', 0n), 12n);
    element.setAttributes({ pointer: element });
    assert.equal(element.getElementAttribute('pointer'), element);
    assert.throws(() => element.getAttribute('pointer'), /typed.*adapter/i);
    assert.throws(() => element.getAttribute('missing', null), /non-null/i);
    element.setAttribute('colour', {
      type: 'colourf', red: 0.5, green: 0.25, blue: 0.75, alpha: 1,
    });
    assert.deepEqual(element.getAttribute('colour', {
      type: 'colourf', red: 0, green: 0, blue: 0, alpha: 0,
    }), { type: 'colourf', red: 0.5, green: 0.25, blue: 0.75, alpha: 1 });
  },

  'context-focus-and-snapshot-survival': function({ document, context }) {
    const element = document.querySelector('#target');
    assert.strictEqual(element.getContext(), context);
    assert.strictEqual(document.getContext(), context);
    assert.equal(context.getRootElement().getContext(), null);
    assert.strictEqual(element.getFocusLeafNode(), element);
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    element.appendChild(input);
    context.update();
    assert.equal(input.focus(), true);
    assert.strictEqual(document.getFocusLeafNode(), input);
    const detached = document.createElement('div');
    assert.equal(detached.getContext(), null);
    element.setAttributes({ point: { x: 2, y: 3 } });
    const snapshot = element.getAttributes();
    document.close();
    context.update();
    assert.deepEqual(snapshot.point, { x: 2, y: 3 });
    assert.throws(() => element.getAttributes(), /no longer valid/i);
  },

  'snapshot-own-properties': function({ document }) {
    const element = document.querySelector('#target');
    const attributes = Object.fromEntries([
      [ '__proto__', 'ordinary attribute' ], [ 'constructor', 'ctor' ],
      [ 'toString', 'string' ], [ 'x', { x: 1, y: 2 }],
    ]);
    element.setAttributes(attributes);
    let setters = 0;
    // Assert that native snapshot construction never calls inherited setters.
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Object.prototype, 'x', {
      configurable: true,
      set() {
        setters++;
      },
    });
    let snapshot;
    try {
      snapshot = element.getAttributes();
    } finally {
      delete Object.prototype.x;
    }
    assert.equal(setters, 0);
    assert.equal(Object.getPrototypeOf(snapshot), Object.prototype);
    assert.equal(Object.getOwnPropertyDescriptor(snapshot, '__proto__').value,
      'ordinary attribute');
    assert.equal(snapshot.constructor, 'ctor');
    assert.equal(snapshot.toString, 'string');
    assert.deepEqual(snapshot.x, { x: 1, y: 2 });
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 160)), 'Element state');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('state', 240, 160);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 240px; height: 160px; }
div { display: block; width: 200px; height: 100px; }
input { width: 120px; height: 24px; }
</style></head><body><div id="target"/></body></rml>`);
    document.show();
    context.update();
    cases[name]({ document, context });
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
    const result = spawnSync(process.execPath, [ __filename, name ], {
      encoding: 'utf8', timeout: 20000,
    });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} element state regressions failed`);
}
