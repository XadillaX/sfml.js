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
  'native-base-value-name-disabled-and-focus': ({ rmlui, context }) => {
    const instancer = rmlui.ElementFormControl.createInstancer();
    assert.ok(instancer instanceof rmlui.ElementInstancer);
    rmlui.Factory.registerElementInstancer('value-field', instancer);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body><value-field id="field" value="A🌙中"/></body></rml>');
    const node = document.getElementById('field');
    assert.ok(node instanceof rmlui.ElementFormControl);
    assert.equal(node instanceof rmlui.ElementFormControlInput, false);
    assert.equal(node.getClassIdentifier(),
      rmlui.ElementFormControl.getStaticClassIdentifier());
    assert.equal(rmlui.Element.wrap(node.handle), node);
    assert.equal(node.getValue(), 'A🌙中');
    node.setValue('native & <literal>');
    assert.equal(node.getAttribute('value'), 'native & <literal>');
    node.setAttribute('value', 42);
    assert.equal(node.getValue(), '42');
    node.removeAttribute('value');
    assert.equal(node.getValue(), '');
    node.setName('answer');
    assert.equal(node.getName(), 'answer');
    assert.equal(node.isSubmitted(), true);
    document.show();
    context.update();
    assert.equal(node.focus(), true);
    node.setDisabled(true);
    assert.equal(node.isDisabled(), true);
    assert.equal(node.isPseudoClassSet('disabled'), true);
    context.update();
    assert.equal(node.focus(), false);
    assert.equal(node.isSubmitted(), true);
    node.setDisabled(false);
    assert.equal(node.hasAttribute('disabled'), false);
    assert.equal(node.isPseudoClassSet('disabled'), false);
    context.update();
    assert.equal(node.focus(), true);
  },

  'configured-key-direct-allocation-and-clone-provenance': ({ rmlui }) => {
    const first = rmlui.ElementFormControl.createInstancer('payload');
    const direct = first.instanceElement(null, 'field', { payload: 'ignored' });
    assert.equal(direct.getValue(), '',
      'Direct instancing supplies attributes without applying them');
    direct.setValue('owned');
    assert.equal(direct.getAttribute('payload'), 'owned');
    first.releaseElement(direct);
    rmlui.Factory.registerElementInstancer('field', first);
    const node = rmlui.Factory.instanceElement(null, 'field', 'custom-tag', {
      payload: 73, value: 'other attribute',
    });
    assert.equal(node.getValue(), '73');
    const second = rmlui.ElementFormControl.createInstancer('other');
    rmlui.Factory.registerElementInstancer('field', second);
    const clone = node.clone();
    assert.equal(clone.getValue(), '73');
    clone.setValue('clone');
    assert.equal(clone.getAttribute('payload'), 'clone');
    assert.equal(node.getValue(), '73');
    assert.equal(clone.getAttribute('other'), null);
    assert.throws(() => second.releaseElement(clone), /instancer/i);
    first.releaseElement(node);
    first.releaseElement(clone);
    assert.throws(() => clone.getValue(), /valid/i);
  },

  'native-form-submit-preserves-upstream-tag-selection':
    ({ rmlui, context }) => {
      const instancer = rmlui.ElementFormControl.createInstancer('payload');
      rmlui.Factory.registerElementInstancer('input', instancer);
      rmlui.Factory.registerElementInstancer('custom-field', instancer);
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body><form id="form">' +
        '<input name="answer" payload="first"/>' +
        '<input name="answer" payload="second"/>' +
        '<input name="disabled" payload="skip" disabled/>' +
        '<input payload="unnamed"/>' +
        '<custom-field name="custom" payload="not selected"/>' +
        '</form></body></rml>');
      const form = document.getElementById('form');
      let parameters;
      form.addEventListener('submit', event => {
        parameters = event.parameters;
      });
      form.submit('action', 'save');
      assert.deepEqual(parameters, {
        action: 'save', answer: 'first, second',
      });
    },

  'shared-data-updates-native-values-without-reverse-callbacks':
    ({ rmlui, context, native }) => {
      rmlui.Factory.registerElementInstancer('value-field',
        rmlui.ElementFormControl.createInstancer('payload'));
      const model = context.createDataModel('values');
      const types = model.getDataTypeRegister();
      const array = types.registerArray('Values',
        types.registerScalar('Real', 'float64'));
      model.bind('values', [ 1, 2, 3 ], array);
      const view = model.getVariable('values').getNumericView();
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body data-model="values">' +
        '<div data-for="value : values">' +
        '<value-field data-attr-payload="value"/></div></body></rml>');
      document.show();
      context.update();
      native.beginDataDiagnostics();
      let counts;
      try {
        view.fill(19);
        model.dirtyAllVariables();
        context.update();
      } finally {
        counts = native.endDataDiagnostics();
      }
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.runtimeEntries, 2);
      assert.equal(counts.backingAllocations, 0);
      const controls = document.querySelectorAll('value-field');
      assert.equal(controls.length, 3);
      assert.deepEqual(controls.map(control => control.getValue()),
        [ '19', '19', '19' ]);
    },

  'native-allocator-entries-do-not-install-js-value-callbacks':
    ({ rmlui, native }) => {
      native.beginDataDiagnostics();
      let counts;
      try {
        const instancer = rmlui.ElementFormControl.createInstancer();
        const node = instancer.instanceElement(null, 'field');
        node.setValue('value');
        assert.equal(node.getValue(), 'value');
        instancer.releaseElement(node);
      } finally {
        counts = native.endDataDiagnostics();
      }
      // Allocation adds one canonical native RTTI lookup for the new wrapper.
      assert.equal(counts.runtimeEntries, 6);
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.callbacks.instancer, 0);
    },

  'new-allocation-and-clone-ownership-work-ignores-existing-wrappers':
    ({ rmlui, document, context, native }) => {
      const tween = new rmlui.Tween(value => value);
      const end = new rmlui.Property(10, rmlui.Unit.PX);
      const start = new rmlui.Property(1, rmlui.Unit.PX);
      for (let i = 0; i < 1000; ++i) {
        const node = new rmlui.Element('existing');
        document.appendChild(node);
        node.animate('width', end, 60, tween, 1, false, 0, start);
      }
      context.update();
      const instancer = rmlui.ElementFormControl.createInstancer();
      rmlui.Factory.registerElementInstancer('value-field', instancer);
      const source = instancer.instanceElement(null, 'field');
      source.setValue('source');
      for (const allocate of [
        () => instancer.instanceElement(null, 'field'),
        () => rmlui.Factory.instanceElement(null, 'value-field', 'field'),
        () => source.clone(),
      ]) {
        const nodes = new Array(100);
        native.beginDataDiagnostics();
        let counts;
        try {
          for (let i = 0; i < nodes.length; ++i) {
            nodes[i] = allocate();
          }
        } finally {
          counts = native.endDataDiagnostics();
        }
        assert.equal(counts.nativeCallbacks, 0);
        assert.equal(counts.ownershipInstanceVisits, 0);
        assert.equal(counts.callbackLeaseVisits.tween, 0);
        assert.ok(counts.elementOwnershipVisits <= nodes.length * 4,
          `New wrapper work: ${counts.elementOwnershipVisits}`);
        assert.ok(counts.callbackParentNodeVisits <= nodes.length * 3);
        for (const node of nodes) {
          node.release();
        }
      }
      source.release();
    },

  'nested-js-delegation-preserves-native-allocator-and-release-order':
    ({ rmlui }) => {
      const nativeInstancer = rmlui.ElementFormControl.createInstancer('data');
      const released = [];
      const delegated = new rmlui.ElementInstancer((parent, tag, attributes) =>
        nativeInstancer.instanceElement(parent, tag, attributes),
      snapshot => released.push(snapshot.attributes.data));
      rmlui.Factory.registerElementInstancer('delegated', delegated);
      const node = rmlui.Factory.instanceElement(null, 'delegated', 'field',
        { data: 'original' });
      const clone = node.clone();
      assert.equal(clone.getValue(), 'original');
      clone.setValue('clone');
      delegated.releaseElement(node);
      delegated.releaseElement(clone);
      assert.deepEqual(released, [ 'original', 'clone' ]);
    },

  'direct-clones-pin-native-values-through-changing-nested-delegation':
    ({ rmlui }) => {
      const first = rmlui.ElementFormControl.createInstancer('payload');
      const second = rmlui.ElementFormControl.createInstancer('other');
      let selected = first;
      let creates = 0;
      const released = [];
      const inner = new rmlui.ElementInstancer((parent, tag, attributes) => {
        ++creates;
        return selected.instanceElement(parent, tag, attributes);
      }, snapshot => released.push(`inner:${snapshot.attributes.payload}`));
      const outer = new rmlui.ElementInstancer((parent, tag, attributes) =>
        inner.instanceElement(parent, tag, attributes),
      snapshot => released.push(`outer:${snapshot.attributes.payload}`));
      rmlui.Factory.registerElementInstancer('changing', outer);
      const node = rmlui.Factory.instanceElement(null, 'changing', 'field',
        { payload: 'original', other: 'different' });
      selected = second;
      const clone = node.clone();
      assert.equal(clone.getValue(), 'original');
      clone.setValue('clone');
      assert.equal(clone.getAttribute('payload'), 'clone');
      assert.equal(clone.getAttribute('other'), 'different');
      assert.equal(creates, 1,
        'Native value cloning does not replay JS allocation');
      assert.throws(() => first.releaseElement(clone), /instancer/i);
      outer.releaseElement(node);
      outer.releaseElement(clone);
      assert.deepEqual(released, [
        'outer:original', 'inner:original', 'outer:clone', 'inner:clone',
      ]);
    },

  'unregistered-native-allocator-survives-wrapper-gc-and-tree-transfers':
    async ({ rmlui, context, document }) => {
      let weak;
      let node;
      (() => {
        const instancer = rmlui.ElementFormControl.createInstancer('payload');
        weak = new WeakRef(instancer);
        node = instancer.instanceElement(null, 'field');
        node.setValue('retained');
      })();
      await collect();
      assert.equal(weak.deref(), undefined);
      const clone = node.clone();
      assert.equal(clone.getValue(), 'retained');
      document.appendChild(node);
      assert.throws(() => node.release(), /owned|detached/i);
      assert.equal(document.removeChild(node), node);
      node.release();
      clone.release();
      assert.throws(() => node.getValue(), /valid/i);
      let orphan;
      (() => {
        const instancer = rmlui.ElementFormControl.createInstancer();
        orphan = new WeakRef(instancer.instanceElement(null, 'orphan'));
      })();
      await collect();
      context.update();
      assert.equal(orphan.deref(), undefined);
    },

  'invalid-options-and-shutdown-generation': ({ rmlui, window }) => {
    for (const key of [ '', null, 4, {}, 'value\0suffix' ]) {
      assert.throws(() => rmlui.ElementFormControl.createInstancer(key),
        /attribute|string/i);
    }
    assert.throws(() => new rmlui.ElementFormControl('field'), /abstract/i);
    const instancer = rmlui.ElementFormControl.createInstancer();
    const node = instancer.instanceElement(null, 'field');
    rmlui.shutdown();
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => instancer.instanceElement(null, 'stale'), /valid/i);
    assert.throws(() => node.getValue(), /valid/i);
    const fresh = rmlui.ElementFormControl.createInstancer();
    fresh.releaseElement(fresh.instanceElement(null, 'fresh'));
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const native = require('../../build/Release/rmlui.node');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Native value controls');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('values', 160, 120);
    const document = context.createDocument();
    await cases[name]({ rmlui, window, context, document, native });
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
  assert.equal(failures, 0, `${failures} native value control failures`);
}
