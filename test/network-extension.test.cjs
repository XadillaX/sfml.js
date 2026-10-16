'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { Socket: NetSocket, createServer } = require('node:net');
const { createSocket } = require('node:dgram');
const { once } = require('node:events');
const { setImmediate: tick, setTimeout: delay } =
  require('node:timers/promises');
const { Socket, SocketType, SocketStatus: S } =
  require('../dist/network/socket');
const { TcpSocket, TlsStatus: T } = require('../dist/network/tcp-socket');
const { TcpListener } = require('../dist/network/tcp-listener');
const { UdpSocket } = require('../dist/network/udp-socket');
const { SocketSelector } = require('../dist/network/socket-selector');
const { IpAddress, IpAddressType } = require('../dist/network/ip-address');
const { milliseconds } = require('../dist/system/time');

/**
 * 暴露受保护生命周期供行为测试使用，不依赖内部 symbol。
 * @param {typeof Socket} Base 被扩展的套接字类。
 */
function exposed(Base) {
  return class extends Base {
    open(value) { this.create(value); }
    shutdown() { this.close(); }
    handle() { return this.getNativeHandle(); }
  };
}

/**
 * 创建已被 Node 服务端接受的真实 TCP 连接。
 * @param {object} t 测试上下文，用于释放回环传输。
 */
async function pair(t) {
  const server = createServer({ pauseOnConnect: true });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const incoming = once(server, 'connection');
  const client = new NetSocket();
  const connected = once(client, 'connect');
  client.connect(server.address().port, '127.0.0.1');
  const [ accepted ] = await incoming;
  await connected;
  t.after(() => {
    client.destroy(); accepted.destroy(); server.close();
  });
  return { client, accepted };
}

test('Socket subclasses allocate typed handles without initiating connections',
  () => {
    assert.ok(SocketType);
    assert.equal(Socket.Type, SocketType);
    const Custom = exposed(Socket);
    const tcp = new Custom();
    const udp = new Custom(SocketType.Udp);
    try {
      tcp.setBlocking(false);
      tcp.open();
      assert.ok(tcp.handle() instanceof NetSocket);
      assert.equal(tcp.handle().connecting, false);
      assert.equal(tcp.handle().remoteAddress, undefined);
      const previous = tcp.handle();
      tcp.open(IpAddressType.IpV6);
      assert.equal(previous.destroyed, true);
      assert.equal(tcp.isBlocking(), false);
      assert.throws(() => tcp.open(99), RangeError);
      udp.open(IpAddressType.IpV6);
      assert.equal(udp.handle().type, 'udp6');
      assert.throws(() => udp.handle().address());
      assert.throws(() => tcp.open(udp.handle()), TypeError);
      tcp.shutdown(); tcp.shutdown();
      assert.equal(tcp.handle(), undefined);
    } finally { tcp.shutdown(); udp.shutdown(); }
  });

for (const Base of [ Socket, TcpSocket ]) {
  test(`${Base.name} adoption integrates selector and detaches old TCP events`,
    { timeout: 5000 }, async t => {
      const Custom = exposed(Base);
      const socket = new Custom();
      t.after(() => socket.shutdown());
      const first = await pair(t);
      socket.open(first.accepted);
      assert.equal(socket.handle(), first.accepted);
      const selector = new SocketSelector();
      assert.equal(selector.add(socket), true);
      const waiting = selector.wait(milliseconds(1000));
      first.client.write(Buffer.from([ 41 ]));
      assert.equal(await waiting, true);
      const output = Buffer.alloc(1);
      if (Base === TcpSocket) {
        assert.equal((await socket.receive(output)).status, S.Done);
        assert.equal(output[0], 41);
        assert.equal((await socket.send(Buffer.from([ 42 ]))).status, S.Done);
        assert.deepEqual([ ...(await once(first.client, 'data'))[0] ], [ 42 ]);
      } else {
        assert.deepEqual([ ...socket.handle().read(1) ], [ 41 ]);
      }
      const second = await pair(t);
      socket.open(second.accepted);
      assert.equal(first.accepted.destroyed, true);
      assert.equal(first.accepted.listenerCount('readable'), 0);
      assert.equal(first.accepted.listenerCount('drain'), 0);
      first.accepted.emit('end');
      first.accepted.emit('error', new Error('late old connection'));
      assert.equal(socket.getLastError(), undefined);
      selector.clear();
      assert.equal(selector.add(socket, SocketSelector.Send), true);
      assert.equal(await selector.wait(milliseconds(100)), true);
    });
}

