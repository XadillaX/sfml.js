'use strict';

const { spawnSync } = require('node:child_process');
const { readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const result = spawnSync(process.execPath, [
  require.resolve('node-gyp/bin/node-gyp.js'),
  'configure', '--', '-f', 'compile_commands_json',
], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const generated = path.join(root, 'build/Release/compile_commands.json');
const commands = JSON.parse(readFileSync(generated, 'utf8'));
for (const command of commands) {
  // GYP emits "."; clangd requires an absolute working directory.
  command.directory = root;
}
const database = path.join(root, 'build/compile_commands.json');
writeFileSync(database, JSON.stringify(commands, null, 2) + '\n');
console.log(`[sfml.js] Generated ${database}`);
