'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const directory = path.join(__dirname, '../test');
const files = fs.readdirSync(directory)
  .filter(file => file.endsWith('.test.cjs'))
  .sort();

for (const file of files) {
  console.log(`[sfml.js-imgui] ${file}`);
  const result = spawnSync(process.execPath, [ path.join(directory, file) ], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (files.length === 0) {
  console.log('[sfml.js-imgui] No runtime tests');
}
