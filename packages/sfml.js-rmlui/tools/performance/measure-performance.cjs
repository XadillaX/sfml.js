'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');
const countNativeCalls = require('./count-native-calls.cjs');

const rootCount = 100;
const warmupFrames = 20;
const countedFrames = 5;

/**
 * Persist phase evidence outside timed/counting intervals when requested.
 * @param {string} phase - Most recently reached benchmark phase.
 * @param {object} details - Additional setup evidence.
 */
function progress(phase, details = {}) {
  const destination = process.env.RMLUI_PERFORMANCE_PROGRESS;
  if (destination) {
    fs.writeFileSync(destination, JSON.stringify({
      phase, date: new Date().toISOString(), ...details,
    }));
  }
}

/**
 * Capture counters separately from the uninstrumented timing distribution.
 * @param {Function} action - Operation to count without timing it.
 */
function counted(action) {
  native.beginDataDiagnostics(process.platform === 'darwin');
  let result;
  let counts;
  try {
    result = action();
  } finally {
    counts = native.endDataDiagnostics();
  }
  return { result, counts };
}

/**
 * Nearest-rank empirical percentiles; retain every original sample as well.
 * @param {number[]} values - Individual durations in milliseconds.
 */
function distribution(values) {
  const ordered = [ ...values ].sort((a, b) => a - b);
  const at = probability =>
    ordered[Math.ceil(probability * ordered.length) - 1];
  return { p50: at(0.5), p95: at(0.95), min: ordered[0],
    max: ordered[ordered.length - 1], samples: values };
}

function memory() {
  if (global.gc) {
    global.gc();
  }
  return process.memoryUsage();
}

function createArrays(context, count) {
  const model = context.createDataModel('measured');
  const types = model.getDataTypeRegister();
  const array = types.registerArray('Reals',
    types.registerScalar('Real', 'float64'));
  const perRoot = count / rootCount;
  const binding = counted(() => {
    for (let i = 0; i < rootCount; ++i) {
      assert.ok(model.bind(`values${i}`, new Float64Array(perRoot), array));
    }
  });
  const variables = Array.from({ length: rootCount },
    (_, i) => model.getVariable(`values${i}`));
  const views = [];
  const mapping = counted(() => {
    for (const variable of variables) {
      views.push(variable.getNumericView());
    }
  });
  assert.equal(binding.counts.backingBytes, count * 8);
  assert.equal(mapping.counts.backingAllocations, 0);
  return { model, variables, views, perRoot,
    setup: { binding: binding.counts, mapping: mapping.counts } };
}

function arrayDocument(context) {
  const sections = Array.from({ length: rootCount }, (_, i) =>
    `<section><i data-for="value : values${i}" ` +
    'data-attr-data-value="value" data-style-width="(value + 1) + \'px\'" ' +
    'rmlui-inner-rml=""/></section>').join('');
  return context.loadDocumentFromMemory('<rml><head><style>' +
    'body { display: block; margin: 0; width: 320px; height: 240px;' +
    'overflow: hidden; }' +
    'section { display: block; } ' +
    'i { display: block; height: 1px; background-color: #56a6c4; }' +
    '</style></head><body data-model="measured">' + sections +
    '</body></rml>');
}

function createScalarFixture(context, count, strategy) {
  const model = context.createDataModel('measured');
  const state = { value: 0 };
  if (strategy === 'getter') {
    model.bindFunc('value', () => state.value);
  } else {
    model.bind('value', 0);
  }
  if (strategy === 'transform') {
    model.registerTransformFunc('identity', args => args[0]);
  }
  const expression = strategy === 'transform' ? 'value | identity' : 'value';
  const rows = (`<i data-attr-data-value="${expression}" ` +
    `data-style-width="((${expression}) + 1) + 'px'"/>`).repeat(count);
  const document = context.loadDocumentFromMemory('<rml><head><style>' +
    'body { display: block; margin: 0; width: 320px; height: 240px;' +
    'overflow: hidden; }' +
    'i { display: block; height: 1px; background-color: #56a6c4; }' +
    '</style></head><body data-model="measured">' + rows + '</body></rml>');
  const variable = model.getVariable('value');
  return {
    model, document, setup: {}, changedRows: count,
    write(value) {
      if (strategy === 'getter') {
        state.value = value;
      } else {
        variable.set(value);
      }
    },
    notify: () => model.dirtyVariable('value'),
  };
}

