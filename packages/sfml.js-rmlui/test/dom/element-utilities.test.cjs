'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const cases = {
  'breadth-first-queries-and-stop-tag': function({ document, utilities }) {
    const root = document.getElementById('root');
    const direct = root.getElementsByTagName('div').find(element =>
      element.id === 'duplicate' && element.getParentNode() === root);
    assert.strictEqual(utilities.getElementById(root, 'root'), root);
    assert.strictEqual(utilities.getElementById(root, 'duplicate'), direct);
    assert.equal(utilities.getElementById(root, 'missing'), null);
    assert.deepEqual(utilities.getElementsByTagName(root, 'div')
      .map(element => element.id),
    [ 'duplicate', 'stop', 'duplicate', 'deep' ]);
    assert.deepEqual(utilities.getElementsByTagName(root, 'div', 'section')
      .map(element => element.id), [ 'duplicate', 'stop' ]);
    assert.deepEqual(utilities.getElementsByTagName(root, 'section', 'section')
      .map(element => element.id), [ 'branch' ]);
    const snapshot = utilities.getElementsByClassName(root, 'marked');
    assert.deepEqual(snapshot.map(element => element.id),
      [ 'duplicate', 'duplicate', 'deep' ]);
    snapshot.pop();
    assert.equal(utilities.getElementsByClassName(root, 'marked').length, 3);
    assert.throws(() => utilities.getElementById(root, {}), /string/i);
    assert.throws(() => utilities.getElementsByTagName(root, 'div', 1),
      /string/i);
    assert.throws(() => utilities.getElementsByClassName({}, 'marked'),
      /element|handle/i);
  },

  'density-and-font-kerning': function({ document, context, utilities }) {
    const target = document.getElementById('target');
    context.setDensityIndependentPixelRatio(2);
    target.setProperty('font-size', '72px');
    context.update();
    assert.equal(utilities.getDensityIndependentPixelRatio(target), 2);
    const detached = document.createElement('div');
    assert.equal(utilities.getDensityIndependentPixelRatio(detached), 1);
    assert.equal(utilities.getStringWidth(detached, 'text'), 0);
    const a = utilities.getStringWidth(target, 'A');
    const v = utilities.getStringWidth(target, 'V');
    const av = utilities.getStringWidth(target, 'AV');
    assert.ok(a > 0 && v > 0);
    assert.equal(utilities.getStringWidth(target, 'V', 65), av - a);
    const quote = utilities.getStringWidth(target, '"');
    const quotedA = utilities.getStringWidth(target, '"A');
    assert.equal(utilities.getStringWidth(target, 'A', 34), quotedA - quote);
    assert.ok(quotedA < quote + a);
    target.setProperty('font-kerning', 'none');
    context.update();
    assert.equal(utilities.getStringWidth(target, 'AV'), a + v);
    assert.equal(utilities.getStringWidth(target, 'V', 65), v);
    assert.equal(utilities.getStringWidth(target, '"A'), quote + a);
    assert.equal(utilities.getStringWidth(target, 'A', 34), a);
    assert.equal(utilities.getStringWidth(target, ''), 0);
    assert.equal(utilities.getStringWidth(target, 'A\0V'), a + v);
    assert.ok(utilities.getStringWidth(target, 'é😀') > 0);
    for (const value of [ -1, 0xd800, 0x110000, 1.5, 'A' ]) {
      assert.throws(() => utilities.getStringWidth(target, 'V', value),
        /character|codepoint/i);
    }
    assert.throws(() => utilities.getStringWidth(target, {}), /string/i);
  },

  'bounding-areas-and-ink-overflow': function({ document, utilities, rmlui }) {
    const target = document.getElementById('target');
    assert.deepEqual(utilities.getBoundingBox(target, rmlui.BoxArea.Content),
      { p0: { x: 30, y: 40 }, p1: { x: 110, y: 90 } });
    assert.deepEqual(utilities.getBoundingBox(target, rmlui.BoxArea.Border),
      { p0: { x: 20, y: 30 }, p1: { x: 120, y: 100 } });
    assert.deepEqual(utilities.getBoundingBox(target, rmlui.BoxArea.Auto),
      { p0: { x: 20, y: 30 }, p1: { x: 125, y: 106 } });
    assert.throws(() => utilities.getBoundingBox(target), /area/i);
    assert.throws(() => utilities.getBoundingBox(target, 5), /area/i);
    const detached = document.createElement('div');
    assert.deepEqual(utilities.getBoundingBox(detached, rmlui.BoxArea.Content),
      { p0: { x: 0, y: 0 }, p1: { x: 0, y: 0 } });
  },

  'build-box-and-format': function({ document, context, utilities, rmlui }) {
    const target = document.getElementById('target');
    const box = utilities.buildBox({ x: 320, y: 240 }, target);
    assert.ok(box instanceof rmlui.Box);
    assert.deepEqual(box.getSize(), { x: 80, y: 50 });
    assert.deepEqual(box.getSize(rmlui.BoxArea.Border), { x: 100, y: 70 });
    box.content[0] = 999;
    assert.equal(target.getBox().content[0], 80);
    const detached = document.createElement('div');
    detached.setProperty('width', '50%');
    detached.setProperty('height', '20px');
    const child = document.createElement('div');
    child.setProperty('width', '50%');
    child.setProperty('height', '5px');
    detached.appendChild(child);
    document.appendChild(detached);
    context.update();
    document.removeChild(detached);
    utilities.formatElement(detached, { x: 200, y: 100 });
    assert.equal(detached.getBox().content[0], 100);
    assert.equal(child.getBox().content[0], 50);
    const inline = document.createElement('span');
    inline.setProperty('width', '80px');
    document.appendChild(inline);
    context.update();
    document.removeChild(inline);
    const inlineBox = utilities.buildBox({ x: 200, y: 100 }, inline, true);
    assert.equal(inlineBox.content[0], -1);
    assert.throws(() => utilities.buildBox({ x: 1, y: 1 }, target, 1),
      /boolean/i);
    for (const size of [{ x: NaN, y: 1 }, { x: -1, y: 1 },
      { x: 1, y: Infinity }]) {
      assert.throws(() => utilities.formatElement(target, size),
        /finite|negative/i);
    }
  },

  'position-anchors': function({ document, context, utilities, rmlui }) {
    assert.deepEqual(Object.values(rmlui.PositionAnchor)
      .filter(value => typeof value === 'number'), [ 1, 2, 4, 8, 5, 9, 6, 10 ]);
    const target = document.createElement('div');
    target.setProperty('width', '80px');
    target.setProperty('height', '50px');
    target.setProperty('padding', '7px');
    target.setProperty('border', '3px #fff');
    document.appendChild(target);
    context.update();
    const expected = new Map([
      [ 1, { x: 10, y: 20 }], [ 2, { x: 10, y: 150 }],
      [ 4, { x: 10, y: 20 }], [ 8, { x: 210, y: 20 }],
      [ 5, { x: 10, y: 20 }], [ 9, { x: 210, y: 20 }],
      [ 6, { x: 10, y: 150 }], [ 10, { x: 210, y: 150 }],
    ]);
    for (const [ anchor, offset ] of expected) {
      assert.equal(utilities.positionElement(target, { x: 10, y: 20 }, anchor),
        true);
      assert.deepEqual(target.getRelativeOffset(rmlui.BoxArea.Border), offset);
    }
    assert.equal(utilities.positionElement(document.createElement('div'),
      { x: 0, y: 0 }, rmlui.PositionAnchor.TopLeft), false);
    assert.throws(() => utilities.positionElement(target, { x: 1, y: 1 }, 3),
      /anchor/i);
  },

  'scissor-and-force-self': function({ document, utilities }) {
    const target = document.getElementById('target');
    assert.deepEqual(utilities.getClippingRegion(target),
      { region: null, clipMask: [] });
    assert.deepEqual(utilities.getClippingRegion(target, false, true), {
      region: { p0: { x: 20, y: 30 }, p1: { x: 120, y: 100 } },
      clipMask: [],
    });
    assert.deepEqual(utilities.getClippingRegion(
      document.getElementById('content')).region,
    { p0: { x: 140, y: 10 }, p1: { x: 240, y: 110 } });
    const detached = document.createElement('div');
    assert.equal(utilities.setClippingRegion(detached), false);
    assert.equal(utilities.applyTransform(detached), false);
    assert.equal(utilities.setClippingRegion(target, true), true);
    assert.equal(utilities.applyTransform(target), true);
    assert.throws(() => utilities.getClippingRegion(detached, true),
      /context|attached/i);
    assert.throws(() => utilities.getClippingRegion(target, 1), /boolean/i);
    assert.throws(() => utilities.setClippingRegion(target, 1), /boolean/i);
  },

  'rounded-masks-own-geometry': async function({
    document, context, utilities, rmlui,
  }) {
    const result = utilities.getClippingRegion(
      document.getElementById('rounded-content'), true);
    assert.equal(result.clipMask.length, 1);
    const mask = result.clipMask[0];
    assert.ok(mask.geometry instanceof rmlui.Geometry);
    assert.equal(mask.operation, rmlui.ClipMaskOperation.Set);
    assert.deepEqual(mask.absoluteOffset, { x: 10, y: 130 });
    assert.equal(mask.transform, null);
    const mesh = mask.geometry.getMesh();
    assert.ok(mesh.indices.length > 0);
    const vertices = Array.from(mesh.vertices);
    document.close();
    context.update();
    for (let attempt = 0; attempt < 4; attempt++) {
      global.gc();
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(mask.geometry.isValid, true);
    assert.deepEqual(Array.from(mask.geometry.getMesh().vertices), vertices);
    mask.geometry.render({ x: 0, y: 0 });
    mask.geometry.release();
    assert.equal(mask.geometry.isValid, false);
    rmlui.shutdown();
    assert.throws(() => mask.geometry.getMesh(), /initialised|valid/i);
    assert.deepEqual(Array.from(mesh.vertices), vertices);
  },

  'transformed-masks-and-intersection': function({
    document, context, utilities, rmlui,
  }) {
    const outer = document.getElementById('rounded');
    const inner = document.getElementById('rounded-inner');
    outer.setProperty('transform', 'translateX(4px)');
    inner.setProperty('border-radius', '4px');
    inner.setProperty('overflow', 'hidden');
    context.update();
    context.render();
    const result = utilities.getClippingRegion(
      document.getElementById('rounded-content'), true);
    assert.equal(result.clipMask.length, 2);
    assert.equal(result.clipMask[0].operation, rmlui.ClipMaskOperation.Set);
    assert.equal(result.clipMask[1].operation,
      rmlui.ClipMaskOperation.Intersect);
    assert.equal(result.region, null);
    const bounds = utilities.getBoundingBox(outer, rmlui.BoxArea.Border);
    assert.ok(Math.abs(bounds.p0.x - 14) < 0.0001);
    assert.ok(Math.abs(bounds.p0.y - 130) < 0.0001);
    assert.ok(Math.abs(bounds.p1.x - 94) < 0.0001);
    assert.ok(Math.abs(bounds.p1.y - 200) < 0.0001);
    for (const mask of result.clipMask) {
      assert.ok(mask.transform instanceof Float32Array);
      assert.equal(mask.transform.length, 16);
      assert.equal(mask.transform[12], 4);
    }
    const snapshot = result.clipMask[1].transform;
    snapshot[12] = 999;
    assert.equal(utilities.getClippingRegion(
      document.getElementById('rounded-content'), true).clipMask[1]
      .transform[12], 4);
    outer.setProperty('transform', 'translateZ(20000px)');
    context.update();
    context.render();
    assert.equal(utilities.getBoundingBox(outer, rmlui.BoxArea.Border), null);
  },

  'no-model-data-views': function({ document, utilities }) {
    assert.equal(utilities.applyDataViewsControllers(
      document.getElementById('target')), false);
  },

  'explicit-data-views-controllers-update-events-and-invalidation': function({
    context, utilities,
  }) {
    const model = context.createDataModel('utilities');
    model.bind('count', 2);
    let changed = 0;
    model.bindEventCallback('changed', (handle, event) => {
      ++changed;
      assert.equal(event.type, 'change');
      assert.equal(handle.isValid, true);
    });
    const document = context.loadDocumentFromMemory(
      '<rml><head/><body data-model="utilities">' +
      '<input id="value" type="text"/><div id="empty"/></body></rml>');
    const input = document.getElementById('value');
    const empty = document.getElementById('empty');
    assert.equal(utilities.applyDataViewsControllers(empty), false);
    empty.setAttribute('data-unregistered', 'count');
    assert.equal(utilities.applyDataViewsControllers(empty), false);
    input.setAttribute('data-value', 'count');
    input.setAttribute('data-event-change', 'changed()');
    assert.equal(utilities.applyDataViewsControllers(input), true);
    context.update();
    assert.equal(input.getValue(), '2');
    model.getVariable('count').set(7);
    model.dirtyVariable('count');
    context.update();
    assert.equal(input.getValue(), '7');
    input.dispatchEvent('change', { value: '9' });
    assert.equal(changed, 1);
    assert.equal(model.getVariable('count').get(), 9);
    context.update();
    assert.equal(input.getValue(), '9');
    assert.equal(context.removeDataModel('utilities'), true);
    assert.equal(utilities.applyDataViewsControllers(input), false);
    input.dispatchEvent('change', { value: '10' });
    assert.equal(changed, 1);
    assert.equal(model.isValid, false);
    document.close();
    context.update();
    assert.throws(() => utilities.applyDataViewsControllers(input), /valid/i);
  },

  'vector-getters-destroy-format-and-position-targets': function({
    context, utilities, rmlui,
  }) {
    for (const operation of [ 'format', 'position' ]) {
      const document = context.loadDocumentFromMemory(
        '<rml><head/><body><div id="target"/></body></rml>');
      document.show();
      context.update();
      const target = document.getElementById('target');
      const vector = {
        x: 10,
        get y() {
          document.close();
          context.update();
          return 10;
        },
      };
      const invoke = operation === 'format'
        ? () => utilities.formatElement(target, vector)
        : () => utilities.positionElement(
          target, vector, rmlui.PositionAnchor.TopLeft);
      assert.throws(invoke, /no longer valid/i);
    }
  },

  'construction-and-render-state-reject-callback-reentry': function({
    document, utilities, rmlui,
  }) {
    const target = document.getElementById('target');
    const forbidden = [
      () => utilities.formatElement(target, { x: 100, y: 100 }),
      () => utilities.positionElement(target, { x: 0, y: 0 },
        rmlui.PositionAnchor.TopLeft),
      () => utilities.applyDataViewsControllers(target),
      () => utilities.setClippingRegion(target),
      () => utilities.applyTransform(target),
    ];
    target.addEventListener('inspect', () => {
      assert.equal(utilities.getElementById(target, 'target'), target);
      assert.ok(utilities.buildBox({ x: 320, y: 240 }, target) instanceof
        rmlui.Box);
      for (const invoke of forbidden) {
        assert.throws(invoke, /callback|reentr/i);
      }
    });
    target.dispatchEvent('inspect');
  },

  'getter-invalidation-and-output-setters': function({
    document, context, utilities, rmlui,
  }) {
    const target = document.getElementById('target');
    let calls = 0;
    const names = [ 'region', 'clipMask', 'p0', 'p1', 'x', 'y',
      'geometry', 'operation', 'transform', 'absoluteOffset' ];
    const countSetter = () => {
      calls++;
    };
    for (const name of names) {
      // eslint-disable-next-line no-extend-native
      Object.defineProperty(Object.prototype, name, {
        configurable: true, set: countSetter,
      });
    }
    try {
      utilities.getClippingRegion(document.getElementById('rounded-content'),
        true);
      utilities.getBoundingBox(target, rmlui.BoxArea.Border);
    } finally {
      for (const name of names) {
        delete Object.prototype[name];
      }
    }
    assert.equal(calls, 0);
    assert.throws(() => utilities.buildBox({
      get x() {
        document.close();
        context.update();
        return 100;
      },
      y: 100,
    }, target), /no longer valid/i);
    for (const call of [
      () => utilities.getElementById(target, 'x'),
      () => utilities.getElementsByTagName(target, 'div'),
      () => utilities.getElementsByClassName(target, 'a'),
      () => utilities.getDensityIndependentPixelRatio(target),
      () => utilities.getStringWidth(target, 'x'),
      () => utilities.getBoundingBox(target, rmlui.BoxArea.Auto),
      () => utilities.formatElement(target, { x: 10, y: 10 }),
      () => utilities.buildBox({ x: 10, y: 10 }, target),
      () => utilities.positionElement(target, { x: 0, y: 0 },
        rmlui.PositionAnchor.Top),
      () => utilities.getClippingRegion(target),
      () => utilities.setClippingRegion(target),
      () => utilities.applyTransform(target),
      () => utilities.applyDataViewsControllers(target),
    ]) {
      assert.throws(call, /no longer valid/i);
    }
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'Element utilities',
    { settings: { stencilBits: 8 } });
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf'));
    const context = rmlui.createContext('utilities', 320, 240);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 320px; height: 240px; margin: 0;
  font-family: LatoLatin; font-size: 20px; }
