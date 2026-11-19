'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const resource = (name, content = '', isInline = false, line = 0) =>
  ({ path: name, content, isInline, line });

const cases = {
  'defaults-native-fields-and-independent-snapshots': function({ rmlui }) {
    const header = new rmlui.DocumentHeader();
    assert.deepEqual(header.snapshot(), {
      source: '', title: '', templateResources: [], rcss: [], scripts: [],
    });
    const input = {
      source: 'views/界面.rml', title: '原生 🎮',
      templateResources: [ 'layout.rml' ],
      rcss: [{ path: 'theme.rcss' }],
      scripts: [{ path: 'views/界面.rml', content: 'state = 1;',
        isInline: true, line: 12 }],
    };
    header.replace(input);
    input.templateResources.push('wrong');
    input.rcss[0].path = 'wrong';
    input.scripts[0].content = 'wrong';
    assert.equal(header.source, 'views/界面.rml');
    assert.equal(header.title, '原生 🎮');
    assert.deepEqual(header.templateResources, [ 'layout.rml' ]);
    assert.deepEqual(header.rcss, [ resource('theme.rcss') ]);
    assert.deepEqual(header.scripts,
      [ resource('views/界面.rml', 'state = 1;', true, 12) ]);
    const snapshot = header.snapshot();
    snapshot.rcss[0].path = 'changed';
    snapshot.templateResources.push('changed');
    assert.deepEqual(header.rcss, [ resource('theme.rcss') ]);
    header.source = 'new.rml';
    header.title = 'new title';
    header.templateResources = [ 'new-template.rml' ];
    header.rcss = [ resource('new.rcss') ];
    header.scripts = [];
    assert.deepEqual(header.snapshot(), {
      source: 'new.rml', title: 'new title',
      templateResources: [ 'new-template.rml' ],
      rcss: [ resource('new.rcss') ], scripts: [],
    });
  },

  'native-header-merge-paths-resources-and-self-merge': function({ rmlui }) {
    const target = new rmlui.DocumentHeader({
      source: 'views/main.rml', title: 'first',
      templateResources: [ 'existing.rml' ],
      rcss: [ resource('existing.rcss') ],
    });
    const source = new rmlui.DocumentHeader({
      source: 'templates/base.rml', title: 'second',
      templateResources: [ 'nested.rml', '../common.rml' ],
      rcss: [ resource('literal.rcss') ],
      scripts: [ resource('literal.js') ],
    });
    target.mergeHeader(source);
    assert.deepEqual(target.snapshot(), {
      source: 'views/main.rml', title: 'first',
      templateResources: [
        'existing.rml', 'templates/nested.rml', 'common.rml',
      ],
      rcss: [ resource('existing.rcss'), resource('literal.rcss') ],
      scripts: [ resource('literal.js') ],
    });
    const empty = new rmlui.DocumentHeader();
    empty.mergeHeader(source);
    assert.equal(empty.title, 'second');
    assert.equal(empty.source, 'templates/base.rml');
    const paths = [ 'unchanged.rml' ];
    assert.deepEqual(target.mergePaths(paths,
      [ 'child.rml', '../shared.rml' ], 'views/main.rml'),
    [ 'unchanged.rml', 'views/child.rml', 'shared.rml' ]);
    assert.deepEqual(paths, [ 'unchanged.rml' ]);
    assert.deepEqual(target.mergePaths([], [ 'child.rml' ], 'C|/ui/main.rml'),
      [ 'C|/ui/child.rml' ]);
    const resources = [ resource('first') ];
    assert.deepEqual(target.mergeResources(resources, [{ path: 'second' }]),
      [ resource('first'), resource('second') ]);
    assert.deepEqual(resources, [ resource('first') ]);
    const self = new rmlui.DocumentHeader({
      source: 'views/main.rml', templateResources: [ 'part.rml' ],
      rcss: [ resource('theme.rcss') ],
    });
    self.mergeHeader(self);
    assert.deepEqual(self.templateResources, [ 'part.rml', 'views/part.rml' ]);
    assert.deepEqual(self.rcss,
      [ resource('theme.rcss'), resource('theme.rcss') ]);
  },

  'process-header-native-css-source-title-and-hide': function({
    rmlui, context,
  }) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-header-'));
    try {
      fs.writeFileSync(path.join(directory, 'theme.rcss'),
        '#target { width: 31px; height: 7px; }');
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body><div id="target"/></body></rml>');
      const header = new rmlui.DocumentHeader({
        source: path.join(directory, 'main.rml'), title: 'Header title',
        rcss: [
          resource(path.join(directory, 'theme.rcss')),
          resource(path.join(directory, 'main.rml'),
            '#target { width: 49px; }', true, 7),
        ],
      });
      document.show();
      document.processHeader(header);
      assert.equal(document.title, 'Header title');
      assert.equal(document.sourceURL, path.join(directory, 'main.rml'));
      assert.equal(document.isVisible(), false);
      document.updateDocument();
      const target = document.getElementById('target');
      assert.equal(target.getComputedValues().width.value, 49);
      assert.equal(target.getComputedValues().height.value, 7);
      assert.ok(document.getStyleSheetContainer());
      header.title = 'changed';
      header.rcss = [];
      assert.equal(document.title, 'Header title');
      assert.equal(target.getComputedValues().width.value, 49);
      document.show();
      assert.equal(document.isVisible(), true);
      document.processHeader(header);
      // Upstream leaves the existing sheet installed when no RCSS is supplied.
      assert.equal(document.title, 'changed');
      document.updateDocument();
      assert.equal(target.getComputedValues().width.value, 49);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },

  'process-header-template-order-and-document-title': function({
    rmlui, context,
  }) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-header-'));
    try {
      fs.writeFileSync(path.join(directory, 'template.rml'),
        '<template name="base" content="slot"><head>' +
        '<title>Template title</title><style>' +
        '#target { width: 21px; height: 13px; }</style></head>' +
        '<body><div id="slot"/></body></template>');
      const document = context.createDocument();
      document.innerRML = '<div id="target"/>';
      document.processHeader(new rmlui.DocumentHeader({
        source: path.join(directory, 'main.rml'),
        templateResources: [ 'template.rml' ],
        rcss: [ resource(path.join(directory, 'main.rml'),
          '#target { width: 32px; }', true) ],
      }));
      // ProcessHeader uses the document title, not the merged template title.
      assert.equal(document.title, '');
      document.updateDocument();
      const values = document.getElementById('target').getComputedValues();
      assert.equal(values.width.value, 32);
      assert.equal(values.height.value, 13);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  },

  'metadata-hide-close-and-deferred-invalidation': function({ context }) {
    const withoutHead = context.loadDocumentFromMemory(
      '<rml><body id="without-head"/></rml>', 'unused.rml');
    assert.equal(withoutHead.sourceURL, '');
    const document = context.loadDocumentFromMemory(
      '<rml><head><title>原生</title></head><body id="document"/></rml>');
    assert.equal(document.sourceURL, '[document from memory]');
    assert.equal(document.title, '原生');
    document.title = '改 🎮';
    assert.equal(document.title, '改 🎮');
    document.show();
    let hidden = 0;
    let unloaded = 0;
    document.addEventListener('hide', () => {
      hidden++;
    });
    document.addEventListener('unload', () => {
      unloaded++;
      assert.equal(document.title, '改 🎮');
      assert.strictEqual(context.getDocument('document'), document);
    });
    document.hide();
    assert.equal(hidden, 1);
    assert.equal(document.isVisible(), false);
    assert.strictEqual(context.getDocument('document'), document);
    document.close();
    document.close();
    assert.equal(unloaded, 1);
    assert.equal(context.getDocument('document'), null);
    assert.equal(document.title, '改 🎮');
    context.update();
    assert.throws(() => document.title, /no longer valid/i);
    assert.throws(() => document.hide(), /no longer valid/i);
    assert.throws(() => document.close(), /no longer valid/i);
  },

  'validation-atomicity-and-receiver-provenance': function({ rmlui, context }) {
    const header = new rmlui.DocumentHeader({ title: 'stable' });
    const snapshot = header.snapshot();
    for (const input of [
      null, [], { source: 2 }, { title: false }, { templateResources: [ 3 ] },
      { rcss: {} }, { rcss: [ null ] }, { rcss: [{ path: 4 }] },
      { scripts: [{ content: false }] },
      { rcss: [{ isInline: 1 }] }, { scripts: [{ line: 1.5 }] },
      { scripts: [{ line: 2147483648 }] },
      { source: 'bad\0path' }, { rcss: [{ path: 'bad\0path' }] },
    ]) {
      assert.throws(() => header.replace(input));
      assert.deepEqual(header.snapshot(), snapshot);
    }
    assert.throws(() => header.mergeHeader({}), /DocumentHeader/);
    assert.throws(() => header.snapshot.call({}), /DocumentHeader/);
    assert.throws(() => header.mergePaths([], [ 4 ], 'main.rml'));
    assert.throws(() => header.mergeResources([], [{ line: NaN }]));
    const document = context.createDocument();
    assert.throws(() => document.processHeader({}), /DocumentHeader/);
    assert.throws(() => document.processHeader(null), /DocumentHeader/);
    const expected = new Error('resource accessor failure');
    assert.throws(() => header.replace({
      title: 'wrong',
      scripts: [{
        get content() {
          throw expected;
        },
      }],
    }), error => error === expected);
    assert.deepEqual(header.snapshot(), snapshot);
  },

  'late-accessor-restart-and-stale-header-document': function({
    rmlui, window,
  }) {
    const header = new rmlui.DocumentHeader();
    assert.throws(() => {
      header.rcss = [{
        get content() {
          rmlui.shutdown();
          assert.ok(rmlui.initialise(window, { highDpi: false }));
          return 'body { width: 10px; }';
        },
      }];
    }, /no longer valid/i);
    assert.throws(() => header.snapshot(), /no longer valid/i);
    const current = new rmlui.DocumentHeader();
    const context = rmlui.createContext('replacement', 160, 120);
    const document = context.createDocument();
    assert.throws(() => document.processHeader(header), /no longer valid/i);
    document.close();
    context.update();
    assert.throws(() => document.processHeader(current), /no longer valid/i);
  },

  'bulk-header-crossings': function({ rmlui }) {
    const native = require('../../build/Release/rmlui.node');
    const header = new rmlui.DocumentHeader();
    const input = {
      rcss: Array.from({ length: 10000 }, (_, i) =>
        resource(`styles/${i}.rcss`)),
      scripts: Array.from({ length: 10000 }, (_, i) =>
        resource(`scripts/${i}.js`)),
    };
    const measure = action => {
      native.beginDataDiagnostics();
      try {
        action();
      } finally {
        const counts = native.endDataDiagnostics();
        assert.equal(counts.runtimeEntries, 1);
        assert.equal(counts.nativeCallbacks, 0);
        assert.equal(counts.elementOwnershipVisits, 0);
      }
    };
    measure(() => header.replace(input));
    let snapshot;
    measure(() => {
      snapshot = header.snapshot();
    });
    assert.equal(snapshot.rcss.length, 10000);
    assert.equal(snapshot.scripts.length, 10000);
    assert.equal(snapshot.scripts[9999].path, 'scripts/9999.js');
    const other = new rmlui.DocumentHeader(input);
    measure(() => header.mergeHeader(other));
    assert.equal(header.rcss.length, 20000);
  },

  'output-own-properties-bypass-inherited-setters': function({ rmlui }) {
    const header = new rmlui.DocumentHeader({
      source: 'main.rml', title: 'safe',
      templateResources: [ 'template.rml' ],
      rcss: [ resource('theme.rcss') ],
    });
    const expected = header.snapshot();
    const keys = [
      'source', 'title', 'templateResources', 'rcss', 'scripts',
      'path', 'content', 'isInline', 'line',
    ];
    try {
      for (const key of keys) {
        // Adversarial setters exist only in this child and are restored below.
        // eslint-disable-next-line no-extend-native
        Object.defineProperty(Object.prototype, key, {
          configurable: true,
          set() {
            throw new Error(`Inherited setter ${key} must not run`);
          },
        });
      }
      assert.deepEqual(header.snapshot(), expected);
      assert.deepEqual(header.rcss, expected.rcss);
    } finally {
      for (const key of keys) {
        delete Object.prototype[key];
      }
    }
  },

  'constructor-restart-and-detached-process': function({ rmlui, window }) {
    assert.throws(() => new rmlui.DocumentHeader({
      get title() {
        rmlui.shutdown();
        assert.ok(rmlui.initialise(window, { highDpi: false }));
        return 'stale construction';
      },
    }), /Runtime changed/);
    const context = rmlui.createContext('detached', 160, 120);
    const document = context.createDocument().createElement('body');
    assert.equal(document.getContext(), null);
    document.processHeader(new rmlui.DocumentHeader({
      title: 'detached', source: 'detached.rml',
      rcss: [ resource('detached.rml', 'body { width: 29px; }', true) ],
    }));
    document.updateDocument();
    assert.equal(document.title, 'detached');
    const sheet = document.getStyleSheetContainer();
    assert.ok(sheet);
    // Upstream compiles media blocks only when the document has a context.
    assert.equal(sheet.getCompiledStyleSheet(), null);
    const attached = context.createDocument();
    attached.setStyleSheetContainer(sheet);
    attached.updateDocument();
    assert.equal(attached.getComputedValues().width.value, 29);
    attached.addEventListener('check', () => {
      assert.throws(() => attached.processHeader(new rmlui.DocumentHeader()),
        /callback/i);
    });
    attached.dispatchEvent('check');
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)),
    'Document header contracts');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, window, context: rmlui.createContext('headers', 160, 120),
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
  assert.equal(failures, 0, `${failures} document header regressions failed`);
}
