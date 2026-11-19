'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const { counted, distribution, memory } = require('./measure-performance.cjs');
const countNativeCalls = require('./count-native-calls.cjs');

const warmupFrames = 20;
const countedFrames = 5;
const alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function textAt(count, offset) {
  const letters = alphabet.slice(offset) + alphabet.slice(0, offset);
  return letters.repeat(Math.ceil(count / letters.length)).slice(0, count);
}

function run(count, strategy, samples) {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'RmlUi glyph measurement');
  window.setVerticalSyncEnabled(false);
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  const beforeSetup = memory();
  let result;
  try {
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    let effectName = '';
    if (strategy === 'host-effect') {
      rmlui.FontEffectInstancer.register('measured-effect',
        new rmlui.FontEffectInstancer(() => new rmlui.FontEffect({
          hasUniqueTexture: () => true,
          getGlyphMetrics(_glyph, origin, dimensions) {
            return { supported: true, origin, dimensions };
          },
          generateGlyphTexture(bytes, dimensions, stride, glyph) {
            const bitmap = glyph.bitmapData;
            for (let y = 0; y < dimensions.y; ++y) {
              for (let x = 0; x < dimensions.x; ++x) {
                const alpha = bitmap[y * dimensions.x + x];
                const offset = y * stride + x * 4;
                bytes[offset] = alpha;
                bytes[offset + 1] = alpha;
                bytes[offset + 2] = alpha;
                bytes[offset + 3] = alpha;
              }
            }
          },
        })));
      effectName = 'font-effect: measured-effect();';
    }
    const context = rmlui.createContext('glyphs', 320, 240);
    const model = context.createDataModel('text');
    model.bind('content', textAt(count, 0));
    const variable = model.getVariable('content');
    const loaded = counted(() => context.loadDocumentFromMemory(
      '<rml><head><style>body { display: block; margin: 0;' +
      ' width: 320px; height: 240px; overflow: hidden; }' +
      ' p { display: block; white-space: pre; font-family: LatoLatin;' +
      `font-size: 12px; color: white; ${effectName} }` +
      '</style></head><body data-model="text">' +
      '<p id="text">{{content}}</p></body></rml>'));
    const document = loaded.result;
    document.show();
    const text = document.getElementById('text').getChild(0);
    assert.equal(text.getText(), textAt(count, 0));
    const frame = (workload, index, timed) => {
      const stages = {};
      const start = process.hrtime.bigint();
      let previous = start;
      const mark = stage => {
        const now = process.hrtime.bigint();
        if (timed) {
          stages[stage] = Number(now - previous) / 1e6;
        }
        previous = now;
      };
      window.clear(sfml.Color.Black);
      window.flush();
      mark('clear');
      if (workload !== 'steady') {
        if (workload === 'atlas-rebuild') {
          rmlui.releaseFontResources();
        }
        variable.set(textAt(count, index % 2));
        model.dirtyVariable('content');
      }
      mark('input');
      model.update();
      mark('update');
      context.update();
      mark('layout');
      context.render();
      mark('render');
      window.display();
      mark('present');
      stages.frame = Number(previous - start) / 1e6;
      return stages;
    };
    const firstFrame = counted(() => frame('steady', 0, false)).counts;
    assert.ok(firstFrame.geometryUploads > 0);
    assert.equal(text.getText(), textAt(count, 0));
    const results = [];
    for (const workload of [ 'steady', 'text-change', 'atlas-rebuild' ]) {
      for (let i = 0; i < warmupFrames; ++i) {
        frame(workload, i, false);
      }
      if (global.gc) {
        global.gc();
      }
      const stages = {};
      for (let i = 0; i < samples; ++i) {
        const durations = frame(workload, i, true);
        for (const [ stage, value ] of Object.entries(durations)) {
          (stages[stage] ??= []).push(value);
        }
      }
      assert.equal(text.getText(),
        textAt(count, workload === 'steady' ? 0 : (samples - 1) % 2));
      const counters = [];
      for (let i = 0; i < countedFrames; ++i) {
        counters.push(counted(() =>
          frame(workload, samples + i, false)).counts);
      }
      if (workload === 'steady') {
        assert.equal(counters[0].geometryUploads, 0);
        assert.equal(counters[0].callbacks.fontEffect, 0);
      }
      const crossingSample = countNativeCalls(() =>
        frame(workload, samples + countedFrames, false));
      assert.equal(crossingSample.sfml.methods.submitRenderWindow, 2);
      assert.equal(text.getText(),
        textAt(count, workload === 'steady' ? 0
          : (samples + countedFrames) % 2));
      results.push({ workload, counters, crossingSample,
        stages: Object.fromEntries(Object.entries(stages)
          .map(([ stage, values ]) => [ stage, distribution(values) ])) });
    }
    result = { glyphs: count, uniqueCharacters: alphabet.length, strategy,
      loadCounters: loaded.counts, firstFrame,
      emptySessionCounters: counted(() => {}).counts,
      memory: { beforeSetup, retained: memory() }, results };
  } finally {
    rmlui.shutdown();
    window.close();
  }
  result.memory.afterShutdown = memory();
  return result;
}

if (process.argv[2] === '--child') {
  console.log(JSON.stringify(run(Number(process.argv[3]),
    process.argv[4], Number(process.argv[5]))));
} else {
  const quick = process.argv.includes('--quick');
  const samples = quick ? 8 : 80;
  const sizes = quick ? [ 1000 ] : [ 1000, 10000, 100000 ];
  const runs = [];
  for (const count of sizes) {
    for (const strategy of [ 'native-text', 'host-effect' ]) {
      const child = spawnSync(process.execPath,
        [ '--expose-gc', __filename, '--child', String(count), strategy,
          String(samples) ], {
          encoding: 'utf8', timeout: 300000, maxBuffer: 4 * 1024 * 1024,
        });
      assert.equal(child.status, 0,
        `${count}/${strategy}: ${child.error ?? child.signal ?? ''}` +
        `\n${child.stderr}`);
      runs.push(JSON.parse(child.stdout));
      console.error(`[measured] ${count} glyphs / ${strategy}`);
    }
  }
  console.log(JSON.stringify({
    date: new Date().toISOString(), sampleFrames: samples,
    warmupFrames, countedFrames,
    scope: 'Native text versus explicit extra host glyph-effect layer;' +
      ' same text, font, size, clipping; effect adds geometry and atlas work',
    atlasRebuild: 'Explicit releaseFontResources each frame;' +
      ' synthetic cold resource path, not steady-state cost',
    timing: 'Counters/malloc logger disabled; CPU frame through display',
    runs,
  }, null, 2));
}
