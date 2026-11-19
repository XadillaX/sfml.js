'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const sfml = require('sfml.js');
const rmlui = require('../../dist');
const glyphs = [];

for (const highDpi of [ false, true ]) {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(400, 300)),
    'RmlUi density regression',
    { settings: { stencilBits: 8 } });
  window.setMinimumSize(new sfml.Vector2u(200, 150));
  window.setMaximumSize(new sfml.Vector2u(600, 450));
  try {
    assert.ok(rmlui.initialise(window, { highDpi }));
    const size = window.getSize();
    const context = rmlui.createContext('density', size.x, size.y);
    const ratio = context.densityIndependentPixelRatio;
    assert.ok(ratio >= 1);
    if (!highDpi) {
      assert.equal(ratio, 1);
    }
    assert.equal(size.x, 400 * ratio);
    assert.equal(size.y, 300 * ratio);
    assert.ok(rmlui.loadFontFace(path.resolve(__dirname,
      '../../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf')));
    const document = context.loadDocumentFromMemory(`
<rml><head><style>
body { width: 100%; height: 100%; font-family: LatoLatin; font-size: 20dp; }
#target {
  display: block; position: absolute; left: 40dp; top: 40dp;
  width: 80dp; height: 40dp; background: #fff;
}
#line {
  display: block; position: absolute; left: 20px; top: 20px;
  width: 1px; height: 10px; background: #fff;
}
#label { display: block; position: absolute; top: 100dp; color: #fff; }
</style></head><body>
<div id="line"/><div id="target"/><div id="label">Retina</div>
</body></rml>`);
    document.show();
    let clicks = 0;
    document.getElementById('target').addEventListener('click', () => clicks++);
    while (window.pollEvent()) {
      // Drain startup events before checking the first complete frame.
    }
    context.update();

    const click = position => {
      context.processEvent({ kind: 'MouseMoved', position });
      for (const kind of [ 'MouseButtonPressed', 'MouseButtonReleased' ]) {
        context.processEvent({ kind, button: 0, position });
      }
    };
    click({ x: 60 * ratio, y: 60 * ratio });
    assert.equal(clicks, 1, 'dp layout receives physical-pixel input');
    click({ x: 140 * ratio, y: 60 * ratio });
    assert.equal(clicks, 1, 'outside hit region must not click');

    window.clear(sfml.Color.Black);
    window.flush();
    context.render();
    const capture = new sfml.Texture(size);
    capture.update(window);
    const image = capture.copyToImage();
    const red = (x, y) => image.getPixel(new sfml.Vector2u(x, y)).r;
    assert.equal(red(20, 20), 255, 'one framebuffer pixel is rendered');
    assert.equal(red(19, 20), 0);
    assert.equal(red(21, 20), 0, 'pixel is not expanded by a low-res surface');
    assert.equal(red(60 * ratio, 60 * ratio), 255, 'dp geometry is scaled');
    assert.equal(red(130 * ratio, 60 * ratio), 0);
    let glyphTop = Infinity;
    let glyphBottom = -1;
    for (let y = 100 * ratio; y < 150 * ratio; y++) {
      for (let x = 0; x < 150 * ratio; x++) {
        if (red(x, y) > 127) {
          glyphTop = Math.min(glyphTop, y);
          glyphBottom = Math.max(glyphBottom, y);
        }
      }
    }
    assert.ok(glyphBottom >= glyphTop, 'font glyphs are visible');
    glyphs.push({ ratio, height: glyphBottom - glyphTop + 1 });

    // Resizes sent through the event bridge update both the context and view.
    window.setSize(new sfml.Vector2u(1000 * ratio, 1000 * ratio));
    assert.equal(window.getSize().x, 600 * ratio, 'maximum size stays in dp');
    assert.equal(window.getSize().y, 450 * ratio);
    window.setSize(new sfml.Vector2u(10, 10));
    assert.equal(window.getSize().x, 200 * ratio, 'minimum size stays in dp');
    assert.equal(window.getSize().y, 150 * ratio);
    window.setSize(new sfml.Vector2u(420 * ratio, 320 * ratio));
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      context.processEvent(event);
    }
    const resized = window.getSize();
    context.processEvent({ kind: 'Resized', size: resized });
    assert.equal(context.dimensions.width, resized.x);
    assert.equal(context.dimensions.height, resized.y);
    context.update();
    click({ x: 60 * ratio, y: 60 * ratio });
    assert.equal(clicks, 2, 'resizing preserves input alignment');
    document.unload();
    context.remove();
    console.log(`[sfml.js-rmlui] density ${ratio}x pixels/input/resize passed`);
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

assert.ok(Math.abs(glyphs[1].height / glyphs[1].ratio - glyphs[0].height) <= 1,
  'font rasterization follows display density with stable on-screen size');
console.log('[sfml.js-rmlui] glyph heights:', glyphs);
