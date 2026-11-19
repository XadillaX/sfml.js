'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const factories = {
  tween: rmlui => new rmlui.Tween(t => t),
  filter: rmlui => new rmlui.Filter({
    compileFilter: () => new rmlui.CompiledFilter(),
  }),
  decorator: (rmlui, context) =>
    new rmlui.Decorator(context.getRenderManager(), {
      generateElementData: () => ({}),
      renderElement() {},
      releaseElementData() {},
    }),
  fontEffect: rmlui => new rmlui.FontEffect({}),
  elementInstancer: rmlui => new rmlui.ElementInstancer(() => null),
  contextInstancer: rmlui => new rmlui.ContextInstancer(() => null),
  eventInstancer: rmlui => new rmlui.EventInstancer(() => null),
  'tween-live': (rmlui, context, native) => {
    const elements = context.getDocument(0).querySelectorAll('i');
    const tween = new rmlui.Tween(t => t * t);
    const end = new rmlui.Property(40, rmlui.Unit.PX);
    const start = new rmlui.Property(1, rmlui.Unit.PX);
    native.beginDataDiagnostics(false);
    for (const element of elements) {
      assert.ok(element.animate('width', end, 60, tween,
        1, false, 0, start));
    }
    const registration = native.endDataDiagnostics();
    assert.equal(registration.callbackLeaseVisits.tween, elements.length);
    context.update();
    return tween;
  },
  'filter-live': (rmlui, context) => {
    let calls = 0;
    const filter = new rmlui.Filter({
      compileFilter(target) {
        ++calls;
        return target.getRenderManager().compileFilter('blur', { sigma: 1 });
      },
    });
    rmlui.FilterInstancer.register('ownership-filter',
      new rmlui.FilterInstancer(() => filter));
    const elements = context.getDocument(0).querySelectorAll('i').slice(0, 16);
    context.getDocument(0).show();
    for (const element of elements) {
      element.setProperty('display', 'block');
      element.setProperty('width', '2px');
      element.setProperty('height', '2px');
      element.setProperty('background-color', '#ffffff');
      element.setProperty('filter', 'ownership-filter()');
    }
    context.update();
    context.render();
    assert.ok(calls > 0);
    return filter;
  },
  'eventInstancer-live': (rmlui, context, native) => {
    const target = context.getDocument(0).getChild(0);
    const id = rmlui.registerEventType('ownership-event', true, true);
    const allocator = new rmlui.EventInstancer();
    const instancer = new rmlui.EventInstancer((...args) =>
      allocator.instanceEvent(...args));
    native.beginDataDiagnostics(false);
    const events = Array.from({ length: 1000 }, () =>
      instancer.instanceEvent(target, id, 'ownership-event', {}, true));
    const registration = native.endDataDiagnostics();
    assert.ok(registration.callbackLeaseVisits.eventInstancer <= 2000);
    assert.equal(events.length, 1000);
    assert.equal(events[999].target.handle, target.handle);
    return { instancer, events };
  },
  'elementInstancer-live': (rmlui, context, native) => {
    const allocator = rmlui.Factory.getElementInstancer('*');
    const instancer = new rmlui.ElementInstancer((parent, tag, attributes) =>
      allocator.instanceElement(parent, tag, attributes));
    native.beginDataDiagnostics(false);
    const elements = Array.from({ length: 1000 }, () =>
      instancer.instanceElement(null, 'leased'));
    const registration = native.endDataDiagnostics();
    assert.equal(registration.callbackLeaseVisits.elementInstancer, 1000);
    assert.equal(elements[999].tagName, 'leased');
    return { instancer, elements };
  },
  'contextInstancer-live': (rmlui, context, native) => {
    const allocator = new rmlui.ContextInstancer();
    const instancer = new rmlui.ContextInstancer((...args) =>
      allocator.instanceContext(...args));
    const manager = context.getRenderManager();
    native.beginDataDiagnostics(false);
    const contexts = Array.from({ length: 100 }, (_, index) =>
      instancer.instanceContext(`leased-${index}`, manager, null));
    const registration = native.endDataDiagnostics();
    assert.equal(registration.callbackLeaseVisits.contextInstancer, 100);
    assert.equal(contexts[99].name, 'leased-99');
    return { instancer, contexts };
  },
  'decorator-live': (rmlui, context, native) => {
    const element = context.getDocument(0).getChild(0);
    const decorator = new rmlui.Decorator(context.getRenderManager(), {
      generateElementData: () => ({}),
      renderElement() {},
      releaseElementData() {},
    });
    native.beginDataDiagnostics(false);
    const data = Array.from({ length: 1000 }, () =>
      decorator.generateElementData(element));
    const registration = native.endDataDiagnostics();
    assert.equal(registration.callbackLeaseVisits.decorator, 1000);
    assert.equal(data.length, 1000);
    return { decorator, data };
  },
  'fontEffect-live': (rmlui, context) => {
    let metrics = 0;
    let textures = 0;
    const effect = new rmlui.FontEffect({
      hasUniqueTexture: () => true,
      getGlyphMetrics(_glyph, origin, dimensions) {
        ++metrics;
        return { supported: true, origin, dimensions };
      },
      generateGlyphTexture(bytes) {
        ++textures;
        bytes.fill(255);
      },
    });
    rmlui.FontEffectInstancer.register('ownership-font',
      new rmlui.FontEffectInstancer(() => effect));
    assert.ok(rmlui.loadFontFace(path.join(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    const document = context.getDocument(0);
    document.innerRML = '<div>Live atlas</div>' + '<i/>'.repeat(1000);
    document.setProperty('font-family', 'LatoLatin');
    document.setProperty('font-size', '24px');
    document.setProperty('font-effect', 'ownership-font()');
    document.show();
    context.update();
    context.render();
    assert.ok(metrics > 0);
    assert.ok(textures > 0);
    return effect;
  },
};

function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const native = require('../../build/Release/rmlui.node');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(200, 160)), 'Callback ownership');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext(name, 200, 160);
    context.loadDocumentFromMemory(
      '<rml><head/><body>' + '<i/>'.repeat(1000) + '</body></rml>');
    const family = name.split('-')[0];
    const retained = factories[name](rmlui, context, native);
    context.getNumDocuments();
    native.beginDataDiagnostics(false);
    for (let i = 0; i < 100; ++i) {
      assert.equal(context.getNumDocuments(), 1);
    }
    const counts = native.endDataDiagnostics();
    assert.equal(counts.callbackOwnershipPasses[family], 0,
      `${name} stable refreshes: ${counts.callbackOwnershipPasses[family]}`);
    assert.equal(counts.callbackLeaseVisits[family], 0);
    assert.equal(counts.callbackSnapshotVisits, 0);
    const target = context.getDocument(0).getChild(0);
    native.beginDataDiagnostics(false);
    for (let i = 0; i < 100; ++i) {
      target.setAttribute('number', i);
      target.setProperty('width', `${i}px`);
    }
    const numeric = native.endDataDiagnostics();
    assert.equal(numeric.callbackOwnershipPasses[family], 0,
      `${name} numeric mutations refreshed callback ownership`);
    assert.equal(numeric.callbackLeaseVisits[family], 0);
    assert.equal(numeric.callbackSnapshotVisits, 0);
    if ([ 'tween-live', 'filter-live', 'decorator-live',
      'elementInstancer-live' ].includes(name)) {
      native.beginDataDiagnostics(false);
      const unrelated = Array.from({ length: 100 }, () =>
        new rmlui.ElementFormControlInput('unrelated'));
      const construction = native.endDataDiagnostics();
      assert.equal(construction.callbackLeaseVisits[family], 0,
        `${name} scanned existing leases during unrelated construction`);
      assert.equal(construction.callbackParentNotifications, 0);
      assert.ok(construction.callbackParentNodeVisits <= 400,
        `${name} visited unrelated old subtrees`);
      for (const input of unrelated) {
        input.release();
      }
    }
    if (name === 'tween-live') {
      const document = context.getDocument(0);
      const moved = document.getChild(0);
      native.beginDataDiagnostics(false);
      document.removeChild(moved);
      const detached = native.endDataDiagnostics();
      assert.equal(detached.callbackLeaseVisits.tween, 1);
      native.beginDataDiagnostics(false);
      document.appendChild(moved);
      const attached = native.endDataDiagnostics();
      assert.equal(attached.callbackLeaseVisits.tween, 1);
      context.update();
    }
    assert.ok(retained);
    console.log(`PASS ${name}`);
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

if (process.argv[2]) {
  run(process.argv[2]);
} else {
  for (const name of Object.keys(factories)) {
    const result = spawnSync(process.execPath, [ __filename, name ], {
      stdio: 'inherit',
    });
    assert.equal(result.status, 0, name);
  }
}
