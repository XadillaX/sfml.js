'use strict';

const assert = require('node:assert/strict');
const sf = require('..');

async function main() {
  const listener = new sf.TcpListener();
  const client = new sf.TcpSocket();
  const server = new sf.TcpSocket();
  const udp = new sf.UdpSocket();
  const udpPeer = new sf.UdpSocket();
  try {
    assert.equal(await listener.listen(0, sf.IpAddress.LocalHost),
      sf.SocketStatus.Done);
    const accepting = listener.accept(server);
    assert.equal(await client.connect(sf.IpAddress.LocalHost,
      listener.getLocalPort(), sf.seconds(1)), sf.SocketStatus.Done);
    assert.equal(await accepting, sf.SocketStatus.Done);
    const request = new sf.Packet().write('string', 'sfml.js / Node Network')
      .write('u64', 18446744073709551615n);
    const receive = new sf.Packet();
    const pending = server.receive(receive);
    await client.send(request);
    assert.equal(await pending, sf.SocketStatus.Done);
    console.log('TCP:', receive.read('string'), receive.read('u64'));
    await udpPeer.bind(0, sf.IpAddress.LocalHost);
    await udp.send(new sf.Packet().write('u32', 42),
      sf.IpAddress.LocalHost, udpPeer.getLocalPort());
    const selector = new sf.SocketSelector();
    selector.add(udpPeer);
    assert.equal(await selector.wait(sf.seconds(1)), true);
    const datagram = new sf.Packet();
    const result = await udpPeer.receive(datagram);
    console.log('UDP:', result.remoteAddress.toString(), result.remotePort,
      datagram.read('u32'));
    console.log('PASS: local TCP / Packet / UDP / SocketSelector');
  } finally {
    listener.close();
    client.disconnect();
    server.disconnect();
    udp.unbind();
    udpPeer.unbind();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
