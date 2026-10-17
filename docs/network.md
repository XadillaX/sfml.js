# Network

**English** · [简体中文](network.zh-CN.md) · [日本語](network.ja.md) · [한국어](network.ko.md)

> Define messages with Packet and send them over TCP/UDP, or use HTTP, FTP and SFTP for protocol operations. Network I/O returns promises; callers must also check operation statuses.

[API guide](api.md) · [Core concepts](concepts.md) · [Loopback example](../examples/network.cjs)

Production Network code implements SFML-style APIs with Node.js transports, using basic-ftp for FTP, ssh2 for SFTP and ipaddr.js for IPv6 parsing. It does not call the SFML C++ network module; Packet formats and selected value semantics are compared against independent C++ programs.

## APIs and calling conventions

| API | Implementation and adaptations |
|------|------------|
| IpAddress | IPv4 integer/four-byte construction, IPv6 16-byte construction, copying, fromString, toString, toInteger, toBytes, getType, isV4/isV6; static resolve, getLocalAddress and getPublicAddress return promises |
| Dns | resolve, queryNs, queryMx, querySrv, queryTxt, getPublicAddress; supports independent Resolvers and custom servers |
| Socket | setBlocking, isBlocking, AnyPort, Status; getLastError returns the most recent underlying error |
| TcpSocket | connect, disconnect, send, receive, port/remote-address queries; setupTlsClient, setupTlsServer, getCurrentCiphersuiteName |
| TcpListener | listen, close, accept, getLocalPort |
| UdpSocket | bind, unbind, send, receive, getLocalPort, MaxDatagramSize |
| SocketSelector | add, remove, clear, wait, isReady, dispatchReadyCallbacks, copy construction and assign; Receive/Send bit flags |
| Packet | append, clear, getData, getDataSize, getReadPosition, endOfPacket, isValid, copy construction; explicitly typed write/read; overridable onSend/onReceive |
| Http | setHost, sendRequest, Request and Response; explicit HTTP request version |
| Ftp | connect, disconnect, login, keepAlive, working directory, directory listings, change/create/delete directories, rename/delete files, upload/append/download, sendCommand |
| Sftp | Separate connect and login, password/key authentication, getSessionInfo, path resolution, directories and attributes, rename/delete, streaming uploads/downloads, TimeoutWithPredicate |

Methods involving I/O or waiting return promises; pure state queries and configuration remain synchronous. TcpSocket's `disconnect()`, listener.close and udp.unbind synchronously end local transports. FTP/SFTP disconnect returns a promise; a separate synchronous close interrupts unfinished operations.

C++ output references are represented by returned objects:

| Operation | Return value |
|------|--------|
| TCP send(Uint8Array) | `{ status, sent }` |
| TCP receive(Uint8Array) | `{ status, received }` |
| TCP send/receive(Packet) | `SocketStatus` |
| UDP send(Uint8Array or Packet, address, port) | `SocketStatus` |
| UDP receive(Uint8Array or Packet) | `{ status, received, remoteAddress?, remotePort }` |

SocketHandle is a type alias for a Node transport object, used only by protected getNativeHandle; it is not a portable numeric operating-system fd/SOCKET.

## TCP, UDP and Selector

```js
const sf = require('sfml.js');

function check(status) {
  if (status !== sf.SocketStatus.Done) {
    throw new Error(`Socket operation failed: ${status}`);
  }
}

async function exchange() {
  const listener = new sf.TcpListener();
  const client = new sf.TcpSocket();
  const peer = new sf.TcpSocket();
  try {
    check(await listener.listen(0, sf.IpAddress.LocalHost));
    const accepting = listener.accept(peer);
    check(await client.connect(sf.IpAddress.LocalHost,
      listener.getLocalPort(), sf.seconds(1)));
    check(await accepting);

    const received = new sf.Packet();
    const waiting = peer.receive(received);
    check(await client.send(
      new sf.Packet().write('string', '你好').write('u64', 42n)));
    check(await waiting);
    console.log(received.read('string'), received.read('u64'));
  } finally {
    listener.close();
    client.disconnect();
    peer.disconnect();
  }
}
exchange().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
```

