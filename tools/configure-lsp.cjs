'use strict';

// Merges the per-package compile_commands.json files produced by
// tools/native-build.cjs into one database at the repository root, where the
// root .clangd points clangd.
//
// Runs as a postbuild hook of each binding package, so it must stay
// side-effect-free towards build artifacts and be safe to run when only one
// package has built: packages without a database yet are skipped.
//
// The interop headers also need synthetic entries: clangd only applies a
// command to the exact file an entry names, so a header without its own entry
// is parsed with no flags at all.

const { existsSync, readFileSync, readdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const projects = [ 'sfml.js', 'sfml.js-imgui' ];
const interopInclude = path.join(root, 'packages/sfml.js-interop/include');
const databasePath = path.join(root, 'compile_commands.json');

// GYP emits one file per configuration; Release is the default build.
function loadProject(project) {
  const packageRoot = path.join(root, 'packages', project);
  const file = path.join(packageRoot, 'build/Release/compile_commands.json');
  if (!existsSync(file)) {
    console.log(`[lsp] skip ${project}: ${path.relative(root, file)} not found`);
    return [];
  }

  // Every path inside the commands (sources, includes) is absolute, so any
  // stable directory inside the package works as the execution directory.
  return JSON.parse(readFileSync(file, 'utf8')).map(entry => ({
    ...entry,
    directory: packageRoot,
  }));
}

// Reuses the flags of one compiled translation unit and turns them into a
// standalone header parse command.
function interopHeaderEntries(template) {
  const cut = template.command.lastIndexOf(' -c ');
  if (cut === -1) throw new Error('Unexpected compile command shape');
  const flags = template.command.slice(0, cut);

  return readdirSync(interopInclude)
    .filter(name => name.endsWith('.h'))
    .map(name => {
      const file = path.join(interopInclude, name);
      return {
        command: `${flags} -x c++-header ${file}`,
        directory: interopInclude,
        file,
      };
    });
}

function main() {
  const entries = projects.flatMap(loadProject);
  if (entries.length === 0) {
    console.error('[lsp] no compile_commands.json found; run a native build first');
    process.exit(1);
  }

  entries.push(...interopHeaderEntries(entries[0]));
  entries.sort((left, right) => left.file.localeCompare(right.file));

  writeFileSync(databasePath, JSON.stringify(entries, null, 2) + '\n');
  console.log(`[lsp] merged ${entries.length} entries into ${databasePath}`);
}

main();
