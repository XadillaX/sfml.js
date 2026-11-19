'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const cases = {
  'head-order-and-source-lines': function({ rmlui, context }) {
    const order = [];
    const host = new rmlui.NodeScriptHost({
      allowInline: true,
      globals: { record: (...values) => order.push(values) },
    });
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(`
<rml><head><script>
record(1, document.getElementById('later'), context.name);
document.title = 'executed';
</script><script>record(2, document.title);</script>
</head><body id="doc"><div id="later"/></body></rml>`, 'source/panel.rml');
    assert.deepEqual(order, [[ 1, null, context.name ], [ 2, 'executed' ]]);
    assert.equal(document.title, 'executed');
    assert.ok(document.getElementById('later'));
    assert.equal(context.getDocumentsBaseTag(), 'body');
    const count = context.getNumDocuments();
    assert.throws(() => context.loadDocumentFromMemory(
      '<rml>\n<head>\n<script>\nthrow new Error("line");\n</script>' +
      '</head><body/></rml>', 'accurate.rml'),
    error => /accurate.rml:4/.test(error.stack));
    assert.equal(context.getNumDocuments(), count);
  },

  'named-handler-and-live-event': function({ rmlui, context }) {
    let retained;
    const host = new rmlui.NodeScriptHost({
      handlers: {
        cancel(event, document, owner) {
          assert.equal(event.type, 'click');
          assert.strictEqual(owner, context);
          assert.strictEqual(
            event.currentTarget, document.getElementById('go'));
          retained = event;
          event.stopImmediatePropagation();
          document.title = 'cancelled';
        },
      },
    });
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><button id="go" onclick="cancel"/></body></rml>');
    let bubbles = 0;
    document.addEventListener('click', () => ++bubbles);
    document.getElementById('go').click();
    assert.equal(document.title, 'cancelled');
    assert.equal(bubbles, 0);
    assert.equal(retained.type, 'click');
    assert.throws(() => retained.stopPropagation(), /expired/i);
  },

  'inline-handler-and-nested-event': function({ rmlui, context }) {
    const events = [];
    context.setScriptHost(new rmlui.NodeScriptHost({
      allowInline: true,
      globals: { record: value => events.push(value) },
    }));
    const document = context.loadDocumentFromMemory(`
<rml><head><script>
function run(e) {
  record(event.type);
  if (event.type === 'click') element.dispatchEvent('nested', {});
  record(event.type);
}
</script></head><body>
<button id="go" onclick="run" onnested="run"/>
</body></rml>`);
    document.getElementById('go').click();
    assert.deepEqual(events, [ 'click', 'nested', 'nested', 'click' ]);
  },

  'external-files-and-empty-source': function({ rmlui, context }) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-scripts-'));
    try {
      fs.writeFileSync(path.join(directory, 'empty.js'), '');
      fs.writeFileSync(path.join(directory, 'first.js'),
        'document.title = "external";');
      context.setScriptHost(new rmlui.NodeScriptHost({
        allowInline: true, allowExternal: true,
      }));
      const document = context.loadDocumentFromMemory(
        '<rml><head><script src="empty.js"/><script src="first.js"/>' +
        '<script>document.title += "-inline";</script></head><body/></rml>',
        path.join(directory, 'panel.rml'));
      assert.equal(document.title, 'external-inline');
      fs.writeFileSync(path.join(directory, 'bad.js'),
        '\nthrow new Error("external-source");');
      assert.throws(() => document.loadExternalScript(
        path.join(directory, 'bad.js')),
      error => /bad.js:2/.test(error.stack));
      assert.throws(() => context.loadDocumentFromMemory(
        '<rml><head><script src="missing.js"/></head><body/></rml>',
        path.join(directory, 'panel.rml')), /open external script/i);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },

  'disabled-source-and-handler-policy': function({ rmlui, context }) {
    context.setScriptHost(new rmlui.NodeScriptHost());
    assert.throws(() => context.loadDocumentFromMemory(
      '<rml><head><script>throw 1;</script></head><body/></rml>'),
    /inline.*disabled/i);
    assert.equal(context.getNumDocuments(), 0);
    assert.throws(() => context.loadDocumentFromMemory(
      '<rml><head/><body><button id="go" onclick="missing()"/></body></rml>'),
    /unknown.*handler/i);
  },

  'host-selection-is-per-context-and-document': function({ rmlui, context }) {
    const other = rmlui.createContext('other-scripts', 180, 120);
    const first = new rmlui.NodeScriptHost({
      allowInline: true,
      handlers: {
        rename(_e, d) {
          d.title = 'first';
        },
      },
    });
    const second = new rmlui.NodeScriptHost({
      allowInline: true,
      handlers: {
        rename(_e, d) {
          d.title = 'second';
        },
      },
    });
    context.setScriptHost(first);
    const markup = '<rml><head/><body><button id="go" onclick="rename"/>' +
      '</body></rml>';
    const document = context.loadDocumentFromMemory(markup);
    other.setScriptHost(second);
    const otherDocument = other.loadDocumentFromMemory(markup);
    context.setScriptHost(null);
    document.getElementById('go').click();
    otherDocument.getElementById('go').click();
    assert.equal(document.title, 'first');
    assert.equal(otherDocument.title, 'second');
    const plain = context.loadDocumentFromMemory(
      '<rml><head><script>throw new Error("not executed");</script>' +
      '</head><body/></rml>');
    plain.loadInlineScript('throw new Error("base no-op");', 'plain.js', 1);
    assert.equal(plain.title, '');
    context.setScriptHost(second);
    document.getElementById('go').click();
    assert.equal(document.title, 'first');
  },

  'exception-identity-and-destructive-reentry': function({ rmlui, context }) {
    const sentinel = { message: 'exact script exception' };
    context.setScriptHost(new rmlui.NodeScriptHost({
      allowInline: true,
      globals: { sentinel },
      handlers: {
        fail() {
          throw sentinel;
        },
        destroy(_e, _d, c) {
          c.remove();
        },
      },
    }));
    assert.throws(() => context.loadDocumentFromMemory(
      '<rml><head><script>throw sentinel;</script></head><body/></rml>'),
    error => error === sentinel);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><button id="fail" onclick="fail"/>' +
      '<button id="destroy" onclick="destroy"/></body></rml>');
    assert.throws(() => document.getElementById('fail').click(),
      error => error === sentinel);
    assert.throws(() => document.getElementById('destroy').click(),
      /callback/i);
    assert.ok(context.getNumDocuments() > 0);
  },

  'teardown-and-host-invalidation': function({ rmlui, context, window }) {
    let document;
    let savedContext;
    const host = new rmlui.NodeScriptHost({
      allowInline: true,
      globals: {
        save(d, c) {
          document = d;
          savedContext = c;
        },
      },
    });
    context.setScriptHost(host);
    const loaded = context.loadDocumentFromMemory(
      '<rml><head><script>save(document, context);</script></head>' +
      '<body/></rml>');
    assert.strictEqual(loaded, document);
    context.unloadDocument(loaded);
    context.update();
    assert.throws(() => document.title, /no longer valid/i);
    context.remove();
    assert.throws(() => savedContext.name, /no longer valid/i);
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const next = rmlui.createContext('new-runtime', 180, 120);
    assert.throws(() => next.setScriptHost(host), /no longer valid/i);
    assert.throws(() => next.setScriptHost({}), /script host/i);
  },

  'promises-are-rejected': function({ rmlui, context }) {
    context.setScriptHost(new rmlui.NodeScriptHost({
      allowInline: true,
      handlers: {
        async later() {
          throw new Error('async rejected');
        },
      },
    }));
    assert.throws(() => context.loadDocumentFromMemory(
      '<rml><head><script>Promise.reject(new Error("async"));</script>' +
      '</head><body/></rml>'), /synchronous/i);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><button id="go" onclick="later"/></body></rml>');
    assert.throws(() => document.getElementById('go').click(), /synchronous/i);
  },

  'factory-registries-and-direct-listeners': function({ rmlui, context }) {
    const body = rmlui.Factory.getElementInstancer('body');
    let customCalls = 0;
    const custom = new rmlui.EventListener(() => ++customCalls);
    const instancer = new rmlui.EventListenerInstancer(value => {
      assert.equal(value, 'custom');
      return custom;
    });
    rmlui.Factory.registerEventListenerInstancer(instancer);
    context.setScriptHost(new rmlui.NodeScriptHost({
      handlers: {
        saved(_event, document) {
          document.title = 'script factory';
        },
      },
    }));
    assert.strictEqual(rmlui.Factory.getElementInstancer('body'), body);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><button id="go" onclick="saved"/></body></rml>');
    const element = document.getElementById('go');
    const listener = rmlui.Factory.instanceEventListener('saved', element);
    assert.ok(listener instanceof rmlui.EventListener);
    element.addEventListener('probe', listener);
    element.dispatchEvent('probe', {});
    assert.equal(document.title, 'script factory');
    element.removeEventListener('probe', listener);
    listener.release();
    context.setScriptHost(null);
    const plain = context.loadDocumentFromMemory(
      '<rml><head/><body><button id="go" onclick="custom"/></body></rml>');
    plain.getElementById('go').click();
    assert.equal(customCalls, 1);
    rmlui.Factory.registerEventListenerInstancer(null);
  },

  'moved-listener-rejects-expired-document': function({ rmlui, context }) {
    let calls = 0;
    context.setScriptHost(new rmlui.NodeScriptHost({
      handlers: {
        run() {
          ++calls;
        },
      },
    }));
    const first = context.loadDocumentFromMemory(
      '<rml><head/><body><div id="first"/></body></rml>');
    const second = context.loadDocumentFromMemory(
      '<rml><head/><body><div id="second"/></body></rml>');
    const listener = rmlui.Factory.instanceEventListener(
      'run', first.getElementById('first'));
    const element = second.getElementById('second');
    element.addEventListener('probe', listener);
    context.unloadDocument(first);
    context.update();
    assert.throws(() => element.dispatchEvent('probe', {}), /no longer valid/i);
    assert.equal(calls, 0);
    element.removeEventListener('probe', listener);
    listener.release();
  },

  'static-frames-and-dispatch-call-count': function({ rmlui, context }) {
    const native = require('../../build/Release/rmlui.node');
    let calls = 0;
    context.setScriptHost(new rmlui.NodeScriptHost({
      handlers: {
        run() {
          ++calls;
        },
      },
    }));
    const document = context.loadDocumentFromMemory(
      '<rml><head><style>body{display:block;margin:0;width:180px;' +
      'height:120px;}div{display:block;width:20px;height:20px;' +
      'background-color:#f00;}</style></head>' +
      '<body><div id="go" onclick="run"/></body></rml>');
    document.show();
    context.update();
    context.render();
    native.beginDataDiagnostics(false);
    for (let i = 0; i < 20; ++i) {
      context.update();
      context.render();
    }
    let counters = native.endDataDiagnostics();
    assert.equal(counters.runtimeEntries, 40);
    assert.equal(counters.nativeCallbacks, 0);
    assert.equal(counters.geometryUploads, 0);
    assert.equal(counters.geometryDraws, 20);
    assert.equal(counters.ownershipInstanceVisits, 0);
    assert.equal(counters.elementOwnershipVisits, 0);
    assert.equal(counters.listenerOwnershipVisits, 0);
    assert.equal(counters.typedListenerOwnershipVisits, 0);
    const element = document.getElementById('go');
    native.beginDataDiagnostics(false);
    element.click();
    counters = native.endDataDiagnostics();
    assert.equal(calls, 1);
    assert.equal(counters.callbacks.event, 1);
    assert.equal(counters.callbacks.instancer, 0);
  },

  'source-policy-and-captured-handlers': function({ rmlui, context }) {
    const options = {
      handlers: {
        run(_event, document) {
          document.title = 'captured';
        },
      },
    };
    const host = new rmlui.NodeScriptHost(options);
    options.handlers.run = () => assert.fail('mutated handler');
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><button id="go" onclick="run"/></body></rml>');
    document.getElementById('go').click();
    assert.equal(document.title, 'captured');
    assert.throws(() => document.loadInlineScript('', 'bad\0name'),
      /null byte/);
    assert.throws(() => document.loadExternalScript('bad\0name'), /null byte/);
    assert.throws(() => new rmlui.NodeScriptHost({
      globals: { document: {} },
    }), /reserved/i);
    assert.throws(() => new rmlui.NodeScriptHost({
      allowExternal: 1,
    }), /boolean/i);
  },

  'hosted-document-preserves-plugin-lifecycle': function({ rmlui, context }) {
    const notices = [];
    let failedDocument;
    rmlui.registerPlugin(new rmlui.Plugin({
      getEventClasses: () => rmlui.PluginEventClasses.Element,
      onElementCreate(element) {
        if (element.tagName === 'body') {
          notices.push('create');
        }
      },
      onElementDestroy(element) {
        if (element.tagName === 'body') {
          notices.push('destroy');
        }
      },
    }));
    context.setScriptHost(new rmlui.NodeScriptHost({
      allowInline: true,
      globals: {
        keep(document) {
          failedDocument = document;
        },
      },
    }));
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    assert.deepEqual(notices, [ 'create' ]);
    context.unloadDocument(document);
    context.update();
    assert.deepEqual(notices, [ 'create', 'destroy' ]);
    assert.throws(() => context.loadDocumentFromMemory(
      '<rml><head><script>keep(document);throw new Error("failed");</script>' +
      '</head><body/></rml>'), /failed/);
    // The existing first-exception guard suppresses later host callbacks.
    // Native destruction still occurs and invalidates every retained facade.
    assert.deepEqual(notices, [ 'create', 'destroy', 'create' ]);
    assert.throws(() => failedDocument.tagName, /no longer valid/i);
    assert.equal(context.getNumDocuments(), 0);
    const next = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    context.unloadDocument(next);
    context.update();
    assert.deepEqual(notices,
      [ 'create', 'destroy', 'create', 'create', 'destroy' ]);
  },

  'host-and-session-cycles-are-collected': async function({ rmlui, context }) {
    async function collect() {
      for (let i = 0; i < 16; ++i) {
        global.gc();
        await new Promise(resolve => setImmediate(resolve));
      }
    }
    let unused;
    let selected;
    let session;
    function createHost() {
      const token = { marker: 'host' };
      const host = new rmlui.NodeScriptHost({
        handlers: {
          run() {
            return token.marker;
          },
        },
      });
      return { host, weak: new WeakRef(token) };
    }
    (() => {
      const pair = createHost();
      unused = pair.weak;
    })();
    await collect();
    assert.equal(unused.deref(), undefined);
    (() => {
      const pair = createHost();
      selected = pair.weak;
      context.setScriptHost(pair.host);
    })();
    await collect();
    assert.ok(selected.deref());
    context.setScriptHost(new rmlui.NodeScriptHost({
      allowInline: true,
      globals: {
        keep(value) {
          session = new WeakRef(value);
        },
      },
    }));
    const document = context.loadDocumentFromMemory(
      '<rml><head><script>const token = { marker: "session" };' +
      'keep(token);</script></head><body/></rml>');
    await collect();
    assert.equal(selected.deref(), undefined);
    assert.ok(session.deref());
    context.unloadDocument(document);
    context.update();
    await collect();
    // A retained expired Document facade does not retain the native session.
    assert.equal(session.deref(), undefined);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(180, 120)), 'Document scripts');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const context = rmlui.createContext('scripts', 180, 120);
  try {
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
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ], {
        encoding: 'utf8', timeout: 20000,
      });
    assert.equal(result.status, 0,
      `${name}: ${result.signal ?? result.error ?? ''}\n` +
      `${result.stdout}\n${result.stderr}`);
    console.log(`PASS ${name}`);
  }
}
