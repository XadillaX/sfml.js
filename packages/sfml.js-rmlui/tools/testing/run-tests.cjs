'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const directory = path.join(__dirname, '../../test');

/**
 * Collect runtime suites recursively, including every subsystem directory.
 * @param {string} root Directory to search.
 * @return {string[]} Absolute paths to runtime suites.
 */
function collectTests(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return collectTests(full);
    }

    return entry.name.endsWith('.test.cjs') ? [ full ] : [];
  });
}

const files = collectTests(directory).sort();

for (const file of files) {
  console.log(`[sfml.js-rmlui] ${path.relative(directory, file)}`);
  const result = spawnSync(process.execPath, [ file ], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`Test failed: ${result.signal ?? result.status}`);
    process.exit(result.status ?? 1);
  }
}

if (files.length === 0) {
  console.log('[sfml.js-rmlui] No runtime tests');
}
