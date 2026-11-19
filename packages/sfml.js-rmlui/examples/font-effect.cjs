'use strict';

// Custom FontEffect driven entirely from JavaScript. The FontEffectInstancer
// returns a native effect whose glyph callback tints each glyph green; the
// default font engine then owns that effect through its font layers.
const path = require('node:path');
const { parseArgs } = require('node:util');

const sfml = require('sfml.js');
const rmlui = require('../dist');

const width = 720;
const height = 420;

function makeGreenEffect() {
  return new rmlui.FontEffect({
    hasUniqueTexture: () => true,
    getGlyphMetrics: (_glyph, origin, dimensions) => ({
      supported: true,
      origin,
      dimensions,
    }),
    generateGlyphTexture(bytes, dimensions, stride, glyph) {
      const source = glyph.bitmapData;
      if (!source) {
        return;
      }
      const sourceWidth = Math.min(
        dimensions.x, glyph.bitmapDimensions.x);
      const sourceHeight = Math.min(
        dimensions.y, glyph.bitmapDimensions.y);
      const rgba = glyph.colorFormat === rmlui.ColorFormat.RGBA8;
      const sourceStride = rgba ? sourceWidth * 4 : sourceWidth;
      for (let y = 0; y < sourceHeight; ++y) {
        for (let x = 0; x < sourceWidth; ++x) {
          const sourceOffset = rgba
            ? y * sourceStride + x * 4 + 3
            : y * sourceStride + x;
          const alpha = source[sourceOffset];
          const offset = y * stride + x * 4;
          bytes[offset] = 0;
          bytes[offset + 1] = alpha;
          bytes[offset + 2] = 0;
          bytes[offset + 3] = alpha;
        }
      }
    },
  });
}

function makeDocument(context) {
  const instancer = new rmlui.FontEffectInstancer(makeGreenEffect);
  rmlui.FontEffectInstancer.register('glow', instancer);
  return context.loadDocumentFromMemory(`
<rml>
  <head>
    <style>
      body {
        top: 48px;
        left: 48px;
        font-family: LatoLatin;
        font-size: 36px;
        color: white;
      }
      .row {
        height: 64px;
      }
      .glow {
        font-effect: glow();
        color: #9dff9d;
      }
      .hint {
        margin-top: 24px;
        font-size: 18px;
        color: #aab2c0;
      }
    </style>
  </head>
  <body>
    <div class="row glow" id="effect">Custom FontEffect</div>
    <div class="row">Normal rendered text</div>
    <div class="hint">Space toggles the native glyph effect, Esc exits</div>
  </body>
</rml>`);
}

async function run(frameLimit, screenshotPath) {
  const window = new sfml.RenderWindow(
    new sfml.VideoMode(new sfml.Vector2u(width, height)),
    'sfml.js-rmlui · font effect',
    { settings: { stencilBits: 8 } });
  window.setFramerateLimit(60);

  try {
    if (!rmlui.initialise(window, { highDpi: false })) {
      throw new Error('RmlUi initialisation failed');
    }
    const font = path.join(__dirname,
      '../third_party/rmlui/Samples/assets/LatoLatin-Regular.ttf');
    if (!rmlui.loadFontFace(font)) {
      throw new Error('Failed to load LatoLatin-Regular');
    }

    const context = rmlui.createContext('font-effect', width, height);
    const document = makeDocument(context);
    const effect = document.getElementById('effect');
    document.show();
    console.log(`RmlUi ${rmlui.version} · custom FontEffect`);
    console.log('Space: toggle glow  Esc: quit');

    const key = sfml.Keyboard.Key;
    let running = true;
    let frames = 0;
    while (running && window.isOpen() && frames < frameLimit) {
      let event;
      while ((event = window.pollEvent()) !== undefined) {
        if (event.is('Closed')) {
          running = false;
        } else if (event.is('KeyPressed')) {
          if (event.data.code === key.Escape) {
            running = false;
          } else if (event.data.code === key.Space) {
            effect.setClass('glow', !effect.isClassSet('glow'));
          }
        }
        context.processEvent(event);
      }
      if (!running) {
        break;
      }
      context.update();
      window.clear(sfml.Color.Black);
      window.flush();
      context.render();
      if (screenshotPath && frames === frameLimit - 1) {
        const texture = new sfml.Texture(
          new sfml.Vector2u(width, height));
        texture.update(window);
        const saved = await texture
          .copyToImage()
          .saveToFile(screenshotPath);
        if (!saved) {
          throw new Error(`Failed to write ${screenshotPath}`);
        }
        console.log(`Saved screenshot: ${screenshotPath}`);
      }
      window.display();
      frames += 1;
    }
    context.remove();
  } finally {
    rmlui.shutdown();
    window.close();
  }
}

try {
  const { values } = parseArgs({
    options: {
      frames: { type: 'string' },
      screenshot: { type: 'string' },
    },
  });
  const frameLimit = values.frames === undefined
    ? Infinity : Number(values.frames);
  if (values.frames !== undefined
    && (!Number.isSafeInteger(frameLimit) || frameLimit < 1)) {
    throw new Error('--frames must be a positive integer.');
  }
  run(frameLimit, values.screenshot).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
