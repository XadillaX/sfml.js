'use strict';

const fs = require('node:fs/promises');
const { createReadStream } = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const download = require('download');

const defaultRoot = path.join(__dirname, '../../third_party/rmlui');

/**
 * Read the five optional font declarations from the original IME CMake file.
 * @param {string} cmake Original Samples/basic/ime/CMakeLists.txt.
 * @return {object[]} Font URLs, local filenames and SHA-256 digests.
 */
function parseFontDownloads(cmake) {
  const declaration = new RegExp(
    String.raw`file\(\s*DOWNLOAD\s+"([^"]+)"\s+` +
    String.raw`"\$\{external_assets_dir\}/([^"]+)"\s+` +
    String.raw`EXPECTED_HASH\s+SHA256=([^\s)]+)\s*\)`, 'g');
  const fonts = Array.from(cmake.matchAll(declaration),
    ([ , url, file, sha256 ]) => ({ url, file, sha256 }));
  if (fonts.length !== 5) {
    throw new Error('Expected five font downloads in the original IME CMake');
  }

  const names = new Set();
  for (const font of fonts) {
    if (!/^[A-Za-z0-9[\],-]+\.ttf$/.test(font.file)) {
      throw new Error(`Unsafe font filename: ${font.file}`);
    }
    if (names.has(font.file)) {
      throw new Error(`Duplicate font: ${font.file}`);
    }
    names.add(font.file);
    if (new URL(font.url).protocol !== 'https:') {
      throw new Error(`Font download must use HTTPS: ${font.file}`);
    }
    if (!/^[a-f0-9]{64}$/.test(font.sha256)) {
      throw new Error(`Invalid font SHA-256: ${font.file}`);
    }
  }
  return fonts;
}

/**
 * Hash a cached font without reading all five large files into memory.
 * @param {string} file Cached font path.
 * @return {Promise<string|undefined>} Digest, or undefined for a missing file.
 */
async function cachedDigest(file) {
  try {
    const hash = createHash('sha256');
    for await (const chunk of createReadStream(file)) {
      hash.update(chunk);
    }
    return hash.digest('hex');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

/**
 * Prepare only the original IME sample's optional fonts, reusing valid files.
 * Each download is verified before replacing a destination file.
 * @param {object} [options] Source root and injectable download operation.
 * @param {string} [options.rmluiRoot] Installed upstream source directory.
 * @param {Function} [options.fetchFont] HTTPS URL to font buffer operation.
 * @return {Promise<object[]>} Manifest entries with cached/downloaded status.
 */
async function prepareImeFonts({
  rmluiRoot = defaultRoot,
  fetchFont = download,
} = {}) {
  const cmakeFile = path.join(rmluiRoot, 'Samples/basic/ime/CMakeLists.txt');
  const fonts = parseFontDownloads(await fs.readFile(cmakeFile, 'utf8'));
  const directory = path.join(rmluiRoot, 'Samples/assets/external');
  await fs.mkdir(directory, { recursive: true });

  const results = [];
  for (const font of fonts) {
    const destination = path.join(directory, font.file);
    if (await cachedDigest(destination) === font.sha256) {
      results.push({ ...font, status: 'cached' });
      continue;
    }

    const buffer = await fetchFont(font.url);
    const digest = createHash('sha256').update(buffer).digest('hex');
    if (digest !== font.sha256) {
      throw new Error(`Font checksum mismatch: ${font.file}`);
    }
    const temporary = path.join(directory, `.ime-font-${randomUUID()}.tmp`);
    try {
      await fs.writeFile(temporary, buffer, { flag: 'wx' });
      await fs.rename(temporary, destination);
    } finally {
      await fs.rm(temporary, { force: true });
    }
    results.push({ ...font, status: 'downloaded' });
  }
  return results;
}

if (require.main === module) {
  prepareImeFonts().then(fonts => {
    for (const font of fonts) {
      console.log(`${font.status}: ${font.file} SHA256=${font.sha256}`);
    }
  }).catch(error => {
    console.error(error.code === 'ENOENT'
      ? 'RmlUi sources are missing. Run npm run download:deps first.' : error);
    process.exitCode = 1;
  });
}

module.exports = { parseFontDownloads, prepareImeFonts, cachedDigest };
