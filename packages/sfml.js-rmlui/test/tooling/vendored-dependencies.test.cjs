'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const {
  updateVendoredDependency, verifiedReleaseArchive,
} = require('../../tools/dependencies/update-vendored.cjs');
const {
  validateVendoredSource, validateSourceVersion, patchDigest,
} = require('../../tools/dependencies/vendored-source.cjs');

/**
 * Create a real archive with build inputs and unnecessary upstream payloads.
 * @param {string} directory Temporary fixture directory.
 * @param {string} version FreeType release.
 * @return {Promise<object>} Updater input.
 */
async function makeArchive(directory, version) {
  const root = path.join(directory, 'upstream');
  const [ major, minor, patch ] = version.split('.');
  const files = {
    'CMakeLists.txt': 'set(BASE_SRCS src/base/ftbase.c)\n',
    'LICENSE.TXT': 'notice\n',
    'include/ft2build.h': '#include <freetype/config/ftheader.h>\n',
    'include/freetype/freetype.h': [
      `#define FREETYPE_MAJOR ${major}`,
      `#define FREETYPE_MINOR ${minor}`,
      `#define FREETYPE_PATCH ${patch}`,
    ].join('\n'),
    'src/base/ftbase.c': '#include "nested.h"\n',
    'src/base/nested.h': '// included source\n',
    'docs/guide.pdf': 'excluded\n',
    'builds/unix/configure': 'excluded\n',
    'src/tools/generator.py': 'excluded\n',
  };
  for (const [ filename, content ] of Object.entries(files)) {
    const destination = path.join(root, filename);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, content);
  }
  const result = spawnSync('tar', [ '-czf', 'upstream.tar.gz', 'upstream' ],
    { cwd: directory, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const archivePath = path.join(directory, 'upstream.tar.gz');
  return {
    name: 'freetype', archivePath,
    dependency: {
      version, source: 'vendor/freetype', header: 'include/ft2build.h',
      url: 'https://example.invalid/upstream.tar.gz',
      sha256: createHash('sha256').update(await fs.readFile(archivePath))
        .digest('hex'),
    },
  };
}

(async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'vendor-test-'));
  try {
    const fixture = await makeArchive(directory, '2.13.3');
    const target = path.join(directory, 'vendor');
    const options = { ...fixture, target };
    await updateVendoredDependency(options);
    const snapshot = await validateVendoredSource(target, 'freetype',
      fixture.dependency);
    assert.deepEqual(snapshot.files, [
      'CMakeLists.txt', 'LICENSE.TXT', 'include/freetype/freetype.h',
      'include/ft2build.h', 'src/base/ftbase.c', 'src/base/nested.h',
    ]);
    const metadata = await fs.readFile(path.join(target, 'upstream.json'),
      'utf8');
    await updateVendoredDependency(options);
    assert.equal(await fs.readFile(path.join(target, 'upstream.json'),
      'utf8'), metadata);
    const altered = JSON.parse(metadata);
    altered.patchSha256 = '0'.repeat(64);
    await fs.writeFile(path.join(target, 'upstream.json'),
      JSON.stringify(altered));
    await assert.rejects(validateVendoredSource(target, 'freetype',
      fixture.dependency), /patch checksum/i);
    await updateVendoredDependency(options);

    await assert.rejects(updateVendoredDependency({
      ...options, dependency: { ...fixture.dependency, sha256: '0'.repeat(64) },
    }), /checksum/i);
    await validateVendoredSource(target, 'freetype', fixture.dependency);
    await assert.rejects(updateVendoredDependency({
      ...options, dependency: { ...fixture.dependency, version: '2.14.0' },
    }), /version/i);

    const nextRoot = path.join(directory, 'next');
    await fs.mkdir(nextRoot);
    const next = await makeArchive(nextRoot, '2.14.0');
    const officialBytes = await fs.readFile(next.archivePath);
    await assert.rejects(verifiedReleaseArchive({
      dependency: next.dependency, archivePath: fixture.archivePath,
      fetchArchive: () => officialBytes,
    }), /does not match.*official release or commit/);
    const verified = await verifiedReleaseArchive({
      dependency: next.dependency, archivePath: next.archivePath,
      fetchArchive: () => officialBytes,
    });
    assert.equal(verified.sha256, next.dependency.sha256);
    await validateVendoredSource(target, 'freetype', fixture.dependency);
    console.log('PASS vendored-update-rejects-misidentified-local-archives');
    await updateVendoredDependency({ ...next, target });
    await validateVendoredSource(target, 'freetype', next.dependency);
    await updateVendoredDependency(options);

    const dependencyManifest = path.join(directory, 'manifest.json');
    const previous = '{"freetype":{"version":"previous"}}\n';
    await fs.writeFile(dependencyManifest, previous);
    const writeFile = fs.writeFile;
    let fail = true;
    fs.writeFile = async (filename, ...args) => {
      if (filename === dependencyManifest && fail) {
        fail = false;
        throw new Error('Manifest write failure');
      }
      return writeFile(filename, ...args);
    };
    try {
      await assert.rejects(updateVendoredDependency({
        ...next, target, dependencyManifest,
      }), /Manifest write failure/);
    } finally {
      fs.writeFile = writeFile;
    }
    await validateVendoredSource(target, 'freetype', fixture.dependency);
    assert.equal(await fs.readFile(dependencyManifest, 'utf8'), previous);

    const header = path.join(target, 'src/base/nested.h');
    await fs.appendFile(header, 'changed');
    await assert.rejects(validateVendoredSource(target, 'freetype',
      fixture.dependency), /source checksum/i);
    await updateVendoredDependency(options);
    await fs.rm(header);
    await assert.rejects(validateVendoredSource(target, 'freetype',
      fixture.dependency), /source checksum/i);
    await updateVendoredDependency(options);
    await fs.symlink('ftbase.c', path.join(target, 'src/base/linked.h'));
    await assert.rejects(validateVendoredSource(target, 'freetype',
      fixture.dependency), /symbolic link/i);
    await updateVendoredDependency(options);
    await fs.symlink('ftbase.c', path.join(directory,
      'upstream/src/base/linked.h'));
    const linkedArchive = spawnSync('tar', [
      '-czf', 'linked.tar.gz', 'upstream',
    ], { cwd: directory, encoding: 'utf8' });
    assert.equal(linkedArchive.status, 0, linkedArchive.stderr);
    const archivePath = path.join(directory, 'linked.tar.gz');
    const sha256 = createHash('sha256')
      .update(await fs.readFile(archivePath)).digest('hex');
    await assert.rejects(updateVendoredDependency({
      ...options, archivePath, dependency: { ...fixture.dependency, sha256 },
    }), /symbolic links/i);
    await validateVendoredSource(target, 'freetype', fixture.dependency);
    console.log('PASS vendored-dependencies-filter-version-integrity-rollback');

    const repositoryRoot = path.resolve(__dirname, '../../../..');
    for (const name of [ 'freetype', 'rmlui', 'rlottie' ]) {
      const gitOptions = {
        cwd: repositoryRoot, encoding: 'utf8', input: 'source\r\n',
      };
      const raw = spawnSync('git', [ 'hash-object', '--no-filters', '--stdin' ],
        gitOptions);
      const filtered = spawnSync('git', [
        '-c', 'core.autocrlf=true', 'hash-object',
        `--path=packages/sfml.js-rmlui/vendor/${name}/file.h`, '--stdin',
      ], gitOptions);
      assert.equal(filtered.status, 0, filtered.stderr);
      assert.equal(filtered.stdout, raw.stdout);
    }
    console.log('PASS vendored-dependencies-preserve-git-source-bytes');

    const packageRoot = path.resolve(__dirname, '../..');
    const patchHashes = await Promise.all(
      [ 'rmlui', 'rlottie' ].map(name => patchDigest(name)));
    const readFile = fs.readFile;
    fs.readFile = async (filename, ...args) => {
      const content = await readFile(filename, ...args);
      return path.basename(path.dirname(filename)) === 'patches' &&
        typeof content === 'string'
        ? content.replace(/\r?\n/g, '\r\n') : content;
    };
    try {
      assert.deepEqual(await Promise.all(
        [ 'rmlui', 'rlottie' ].map(name => patchDigest(name))), patchHashes);
    } finally {
      fs.readFile = readFile;
    }
    console.log('PASS vendored-patch-digests-preserve-windows-line-endings');

    const dependencies = {
      ...require('../../tools/dependencies/source-dependencies.json'),
      rlottie: require('../../tools/dependencies/optional-dependencies.json')
        .rlottie,
    };
    for (const [ name, dependency ] of Object.entries(dependencies)) {
      const source = path.join(packageRoot, dependency.source);
      await validateVendoredSource(source, name, dependency);
      await assert.rejects(validateSourceVersion(source, name, {
        ...dependency, version: '99.99.99',
      }), /version/i);
    }
    console.log('PASS vendored-dependencies-validate-pinned-source-releases');
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
