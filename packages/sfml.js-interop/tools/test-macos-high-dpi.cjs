'use strict';

const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { prepareMacosHighDpi } = require('./lib_downloader_macos.cjs');
const { root, sfmlInclude, sfmlLib } = require('../paths');

async function main() {
  if (process.platform !== 'darwin') {
    return;
  }
  await prepareMacosHighDpi();
  const output = path.join(os.tmpdir(), `sfml-high-dpi-test-${process.arch}`);
  const result = spawnSync('clang++', [
    '-std=c++20', '-Wno-deprecated-declarations',
    path.join(root, 'test/macos-high-dpi.mm'),
    `-I${sfmlInclude}`, `-L${sfmlLib}`,
    '-lsfml-graphics', '-lsfml-window', '-lsfml-system',
    '-framework', 'AppKit', `-Wl,-rpath,${sfmlLib}`, '-o', output,
  ], { stdio: 'inherit' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Retina test compilation failed: ${result.status}`);
  }
  const test = spawnSync(output, [], { stdio: 'inherit' });
  if (test.error) {
    throw test.error;
  }
  process.exitCode = test.status ?? 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
