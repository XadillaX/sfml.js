'use strict';

const assert = require('node:assert');
const sfml = require('sfml.js');
const rmlui = require('../../dist');

assert.strictEqual(rmlui.version, '6.3');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(640, 480)),
  'sfml.js-rmlui test',
  { settings: { stencilBits: 8 } });
assert.ok(rmlui.initialise(window));

try {
  const context = rmlui.createContext('test', 640, 480);
  assert.strictEqual(context.dimensions.width, 640);
  assert.strictEqual(context.dimensions.height, 480);
  const dimensions = context.dimensions;
  context.setDimensions(800, 480);
  assert.strictEqual(dimensions.width, 800);
  context.setDimensions(640, 480);

  const document = context.loadDocumentFromMemory(`
<rml>
  <head>
    <style>
      body { width: 640px; height: 480px; }
      div { display: block; }
      #panel {
        width: 200px; height: 120px; background: #336699;
        filter: blur(1px);
        box-shadow: 3px 3px 6px #00000080;
      }
      #clip {
        width: 120px; height: 40px; overflow: hidden;
        border-radius: 8px; background: #222222;
      }
    </style>
  </head>
  <body>
    <div id="panel" class="box"></div>
    <div id="clip"><div style="width: 200px; height: 60px;"></div></div>
  </body>
</rml>`);
  document.show();
  assert.strictEqual(document.sourceURL, '[document from memory]');

  const panel = document.getElementById('panel');
  assert.ok(panel);
  assert.strictEqual(panel.tagName, 'div');
  assert.strictEqual(panel.id, 'panel');
  assert.strictEqual(panel.getElementById('clip').id, 'clip');
  assert.strictEqual(panel.querySelector('#clip'), null);
  assert.strictEqual(panel.isClassSet('box'), true);
  panel.setClass('box', false);
  assert.strictEqual(panel.isClassSet('box'), false);
  assert.strictEqual(panel.getAttribute('id'), 'panel');

  let clicks = 0;
  const onClick = () => {
    clicks += 1;
  };
  panel.addEventListener('click', onClick);
  panel.setAttribute('data-count', '0');
  assert.strictEqual(panel.getAttribute('data-count'), '0');

  assert.ok(context.update());
  // Rendering without a loaded font still compiles non-text geometry.
  context.render();
  assert.strictEqual(clicks, 0);

  // Real layout must leave a clickable block at these coordinates.
  context.processEvent({ kind: 'MouseMoved', position: { x: 50, y: 50 } });
  for (const kind of [ 'MouseButtonPressed', 'MouseButtonReleased' ]) {
    context.processEvent({ kind, button: 0, position: { x: 50, y: 50 } });
  }
  assert.strictEqual(clicks, 1);

  panel.removeEventListener('click', onClick);
  document.close();
  context.update();

  // Reuse layer resources across documents and filter chains.
  const effects = [
    'filter: blur(2px);',
    'filter: drop-shadow(#0008 8px 8px 2px);',
    'box-shadow: 4px 4px 8px #0008;',
    'filter: drop-shadow(#0008 8px 8px 2px) blur(1px);',
  ];
  for (let round = 0; round < 3; round++) {
    for (const effect of effects) {
      const scene = context.loadDocumentFromMemory(`
<rml>
  <head>
    <style>
      body { width: 640px; height: 480px; }
      div { display: block; }
      #outer {
        width: 100px; height: 80px; overflow: hidden;
        border-radius: 12px;
      }
      #inner {
        width: 180px; height: 50px; background: #fff; ${effect}
      }
    </style>
  </head>
  <body><div id="outer"><div id="inner"></div></div></body>
</rml>`);
      scene.show();
      for (let frame = 0; frame < 3; frame++) {
        assert.ok(context.update());
        window.clear(sfml.Color.Black);
        window.flush();
        assert.ok(context.render());
        window.display();
      }
      scene.unload();
      context.update();
    }
  }
  context.remove();
} finally {
  rmlui.shutdown();
  window.close();
}

console.log('[sfml.js-rmlui] basic smoke test passed');
