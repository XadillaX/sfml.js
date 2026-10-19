'use strict';

const { open } = require('node:fs/promises');
const { createInterface } = require('node:readline');
const sf = require('../../..');

/**
 * Report an SFTP error, distinguishing user interruption.
 * @param {object} result - SFTP result.
 * @param {object} state - Interrupt state.
 * @return {boolean} Whether the operation succeeded.
 */
function checkResult(result, state) {
  if (result.isOk()) return true;
  if (result.getValue() === sf.Sftp.Result.Value.Timeout && state.interrupt) {
    console.log('Interrupted');
  } else {
    console.log(`Operation failed: ${result.getMessage()}`);
  }
  return false;
}

/**
 * Format the upstream file type, mode, ownership and size columns.
 * @param {object} entry - Directory entry.
 * @return {string} Listing row.
 */
function formatEntry(entry) {
  const types = {
    [sf.FileType.Block]: 'b',
    [sf.FileType.Character]: 'c',
    [sf.FileType.Directory]: 'd',
    [sf.FileType.Fifo]: 'f',
    [sf.FileType.Regular]: 'r',
    [sf.FileType.Socket]: 's',
    [sf.FileType.Symlink]: 'l',
  };
  const permissions = Array.from({ length: 9 }, (_, index) => {
    const set = Math.floor((entry.permissions ?? 0) / 2 ** (8 - index)) % 2;
    return set ? 'rwx'[index % 3] : '-';
  }).join('');
  const columns = [ entry.userId, entry.groupId, entry.size ]
    .map(value => (value === undefined ? '' : String(value)).padStart(10));
  return `${types[entry.type] ?? '?'} ${permissions} ` +
    `${columns.join(' ')} ${entry.path}`;
}

/**
 * Report transfer completion and throughput.
 * @param {string} action - Download or Upload.
 * @param {bigint} size - File size.
 * @param {bigint} start - Monotonic start time.
 * @param {object} state - Interrupt state.
 */
function printTransfer(action, size, start, state) {
  if (state.interrupt) {
    console.log(`${action} interrupted`);
  } else {
    const microseconds = Number(process.hrtime.bigint() - start) / 1000;
    const speed = Number(size) / Math.max(microseconds, 1);
    console.log(`${action} completed successfully (${speed} MB/s)`);
  }
}

/**
 * Stream a remote file to a local file with progress and cancellation.
 * @param {object} server - Authenticated SFTP client.
 * @param {Function} read - Console input.
 * @param {object} state - Interrupt state and timeout predicate.
 */
async function downloadFile(server, read, state) {
  const remotePath = await read('Remote path of the file to download: ');
  const localPath = await read('Local path to save the file to: ');
  const attributes = await server.getAttributes(
    remotePath, true, state.timeout
  );
  if (!checkResult(attributes, state)) return;
  const size = attributes.getAttributes().size;
  if (size === undefined) return;
  console.log(`Remote file size: ${size} bytes\n`);

  let file;
  let total = 0;
  state.interrupt = false;
  const start = process.hrtime.bigint();
  try {
    const result = await server.download(remotePath, async data => {
      if (!file) {
        try {
          file = await open(localPath, 'w');
        } catch (error) {
          console.log('Failed to open local file for writing');
          throw error;
        }
      }

      try {
        let offset = 0;
        while (offset < data.length) {
          const { bytesWritten } = await file.write(
            data, offset, data.length - offset
          );
          if (!bytesWritten) throw new Error('No write progress');
          offset += bytesWritten;
        }
      } catch (error) {
        console.log('Failed to write to local file');
        throw error;
      }

      total += data.length;
      process.stdout.write(`\rDownloaded ${total} bytes`);
      return !state.interrupt;
    }, 0n, state.timeout);
    console.log('\n');
    if (checkResult(result, state)) {
      printTransfer('Download', size, start, state);
    }
  } finally {
    await file?.close();
  }
}

/**
 * Stream a local file to the server with progress and cancellation.
 * @param {object} server - Authenticated SFTP client.
 * @param {Function} read - Console input, retaining spaces in paths.
 * @param {object} state - Interrupt state and timeout predicate.
 */
async function uploadFile(server, read, state) {
  const remotePath = await read('Remote path of the file to upload: ');
  const localPath = await read('Local path to read the file from: ');
  let file;
  try {
    file = await open(localPath, 'r');
  } catch {
    console.log('Failed to open local file for reading');
    return;
  }

  try {
    const { size } = await file.stat({ bigint: true });
    console.log(`Local file size: ${size} bytes\n`);
    let total = 0;
    const start = process.hrtime.bigint();
    const result = await server.upload(remotePath, async chunk => {
      try {
        const { bytesRead } = await file.read(chunk.data);
        chunk.size = bytesRead;
      } catch (error) {
        console.log('Failed to read from local file');
        throw error;
      }

      total += chunk.size;
      process.stdout.write(`\rUploaded ${total} bytes`);
      return chunk.size > 0 && !state.interrupt;
    }, 0o644, true, false, 0n, state.timeout);
    console.log('\n');
    if (checkResult(result, state)) {
      printTransfer('Upload', size, start, state);
    }
  } finally {
    await file.close();
  }
}

