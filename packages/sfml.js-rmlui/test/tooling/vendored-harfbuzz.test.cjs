'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const {
  updateHarfBuzz, selectMembers,
} = require('../../tools/dependencies/update-harfbuzz.cjs');
const {
  validateHarfBuzzSource,
} = require('../../tools/dependencies/harfbuzz-source.cjs');

// Keep archive bytes unchanged on Windows with Git's automatic CRLF handling.
const repositoryRoot = path.resolve(__dirname, '../../../..');
const sourcePath = 'packages/sfml.js-rmlui/vendor/harfbuzz/src/hb.h';
const gitInput = Buffer.from('upstream line\r\n');
const gitOptions = {
  cwd: repositoryRoot, encoding: 'utf8', input: gitInput,
};
const rawHash = spawnSync('git', [ 'hash-object', '--no-filters', '--stdin' ],
  gitOptions);
const filteredHash = spawnSync('git', [
  '-c', 'core.autocrlf=true', 'hash-object', `--path=${sourcePath}`, '--stdin',
], gitOptions);
assert.equal(rawHash.status, 0, rawHash.stderr);
assert.equal(filteredHash.status, 0, filteredHash.stderr);
assert.equal(filteredHash.stdout, rawHash.stdout,
  'Vendored archive bytes must bypass automatic line-ending conversion');
console.log('PASS vendored-harfbuzz-preserves-bytes-with-git-autocrlf');

/**
 * Build a small upstream archive with runtime sources and excluded fixtures.
 * @param {string} directory Temporary fixture directory.
 * @param {string} [version] Upstream release version.
 * @return {Promise<object>} Archive path and pinned upstream identity.
 */
