'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const download = require('download');
const { archiveUrl, prepareArchive, extractMembers } =
  require('./source-archive.cjs');
const {
  isVendoredSource, isRmlUiResource, inspectVendoredSource,
  validateVendoredSource, validateSourceVersion, patchDigest,
} = require('./vendored-source.cjs');
const { patchRmlUi } = require('./patches/patch-rmlui.cjs');
const { patchRmlUiLua } = require('./patches/patch-rmlui-lua.cjs');
const { patchRmlUiDebugger } = require('./patches/patch-rmlui-debugger.cjs');
const { patchRmlUiFonts } = require('./patches/patch-rmlui-fonts.cjs');
const { patchRlottie } = require('./patches/patch-rlottie.cjs');

/**
 * Move a verified source directory across filesystems if required.
 * @param {string} source Source directory.
 * @param {string} target Destination.
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
 * Apply package compatibility patches and record original resource hashes.
 * @param {string} source Selected source root.
 * @param {string} name Dependency name.
 * @param {string} directory Temporary archive directory.
 * @param {object[]} members Original archive inventory.
 * @param {object} dependency Pinned identity.
 */
async function prepareSource(source, name, directory, members, dependency) {
  await validateSourceVersion(source, name, dependency);
  if (name === 'rmlui') {
    const resources = members.filter(entry => isRmlUiResource(entry.filename));
    const root = await extractMembers(directory, resources, 'resources');
    const files = {};
    for (const { filename } of resources) {
      files[filename] = createHash('sha256')
        .update(await fs.readFile(path.join(root, filename))).digest('hex');
    }
    await fs.writeFile(path.join(source, 'resources.json'),
      `${JSON.stringify({ dependency, files }, null, 2)}\n`);
    await patchRmlUi(source);
    await patchRmlUiLua(source);
    await patchRmlUiDebugger(source);
    await patchRmlUiFonts(source);
  } else if (name === 'rlottie') {
    await patchRlottie(source);
    await fs.writeFile(path.join(source, 'config.h'),
      '// Generated: static image decoder, synchronous rasterization.\n' +
      '#define LOTTIE_CACHE_SUPPORT\n');
  }
}

/**
 * Replace source and manifest together, restoring both after a write failure.
 * @param {object} options Verified tree and manifest update parameters.
 * @param {string} options.source Verified replacement tree.
 * @param {string} options.directory Temporary rollback directory.
 * @param {string} options.target Vendored destination.
 * @param {string} options.name Dependency name.
 * @param {object} options.dependency Pinned identity.
 * @param {string} [options.dependencyManifest] Manifest to update.
 * @return {Promise<object>} Installed inventory.
 */
async function replaceSource({
  source, directory, target, name, dependency, dependencyManifest,
}) {
  const previousManifest = dependencyManifest
    ? await fs.readFile(dependencyManifest, 'utf8') : undefined;
  await fs.mkdir(path.dirname(target), { recursive: true });
  const backup = path.join(directory, 'previous');
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
    const installed = await validateVendoredSource(target, name, dependency);
    if (dependencyManifest) {
      const manifest = JSON.parse(previousManifest);
      manifest[name] = dependency;
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
}

/**
 * Refresh selected upstream sources, checking all inputs before replacement.
 * @param {object} options Dependency name, identity, archive and destination.
 * @return {Promise<object>} Installed source inventory.
 */
async function updateVendoredDependency(options) {
  const { name, dependency, archivePath } = options;
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), `${name}-update-`));
  try {
    const members = await prepareArchive({
      dependency, directory, archivePath,
    });
    const selected = members.filter(entry =>
      isVendoredSource(name, entry.filename));
    const source = await extractMembers(directory, selected, 'source');
    await prepareSource(source, name, directory, members, dependency);
    const snapshot = await inspectVendoredSource(source, name);
    const metadata = {
      version: dependency.version, repository: dependency.repository,
      commit: dependency.commit, url: dependency.url,
      sha256: dependency.sha256, patchSha256: await patchDigest(name),
      sourceSha256: snapshot.sha256,
      fileCount: snapshot.files.length, sourceBytes: snapshot.bytes,
    };
    await fs.writeFile(path.join(source, 'upstream.json'),
      `${JSON.stringify(metadata, null, 2)}\n`);
    await validateVendoredSource(source, name, dependency);
    return await replaceSource({ ...options, source, directory });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

/**
 * Parse maintenance options and resolve explicitly requested release tags.
 * @param {string[]} args CLI options following the dependency name.
 * @param {object} dependency Current dependency identity.
 * @return {object} Archive option and requested pinned identity.
 */
function updateOptions(args, dependency) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    if (![ '--version', '--commit', '--archive' ].includes(flag) ||
        !args[index + 1] || args[index + 1].startsWith('--')) {
      throw new Error(`Invalid update option: ${flag}`);
    }
    options[flag.slice(2)] = args[index + 1];
  }
  const next = { ...dependency };
  if (options.version) {
    if (!/^\d+\.\d+(?:\.\d+)?$/.test(options.version)) {
      throw new Error('Invalid dependency version');
    }
    next.version = options.version;
  }
  if (options.commit || next.version !== dependency.version) {
    if (next.repository) {
      const tag = options.commit ||
        (next.repository === 'Samsung/rlottie' ? `v${next.version}` :
          next.version);
      const commit = spawnSync('gh', [ 'api',
        `repos/${next.repository}/commits/${tag}`, '--jq', '.sha' ],
      { encoding: 'utf8' });
      if (commit.error || commit.status !== 0) {
        throw commit.error || new Error(commit.stderr);
      }
      next.commit = commit.stdout.trim();
      if (!/^[a-f0-9]{40}$/.test(next.commit)) {
        throw new Error('Unexpected upstream commit');
      }
    } else {
      if (options.commit) {
        throw new Error('--commit requires a GitHub dependency');
      }
      next.url = next.url.replace(`-${dependency.version}.tar.gz`,
        `-${next.version}.tar.gz`);
    }
  }
  return { next, options };
}

