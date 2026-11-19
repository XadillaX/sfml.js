'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 16; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'all-supported-storage-types-and-enumerator-codes': ({ rmlui }) => {
    const { Variant, VariantType: type, Unit } = rmlui;
    const codes = {
      NONE: '-', BOOL: 'B', BYTE: 'b', CHAR: 'c', FLOAT: 'f', DOUBLE: 'd',
      INT: 'i', INT64: 'I', UINT: 'u', UINT64: 'U', STRING: 's',
      VECTOR2: '2', VECTOR3: '3', VECTOR4: '4', COLOURF: 'g', COLOURB: 'h',
      SCRIPTINTERFACE: 'p', TRANSFORMPTR: 't', TRANSITIONLIST: 'T',
      ANIMATIONLIST: 'A', DECORATORSPTR: 'D', FILTERSPTR: 'F',
      FONTEFFECTSPTR: 'E', COLORSTOPLIST: 'C', BOXSHADOWLIST: 'S', VOIDPTR: '*',
    };
    for (const [ key, character ] of Object.entries(codes)) {
      assert.equal(type[key], character.charCodeAt(0));
    }
    const values = [
      [ null, type.NONE ], [ true, type.BOOL ],
      ...[ 'byte', 'char', 'float', 'double', 'int', 'uint' ]
        .map(key => [{ type: key, value: 17 }, type[key.toUpperCase()] ]),
      [{ type: 'int64', value: 17n }, type.INT64 ],
      [{ type: 'uint64', value: 17n }, type.UINT64 ],
      [ 'text', type.STRING ], [{ x: 1, y: 2 }, type.VECTOR2 ],
      [{ x: 1, y: 2, z: 3 }, type.VECTOR3 ],
      [{ x: 1, y: 2, z: 3, w: 4 }, type.VECTOR4 ],
      [{ type: 'colourb', red: 1, green: 2, blue: 3, alpha: 4 }, type.COLOURB ],
      [{ type: 'colourf', red: 1, green: 2, blue: 3, alpha: 4 }, type.COLOURF ],
      [ new rmlui.Element('div'), type.SCRIPTINTERFACE ],
      [{ type: 'transform', primitives: [] }, type.TRANSFORMPTR ],
      [ rmlui.makeTransitionList(), type.TRANSITIONLIST ],
      [{ type: 'animationlist', animations: [] }, type.ANIMATIONLIST ],
      [ new rmlui.DecoratorList(), type.DECORATORSPTR ],
      [ new rmlui.FilterList(), type.FILTERSPTR ],
      [ new rmlui.FontEffectList(), type.FONTEFFECTSPTR ],
      [{ type: 'colorstoplist', values: [] }, type.COLORSTOPLIST ],
      [{ type: 'boxshadowlist', values: [] }, type.BOXSHADOWLIST ],
    ];
    assert.equal(values.length, 25);
    for (const [ input, storage ] of values) {
      const value = new Variant(input);
      assert.equal(value.getType(), storage);
      const copy = value.clone();
      assert.equal(copy.getType(), storage);
      assert.equal(copy.equals(value), true);
      assert.equal(new rmlui.Property(value, Unit.UNKNOWN)
        .equals(new rmlui.Property(input, Unit.UNKNOWN)),
      storage !== type.TRANSFORMPTR,
      `${type[storage]} native equality preserves shared pointer identity`);
      value.getReference(storage);
      copy.clear();
      assert.equal(copy.getType(), type.NONE);
    }
  },

  'owned-storage-type-copy-assignment-and-clear': ({ rmlui, document }) => {
    const { Variant, VariantType } = rmlui;
    const empty = new Variant();
    assert.equal(empty.getType(), VariantType.NONE);
    assert.equal(empty.value, null);
    const source = new Variant({ type: 'float', value: 0.1 });
    assert.equal(source.getType(), VariantType.FLOAT);
    assert.equal(source.value, Math.fround(0.1));
    const copy = new Variant(source);
    const clone = source.clone();
    source.assign('changed');
    assert.equal(source.getType(), VariantType.STRING);
    assert.equal(copy.getType(), VariantType.FLOAT);
    assert.equal(copy.equals(clone), true);
    assert.equal(copy.notEquals(source), true);
    empty.assign(copy);
    assert.equal(empty.equals(copy), true);
    assert.equal(new rmlui.Property(copy).value, Math.fround(0.1));
    document.setAttribute('owned', copy);
    copy.clear();
    assert.equal(copy.getType(), VariantType.NONE);
    assert.equal(document.getAttributeValue('owned'), Math.fround(0.1));
    assert.equal(copy.equals(new Variant()), true);
  },

  'native-get-and-getinto-report-failure-and-partial-output': ({ rmlui }) => {
    const { Variant } = rmlui;
    const fallback = { type: 'vector3i', x: 91, y: 92, z: 93 };
    const value = new Variant('17, bad, 3');
    assert.deepEqual(value.get(fallback), { x: 17, y: 92, z: 93 });
    assert.deepEqual(value.getInto(fallback), {
      success: false, value: { x: 17, y: 92, z: 93 },
    });
    value.assign('17, -2, 3');
    assert.deepEqual(value.getInto(fallback), {
      success: true, value: { x: 17, y: -2, z: 3 },
    });
    assert.deepEqual(new Variant().getInto(91),
      { success: false, value: 91 });
    assert.deepEqual(new Variant({ type: 'byte', value: 4 })
      .getInto({ type: 'byte', value: 91 }), { success: false, value: 91 });
    assert.deepEqual(new Variant('128512')
      .getInto({ type: 'character', value: 91 }),
    { success: true, value: 0x1f600 });
  },

  'reference-access-checks-storage-and-copies-values': ({ rmlui }) => {
    const { Variant, VariantType } = rmlui;
    const stored = new Variant({ x: 1, y: 2 });
    const output = stored.getReference(VariantType.VECTOR2);
    output.x = 99;
    assert.deepEqual(stored.value, { x: 1, y: 2 });
    assert.throws(() => stored.getReference(VariantType.VECTOR3),
      /type|storage/i);
    assert.throws(() => stored.getReference(123), /type|storage/i);
    const byte = new Variant({ type: 'byte', value: 4 });
    assert.equal(byte.getReference(VariantType.BYTE), 4);
  },

  'move-operations-preserve-upstream-moved-from-type': ({ rmlui }) => {
    const { Variant, VariantType } = rmlui;
    const scalar = new Variant({ type: 'int', value: 17 });
    const moved = scalar.move();
    assert.equal(moved.value, 17);
    assert.equal(scalar.value, 17);
    assert.equal(scalar.getType(), VariantType.INT);
    const text = new Variant('owned');
    const target = new Variant(91);
    target.moveAssign(text);
    assert.equal(target.value, 'owned');
    assert.equal(text.getType(), VariantType.STRING);
    assert.equal(typeof text.value, 'string');
    target.assign(target);
    assert.equal(target.value, 'owned');
    target.moveAssign(target);
    assert.equal(target.value, 'owned');
  },

  'copied-and-moved-pointers-retain-identity-and-release-edges':
    async ({ rmlui }) => {
      const { Variant, VariantType } = rmlui;
      const owner = new Variant();
      let weak;
      (() => {
        const target = new rmlui.Element('div');
        weak = new WeakRef(target);
        owner.assign(target);
      })();
      await collect();
      assert.ok(weak.deref());
      const copy = owner.clone();
      const moved = owner.move();
      assert.equal(moved.getType(), VariantType.SCRIPTINTERFACE);
      assert.equal(moved.getElementValue(), owner.value);
      assert.equal(copy.getReference(VariantType.SCRIPTINTERFACE), owner.value);
      assert.throws(() => copy.get(''), /pointer|typed/i);
      owner.clear();
      copy.clear();
      await collect();
      assert.ok(weak.deref());
      moved.clear();
      await collect();
      assert.equal(weak.deref(), undefined);
    },

  'destroyed-targets-null-all-owned-copies': ({ rmlui }) => {
    const target = new rmlui.Element('div');
    const original = new rmlui.Variant(target);
    const copy = original.clone();
    target.release();
    assert.equal(original.getElementValue(), null);
    assert.equal(copy.value, null);
    assert.equal(original.getType(), rmlui.VariantType.SCRIPTINTERFACE);
    assert.equal(original.equals(copy), true);
  },

  'destroyed-pointer-edges-and-detached-cycles-collect': async ({ rmlui }) => {
    const retained = new rmlui.Variant();
    let targetRef;
    let cycleRef;
    (() => {
      const target = new rmlui.Element('div');
      targetRef = new WeakRef(target);
      retained.assign(target);
      target.release();
      const cycle = new rmlui.Element('div');
      const value = new rmlui.Variant(cycle);
      cycle.setAttribute('self', value);
      cycleRef = new WeakRef(cycle);
    })();
    await collect();
    assert.equal(retained.value, null);
    assert.equal(targetRef.deref(), undefined);
    assert.equal(cycleRef.deref(), undefined);
  },

  'numeric-reads-do-not-trigger-global-owner-scans': ({ rmlui, context }) => {
    const native = require('../../build/Release/rmlui.node');
    const values = Array.from({ length: 128 },
      (_, value) => new rmlui.Variant(value));
    context.update();
    native.beginDataDiagnostics();
    for (let i = 0; i < 16; ++i) {
      for (const value of values) {
        assert.equal(value.getType(), rmlui.VariantType.DOUBLE);
        assert.equal(value.get(0), value.value);
      }
      context.update();
    }
    const diagnostics = native.endDataDiagnostics();
    assert.equal(diagnostics.callbackSnapshotVisits, 0);
    assert.equal(diagnostics.elementOwnershipVisits, 0);
  },

  'shutdown-clears-storage-and-invalidates-value-operations': ({ rmlui }) => {
    const value = new rmlui.Variant('owned');
    const selector = {
      type: 'vector2i',
      get x() {
        rmlui.shutdown();
        return 0;
      },
      y: 0,
    };
    assert.throws(() => value.get(selector), /initialised|valid/i);
    assert.equal(value.getType(), rmlui.VariantType.NONE);
    assert.throws(() => value.value, /initialised|valid/i);
    assert.throws(() => new rmlui.Variant(value), /initialised|valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Owned Variant');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('variants', 160, 120);
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body/></rml>');
    await cases[name]({ rmlui, context, document });
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
      { encoding: 'utf8', timeout: 20000 });
    if (result.status !== 0) {
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} owned Variant regressions failed`);
}
