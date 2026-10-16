'use strict';

/* eslint-disable no-bitwise */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const { generateKeyPairSync } = require('node:crypto');
const { once } = require('node:events');
const { Server, utils } = require('ssh2');
const { Sftp, SftpResultValue: V, FileType } = require('../dist/network/sftp');
const { IpAddress } = require('../dist/network/ip-address');
const { milliseconds } = require('../dist/system/time');
const { TimeoutWithPredicate } =
  require('../dist/system/timeout-with-predicate');

function identity() {
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const privateKey = pair.privateKey.export({ type: 'pkcs1', format: 'pem' });
  const parsed = utils.parseKey(privateKey);
  const encoded = parsed.getPublicSSH().toString('base64');
  const publicKey = `${parsed.type} ${encoded}`;
  return { privateKey, publicKey, parsed };
}
const host = identity();
const user = identity();

async function fixture(action) {
  const files = new Map([[ '/hello', Buffer.from('hello world') ]]);
  const directories = new Set([ '/' ]);
  const clients = new Set();
  const server = new Server({ hostKeys: [ host.privateKey ] }, client => {
    clients.add(client);
    client.on('error', () => {});
    client.on('close', () => clients.delete(client));
    client.on('authentication', ctx => {
      if (ctx.username !== 'user') return ctx.reject();
      if (ctx.method === 'password' && ctx.password === 'pass') ctx.accept();
      else if (ctx.method === 'publickey' &&
          ctx.key.data.equals(user.parsed.getPublicSSH()) &&
          (!ctx.signature || user.parsed.verify(ctx.blob, ctx.signature,
            ctx.hashAlgo))) ctx.accept();
      else ctx.reject([ 'password', 'publickey' ]);
    });
    client.on('ready', () => client.on('session', accept => {
      const session = accept();
      session.on('sftp', accept => {
        const sftp = accept();
        let id = 0;
        const handles = new Map();
        const info = path => ({
          mode: directories.has(path) ? 0o40755 : 0o100644,
          uid: 1000, gid: 1000, size: files.get(path)?.length ?? 0,
          atime: 1700000000, mtime: 1700000000,
        });
        const handle = value => {
          const key = String(++id);
          handles.set(key, value);
          return Buffer.from(key);
        };
        const stat = (req, path) => {
          if (path === '/stall') return;
          if (files.has(path) || directories.has(path)) {
            sftp.attrs(req, info(path));
          } else sftp.status(req, 2);
        };
        sftp.on('REALPATH', (req, path) => sftp.name(req, [
          { filename: path === '.' ? '/' : path, longname: path, attrs: {} },
        ]));
        sftp.on('STAT', stat).on('LSTAT', stat);
        sftp.on('OPEN', (req, path, flags) => {
          if (!files.has(path) && !(flags & 8)) return sftp.status(req, 2);
          if (!files.has(path) || flags & 16) files.set(path, Buffer.alloc(0));
          sftp.handle(req, handle({ path, append: !!(flags & 4) }));
        });
        sftp.on('READ', (req, key, offset, length) => {
          const entry = handles.get(key.toString());
          const file = files.get(entry.path);
          if (offset >= file.length) sftp.status(req, 1);
          else sftp.data(req, file.subarray(offset, offset + length));
        });
        sftp.on('WRITE', (req, key, offset, data) => {
          const entry = handles.get(key.toString());
          const old = files.get(entry.path);
          if (entry.append) offset = old.length;
          const next = Buffer.alloc(Math.max(old.length, offset + data.length));
          old.copy(next);
          data.copy(next, offset);
          files.set(entry.path, next);
          sftp.status(req, 0);
        });
        sftp.on('CLOSE', (req, key) => {
          handles.delete(key.toString()); sftp.status(req, 0);
        });
        sftp.on('OPENDIR', (req, path) => {
          if (!directories.has(path)) return sftp.status(req, 2);
          sftp.handle(req, handle({ path, listed: false }));
        });
        sftp.on('READDIR', (req, key) => {
          const entry = handles.get(key.toString());
          if (entry.listed) return sftp.status(req, 1);
          entry.listed = true;
          sftp.name(req, [ ...files.keys() ].map(path => ({
            filename: path.slice(1), longname: path, attrs: info(path),
          })));
        });
        sftp.on('MKDIR', (req, path) => {
          directories.add(path); sftp.status(req, 0);
        });
        sftp.on('RMDIR', (req, path) => {
          sftp.status(req, directories.delete(path) ? 0 : 2);
        });
        sftp.on('REMOVE', (req, path) => {
          sftp.status(req, files.delete(path) ? 0 : 2);
        });
        sftp.on('RENAME', (req, path, next) => {
          if (!files.has(path)) return sftp.status(req, 2);
          if (files.has(next)) return sftp.status(req, 4);
          files.set(next, files.get(path));
          files.delete(path); sftp.status(req, 0);
        });
      });
    }));
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const client = new Sftp();
  try { await action(client, server.address().port, files); } finally {
    client.close();
    for (const connection of clients) connection.end();
    await new Promise(resolve => server.close(resolve));
  }
}

test('SFTP connect and login remain separate; auth retry and streaming work',
  { timeout: 10000 }, () => fixture(async (client, port, files) => {
    assert.equal((await client.connect(IpAddress.LocalHost, port,
      milliseconds(1000))).getValue(), V.Success);
    const session = client.getSessionInfo();
    assert.ok(session.keyExchangeAlgorithm);
    assert.equal(session.hostKey.sha256.length, 32);
    assert.equal(session.hostKey.type, Sftp.HostKeyType.Rsa);
    assert.equal((await client.login('user', 'wrong',
      milliseconds(500))).getValue(), V.AuthenticationFailed);
    assert.equal((await client.login('user', 'pass',
      milliseconds(1000))).getValue(), V.Success);
    assert.equal((await client.getWorkingDirectory()).getPath(), '/');
    const stat = await client.getAttributes('/hello');
    assert.equal(stat.isOk(), true);
    assert.equal(stat.getAttributes().size, 11n);
    assert.equal(stat.getAttributes().type, FileType.Regular);
    assert.equal((await client.getAttributes('/missing')).getValue(),
      V.NoSuchFile);
    const chunks = [];
    assert.equal((await client.download('/hello', data => {
      chunks.push(Buffer.from(data)); return true;
    }, 6n)).isOk(), true);
    assert.equal(Buffer.concat(chunks).toString(), 'world');
    let count = 0;
    const uploaded = await client.upload('/upload', chunk => {
      chunk.data.set(Buffer.from('abc'));
      chunk.size = 3;
      return ++count < 2;
    });
    assert.equal(uploaded.isOk(), true, uploaded.getMessage());
    assert.equal(files.get('/upload').toString(), 'abcabc');
    assert.equal((await client.upload('/upload', chunk => {
      chunk.data[0] = 33; chunk.size = 1; return false;
    }, 0o644, false, true)).isOk(), true);
    assert.equal(files.get('/upload').toString(), 'abcabc!');
    assert.equal((await client.rename('/upload', '/renamed')).isOk(), true);
    assert.ok((await client.getDirectoryListing('/')).getListing()
      .some(entry => entry.path === 'renamed'));
    assert.equal((await client.deleteFile('/renamed')).isOk(), true);
    assert.equal((await client.createDirectory('/dir')).isOk(), true);
    assert.equal((await client.deleteDirectory('/dir')).isOk(), true);
    assert.equal((await client.disconnect()).isOk(), true);
  }));

test('SFTP private-key login and timeout predicate cancellation',
  { timeout: 10000 }, () => fixture(async (client, port) => {
    assert.equal((await client.connect(IpAddress.LocalHost, port,
      milliseconds(1000))).isOk(), true);
    const auth = await client.login('user', user.publicKey, user.privateKey,
      '', milliseconds(1000));
    assert.equal(auth.isOk(), true, auth.getMessage());
    let checks = 0;
    const stalled = await client.getAttributes('/stall', true,
      new TimeoutWithPredicate(() => ++checks < 2, milliseconds(20)));
    assert.equal(stalled.getValue(), V.Timeout, stalled.getMessage());
    assert.equal(checks, 2);
    assert.equal((await client.getAttributes('/hello')).getValue(),
      V.Disconnected);
  }));

test('SFTP cancels a pending producer without writing into a reopened session',
  { timeout: 10000 }, () => fixture(async (client, port, files) => {
    await client.connect(IpAddress.LocalHost, port, milliseconds(1000));
    await client.login('user', 'pass');
    let release;
    let entered;
    const started = new Promise(resolve => { entered = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const upload = client.upload('/old', async chunk => {
      entered();
      await gate;
      chunk.data[0] = 10; chunk.size = 1;
      return false;
    });
    await started;
    client.close();
    assert.equal((await upload).getValue(), V.Disconnected);
    await client.connect(IpAddress.LocalHost, port, milliseconds(1000));
    await client.login('user', 'pass');
    release();
    const next = await client.upload('/new', chunk => {
      chunk.data[0] = 20; chunk.size = 1; return false;
    });
    assert.equal(next.isOk(), true, next.getMessage());
    assert.equal(files.get('/old').length, 0);
    assert.deepEqual(files.get('/new'), Buffer.from([ 20 ]));
  }));
