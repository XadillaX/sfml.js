'use strict';

/**
 * Load tutorial/template with its original decorated-window template.
 * @param {object} context Live RmlUi context.
 * @return {object} Application document and shutdown hook.
 */
function createTemplate(context) {
  const document = context.loadDocument('tutorial/template/data/tutorial.rml');
  document.show();

  return { document, close: () => document.close() };
}

module.exports = { createTemplate };
