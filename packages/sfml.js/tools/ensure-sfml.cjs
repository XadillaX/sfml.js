'use strict';

const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { root } = require('sfml.js-interop/paths');

// The downloader runs itself; its paths are relative to its own package.
execFileSync(process.execPath,
  [ path.join(root, 'tools/lib_downloader.cjs') ], { stdio: 'inherit' });
