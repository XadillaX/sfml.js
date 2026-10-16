'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createSocket } = require('node:dgram');
const { Resolver } = require('node:dns/promises');
const { once } = require('node:events');
const dns = require('../dist/network/dns');
const { IpAddress } = require('../dist/network/ip-address');
const { milliseconds } = require('../dist/system/time');
function name(text) {
  return Buffer.concat(text.split('.').map(part => Buffer.concat([
    Buffer.from([ part.length ]), Buffer.from(part),
  ])).concat(Buffer.from([ 0 ])));
}
function word(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16BE(value);
  return buffer;
}
test('DNS resolves IPv4/IPv6, NS/MX/SRV/TXT and cancels timed-out queries',
  { timeout: 5000 }, async t => {
    const server = createSocket('udp4');
    server.bind(0, '127.0.0.1');
    await once(server, 'listening');
    const setServers = Resolver.prototype.setServers;
    t.mock.method(Resolver.prototype, 'setServers', function(servers) {
      assert.deepEqual(servers, [ '127.0.0.1' ]);
      return setServers.call(this, [ `127.0.0.1:${server.address().port}` ]);
    });
    server.on('message', (question, peer) => {
      let cursor = 12;
      const labels = [];
      while (question[cursor]) {
        const length = question[cursor++];
        labels.push(question.toString('utf8', cursor, cursor + length));
        cursor += length;
      }
      if (labels[0] === 'stall') return;
      cursor++;
      const type = question.readUInt16BE(cursor);
      const answer = {
        1: Buffer.from([ 127, 0, 0, 2 ]),
        28: Buffer.from(IpAddress.LocalHostV6.toBytes()),
        2: name('ns.example.test'),
        15: Buffer.concat([ word(10), name('mail.example.test') ]),
        33: Buffer.concat([ word(1), word(5), word(443),
          name('service.example.test') ]),
        16: Buffer.from([ 3, 111, 110, 101, 3, 116, 119, 111 ]),
      }[type];
      const header = Buffer.alloc(12);
      question.copy(header, 0, 0, 2);
      header.writeUInt16BE(0x8180, 2);
      header.writeUInt16BE(1, 4);
      header.writeUInt16BE(1, 6);
      const response = Buffer.concat([
        header, question.subarray(12, cursor + 4),
        Buffer.from([ 192, 12 ]), word(type), word(1),
        Buffer.from([ 0, 0, 0, 30 ]), word(answer.length), answer,
      ]);
      server.send(response, peer.port, peer.address);
    });
    const servers = [ IpAddress.LocalHost ];
    try {
      const local = await dns.resolve('localhost');
      assert.ok(local.length > 0);
      const resolved = await dns.resolve('example.test', servers);
      assert.deepEqual(resolved.map(address => address.toString()),
        [ '127.0.0.2', '::1' ]);
      assert.deepEqual(await dns.queryNs('example.test', servers),
        [ 'ns.example.test' ]);
      assert.deepEqual(await dns.queryMx('example.test', servers),
        [{ exchange: 'mail.example.test', preference: 10 }]);
      assert.deepEqual(await dns.querySrv('example.test', servers),
        [{ target: 'service.example.test', port: 443,
          priority: 1, weight: 5 }]);
      assert.deepEqual(await dns.queryTxt('example.test', servers),
        [[ 'one', 'two' ]]);
      const stalled = await dns.queryNs('stall.test', servers,
        milliseconds(10));
      assert.deepEqual(stalled, []);
      assert.deepEqual(await dns.queryNs('example.test', servers),
        [ 'ns.example.test' ]);
    } finally { server.close(); }
  });
