'use strict';

// Port of SFML/examples/X11/X11.cpp; see ../README.md.
const { setImmediate: nextFrame } = require('node:timers/promises');
const { promisify } = require('node:util');

/** Run two SFML contexts inside windows owned by the third-party X11 client. */
async function main() {
  if (process.platform !== 'linux') {
    throw new Error('The X11 example requires Linux with X11 and desktop GL.');
  }
  if (!process.env.DISPLAY) {
    throw new Error('Cannot open X11 display; set DISPLAY to an X server.');
  }

  const x11 = require('x11');
  const display = await new Promise((resolve, reject) => {
    x11.createClient((error, result) => {
      if (error) reject(new Error(`Cannot open X11 display: ${error.message}`));
      else resolve(result);
    });
  });
  const client = display.client;
  const screen = display.screen[client.screenNum];
  const parent = client.AllocID();
  const views = [];
  let scene;
  let running = true;
  let failure;

  /** Request orderly teardown at the end of the current rendering turn. */
  function stop() {
    running = false;
  }

  client.on('error', error => { failure = error; stop(); });
  client.on('end', stop);
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  try {
    client.CreateWindow(parent, screen.root, 0, 0, 650, 330, 0, 0, 1, 0, {
      backgroundPixel: screen.black_pixel,
      eventMask: x11.eventMask.KeyPress,
    });
    client.ChangeProperty(
      0, parent, client.atoms.WM_NAME, client.atoms.STRING, 8, 'SFML Window'
    );
    const atom = promisify(client.InternAtom.bind(client));
    const protocols = await atom(false, 'WM_PROTOCOLS');
    const deleteWindow = await atom(false, 'WM_DELETE_WINDOW');
    const protocolData = Buffer.alloc(4);
    protocolData.writeUInt32LE(deleteWindow);
    client.ChangeProperty(
      0, parent, protocols, client.atoms.ATOM, 32, protocolData
    );
    client.on('event', event => {
      if (event.name === 'KeyPress' ||
          (event.name === 'ClientMessage' && event.wid === parent &&
           event.message_type === protocols && event.format === 32 &&
           event.data[0] === deleteWindow)) stop();
    });

    const children = [ client.AllocID(), client.AllocID() ];
    for (let i = 0; i < children.length; i++) {
      client.CreateWindow(
        children[i], parent, 10 + i * 320, 10, 310, 310, 0, 0, 1, 0, {}
      );
    }
    client.MapWindow(parent);
    // SFML uses another X connection. Wait for the X server to create the IDs.
    await client.sync();
    if (failure) throw failure;

    // Original 36 vertices: position followed by RGB color.
    const cube = new Float32Array([
      -50, -50, -50, 1, 1, 0,
      -50, 50, -50, 1, 1, 0,
      -50, -50, 50, 1, 1, 0,
      -50, -50, 50, 1, 1, 0,
      -50, 50, -50, 1, 1, 0,
      -50, 50, 50, 1, 1, 0,

      50, -50, -50, 1, 1, 0,
      50, 50, -50, 1, 1, 0,
      50, -50, 50, 1, 1, 0,
      50, -50, 50, 1, 1, 0,
      50, 50, -50, 1, 1, 0,
      50, 50, 50, 1, 1, 0,

      -50, -50, -50, 1, 0, 1,
      50, -50, -50, 1, 0, 1,
      -50, -50, 50, 1, 0, 1,
      -50, -50, 50, 1, 0, 1,
      50, -50, -50, 1, 0, 1,
      50, -50, 50, 1, 0, 1,

      -50, 50, -50, 1, 0, 1,
      50, 50, -50, 1, 0, 1,
      -50, 50, 50, 1, 0, 1,
      -50, 50, 50, 1, 0, 1,
      50, 50, -50, 1, 0, 1,
      50, 50, 50, 1, 0, 1,

      -50, -50, -50, 0, 1, 1,
      50, -50, -50, 0, 1, 1,
      -50, 50, -50, 0, 1, 1,
      -50, 50, -50, 0, 1, 1,
      50, -50, -50, 0, 1, 1,
      50, 50, -50, 0, 1, 1,

      -50, -50, 50, 0, 1, 1,
      50, -50, 50, 0, 1, 1,
      -50, 50, 50, 0, 1, 1,
      -50, 50, 50, 0, 1, 1,
      50, -50, 50, 0, 1, 1,
      50, 50, 50, 0, 1, 1,
    ]);
    const sf = require('../../..');
    scene = require('./OpenGL.cjs')(cube);
    for (const handle of children) {
      const view = new sf.Window(BigInt(handle));
      views.push(view);
      if (!view.setActive()) throw new Error('Failed to activate an SFML view');
      scene.initialize();
    }

    const clock = new sf.Clock();
    while (running) {
      for (const view of views) {
        for (let event; (event = view.pollEvent());) {
          if (event.is('KeyPressed') || event.is('Closed')) stop();
        }
      }
      if (!running) break;

      const elapsed = clock.getElapsedTime().asSeconds();
      for (let i = 0; i < views.length; i++) {
        if (!views[i].setActive()) {
          throw new Error('Failed to activate an SFML view');
        }
        scene.draw(elapsed * (i === 0 ? 1 : 0.3));
      }
      for (const view of views) view.display();
      await nextFrame();
    }
    if (failure) throw failure;
  } finally {
    // Close SFML contexts before freeing their arrays and native containers.
    for (const view of views) view.close();
    scene?.dispose();
    client.DestroyWindow(parent);
    client.close();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
