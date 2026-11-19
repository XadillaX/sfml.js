'use strict';

/**
 * Bundles the VSCode client and the sibling language server with esbuild.
 *
 * Both entries are emitted into dist/ so the packaged extension has no
 * runtime node_modules dependency: vscode stays external, everything else
 * is inlined.
 */

const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const root = path.join(__dirname, '..');
const serverRoot = path.join(root, '../sfmljs-rmlui-language-server');
const outDir = path.join(root, 'dist');
fs.rmSync(outDir, { recursive: true, force: true });

/**
 * Builds both bundles sequentially and fails the process on errors.
 *
 * @return {Promise<void>} Resolves when both bundles are written.
 */
async function main() {
  const shared = {
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    sourcemap: true,
    external: [ 'vscode' ],
    logLevel: 'info',
  };

  await esbuild.build({
    ...shared,
    entryPoints: [ path.join(root, 'src/extension.ts') ],
    outfile: path.join(root, 'dist/extension.js'),
  });

  await esbuild.build({
    ...shared,
    entryPoints: [ path.join(serverRoot, 'src/server.ts') ],
    outfile: path.join(root, 'dist/server/server.js'),
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
