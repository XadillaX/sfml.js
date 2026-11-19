'use strict';

const rmlui = require('../../../dist');

/**
 * Translate Samples/shell/src/Shell.cpp's two-priority shortcut handler.
 * @param {object} context Live RmlUi context.
 * @param {number} key Native RmlUi key identifier.
 * @param {number} modifiers Snapshot modifier flags.
 * @param {number} nativeRatio Window's initial display density.
 * @param {boolean} priority Whether input has yet to reach the context.
 * @return {boolean} Whether the key should propagate.
 */
function processKeyDownShortcuts(context, key, modifiers, nativeRatio,
  priority) {
  const keys = rmlui.KeyIdentifier;
  const ctrl = Math.floor(modifiers / rmlui.KeyModifier.KM_CTRL) % 2 === 1;

  if (priority) {
    if (key === keys.KI_F8) {
      rmlui.Debugger.setVisible(!rmlui.Debugger.isVisible());
    } else if (ctrl && key === keys.KI_0) {
      context.setDensityIndependentPixelRatio(nativeRatio);
    } else if (ctrl && key === keys.KI_1) {
      context.setDensityIndependentPixelRatio(1);
    } else if (ctrl && [ keys.KI_OEM_MINUS, keys.KI_SUBTRACT ].includes(key)) {
      context.setDensityIndependentPixelRatio(
        Math.max(context.densityIndependentPixelRatio / 1.2, 0.5));
    } else if (ctrl && [ keys.KI_OEM_PLUS, keys.KI_ADD ].includes(key)) {
      context.setDensityIndependentPixelRatio(
        Math.min(context.densityIndependentPixelRatio * 1.2, 2.5));
    } else {
      return true;
    }
    return false;
  }

  if (ctrl && key === keys.KI_R) {
    for (let index = 0; index < context.getNumDocuments(); index++) {
      const document = context.getDocument(index);
      if (document.sourceURL.endsWith('.rml')) {
        document.reloadStyleSheet();
      }
    }
    return false;
  }
  return true;
}

module.exports = { processKeyDownShortcuts };
