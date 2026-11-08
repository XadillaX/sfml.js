'use strict';

const fs = require('node:fs');
const path = require('node:path');

const interop = require('../paths.js');
const contractHeader = path.join(interop.include, 'sfml-js-interop.h');

/**
 * Verify the contract header and the SFML SDK so a release never ships a
 * half-installed package.
 */
function main() {
  const text = fs.readFileSync(contractHeader, 'utf8');
  const match = text.match(/#define SFMLJS_INTEROP_VERSION (\d+)/);
  if (!match) {
    throw new Error('sfml-js-interop.h is missing SFMLJS_INTEROP_VERSION');
  }
  for (const [ name, directory ] of Object.entries({
    include: interop.sfmlInclude, lib: interop.sfmlLib,
  })) {
    if (!fs.existsSync(directory)) {
      throw new Error(`SFML ${name} is missing at ${directory}`);
    }
  }
  console.log(`[sfml.js-interop] contract version ${match[1]}`);
}

main();
