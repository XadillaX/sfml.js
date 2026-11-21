'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

const compiledFile = /\.(?:cpp|cc|c|h|hpp|inl|S)$/;

/**
 * Select runtime sources and build inputs, excluding media and generators.
 * @param {string} name Dependency name.
 * @param {string} filename POSIX path relative to the upstream root.
 * @return {boolean} Whether to retain this source file.
 */
function isVendoredSource(name, filename) {
  if (filename === 'CMakeLists.txt') {
    return true;
  }
  if (name === 'freetype') {
    return [ 'LICENSE.TXT', 'docs/FTL.TXT', 'docs/GPLv2.TXT' ]
      .includes(filename) ||
      /^(?:include|src)\//.test(filename) && /\.(?:c|h|h\.in)$/.test(filename);
  }
  if (name === 'rlottie') {
    return filename === 'COPYING' || filename === 'config.h' ||
      /^(?:src|inc)\//.test(filename) && compiledFile.test(filename) &&
      !filename.startsWith('src/wasm/');
  }
  if (name === 'rmlui') {
    return filename === 'LICENSE.txt' || filename === 'resources.json' ||
      /^(?:Include|Source|Backends|Samples|Tests\/Source)\//
        .test(filename) && compiledFile.test(filename);
  }
  throw new Error(`Unknown vendored dependency: ${name}`);
}

/**
 * Select original sample resources while retaining their upstream paths.
 * @param {string} filename POSIX path relative to upstream.
 * @return {boolean} Whether it is an on-demand resource.
 */
function isRmlUiResource(filename) {
  return filename.startsWith('Tests/Data/') ||
    filename.startsWith('Samples/') && !compiledFile.test(filename);
}

/**
 * Hash the applicable patch tools, including RmlUi's nested patch modules.
 * @param {string} name Dependency name.
 * @return {Promise<string>} Patch-tool SHA-256 digest.
 */
async function patchDigest(name) {
  const hash = createHash('sha256');
  const directory = path.join(__dirname, 'patches');
  const prefix = name === 'rmlui' ? 'patch-rmlui' : 'patch-rlottie';
  if (name !== 'freetype') {
    const files = (await fs.readdir(directory))
      .filter(file => file.startsWith(prefix) && file.endsWith('.cjs')).sort();
    for (const file of files) {
      hash.update(file)
        .update('\0')
        .update((await fs.readFile(path.join(directory, file), 'utf8'))
          .replace(/\r\n/g, '\n'))
        .update('\0');
    }
  }
  return hash.digest('hex');
}

/**
 * Hash sorted source paths and contents, rejecting links and extra payloads.
 * @param {string} root Source root.
 * @param {string} name Dependency name.
 * @return {Promise<object>} File inventory, byte count and digest.
 */
async function inspectVendoredSource(root, name) {
  const files = [];
  const hash = createHash('sha256');
  let bytes = 0;
  async function visit(relative) {
    for (const entry of await fs.readdir(path.join(root, relative),
      { withFileTypes: true })) {
      const filename = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        throw new Error(`Vendored symbolic link: ${filename}`);
      }
      if (entry.isDirectory()) {
        await visit(filename);
      } else if (entry.isFile() && isVendoredSource(name, filename)) {
        files.push(filename);
      } else if (filename !== 'upstream.json') {
        throw new Error(`Unexpected vendored source file: ${filename}`);
      }
    }
  }
  await visit('');
  files.sort();
  for (const filename of files) {
    const content = await fs.readFile(path.join(root, filename));
    hash.update(filename)
      .update('\0')
      .update(String(content.length))
      .update('\0')
      .update(content)
      .update('\0');
    bytes += content.length;
  }
  return { files, bytes, sha256: hash.digest('hex') };
}

/**
 * Check the upstream's declared release before accepting replacement sources.
 * @param {string} root Source root.
 * @param {string} name Dependency name.
 * @param {object} dependency Pinned identity.
 */
async function validateSourceVersion(root, name, dependency) {
  await fs.access(path.join(root, dependency.header));
  if (name === 'rmlui') {
    const cmake = await fs.readFile(path.join(root, 'CMakeLists.txt'), 'utf8');
    if (!cmake.includes(`VERSION "${dependency.version}"`)) {
      throw new Error('Unexpected RmlUi source version');
    }
  } else if (name === 'rlottie') {
    const cmake = await fs.readFile(path.join(root, 'CMakeLists.txt'), 'utf8');
    const version = cmake.match(/project\(\s*rlottie\s+VERSION\s+([\d.]+)/);
    if (version?.[1] !== dependency.version) {
      throw new Error('Unexpected rlottie source version');
    }
  } else if (name === 'freetype') {
    const header = await fs.readFile(
      path.join(root, 'include/freetype/freetype.h'), 'utf8');
    const version = [ 'MAJOR', 'MINOR', 'PATCH' ].map(component =>
      header.match(new RegExp(`#define\\s+FREETYPE_${component}\\s+(\\d+)`))
        ?.[1]).join('.');
    if (version !== dependency.version) {
      throw new Error('Unexpected FreeType source version');
    }
  }
}

/**
 * Validate every shipped source and the applied patch identity offline.
 * @param {string} root Vendored source root.
 * @param {string} name Dependency name.
 * @param {object} dependency Pinned identity.
 * @return {Promise<object>} Verified source inventory.
 */
async function validateVendoredSource(root, name, dependency) {
  const metadata = JSON.parse(await fs.readFile(
    path.join(root, 'upstream.json'), 'utf8'));
  for (const key of [ 'version', 'repository', 'commit', 'url', 'sha256' ]) {
    if (metadata[key] !== dependency[key]) {
      throw new Error(`Unexpected ${name} upstream identity: ${key}`);
    }
  }
  if (metadata.patchSha256 !== await patchDigest(name)) {
    throw new Error(`Unexpected ${name} patch checksum`);
  }
  const snapshot = await inspectVendoredSource(root, name);
  if (snapshot.sha256 !== metadata.sourceSha256 ||
      snapshot.files.length !== metadata.fileCount ||
      snapshot.bytes !== metadata.sourceBytes) {
    throw new Error(`${name} source checksum mismatch`);
  }
  await validateSourceVersion(root, name, dependency);
  return snapshot;
}

module.exports = {
  isVendoredSource, isRmlUiResource, inspectVendoredSource,
  validateVendoredSource, validateSourceVersion, patchDigest,
};
