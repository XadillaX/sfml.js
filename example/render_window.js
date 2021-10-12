'use strict';

const { CircleShape, Clock, Color, RenderWindow, VideoMode } = require('../lib/sfml');

console.log(RenderWindow.Style);

const mode = VideoMode.getFullscreenModes()[3];
const window = new RenderWindow(mode, 'hello');
const circle = new CircleShape(100, 1000);

let circleColor = 0;
const red = new Color(255, 0, 0, 255);
const clock = new Clock();
function frame() {
  if (!window.isOpen()) return;
  const delta = clock.getElapsedTime();
  clock.restart();
  console.log(delta, delta.asSeconds(), delta.asMilliseconds(), delta.asMicroseconds());

  let event;
  while ((event = window.pollEvent())) {
    console.log(event);
    if (event.type === 'Closed') {
      window.close();
    } else if (event.type === 'KeyPressed') {
      if (event.key.codeStr === 'Escape') {
        window.close();
      }
    }
  }

  window.clear(red);
  circleColor = (circleColor + 1) % 256;
  const color = (circleColor << 16) + 0xff;  // eslint-disable-line
  circle.setFillColor(color);
  console.log(circle.getFillColor());
  window.draw(circle);
  window.display();

  setTimeout(frame, 1000 / 60);
}

frame();
