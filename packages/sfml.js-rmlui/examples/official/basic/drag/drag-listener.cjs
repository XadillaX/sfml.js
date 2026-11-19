'use strict';

/**
 * Move native-owned icons with basic/drag's original insertion algorithm.
 * @param {object} event Live native dragdrop event.
 */
function processDragDrop(event) {
  const container = event.currentTarget;
  const target = event.target;
  const dragged = event.parameters.drag_element;
  const parent = dragged.getParentNode();

  if (container === target) {
    container.appendChild(parent.removeChild(dragged));
    return;
  }

  let before = target;
  if (parent === container) {
    let previous = before.getPreviousSibling();
    while (previous !== null) {
      if (previous === dragged) {
        before = before.getNextSibling();
        break;
      }
      previous = previous.getPreviousSibling();
    }
  }
  container.insertBefore(parent.removeChild(dragged), before);
}

module.exports = { processDragDrop };
