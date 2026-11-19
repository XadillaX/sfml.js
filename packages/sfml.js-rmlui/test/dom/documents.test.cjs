'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function scene(context, id) {
  const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 220px; height: 140px; }
div { position: absolute; top: 10px; width: 30px; height: 30px;
      tab-index: auto; }
#first { left: 10px; }
#second { left: 60px; }
</style></head><body id="${id}">
<div id="first"/><div id="second" autofocus=""/>
</body></rml>`);
  return document;
}

const cases = {
  registry({ rmlui, context }) {
    assert.equal(context.getNumDocuments(), 0);
    assert.equal(context.getDocumentsBaseTag(), 'body');
    const document = context.createDocument();
    assert.ok(document instanceof rmlui.Document);
    assert.equal(document.tagName, 'body');
    document.id = 'empty';
    assert.strictEqual(document.getContext(), context);
    assert.strictEqual(context.getDocument('empty'), document);
    assert.strictEqual(context.getDocument(0), document);
    assert.equal(context.getNumDocuments(), 1);
    for (const key of [ -1, 1, 999, 'missing' ]) {
      assert.equal(context.getDocument(key), null);
    }
    assert.throws(() => context.getDocument(0.1), /index/i);
    context.setDocumentsBaseTag('html');
    const second = context.createDocument();
    assert.equal(second.tagName, 'html');
    assert.equal(document.tagName, 'body');
    assert.equal(context.getDocumentsBaseTag(), 'html');
    assert.equal(context.createDocument('div'), null);
    assert.equal(context.getNumDocuments(), 2);
    const detached = document.createElement('body');
    assert.ok(detached instanceof rmlui.Document);
    assert.equal(detached.getContext(), null);
  },

  unloading({ context }) {
    const first = context.createDocument();
    const second = context.createDocument();
    first.id = 'first';
    let unloaded = 0;
    first.addEventListener('unload', () => {
      unloaded++;
      assert.strictEqual(context.getDocument('first'), first);
      assert.strictEqual(first.getContext(), context);
    });
    context.unloadDocument(first);
    context.unloadDocument(first);
    assert.equal(unloaded, 1);
    assert.equal(context.getNumDocuments(), 1);
    assert.equal(first.id, 'first');
    context.unloadAllDocuments();
    assert.equal(context.getNumDocuments(), 0);
    assert.equal(second.tagName, 'body');
    context.update();
    assert.throws(() => first.getContext(), /no longer valid/i);
    assert.throws(() => second.tagName, /no longer valid/i);
    context.unloadAllDocuments();
  },

  stacking({ rmlui, context }) {
    const first = scene(context, 'bottom');
    const second = scene(context, 'top');
    first.show(false, rmlui.FocusFlag.None);
    second.show(false, rmlui.FocusFlag.None);
    context.update();
    const point = { x: 20, y: 20 };
    assert.strictEqual(context.getElementAtPoint(point),
      second.getElementById('first'));
    first.pullToFront();
    assert.strictEqual(context.getDocument(1), first);
    assert.strictEqual(context.getElementAtPoint(point),
      first.getElementById('first'));
    first.pushToBack();
    assert.strictEqual(context.getDocument(0), first);
    context.pullDocumentToFront(first);
    assert.strictEqual(context.getDocument(1), first);
    context.pushDocumentToBack(first);
    assert.strictEqual(context.getDocument(0), first);
    assert.strictEqual(context.getElementAtPoint(point, second),
      first.getElementById('first'));
    assert.equal(context.getElementAtPoint(point, context.getRootElement()),
      null);
    assert.strictEqual(context.getElementAtPoint(point, null, first),
      first.getElementById('first'));
  },

  'show-focus-tabs': function({ rmlui, context }) {
    const { ModalFlag, FocusFlag, ScrollFlag } = rmlui;
    assert.deepEqual(
      [ ModalFlag.None, ModalFlag.Modal, ModalFlag.Keep,
        FocusFlag.None, FocusFlag.Document, FocusFlag.Keep, FocusFlag.Auto,
        ScrollFlag.None, ScrollFlag.Auto ],
      [ 0, 1, 2, 0, 1, 2, 3, 0, 1 ]);
    const document = scene(context, 'focus');
    const first = document.getElementById('first');
    const second = document.getElementById('second');
    document.show();
    assert.strictEqual(context.getFocusElement(), second);
    assert.equal(document.isModal(), false);
    document.show(true, FocusFlag.Document, ScrollFlag.None);
    assert.equal(document.isModal(), true);
    assert.strictEqual(context.getFocusElement(), document);
    document.show(ModalFlag.Keep, FocusFlag.None);
    assert.equal(document.isModal(), true);
    assert.strictEqual(context.getFocusElement(), document);
    document.show(false);
    assert.equal(document.isModal(), false);
    assert.strictEqual(context.getFocusElement(), second);
    assert.strictEqual(document.findNextTabElement(document, true), first);
    assert.strictEqual(document.findNextTabElement(first, true), second);
    assert.equal(document.findNextTabElement(second, true, false), null);
    assert.strictEqual(document.findNextTabElement(second, true), first);
    assert.strictEqual(document.findNextTabElement(second, false), first);
    context.update();
    context.processMouseMove(20, 20);
    context.processMouseButtonDown(0);
    context.processMouseButtonUp(0);
    assert.strictEqual(context.getFocusElement(), first);
    document.hide();
    document.show(ModalFlag.Keep, FocusFlag.Keep);
    assert.strictEqual(context.getFocusElement(), first);
    for (const args of [[ 3 ], [ false, 4 ], [ false, 0, 2 ],
      [ 'modal' ], [ false, NaN ], [ 0.5 ]]) {
      assert.throws(() => document.show(...args), /flag/i);
    }
  },

  'hover-modal-unfocus': function({ rmlui, context }) {
    const first = scene(context, 'first-document');
    const second = scene(context, 'second-document');
    first.show(false, rmlui.FocusFlag.Document);
    second.show(true, rmlui.FocusFlag.Document);
    first.pullToFront();
    context.update();
    context.processMouseMove(20, 20);
    assert.strictEqual(context.getHoverElement(),
      second.getElementById('first'));
    context.processMouseLeave();
    assert.equal(context.getHoverElement(), null);
    context.unfocusDocument(second);
    // Native modal focus still blocks ordinary documents, even after removal
    // from focus history. UnfocusDocument does not clear the modal flag.
    assert.strictEqual(context.getFocusElement(), second);
    second.show(false, rmlui.FocusFlag.None);
    context.unfocusDocument(second);
    assert.strictEqual(context.getFocusElement(), first);
  },

  'layout-scroll-flags': function({ rmlui, context }) {
    assert.deepEqual([ rmlui.ScrollBehavior.Auto, rmlui.ScrollBehavior.Smooth,
      rmlui.ScrollBehavior.Instant ], [ 0, 1, 2 ]);
    context.setDefaultScrollBehavior(rmlui.ScrollBehavior.Instant);
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 200px; height: 140px; }
div { display: block; }
scrollbarvertical { width: 10px; }
scrollbarhorizontal { height: 10px; }
#scroller { width: 180px; height: 80px; overflow: auto; }
#spacer { height: 200px; }
#target { width: 40px; height: 30px; tab-index: auto; }
</style></head><body><div id="scroller"><div id="spacer"/>
<div id="target" autofocus=""/></div></body></rml>`);
    const target = document.getElementById('target');
    document.show(false, rmlui.FocusFlag.Auto, rmlui.ScrollFlag.None);
    context.update();
    assert.notStrictEqual(context.getElementAtPoint({ x: 10, y: 60 }), target);
    document.show(false, rmlui.FocusFlag.Auto, rmlui.ScrollFlag.Auto);
    assert.strictEqual(context.getElementAtPoint({ x: 10, y: 60 }), target);
    context.processMouseMove(10, 60);
    context.processMouseWheel(-10);
    document.updateDocument();
    assert.strictEqual(context.getElementAtPoint({ x: 10, y: 60 }),
      document.getElementById('spacer'));
    document.setProperty('width', '180px');
    document.updateDocument();
    assert.strictEqual(context.getElementAtPoint({ x: 190, y: 10 }),
      context.getRootElement());
    for (const speed of [ 0, -1, NaN, Infinity, 1e100, 1e-100 ]) {
      assert.throws(() => context.setDefaultScrollBehavior(
        rmlui.ScrollBehavior.Smooth, speed), /speed/i);
    }
    assert.throws(() => context.setDefaultScrollBehavior(3), /behavior/i);
  },

  'invalid-references': function({ rmlui, context }) {
    const document = scene(context, 'local');
    const otherContext = rmlui.createContext('other', 240, 160);
    const other = scene(otherContext, 'foreign');
    for (const method of [ 'unloadDocument', 'pullDocumentToFront',
      'pushDocumentToBack', 'unfocusDocument' ]) {
      assert.throws(() => context[method](other), /context/i);
    }
    const detached = document.createElement('div');
    assert.throws(() => document.findNextTabElement(detached, true),
      /document/i);
    assert.throws(() => document.findNextTabElement(other, true), /document/i);
    assert.throws(() => context.getElementAtPoint({ x: 0, y: 0 }, other),
      /context/i);
    assert.throws(() => context.getElementAtPoint(
      { x: 0, y: 0 }, null, detached), /context/i);
    for (const coordinate of [ NaN, Infinity, 1e300, 2 ** 31 - 1 ]) {
      assert.throws(() => context.getElementAtPoint(
        { x: coordinate, y: 0 }), /point/i);
    }
    const expiredIgnore = context.createDocument();
    assert.throws(() => context.getElementAtPoint({
      get x() {
        expiredIgnore.close();
        context.update();
        return 0;
      },
      y: 0,
    }, expiredIgnore), /no longer valid/i);
    const expected = new Error('point getter');
    assert.throws(() => context.getElementAtPoint({
      get x() {
        throw expected;
      },
      y: 0,
    }), error => error === expected);
    const invalidatedPoint = {
      get x() {
        context.remove();
        return 0;
      },
      y: 0,
    };
    assert.throws(() => context.getElementAtPoint(invalidatedPoint),
      /no longer valid/i);
    assert.equal(otherContext.getNumDocuments(), 1);
  },

  'callback-protection': function({ context }) {
    const document = scene(context, 'events');
    let called = 0;
    document.addEventListener('show', () => {
      called++;
      assert.strictEqual(context.getDocument('events'), document);
      assert.strictEqual(document.getContext(), context);
      assert.equal(document.isModal(), false);
      assert.throws(() => context.unloadAllDocuments(), /callback/i);
      assert.throws(() => document.updateDocument(), /callback/i);
    });
    document.show();
    assert.equal(called, 1);
    assert.equal(context.getNumDocuments(), 1);
  },

  'transformed-clipped-hit': function({ context }) {
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 220px; height: 140px; }
#clip { position: absolute; left: 10px; top: 10px;
        width: 50px; height: 60px; overflow: hidden; clip: always; }
