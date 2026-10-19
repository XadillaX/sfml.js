'use strict';

const sf = require('../../..');
const done = sf.Socket.Status.Done;

/**
 * Receive one datagram and reply to its sender.
 * @param {number} port - Listening port.
 */
async function runUdpServer(port) {
  const socket = new sf.UdpSocket();
  try {
    if (await socket.bind(port) !== done) return;
    console.log(
      `Server is listening to port ${port}, waiting for a message... `
    );

    const incoming = Buffer.alloc(128);
    const result = await socket.receive(incoming);
    if (result.status !== done) return;
    const sender = result.remoteAddress;
    const message = incoming.toString('utf8', 0, result.received);
    console.log(
      `Message received from client ${sender.toString()}: "${message}"`
    );

    const out = "Hi, I'm the server";
    const sent = await socket.send(Buffer.from(out), sender, result.remotePort);
    if (sent !== done) return;
    console.log(`Message sent to the client: "${out}"`);
  } finally {
    socket.unbind();
  }
}

/**
 * Send a greeting and wait for an unconnected UDP reply.
 * @param {number} port - Remote port.
 * @param {object} server - Resolved server address.
 */
async function runUdpClient(port, server) {
  const socket = new sf.UdpSocket();
  try {
    const out = "Hi, I'm a client";
    if (await socket.send(Buffer.from(out), server, port) !== done) return;
    console.log(`Message sent to the server: "${out}"`);

    const incoming = Buffer.alloc(128);
    const result = await socket.receive(incoming);
    if (result.status !== done) return;
    const message = incoming.toString('utf8', 0, result.received);
    console.log(
      `Message received from ${result.remoteAddress.toString()}: "${message}"`
    );
  } finally {
    socket.unbind();
  }
}

module.exports = { runUdpServer, runUdpClient };
