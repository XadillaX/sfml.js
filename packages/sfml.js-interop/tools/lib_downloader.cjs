'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const download = require('download');
const urls = require('./lib_downloader_urls.cjs');

const retryableStatuses = new Set([ 429, 500, 502, 503, 504 ]);
const maxDownloadAttempts = 6;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function githubHeaders() {
  return {
    Accept: 'application/octet-stream',
    ...(process.env.GITHUB_TOKEN ? {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    } : {}),
  };
}

async function resolveGitHubReleaseAsset(url) {
  const pattern = new RegExp(
    '^https://github\\.com/([^/]+)/([^/]+)/releases/download/' +
    '([^/]+)/([^?]+)'
  );
  const match = decodeURIComponent(url).match(pattern);
  if (!match) {
    return null;
  }
  const [ , owner, repository, tag, assetName ] = match;
  const endpoint =
    `https://api.github.com/repos/${owner}/${repository}/releases/tags/${tag}`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN ? {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      } : {}),
    },
  });
  if (!response.ok) {
    return null;
  }
  const release = await response.json();
  const asset = release.assets?.find(item => item.name === assetName);
  return asset?.url ?? null;
}

async function downloadWithRetry(...args) {
  let lastError;
  for (let attempt = 1; attempt <= maxDownloadAttempts; attempt += 1) {
    try {
      return await download(...args);
    } catch (error) {
      lastError = error;
      const status = error.response?.statusCode ?? error.statusCode;
      if (status !== undefined && !retryableStatuses.has(status)) {
        throw error;
      }
      const assetUrl = await resolveGitHubReleaseAsset(args[0]);
      if (assetUrl) {
        try {
          return await download(assetUrl, args[1], {
            ...args[2],
            headers: githubHeaders(),
          });
        } catch (fallbackError) {
          lastError = fallbackError;
        }
      }
      if (attempt === maxDownloadAttempts) {
        throw error;
      }
      await sleep(5000 * (2 ** (attempt - 1)));
    }
  }
  throw lastError;
}

/**
 * Validate the actual version and the headers required by code generation,
 * so a stale installation left over from another branch is never reused.
 * @param {string} directory SFML install or extraction directory.
 * @param {string} library System library path relative to the SDK.
 */
async function validateInstallation(directory, library) {
  const config = await fs.readFile(
    path.join(directory, 'include/SFML/Config.hpp'), 'utf8'
  );
  const version = [ 'MAJOR', 'MINOR', 'PATCH' ]
    .map(part => {
      const pattern = new RegExp(`#define\\s+SFML_VERSION_${part}\\s+(\\d+)`);
      return config.match(pattern)?.[1];
    })
    .join('.');
  if (version !== urls.version) {
    throw new Error(`Unexpected SFML headers: ${version}`);
  }
  const headers = [
    'Window/WindowEnums', 'Window/Cursor', 'Window/Keyboard', 'Window/Mouse',
    'Window/Joystick', 'Window/Sensor', 'Network/Ftp', 'Network/Sftp',
  ];
  await Promise.all([
    fs.access(path.join(directory, library)),
    ...headers.map(header => fs.access(
      path.join(directory, 'include/SFML', `${header}.hpp`)
    )),
  ]);
}

/**
 * Ensure the pinned SDK archive is present and complete before native builds.
 * @return {Promise<void>} Resolves after validation or replacement.
 */
async function ensureSdk() {
  const url = urls.get();
  const parent = path.join(__dirname, '../third_party');
  const target = path.join(parent, 'sfml');
  const identity = `${urls.version}-${process.platform}-${process.arch}`;
  const marker = path.join(target, '.installed');
  const library = {
    darwin: 'lib/libsfml-system.dylib',
    linux: 'lib/libsfml-system.so',
    win32: 'lib/sfml-system.lib',
  }[process.platform];

  let reusable = false;
  try {
    if ((await fs.readFile(marker, 'utf8')) === identity) {
      await validateInstallation(target, library);
      reusable = true;
    }
  } catch {
    // No complete installation for this version and architecture yet.
  }
  if (reusable) {
    console.log(`[sfml.js-interop] Using SFML ${identity}`);
    return;
  }

  await fs.mkdir(parent, { recursive: true });
  const staging = await fs.mkdtemp(path.join(parent, '.sfml-download-'));
  try {
    console.log(`[sfml.js-interop] Downloading ${url}`);
    const hardLinks = [];
    await downloadWithRetry(url, staging, {
      extract: true,
      strip: 1,
      filter(file) {
        if (file.type !== 'link') {
          return true;
        }
        hardLinks.push(file);
        return false;
      },
    });
    // decompress only strips entry prefixes; restore hard links after their
    // targets have been written.
    for (const file of hardLinks) {
      const source = file.linkname.split('/').slice(1).join('/');
      await fs.link(path.join(staging, source), path.join(staging, file.path));
    }
    await validateInstallation(staging, library);
    await fs.writeFile(path.join(staging, '.installed'), identity);
    await fs.rm(target, { recursive: true, force: true });
    await fs.rename(staging, target);
    console.log(`[sfml.js-interop] Installed SFML ${identity}`);
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

/**
 * Prepare the SDK and its native Window extension for an actual package build.
 * @return {Promise<void>} Resolves after the extension has been installed.
 */
async function main() {
  await ensureSdk();
  const { prepareWindowInput } = require('./sfml/build-window.cjs');
  await prepareWindowInput();
}

module.exports = { ensureSdk };

if (require.main === module) {
  main().catch(error => {
    console.error(`[sfml.js-interop] ${error.message}`);
    process.exitCode = 1;
  });
}
