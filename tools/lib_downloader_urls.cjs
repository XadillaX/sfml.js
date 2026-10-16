'use strict';

const version = '3.1.0';
const baseUrl = `https://github.com/SFML/SFML/releases/download/${version}`;
const packages = {
  'darwin-x64': 'macOS-clang-64-bit.tar.gz',
  'darwin-arm64': 'macOS-clang-arm64.tar.gz',
  'linux-x64': 'linux-gcc-64-bit.tar.gz',
  'win32-ia32': 'windows-vc17-32-bit.zip',
  'win32-x64': 'windows-vc17-64-bit.zip',
};

function get(platform = process.platform, arch = process.arch) {
  const suffix = packages[`${platform}-${arch}`];
  if (!suffix) {
    throw new Error(`Unsupported SFML platform: ${platform}-${arch}`);
  }
  const url = `${baseUrl}/SFML-${version}-${suffix}`;
  const mirror = process.env.SFML_DOWNLOAD_MIRROR;
  return mirror ? `${mirror.replace(/\/+$/, '')}/${url}` : url;
}

module.exports = { version, get };