/**
 * Establish a new pin from official bytes, checking any supplied cache.
 * A local archive cannot establish its own identity for another commit.
 * @param {object} options Requested identity and optional cached archive.
 * @param {object} options.dependency Requested upstream identity.
 * @param {string} [options.archivePath] Local archive to compare.
 * @param {Function} [options.fetchArchive] Official URL download operation.
 * @return {Promise<object>} Official buffer and independently checked digest.
 */
async function verifiedReleaseArchive({
  dependency, archivePath, fetchArchive = download,
}) {
  const buffer = await fetchArchive(archiveUrl(dependency));
  const sha256 = createHash('sha256').update(buffer).digest('hex');
  if (archivePath) {
    const local = createHash('sha256')
      .update(await fs.readFile(archivePath)).digest('hex');
    if (local !== sha256) {
      throw new Error('Local archive does not match the requested ' +
        'official release or commit');
    }
  }
  return { buffer, sha256 };
}

/**
 * Update one pinned dependency or an explicitly requested upstream release.
 */
async function main() {
  const [ name, ...args ] = process.argv.slice(2);
  if (args.includes('--help') || name === '--help') {
    console.log('npm run update:<rmlui|freetype|rlottie> -- ' +
      '[--version X.Y.Z] [--commit SHA] [--archive /path/to/upstream.tar.gz]');
    return;
  }
  if (![ 'rmlui', 'freetype', 'rlottie' ].includes(name)) {
    throw new Error('Choose rmlui, freetype or rlottie');
  }
  const dependencyManifest = path.join(__dirname, name === 'rlottie'
    ? 'optional-dependencies.json' : 'source-dependencies.json');
  const manifest = JSON.parse(await fs.readFile(dependencyManifest, 'utf8'));
  const { next, options } = updateOptions(args, manifest[name]);
  const target = path.resolve(__dirname, '../..', next.source);
  let archivePath = options.archive && path.resolve(options.archive);
  let cache;
  try {
    if (next.version !== manifest[name].version ||
        next.commit !== manifest[name].commit) {
      const { buffer, sha256 } = await verifiedReleaseArchive({
        dependency: next, archivePath,
      });
      next.sha256 = sha256;
      cache = await fs.mkdtemp(path.join(os.tmpdir(), `${name}-archive-`));
      archivePath = path.join(cache, 'upstream.tar.gz');
      await fs.writeFile(archivePath, buffer);
    }
    const snapshot = await updateVendoredDependency({
      name, dependency: next, target, archivePath, dependencyManifest,
    });
    console.log(`[sfml.js-rmlui] ${name} ${next.version}: ` +
      `${snapshot.files.length} files, ${snapshot.bytes} source bytes`);
  } finally {
    if (cache) {
      await fs.rm(cache, { recursive: true, force: true });
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(`[sfml.js-rmlui] ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  updateVendoredDependency, updateOptions, verifiedReleaseArchive,
};
