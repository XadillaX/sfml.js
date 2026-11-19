'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let index = 0; index < 10; ++index) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'original-demo-root-to-sandbox': ({ context, outer }) => {
    const sandbox = outer.getElementById('sandbox_target');
    const iframe = context.createDocument();
    assert.equal(context.getNumDocuments(), 2);
    const root = iframe.getParentNode();
    assert.equal(root, context.getRootElement());
    assert.equal(root.removeChild(iframe), iframe);
    assert.equal(iframe.getParentNode(), null);
    assert.equal(iframe.getContext(), context);
    assert.equal(iframe.getOwnerDocument(), iframe);
    assert.equal(context.getNumDocuments(), 1);
    assert.equal(sandbox.appendChild(iframe), iframe);
    iframe.innerRML = '<div id="inside"/>';
    const inside = iframe.getElementById('inside');
    assert.equal(inside.getOwnerDocument(), iframe);
    assert.equal(inside.getContext(), context);
    iframe.updateDocument();
    context.update();
    iframe.close();
    context.update();
    assert.equal(iframe.getParentNode(), sandbox);
    assert.equal(context.getNumDocuments(), 1);
    outer.close();
    context.update();
    assert.throws(() => iframe.getContext(), /no longer valid/i);
    assert.throws(() => inside.getContext(), /no longer valid/i);
    assert.equal(context.getNumDocuments(), 0);
  },

  'document-root-reattachment-and-insertion-order': ({ context, outer }) => {
    const root = context.getRootElement();
    const first = context.createDocument();
    const second = context.createDocument();
    root.removeChild(first);
    first.close();
    context.update();
    assert.equal(first.getContext(), context);
    assert.equal(context.getNumDocuments(), 2);
    assert.equal(root.insertBefore(first, outer), first);
    assert.equal(context.getDocument(0), first);
    root.removeChild(second);
    assert.equal(root.replaceChild(second, first), first);
    assert.equal(context.getDocument(0), second);
    assert.equal(first.getParentNode(), null);
    first.close();
    assert.equal(root.appendChild(first), first);
    first.close();
    context.update();
    assert.throws(() => first.getContext(), /no longer valid/i);
    assert.equal(context.getNumDocuments(), 2);
  },

  'detached-document-context-teardown': async ({ context }) => {
    let document = context.createDocument();
    document.innerRML = '<button id="child"/>';
    const child = document.getElementById('child');
    context.getRootElement().removeChild(document);
    const alias = child.getOwnerDocument();
    document = null;
    await collect();
    assert.equal(child.getOwnerDocument(), alias);
    context.remove();
    assert.throws(() => alias.getContext(), /no longer valid/i);
    assert.throws(() => child.getContext(), /no longer valid/i);
  },

  'detached-host-releases-nested-document-before-context':
    async ({ context, outer }) => {
      const host = outer.getElementById('sandbox_target');
      let iframe = context.createDocument();
      context.getRootElement().removeChild(iframe);
      host.appendChild(iframe);
      iframe.innerRML = '<button id="inside"/>';
      iframe = null;
      await collect();
      outer.removeChild(host);
      outer.close();
      context.update();
      assert.equal(host.getFirstChild().getContext(), context);
      context.remove();
      assert.throws(() => host.getFirstChild(), /no longer valid/i);
    },

  'nested-document-tree-cannot-cross-contexts': ({ rmlui, context, outer }) => {
    const host = outer.getElementById('sandbox_target');
    const iframe = context.createDocument();
    const root = context.getRootElement();
    root.removeChild(iframe);
    assert.throws(() => root.appendChild(iframe, false), /DOM children/i);
    assert.equal(iframe.getParentNode(), null);
    host.appendChild(iframe);
    outer.removeChild(host);
    const other = rmlui.createContext('other', 240, 160);
    const foreign = other.createDocument();
    assert.throws(() => foreign.appendChild(host), /context/i);
    assert.equal(host.getParentNode(), null);
    assert.equal(iframe.getContext(), context);
    assert.equal(outer.appendChild(host), host);
    other.remove();
    assert.equal(iframe.getContext(), context);
  },

  'repeated-document-detachment-and-listener-identity':
    ({ context, outer }) => {
      const root = context.getRootElement();
      const host = outer.getElementById('sandbox_target');
      const iframe = context.createDocument();
      iframe.innerRML = '<button id="target"/>';
      const target = iframe.getElementById('target');
      let calls = 0;
      target.addEventListener('probe', () => ++calls);
      for (let index = 0; index < 100; ++index) {
        assert.equal(root.removeChild(iframe), iframe);
        assert.equal(host.appendChild(iframe), iframe);
        target.dispatchEvent('probe');
        assert.equal(host.removeChild(iframe), iframe);
        assert.equal(root.appendChild(iframe), iframe);
      }
      assert.equal(calls, 100);
      context.remove();
      assert.throws(() => target.dispatchEvent('probe'), /no longer valid/i);
    },

  'document-transfer-callback-target-and-active-tree-guards':
    ({ context, outer }) => {
      const iframe = context.createDocument();
      const root = context.getRootElement();
      iframe.innerRML = '<button id="target"/>';
      const target = iframe.getElementById('target');
      target.addEventListener('probe', () => {
        assert.throws(() => iframe.getParentNode().removeChild(iframe),
          /active|callback/i);
      });
      target.dispatchEvent('probe');
      assert.equal(iframe.getParentNode(), root);
      root.removeChild(iframe);
      outer.getElementById('sandbox_target').appendChild(iframe);
      target.dispatchEvent('probe');
    },

  'document-transfer-context-root-cycle-and-debugger-guards':
    ({ rmlui, context, outer }) => {
      const root = context.getRootElement();
      const iframe = context.createDocument();
      const sandbox = outer.getElementById('sandbox_target');
      assert.throws(() => sandbox.appendChild(iframe), /detached/i);
      root.removeChild(iframe);
      const other = rmlui.createContext('other', 240, 160);
      const otherDocument = other.createDocument();
      assert.throws(() => otherDocument.appendChild(iframe), /context/i);
      assert.throws(() => root.appendChild(outer.createElement('div')),
        /context root/i);
      assert.throws(() => iframe.appendChild(root), /context root/i);
      assert.throws(() => iframe.appendChild(iframe), /cycle/i);
      iframe.innerRML = '<div id="inside"/>';
      assert.throws(() => iframe.getElementById('inside').appendChild(iframe),
        /cycle/i);
      assert.equal(sandbox.appendChild(iframe), iframe);
      assert.ok(rmlui.Debugger.initialise(context));
      const internal = Array.from({ length: context.getNumDocuments() },
        (_, index) => context.getDocument(index))
        .filter(document => document !== outer);
      assert.ok(internal.length > 0);
      for (const document of internal) {
        assert.throws(() => root.removeChild(document), /Debugger/i);
      }
      rmlui.Debugger.shutdown();
      other.remove();
    },

  'detached-document-callback-cycle-collection': async ({ context }) => {
    const weak = (() => {
      const document = context.createDocument();
      document.innerRML = '<button id="target"/>';
      const child = document.getElementById('target');
      const callback = () => {
        document.id = child.id;
      };
      child.addEventListener('probe', callback);
      context.getRootElement().removeChild(document);
      return [ document, child, callback ].map(value => new WeakRef(value));
    })();
    await collect();
    assert.ok(weak.every(reference => reference.deref() === undefined));
    context.remove();
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 160)), 'Document transfer');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('documents', 240, 160);
  const outer = context.loadDocumentFromMemory(
    '<rml><head/><body><div id="sandbox_target"/></body></rml>');
  try {
    await cases[name]({ rmlui, context, outer });
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
    if (result.status === 0) {
      console.log(`PASS ${name}`);
    } else {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    }
  }
  assert.equal(failures, 0, `${failures} document transfer regressions failed`);
}
