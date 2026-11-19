'use strict';

const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs/promises');
const path = require('node:path');
const download = require('download');
const { version } = require('../lib_downloader_urls.cjs');

const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'third_party', `sfml-source-${version}`);
const patches = [
  'sfml-event-source.patch', 'sfml-native-input.patch',
  'sfml-macos-text-owner.patch',
  'sfml-x11-text-lookup.patch',
  'sfml-deferred-input.patch',
  ...(process.platform === 'darwin' ? [ 'sfml-macos-high-dpi.patch' ] : []),
].map(name => path.join(root, 'tools/patches', name));
const headers = [
  'window-input-callbacks.h', 'window-input-registry.h', 'window-input-scope.h',
  'platform/x11/utf8-lookup.h',
  'platform/event-queue.h',
];

/**
 * Execute a build tool directly and propagate failure.
 * @param {string} command Executable.
 * @param {string[]} args Arguments.
 * @param {string} [cwd] Working directory.
 */
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${command} failed with status ${result.status}`);
  }
}

/**
 * Fingerprint every source patch and shared protocol header used by Window.
 * @return {Promise<string>} Build identity.
 */
async function sourceIdentity() {
  const inputs = [
    ...patches, ...headers.map(name => path.join(root, 'include', name)),
    __filename, path.join(__dirname, 'build-window.cjs'),
  ];
  const hash = createHash('sha256');
  for (const input of inputs) {
    hash.update(path.basename(input)).update(await fs.readFile(input));
  }
  return `${version}-${process.platform}-${process.arch}-${hash.digest('hex')}`;
}

/**
 * Restore only patched upstream units and reapply the exact extension.
 * Reuse the dependency's existing source directory, including original bytes.
 * @return {Promise<string>} Prepared source directory.
 */
async function prepareSource() {
  const marker = path.join(source, '.source-ready');
  try {
    await fs.access(marker);
  } catch {
    await fs.mkdir(source, { recursive: true });
    const url = 'https://codeload.github.com/SFML/SFML/tar.gz/refs/tags/' +
      version;
    await download(url, source, { extract: true, strip: 1 });
    await fs.writeFile(marker, version);
  }
  const directory = path.join(source, 'src/SFML/Window');
  const files = [
    'WindowImpl.cpp', 'WindowImpl.hpp', 'WindowBase.cpp',
    'Win32/WindowImplWin32.cpp',
    'Unix/WindowImplX11.cpp', 'Unix/WindowImplX11.hpp',
    'macOS/SFOpenGLView+keyboard.mm',
    ...(process.platform === 'darwin' ? [
      'macOS/SFOpenGLView.mm', 'macOS/InputImpl.mm',
      'macOS/WindowImplCocoa.mm',
    ] : []),
  ];
  for (const file of files) {
    const target = path.join(directory, file);
    // Keep compatibility with originals already saved by the Cocoa installer.
    const original = path.join(source, `${path.basename(file)}.original`);
    try {
      await fs.access(original);
    } catch {
      await fs.copyFile(target, original);
    }
    await fs.copyFile(original, target);
  }
  await fs.rm(path.join(directory, 'EventSource.hpp'), { force: true });
  for (const name of headers) {
    const target = path.join(directory, name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.copyFile(path.join(root, 'include', name),
      target);
  }
  for (const patch of patches) {
    // git apply is available on every supported build host, including Windows.
    run('git', [ 'apply', patch ], source);
  }
  return source;
}

module.exports = { root, run, sourceIdentity, prepareSource };
