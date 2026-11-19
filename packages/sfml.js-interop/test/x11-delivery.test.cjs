'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { prepareSource } = require('../tools/sfml/prepare-source.cjs');

/**
 * Read one complete function body from the actual prepared dependency.
 * @param {string} code Translation unit.
 * @param {string} signature Function signature.
 * @return {string|null} Body including braces.
 */
function body(code, signature) {
  const start = code.indexOf(signature);
  if (start < 0) {
    return null;
  }
  const first = code.indexOf('{', start);
  let depth = 1;
  for (let index = first + 1; index < code.length; ++index) {
    if (code[index] === '{') {
      ++depth;
    } else if (code[index] === '}' && --depth === 0) {
      return code.slice(first, index + 1);
    }
  }
  throw new Error(`Incomplete function: ${signature}`);
}

test('actual X11 collection preserves deferred native order', async () => {
  const root = path.resolve(__dirname, '..');
  const source = await prepareSource();
  const output = path.join(os.tmpdir(), 'sfmljs-interop-contracts');
  mkdirSync(output, { recursive: true });
  const code = readFileSync(path.join(source,
    'src/SFML/Window/Unix/WindowImplX11.cpp'), 'utf8');
  const collect = body(code, 'void WindowImplX11::processEvents()');
  assert(collect);
  writeFileSync(path.join(output, 'x11-collect-body.inc'),
    `void WindowImplX11::processEvents() ${collect}`);
  const deferred = body(code, 'void WindowImplX11::deferEvent(XEvent');
  if (deferred) {
    writeFileSync(path.join(output, 'x11-defer-body.inc'), deferred);
  }
  const impl = readFileSync(path.join(source,
    'src/SFML/Window/WindowImpl.cpp'), 'utf8');
  const guarded = body(impl, 'void WindowImpl::deferGuardedEvent(');
  if (guarded) {
    writeFileSync(path.join(output, 'x11-guarded-body.inc'),
      'void WindowImpl::deferGuardedEvent(' +
      'std::function<sfmljs::interop::WindowInputResult()> interpret) ' +
      guarded);
  }
  for (const [ name, signature ] of [
    [ 'poll', 'std::optional<Event> WindowImpl::pollEvent()' ],
    [ 'wait', 'std::optional<Event> WindowImpl::waitEvent(Time timeout)' ],
    [ 'pop', 'std::optional<Event> WindowImpl::popEvent()' ],
    [ 'push', 'void WindowImpl::pushEvent(const Event& event)' ],
    [ 'retire',
      'void WindowImpl::closeEventQueue(' +
      'std::shared_ptr<WindowImpl> retirement)',
    ],
    [ 'enqueue',
      'void WindowImpl::deferEvent(std::function<void()> interpret)',
    ],
  ]) {
    const selected = name === 'wait' &&
      process.env.SFMLJS_TEST_ORIGINAL_WAIT === '1'
      ? readFileSync(path.join(source, 'WindowImpl.cpp.original'), 'utf8')
      : impl;
    const code = body(selected, signature);
    assert(code, signature);
    writeFileSync(path.join(output, `x11-${name}-body.inc`),
      `${signature} ${code}`);
  }
  const windows = process.platform === 'win32';
  const executable = path.join(output, `x11-delivery${windows ? '.exe' : ''}`);
  const includes = [
    output, path.join(root, 'include'),
    path.join(root, 'third_party/sfml/include'),
  ];
  const fixture = path.join(root, 'test/native/platform/x11-delivery.cc');
  const library = path.join(root, 'third_party/sfml/lib');
  const args = windows ? [
    '/nologo', '/std:c++20', '/EHsc', '/DNOMINMAX',
    ...(deferred ? [ '/DSFMLJS_DEFERRED_DELIVERY' ] : []),
    ...(guarded ? [ '/DSFMLJS_GUARDED_DELIVERY' ] : []),
    ...includes.map(directory => `/I${directory}`), fixture,
    `/Fe${executable}`, `/Fo${path.join(output, 'x11-delivery.obj')}`,
    '/link', `/LIBPATH:${library}`, 'sfml-system.lib',
  ] : [
    '-std=c++20', ...(deferred ? [ '-DSFMLJS_DEFERRED_DELIVERY' ] : []),
    ...(guarded ? [ '-DSFMLJS_GUARDED_DELIVERY' ] : []),
    ...includes.flatMap(directory => [ '-I', directory ]),
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
