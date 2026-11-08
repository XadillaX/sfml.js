'use strict';

const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const { resolve } = require('node:path');

// Enumerate test files instead of relying on shell globs.
const root = resolve(__dirname, '..');
const files = readdirSync(resolve(root, 'test'))
  .filter(name => name.endsWith('.test.cjs'))
  .sort()
  .map(name => resolve(root, 'test', name));
if (files.length === 0) throw new Error('No runtime tests found');

const result = spawnSync(process.execPath, [
  '--test', '--test-concurrency=1', ...files,
], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
