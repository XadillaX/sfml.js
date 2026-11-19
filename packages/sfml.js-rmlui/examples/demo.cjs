'use strict';

const path = require('node:path');
const sfml = require('sfml.js');
const rmlui = require('../dist');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(1024, 768)),
  'sfml.js-rmlui',
  { settings: { stencilBits: 8 } });
window.setFramerateLimit(60);

console.log(`RmlUi ${rmlui.version}`);
if (!rmlui.initialise(window)) {
  throw new Error('RmlUi initialisation failed');
}

// Use the same portable font assets as the upstream examples.
for (const font of [ 'LatoLatin-Regular', 'LatoLatin-Bold' ]) {
  if (!rmlui.loadFontFace(path.join(
    __dirname, '../third_party/rmlui/Samples/assets', `${font}.ttf`))) {
    throw new Error(`Failed to load ${font}`);
  }
}

const size = window.getSize();
const context = rmlui.createContext('main', size.x, size.y);
const document = context.loadDocument(
  path.join(__dirname, 'assets/tutorial.rml'));
document.show();

let clicks = 0;
const counter = document.getElementById('counter');
const button = document.getElementById('increment');
function increment() {
  clicks += 1;
  counter.innerRML = `Clicks: ${clicks}`;
}
button.addEventListener('click', increment);

let running = true;
try {
  while (running && window.isOpen()) {
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      context.processEvent(event);
      if (event.is('Closed')) {
        running = false;
      } else if (event.is('Resized')) {
        const { size } = event.data;
        context.setDimensions(size.x, size.y);
      }
    }
    if (!running) {
      break;
    }

    context.update();
    window.clear(sfml.Color.Black);
    // Flush recorded sfml.js draw calls before RmlUi takes over GL state.
    window.flush();
    context.render();
    window.display();
  }
} finally {
  button.removeEventListener('click', increment);
  document.unload();
  context.remove();
  rmlui.shutdown();
  window.close();
}
