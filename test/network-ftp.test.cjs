'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createServer } = require('node:net');
const { once } = require('node:events');
const { mkdtemp, readFile, writeFile, rm } = require('node:fs/promises');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const { Ftp, FtpStatus, TransferMode } = require('../dist/network/ftp');
const { IpAddress } = require('../dist/network/ip-address');
const { milliseconds } = require('../dist/system/time');

test('FTP maps responses, NLST, modes, upload/append/download and raw commands',
  { timeout: 10000 }, async () => {
    const files = new Map([[ '/file', Buffer.from('original') ]]);
    const commands = [];
    const sockets = new Set();
    const passiveServers = new Set();
    const server = createServer(control => {
      sockets.add(control);
      control.on('error', () => {});
      control.on('close', () => sockets.delete(control));
      control.write('220 local test FTP\r\n');
      let pending = '';
      let data;
      let rename;
      control.on('data', bytes => {
        pending += bytes;
        for (;;) {
          const end = pending.indexOf('\r\n');
          if (end < 0) break;
          const line = pending.slice(0, end);
          pending = pending.slice(end + 2);
          commands.push(line);
          const [ command, ...parts ] = line.split(' ');
          const argument = parts.join(' ');
          if (command === 'USER') control.write('331 Password\r\n');
          else if (command === 'PASS') control.write('230 Logged in\r\n');
          else if (command === 'PWD') control.write('257 "/" current\r\n');
          else if (command === 'EPSV') {
            // Each control connection has one outstanding passive transfer.
            // eslint-disable-next-line no-loop-func
            const passive = createServer(socket => {
              data = socket;
              sockets.add(socket);
              socket.on('error', () => {});
              socket.on('close', () => sockets.delete(socket));
              passive.close();
            });
            passiveServers.add(passive);
            passive.listen(0, '127.0.0.1', () => {
              control.write('229 Entering Extended Passive Mode ' +
                `(|||${passive.address().port}|)\r\n`);
            });
          } else if (command === 'NLST' || command === 'RETR') {
            control.write('150 Data\r\n');
            data.end(command === 'NLST'
              ? Buffer.from([ ...files.keys() ].join('\r\n') + '\r\n')
              : files.get(argument));
            data.on('close', () => control.write('226 Complete\r\n'));
          } else if (command === 'STOR' || command === 'APPE') {
            const chunks = command === 'APPE' && files.has(argument)
              ? [ files.get(argument) ] : [];
            control.write('150 Data\r\n');
            data.on('data', chunk => chunks.push(chunk));
            const connection = data;
            connection.on('end', () => {
              files.set(argument, Buffer.concat(chunks));
              connection.end();
              control.write('226 Complete\r\n');
            });
          } else if (command === 'RNFR') {
            rename = argument; control.write('350 Rename\r\n');
          } else if (command === 'RNTO') {
            files.set(argument, files.get(rename)); files.delete(rename);
            control.write('250 Renamed\r\n');
          } else if (command === 'DELE') {
            control.write(files.delete(argument) ? '250 Deleted\r\n'
              : '550 No file\r\n');
          } else if (command === 'QUIT') control.end('221 Bye\r\n');
          else if ([ 'TYPE', 'CWD', 'CDUP', 'MKD', 'RMD', 'NOOP' ]
            .includes(command)) control.write('200 OK\r\n');
          else control.write('500 Unknown command\r\n');
        }
      });
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const directory = await mkdtemp(join(tmpdir(), 'sfml-ftp-test-'));
    const client = new Ftp();
    try {
      assert.equal((await client.connect(IpAddress.LocalHost,
        server.address().port, milliseconds(500))).getStatus(), 220);
      assert.equal((await client.login('user', 'pass')).getStatus(), 230);
      assert.equal((await client.getWorkingDirectory()).getDirectory(), '/');
      const listing = await client.getDirectoryListing();
      assert.equal(listing.isOk(), true, listing.getMessage());
      assert.deepEqual(listing.getListing(), [ '/file' ]);
      assert.equal((await client.download('/file', directory)).isOk(), true);
      assert.equal((await readFile(join(directory, 'file'))).toString(),
        'original');
      const local = join(directory, 'upload.txt');
      await writeFile(local, 'payload');
      assert.equal((await client.upload(local, '/', TransferMode.Ascii)).isOk(),
        true);
      assert.equal((await client.upload(local, '/', TransferMode.Binary,
        true)).isOk(), true);
      assert.equal(files.get('/upload.txt').toString(), 'payloadpayload');
      assert.ok(commands.includes('TYPE A'));
      assert.ok(commands.includes('TYPE I'));
      assert.equal((await client.renameFile('/upload.txt', '/renamed')).isOk(),
        true);
      assert.equal((await client.deleteFile('/renamed')).isOk(), true);
      assert.equal((await client.deleteFile('/absent')).getStatus(),
        FtpStatus.FileUnavailable);
      assert.equal((await client.sendCommand('UNKNOWN')).getStatus(), 500);
      assert.equal((await client.keepAlive()).isOk(), true);
      assert.equal((await client.disconnect()).getStatus(), 221);
    } finally {
      client.close();
      for (const socket of sockets) socket.destroy();
      for (const passive of passiveServers) passive.close();
      await new Promise(resolve => server.close(resolve));
      await rm(directory, { recursive: true, force: true });
    }
  });
