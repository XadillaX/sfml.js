'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const download = require('download');
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
    const hardLinks = [];
    await download(url, staging, {
      extract: true,
      strip: 1,
      filter(file) {
        if (file.type !== 'link') return true;
        hardLinks.push(file);
        return false;
      },
    });
    // decompress 仅裁剪条目路径；硬链接需在目标文件写入后同步裁剪并还原。
    for (const file of hardLinks) {
      const source = file.linkname.split('/').slice(1).join('/');
      await fs.link(path.join(staging, source), path.join(staging, file.path));
    }
    await validateInstallation(staging, library);
    await fs.writeFile(path.join(staging, '.installed'), identity);
    await fs.rm(target, { recursive: true, force: true });
    await fs.rename(staging, target);
    console.log(`[sfml.js] Installed SFML ${identity}`);
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(`[sfml.js] ${error.message}`);
  process.exitCode = 1;
});
