'use strict';

/* eslint-disable no-bitwise -- Verify native unit flag combinations. */

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { Worker } = require('node:worker_threads');

function near(actual, expected) {
  const tolerance = Math.max(1, Math.abs(expected)) * 1e-6;
  assert.ok(Math.abs(actual - expected) <= tolerance,
    `${actual} != ${expected}`);
}

const cases = {
  'owned-numeric-values-and-native-equality': function({ rmlui }) {
    const { NumericValue, Unit } = rmlui;
    assert.equal(typeof NumericValue, 'function');
    const value = new NumericValue();
    assert.equal(value.number, 0);
    assert.equal(value.unit, Unit.UNKNOWN);
    assert.ok(value.numberView instanceof Float32Array);
    assert.ok(value.unitView instanceof Int32Array);
    assert.equal(value.numberView.length, 1);
    assert.equal(value.unitView.length, 1);
    value.number = 12.5;
    value.unit = Unit.PX;
    assert.equal(value.numberView[0], 12.5);
    assert.equal(value.unitView[0], Unit.PX);
    const copy = value.clone();
    assert.ok(copy.equals(value));
    assert.equal(copy.notEquals(value), false);
    value.numberView[0] = 14.5;
    value.unitView[0] = Unit.EM;
    assert.equal(value.number, 14.5);
    assert.equal(value.unit, Unit.EM);
    assert.equal(copy.number, 12.5);
    assert.ok(copy.notEquals(value));
    assert.ok(new NumericValue(-0, Unit.PX)
      .equals(new NumericValue(0, Unit.PX)));
    assert.equal(new NumericValue(1 / 3, Unit.PX).number, Math.fround(1 / 3));
  },

  'unit-flags-retain-upstream-values': function({ rmlui }) {
    const { Unit, anyUnit } = rmlui;
    assert.equal(Unit.UNKNOWN, 0);
    assert.equal(Unit.NUMBER, 1 << 4);
    assert.equal(Unit.PX, 1 << 6);
    assert.equal(Unit.RAD, 1 << 19);
    assert.equal(Unit.SHORTHAND_PLACEHOLDER, 1 << 29);
    assert.equal(Unit.PPI_UNIT,
      Unit.INCH | Unit.CM | Unit.MM | Unit.PT | Unit.PC);
    assert.equal(Unit.NUMERIC,
      Unit.NUMBER_LENGTH_PERCENT | Unit.ANGLE | Unit.X);
    assert.ok(anyUnit(Unit.LENGTH & Unit.REM));
    assert.equal(anyUnit(Unit.LENGTH & Unit.PERCENT), false);
    assert.equal(anyUnit(Unit.UNKNOWN), false);
    assert.throws(() => anyUnit(1 << 30), /unit/i);
    assert.throws(() => anyUnit('64'), /unit/i);
  },

  'resolve-all-native-numeric-units': function({ rmlui, document, context }) {
    const { NumericValue, Unit } = rmlui;
    const target = document.getElementById('target');
    context.setDensityIndependentPixelRatio(2);
    context.update();
    const lengths = [
      [ Unit.PX, 1 ], [ Unit.DP, 2 ],
      [ Unit.VW, 3.2 ], [ Unit.VH, 2.4 ],
      [ Unit.EM, 10 ], [ Unit.REM, 20 ],
      [ Unit.INCH, 192 ], [ Unit.CM, 192 / 2.54 ],
      [ Unit.MM, 192 / 25.4 ], [ Unit.PT, 192 / 72 ],
      [ Unit.PC, 192 / 6 ],
    ];
    for (const [ unit, scale ] of lengths) {
      const value = new NumericValue(2, unit);
      near(target.resolveLength(value), 2 * scale);
      near(target.resolveNumericValue(value, 123), 2 * scale);
    }
    assert.equal(target.resolveNumericValue(
      new NumericValue(2, Unit.NUMBER), 40), 80);
    assert.equal(target.resolveNumericValue(
      new NumericValue(25, Unit.PERCENT), 80), 20);
    near(target.resolveNumericValue(
      new NumericValue(180, Unit.DEG), 0), Math.PI);
    near(target.resolveNumericValue(new NumericValue(2, Unit.RAD), 0), 2);
    assert.equal(target.resolveNumericValue(
      new NumericValue(3, Unit.X), 50), 3);
    const nonNumeric = [
      Unit.UNKNOWN, Unit.STRING, Unit.COLOUR, Unit.TRANSFORM,
    ];
    for (const unit of nonNumeric) {
      assert.equal(target.resolveLength(new NumericValue(2, unit)), 0);
      assert.equal(target.resolveNumericValue(
        new NumericValue(2, unit), 40), 0);
    }
    assert.equal(target.resolveLength(new NumericValue(25, Unit.PERCENT)), 0);
    assert.equal(target.resolveLength(new NumericValue(2, Unit.NUMBER)), 0);
    context.setDimensions(640, 480);
    near(target.resolveLength(new NumericValue(2, Unit.VW)), 12.8);
  },

  'invalid-values-never-reach-native-arithmetic': function({
    rmlui, document,
  }) {
    const { NumericValue, Unit } = rmlui;
    const target = document.getElementById('target');
    const value = new NumericValue(4, Unit.PX);
    for (const invalid of [ NaN, Infinity, -Infinity, 1e100, '4' ]) {
      assert.throws(() => new NumericValue(invalid, Unit.PX), /finite/i);
      assert.throws(() => {
        value.number = invalid;
      }, /finite/i);
      assert.throws(() => target.resolveNumericValue(value, invalid),
        /finite/i);
    }
    for (const invalid of [ -1, 1 << 30, 0.5, '64' ]) {
      assert.throws(() => new NumericValue(2, invalid), /unit/i);
      assert.throws(() => {
        value.unit = invalid;
      }, /unit/i);
    }
    assert.equal(value.number, 4);
    assert.equal(value.unit, Unit.PX);
    value.numberView[0] = Infinity;
    assert.throws(() => target.resolveLength(value), /finite/i);
    assert.throws(() => value.clone(), /finite/i);
    value.number = 2;
    value.unitView[0] = -1;
    assert.throws(() => target.resolveLength(value), /unit/i);
    value.unit = Unit.LENGTH;
    assert.throws(() => target.resolveLength(value), /single unit/i);
    assert.throws(() => target.resolveNumericValue(value, 1), /single unit/i);
    // Unit sets remain representable and comparable, but cannot be resolved.
    assert.ok(value.equals(value.clone()));
    value.unit = Unit.PX;
    value.number = 3e38;
    assert.throws(() => target.resolveNumericValue(
      new NumericValue(3e38, Unit.NUMBER), 3e38), /overflow/i);
    assert.equal(target.resolveLength(value), Math.fround(3e38));
    assert.throws(() => target.resolveLength({ number: 1, unit: Unit.PX }),
      /NumericValue/);
    assert.throws(() => value.equals(Object.create(NumericValue.prototype)),
      /NumericValue/);
  },

  'views-outlive-gc-and-runtime': async function({ rmlui, document, window }) {
    const { NumericValue, Unit } = rmlui;
    let value = new NumericValue(42, Unit.DP);
    const weak = new WeakRef(value);
    const numbers = value.numberView;
    const units = value.unitView;
    const element = document.getElementById('target');
    value = null;
    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    rmlui.shutdown();
    numbers[0] = 21;
    units[0] = Unit.PX;
    assert.equal(numbers[0], 21);
    const after = new NumericValue(5, Unit.PX);
    assert.ok(after.equals(after.clone()));
    assert.ok(rmlui.initialise(window, { highDpi: false }));
    assert.throws(() => element.resolveLength(after), /no longer valid/i);
    const fresh = rmlui.createContext('fresh', 320, 240).createDocument();
    assert.equal(fresh.resolveLength(after), 5);
    numbers[0] = 100;
    assert.equal(after.number, 5);
  },

  'prototype-setters-and-native-handle-checks': function({ rmlui, document }) {
    const native = require('../../dist/internal/native').native;
    const { NumericValue, Unit } = rmlui;
    let calls = 0;
    const names = [ 'numberView', 'unitView', 'handle' ];
    const countSetter = () => {
      calls++;
    };
    for (const name of names) {
      // eslint-disable-next-line no-extend-native
      Object.defineProperty(Object.prototype, name, {
        configurable: true,
        set: countSetter,
      });
    }
    try {
      const value = new NumericValue(2, Unit.PX).clone();
      assert.equal(document.resolveLength(value), 2);
    } finally {
      for (const name of names) {
        delete Object.prototype[name];
      }
    }
    assert.equal(calls, 0);
    assert.throws(() => native.cloneNumericValue({}), /handle/i);
    assert.throws(() => native.numericValueEquals(
      native.createBox().handle, native.createNumericValue().handle),
    /handle/i);
  },

  'worker-values-do-not-use-the-main-runtime': async function() {
    const result = await new Promise((resolve, reject) => {
      const worker = new Worker(`
        const { parentPort, workerData } = require('node:worker_threads');
        const { NumericValue, Unit } = require(workerData);
        const value = new NumericValue(3, Unit.PX);
        value.numberView[0] = 9;
        parentPort.postMessage({
          number: value.number,
          unit: value.unit,
          equal: value.equals(value.clone()),
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
    assert.deepEqual(result, { number: 9, unit: 64, equal: true });
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)),
    'Numeric value acceptance'
  );
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('numeric', 320, 240);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 320px; height: 240px; font-size: 20px; }
#target { font-size: 10px; }
</style></head><body><div id="target"/></body></rml>`);
    document.show();
    context.update();
    await cases[name]({ rmlui, context, document, window });
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
  assert.equal(failures, 0, `${failures} numeric-value regressions failed`);
}
