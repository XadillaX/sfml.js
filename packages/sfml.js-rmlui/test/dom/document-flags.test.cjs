'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const rmlui = require('../../dist');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Document flag contracts');
assert.ok(rmlui.initialise(window, { highDpi: false }));

try {
  const context = rmlui.createContext('document-flags', 160, 120);
  context.setDefaultScrollBehavior(rmlui.ScrollBehavior.Instant);
  const background = context.loadDocumentFromMemory(`
<rml><head><style>
body { width:160px; height:120px; }
div { width:10px; height:10px; tab-index:auto; }
</style></head><body><div id="background"/></body></rml>`);
  background.show();
  const backgroundFocus = background.getElementById('background');

  for (const previousModal of [ false, true ]) {
    for (const modal of [ 0, 1, 2 ]) {
      for (const focus of [ 0, 1, 2, 3 ]) {
        for (const scroll of [ 0, 1 ]) {
          const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width:160px; height:120px; }
div { display:block; }
#scroll { width:80px; height:30px; overflow:auto; }
#keep, #auto { height:10px; tab-index:auto; }
#gap { height:100px; }
</style></head><body><div id="scroll"><div id="keep"/>
<div id="gap"/><div id="auto" autofocus=""/></div></body></rml>`);
          const kept = document.getElementById('keep');
          const automatic = document.getElementById('auto');
          const scroller = document.getElementById('scroll');
          document.show(previousModal, rmlui.FocusFlag.None,
            rmlui.ScrollFlag.None);
          assert.ok(scroller.scrollHeight > scroller.clientHeight);
          assert.equal(kept.focus(), true);
          document.hide();
          assert.equal(document.isModal(), false);
          assert.equal(backgroundFocus.focus(), true);
          assert.strictEqual(document.getFocusLeafNode(), kept);
          scroller.scrollTo({ x: 0, y: 0 });

          let shows = 0;
          document.addEventListener('show', () => ++shows);
          document.show(modal, focus, scroll);

          const expectedModal = modal === rmlui.ModalFlag.Keep
            ? previousModal : modal === rmlui.ModalFlag.Modal;
          const expectedFocus = [
            backgroundFocus, document, kept, automatic,
          ][focus];
          assert.equal(document.isModal(), expectedModal);
          assert.strictEqual(context.getFocusElement(), expectedFocus);
          assert.equal(document.isVisible(), true);
          assert.equal(shows, 1);
          const scrollAutomatic = focus === rmlui.FocusFlag.Auto &&
            scroll === rmlui.ScrollFlag.Auto;
          if (scrollAutomatic) {
            assert.ok(scroller.scrollTop > 0);
          } else {
            assert.equal(scroller.scrollTop, 0);
          }

          document.hide();
          assert.equal(document.isModal(), false);
          assert.equal(document.isVisible(), false);
          document.unload();
          context.update();
          console.log(`PASS document-flags-${previousModal}-${modal}-` +
            `${focus}-${scroll}`);
        }
      }
    }
  }
  context.remove();
} finally {
  rmlui.shutdown();
  window.close();
}
