'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

test('Windows composition delivery lineage', () => {
  const root = path.resolve(__dirname, '../..');
  const output = path.join(os.tmpdir(), 'sfmljs-rmlui-ime-contracts');
  mkdirSync(output, { recursive: true });
  const windows = process.platform === 'win32';
  const executable = path.join(output,
    `windows-delivery${windows ? '.exe' : ''}`);
  const source = path.join(root,
    'test/native/platform/ime/windows/windows-delivery-contracts.cc');
  const args = windows ? [
    '/nologo', '/std:c++20', '/EHsc', `/I${root}`,
    source, `/Fe${executable}`,
    `/Fo${path.join(output, 'windows-delivery.obj')}`,
  ] : [ '-std=c++20', '-I', root, source, '-o', executable ];
  const build = spawnSync(process.env.CXX || (windows ? 'cl' : 'c++'), args, {
    cwd: root, encoding: 'utf8', timeout: 60000,
  });
  assert.equal(build.error, undefined);
  assert.equal(build.status, 0, build.stdout + build.stderr);
  const run = spawnSync(executable, [], {
    cwd: root, encoding: 'utf8', timeout: 10000,
  });
  assert.equal(run.error, undefined);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(run.stdout.match(/^PASS /gm)?.length, 3);
  process.stdout.write(run.stdout);
});
