'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function counted(action) {
  const native = require('../../build/Release/rmlui.node');
  native.beginDataDiagnostics(false);
  try {
    action();
    return native.endDataDiagnostics();
  } catch (error) {
    native.endDataDiagnostics();
    throw error;
  }
}

function fixture(rmlui, context, size = 3, name = 'batch') {
  const model = context.createDataModel(name);
  assert.ok(model.bind('value', 3));
  assert.ok(model.bind('other', 7));
  const document = context.loadDocumentFromMemory(
    `<rml><head/><body data-model="${name}">` +
    '<i/>'.repeat(size) + '</body></rml>');
  const elements = document.getElementsByTagName('i');
  context.update();
  return { model, document, elements };
}

function setWidths(rmlui, batch, count) {
  const commands = batch.commands;
  for (let i = 0; i < count; i++) {
    commands.opcodes[i] = rmlui.ElementCommandOpcode.SetNumeric;
    commands.elements[i] = batch.slots[i];
    commands.properties[i] = rmlui.PropertyId.Width;
    commands.units[i] = rmlui.Unit.PX;
    commands.numbers[i] = batch.inputs[i] + 1;
  }
  return count;
}

const cases = {
  'native-inputs-1000-10000-100000-have-fixed-crossings': function({
    rmlui, context,
  }) {
    for (const size of [ 1000, 10000, 100000 ]) {
      const { model, document, elements } =
        fixture(rmlui, context, size, `batch${size}`);
      let calls = 0;
      const batch = new rmlui.DataBatchView(
        model, elements, elements.map(() => 'value'),
        (current, count) => {
          calls++;
          assert.equal(count, size);
          return setWidths(rmlui, current, count);
        });
      context.update();
      assert.equal(calls, 1);
      model.getVariable('value').set(19);
      model.dirtyVariable('value');
      const counts = counted(() => context.update());
      assert.equal(calls, 2);
      assert.equal(counts.runtimeEntries, 1);
      assert.equal(counts.nativeCallbacks, 1);
      assert.equal(counts.variantToJs, 0);
      assert.equal(counts.ownershipInstanceVisits, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
      assert.equal(counts.elementCommandStorageAllocations, 0);
      assert.equal(counts.dataBatchStorageAllocations, 0);
      assert.equal(counts.dataBatchInputRows, size);
      assert.equal(counts.dataBatchIntervals, 1);
      assert.equal(counts.elementCommandsConsumed, size);
      assert.equal(batch.commands.consumed, size);
      const query = new rmlui.ElementCommandBuffer(context, elements, size);
      query.opcodes.fill(rmlui.ElementCommandOpcode.GetNumeric);
      query.properties.fill(rmlui.PropertyId.Width);
      for (let i = 0; i < size; i++) {
        query.elements[i] = i;
      }
      query.submit(size);
      for (const width of query.outputNumbers) {
        assert.equal(width, 20);
      }
      assert.equal(counted(() => context.update()).nativeCallbacks, 0);
      batch.release();
      document.close();
      context.update();
      assert.ok(context.removeDataModel(`batch${size}`));
    }
  },

  'compact-dirty-dependencies-and-retained-inputs': function({
    rmlui, context,
  }) {
    const { model, elements } = fixture(rmlui, context);
    const seen = [];
    const batch = new rmlui.DataBatchView(
      model, elements, [ 'value', 'other', 'value + other' ],
      (current, count) => {
        seen.push(Array.from(current.slots.subarray(0, count))
          .map((slot, index) => [ slot, current.inputs[index] ])
          .sort((a, b) => a[0] - b[0]));
        return setWidths(rmlui, current, count);
      });
    context.update();
    const slots = batch.slots;
    const inputs = batch.inputs;
    assert.deepEqual(seen[0], [[ 0, 3 ], [ 1, 7 ], [ 2, 10 ]]);
    model.getVariable('value').set(5);
    model.dirtyVariable('value');
    context.update();
    assert.deepEqual(seen[1], [[ 0, 5 ], [ 2, 12 ]]);
    assert.equal(batch.slots, slots);
    assert.equal(batch.inputs, inputs);
    assert.equal(batch.commands.consumed, 2);
    model.dirtyVariable('other');
    batch.release();
    context.update();
    assert.equal(seen.length, 2);
    assert.throws(() => batch.release(), /released|valid/i);
    assert.equal(inputs.length, 3);
  },

  'sort-boundaries-legacy-side-effects-and-cross-group-dependencies': function({
    rmlui, context,
  }) {
    const model = context.createDataModel('sorted');
    model.bind('value', 3);
    model.bind('other', 7);
    const seen = [];
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => new rmlui.DataView(element, {
        initialize: () => true,
        update() {
          seen.push('legacy');
          model.getVariable('other').set(23);
          return false;
        },
        getVariableNameList: () => [ 'value' ],
      }, 0)), 'batchlegacy');
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body data-model="sorted">' +
      '<i/><i data-batchlegacy="value"/><i/></body></rml>');
    const elements = document.getElementsByTagName('i');
    new rmlui.DataBatchView(model, [ elements[0] ], [ 'value' ],
      () => {
        seen.push('first');
        return 0;
      }, { sortOffset: -10 });
    new rmlui.DataBatchView(model, [ elements[2] ], [ 'other' ],
      (batch, count) => {
        seen.push(`last:${batch.inputs[0]}`);
        assert.equal(count, 1);
        return 0;
      }, { sortOffset: 10 });
    context.update();
    // Core caches the instanced view's depth during RML parsing.
    assert.deepEqual(seen, [ 'legacy', 'first', 'last:23' ]);
  },

  'one-group-is-split-at-cached-depth-boundaries': function({
    rmlui, context,
  }) {
    const model = context.createDataModel('depths');
    model.bind('value', 3);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body data-model="depths"><i id="first"/>' +
      '<div><i id="nested"/></div><i id="last"/></body></rml>');
    const elements = [ 'first', 'nested', 'last' ]
      .map(id => document.getElementById(id));
    const seen = [];
    new rmlui.DataBatchView(model, elements, elements.map(() => 'value'),
      (batch, count) => {
        seen.push(Array.from(batch.slots.subarray(0, count)).sort());
        return setWidths(rmlui, batch, count);
      });
    context.update();
    assert.deepEqual(seen, [[ 0, 2 ], [ 1 ]]);
    for (const element of elements) {
      assert.equal(element.getProperty(rmlui.PropertyId.Width, 0), 4);
    }
  },

  'equal-order-groups-never-cross-legacy-side-effects': function({
    rmlui, context,
  }) {
    const model = context.createDataModel('interleaved');
    model.bind('value', 3);
    let expected = 3;
    let legacyCalls = 0;
    let rows = 0;
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => new rmlui.DataView(element, {
        initialize: () => true,
        update() {
          legacyCalls++;
          expected++;
          model.getVariable('value').set(expected);
          return false;
        },
        getVariableNameList: () => [ 'value' ],
      })), 'interleaved');
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body data-model="interleaved">' +
      '<i/><i data-interleaved="value"/>'.repeat(20) + '</body></rml>');
    const elements = document.getElementsByTagName('i');
    const kernel = (batch, count) => {
      for (let i = 0; i < count; i++) {
        assert.equal(batch.inputs[i], expected);
      }
      rows += count;
      return 0;
    };
    const first = elements.filter((_, index) => index % 4 === 0);
    const second = elements.filter((_, index) => index % 4 === 2);
    new rmlui.DataBatchView(model, first, first.map(() => 'value'), kernel);
    new rmlui.DataBatchView(model, second, second.map(() => 'value'), kernel);
    context.update();
    assert.equal(rows, 20);
    assert.equal(legacyCalls, 20);
  },

  'same-frame-added-groups-and-new-dirty-dependencies': function({
    rmlui, context,
  }) {
    const { model, elements } = fixture(rmlui, context);
    let appended = false;
    let childCalls = 0;
    new rmlui.DataBatchView(model, [ elements[0] ], [ 'value' ], () => {
      if (!appended) {
        appended = true;
        new rmlui.DataBatchView(model, [ elements[1] ], [ 'other' ],
          batch => {
            childCalls++;
            assert.equal(batch.inputs[0], 11);
            return 0;
          });
        model.getVariable('other').set(11);
        model.dirtyVariable('other');
      }
      return 0;
    });
    context.update();
    assert.equal(childCalls, 1);
  },

  'exceptions-invalid-counts-and-prefix-validation': function({
    rmlui, context,
  }) {
    const { model, elements } = fixture(rmlui, context);
    const error = new Error('batch kernel failure');
    let mode = 'throw';
    const batch = new rmlui.DataBatchView(model, elements,
      elements.map(() => 'value'), (current, count) => {
        setWidths(rmlui, current, count);
        if (mode === 'throw') {
          throw error;
        }
        if (mode === 'count') {
          return 0.5;
        }
        if (mode === 'invalid') {
          current.commands.numbers[1] = NaN;
        }
        return count;
      });
    assert.throws(() => context.update(), caught => caught === error);
    assert.equal(batch.commands.consumed, 0);
    mode = 'count';
    model.dirtyVariable('value');
    assert.throws(() => context.update(), /count/i);
    mode = 'invalid';
    model.dirtyVariable('value');
    assert.throws(() => context.update(), /finite/i);
    assert.equal(batch.commands.consumed, 0);
    mode = 'ok';
    model.dirtyVariable('value');
    context.update();
    assert.equal(batch.commands.consumed, 3);
    assert.equal(elements[0].getProperty(rmlui.PropertyId.Width, 0), 4);
  },

  'active-release-and-recursion-are-rejected': function({
    rmlui, context,
  }) {
    const { model, elements } = fixture(rmlui, context);
    const batch = new rmlui.DataBatchView(model, elements,
      elements.map(() => 'value'), current => {
        assert.throws(() => current.release(), /active|updating/i);
        assert.throws(() => model.update(), /recurs|active|updating|callback/i);
        assert.throws(
          () => elements[0].getParentNode().removeChild(elements[0]),
          /active|callback/i);
        return 0;
      });
    context.update();
    batch.release();
  },

  'validation-model-detachment-and-retained-bytes': function({
    rmlui, context,
  }) {
    const { model, document, elements } = fixture(rmlui, context);
    const create = (targets, expressions, options) =>
      new rmlui.DataBatchView(model, targets, expressions, () => 0, options);
    assert.throws(() => create(elements, [ 'value' ]), /length|matching/i);
    assert.throws(() => create(elements, [ 'value', '?', 'value' ]),
      /expression/i);
    assert.throws(() => create(elements, elements.map(() => 'value'),
      { sortOffset: 1000 }), /offset/i);
    const foreign = context.loadDocumentFromMemory(
      '<rml><head/><body><i/></body></rml>');
    assert.throws(() => create(foreign.getElementsByTagName('i'), [ 'value' ]),
      /model/i);
    const batch = create(elements, elements.map(() => 'value'));
    context.update();
    const inputs = batch.inputs;
    document.close();
    context.update();
    assert.ok(context.removeDataModel('batch'));
    assert.throws(() => batch.release(), /valid|released/i);
    assert.equal(inputs[0], 3);
    assert.throws(() => structuredClone(inputs,
      { transfer: [ inputs.buffer ] }), /transfer/i);
  },

  'released-sibling-group-is-not-invoked-later-in-the-frame': function({
    rmlui, context,
  }) {
    const { model, elements } = fixture(rmlui, context);
    let laterCalls = 0;
    const later = new rmlui.DataBatchView(
      model, [ elements[1] ], [ 'value' ], () => {
        laterCalls++;
        return 0;
      }, { sortOffset: 10 });
    new rmlui.DataBatchView(
      model, [ elements[0] ], [ 'value' ], () => {
        later.release();
        return 0;
      }, { sortOffset: -10 });
    context.update();
    assert.equal(laterCalls, 0);
  },

  'native-bypass-detachment-is-rejected-before-and-after-callback':
  async function({ rmlui, context }) {
    const native = require('../../build/Release/rmlui.node');
    const { model, elements } = fixture(rmlui, context);
    let mapping = native.createDataBatch(model.handle,
      elements.map(element => element.handle),
      elements.map(() => 'value'), () => 0, 0, 3);
    structuredClone(mapping.inputs, { transfer: [ mapping.inputs.buffer ] });
    mapping = null;
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.throws(() => context.update(), /detached/i);
    // Teardown must also accept hostile detached mappings.
    context.unloadAllDocuments();
    context.update();
    assert.ok(context.removeDataModel('batch'));
    const second = fixture(rmlui, context, 1, 'batchsecond');
    const late = native.createDataBatch(second.model.handle,
      second.elements.map(element => element.handle), [ 'value' ], () => {
        structuredClone(late.slots, { transfer: [ late.slots.buffer ] });
        return 0;
      }, 0, 1);
    assert.throws(() => context.update(), /detached/i);
  },

  'numeric-errors-and-user-getter-exceptions-preserve-first-error': function({
    rmlui, context,
  }) {
    const { model, elements } = fixture(rmlui, context);
    const error = new Error('native expression getter failure');
    let mode = 'string';
    model.bindFunc('custom', () => {
      if (mode === 'throw') {
        throw error;
      }
      return mode === 'string' ? 'nonnumeric' : 9;
    });
    let calls = 0;
    new rmlui.DataBatchView(model, [ elements[0] ], [ 'custom' ], () => {
      calls++;
      return 0;
    });
    assert.throws(() => context.update(), /finite number/i);
    assert.equal(calls, 0);
    mode = 'throw';
    model.dirtyVariable('custom');
    assert.throws(() => context.update(), caught => caught === error);
    assert.equal(calls, 0);
    mode = 'number';
    model.dirtyVariable('custom');
    const counts = counted(() => context.update());
    assert.equal(counts.nativeCallbacks, 2);
    assert.equal(counts.callbacks.dataGetter, 1);
    assert.equal(counts.callbacks.dataFactory, 1);
    assert.equal(calls, 1);
  },

  'owned-context-callback-cycles-collect-with-retained-planes': async function({
    rmlui, context: parent,
  }) {
    let context = rmlui.Factory.instanceContext(
      'batch-owned', parent.getRenderManager(), null);
    let current = fixture(rmlui, context);
    let batch = new rmlui.DataBatchView(current.model, current.elements,
      current.elements.map(() => 'value'), () => {
        assert.ok(context);
        return 0;
      });
    context.update();
    const inputs = batch.inputs;
    const weak = new WeakRef(context.handle);
    context = null;
    current = null;
    batch = null;
    for (let i = 0; i < 16; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(inputs[0], 3);
  },

  'release-drops-kernel-while-wrapper-and-planes-remain': async function({
    rmlui, context,
  }) {
    const { model, elements } = fixture(rmlui, context);
    let kernel = () => 0;
    const weak = new WeakRef(kernel);
    const batch = new rmlui.DataBatchView(
      model, elements, elements.map(() => 'value'), kernel);
    context.update();
    const inputs = batch.inputs;
    batch.release();
    kernel = null;
    for (let i = 0; i < 16; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(batch.inputs, inputs);
    assert.equal(inputs[0], 3);
  },

  'registration-accessors-snapshot-slots-and-reject-model-invalidation':
  function({ rmlui, context }) {
    const native = require('../../build/Release/rmlui.node');
    const { model, elements } = fixture(rmlui, context);
    let calls = 0;
    const slots = Object.defineProperty([ null ], 0, {
      get() {
        calls++;
        return elements[calls - 1].handle;
      },
    });
    const mapping = native.createDataBatch(model.handle, slots, [ 'value' ],
      count => {
        assert.equal(count, 1);
        const commands = mapping.commands;
        commands.opcodes[0] = rmlui.ElementCommandOpcode.SetNumeric;
        commands.elements[0] = 0;
        commands.properties[0] = rmlui.PropertyId.Width;
        commands.units[0] = rmlui.Unit.PX;
        commands.numbers[0] = 13;
        return 1;
      }, 0, 1);
    assert.equal(calls, 1);
    context.update();
    assert.equal(elements[0].getProperty(rmlui.PropertyId.Width, 0), 13);
    native.releaseDataBatch(mapping.handle);
    const expressions = Object.defineProperty([ null ], 0, {
      get() {
        assert.ok(context.removeDataModel('batch'));
        return 'value';
      },
    });
    assert.throws(() => native.createDataBatch(
      model.handle, [ elements[1].handle ], expressions, () => 0, 0, 1),
    /model.*valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Data batch');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('data-batch', 320, 240);
    await cases[name]({ rmlui, context });
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
      { encoding: 'utf8', timeout: 120000 });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} data batch regressions failed`);
}
