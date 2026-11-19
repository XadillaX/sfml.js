'use strict';

/**
 * Load the unchanged document used by basic/load_document/main.cpp.
 * @param {object} context Live RmlUi context.
 * @return {object} Application document and shutdown hook.
 */
function createLoadDocument(context) {
  const document = context.loadDocument('assets/demo.rml');
  document.show();

  return { document, close: () => document.close() };
}

module.exports = { createLoadDocument };
