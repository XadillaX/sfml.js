'use strict';

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { cachedDigest } = require('./prepare-ime-fonts.cjs');
const { prepareArchive, extractMembers } = require('./source-archive.cjs');
const { isRmlUiResource } = require('./vendored-source.cjs');

const packageRoot = path.resolve(__dirname, '../..');
const defaultSource = path.join(packageRoot, 'vendor/rmlui');
const defaultTarget = path.join(packageRoot, 'third_party/rmlui');

/**
 * Read JSON if present, propagating unreadable or malformed cache failures.
 * @param {string} filename Manifest filename.
 * @return {Promise<object|undefined>} Manifest or a missing value.
 */
async function readOptionalJson(filename) {
  try {
    return JSON.parse(await fs.readFile(filename, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

/**
 * Check sample resource filenames before using them as filesystem paths.
 * @param {object} manifest Resource inventory paired with vendored sources.
 */
function validateManifest(manifest) {
  if (!/^[a-f0-9]{64}$/.test(manifest.dependency?.sha256) ||
      !manifest.dependency.version || !manifest.files ||
      !Object.keys(manifest.files).length) {
    throw new Error('Invalid RmlUi resource manifest');
  }
  for (const [ filename, digest ] of Object.entries(manifest.files)) {
    if (/[\\\0]/.test(filename) ||
        filename.split('/').some(part => !part || part === '.' ||
          part === '..') || !isRmlUiResource(filename) ||
        !/^[a-f0-9]{64}$/.test(digest)) {
      throw new Error(`Unsafe resource path or digest: ${filename}`);
    }
  }
}

/**
 * Inspect cached resources and recognize the previous full upstream tree.
 * @param {string} target Resource cache root.
 * @param {object} manifest Current upstream resource inventory.
 * @param {object|undefined} previous Recorded resource identity.
 * @return {Promise<object>} Current digests and cache identity.
 */
async function inspectCache(target, manifest, previous) {
  const current = {};
  for (const filename of Object.keys(manifest.files)) {
    current[filename] = await cachedDigest(path.join(target, filename));
  }
  let sameVersion = previous?.dependency.sha256 === manifest.dependency.sha256;
  if (!previous) {
    try {
      const cmake = await fs.readFile(path.join(target, 'CMakeLists.txt'),
        'utf8');
      sameVersion = cmake.includes(`VERSION "${manifest.dependency.version}"`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    // Also adopt a manually prepared cache whose files match the archive.
    sameVersion ||= Object.entries(manifest.files)
      .every(([ filename, digest ]) => current[filename] === digest);
  }
  return { current, sameVersion };
}

/**
 * Prepare original samples independently of install and build dependencies.
 * Preserve local edits and extra fonts; repair missing files from the archive.
 * @param {object} [options] Source inventory, cache and optional archive.
 * @param {string} [options.sourceRoot] Vendored RmlUi source root.
 * @param {string} [options.target] Resource cache root.
 * @param {string} [options.archivePath] Existing verified upstream archive.
 * @param {Function} [options.fetchArchive] URL to archive buffer operation.
 * @return {Promise<object>} Cached or prepared resource status.
 */
async function prepareRmlUiResources({
  sourceRoot = defaultSource, target = defaultTarget,
  archivePath, fetchArchive,
} = {}) {
  const manifest = JSON.parse(await fs.readFile(
    path.join(sourceRoot, 'resources.json'), 'utf8'));
  validateManifest(manifest);
  const marker = path.join(target, '.resources.json');
  const previous = await readOptionalJson(marker);
  const { current, sameVersion } = await inspectCache(target, manifest,
    previous);
  await fs.mkdir(target, { recursive: true });
  if (sameVersion && Object.values(current).every(Boolean)) {
    await fs.writeFile(marker, `${JSON.stringify(manifest, null, 2)}\n`);
    return { status: 'cached', files: Object.keys(current).length };
  }
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'rmlui-assets-'));
  try {
    const members = await prepareArchive({
      dependency: manifest.dependency, directory, archivePath, fetchArchive,
    });
    const selected = members.filter(entry =>
      Object.hasOwn(manifest.files, entry.filename));
    if (selected.length !== Object.keys(manifest.files).length) {
      throw new Error('RmlUi archive is missing sample resources');
    }
    const root = await extractMembers(directory, selected, 'resources');
    for (const { filename } of selected) {
      const digest = createHash('sha256')
        .update(await fs.readFile(path.join(root, filename))).digest('hex');
      if (digest !== manifest.files[filename]) {
        throw new Error(`RmlUi resource checksum mismatch: ${filename}`);
      }
    }
    for (const { filename } of selected) {
      const oldHash = previous?.files[filename];
      const modified = current[filename] && oldHash &&
        current[filename] !== oldHash;
      if (current[filename] && (sameVersion || modified)) {
        continue;
      }
      const destination = path.join(target, filename);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      const temporary = `${destination}.${randomUUID()}.tmp`;
      try {
        await fs.copyFile(path.join(root, filename), temporary);
        await fs.rename(temporary, destination);
      } finally {
        await fs.rm(temporary, { force: true });
      }
    }
    await fs.writeFile(marker, `${JSON.stringify(manifest, null, 2)}\n`);
    return { status: 'prepared', files: selected.length };
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--archive')) {
    console.error('Usage: npm run download:examples -- [--archive PATH]');
    process.exitCode = 1;
  } else {
    prepareRmlUiResources({
      archivePath: args[1] && path.resolve(args[1]),
    }).then(result => {
      console.log(`[sfml.js-rmlui] RmlUi resources ${result.status}: ` +
        `${result.files} files`);
    }).catch(error => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}

module.exports = { prepareRmlUiResources };
