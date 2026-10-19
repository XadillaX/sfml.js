'use strict';

// Port of SFML/examples/raw_input/RawInput.cpp; see ../README.md.
const path = require('node:path');
const sf = require('../../..');

/** Display accelerated mouse positions and the last 24 raw movement events. */
async function main() {
  const window = new sf.RenderWindow(
    new sf.VideoMode(new sf.Vector2u(800, 600)),
    'SFML Raw Mouse Input',
    {
      style: sf.Style.Titlebar + sf.Style.Close,
    }
  );
  window.setVerticalSyncEnabled(true);

  const font = new sf.Font();
  const fontPath = path.join(__dirname, 'resources/tuffy.ttf');
  if (!await font.openFromFile(fontPath)) {
    throw new Error('font');
  }

  const mousePosition = new sf.Text({
    font,
    string: '',
    characterSize: 20,
  });
  mousePosition.setPosition(new sf.Vector2f(400, 300));
  mousePosition.setFillColor(sf.Color.White);

  const mouseRawMovement = new sf.Text({
    font,
    string: '',
    characterSize: 20,
  });
  mouseRawMovement.setFillColor(sf.Color.White);

  const log = [];

  /**
   * Format the same integer vector shown by the C++ example.
   * @param {object} v - Integer vector.
   */
  const vec2ToString = v => `(${v.x}, ${v.y})`;

  /** Poll raw input and redraw the log without blocking Node's event loop. */
  function frame() {
    for (let event; (event = window.pollEvent());) {
      if (event.is('Closed')) {
        window.close();

        return;
      }

      const moved = event.getIf('MouseMoved');
      if (moved) {
        mousePosition.setString(
          'Mouse Position: ' + vec2ToString(moved.position)
        );
      }

      const raw = event.getIf('MouseMovedRaw');
      if (raw) {
        log.push('Mouse Movement: ' + vec2ToString(raw.delta));

        if (log.length > 24) {
          log.shift();
        }
      }
    }

    window.clear();
    window.draw(mousePosition);

    for (let i = 0; i < log.length; ++i) {
      mouseRawMovement.setPosition(new sf.Vector2f(50, i * 20 + 50));
      mouseRawMovement.setString(log[i]);

      window.draw(mouseRawMovement);
    }

    window.display();

    if (window.isOpen()) {
      setImmediate(frame);
    }
  }

  frame();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
