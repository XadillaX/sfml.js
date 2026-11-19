'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {
  ensureComponents, validateOptionalDependency, versions,
} = require('../../tools/dependencies/deps_downloader.cjs');
const { compileCommand } = require('../../tools/build/compile-lua-cxx.cjs');
const {
  patchRmlUiFonts,
} = require('../../tools/dependencies/patches/patch-rmlui-fonts.cjs');
const {
  patchRmlUiLua,
} = require('../../tools/dependencies/patches/patch-rmlui-lua.cjs');
const {
  patchRlottie,
} = require('../../tools/dependencies/patches/patch-rlottie.cjs');

async function verify(previous, damaged, expected) {
  const installed = [];
  const operations = {};
  for (const component of Object.keys(versions)) {
    operations[component] = {
      async validate() {
        if (damaged.has(component) && !installed.includes(component)) {
          throw new Error('Missing component');
        }
      },
      async install() {
        installed.push(component);
      },
    };
  }
  await ensureComponents(previous, operations);
  assert.deepEqual(installed, expected);
}

(async () => {
  const optional = [ 'lunasvg', 'rlottie', 'harfbuzz' ];
  const identity = Object.values(versions).join('-');
  await verify('6.3-2.13.3', new Set(), [ 'lua', ...optional ]);
  await verify('6.3-2.13.3-5.4.8', new Set(), optional);
  await verify(identity, new Set(), []);
  await verify(identity, new Set([ 'lua' ]), [ 'lua' ]);
  await verify(identity, new Set([ 'freetype' ]), [ 'freetype' ]);
  await verify(identity, new Set([ 'rlottie' ]), [ 'rlottie' ]);
  await verify('', new Set(), Object.keys(versions));
  console.log('PASS component-upgrades-preserve-existing-dependencies');
  for (const name of optional) {
    await validateOptionalDependency(name,
      path.join(__dirname, '../../third_party', name));
    await assert.rejects(validateOptionalDependency(name,
      path.join(__dirname, '../../third_party', 'missing-dependency')),
    /ENOENT/);
  }
  await assert.rejects(validateOptionalDependency('unknown', ''),
    /Unknown optional dependency/);
  console.log('PASS optional-dependencies-reject-missing-source-and-identity');
  for (const platform of [ 'darwin', 'linux' ]) {
    const command = compileCommand('original.c', 'Release/object.o',
      'arm64', platform);
    assert.ok(command.args.indexOf('-x') <
      command.args.indexOf('original.c'));
    assert.ok(command.args.includes('c++'));
    assert.ok(command.args.includes('-fexceptions'));
  }
  const windows = compileCommand('original.c', 'Release/object.obj',
    'x64', 'win32');
  assert.ok(windows.args.includes('/TP'));
  assert.ok(windows.args.includes('/EHsc'));
  assert.ok(windows.args.includes('/MT'));
  const windowsDebug = compileCommand('original.c',
    path.join('Debug', 'object.obj'), 'x64', 'win32');
  assert.ok(windowsDebug.args.includes('/MTd'));
  assert.throws(() => compileCommand('original.c', 'object.o',
    'unknown', 'darwin'), /Unsupported macOS architecture/);
  console.log('PASS original-lua-cpp-language-and-exception-selection');

  const root = path.join(__dirname, '../../third_party/rmlui');
  const bitmapFile = path.join(root,
    'Samples/basic/bitmap_font/src/FontEngineBitmap.cpp');
  const before = await fs.readFile(bitmapFile, 'utf8');
  let writes = 0;
  const writeFile = fs.writeFile;
  fs.writeFile = async (...args) => {
    ++writes;
    return writeFile(...args);
  };
  try {
    await patchRmlUiFonts(root);
    await patchRmlUiFonts(root);
  } finally {
    fs.writeFile = writeFile;
  }
  assert.equal(writes, 0);
  assert.equal(await fs.readFile(bitmapFile, 'utf8'), before);
  await assert.rejects(patchRmlUiFonts(path.join(root, 'missing')),
    /ENOENT/);
  console.log('PASS bitmap-font-patch-idempotence-and-missing-source');

  const luaFiles = [ 'Include/RmlUi/Lua/Interpreter.h',
    'Source/Lua/Utilities.cpp',
    'Include/RmlUi/Lua/LuaType.inl' ];
  const luaBefore = await Promise.all(luaFiles.map(file =>
    fs.readFile(path.join(root, file), 'utf8')));
  writes = 0;
  fs.writeFile = async (...args) => {
    ++writes;
    return writeFile(...args);
  };
  try {
    await patchRmlUiLua(root);
    await patchRmlUiLua(root);
  } finally {
    fs.writeFile = writeFile;
  }
  assert.equal(writes, 0);
  const luaAfter = await Promise.all(luaFiles.map(file =>
    fs.readFile(path.join(root, file), 'utf8')));
  assert.deepEqual(luaAfter, luaBefore);
  await assert.rejects(patchRmlUiLua(path.join(root, 'missing')), /ENOENT/);
  console.log('PASS lua-contract-patch-idempotence-and-missing-source');

  const rlottieRoot = path.join(__dirname, '../../third_party/rlottie');
  const rlottieFiles = [ 'inc/rlottie.h', 'inc/rlottiecommon.h' ];
  const rlottieBefore = await Promise.all(rlottieFiles.map(file =>
    fs.readFile(path.join(rlottieRoot, file), 'utf8')));
  writes = 0;
  fs.writeFile = async (...args) => {
    ++writes;
    return writeFile(...args);
  };
  try {
    await patchRlottie(rlottieRoot);
    await patchRlottie(rlottieRoot);
  } finally {
    fs.writeFile = writeFile;
  }
  assert.equal(writes, 0);
  const rlottieAfter = await Promise.all(rlottieFiles.map(file =>
    fs.readFile(path.join(rlottieRoot, file), 'utf8')));
  assert.deepEqual(rlottieAfter, rlottieBefore);
  for (const header of rlottieAfter) {
    assert.ok(header.includes(
      '#if defined RLOTTIE_STATIC\n  #define RLOTTIE_API\n'));
  }
  await assert.rejects(patchRlottie(path.join(rlottieRoot, 'missing')),
    /ENOENT/);
  console.log('PASS rlottie-static-headers-and-patch-idempotence');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