`setBlocking(true)` makes the promise wait for required data/write completion without blocking the event loop. `setBlocking(false)` returns according to the wrapper's current state; TCP connect starts a connection and returns NotReady, and Selector.Send can wait for connection readiness. After TLS setup returns HandshakeStarted, repeat the same setup method to obtain handshake status. UDP bind/send and TCP listen still wait for Node completion notifications to provide actual ports and operation results.

For raw TCP byte sends, sent is the number of bytes accepted by the wrapper in this call. Nonblocking mode submits at most the remaining capacity under the current Node writable highWaterMark; partial acceptance returns Partial, and no space returns NotReady. Pass the unsent suffix when continuing. A false result from Node write indicates only backpressure; bytes already queued in that call do not need resending. Done does not mean the peer application has consumed or persisted the data.

TCP Packet uses a big-endian uint32 length prefix. After Partial, continue passing the same Packet; the wrapper retains the first send's snapshot and offset. Other sends return NotReady until it completes, preventing packet contents from interleaving. Receiving supports arbitrarily segmented headers and bodies; nonblocking NotReady retains received portions. Do not switch to raw-byte receiving until an in-progress Packet receive completes.

TCP receive uses the Node readable queue and backpressure, without an additional unbounded copy of the data. UDP preserves datagram boundaries; if the destination array is smaller than the datagram, that datagram is discarded and Error is returned. The UDP receive queue holds at most 4096 datagrams or 8 MiB, discarding new datagrams beyond the limit. A single datagram is limited to 65507 bytes. TCP Packet receive is limited to 64 MiB; exceeding the limit closes the connection and returns Error.

Selector observes wrapper-level readable/writable state and does not claim equivalence to raw system select. Each wait saves a readiness snapshot; isReady queries it, and dispatchReadyCallbacks explicitly dispatches callbacks. wait returns false on timeout. Changing the member set or closing all members wakes the wait. A selector allows only one simultaneous wait; after modifications, you can wait again. Copying a selector copies member references and the readiness snapshot, not sockets.

Closing connections wakes pending reads, accept and Selector waits. New connections use a new generation, so old operations cannot read data from a new connection. Explicitly close network objects when finished; active Node connections keep the process alive.

## Packet

In the following snippets, `sf` means `require('sfml.js')`. Writes and reads must use the same field order and types:

```js
const packet = new sf.Packet()
  .write('bool', true)
  .write('i32', -100)
  .write('u64', 18446744073709551615n)
  .write('f32', 1.5)
  .write('string', '音频🌟')
  .write('bytes', new Uint8Array([ 255, 0, 254 ]));
```

| Type argument | JS type | SFML byte format |
|----------|---------|---------------|
| bool | boolean | One byte |
| i8/u8, i16/u16, i32/u32 | number | Integer of the corresponding bit width, big-endian |
| i64/u64 | bigint | 64-bit integer, big-endian |
| f32/f64 | number | IEEE floating point in host byte order, matching SFML memcpy |
| string | string | Corresponds to sf::String: uint32 character count + UTF-32 big-endian code points |
| utf8 | string | UTF-8 encoded as std::string: uint32 byte count + bytes |
| bytes | Uint8Array | Binary std::string: uint32 byte count + original bytes |

`read(type)` returns the corresponding type, or undefined when data is insufficient, leaving isValid false until clear. Failure does not skip the missing field; if a string length has been read successfully, the cursor stays at the start of the string body. Integer writes convert to the specified bit width; 64-bit values do not pass through number. As with original SFML, floating-point Packets exchanged across endianness boundaries require both sides to agree on conversion.

The implementation uses a growable Buffer, with integer and floating-point reads accessing the same memory directly. getData returns a view of the valid region, or undefined for an empty packet; treat the view as read-only. Old views keep old allocations alive after capacity growth or clear. append copies input; sending takes a snapshot when input is accepted, so later caller modifications cannot change submitted bytes. There is no extra NAN mapping or per-byte cross-language call.