test('TcpSocket allocated handle is used by connect and receive',
  { timeout: 5000 }, async t => {
    const Custom = exposed(TcpSocket);
    const socket = new Custom();
    t.after(() => socket.shutdown());
    socket.open();
    const server = createServer(peer => peer.end(Buffer.from([ 7 ])));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(() => server.close());
    socket.handle().connect(server.address().port, '127.0.0.1');
    await once(socket.handle(), 'connect');
    const output = Buffer.alloc(1);
    assert.equal((await socket.receive(output)).status, S.Done);
    assert.equal(output[0], 7);
  });

test('TCP rebuild cancels queued and pending reads and a backpressured write',
  { timeout: 5000 }, async t => {
    const Custom = exposed(TcpSocket);
    const socket = new Custom();
    t.after(() => socket.shutdown());
    const first = await pair(t);
    first.client.pause();
    // 阻止操作系统缓冲区提前接收整次写入，保证重建时仍有待完成的写操作。
    first.accepted.cork();
    socket.open(first.accepted);
    const reads = [ socket.receive(Buffer.alloc(1)),
      socket.receive(Buffer.alloc(1)) ];
    const writes = [ socket.send(Buffer.alloc(16 * 1024 * 1024)),
      socket.send(Buffer.from([ 99 ])) ];
    await tick();
    const second = await pair(t);
    socket.open(second.accepted);
    assert.deepEqual((await Promise.all(reads)).map(item => item.status),
      [ S.Disconnected, S.Disconnected ]);
    assert.deepEqual((await Promise.all(writes)).map(item => item.status),
      [ S.Disconnected, S.Disconnected ]);
    const received = socket.receive(Buffer.alloc(1));
    second.client.write(Buffer.from([ 8 ]));
    assert.equal((await received).status, S.Done);
    socket.shutdown(); socket.shutdown();
  });

for (const [ mode, family ] of [
  [ 'allocated', 4 ], [ 'unbound', 4 ], [ 'bound', 4 ],
  [ 'allocated', 6 ], [ 'unbound', 6 ], [ 'bound', 6 ],
]) {
  test(`UdpSocket ${mode} IPv${family} uses one transport for send and receive`,
    { timeout: 5000 }, async t => {
      const Custom = exposed(UdpSocket);
      const socket = new Custom();
      const peer = new UdpSocket();
      t.after(() => { socket.shutdown(); peer.unbind(); });
      const address = family === 4
        ? IpAddress.LocalHostV4 : IpAddress.LocalHostV6;
      const raw = mode === 'allocated'
        ? undefined : createSocket(`udp${family}`);
      t.after(() => {
        try { raw?.close(); } catch { /* 未绑定或已关闭。 */ }
      });
      if (mode === 'bound') {
        raw.bind(0, address.toString());
        await once(raw, 'listening');
      }
      socket.open(raw ?? address.getType());
      const handle = socket.handle();
      if (raw) assert.equal(handle, raw);
      await peer.bind(0, address);
      assert.equal(await socket.send(Buffer.from([ 1 ]), address,
        peer.getLocalPort()), S.Done);
      assert.equal(socket.handle(), handle);
      assert.ok(socket.getLocalPort() > 0);
      assert.equal((await peer.receive(Buffer.alloc(1))).remotePort,
        socket.getLocalPort());
      const selector = new SocketSelector();
      assert.equal(selector.add(socket), true);
      const waiting = selector.wait(milliseconds(1000));
      await peer.send(Buffer.from([ 2 ]), address,
        socket.getLocalPort());
      assert.equal(await waiting, true);
      const output = Buffer.alloc(1);
      assert.equal((await socket.receive(output)).status, S.Done);
      assert.equal(output[0], 2);
      const pending = socket.receive(output);
      await tick();
      socket.open();
      assert.equal((await pending).status, S.Error);
      assert.equal(handle.listenerCount('message'), 0);
      handle.emit('message', Buffer.from([ 9 ]), {});
      socket.setBlocking(false);
      assert.equal((await socket.receive(output)).status, S.Error);
      socket.shutdown(); socket.shutdown();
    });
}

