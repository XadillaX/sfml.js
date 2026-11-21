'use strict';

const fs = require('node:fs/promises');
const syncFs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const download = require('download');
const optionalDependencies = require('./optional-dependencies.json');
const sourceDependencies = require('./source-dependencies.json');
const { validateVendoredSource } = require('./vendored-source.cjs');
const { validateHarfBuzzSource } = require('./harfbuzz-source.cjs');

// RmlUi 6.3 keeps the compiled-geometry RenderInterface and the 20-byte
// Rml::Vertex layout, identical to sf::Vertex in SFML 3.1.
const versions = {
  rmlui: sourceDependencies.rmlui.version,
  freetype: sourceDependencies.freetype.version,
  lua: '5.4.8',
  ...Object.fromEntries(Object.entries(optionalDependencies)
    .map(([ name, dependency ]) => [ name, dependency.version ])),
};

const urls = {
  lua: `https://www.lua.org/ftp/lua-${versions.lua}.tar.gz`,
};

const luaArchiveDigest =
  '4f18ddae154e793e46eeab727c59ef1c0c0c2b744e7b94219710d76f530629ae';
const identity = Object.values(versions).join('-');

const packageRoot = path.join(__dirname, '../..');
const thirdParty = path.join(packageRoot, 'third_party');
const marker = path.join(thirdParty, '.installed');
const gypiFragment = path.join(packageRoot, 'native/generated/rmlui-deps.gypi');
const retryableStatuses = new Set([ 429, 500, 502, 503, 504 ]);
const maxDownloadAttempts = 6;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
      if (attempt === maxDownloadAttempts) {
        throw error;
      }
      await sleep(Math.min(30000, 5000 * (2 ** (attempt - 1))));
    }
  }
  throw lastError;
}

/**
 * Extract a tar.gz archive into target, stripping its top-level directory.
 * @param {string} url Download URL.
 * @param {string} target Target directory.
 * @param {string} [digest] Required SHA-256 digest.
 * @param {string} [cachedArchive] Existing archive, checked before extraction.
 */
