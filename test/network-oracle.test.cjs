'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const { Packet } = require('../dist/network/packet');
const { IpAddress } = require('../dist/network/ip-address');

test('Node Packet bytes and address formatting agree with SFML 3.1',
  { skip: process.platform === 'win32'
    ? 'Native oracle build command requires a Unix C++ toolchain' : false },
  () => {
    const directory = mkdtempSync(join(tmpdir(), 'sfml-network-oracle-'));
    try {
      const binary = join(directory, 'oracle');
      const root = resolve(__dirname, '..');
      const library = join(root, 'third_party/sfml/lib');
      const compiled = spawnSync('c++', [
        '-std=c++20', '-I' + join(root, 'third_party/sfml/include'),
        join(__dirname, 'native/network-oracle.cc'), '-o', binary,
        '-L' + library, '-lsfml-network', '-lsfml-system',
        '-Wl,-rpath,' + library,
      ], { encoding: 'utf8' });
      assert.equal(compiled.status, 0, compiled.stderr);
      const result = spawnSync(binary, [], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      const [ hex, ...addresses ] = result.stdout.trim().split('\n');
      const packet = new Packet()
        .write('bool', true)
        .write('i8', -8)
        .write('u8', 255)
        .write('i16', -32768)
        .write('u16', 65535)
        .write('i32', -2147483648)
        .write('u32', 0xffffffff)
        .write('i64', -9223372036854775808n)
        .write('u64', 18446744073709551615n)
        .write('f32', 1.5)
        .write('f64', -Math.PI)
        .write('string', '音频🌟\0')
        .write('utf8', 'UTF8🌟\0')
        .write('bytes', Uint8Array.from([ 255, 0, 254 ]));
      assert.equal(Buffer.from(packet.getData()).toString('hex'), hex);
      const inputs = [ '127.0.0.1', '2001:db8::1', '::ffff:127.0.0.1',
        '::192.168.1.1', '::1', '2001:0:0:1:0:0:1:1' ];
      assert.deepEqual(inputs.map(text =>
        IpAddress.fromString(text).toString()), addresses);
    } finally { rmSync(directory, { recursive: true, force: true }); }
  });
