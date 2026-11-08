'use strict';

/**
 * Test-only preload for Xvfb. The virtual X server rejects some of ImGui's
 * system cursors (BadCursor on X_ChangeWindowAttributes), so forbid the
 * backend from touching the system mouse cursor.
 *
 * imgui-sfml creates a separate ImGui context per window and switches the
 * current context inside Init. Patching Update would miss windows that are
 * not current at frame time, so the flag is applied to each context right
 * after Init, before any frame can call updateMouseCursor.
 */

const imgui = require('../dist');

const init = imgui.SFML.Init;
const { NoMouseCursorChange } = imgui.ImGui.ImGuiConfigFlags;

imgui.SFML.Init = function patchInit(window, loadDefaultFont) {
  const initialized = init.call(this, window, loadDefaultFont);
  if (initialized) {
    // Tests never set application config flags, so a fresh context reads 0.
    const io = imgui.SFML.GetIO();
    io.configFlags = NoMouseCursorChange;
  }
  return initialized;
};
