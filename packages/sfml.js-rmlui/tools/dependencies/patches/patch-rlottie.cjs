'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

/**
 * Apply static-library export and AArch64 portable-raster compatibility.
 * @param {string} root Extracted pinned rlottie tree.
 */
async function patchRlottie(root) {
  const edits = [ 'inc/rlottiecommon.h', 'inc/rlottie.h' ].map(file => [
    file,
    '#if defined _WIN32 || defined __CYGWIN__',
    '#if defined RLOTTIE_STATIC\n' +
    '  #define RLOTTIE_API\n' +
    '#elif defined _WIN32 || defined __CYGWIN__',
  ]);

  // This release's NEON implementation requires ARM32-only pixman assembly.
  // AArch64 uses its upstream portable renderer, including memfill32.
  for (const file of [
    'vdrawhelper_neon.cpp', 'vdrawhelper_common.cpp', 'vdrawhelper.cpp',
  ]) {
    edits.push([ `src/vector/${file}`,
      'defined(__ARM_NEON__)',
      '(defined(__ARM_NEON__) && !defined(__aarch64__))' ]);
  }

  for (const [ file, before, after ] of edits) {
    const full = path.join(root, file);
    const source = await fs.readFile(full, 'utf8');
    if (source.includes(after)) {
      continue;
    }
    if (source.split(before).length !== 2) {
      throw new Error(`rlottie patch mismatch: ${file}`);
    }
    await fs.writeFile(full, source.replace(before, after));
  }
}

module.exports = { patchRlottie };
