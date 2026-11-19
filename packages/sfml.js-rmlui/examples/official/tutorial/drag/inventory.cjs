'use strict';

const rmlui = require('../../../../dist');

/**
 * Native element ownership mirrors tutorial/drag/src/Inventory.cpp.
 */
class Inventory {
  constructor(title, position, context) {
    this.document = context.loadDocument('tutorial/drag/data/inventory.rml');
    this.document.getElementById('title').innerRML = title;
    this.document.setProperty('left', `${position.x}dp`);
    this.document.setProperty('top', `${position.y}dp`);
    this.document.show();
  }

  addItem(name) {
    const content = this.document.getElementById('content');
    const icon = rmlui.Factory.instanceElement(content, 'icon', 'icon');
    icon.innerRML = name;
    content.appendChild(icon);
  }

  close() {
    this.document.close();
  }
}

module.exports = { Inventory };
