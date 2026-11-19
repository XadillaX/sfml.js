'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function write(buffer, index, opcode, slot, property, number = 0, unit = 0) {
  buffer.opcodes[index] = opcode;
  buffer.elements[index] = slot;
  buffer.properties[index] = property;
  buffer.numbers[index] = number;
  buffer.units[index] = unit;
}

function counted(action) {
  const native = require('../../build/Release/rmlui.node');
  native.beginDataDiagnostics();
  let result;
  try {
    action();
  } finally {
    result = native.endDataDiagnostics();
  }
  return result;
}

const cases = {
  'raw-style-opcodes-share-one-entry-with-native-dirty-state': function({
    rmlui, context, target,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode: Op,
      PropertyId: Id, Unit, RelativeTarget } = rmlui;
    assert.equal(typeof Op.StyleSetNumeric, 'number');
    for (const size of [ 1000, 10000, 100000 ]) {
      const buffer = new ElementCommandBuffer(context, [ target ], size + 5);
      buffer.opcodes.fill(Op.StyleSetNumeric, 0, size);
      buffer.properties.fill(Id.Width, 0, size);
      buffer.units.fill(Unit.PX, 0, size);
      for (let i = 0; i < size; i++) {
        buffer.numbers[i] = i + 1;
      }
      write(buffer, size, Op.StyleGetNumeric, 0, Id.Width);
      write(buffer, size + 1, Op.StyleRemoveProperty, 0, Id.Width);
      write(buffer, size + 2, Op.StyleResolveRelativeLength, 0,
        RelativeTarget.FontSize, 2, Unit.NUMBER);
      write(buffer, size + 3, Op.StyleGetLocalNumeric, 0, Id.Width);
      write(buffer, size + 4, Op.StyleResolveNumeric, 0, Id.Invalid,
        25, Unit.PERCENT);
      buffer.bases[size + 4] = 80;
      const counts = counted(() => {
        assert.equal(buffer.submit(size + 5), size + 5);
      });
      assert.equal(counts.runtimeEntries, 1);
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
      assert.equal(counts.elementCommandStorageAllocations, 0);
      assert.equal(counts.elementCommandCopies, 1);
      assert.equal(buffer.outputNumbers[size], size);
      assert.equal(buffer.outputNumbers[size + 2],
        target.getComputedValues().fontSize * 2);
      assert.equal(buffer.outputNumbers[size + 3], 40);
      assert.equal(buffer.outputNumbers[size + 4], 20);
      assert.equal(target.getStyle().anyPropertiesDirty(), true);
      assert.equal(target.getStyle().getProperty(Id.Width).value, 40);
      context.update();
      assert.equal(target.getStyle().anyPropertiesDirty(), false);
    }
  },

  'retained-one-entry-1000-10000-100000': function({
    rmlui, context, target,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode, PropertyId, Unit } =
      rmlui;
    for (const size of [ 1000, 10000, 100000 ]) {
      const buffer = new ElementCommandBuffer(context, [ target ], size);
      buffer.opcodes.fill(ElementCommandOpcode.SetNumeric);
      buffer.properties.fill(PropertyId.Width);
      buffer.units.fill(Unit.PX);
      for (let i = 0; i < size; i++) {
        buffer.numbers[i] = i + 1;
      }
      const counts = counted(() => assert.equal(buffer.submit(size), size));
      assert.equal(counts.runtimeEntries, 1);
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
      assert.equal(counts.elementCommandsConsumed, size);
      assert.equal(counts.elementCommandCopies, 1);
      assert.equal(counts.elementCommandStorageAllocations, 0);
      assert.ok(counts.elementCommandCopiedBytes >= size * 21);
      assert.equal(buffer.consumed, size);
      assert.equal(target.getProperty(PropertyId.Width, 0), size);
      assert.equal(buffer.numbers, buffer.numbers);
      buffer.numbers[size - 1] = -1;
      assert.equal(target.getProperty(PropertyId.Width, 0), size);
    }
  },

  'ordered-queries-match-typed-properties': function({
    rmlui, context, target,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode: Op,
      ElementCommandStatus: Status, PropertyId: Id, Property, Unit } = rmlui;
    const buffer = new ElementCommandBuffer(context, [ target ], 8);
    write(buffer, 0, Op.SetNumeric, 0, Id.Width, 23.5, Unit.PX);
    write(buffer, 1, Op.GetNumeric, 0, Id.Width);
    write(buffer, 2, Op.RemoveProperty, 0, Id.Width);
    write(buffer, 3, Op.GetLocalNumeric, 0, Id.Width);
    write(buffer, 4, Op.GetNumeric, 0, Id.Color);
    write(buffer, 5, Op.ResolveNumeric, 0, Id.Invalid, 25, Unit.PERCENT);
    buffer.bases[5] = 80;
    write(buffer, 6, Op.ResolveLength, 0, Id.Invalid, 2, Unit.PX);
    write(buffer, 7, Op.GetNumeric, 0, Id.Invalid);
    assert.equal(buffer.submit(8), 8);
    assert.equal(buffer.outputNumbers[1], 23.5);
    assert.equal(buffer.outputUnits[1], Unit.PX);
    assert.equal(buffer.outputStatus[1], Status.Numeric);
    assert.equal(buffer.outputNumbers[3], 40);
    assert.equal(buffer.outputStatus[4], Status.NonNumeric);
    assert.ok(Number.isNaN(buffer.outputNumbers[4]));
    assert.equal(buffer.outputNumbers[5], 20);
    assert.equal(buffer.outputNumbers[6], 2);
    assert.equal(buffer.outputStatus[7], Status.Missing);
    assert.ok(target.setProperty(Id.Width, new Property(23.5, Unit.PX)));
    write(buffer, 0, Op.GetNumeric, 0, Id.Width);
    const counts = counted(() => buffer.submit(1));
    assert.equal(counts.runtimeEntries, 1);
    assert.equal(counts.variantToJs, 0);
    assert.equal(buffer.outputNumbers[0], 23.5);
  },

  'registered-1000-10000-100000-elements-have-one-batch-entry': function({
    rmlui, context,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode: Op,
      PropertyId: Id, Unit } = rmlui;
    for (const size of [ 1000, 10000, 100000 ]) {
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body>' + '<div/>'.repeat(size) + '</body></rml>');
      const elements = document.getElementsByTagName('div');
      assert.equal(elements.length, size);
      const buffer = new ElementCommandBuffer(context, elements, size);
      buffer.opcodes.fill(Op.SetNumeric);
      buffer.properties.fill(Id.Width);
      buffer.units.fill(Unit.PX);
      for (let i = 0; i < size; i++) {
        buffer.elements[i] = i;
        buffer.numbers[i] = (i % 31) + 1;
      }
      const setCounts = counted(() => assert.equal(buffer.submit(size), size));
      assert.equal(setCounts.runtimeEntries, 1);
      assert.equal(setCounts.nativeCallbacks, 0);
      assert.equal(setCounts.elementOwnershipVisits, 0);
      assert.equal(setCounts.elementCommandStorageAllocations, 0);
      buffer.opcodes.fill(Op.GetNumeric);
      const queryCounts = counted(() => buffer.submit(size));
      assert.equal(queryCounts.runtimeEntries, 1);
      assert.equal(queryCounts.nativeCallbacks, 0);
      assert.equal(queryCounts.variantToJs, 0);
      assert.equal(queryCounts.elementCommandStorageAllocations, 0);
      for (let i = 0; i < size; i++) {
        assert.equal(buffer.outputNumbers[i], (i % 31) + 1);
        assert.equal(buffer.outputUnits[i], Unit.PX);
      }
      document.close();
      context.update();
    }
  },

  'whole-prefix-validation-before-mutation': function({
    rmlui, context, target,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode: Op,
      PropertyId: Id, Unit } = rmlui;
    const buffer = new ElementCommandBuffer(context, [ target ], 2);
    write(buffer, 0, Op.SetNumeric, 0, Id.Width, 99, Unit.PX);
    const failures = [
      [ Op.SetNumeric, 0, Id.Width, NaN, Unit.PX ],
      [ Op.SetNumeric, 0, Id.Width, Infinity, Unit.PX ],
      [ Op.SetNumeric, 0, Id.Width, 1e39, Unit.PX ],
      [ Op.SetNumeric, 0, Id.Width, 2, Unit.LENGTH ],
      [ Op.SetNumeric, 0, Id.Width, 2, Unit.FILTER ],
      [ Op.SetNumeric, 1, Id.Width, 2, Unit.PX ],
      [ 255, 0, Id.Width, 2, Unit.PX ],
      [ Op.GetNumeric, 0, Id.MaxNumIds, 0, 0 ],
    ];
    for (const failure of failures) {
      write(buffer, 1, ...failure);
      assert.throws(() => buffer.submit(2));
      assert.equal(buffer.consumed, 0);
      assert.equal(target.getProperty(Id.Width, 0), 40);
    }
    for (const count of [ -1, 3, 0.5, NaN ]) {
      assert.throws(() => buffer.submit(count), /count|capacity/i);
    }
  },

  'partial-failure-publishes-consumed-prefix': function({
    rmlui, context, target,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode: Op,
      PropertyId: Id, Unit } = rmlui;
    const buffer = new ElementCommandBuffer(context, [ target ], 3);
    write(buffer, 0, Op.SetNumeric, 0, Id.Width, 11, Unit.PX);
    write(buffer, 1, Op.SetNumeric, 0, Id.Invalid, 22, Unit.PX);
    write(buffer, 2, Op.SetNumeric, 0, Id.Width, 33, Unit.PX);
    assert.throws(() => buffer.submit(3), /rejected|property/i);
    assert.equal(buffer.consumed, 1);
    assert.equal(target.getProperty(Id.Width, 0), 11);
    write(buffer, 0, Op.SetNumeric, 0, Id.Width, 44, Unit.PX);
    assert.equal(buffer.submit(1), 1);
  },

  'reserve-retains-old-bytes-and-replaces-element-table': function({
    rmlui, context, target, document,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode: Op,
      PropertyId: Id, Unit } = rmlui;
    const buffer = new ElementCommandBuffer(context, [ target ], 1);
    write(buffer, 0, Op.SetNumeric, 0, Id.Width, 27, Unit.PX);
    const old = buffer.numbers;
    buffer.reserve(8);
    assert.equal(buffer.capacity, 8);
    assert.notEqual(buffer.numbers, old);
    assert.equal(buffer.numbers[0], 27);
    old[0] = 91;
    assert.equal(buffer.submit(1), 1);
    assert.equal(target.getProperty(Id.Width, 0), 27);
    const second = document.createElement('div');
    document.appendChild(second);
    buffer.replaceElements([ second ]);
    assert.equal(buffer.submit(1), 1);
    assert.equal(second.getProperty(Id.Width, 0), 27);
    assert.equal(target.getProperty(Id.Width, 0), 27);
  },

  'death-context-transfer-and-generation-are-checked': function({
    rmlui, context, document, target, window,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode: Op,
      PropertyId: Id, Unit } = rmlui;
    const buffer = new ElementCommandBuffer(context, [ target ], 1);
    write(buffer, 0, Op.SetNumeric, 0, Id.Width, 27, Unit.PX);
    const other = rmlui.createContext('other', 320, 240);
    const otherDocument = other.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    assert.throws(
      () => new ElementCommandBuffer(other, [ target ]), /context/i);
    const moved = document.removeChild(target);
    otherDocument.appendChild(moved);
    assert.throws(() => buffer.submit(1), /context/i);
    assert.equal(buffer.consumed, 0);
    const dead = document.createElement('div');
    document.appendChild(dead);
    buffer.replaceElements([ dead ]);
    document.innerRML = '';
    assert.throws(() => buffer.submit(1), /valid|destroy/i);
    const bytes = buffer.numbers;
    rmlui.shutdown();
    bytes[0] = 77;
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => buffer.submit(0), /valid|generation/i);
    assert.equal(bytes[0], 77);
  },

  'data-view-and-event-callbacks-can-submit': function({
    rmlui, context, target,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode: Op,
      PropertyId: Id, Unit } = rmlui;
    const buffer = new ElementCommandBuffer(context, [ target ], 1);
    write(buffer, 0, Op.SetNumeric, 0, Id.Width, 63, Unit.PX);
    let events = 0;
    target.addEventListener('click', () => {
      events++;
      assert.equal(buffer.submit(1), 1);
    });
    target.dispatchEvent('click');
    assert.equal(events, 1);
    assert.equal(target.getProperty(Id.Width, 0), 63);
    const model = context.createDataModel('commands-model');
    model.bind('value', 1);
    let calls = 0;
    rmlui.Factory.registerDataViewInstancer(
      new rmlui.DataViewInstancer(element => new rmlui.DataView(element, {
        initialize: () => true,
        update() {
          calls++;
          buffer.numbers[0] = 64;
          assert.equal(buffer.submit(1), 1);
          return true;
        },
        getVariableNameList: () => [ 'value' ],
      })), 'commands');
    context.loadDocumentFromMemory(
      '<rml><head/><body data-model="commands-model">' +
      '<div data-commands="value"/></body></rml>');
    context.update();
    assert.equal(calls, 1);
    assert.equal(target.getProperty(Id.Width, 0), 64);
  },

  'value-callbacks-cannot-submit-or-register': function({
    rmlui, context, target,
  }) {
    const buffer = new rmlui.ElementCommandBuffer(context, [ target ], 1);
    let calls = 0;
    const tween = new rmlui.Tween(value => {
      calls++;
      assert.throws(() => buffer.submit(0), /callback/i);
      assert.throws(() => buffer.reserve(1), /callback/i);
      assert.throws(() => buffer.replaceElements([ target ]), /callback/i);
      return value;
    });
    assert.equal(tween.evaluate(0.5), 0.5);
    assert.equal(calls, 1);
  },

  'numeric-overflow-is-an-ordered-runtime-failure': function({
    rmlui, context, target,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode: Op,
      PropertyId: Id, Unit } = rmlui;
    const buffer = new ElementCommandBuffer(context, [ target ], 3);
    write(buffer, 0, Op.SetNumeric, 0, Id.Width, 19, Unit.PX);
    write(buffer, 1, Op.ResolveNumeric, 0, Id.Invalid, 3e38, Unit.PERCENT);
    buffer.bases[1] = 3e38;
    write(buffer, 2, Op.SetNumeric, 0, Id.Width, 99, Unit.PX);
    assert.throws(() => buffer.submit(3), /overflow/i);
    assert.equal(buffer.consumed, 1);
    assert.equal(target.getProperty(Id.Width, 0), 19);
  },

  'query-callback-edits-cannot-change-submitted-snapshot': function({
    rmlui, context, target,
  }) {
    const { ElementCommandBuffer, ElementCommandOpcode: Op,
      PropertyId: Id, Unit, StyleSheetSpecification: styles,
      PropertyParser } = rmlui;
    const buffer = new ElementCommandBuffer(context, [ target ], 3);
    let active = false;
    let calls = 0;
    const marker = new Error('command query parser sentinel');
    styles.registerParser('command-parser', new PropertyParser(
      (property, text) => {
        if (active) {
          calls++;
          buffer.numbers[2] = 99;
          buffer.opcodes[2] = 255;
          assert.throws(() => buffer.submit(0), /callback|consumed/i);
          if (active === 'throw') {
            throw marker;
          }
        }
        property.value = Number(text);
        property.unit = Unit.NUMBER;
        return true;
      }));
    const definition = styles.registerProperty(
      'command-value', '1', false).addParser('command-parser');
    target.setProperty('--command-input', '7');
    target.setProperty('command-value', 'var(--command-input)');
    write(buffer, 0, Op.SetNumeric, 0, Id.Width, 11, Unit.PX);
    write(buffer, 1, Op.GetNumeric, 0, definition.id);
    write(buffer, 2, Op.SetNumeric, 0, Id.Width, 33, Unit.PX);
    active = true;
    assert.equal(buffer.submit(3), 3);
    assert.equal(calls, 1, 'query must run the actual registered parser');
    assert.equal(buffer.outputNumbers[1], 7);
    assert.equal(target.getProperty(Id.Width, 0), 33);
    write(buffer, 2, Op.SetNumeric, 0, Id.Width, 55, Unit.PX);
    active = 'throw';
    assert.throws(() => buffer.submit(3), error => error === marker);
    assert.equal(buffer.consumed, 1);
    assert.equal(target.getProperty(Id.Width, 0), 11);
  },

  'registration-accessors-cannot-reenter-active-buffer': function({
    context, target,
  }) {
    const native = require('../../build/Release/rmlui.node');
    const mapping = native.createElementCommands(
      context.handle, [ target.handle ], 1);
    const slots = [ target.handle ];
    Object.defineProperty(slots, '0', {
      get() {
        assert.throws(
          () => native.submitElementCommands(mapping.handle, 0),
          /consumed/i);
        assert.throws(
          () => native.reserveElementCommands(mapping.handle, 2),
          /consumed/i);
        return target.handle;
      },
    });
    native.replaceCommandElements(mapping.handle, slots);
    assert.equal(native.submitElementCommands(mapping.handle, 0), 0);
  },

  'transfer-cannot-detach-current-native-input': function({
    rmlui, context, target,
  }) {
    const buffer = new rmlui.ElementCommandBuffer(context, [ target ], 1);
    const view = buffer.numbers;
    try {
      const copy = structuredClone(view, { transfer: [ view.buffer ] });
      copy[0] = 99;
    } catch (error) {
      assert.equal(error.name, 'DataCloneError');
    }
    assert.equal(view.length, 1);
    assert.equal(buffer.submit(0), 0);
    buffer.reserve(8);
    for (const plane of [ buffer.opcodes, buffer.elements, buffer.properties,
      buffer.units, buffer.numbers, buffer.bases, buffer.outputNumbers,
      buffer.outputUnits, buffer.outputStatus ]) {
      try {
        structuredClone(plane, { transfer: [ plane.buffer ] });
      } catch (error) {
        assert.equal(error.name, 'DataCloneError');
      }
      assert.equal(plane.length, 8);
    }
    assert.equal(buffer.submit(0), 0);
  },

  'mapped-bytes-do-not-retain-owned-context': async function({
    rmlui, context: parent,
  }) {
    let context = rmlui.Factory.instanceContext(
      'owned', parent.getRenderManager(), null);
    let document = context.loadDocumentFromMemory(
      '<rml><head/><body><div id="a"/></body></rml>');
    let target = document.getElementById('a');
    let buffer = new rmlui.ElementCommandBuffer(context, [ target ], 1);
    const bytes = buffer.numbers;
    const weakContext = new WeakRef(context.handle);
    const weakElement = new WeakRef(target.handle);
    (() => {
      const held = buffer;
      target.addEventListener('click', () => held);
    })();
    context = null;
    document = null;
    target = null;
    buffer = null;
    for (let i = 0; i < 16; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weakContext.deref(), undefined);
    assert.equal(weakElement.deref(), undefined);
    bytes[0] = 17;
    assert.equal(bytes[0], 17);
  },

  'progress-views-retain-no-dom-leases': async function({
    rmlui, context: parent,
  }) {
    const native = require('../../build/Release/rmlui.node');
    let context = rmlui.Factory.instanceContext(
      'progress-owned', parent.getRenderManager(), null);
    const weak = new WeakRef(context.handle);
    let mapping = native.createElementCommands(context.handle, [], 0);
    const progress = mapping.progress;
    mapping = null;
    context = null;
    for (let i = 0; i < 16; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(progress[0], 0);
  },

  'native-bypass-detachment-is-rejected-after-gc': async function({
    context, target,
  }) {
    const native = require('../../build/Release/rmlui.node');
    let mapping = native.createElementCommands(
      context.handle, [ target.handle ], 1);
    const handle = mapping.handle;
    const copy = structuredClone(mapping.numbers,
      { transfer: [ mapping.numbers.buffer ] });
    assert.equal(mapping.numbers.length, 0);
    mapping = null;
    for (let i = 0; i < 6; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    copy[0] = 17;
    assert.throws(() => native.submitElementCommands(handle, 0), /detached/i);
    assert.throws(
      () => native.reserveElementCommands(handle, 2), /detached/i);
    assert.throws(
      () => native.replaceCommandElements(handle, [ target.handle ]),
      /detached/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Element commands');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('commands', 320, 240);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 320px; height: 240px; color: #ff0000; }
#target { width: 40px; height: 20px; }
</style></head><body><div id="target"/></body></rml>`);
    document.show();
    context.update();
    const target = document.getElementById('target');
    await cases[name]({ rmlui, context, document, target, window });
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
      { encoding: 'utf8', timeout: 60000 });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} element command regressions failed`);
}
