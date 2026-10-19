'use strict';

// Port of SFML/examples/window/Window.cpp; see ../README.md.
const { setImmediate: nextFrame } = require('node:timers/promises');
const sf = require('../../..');
const createScene = require('./OpenGL.cjs');

/** Run the official rotating cube in an SFML-managed OpenGL window. */
async function main() {
  const window = new sf.Window(
    new sf.VideoMode(new sf.Vector2u(640, 480)), 'SFML window with OpenGL',
    { settings: { depthBits: 24 } }
  );
  let scene;
  let running = true;

  /** Request cleanup after the current rendering turn. */
  function stop() {
    running = false;
  }

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  try {
    if (!window.setActive()) {
      throw new Error('Failed to set the window as active');
    }

    // Original 36 vertices: position followed by RGBA color.
    const cube = new Float32Array([
      -50, -50, -50, 0, 0, 1, 1,
      -50, 50, -50, 0, 0, 1, 1,
      -50, -50, 50, 0, 0, 1, 1,
      -50, -50, 50, 0, 0, 1, 1,
      -50, 50, -50, 0, 0, 1, 1,
      -50, 50, 50, 0, 0, 1, 1,

      50, -50, -50, 0, 1, 0, 1,
      50, 50, -50, 0, 1, 0, 1,
      50, -50, 50, 0, 1, 0, 1,
      50, -50, 50, 0, 1, 0, 1,
      50, 50, -50, 0, 1, 0, 1,
      50, 50, 50, 0, 1, 0, 1,

      -50, -50, -50, 1, 0, 0, 1,
      50, -50, -50, 1, 0, 0, 1,
      -50, -50, 50, 1, 0, 0, 1,
      -50, -50, 50, 1, 0, 0, 1,
      50, -50, -50, 1, 0, 0, 1,
      50, -50, 50, 1, 0, 0, 1,

      -50, 50, -50, 0, 1, 1, 1,
      50, 50, -50, 0, 1, 1, 1,
      -50, 50, 50, 0, 1, 1, 1,
      -50, 50, 50, 0, 1, 1, 1,
      50, 50, -50, 0, 1, 1, 1,
      50, 50, 50, 0, 1, 1, 1,

      -50, -50, -50, 1, 0, 1, 1,
      50, -50, -50, 1, 0, 1, 1,
      -50, 50, -50, 1, 0, 1, 1,
      -50, 50, -50, 1, 0, 1, 1,
      50, -50, -50, 1, 0, 1, 1,
      50, 50, -50, 1, 0, 1, 1,

      -50, -50, 50, 1, 1, 0, 1,
      50, -50, 50, 1, 1, 0, 1,
      -50, 50, 50, 1, 1, 0, 1,
      -50, 50, 50, 1, 1, 0, 1,
      50, -50, 50, 1, 1, 0, 1,
      50, 50, 50, 1, 1, 0, 1,
    ]);
    scene = createScene(cube);
    scene.initialize();
    scene.resize(window.getSize());
    const clock = new sf.Clock();

    while (running && window.isOpen()) {
      for (let event; (event = window.pollEvent());) {
        if (event.is('Closed') ||
            event.getIf('KeyPressed')?.code === sf.Keyboard.Key.Escape) {
          stop();
          break;
        }
        const resized = event.getIf('Resized');
        if (resized) scene.resize(resized.size);
      }
      if (!running) break;

      if (scene.draw(clock.getElapsedTime().asSeconds())) window.display();
      await nextFrame();
    }
  } finally {
    window.close();
    scene?.dispose();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
