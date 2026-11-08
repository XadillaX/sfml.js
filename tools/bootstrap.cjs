'use strict';

// One-command setup after cloning the repository:
//
//   node tools/bootstrap.cjs
//
// Installs all workspace dependencies, then builds every package in Rush's
// dependency order. The build downloads the SFML SDK, compiles the native
// addons (which also emit compile_commands.json), builds TypeScript, and
// refreshes the root LSP database. Nothing else is required.

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const rush = path.join(root, 'common/scripts/install-run-rush.js');

if (!fs.existsSync(rush)) {
  console.error(`Cannot find ${rush}. Run this script from a full repository checkout.`);
  process.exit(1);
}

for (const args of [ [ 'install' ], [ 'build' ] ]) {
  const result = spawnSync(process.execPath, [ rush, ...args ], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
