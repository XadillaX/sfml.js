'use strict';

// Run from any directory after a native build:
//   node tools/check-native-style.cjs format
//   node tools/check-native-style.cjs naming
// CLANG_FORMAT and CLANG_TIDY may select locally installed executables.
// The compiler environment (including SDKROOT on macOS) is inherited.

const { readFileSync, readdirSync } = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const sourceDirectories = [
  'packages/sfml.js/native',
  'packages/sfml.js/test/native',
  'packages/sfml.js-interop/include',
  'packages/sfml.js-interop/test',
  'packages/sfml.js-imgui/native',
  'packages/sfml.js-rmlui/native',
];
const sourceExtensions = new Set([ '.c', '.cc', '.cpp', '.cxx', '.m', '.mm' ]);
const headerExtensions = new Set([ '.h', '.hh', '.hpp', '.hxx' ]);
const excludedDirectories = new Set([
  'third_party', 'node_modules', 'build', 'dist',
]);

/**
 * Collect only project-maintained native sources and headers.
 * @param {string} directory - Source directory to inspect.
 * @return {string[]} Absolute source paths.
 */
function collect(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return excludedDirectories.has(entry.name) ? [] : collect(file);
    }
    const extension = path.extname(entry.name);
    const supported = sourceExtensions.has(extension) ||
      headerExtensions.has(extension);
    return entry.isFile() && supported ? [ file ] : [];
  });
}

/**
 * Preserve diagnostics on failure without flooding output for clean files.
 * @param {string} executable - Style checker executable.
 * @param {string[]} args - Command arguments.
 * @return {boolean} Whether the check passed.
 */
function run(executable, args) {
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    return false;
  }
  return true;
}

/**
 * Check spelling with real compiler flags; missing compilation units fail.
 * @param {string[]} files - Project-maintained source paths.
 * @return {boolean} Whether all naming checks passed.
 */
function checkNaming(files) {
  const owned = new Set(files);
  const databasePath = path.join(root, 'compile_commands.json');
  const database = JSON.parse(readFileSync(databasePath, 'utf8'));
  const compiled = new Set(database
    .map(entry => path.resolve(entry.directory, entry.file))
    .filter(file => owned.has(file)));
  const missing = files.filter(file => {
    const extension = path.extname(file);
    const objectiveC = [ '.m', '.mm' ].includes(extension);
    return sourceExtensions.has(extension) &&
      !(process.platform !== 'darwin' && objectiveC) && !compiled.has(file);
  });
  if (missing.length) {
    throw new Error('Missing compile commands; rebuild native packages:\n' +
      missing.join('\n'));
  }
  let passed = true;
  for (const file of compiled) {
    passed = run(process.env.CLANG_TIDY || 'clang-tidy', [
      '-p', root,
      `--config-file=${path.join(root, '.clang-tidy')}`,
      '--warnings-as-errors=readability-identifier-naming',
      file,
    ]) && passed;
  }
  if (passed) {
    console.log(
      `[native-style] naming: ${compiled.size} compilation units passed`);
  }
  return passed;
}

function main() {
  const mode = process.argv[2];
  if (![ 'format', 'naming' ].includes(mode)) {
    throw new Error('Usage: node tools/check-native-style.cjs <format|naming>');
  }
  const files = sourceDirectories
    .flatMap(directory => collect(path.join(root, directory))).sort();
  const passed = mode === 'naming' ? checkNaming(files) : run(
    process.env.CLANG_FORMAT || 'clang-format',
    [ '--dry-run', '--Werror', ...files ]);
  if (passed && mode === 'format') {
    console.log(`[native-style] format: ${files.length} files passed`);
  }
  if (!passed) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
