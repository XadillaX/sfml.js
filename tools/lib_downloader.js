'use strict';

const cp = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const Spinner = require('tiny-spinner');

const urls = require('./lib_downloader_urls');

const spinner = new Spinner();
const platform = os.platform();
let type;

switch (platform) {
  case 'darwin': {
    if (process.arch !== 'x64') {
      throw new Error('Unsupported architecture: ' + process.arch);
    }

    type = 'macOS';
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
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  spinner.start(`Downloading and extracting ${url}...`);

  cp.execFile(
    path.join(__dirname, '../node_modules/download-cli/cli.js'),
    [ '--extract', '--out', path.join(__dirname, '../dest'), url ], err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });

  await promise;

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

  await downloadTarball(urls[type]);
  let copier;
  switch (type) {
    case 'macOS':
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
