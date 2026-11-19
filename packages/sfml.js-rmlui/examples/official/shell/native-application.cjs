'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '../../..');
const nativeLibrary = path.join(root, 'build/Release/rmlui.node');
const loaded = new Map();

/**
 * Load an original application against the existing native runtime.
 * @param {string} name Upstream application directory.
 * @return {object} Checked application addon.
 */
function loadApplication(name) {
  if (![ 'invaders', 'lua_invaders' ].includes(name)) {
    throw new Error(`Unknown application: ${name}`);
  }
  if (!loaded.has(name)) {
    const extension = path.join(root, 'build/Release', `${name}.node`);
    if (!fs.existsSync(extension)) {
      throw new Error(`Build the package before running original ${name}`);
    }
    require(nativeLibrary)._promoteNativeSymbols();
    const application = require(extension);
    loaded.set(name, application);
  }
  return loaded.get(name);
}

/**
 * Resolve application-owned score storage outside the source repository.
 * @param {string} name Upstream application directory.
 * @param {string} [selected] Explicit output path.
 * @return {string} Absolute scores file path.
 */
function scoresPath(name, selected) {
  if (selected !== undefined) {
    if (!path.isAbsolute(selected) || !fs.statSync(path.dirname(selected))
      .isDirectory()) {
      throw new Error('--scores-file requires an existing absolute parent');
    }
    return selected;
  }
  const bases = {
    darwin: path.join(os.homedir(), 'Library/Application Support'),
    win32: process.env.LOCALAPPDATA ??
      path.join(os.homedir(), 'AppData/Local'),
  };
  const base = bases[process.platform] ??
    process.env.XDG_DATA_HOME ?? path.join(os.homedir(), '.local/share');
  const directory = path.join(base, 'sfml.js-rmlui', name);
  fs.mkdirSync(directory, { recursive: true });
  return path.join(directory, 'scores.txt');
}

module.exports = { loadApplication, scoresPath };
