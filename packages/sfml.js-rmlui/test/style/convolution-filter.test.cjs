'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'sum-writes-alpha-and-retains-rgb-stride-and-subarray': rmlui => {
    const filter = new rmlui.ConvolutionFilter();
    assert.equal(filter.initialise(
      { x: 1, y: 0 }, rmlui.FilterOperation.Sum), true);
    filter.kernel.set([ 0.25, 0.5, 0.25 ]);

    const bytes = rmlui.ConvolutionFilter.allocateBytes(32);
    bytes.fill(17);
    const destination = bytes.subarray(4, 32);
    filter.run(destination, { x: 3, y: 2 }, 16, rmlui.ColorFormat.RGBA8,
      Uint8Array.from([ 40, 80, 120, 20, 60, 100 ]),
      { x: 3, y: 2 }, { x: 0, y: 0 }, rmlui.ColorFormat.A8);

    assert.deepEqual([ ...bytes ], [
      17, 17, 17, 17,
      17, 17, 17, 40, 17, 17, 17, 80, 17, 17, 17, 80,
      17, 17, 17, 17,
      17, 17, 17, 25, 17, 17, 17, 60, 17, 17, 17, 65,
    ]);
  },

  'dilation-uses-rgba-alpha-and-source-offset': rmlui => {
    const filter = new rmlui.ConvolutionFilter();
    filter.initialise(1, rmlui.FilterOperation.Dilation);
    filter.kernel.fill(1);
    const output = new Uint8Array(12);
    filter.run(output, { x: 4, y: 3 }, 4, rmlui.ColorFormat.A8,
      Uint8Array.from([ 200, 201, 202, 30, 210, 211, 212, 90 ]),
      { x: 2, y: 1 }, { x: 1, y: 1 }, rmlui.ColorFormat.RGBA8);
    assert.deepEqual([ ...output ], [
      30, 90, 90, 90, 30, 90, 90, 90, 30, 90, 90, 90,
    ]);
  },

  'reinitialisation-keeps-exported-rows-independent': rmlui => {
    const filter = new rmlui.ConvolutionFilter();
    assert.throws(() => filter.getRow(0), /initial/i);
    assert.equal(filter.initialise(1, rmlui.FilterOperation.Sum), true);
    assert.throws(() => filter.getRow(undefined), RangeError);
    const kernel = filter.kernel;
    const row = filter.getRow(1);
    row.set([ 0, 1, 0 ]);
    assert.equal(kernel[4], 1);
    assert.equal(filter.initialise(-1, rmlui.FilterOperation.Sum), false);
    assert.equal(filter.kernel[4], 1);
    assert.equal(filter.initialise(0, rmlui.FilterOperation.Sum), true);
    kernel[4] = 7;
    assert.deepEqual([ ...row ], [ 0, 7, 0 ]);
    assert.deepEqual([ ...filter.kernel ], [ 0 ]);
    assert.throws(() => filter.getRow(1), RangeError);
  },

  'invalid-buffers-and-kernels-do-not-partially-write': rmlui => {
    const filter = new rmlui.ConvolutionFilter();
    filter.initialise(0, rmlui.FilterOperation.Sum);
    const output = new Uint8Array(4).fill(19);
    const run = (destination = output, dimensions = { x: 1, y: 1 },
      stride = 4, format = rmlui.ColorFormat.RGBA8,
      source = Uint8Array.of(80), offset = { x: 0, y: 0 }) => {
      filter.run(destination, dimensions, stride, format, source,
        { x: 1, y: 1 }, offset, rmlui.ColorFormat.A8);
    };

    filter.kernel[0] = NaN;
    assert.throws(() => run(), RangeError);
    filter.kernel[0] = -1;
    assert.throws(() => run(), RangeError);
    filter.kernel[0] = 1;
    assert.throws(() => run(output.subarray(0, 3)), RangeError);
    assert.throws(() => run(output, undefined, 3), RangeError);
    assert.throws(() => run(output, { x: 2147483647, y: 1 }), RangeError);
    assert.throws(() => run(output, undefined, undefined, 2), RangeError);
    assert.throws(() => run(output, undefined, undefined, undefined, output),
      RangeError);
    assert.throws(() => run(output, undefined, undefined, undefined, undefined,
      { x: -2147483648, y: 0 }), RangeError);
    assert.deepEqual([ ...output ], [ 19, 19, 19, 19 ]);

    filter.kernel[0] = 8;
    run();
    assert.deepEqual([ ...output ], [ 19, 19, 19, 255 ]);
  },

  'negative-sum-weights-are-safe-when-output-stays-nonnegative': rmlui => {
    const filter = new rmlui.ConvolutionFilter();
    filter.initialise({ x: 1, y: 0 }, rmlui.FilterOperation.Sum);
    filter.kernel.set([ -0.5, 2, -0.5 ]);
    const output = new Uint8Array(3);
    filter.run(output, { x: 3, y: 1 }, 3, rmlui.ColorFormat.A8,
      Uint8Array.from([ 100, 100, 100 ]), { x: 3, y: 1 },
      { x: 0, y: 0 }, rmlui.ColorFormat.A8);
    assert.deepEqual([ ...output ], [ 150, 100, 150 ]);
  },

  'empty-regions-and-detached-or-shared-buffers': rmlui => {
    const filter = new rmlui.ConvolutionFilter();
    const empty = () => filter.run(new Uint8Array(0), { x: 0, y: 0 }, 0,
      rmlui.ColorFormat.A8, new Uint8Array(0), { x: 0, y: 0 },
      { x: 0, y: 0 }, rmlui.ColorFormat.A8);
    assert.throws(empty, /initial/i);
    filter.initialise(0, rmlui.FilterOperation.Sum);
    assert.doesNotThrow(empty);
    const detached = new Uint8Array(1);
    structuredClone(detached.buffer, { transfer: [ detached.buffer ] });

    const shared = new Uint8Array(new SharedArrayBuffer(1));
    for (const source of [ detached, shared ]) {
      assert.throws(() => filter.run(new Uint8Array(1), { x: 1, y: 1 }, 1,
        rmlui.ColorFormat.A8, source, { x: 1, y: 1 }, { x: 0, y: 0 },
        rmlui.ColorFormat.A8), TypeError);
    }
    assert.throws(() => filter.initialise(
      1073741824, rmlui.FilterOperation.Sum),
    RangeError);
    assert.throws(() => filter.initialise(0, 99), RangeError);
  },

  'native-kernel-and-byte-views-survive-wrapper-collection': async rmlui => {
    let reference;
    let row;
    (() => {
      const filter = new rmlui.ConvolutionFilter();
      filter.initialise({ x: 1, y: 0 }, rmlui.FilterOperation.Sum);
      row = filter.getRow(0);
      row.set([ 0.25, 0.5, 0.25 ]);
      reference = new WeakRef(filter);
    })();
    const bytes = rmlui.ConvolutionFilter.allocateBytes(4);
    bytes.set([ 1, 2, 3, 4 ]);

    for (let i = 0; i < 12; ++i) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(reference.deref(), undefined);
    rmlui.shutdown();
    row[1] = 0.75;
    bytes[3] = 9;
    assert.deepEqual([ ...row ], [ 0.25, 0.75, 0.25 ]);
    assert.deepEqual([ ...bytes ], [ 1, 2, 3, 9 ]);
  },
};

if (process.argv[2]) {
  Promise.resolve().then(() =>
    cases[process.argv[2]](require('../../dist'))).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  for (const name of Object.keys(cases)) {
    const child = spawnSync(process.execPath, [
      '--expose-gc', __filename, name,
    ], {
      encoding: 'utf8', timeout: 30000,
    });
    assert.equal(child.status, 0, `${name}\n${child.stdout}${child.stderr}`);
    console.log(`PASS ${name}`);
  }
}