async function makeArchive(directory, version = '15.1.0') {
  const root = path.join(directory, 'upstream');
  const files = {
    COPYING: 'upstream notice\n',
    'src/hb.h': '#include "hb-version.h"\n',
    'src/hb-version.h': `#define HB_VERSION_STRING "${version}"\n`,
    'src/harfbuzz.cc': '#include "hb-shape.cc"\n',
    'src/hb-shape.cc': '#include "OT/Var/VARC/VARC.hh"\n',
    'src/OT/Var/VARC/VARC.hh': '// nested shaping data\n',
    'src/test-shape.cc': '// excluded test\n',
    'src/main.cc': '// excluded utility\n',
    'src/gen-table.py': '# excluded generator\n',
    'test/fonts/font.ttf': 'excluded font data\n',
  };
  for (const [ filename, content ] of Object.entries(files)) {
    const target = path.join(root, filename);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);
  }
  const archivePath = path.join(directory, 'upstream.tar.gz');
  const result = spawnSync('tar', [
    '-czf', 'upstream.tar.gz', 'upstream',
  ], { cwd: directory, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const sha256 = createHash('sha256')
    .update(await fs.readFile(archivePath)).digest('hex');
  return {
    archivePath,
    dependency: {
      version,
      repository: 'harfbuzz/harfbuzz',
      commit: '3df40d9b98d6b32f0e4288d4ecfbb158ddb3a372',
      sha256,
      header: 'src/hb.h',
      source: 'vendor/harfbuzz',
    },
  };
}

(async () => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'harfbuzz-fixture-'));
  try {
    const fixture = await makeArchive(directory);
    const target = path.join(directory, 'vendor');
    const options = { ...fixture, target };
    await updateHarfBuzz(options);
    const snapshot = await validateHarfBuzzSource(target, fixture.dependency);
    assert.deepEqual(snapshot.files, [
      'COPYING', 'src/OT/Var/VARC/VARC.hh', 'src/harfbuzz.cc',
      'src/hb-shape.cc', 'src/hb-version.h', 'src/hb.h',
    ]);
    console.log('PASS vendored-harfbuzz-retains-recursive-runtime-sources');

    const metadata = await fs.readFile(
      path.join(target, 'upstream.json'), 'utf8');
    await updateHarfBuzz(options);
    assert.equal(await fs.readFile(path.join(target, 'upstream.json'),
      'utf8'), metadata);
    console.log('PASS vendored-harfbuzz-update-is-reproducible');

    const nextDirectory = path.join(directory, 'next-release');
    await fs.mkdir(nextDirectory);
    const next = await makeArchive(nextDirectory, '16.0.0');
    await updateHarfBuzz({ ...next, target });
    await validateHarfBuzzSource(target, next.dependency);
    await assert.rejects(validateHarfBuzzSource(target, fixture.dependency),
      /identity/i);
    await updateHarfBuzz(options);
    await validateHarfBuzzSource(target, fixture.dependency);
    console.log('PASS vendored-harfbuzz-upgrades-and-restores-pinned-release');

    const dependencyManifest = path.join(directory, 'dependencies.json');
    const previousManifest = '{"harfbuzz":{"version":"previous"}}\n';
    await fs.writeFile(dependencyManifest, previousManifest);
    const writeFile = fs.writeFile;
    let failed = false;
    fs.writeFile = async (filename, ...args) => {
      if (filename === dependencyManifest && !failed) {
        failed = true;
        throw new Error('Manifest write failure');
      }
      return writeFile(filename, ...args);
    };
    try {
      await assert.rejects(updateHarfBuzz({
        ...options, dependencyManifest,
      }), /Manifest write failure/);
    } finally {
      fs.writeFile = writeFile;
    }
    await validateHarfBuzzSource(target, fixture.dependency);
    assert.equal(await fs.readFile(dependencyManifest, 'utf8'),
      previousManifest);
    await updateHarfBuzz({ ...options, dependencyManifest });
    assert.deepEqual(JSON.parse(await fs.readFile(dependencyManifest,
      'utf8')).harfbuzz, fixture.dependency);
    console.log('PASS vendored-harfbuzz-source-and-manifest-rollback');

    await assert.rejects(updateHarfBuzz({
      ...options,
      dependency: { ...fixture.dependency, sha256: '0'.repeat(64) },
    }), /checksum mismatch/i);
    await validateHarfBuzzSource(target, fixture.dependency);
    assert.equal(await fs.readFile(path.join(target, 'upstream.json'),
      'utf8'), metadata);
    console.log('PASS vendored-harfbuzz-bad-archive-preserves-current-source');

    await assert.rejects(updateHarfBuzz({
      ...options,
      dependency: { ...fixture.dependency, version: '16.0.0' },
    }), /version/i);
    await validateHarfBuzzSource(target, fixture.dependency);
    await assert.rejects(validateHarfBuzzSource(target, {
      ...fixture.dependency, commit: '0'.repeat(40),
    }), /identity/i);
    console.log('PASS vendored-harfbuzz-rejects-upstream-identity-mismatch');

    const nested = path.join(target, 'src/OT/Var/VARC/VARC.hh');
    await fs.appendFile(nested, '// tampered\n');
    await assert.rejects(validateHarfBuzzSource(target, fixture.dependency),
      /source checksum/i);
    await updateHarfBuzz(options);
    await fs.rm(nested);
    await assert.rejects(validateHarfBuzzSource(target, fixture.dependency),
      /source checksum/i);
    console.log('PASS vendored-harfbuzz-rejects-tampered-or-missing-source');

    await updateHarfBuzz(options);
    await fs.symlink('hb.h', path.join(target, 'src/linked.h'));
    await assert.rejects(validateHarfBuzzSource(target, fixture.dependency),
      /symbolic link/i);
    console.log('PASS vendored-harfbuzz-rejects-symbolic-links');
    for (const listing of [
      '/root/src/hb.h', 'root/../src/hb.h', 'root/src\\hb.h',
      'root/src/hb.h\nother/src/hb.h',
      'root/src/hb.h\nroot/src/hb.h',
    ]) {
      assert.throws(() => selectMembers(listing),
        /Unsafe|one upstream root|Duplicate/);
    }
    console.log('PASS vendored-harfbuzz-rejects-unsafe-archive-members');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
