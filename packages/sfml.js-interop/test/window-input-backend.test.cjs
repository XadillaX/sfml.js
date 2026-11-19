'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdirSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

test('input protocol resolves from the already loaded SFML Window', () => {
  const root = path.resolve(__dirname, '..');
  const output = path.join(os.tmpdir(), 'sfmljs-interop-contracts');
  mkdirSync(output, { recursive: true });
  const windows = process.platform === 'win32';
  const executable = path.join(output,
    `window-input-backend${windows ? '.exe' : ''}`);
  const sdk = path.join(root, 'third_party/sfml');
  const source = path.join(root, 'test/native/window-input-backend.cc');
  const includes = [ path.join(root, 'include'), path.join(sdk, 'include') ];
  const library = path.join(sdk, 'lib');
  const args = windows ? [
    '/nologo', '/std:c++17', '/EHsc', '/DNOMINMAX',
    ...includes.map(directory => `/I${directory}`),
    source, `/Fe${executable}`,
    `/Fo${path.join(output, 'window-input-backend.obj')}`,
    '/link', `/LIBPATH:${library}`, 'sfml-window.lib', 'sfml-system.lib',
  ] : [
    '-std=c++17', ...includes.flatMap(directory => [ '-I', directory ]),
    source, '-o', executable, '-L', library,
    '-lsfml-window', '-lsfml-system', `-Wl,-rpath,${library}`,
    ...(process.platform === 'linux' ? [ '-ldl', '-lX11' ] : []),
  ];
  const build = spawnSync(process.env.CXX || (windows ? 'cl' : 'c++'),
    args, { cwd: root, encoding: 'utf8', timeout: 60000 });
  assert.equal(build.error, undefined);
  assert.equal(build.status, 0, build.stdout + build.stderr);
  const run = spawnSync(executable, [], {
    cwd: root, encoding: 'utf8', timeout: 10000,
    env: {
      ...process.env,
      ...(windows ? {
        PATH: `${path.join(sdk, 'bin')}${path.delimiter}${process.env.PATH}`,
      } : {}),
    },
  });
  assert.equal(run.error, undefined);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const contracts = { darwin: 3, linux: 7, win32: 9 };
  assert.equal(run.stdout.match(/^PASS /gm)?.length,
    contracts[process.platform]);
  process.stdout.write(run.stdout);
});
