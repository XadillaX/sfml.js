'use strict';

const { createInterface } = require('node:readline');
const sf = require('../../..');
const { runTcpServer, runTcpClient } = require('./TCP.cjs');
const { runUdpServer, runUdpClient } = require('./UDP.cjs');

/** Run the interactive TCP, TLS or UDP exchange on the upstream port. */
async function main() {
  const port = 50001;
  const input = createInterface({ input: process.stdin });
  const lines = input[Symbol.asyncIterator]();

  /**
   * Read one console line asynchronously.
   * @param {string} prompt - Console prompt.
   * @return {Promise<string>} Input line.
   */
  async function read(prompt) {
    process.stdout.write(prompt);
    const line = await lines.next();
    if (line.done) throw new Error('Input closed');
    return line.value;
  }

  /**
   * Resolve the remote server, retrying invalid input.
   * @return {Promise<object>} Server IP address.
   */
  async function readAddress() {
    for (;;) {
      const hostname = await read(
        'Type the address or name of the server to connect to: '
      );
      const addresses = await sf.Dns.resolve(hostname);
      if (addresses?.length) return addresses[0];
    }
  }

  try {
    const protocol = await read('Do you want to use TCP (t) or UDP (u)? ');
    const who = await read(
      'Do you want to be a server (s) or a client (c)? '
    );

    if (protocol === 't') {
      const tls = await read('Do you want to enable TLS (y) or not (n)? ');
      if (who === 's') await runTcpServer(port, tls === 'y');
      else await runTcpClient(port, tls === 'y', await readAddress());
    } else if (who === 's') {
      await runUdpServer(port);
    } else {
      await runUdpClient(port, await readAddress());
    }

    console.log('Press enter to exit...');
    await lines.next();
  } finally {
    input.close();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
