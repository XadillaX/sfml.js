'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { Worker } = require('node:worker_threads');

const cases = {
  'owned-box-math-and-shared-fields': function({ rmlui }) {
    const {
      Box, BoxArea: area, BoxEdge: edge, BoxDirection: direction,
    } = rmlui;
    assert.equal(typeof Box, 'function');
    assert.equal(Box.numAreas, 3);
    assert.equal(Box.numEdges, 4);
    const box = new Box({ x: 80, y: 50 });
    assert.deepEqual(box.getSize(), { x: 80, y: 50 });
    for (const side of [ edge.Top, edge.Right, edge.Bottom, edge.Left ]) {
      box.setEdge(area.Margin, side, 5);
      box.setEdge(area.Border, side, 3);
      box.setEdge(area.Padding, side, 7);
    }
    assert.deepEqual(box.getPosition(), { x: 10, y: 10 });
    assert.deepEqual(box.getPosition(area.Margin), { x: -5, y: -5 });
    assert.deepEqual(box.getSize(area.Margin), { x: 110, y: 80 });
    assert.deepEqual(box.getFrameSize(area.Border), { x: 6, y: 6 });
    assert.deepEqual(box.getFrameSize(area.Content), { x: 80, y: 50 });
    assert.equal(box.getCumulativeEdge(area.Padding, edge.Top), 15);
    assert.equal(box.getCumulativeEdge(area.Content, edge.Top), 15);
    assert.equal(box.getSizeAcross(direction.Horizontal, area.Border), 100);
    assert.equal(box.getSizeAcross(
      direction.Vertical, area.Border, area.Padding), 20);
    assert.ok(box.content instanceof Float32Array);
    assert.ok(box.edges instanceof Float32Array);
    assert.equal(box.content.length, 2);
    assert.equal(box.edges.length, 12);
    box.content[0] = 100;
    box.edges[area.Margin * 4 + edge.Left] = -4;
    assert.equal(box.getSize().x, 100);
    assert.equal(box.getEdge(area.Margin, edge.Left), -4);
    assert.equal(box.getPosition(area.Margin).x, 4);
    box.setContent({ x: 40, y: 20 });
    assert.deepEqual(Array.from(box.content), [ 40, 20 ]);
  },

  'native-equality-and-independent-clone': function({ rmlui }) {
    const first = new rmlui.Box();
    const second = first.clone();
    assert.ok(first.equals(second));
    assert.equal(first.notEquals(second), false);
    second.content[0] = 1;
    assert.equal(first.getSize().x, 0);
    assert.ok(first.notEquals(second));
    second.content[0] = 0;
    // Upstream uses memcmp for edges, including the sign bit of zero.
    second.edges[0] = -0;
    assert.equal(first.equals(second), false);
    assert.equal(first.notEquals(second), true);
  },

  'element-box-overloads-and-snapshots': function({ document, rmlui }) {
    const target = document.getElementById('target');
    assert.equal(typeof target.getBox, 'function');
    const box = target.getBox();
    assert.ok(box instanceof rmlui.Box);
    assert.deepEqual(box.getSize(), { x: 80, y: 50 });
    const additional = new rmlui.Box({ x: 30, y: 40 });
    target.addBox(additional, { x: 12.5, y: 24.5 });
    additional.content[0] = 99;
    assert.equal(target.getNumBoxes(), 2);
    assert.deepEqual(target.getBox(1).offset, { x: 12.5, y: 24.5 });
    assert.equal(target.getBox(1).box.getSize().x, 30);
    for (const index of [ -1, 0, 2, 999 ]) {
      const result = target.getBox(index);
      assert.deepEqual(result.offset, { x: 0, y: 0 });
      assert.ok(result.box.equals(box));
    }
    box.setContent({ x: 100, y: 60 });
    target.setBox(box);
    assert.equal(target.getNumBoxes(), 1);
    box.content[0] = 200;
    assert.equal(target.getBox().getSize().x, 100);
  },

  'render-box-areas-and-shared-values': function({ document, rmlui }) {
    const target = document.getElementById('target');
    assert.equal(typeof target.getRenderBox, 'function');
    const box = target.getRenderBox();
    assert.ok(box instanceof rmlui.RenderBox);
    assert.deepEqual(box.getFillSize(), { x: 94, y: 64 });
    assert.deepEqual(box.getFillOffset(), { x: 3, y: 3 });
    assert.deepEqual(box.getBorderOffset(), { x: 0, y: 0 });
    assert.deepEqual(box.getBorderWidths(), [ 3, 3, 3, 3 ]);
    assert.deepEqual(box.getBorderRadius(), [ 8, 8, 8, 8 ]);
    assert.deepEqual(target.getRenderBox(rmlui.BoxArea.Content).getFillSize(),
      { x: 80, y: 50 });
    assert.deepEqual(target.getRenderBox(rmlui.BoxArea.Border).getFillSize(),
      { x: 100, y: 70 });
    const copy = box.clone();
    assert.ok(copy.equals(box));
    copy.fillSize[0] = 120;
    copy.borderWidths[3] = 9;
    assert.equal(copy.getFillOffset().x, 9);
    assert.equal(box.getFillSize().x, 94);
    assert.ok(copy.notEquals(box));
    copy.setFillSize({ x: 10, y: 20 });
    copy.setBorderOffset({ x: 30, y: 40 });
    copy.setBorderWidths([ 1, 2, 3, 4 ]);
    copy.setBorderRadius([ 5, 6, 7, 8 ]);
    assert.deepEqual(Array.from(copy.fillSize), [ 10, 20 ]);
    assert.deepEqual(copy.getBorderOffset(), { x: 30, y: 40 });
    assert.deepEqual(copy.getBorderWidths(), [ 1, 2, 3, 4 ]);
    assert.deepEqual(copy.getBorderRadius(), [ 5, 6, 7, 8 ]);
    const created = new rmlui.RenderBox(
      { x: 10, y: 20 }, { x: 30, y: 40 }, [ 1, 2, 3, 4 ], [ 5, 6, 7, 8 ]);
    assert.ok(created.equals(copy));
    assert.ok(created.notEquals(box));
    target.addBox(new rmlui.Box({ x: 10, y: 20 }), { x: 3.4, y: 5.6 });
    assert.deepEqual(target.getRenderBox(rmlui.BoxArea.Padding, 1)
      .getBorderOffset(), { x: 3, y: 6 });
    assert.deepEqual(target.getRenderBox(rmlui.BoxArea.Padding, 99)
      .getFillSize(), box.getFillSize());
  },

  'invalid-box-areas-and-values': function({ document, rmlui }) {
    const { Box, BoxArea: area, BoxEdge: edge } = rmlui;
    const box = new Box();
    const target = document.getElementById('target');
    for (const invalid of [ -1, area.Auto, 1.5, '1' ]) {
      assert.throws(() => box.getSize(invalid), /area/i);
      assert.throws(() => box.getPosition(invalid), /area/i);
      assert.throws(() => box.getFrameSize(invalid), /area/i);
    }
    assert.throws(() => box.setEdge(area.Content, edge.Top, 1), /area/i);
    assert.throws(() => box.getEdge(area.Content, edge.Top), /area/i);
    assert.throws(() => box.getEdge(area.Padding, 4), /edge/i);
    assert.throws(() => box.getSizeAcross(0, area.Content, area.Border),
      /area/i);
    assert.throws(() => box.getSizeAcross(2, area.Border), /direction/i);
    assert.throws(() => target.getRenderBox(area.Margin), /area/i);
    assert.throws(() => target.getRenderBox(area.Auto), /area/i);
    assert.throws(() => target.getBox(1.5), /index/i);
    assert.throws(() => target.getBox(-2147483648), /index/i);
    for (const invalid of [ NaN, Infinity, 1e100, '1' ]) {
      assert.throws(() => box.setContent({ x: invalid, y: 0 }), /finite/i);
      assert.throws(() => box.setEdge(area.Margin, edge.Top, invalid),
        /finite/i);
    }
    box.content[0] = NaN;
    assert.throws(() => target.setBox(box), /finite/i);
    assert.throws(() => box.getSize(), /finite/i);
    const renderBox = target.getRenderBox();
    assert.throws(() => renderBox.setBorderWidths([ 1, 2, 3 ]), /four/i);
    renderBox.fillSize[0] = Infinity;
    assert.throws(() => renderBox.getFillSize(), /finite/i);
  },

  'box-getter-destruction-and-atomic-write': function({
    document, context, rmlui,
  }) {
    const target = document.getElementById('target');
    const box = new rmlui.Box({ x: 5, y: 6 });
    const sentinel = new Error('box accessor');
    assert.throws(() => box.setContent({
      x: 10,
      get y() {
        throw sentinel;
      },
    }), error => error === sentinel);
    assert.deepEqual(box.getSize(), { x: 5, y: 6 });
    assert.throws(() => target.addBox(box, {
      get x() {
        box.content[0] = Infinity;
        return 0;
      },
      y: 0,
    }), /finite/i);
    assert.equal(target.getNumBoxes(), 1);
    box.setContent({ x: 5, y: 6 });
    assert.throws(() => target.addBox(box, {
      get x() {
        document.close();
        context.update();
        return 0;
      },
      y: 0,
    }), /no longer valid/i);
  },

  'box-views-outlive-wrappers-and-runtime': async function({
    document, context, rmlui, window,
  }) {
    let target = document.getElementById('target');
    let box = target.getBox();
    let renderBox = target.getRenderBox();
    const weak = new WeakRef(target);
    const weakBox = new WeakRef(box);
    const weakRender = new WeakRef(renderBox);
    const content = box.content;
    const edges = box.edges;
    const fillSize = renderBox.fillSize;
    target = box = renderBox = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    assert.equal(weakBox.deref(), undefined);
    assert.equal(weakRender.deref(), undefined);
    document.close();
    context.update();
    context.remove();
    rmlui.shutdown();
    assert.deepEqual(Array.from(content), [ 80, 50 ]);
    assert.deepEqual(Array.from(fillSize), [ 94, 64 ]);
    content[0] = 100;
    edges[0] = 5;
    fillSize[0] = 120;
    const independent = new rmlui.Box();
    assert.deepEqual(independent.getSize(), { x: 0, y: 0 });
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    const next = rmlui.createContext('boxes', 320, 240);
    const nextDocument = next.createDocument();
    const nextBox = nextDocument.createElement('div').getBox();
    content[0] = 500;
    assert.deepEqual(nextBox.getSize(), { x: 0, y: 0 });
  },

  'own-snapshot-properties-and-forged-receivers': function({
    document, rmlui,
  }) {
    const target = document.getElementById('target');
    let setterCalls = 0;
    const names = [
      'content', 'edges', 'handle', 'fillSize', 'borderOffset',
      'borderWidths', 'borderRadius', 'box', 'offset', 'x',
    ];
    const countSetter = () => {
      setterCalls++;
    };
    for (const name of names) {
      // eslint-disable-next-line no-extend-native
      Object.defineProperty(Object.prototype, name, {
        configurable: true,
        set: countSetter,
      });
    }
    let positioned;
    let rendering;
    try {
      positioned = target.getBox(0);
      rendering = target.getRenderBox();
      assert.deepEqual(positioned.box.getSize(), { x: 80, y: 50 });
      assert.deepEqual(rendering.getFillSize(), { x: 94, y: 64 });
    } finally {
      for (const name of names) {
        delete Object.prototype[name];
      }
    }
    assert.equal(setterCalls, 0);
    assert.throws(() => target.setBox(Object.create(rmlui.Box.prototype)),
      /Expected a Box/);
    assert.throws(() => positioned.box.equals(rendering), /Expected a Box/);
    assert.throws(() => rendering.equals(positioned.box), /RenderBox/);
  },

  'render-array-setters-are-atomic': function({ document }) {
    const box = document.getElementById('target').getRenderBox();
    const sentinel = new Error('edge accessor');
    const widths = [ 10, 20, 30, 40 ];
    Object.defineProperty(widths, 2, {
      get() {
        throw sentinel;
      },
    });
    assert.throws(() => box.setBorderWidths(widths),
      error => error === sentinel);
    assert.deepEqual(box.getBorderWidths(), [ 3, 3, 3, 3 ]);
  },

  'worker-values-are-independent-of-runtime': async function() {
    const result = await new Promise((resolve, reject) => {
      const worker = new Worker(`
        const { parentPort, workerData } = require('node:worker_threads');
        const { Box, BoxArea, BoxEdge, RenderBox } = require(workerData);
        const box = new Box({ x: 10, y: 20 });
        box.setEdge(BoxArea.Padding, BoxEdge.Top, 5);
        const render = new RenderBox(
          { x: 10, y: 20 }, { x: 0, y: 0 },
          [ 1, 2, 3, 4 ], [ 0, 0, 0, 0 ]);
        parentPort.postMessage({
          size: box.getSize(BoxArea.Padding),
          offset: render.getFillOffset(),
        });
      `, { eval: true, workerData: require.resolve('../../dist') });
      let message;
      worker.on('message', value => {
        message = value;
      });
      worker.on('error', reject);
      worker.on('exit', code => {
        if (code === 0) {
          resolve(message);
        } else {
          reject(new Error(`Worker exited with ${code}`));
        }
      });
    });
    assert.deepEqual(result, {
      size: { x: 10, y: 25 }, offset: { x: 4, y: 1 },
    });
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Box acceptance');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('boxes', 320, 240);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 320px; height: 240px; margin: 0; }
#target { display: block; position: absolute; left: 20px; top: 30px;
  width: 80px; height: 50px; padding: 7px; border: 3px #fff;
  border-radius: 8px; }
</style></head><body><div id="target"/></body></rml>`);
    document.show();
    context.update();
    await cases[name]({ document, context, rmlui, window });
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
    const result = spawnSync(process.execPath, [
      '--expose-gc', __filename, name,
    ], { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} box regressions failed`);
}
