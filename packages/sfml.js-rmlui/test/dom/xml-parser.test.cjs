'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function stream(rmlui, text, source = 'views/parser.rml') {
  const result = new rmlui.StreamMemory(Buffer.from(text));
  result.setSourceURL(source);
  return result;
}

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'base-public-virtuals-dispatch-and-preserve-owned-attributes': ({
    rmlui, context,
  }) => {
    const calls = [];
    let borrowed;
    const parser = new rmlui.BaseXMLParser({
      handleElementStart(current, name, attributes) {
        borrowed = current;
        calls.push([ 'start', name, attributes.key ]);
        attributes.key = 'callback copy';
        assert.equal(current.getLineNumber(), 0);
        assert.throws(() => current.getSourceURL(), /active|parsing/i);
        assert.throws(() => current.handleElementEnd('nested'), /callback/i);
      },
      handleData(current, data, type) {
        calls.push([ 'data', data, type ]);
      },
      handleElementEnd(current, name) {
        calls.push([ 'end', name ]);
      },
    });
    const attributes = { key: 'input' };
    parser.handleElementStart('manual', attributes);
    parser.handleData('payload', rmlui.XMLDataType.InnerXML);
    parser.handleElementEnd('manual');

    assert.deepEqual(calls, [
      [ 'start', 'manual', 'input' ],
      [ 'data', 'payload', rmlui.XMLDataType.InnerXML ],
      [ 'end', 'manual' ],
    ]);
    assert.equal(attributes.key, 'input');
    assert.throws(() => borrowed.getLineNumber(), /valid/i);
    assert.throws(() => parser.handleData('bad', 9), /XMLDataType/i);

    const quiet = new rmlui.BaseXMLParser();
    quiet.handleElementStart('quiet', {});
    quiet.handleData('quiet', rmlui.XMLDataType.Text);
    quiet.handleElementEnd('quiet');

    const xml = new rmlui.XMLParser(context.createDocument());
    assert.throws(() => xml.handleElementStart('body', {}), /protected/i);
    assert.throws(() => xml.handleElementEnd('body'), /protected/i);
    assert.throws(() => xml.handleData('outside', rmlui.XMLDataType.Text),
      /active/i);
  },

  'base-callback-shape-rejects-nonfunctions-at-construction': ({ rmlui }) => {
    for (const field of [
      'handleElementStart', 'handleElementEnd', 'handleData',
    ]) {
      for (const value of [ 1, 'callback', {}, false, null ]) {
        assert.throws(() => new rmlui.BaseXMLParser({ [field]: value }),
          TypeError);
      }
    }
  },

  'xml-setup-callback-getter-cannot-cross-shutdown': ({ rmlui, window }) => {
    const native = require('../../build/Release/rmlui.node');
    rmlui.shutdown();
    const functions = [ () => null, () => true, () => true ];
    Object.defineProperty(functions, 0, {
      get() {
        rmlui.shutdown();
        return () => null;
      },
    });
    assert.throws(() => native.createXMLNodeHandler(functions),
      /runtime changed/i);
    assert.equal(rmlui.XMLParser.getNodeHandler('aborted'), null);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
  },

  'base-native-batch-preserves-xml-data-and-source-lines': ({ rmlui }) => {
    const parser = new rmlui.BaseXMLParser();
    parser.registerCDATATag('RAW');
    parser.registerInnerXMLAttribute('capture');
    assert.equal(parser.isCDATATag('raw'), true);
    assert.equal(parser.isCDATATag('other'), false);

    const events = parser.parseEvents(stream(rmlui,
      '<root key="a&amp;b">\n<raw><b>literal</b></raw>' +
      '<box capture="yes"><i>inner</i></box><![CDATA[free]]></root>'));
    assert.deepEqual(events.map(event => event.kind), [
      'start', 'data', 'start', 'data', 'end', 'start', 'data', 'end',
      'data', 'end',
    ]);
    assert.equal(events[0].name, 'root');
    assert.deepEqual(events[0].attributes, { key: 'a&b' });
    assert.equal(events[0].lineNumber, 1);
    assert.equal(events[2].lineNumber, 2);
    assert.equal(events[3].data, '<b>literal</b>');
    assert.equal(events[3].type, rmlui.XMLDataType.CDATA);
    assert.equal(events[6].data, '<i>inner</i>');
    assert.equal(events[6].type, rmlui.XMLDataType.InnerXML);
    assert.equal(events[8].data, 'free');
    assert.equal(events[8].type, rmlui.XMLDataType.Text);
    assert.equal(parser.getLineNumber(), 2);
    assert.throws(() => parser.getSourceURL(), /active|parsing/i);

    events[0].attributes.key = 'changed';
    const next = parser.parseEvents(stream(rmlui, '<x key="fresh"/>'));
    assert.deepEqual(next[0].attributes, { key: 'fresh' });
    assert.equal(next[0].lineNumber, 1);
  },

  'base-synchronous-callback-order-borrows-and-reentry': ({ rmlui }) => {
    const calls = [];
    let borrowed;
    const parser = new rmlui.BaseXMLParser({
      handleElementStart(current, name, attributes) {
        borrowed = current;
        calls.push([ 'start', name, attributes.key ]);
        assert.equal(current.getSourceURL(), 'views/parser.rml');
        assert.equal(current.getLineNumberOpenTag(), 1);
        assert.throws(() => parser.parse(stream(rmlui, '<nested/>')),
          /callback/i);
        assert.throws(() => rmlui.shutdown(), /callback/i);
        assert.throws(() => current.registerCDATATag('late'), /callback/i);
      },
      handleElementEnd(current, name) {
        calls.push([ 'end', name ]);
        assert.equal(current.getLineNumber(), 1);
      },
      handleData(current, data, type) {
        calls.push([ 'data', data, type ]);
        assert.equal(current.getSourceURL(), 'views/parser.rml');
      },
    });
    parser.parse(stream(rmlui, '<x key="value">text</x>'));
    assert.deepEqual(calls, [
      [ 'start', 'x', 'value' ], [ 'data', 'text', rmlui.XMLDataType.Text ],
      [ 'end', 'x' ],
    ]);
    assert.throws(() => borrowed.getLineNumber(), /valid/i);

    const before = calls.length;
    const batched = parser.parseEvents(stream(rmlui, '<batch/>'));
    assert.equal(calls.length, before);
    assert.deepEqual(batched.map(event => event.name), [ 'batch', 'batch' ]);
  },

  'xml-default-native-dom-and-header-snapshot': ({ rmlui, context }) => {
    const document = context.createDocument();
    const parser = new rmlui.XMLParser(document);
    parser.parse(stream(rmlui,
      '<rml><head><title>Native title</title></head>' +
      '<body><div id="native-node">hello</div></body></rml>'));
    assert.equal(document.title, 'Native title');
    assert.equal(document.getElementById('native-node').innerRML, 'hello');
    const header = parser.getDocumentHeader();
    assert.equal(header.title, 'Native title');
    assert.equal(header.source, 'views/parser.rml');
    header.title = 'independent';
    assert.equal(parser.getDocumentHeader().title, 'Native title');
    assert.equal(parser.getParseFrame().element, document);
    assert.throws(() => parser.getSourceURL(), /active|parsing/i);
  },

  'xml-custom-handler-native-delegation-and-scoped-parser': ({
    rmlui, context,
  }) => {
    const document = context.createDocument();
    const delegate = rmlui.XMLNodeHandler.createDefault();
    const calls = [];
    let borrowed;
    const handler = new rmlui.XMLNodeHandler({
      elementStart(parser, name, attributes) {
        borrowed = parser;
        calls.push(`start:${name}`);
        const frame = parser.getParseFrame();
        assert.equal(frame.tag, 'body');
        assert.equal(frame.element, document);
        assert.equal(parser.pushHandler('missing'), false);
        parser.pushDefaultHandler();
        assert.throws(() => {
          document.innerRML = '';
        }, /callback/i);
        assert.throws(() =>
          rmlui.XMLParser.registerNodeHandler('during', handler), /callback/i);
        return delegate.elementStart(parser, 'div', attributes);
      },
      elementEnd(parser, name) {
        calls.push(`end:${name}`);
        return delegate.elementEnd(parser, name);
      },
      elementData(parser, data, type) {
        calls.push(`data:${data}`);
        assert.equal(parser.getParseFrame().tag, 'custom');
        return delegate.elementData(parser, data, type);
      },
    });
    assert.equal(rmlui.XMLParser.registerNodeHandler('CUSTOM', handler),
      handler);
    assert.equal(rmlui.XMLParser.getNodeHandler('custom'), handler);
    assert.equal(rmlui.XMLParser.getNodeHandler('CUSTOM'), null);
    new rmlui.XMLParser(document).parse(stream(rmlui,
      '<body><custom id="custom-node">text</custom></body>'));
    assert.deepEqual(calls, [ 'start:custom', 'data:text', 'end:custom' ]);
    assert.equal(document.getElementById('custom-node').tagName, 'div');
    assert.equal(document.getElementById('custom-node').innerRML, 'text');
    assert.throws(() => borrowed.getParseFrame(), /valid/i);
  },

  'xml-handler-replacement-invalidates-borrowed-native-targets': ({
    rmlui, context,
  }) => {
    const document = context.createDocument();
    const parser = new rmlui.XMLParser(document);
    const borrowed = rmlui.XMLParser.getNodeHandler('body');
    const owned = rmlui.XMLNodeHandler.createDefault();
    rmlui.XMLParser.registerNodeHandler('body', owned);
    assert.throws(() => parser.getParseFrame(), /valid|registr/i);
    assert.throws(() => borrowed.elementStart(parser, 'body', {}),
      /valid|registr/i);
    assert.equal(rmlui.XMLParser.getNodeHandler('body'), owned);
    assert.throws(() =>
      rmlui.XMLParser.registerNodeHandler('borrowed', borrowed),
    /owned|valid/i);
  },

  'xml-callback-errors-unwind-and-invalid-return-values-reject': ({
    rmlui, context,
  }) => {
    const document = context.createDocument();
    const expected = new Error('XML callback failure');
    let calls = 0;
    rmlui.XMLParser.registerNodeHandler('throwing', new rmlui.XMLNodeHandler({
      elementStart() {
        ++calls;
        throw expected;
      },
      elementEnd: () => true,
      elementData: () => true,
    }));
    assert.throws(() => new rmlui.XMLParser(document).parse(stream(rmlui,
      '<body><throwing/><throwing/></body>')), error => error === expected);
    assert.equal(calls, 1);
    document.innerRML = '<div id="after-error"/>';
    assert.ok(document.getElementById('after-error'));

    for (const [ tag, returned ] of [
      [ 'wrong', {}], [ 'async', Promise.resolve(null) ],
    ]) {
      rmlui.XMLParser.registerNodeHandler(tag, new rmlui.XMLNodeHandler({
        elementStart: () => returned,
        elementEnd: () => true,
        elementData: () => true,
      }));
      assert.throws(() => new rmlui.XMLParser(document).parse(stream(rmlui,
        `<body><${tag}/></body>`)), /Element|synchronous/i);
    }

    rmlui.XMLParser.registerNodeHandler('boolean', new rmlui.XMLNodeHandler({
      elementStart: () => null,
      elementEnd: () => 1,
      elementData: () => true,
    }));
    assert.throws(() => new rmlui.XMLParser(document).parse(stream(rmlui,
      '<body><boolean/></body>')), /boolean/i);
  },

  'base-callbacks-reject-nonvoid-and-async-results': ({ rmlui }) => {
    for (const returned of [ true, Promise.resolve() ]) {
      const parser = new rmlui.BaseXMLParser({
        handleElementStart: () => returned,
      });
      assert.throws(() => parser.parse(stream(rmlui, '<x/>')),
        /synchronous.*void/i);
      assert.equal(parser.getLineNumber(), 1);
      assert.equal(parser.parseEvents(stream(rmlui, '<after/>')).length, 2);
    }
  },

  'xml-handler-return-must-belong-to-active-subtree': ({ rmlui, context }) => {
    const document = context.createDocument();
    const foreign = context.createDocument().createElement('div');
    rmlui.XMLParser.registerNodeHandler('foreign', new rmlui.XMLNodeHandler({
      elementStart: () => foreign,
      elementEnd: () => true,
      elementData: () => true,
    }));
    assert.throws(() => new rmlui.XMLParser(document).parse(stream(rmlui,
      '<body><foreign/></body>')), /parse subtree/i);
    assert.equal(foreign.getParentNode(), null);
    document.innerRML = '<div id="after-foreign"/>';
    assert.ok(document.getElementById('after-foreign'));
  },

  'xml-context-removal-invalidates-parser-root': ({ rmlui, context }) => {
    const parser = new rmlui.XMLParser(context.createDocument());
    rmlui.removeContext(context.name);
    assert.throws(() => parser.getParseFrame(), /valid/i);
    assert.throws(() => parser.parse(stream(rmlui, '<body/>')), /valid/i);
  },

  'xml-owned-root-gc-and-generation-lifetimes': async ({
    rmlui, context, window,
  }) => {
    let root = context.createDocument().createElement('div');
    root.id = 'retained-root';
    const parser = new rmlui.XMLParser(root);
    root = null;
    await collect();
    assert.equal(parser.getParseFrame().element.id, 'retained-root');
    parser.parse(stream(rmlui, '<body><div id="retained"/></body>'));
    assert.ok(parser.getParseFrame().element.getElementById('retained'));

    const base = new rmlui.BaseXMLParser();
    const handler = rmlui.XMLNodeHandler.createDefault();
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => parser.getParseFrame(), /valid/i);
    assert.throws(() => base.getLineNumber(), /valid/i);
    assert.throws(() =>
      rmlui.XMLParser.registerNodeHandler('stale', handler), /valid/i);
  },

  'xml-batch-and-default-path-fixed-native-crossings': ({ rmlui, context }) => {
    const native = require('../../build/Release/rmlui.node');
    const base = new rmlui.BaseXMLParser();
    const input = stream(rmlui, '<x/>'.repeat(10000));
    native.beginDataDiagnostics();
    const events = base.parseEvents(input);
    const batchCounts = native.endDataDiagnostics();
    assert.equal(events.length, 20000);
    assert.equal(batchCounts.runtimeEntries, 1);
    assert.equal(batchCounts.nativeCallbacks, 0);
    assert.equal(batchCounts.elementOwnershipVisits, 0);

    const document = context.createDocument();
    const parser = new rmlui.XMLParser(document);
    const domInput = stream(rmlui,
      '<body>' + '<div/>'.repeat(1000) + '</body>');
    native.beginDataDiagnostics();
    parser.parse(domInput);
    const domCounts = native.endDataDiagnostics();
    assert.equal(domCounts.runtimeEntries, 1);
    assert.equal(domCounts.nativeCallbacks, 0);
    assert.equal(document.getNumChildren(), 1000);
  },

  'xml-persistent-cdata-header-writeback-and-native-data-dispatch': ({
    rmlui, context,
  }) => {
    const document = context.createDocument();
    const delegate = rmlui.XMLNodeHandler.createDefault();
    const replacement = new rmlui.DocumentHeader({
      source: 'changed.rml', title: 'replaced',
    });
    rmlui.XMLParser.registerPersistentCDATATag('payload');
    rmlui.XMLParser.registerNodeHandler('payload', new rmlui.XMLNodeHandler({
      elementStart(parser, name, attributes) {
        assert.equal(parser.getDocumentHeader().title, '');
        parser.setDocumentHeader(replacement);
        parser.pushDefaultHandler();
        return delegate.elementStart(parser, 'div', attributes);
      },
      elementData(parser, data, type) {
        assert.equal(data, '<b>raw</b>');
        assert.equal(type, rmlui.XMLDataType.CDATA);
        return true;
      },
      elementEnd(parser) {
        parser.handleData('native tail', rmlui.XMLDataType.Text);
        return true;
      },
    }));
    const parser = new rmlui.XMLParser(document);
    assert.equal(parser.isCDATATag('PAYLOAD'), true);
    parser.parse(stream(rmlui,
      '<body><payload id="raw"><b>raw</b></payload></body>'));
    assert.equal(parser.getDocumentHeader().title, 'replaced');
    assert.equal(parser.getDocumentHeader().source, 'changed.rml');
    assert.match(document.innerRML, /native tail/);
  },

  'xml-unregistered-callback-cycles-collect-and-registration-retains': async ({
    rmlui, context,
  }) => {
    const weakParser = (() => {
      const owner = {};
      owner.parser = new rmlui.BaseXMLParser({
        handleElementStart() {
          assert.ok(owner.parser);
        },
      });
      return new WeakRef(owner.parser);
    })();
    await collect();
    assert.equal(weakParser.deref(), undefined);

    let marker = { count: 0 };
    const weakMarker = new WeakRef(marker);
    let handler = (owner => new rmlui.XMLNodeHandler({
      elementStart: () => {
        ++owner.count;
        return null;
      },
      elementEnd: () => true,
      elementData: () => true,
    }))(marker);
    const weakHandler = new WeakRef(handler);
    rmlui.XMLParser.registerNodeHandler('retained-handler', handler);
    marker = null;
    handler = null;
    await collect();
    assert.ok(weakMarker.deref());
    const document = context.createDocument();
    new rmlui.XMLParser(document).parse(stream(rmlui,
      '<body><retained-handler/></body>'));
    assert.equal(weakMarker.deref().count, 1);
    rmlui.XMLParser.registerNodeHandler('retained-handler', null);
    await collect();
    assert.equal(weakMarker.deref(), undefined);
    assert.equal(weakHandler.deref(), undefined);
  },

  'xml-setup-registration-adopts-generation-and-shutdown-clears': ({
    rmlui, window,
  }) => {
    rmlui.shutdown();
    assert.equal(rmlui.XMLParser.getNodeHandler('setup'), null);
    assert.throws(() => rmlui.XMLParser.getNodeHandler(1), TypeError);
    rmlui.XMLParser.registerPersistentCDATATag('setup');
    const handler = new rmlui.XMLNodeHandler({
      elementStart: () => null,
      elementEnd: () => true,
      elementData: () => true,
    });
    rmlui.XMLParser.registerNodeHandler('setup', handler);
    assert.equal(rmlui.XMLParser.getNodeHandler('setup'), handler);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const context = rmlui.createContext('setup-generation', 160, 120);
    const document = context.createDocument();
    assert.equal(new rmlui.XMLParser(document).isCDATATag('setup'), true);
    assert.equal(rmlui.XMLParser.getNodeHandler('setup'), handler);

    rmlui.shutdown();
    rmlui.XMLParser.registerPersistentCDATATag('abandoned');
    const abandoned = rmlui.XMLNodeHandler.createDefault();
    rmlui.XMLParser.registerNodeHandler('abandoned', abandoned);
    rmlui.shutdown();
    assert.equal(rmlui.XMLParser.getNodeHandler('abandoned'), null);
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() =>
      rmlui.XMLParser.registerNodeHandler('stale-setup', abandoned), /valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'XML parser contracts');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, window, context: rmlui.createContext('xml', 160, 120),
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
    const result = spawnSync(process.execPath, [
      '--expose-gc', __filename, name,
    ], { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} XML contracts failed`);
}
