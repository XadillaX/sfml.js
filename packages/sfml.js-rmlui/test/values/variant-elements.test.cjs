'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 16; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'property-dictionary-and-attribute-copies': ({ rmlui, document }) => {
    const element = new rmlui.Element('div');
    const property = new rmlui.Property(element);
    const copy = property.clone();
    const dictionary = new rmlui.PropertyDictionary();
    dictionary.setCustomProperty('--element', property);
    property.value = null;
    assert.equal(copy.value, element);
    assert.equal(copy.getElementValue(), element);
    assert.equal(dictionary.getCustomProperty('--element').value, element);
    assert.equal(copy.equals(new rmlui.Property(element)), true);
    document.setAttributes({ target: element, ['__proto__']: element });
    const cloned = document.clone();
    document.removeAttribute('target');
    assert.equal(cloned.getElementAttribute('target'), element);
    assert.equal(Object.getOwnPropertyDescriptor(
      cloned.getAttributes(), '__proto__').value, element);
    assert.equal(cloned.getAttributeValue('target'), element);
    element.release();
    assert.equal(copy.getElementValue(), null);
    assert.equal(copy.value, null);
    assert.equal(dictionary.getCustomProperty('--element').value, null);
    assert.equal(cloned.getElementAttribute('target'), null);
    cloned.release();
  },

  'typed-defaults-and-address-free-serialization': ({ rmlui, document }) => {
    const target = new rmlui.Element('div');
    const property = new rmlui.Property(target);
    document.setAttribute('target', target);
    assert.equal(document.getElementAttribute('target', document), target);
    assert.equal(document.getElementAttribute('absent', document), document);
    document.setAttribute('number', 1);
    assert.equal(document.getElementAttribute('number', target), target);
    assert.equal(new rmlui.Property(1).getElementValue(), null);
    assert.throws(() => property.toString(), /pointer|element|typed/i);
    assert.throws(() => property.get(''), /pointer|typed/i);
    assert.throws(() => document.getAttribute('target'), /pointer|typed/i);
    assert.throws(() => document.getAttribute('target', ''), /pointer|typed/i);
    assert.equal(/0x[0-9a-f]{8,}/i.test(document.innerRML), false);
    assert.throws(() => document.getElementAttribute('absent', {}),
      /element|handle/i);
    assert.throws(() => document.getElementAttribute(1), /name/i);
    target.release();
    assert.equal(document.getElementAttribute('target', document), null,
      'a successfully converted native null does not select the fallback');
    assert.throws(() => document.getElementAttribute('absent', target),
      /valid/i);
  },

  'destroyed-dom-targets-null-every-native-copy': ({ rmlui, document }) => {
    document.innerRML = '<div id="target"/><div id="owner"/>';
    const target = document.getElementById('target');
    const owner = document.getElementById('owner');
    const property = new rmlui.Property(target);
    const copy = property.clone();
    const retained = new rmlui.Element('div', { target });
    owner.setAttribute('target', target);
    const cloned = owner.clone();
    document.innerRML = '';
    assert.equal(property.value, null);
    assert.equal(copy.getElementValue(), null);
    assert.equal(retained.getElementAttribute('target'), null);
    assert.equal(cloned.getElementAttribute('target'), null);
    retained.release();
    cloned.release();
  },

  'detach-and-reparent-preserve-the-target': ({ rmlui, document }) => {
    document.innerRML = '<div id="target"/><div id="owner"/>';
    const target = document.getElementById('target');
    const owner = document.getElementById('owner');
    const property = new rmlui.Property(target);
    owner.setAttribute('target', target);
    assert.equal(document.removeChild(target), target);
    assert.equal(property.value, target);
    owner.appendChild(target);
    assert.equal(owner.getElementAttribute('target'), target);
    assert.equal(property.clone().value, target);
  },

  'copied-native-owner-retains-target-until-clear': async ({ rmlui }) => {
    const dictionary = new rmlui.PropertyDictionary();
    let targetRef;
    (() => {
      const target = new rmlui.Element('div');
      targetRef = new WeakRef(target);
      dictionary.setCustomProperty('--target', new rmlui.Property(target));
    })();
    await collect();
    assert.ok(targetRef.deref());
    assert.equal(dictionary.getCustomProperty('--target').value.tagName,
      'div');
    dictionary.clear();
    await collect();
    assert.equal(targetRef.deref(), undefined);
  },

  'attribute-replacement-and-removal-release-targets': async ({ rmlui }) => {
    const owner = new rmlui.Element('div');
    let replaced;
    let removed;
    (() => {
      const first = new rmlui.Element('div');
      const second = new rmlui.Element('div');
      replaced = new WeakRef(first);
      removed = new WeakRef(second);
      owner.setAttribute('replace', first);
      owner.setAttribute('remove', second);
    })();
    await collect();
    assert.ok(replaced.deref());
    assert.ok(removed.deref());
    owner.setAttribute('replace', 1);
    owner.removeAttribute('remove');
    await collect();
    assert.equal(replaced.deref(), undefined);
    assert.equal(removed.deref(), undefined);
    owner.release();
  },

  'self-and-cross-element-cycles-collect': async ({ rmlui }) => {
    let selfRef;
    let firstRef;
    let secondRef;
    let propertyRef;
    (() => {
      const self = new rmlui.Element('div');
      self.setAttribute('self', self);
      const first = new rmlui.Element('div');
      const second = new rmlui.Element('div');
      first.setAttribute('peer', second);
      second.setAttribute('peer', first);
      const property = new rmlui.Property(first);
      first.property = property;
      selfRef = new WeakRef(self);
      firstRef = new WeakRef(first);
      secondRef = new WeakRef(second);
      propertyRef = new WeakRef(property);
    })();
    await collect();
    for (const ref of [ selfRef, firstRef, secondRef, propertyRef ]) {
      assert.equal(ref.deref(), undefined);
    }
  },

  'native-document-roots-retain-and-release-targets':
    async ({ rmlui, document, context }) => {
      let targetRef;
      (() => {
        const target = new rmlui.Element('div');
        targetRef = new WeakRef(target);
        document.setAttribute('target', target);
      })();
      await collect();
      assert.ok(targetRef.deref());
      assert.equal(document.getElementAttribute('target').tagName, 'div');
      document.close();
      context.update();
      await collect();
      assert.equal(targetRef.deref(), undefined);
    },

  'destroyed-target-handles-are-not-retained-by-copies':
    async ({ rmlui }) => {
      let property;
      let copy;
      let targetRef;
      (() => {
        const target = new rmlui.Element('div');
        targetRef = new WeakRef(target);
        property = new rmlui.Property(target);
        copy = property.clone();
        target.release();
      })();
      assert.equal(property.value, null);
      assert.equal(copy.value, null);
      await collect();
      assert.equal(targetRef.deref(), undefined);
    },

  'unchanged-pointer-frames-do-not-scan-owners':
    ({ rmlui, context, document }) => {
      const target = new rmlui.Element('div');
      document.setAttribute('target', target);
      context.update();
      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics();
      for (let i = 0; i < 16; ++i) {
        context.update();
        assert.equal(document.getElementAttribute('target'), target);
      }
      const counts = native.endDataDiagnostics();
      assert.equal(counts.callbackSnapshotVisits, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
      document.removeAttribute('target');
      target.release();
    },

  'accessors-and-restarted-generations': ({ rmlui, window }) => {
    const owner = new rmlui.Element('div');
    const target = new rmlui.Element('div');
    const property = new rmlui.Property(target);
    const { native } = require('../../dist/internal/native');
    assert.throws(() => native.setAttributes(owner.handle, {
      target: target.handle,
      get later() {
        target.release();
        return 1;
      },
    }), /valid/i);
    assert.equal(owner.hasAttribute('target'), false);
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => property.getElementValue(), /valid/i);
    assert.throws(() => new rmlui.Property(target), /valid/i);
    assert.throws(() => owner.getElementAttribute('target'), /valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Variant elements');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('elements', 160, 120);
    await cases[name]({ rmlui, window, context,
      document: context.createDocument() });
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
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} persistent element Variant failures`);
}
