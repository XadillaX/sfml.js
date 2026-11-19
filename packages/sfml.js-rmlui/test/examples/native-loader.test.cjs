'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const packageRoot = path.resolve(__dirname, '../..');
for (const name of [ 'invaders', 'lua_invaders' ]) {
  assert.ok(fs.existsSync(path.join(packageRoot, 'build/Release',
    `${name}.node`)), `The package build must include original ${name}`);
}

// Launching an already built application must not require another compiler,
// Python installation, or a separately created build directory.
const originalSpawn = childProcess.spawnSync;
childProcess.spawnSync = () => assert.fail('Loading must not run a compiler');
try {
  const { loadApplication } = require(
    '../../examples/official/shell/native-application.cjs');
  assert.throws(() => loadApplication('../invaders'), /Unknown application/);
  for (const name of [ 'invaders', 'lua_invaders' ]) {
    const application = loadApplication(name);
    assert.equal(typeof application.start, 'function');
    assert.equal(typeof application.close, 'function');
    assert.equal(typeof application.readState, 'function');
    assert.equal(loadApplication(name), application);
    const filename = path.join(packageRoot, 'build/Release', `${name}.node`);
    assert.equal(require.cache[filename].exports, application);
    assert.throws(() => application.readState(), /initialised|initialized/);
    console.log(`PASS ${name}-package-native-loader-without-compiler`);
  }
} finally {
  childProcess.spawnSync = originalSpawn;
}
