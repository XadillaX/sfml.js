'use strict';

const sf = require('../../..');
const done = sf.Socket.Status.Done;
const commonName = 'localhost';

// Public upstream demonstration key, with a Node-compatible localhost SAN.
// The original certificate's space-containing name fails Node verification.
// Never use this key to secure a real service.
const privateKey = `-----BEGIN EC PARAMETERS-----
BgUrgQQAIg==
-----END EC PARAMETERS-----
-----BEGIN EC PRIVATE KEY-----
MIGkAgEBBDD4ybj384qP07KjAqKoU4XwVyRH/Sy2kMYrtCr0SU/R0sCSxSPNwAXW
8Z5Z5CV/uDugBwYFK4EEACKhZANiAATpYJyfUQMS5YUOS8yaf2svRqebVAyqZcNh
lUKEP2OPwacLVul1OlW9QYJh4VFvtGvKyNEd1YCpBFUyASfeev8ZNBaLpMb20e3S
ztTSrGCF1rJynnEoGJrIh3trvRAKD0E=
-----END EC PRIVATE KEY-----`;
const certificate = `-----BEGIN CERTIFICATE-----
MIIB1zCCAV6gAwIBAgIUOe0/sjP4wt0ci8qIrg94CF8MAycwCgYIKoZIzj0EAwIw
FDESMBAGA1UEAwwJbG9jYWxob3N0MCAXDTI2MTAxODE3NDQwMFoYDzIxMjYwOTI0
MTc0NDAwWjAUMRIwEAYDVQQDDAlsb2NhbGhvc3QwdjAQBgcqhkjOPQIBBgUrgQQA
IgNiAATpYJyfUQMS5YUOS8yaf2svRqebVAyqZcNhlUKEP2OPwacLVul1OlW9QYJh
4VFvtGvKyNEd1YCpBFUyASfeev8ZNBaLpMb20e3SztTSrGCF1rJynnEoGJrIh3tr
vRAKD0GjbzBtMB0GA1UdDgQWBBSJpLOuSq/emvL3MozIE1iR1sj6UDAfBgNVHSME
GDAWgBSJpLOuSq/emvL3MozIE1iR1sj6UDAPBgNVHRMBAf8EBTADAQH/MBoGA1Ud
EQQTMBGCCWxvY2FsaG9zdIcEfwAAATAKBggqhkjOPQQDAgNnADBkAjACMaJaVI2P
Ftw24ONwf4Uo67Yy2/m3iTFx8kmF//GozYN3zfTCM7T3PG0N7j608ZECMGqXvhrE
VVLk+es6V6sLNq72csb3nHyWlNSsZla0TUQnvjiyZyDJIKARLU2/plbL9w==
-----END CERTIFICATE-----`;

/**
 * Display the negotiated TLS cipher.
 * @param {object} socket - Connected TCP socket.
 */
function printTls(socket) {
  console.log('TLS set up');
  const cipher = socket.getCurrentCiphersuiteName();
  if (cipher) console.log(`Ciphersuite in use: ${cipher}`);
}

/**
 * Accept one client, send a greeting, then receive its answer.
 * @param {number} port - Listening port.
 * @param {boolean} tls - Whether to enable TLS.
 */
async function runTcpServer(port, tls) {
  const listener = new sf.TcpListener();
  const socket = new sf.TcpSocket();
  try {
    if (await listener.listen(port) !== done) return;
    console.log(
      `Server is listening to port ${port}, waiting for connections... `
    );

    if (await listener.accept(socket) !== done) return;
    console.log(`Client connected: ${socket.getRemoteAddress().toString()}`);

    if (tls) {
      const status = await socket.setupTlsServer(certificate, privateKey);
      if (status !== sf.TcpSocket.TlsStatus.HandshakeComplete) {
        console.log('TLS handshake could not be completed');
        return;
      }
      printTls(socket);
    }

    const out = "Hi, I'm the server";
    if ((await socket.send(Buffer.from(out))).status !== done) return;
    console.log(`Message sent to the client: "${out}"`);

    const incoming = Buffer.alloc(128);
    const result = await socket.receive(incoming);
    if (result.status !== done) return;
    const answer = incoming.toString('utf8', 0, result.received);
    console.log(`Answer received from the client: "${answer}"`);
  } finally {
    socket.disconnect();
    listener.close();
  }
}

/**
 * Connect to the server, receive its greeting, and send an answer.
 * @param {number} port - Remote port.
 * @param {boolean} tls - Whether to enable TLS.
 * @param {object} server - Resolved server address.
 */
async function runTcpClient(port, tls, server) {
  const socket = new sf.TcpSocket();
  try {
    if (await socket.connect(server, port) !== done) return;
    console.log(`Connected to server ${server.toString()}`);

    if (tls) {
      const status = await socket.setupTlsClient(commonName, certificate);
      if (status !== sf.TcpSocket.TlsStatus.HandshakeComplete) {
        console.log('TLS handshake could not be completed');
        return;
      }
      printTls(socket);
    }

    const incoming = Buffer.alloc(128);
    const result = await socket.receive(incoming);
    if (result.status !== done) return;
    const message = incoming.toString('utf8', 0, result.received);
    console.log(`Message received from the server: "${message}"`);

    const out = "Hi, I'm a client";
    if ((await socket.send(Buffer.from(out))).status !== done) return;
    console.log(`Message sent to the server: "${out}"`);
  } finally {
    socket.disconnect();
  }
}

module.exports = { runTcpServer, runTcpClient };
