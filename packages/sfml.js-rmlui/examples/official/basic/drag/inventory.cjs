'use strict';

const rmlui = require('../../../../dist');
const { processDragDrop } = require('./drag-listener.cjs');

/**
 * Each basic/drag inventory registers the original draggable container.
 */
class Inventory {
  constructor(title, position, context) {
    this.document = context.loadDocument('basic/drag/data/inventory.rml');
    this.document.getElementById('title').innerRML = title;
    this.document.setProperty('left', `${position.x}dp`);
    this.document.setProperty('top', `${position.y}dp`);
    this.document.show();
    this.document.getElementById('content')
      .addEventListener('dragdrop', processDragDrop);
  }

  addItem(name) {
    const content = this.document.getElementById('content');
    const icon = rmlui.Factory.instanceElement(content, 'icon', 'icon');
    content.appendChild(icon);
    icon.innerRML = name;
  }

  close() {
    this.document.close();
  }
}

module.exports = { Inventory };
