'use strict';

const fs = require('fs').promises;
const path = require('path');

const baseDir = path.join(__dirname, '../../dest/SFML-2.5.1-macos-clang');
const targetDir = path.join(__dirname, '../../third_party/sfml/platform/macOS');

exports.move = async function move(spinner) {
  spinner.start('Moving SFML files...');
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });

  const srcFrameworksDir = path.join(baseDir, 'Frameworks');
  const destFrameworksDir = path.join(targetDir, 'Frameworks');
  await fs.rename(srcFrameworksDir, destFrameworksDir);

  const srcExtlibsDir = path.join(baseDir, 'extlibs');
  const extlibs = await fs.readdir(srcExtlibsDir);
  for (const extlib of extlibs) {
    const srcExtlibDir = path.join(srcExtlibsDir, extlib);
    if (!(await fs.stat(srcExtlibDir)).isDirectory()) {
      continue;
    }

    const destExtlibDir = path.join(destFrameworksDir, extlib);
    await fs.rename(srcExtlibDir, destExtlibDir);
  }

  const srcLibDir = path.join(baseDir, 'lib');
  const destLibDir = path.join(targetDir, 'lib');
  await fs.rename(srcLibDir, destLibDir);
  spinner.stop(`[sfml.js] SFML files moved to ${destLibDir}.`);
};
