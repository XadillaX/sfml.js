'use strict';

const { createInterface } = require('node:readline');
const sf = require('../../..');
const { doClient } = require('./Client.cjs');
const { doServer } = require('./Server.cjs');

/** Run the upstream voice-over-IP example on port 2435. */
async function main() {
  const port = 2435;
  const input = createInterface({ input: process.stdin });
  const lines = input[Symbol.asyncIterator]();

  /**
   * Read a console line while audio and network work continues.
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
        'Type address or name of the server to connect to: '
      );
      const addresses = await sf.Dns.resolve(hostname);
      if (addresses?.length) return addresses[0];
    }
  }

  try {
    const who = await read(
      "Do you want to be a server ('s') or a client ('c')? "
    );
    if (who === 's') await doServer(port, read);
    else await doClient(port, read, readAddress);

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
