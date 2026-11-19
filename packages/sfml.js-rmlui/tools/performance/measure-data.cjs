'use strict';

const assert = require('node:assert/strict');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const native = require('../../build/Release/rmlui.node');

const rootCount = 100;

function measure(label, action) {
  const before = process.memoryUsage();
  native.beginDataDiagnostics();
  const start = process.hrtime.bigint();
  let result;
  let counts;
  let elapsed;
  try {
    result = action();
  } finally {
    elapsed = Number(process.hrtime.bigint() - start) / 1e6;
    counts = native.endDataDiagnostics();
  }
  const after = process.memoryUsage();
  return {
    result,
    sample: {
      operation: label, milliseconds: elapsed, ...counts,
      rssDelta: after.rss - before.rss,
      heapUsedDelta: after.heapUsed - before.heapUsed,
    },
  };
}

function verifyRoot(document, index, count, expected) {
  const section = document.getElementById(`root${index}`);
  // Core keeps the original, hidden data-for template alongside its clones.
  assert.equal(section.getNumChildren(), count + 1);
  const rows = section.querySelectorAll('i[data-value]');
  assert.equal(rows.length, count);
  for (const row of rows) {
    assert.equal(row.getAttribute('data-value'), String(expected));
  }
}

function run(count) {
  assert.ok(Number.isSafeInteger(count) && count >= rootCount &&
    count % rootCount === 0, 'Size must be a positive multiple of 100');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Measured data bindings');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('measured', 320, 240);
    const model = context.createDataModel('values');
    const types = model.getDataTypeRegister();
    const scalar = types.registerScalar('Real', 'float64');
    const array = types.registerArray('Reals', scalar);
    const perRoot = count / rootCount;
    const input = new Float64Array(perRoot);
    const samples = [];
    const binding = measure('bind-native-arrays', () => {
      for (let i = 0; i < rootCount; ++i) {
        assert.equal(model.bind(`values${i}`, input, array), true);
      }
    });
    assert.equal(binding.sample.backingAllocations, rootCount);
    assert.equal(binding.sample.backingBytes, count * 8);
    assert.equal(binding.sample.scalarWrites, count);
    samples.push(binding.sample);

    const variables = Array.from({ length: rootCount },
      (_, i) => model.getVariable(`values${i}`));
    const views = [];
    const mapping = measure('map-shared-views', () => {
      for (const variable of variables) {
        views.push(variable.getNumericView());
      }
    });
    assert.equal(mapping.sample.backingAllocations, 0);
    assert.equal(mapping.sample.resizeCopiedBytes, 0);
    samples.push(mapping.sample);

    const sections = Array.from({ length: rootCount }, (_, i) =>
      `<section id="root${i}"><i data-for="value : values${i}" ` +
      'data-attr-data-value="value" rmlui-inner-rml=""/></section>').join('');
    const loading = measure('create-bound-dom', () =>
      context.loadDocumentFromMemory('<rml><head><style>' +
        'i { display: block; width: 1px; height: 1px; }' +
        '</style></head><body data-model="values">' +
        sections + '</body></rml>'));
    const document = loading.result;
    samples.push(loading.sample);
    document.show();
    samples.push(measure('initial-context-layout', () => context.update())
      .sample);
    // Read every clone outside timed/counted intervals to prove actual scale.
    for (let i = 0; i < rootCount; ++i) {
      verifyRoot(document, i, perRoot, 0);
    }

    for (const view of views) {
      view.fill(1);
    }
    const clean = measure('no-dirty-model-update', () => model.update());
    assert.equal(clean.result, false);
    assert.equal(clean.sample.scalarReads, 0);
    samples.push(clean.sample);
    verifyRoot(document, 0, perRoot, 0);
    verifyRoot(document, rootCount - 1, perRoot, 0);

    const sparse = measure('one-percent-dirty-model-update', () => {
      model.dirtyVariable('values0');
      return model.update();
    });
    assert.equal(sparse.result, true);
    assert.ok(sparse.sample.scalarReads >= perRoot);
    samples.push(sparse.sample);
    verifyRoot(document, 0, perRoot, 1);
    verifyRoot(document, rootCount - 1, perRoot, 0);
    samples.push(measure('sparse-context-layout', () => context.update())
      .sample);

    for (const view of views) {
      view.fill(2);
    }
    const all = measure('all-dirty-model-update', () => {
      model.dirtyAllVariables();
      return model.update();
    });
    assert.equal(all.result, true);
    assert.ok(all.sample.scalarReads >= count);
    assert.ok(sparse.sample.scalarReads < all.sample.scalarReads);
    samples.push(all.sample);
    for (let i = 0; i < rootCount; ++i) {
      verifyRoot(document, i, perRoot, 2);
    }
    samples.push(measure('all-dirty-context-layout', () => context.update())
      .sample);

    const patch = measure('one-element-sparse-patch', () =>
      model.applyPatch({ 'values0[0]': 3 }));
    assert.equal(patch.result, true);
    assert.equal(patch.sample.scalarWrites, 1);
    assert.equal(patch.sample.backingAllocations, 0);
    assert.equal(views[0][0], 3);
    samples.push(patch.sample);
    model.update();

    const old = views[0];
    const resize = measure('grow-one-native-array', () =>
      variables[0].resize(perRoot + 1));
    assert.equal(resize.result, true);
    assert.equal(resize.sample.backingAllocations, 1);
    assert.equal(resize.sample.resizeCopiedBytes, perRoot * 8);
    assert.equal(old.length, perRoot);
    assert.equal(variables[0].getNumericView().length, perRoot + 1);
    assert.equal(old[0], 3);
    samples.push(resize.sample);
    return {
      elements: count, roots: rootCount, elementsPerRoot: perRoot,
      structuralTemplates: rootCount, sectionElements: rootCount, samples,
    };
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2] === '--child') {
  console.log(JSON.stringify(run(Number(process.argv[3]))));
} else {
  const sizes = process.argv.slice(2).map(Number);
  const results = [];
  for (const count of sizes.length ? sizes : [ 1000, 10000, 100000 ]) {
    const child = spawnSync(process.execPath,
      [ __filename, '--child', String(count) ], {
        encoding: 'utf8', timeout: 180000, maxBuffer: 1024 * 1024,
      });
    assert.equal(child.status, 0,
      `Size ${count}: ${child.error ?? child.signal ?? child.stderr}`);
    results.push(JSON.parse(child.stdout));
    console.error(`[measured] ${count} bound elements verified`);
  }
  console.log(JSON.stringify({
    date: new Date().toISOString(),
    upstreamVersion: native.getVersion(),
    platform: process.platform, arch: process.arch, node: process.version,
    osRelease: os.release(), cpu: os.cpus()[0].model,
    measurementScope: {
      runtimeEntries: 'Accepted RmlUi RuntimeBoundary entries; no diagnostics',
      storageNodes: 'DataStorageNode allocations only',
      backingAllocations: 'DataStorage numeric backing allocations only',
      backingBytes: 'Requested successful backing allocation bytes',
      resizeCopies: 'Executed numeric resize memcpy operations only',
      scalarReads: 'CheckedDataScalar Get invocations',
      scalarWrites: 'Successful checked scalar/enum definition Set operations',
      memoryDeltas: 'Process RSS and V8 heap snapshots; not allocator counts',
      excluded: 'Other allocations/copies; rendering; direct JS writes',
      timing: 'Single instrumented pass per size; no invented thresholds',
    },
    results,
  }, null, 2));
}
