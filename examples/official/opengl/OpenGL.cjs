'use strict';

// Port of SFML/examples/opengl/OpenGL.cpp; see ../README.md.
const { join } = require('node:path');
const { setImmediate: nextFrame } = require('node:timers/promises');
const sf = require('../../..');
const createCube = require('./Cube.cjs');
const resource = name => join(__dirname, 'resources', name);

/**
 * Load a texture with the requested color space.
 * @param {string} name Resource filename.
 * @param {boolean} sRgb Whether to decode the texture as sRGB.
 * @return {Promise<sf.Texture>} Loaded texture.
 */
async function loadTexture(name, sRgb = false) {
  const texture = new sf.Texture();
  if (!await texture.loadFromFile(resource(name), sRgb)) {
    throw new Error(`Failed to load ${name}`);
  }
  return texture;
}

/**
 * Activate or deactivate the window for direct GL calls.
 * @param {sf.RenderWindow} window Render target.
 * @param {boolean} active Desired context state.
 */
function setActive(window, active) {
  if (!window.setActive(active)) {
    throw new Error(`Failed to set window ${active ? 'active' : 'inactive'}`);
  }
}

/** Mix SFML sprites/text with the official textured OpenGL cube. */
async function main() {
  let running = true;
  let sRgb = false;

  /** Request cleanup after the current asynchronous turn. */
  function stop() {
    running = false;
  }

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  try {
    while (running) {
      const window = new sf.RenderWindow(
        new sf.VideoMode(new sf.Vector2u(800, 600)),
        'SFML graphics with OpenGL',
        { settings: { depthBits: 24, sRgbCapable: sRgb } }
      );
      let cube;

      try {
        window.setVerticalSyncEnabled(true);
        window.setMinimumSize(new sf.Vector2u(400, 300));
        window.setMaximumSize(new sf.Vector2u(1200, 900));

        const backgroundTexture = await loadTexture('background.jpg', sRgb);
        const background = new sf.Sprite(backgroundTexture);
        const font = new sf.Font();
        if (!await font.openFromFile(resource('tuffy.ttf'))) {
          throw new Error('Failed to load tuffy.ttf');
        }
        const labels = [
          [ 'SFML / OpenGL demo', 280, 450 ],
          [ 'Press space to toggle sRGB conversion', 175, 500 ],
          [ 'Press return to toggle mipmapping', 200, 550 ],
        ].map(([ string, x, y ]) => {
          const text = new sf.Text({ font, string });
          text.setFillColor(new sf.Color(255, 255, 255, 170));
          text.setPosition(new sf.Vector2f(x, y));
          return text;
        });
        let texture = await loadTexture('logo.png');
        let mipmapEnabled = texture.generateMipmap();
        if (!running) break;

        setActive(window, true);
        cube = createCube();
        cube.initialize();
        cube.resize(window.getSize());
        sf.Texture.bind(texture);
        setActive(window, false);
        const clock = new sf.Clock();

        while (running && window.isOpen()) {
          for (let event; (event = window.pollEvent());) {
            const code = event.getIf('KeyPressed')?.code;
            if (event.is('Closed') || code === sf.Keyboard.Key.Escape) {
              stop();
              break;
            }
            if (code === sf.Keyboard.Key.Space) {
              sRgb = !sRgb;
              window.close();
              break;
            }
            if (code === sf.Keyboard.Key.Enter) {
              if (mipmapEnabled) {
                texture = await loadTexture('logo.png');
                mipmapEnabled = false;
              } else {
                mipmapEnabled = texture.generateMipmap();
              }
              // Loading may activate SFML's shared context. Rebind on ours.
              setActive(window, true);
              sf.Texture.bind(texture);
              setActive(window, false);
            }

            const resized = event.getIf('Resized');
            if (resized) {
              setActive(window, true);
              cube.resize(resized.size);
              setActive(window, false);
              const size = backgroundTexture.getSize();
              const view = new sf.View();
              view.setSize(new sf.Vector2f(size.x, size.y));
              view.setCenter(new sf.Vector2f(size.x / 2, size.y / 2));
              window.setView(view);
            }
          }
          if (!running || !window.isOpen()) break;
          const size = window.getSize();
          if (!size.x || !size.y) {
            await nextFrame();
            continue;
          }

          window.pushGLStates();
          window.draw(background);
          window.popGLStates();

          setActive(window, true);
          cube.draw(clock.getElapsedTime().asSeconds(),
            sf.Mouse.getPosition(window), size);
          setActive(window, false);

          window.pushGLStates();
          for (const text of labels) window.draw(text);
          window.popGLStates();
          window.display();
          await nextFrame();
        }
      } finally {
        window.close();
        cube?.dispose();
      }
    }
  } finally {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
