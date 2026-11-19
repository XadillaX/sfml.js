'use strict';

// Keep the original Noto face order and explicit normal fallback weight.
const fonts = [
  ...[
    'LatoLatin-Regular', 'LatoLatin-Italic',
    'LatoLatin-Bold', 'LatoLatin-BoldItalic',
  ].map(name => ({ file: `assets/${name}.ttf`, fallback: false })),
  ...[
    'NotoSansSC[wght]', 'NotoSansJP[wght]', 'NotoSansKR[wght]',
    'NotoSansThai[wdth,wght]', 'NotoSansArabic[wdth,wght]',
  ].map(name => ({
    file: `assets/external/${name}.ttf`, fallback: true, weight: 400,
  })),
  { file: 'assets/NotoEmoji-Regular.ttf', fallback: true, weight: 400 },
];

/**
 * Open the original IME form with its multilingual text and native controls.
 * @param {object} context Live native RmlUi context.
 * @return {object} Document and shutdown hook.
 */
function createIme(context) {
  const document = context.loadDocument('basic/ime/data/ime.rml');
  document.show();

  return { document, close: () => document.close() };
}

module.exports = { createIme, fonts };
