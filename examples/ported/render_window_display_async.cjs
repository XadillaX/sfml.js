'use strict';

const { RenderWindow, VideoMode, Vector2u, Color } = require('../..');

async function main() {
  if (typeof RenderWindow.prototype.displayAsync !== 'function') {
    console.error('UNSUPPORTED: 新版未提供 displayAsync，无法运行原异步对照。');
    process.exitCode = 2;
    return;
  }
  const videoMode = new VideoMode(new Vector2u(640, 480), 32);
  const window = new RenderWindow(videoMode, 'test display');
  window.setFramerateLimit(10);
  const updateWindowSync = () => new Promise(resolve => {
    setImmediate(() => {
      window.clear(new Color(0));
      window.display();
      resolve();
    });
  });
  const requestId = setInterval(() => console.log('req'), 50);
  try {
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
    clearInterval(requestId);
    window.close();
    await window.displayAsync()
      .catch(e => console.log(`Did rightfully caught: ${e.message}`));
  } finally {
    clearInterval(requestId);
    window.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