async function extractTarGz(url, target, digest, cachedArchive) {
  const staging = await fs.mkdtemp(path.join(thirdParty, '.deps-'));
  try {
    const archive = path.join(staging, 'package.tar.gz');
    const buffer = cachedArchive
      ? await fs.readFile(cachedArchive) : await downloadWithRetry(url);
    const actualDigest = createHash('sha256').update(buffer).digest('hex');
    if (digest && actualDigest !== digest) {
      throw new Error(`Archive checksum mismatch: ${path.basename(target)}`);
    }
    await fs.writeFile(archive, buffer);
    // GNU tar interprets a drive-letter archive path as a remote host.
    // Resolve the local archive from its extraction directory on every host.
    const extract = spawnSync('tar', [ '-xzf', path.basename(archive) ], {
      cwd: staging,
      stdio: 'inherit',
    });
    if (extract.status !== 0) {
      throw new Error(`tar extraction failed for ${path.basename(target)}`);
    }
    const entries = await fs.readdir(staging, { withFileTypes: true });
    const root = entries.find(entry => entry.isDirectory())?.name;
    if (!root) {
      throw new Error('Dependency archive did not contain a root directory');
    }
    await fs.rm(target, { recursive: true, force: true });
    await fs.rename(path.join(staging, root), target);
    if (digest) {
      await fs.writeFile(path.join(target, '.archive-sha256'), digest);
    }
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

async function walk(directory, predicate) {
  const results = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walk(full, predicate));
    } else if (predicate(full)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Enumerate compiled sources after extraction so binding.gyp never drifts
 * from the upstream file layout. Paths stay relative to the package root.
 */
async function generateGypi() {
  const rmlRoot = path.join(packageRoot, sourceDependencies.rmlui.source);
  const rmlSources = (await walk(
    path.join(rmlRoot, 'Source/Core'),
    file => file.endsWith('.cpp')
  )).map(file => path.relative(packageRoot, file));

  // FreeType compiles through unity roots: ftgzip.c includes the bundled
  // zlib sources, ftbase.c the base module, and so on. Parse the upstream
  // BASE_SRCS list instead of walking src/, which would double-compile the
  // included translation units and miss internal header ordering.
  const freetypeRoot = path.join(packageRoot,
    sourceDependencies.freetype.source);
  const freetypeCmake = await fs.readFile(
    path.join(freetypeRoot, 'CMakeLists.txt'), 'utf8');
  const baseSourcesMatch = freetypeCmake.match(/set\(BASE_SRCS([\s\S]*?)\)/);
  if (!baseSourcesMatch) {
    throw new Error('FreeType BASE_SRCS list not found');
  }
  const freetypeSources = (baseSourcesMatch[1].match(/src\/[^\s]+\.c/g) ?? [])
    // bzip2 requires an external libbz2; the internal gzip module remains.
    .filter(file => !file.includes('/bzip2/'))
    .map(file => path.join(sourceDependencies.freetype.source, file));
  freetypeSources.push(
    path.join(sourceDependencies.freetype.source, 'src/base/ftsystem.c'),
    path.join(sourceDependencies.freetype.source, 'src/base/ftdebug.c')
  );

  const generated = {
    variables: {
      rmlui_sources: rmlSources,
      rmlui_debugger_sources: (await walk(
        path.join(rmlRoot, 'Source/Debugger'), file => file.endsWith('.cpp')
      )).map(file => path.relative(packageRoot, file)),
      freetype_sources: freetypeSources,
      rmlui_lua_sources: (await walk(
        path.join(rmlRoot, 'Source/Lua'), file => file.endsWith('.cpp')
      )).map(file => path.relative(packageRoot, file)),
      lua_sources: (await walk(
        path.join(thirdParty, 'lua/src'),
        file => file.endsWith('.c') &&
          ![ 'lua.c', 'luac.c' ].includes(path.basename(file))
      )).map(file => path.relative(packageRoot, file)),
      lua_headers: (await walk(
        path.join(thirdParty, 'lua/src'), file => file.endsWith('.h')
      )).map(file => path.relative(packageRoot, file)),
      rmlui_svg_sources: (await walk(
        path.join(rmlRoot, 'Source/SVG'), file => file.endsWith('.cpp')
      )).map(file => path.relative(packageRoot, file)),
      rmlui_lottie_sources: (await walk(
        path.join(rmlRoot, 'Source/Lottie'), file => file.endsWith('.cpp')
      )).map(file => path.relative(packageRoot, file)),
      rmlui_harfbuzz_sources: (await walk(
        path.join(rmlRoot, 'Samples/basic/harfbuzz/src'),
        file => file.endsWith('.cpp') && path.basename(file) !== 'main.cpp'
      )).map(file => path.relative(packageRoot, file)),
      rmlui_bitmap_font_sources: (await walk(
        path.join(rmlRoot, 'Samples/basic/bitmap_font/src'),
        file => file.endsWith('.cpp') && path.basename(file) !== 'main.cpp'
      )).map(file => path.relative(packageRoot, file)),
      lunasvg_sources: (await walk(
        path.join(thirdParty, 'lunasvg/source'),
        file => file.endsWith('.cpp')
      )).map(file => path.relative(packageRoot, file)),
      plutovg_sources: (await walk(
        path.join(thirdParty, 'lunasvg/plutovg/source'),
        file => file.endsWith('.c')
      )).map(file => path.relative(packageRoot, file)),
      rlottie_sources: (await walk(
        path.join(packageRoot, optionalDependencies.rlottie.source, 'src'),
        file => file.endsWith('.cpp') &&
          !file.includes(`${path.sep}wasm${path.sep}`)
      )).map(file => path.relative(packageRoot, file)),
    },
  };
  const fragment = [
    '# GENERATED BY tools/dependencies/deps_downloader.cjs. DO NOT EDIT.',
    JSON.stringify(generated, null, 2),
    '',
  ].join('\n');
  await fs.writeFile(gypiFragment, fragment);
}

async function validate() {
  const rmlRoot = path.join(packageRoot, sourceDependencies.rmlui.source);
  const coreHeader = await fs.readFile(
    path.join(rmlRoot, 'Include/RmlUi/Core.h'), 'utf8');
  if (!coreHeader.includes('Core/Context.h')) {
    throw new Error('Unexpected RmlUi headers');
  }
  await Promise.all([
    fs.access(path.join(rmlRoot, 'Include/RmlUi/Core/RenderInterface.h')),
    fs.access(path.join(rmlRoot,
      'Source/Core/FontEngineDefault/FreeTypeInterface.cpp')),
    fs.access(path.join(packageRoot, sourceDependencies.freetype.source,
      'include/ft2build.h')),
  ]);
  const luaHeader = await fs.readFile(
    path.join(thirdParty, 'lua/src/lua.h'), 'utf8');
  if (!/#define LUA_VERSION_RELEASE\s+"8"/.test(luaHeader) ||
      !/#define LUA_VERSION_NUM\s+504\b/.test(luaHeader)) {
    throw new Error('Unexpected Lua version');
  }
}

/**
 * Upgrade individual components without replacing already pinned neighbours.
 * @param {string} previous Previous component identity.
 * @param {object} operations Per-component validation and installation.
 */
async function ensureComponents(previous, operations) {
  const recorded = previous.split('-');
  for (const [ index, [ component, version ]] of
    Object.entries(versions).entries()) {
    const operation = operations[component];
    if (recorded[index] === version) {
      try {
        await operation.validate();
        continue;
      } catch {
        // Repair only the missing or invalid component.
      }
    }
    await operation.install();
    await operation.validate();
  }
}

/**
 * Require an extracted optional dependency and its recorded archive identity.
 * @param {string} name Manifest dependency name.
 * @param {string} target Extracted source directory.
 */
async function validateOptionalDependency(name, target) {
  const dependency = optionalDependencies[name];
  if (!dependency) {
    throw new Error(`Unknown optional dependency: ${name}`);
  }
  if (name === 'harfbuzz') {
    await validateHarfBuzzSource(target, dependency);
    return;
  }
  if (dependency.source) {
    await validateVendoredSource(target, name, dependency);
    return;
  }
  await fs.access(path.join(target, dependency.header));
  const recorded = await fs.readFile(
    path.join(target, '.archive-sha256'), 'utf8');
  if (recorded !== dependency.sha256) {
    throw new Error(`Unexpected ${name} archive identity`);
  }
  if (name === 'lunasvg') {
    await fs.access(path.join(target, 'plutovg/source/plutovg-canvas.c'));
  }
}

/**
 * Prepare an optional component, using offline validation for vendored sources.
 * @param {string} name Manifest dependency name.
 * @param {string} target Dependency source directory.
 * @return {object} Component validation and installation operations.
 */
function optionalComponentOperations(name, target) {
  const dependency = optionalDependencies[name];
  const validate = () => validateOptionalDependency(name, target);
  if (dependency.source) {
    return { validate, install: validate };
  }
  return {
    validate,
    install: () => extractTarGz(
      `https://codeload.github.com/${dependency.repository}/` +
        `legacy.tar.gz/${dependency.commit}`, target, dependency.sha256,
      process.env.RMLUI_DEPS_ARCHIVE_DIR
        ? path.join(process.env.RMLUI_DEPS_ARCHIVE_DIR,
          `${name}-${dependency.version}.tar.gz`) : undefined),
  };
}

/**
 * Require built-in sources without downloading or patching during install.
 * @param {string} name Source dependency name.
 * @param {string} target Vendored source directory.
 * @return {object} Offline component operations.
 */
function sourceComponentOperations(name, target) {
  const dependency = sourceDependencies[name];
  if (!dependency) {
    throw new Error(`Unknown source dependency: ${name}`);
  }
  const validate = () => validateVendoredSource(target, name, dependency);
  return { validate, install: validate };
}

/**
 * Validate the shared contract version and prebuilt SFML artifacts.
 */
function validateInterop() {
  const interop = require('sfml.js-interop/paths');
  const header = path.join(interop.include, 'sfml-js-interop.h');
  if (!syncFs.existsSync(header)) {
    throw new Error(
      `sfml.js-interop at ${interop.root} does not ship sfml-js-interop.h.`);
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
  const interop = require('sfml.js-interop/paths');
  const { prepareWindowInput } = require(path.join(
    interop.root, 'tools/sfml/build-window.cjs'));
  await prepareWindowInput();
  await fs.mkdir(thirdParty, { recursive: true });

  let previous = '';
  try {
    previous = await fs.readFile(marker, 'utf8');
  } catch {
    // No recorded components.
  }

  await ensureComponents(previous, {
    ...Object.fromEntries(Object.entries(sourceDependencies)
      .map(([ name, dependency ]) => [ name, sourceComponentOperations(
        name, path.join(packageRoot, dependency.source)) ])),
    lua: {
      validate: async () => {
        const header = await fs.readFile(
          path.join(thirdParty, 'lua/src/lua.h'), 'utf8');
        if (!/#define LUA_VERSION_RELEASE\s+"8"/.test(header) ||
            !/#define LUA_VERSION_NUM\s+504\b/.test(header)) {
          throw new Error('Unexpected Lua version');
        }
      },
      install: () => extractTarGz(
        urls.lua, path.join(thirdParty, 'lua'), luaArchiveDigest),
    },
    ...Object.fromEntries(Object.entries(optionalDependencies)
      .map(([ name, dependency ]) => {
        const target = dependency.source
          ? path.join(packageRoot, dependency.source)
          : path.join(thirdParty, name);
        return [ name, optionalComponentOperations(name, target) ];
      })),
  });
  await validate();
  await generateGypi();
  await fs.writeFile(marker, identity);
  console.log(`[sfml.js-rmlui] Installed ${identity}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error(`[sfml.js-rmlui] ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  ensureComponents, validateOptionalDependency,
  optionalComponentOperations, sourceComponentOperations, versions,
};