test('Socket subclass can adopt a Node server and close it idempotently',
  { timeout: 5000 }, async () => {
    const Custom = exposed(Socket);
    const socket = new Custom();
    const server = createServer(peer => peer.destroy());
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
      socket.open(server);
      assert.equal(socket.handle(), server);
      const closed = once(server, 'close');
      socket.shutdown(); socket.shutdown();
      await closed;
      assert.equal(server.listening, false);
    } finally {
      server.close();
    }
  });

test('Custom UDP readiness hooks work without internal symbols',
  { timeout: 5000 }, async t => {
    class Custom extends exposed(Socket) {
      messages = [];
      onCreate() {
        super.onCreate();
        const handle = this.handle();
        const receive = data => { this.messages.push(data); this.changed(); };
        handle.on('message', receive);
        const detach = this.detach;
        this.detach = () => { detach(); handle.off('message', receive); };
      }
      onClose() { this.messages = []; }
      getReadiness(mask) {
        return this.messages.length && mask % 2 ? 1 : super.getReadiness(mask);
      }
    }
    const socket = new Custom(SocketType.Udp);
    const peer = new UdpSocket();
    t.after(() => { socket.shutdown(); peer.unbind(); });
    socket.open(IpAddressType.IpV6);
    socket.handle().bind(0, '::1');
    await once(socket.handle(), 'listening');
    const selector = new SocketSelector();
    assert.equal(selector.add(socket), true);
    const waiting = selector.wait(milliseconds(1000));
    await peer.send(Buffer.from([ 17 ]), IpAddress.LocalHostV6,
      socket.handle().address().port);
    assert.equal(await waiting, true);
    assert.deepEqual([ ...socket.messages.shift() ], [ 17 ]);
    assert.equal(await selector.wait(milliseconds(5)), false);
    const pending = selector.wait();
    socket.shutdown();
    assert.equal(await pending, false);
  });

test('UDP rebuild cancels queued sends before they reach the new transport',
  { timeout: 5000 }, async t => {
    const Custom = exposed(UdpSocket);
    const socket = new Custom();
    const peer = new UdpSocket();
    t.after(() => { socket.shutdown(); peer.unbind(); });
    await peer.bind(0, IpAddress.LocalHost);
    const writes = [ 1, 2 ].map(value => socket.send(Buffer.from([ value ]),
      IpAddress.LocalHost, peer.getLocalPort()));
    socket.open();
    assert.deepEqual(await Promise.all(writes),
      [ S.Disconnected, S.Disconnected ]);
    assert.equal(await socket.send(Buffer.from([ 3 ]), IpAddress.LocalHost,
      peer.getLocalPort()), S.Done);
    const output = Buffer.alloc(1);
    assert.equal((await peer.receive(output)).status, S.Done);
    assert.equal(output[0], 3);
  });