function createCustomFixture(context, count, strategy) {
  const controllers = strategy === 'custom-controller';
  const hostAttributes = strategy === 'custom-attribute';
  const fixture = createArrays(context, count);
  const { model, views, perRoot } = fixture;
  let index = 0;
  let callbackCount = 0;
  rmlui.Factory.registerDataViewInstancer(
    new rmlui.DataViewInstancer(element => {
      const row = index++;
      const root = Math.floor(row / perRoot);
      const offset = row % perRoot;
      return new rmlui.DataView(element, {
        initialize: () => true,
        getVariableNameList: () => [ `values${root}` ],
        update() {
          ++callbackCount;
          const value = views[root][offset];
          if (hostAttributes) {
            element.setAttribute('data-value', value);
          }
          element.setProperty('width', `${value + 1}px`);
          return true;
        },
      });
    }), 'measured');
  if (controllers) {
    rmlui.Factory.registerDataControllerInstancer(
      new rmlui.DataControllerInstancer(element =>
        new rmlui.DataController(element, {
          initialize(_model, attached) {
            attached.addEventListener('click', () => {
              ++callbackCount;
              views[0][0] = 3;
              model.dirtyVariable('values0');
            });
            if (index % 10000 === 0) {
              progress('controller-initialization', {
                registeredControllers: index,
              });
            }
            return true;
          },
        })), 'controlonly');
  }
  const rows = Array.from({ length: count }, (_, i) =>
    `<i data-measured="values${Math.floor(i / perRoot)}"` +
    (hostAttributes ? '' : ' data-attr-data-value="' +
      `values${Math.floor(i / perRoot)}[${i % perRoot}]"`) +
    (controllers ? ' data-controlonly="values0"' : '') + '/>').join('');
  const document = context.loadDocumentFromMemory('<rml><head><style>' +
    'body { display: block; margin: 0; width: 320px; height: 240px;' +
    'overflow: hidden; }' +
    'i { display: block; height: 1px; background-color: #56a6c4; }' +
    '</style></head><body data-model="measured">' + rows + '</body></rml>');
  assert.equal(index, count);
  return { ...fixture, document,
    write: value => views.forEach(view => view.fill(value)),
    notify: () => model.dirtyAllVariables(),
    callbackCount: () => callbackCount };
}

function createBatchFixture(context, count, styleCommands = false) {
  const fixture = createArrays(context, count);
  const { model, perRoot } = fixture;
  const expressions = Array.from({ length: count }, (_, i) =>
    `values${Math.floor(i / perRoot)}[${i % perRoot}]`);
  const rows = expressions.map(expression =>
    `<i data-attr-data-value="${expression}"/>`).join('');
  const document = context.loadDocumentFromMemory('<rml><head><style>' +
    'body{display:block;margin:0;width:320px;height:240px;overflow:hidden}' +
    'i{display:block;height:1px;background-color:#56a6c4}' +
    '</style></head><body data-model="measured">' + rows + '</body></rml>');
  const elements = document.getElementsByTagName('i');
  let callbackCount = 0;
  const batch = new rmlui.DataBatchView(model, elements, expressions,
    (current, length) => {
      callbackCount++;
      const commands = current.commands;
      const slots = current.slots;
      const inputs = current.inputs;
      for (let i = 0; i < length; i++) {
        commands.elements[i] = slots[i];
        commands.numbers[i] = inputs[i] + 1;
      }
      return length;
    }, { sortOffset: 999 });
  batch.commands.opcodes.fill(styleCommands
    ? rmlui.ElementCommandOpcode.StyleSetNumeric
    : rmlui.ElementCommandOpcode.SetNumeric);
  batch.commands.properties.fill(rmlui.PropertyId.Width);
  batch.commands.units.fill(rmlui.Unit.PX);
  return { ...fixture, document, batch,
    callbackCount: () => callbackCount };
}

function createArrayFixture(context, count, strategy) {
  const fixture = createArrays(context, count);
  const { variables, perRoot } = fixture;
  const document = arrayDocument(context);
  const items = [];
  const paths = [];
  const patches = { all: {}, sparse: {} };
  // Reuse variable handles and patch keys; setup does not contaminate frames.
  if (strategy === 'per-value' || strategy === 'patch') {
    for (let i = 0; i < count; ++i) {
      const root = Math.floor(i / perRoot);
      const offset = i % perRoot;
      if (strategy === 'per-value') {
        items.push(variables[root].child(offset));
      } else {
        paths.push(`values${root}[${offset}]`);
      }
    }
  }
  return { ...fixture, document, items, paths, patches };
}

/**
 * CPU frame from window clear through data work, layout, render and swap.
 * @param {object} window - The existing SFML window.
 * @param {object} context - Native UI context.
 * @param {object} fixture - Retained data and bound DOM.
 * @param {string} strategy - Data submission path.
 * @param {string} dirty - Clean, sparse or all roots.
 * @param {number} value - Uniform changed value.
 * @param {boolean} timed - Capture individual stage durations.
 */
