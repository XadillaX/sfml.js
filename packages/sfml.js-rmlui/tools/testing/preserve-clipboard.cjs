'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/**
 * Run a macOS test while retaining every native pasteboard item and type.
 * The snapshot remains in the wrapper's memory and is verified after restore.
 * @param {string} script - Absolute path to the current test script.
 * @return {number} Child exit status, including restoration errors.
 */
function runWithPreservedClipboard(script) {
  assert.equal(process.platform, 'darwin');
  const output = path.join(os.tmpdir(), 'sfmljs-rmlui-ime-contracts');
  fs.mkdirSync(output, { recursive: true });
  const executable = path.join(output, 'preserve-clipboard');
  const source = path.resolve(__dirname,
    '../../test/native/platform/macos/preserve-clipboard.mm');
  const sourceTime = fs.statSync(source).mtimeMs;
  if (!fs.existsSync(executable) ||
      fs.statSync(executable).mtimeMs < sourceTime) {
    const build = spawnSync('xcrun', [
      'clang++', '-std=c++20', '-framework', 'AppKit', source,
      '-o', executable,
    ], { encoding: 'utf8', timeout: 30000 });
    assert.equal(build.error, undefined);
    assert.equal(build.status, 0, build.stderr);
  }

  const result = spawnSync(executable, [
    process.execPath, ...process.execArgv, script, ...process.argv.slice(2),
  ], { stdio: 'inherit' });
  assert.equal(result.error, undefined);
  return result.status ?? 1;
}

module.exports = { runWithPreservedClipboard };
