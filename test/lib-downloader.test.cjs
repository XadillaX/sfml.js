'use strict';

const assert = require('node:assert/strict');
const { execFile } = require('node:child_process');
const fs = require('node:fs/promises');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { promisify } = require('node:util');

// 包含生成器所需头文件、库文件和指向归档根目录内库文件的三个硬链接。
const archive = Buffer.from(
  // eslint-disable-next-line max-len
  'H4sIAAAAAAAC/+3aXWuCUBzHca97FcKuy3N8vI4oVls1cmyXYXlcUnniqDTf/U4Se4hYTMPD6PeBUPTCiz9fT5b+YPzYtjq0Q4w4WW7ykBm+PGT0eBLFb53VbqfVRiTXtsutdLol1PQ+98vj1DJtR9OJ1oA8zQIhL6/dpruQRXHC9MPQ5y/9mT+cTubj7mg6063W+ZPDiTxJz5986j737nXS0uB/8L/638QLYxcUGx6E173Gpf6JaZ/0T02Xov8mpNF205aTF4Eo2lH8nuWCoYqb7P/H+v8aJyHfHzf9JN+m1b8LXO7/dP13HBfrfyMMo1zA9RULQib04x0A6zf6L/vv5SLlouZjwN/7tx3XQv/oHxT3/8CKBQ9EWOsOUGH9J7aL/tE/KO5/zPOU1f0VsML6b3noH/2D6v5HvEizeLluev2nBM//6B9U9++zRM3zv+Ohf/QPqvqfsGzPxdoYZLvaLwFU6N808f8f+gfl/ftR/RtAhf5tYqN/9A8N9n94/0d+yjdCUvnYz7adlF/jGhf7P92nrmNZmk6beDnpxvv/ff5hIQ8omL9nUgfzVzD/78O/xuir9k89ivkDAAAAAAAAAAAAAAAAAAAAAFzyAT0h4yoAUAAA',
  'base64'
);

/**
 * 在隔离目录中通过本地 HTTP 归档执行真实安装脚本。
 * @param {import('node:test').TestContext} t 注册临时资源清理的测试上下文。
 */
async function installer(t) {
  const root = path.resolve(__dirname, '..');
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'sfml-installer-'));
  t.after(() => fs.rm(temporary, { recursive: true, force: true }));
  const tools = path.join(temporary, 'tools');
  await fs.mkdir(tools);
  for (const file of [ 'lib_downloader.cjs', 'lib_downloader_urls.cjs' ]) {
    await fs.copyFile(path.join(root, 'tools', file), path.join(tools, file));
  }
  let requests = 0;
  const server = http.createServer((_request, response) => {
    requests++;
    response.end(archive);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const script = path.join(tools, 'lib_downloader.cjs');
  const run = () => promisify(execFile)(process.execPath, [ script ], {
    cwd: temporary,
    env: {
      ...process.env,
      NODE_PATH: path.join(root, 'node_modules'),
      SFML_DOWNLOAD_MIRROR: `http://127.0.0.1:${server.address().port}`,
    },
    timeout: 15000,
  });
  const installed = path.join(temporary, 'third_party/sfml');
  return { run, installed, requests: () => requests };
}

test('SFML installer restores stripped archive hard links', async t => {
  const { run, installed } = await installer(t);
  await run();
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

test('SFML installer reuses a complete matching installation', async t => {
  const fixture = await installer(t);
  await fixture.run();
  await fixture.run();
  assert.equal(fixture.requests(), 1);
});

for (const header of [
  'Config.hpp', 'Window/Cursor.hpp', 'Network/Sftp.hpp',
]) {
  test(`SFML installer repairs missing ${header} despite its marker`,
    async t => {
      const fixture = await installer(t);
      await fixture.run();
      const file = path.join(fixture.installed, 'include/SFML', header);
      const expected = await fs.readFile(file);
      await fs.rm(file);
      await fixture.run();
      assert.deepEqual(await fs.readFile(file), expected);
      assert.equal(fixture.requests(), 2);
    });
}

test('SFML installer rejects old headers despite a matching marker',
  async t => {
    const fixture = await installer(t);
    await fixture.run();
    const config = path.join(fixture.installed, 'include/SFML/Config.hpp');
    const expected = await fs.readFile(config, 'utf8');
    await fs.writeFile(config, expected.replace('MAJOR 3', 'MAJOR 2'));
    await fixture.run();
    assert.equal(await fs.readFile(config, 'utf8'), expected);
    assert.equal(fixture.requests(), 2);
  });
