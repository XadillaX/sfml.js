'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'document-stream-creates-owned-document-without-context-insertion':
    ({ rmlui, context }) => {
      const stream = new rmlui.StreamMemory(Buffer.from(
        '<rml><head><title>独立</title><style>' +
        'body { width: 91px; }</style></head>' +
        '<body id="standalone"><input id="field" value="原生"/></body></rml>'));
      stream.setSourceURL('local/document.rml');
      const document = rmlui.Factory.instanceDocumentStream(
        context, stream, 'body');
      assert.ok(document instanceof rmlui.Document);
      assert.equal(document.title, '独立');
      assert.equal(document.sourceURL, 'local/document.rml');
      assert.equal(document.getContext(), context);
      assert.equal(document.getParentNode(), null);
      assert.equal(context.getNumDocuments(), 0);
      assert.equal(document.getElementById('field').getValue(), '原生');
      document.updateDocument();
      assert.equal(document.getComputedValues().width.value, 91);
      assert.equal(stream.tell(), stream.length());
    },

  'document-stream-native-instancer-subtype-failure-and-custom-tag':
    ({ rmlui, context }) => {
      const body = rmlui.Factory.getElementInstancer('body');
      rmlui.Factory.registerElementInstancer('panel',
        new rmlui.ElementInstancer((parent, tag, attributes) =>
          body.instanceElement(parent, tag, attributes)));
      const source = () => new rmlui.StreamMemory(Buffer.from(
        '<rml><head/><body id="custom"/></rml>'));
      const document = rmlui.Factory.instanceDocumentStream(
        context, source(), 'panel');
      assert.equal(document.tagName, 'panel');
      assert.equal(document.id, 'custom');
      assert.equal(rmlui.Factory.instanceDocumentStream(
        context, source(), 'div'), null);
      rmlui.Factory.registerElementInstancer('disabled', null);
      assert.equal(rmlui.Factory.instanceDocumentStream(
        context, source(), 'disabled'), null);
      assert.throws(() => rmlui.Factory.instanceDocumentStream(
        context, source(), 4), /string/i);
      assert.throws(() => rmlui.Factory.instanceDocumentStream(
        {}, source(), 'body'), /context|handle/i);
    },

  'document-stream-removal-invalidates-owned-document-and-descendants':
    ({ rmlui, context }) => {
      const document = rmlui.Factory.instanceDocumentStream(context,
        new rmlui.StreamMemory(Buffer.from(
          '<rml><head/><body><div id="child"/></body></rml>')), 'body');
      const child = document.getElementById('child');
      const name = context.name;
      assert.equal(rmlui.removeContext(name), true);
      assert.throws(() => document.title, /valid/i);
      assert.throws(() => child.id, /valid/i);
      const replacement = rmlui.createContext(name, 160, 120);
      assert.equal(replacement.getNumDocuments(), 0);
      assert.throws(() => document.getContext(), /valid/i);
    },

  'document-stream-owned-subtree-retention-and-cycles':
    async ({ rmlui, context }) => {
      let child;
      let weak;
      (() => {
        const document = rmlui.Factory.instanceDocumentStream(context,
          new rmlui.StreamMemory(Buffer.from(
            '<rml><head/><body><div id="child"/></body></rml>')), 'body');
        weak = new WeakRef(document);
        child = document.getElementById('child');
        child.addEventListener('own', () => assert.ok(document));
      })();
      await collect();
      assert.ok(weak.deref());
      child.dispatchEvent('own');
      child = null;
      await collect();
      assert.equal(weak.deref(), undefined);
      assert.equal(context.getNumDocuments(), 0);
    },

  'document-stream-host-errors-and-reentry-do-not-publish-document':
    ({ rmlui, context }) => {
      const error = new Error('document stream failure');
      const stream = new rmlui.Stream({
        length: () => 10,
        tell: () => 0,
        seek: () => true,
        read() {
          assert.throws(() => rmlui.removeContext(context.name), /callback/i);
          throw error;
        },
        write: () => 0,
        truncate: () => 0,
        isReadReady: () => true,
        isWriteReady: () => false,
      });
      assert.throws(() => rmlui.Factory.instanceDocumentStream(
        context, stream, 'body'), value => value === error);
      assert.equal(context.getNumDocuments(), 0);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Factory documents');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('factory-documents', 160, 120);
    await cases[name]({ rmlui, context, window });
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
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} factory document failures`);
}
