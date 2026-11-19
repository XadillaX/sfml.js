'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  identity({ document, parent, child }) {
    assert.strictEqual(document.querySelector('section'), parent);
    assert.strictEqual(parent.querySelector('button'), child);
    assert.strictEqual(child.getOwnerDocument(), document);
    child.id = 'duplicate';
    parent.id = 'duplicate';
    assert.strictEqual(document.querySelector('button'), child);
    assert.notStrictEqual(document.querySelector('section'), child);
    let target;
    child.addEventListener('click', event => {
      target = event.target;
      assert.strictEqual(event.currentTarget, child);
    });
    child.click();
    assert.strictEqual(target, child);
  },

  phases({ document, parent, child, rmlui }) {
    const calls = [];
    const retain = [];
    const listen = (element, label, capture) => {
      element.addEventListener('test-phase', event => {
        assert.ok(event instanceof rmlui.RmlEvent);
        assert.strictEqual(event.target, child);
        assert.strictEqual(event.currentTarget, element);
        assert.equal(event.targetId, '');
        assert.equal(event.type, 'test-phase');
        assert.equal(event.isInterruptible, true);
        assert.equal(event.isPropagating, true);
        assert.equal(event.isImmediatePropagating, true);
        assert.ok(Number.isInteger(event.id));
        calls.push([ label, event.phase ]);
        retain.push(event);
      }, capture);
    };
    listen(document, 'document-capture', true);
    listen(parent, 'parent-capture', true);
    listen(child, 'target-capture', true);
    listen(child, 'target', false);
    listen(parent, 'parent', false);
    listen(document, 'document', false);
    assert.equal(child.dispatchEvent('test-phase', { count: 4 }), true);
    assert.deepEqual(calls, [
      [ 'document-capture', 1 ], [ 'parent-capture', 1 ],
      [ 'target', 2 ], [ 'target-capture', 2 ],
      [ 'parent', 4 ], [ 'document', 4 ],
    ]);
    assert.equal(new Set(retain.map(event => event.id)).size, 1);
    for (const event of retain) {
      assert.equal(event.parameters.count, 4);
      assert.strictEqual(event.target, child);
      assert.throws(() => event.isPropagating, /expired/i);
      assert.throws(() => event.isImmediatePropagating, /expired/i);
      assert.throws(() => event.stopPropagation(), /expired/i);
      assert.throws(() => event.stopImmediatePropagation(), /expired/i);
    }
  },

  stops({ parent, child }) {
    for (const immediate of [ false, true ]) {
      const type = `stop-${immediate}`;
      const calls = [];
      parent.addEventListener(type, event => {
        calls.push('first');
        if (immediate) {
          event.stopImmediatePropagation();
        } else {
          event.stopPropagation();
        }
        assert.equal(event.isPropagating, false);
        assert.equal(event.isImmediatePropagating, !immediate);
      }, true);
      parent.addEventListener(type, () => calls.push('second'), true);
      child.addEventListener(type, () => calls.push('target'));
      assert.equal(child.dispatchEvent(type), false);
      assert.deepEqual(calls, immediate ? [ 'first' ] : [ 'first', 'second' ]);
    }
    const calls = [];
    child.addEventListener('unstoppable', event => {
      assert.equal(event.isInterruptible, false);
      event.stopImmediatePropagation();
      assert.equal(event.isPropagating, true);
      assert.equal(event.isImmediatePropagating, true);
      calls.push('target');
    });
    parent.addEventListener('unstoppable', () => calls.push('bubble'));
    assert.equal(child.dispatchEvent('unstoppable', {}, {
      interruptible: false, bubbles: false,
    }), true);
    assert.deepEqual(calls, [ 'target' ]);
  },

  nested({ parent, child }) {
    const calls = [];
    let inner;
    let outer;
    parent.addEventListener('inner', event => {
      inner = event;
      assert.notStrictEqual(inner, outer);
      assert.notEqual(inner.id, outer.id);
      assert.strictEqual(inner.target, parent);
      assert.equal(outer.isPropagating, true);
      calls.push('inner');
    });
    child.addEventListener('outer', event => {
      outer = event;
      calls.push('before');
      assert.equal(parent.dispatchEvent('inner'), true);
      assert.throws(() => inner.stopPropagation(), /expired/i);
      assert.equal(outer.isPropagating, true);
      outer.stopPropagation();
      calls.push('after');
    });
    assert.equal(child.dispatchEvent('outer'), false);
    assert.deepEqual(calls, [ 'before', 'inner', 'after' ]);
    assert.throws(() => outer.stopPropagation(), /expired/i);
  },

  exceptions({ parent, child }) {
    const error = new Error('nested event failure');
    let inner;
    let later = 0;
    parent.addEventListener('inner-error', event => {
      inner = event;
      throw error;
    });
    child.addEventListener('outer-error', () => {
      parent.dispatchEvent('inner-error');
    });
    child.addEventListener('outer-error', () => later++);
    assert.throws(() => child.dispatchEvent('outer-error'), value => {
      return value === error;
    });
    assert.equal(later, 0);
    assert.throws(() => inner.stopPropagation(), /expired/i);
    child.addEventListener('recovered', () => later++);
    assert.equal(child.dispatchEvent('recovered'), true);
    assert.equal(later, 1);
  },

  variants({ child, parent }) {
    const values = {
      empty: null,
      flag: true,
      negative: -42,
      fractional: Math.PI,
      text: '水😀\u0000fin',
      signed: -(2n ** 63n),
      unsigned: 2n ** 64n - 1n,
      vector2: { x: 1.5, y: -2 },
      vector3: { x: 1, y: 2, z: 3 },
      vector4: { x: 1, y: 2, z: 3, w: 4 },
      bytes: { type: 'colourb', red: 2, green: 64, blue: 255, alpha: 128 },
      floats: { type: 'colourf', red: 0.5, green: 0.25, blue: 1, alpha: 0 },
      element: parent,
      ['__proto__']: 'ordinary parameter',
    };
    let received;
    child.addEventListener('variants', event => {
      received = event.parameters;
      assert.strictEqual(received.element, parent);
    });
    assert.equal(child.dispatchEvent('variants', values), true);
    assert.deepEqual(received, values);
    assert.notStrictEqual(received.vector2, values.vector2);
    assert.equal(Object.hasOwn(received, '__proto__'), true);
    for (const value of [
      undefined, {}, [ 1, 2 ], () => {}, Symbol('pointer'),
      2n ** 64n, -(2n ** 63n) - 1n,
      { x: 1, y: '2' },
      { type: 'colourb', red: 256, green: 0, blue: 0, alpha: 1 },
    ]) {
      assert.throws(() => child.dispatchEvent('variants', { value }),
        /variant|64-bit|colour|vector/i);
    }
  },

  'parameter-defaults': function({ child }) {
    let calls = 0;
    child.addEventListener('parameter-defaults', event => {
      calls++;
      assert.equal(event.getParameter('missing', 12), 12);
      assert.equal(event.getParameter('none', 'fallback'), 'fallback');
      assert.equal(event.getParameter('numeric', 0), 12.5);
      assert.equal(event.getParameter('invalid', 99), 0);
      assert.equal(event.getParameter('invalid', 99n), 99n);
      assert.equal(event.getParameter('boolean', false), true);
      assert.equal(event.getParameter('number', ''), '1.25');
      assert.equal(event.getParameter('signed', 0n), -9223372036854775808n);
      assert.equal(event.getParameter('unsigned', 2n ** 63n),
        18446744073709551615n);
      assert.equal(event.getParameter('fraction', 0n), -3n);
      assert.equal(event.getParameter('__proto__', ''), 'own key');
      // The helper reads native parameters, not the writable JS snapshot.
      event.parameters.numeric = '200';
      assert.equal(event.getParameter('numeric', 0), 12.5);
      assert.equal(event.isType('parameter-defaults'), true);
      assert.equal(event.isType(event.id), true);
      assert.equal(event.isType('click'), false);
      assert.equal(event.isType(-1), false);
    });
    child.dispatchEvent('parameter-defaults', {
      none: null, numeric: '12.5px', invalid: 'not a number',
      boolean: 'TrUe', number: 1.25, signed: -(2n ** 63n),
      unsigned: 2n ** 64n - 1n, fraction: -3.9,
      ['__proto__']: 'own key',
    });
    assert.equal(calls, 1);
  },

  'parameter-value-copies': function({ child }) {
    child.addEventListener('parameter-copies', event => {
      const fallback = { x: 8, y: 9 };
      const missing = event.getParameter('missing', fallback);
      assert.deepEqual(missing, { x: 8, y: 9 });
      assert.notStrictEqual(missing, fallback);
      assert.deepEqual(event.getParameter('text', fallback), { x: 1, y: 2 });
      assert.deepEqual(event.getParameter('short', fallback), { x: 8, y: 9 });
      assert.deepEqual(event.getParameter('v3', { x: 0, y: 0, z: 0 }),
        { x: 1, y: 2, z: 3 });
      assert.deepEqual(event.getParameter('v4', { x: 0, y: 0, z: 0, w: 0 }),
        { x: 1, y: 2, z: 3, w: 4 });
      for (const type of [ 'colourb', 'colourf' ]) {
        const colour = { type, red: 1, green: 0, blue: 0, alpha: 1 };
        assert.deepEqual(event.getParameter(type, colour), colour);
        assert.notStrictEqual(event.getParameter(type, colour), colour);
      }
      const first = event.getParameter('v3', { x: 0, y: 0, z: 0 });
      first.x = 99;
      assert.equal(event.getParameter('v3', { x: 0, y: 0, z: 0 }).x, 1);
    });
    child.dispatchEvent('parameter-copies', {
      text: '1, 2', short: '1', v3: { x: 1, y: 2, z: 3 },
      v4: { x: 1, y: 2, z: 3, w: 4 },
      colourb: { type: 'colourb', red: 1, green: 0, blue: 0, alpha: 1 },
      colourf: { type: 'colourf', red: 1, green: 0, blue: 0, alpha: 1 },
    });
  },

  'parameter-validation': function({ child, parent }) {
    child.addEventListener('parameter-validation', event => {
      for (const fallback of [ null, undefined, {}, parent ]) {
        assert.throws(() => event.getParameter('missing', fallback),
          /default|variant/i);
      }
      for (const name of [ 'large', 'infinite', 'nan', 'textOverflow' ]) {
        assert.throws(() => event.getParameter(name, 0n), /integer range/i);
      }
      assert.throws(() => event.getParameter('negative', 2n ** 63n),
        /integer range/i);
      assert.throws(() => event.getParameter(1, 0), /name/i);
      assert.throws(() => event.getParameter('element', ''), /pointer/i);
      const failure = new Error('parameter fallback getter');
      assert.throws(() => event.getParameter('missing', {
        get x() {
          throw failure;
        },
        y: 0,
      }), error => error === failure);
      assert.equal(event.getParameter('missing', 4), 4);
    });
    child.dispatchEvent('parameter-validation', {
      large: 2 ** 63, infinite: Infinity, nan: NaN, negative: -1,
      textOverflow: '9223372036854775808', element: parent,
    });
  },

  'parameter-callback-lifetime': function({ child }) {
    let saved;
    child.addEventListener('parameter-outer', event => {
      saved = event;
      child.dispatchEvent('parameter-inner', { value: 9 });
      assert.equal(event.getParameter('value', 0), 4);
      assert.deepEqual(event.getParameter('missing', {
        get x() {
          child.dispatchEvent('parameter-inner', { value: 9 });
          return 2;
        },
        y: 3,
      }), { x: 2, y: 3 });
    });
    let inner;
    child.addEventListener('parameter-inner', event => {
      inner = event;
      assert.equal(saved.getParameter('value', 0), 4);
      assert.equal(event.getParameter('value', 0), 9);
    });
    child.dispatchEvent('parameter-outer', { value: 4 });
    assert.throws(() => saved.getParameter('value', 0), /expired/i);
    assert.throws(() => inner.getParameter('value', 0), /expired/i);
    assert.equal(saved.parameters.value, 4);
    assert.equal(saved.isType('parameter-outer'), true);
    // Reading an expired helper must not execute default-value accessors.
    let reads = 0;
    assert.throws(() => saved.getParameter('missing', {
      get x() {
        reads++;
        return 0;
      },
      y: 0,
    }), /expired/i);
    assert.equal(reads, 0);
  },

  'getter-receiver-lifetime': function({ child, context }) {
    child.addEventListener('getter-lifetime', () => {
      assert.fail('A destroyed receiver must not dispatch');
    });
    assert.throws(() => child.dispatchEvent('getter-lifetime', {
      vector: {
        get x() {
          context.remove();
          return 1;
        },
        y: 2,
      },
    }), /no longer valid/i);
  },

  'getter-runtime-lifetime': function({ child, rmlui }) {
    assert.throws(() => child.dispatchEvent('getter-shutdown', {
      reference: child,
      vector: {
        get x() {
          rmlui.shutdown();
          return 1;
        },
        y: 2,
      },
    }), /initialised|no longer valid/i);
  },

  'getter-parameter-lifetime': function({ child, context }) {
    const other = context.loadDocumentFromMemory(
      '<rml><head/><body><p/></body></rml>');
    const reference = other.querySelector('p');
    let calls = 0;
    child.addEventListener('getter-parameter', () => calls++);
    assert.throws(() => child.dispatchEvent('getter-parameter', {
      reference,
      vector: {
        get x() {
          other.close();
          context.update();
          child.innerRML = 'The receiver is still live';
          return 1;
        },
        y: 2,
      },
    }), /no longer valid/i);
    assert.equal(calls, 0);
    assert.equal(child.dispatchEvent('getter-parameter', { reference: child }),
      true);
    assert.equal(calls, 1);
  },

  'parameter-dispatch-lifetime': function({ child, context }) {
    const other = context.loadDocumentFromMemory(
      '<rml><head/><body><p/></body></rml>');
    const reference = other.querySelector('p');
    child.addEventListener('parameter-lifetime', event => {
      assert.strictEqual(event.parameters.reference, reference);
      assert.throws(() => {
        other.innerRML = 'cannot destroy a borrowed parameter';
      }, /active/i);
    });
    assert.equal(child.dispatchEvent('parameter-lifetime', { reference }),
      true);
    other.innerRML = 'released after dispatch';
    assert.throws(() => reference.id, /no longer valid/i);
  },

  'getter-error': function({ child }) {
    const failure = new Error('variant accessor failed');
    assert.throws(() => child.dispatchEvent('getter-error', {
      vector: {
        get x() {
          throw failure;
        },
        y: 2,
      },
    }), error => error === failure);
  },

  'snapshot-own-properties': function({ child }) {
    let received;
    child.addEventListener('snapshot-properties', event => {
      received = event.parameters.vector;
    });
    // Adversarial prototype exists only in this child and is restored below.
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Object.prototype, 'x', {
      configurable: true,
      set() {
        throw new Error('Snapshot must not invoke inherited setters');
      },
    });
    try {
      assert.equal(child.dispatchEvent('snapshot-properties', {
        vector: { x: 1, y: 2 },
      }), true);
      assert.deepEqual(received, { x: 1, y: 2 });
    } finally {
      delete Object.prototype.x;
    }
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 200)), 'RmlUi event test');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('events', 240, 200);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 240px; height: 200px; }
section { display: block; width: 200px; height: 150px; }
button { display: block; width: 100px; height: 60px; }
</style></head><body><section><button/></section></body></rml>`);
    document.show();
    context.update();
    cases[name]({
      rmlui, context, document,
      parent: document.querySelector('section'),
      child: document.querySelector('button'),
    });
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
  assert.equal(failures, 0, `${failures} event regressions failed`);
}
