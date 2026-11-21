'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const download = require('download');
const {
  isHarfBuzzSource, inspectHarfBuzzSource, validateHarfBuzzSource,
} = require('./harfbuzz-source.cjs');

const packageRoot = path.resolve(__dirname, '../..');
const manifestPath = path.join(__dirname, 'optional-dependencies.json');

/**
 * Run tar with local archive names, also compatible with Windows drive paths.
 * @param {string[]} args Tar arguments.
 * @param {string} cwd Temporary archive directory.
 * @return {string} Command output.
 */
function runTar(args, cwd) {
  const result = spawnSync('tar', args, {
    cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw result.error || new Error(`tar failed: ${result.stderr}`);
  }
  return result.stdout;
}

/**
 * Select safe archive members from a single upstream root.
 * @param {string} listing Tar member listing.
 * @return {string[]} Retained source members.
 */
function selectMembers(listing) {
  let root;
  const members = [];
  const seen = new Set();
  for (const member of listing.split(/\r?\n/).filter(Boolean)) {
    const parts = member.replace(/\/$/, '').split('/');
    if (parts.some(part => !part || part === '.' || part === '..') ||
        /[\\\0]/.test(member)) {
      throw new Error(`Unsafe HarfBuzz archive path: ${member}`);
    }
    root ??= parts[0];
    if (parts[0] !== root) {
      throw new Error('HarfBuzz archive must have one upstream root');
    }
    const relative = parts.slice(1).join('/');
    if (!member.endsWith('/') && isHarfBuzzSource(relative)) {
      if (seen.has(relative)) {
        throw new Error(`Duplicate HarfBuzz archive member: ${relative}`);
      }
      seen.add(relative);
      members.push(member);
    }
  }
  if (!seen.has('src/harfbuzz.cc') || !seen.has('src/hb-version.h') ||
      !seen.has('COPYING')) {
    throw new Error('HarfBuzz archive is missing runtime sources');
  }
  return members.sort();
}

/**
 * Move a source directory across filesystems when the OS requires a copy.
 * @param {string} source Source directory.
 * @param {string} target Destination directory.
 */
async function moveDirectory(source, target) {
  try {
    await fs.rename(source, target);
  } catch (error) {
    if (error.code !== 'EXDEV') {
      throw error;
    }
    await fs.cp(source, target, { recursive: true, errorOnExist: true });
    await fs.rm(source, { recursive: true });
  }
}

/**
 * Replace runtime sources only after checking the archive and extracted tree.
 * Temporary archives, extracted data and rollback copies live in OS temp.
 * @param {object} options Pinned dependency, target and optional archive path.
 * @param {object} options.dependency Pinned upstream identity.
 * @param {string} options.target Vendored source directory.
 * @param {string} [options.archivePath] Local archive to verify and reuse.
 * @param {string} [options.dependencyManifest] Manifest to update with sources.
 * @return {Promise<object>} Verified installed source inventory.
 */
async function updateHarfBuzz({
  dependency, target, archivePath, dependencyManifest,
}) {
  const staging = await fs.mkdtemp(path.join(os.tmpdir(), 'harfbuzz-update-'));
  try {
    const buffer = archivePath ? await fs.readFile(archivePath) :
      await download(`https://codeload.github.com/${dependency.repository}/` +
        `legacy.tar.gz/${dependency.commit}`);
    const digest = createHash('sha256').update(buffer).digest('hex');
    if (digest !== dependency.sha256) {
      throw new Error('HarfBuzz archive checksum mismatch');
    }
    await fs.writeFile(path.join(staging, 'upstream.tar.gz'), buffer);
    const members = selectMembers(runTar([ '-tzf', 'upstream.tar.gz' ],
      staging));
    await fs.writeFile(path.join(staging, 'members.txt'),
      `${members.join('\n')}\n`);
    const source = path.join(staging, 'source');
    await fs.mkdir(source);
    runTar([ '-xzf', 'upstream.tar.gz', '--strip-components=1',
      '-C', 'source', '-T', 'members.txt' ], staging);
    const snapshot = await inspectHarfBuzzSource(source);
    const metadata = {
      version: dependency.version,
      repository: dependency.repository,
      commit: dependency.commit,
      sha256: dependency.sha256,
      sourceSha256: snapshot.sha256,
      fileCount: snapshot.files.length,
      sourceBytes: snapshot.bytes,
    };
    await fs.writeFile(path.join(source, 'upstream.json'),
      `${JSON.stringify(metadata, null, 2)}\n`);
    await validateHarfBuzzSource(source, dependency);

    const previousManifest = dependencyManifest
      ? await fs.readFile(dependencyManifest, 'utf8') : undefined;
    await fs.mkdir(path.dirname(target), { recursive: true });
    const backup = path.join(staging, 'previous');
    let hadPrevious = false;
    try {
      await moveDirectory(target, backup);
      hadPrevious = true;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    try {
      await moveDirectory(source, target);
      const installed = await validateHarfBuzzSource(target, dependency);
      if (dependencyManifest) {
        const manifest = JSON.parse(previousManifest);
        manifest.harfbuzz = dependency;
        await fs.writeFile(dependencyManifest,
          `${JSON.stringify(manifest, null, 2)}\n`);
      }
      return installed;
    } catch (error) {
      await fs.rm(target, { recursive: true, force: true });
      if (hadPrevious) {
        await moveDirectory(backup, target);
      }
      if (dependencyManifest) {
        await fs.writeFile(dependencyManifest, previousManifest);
      }
      throw error;
    }
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

/**
 * Refresh the pinned version, or resolve an explicitly requested upstream tag.
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('npm run update:harfbuzz -- ' +
      '[--version 15.1.0] [--archive /path/to/upstream.tar.gz]');
    return;
  }
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    if (![ '--version', '--archive' ].includes(flag) ||
        !args[index + 1] || args[index + 1].startsWith('--')) {
      throw new Error(`Invalid HarfBuzz update option: ${flag}`);
    }
    options[flag.slice(2)] = args[index + 1];
  }
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const dependency = { ...manifest.harfbuzz };
  const archivePath = options.archive && path.resolve(options.archive);
  if (options.version && options.version !== dependency.version) {
    if (!/^\d+\.\d+\.\d+$/.test(options.version)) {
      throw new Error('HarfBuzz version must use major.minor.patch');
    }
    const commit = spawnSync('gh', [ 'api',
      `repos/${dependency.repository}/commits/${options.version}`,
      '--jq', '.sha' ], { encoding: 'utf8' });
    if (commit.error || commit.status !== 0) {
      throw commit.error || new Error(commit.stderr);
    }
    dependency.version = options.version;
    dependency.commit = commit.stdout.trim();
    if (!/^[a-f0-9]{40}$/.test(dependency.commit)) {
      throw new Error('Unexpected HarfBuzz commit returned by GitHub');
    }
    const buffer = archivePath ? await fs.readFile(archivePath) :
      await download(`https://codeload.github.com/${dependency.repository}/` +
        `legacy.tar.gz/${dependency.commit}`);
    dependency.sha256 = createHash('sha256').update(buffer).digest('hex');
    // Reuse this verified archive instead of downloading the new version twice.
    const cache = await fs.mkdtemp(path.join(os.tmpdir(), 'harfbuzz-archive-'));
    try {
      const cached = path.join(cache, 'upstream.tar.gz');
      await fs.writeFile(cached, buffer);
      await updateHarfBuzz({ dependency, archivePath: cached,
        dependencyManifest: manifestPath,
        target: path.join(packageRoot, dependency.source) });
    } finally {
      await fs.rm(cache, { recursive: true, force: true });
    }
  } else {
    await updateHarfBuzz({ dependency, archivePath,
      dependencyManifest: manifestPath,
      target: path.join(packageRoot, dependency.source) });
  }
  const snapshot = await validateHarfBuzzSource(
    path.join(packageRoot, dependency.source), dependency);
  console.log(`[sfml.js-rmlui] HarfBuzz ${dependency.version}: ` +
    `${snapshot.files.length} files, ${snapshot.bytes} source bytes`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(`[sfml.js-rmlui] ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { updateHarfBuzz, selectMembers };