function executeFrame(window, context, fixture, strategy, dirty, value, timed) {
  const { model, views, perRoot, items, paths, patches } = fixture;
  const changedRoots = dirty === 'sparse' ? 1 : rootCount;
  const changedRows = dirty === 'sparse' ? perRoot : fixture.rows;
  const durations = {};
  const start = process.hrtime.bigint();
  let previous = start;
  const mark = stage => {
    const now = process.hrtime.bigint();
    if (timed) {
      durations[stage] = Number(now - previous) / 1e6;
    }
    previous = now;
  };
  window.clear(sfml.Color.Black);
  // SFML records clear into shared commands; submit it before native UI draws.
  window.flush();
  mark('clear');
  if (dirty !== 'clean') {
    if (strategy === 'shared' || strategy === 'batch-view' ||
        strategy === 'style-batch' ||
        strategy === 'custom-view' ||
        strategy === 'custom-attribute' ||
        strategy === 'custom-controller') {
      for (let i = 0; i < changedRoots; ++i) {
        views[i].fill(value);
      }
    } else if (strategy === 'native') {
      native.fillDiagnosticArrays(model.handle, value, changedRoots);
    } else if (strategy === 'per-value') {
      for (let i = 0; i < changedRows; ++i) {
        items[i].set(value);
      }
    } else if (strategy === 'patch') {
      const patch = patches[dirty];
      for (let i = 0; i < changedRows; ++i) {
        patch[paths[i]] = value;
      }
      model.applyPatch(patch);
    } else {
      fixture.write(value);
    }
  }
  mark('input');
  if (dirty !== 'clean' && strategy !== 'patch') {
    if (fixture.notify) {
      fixture.notify();
    } else if (dirty === 'sparse') {
      model.dirtyVariable('values0');
    } else {
      model.dirtyAllVariables();
    }
  }
  model.update();
  mark('update');
  context.update();
  mark('layout');
  context.render();
  mark('render');
  window.display();
  mark('present');
  durations.frame = Number(previous - start) / 1e6;
  return durations;
}

function verify(fixture, dirty, value) {
  const changedRows = dirty === 'sparse' ? fixture.perRoot : fixture.rows;
  const checked = native.checkDiagnosticRows(
    fixture.document.handle, fixture.rows,
    dirty === 'clean' ? 0 : value,
    dirty === 'clean' ? fixture.rows : changedRows, true);
  assert.equal(checked, true, 'Every actual bound row must match its input');
}

