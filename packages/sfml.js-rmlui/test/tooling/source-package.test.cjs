'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const packageRoot = path.resolve(__dirname, '../..');
const manifest = require('../../package.json');

// npm must run the dependency/bootstrap hooks before configuring binding.gyp.
assert.equal(manifest.scripts.install, 'npm run build:native');
assert.match(manifest.scripts['prebuild:native'],
  /^npm run download:deps && node tools\/codegen\//);
for (const name of [
  'download:deps', 'prebuild:native', 'build:native', 'postbuild:native',
]) {
  const script = manifest.scripts[name];
  assert.ok(!script.includes('../'), `${name} must stay inside the package`);
  for (const match of script.matchAll(/\bnode ([\w./-]+\.cjs)\b/g)) {
    assert.ok(fs.existsSync(path.join(packageRoot, match[1])), match[1]);
    assert.ok(manifest.files.includes(match[1]), `${match[1]} must ship`);
  }
}
console.log('PASS source-package-bootstrap-before-native-configure');

assert.equal(manifest.scripts['update:harfbuzz'],
  'node tools/dependencies/update-harfbuzz.cjs');
assert.ok(manifest.files.includes('vendor/harfbuzz/'));
const gyp = fs.readFileSync(path.join(packageRoot, 'binding.gyp'), 'utf8');
assert.ok(gyp.includes('"vendor/harfbuzz/src/harfbuzz.cc"'));
assert.ok(!gyp.includes('third_party/harfbuzz'));
console.log('PASS source-package-uses-vendored-harfbuzz');
for (const name of [ 'freetype', 'rlottie', 'rmlui' ]) {
  assert.ok(manifest.files.includes(`vendor/${name}/`));
  assert.ok(gyp.includes(`vendor/${name}/`));
  assert.ok(!gyp.includes(`third_party/${name}/`));
  assert.equal(manifest.scripts[`update:${name}`],
    `node tools/dependencies/update-vendored.cjs ${name}`);
}
console.log('PASS source-package-uses-vendored-runtime-dependencies');

/**
 * Execute the real helper with process/file boundaries replaced in memory.
 * No package copy, installation or separate build directory is created.
 * @param {string} name Package-local helper filename.
 * @param {object} options Boundary behavior for this invocation.
 * @return {object} Recorded processes and exit status.
 */
function runHelper(name, options = {}) {
  const filename = path.join(packageRoot, 'tools/build', name);
  const location = options.location || packageRoot;
  const calls = [];
  const processState = {
    execPath: process.execPath,
    platform: options.platform || process.platform,
    cwd: () => assert.fail('Helpers must locate their owning package'),
  };
  const localRequire = id => {
    if (id === 'node:child_process') {
      return {
        spawnSync(executable, args, spawnOptions) {
          calls.push({ executable, args, options: spawnOptions });
          return options.result || { status: 0 };
        },
      };
    }
    if (id === 'node:fs') {
      return {
        existsSync: () => !!options.repository,
        readFileSync() {
          assert.ok(!options.noRepositoryRead,
            'Installed packages must not read unrelated Rush metadata');
          return JSON.stringify({
            projects: [{
              packageName: options.foreign ? 'other' : manifest.name,
              projectFolder: 'packages/sfml.js-rmlui',
            }],
          });
        },
      };
    }
    return require(id);
  };
  localRequire.resolve = (id, resolveOptions) => {
    assert.equal(id, 'node-gyp/bin/node-gyp.js');
    assert.deepEqual(Array.from(resolveOptions.paths), [ location ]);
    return '/resolved/node-gyp.js';
  };
  const moduleState = { exports: {} };
  localRequire.main = moduleState;
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    __dirname: path.join(location, 'tools/build'),
    require: localRequire,
    module: moduleState,
    process: processState,
    console: { log() {}, error() {} },
  }, { filename });
  // Objects from the VM have different prototypes; compare plain snapshots.
  return JSON.parse(JSON.stringify({
    calls, exitCode: processState.exitCode || 0,
  }));
}

for (const platform of [ 'darwin', 'linux', 'win32' ]) {
  const result = runHelper('native-build.cjs', { platform });
  assert.equal(result.exitCode, 0);
  assert.equal(result.calls.length, 2);
  assert.deepEqual(result.calls[0].args, [
    '/resolved/node-gyp.js', 'configure', '--', '-f',
    platform === 'win32' ? 'msvs' : 'make',
    '-f', 'compile_commands_json',
  ]);
  assert.deepEqual(result.calls[1].args, [ '/resolved/node-gyp.js', 'build' ]);
  for (const call of result.calls) {
    assert.equal(call.executable, process.execPath);
    assert.equal(call.options.cwd, packageRoot);
    assert.equal(call.options.stdio, 'inherit');
  }
  console.log(`PASS source-package-${platform}-native-build-generators`);
}

const configureFailure = runHelper('native-build.cjs', {
  result: { status: 9 },
});
assert.equal(configureFailure.calls.length, 1);
assert.equal(configureFailure.exitCode, 9);
const spawnFailure = runHelper('native-build.cjs', {
  result: { error: new Error('Compiler unavailable'), status: null },
});
assert.equal(spawnFailure.calls.length, 1);
assert.equal(spawnFailure.exitCode, 1);
console.log('PASS source-package-build-failure-stops-sequence');

for (const options of [{}, { repository: true, foreign: true }]) {
  const result = runHelper('configure-lsp.cjs', options);
  assert.equal(result.exitCode, 0);
  assert.equal(result.calls.length, 1);
  assert.deepEqual(result.calls[0].args, [
    path.join(packageRoot, 'tools/build/compile-lua-cxx.cjs'),
    '--fix-compile-database',
  ]);
}
console.log('PASS source-package-lsp-without-repository-tools');

const installedRoot = path.resolve('/consumer/node_modules/sfml.js-rmlui');
const installed = runHelper('configure-lsp.cjs', {
  location: installedRoot, repository: true, noRepositoryRead: true,
});
assert.equal(installed.exitCode, 0);
assert.equal(installed.calls.length, 1);
assert.equal(installed.calls[0].options.cwd, installedRoot);
assert.equal(installed.calls[0].args[0],
  path.join(installedRoot, 'tools/build/compile-lua-cxx.cjs'));
console.log('PASS source-package-installed-layout-ignores-unrelated-rush');

const repository = runHelper('configure-lsp.cjs', { repository: true });
assert.equal(repository.exitCode, 0);
assert.equal(repository.calls.length, 2);
assert.deepEqual(repository.calls[1].args, [
  path.resolve(packageRoot, '../../tools/configure-lsp.cjs'),
]);
const luaFailure = runHelper('configure-lsp.cjs', {
  repository: true, result: { status: 7 },
});
assert.equal(luaFailure.calls.length, 1);
assert.equal(luaFailure.exitCode, 7);
console.log('PASS source-package-lsp-fix-before-optional-repository-merge');
