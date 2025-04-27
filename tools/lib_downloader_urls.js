'use strict';

const spidex = require('spidex');
const os = require('os');

const urls = {
  macOS:
    'https://github.com/SFML/SFML/releases/download/2.6.2/SFML-2.6.2-' +
    'macOS-clang-64-bit.tar.gz',
  macOSArm:
    'https://github.com/SFML/SFML/releases/download/2.6.2/SFML-2.6.2-' +
    'macOS-clang-arm64.tar.gz',
  linux:
    'https://github.com/SFML/SFML/releases/download/2.6.2/SFML-2.6.2-linux-' +
    'gcc-64-bit.tar.gz',
  win32:
    'https://github.com/SFML/SFML/releases/download/2.6.2/SFML-2.6.2-' +
    'windows-vc17-32-bit.zip',
  win64:
    'https://github.com/SFML/SFML/releases/download/2.6.2/SFML-2.6.2-' +
    'windows-vc17-64-bit.zip',
};

exports.get = async function get() {
  let resolve;
  const promise = new Promise(res => {
    resolve = res;
  });

  spidex.get('https://ip.tool.lu/', (content, status) => {
    if (status !== 200) {
      console.warn(
        '[sfml.js] Failed to get ip address, fallback to original ' +
        'download URL.');
      resolve(urls);
      return;
    }

    // https://doc.fastgit.org/zh-cn/guide.html
    console.log(content);
    if (content.includes('中国')) {
      for (const key in urls) {
        if (!urls.hasOwnProperty(key)) {
          continue;
        }

        urls[key] = urls[key].replace(
          'https://github.com/',
          'https://download.fastgit.org/');
      }
    }

    resolve(urls);
  }).on('error', err => {
    console.warn(
      `[sfml.js] Cannot get your location with IP (${err.message})` +
      ', fallback to original download URL.');
    resolve(urls);
  });

  return promise;
};
