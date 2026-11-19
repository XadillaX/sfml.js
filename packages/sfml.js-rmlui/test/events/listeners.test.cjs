'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'shared-callback': function({ a, b, click }) {
    const calls = [];
    const callback = event => calls.push(event.targetId);
    a.addEventListener('click', callback);
    b.addEventListener('click', callback);
    b.removeEventListener('click', callback);
    click(30);
    click(130);
    assert.deepEqual(calls, [ 'a' ]);
  },

  'wrong-capture': function({ a, click }) {
    let calls = 0;
    const callback = () => calls++;
    a.addEventListener('click', callback);
    a.removeEventListener('click', callback, true);
    click(30);
    assert.equal(calls, 1);
  },

  'unmatched-removal': function({ a, b, click }) {
    let calls = 0;
    const callback = () => calls++;
    a.addEventListener('click', callback);
    b.removeEventListener('click', callback);
    a.removeEventListener('mousedown', callback);
    a.removeEventListener('click', () => {});
    click(30);
    assert.equal(calls, 1);
    a.removeEventListener('click', callback);
    a.removeEventListener('click', callback);
    click(30);
    assert.equal(calls, 1);
  },

  'duplicate-add': function({ a, document, click }) {
    let calls = 0;
    const callback = () => calls++;
    a.addEventListener('click', callback);
    document.querySelector('#a').addEventListener('click', callback);
    click(30);
    assert.equal(calls, 1);
    a.removeEventListener('click', callback);
    click(30);
    assert.equal(calls, 1);
  },

  'distinct-capture': function({ a, click }) {
    let calls = 0;
    const callback = () => calls++;
    a.addEventListener('click', callback);
    a.addEventListener('click', callback, true);
    a.removeEventListener('click', callback, true);
    click(30);
    assert.equal(calls, 1);
  },

  'dispatch-removal': function({ a, click }) {
    const calls = [];
    const later = () => calls.push('later');
    const first = () => {
      calls.push('first');
      a.removeEventListener('click', first);
      a.removeEventListener('click', later);
    };
    a.addEventListener('click', first);
    a.addEventListener('click', later);
    click(30);
    click(30);
    assert.deepEqual(calls, [ 'first' ]);
  },

  'callback-exception': function({ a, click }) {
    const failure = new Error('listener failure');
    const throwing = () => {
      throw failure;
    };
    let laterCalls = 0;
    a.addEventListener('click', throwing);
    a.addEventListener('click', () => laterCalls++);
    assert.throws(() => click(30), error => error === failure);
    assert.equal(laterCalls, 0, 'no callbacks after an uncaught exception');
    a.removeEventListener('click', throwing);
    click(30);
    assert.equal(laterCalls, 1, 'exception state is cleared at JS boundary');
  },

  'callback-mutations': function({ a, b, document, click }) {
    let calls = 0;
    a.addEventListener('click', () => {
      calls++;
      a.setClass('selected', true);
      assert.equal(a.isClassSet('selected'), true);
      assert.equal(a.setProperty('opacity', '0.5'), true);
      a.removeProperty('opacity');
      a.setAttribute('data-count', calls);
      assert.equal(a.getAttribute('data-count'), String(calls));
      a.removeAttribute('data-count');
      assert.equal(a.getAttribute('data-count'), null);
      document.title = 'Clicked';
      assert.equal(document.title, 'Clicked');
      b.innerRML = `<span id="count">${calls}</span>`;
      assert.equal(b.getElementById('count').innerRML, String(calls));
    });
    click(30);
    const oldCount = b.getElementById('count');
    click(30);
    assert.equal(calls, 2);
    assert.throws(() => oldCount.id, /no longer valid/i);
    assert.equal(b.getElementById('count').innerRML, '2');
  },

  'input-type-reentry': function({ context, document, click }) {
    document.innerRML = `
<input id="input" type="text"
  style="position: absolute; left: 10px; top: 10px;
    width: 150px; height: 60px;"/>
<input id="other" type="text" style="display: none;"/>`;
    const input = document.getElementById('input');
    const other = document.getElementById('other');
    let calls = 0;
    input.addEventListener('change', () => {
      calls++;
      assert.throws(() => input.setAttribute('type', 'checkbox'), /callback/i);
      assert.throws(() => input.removeAttribute('type'), /callback/i);
      assert.equal(input.getAttribute('type'), 'text');
      input.setAttribute('data-count', calls);
      other.setAttribute('type', 'checkbox');
      assert.equal(other.getAttribute('type'), 'checkbox');
    });
    context.update();
    click(30);
    context.processEvent({ kind: 'TextEntered', unicode: 65 });
    context.processEvent({ kind: 'TextEntered', unicode: 66 });
    assert.equal(calls, 2);
    assert.equal(input.getAttribute('value'), 'AB');
    assert.equal(input.getAttribute('data-count'), '2');
    input.setAttribute('type', 'checkbox');
    assert.equal(input.getAttribute('type'), 'checkbox');
    input.removeAttribute('type');
    context.update();
  },

  'destructive-reentry': function({
    rmlui, window, context, document, a, click,
  }) {
    let calls = 0;
    const operations = [
      () => rmlui.shutdown(),
      () => rmlui.initialise(window),
      () => context.remove(),
      () => context.update(),
      () => document.close(),
      () => document.unload(),
      () => {
        document.innerRML = '<div/>';
      },
    ];
    a.addEventListener('click', () => {
      for (const operation of operations) {
        assert.throws(operation, /callback/i);
      }
      assert.equal(a.id, 'a', 'rejection happens before mutation');
      calls++;
    });
    click(30);
    click(30);
    assert.equal(calls, 2);
    assert.equal(context.update(), true);
  },
};

