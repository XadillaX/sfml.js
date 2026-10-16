'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createServer } = require('node:net');
const { once } = require('node:events');
const { Packet } = require('../dist/network/packet');
const { IpAddress } = require('../dist/network/ip-address');
const { TcpSocket, TlsStatus } = require('../dist/network/tcp-socket');
const { TcpListener } = require('../dist/network/tcp-listener');
const { UdpSocket } = require('../dist/network/udp-socket');
const { SocketSelector } = require('../dist/network/socket-selector');
const { SocketStatus: S } = require('../dist/network/socket');
const { Http } = require('../dist/network/http');
const { milliseconds } = require('../dist/system/time');

test('Packet scalars, strings, failed reads and copy cursors', () => {
  const packet = new Packet();
  const values = [
    [ 'bool', true ], [ 'i8', -8 ], [ 'u8', 255 ], [ 'i16', -32768 ],
    [ 'u16', 65535 ], [ 'i32', -2147483648 ], [ 'u32', 0xffffffff ],
    [ 'i64', -9223372036854775808n ], [ 'u64', 18446744073709551615n ],
    [ 'f32', 1.5 ], [ 'f64', -Math.PI ],
    [ 'string', '音频🌟\0' ], [ 'utf8', 'UTF8🌟\0' ],
  ];
  for (const [ type, value ] of values) {
    assert.equal(packet.write(type, value), packet);
  }
  assert.equal(packet.read('bool'), true);
  const copy = new Packet(packet);
  for (const [ type, value ] of values.slice(1)) {
    assert.equal(packet.read(type), value);
    assert.equal(copy.read(type), value);
  }
  assert.equal(packet.endOfPacket(), true);
  assert.equal(packet.isValid(), true);
  assert.equal(packet.read('u8'), undefined);
  assert.equal(packet.isValid(), false);
  packet.append(new Uint8Array([ 10 ]));
  assert.equal(packet.read('u8'), undefined);
  packet.clear();
  assert.equal(packet.getData(), undefined);
  assert.equal(packet.isValid(), true);
  assert.deepEqual([ ...new Packet().write('string', 'A🌟').getData() ],
    [ 0, 0, 0, 2, 0, 0, 0, 65, 0, 1, 243, 31 ]);
});

test('IpAddress strict parsing, value copies and IPv4/IPv6 ordering', () => {
  assert.equal(IpAddress.fromString('127.0.0.1').toInteger(), 0x7f000001);
  assert.equal(new IpAddress(0xffffffff).toString(), '255.255.255.255');
  for (const invalid of [
    '', '127.1', '0x7f000001', '01.2.3.4', 'fe80::1%en0',
  ]) {
    assert.equal(IpAddress.fromString(invalid), undefined);
  }
  const address = IpAddress.fromString('2001:db8::1');
  assert.equal(new IpAddress(address.toBytes()).toString(), '2001:db8::1');
  const copy = address.toBytes();
  copy.fill(0);
  assert.equal(address.toString(), '2001:db8::1');
  assert.ok(IpAddress.LocalHost.compare(address) < 0);
  assert.throws(() => address.toInteger(), TypeError);
  assert.throws(() => IpAddress.LocalHost.toBytes(), TypeError);
});

