'use strict';

// Port of SFML/examples/win32/Win32.cpp; see ../README.md.
const { join } = require('node:path');
const { setImmediate: nextFrame } = require('node:timers/promises');

/**
 * Convert wndkit's numeric HWND without losing pointer precision.
 * @param {object} control Native wndkit control.
 * @return {bigint} Handle accepted by sf.RenderWindow.
 */
function windowHandle(control) {
  if (!Number.isSafeInteger(control.handle) || control.handle <= 0) {
    throw new Error('wndkit returned an invalid window handle');
  }
  return BigInt(control.handle);
}

/** Embed the official two animated SFML views in a native Win32 window. */
async function main() {
  if (process.platform !== 'win32' || process.arch !== 'x64') {
    throw new Error('This example requires Windows x64');
  }
  let kit;
  try {
    kit = require('wndkit');
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    throw new Error('Install Win32 dependencies first: ' +
      'npm ci --prefix examples/official/win32 --ignore-scripts');
  }
  const sf = require('../../..');
  const { Window, Button, Label, Application } = kit;
  const textures = [];
  for (const name of [ 'image1.jpg', 'image2.jpg' ]) {
    const texture = new sf.Texture();
    if (!await texture.loadFromFile(join(__dirname, 'resources', name))) {
      throw new Error(`Failed to load ${name}`);
    }
    textures.push(texture);
  }

  let window;
  let running = true;
  const views = [];
  // wndkit's native control registry holds raw pointers, not JS references.
  const controls = [];

  /** Request an orderly exit after dispatching the current native message. */
  function stop() {
    running = false;
  }

  /** Release SFML contexts before wndkit destroys their underlying HWNDs. */
  function stopRendering() {
    stop();
    for (const view of views) {
      if (view.isOpen()) view.close();
    }
  }

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  try {
    window = new Window('SFML Win32', 660, 520);
    window.position = { x: 200, y: 200 };
    // wndkit invokes this synchronously, before its WM_CLOSE destroys HWNDs.
    window.on('close', stopRendering);
    const quit = new Button(window, 'Quit', 560, 440, 80, 40);
    quit.on('click', stop);
    controls.push(quit);

    for (const x of [ 20, 340 ]) {
      const host = new Label(window, '', x, 20, 300, 400);
      controls.push(host);
      views.push(new sf.RenderWindow(windowHandle(host)));
    }

    const [ view1, view2 ] = views;
    const sprite1 = new sf.Sprite(textures[0]);
    const sprite2 = new sf.Sprite(textures[1]);
    const size = textures[0].getSize();
    sprite1.setOrigin(new sf.Vector2f(size.x / 2, size.y / 2));
    sprite1.setPosition(sprite1.getOrigin());
    window.show();
    const clock = new sf.Clock();

    while (running) {
      if (!Application.processMessages() || !running) break;
      const time = clock.getElapsedTime().asSeconds();
      view1.clear();
      view2.clear();

      sprite1.setRotation(sf.degrees(time * 100));
      view1.draw(sprite1);
      sprite2.setPosition(new sf.Vector2f(Math.cos(time) * 100, 0));
      view2.draw(sprite2);
      view1.display();
      view2.display();
      await nextFrame();
    }
  } finally {
    stopRendering();
    window?.destroy();
    // Keep every native wrapper alive until the parent destroys its children.
    controls.length = 0;
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
