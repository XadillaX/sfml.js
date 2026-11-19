'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

test('native window input ownership and lifecycle', () => {
  const root = path.resolve(__dirname, '..');
  const output = path.join(os.tmpdir(), 'sfmljs-interop-contracts');
  mkdirSync(output, { recursive: true });
  const windows = process.platform === 'win32';
  const executable = path.join(output,
    `window-input-registry${windows ? '.exe' : ''}`);
  const source = path.join(root, 'test/native/window-input-registry.cc');
  const includes = [
    path.join(root, 'include'),
    path.join(root, 'third_party/sfml/include'),
  ];
  const compiler = process.env.CXX || (windows ? 'cl' : 'c++');
  const args = windows ? [
    '/nologo', '/std:c++17', '/EHsc', '/DNOMINMAX',
    ...includes.map(directory => `/I${directory}`),
    source, `/Fe${executable}`,
    `/Fo${path.join(output, 'window-input-registry.obj')}`,
  ] : [
    '-std=c++17', ...includes.flatMap(directory => [ '-I', directory ]),
    source, '-o', executable,
  ];
  const build = spawnSync(compiler, args, {
    cwd: root, encoding: 'utf8', timeout: 60000,
  });
  assert.equal(build.error, undefined);
  assert.equal(build.status, 0, build.stdout + build.stderr);
  const run = spawnSync(executable, [], {
    cwd: root, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(run.error, undefined);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(run.stdout.match(/^PASS /gm)?.length, 9);
  process.stdout.write(run.stdout);
});