/**
 * Run the upstream SFTP command menu.
 * @param {object} server - Authenticated SFTP client.
 * @param {Function} read - Asynchronous console input.
 * @param {object} state - Interrupt state and timeout predicate.
 */
async function menu(server, read, state) {
  for (;;) {
    state.interrupt = false;
    const directory = await server.getWorkingDirectory(state.timeout);
    if (checkResult(directory, state)) {
      console.log(`\nCurrent directory is ${directory.getPath()}`);
    }

    console.log('\nChoose an action:\n' +
      '1. Print contents of a directory\n' +
      '2. Create directory\n' +
      '3. Delete directory\n' +
      '4. Rename file\n' +
      '5. Remove file\n' +
      '6. Download file\n' +
      '7. Upload file\n' +
      '8. Disconnect\n');
    const choice = await read('Your choice: ');
    console.log();
    state.interrupt = false;

    switch (choice.trim()) {
      case '1': {
        const path = await read(
          'Remote path of the directory whose contents to print: '
        );
        const result = await server.getDirectoryListing(path, state.timeout);
        if (checkResult(result, state)) {
          for (const entry of result.getListing()) {
            console.log(formatEntry(entry));
          }
        }
        break;
      }
      case '2': {
        const path = await read('Remote path of the directory to create: ');
        const result = await server.createDirectory(path, 0o755, state.timeout);
        if (checkResult(result, state)) {
          console.log('Creating directory successful');
        }
        break;
      }
      case '3': {
        const path = await read('Remote name of the directory to remove: ');
        const result = await server.deleteDirectory(path, state.timeout);
        if (checkResult(result, state)) {
          console.log('Deleting directory successful');
        }
        break;
      }
      case '4': {
        const source = await read(
          'Remote path of the file/directory to rename/move: '
        );
        const destination = await read('New path: ');
        const result = await server.rename(
          source, destination, false, state.timeout
        );
        if (checkResult(result, state)) console.log('Rename/move successful');
        break;
      }
      case '5': {
        const path = await read('Remote path of the file to remove: ');
        const result = await server.deleteFile(path, state.timeout);
        if (checkResult(result, state)) console.log('Deleting file successful');
        break;
      }
      case '6':
        await downloadFile(server, read, state);
        break;
      case '7':
        await uploadFile(server, read, state);
        break;
      case '8':
        return;
      default:
        console.log('Invalid choice!');
    }
  }
}

/** Connect, confirm the host key, authenticate, and start the SFTP menu. */
async function main() {
  const input = createInterface({ input: process.stdin });
  const lines = input[Symbol.asyncIterator]();
  const server = new sf.Sftp();
  const state = { interrupt: false };
  state.timeout = new sf.TimeoutWithPredicate(
    () => !state.interrupt, sf.milliseconds(1)
  );
  const interrupt = () => { state.interrupt = true; };
  process.on('SIGINT', interrupt);
  input.on('SIGINT', interrupt);

  /**
   * Read one line while network and cancellation callbacks remain runnable.
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
    while (!address) {
      const hostname = await read(
        'Enter the SFTP server hostname or IP address: '
      );
      const addresses = await sf.Dns.resolve(hostname);
      address = addresses?.[0];
      if (!address) {
        console.log('The host could not be resolved to an IP address');
      }
    }

    let port;
    do {
      const line = await read(
        'Enter the SFTP server port (empty to use default 22): '
      );
      port = line.trim() === '' ? 22 : Number(line);
    } while (!Number.isInteger(port) || port < 1 || port > 65535);

    if (!checkResult(await server.connect(address, port, state.timeout),
      state)) {
      process.exitCode = 1;
      return;
    }
    console.log(
      `Connecting to SFTP server at ${address.toString()} successful`
    );

    const info = server.getSessionInfo();
    if (!info) {
      console.log('Failed to retrieve session information');
      process.exitCode = 1;
      return;
    }
    const fingerprint = Buffer.from(info.hostKey.sha256).toString('hex');
    console.log(`\nHost key SHA256: ${fingerprint}`);
    console.log(`Host key algorithm: ${info.hostKeyAlgorithm}`);
    console.log(`Key exchange algorithm: ${info.keyExchangeAlgorithm}`);
    console.log(
      `Encryption algorithm: ${info.serverToClientEncryptionAlgorithm}`
    );
    console.log(`MAC algorithm: ${info.serverToClientMacAlgorithm}`);
    console.log(`Compression: ${info.serverToClientCompressionAlgorithm}\n`);

    let answer;
    do {
      answer = await read('Continue logging into this server? (Y/N): ');
    } while (![ 'Y', 'y', 'N', 'n' ].includes(answer));

    if (answer.toLowerCase() === 'y') {
      const user = await read('User name: ');
      const password = await read('Password: ');
      state.interrupt = false;
      const result = await server.login(user, password, state.timeout);
      if (checkResult(result, state)) {
        console.log('Logging in to SFTP server successful');
        await menu(server, read, state);
      } else {
        process.exitCode = 1;
      }
    }

    console.log('Disconnecting from server...');
    if (checkResult(await server.disconnect(state.timeout), state)) {
      console.log('Disconnected from server successfully');
    }

    console.log('Press enter to exit...');
    await lines.next();
  } finally {
    server.close();
    input.close();
    process.off('SIGINT', interrupt);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { formatEntry };
