'use strict';

/**
 * Test-only preload for Xvfb. The virtual X server does not reliably support
 * ImGui's custom hidden cursor, so keep the backend from changing the system
 * mouse cursor while exercising the rest of the frame lifecycle.
 */

const imgui = require('../dist');

const update = imgui.SFML.Update;

imgui.SFML.Update = function patchUpdate(window, seconds) {
  const io = imgui.SFML.GetIO();
  io.configFlags = imgui.ImGui.ImGuiConfigFlags.NoMouseCursorChange;
  return update.call(this, window, seconds);
};
