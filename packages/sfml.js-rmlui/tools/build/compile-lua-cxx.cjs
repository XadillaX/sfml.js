'use strict';

// GYP's Make generator places ordinary flags after the input filename.
// Compile the original .c directly, selecting C++ before that filename.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function compileCommand(source, output, architecture, platform) {
  const debug = output.split(path.sep).includes('Debug');
  if (platform === 'win32') {
    return {
      compiler: process.env.CXX || 'cl.exe',
      args: [
        '/nologo', '/TP', '/EHsc', '/std:c++20', '/c',
        debug ? '/Od' : '/O2', '/D_CRT_SECURE_NO_WARNINGS',
        debug ? '/MDd' : '/MD', '/DLUA_BUILD_AS_DLL',
        source, `/Fo${output}`,
      ],
    };
  }
  const args = [
    '-x', 'c++', '-std=c++20', '-fexceptions', '-fPIC',
    debug ? '-O0' : '-O3',
  ];
  if (platform === 'darwin') {
    const arch = { arm64: 'arm64', x64: 'x86_64' }[architecture];
    if (!arch) {
      throw new Error(`Unsupported macOS architecture: ${architecture}`);
    }
    args.push('-arch', arch, '-mmacosx-version-min=13.0');
  }
  args.push('-c', source, '-o', output);
  return { compiler: process.env.CXX || 'c++', args };
}

function shellQuote(value) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

// compile_commands_json does not inspect custom rules. Replace its default
// C commands with the actual command used above, before the root LSP merge.
function fixCompileDatabase() {
  const packageRoot = path.resolve(__dirname, '../..');
  const buildRoot = path.join(packageRoot, 'build');
  const config = JSON.parse(fs.readFileSync(
    path.join(buildRoot, 'config.gypi'), 'utf8')
    .replace(/^#.*$/gm, ''));
  for (const mode of [ 'Debug', 'Release' ]) {
    const file = path.join(buildRoot, mode, 'compile_commands.json');
    if (!fs.existsSync(file)) {
      continue;
    }
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    let count = 0;
    for (const row of rows) {
      const source = path.resolve(packageRoot, row.file);
      const relative = path.relative(
        path.join(packageRoot, 'third_party/lua/src'), source);
      if (relative.startsWith('..') || !relative.endsWith('.c')) {
        continue;
      }
      const suffix = process.platform === 'win32' ? '.obj' : '.o';
      const output = path.join(buildRoot, mode, 'obj.target/lua/geni',
        path.basename(source, '.c') + suffix);
      const command = compileCommand(source, output,
        config.variables.target_arch, process.platform);
      row.directory = packageRoot;
      delete row.command;
      row.arguments = [ command.compiler, ...command.args ];
      // Preserve the command form for Unix LSP consumers. On Windows, the
      // exact argument array avoids interpreting POSIX quoting as cmd syntax.
      if (process.platform !== 'win32') {
        row.command = row.arguments.map(shellQuote).join(' ');
      }
      ++count;
    }
    if (count !== 32) {
      throw new Error(`Expected 32 Lua compilation entries, found ${count}`);
    }
    fs.writeFileSync(file, JSON.stringify(rows, null, 2));
  }
}

function main() {
  const [ source, output, architecture ] = process.argv.slice(2);
  if (!source || !output || !architecture || !source.endsWith('.c')) {
    throw new Error('Expected original Lua source, object output and arch');
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const command = compileCommand(
    source, output, architecture, process.platform);
  const result = spawnSync(
    command.compiler, command.args, { stdio: 'inherit' });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (require.main === module) {
  if (process.argv[2] === '--fix-compile-database') {
    fixCompileDatabase();
  } else {
    main();
  }
}

module.exports = { compileCommand };
