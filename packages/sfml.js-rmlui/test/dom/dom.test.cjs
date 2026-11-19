'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'native-dispatcher-summary-counts-and-detachment':
    function({ context, document }) {
      const element = document.createElement('button');
      assert.equal(element.getEventDispatcherSummary(), '');
      const callback = () => {};
      element.addEventListener('summary', callback);
      element.addEventListener('summary', callback);
      assert.equal(element.getEventDispatcherSummary(), 'summary (1)');
      element.addEventListener('summary', callback, true);
      assert.equal(element.getEventDispatcherSummary(), 'summary (2)');
      const snapshot = element.getEventDispatcherSummary();
      element.removeEventListener('summary', callback);
      assert.equal(element.getEventDispatcherSummary(), 'summary (1)');
      assert.equal(snapshot, 'summary (2)');
      element.removeEventListener('summary', callback, true);
      assert.equal(element.getEventDispatcherSummary(), '');
      element.addEventListener('summary', callback);
      document.appendChild(element);
      document.removeChild(element);
      assert.equal(element.getEventDispatcherSummary(), 'summary (1)');
      document.appendChild(element);
      document.close();
      context.update();
      assert.throws(() => element.getEventDispatcherSummary(), /valid/i);
    },

  'element-model-identity-detachment-replacement-and-query-cost':
    function({ rmlui, context, document }) {
      const first = context.createDataModel('first');
      const second = context.createDataModel('second');
      const roots = [ first, second ].map((_, index) => {
        const root = document.createElement('section');
        root.setAttribute('data-model', index === 0 ? 'first' : 'second');
        root.innerRML = '<div id="model-child"/>';
        document.appendChild(root);
        return root;
      });
      const child = roots[0].querySelector('div');
      assert.equal(document.getDataModel(), null);
      assert.equal(child.getDataModel(), first);
      assert.equal(roots[1].getDataModel(), second);
      const native = require('../../build/Release/rmlui.node');
      context.update();
      native.beginDataDiagnostics(false);
      let counts;
      try {
        for (let index = 0; index < 1000; ++index) {
          assert.equal(child.getDataModel(), first);
        }
      } finally {
        counts = native.endDataDiagnostics();
      }
      assert.equal(counts.runtimeEntries, 1000);
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
      assert.equal(counts.ownershipInstanceVisits, 0);
      roots[0].removeChild(child);
      assert.equal(child.getDataModel(), null);
      roots[1].appendChild(child);
      assert.equal(child.getDataModel(), second);
      assert.equal(context.removeDataModel('second'), true);
      assert.equal(child.getDataModel(), null);
      assert.equal(second.isValid, false);
      const replacement = context.createDataModel('second');
      assert.notEqual(replacement, second);
      document.removeChild(roots[1]);
      document.appendChild(roots[1]);
      assert.equal(child.getDataModel(), replacement);
      assert.ok(child.getDataModel() instanceof rmlui.DataModelConstructor);
      const retained = child.getDataModel();
      document.close();
      context.update();
      assert.throws(() => child.getDataModel(), /valid/i);
      assert.equal(retained.isValid, true);
      rmlui.shutdown();
      assert.equal(retained.isValid, false);
    },

  'id-search-document-breadth-first-and-selector-descendant-order':
    function({ context, document }) {
      const parent = document.getElementById('parent');
      parent.innerRML = '<section><button id="duplicate"/></section>';
      const nested = parent.querySelector('#duplicate');
      const outside = document.createElement('aside');
      outside.id = 'outside';
      outside.innerRML = '<button id="duplicate"/>';
      document.appendChild(outside);
      const shallow = outside.querySelector('#duplicate');
      assert.equal(parent.getElementById('outside'), outside);
      assert.equal(parent.querySelector('#outside'), null);
      assert.equal(parent.querySelector('#parent'), null);
      assert.equal(parent.getElementById('duplicate'), shallow);
      assert.equal(document.getElementById('duplicate'), shallow);
      assert.equal(document.querySelector('#duplicate'), nested);
      assert.equal(parent.getElementById('#self'), parent);
      assert.equal(parent.getElementById('#parent'), document);
      assert.equal(parent.getElementById('#document'), document);
      assert.equal(parent.getElementById('missing'), null);
      assert.equal(parent.querySelector('.missing'), null);
      assert.equal(parent.querySelector(''), null);
      assert.throws(() => parent.getElementById(42), /id/i);
      assert.throws(() => parent.querySelector(42), /selector/i);
      document.close();
      context.update();
      assert.throws(() => parent.getElementById('#self'), /valid/i);
      assert.throws(() => parent.querySelector('button'), /valid/i);
    },

  'detached-id-search-starts-at-receiver-and-excludes-non-dom-children':
    function({ document }) {
      const root = document.createElement('section');
      root.id = 'root';
      const child = document.createElement('div');
      child.id = 'child';
      root.appendChild(child);
      const hidden = document.createElement('span');
      hidden.id = 'hidden';
      root.appendChild(hidden, false);
      assert.equal(root.getElementById('root'), root);
      assert.equal(root.getElementById('child'), child);
      assert.equal(child.getElementById('root'), null);
      assert.equal(child.getElementById('child'), child);
      assert.equal(root.querySelector('#root'), null);
      assert.equal(root.querySelector('#child'), child);
      assert.equal(root.getElementById('hidden'), null);
      assert.equal(root.querySelector('#hidden'), null);
      assert.equal(root.getElementById('#document'), null);
      assert.equal(root.getElementById('#parent'), null);
      assert.equal(child.getElementById('#parent'), root);
      root.removeChild(child);
      assert.equal(root.getElementById('child'), null);
      assert.equal(child.getElementById('#parent'), null);
      assert.equal(child.getElementById('#self'), child);
    },

  'transfer-and-query': function({ document }) {
    const parent = document.querySelector('#parent');
    const a = document.createElement('div');
    const b = document.createElement('div');
    a.id = 'a';
    b.id = 'b';
    a.setClass('item', true);
    assert.equal(a.getParentNode(), null);
    assert.equal(a.getOwnerDocument(), null);
    assert.strictEqual(parent.appendChild(a), a);
    assert.strictEqual(parent.insertBefore(b, a), b);
    assert.strictEqual(a.getOwnerDocument(), document);
    assert.strictEqual(a.getParentNode(), parent);
    assert.strictEqual(a.getPreviousSibling(), b);
    assert.strictEqual(b.getNextSibling(), a);
    assert.strictEqual(parent.getFirstChild(), b);
    assert.strictEqual(parent.getLastChild(), a);
    assert.equal(parent.getNumChildren(), 2);
    assert.equal(parent.hasChildNodes(), true);
    assert.equal(parent.contains(a), true);
    assert.equal(a.contains(a), true);
    assert.equal(a.contains(null), false);
    assert.equal(a.matches('div.item#a'), true);
    assert.strictEqual(a.closest('#parent'), parent);
    assert.equal(parent.closest('#parent'), null);
    assert.deepEqual(parent.getElementsByTagName('div'), [ b, a ]);
    assert.deepEqual(parent.getElementsByClassName('item'), [ a ]);
    const snapshot = parent.querySelectorAll('div');
    assert.strictEqual(parent.removeChild(a), a);
    assert.deepEqual(snapshot, [ b, a ]);
    assert.equal(a.getParentNode(), null);
    assert.equal(a.getOwnerDocument(), null);
    assert.equal(parent.removeChild(a), null);
    assert.strictEqual(parent.replaceChild(a, b), b);
    assert.strictEqual(parent.getChild(0), a);
    assert.equal(b.getParentNode(), null);
    assert.equal(parent.replaceChild(b, null), null);
    assert.deepEqual(parent.querySelectorAll('div'), [ a, b ]);
    for (const index of [ -1, 2, 999 ]) {
      assert.equal(parent.getChild(index), null);
    }
    assert.throws(() => parent.getChild(0.5), /index/i);
  },

  'clone-text-non-dom': function({ document }) {
    const parent = document.querySelector('#parent');
    const source = document.createElement('section');
    source.id = 'source';
    source.setClass('manual', true);
    source.setProperty('color', '#112233');
    const text = document.createTextNode('Hello <world> & 世界');
    assert.strictEqual(source.appendChild(text), text);
    let originalCalls = 0;
    source.addEventListener('probe', () => originalCalls++);
    const clone = source.clone();
    assert.notStrictEqual(clone, source);
    assert.equal(clone.id, 'source');
    assert.equal(clone.isClassSet('manual'), true);
    assert.equal(clone.innerRML, source.innerRML);
    assert.equal(clone.getParentNode(), null);
    clone.dispatchEvent('probe');
    assert.equal(originalCalls, 0);
    const hidden = document.createElement('div');
    parent.appendChild(hidden, false);
    assert.equal(parent.hasChildNodes(), false);
    assert.equal(parent.getFirstChild(), null);
    assert.equal(parent.getNumChildren(), 0);
    assert.equal(parent.getNumChildren(true), 1);
    assert.strictEqual(parent.getChild(0), hidden);
    parent.insertBefore(clone, hidden);
    assert.equal(parent.getNumChildren(), 0);
    assert.equal(parent.getNumChildren(true), 2);
    parent.appendChild(source);
    assert.strictEqual(parent.getFirstChild(), source);
    assert.strictEqual(parent.getLastChild(), source);
    assert.strictEqual(parent.removeChild(hidden), hidden);
  },

  'non-dom-siblings': function({ document }) {
    const parent = document.createElement('div');
    const hidden = document.createElement('div');
    parent.appendChild(hidden, false);
    parent.appendChild(document.createElement('span'), false);
    assert.equal(hidden.getNextSibling(), null);
    assert.equal(hidden.getPreviousSibling(), null);
  },

  'native-internal-ownership': async function({ document }) {
    const input = document.createElement('input');
    input.setAttribute('type', 'text');
    const internal = input.getChild(0);
    assert.ok(internal);
    assert.throws(() => input.removeChild(internal), /internal.*non-DOM/i);
    const replacement = document.createElement('div');
    assert.throws(() => input.replaceChild(replacement, internal),
      /internal.*non-DOM/i);
    assert.equal(replacement.getParentNode(), null);
    let extra = document.createElement('span');
    input.appendChild(extra, false);
    const index = input.getNumChildren(true) - 1;
    const weak = new WeakRef(extra);
    // The native parent, rather than a JS wrapper, owns this added child.
    document.appendChild(input);
    extra = null;
    await collect();
    assert.equal(weak.deref(), undefined);
    extra = input.getChild(index);
    assert.strictEqual(input.removeChild(extra), extra);
    input.setAttribute('value', 'native internal references remain live');
  },

  'invalid-ownership': function({ rmlui, context, document }) {
    const parent = document.querySelector('#parent');
    const child = document.createElement('div');
    parent.appendChild(child);
    assert.throws(() => parent.appendChild(child), /detached/i);
    assert.throws(() => child.appendChild(document), /cycle/i);
    assert.throws(() => context.getRootElement().appendChild(
      document.createElement('div')), /context root/i);
    assert.throws(() => {
      context.getRootElement().innerRML = '';
    }, /context root/i);
    parent.removeChild(child);
    child.appendChild(document.createElement('b'));
    assert.throws(() => child.getFirstChild().appendChild(child), /cycle/i);
    assert.throws(() => child.appendChild(child), /cycle/i);
    const other = rmlui.createContext('other', 100, 100);
    const otherDocument = other.loadDocumentFromMemory(
      '<rml><head/><body><div id="other"/></body></rml>');
    const otherChild = otherDocument.querySelector('#other');
    assert.throws(() => parent.appendChild(otherChild), /detached/i);
    assert.equal(parent.removeChild(otherChild), null);
    otherDocument.removeChild(otherChild);
    assert.strictEqual(parent.appendChild(otherChild), otherChild);
    assert.strictEqual(otherChild.getOwnerDocument(), document);
    other.remove();
    assert.equal(otherChild.id, 'other');
  },

  'context-root-attributes': function({ context }) {
    const root = context.getRootElement();
    root.setAttribute('role', 'application');
    assert.equal(root.getAttribute('role'), 'application');
    root.removeAttribute('role');
    assert.equal(root.getAttribute('role'), null);
  },

  'reentry-protection': function({ document }) {
    const parent = document.querySelector('#parent');
    const target = document.createElement('button');
    const parameter = document.createElement('div');
    parent.appendChild(target);
    parent.appendChild(parameter);
    target.addEventListener('probe', () => {
      assert.throws(() => parent.removeChild(target), /active|callback/i);
      assert.throws(() => parent.removeChild(parameter), /active|callback/i);
      const replacement = document.createElement('div');
      assert.throws(() => parent.replaceChild(replacement, target),
        /active|callback/i);
      assert.equal(replacement.getParentNode(), null);
      const unrelated = document.createElement('aside');
      parent.appendChild(unrelated);
      assert.strictEqual(parent.removeChild(unrelated), unrelated);
    });
    target.dispatchEvent('probe', { parameter });
    assert.strictEqual(target.getParentNode(), parent);
    assert.strictEqual(parameter.getParentNode(), parent);
  },

  'getter-invalidates-receiver': function({ context, document }) {
    const parent = document.querySelector('#parent');
    const node = document.createElement('div');
    const argument = {
      get handle() {
        document.close();
        context.update();
        return node.handle;
      },
    };
    assert.throws(() => parent.appendChild(argument), /no longer valid/i);
    assert.equal(node.getParentNode(), null);
    assert.equal(node.tagName, 'div');
  },

  'listeners-survive-transfer': async function({ document }) {
    const parent = document.querySelector('#parent');
    let child = document.createElement('div');
    let calls = 0;
    child.addEventListener('probe', () => calls++);
    parent.appendChild(child);
    const weak = new WeakRef(child);
    child = null;
    await collect();
    assert.equal(weak.deref(), undefined);
    child = parent.getChild(0);
    child.dispatchEvent('probe');
    assert.equal(calls, 1);
    parent.removeChild(child);
    await collect();
    child.dispatchEvent('probe');
    assert.equal(calls, 2);
    parent.appendChild(child);
    child.dispatchEvent('probe');
    assert.equal(calls, 3);
    parent.innerRML = '';
    assert.throws(() => child.dispatchEvent('probe'), /no longer valid/i);
  },

  'detached-descendant-retains-tree': async function({ document }) {
    let root = document.createElement('div');
    root.id = 'detached';
    const child = document.createElement('b');
    root.appendChild(child);
    root = null;
    await collect();
    assert.equal(child.getParentNode().id, 'detached');
    document.appendChild(child.getParentNode());
    assert.strictEqual(child.getOwnerDocument(), document);
  },

  'detached-callback-cycle-collected': async function({ document }) {
    const weak = (() => {
      const root = document.createElement('div');
      const child = document.createElement('button');
      root.appendChild(child);
      const callback = () => {
        root.id = child.id;
      };
      child.addEventListener('probe', callback);
      document.appendChild(root);
      document.removeChild(root);
      return [ new WeakRef(root), new WeakRef(child), new WeakRef(callback) ];
    })();
    await collect();
    assert.ok(weak.every(reference => reference.deref() === undefined));
  },

  'detached-control-listener-release': async function({ document }) {
    const root = document.createElement('input');
    root.setAttribute('type', 'text');
    assert.ok(root.getNumChildren(true) > 0);
    const weak = (() => {
      const child = root.getChild(0);
      const payload = { value: 1 };
      const callback = () => payload.value;
      child.addEventListener('probe', callback);
      return [ new WeakRef(callback), new WeakRef(payload) ];
    })();
    root.setAttribute('type', 'checkbox');
    assert.equal(root.getNumChildren(true), 0);
    await collect();
    assert.ok(weak.every(reference => reference.deref() === undefined));
    assert.equal(root.tagName, 'input');
  },

  'detached-shutdown': function({ rmlui, document }) {
    const root = document.createElement('div');
    const child = document.createTextNode('still native-owned');
    root.appendChild(child);
    rmlui.shutdown();
    assert.throws(() => root.tagName, /not initialised|no longer valid/i);
    assert.throws(() => child.tagName, /not initialised|no longer valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 160)), 'DOM ownership');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('dom', 240, 160);
  const document = context.loadDocumentFromMemory(
    '<rml><head/><body><div id="parent"/></body></rml>');
  try {
    await cases[name]({ rmlui, context, document });
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
      [ '--expose-gc', __filename, name ], {
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
  assert.equal(failures, 0, `${failures} DOM regressions failed`);
}
