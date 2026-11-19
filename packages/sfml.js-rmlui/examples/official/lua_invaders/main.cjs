'use strict';

const path = require('node:path');
const { LuaScriptHost } = require('../../../dist');
const {
  luaScriptHostHandle,
} = require('../../../dist/scripting/lua/lua-scripts');
const {
  loadApplication, scoresPath,
} = require('../shell/native-application.cjs');

/**
 * Host the original Lua scripts and native Lua Invaders game.
 * @param {object} context Original main context.
 * @param {object} options Exit callback and score storage.
 * @return {object} Application lifecycle, shared Lua VM and game state.
 */
function createInvaders(context, options = {}) {
  const native = loadApplication('lua_invaders');
  const host = new LuaScriptHost({ allowInline: true, allowExternal: true });
  const scoresFile = scoresPath('lua_invaders', options.scoresFile);
  // Preserve the original io.open calls while locating application settings
  // beside the selected score file, outside the source repository.
  host.setGlobal('options_file', path.join(path.dirname(scoresFile),
    'options.dat'));
  host.execute(`
    do
      local open = io.open
      local selected = options_file
      io.open = function(filename, ...)
        if filename == "options.dat" then filename = selected end
        return open(filename, ...)
      end
      options_file = nil
    end
  `, 'official-lua-file-interface.lua');
  context.setScriptHost(host);
  native.start(context.handle, scoresFile,
    luaScriptHostHandle(host));
  host.executeFile('lua_invaders/lua/start.lua');
  return {
    host,
    get document() {
      return context.getDocument('game_window') ?? context.getDocument(0);
    },
    get state() {
      return native.readState();
    },
    update() {
      if (native.readState().exitRequested) {
        options.requestExit?.();
      }
    },
    close() {
      if (native.close()) {
        context.setScriptHost(null);
      }
    },
  };
}

module.exports = { createInvaders };
