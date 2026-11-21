'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

/**
 * Run a Node build tool and preserve its exit status.
 * @param {string[]} args Node entrypoint and arguments.
 * @param {string} packageRoot Directory containing the invoking package.
 * @return {boolean} Whether the child completed successfully.
 */
function run(args, packageRoot) {
  const result = spawnSync(process.execPath, args, {
    cwd: packageRoot,
    stdio: 'inherit',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return false;
  }
  return true;
}

/**
 * Configure and incrementally build the invoking package in its existing tree.
 * Resolve node-gyp from that package's dependencies, including npm hoisting.
 * @return {void}
 */
function build() {
  const packageRoot = process.cwd();
  const nodeGyp = require.resolve('node-gyp/bin/node-gyp.js', {
    paths: [ packageRoot ],
  });
  const format = process.platform === 'win32' ? 'msvs' : 'make';
  if (run([
    nodeGyp, 'configure', '--', '-f', format, '-f', 'compile_commands_json',
  ], packageRoot)) {
    run([ nodeGyp, 'build' ], packageRoot);
  }
}

/**
 * Merge editor metadata only when the invoking package belongs to this Rush
 * repository. Installed npm packages require no files outside their packages.
 * @return {void}
 */
function configureLsp() {
  const packageRoot = process.cwd();
  const repositoryRoot = path.resolve(packageRoot, '../..');
  const rushFile = path.join(repositoryRoot, 'rush.json');
  const mergeScript = path.join(repositoryRoot, 'tools/configure-lsp.cjs');
  if (path.basename(path.dirname(packageRoot)) !== 'packages' ||
      !fs.existsSync(rushFile) || !fs.existsSync(mergeScript)) {
    return;
  }
  const rush = JSON.parse(fs.readFileSync(rushFile, 'utf8'));
  if (rush.projects.some(project =>
    path.resolve(repositoryRoot, project.projectFolder) === packageRoot)) {
    run([ mergeScript ], packageRoot);
  }
}

module.exports = { build, configureLsp };