function runFrames(count, strategy, samples) {
  assert.ok(count >= 100 && count % rootCount === 0);
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'RmlUi frame measurement');
  window.setVerticalSyncEnabled(false);
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const beforeSetup = memory();
  let fixture;
  let result;
  try {
    const context = rmlui.createContext('performance', 320, 240);
    progress('fixture-start', { rows: count, strategy });
    const setupStart = process.hrtime.bigint();
    fixture = strategy === 'batch-view' || strategy === 'style-batch'
      ? createBatchFixture(context, count, strategy === 'style-batch')
      : strategy.startsWith('custom-')
        ? createCustomFixture(context, count, strategy)
        : [ 'getter', 'transform', 'native-scalar' ].includes(strategy)
          ? createScalarFixture(context, count, strategy)
          : createArrayFixture(context, count, strategy);
    const fixtureSetupMs = Number(process.hrtime.bigint() - setupStart) / 1e6;
    progress('fixture-ready', { rows: count, strategy, fixtureSetupMs });
    fixture.rows = count;
    fixture.document.show();
    const firstFrame = counted(() => executeFrame(
      window, context, fixture, strategy, 'clean', 0, false)).counts;
    verify(fixture, 'clean', 0);
    const afterSetup = memory();
    const workloads = fixture.notify ? [ 'clean', 'all' ]
      : [ 'clean', 'sparse', 'all' ];
    const results = [];
    for (const dirty of workloads) {
      // Restore every row before testing sparse/clean changes.
      executeFrame(window, context, fixture, strategy, 'all', 0, false);
      for (let i = 0; i < warmupFrames; ++i) {
        executeFrame(
          window, context, fixture, strategy, dirty, i % 2 + 1, false);
      }
      if (global.gc) {
        global.gc();
      }
      const stages = {};
      for (let i = 0; i < samples; ++i) {
        const durations = executeFrame(
          window, context, fixture, strategy, dirty, i % 2 + 1, true);
        for (const [ stage, milliseconds ] of Object.entries(durations)) {
          (stages[stage] ??= []).push(milliseconds);
        }
      }
      verify(fixture, dirty, (samples - 1) % 2 + 1);
      progress(`${dirty}-timing-complete`, { rows: count, strategy });
      const counts = [];
      for (let i = 0; i < countedFrames; ++i) {
        counts.push(counted(executeFrame.bind(null,
          window, context, fixture, strategy, dirty,
          (samples + i) % 2 + 1, false)).counts);
      }
      const crossingValue = (samples + countedFrames) % 2 + 1;
      const crossingSample = countNativeCalls(executeFrame.bind(null,
        window, context, fixture, strategy, dirty, crossingValue, false));
      assert.equal(crossingSample.sfml.methods.submitRenderWindow, 2);
      if ([ 'shared', 'patch', 'per-value', 'native' ].includes(strategy)) {
        const changedRows = dirty === 'clean' ? 0
          : dirty === 'sparse' ? fixture.perRoot : count;
        for (const measured of counts) {
          assert.equal(measured.scalarReads, changedRows * 2);
          if (strategy === 'patch' || strategy === 'per-value') {
            assert.equal(measured.scalarWrites, changedRows);
          }
          if (strategy === 'native') {
            assert.equal(measured.nativeNumericWrites, changedRows);
          }
        }
      }
      verify(fixture, dirty, crossingValue);
      if (strategy === 'style-batch') {
        assert.equal(crossingSample.totalJsToNative, dirty === 'clean' ? 5 : 6);
        assert.equal(crossingSample.nativeToJs, dirty === 'clean' ? 0 : 1);
        for (const measured of counts) {
          assert.equal(measured.elementOwnershipVisits, 0);
          assert.equal(measured.elementCommandStorageAllocations, 0);
          assert.equal(measured.elementCommandsConsumed, dirty === 'clean' ? 0
            : dirty === 'sparse' ? fixture.perRoot : count);
        }
      }
      results.push({ dirty,
        stages: Object.fromEntries(Object.entries(stages)
          .map(([ stage, values ]) => [ stage, distribution(values) ])),
        counters: counts, crossingSample, sfmlWindowMethodCallsPerFrame: 3,
        sfmlNativeSubmissionsPerFrame: 2,
      });
      progress(`${dirty}-complete`, { rows: count, strategy });
    }
    let controllerEvent;
    if (strategy === 'custom-controller') {
      const element = fixture.document.querySelector('i');
      const before = fixture.callbackCount();
      controllerEvent = counted(() => element.click()).counts;
      assert.ok(fixture.callbackCount() > before);
      assert.equal(controllerEvent.callbacks.event, 1);
    }
    const maintenance = [];
    for (let i = 0; i < warmupFrames + samples; ++i) {
      const start = process.hrtime.bigint();
      modelNoDirtyQuery(fixture.model, strategy);
      const milliseconds = Number(process.hrtime.bigint() - start) / 1e6;
      if (i >= warmupFrames) {
        maintenance.push(milliseconds);
      }
    }
    const maintenanceCounts = counted(() =>
      modelNoDirtyQuery(fixture.model, strategy)).counts;
    const emptySessionCounters = counted(() => {}).counts;
    result = { rows: count, strategy, fixtureSetupMs,
      setup: fixture.setup, firstFrame,
      emptySessionCounters,
      memory: { beforeSetup, afterSetup, retained: memory() },
      maintenance: { milliseconds: distribution(maintenance),
        counters: maintenanceCounts },
      results, controllerEvent };
    // Explicitly retain old views across resize, then verify both backings.
    if (fixture.variables) {
      const old = fixture.views[0];
      const resize = counted(() => fixture.variables[0].resize(
        fixture.perRoot + 1)).counts;
      const next = fixture.variables[0].getNumericView();
      assert.equal(old.length, fixture.perRoot);
      assert.equal(next.length, fixture.perRoot + 1);
      assert.equal(old[0], next[0]);
      assert.equal(resize.resizeCopiedBytes, fixture.perRoot * 8);
      result.resize = resize;
    }
  } finally {
    fixture = null;
    rmlui.shutdown();
    window.close();
  }
  result.memory.afterShutdown = memory();
  progress('complete', { rows: count, strategy });
  return result;
}

function modelNoDirtyQuery(model, strategy) {
  return model.isVariableDirty([ 'getter', 'transform', 'native-scalar' ]
    .includes(strategy) ? 'value' : 'values0');
}

module.exports = {
  counted, distribution, memory, createBatchFixture, executeFrame, verify,
};

