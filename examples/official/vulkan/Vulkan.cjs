'use strict';

// Port of SFML/examples/vulkan/Vulkan.cpp; see ../README.md.
const fs = require('node:fs/promises');
const path = require('node:path');
const { setImmediate: nextFrame } = require('node:timers/promises');
const sf = require('../../..');

/** Run SFML's window integration with an application-owned Vulkan renderer. */
async function main() {
  if (process.platform === 'darwin') {
    throw new Error('SFML Vulkan window integration does not support macOS.');
  }
  if (![ 'linux', 'win32' ].includes(process.platform) ||
      process.arch !== 'x64') {
    throw new Error('This example requires Linux/X11 or Windows on x64 (nvk).');
  }
  if (!sf.Vulkan.isAvailable()) {
    throw new Error('Vulkan is unavailable. Install its loader and driver.');
  }
  const { vk, Scope } = require('./Common.cjs');
  const Context = require('./Context.cjs');
  const Resources = require('./Resources.cjs');
  const Swapchain = require('./Swapchain.cjs');
  const { vertices, indexes } = require('./Scene.cjs');

  const image = new sf.Image();
  if (!await image.loadFromFile(path.join(__dirname, 'resources/logo.png'))) {
    throw new Error('Failed to load the Vulkan cube texture');
  }
  const shaders = await Promise.all([ 'vert', 'frag' ].map(async stage => {
    const bytes = await fs.readFile(
      path.join(__dirname, `resources/shader.${stage}.spv`)
    );
    // nvk requires a standalone Uint8Array with no pooled Buffer byte offset.
    return new Uint8Array(bytes);
  }));
  const window = new sf.Window(
    new sf.VideoMode(new sf.Vector2u(800, 600)), 'SFML window with Vulkan'
  );
  const context = new Context(window);
  const sceneScope = new Scope();
  const lifetime = new Scope();
  let swapchain;
  let running = true;

  /** Leave the loop so Vulkan is released before the native window. */
  function stop() {
    running = false;
  }

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  lifetime.defer(() => {
    window.close();
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  });
  lifetime.defer(() => context.dispose());
  lifetime.defer(() => sceneScope.dispose());
  lifetime.defer(() => swapchain?.dispose());
  lifetime.defer(() => context.waitIdle());

  try {
    context.initialize();
    const resources = new Resources(context, sceneScope);
    swapchain = new Swapchain(context, {
      vertex: resources.uploadBuffer(vertices,
        vk.VK_BUFFER_USAGE_VERTEX_BUFFER_BIT),
      index: resources.uploadBuffer(indexes,
        vk.VK_BUFFER_USAGE_INDEX_BUFFER_BIT),
      texture: resources.createTexture(image),
      shaders,
    });
    const clock = new sf.Clock();
    while (running && window.isOpen()) {
      for (let event; (event = window.pollEvent());) {
        if (event.is('Closed') ||
            event.getIf('KeyPressed')?.code === sf.Keyboard.Key.Escape) {
          stop();
          break;
        }
        if (event.is('Resized')) swapchain.outOfDate = true;
      }
      if (!running) break;
      swapchain.draw(clock.getElapsedTime().asSeconds(),
        sf.Mouse.getPosition(window));
      await nextFrame();
    }
  } finally {
    lifetime.dispose();
  }
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
