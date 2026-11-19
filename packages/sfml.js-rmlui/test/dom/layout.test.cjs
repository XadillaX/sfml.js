'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const cases = {
  'manual-offset-parent-scroll-fixed-and-detachment':
    function({ document, context, rmlui }) {
      const scroller = document.getElementById('scroller');
      const content = document.getElementById('content');
      content.setProperty('position', 'static');
      context.update();
      content.setOffset({ x: 17, y: 23 }, scroller);
      assert.equal(content.offsetParent, scroller);
      assert.deepEqual(content.getRelativeOffset(rmlui.BoxArea.Border),
        { x: 17, y: 23 });
      assert.deepEqual(content.getAbsoluteOffset(rmlui.BoxArea.Border),
        { x: 157, y: 33 });
      scroller.scrollLeft = 9;
      scroller.scrollTop = 11;
      assert.deepEqual(content.getAbsoluteOffset(rmlui.BoxArea.Border),
        { x: 148, y: 22 });
      content.setOffset({ x: 17, y: 23 }, scroller, true);
      assert.deepEqual(content.getAbsoluteOffset(rmlui.BoxArea.Border),
        { x: 157, y: 33 });
      assert.throws(() => content.setOffset({ x: 1, y: 2 }, content),
        /ancestor/i);
      assert.throws(() => content.setOffset({ x: 1, y: 2 },
        document.getElementById('target')), /ancestor/i);
      assert.throws(() => content.setOffset({ x: Infinity, y: 2 }, scroller),
        /finite/i);
      assert.throws(() => content.setOffset({ x: 1, y: 2 }, scroller, 1),
        /boolean/i);
      scroller.removeChild(content);
      assert.equal(content.offsetParent, null);
      content.setOffset({ x: 5, y: 7 }, null);
      assert.deepEqual(content.getAbsoluteOffset(rmlui.BoxArea.Border),
        { x: 5, y: 7 });
      document.close();
      context.update();
      assert.deepEqual(content.getAbsoluteOffset(rmlui.BoxArea.Border),
        { x: 5, y: 7 });
      rmlui.shutdown();
      assert.throws(() => content.setOffset({ x: 0, y: 0 }, null),
        /not initialised/i);
    },

  'manual-offset-conversion-rechecks-receiver-and-parent':
    function({ document, context }) {
      const content = document.getElementById('content');
      const scroller = document.getElementById('scroller');
      assert.throws(() => content.setOffset({
        get x() {
          document.close();
          context.update();
          return 1;
        },
        y: 2,
      }, scroller), /valid/i);
    },

  'closest-scroll-container-self-axes-containment-and-lifetime':
    function({ document, context }) {
      const scroller = document.getElementById('scroller');
      const content = document.getElementById('content');
      const item = document.getElementById('item');
      assert.equal(scroller.getClosestScrollableContainer(), scroller);
      assert.equal(item.getClosestScrollableContainer(), scroller);
      assert.equal(document.getClosestScrollableContainer(), null);
      scroller.setProperty('overflow-x', 'hidden');
      scroller.setProperty('overflow-y', 'hidden');
      context.update();
      assert.equal(item.getClosestScrollableContainer(), null);
      content.setProperty('overscroll-behavior', 'contain');
      context.update();
      assert.equal(item.getClosestScrollableContainer(), content);
      assert.equal(content.getClosestScrollableContainer(), content);
      content.removeProperty('overscroll-behavior');
      scroller.setProperty('overflow-x', 'auto');
      context.update();
      assert.equal(item.getClosestScrollableContainer(), scroller);
      scroller.setProperty('overflow-x', 'hidden');
      scroller.setProperty('overflow-y', 'scroll');
      context.update();
      assert.equal(item.getClosestScrollableContainer(), scroller);
      content.setProperty('width', '10px');
      content.setProperty('height', '10px');
      item.setProperty('top', '0px');
      context.update();
      assert.equal(item.getClosestScrollableContainer(), null);
      document.removeChild(scroller);
      assert.equal(scroller.getClosestScrollableContainer(), null);
      document.appendChild(scroller);
      scroller.setProperty('overscroll-behavior', 'contain');
      context.update();
      assert.equal(item.getClosestScrollableContainer(), scroller);
      document.close();
      context.update();
      assert.throws(() => item.getClosestScrollableContainer(), /valid/i);
    },

  'box-metrics-and-offsets': function({ document, context, rmlui }) {
    const target = document.getElementById('target');
    assert.equal(typeof target.getAbsoluteOffset, 'function');
    assert.deepEqual(target.getAbsoluteOffset(rmlui.BoxArea.Border),
      { x: 20, y: 30 });
    assert.deepEqual(target.getAbsoluteOffset(), { x: 30, y: 40 });
    assert.deepEqual(target.getRelativeOffset(rmlui.BoxArea.Border),
      { x: 20, y: 30 });
    assert.equal(target.absoluteLeft, 20);
    assert.equal(target.absoluteTop, 30);
    assert.equal(target.offsetLeft, 20);
    assert.equal(target.offsetTop, 30);
    assert.strictEqual(target.offsetParent, document);
    assert.equal(target.clientLeft, 3);
    assert.equal(target.clientTop, 3);
    assert.equal(target.clientWidth, 94);
    assert.equal(target.clientHeight, 64);
    assert.equal(target.offsetWidth, 100);
    assert.equal(target.offsetHeight, 70);
    assert.deepEqual(target.getContainingBlock(), { x: 320, y: 240 });
    const snapshot = target.getAbsoluteOffset();
    target.setProperty('left', '40px');
    context.update();
    assert.deepEqual(snapshot, { x: 30, y: 40 });
    assert.deepEqual(target.getAbsoluteOffset(), { x: 50, y: 40 });
    snapshot.x = -100;
    assert.equal(target.absoluteLeft, 40);
  },

  'computed-visibility-and-hit-test': function({ document, context, rmlui }) {
    const target = document.getElementById('target');
    assert.equal(typeof target.getPosition, 'function');
    assert.equal(target.getPosition(), rmlui.StylePosition.Absolute);
    assert.equal(target.getFloat(), rmlui.StyleFloat.None);
    assert.equal(target.getDisplay(), rmlui.StyleDisplay.Block);
    assert.equal(target.getLineHeight(), 18);
    assert.equal(target.baseline, 0);
    assert.equal(target.isReplaced(), false);
    assert.equal(target.zIndex, 4);
    assert.equal(target.isVisible(), true);
    assert.equal(target.isPointWithinElement({ x: 21, y: 31 }), true);
    assert.equal(target.isPointWithinElement({ x: 19, y: 31 }), false);
    document.hide();
    assert.equal(target.isVisible(), true);
    assert.equal(target.isVisible(true), false);
    document.show();
    target.setProperty('display', 'none');
    context.update();
    assert.equal(target.isVisible(), false);
    assert.equal(target.getDisplay(), rmlui.StyleDisplay.None);
  },

  'scroll-clamping-events-and-overflow': function({ document, rmlui }) {
    const scroller = document.getElementById('scroller');
    assert.equal(typeof scroller.scrollTo, 'function');
    assert.equal(scroller.scrollWidth, 300);
    assert.equal(scroller.scrollHeight, 400);
    const events = [];
    scroller.addEventListener('scroll', () => {
      events.push([ scroller.scrollLeft, scroller.scrollTop ]);
      assert.throws(() => document.removeChild(scroller), /active|callback/i);
      assert.throws(() => {
        document.innerRML = '';
      }, /active|callback/i);
    });
    scroller.scrollLeft = 12.4;
    scroller.scrollTop = 18.8;
    assert.deepEqual(events, [[ 12, 0 ], [ 12, 19 ]]);
    scroller.scrollTo({ x: 10000, y: 10000 });
    assert.equal(scroller.scrollLeft, 300 - scroller.clientWidth);
    assert.equal(scroller.scrollTop, 400 - scroller.clientHeight);
    scroller.scrollTo({ x: -10, y: -20 }, rmlui.ScrollBehavior.Instant);
    assert.equal(scroller.scrollLeft, 0);
    assert.equal(scroller.scrollTop, 0);
    scroller.setScrollableOverflowRectangle({ x: 600, y: 800 }, false);
    scroller.scrollTo({ x: 450, y: 650 });
    scroller.setScrollableOverflowRectangle({ x: 200, y: 200 }, true);
    assert.equal(scroller.scrollWidth, 200);
    assert.equal(scroller.scrollHeight, 200);
    assert.equal(scroller.scrollLeft, 200 - scroller.clientWidth);
    assert.equal(scroller.scrollTop, 200 - scroller.clientHeight);
  },

  'scroll-into-view-overloads': function({ document, rmlui }) {
    const scroller = document.getElementById('scroller');
    const item = document.getElementById('item');
    assert.equal(typeof item.scrollIntoView, 'function');
    item.scrollIntoView();
    assert.equal(scroller.scrollTop, 200);
    scroller.scrollTop = 0;
    item.scrollIntoView(false);
    assert.equal(scroller.scrollTop, 220 - scroller.clientHeight);
    scroller.scrollTop = 0;
    item.scrollIntoView({
      vertical: rmlui.ScrollAlignment.Center,
      horizontal: rmlui.ScrollAlignment.Nearest,
      parentage: rmlui.ScrollParentage.Closest,
    });
    assert.equal(scroller.scrollTop, 210 - scroller.clientHeight / 2);
    const offset = scroller.scrollTop;
    item.scrollIntoView({ vertical: rmlui.ScrollAlignment.Adaptive });
    assert.equal(scroller.scrollTop, offset);
    scroller.scrollTop = 0;
    item.scrollIntoView({});
    assert.equal(scroller.scrollTop, 200);
  },

  'all-scroll-alignments-on-both-axes': function({
    document, context, rmlui,
  }) {
    const scroller = document.getElementById('scroller');
    const item = document.getElementById('item');
    item.setProperty('left', '200px');
    context.update();

    assert.deepEqual([
      rmlui.ScrollAlignment.Start, rmlui.ScrollAlignment.Center,
      rmlui.ScrollAlignment.End, rmlui.ScrollAlignment.Nearest,
      rmlui.ScrollAlignment.Adaptive,
    ], [ 0, 1, 2, 3, 4 ]);
    assert.deepEqual([
      rmlui.ScrollParentage.All, rmlui.ScrollParentage.Closest,
    ], [ 0, 1 ]);

    const expected = size => [
      200, 210 - size / 2, 220 - size, 220 - size, 210 - size / 2,
    ];
    const horizontal = expected(scroller.clientWidth);
    const vertical = expected(scroller.clientHeight);
    for (let alignment = 0; alignment < 5; ++alignment) {
      scroller.scrollTo({ x: 0, y: 0 });
      item.scrollIntoView({
        vertical: alignment, horizontal: alignment,
        behavior: rmlui.ScrollBehavior.Instant,
        parentage: rmlui.ScrollParentage.All,
      });
      assert.equal(scroller.scrollLeft, horizontal[alignment]);
      assert.equal(scroller.scrollTop, vertical[alignment]);

      if (alignment >= rmlui.ScrollAlignment.Nearest) {
        const before = [ scroller.scrollLeft, scroller.scrollTop ];
        item.scrollIntoView({ vertical: alignment, horizontal: alignment });
        assert.deepEqual([ scroller.scrollLeft, scroller.scrollTop ], before);
      }
    }
  },

  'transform-projection-and-clip-area': function({ document, context, rmlui }) {
    const target = document.getElementById('target');
    assert.equal(typeof target.project, 'function');
    const point = { x: 25, y: 35 };
    assert.deepEqual(target.project(point), { success: true, point });
    target.setProperty('transform', 'translate(10px, 20px)');
    context.update();
    context.render();
    assert.deepEqual(target.project({ x: 35, y: 55 }),
      { success: true, point: { x: 25, y: 35 } });
    assert.deepEqual(point, { x: 25, y: 35 });
    assert.equal(target.isPointWithinElement({ x: 25, y: 35 }), true);
    // Project takes window coordinates, while hit testing takes coordinates
    // already projected onto the element plane.
    target.setProperty('transform', 'scale(0)');
    context.update();
    context.render();
    assert.equal(target.project(point).success, false);
    for (const area of [
      rmlui.BoxArea.Margin, rmlui.BoxArea.Border,
      rmlui.BoxArea.Padding, rmlui.BoxArea.Content, rmlui.BoxArea.Auto,
    ]) {
      target.clipArea = area;
      assert.equal(target.clipArea, area);
    }
    assert.throws(() => target.getAbsoluteOffset(rmlui.BoxArea.Auto),
      /area/i);
  },

  'invalid-values-and-getter-lifetime': function({ document, context }) {
    const target = document.getElementById('target');
    assert.equal(typeof target.scrollTo, 'function');
    for (const value of [ NaN, Infinity, 1e100, '1' ]) {
      assert.throws(() => {
        target.scrollTop = value;
      }, /finite/i);
      assert.throws(() => target.project({ x: value, y: 0 }), /finite/i);
    }
    assert.throws(() => target.scrollTo({ x: 0, y: 0 }, 5), /behavior/i);
    assert.throws(() => target.scrollIntoView({ vertical: 5 }), /alignment/i);
    assert.throws(() => target.scrollIntoView({ parentage: -1 }), /parentage/i);
    assert.throws(() => target.setScrollableOverflowRectangle(
      { x: -1, y: 100 }, true), /negative/i);
    const sentinel = new Error('layout accessor');
    assert.throws(() => target.project({
      get x() {
        throw sentinel;
      },
      y: 0,
    }), error => error === sentinel);
    assert.throws(() => target.scrollIntoView({
      get vertical() {
        document.close();
        context.update();
        return 0;
      },
    }), /no longer valid/i);
  },

  'detached-offset-lifetime': function({ document, context, rmlui }) {
    const target = document.getElementById('target');
    assert.equal(typeof target.getContainingBlock, 'function');
    const child = document.createElement('div');
    target.appendChild(child);
    context.update();
    document.removeChild(target);
    // Outgoing layout references must not keep pointing into the old document.
    assert.equal(target.offsetParent, null);
    document.close();
    context.update();
    assert.deepEqual(target.getContainingBlock(), { x: 0, y: 0 });
    assert.ok(Number.isFinite(target.getAbsoluteOffset().x));
    assert.ok(Number.isFinite(child.getAbsoluteOffset().x));
    assert.equal(target.getDisplay(), rmlui.StyleDisplay.Block);
  },

  'scroll-callback-exception': function({ document }) {
    const scroller = document.getElementById('scroller');
    assert.equal(typeof scroller.scrollTo, 'function');
    const sentinel = new Error('scroll sentinel');
    scroller.addEventListener('scroll', () => {
      throw sentinel;
    });
    assert.throws(() => scroller.scrollTo({ x: 10, y: 20 }),
      error => error === sentinel);
    // Native ScrollTo completes both axes before propagating the JS exception.
    assert.equal(scroller.scrollLeft, 10);
    assert.equal(scroller.scrollTop, 20);
  },

  'nested-scroll-parentage': function({ document, context, rmlui }) {
    document.innerRML = `
<div id="outer" style="width: 100px; height: 60px; overflow: auto;">
  <div style="height: 100px;"/>
  <div id="inner" style="width: 80px; height: 80px; overflow: auto;">
    <div style="height: 200px;"/>
    <div id="nested-item" style="height: 20px;"/>
  </div>
  <div style="height: 100px;"/>
</div>`;
    context.update();
    const outer = document.getElementById('outer');
    const inner = document.getElementById('inner');
    const item = document.getElementById('nested-item');
    item.scrollIntoView({ parentage: rmlui.ScrollParentage.Closest });
    assert.equal(outer.scrollTop, 0);
    assert.equal(inner.scrollTop, inner.scrollHeight - inner.clientHeight);
    item.scrollIntoView({ parentage: rmlui.ScrollParentage.All });
    assert.ok(outer.scrollTop > 0);
    assert.ok(item.absoluteTop >= outer.absoluteTop);
    assert.ok(item.absoluteTop <= outer.absoluteTop + outer.clientHeight);
  },

  'smooth-and-auto-scroll': async function({ document, context, rmlui }) {
    const scroller = document.getElementById('scroller');
    const events = [];
    scroller.addEventListener('scroll', () => events.push(scroller.scrollTop));
    scroller.scrollTo({ x: 0, y: 150 }, rmlui.ScrollBehavior.Smooth);
    assert.equal(scroller.scrollTop, 0);
    const deadline = performance.now() + 3000;
    while (scroller.scrollTop !== 150 && performance.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 10));
      context.update();
    }
    assert.equal(scroller.scrollTop, 150);
    assert.ok(events.some(offset => offset > 0 && offset < 150));
    context.setDefaultScrollBehavior(rmlui.ScrollBehavior.Instant);
    scroller.scrollTo({ x: 0, y: 50 }, rmlui.ScrollBehavior.Auto);
    assert.equal(scroller.scrollTop, 50);
  },

  'detached-descendants-reattach-and-replace': function({
    document, context, rmlui,
  }) {
    const target = document.getElementById('target');
    const child = document.createElement('div');
    child.setProperty('position', 'absolute');
    child.setProperty('top', '5px');
    child.setProperty('height', '10px');
    target.appendChild(child);
    context.update();
    const detached = document.replaceChild(
      document.createElement('div'), target);
    assert.strictEqual(detached, target);
    assert.strictEqual(child.offsetParent, target);
    assert.equal(target.offsetParent, null);
    document.close();
    context.update();
    assert.equal(child.getAbsoluteOffset(rmlui.BoxArea.Border).y, 8);
    const next = context.loadDocumentFromMemory(
      '<rml><head><style>body { height: 200px; }</style></head><body/></rml>');
    next.appendChild(target);
    next.show();
    context.update();
    assert.strictEqual(target.offsetParent, next);
    assert.ok(Number.isFinite(child.absoluteTop));
  },

  'snapshot-gc-and-own-properties': async function({
    document, context, rmlui,
  }) {
    let target = document.getElementById('target');
    const weak = new WeakRef(target);
    const snapshot = target.getAbsoluteOffset();
    target = null;
    for (let i = 0; i < 8; i++) {
      await new Promise(resolve => setImmediate(resolve));
      global.gc();
    }
    assert.equal(weak.deref(), undefined);
    let setterCalls = 0;
    const countSetter = () => {
      setterCalls++;
    };
    for (const name of [ 'x', 'point', 'success' ]) {
      // eslint-disable-next-line no-extend-native
      Object.defineProperty(Object.prototype, name, {
        configurable: true,
        set: countSetter,
      });
    }
    let result;
    try {
      result = document.getElementById('target').project({ x: 10, y: 20 });
    } finally {
      for (const name of [ 'x', 'point', 'success' ]) {
        delete Object.prototype[name];
      }
    }
    assert.equal(setterCalls, 0);
    assert.deepEqual(result, { success: true, point: { x: 10, y: 20 } });
    document.close();
    context.update();
    context.remove();
    rmlui.createContext('layout', 400, 400);
    assert.deepEqual(snapshot, { x: 30, y: 40 });
  },

  'vector-getter-invalidation': function({ document, context }) {
    const target = document.getElementById('target');
    assert.throws(() => target.project({
      get x() {
        document.close();
        context.update();
        return 10;
      },
      y: 10,
    }), /no longer valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Layout acceptance');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('layout', 320, 240);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 320px; height: 240px; margin: 0; }
div { display: block; }
#target { position: absolute; left: 20px; top: 30px;
  width: 80px; height: 50px; padding: 7px; border: 3px #fff;
  line-height: 18px; z-index: 4; }
#scroller { position: absolute; left: 140px; top: 10px;
  width: 100px; height: 100px; overflow: auto; }
#content { position: relative; width: 300px; height: 400px; }
#item { position: absolute; top: 200px; width: 20px; height: 20px; }
scrollbarvertical { width: 10px; }
scrollbarhorizontal { height: 10px; }
</style></head><body>
<div id="target"/><div id="scroller">
<div id="content"><div id="item"/></div></div>
</body></rml>`);
    document.show();
    context.update();
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
    ], {
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
  assert.equal(failures, 0, `${failures} layout regressions failed`);
}
