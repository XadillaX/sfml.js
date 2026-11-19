'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

async function collect() {
  for (let i = 0; i < 8; ++i) {
    await new Promise(resolve => setImmediate(resolve));
    global.gc();
  }
}

const cases = {
  'constructor-owns-a-distinct-native-component': ({ rmlui, host }) => {
    const first = new rmlui.ElementScroll(host);
    const second = new rmlui.ElementScroll(host);
    const borrowed = host.getElementScroll();
    assert.equal(first.getScrollbar(0), null);
    assert.equal(first.getScrollbarSize(1), 0);
    first.enableScrollbar(0, 100);
    first.enableScrollbar(1, 100);
    first.formatScrollbars();
    first.updateProperties();
    const vertical = first.getScrollbar(0);
    const horizontal = first.getScrollbar(1);
    assert.equal(vertical.tagName, 'scrollbarvertical');
    assert.equal(horizontal.tagName, 'scrollbarhorizontal');
    assert.equal(first.getScrollbarSize(0), 12);
    assert.equal(first.getScrollbarSize(1), 9);
    assert.equal(second.getScrollbar(0), null);
    assert.equal(borrowed.getScrollbar(0), null);
    second.enableScrollbar(0, 100);
    assert.notEqual(second.getScrollbar(0), vertical);
    first.disableScrollbar(0);
    first.updateProperties();
    assert.equal(vertical.isVisible(), false);
    first.enableScrollbar(0, 100);
    first.updateProperties();
    assert.equal(vertical.isVisible(), true);
    host.scrollTop = 40;
    first.updateScrollbar(0);
    first.updateScrollbar(1);
    first.update();
    assert.equal(host.scrollTop, 40);
    first.release();
    assert.equal(second.getScrollbarSize(0), 12);
    assert.equal(borrowed.getScrollbarSize(0), 0);
    assert.throws(() => first.update(), /valid|released/i);
    second.release();
  },

  'release-detaches-widget-listeners-without-removing-native-children':
    ({ rmlui, host, context }) => {
      host.setProperty('overflow-y', 'auto');
      context.update();
      const scroll = new rmlui.ElementScroll(host);
      scroll.enableScrollbar(0, 100);
      scroll.formatScrollbars();
      scroll.updateProperties();
      const scrollbar = scroll.getScrollbar(0);
      const arrow = scrollbar.getChild(3);
      assert.equal(arrow.tagName, 'sliderarrowinc');
      arrow.dispatchEvent('mousedown', {});
      assert.equal(host.scrollTop, 30);
      scroll.release();
      const children = host.getNumChildren(true);
      arrow.dispatchEvent('mousedown', {});
      assert.equal(host.scrollTop, 30);
      assert.equal(host.getNumChildren(true), children);
      assert.equal(scrollbar.getParentNode(), host);
      assert.throws(() => host.getElementScroll().release(), /owned|borrowed/i);
    },

  'host-destruction-detaches-before-native-children-die':
    ({ rmlui, host, document, context }) => {
      const scroll = new rmlui.ElementScroll(host);
      scroll.enableScrollbar(0, 100);
      scroll.enableScrollbar(1, 100);
      scroll.formatScrollbars();
      const arrow = scroll.getScrollbar(0).getChild(3);
      document.close();
      context.update();
      assert.throws(() => arrow.dispatchEvent('mousedown', {}), /valid/i);
      assert.throws(() => scroll.update(), /valid/i);
      assert.throws(() => scroll.release(), /valid/i);
    },

  'detached-host-survives-wrapper-gc':
    async ({ rmlui, document, context }) => {
      let host = document.createElement('div');
      host.setAttribute('proof', 'retained');
      const weak = new WeakRef(host);
      const scroll = new rmlui.ElementScroll(host);
      scroll.enableScrollbar(0, 100);
      host = null;
      await collect();
      assert.ok(weak.deref());
      assert.equal(scroll.getScrollbar(0).getParentNode()
        .getAttribute('proof'), 'retained');
      document.close();
      context.update();
      scroll.updateProperties();
      assert.equal(scroll.getScrollbar(0).getParentNode()
        .getAttribute('proof'), 'retained');
      scroll.release();
      await collect();
      assert.equal(weak.deref(), undefined);
    },

  'collected-component-removes-listeners-at-a-native-boundary':
    async ({ rmlui, host, context }) => {
      host.setProperty('overflow-y', 'auto');
      context.update();
      let scroll = new rmlui.ElementScroll(host);
      scroll.enableScrollbar(0, 100);
      scroll.formatScrollbars();
      const arrow = scroll.getScrollbar(0).getChild(3);
      const weak = new WeakRef(scroll);
      scroll = null;
      await collect();
      assert.equal(weak.deref(), undefined);
      context.update();
      arrow.dispatchEvent('mousedown', {});
      assert.equal(host.scrollTop, 0);
    },

  'release-cannot-destroy-a-widget-in-its-own-callback':
    ({ rmlui, host }) => {
      const scroll = new rmlui.ElementScroll(host);
      scroll.enableScrollbar(0, 100);
      scroll.formatScrollbars();
      const arrow = scroll.getScrollbar(0).getChild(3);
      let callbacks = 0;
      arrow.addEventListener('mousedown', () => {
        ++callbacks;
        assert.throws(() => scroll.release(), /callback|active/i);
      });
      arrow.dispatchEvent('mousedown', {});
      assert.equal(callbacks, 1);
      scroll.update();
      scroll.release();
    },

  'constructor-validates-host-and-runtime-generation':
    ({ rmlui, host, document, context, window }) => {
      assert.throws(() => new rmlui.ElementScroll(), /element|handle/i);
      assert.throws(() => new rmlui.ElementScroll({}), /element|handle/i);
      const scroll = new rmlui.ElementScroll(host);
      document.close();
      context.update();
      assert.throws(() => new rmlui.ElementScroll(host), /valid/i);
      rmlui.shutdown();
      assert.throws(() => scroll.update(), /initialised/i);
      assert.ok(rmlui.initialise(window, { highDpi: false }));
      assert.throws(() => scroll.update(), /valid/i);
      assert.throws(() => new rmlui.ElementScroll(host), /valid/i);
    },

  'retained-invalid-component-does-not-root-a-host-after-shutdown':
    async ({ rmlui, document }) => {
      let host = document.createElement('div');
      const scroll = new rmlui.ElementScroll(host);
      scroll.enableScrollbar(0, 100);
      const weak = new WeakRef(host);
      host = null;
      rmlui.shutdown();
      await collect();
      assert.equal(weak.deref(), undefined);
      assert.throws(() => scroll.update(), /initialised/i);
    },

  'retained-invalid-component-releases-host-on-document-destruction':
    async ({ rmlui, document, context }) => {
      let host = document.createElement('div');
      document.appendChild(host);
      const scroll = new rmlui.ElementScroll(host);
      scroll.enableScrollbar(0, 100);
      const weak = new WeakRef(host);
      host = null;
      document.close();
      context.update();
      await collect();
      assert.equal(weak.deref(), undefined);
      assert.throws(() => scroll.update(), /valid/i);
    },

  'failed-native-instancing-leaves-owned-component-reusable':
    ({ rmlui, host }) => {
      const { Factory, ElementInstancer } = rmlui;
      const plain = Factory.getElementInstancer('*');
      const scroll = new rmlui.ElementScroll(host);
      try {
        Factory.registerElementInstancer('*', new ElementInstancer(
          (parent, tag, attributes) => (tag === 'slidertrack'
            ? null : plain.instanceElement(parent, tag, attributes))));
        assert.throws(() => scroll.enableScrollbar(0, 100), /scrollbar/i);
        assert.equal(scroll.getScrollbar(0), null);
        Factory.registerElementInstancer('*', plain);
        scroll.enableScrollbar(0, 100);
        scroll.formatScrollbars();
        assert.equal(scroll.getScrollbarSize(0), 12);
        scroll.release();
      } finally {
        Factory.registerElementInstancer('*', plain);
      }
    },

  'unchanged-component-queries-do-not-scan-other-instances':
    ({ rmlui, host }) => {
      const instances = Array.from({ length: 1000 },
        () => new rmlui.ElementScroll(host));
      const native = require('../../build/Release/rmlui.node');
      native.beginDataDiagnostics();
      for (let i = 0; i < 100; ++i) {
        assert.equal(instances[0].getScrollbarSize(0), 0);
      }
      const counts = native.endDataDiagnostics();
      assert.equal(counts.runtimeEntries, 100);
      assert.equal(counts.nativeCallbacks, 0);
      assert.equal(counts.elementOwnershipVisits, 0);
      assert.equal(counts.callbackParentNotifications, 0);
      for (const scroll of instances) {
        scroll.release();
      }
    },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 200)), 'Owned scroll');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    const context = rmlui.createContext('owned-scroll', 240, 200);
    context.setDefaultScrollBehavior(rmlui.ScrollBehavior.Instant);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 240px; height: 200px; margin: 0; }
div { display: block; }
#host { width: 100px; height: 100px; overflow: hidden; }
#content { width: 300px; height: 400px; }
scrollbarvertical { width: 12px; }
scrollbarhorizontal { height: 9px; }
</style></head><body><div id="host"><div id="content"/></div></body></rml>`);
    document.show();
    context.update();
    const host = document.getElementById('host');
    await cases[name]({ rmlui, host, document, context, window });
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
      ++failures;
      console.error(`FAIL ${name}: ${result.signal ?? result.status}`,
        result.error ?? '', result.stdout, result.stderr);
    } else {
      console.log(`PASS ${name}`);
    }
  }
  assert.equal(failures, 0, `${failures} owned scroll regressions failed`);
}
