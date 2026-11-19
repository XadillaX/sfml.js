'use strict';

/**
 * Play the original native Lottie document and retain its window title.
 * @param {object} context Live RmlUi context.
 * @return {object} Document and shutdown hook.
 */
function createLottie(context) {
  const document = context.loadDocument('basic/lottie/data/lottie.rml');
  document.show();
  document.getElementById('title').innerRML = 'Lottie';

  return { document, close: () => document.close() };
}

module.exports = { createLottie };
