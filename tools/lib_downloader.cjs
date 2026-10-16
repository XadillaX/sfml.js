'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const tar = require('tar');
const unzipper = require('unzipper');
const urls = require('./lib_downloader_urls.cjs');

/**
 * 校验实际版本及代码生成所需头文件，避免复用切换分支后残缺的安装目录。
 * @param {string} directory SFML 安装或解压目录。
 * @param {string} library 当前平台的系统库相对路径。
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

async function main() {
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

  try {
    if ((await fs.readFile(marker, 'utf8')) === identity) {
      await validateInstallation(target, library);
      console.log(`[sfml.js] Using SFML ${identity}`);
      return;
    }
  } catch {
    // No complete installation for this version and architecture yet.
  }

  await fs.mkdir(parent, { recursive: true });
  const staging = await fs.mkdtemp(path.join(parent, '.sfml-download-'));
  try {
    console.log(`[sfml.js] Downloading ${url}`);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(300000),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`SFML download failed: HTTP ${response.status}`);
    }
    const archive = Buffer.from(await response.arrayBuffer());
    if (archive[0] === 0x50 && archive[1] === 0x4b) {
      const zip = await unzipper.Open.buffer(archive);
      await zip.extract({ path: staging });
    } else {
      await pipeline(
        Readable.from([ archive ]), tar.x({ cwd: staging, strict: true })
      );
    }
    // 保留归档根目录完成解压，使硬链接和符号链接由解压库正确还原。
    const extracted = path.join(staging, `SFML-${urls.version}`);
    await validateInstallation(extracted, library);
    await fs.writeFile(path.join(extracted, '.installed'), identity);
    await fs.rm(target, { recursive: true, force: true });
    await fs.rename(extracted, target);
    console.log(`[sfml.js] Installed SFML ${identity}`);
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(`[sfml.js] ${error.message}`);
  process.exitCode = 1;
});
