'use strict';

// Port of SFML/examples/stencil/Stencil.cpp; see ../README.md.
const sf = require('../../..');

/** Draw the original three cyclically overlapping rectangles. */
function main() {
  const window = new sf.RenderWindow(
    new sf.VideoMode(new sf.Vector2u(600, 600)),
    'SFML Stencil',
    {
      style: sf.Style.Titlebar + sf.Style.Close,
      settings: { depthBits: 0, stencilBits: 8 },
    }
  );
  window.setVerticalSyncEnabled(true);


  const red = new sf.RectangleShape(new sf.Vector2f(500, 50));
  red.setFillColor(sf.Color.Red);
  red.setPosition(new sf.Vector2f(270, 70));
  red.setRotation(sf.degrees(60));

  const green = new sf.RectangleShape(new sf.Vector2f(500, 50));
  green.setFillColor(sf.Color.Green);
  green.setPosition(new sf.Vector2f(370, 100));
  green.setRotation(sf.degrees(120));

  const blue = new sf.RectangleShape(new sf.Vector2f(500, 50));
  blue.setFillColor(sf.Color.Blue);
  blue.setPosition(new sf.Vector2f(550, 470));
  blue.setRotation(sf.degrees(180));

  const modes = [
    new sf.StencilMode({
      stencilComparison: sf.StencilComparison.Always,
      stencilUpdateOperation: sf.StencilUpdateOperation.Replace,
      stencilReference: 3,
      stencilMask: 0xffffffff,
      stencilOnly: false,
    }),
    new sf.StencilMode({
      stencilComparison: sf.StencilComparison.Always,
      stencilUpdateOperation: sf.StencilUpdateOperation.Replace,
      stencilReference: 1,
      stencilMask: 0xffffffff,
      stencilOnly: false,
    }),
    new sf.StencilMode({
      stencilComparison: sf.StencilComparison.Greater,
      stencilUpdateOperation: sf.StencilUpdateOperation.Replace,
      stencilReference: 2,
      stencilMask: 0xffffffff,
      stencilOnly: false,
    }),
  ];

  /** Replace stencil values 3/1, then draw blue where 2 is greater. */
  function frame() {
    for (let event; (event = window.pollEvent());) {
      if (event.is('Closed')) {
        window.close();

        return;
      }
    }

    window.clear(sf.Color.Black, 0);
    window.draw(red, modes[0]);
    window.draw(green, modes[1]);
    window.draw(blue, modes[2]);

    window.display();
    if (window.isOpen()) {
      setImmediate(frame);
    }
  }

  frame();
}

main();