// Finish this synchronous frame before GC: an async frame can retain the last
// loop's callback and payload even when no native registration exists.
function trackCallbacks(element, removeImmediately) {
  const refs = [];
  for (let i = 0; i < 12; i++) {
    const payload = { bytes: new Uint8Array(1024), i };
    const callback = () => payload.i;
    refs.push(new WeakRef(callback), new WeakRef(payload));
    element.addEventListener('click', callback);
    if (removeImmediately) {
      element.removeEventListener('click', callback);
    }
  }
  return refs;
}

const disposalMethods = [
  'remove', 'subtree', 'close', 'unload', 'context', 'shutdown',
];
for (const disposal of disposalMethods) {
  cases[`callback-release-${disposal}`] = async ({
    rmlui, context, document, a,
  }) => {
    const refs = trackCallbacks(a, disposal === 'remove');
    if (disposal === 'subtree') {
      document.innerRML = '<div/>';
    }
    if (disposal === 'close' || disposal === 'unload') {
      document[disposal]();
      context.update();
    }
    if (disposal === 'context') {
      context.remove();
    }
    if (disposal === 'shutdown') {
      rmlui.shutdown();
    }
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(refs.filter(ref => ref.deref() !== undefined).length, 0,
      'all callback functions and captured payloads must be collectible');
  };
}

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 200)), 'RmlUi listener test');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('listeners', 240, 200);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 240px; height: 200px; }
div {
  display: block; position: absolute; top: 10px; width: 70px; height: 70px;
}
#a { left: 10px; } #b { left: 110px; }
</style></head><body><div id="a"/><div id="b"/></body></rml>`);
    document.show();
    context.update();
    const click = x => {
      const position = { x, y: 30 };
      context.processEvent({ kind: 'MouseMoved', position });
      for (const kind of [ 'MouseButtonPressed', 'MouseButtonReleased' ]) {
        context.processEvent({ kind, button: 0, position });
      }
    };
    await cases[name]({
      rmlui, window, context, document, click,
      a: document.getElementById('a'),
      b: document.getElementById('b'),
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
  assert.equal(failures, 0, `${failures} listener regressions failed`);
}
