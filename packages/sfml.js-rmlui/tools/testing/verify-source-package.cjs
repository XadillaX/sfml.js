'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const {
  validateHarfBuzzSource,
} = require('../dependencies/harfbuzz-source.cjs');
const {
  validateVendoredSource,
} = require('../dependencies/vendored-source.cjs');
const optionalDependencies =
  require('../dependencies/optional-dependencies.json');
const sourceDependencies = require('../dependencies/source-dependencies.json');

const packageRoot = path.resolve(__dirname, '../..');
const manifest = require('../../package.json');
assert.ok(process.env.npm_execpath, 'Run this verifier through npm');
const result = spawnSync(process.execPath, [
  process.env.npm_execpath, 'pack', '--dry-run', '--json',
], { cwd: packageRoot, encoding: 'utf8' });
assert.equal(result.error, undefined);
assert.equal(result.status, 0, result.stderr);
const packed = JSON.parse(result.stdout)[0];
const files = new Set(packed.files.map(file => file.path));
const required = [
  'dist/index.js', 'dist/index.d.ts', 'binding.gyp',
  'examples/official.cjs',
  'examples/official/shell/applications.gypi',
  'examples/official/shell/application-target.gypi',
  'examples/official/shell/native-application.cc',
  'examples/official/shell/native-application.cjs',
  'examples/official/invaders/native/high-scores.cc',
  'examples/official/lua_invaders/native/high-scores.cc',
  'vendor/harfbuzz/upstream.json',
];
for (const script of [
  'download:deps', 'prebuild:native', 'build:native', 'postbuild:native',
  'prebuild:ts',
  'update:harfbuzz', 'update:rmlui', 'update:freetype', 'update:rlottie',
  'download:examples', 'download:ime-fonts',
]) {
  for (const match of manifest.scripts[script]
    .matchAll(/\bnode ([\w./-]+\.cjs)\b/g)) {
    required.push(match[1]);
  }
}

// Follow every static package-local require used by install/build helpers.
// This catches a missing patch or helper even when its entry script ships.
const visited = new Set();
while (required.length > 0) {
  const filename = required.pop();
  if (visited.has(filename)) {
    continue;
  }
  assert.ok(files.has(filename), `Missing packaged file: ${filename}`);
  visited.add(filename);
  if (!filename.endsWith('.cjs')) {
    continue;
  }
  const source = fs.readFileSync(path.join(packageRoot, filename), 'utf8');
  for (const match of source.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)) {
    const resolved = require.resolve(
      path.resolve(packageRoot, path.dirname(filename), match[1]));
    required.push(path.relative(packageRoot, resolved)
      .split(path.sep).join('/'));
  }
}
assert.ok(![ ...files ].some(file =>
  file.startsWith('build/') || file.startsWith('third_party/')));
/**
 * Verify every retained source ships and no unvalidated vendor payload ships.
 */
async function validateSourceInventory() {
  const dependencies = {
    ...sourceDependencies,
    rlottie: optionalDependencies.rlottie,
    harfbuzz: optionalDependencies.harfbuzz,
  };
  let count = 0;
  for (const [ name, dependency ] of Object.entries(dependencies)) {
    const root = path.join(packageRoot, dependency.source);
    const snapshot = name === 'harfbuzz'
      ? await validateHarfBuzzSource(root, dependency)
      : await validateVendoredSource(root, name, dependency);
    assert.ok(files.has(`${dependency.source}/upstream.json`));
    for (const filename of snapshot.files) {
      assert.ok(files.has(`${dependency.source}/${filename}`),
        `Missing packaged ${name} source: ${filename}`);
    }
    assert.equal([ ...files ].filter(file =>
      file.startsWith(`${dependency.source}/`)).length,
    snapshot.files.length + 1);
    count += snapshot.files.length;
  }
  console.log(`PASS source package ${packed.name}@${packed.version}: ` +
    `${files.size} files, ${visited.size} install/build/application ` +
    `entries, ${count} vendored source files`);
}

validateSourceInventory().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
