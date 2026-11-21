'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const root = path.resolve(__dirname, '../../..');
const interopRoot = path.resolve(__dirname, '..');

for (const name of [ 'sfml.js', 'sfml.js-imgui' ]) {
  test(`${name} installs through its SDK preparation and shipped builder`, () => {
    const manifest = require(path.join(root, 'packages', name, 'package.json'));
    assert.equal(manifest.scripts.install, 'npm run build:native');
    assert.ok(manifest.scripts['prebuild:native']);
    assert.ok(manifest.scripts['build:native'].includes(
      "require('sfml.js-interop/native-build').build()"));
    assert.ok(manifest.scripts['postbuild:native'].includes(
      "require('sfml.js-interop/native-build').configureLsp()"));
    assert.ok(!Object.values(manifest.scripts).some(script =>
      script.includes('../../tools/')));
  });
}

/**
 * Execute the shipped builder entirely in memory using an installed layout.
 * No package directory, dependency tree, or native build environment is copied.
 * @param {string} platform Platform whose GYP generator should be selected.
 * @param {number} failure Optional failing child exit status.
 * @return {object} Builder, child calls and process exit state.
 */
function installedBuilder(platform, failure = 0) {
  const calls = [];
  const state = {
    platform,
    execPath: process.execPath,
    cwd: () => path.resolve('/consumer/node_modules/sfml.js'),
  };
  const modules = {
    'node:path': path,
    'node:fs': {
      existsSync: () => false,
      readFileSync() {
        assert.fail('An installed package must not read repository metadata');
      },
    },
    'node:child_process': {
      spawnSync(executable, args, options) {
        calls.push({ executable, args, options });
        return { status: failure };
      },
    },
  };
  const resolve = (name, options) => {
    assert.equal(name, 'node-gyp/bin/node-gyp.js');
    assert.deepEqual(Array.from(options.paths), [ state.cwd() ]);
    return path.resolve('/consumer/node_modules/node-gyp/bin/node-gyp.js');
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(
    path.join(interopRoot, 'tools/native-build.cjs'), 'utf8'), {
    module,
    process: state,
    require: Object.assign(name => modules[name], { resolve }),
  });
  return { builder: module.exports, calls, state };
}

for (const platform of [ 'darwin', 'linux', 'win32' ]) {
  test(`installed builder works without repository tools on ${platform}`, () => {
    const { builder, calls, state } = installedBuilder(platform);
    builder.build();
    builder.configureLsp();
    assert.equal(calls.length, 2);
    assert.deepEqual(Array.from(calls[0].args).slice(1), [
      'configure', '--', '-f', platform === 'win32' ? 'msvs' : 'make',
      '-f', 'compile_commands_json',
    ]);
    assert.deepEqual(Array.from(calls[1].args).slice(1), [ 'build' ]);
    assert.ok(calls.every(call => call.options.cwd === state.cwd()));
  });
}

test('installed builder propagates configure failure without running build', () => {
  const { builder, calls, state } = installedBuilder('linux', 2);
  builder.build();
  assert.equal(calls.length, 1);
  assert.equal(state.exitCode, 2);
});

test('interop publishes the native build entrypoint', () => {
  const manifest = require('../package.json');
  assert.equal(manifest.exports['./native-build'], './tools/native-build.cjs');
  assert.ok(manifest.files.includes('tools/native-build.cjs'));
});
