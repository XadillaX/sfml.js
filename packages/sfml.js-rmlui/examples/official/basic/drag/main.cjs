'use strict';

const { Inventory } = require('./inventory.cjs');

/**
 * Preserve basic/drag's own two windows, items and drag listener.
 * @param {object} context Live RmlUi context.
 * @return {object} Inventory documents and shutdown hook.
 */
function createDrag(context) {
  const first = new Inventory('Inventory 1', { x: 50, y: 200 }, context);
  const second = new Inventory('Inventory 2', { x: 540, y: 240 }, context);
  for (const item of [
    'Mk III L.A.S.E.R.', 'Gravity Descender',
    'Closed-Loop Ion Beam', '5kT Mega-Bomb',
  ]) {
    first.addItem(item);
  }

  return {
    document: second.document,
    documents: [ first.document, second.document ],
    close() {
      first.close();
      second.close();
    },
  };
}

module.exports = { createDrag };
