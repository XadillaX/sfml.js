'use strict';

const { readFileSync, writeFileSync, mkdirSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const root = resolve(__dirname, '..');
const declarations = [
  [ 'Ftp', 'TransferMode', 'TransferMode' ],
  [ 'Ftp', 'Status', 'FtpStatus' ],
  [ 'Sftp', 'Value', 'SftpResultValue' ],
  [ 'Sftp', 'Type', 'SftpHostKeyType' ],
];
const descriptions = {
  TransferMode: 'FTP 文件传输模式。',
  FtpStatus: 'FTP 服务端响应码和客户端错误码。',
  SftpResultValue: 'SFTP 操作结果码。',
  SftpHostKeyType: 'SSH 服务端主机公钥类型。',
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
  output += `/** ${descriptions[exported]} */\nexport enum ${exported} {\n`;
  for (const entry of body.split(',')) {
    const text = entry.trim();
    if (text) {
      const key = text.match(/^\w+/)[0];
      const description = docs.get(key);
      if (!description) {
        throw new Error(`Missing enum documentation: ${exported}.${key}`);
      }
      output += `  /** ${description} */\n  ${text.replace(/\s+/g, ' ')},\n`;
    }
  }
  output += '}\n';
}
const path = resolve(root, 'src/network/gen/constants.ts');
mkdirSync(dirname(path), { recursive: true });
writeFileSync(path, output);