onSend returns bytes to send, and onReceive receives a complete message; subclasses can implement compression or custom encoding. Network receive clears the original packet before calling onReceive. Both hooks run synchronously; perform asynchronous work outside send/receive.

## Addresses, DNS and TLS

IpAddress is immutable; toBytes returns an independent copy of IPv6 bytes, and toInteger applies only to IPv4. fromString does not perform DNS and rejects abbreviated IPv4, octal forms and IPv6 with a zone ID. equal, notEqual, less, lessEqual, greater and greaterEqual support addresses; ordering compares IPv4/IPv6 first, then bytes.

Without custom servers, Dns.resolve uses system lookup, including the hosts file; completion timing on this path is controlled by the system resolver. With custom servers, it queries A/AAAA in parallel. queryNs/Mx/Srv/Txt use independent Resolvers; timeout cancels only that query, without affecting others. MX priority maps to preference, and SRV name maps to target. Failed default-server queries return undefined or an empty array.

getLocalAddress obtains the local address through UDP route selection without sending application data. Public-address queries require external DNS/HTTP services; offline tests do not make real public-network queries. Time.Zero means no timeout.

TLS supports client and server upgrades of connected TCP sockets. Clients verify against system CAs and the hostname by default; pass certificate strings/bytes as a CA, or explicitly pass false to disable verification. Servers accept a certificate, private key and optional passphrase. Drain plaintext read/write queues before upgrading. Certificates and cipher suites are provided by Node/OpenSSL; their set is not guaranteed to match SFML's Mbed TLS.

## HTTP

```javascript
const sf = require('sfml.js');

async function fetchText(host, uri) {
  const http = new sf.Http(host);
  const request = new sf.Http.Request(uri);
  const response = await http.sendRequest(request, sf.seconds(5));
  if (response.getStatus() !== sf.HttpStatus.Ok) {
    throw new Error(`HTTP status: ${response.getStatus()}`);
  }
  return response.getBody();
}
```

Request supports setField, setMethod, setUri, setHttpVersion and setBody; Response provides status, HTTP version, field and body queries. getBody decodes UTF-8; getBodyBytes returns independent raw bytes. setBody accepts Uint8Array directly.

To support SFML's explicit HTTP/1.0/1.1 request lines, the implementation sends requests over Node TCP/TLS and parses responses incrementally. Parsing supports Content-Length, chunked encoding, trailers, interim 1xx responses, HEAD/bodyless statuses and connection-close delimiting. Request bodies use Content-Length; conflicting lengths and Transfer-Encoding are forbidden. Redirects are not followed automatically, bodies are not decompressed, and connections are not upgraded to HTTP/2.

The Time passed to sendRequest limits the whole request; a fourth AbortSignal argument can cancel it. Invalid or truncated responses map to InvalidResponse; connection/TLS failures and cancellation map to ConnectionFailed. Response bodies are limited to 64 MiB, and incomplete headers or chunk framing to 64 KiB. setHost parses the address synchronously; actual DNS resolution and connection happen in sendRequest.

## FTP

FTP uses basic-ftp's control connection, passive data channels and streaming file transfers. connect does not log in; login defaults to anonymous. Enums and response types are generated from the bundled SFML headers, preserving raw FTP status codes. Directory listings send NLST.

download(remoteFile, localDirectory, mode) writes under the remote filename in the local directory; upload(localFile, remoteDirectory, mode, append) writes under the local filename in the remote directory. Binary/Ascii/Ebcdic send TYPE I/A/E respectively; server responses determine mode support. renameFile, deleteDirectory and similar methods perform only their corresponding operations, without implicit recursive deletion. sendCommand sends other FTP commands; newlines and NUL in arguments are rejected.

Operations on the same Ftp object are serialized. connect's Time limits only connection establishment; use close to interrupt other commands explicitly. close shuts down both control and data connections. Connection failures, closed connections and local file errors map to corresponding SFML responses; server errors preserve their status codes.

<a id="sftp"></a>

## SFTP