test('TCP Packet framing, listener accept, selector readiness and disconnect',
  { timeout: 5000 }, async () => {
    const listener = new TcpListener();
    const client = new TcpSocket();
    const accepted = new TcpSocket();
    try {
      assert.equal(await listener.listen(0, IpAddress.LocalHost), S.Done);
      const accepting = listener.accept(accepted);
      assert.equal(await client.connect(IpAddress.LocalHost,
        listener.getLocalPort(), milliseconds(500)), S.Done);
      assert.equal(await accepting, S.Done);
      assert.equal(accepted.getRemotePort(), client.getLocalPort());
      const selector = new SocketSelector();
      let notified = 0;
      assert.equal(selector.add(accepted, SocketSelector.Receive,
        mask => { notified += mask; }), true);
      assert.equal(await selector.wait(milliseconds(5)), false);
      const pending = selector.wait(milliseconds(500));
      const message = new Packet().write('string', 'hello');
      assert.equal(await client.send(message), S.Done);
      assert.equal(await pending, true);
      const copied = new SocketSelector(selector);
      const assigned = new SocketSelector().assign(selector);
      selector.clear();
      assert.equal(copied.isReady(accepted), true);
      assert.equal(assigned.isReady(accepted), true);
      selector.assign(copied);
      selector.dispatchReadyCallbacks();
      assert.equal(notified, 1);
      const received = new Packet();
      assert.equal(await accepted.receive(received), S.Done);
      assert.equal(received.read('string'), 'hello');
      accepted.setBlocking(false);
      assert.deepEqual(await accepted.receive(new Uint8Array(20)),
        { status: S.NotReady, received: 0 });
      accepted.setBlocking(true);
      const waiting = accepted.receive(new Uint8Array(2));
      accepted.disconnect();
      assert.equal((await waiting).status, S.Disconnected);
      assert.equal(await accepted.setupTlsClient('localhost'),
        TlsStatus.NotConnected);
    } finally { listener.close(); client.disconnect(); accepted.disconnect(); }
  });

test('TCP receives fragmented Packet headers and bodies from a Node peer',
  { timeout: 5000 }, async () => {
    const server = createServer(socket => {
      socket.write(Buffer.from([ 0, 0 ]));
      setTimeout(() => socket.write(Buffer.from([ 0, 3, 5 ])), 5);
      setTimeout(() => socket.end(Buffer.from([ 6, 7 ])), 10);
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const client = new TcpSocket();
    try {
      assert.equal(await client.connect(IpAddress.LocalHost,
        server.address().port), S.Done);
      const packet = new Packet();
      assert.equal(await client.receive(packet), S.Done);
      assert.deepEqual([ ...packet.getData() ], [ 5, 6, 7 ]);
      assert.equal((await client.receive(new Uint8Array(10))).status,
        S.Disconnected);
    } finally { client.disconnect(); server.close(); }
  });

test('UDP preserves datagram boundaries and sender metadata', { timeout: 5000 },
  async () => {
    const a = new UdpSocket();
    const b = new UdpSocket();
    try {
      assert.equal(await b.bind(0, IpAddress.LocalHost), S.Done);
      assert.equal(await a.send(new Uint8Array([ 1, 2, 3 ]),
        IpAddress.LocalHost, b.getLocalPort()), S.Done);
      const destination = new Uint8Array(20);
      const result = await b.receive(destination);
      assert.equal(result.status, S.Done);
      assert.equal(result.received, 3);
      assert.equal(result.remotePort, a.getLocalPort());
      assert.equal(result.remoteAddress.toString(), '127.0.0.1');
      assert.deepEqual([ ...destination.slice(0, 3) ], [ 1, 2, 3 ]);
      assert.equal(await a.send(new Packet().write('u32', 42),
        IpAddress.LocalHost, b.getLocalPort()), S.Done);
      const packet = new Packet();
      assert.equal((await b.receive(packet)).status, S.Done);
      assert.equal(packet.read('u32'), 42);
      b.setBlocking(false);
      assert.equal((await b.receive(destination)).status, S.NotReady);
    } finally { a.unbind(); b.unbind(); }
  });

test('HTTP preserves requested version and parses fragmented chunked responses',
  { timeout: 5000 }, async () => {
    let request = '';
    const server = createServer(socket => {
      socket.on('data', data => {
        request += data;
        if (!request.includes('\r\n\r\n')) return;
        socket.write('HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\n\r\n');
        socket.write('3\r\nab');
        setTimeout(() => {
          socket.end('c\r\n2\r\nde\r\n0\r\nX-Test: yes\r\n\r\n');
        }, 5);
      });
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      const http = new Http('127.0.0.1', server.address().port);
      const response = await http.sendRequest(new Http.Request('/path'),
        milliseconds(500));
      assert.equal(response.getStatus(), 200);
      assert.equal(response.getBody(), 'abcde');
      assert.equal(response.getField('x-test'), 'yes');
      assert.equal(response.getMinorHttpVersion(), 1);
      assert.match(request, /^GET \/path HTTP\/1.0\r\n/);
    } finally { server.close(); }
  });
