'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'concrete-constructors-preserve-native-type-and-initialize-attributes':
    ({ rmlui }) => {
      const names = [
        'Element', 'Document', 'ElementText', 'ElementForm',
        'ElementFormControlInput', 'ElementFormControlSelect',
        'ElementFormControlTextArea', 'ElementProgress', 'ElementTabSet',
      ];
      for (const name of names) {
        const Constructor = rmlui[name];
        const node = new Constructor('custom-tag', { id: name, exact: 7n });
        assert.equal(node.tagName, 'custom-tag');
        assert.equal(node.id, name);
        assert.equal(node.getAttributeValue('exact'), 7n);
        assert.equal(node.getClassIdentifier(),
          Constructor.getStaticClassIdentifier());
        if (node instanceof rmlui.ElementFormControl) {
          assert.equal(node.getValue(), '');
          assert.equal(typeof node.isSubmitted(), 'boolean');
          node.setValue('native');
          assert.equal(node.getValue(), 'native');
        }
        const children = [];
        for (let i = 0; i < node.getNumChildren(true); ++i) {
          children.push(node.getChild(i));
        }
        node.release();
        assert.throws(() => node.tagName, /valid/i);
        for (const child of children) {
          assert.throws(() => child.tagName, /valid/i);
        }
      }
      const input = new rmlui.ElementFormControlInput('field', {
        type: 'checkbox', value: 'yes', checked: '',
      });
      assert.equal(input.getValue(), 'yes');
      assert.equal(input.isSubmitted(), true);
      input.release();
      class Field extends rmlui.ElementFormControlInput {}
      const custom = new Field('field', { value: 'subclass' });
      assert.equal(custom.getValue(), 'subclass');
      assert.equal(custom.getClassIdentifier(),
        rmlui.ElementFormControlInput.getStaticClassIdentifier());
      custom.release();
    },

  'detached-ownership-transfer-keeps-identity-and-rejects-active-release':
    ({ rmlui, context, document }) => {
      const root = new rmlui.Element('section');
      const child = new rmlui.Element('child');
      root.appendChild(child);
      assert.throws(() => child.release(), /owned|detached/i);
      document.appendChild(root);
      assert.equal(document.getFirstChild(), root);
      assert.throws(() => root.release(), /owned|detached/i);
      assert.equal(document.removeChild(root), root);
      root.addEventListener('probe', () => {
        assert.throws(() => root.release(), /active|callback/i);
      });
      root.dispatchEvent('probe');
      document.appendChild(root);
      assert.equal(document.removeChild(root), root);
      root.release();
      context.update();
      assert.throws(() => child.tagName, /valid/i);
      assert.throws(() => document.release(), /owned|detached/i);
    },

  'custom-instancers-return-direct-constructors-and-preserve-clone-release':
    ({ rmlui }) => {
      const { Factory, ElementInstancer, ElementFormControlInput } = rmlui;
      const released = [];
      const instancer = new ElementInstancer((parent, tag, attributes) =>
        new ElementFormControlInput(tag, attributes),
      snapshot => released.push(snapshot.tagName));
      Factory.registerElementInstancer('direct', instancer);
      const node = Factory.instanceElement(null, 'direct', 'field', {
        value: 'owned', type: 'text',
      });
      const clone = node.clone();
      assert.ok(clone instanceof ElementFormControlInput);
      assert.equal(clone.getValue(), 'owned');
      node.release();
      instancer.releaseElement(clone);
      assert.deepEqual(released, [ 'field', 'field' ]);
    },

  'constructor-validates-abstract-type-arguments-and-runtime-generation':
    ({ rmlui, window }) => {
      assert.throws(() => new rmlui.ElementFormControl('field'), /abstract/i);
      for (const invalid of [ undefined, null, 4, {}, []]) {
        assert.throws(() => new rmlui.Element(invalid),
          /tag|element|handle|Expected/i);
      }
      assert.throws(() => new rmlui.Element('div', []), /attribute/i);
      assert.throws(() => new rmlui.Element('div', null), /attribute/i);
      assert.throws(() => new rmlui.Element('div', {
        get value() {
          throw new Error('attribute getter failure');
        },
      }), /attribute getter failure/);
      const values = {
        get value() {
          rmlui.shutdown();
          assert.ok(rmlui.initialise(window, { highDpi: false }));
          return 'stale';
        },
      };
      assert.throws(() => new rmlui.Element('div', values), /runtime changed/i);
      const fresh = new rmlui.Element('fresh');
      fresh.release();
      const stale = new rmlui.Element('stale');
      rmlui.shutdown();
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => stale.release(), /valid/i);
    },

  'failed-widget-constructors-unwind-and-remain-retryable':
    ({ rmlui }) => {
      const { Factory, ElementInstancer } = rmlui;
      const plain = Factory.getElementInstancer('*');
      const text = Factory.getElementInstancer('#text');
      const selection = Factory.getElementInstancer('#selection');
      for (const Constructor of [
        rmlui.ElementProgress, rmlui.ElementFormControlSelect,
      ]) {
        Factory.registerElementInstancer('*',
          new ElementInstancer(() => null));
        assert.throws(() => new Constructor('failed'), /instance|children/i);
        Factory.registerElementInstancer('*', plain);
        const node = new Constructor('retry');
        node.release();
      }
      for (const Constructor of [
        rmlui.ElementFormControlInput, rmlui.ElementFormControlTextArea,
      ]) {
        let calls = 0;
        Factory.registerElementInstancer('#text',
          new ElementInstancer((parent, tag) => {
            if (++calls === 2) {
              throw new Error('second text failure');
            }
            return text.instanceElement(parent, tag);
          }));
        assert.throws(() => new Constructor('failed'), /second text failure/);
        Factory.registerElementInstancer('#text', text);
        Factory.registerElementInstancer('#selection',
          new ElementInstancer(() => null));
        assert.throws(() => new Constructor('failed'), /instance|selection/i);
        Factory.registerElementInstancer('#selection', selection);
        const node = new Constructor('retry');
        assert.equal(node.getValue(), '');
        node.release();
      }
    },

  'direct-constructor-child-retains-owner-until-gc':
    async ({ rmlui, context }) => {
      let child;
      let weak;
      (() => {
        const root = new rmlui.Element('root');
        child = new rmlui.ElementFormControlInput('field');
        root.appendChild(child);
        weak = new WeakRef(root);
      })();
      for (let i = 0; i < 12; ++i) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
      context.update();
      assert.ok(weak.deref() instanceof rmlui.Element);
      assert.equal(child.getValue(), '');
      child = null;
      for (let i = 0; i < 12; ++i) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
      context.update();
      assert.equal(weak.deref(), undefined);
    },

  'construction-captures-generation-and-transfers-one-snapshot':
    ({ rmlui }) => {
      const native = require('../../build/Release/rmlui.node');
      const measure = (action, subtreeSize, entries) => {
        native.beginDataDiagnostics();
        try {
          action();
        } finally {
          const counts = native.endDataDiagnostics();
          assert.equal(counts.runtimeEntries, entries);
          assert.equal(counts.nativeCallbacks, 0);
          assert.equal(counts.elementOwnershipVisits, subtreeSize);
        }
      };
      for (const Constructor of [ rmlui.Element,
        rmlui.ElementFormControlInput, rmlui.ElementProgress ]) {
        let node;
        const subtreeSize = Constructor === rmlui.Element ? 1
          : Constructor === rmlui.ElementFormControlInput ? 4 : 2;
        measure(() => {
          node = new Constructor('owned', { id: 'one', value: '2' });
        }, subtreeSize, 2);
        measure(() => node.release(), subtreeSize, 1);
      }
    },

  'construction-work-is-linear-in-new-nodes':
    ({ rmlui }) => {
      const native = require('../../build/Release/rmlui.node');
      const nodes = [];
      for (let i = 0; i < 1000; ++i) {
        nodes.push(new rmlui.Element('existing'));
      }
      native.beginDataDiagnostics();
      const created = Array.from({ length: 1000 }, () =>
        new rmlui.Element('new'));
      const counts = native.endDataDiagnostics();
      assert.equal(counts.runtimeEntries, 2000);
      assert.equal(counts.elementOwnershipVisits, 1000);
      assert.equal(counts.nativeCallbacks, 0);
      native.beginDataDiagnostics();
      for (const node of created) {
        node.release();
      }
      const released = native.endDataDiagnostics();
      assert.equal(released.runtimeEntries, 1000);
      assert.equal(released.elementOwnershipVisits, 1000);
      for (const node of nodes) {
        node.release();
      }
    },

  'range-construction-failure-and-type-retry-are-checked':
    ({ rmlui, document, context }) => {
      const { Factory, ElementInstancer, ElementFormControlInput } = rmlui;
      const plain = Factory.getElementInstancer('*');
      const input = new ElementFormControlInput('input', {
        type: 'checkbox', value: 'yes',
      });
      document.appendChild(input);
      Factory.registerElementInstancer('*',
        new ElementInstancer(() => null));
      assert.throws(() => new ElementFormControlInput('range', {
        type: 'range', value: '25',
      }), /instance|slider/i);
      assert.throws(() => input.setAttributes({
        type: 'range', value: '25',
      }), /instance|slider/i);
      assert.throws(() => input.getValue(), /initialised|initialized/i);
      assert.throws(() => context.update(), /initialised|initialized/i);
      Factory.registerElementInstancer('*', plain);
      input.setAttributes({ type: 'text', value: 'repaired' });
      assert.equal(input.getValue(), 'repaired');
      context.update();
      document.removeChild(input);
      input.release();
    },

  'text-child-instancers-observe-upstream-construction-order':
    ({ rmlui }) => {
      const { Factory, ElementInstancer, ElementFormControlInput } = rmlui;
      const text = Factory.getElementInstancer('#text');
      const selection = Factory.getElementInstancer('#selection');
      const observations = [];
      Factory.registerElementInstancer('#text',
        new ElementInstancer((parent, tag) => {
          observations.push(parent.getNumChildren(true));
          return text.instanceElement(parent, tag);
        }));
      Factory.registerElementInstancer('#selection',
        new ElementInstancer((parent, tag) => {
          observations.push(parent.getNumChildren(true));
          return selection.instanceElement(parent, tag);
        }));
      const input = new ElementFormControlInput('input');
      assert.deepEqual(observations, [ 0, 0, 2 ]);
      input.release();
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Owned constructors');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('constructors', 160, 120);
    const document = context.createDocument();
    await cases[name]({ rmlui, window, context, document });
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
  assert.equal(failures, 0, `${failures} owned constructor failures`);
}