div { display: block; }
#target { position: absolute; left: 20px; top: 30px;
  width: 80px; height: 50px; padding: 7px; border: 3px #fff;
  box-shadow: 5px 6px 0px #000; }
#scroller { position: absolute; left: 140px; top: 10px;
  width: 100px; height: 100px; overflow: hidden; }
#content { position: relative; width: 300px; height: 400px; }
#rounded { position: absolute; left: 10px; top: 130px;
  width: 80px; height: 70px; overflow: hidden; border-radius: 8px; }
#rounded-inner { width: 80px; height: 70px; }
#rounded-content { width: 120px; height: 100px; }
#root { display: none; }
</style></head><body>
<div id="target"/><div id="scroller"><div id="content"/></div>
<div id="rounded"><div id="rounded-inner"><div id="rounded-content"/>
</div></div>
<div id="root" class="marked"><section id="branch">
<div id="duplicate" class="marked"/><div id="deep" class="marked"/>
</section><div id="duplicate" class="marked"/>
<div id="stop"/></div>
</body></rml>`);
    const utilities = rmlui.ElementUtilities;
    assert.ok(utilities, 'ElementUtilities must be exported');
    document.show();
    context.update();
    context.render();
    await cases[name]({
      document, context, utilities, rmlui,
    });
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
  assert.equal(failures, 0, `${failures} element utility regressions failed`);
}
