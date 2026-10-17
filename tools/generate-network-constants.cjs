'use strict';

const fs = require('node:fs');
const { readFileSync, writeFileSync, mkdirSync } = fs;
const { resolve, dirname } = require('node:path');
const { constantDoc } = require('./constant-docs.cjs');
const root = resolve(__dirname, '..');
const declarations = [
  [ 'Ftp', 'TransferMode', 'TransferMode' ],
  [ 'Ftp', 'Status', 'FtpStatus' ],
  [ 'Sftp', 'Value', 'SftpResultValue' ],
  [ 'Sftp', 'Type', 'SftpHostKeyType' ],
];
const descriptions = {
  TransferMode: 'FTP file transfer modes.',
  FtpStatus: 'FTP server response codes and client error codes.',
  SftpResultValue: 'SFTP operation result codes.',
  SftpHostKeyType: 'SSH server host public key types.',
};
let output = '// Generated from the bundled SFML Network headers.\n';
for (const [ file, original, exported ] of declarations) {
  const raw = readFileSync(resolve(root,
    `third_party/sfml/include/SFML/Network/${file}.hpp`), 'utf8');
  const rawBody = raw.match(new RegExp(
    `enum class ${original}\\s*\\{([^}]+)\\}`))?.[1];
  if (!rawBody) throw new Error(`Missing ${file}::${original}`);
  const docs = new Map();
  for (const line of rawBody.split('\n')) {
    const match = line.match(/^\s*(\w+)\b.*?\/\/!<\s*(.+)$/);
    if (match) docs.set(match[1], match[2].replace(/\*\//g, '* /'));
  }
  const body = rawBody.replace(/\/\/[^\n]*/g, '');
  output += `${constantDoc(descriptions[exported])}\n`;
  output += `export enum ${exported} {\n`;
  for (const entry of body.split(',')) {
    const text = entry.trim();
    if (text) {
      const key = text.match(/^\w+/)[0];
      const description = docs.get(key);
      if (!description) {
        throw new Error(`Missing enum documentation: ${exported}.${key}`);
      }
      output += `${constantDoc(description, '  ')}\n`;
      output += `  ${text.replace(/\s+/g, ' ')},\n`;
    }
  }
  output += '}\n';
}
const path = resolve(root, 'src/network/gen/constants.ts');
const current = fs.existsSync(path) ? readFileSync(path, 'utf8') : null;
if (process.argv.includes('--check')) {
  if (current !== output) {
    throw new Error(
      'Generated constants are stale: src/network/gen/constants.ts');
  }
} else if (current !== output) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, output);
}
