'use strict';

// Configures and builds the native addon of the invoking package.
//
// Runs from an npm script (via `node ../../tools/native-build.cjs`), so
// process.cwd() is the package root that owns binding.gyp.
//
// Configure generates both the platform build files and compile_commands.json
// in a single pass. Building then stays incremental, and the LSP database is
// refreshed as a side effect of every build -- no second `node-gyp configure`
// with a different generator (which rewrites the build tree and discards the
// compiled addon).

const { spawnSync } = require('node:child_process');

const packageRoot = process.cwd();
const nodeGyp = require.resolve('node-gyp/bin/node-gyp.js', { paths: [ packageRoot ] });
const buildFormat = process.platform === 'win32' ? 'msvs' : 'make';

function run(args) {
  const result = spawnSync(process.execPath, [ nodeGyp, ...args ], {
    cwd: packageRoot,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// node-gyp only injects its default generator when no -f is present, so both
// generators must be named explicitly. GYP accepts -f multiple times.
run([ 'configure', '--', '-f', buildFormat, '-f', 'compile_commands_json' ]);
run([ 'build' ]);
