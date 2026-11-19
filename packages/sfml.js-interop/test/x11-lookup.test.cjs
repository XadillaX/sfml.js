'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { prepareSource } = require('../tools/sfml/prepare-source.cjs');

test('current SFML X11 branch delivers long and Unicode commits', async () => {
  const root = path.resolve(__dirname, '..');
  const source = await prepareSource();
  const output = path.join(os.tmpdir(), 'sfmljs-interop-contracts');
  mkdirSync(output, { recursive: true });
  const code = readFileSync(path.join(source,
    'src/SFML/Window/Unix/WindowImplX11.cpp'), 'utf8');
  const start = code.indexOf('// Generate TextEntered events if needed');
  const end = code.indexOf('updateLastInputTime(windowEvent.xkey.time)', start);
  assert(start >= 0 && end > start);
  writeFileSync(path.join(output, 'x11-lookup-body.inc'),
    code.slice(start, end));
  for (const [ name, marker ] of [
    [ 'focus-in', 'case FocusIn:' ],
    [ 'focus-out', 'case FocusOut:' ],
  ]) {
    const branch = code.indexOf(marker);
    const first = code.indexOf('// Update the input context', branch);
    const last = code.indexOf('// ', first + 3);
    assert(branch >= 0 && first > branch && last > first);
    writeFileSync(path.join(output, `x11-${name}-body.inc`),
      code.slice(first, last));
  }
  const windows = process.platform === 'win32';
  const executable = path.join(output, `x11-lookup${windows ? '.exe' : ''}`);
  const includes = [
    output, path.join(root, 'include'),
    path.join(source, 'src'),
    path.join(root, 'third_party/sfml/include'),
  ];
  const fixture = path.join(root, 'test/native/platform/x11-lookup.cc');
  const library = path.join(root, 'third_party/sfml/lib');
  const args = windows ? [
    '/nologo', '/std:c++17', '/EHsc', '/DNOMINMAX',
    ...includes.map(directory => `/I${directory}`), fixture,
    `/Fe${executable}`, `/Fo${path.join(output, 'x11-lookup.obj')}`,
    '/link', `/LIBPATH:${library}`, 'sfml-system.lib',
  ] : [
    '-std=c++17', ...includes.flatMap(directory => [ '-I', directory ]),
    fixture, '-o', executable, '-L', library,
    '-lsfml-system', `-Wl,-rpath,${library}`,
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
        PATH: `${path.join(root, 'third_party/sfml/bin')}` +
          `${path.delimiter}${process.env.PATH}`,
      } : {}),
    },
  });
  assert.equal(run.error, undefined);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(run.stdout.match(/^PASS /gm)?.length, 6);
  process.stdout.write(run.stdout);
});
