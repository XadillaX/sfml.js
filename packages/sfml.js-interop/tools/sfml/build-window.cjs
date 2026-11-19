'use strict';

const { createHash } = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { version } = require('../lib_downloader_urls.cjs');
const { root, run, sourceIdentity, prepareSource } =
  require('./prepare-source.cjs');

/**
 * Paths and CMake settings for the existing platform dependency build.
 * @return {{library: string, built: string, settings: string[]}} Build plan.
 */
function platformBuild() {
  if (process.platform === 'darwin') {
    const name = `libsfml-window.${version}.dylib`;
    return {
      library: `lib/${name}`, built: `lib/${name}`,
      settings: [
        '-DCMAKE_OSX_DEPLOYMENT_TARGET=13.0',
        '-DCMAKE_OSX_ARCHITECTURES=' +
          (process.arch === 'arm64' ? 'arm64' : 'x86_64'),
        '-DCMAKE_BUILD_WITH_INSTALL_RPATH=ON',
        '-DCMAKE_INSTALL_RPATH=@loader_path',
      ],
    };
  }
  if (process.platform === 'linux') {
    const name = `libsfml-window.so.${version}`;
    return {
      library: `lib/${name}`, built: `lib/${name}`,
      settings: [
        '-DCMAKE_BUILD_WITH_INSTALL_RPATH=ON',
        '-DCMAKE_INSTALL_RPATH=$ORIGIN',
      ],
    };
  }
  if (process.platform === 'win32') {
    return {
      library: 'bin/sfml-window-3.dll', built: 'bin/Release/sfml-window-3.dll',
      settings: [
        '-G', 'Visual Studio 17 2022',
        '-A', process.arch === 'ia32' ? 'Win32' : 'x64',
      ],
    };
  }
  throw new Error(`Unsupported native input platform: ${process.platform}`);
}

/**
 * Atomically replace a library or import archive.
 * @param {string} from Built artifact.
 * @param {string} to Installed artifact.
 */
async function replace(from, to) {
  await fs.copyFile(from, `${to}.new`);
  await fs.rename(`${to}.new`, to);
}

/**
 * Build only SFML Window/System from the pinned release in the existing
 * dependency directory. Install Window while retaining the original System.
 */
async function prepareWindowInput() {
  const platform = platformBuild();
  const sdk = path.join(root, 'third_party/sfml');
  const library = path.join(sdk, platform.library);
  const marker = path.join(sdk, '.native-window-input');
  const identity = await sourceIdentity();
  const libraryHash = async () => createHash('sha256')
    .update(await fs.readFile(library)).digest('hex');
  try {
    const installed = JSON.parse(await fs.readFile(marker, 'utf8'));
    if (installed.identity === identity &&
        installed.sha256 === await libraryHash()) {
      return;
    }
  } catch {
    // Rebuild when the SDK, extension, shared protocol or build helper changes.
  }
  const source = await prepareSource();
  const build = path.join(root, 'third_party',
    `sfml-${process.platform === 'darwin' ? 'macos' : process.platform}-build`);
  run('cmake', [
    '-S', source, '-B', build, '-DCMAKE_BUILD_TYPE=Release',
    '-DBUILD_SHARED_LIBS=ON',
    '-DSFML_BUILD_GRAPHICS=OFF', '-DSFML_BUILD_AUDIO=OFF',
    '-DSFML_BUILD_NETWORK=OFF', '-DSFML_CONFIGURE_EXTRAS=OFF',
    ...platform.settings,
  ]);
  run('cmake', [
    '--build', build, '--config', 'Release', '--target', 'sfml-window',
    '--parallel', String(Math.min(os.availableParallelism(), 8)),
  ]);
  await replace(path.join(build, platform.built), library);
  if (process.platform === 'win32') {
    await replace(path.join(build, 'lib/Release/sfml-window.lib'),
      path.join(sdk, 'lib/sfml-window.lib'));
  } else {
    const names = process.platform === 'darwin' ? [
      `libsfml-window.${version.split('.').slice(0, 2).join('.')}.dylib`,
      'libsfml-window.dylib',
    ] : [ 'libsfml-window.so.3.1', 'libsfml-window.so.3', 'libsfml-window.so' ];
    for (const name of names) {
      const alias = path.join(sdk, 'lib', name);
      await fs.symlink(path.basename(library), `${alias}.new`);
      await fs.rename(`${alias}.new`, alias);
    }
  }
  await fs.writeFile(marker, JSON.stringify({
    identity, sha256: await libraryHash(),
  }));
  console.log('[sfml.js-interop] Installed native window input extension');
}

module.exports = { prepareWindowInput };

if (require.main === module) {
  prepareWindowInput().catch(error => {
    console.error(`[sfml.js-interop] ${error.message}`);
    process.exitCode = 1;
  });
}
