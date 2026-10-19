'use strict';

const { createInterface } = require('node:readline');
const sf = require('../../..');

/**
 * Print the numeric FTP response and its message.
 * @param {object} response - FTP response.
 */
function printResponse(response) {
  console.log(`${response.getStatus()}${response.getMessage()}`);
}

/**
 * Present the upstream FTP commands until the user disconnects.
 * @param {object} server - Authenticated FTP client.
 * @param {Function} read - Asynchronous console input.
 */
async function menu(server, read) {
  for (;;) {
    console.log('\nChoose an action:\n' +
      '1. Print working directory\n' +
      '2. Print contents of working directory\n' +
      '3. Change directory\n' +
      '4. Create directory\n' +
      '5. Delete directory\n' +
      '6. Rename file\n' +
      '7. Remove file\n' +
      '8. Download file\n' +
      '9. Upload file\n' +
      '0. Disconnect\n');
    const choice = await read('Your choice: ');
    console.log();

    switch (choice.trim()) {
      case '1': {
        const response = await server.getWorkingDirectory();
        printResponse(response);
        console.log(`Current directory is ${response.getDirectory()}`);
        break;
      }
      case '2': {
        const response = await server.getDirectoryListing();
        printResponse(response);
        for (const name of response.getListing()) console.log(name);
        break;
      }
      case '3': {
        const directory = await read('Choose a directory: ');
        printResponse(await server.changeDirectory(directory));
        break;
      }
      case '4': {
        const directory = await read('Name of the directory to create: ');
        printResponse(await server.createDirectory(directory));
        break;
      }
      case '5': {
        const directory = await read('Name of the directory to remove: ');
        printResponse(await server.deleteDirectory(directory));
        break;
      }
      case '6': {
        const source = await read('Name of the file to rename: ');
        const destination = await read('New name: ');
        printResponse(await server.renameFile(source, destination));
        break;
      }
      case '7': {
        const filename = await read('Name of the file to remove: ');
        printResponse(await server.deleteFile(filename));
        break;
      }
      case '8': {
        const filename = await read(
          'Filename of the file to download (relative to current directory): '
        );
        const directory = await read('Directory to download the file to: ');
        printResponse(await server.download(filename, directory));
        break;
      }
      case '9': {
        const filename = await read(
          'Path of the file to upload ' +
          '(absolute or relative to working directory): '
        );
        const directory = await read(
          'Directory to upload the file to (relative to current directory): '
        );
        printResponse(await server.upload(filename, directory));
        break;
      }
      case '0':
        return;
      default:
        console.log('Invalid choice!');
    }
  }
}

/** Connect, log in, and run the interactive FTP session. */
async function main() {
  const input = createInterface({ input: process.stdin });
  const lines = input[Symbol.asyncIterator]();
  const server = new sf.Ftp();

  /**
   * Read one console line without blocking the event loop.
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
    let address;
    do {
      address = await sf.IpAddress.resolve(
        await read('Enter the FTP server address: ')
      );
    } while (!address);

    const connected = await server.connect(address);
    printResponse(connected);
    if (!connected.isOk()) {
      process.exitCode = 1;
      return;
    }

    const user = await read('User name: ');
    const password = await read('Password: ');
    const loggedIn = await server.login(user, password);
    printResponse(loggedIn);
    if (!loggedIn.isOk()) {
      process.exitCode = 1;
      return;
    }

    await menu(server, read);
    console.log('Disconnecting from server...');
    printResponse(await server.disconnect());

    console.log('Press enter to exit...');
    await lines.next();
  } finally {
    server.close();
    input.close();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
