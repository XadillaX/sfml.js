'use strict';

const fs = require('node:fs');
const sfml = require('sfml.js');
const rmlui = require('../../../../dist');

// Rml::SystemInterface's default clipboard is local to the application.
let clipboardText = '';

/** Write custom_log's original severity prefixes to an unbuffered file. */
class SystemInterface {
  /**
   * Install the native virtual callbacks and retain the log's file descriptor.
   * @param {object} window Existing SFML window.
   * @param {string} filename Explicit temporary or user-selected log path.
   */
  constructor(window, filename) {
    this.filename = filename;
    this.file = null;
    this.timer = new sfml.Clock();
    try {
      this.file = fs.openSync(filename, 'w');
    } catch {
      // The original fopen failure leaves logging disabled and continues.
    }

    try {
      this.system = new rmlui.SystemInterface(window, {
        logMessage: (type, message) => this.logMessage(type, message),
        setMouseCursor() {},
        setClipboardText(text) {
          clipboardText = text;
        },
        getClipboardText() {
          return clipboardText;
        },
        activateKeyboard() {},
        deactivateKeyboard() {},
      });
      this.clock = this.system.clock;
    } catch (error) {
      this.close();
      throw error;
    }
  }

  /**
   * Match the original prefix, two-decimal timestamp and immediate write.
   * @param {number} type Native Rml::Log::Type.
   * @param {string} message Native log message.
   * @return {boolean} Continue after logging, as in the non-Win32 sample.
   */
  logMessage(type, message) {
    if (this.file !== null) {
      const prefix = type === rmlui.LogType.Error ||
        type === rmlui.LogType.Assert ? '-!-' :
        type === rmlui.LogType.Warning ? '-*-' : '---';
      // Read the shared clock directly: a System callback cannot reenter
      // RmlUi's getElapsedTime method. Default timing remains monotonic.
      const seconds = Number.isNaN(this.clock[0])
        ? this.timer.getElapsedTime().asSeconds() : this.clock[0];
      fs.writeSync(this.file, `${prefix} (${seconds.toFixed(2)}): ` +
        `${message}\n`);
    }
    return true;
  }

  /** Release the original log file after RmlUi has shut down. */
  close() {
    if (this.file !== null) {
      fs.closeSync(this.file);
      this.file = null;
    }
  }
}

module.exports = { SystemInterface };
