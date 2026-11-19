'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'numeric-listener-identity': function({ rmlui, input }) {
    assert.ok(rmlui.EventId, 'EventId must expose the pinned native constants');
    const calls = [];
    const listener = event => calls.push([ event.id, event.type ]);
    input.addEventListener('click', listener);
    input.addEventListener(rmlui.EventId.Click, listener);
    input.dispatchEvent(rmlui.EventId.Click);
    assert.deepEqual(calls, [[ 11, 'click' ]]);
    input.removeEventListener(rmlui.EventId.Click, listener);
    input.dispatchEvent('click');
    assert.equal(calls.length, 1);
    input.addEventListener(rmlui.EventId.Click, listener);
    input.removeEventListener('click', listener);
    input.dispatchEvent(rmlui.EventId.Click);
    assert.equal(calls.length, 1);
    for (const id of [ -1, 0, 0.5, 65535, 100000, NaN, Infinity ]) {
      assert.throws(() => input.dispatchEvent(id), /event.*id/i);
      assert.throws(() => input.addEventListener(id, listener), /event.*id/i);
      assert.throws(() => input.removeEventListener(id, listener),
        /event.*id/i);
    }
  },

  'custom-replacement': function({ rmlui, input, document }) {
    assert.equal(typeof rmlui.registerEventType, 'function');
    const id = rmlui.registerEventType('custom-toggle', false, false);
    assert.ok(id >= rmlui.EventId.FirstCustomId);
    const calls = [];
    input.addEventListener(id, event => {
      calls.push('target');
      event.stopPropagation();
    });
    document.addEventListener('custom-toggle', () => calls.push('bubble'));
    assert.equal(input.dispatchEvent(id), true);
    assert.deepEqual(calls, [ 'target' ]);
    assert.equal(rmlui.registerEventType('custom-toggle', true, true), id);
    assert.equal(input.dispatchEvent('custom-toggle'), false);
    assert.deepEqual(calls, [ 'target', 'target' ]);
    assert.equal(rmlui.registerEventType('custom-toggle', false, true), id);
    assert.equal(input.dispatchEvent(id), true);
    assert.deepEqual(calls, [ 'target', 'target', 'target', 'bubble' ]);
    assert.equal(input.dispatchEvent(id, {}, {
      interruptible: true, bubbles: false,
    }), false);
  },

  'built-in-default-action': function({ rmlui, input }) {
    assert.equal(typeof rmlui.registerEventType, 'function');
    const id = rmlui.registerEventType(
      'click', false, false, rmlui.DefaultActionPhase.None);
    assert.equal(id, rmlui.EventId.Click);
    const stop = event => event.stopPropagation();
    input.addEventListener(id, stop);
    assert.equal(input.dispatchEvent(id), false);
    assert.equal(input.getAttribute('checked'), null);
    input.removeEventListener('click', stop);
    assert.equal(input.dispatchEvent(id), true);
    assert.notEqual(input.getAttribute('checked'), null);
    input.addEventListener(id, stop);
    assert.equal(input.dispatchEvent(id, {}, {
      interruptible: false, bubbles: false,
    }), true);
    assert.equal(input.getAttribute('checked'), null);
  },

  'default-action-phases': function({ rmlui, document }) {
    assert.ok(rmlui.EventId);
    const child = document.querySelector('span');
    const parent = document.querySelector('section');
    const parameters = { mouse_x: 2, mouse_y: 2, button: 0 };
    child.dispatchEvent(rmlui.EventId.Mousemove, parameters);
    assert.equal(document.querySelector(':hover'), null);
    child.dispatchEvent(rmlui.EventId.Mouseover, parameters);
    assert.strictEqual(document.querySelector('span:hover'), child);
    assert.equal(document.querySelector('section:hover'), null);
    child.dispatchEvent(rmlui.EventId.Mousedown, parameters);
    assert.strictEqual(document.querySelector('span:active'), child);
    assert.strictEqual(document.querySelector('section:active'), parent);
    assert.throws(() => rmlui.registerEventType('bad', true, true, 1),
      /default.*phase/i);
  },

  'context-listeners': function({ rmlui, context, input }) {
    assert.equal(typeof context.getRootElement, 'function');
    const root = context.getRootElement();
    const calls = [];
    const listener = event => {
      assert.strictEqual(event.currentTarget, root);
      assert.strictEqual(event.target, input);
      calls.push(event.phase);
    };
    context.addEventListener(rmlui.EventId.Click, listener, true);
    root.addEventListener('click', listener, true);
    context.addEventListener('click', listener);
    input.click();
    assert.deepEqual(calls, [ 1, 4 ]);
    context.removeEventListener('click', listener, true);
    context.removeEventListener(rmlui.EventId.Click, listener);
    input.click();
    assert.deepEqual(calls, [ 1, 4 ]);
    context.remove();
    assert.throws(() => root.click(), /no longer valid/i);
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 160)), 'Event registration');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('registration', 240, 160);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 240px; height: 160px; }
section, span { display: block; width: 100px; height: 60px; }
</style></head><body>
<section><span/></section><input type="checkbox"/>
</body></rml>`);
    document.show();
    context.update();
    cases[name]({
      rmlui, context, document, input: document.querySelector('input'),
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
  assert.equal(failures, 0,
    `${failures} event registration regressions failed`);
}
