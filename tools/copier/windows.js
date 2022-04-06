'use strict';

const fs = require('fs').promises;
const path = require('path');

const baseDir = path.join(__dirname, '../../dest');
const targetDir = path.join(__dirname, '../../third_party/sfml/platform/win');

exports.move = async function move(spinner) {
  spinner.start('Moving SFML files...');
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });

  const srcLibDir = path.join(baseDir, 'lib');
  const destLibDir = path.join(targetDir, 'lib');
  const moves = [];
  const libs = await fs.readdir(srcLibDir);
  await fs.mkdir(destLibDir, { recursive: true });
  for (const lib of libs) {
    // TODO(XadillaX): Use `-d.lib` if Debug.
    if (lib.endsWith('.lib') && !lib.endsWith('-d.lib')) {
      moves.push(
        fs.rename(path.join(srcLibDir, lib), path.join(destLibDir, lib)));
    }
  }
  await Promise.all(moves);

  const srcBinDir = path.join(baseDir, 'bin');
  const destBinDir = path.join(targetDir, 'bin');
  await fs.rename(srcBinDir, destBinDir);

  spinner.stop(`[sfml.js] SFML files moved to ${destLibDir}.`);
};
