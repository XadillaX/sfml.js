'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

test('Cocoa delivers claimed text keys to one input client', {
  skip: process.platform !== 'darwin',
}, () => {
  const root = path.resolve(__dirname, '..');
  const output = path.join(os.tmpdir(), 'sfmljs-interop-contracts');
  mkdirSync(output, { recursive: true });
  const executable = path.join(output, 'macos-text-input');
  const sdk = path.join(root, 'third_party/sfml');
  const library = path.join(sdk, 'lib');
  const build = spawnSync(process.env.CXX || 'c++', [
    '-std=c++17',
    '-I', path.join(root, 'include'), '-I', path.join(sdk, 'include'),
    path.join(root, 'test/native/macos-text-input.mm'), '-o', executable,
    '-L', library, '-lsfml-window', '-lsfml-system',
    `-Wl,-rpath,${library}`, '-framework', 'AppKit',
  ], { cwd: root, encoding: 'utf8', timeout: 60000 });
  assert.equal(build.error, undefined);
  assert.equal(build.status, 0, build.stdout + build.stderr);
  const run = spawnSync(executable, [], {
    cwd: root, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(run.error, undefined);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(run.stdout.match(/^PASS /gm)?.length, 5);
  process.stdout.write(run.stdout);
});
