'use strict';

const fs = require('fs');
const path = require('path');

const {
  CircleShape,
  Clock,
  Color,
  ConvexShape,
  Font,
  Image,
  IntRect,
  Keyboard,
  Mouse,
  Music,
  RectangleShape,
  RenderWindow,
  Sound,
  Sprite,
  Text,
  Texture,
  VertexArray,
  VideoMode,
} = require('../lib/sfml');

const mode = VideoMode.getFullscreenModes()[3];
const window = new RenderWindow(mode, 'hello', 5);
const circle = new CircleShape(100, 1);
const convex = new ConvexShape(3);
const rectangle = new RectangleShape({ x: 20, y: 20 });
circle.setOutlineThickness(1.6);
convex.setPoint(0, { x: 20, y: 30 });
convex.setPoint(1, { y: 30, x: 40 });
convex.setPoint(2, { x: 0, y: 0 });

const lines = new VertexArray(VertexArray.PrimitiveType.LineStrip, 4);
lines.setPosition(0, { x: 10, y: 0 });
lines.setPosition(1, { x: 20, y: 0 });
lines.setPosition(2, { x: 30, y: 5 });
lines.setPosition(3, { x: 40, y: 2 });
lines.setColor(0, 0x00ff00ff);
lines.setColor(1, 0x00ff00ff);
lines.setColor(2, 0x00ff00ff);
lines.setColor(3, 0x00ff00ff);

const sound = new Sound(fs.readFileSync(path.join(__dirname, './game.wav')));
const music = new Music();
music.openFromFileSync(path.join(__dirname, './game.wav'));
const font = new Font();
let text;

let sprite;
let sprite2;
const texture = new Texture();
const texture2 = new Texture();

let circleColor = 0;
const red = new Color(255, 0, 0, 255);
const clock = new Clock();

const redImg = new Image();
redImg.create(10, 10, 0xff0099ff);
const redTexture = new Texture();
redTexture.create(10, 10);
redTexture.update(redImg);
const redSprite = new Sprite(redTexture);
redSprite.setPosition(80, 90);

const xxxImg = new Image();
const buf = Buffer.alloc(300 * 300 * 4, 0);
for (let i = 0; i < 300 * 300; i++) {
  buf.writeUInt32BE((i << 8) + 0xff, i * 4);  // eslint-disable-line
}
xxxImg.create(300, 300, buf);
const xxxTexture = new Texture();
xxxTexture.create(300, 300);
xxxTexture.update(xxxImg);
const xxxSprite = new Sprite(xxxTexture);
xxxSprite.setPosition(100, 150);
console.log(xxxImg.duplicatePixels());

const yyyImg = new Image();
yyyImg.create(100, 100, 0);
yyyImg.copy(xxxImg, 0, 0, new IntRect(100, 100, 100, 100), true);
const yyyTexture = new Texture();
yyyTexture.create(100, 100);
yyyTexture.update(yyyImg);
const yyySprite = new Sprite(yyyTexture);
yyySprite.setPosition(400, 450);

const zzzImg = new Image();
zzzImg.loadFromFileSync(path.join(__dirname, 'avatar.gif'));
zzzImg.createMaskFromColor(0xffffffff, 0);
for (let i = 10; i < 50; i++) {
  for (let j = 10; j < 50; j++) {
    zzzImg.setPixel(i, j, 0x000000ff);
  }
}
console.log(zzzImg.getPixel(100, 100));
zzzImg.flipHorizontally();
// zzzImg.setPixel(1000, 2000, 0);
const zzzTexture = new Texture();
zzzTexture.create(zzzImg.getSize().x, zzzImg.getSize().y);
zzzTexture.update(zzzImg);
const zzzSprite = new Sprite(zzzTexture);
zzzSprite.setPosition(700, 550);

const oooSprite = new Sprite(zzzSprite);
oooSprite.setPosition(750, 550);

function frame() {
  if (!window.isOpen()) return;
  const delta = clock.getElapsedTime();
  clock.restart();

  text.setString(`你好 FPS: ${(1000 / delta.asMilliseconds()).toFixed(2)}`);

  let event;
  while ((event = window.pollEvent())) {
    if (event.type === 'Closed') {
      window.close();
    } else if (event.type === 'KeyPressed') {
      if (event.key.codeStr === 'Escape') {
        window.close();
      }
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
  const pos = circle.getPosition();
  pos.x = (pos.x + 1) % 1000;
  pos.y = (pos.y + 1) % 1000;
  circle.setPosition(pos);
  circle.setPointCount(circle.getPointCount() % 100 + 1);

  circle.setRotation(circle.getRotation() % 360 + 1);

  const scale = circle.getScale();
  scale.x = (scale.x + 1) % 5;
  scale.y = (scale.y + 1) % 5;
  circle.setScale(scale);

  const mousePos = {
    desktop: Mouse.getPosition(),
    window: Mouse.getPosition(window),
  };

  if (mousePos.window.x < 0) {
    mousePos.window.x = Math.abs(mousePos.window.x);
  }
  if (mousePos.window.x > mode.width) {
    mousePos.window.x = mode.width;
  }
  if (mousePos.window.y < 0) {
    mousePos.window.y = Math.abs(mousePos.window.y);
  }
  if (mousePos.window.y > mode.height) {
    mousePos.window.y = mode.height;
  }
  Mouse.setPosition(mousePos.window, window);

  window.draw(xxxSprite);
  window.draw(yyySprite);
  window.draw(zzzSprite);
  window.draw(oooSprite);
  window.draw(redSprite);
  window.draw(circle);
  window.draw(rectangle);
  window.draw(convex);
  window.draw(text);
  window.draw(sprite);
  window.draw(sprite2);
  window.draw(lines);
  window.display();

  new Image();

  setImmediate(frame);
}

(async () => {
  await font.loadFromFile(path.join(__dirname, 'font.ttf'));
  text = new Text('你好', font);
  text.setPosition(200, 300);

  if (process.platform !== 'win32') {
    xxxImg.saveToFile('/tmp/xxx.png');
  }

  await texture.loadFromFile(path.join(__dirname, 'avatar.gif'));
  sprite = new Sprite(texture);
  sprite.setPosition(300, 400);

  texture2.loadFromFileSync(path.join(__dirname, 'avatar.gif'));
  sprite2 = new Sprite(texture2);
  sprite2.setPosition(500, 600);

  window.setFramerateLimit(60);
  sound.play();
  // music.play();
  music.setLoop(true);
  console.log(sound);
  console.log(music);
  frame();
})();
