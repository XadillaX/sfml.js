'use strict';

const {
  CircleShape,
  Clock,
  Color,
  ConvexShape,
  Keyboard,
  RectangleShape,
  RenderWindow,
  VideoMode,
} = require('../lib/sfml');

console.log = () => {};

console.log(RenderWindow.Style);

const mode = VideoMode.getFullscreenModes()[3];
const window = new RenderWindow(mode, 'hello');
const circle = new CircleShape(100, 1);
const convex = new ConvexShape(3);
const rectangle = new RectangleShape({ x: 20, y: 20 });
circle.setOutlineThickness(1.6);
convex.setPoint(0, { x: 20, y: 30 });
convex.setPoint(1, { y: 30, x: 40 });
convex.setPoint(2, { x: 0, y: 0 });

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
      // if (event.key.codeStr === 'Escape') {
      //   window.close();
      // }
    }
  }

  if (Keyboard.isKeyPressed('Escape')) {
    window.close();
  }

  if (Keyboard.isKeyPressed('S')) {
    Keyboard.setVirtualKeyboardVisible(true);
  } else {
    Keyboard.setVirtualKeyboardVisible(false);
  }

  window.clear(red);
  circleColor = (circleColor + 1) % 256;
  let color = (circleColor << 16) + 0xff;  // eslint-disable-line
  circle.setFillColor(color);
  color = (circleColor << 8) + 0xff;  // eslint-disable-line
  circle.setOutlineColor(color);
  console.log(circle.getOutlineThickness(), circle.getFillColor(), circle.getOutlineColor());
  console.log(circle.getPointCount(), circle.getLocalBounds(), circle.getGlobalBounds());
  console.log(`point ${circle.getPointCount() - 1}:`, circle.getPoint(circle.getPointCount() - 1));
  const pos = circle.getPosition();
  pos.x = (pos.x + 1) % 1000;
  pos.y = (pos.y + 1) % 1000;
  console.log('position:', pos);
  circle.setPosition(pos);
  circle.setPointCount(circle.getPointCount() % 100 + 1);

  circle.setRotation(circle.getRotation() % 360 + 1);
  console.log('rotation:', circle.getRotation());

  const scale = circle.getScale();
  scale.x = (scale.x + 1) % 5;
  scale.y = (scale.y + 1) % 5;
  console.log('scale:', scale);
  circle.setScale(scale);

  window.draw(circle);
  window.draw(rectangle);
  window.draw(convex);
  window.display();

  setTimeout(frame, 1000 / 120);
}

frame();