#target { position: absolute; left: 20px; top: 10px;
          width: 40px; height: 30px; transform: translateX(20px); }
</style></head><body><div id="clip"><div id="target"/></div></body></rml>`);
    document.show();
    context.update();
    context.render();
    const target = document.getElementById('target');
    const clip = document.getElementById('clip');
    assert.strictEqual(context.getElementAtPoint({ x: 55, y: 25 }), target);
    // Pinned Context.cpp tests the inverse-projected point against the
    // ancestor's clip rectangle. Keep its native translated-clip semantics.
    assert.strictEqual(context.getElementAtPoint({ x: 65, y: 25 }), target);
    assert.strictEqual(context.getElementAtPoint({ x: 85, y: 25 }), document);
    assert.strictEqual(context.getElementAtPoint({ x: 55, y: 25 }, clip),
      document);
    target.setProperty('transform', 'none');
    document.updateDocument();
    context.render();
    assert.strictEqual(context.getElementAtPoint({ x: 55, y: 25 }), target);
    assert.strictEqual(context.getElementAtPoint({ x: 65, y: 25 }), document);
    target.setProperty('pointer-events', 'none');
    document.updateDocument();
    assert.strictEqual(context.getElementAtPoint({ x: 55, y: 25 }), clip);
  },

  'unload-exception': function({ context }) {
    const first = scene(context, 'first');
    const second = scene(context, 'second');
    const expected = new Error('unload failure');
    first.addEventListener('unload', () => {
      assert.equal(first.id, 'first');
      throw expected;
    });
    assert.throws(() => context.unloadAllDocuments(),
      error => error === expected);
    assert.equal(context.getNumDocuments(), 0);
    assert.equal(second.id, 'second');
    context.update();
    assert.throws(() => first.isModal(), /no longer valid/i);
    assert.throws(() => second.getContext(), /no longer valid/i);
  },
};

async function run(name) {
  const sfml = require('sfml.js');
  const rmlui = require('../../dist');
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(240, 160)), 'Document contracts');
  assert.ok(rmlui.initialise(window, { highDpi: false }));
  try {
    await cases[name]({
      rmlui, context: rmlui.createContext('documents', 240, 160),
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
    const result = spawnSync(process.execPath, [ __filename, name ], {
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
  assert.equal(failures, 0, `${failures} document regressions failed`);
}