SFTP uses ssh2. connect completes SSH negotiation and stops before authentication; getSessionInfo provides the host public key, SHA-1/SHA-256 fingerprints and negotiated algorithms. login supports a password or matching public/private keys and a passphrase; failed authentication can be retried.

Host keys are not automatically matched against known_hosts. As in SFML, SessionInfo is exposed for the caller to evaluate. To verify server identity, compare hostKey.sha256 with a trusted fingerprint before login.

The application supplies an IpAddress, credentials, a known trusted fingerprint and a consumer callback to this function:

```javascript
async function download(address, username, password, trustedFingerprint, consume) {
  const client = new sf.Sftp();
  try {
    const connection = await client.connect(address, 22, sf.seconds(5));
    if (!connection.isOk()) throw new Error(connection.getMessage());
    const info = client.getSessionInfo();
    if (!info || info.hostKey.sha256 !== trustedFingerprint) {
      throw new Error('Unexpected SFTP host key');
    }
    const authentication = await client.login(username, password, sf.seconds(5));
    if (!authentication.isOk()) throw new Error(authentication.getMessage());
    const result = await client.download('/file', async bytes => {
      await consume(bytes);
      return true;
    });
    if (!result.isOk()) throw new Error(result.getMessage());
  } finally {
    client.close();
  }
}
```

The download callback receives a Buffer view of at most 65536 bytes; return false to stop, and EOF ends with a zero-byte callback. The upload callback receives `{ data, size }`: fill the Buffer and set size to the valid byte count. Returning false still writes this call's valid data before stopping. Callbacks may return promises. Each call allocates an independent Buffer, so retained old views are not overwritten by later blocks; after an upload callback completes, the caller must not modify the submitted block.

Attributes include paths, FileType, permissions, bigint size/UID/GID and Date timestamps. ssh2's numeric offset and attribute APIs use number, so this binding accepts only exact offsets from 0 to 2^53 - 1, rejecting larger values to avoid silent precision loss. Timestamp precision is the protocol's seconds. rename(overwrite=true) uses the OpenSSH POSIX rename extension; servers without that extension return an error.

Time becomes the period for a single wait without progress. TimeoutWithPredicate calls its predicate when a full period passes with no inbound connection data or operation-completion notification: true continues waiting; false returns Timeout and closes the session. Time.Zero sets no timer. This is waiting at the Node event layer, not equivalent to libssh2 EAGAIN or kernel-readiness details.

close interrupts active waits. User callback promises cannot be forcibly terminated, but their later completion cannot continue reads or writes on a reestablished session. SFTP protocol statuses map to corresponding Result.Value values; when underlying errors cannot be mapped one-to-one to libssh2-specific values, the result is Error with the original message, without inventing a specific error.

## Verification and demos

`npm run demo:network` runs TCP, Packet, UDP and Selector examples on the local loopback address, closing all connections when finished.

`npm run test:runtime` includes network tests that start local TCP/UDP/DNS/FTP/SSH services and exercise real sockets, segmented messages, send backpressure, TLS trust and hostname failures, password and public-key authentication, directory and streaming file operations, timeouts and cancellation. `network-oracle.test.cjs` compiles an SFML C++ program in a temporary directory to compare bytes for every Packet field and IPv4/IPv6 strings; Windows skips this Unix compilation command.

Dependency versions are defined by [package.json](../package.json) and the lockfile. Local loopback tests do not verify public-service availability; see the [development guide](development.md#testing) for platform configuration and execution.

<a id="sfml-cpp-reference"></a>

## SFML C++ reference

The original [Packet](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Packet.html), [TcpSocket](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1TcpSocket.html), [UdpSocket](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1UdpSocket.html), [Http](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Http.html), [Ftp](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Ftp.html) and [Sftp](https://www.sfml-dev.org/documentation/3.1.0/classsf_1_1Sftp.html) references explain upstream packet formats and protocol concepts.

This binding uses Node.js transports and promise-based I/O rather than SFML C++ Network. The statuses, limits, timeouts and lifecycle rules in this JavaScript guide take precedence for sfml.js applications.
