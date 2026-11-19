'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  registry({ rmlui }) {
    assert.equal(typeof rmlui.getNumContexts, 'function');
    assert.equal(rmlui.getNumContexts(), 0);
    assert.equal(rmlui.getContext(0), null);
    const first = rmlui.createContext('first', 240, 160);
    const second = rmlui.createContext('second', 320, 200);
    assert.equal(first.name, 'first');
    assert.strictEqual(rmlui.getContext('first'), first);
    assert.equal(rmlui.getNumContexts(), 2);
    assert.deepEqual(new Set([ rmlui.getContext(0), rmlui.getContext(1) ]),
      new Set([ first, second ]));
    for (const key of [ -1, 2, 200, 'missing' ]) {
      // Core.cpp returns null out of range, despite Core.h's clamp comment.
      assert.equal(rmlui.getContext(key), null);
    }
    assert.throws(() => rmlui.getContext(0.5), /index/i);
    assert.equal(rmlui.removeContext('missing'), false);
    const oldDimensions = first.dimensions;
    assert.equal(rmlui.removeContext('first'), true);
    assert.equal(oldDimensions.width, 0);
    assert.throws(() => first.name, /no longer valid/i);
    assert.equal(rmlui.getNumContexts(), 1);
    const recreated = rmlui.createContext('first', 30, 40);
    assert.notStrictEqual(recreated, first);
    assert.strictEqual(rmlui.getContext('first'), recreated);
    assert.equal(recreated.remove(), true);
    assert.equal(second.remove(), true);
    assert.equal(rmlui.getNumContexts(), 0);
  },

  'readonly-dimensions': function({ rmlui }) {
    const context = rmlui.createContext('dimensions', 240, 160);
    const view = context.dimensions;
    assert.throws(() => {
      view.width = 999;
    }, TypeError);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    const duringResize = [];
    document.addEventListener('resize', () => duringResize.push({ ...view }));
    context.setDimensions(300, 200);
    assert.strictEqual(context.dimensions, view);
    assert.deepEqual({ ...view }, { width: 300, height: 200 });
    context.processEvent({ kind: 'Resized', size: { x: 320, y: 240 } });
    assert.deepEqual({ ...view }, { width: 320, height: 240 });
    assert.deepEqual(duringResize, [
      { width: 300, height: 200 }, { width: 320, height: 240 },
    ]);
    for (const value of [ -1, 0.5, NaN, Infinity, 2 ** 32 ]) {
      assert.throws(() => context.setDimensions(value, 200), /dimension/i);
      assert.throws(() => rmlui.createContext('bad', 200, value), /dimension/i);
    }
    context.remove();
    assert.deepEqual({ ...view }, { width: 0, height: 0 });
  },

  'manual-density': function({ rmlui }) {
    const context = rmlui.createContext('density', 240, 160);
    assert.equal(typeof context.setDensityIndependentPixelRatio, 'function');
    context.setDensityIndependentPixelRatio(2);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 240px; height: 160px; }
div { position: absolute; left: 20dp; top: 20dp;
      width: 20dp; height: 20dp; }
</style></head><body><div/></body></rml>`);
    document.show();
    context.update();
    const target = document.querySelector('div');
    let clicks = 0;
    target.addEventListener('click', () => clicks++);
    context.processMouseMove(60, 60);
    context.processMouseButtonDown(0);
    context.processMouseButtonUp(0);
    assert.equal(clicks, 1);
    assert.equal(context.densityIndependentPixelRatio, 2);
    context.processEvent({ kind: 'Resized', size: { x: 240, y: 160 } });
    context.update();
    assert.equal(context.densityIndependentPixelRatio, 2);
    context.setDensityIndependentPixelRatio(null);
    context.update();
    assert.equal(context.densityIndependentPixelRatio, 1);
    context.processMouseMove(60, 60);
    context.processMouseButtonDown(0);
    context.processMouseButtonUp(0);
    assert.equal(clicks, 1);
    for (const value of [ 0, -1, NaN, Infinity, 1e100 ]) {
      assert.throws(() => context.setDensityIndependentPixelRatio(value),
        /density/i);
    }
  },

  scheduling({ rmlui }) {
    const context = rmlui.createContext('schedule', 240, 160);
    assert.equal(typeof context.requestNextUpdate, 'function');
    context.update();
    assert.equal(context.getNextUpdateDelay(), Infinity);
    context.requestNextUpdate(3);
    context.requestNextUpdate(5);
    assert.equal(context.getNextUpdateDelay(), 3);
    context.requestNextUpdate(0);
    assert.equal(context.getNextUpdateDelay(), 0);
    context.update();
    context.requestNextUpdate(Infinity);
    assert.equal(context.getNextUpdateDelay(), Infinity);
    for (const value of [ -1, NaN, '1' ]) {
      assert.throws(() => context.requestNextUpdate(value), /delay/i);
    }
    context.remove();
    assert.throws(() => context.requestNextUpdate(0), /no longer valid/i);
  },

  'view-lifetime': async function({ rmlui }) {
    assert.equal(typeof rmlui.getContext, 'function');
    let context = rmlui.createContext('gc', 240, 160);
    const view = context.dimensions;
    const weak = new WeakRef(context);
    context = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    const alias = rmlui.getContext('gc');
    alias.setDimensions(40, 50);
    assert.deepEqual({ ...view }, { width: 40, height: 50 });
    alias.remove();
    assert.deepEqual({ ...view }, { width: 0, height: 0 });
    rmlui.createContext('gc', 900, 900);
    assert.deepEqual({ ...view }, { width: 0, height: 0 });
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 160)), 'Context state');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({ rmlui });
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
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} context state regressions failed`);
}
