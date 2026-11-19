'use strict';

const {
  loadApplication, scoresPath,
} = require('../shell/native-application.cjs');

/**
 * Host the original native Invaders game and event handlers.
 * @param {object} context Main RmlUi context.
 * @param {object} options Exit callback and score storage.
 * @return {object} Application lifecycle and copied game state.
 */
function createInvaders(context, options = {}) {
  const native = loadApplication('invaders');
  native.start(context.handle, scoresPath('invaders', options.scoresFile));
  return {
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
      native.close();
    },
  };
}

module.exports = { createInvaders };
