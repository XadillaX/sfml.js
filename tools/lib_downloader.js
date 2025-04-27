'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const download = require('download');
const Spinner = require('tiny-spinner');

const urls = require('./lib_downloader_urls');

const spinner = new Spinner();
const platform = os.platform();
let type;

switch (platform) {
  case 'darwin': {
    if (process.arch === 'x64') {
      type = 'macOS';
      console.log('[sfml.js] Detected macOS Intel (x64) architecture');
    } else if (process.arch === 'arm64') {
      type = 'macOSArm';
      console.log('[sfml.js] Detected macOS ARM (arm64) architecture');
    } else {
      throw new Error('Unsupported architecture: ' + process.arch);
    }
    break;
  }

  case 'aix':
  case 'freebsd':
  case 'netbsd':
  case 'openbsd':
  case 'sunos':
  case 'linux': {
    if (process.arch !== 'x64') {
      throw new Error('Unsupported architecture: ' + process.arch);
    }

    type = 'linux';
    break;
  }

  case 'win32': {
    if (process.arch === 'x64') {
      type = 'win64';
    } else if (process.arch === 'ia32') {
      type = 'win32';
    } else {
      throw new Error('Unsupported architecture: ' + process.arch);
    }

    break;
  }

  default:
    throw new Error('Unsupported platform: ' + platform);
}

async function downloadTarball(url) {
  spinner.start(`Downloading and extracting ${url}...`);

  await download(url, path.join(__dirname, '../dest'), {
    extract: true,
    strip: 1,
  });

  spinner.stop(`[sfml.js] ${url} Downloaded.`);
}

(async () => {
  fs.rmSync(path.join(__dirname, '../dest'), { recursive: true, force: true });
  fs.rmSync(
    path.join(__dirname, '../third_party/sfml/platform/macOS'),
    { recursive: true, force: true });
  fs.rmSync(
    path.join(__dirname, '../third_party/sfml/platform/linux'),
    { recursive: true, force: true });
  fs.rmSync(
    path.join(__dirname, '../third_party/sfml/platform/win'),
    { recursive: true, force: true });

  await downloadTarball((await urls.get())[type]);
  let copier;
  switch (type) {
    case 'macOS':
    case 'macOSArm':
      copier = require('./copier/macos');
      break;

    case 'linux':
      copier = require('./copier/linux');
      break;

    case 'win64':
    case 'win32':
      copier = require('./copier/windows');
      break;

    default:
      throw new Error('Unsupported platform: ' + platform);
  }

  await copier.move(spinner);

  fs.rmSync(path.join(__dirname, '../dest'), { recursive: true, force: true });
})();
