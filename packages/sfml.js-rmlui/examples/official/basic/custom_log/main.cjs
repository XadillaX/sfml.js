'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const rmlui = require('../../../../dist');
const { SystemInterface } = require('./system-interface.cjs');

/**
 * Select custom_log's system interface before RmlUi initialization.
 * @param {object} options Existing window and optional explicit log path.
 * @param {object} options.window Existing SFML window.
 * @param {string} [options.logFile] Explicit log destination.
 * @return {object} Native system owner, log path and shutdown hook.
 */
function prepare({ window, logFile }) {
  const filename = logFile ?? path.join(fs.mkdtempSync(
    path.join(os.tmpdir(), 'sfml-rmlui-custom-log-')), 'log.txt');
  const logger = new SystemInterface(window, filename);
  try {
    rmlui.setSystemInterface(logger.system);
  } catch (error) {
    logger.close();
    throw error;
  }
  return { logger, logFile: filename, close: () => logger.close() };
}

/**
 * Trigger the original missing-document error and display assets/demo.rml.
 * @param {object} context Live RmlUi context.
 * @return {object} Original document and shutdown hook.
 */
function createCustomLog(context) {
  try {
    const invalid = context.loadDocument('assets/invalid.rml');
    invalid.close();
  } catch (error) {
    // The binding turns the original null result into this checked error.
    if (error.message !== 'Failed to load Rml document') {
      throw error;
    }
  }

  const document = context.loadDocument('assets/demo.rml');
  document.show();
  return { document, close: () => document.close() };
}

module.exports = { prepare, createCustomLog };
