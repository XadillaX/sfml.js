'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');

/**
 * Select upstream runtime sources, including pre-generated shaping tables.
 * @param {string} filename POSIX path relative to the upstream root.
 * @return {boolean} Whether the file belongs in the vendored source tree.
 */
function isHarfBuzzSource(filename) {
  if (filename === 'COPYING') {
    return true;
  }
  return filename.startsWith('src/') && /\.(?:cc|hh|h)$/.test(filename) &&
    !/^(?:test[^/]*|main)\.cc$/.test(path.posix.basename(filename));
}

/**
 * Hash sorted paths and file contents without depending on filesystem order.
 * @param {string} root Vendored source root.
 * @return {Promise<object>} File inventory, byte count and SHA-256 digest.
 */
async function inspectHarfBuzzSource(root) {
  const files = [];
  const hash = createHash('sha256');
  let bytes = 0;

  /**
   * Traverse retained sources and reject links or unexpected payload files.
   * @param {string} relative Directory relative to the source root.
   */
  async function visit(relative) {
    const entries = await fs.readdir(path.join(root, relative),
      { withFileTypes: true });
    for (const entry of entries) {
      const filename = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) {
        throw new Error(`HarfBuzz symbolic link: ${filename}`);
      }
      if (entry.isDirectory()) {
        await visit(filename);
      } else if (entry.isFile() && isHarfBuzzSource(filename)) {
        files.push(filename);
      } else if (filename !== 'upstream.json') {
        throw new Error(`Unexpected HarfBuzz source file: ${filename}`);
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
 * Verify the pinned upstream identity and every retained source file offline.
 * @param {string} root Vendored source root.
 * @param {object} dependency Pinned dependency manifest entry.
 * @return {Promise<object>} Verified source inventory.
 */
async function validateHarfBuzzSource(root, dependency) {
  const metadata = JSON.parse(await fs.readFile(
    path.join(root, 'upstream.json'), 'utf8'));
  for (const key of [ 'version', 'repository', 'commit', 'sha256' ]) {
    if (metadata[key] !== dependency[key]) {
      throw new Error(`Unexpected HarfBuzz upstream identity: ${key}`);
    }
  }
  const snapshot = await inspectHarfBuzzSource(root);
  if (snapshot.sha256 !== metadata.sourceSha256 ||
      snapshot.files.length !== metadata.fileCount ||
      snapshot.bytes !== metadata.sourceBytes) {
    throw new Error('HarfBuzz source checksum mismatch');
  }
  for (const filename of [
    'COPYING', 'src/harfbuzz.cc', dependency.header, 'src/hb-version.h',
  ]) {
    await fs.access(path.join(root, filename));
  }
  const header = await fs.readFile(
    path.join(root, 'src/hb-version.h'), 'utf8');
  const version = header.match(/#define\s+HB_VERSION_STRING\s+"([^"]+)"/);
  if (version?.[1] !== dependency.version) {
    throw new Error('Unexpected HarfBuzz source version');
  }
  return snapshot;
}

module.exports = {
  isHarfBuzzSource, inspectHarfBuzzSource, validateHarfBuzzSource,
};