if (require.main === module && process.argv[2] === '--child') {
  console.log(JSON.stringify(runFrames(Number(process.argv[3]),
    process.argv[4], Number(process.argv[5]))));
} else if (require.main === module) {
  const quick = process.argv.includes('--quick');
  const samples = quick ? 8 : 80;
  const sizes = quick ? [ 1000 ] : [ 1000, 10000, 100000 ];
  const strategies = [ 'shared', 'patch', 'per-value', 'native',
    'native-scalar', 'getter', 'transform', 'custom-view',
    'batch-view', 'style-batch', 'custom-controller', 'custom-attribute' ];
  const strategyFlag = process.argv.indexOf('--strategies');
  const selected = strategyFlag < 0 ? strategies
    : process.argv[strategyFlag + 1]?.split(',');
  assert.ok(selected?.length &&
    selected.every(strategy => strategies.includes(strategy)),
  '--strategies requires supported comma-separated names');
  const runs = [];
  const failures = [];
  const outputFlag = process.argv.indexOf('--output');
  const outputPath = outputFlag < 0 ? undefined : process.argv[outputFlag + 1];
  assert.ok(outputFlag < 0 || outputPath, '--output requires a file path');
  const persist = report => {
    if (outputPath) {
      fs.writeFileSync(`${outputPath}.partial`,
        `${JSON.stringify(report, null, 2)}\n`);
      fs.renameSync(`${outputPath}.partial`, outputPath);
    }
  };
  for (const count of sizes) {
    for (const strategy of selected) {
      // This explicit full-wrapper scan is measured at 1k rows. Larger
      // callback fixtures keep attributes in Core's default native view.
      if (strategy === 'custom-attribute' && count !== 1000) {
        continue;
      }
      const child = spawnSync(process.execPath,
        [ '--expose-gc', __filename, '--child', String(count), strategy,
          String(samples) ], {
          encoding: 'utf8', timeout: 300000, maxBuffer: 8 * 1024 * 1024,
        });
      if (child.status !== 0) {
        failures.push({ rows: count, strategy, timeoutMs: 300000,
          error: String(child.error ?? child.signal ?? child.status),
          stderr: child.stderr });
        console.error(`[failed] ${count} rows / ${strategy}`);
      } else {
        runs.push(JSON.parse(child.stdout));
        console.error(`[measured] ${count} rows / ${strategy}`);
      }
      persist({ status: 'running', sampleFrames: samples,
        warmupFrames, countedFrames, runs, failures });
    }
  }
  const report = {
    date: new Date().toISOString(), upstreamVersion: native.getVersion(),
    platform: process.platform, arch: process.arch, node: process.version,
    osRelease: os.release(), cpu: os.cpus()[0].model,
    sampleFrames: samples, warmupFrames, countedFrames,
    percentile: 'nearest rank; p50/p95 calculated from each individual frame',
    timing: 'Counters, malloc logger and JS entry wrappers disabled;' +
      ' stage clocks remain',
    entryCounting: 'Separate frame wraps both addon export tables;' +
      ' includes unguarded value/glyph APIs; no malloc profiling in this pass',
    frame: 'CPU: clear + input + dirty/model update + context update' +
      ' + render + display',
    presentation: 'Vsync disabled; no GPU timer/fence;' +
      ' swap can wait for WindowServer',
    workload: 'Actual bound rows, 1px height;' +
      ' width changes 1/2/3px; 320x240 clip',
    callbackFixture: 'Custom views compute width in JS;' +
      ' default native data-attr views update data-value',
    slowFixture: 'custom-attribute also calls setAttribute per row;' +
      ' measured separately at 1k rows',
    scope: {
      crossings: 'Actual RmlUi/SFML addon exports and explicit V8 callbacks',
      sfml: 'clear records shared commands; flush and display each submit once',
      native: 'Direct C++ fill of the same native backings;' +
        ' same model/layout/render pipeline',
      allocations: 'macOS main-thread malloc-family logger;' +
        ' V8 arena suballocations/VM/GPU excluded',
      copies: 'Numeric resize, SFML geometry expansion' +
        ', merged geometry staging, command snapshots' +
        ' and owned glyph/effect copies only',
      uploads: 'Successful renderer geometry VBO updates' +
        ' and source texture uploads',
      draws: 'SFML renderer draw submissions by category;' +
        ' not GPU timer queries',
      memory: 'GC-before snapshots; RSS, V8 heap, external and arrayBuffers',
      ownership: 'Custom data-factory instance visits at outer boundary exit',
    },
    outputChecks: 'Every actual row attribute and width = value + 1;' +
      ' checked outside all measurement intervals',
    runs, failures, status: failures.length ? 'incomplete' : 'complete',
  };
  persist(report);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = failures.length ? 1 : 0;
}