test('Closing pending bind/listen cancels the old generation',
  { timeout: 5000 }, async t => {
    for (const Base of [ TcpListener, UdpSocket ]) {
      const Custom = exposed(Base);
      const socket = new Custom();
      t.after(() => socket.shutdown());
      const opening = Base === TcpListener
        ? socket.listen(0, IpAddress.LocalHost)
        : socket.bind(0, IpAddress.LocalHost);
      const handle = socket.handle();
      t.after(() => {
        try { handle.close(); } catch { /* 传输已经关闭。 */ }
      });
      socket.shutdown(); socket.shutdown();
      assert.equal(await opening, S.Disconnected);
      await tick();
      assert.equal(socket.getLocalPort(), 0);
      if (Base === TcpListener) assert.equal(handle.listening, false);
      else assert.throws(() => handle.address());
    }
  });

test('Rebuilding TCP cancels an in-flight TLS handshake',
  { timeout: 5000 }, async t => {
    const Custom = exposed(TcpSocket);
    const socket = new Custom();
    t.after(() => socket.shutdown());
    const first = await pair(t);
    socket.open(first.accepted);
    const pending = socket.setupTlsClient('localhost', false);
    socket.open();
    assert.equal(await pending, T.Error);
    assert.equal(socket.getLastError(), undefined);
    assert.equal(await socket.setupTlsClient('localhost'), T.NotConnected);
  });

for (const Base of [ Socket, TcpSocket, UdpSocket, TcpListener ]) {
  test(`${Base.name} forwards selector queries to derived protected hooks`,
    async () => {
      class Buffered extends Base {
        calls = 0;
        isAlive() { return true; }
        getReadiness(mask) {
          this.calls++;
          return mask % 2;
        }
      }
      const socket = new Buffered();
      const selector = new SocketSelector();
      assert.equal(selector.add(socket), true);
      assert.equal(await selector.wait(milliseconds(50)), true);
      assert.ok(socket.calls > 0);
    });
}

/**
 * 用真实端口冲突触发接管句柄的异步绑定失败。
 * @param {object} t 测试上下文，负责释放传输。
 */
async function conflictingUdp(t) {
  const occupied = createSocket('udp4');
  occupied.bind(0, '127.0.0.1');
  await once(occupied, 'listening');
  const socket = new (exposed(UdpSocket))();
  const raw = createSocket('udp4');
  raw.on('error', () => {});
  socket.open(raw);
  t.after(() => {
    socket.shutdown();
    try { raw.close(); } catch { /* 旧句柄可能已经关闭。 */ }
    occupied.close();
  });
  return { socket, raw, port: occupied.address().port };
}

test('UDP bind failure completes both in-flight and queued sends',
  { timeout: 5000 }, async t => {
    const { socket, raw, port } = await conflictingUdp(t);
    raw.bind(port, '127.0.0.1');
    const first = socket.send(Buffer.from([ 1 ]), IpAddress.LocalHost, port);
    const queued = socket.send(Buffer.from([ 2 ]), IpAddress.LocalHost, port);
    const result = await Promise.race([
      Promise.all([ first, queued ]), delay(500, 'pending'),
    ]);
    assert.notEqual(result, 'pending');
    assert.equal(result[0], S.Error);
    assert.ok([ S.Done, S.Error ].includes(result[1]));
    assert.equal(socket.getLastError().code, 'EADDRINUSE');
  });

for (const recreate of [ false, true ]) {
  const action = recreate ? 'recreate' : 'close';
  test(`UDP failed bind releases old transport on ${action}`,
    { timeout: 5000 }, async t => {
      const { socket, raw, port } = await conflictingUdp(t);
      const closed = new Promise(resolve =>
        raw.once('close', () => resolve(true)));
      raw.bind(port, '127.0.0.1');
      const sent = socket.send(Buffer.from([ 1 ]), IpAddress.LocalHost, port);
      await Promise.resolve();
      if (recreate) socket.open();
      else socket.shutdown();
      assert.equal(await sent, S.Disconnected);
      assert.equal(await Promise.race([ closed, delay(500, false) ]), true);
      assert.throws(() => raw.bind(0, '127.0.0.1'));
      assert.equal(socket.getLastError(), undefined);
    });
}
