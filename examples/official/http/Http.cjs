'use strict';

const { createInterface } = require('node:readline');
const sf = require('../../..');

/**
 * Request a URL and follow at most the given number of redirects.
 * @param {string} url - Complete HTTP or HTTPS URL.
 * @param {number} redirectsRemaining - Remaining redirect budget.
 */
async function requestUrl(url, redirectsRemaining) {
  const address = new URL(url);
  const http = new sf.Http();
  http.setHost(`${address.protocol}//${address.hostname}`,
    Number(address.port));

  const request = new sf.Http.Request(address.pathname + address.search);
  const response = await http.sendRequest(request);
  const status = response.getStatus();
  console.log(`Server responded with HTTP status ${status}\n`);

  if (response.getField('Content-Type').startsWith('text')) {
    const encoding = response.getField('Content-Encoding');
    if (!encoding) {
      console.log(response.getBody());
    } else {
      const length = response.getBodyBytes().length;
      console.log(`${encoding} compressed body content, length: ${length}\n`);
    }
  }

  if (status >= 301 && status <= 308) {
    if (redirectsRemaining === 0) {
      console.log('Maximum number of redirects reached');
      return;
    }

    const location = response.getField('Location');
    if (location) {
      const nextUrl = new URL(location, address).href;
      console.log(`Following redirect to ${nextUrl}\n`);
      await requestUrl(nextUrl, redirectsRemaining - 1);
    }
  }
}

/** Run the interactive HTTP example. */
async function main() {
  const input = createInterface({ input: process.stdin });
  const lines = input[Symbol.asyncIterator]();

  /**
   * Read a line without blocking networking or losing piped input.
   * @param {string} prompt - Console prompt.
   * @return {Promise<string>} Input line.
   */
  async function read(prompt) {
    process.stdout.write(prompt);
    const line = await lines.next();
    if (line.done) throw new Error('Input closed');
    return line.value;
  }

  try {
    let url;
    do {
      url = await read('Type the complete URL of the webpage to request: ');
    } while (!url.startsWith('http://') && !url.startsWith('https://'));

    console.log(`\nRequesting ${url}\n`);
    await requestUrl(url, 16);

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

module.exports = { requestUrl };
