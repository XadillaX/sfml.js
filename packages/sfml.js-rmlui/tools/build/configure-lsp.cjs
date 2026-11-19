'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const packageRoot = path.resolve(__dirname, '../..');

/**
 * Correct the shipped Lua compilation database before an optional Rush merge.
 * An installed package requires no scripts or configuration outside itself.
 */
function main() {
  const scripts = [[
    path.join(__dirname, 'compile-lua-cxx.cjs'), '--fix-compile-database',
  ]];
  const repositoryRoot = path.resolve(packageRoot, '../..');
  const rushFile = path.join(repositoryRoot, 'rush.json');
  const mergeScript = path.join(repositoryRoot, 'tools/configure-lsp.cjs');
  const repositoryLayout = path.relative(repositoryRoot, packageRoot) ===
    path.join('packages', 'sfml.js-rmlui');
  if (repositoryLayout && fs.existsSync(rushFile) &&
      fs.existsSync(mergeScript)) {
    const rush = JSON.parse(fs.readFileSync(rushFile, 'utf8'));
    const ownsPackage = rush.projects.some(project =>
      project.packageName === 'sfml.js-rmlui' &&
      path.resolve(repositoryRoot, project.projectFolder) === packageRoot);
    if (ownsPackage) {
      scripts.push([ mergeScript ]);
    }
  }
  for (const args of scripts) {
    const result = spawnSync(process.execPath, args, {
      cwd: packageRoot,
      stdio: 'inherit',
    });
    if (result.error) {
      throw result.error;
    }
    if (result.status !== 0) {
      process.exitCode = result.status || 1;
      return;
    }
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[sfml.js-rmlui] ${error.message}`);
    process.exitCode = 1;
  }
}
