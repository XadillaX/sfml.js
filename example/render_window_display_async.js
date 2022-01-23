'use strict';
const { RenderWindow, VideoMode } = require('../lib/sfml');

const videoMode = new VideoMode(640, 480, 32);
const window = new RenderWindow(videoMode, 'test display');
window.setFramerateLimit(10);

const updateWindowSync = () => {
  return new Promise(resolve => {
    setImmediate(() => {
      window.clear(0);
      window.display();
      resolve();
    });
  });
};

const test = async () => {
  const requestId = setInterval(() => console.log('req'), 50);
  console.log(
    '=== Not async (should display 20 req does not display 20) ==='
  );
  for (let i = 0; i < 10; i++) {
    await updateWindowSync();
  }
  console.log(
    '=== Async (display the right amount of req: 20 as expected) ==='
  );
  for (let i = 0; i < 10; i++) {
    window.clear();
    await window.displayAsync();
  }

  window.close();
  clearInterval(requestId);
};

test();
