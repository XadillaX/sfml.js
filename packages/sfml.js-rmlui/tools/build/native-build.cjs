'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '../..');

/**
 * Configure the owning package and incrementally build in its existing tree.
 * Both generators run together so LSP generation does not replace build files.
 */
function main() {
  const nodeGyp = require.resolve('node-gyp/bin/node-gyp.js', {
    paths: [ packageRoot ],
  });
  const buildFormat = process.platform === 'win32' ? 'msvs' : 'make';
  for (const args of [
    [ 'configure', '--', '-f', buildFormat, '-f', 'compile_commands_json' ],
    [ 'build' ],
  ]) {
    const result = spawnSync(process.execPath, [ nodeGyp, ...args ], {
      cwd: packageRoot,
      stdio: 'inherit',
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      process.exitCode = result.status || 1;
      return;
    }
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[sfml.js-rmlui] ${error.message}`);
    process.exitCode = 1;
  }
}
