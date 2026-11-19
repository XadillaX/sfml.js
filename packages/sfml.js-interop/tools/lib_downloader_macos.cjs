'use strict';

const { prepareWindowInput } = require('./sfml/build-window.cjs');

/**
 * Keep the existing Cocoa preparation entry point for package consumers.
 */
async function prepareMacosHighDpi() {
  if (process.platform === 'darwin') {
    await prepareWindowInput();
  }
}

module.exports = { prepareMacosHighDpi };

if (require.main === module) {
  prepareMacosHighDpi().catch(error => {
    console.error(`[sfml.js-interop] ${error.message}`);
    process.exitCode = 1;
  });
}
