'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const result = spawnSync('python3', [
  path.join(root, 'test/native/platform/build-x11-headers.py'),
], { cwd: root, encoding: 'utf8', timeout: 180000 });

process.stdout.write(result.stdout ?? '');
assert.equal(result.error, undefined);
assert.equal(result.signal, null);
assert.equal(result.status, 0, result.stdout + result.stderr);
if (!result.stdout.startsWith('SKIP ')) {
  assert.equal(result.stdout.match(/^PASS real Xlib declarations/gm)?.length,
    4);
}
