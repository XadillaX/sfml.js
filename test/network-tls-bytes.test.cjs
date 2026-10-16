'use strict';

const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');
const { spawnSync } = require('node:child_process');
const { mkdtemp, readFile, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { createPrivateKey, X509Certificate, randomBytes } =
  require('node:crypto');
const { TcpSocket, TlsStatus: T } = require('../dist/network/tcp-socket');
const { TcpListener } = require('../dist/network/tcp-listener');
const { IpAddress } = require('../dist/network/ip-address');
const { SocketStatus: S } = require('../dist/network/socket');

let directory;
const fixtures = {};
const password = Buffer.concat([
  Buffer.from([ 0, 255, 128 ]), randomBytes(24),
]);

/**
 * 构造带非零偏移且两侧有无效字节的普通 Uint8Array 视图。
 * @param {Uint8Array} data 原始字节。
 */
function view(data) {
  const storage = new Uint8Array(data.length + 12).fill(165);
  storage.set(data, 5);
  return storage.subarray(5, 5 + data.length);
}

before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'sfml-tls-bytes-'));
  for (const algorithm of [ 'rsa', 'ec' ]) {
    const certPath = join(directory, `${algorithm}-cert.pem`);
    const keyPath = join(directory, `${algorithm}-key.pem`);
    const generated = spawnSync('openssl', [
      'req', '-x509', '-newkey',
      ...(algorithm === 'rsa'
        ? [ 'rsa:2048' ] : [ 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256' ]),
      '-nodes', '-keyout', keyPath, '-out', certPath, '-days', '1',
      '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost',
    ], { encoding: 'utf8' });
    assert.equal(generated.status, 0, generated.stderr);
    const cert = await readFile(certPath);
    const key = await readFile(keyPath);
    fixtures[algorithm] = {
      cert, key, der: new X509Certificate(cert).raw,
      privateKey: createPrivateKey(key),
    };
  }
});

after(async () => {
  if (directory) await rm(directory, { recursive: true, force: true });
});

/**
 * 使用真实回环 TCP 连接进行双向 TLS 握手及加密传输。
 * @param {string|Uint8Array} cert 服务端证书。
 * @param {string|Uint8Array} key 服务端私钥。
 * @param {string|Uint8Array} pass 私钥口令。
 * @param {boolean|string|Uint8Array} ca 客户端验证方式。
 * @param {string} hostname 校验的主机名。
 */
async function handshake(cert, key, pass, ca, hostname = 'localhost') {
  const listener = new TcpListener();
  const client = new TcpSocket();
  const server = new TcpSocket();
  try {
    assert.equal(await listener.listen(0, IpAddress.LocalHost), S.Done);
    const accepted = listener.accept(server);
    assert.equal(await client.connect(IpAddress.LocalHost,
      listener.getLocalPort()), S.Done);
    assert.equal(await accepted, S.Done);
    const statuses = await Promise.all([
      server.setupTlsServer(cert, key, pass),
      client.setupTlsClient(hostname, ca),
    ]);
    if (statuses.every(status => status === T.HandshakeComplete)) {
      assert.equal((await client.send(Buffer.from([ 0, 255, 42 ]))).status,
        S.Done);
      const output = Buffer.alloc(3);
      assert.equal((await server.receive(output)).received, 3);
      assert.deepEqual([ ...output ], [ 0, 255, 42 ]);
    }
    return { statuses, serverError: server.getLastError(),
      clientError: client.getLastError() };
  } finally {
    client.disconnect(); server.disconnect(); listener.close();
  }
}

for (const [ algorithm, type ] of [
  [ 'rsa', 'pkcs1' ], [ 'ec', 'sec1' ],
  [ 'rsa', 'pkcs8' ], [ 'ec', 'pkcs8' ],
]) {
  test(`TLS accepts DER ${type} ${algorithm} keys and offset CA/cert views`,
    { timeout: 5000 }, async () => {
      const fixture = fixtures[algorithm];
      const key = fixture.privateKey.export({ format: 'der', type });
      const result = await handshake(view(fixture.der), view(key), '',
        view(fixture.der));
      assert.deepEqual(result.statuses,
        [ T.HandshakeComplete, T.HandshakeComplete ]);
    });
}

for (const format of [ 'der', 'pem' ]) {
  test(`TLS decrypts ${format} PKCS8 with an exact binary password subview`,
    { timeout: 5000 }, async () => {
      const fixture = fixtures.rsa;
      const key = fixture.privateKey.export({
        format, type: 'pkcs8', cipher: 'aes-256-cbc', passphrase: password,
      });
      const result = await handshake(view(fixture.cert),
        view(Buffer.from(key)), view(password), view(fixture.cert));
      assert.deepEqual(result.statuses,
        [ T.HandshakeComplete, T.HandshakeComplete ]);
    });
}

test('TLS retains PEM CA bundles, PEM strings and string passwords',
  { timeout: 5000 }, async () => {
    const fixture = fixtures.rsa;
    const key = fixture.privateKey.export({
      format: 'pem', type: 'pkcs8', cipher: 'aes-256-cbc',
      passphrase: 'test-only',
    });
    const bundle = Buffer.concat([ fixtures.ec.cert, fixture.cert ]);
    for (const ca of [ view(bundle), bundle.toString() ]) {
      assert.deepEqual((await handshake(fixture.cert.toString(), key,
        'test-only', ca)).statuses,
      [ T.HandshakeComplete, T.HandshakeComplete ]);
    }
  });

test('TLS rejects wrong binary passwords and malformed certificate/key bytes',
  { timeout: 5000 }, async () => {
    const fixture = fixtures.rsa;
    const key = fixture.privateKey.export({
      format: 'der', type: 'pkcs8', cipher: 'aes-256-cbc', passphrase: password,
    });
    for (const [ cert, privateKey, pass ] of [
      [ fixture.cert, key, Buffer.from('wrong') ],
      [ Buffer.from([ 48, 3, 0 ]), fixture.key, '' ],
      [ fixture.cert, Buffer.from([ 48, 3, 0 ]), '' ],
      [ fixture.cert, Buffer.alloc(0), '' ],
    ]) {
      const result = await handshake(cert, privateKey, pass, fixture.cert);
      assert.equal(result.statuses[0], T.Error);
      assert.ok(result.serverError instanceof Error);
    }
  });

test('TLS retains default verification, hostname checks and explicit opt-out',
  { timeout: 5000 }, async () => {
    const fixture = fixtures.rsa;
    for (const [ ca, hostname ] of [
      [ undefined, 'localhost' ], [ true, 'localhost' ],
      [ view(fixtures.ec.der), 'localhost' ],
      [ view(fixture.der), 'wrong.invalid' ],
      [ Buffer.from([ 48, 1, 0 ]), 'localhost' ],
    ]) {
      const result = await handshake(fixture.cert, fixture.key, '',
        ca, hostname);
      assert.equal(result.statuses[1], T.Error);
      assert.ok(result.clientError instanceof Error);
    }
    assert.deepEqual((await handshake(fixture.cert, fixture.key, '', false))
      .statuses, [ T.HandshakeComplete, T.HandshakeComplete ]);
  });
