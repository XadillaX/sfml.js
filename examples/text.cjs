'use strict';

const { join } = require('node:path');
const { setTimeout } = require('node:timers/promises');
const sf = require('..');

async function main() {
  const font = new sf.Font();
  const path = process.argv.find(arg => arg.startsWith('--font='));
  if (!await font.openFromFile(path ? path.slice(7)
    : join(__dirname, '../test/fixtures/fonts/DejaVuSansMono.ttf'))) {
    throw new Error('Could not open font');
  }
  const content = process.argv.find(arg => arg.startsWith('--text='));
  const string = content ? content.slice(7)
    : 'sfml.js\nNative text, shared vertices';
  const titleLength = string.split('\n')[0].length;
  const text = new sf.Text({
    font, string, characterSize: 26,
  });
  text.setPosition(new sf.Vector2f(32, 24));
  text.setLineSpacing(1.4);
  text.setOutlineThickness(1);
  text.setOutlineColor(new sf.Color(15, 30, 50));
  text.setGlyphPreProcessor((glyph, appearance) => {
    appearance.fillColor = glyph.cluster < titleLength
      ? new sf.Color(85, 215, 240) : new sf.Color(235, 240, 245);
  });
  const vertices = text.getVertexData();
  const positions = Array.from(vertices, vertex => vertex.position.y);
  const clock = new sf.Clock();
  const limit = process.argv.find(arg => arg.startsWith('--frames='));
  const frames = limit ? Number(limit.slice(9)) : Infinity;
  const window = new sf.RenderWindow(
    new sf.Vector2u(560, 200), 'sfml.js Text');
  try {
    for (let frame = 0; frame < frames && window.isOpen(); frame++) {
      let event;
      while ((event = window.pollEvent())) {
        if (event.is('Closed') ||
          event.getIf('KeyPressed')?.code === sf.Keyboard.Key.Escape) {
          window.close();
        }
      }
      if (!window.isOpen()) break;
      const time = clock.getElapsedTime().asSeconds();
      for (let i = 0; i < vertices.getVertexCount(); i++) {
        const vertex = vertices.getVertex(i);
        vertex.position.y = positions[i] +
          Math.sin(time * 3 + vertex.position.x * 0.025) * 4;
      }
      window.clear(new sf.Color(20, 25, 35));
      window.draw(text);
      window.display();
      if (!process.argv.includes('--uncapped')) await setTimeout(16);
    }
  } finally { window.close(); }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
