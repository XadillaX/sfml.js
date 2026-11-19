'use strict';

const rmlui = require('../../../../dist');

const fonts = [
  'assets/LatoLatin-Regular.ttf',
  'basic/harfbuzz/data/Cairo-Regular.ttf',
  'basic/harfbuzz/data/Poppins-Regular.ttf',
];

/** Register the exact upstream language scripts before initialization. */
function prepare() {
  const engine = new rmlui.FontEngineInterface('harfbuzz');
  for (const [ language, script, direction ] of [
    [ 'en', 'Latn', 'ltr' ],
    [ 'ar', 'Arab', 'rtl' ],
    [ 'hi', 'Deva', 'ltr' ],
  ]) {
    engine.registerLanguage(language, script, direction);
  }
  rmlui.setFontEngineInterface(engine);
  return { engine };
}

/**
 * Switch English, Arabic and Hindi using basic/harfbuzz's native classes.
 * @param {object} context Live RmlUi context.
 * @return {object} Document and shutdown hook.
 */
function createHarfBuzz(context) {
  const document = context.loadDocument('basic/harfbuzz/data/harfbuzz.rml');
  document.getElementById('title').innerRML = 'HarfBuzz Text Shaping';
  document.show();
  const languages = [ 'english', 'arabic', 'hindi' ];
  const paragraphs = [ 'en', 'ar', 'hi' ].map(language =>
    document.getElementById(`lorem-ipsum-${language}`));
  for (const [ index, language ] of languages.entries()) {
    document.getElementById(`set-${language}`).addEventListener('click', () => {
      for (const [ paragraphIndex, paragraph ] of paragraphs.entries()) {
        paragraph.setClass('hide-lorem-ipsum', paragraphIndex !== index);
      }
    });
  }

  return { document, close: () => document.close() };
}

module.exports = { createHarfBuzz, prepare, fonts };
