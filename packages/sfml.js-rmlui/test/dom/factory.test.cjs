'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 12; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

function source(rmlui, text, readOverride) {
  const bytes = Buffer.from(text);
  let position = 0;
  return new rmlui.Stream({
    length: () => bytes.length,
    tell: () => position,
    seek(offset) {
      position = offset;
      return true;
    },
    read(output, count) {
      if (readOverride) {
        return readOverride(output, count);
      }
      const copied = Math.min(count, bytes.length - position);
      output.set(bytes.subarray(position, position + copied));
      position += copied;
      return copied;
    },
    write: () => 0,
    truncate: () => 0,
    isReadReady: () => position < bytes.length,
    isWriteReady: () => false,
  }, 'factory.rcss');
}

const cases = {
  'factory-elements-preserve-instancer-tag-attributes-and-ownership':
    ({ rmlui, document }) => {
      const { Factory } = rmlui;
      const parent = document.createElement('div');
      const child = Factory.instanceElement(parent, 'input', 'custom-control', {
        type: 'text', id: 'typed', value: '原生',
        exact: 9007199254740993n,
        vector: { x: 4, y: 7 },
      });
      assert.ok(child instanceof rmlui.ElementFormControlInput);
      assert.equal(child.tagName, 'custom-control');
      assert.equal(child.id, 'typed');
      assert.equal(child.getValue(), '原生');
      assert.equal(child.getAttributeValue('exact'), 9007199254740993n);
      assert.deepEqual(child.getAttributeValue('vector'),
        { x: 4, y: 7 });
      assert.equal(child.getParentNode(), null);
      assert.equal(parent.getNumChildren(), 0);
      assert.equal(parent.appendChild(child), child);
      assert.equal(Factory.instanceElement(null, 'progress', 'meter')
        instanceof rmlui.ElementProgress, true);
      // RmlUi falls back to its "*" instancer for unknown tags.
      assert.equal(Factory.instanceElement(null, 'unknown', 'custom').tagName,
        'custom');
      const pointerChild = Factory.instanceElement(parent, 'div', 'div', {
        pointer: parent,
      });
      assert.equal(pointerChild.getElementAttribute('pointer'), parent);
      pointerChild.release();
      assert.throws(() => Factory.instanceElement(parent, 4, 'div'), /string/i);
    },

  'factory-text-and-stream-append-parsed-native-elements':
    ({ rmlui, document }) => {
      const { Factory } = rmlui;
      const parent = document.createElement('div');
      assert.equal(Factory.instanceElementText(parent, ' \t\n '), true);
      assert.equal(parent.getNumChildren(), 0);
      assert.equal(Factory.instanceElementText(parent, 'A &amp; 中文'), true);
      assert.equal(parent.getChild(0).getText(), 'A & 中文');
      assert.equal(Factory.instanceElementText(parent,
        '<span id="translated">B</span>'), true);
      assert.equal(parent.getElementById('translated').tagName, 'span');
      const stream = new rmlui.StreamMemory(Buffer.from(
        '<body><input id="parsed" type="text" value="C"/></body>'));
      assert.equal(Factory.instanceElementStream(parent, stream), true);
      assert.equal(parent.getElementById('parsed').getValue(), 'C');
      assert.equal(stream.tell(), stream.length());
      assert.equal(Factory.instanceElementText(parent,
        '{{ x {{ y'), false);
      assert.throws(() => Factory.instanceElementText(null, 'text'),
        /element|handle/i);
      assert.throws(() => Factory.instanceElementStream(parent, {}),
        /stream/i);
    },

  'factory-stylesheet-string-file-stream-and-null-failures':
    ({ rmlui, context, document }) => {
      const { Factory } = rmlui;
      const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rmlui-factory-'));
      try {
        const filename = path.join(root, 'theme.rcss');
        fs.writeFileSync(filename, 'body { width: 73px; }');
        const values = [
          Factory.instanceStyleSheetString('body { width: 73px; }'),
          Factory.instanceStyleSheetFile(filename),
          Factory.instanceStyleSheetStream(
            source(rmlui, 'body { width: 73px; }')),
        ];
        for (const value of values) {
          assert.ok(value instanceof rmlui.StyleSheetContainer);
          assert.equal(value.getCompiledStyleSheet(), null);
          document.setStyleSheetContainer(value);
          document.updateDocument();
          assert.equal(document.getComputedValues().width.value, 73);
          assert.ok(value.getCompiledStyleSheet());
        }
        assert.ok(Factory.instanceStyleSheetString('body {'));
        assert.equal(Factory.instanceStyleSheetFile(
          path.join(root, 'missing.rcss')), null);
        assert.throws(() => Factory.instanceStyleSheetFile(
          `${filename}\0ignored`), /null|path|filename/i);
        const closed = new rmlui.StreamFile();
        assert.throws(() => Factory.instanceStyleSheetStream(closed),
          /closed|open/i);
        assert.equal(Factory.instanceStyleSheetString(''), null);
        assert.equal(Factory.instanceStyleSheetString('/* empty */'), null);
        values[0].updateCompiledStyleSheet(context);
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    },

  'factory-stream-failures-and-destructive-reentry-propagate':
    ({ rmlui, document }) => {
      const { Factory } = rmlui;
      const error = new Error('factory stream failed');
      const throwing = () => {
        throw error;
      };
      assert.throws(() => Factory.instanceStyleSheetStream(
        source(rmlui, 'body { width: 1px; }', throwing)),
      value => value === error);
      const parent = document.createElement('div');
      assert.throws(() => Factory.instanceElementStream(parent,
        source(rmlui, '<body/>', throwing)), value => value === error);
      assert.throws(() => Factory.instanceStyleSheetStream(
        source(rmlui, 'body {}', () => {
          Factory.clearStyleSheetCache();
          return 0;
        })), /callback|reent/i);
      assert.throws(() => Factory.instanceElementText(parent, {
        toString() {
          rmlui.shutdown();
          return 'x';
        },
      }), /string/i);
      assert.equal(rmlui.getNumContexts(), 1);
    },

  'factory-getters-revalidate-parent-before-native-borrow':
    ({ rmlui, context, document }) => {
      const parent = document.createElement('div');
      document.appendChild(parent);
      const attributes = {
        get id() {
          rmlui.removeContext(context.name);
          return 'stale';
        },
      };
      assert.throws(() => rmlui.Factory.instanceElement(parent,
        'div', 'div', attributes), /valid/i);
    },

  'factory-cache-clear-reloads-file-rules-and-template-source':
    ({ rmlui, context }) => {
      const root = fs.mkdtempSync(
        path.join(os.tmpdir(), 'rmlui-factory-cache-'));
      try {
        const rules = path.join(root, 'theme.rcss');
        const template = path.join(root, 'frame.rml');
        const panel = path.join(root, 'panel.rml');
        const templateSource = version =>
          '<template name="frame" content="content"><head>' +
          '<link type="text/rcss" href="theme.rcss"/></head><body>' +
          `<div id="version">${version}</div><div id="content"/>` +
          '</body></template>';
        fs.writeFileSync(rules, 'body { width: 20px; }');
        fs.writeFileSync(template, templateSource('One'));
        fs.writeFileSync(panel, '<rml><head>' +
          '<link type="text/template" href="frame.rml"/></head>' +
          '<body template="frame"><div id="user">Content</div></body></rml>');
        const load = () => {
          const document = context.loadDocument(panel);
          document.updateDocument();
          return document;
        };
        const first = load();
        assert.equal(first.getComputedValues().width.value, 20);
        assert.equal(first.getElementById('version').innerRML, 'One');
        assert.equal(first.getElementById('user').getParentNode().id,
          'content');
        fs.writeFileSync(rules, 'body { width: 40px; }');
        fs.writeFileSync(template, templateSource('Two'));
        const cached = load();
        assert.equal(cached.getComputedValues().width.value, 20);
        assert.equal(cached.getElementById('version').innerRML, 'One');
        rmlui.Factory.clearStyleSheetCache();
        const changedRules = load();
        assert.equal(changedRules.getComputedValues().width.value, 40);
        assert.equal(changedRules.getElementById('version').innerRML, 'One');
        rmlui.Factory.clearTemplateCache();
        const changedTemplate = load();
        assert.equal(changedTemplate.getComputedValues().width.value, 40);
        assert.equal(changedTemplate.getElementById('version').innerRML, 'Two');
        assert.equal(first.getComputedValues().width.value, 20);
        assert.equal(first.getElementById('version').innerRML, 'One');
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    },

  'factory-cache-clear-preserves-live-styles-and-structural-snapshots':
    ({ rmlui, context, document }) => {
      const { Factory } = rmlui;
      const styles = Factory.instanceStyleSheetString('body { width: 81px; }');
      document.setStyleSheetContainer(styles);
      document.updateDocument();
      const sheet = styles.getCompiledStyleSheet();
      Factory.clearStyleSheetCache();
      Factory.clearTemplateCache();
      assert.equal(document.getComputedValues().width.value, 81);
      assert.ok(sheet.getElementDefinition(document));
      const names = Factory.getStructuralDataViewAttributeNames();
      assert.deepEqual(new Set(names), new Set([ 'data-for' ]));
      assert.equal(Factory.isStructuralDataView('for'), true);
      assert.equal(Factory.isStructuralDataView('text'), false);
      assert.equal(Factory.isStructuralDataView('data-for'), false);
      names.push('data-fake');
      assert.equal(Factory.getStructuralDataViewAttributeNames()
        .includes('data-fake'), false);
      const node = document.createElement('div');
      node.addEventListener('guard', () => {
        assert.equal(Factory.isStructuralDataView('for'), true);
        assert.throws(() => Factory.clearStyleSheetCache(), /callback|reent/i);
        assert.throws(() => Factory.instanceElementText(node, 'x'),
          /callback|reent/i);
      });
      node.dispatchEvent('guard');
      context.update();
    },

  'factory-owned-element-gc-and-runtime-restart':
    async ({ rmlui, window }) => {
      let root;
      let child;
      (() => {
        const node = rmlui.Factory.instanceElement(null, 'div', 'div');
        rmlui.Factory.instanceElementText(node, '<span id="retained">X</span>');
        root = new WeakRef(node);
        child = node.getElementById('retained');
      })();
      await collect();
      assert.ok(root.deref());
      assert.equal(child.id, 'retained');
      child = null;
      await collect();
      assert.equal(root.deref(), undefined);
      const stale = rmlui.Factory.instanceStyleSheetString('body {}');
      rmlui.shutdown();
      assert.throws(() => rmlui.Factory.isStructuralDataView('for'),
        /initial/i);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => stale.getCompiledStyleSheet(), /valid/i);
      assert.ok(rmlui.Factory.instanceStyleSheetString('body {}'));
    },

  'factory-attributes-retain-native-tween-callbacks-with-visible-cycles':
    async ({ rmlui, document, context }) => {
      let node;
      let callback;
      let snapshot;
      let callbackWeak;
      (() => {
        const owner = rmlui.Factory.instanceElement(null, 'div', 'div', {
          motion: rmlui.makeTransitionList({
            none: false, all: false,
            transitions: [{ tween: new rmlui.Tween(t => {
              assert.ok(owner);
              return t;
            }) }],
          }),
        });
        node = new WeakRef(owner);
      })();
      await collect();
      assert.equal(node.deref(), undefined);
      (() => {
        callback = t => t * 0.5;
        callbackWeak = new WeakRef(callback);
        const owner = rmlui.Factory.instanceElement(document, 'div', 'div', {
          motion: rmlui.makeTransitionList({
            none: false, all: false,
            transitions: [{ tween: new rmlui.Tween(callback) }],
          }),
        });
        document.appendChild(owner);
        node = owner;
        callback = null;
      })();
      await collect();
      assert.equal(typeof callbackWeak.deref(), 'function');
      snapshot = node.getAttributeValue('motion');
      assert.equal(snapshot.transitions[0].tween.evaluate(0.5), 0.25);
      document.removeChild(node);
      node = null;
      context.update();
      await collect();
      assert.equal(snapshot.transitions[0].tween.evaluate(0.5), 0.25);
      snapshot = null;
      await collect();
      assert.equal(callbackWeak.deref(), undefined);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'RmlUi Factory');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('factory', 160, 120);
    const document = context.createDocument();
    await cases[name]({ rmlui, context, document, window });
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
  assert.equal(failures, 0, `${failures} factory failures`);
}
