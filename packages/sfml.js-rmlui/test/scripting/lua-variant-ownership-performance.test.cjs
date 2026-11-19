'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');

function run(kind, count) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const native = require('../../build/Release/rmlui.node');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Lua ownership load');
  assert.ok(rmlui.initialise(window, { highDpi: false }));

  try {
    const context = rmlui.createContext('lua-owner-load', 160, 120);
    const host = new rmlui.LuaScriptHost({ allowInline: true });
    context.setScriptHost(host);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    const valueCount = 8;
    const functions = [];

    for (let index = 0; index < valueCount; ++index) {
      document.setAttribute(`value${index}`,
        { type: 'voidptr', value: { index } });
    }

    document.loadInlineScript(
      `saved = {}; for i = 0, ${valueCount - 1} do ` +
      'saved[i + 1] = document:GetAttribute("value" .. i) end',
      'owner-values.lua');

    if (kind === 'listeners') {
      document.loadInlineScript(
        `for i = 1, ${count} do ` +
        'document:AddEventListener("owner-load-" .. i, ' +
        'function() assert(saved[1] ~= nil) end) end',
        'owner-listeners.lua');
    } else {
      host.execute('function retained() return saved[1] ~= nil end');

      for (let index = 0; index < count; ++index) {
        functions.push(host.getFunction('retained'));
      }
    }

    context.update();
    const timings = [];
    let counters;

    for (let index = 0; index < 12; ++index) {
      host.execute('pulse = nil; collectgarbage("collect")');
      native.beginDataDiagnostics();
      const started = performance.now();
      document.loadInlineScript(
        'pulse = document:GetAttribute("value0")', 'owner-pulse.lua');
      context.update();
      timings.push(performance.now() - started);
      counters = native.endDataDiagnostics();

      assert.ok(counters.luaVariantOwnerPasses > 0);

      if (kind === 'listeners') {
        assert.ok(counters.luaVariantSnapshotValues <=
          counters.luaVariantOwnerPasses * (valueCount + 2) * 2,
        'Shared VM values were copied again for each listener: ' +
          JSON.stringify(counters));
      } else {
        assert.ok(counters.luaVariantOwnerComparisons <=
          counters.luaVariantOwnerLookups * 2,
        'Distinct owners required a linear search through snapshots: ' +
          JSON.stringify(counters));
      }
    }

    timings.sort((first, second) => first - second);
    console.log(JSON.stringify({
      kind, count,
      p50: timings[6],
      p95: timings[11],
      counters,
    }));

    native.beginDataDiagnostics();

    for (let index = 0; index < 16; ++index) {
      context.update();
    }

    const stable = native.endDataDiagnostics();
    assert.equal(stable.luaVariantOwnerPasses, 0);
    assert.equal(stable.luaVariantOwnerLookups, 0);
    assert.equal(stable.luaVariantOwnerComparisons, 0);
    assert.equal(stable.luaVariantSnapshotValues, 0);
    assert.equal(stable.callbackSnapshotVisits, 0);
    assert.equal(stable.elementOwnershipVisits, 0);
    assert.equal(functions.length, kind === 'functions' ? count : 0);
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2], Number(process.argv[3]));
} else {
  let failures = 0;

  for (const kind of [ 'listeners', 'functions' ]) {
    for (const count of [ 128, 256, 512 ]) {
      const result = spawnSync(process.execPath,
        [ __filename, kind, String(count) ],
        { encoding: 'utf8', timeout: 60000 });

      if (result.status !== 0) {
        ++failures;
        console.error(`FAIL ${kind} ${count}: ${result.status}`,
          result.stderr);
      } else {
        console.log(`PASS ${kind} ${count}`, result.stdout.trim());
      }
    }
  }

  assert.equal(failures, 0, `${failures} Lua ownership load failures`);
}
