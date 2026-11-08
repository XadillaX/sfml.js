'use strict';

const fs = require('node:fs/promises');
const syncFs = require('node:fs');
const path = require('node:path');
const download = require('download');

const versions = {
  imgui: 'v1.91.9b',
  imguiSfml: 'v3.0',
  dearBindings: 'DearBindings_v0.13_ImGui_v1.91.9b',
};

const urls = {
  imgui: 'https://codeload.github.com/ocornut/imgui/zip/refs/tags/' +
    versions.imgui,
  imguiSfml:
    'https://codeload.github.com/SFML/imgui-sfml/zip/refs/tags/' +
    versions.imguiSfml,
  dcimgui(name) {
    return 'https://github.com/dearimgui/dear_bindings/releases/download/' +
      `${versions.dearBindings}/${name}`;
  },
};

const identity = [
  versions.imgui,
  versions.imguiSfml,
  versions.dearBindings,
].join('-');

const thirdParty = path.join(__dirname, '../third_party');
const marker = path.join(thirdParty, '.installed');
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
    '^https://github\\.com/([^/]+)/([^/]+)' +
    '/releases/download/([^/]+)/([^?]+)'
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
 * Extract a zip into target, keeping only the first-level subdirectory.
 * @param {string} url Download URL.
 * @param {string} target Target directory.
 */
async function extract(url, target) {
  const staging = await fs.mkdtemp(path.join(thirdParty, '.deps-'));
  try {
    await downloadWithRetry(url, staging, { extract: true, strip: 1 });
    await fs.rm(target, { recursive: true, force: true });
    await fs.rename(staging, target);
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

/**
 * Download a single file to target.
 * @param {string} url Download URL.
 * @param {string} target Target file path.
 */
async function fetchFile(url, target) {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await downloadWithRetry(url, path.dirname(target), {
    filename: path.basename(target),
  });
}

/**
 * Validate dependency versions and required files so an incomplete or
 * mismatched directory is never reused.
 */
async function validate() {
  const imguiHeader = await fs.readFile(
    path.join(thirdParty, 'imgui/imgui.h'), 'utf8');
  if (!imguiHeader.includes('#define IMGUI_VERSION') ||
      !imguiHeader.includes('"1.91.9b"')) {
    throw new Error('Unexpected Dear ImGui headers');
  }
  await Promise.all([
    fs.access(path.join(thirdParty, 'imgui-sfml/imgui-SFML.cpp')),
    fs.access(path.join(thirdParty, 'imgui-sfml/imconfig-SFML.h')),
    fs.access(path.join(thirdParty, 'dcimgui/dcimgui.h')),
    fs.access(path.join(thirdParty, 'dcimgui/dcimgui.cpp')),
    fs.access(path.join(thirdParty, 'dcimgui/dcimgui.json')),
  ]);
}

/**
 * Validate the shared contract version and prebuilt SFML artifacts, and
 * report an actionable fix when something is missing.
 */
function validateInterop() {
  const interop = require('sfml.js-interop/paths');
  const header = path.join(interop.include, 'sfml-js-interop.h');
  if (!syncFs.existsSync(header)) {
    throw new Error(
      `sfml.js-interop at ${interop.root} does not ship sfml-js-interop.h.`);
  }
  const version = Number(syncFs.readFileSync(header, 'utf8')
    .match(/#define SFMLJS_INTEROP_VERSION (\d+)/)?.[1] ?? 0);
  if (version < 1) {
    throw new Error(`sfml.js-interop version ${version} is too old.`);
  }
  if (!syncFs.existsSync(path.join(interop.sfmlInclude, 'SFML/Config.hpp')) ||
      !syncFs.existsSync(interop.sfmlLib)) {
    throw new Error(
      `SFML SDK is missing under ${interop.root}. Run ` +
      `"npm --prefix ${interop.root} run download:sfml" once.`);
  }
}

async function main() {
  validateInterop();
  await fs.mkdir(thirdParty, { recursive: true });

  try {
    if ((await fs.readFile(marker, 'utf8')) === identity) {
      await validate();
      console.log(`[sfml.js-imgui] Using ${identity}`);
      return;
    }
  } catch {
    // Dependencies are not fully downloaded yet.
  }

  console.log(`[sfml.js-imgui] Downloading ${identity}`);
  await extract(urls.imgui, path.join(thirdParty, 'imgui'));
  await extract(urls.imguiSfml, path.join(thirdParty, 'imgui-sfml'));
  await Promise.all([
    'dcimgui.h',
    'dcimgui.cpp',
    'dcimgui.json',
  ].map(name => fetchFile(
    urls.dcimgui(name), path.join(thirdParty, 'dcimgui', name))));

  await validate();
  await fs.writeFile(marker, identity);
  console.log(`[sfml.js-imgui] Installed ${identity}`);
}

main().catch(error => {
  console.error(`[sfml.js-imgui] ${error.message}`);
  process.exitCode = 1;
});
