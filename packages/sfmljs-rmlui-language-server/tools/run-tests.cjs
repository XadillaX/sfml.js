'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const directory = path.join(__dirname, '../test');
const files = fs.readdirSync(directory)
  .filter(file => file.endsWith('.test.cjs'))
  .sort();

for (const file of files) {
  console.log(`[sfmljs-rmlui-language-server] ${file}`);
  const result = spawnSync(process.execPath, [ path.join(directory, file) ], {
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error(`Test failed: ${result.signal ?? result.status}`);
    process.exit(result.status ?? 1);
  }
}

if (files.length === 0) {
  console.log('[sfmljs-rmlui-language-server] No runtime tests');
}
