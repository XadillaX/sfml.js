'use strict';

const { spawnSync } = require('node:child_process');
const { readdirSync } = require('node:fs');
const { resolve } = require('node:path');

// 枚举测试文件，避免依赖 shell 通配符；串行运行以隔离图形和音频设备。
const root = resolve(__dirname, '..');
const files = readdirSync(resolve(root, 'test'))
  .filter(name => name.endsWith('.test.cjs'))
  .sort()
  .map(name => resolve(root, 'test', name));
if (files.length === 0) throw new Error('No runtime tests found');

const result = spawnSync(process.execPath, [
  '--expose-gc', '--test', '--test-concurrency=1', ...files,
], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
