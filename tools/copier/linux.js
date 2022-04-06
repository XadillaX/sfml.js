'use strict';

const fs = require('fs').promises;
const path = require('path');

const baseDir = path.join(__dirname, '../../dest');
const targetDir = path.join(__dirname, '../../third_party/sfml/platform/linux');

exports.move = async function move(spinner) {
  spinner.start('Moving SFML files...');
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });

  const srcLibDir = path.join(baseDir, 'lib');
  const destLibDir = path.join(targetDir, 'lib');
  await fs.rename(srcLibDir, destLibDir);

  await fs.rm(path.join(destLibDir, 'cmake'), { recursive: true, force: true });

  spinner.stop(`[sfml.js] SFML files moved to ${destLibDir}.`);
};
