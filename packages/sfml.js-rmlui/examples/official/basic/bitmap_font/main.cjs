'use strict';

const rmlui = require('../../../../dist');

const fonts = [ 'basic/bitmap_font/data/Comfortaa_Regular_22.fnt' ];

/** Select the upstream bitmap engine before RmlUi initialization. */
function prepare() {
  const engine = new rmlui.FontEngineInterface('bitmap');
  rmlui.setFontEngineInterface(engine);
  return { engine };
}

/**
 * Use the original bitmap atlas, metrics and document.
 * @param {object} context Live RmlUi context.
 * @return {object} Document and shutdown hook.
 */
function createBitmapFont(context) {
  const document = context.loadDocument(
    'basic/bitmap_font/data/bitmap_font.rml');
  document.getElementById('title').innerRML = 'Bitmap font';
  document.show();

  return { document, close: () => document.close() };
}

module.exports = { createBitmapFont, prepare, fonts };
