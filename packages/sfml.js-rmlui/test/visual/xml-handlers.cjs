'use strict';

/**
 * Preserve the metadata/link handling used by upstream TestViewer.cpp.
 * @param {object} rmlui Public runtime exports.
 */
function register(rmlui) {
  rmlui.XMLParser.registerNodeHandler('meta', new rmlui.XMLNodeHandler({
    elementStart: () => null,
    elementEnd: () => true,
    elementData: () => true,
  }));
  let head;
  rmlui.XMLParser.registerNodeHandler('link', new rmlui.XMLNodeHandler({
    elementStart(parser, name, attributes) {
      const type = (attributes.type ?? '').toLowerCase();
      if (attributes.href &&
        [ 'text/rcss', 'text/css', 'text/template' ].includes(type)) {
        return head.elementStart(parser, name, attributes);
      }
      return null;
    },
    elementEnd: (parser, name) => head.elementEnd(parser, name),
    elementData: (parser, data, type) => head.elementData(parser, data, type),
  }));
  head = rmlui.XMLParser.getNodeHandler('head');
}

module.exports = { register };
