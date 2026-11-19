'use strict';

const rmlui = require('../../../../dist');
const { processKeyDownShortcuts } = require('../../shell/shortcuts.cjs');

/**
 * Preserve basic/variables' unmodified RCSS and theme/key behavior.
 * @param {object} context Live RmlUi context.
 * @param {object} options Random source and application exit request.
 * @param {Function} options.random Uniform random values in [0, 1).
 * @param {Function} options.requestExit Stop the backend loop.
 * @return {object} Document, native-key handler and shutdown hook.
 */
function createVariables(context, {
  random = Math.random, requestExit = () => {},
} = {}) {
  const document = context.loadDocument('basic/variables/data/variables.rml');
  document.show();
  context.activateTheme('dark', true);

  function applyTheme(name) {
    context.activateTheme('dark', false);
    context.activateTheme('high-contrast', false);
    if (name) {
      context.activateTheme(name, true);
    }
    rmlui.Log.message(rmlui.LogType.Info, 'Active theme: %s',
      name ?? 'default');
  }

  function randomizeAccent() {
    const hue = Math.floor(random() * 360);
    const saturation = 0.78 + Math.floor(random() * 23) * 0.01;
    const lightness = context.isThemeActive('high-contrast') ? 0.5
      : (context.isThemeActive('dark') ? 0.58 : 0.36)
        + Math.floor(random() * 14) * 0.01;
    const amplitude = saturation * Math.min(lightness, 1 - lightness);
    const channels = [ 0, 8, 4 ].map(n => {
      const k = (n + hue / 30) % 12;
      const value = lightness - amplitude *
        Math.max(-1, Math.min(k - 3, 9 - k, 1));
      return Math.round(value * 255).toString(16).padStart(2, '0');
    });
    const color = `#${channels.join('')}`;
    document.setProperty('--accent', color);
    rmlui.Log.message(rmlui.LogType.Info,
      'Accent override set to %s (HSL %.0f/%.2f/%.2f, use \'C\' to clear)',
      color, hue, saturation, lightness);
  }

  function processKey(key, modifiers, nativeRatio, priority) {
    const keys = rmlui.KeyIdentifier;
    switch (key) {
      case keys.KI_1:
        applyTheme('dark');
        break;
      case keys.KI_2:
        applyTheme(null);
        break;
      case keys.KI_3:
        applyTheme('high-contrast');
        break;
      case keys.KI_R:
        randomizeAccent();
        break;
      case keys.KI_C:
        document.removeProperty('--accent');
        rmlui.Log.message(rmlui.LogType.Info,
          'Accent override cleared, falling back to RCSS-declared value');
        break;
      case keys.KI_ESCAPE:
        requestExit();
        break;
      default:
        return processKeyDownShortcuts(context, key, modifiers, nativeRatio,
          priority);
    }
    return false;
  }

  return { document, processKey, close: () => document.close() };
}

module.exports = { createVariables };
