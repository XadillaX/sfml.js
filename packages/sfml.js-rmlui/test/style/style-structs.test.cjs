'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { Worker } = require('node:worker_threads');

async function collect() {
  for (let i = 0; i < 8; i++) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'native-defaults-and-every-public-field': function({ Style }) {
    const defaults = {
      CommonValues: {
        display: Style.Display.Inline, position: Style.Position.Static,
        float: Style.Float.None, clear: Style.Clear.None,
        overflowX: Style.Overflow.Visible, overflowY: Style.Overflow.Visible,
        visibility: Style.Visibility.Visible, hasDecorator: false,
        boxSizing: Style.BoxSizing.ContentBox,
        widthType: 0, heightType: 0,
        marginTopType: 1, marginRightType: 1,
        marginBottomType: 1, marginLeftType: 1,
        paddingTopType: 0, paddingRightType: 0,
        paddingBottomType: 0, paddingLeftType: 0,
        topType: 0, rightType: 0, bottomType: 0, leftType: 0, zIndexType: 0,
        widthValue: 0, heightValue: 0,
        marginTopValue: 0, marginRightValue: 0,
        marginBottomValue: 0, marginLeftValue: 0,
        paddingTopValue: 0, paddingRightValue: 0,
        paddingBottomValue: 0, paddingLeftValue: 0,
        topValue: 0, rightValue: 0, bottomValue: 0, leftValue: 0,
        zIndexValue: 0, borderTopWidth: 0, borderRightWidth: 0,
        borderBottomWidth: 0, borderLeftWidth: 0,
      },
      InheritedValues: {
        fontFaceHandle: null, fontSize: 12, opacity: 1,
        fontWeight: 400, fontKerning: 0, hasLetterSpacing: 0, fontStyle: 0,
        hasFontEffect: false, pointerEvents: 1, focus: 1, textAlign: 0,
        textDecoration: 0, textTransform: 0, whiteSpace: 0, wordBreak: 0,
        direction: 0, lineHeightInheritType: 0,
        lineHeight: Math.fround(12 * Math.fround(1.2)),
        lineHeightInherit: Math.fround(1.2), language: '',
      },
      RareValues: {
        minWidthType: 0, maxWidthType: 0, minHeightType: 0, maxHeightType: 0,
        perspectiveOriginXType: 1, perspectiveOriginYType: 1,
        transformOriginXType: 1, transformOriginYType: 1,
        hasLocalTransform: false, hasLocalPerspective: false,
        flexBasisType: 0, rowGapType: 0, columnGapType: 0,
        verticalAlignType: 0, drag: 0, tabIndex: 0, overscrollBehavior: 0,
        hasMaskImage: false, hasFilter: false, hasBackdropFilter: false,
        hasBoxShadow: false, textOverflow: 0,
        minWidth: 0, maxWidth: 3.4028234663852886e38,
        minHeight: 0, maxHeight: 3.4028234663852886e38,
        verticalAlignLength: 0, perspective: 0,
        perspectiveOriginX: 50, perspectiveOriginY: 50,
        transformOriginX: 50, transformOriginY: 50, transformOriginZ: 0,
        flexBasis: 0, rowGap: 0, columnGap: 0,
        borderTopLeftRadius: 0, borderTopRightRadius: 0,
        borderBottomRightRadius: 0, borderBottomLeftRadius: 0,
        scrollbarMargin: 0,
      },
    };
    const white = {
      type: 'colourb', red: 255, green: 255, blue: 255, alpha: 255,
    };
    for (const name of [
      'borderTopColor', 'borderRightColor', 'borderBottomColor',
      'borderLeftColor',
    ]) {
      defaults.CommonValues[name] = white;
    }
    defaults.CommonValues.backgroundColor = {
      type: 'colourb', red: 0, green: 0, blue: 0, alpha: 0,
    };
    defaults.InheritedValues.color = white;
    defaults.RareValues.imageColor = white;
    let count = 0;
    for (const [ name, expected ] of Object.entries(defaults)) {
      const value = new Style[name]();
      const fields = Object.entries(
        Object.getOwnPropertyDescriptors(Style[name].prototype))
        .filter(([ key, descriptor ]) =>
          descriptor.get && !key.endsWith('View'));
      const expectedFields = Object.keys(expected);
      if (name === 'RareValues') {
        expectedFields.push('clip');
      }
      assert.deepEqual(fields.map(([ key ]) => key).sort(),
        expectedFields.sort());
      for (const [ field, fieldValue ] of Object.entries(expected)) {
        assert.deepEqual(value[field], fieldValue, `${name}.${field}`);
        value[field] = fieldValue;
        assert.deepEqual(value[field], fieldValue, `${name}.${field} write`);
      }
      count += fields.length;
    }
    assert.equal(count, 112);
    const rare = new Style.RareValues();
    assert.equal(rare.clip.getType(), Style.ClipType.Auto);
    rare.clip = new Style.Clip(Style.ClipType.Number, 7);
    assert.equal(rare.clip.getNumber(), 7);
  },

  'native-bitfields-preserve-neighbours-and-validate': function({ Style }) {
    const common = new Style.CommonValues();
    common.display = Style.Display.TableCell;
    common.position = Style.Position.Fixed;
    common.float = Style.Float.Right;
    common.hasDecorator = true;
    common.widthType = Style.LengthPercentageAutoType.Percentage;
    assert.equal(common.display, Style.Display.TableCell);
    assert.equal(common.position, Style.Position.Fixed);
    assert.equal(common.float, Style.Float.Right);
    assert.equal(common.hasDecorator, true);
    assert.equal(common.widthType, Style.LengthPercentageAutoType.Percentage);
    assert.equal(common.heightType, Style.LengthPercentageAutoType.Auto);
    const inherited = new Style.InheritedValues();
    inherited.fontWeight = 1000;
    inherited.hasLetterSpacing = 1;
    inherited.fontKerning = Style.FontKerning.None;
    assert.equal(inherited.fontWeight, 1000);
    assert.equal(inherited.hasLetterSpacing, 1);
    assert.equal(inherited.fontKerning, Style.FontKerning.None);
    for (const [ object, field, invalid ] of [
      [ common, 'display', 14 ], [ common, 'widthType', 3 ],
      [ common, 'hasDecorator', 1 ], [ inherited, 'fontWeight', 1001 ],
      [ inherited, 'hasLetterSpacing', 2 ],
      [ inherited, 'hasLetterSpacing', true ],
    ]) {
      const previous = object[field];
      assert.throws(() => {
        object[field] = invalid;
      }, /range|enum|boolean/i);
      assert.equal(object[field], previous);
    }
  },

  'shared-numbers-colours-and-native-integer-widths': function({ Style }) {
    const common = new Style.CommonValues();
    const rare = new Style.RareValues();
    common.widthValueView[0] = 73.25;
    assert.equal(common.widthValue, 73.25);
    common.widthValue = 0.1;
    assert.equal(common.widthValueView[0], Math.fround(0.1));
    common.borderTopWidth = 65535;
    rare.borderTopLeftRadius = -32768;
    assert.ok(common.borderTopWidthView instanceof Uint16Array);
    assert.ok(rare.borderTopLeftRadiusView instanceof Int16Array);
    assert.equal(common.borderTopWidthView[0], 65535);
    assert.equal(rare.borderTopLeftRadiusView[0], -32768);
    assert.throws(() => {
      common.borderTopWidth = -1;
    }, /range/i);
    assert.throws(() => {
      rare.borderTopLeftRadius = 32768;
    }, /range/i);
    assert.throws(() => {
      rare.rowGap = Infinity;
    }, /finite/i);
    common.backgroundColorView.set([ 1, 2, 3, 4 ]);
    const colour = common.backgroundColor;
    assert.deepEqual(colour,
      { type: 'colourb', red: 1, green: 2, blue: 3, alpha: 4 });
    colour.red = 99;
    assert.equal(common.backgroundColor.red, 1);
    assert.throws(() => {
      common.backgroundColor =
        { type: 'colourb', red: 100, green: 2, blue: 300, alpha: 4 };
    }, /range/i);
    assert.equal(common.backgroundColor.red, 1, 'reject before partial write');
  },

  'standalone-storage-survives-wrapper-collection': async function({ Style }) {
    let common = new Style.CommonValues();
    const weak = new WeakRef(common);
    const width = common.widthValueView;
    const colour = common.backgroundColorView;
    common = null;
    await collect();
    assert.equal(weak.deref(), undefined);
    width[0] = 120;
    colour[3] = 123;
    assert.equal(width[0], 120);
    assert.equal(colour[3], 123);
    assert.equal(new Style.CommonValues().widthValue, 0);
  },

  'independent-worker-values-and-checked-handles': async function({ Style }) {
    const native = require('../../build/Release/rmlui.node');
    const common = new Style.CommonValues();
    const inherited = new Style.InheritedValues();
    inherited.language = '日本語\0العربية';
    assert.equal(inherited.language, '日本語\0العربية');
    assert.throws(() => native.commonValuesGetDisplay({}), /handle|Common/i);
    assert.throws(() => {
      inherited.fontFaceHandle = 5n;
    }, /font/i);
    assert.throws(() => {
      Object.getOwnPropertyDescriptor(Style.CommonValues.prototype, 'display')
        .get.call(inherited);
    }, /Common|kind|struct/i);
    assert.equal(common.display, Style.Display.Inline);
    const modulePath = JSON.stringify(require.resolve('../../dist'));
    await new Promise((resolve, reject) => {
      const worker = new Worker(`
        const { Style } = require(${modulePath});
        const assert = require('node:assert/strict');
        const common = new Style.CommonValues();
        common.display = Style.Display.Flex;
        common.widthValue = 20;
        const inherited = new Style.InheritedValues();
        inherited.language = '中文';
        inherited.fontFaceHandle = null;
        const rare = new Style.RareValues();
        rare.clip = new Style.Clip(Style.ClipType.Number, 5);
        assert.equal(common.display, Style.Display.Flex);
        assert.equal(common.widthValueView[0], 20);
        assert.equal(inherited.language, '中文');
        assert.equal(inherited.fontFaceHandle, null);
        assert.equal(rare.clip.getNumber(), 5);
      `, { eval: true });
      worker.on('error', reject);
      worker.on('exit', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Worker failed: ' + code));
        }
      });
    });
  },
};

if (process.argv[2]) {
  Promise.resolve().then(() =>
    cases[process.argv[2]](require('../../dist'))).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  let failures = 0;
  for (const name of Object.keys(cases)) {
    const result = spawnSync(process.execPath,
      [ '--expose-gc', __filename, name ],
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      failures++;
      console.error(`FAIL ${name}`, result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} style struct regressions failed`);
}
