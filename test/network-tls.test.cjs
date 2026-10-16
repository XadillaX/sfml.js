'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { spawnSync } = require('node:child_process');
const { mkdtemp, readFile, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { once } = require('node:events');
const { createServer: httpsServer } = require('node:https');
const { TcpSocket, TlsStatus: T } = require('../dist/network/tcp-socket');
const { TcpListener } = require('../dist/network/tcp-listener');
const { IpAddress } = require('../dist/network/ip-address');
const { SocketStatus: S } = require('../dist/network/socket');
const { Http } = require('../dist/network/http');
const { milliseconds } = require('../dist/system/time');

test('TLS upgrades accepted TCP sockets and validates a supplied certificate',
  { timeout: 10000 }, async () => {
    const directory = await mkdtemp(join(tmpdir(), 'sfml-test-tls-'));
    const certPath = join(directory, 'cert.pem');
    const keyPath = join(directory, 'key.pem');
    const listener = new TcpListener();
    const server = new TcpSocket();
    const client = new TcpSocket();
    try {
      const generated = spawnSync('openssl', [
        'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
        '-keyout', keyPath, '-out', certPath, '-days', '1',
        '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost',
      ], { encoding: 'utf8' });
      assert.equal(generated.status, 0, generated.stderr);
      const cert = await readFile(certPath);
      const key = await readFile(keyPath);
      const https = httpsServer({ cert, key }, (_request, response) => {
        response.end('HTTPS');
      });
      https.listen(0, '127.0.0.1');
      await once(https, 'listening');
      try {
        const http = new Http('https://127.0.0.1', https.address().port);
        const request = new Http.Request('/');
        assert.equal((await http.sendRequest(request,
          milliseconds(500))).getStatus(), 1001);
        assert.equal((await http.sendRequest(request,
          milliseconds(500), false)).getBody(), 'HTTPS');
      } finally {
        https.closeAllConnections();
        await new Promise(resolve => https.close(resolve));
      }
      assert.equal(await listener.listen(0, IpAddress.LocalHost), S.Done);
      let accepting = listener.accept(server);
      assert.equal(await client.connect(IpAddress.LocalHost,
        listener.getLocalPort()), S.Done);
      assert.equal(await accepting, S.Done);
      assert.deepEqual(await Promise.all([
        server.setupTlsServer(cert, key),
        client.setupTlsClient('localhost', cert),
      ]), [ T.HandshakeComplete, T.HandshakeComplete ]);
      assert.ok(client.getCurrentCiphersuiteName());
      const sent = await client.send(Buffer.from('encrypted'));
      assert.equal(sent.status, S.Done);
      const output = Buffer.alloc(20);
      const received = await server.receive(output);
      assert.equal(output.subarray(0, received.received).toString(),
        'encrypted');
      client.disconnect();
      server.disconnect();
      accepting = listener.accept(server);
      await client.connect(IpAddress.LocalHost, listener.getLocalPort());
      await accepting;
      const handshake = await Promise.all([
        server.setupTlsServer(cert, key),
        client.setupTlsClient('invalid.example', cert),
      ]);
      assert.equal(handshake[1], T.Error);
    } finally {
      client.disconnect(); server.disconnect(); listener.close();
      await rm(directory, { recursive: true, force: true });
    }
  });
