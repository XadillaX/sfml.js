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
  'native-instancer-identity-subtypes-and-explicit-release':
    ({ rmlui, document }) => {
      const input = rmlui.Factory.getElementInstancer('input');
      assert.ok(input instanceof rmlui.ElementInstancer);
      assert.equal(input, rmlui.Factory.getElementInstancer('input'));
      assert.equal(rmlui.Factory.getElementInstancer('unregistered'),
        rmlui.Factory.getElementInstancer('*'));
      const plain = rmlui.Factory.getElementInstancer('*');
      rmlui.Factory.registerElementInstancer('disabled', null);
      assert.equal(rmlui.Factory.getElementInstancer('disabled'), null);
      assert.equal(rmlui.Factory.instanceElement(null, 'disabled', 'disabled'),
        null);
      rmlui.Factory.registerElementInstancer('*', null);
      assert.equal(rmlui.Factory.getElementInstancer('unknown'), null);
      assert.equal(rmlui.Factory.instanceElement(null, 'unknown', 'unknown'),
        null);
      rmlui.Factory.registerElementInstancer('*', plain);
      const node = input.instanceElement(document, 'field', { type: 'text' });
      assert.ok(node instanceof rmlui.ElementFormControlInput);
      assert.equal(node.tagName, 'field');
      input.releaseElement(node);
      assert.throws(() => node.tagName, /valid/i);
      const textInstancer = rmlui.Factory.getElementInstancer('#text');
      const text = textInstancer.instanceElement(null, '#text');
      assert.ok(text instanceof rmlui.ElementText);
      text.setText('Native 文本');
      const textClone = text.clone();
      // Upstream Element::Clone copies children, not ElementText's raw string.
      assert.equal(textClone.getText(), '');
      textInstancer.releaseElement(text);
      textInstancer.releaseElement(textClone);
      assert.throws(() => textClone.getText(), /valid/i);
      assert.throws(() => input.releaseElement(document), /owned|detached/i);
      const other = rmlui.Factory.getElementInstancer('*')
        .instanceElement(null, 'other');
      assert.throws(() => input.releaseElement(other), /instancer/i);
      assert.throws(() => new rmlui.ElementInstancer(4), /callback|function/i);
    },

  'custom-instancer-parsing-replacement-cloning-and-release':
    ({ rmlui, document }) => {
      const { Factory, ElementInstancer } = rmlui;
      const nativeInput = Factory.getElementInstancer('input');
      const calls = [];
      const released = [];
      const first = new ElementInstancer((parent, tag, attributes) => {
        calls.push({ parent, tag, attributes });
        return nativeInput.instanceElement(parent, tag, attributes);
      }, snapshot => released.push(snapshot));
      Factory.registerElementInstancer('FIELD', first);
      assert.equal(Factory.getElementInstancer('field'), first);
      // Registration lowercases names, while GetElementInstancer is exact.
      assert.equal(Factory.getElementInstancer('FIELD'),
        Factory.getElementInstancer('*'));
      const node = Factory.instanceElement(document, 'field', 'account', {
        id: 'custom', type: 'text', value: '中文', exact: 9007199254740993n,
      });
      assert.equal(calls[0].parent, document);
      assert.equal(calls[0].tag, 'account');
      assert.equal(calls[0].attributes.exact, 9007199254740993n);
      calls[0].attributes.value = 'copied';
      assert.equal(node.getValue(), '中文');
      const clone = node.clone();
      assert.ok(clone instanceof rmlui.ElementFormControlInput);
      assert.equal(clone.getValue(), '中文');
      const second = new ElementInstancer(() => null);
      Factory.registerElementInstancer('field', second);
      assert.equal(Factory.instanceElement(null, 'field', 'field'), null);
      first.releaseElement(node);
      first.releaseElement(clone);
      assert.deepEqual(released.map(item => item.tagName),
        [ 'account', 'account' ]);
      assert.equal(released[0].attributes.value, '中文');
      Factory.registerElementInstancer('field', first);
      document.innerRML = '<field id="parsed" type="text" value="RML"/>';
      assert.equal(document.getElementById('parsed').getValue(), 'RML');
      document.innerRML = '';
      assert.equal(released.at(-1).attributes.id, 'parsed');
    },

  'instancer-rejects-reentry-borrowed-reused-and-foreign-results':
    ({ rmlui, context, document }) => {
      const { Factory, ElementInstancer } = rmlui;
      const plain = Factory.getElementInstancer('*');
      const custom = new ElementInstancer((parent, tag, attributes) => {
        assert.throws(() => context.update(), /callback/i);
        assert.throws(() => document.close(), /callback/i);
        assert.throws(() => Factory.registerElementInstancer('other', custom),
          /callback/i);
        assert.throws(() => custom.instanceElement(parent, tag, attributes),
          /recursive/i);
        return plain.instanceElement(parent, tag, attributes);
      });
      Factory.registerElementInstancer('safe', custom);
      assert.equal(Factory.instanceElement(document, 'safe', 'safe').tagName,
        'safe');
      for (const result of [ document, {}, document.createElement('div') ]) {
        Factory.registerElementInstancer('bad',
          new ElementInstancer(() => result));
        assert.throws(() => Factory.instanceElement(document, 'bad', 'bad'),
          /owned|detached|instancer|handle|element/i);
      }
      const cached = plain.instanceElement(null, 'one');
      Factory.registerElementInstancer('reuse',
        new ElementInstancer(() => cached));
      const owned = Factory.instanceElement(null, 'reuse', 'one');
      document.appendChild(owned);
      assert.throws(() => Factory.instanceElement(null, 'reuse', 'two'),
        /owned|detached/i);
    },

  'instancer-exceptions-do-not-leak-or-prevent-native-release':
    ({ rmlui, document }) => {
      const { Factory, ElementInstancer } = rmlui;
      const plain = Factory.getElementInstancer('*');
      Factory.registerElementInstancer('throws',
        new ElementInstancer(() => {
          throw new Error('create failure');
        }));
      assert.throws(() => Factory.instanceElement(null, 'throws', 'throws'),
        /create failure/);
      const custom = new ElementInstancer(
        (parent, tag) => plain.instanceElement(parent, tag),
        () => {
          throw new Error('release failure');
        });
      Factory.registerElementInstancer('release', custom);
      const node = Factory.instanceElement(document, 'release', 'release');
      assert.throws(() => custom.releaseElement(node), /release failure/);
      assert.throws(() => node.tagName, /valid/i);
      assert.equal(Factory.instanceElement(null, 'div', 'div').tagName, 'div');
    },

  'unregistered-instancer-cycles-collect-and-native-trees-retain-callbacks':
    async ({ rmlui, context, document }) => {
      const { Factory, ElementInstancer } = rmlui;
      const plain = Factory.getElementInstancer('*');
      let node;
      let callbackWeak;
      let instancerWeak;
      (() => {
        let custom;
        const callback = (parent, tag) => {
          void custom;
          return plain.instanceElement(parent, tag);
        };
        custom = new ElementInstancer(callback);
        callbackWeak = new WeakRef(callback);
        instancerWeak = new WeakRef(custom);
        node = custom.instanceElement(null, 'owned');
      })();
      await collect();
      assert.equal(typeof callbackWeak.deref(), 'function');
      document.appendChild(node);
      node = null;
      await collect();
      assert.equal(typeof callbackWeak.deref(), 'function');
      document.innerRML = '';
      context.update();
      await collect();
      assert.equal(callbackWeak.deref(), undefined);
      assert.equal(instancerWeak.deref(), undefined);
      (() => {
        let owner;
        const callback = (parent, tag) => {
          void owner;
          return plain.instanceElement(parent, tag);
        };
        owner = new ElementInstancer(callback);
        callbackWeak = new WeakRef(callback);
        const orphan = owner.instanceElement(null, 'orphan');
        // A callback can close over its own detached result.
        owner = { instance: owner, orphan };
      })();
      await collect();
      context.update();
      await collect();
      assert.equal(callbackWeak.deref(), undefined);
    },

  'instancer-registration-retains-old-allocators-until-shutdown':
    async ({ rmlui, window }) => {
      const { Factory, ElementInstancer } = rmlui;
      const plain = Factory.getElementInstancer('*');
      let weak;
      let previous;
      let node;
      let releases = 0;
      (() => {
        const callback = (parent, tag) => plain.instanceElement(parent, tag);
        weak = new WeakRef(callback);
        previous = new ElementInstancer(callback, () => ++releases);
        Factory.registerElementInstancer('kept', previous);
        node = Factory.instanceElement(null, 'kept', 'kept');
        Factory.registerElementInstancer('kept',
          new ElementInstancer(() => null));
      })();
      await collect();
      assert.equal(typeof weak.deref(), 'function');
      rmlui.shutdown();
      assert.equal(releases, 1);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => previous.instanceElement(null, 'stale'), /valid/i);
      assert.throws(() => node.tagName, /valid/i);
      assert.equal(Factory.getElementInstancer('kept'),
        Factory.getElementInstancer('*'));
      await collect();
      assert.equal(weak.deref(), undefined);
    },

  'nested-instancers-preserve-clone-and-release-order':
    ({ rmlui }) => {
      const { Factory, ElementInstancer } = rmlui;
      const progress = Factory.getElementInstancer('progress');
      const calls = [];
      const released = [];
      const inner = new ElementInstancer((parent, tag, attributes) => {
        calls.push('inner');
        return progress.instanceElement(parent, tag, attributes);
      }, snapshot => released.push(`inner:${snapshot.tagName}`));
      const outer = new ElementInstancer((parent, tag, attributes) => {
        calls.push('outer');
        return inner.instanceElement(parent, tag, attributes);
      }, snapshot => released.push(`outer:${snapshot.tagName}`));
      Factory.registerElementInstancer('nested', outer);
      const node = Factory.instanceElement(null, 'nested', 'nested', {
        value: '0.25',
      });
      const clone = node.clone();
      assert.ok(clone instanceof rmlui.ElementProgress);
      assert.equal(clone.getValue(), 0.25);
      assert.deepEqual(calls, [ 'outer', 'inner', 'outer', 'inner' ]);
      outer.releaseElement(node);
      outer.releaseElement(clone);
      assert.deepEqual(released, [
        'outer:nested', 'inner:nested', 'outer:nested', 'inner:nested',
      ]);
    },

  'gc-inside-instancer-callback-delivers-release-at-safe-boundary':
    async ({ rmlui, context }) => {
      const { Factory, ElementInstancer } = rmlui;
      const plain = Factory.getElementInstancer('*');
      let insideCallback = false;
      let releases = 0;
      const custom = new ElementInstancer((parent, tag) =>
        plain.instanceElement(parent, tag), snapshot => {
        assert.equal(insideCallback, false);
        assert.equal(snapshot.tagName, 'collected');
        ++releases;
      });
      Factory.registerElementInstancer('collected', custom);
      let node = Factory.instanceElement(null, 'collected', 'collected');
      const weak = new WeakRef(node);
      node = null;
      await new Promise(resolve => setImmediate(resolve));
      Factory.registerElementInstancer('gc-trigger',
        new ElementInstancer((parent, tag) => {
          insideCallback = true;
          global.gc();
          global.gc();
          assert.equal(releases, 0);
          insideCallback = false;
          return plain.instanceElement(parent, tag);
        }));
      const trigger = Factory.instanceElement(null, 'gc-trigger', 'gc-trigger');
      await collect();
      context.update();
      assert.equal(weak.deref(), undefined);
      assert.equal(releases, 1);
      assert.equal(trigger.tagName, 'gc-trigger');
    },

  'native-document-and-widget-allocators-survive-context-removal':
    ({ rmlui, context, document }) => {
      const { Factory, ElementInstancer } = rmlui;
      const body = Factory.getElementInstancer('body');
      const input = Factory.getElementInstancer('input');
      const released = [];
      Factory.registerElementInstancer('custom-body',
        new ElementInstancer((parent, tag, attributes) =>
          body.instanceElement(parent, tag, attributes),
        snapshot => released.push(snapshot.tagName)));
      const standalone = Factory.instanceElement(
        null, 'custom-body', 'custom-body');
      assert.ok(standalone instanceof rmlui.Document);
      Factory.getElementInstancer('custom-body').releaseElement(standalone);
      Factory.registerElementInstancer('custom-input',
        new ElementInstancer((parent, tag, attributes) =>
          input.instanceElement(parent, tag, attributes),
        snapshot => released.push(snapshot.tagName)));
      document.innerRML =
        '<custom-input type="text" value="native" id="owned"/>';
      const field = document.getElementById('owned');
      assert.equal(field.getValue(), 'native');
      assert.equal(rmlui.removeContext(context.name), true);
      assert.throws(() => field.getValue(), /valid/i);
      assert.deepEqual(released, [ 'custom-body', 'custom-input' ]);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Element instancers');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('instancers', 160, 120);
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
  assert.equal(failures, 0, `${failures} element instancer failures`);
}
