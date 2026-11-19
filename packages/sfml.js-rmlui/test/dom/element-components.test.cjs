'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function identity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

const cases = {
  'scrollbars-native-sizes-identity-and-visibility':
    function({ document, rmlui }) {
      const host = document.getElementById('scroll');
      const scroll = host.getElementScroll();
      const { VERTICAL, HORIZONTAL } = rmlui.ScrollOrientation;
      assert.equal(VERTICAL, 0);
      assert.equal(HORIZONTAL, 1);
      assert.strictEqual(host.getElementScroll(), scroll);
      const vertical = scroll.getScrollbar(VERTICAL);
      const horizontal = scroll.getScrollbar(HORIZONTAL);
      assert.equal(vertical.tagName, 'scrollbarvertical');
      assert.equal(horizontal.tagName, 'scrollbarhorizontal');
      assert.equal(scroll.getScrollbarSize(VERTICAL), 12);
      assert.equal(scroll.getScrollbarSize(HORIZONTAL), 9);
      scroll.disableScrollbar(VERTICAL);
      assert.equal(scroll.getScrollbarSize(VERTICAL), 0);
      scroll.updateProperties();
      assert.equal(vertical.isVisible(), false);
      assert.strictEqual(scroll.getScrollbar(VERTICAL), vertical);
      scroll.enableScrollbar(VERTICAL, host.clientWidth);
      scroll.updateProperties();
      assert.equal(scroll.getScrollbarSize(VERTICAL), 12);
      assert.equal(vertical.isVisible(), true);
      scroll.formatScrollbars();
      scroll.updateProperties();
      host.scrollTop = 40;
      host.scrollLeft = 20;
      scroll.updateScrollbar(VERTICAL);
      scroll.updateScrollbar(HORIZONTAL);
      scroll.update();
      assert.equal(host.scrollTop, 40);
      assert.equal(host.scrollLeft, 20);
      assert.strictEqual(scroll.getScrollbar(VERTICAL), vertical);
    },

  'scrollbar-invalid-arguments-and-destroyed-host':
    function({ document, context }) {
      const host = document.getElementById('plain');
      const scroll = host.getElementScroll();
      assert.equal(scroll.getScrollbar(0), null);
      assert.equal(scroll.getScrollbarSize(1), 0);
      for (const invalid of [ -1, 2, 0.5, '0', NaN ]) {
        assert.throws(() => scroll.getScrollbar(invalid), /orientation/i);
        assert.throws(() => scroll.updateScrollbar(invalid), /orientation/i);
        assert.throws(() => scroll.disableScrollbar(invalid), /orientation/i);
        assert.throws(() => scroll.enableScrollbar(invalid, 100),
          /orientation/i);
      }
      assert.throws(() => scroll.enableScrollbar(0, Infinity), /finite/i);
      assert.throws(() => scroll.enableScrollbar(0, -1), /nonnegative/i);
      document.close();
      context.update();
      for (const operation of [
        () => scroll.update(), () => scroll.getScrollbar(0),
        () => scroll.enableScrollbar(0, 100),
        () => scroll.disableScrollbar(0), () => scroll.updateScrollbar(0),
        () => scroll.getScrollbarSize(0), () => scroll.formatScrollbars(),
        () => scroll.updateProperties(),
      ]) {
        assert.throws(operation, /no longer valid/i);
      }
    },

  'scrollbar-instancer-failures-preserve-component-state':
    function({ document, rmlui }) {
      const { Factory, ElementInstancer } = rmlui;
      const plain = Factory.getElementInstancer('*');
      const host = document.getElementById('plain');
      const scroll = host.getElementScroll();
      try {
        Factory.registerElementInstancer('*', null);
        assert.throws(() => scroll.enableScrollbar(0, 30), /scrollbar/i);
        Factory.registerElementInstancer('*', plain);
        assert.equal(scroll.getScrollbar(0), null);
        Factory.registerElementInstancer('*', new ElementInstancer(
          (parent, tag, attributes) => {
            if (tag === 'slidertrack') {
              return null;
            }
            return plain.instanceElement(parent, tag, attributes);
          }));
        assert.throws(() => scroll.enableScrollbar(0, 30), /scrollbar/i);
        Factory.registerElementInstancer('*', plain);
        assert.equal(scroll.getScrollbar(0), null);
        scroll.enableScrollbar(0, 30);
        scroll.enableScrollbar(1, 30);
        Factory.registerElementInstancer('*', new ElementInstancer(
          (parent, tag, attributes) => {
            if (tag === 'scrollbarcorner') {
              return null;
            }
            return plain.instanceElement(parent, tag, attributes);
          }));
        assert.throws(() => scroll.formatScrollbars(), /corner/i);
        Factory.registerElementInstancer('*', plain);
        scroll.formatScrollbars();
        assert.ok(scroll.getScrollbar(0));
        assert.ok(scroll.getScrollbar(1));
      } finally {
        Factory.registerElementInstancer('*', plain);
      }
    },

  'transform-state-native-null-column-order-and-readonly':
    function({ document, context }) {
      assert.equal(document.getElementById('plain').getTransformState(), null);
      const host = document.getElementById('translated');
      const state = host.getTransformState();
      assert.strictEqual(host.getTransformState(), state);
      const transform = state.getTransform();
      assert.ok(transform instanceof Float32Array);
      assert.equal(transform.length, 16);
      assert.equal(transform[12], 25);
      assert.equal(transform[13], 35);
      const inverse = state.getInverseTransform();
      assert.equal(inverse[12], -25);
      assert.equal(inverse[13], -35);
      assert.equal(state.getLocalPerspective(), null);
      assert.throws(() => state.setTransform(identity()), /read.only/i);
      assert.throws(() => state.setLocalPerspective(identity()), /read.only/i);
      transform[12] = 1000;
      assert.equal(state.getTransform()[12], 25);
      host.setProperty('transform', 'translate(45px, 55px)');
      context.update();
      context.render();
      assert.equal(state.getTransform()[12], 45);
      assert.equal(transform[12], 1000);
      const singular = document.getElementById('singular').getTransformState();
      assert.ok(singular.getTransform());
      assert.equal(singular.getInverseTransform(), null);
      const perspective = document.getElementById('perspective')
        .getTransformState().getLocalPerspective();
      assert.ok(Math.abs(perspective[11] + 1 / 200) < 1e-7);
      host.setProperty('transform', 'none');
      context.update();
      context.render();
      assert.equal(host.getTransformState(), null);
      assert.throws(() => state.getTransform(), /no longer has/i);
      document.close();
      context.update();
      assert.throws(() => state.getTransform(), /no longer valid/i);
      assert.equal(inverse[12], -25);
    },

  'transform-state-canonical-queries-reuse-native-token':
    function({ document }) {
      const target = document.getElementById('translated');
      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics();
      const state = target.getTransformState();
      for (let i = 0; i < 999; ++i) {
        assert.strictEqual(target.getTransformState(), state);
      }
      const counts = native.endDataDiagnostics();
      assert.equal(counts.runtimeEntries, 1000);
      assert.equal(counts.transformStateAllocations, 1);
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
    },

  'owned-transform-state-change-results-and-independent-lifetime':
    function({ rmlui }) {
      const state = new rmlui.TransformState();
      assert.equal(state.getTransform(), null);
      assert.equal(state.getLocalPerspective(), null);
      assert.equal(state.getInverseTransform(), null);
      const transform = identity();
      transform[12] = 7;
      assert.equal(state.setTransform(transform), true);
      assert.equal(state.setTransform(transform), false);
      transform[12] = 9;
      assert.equal(state.getTransform()[12], 7);
      assert.equal(state.getInverseTransform()[12], -7);
      assert.equal(state.setTransform(transform), true);
      assert.equal(state.getInverseTransform()[12], -9);
      transform[0] = 0;
      state.setTransform(transform);
      assert.equal(state.getInverseTransform(), null);
      assert.equal(state.setLocalPerspective(identity()), true);
      assert.equal(state.setLocalPerspective(identity()), false);
      assert.equal(state.setLocalPerspective(null), true);
      assert.equal(state.setTransform(null), true);
      assert.equal(state.setTransform(null), false);
      assert.throws(() => state.setTransform(new Float32Array(15)),
        /16 values/i);
      const nonfinite = identity();
      nonfinite[0] = NaN;
      assert.throws(() => state.setTransform(nonfinite), /finite/i);
      assert.throws(() => state.setTransform(Array.from(identity())),
        /Float32Array/i);
      const detached = identity();
      structuredClone(detached.buffer, { transfer: [ detached.buffer ] });
      assert.throws(() => state.setTransform(detached), /16 values|detached/i);
      rmlui.shutdown();
      state.setTransform(identity());
      assert.deepEqual(state.getTransform(), identity());
    },

  'transform-buffer-batch-storage-flags-and-no-ownership-scan':
    function({ document, context, rmlui }) {
      const hosts = [
        document.getElementById('plain'),
        document.getElementById('translated'),
        document.getElementById('singular'),
        document.getElementById('perspective'),
      ];
      const batch = new rmlui.ElementTransformBuffer(hosts);
      const view = batch.matrices;
      const flags = batch.flags;
      assert.equal(batch.length, 4);
      assert.equal(view.length, 4 * 48);
      assert.equal(flags.length, 4);
      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics();
      for (let i = 0; i < 100; i++) {
        batch.refresh();
      }
      const counts = native.endDataDiagnostics();
      assert.equal(counts.runtimeEntries, 100);
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
      assert.equal(counts.transformBufferAllocations, 0);
      assert.equal(counts.transformBufferElements, 400);
      assert.equal(counts.transformMatrixCopiedBytes, 400 * 16 * 4);
      assert.strictEqual(batch.matrices, view);
      assert.strictEqual(batch.flags, flags);
      assert.equal(flags[0], 0);
      assert.equal(flags[1], 5);
      assert.equal(flags[2], 1);
      assert.ok([ 2, 3, 6, 7 ].includes(flags[3]));
      assert.equal(view[48 + 12], 25);
      assert.equal(view[48 + 32 + 12], -25);
      hosts[1].setProperty('transform', 'translate(60px, 70px)');
      context.update();
      context.render();
      batch.refresh();
      assert.equal(view[48 + 12], 60);
      document.close();
      context.update();
      assert.throws(() => batch.refresh(), /no longer valid/i);
      assert.equal(view[48 + 12], 60);
      assert.deepEqual(Array.from(flags), [ 0, 5, 1, flags[3] ]);
      rmlui.shutdown();
      assert.throws(() => batch.refresh(), /not initialised/i);
      assert.equal(view[48 + 12], 60);
    },

  'transform-buffer-large-lists-use-one-native-entry':
    function({ document, rmlui }) {
      const target = document.getElementById('translated');
      const native = require('../../build/Release/rmlui.node');
      for (const size of [ 1000, 10000, 100000 ]) {
        const batch = new rmlui.ElementTransformBuffer(
          new Array(size).fill(target));
        native.beginDataDiagnostics();
        batch.refresh();
        const counts = native.endDataDiagnostics();
        assert.equal(counts.runtimeEntries, 1);
        assert.equal(counts.nativeCallbacks, 0);
        assert.equal(counts.elementOwnershipVisits, 0);
        assert.equal(counts.transformBufferAllocations, 0);
        assert.equal(counts.transformBufferElements, size);
        assert.equal(counts.transformMatrixCopiedBytes, size * 2 * 16 * 4);
        assert.equal(batch.matrices[(size - 1) * 48 + 12], 25);
        assert.equal(batch.flags[size - 1], 5);
      }
    },

  'transform-buffer-empty-invalid-and-conversion-invalidation':
    function({ document, context, rmlui }) {
      const batch = new rmlui.ElementTransformBuffer([]);
      batch.refresh();
      assert.equal(batch.matrices.length, 0);
      assert.equal(batch.flags.length, 0);
      assert.throws(() => new rmlui.ElementTransformBuffer([{}]),
        /native handle/i);
      const translated = document.getElementById('translated');
      assert.throws(() => new rmlui.ElementTransformBuffer([
        translated,
        {
          get handle() {
            document.close();
            context.update();
            return translated.handle;
          },
        },
      ]), /no longer valid/i);
    },

  'component-wrappers-detached-owner-and-buffer-gc':
    async function({ document, context, rmlui }) {
      let element = document.createElement('div');
      const scroll = element.getElementScroll();
      const weak = new WeakRef(element);
      element = null;
      for (let i = 0; i < 8; i++) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
      assert.ok(weak.deref());
      assert.equal(scroll.getScrollbarSize(0), 0);
      let batch = new rmlui.ElementTransformBuffer([
        document.getElementById('translated'),
      ]);
      batch.refresh();
      const view = batch.matrices;
      const weakBatch = new WeakRef(batch);
      batch = null;
      for (let i = 0; i < 8; i++) {
        await new Promise(resolve => setImmediate(resolve));
        global.gc();
      }
      assert.equal(weakBatch.deref(), undefined);
      document.close();
      context.update();
      assert.equal(scroll.getScrollbarSize(0), 0);
      rmlui.shutdown();
      assert.equal(view[12], 25);
      assert.throws(() => scroll.update(), /not initialised/i);
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 200)),
    'Element components acceptance');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('components', 240, 200);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 240px; height: 200px; margin: 0; }
div { display: block; width: 30px; height: 30px; }
#scroll { width: 100px; height: 100px; overflow: auto; }
#content { width: 300px; height: 400px; }
#translated { transform: translate(25px, 35px); }
#singular { transform: scale(0, 1); }
#perspective { perspective: 200px; }
scrollbarvertical { width: 12px; }
scrollbarhorizontal { height: 9px; }
</style></head><body>
<div id="scroll"><div id="content"/></div>
<div id="plain"/><div id="translated"/><div id="singular"/>
<div id="perspective"/>
</body></rml>`);
    document.show();
    context.update();
    context.render();
    await cases[name]({ document, context, rmlui });
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
  assert.equal(failures, 0, `${failures} component regressions failed`);
}
