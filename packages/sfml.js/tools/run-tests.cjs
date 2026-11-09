'use strict';

const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const { resolve } = require('node:path');

// Enumerate test files without relying on shell globs. Each file runs in its
// own process, in sequence: under Node 20, "node --test file1 file2" loads
// every file in one process, so audio Worker threads and GL/X connections
// from earlier suites stay alive while later suites create and destroy
// render contexts. Xvfb's GLX rejects that context churn with BadAccess.
const root = resolve(__dirname, '..');
const files = readdirSync(resolve(root, 'test'))
  .filter(name => name.endsWith('.test.cjs'))
  .sort()
  .map(name => resolve(root, 'test', name));
if (files.length === 0) {
  throw new Error('No runtime tests found');
}

for (const file of files) {
  const result = spawnSync(process.execPath, [
    '--expose-gc', '--test', '--test-concurrency=1', file,
  ], { cwd: root, stdio: 'inherit' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
