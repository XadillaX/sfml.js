'use strict';

const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { promisify } = require('node:util');

// 包含版本头、库文件和指向归档根目录内库文件的三个硬链接。
const archive = Buffer.from(
  // eslint-disable-next-line max-len
  'H4sIAAAAAAAC/+3UT0vDMBgG8Jz3KQKe2+Zt+uc8huLEbbKK11FtqoWuLU0L9tsbe1ApQ3GODunzg5Lw5pDDk6fR1erWkjbZwsmKp7xNlBOZkbMoizR7tl+qiv2ZMALP61djuApyw499Pyfpej7jgo2g1U1cm+vZNF0kKs0Kxd9D3z1cbqPlZr1bzW82Wy5nhw+Xa3NIhw/v5veLay5mDP6H6LP/efboVHGXl3Fy2jt+6r9wvUH/yQ0I/R+DTve5ZZKv47qz0uy1aWuFVky2/+brX4TudKP2ti5H6f9wT4EvJeM0xs9p4v3/Pv+kM4Mz5B+65CP/M+T/NfxTRH9s/ykk5A8AAAAAAAAAAAAAAADwW2/TlWMlACgAAA==',
  'base64'
);

test('SFML installer restores stripped archive hard links', async t => {
  const root = path.resolve(__dirname, '..');
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'sfml-installer-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const tools = path.join(temporary, 'tools');
  await fs.mkdir(tools);
  for (const file of [ 'lib_downloader.cjs', 'lib_downloader_urls.cjs' ]) {
    await fs.copyFile(path.join(root, 'tools', file), path.join(tools, file));
  }
  const server = http.createServer((_request, response) => {
    response.end(archive);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const script = path.join(tools, 'lib_downloader.cjs');
  await promisify(execFile)(process.execPath, [ script ], {
    cwd: temporary,
    env: {
      ...process.env,
      NODE_PATH: path.join(root, 'node_modules'),
      SFML_DOWNLOAD_MIRROR: `http://127.0.0.1:${server.address().port}`,
    },
    timeout: 15000,
  });
  const installed = path.join(temporary, 'third_party/sfml');
  const payload = await fs.stat(path.join(installed, 'lib/payload'));
  const libraries = [
    'libsfml-system.so', 'libsfml-system.dylib', 'sfml-system.lib',
  ];
  for (const file of libraries) {
    const library = path.join(installed, 'lib', file);
    assert.equal(await fs.readFile(library, 'utf8'), 'sfml-library-fixture');
    assert.equal((await fs.stat(library)).ino, payload.ino);
  }
  assert.equal(
    await fs.readFile(path.join(installed, '.installed'), 'utf8'),
    `3.1.0-${process.platform}-${process.arch}`
  );
});
