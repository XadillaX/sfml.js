'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

if (process.platform === 'darwin') {
  const output = path.join(os.tmpdir(), 'sfmljs-rmlui-ime-contracts');
  fs.mkdirSync(output, { recursive: true });
  const builder = path.join(__dirname,
    '../native/platform/build-ime-contracts.py');
  const result = spawnSync('python3', [ builder, output, '--cocoa' ], {
    encoding: 'utf8',
    timeout: 90000,
    cwd: path.join(__dirname, '../..'),
  });

  process.stdout.write(result.stdout ?? '');
  if (result.status !== 0) {
    process.stderr.write(result.stderr ?? '');
  }
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /PASS synthetic Cocoa keyboard routing/);
  assert.match(result.stdout, /PASS SFML disabled key repeat is preserved/);
  assert.match(result.stdout, /PASS window close cancels and recreation/);
  assert.equal(
    result.stdout.match(/PASS synthetic Cocoa \w+ (switch|blur) exception/g)
      ?.length,
    5);
} else {
  console.log('SKIP macOS Cocoa IME contracts: platform bridge unavailable');
}
