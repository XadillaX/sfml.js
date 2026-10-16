'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createServer } = require('node:net');
const { once } = require('node:events');
const { setTimeout: delay } = require('node:timers/promises');
const { TcpSocket } = require('../dist/network/tcp-socket');
const { TcpListener } = require('../dist/network/tcp-listener');
const { UdpSocket } = require('../dist/network/udp-socket');
const { IpAddress } = require('../dist/network/ip-address');
const { SocketStatus: S } = require('../dist/network/socket');
const { SocketSelector } = require('../dist/network/socket-selector');
const { Packet } = require('../dist/network/packet');
const { Http } = require('../dist/network/http');
const { milliseconds } = require('../dist/system/time');

test('Nonblocking Packet retries transmit one frame without duplicating bytes',
  { timeout: 5000 }, async () => {
    let resolveData;
    const received = new Promise(resolve => { resolveData = resolve; });
    const server = createServer(socket => {
      const chunks = [];
      let count = 0;
      socket.on('data', bytes => {
        chunks.push(bytes); count += bytes.length;
        if (count === 2 * 1024 * 1024 + 4) {
          resolveData(Buffer.concat(chunks, count));
        }
      });
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const client = new TcpSocket();
    try {
      assert.equal(await client.connect(IpAddress.LocalHost,
        server.address().port), S.Done);
      client.setBlocking(false);
      const data = Buffer.alloc(2 * 1024 * 1024, 17);
      const packet = new Packet();
      packet.append(data);
      let status = await client.send(packet);
      assert.equal(status, S.Partial);
      data.fill(0);
      packet.clear();
      let partial = 1;
      while (status !== S.Done) {
        assert.ok([ S.Partial, S.NotReady ].includes(status));
        await delay(1);
        status = await client.send(packet);
        partial++;
      }
      assert.ok(partial > 1);
      const wire = await received;
      assert.equal(wire.readUInt32BE(), 2 * 1024 * 1024);
      assert.ok(wire.subarray(4).every(byte => byte === 17));
    } finally { client.disconnect(); server.close(); }
  });

test('Concurrent UDP sends share auto-bind and queued receives keep order',
  { timeout: 5000 }, async () => {
    const sender = new UdpSocket();
    const receiver = new UdpSocket();
    try {
      await receiver.bind(0, IpAddress.LocalHost);
      const buffers = Array.from({ length: 10 }, () => new Uint8Array(4));
      const reads = buffers.map(buffer => receiver.receive(buffer));
      const statuses = await Promise.all(buffers.map((_, i) => sender.send(
        Uint8Array.from([ i ]), IpAddress.LocalHost, receiver.getLocalPort())));
      assert.deepEqual(statuses, Array(10).fill(S.Done));
      const results = await Promise.all(reads);
      assert.ok(results.every(result =>
        result.remotePort === sender.getLocalPort()));
      assert.deepEqual(buffers.map(buffer => buffer[0]),
        Array.from({ length: 10 }, (_, i) => i));
    } finally { sender.unbind(); receiver.unbind(); }
  });

test('SocketSelector and pending receives settle when a transport closes',
  { timeout: 5000 }, async () => {
    const listener = new TcpListener();
    const client = new TcpSocket();
    const peer = new TcpSocket();
    try {
      await listener.listen(0, IpAddress.LocalHost);
      const accepted = listener.accept(peer);
      await client.connect(IpAddress.LocalHost, listener.getLocalPort());
      await accepted;
      const selector = new SocketSelector();
      selector.add(peer);
      const waiting = selector.wait();
      const reading = peer.receive(new Uint8Array(20));
      peer.disconnect();
      assert.equal(await waiting, false);
      assert.equal((await reading).status, S.Disconnected);
      listener.setBlocking(false);
      assert.equal(await listener.accept(peer), S.NotReady);
    } finally { listener.close(); client.disconnect(); peer.disconnect(); }
  });

test('HTTP timeout and AbortSignal cancel stalled I/O and truncate responses',
  { timeout: 5000 }, async () => {
    const sockets = new Set();
    const server = createServer(socket => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
      socket.on('data', bytes => {
        if (bytes.toString().startsWith('GET /short')) {
          socket.end('HTTP/1.1 200 OK\r\nContent-Length: 10\r\n\r\nshort');
        }
      });
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const http = new Http('127.0.0.1', server.address().port);
      const response = await http.sendRequest(new Http.Request('/'),
        milliseconds(15));
      assert.equal(response.getStatus(), Http.Response.Status.ConnectionFailed);
      const abort = new AbortController();
      const request = http.sendRequest(new Http.Request('/'),
        milliseconds(500), true, abort.signal);
      abort.abort();
      assert.equal((await request).getStatus(), 1001);
      assert.equal((await http.sendRequest(new Http.Request('/short')))
        .getStatus(), 1000);
    } finally {
      for (const socket of sockets) socket.destroy();
      await new Promise(resolve => server.close(resolve));
    }
  });
