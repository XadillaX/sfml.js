'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  CircleShape, Clock, Color, ConvexShape, Font, Image, IntRect, Keyboard,
  Mouse, Music, RectangleShape, RenderWindow, Sound, SoundBuffer, Sprite, Text,
  Texture, VertexArray, PrimitiveType, VideoMode, Vector2i, Vector2u, Vector2f,
  add, degrees,
} = require('../..');

async function main() {
  const mode = VideoMode.getFullscreenModes()[3];
  const window = new RenderWindow(mode, 'hello', { style: 5 });
  const circle = new CircleShape({ radius: 100, pointCount: 1 });
  const convex = new ConvexShape(3);
  const rectangle = new RectangleShape(new Vector2f(20, 20));
  circle.setOutlineThickness(1.6);
  convex.setPoint(0, new Vector2f(20, 30));
  convex.setPoint(1, new Vector2f(40, 30));
  convex.setPoint(2, new Vector2f(0, 0));

  const lines = new VertexArray(PrimitiveType.LineStrip, 4);
  lines.getVertex(0).position = new Vector2f(10, 0);
  lines.getVertex(1).position = new Vector2f(20, 0);
  lines.getVertex(2).position = new Vector2f(30, 5);
  lines.getVertex(3).position = new Vector2f(40, 2);
  lines.getVertex(0).color = new Color(0x00ff00ff);
  lines.getVertex(1).color = new Color(0x00ff00ff);
  lines.getVertex(2).color = new Color(0x00ff00ff);
  lines.getVertex(3).color = new Color(0x00ff00ff);

  const soundBuffer = new SoundBuffer();
  if (!await soundBuffer.loadFromMemory(
    fs.readFileSync(path.join(__dirname, 'assets/game.wav')))) {
    throw new Error('Failed to load game.wav');
  }
  const sound = new Sound(soundBuffer);
  const music = new Music();
  if (!await music.openFromFile(path.join(__dirname, 'assets/game.wav'))) {
    throw new Error('Failed to open game.wav');
  }
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
  redImg.resize(new Vector2u(10, 10), new Color(0xff0099ff));
  const redTexture = new Texture();
  redTexture.resize(new Vector2u(10, 10));
  redTexture.update(redImg);
  const redSprite = new Sprite(redTexture);
  redSprite.setPosition(new Vector2f(80, 90));

  const xxxImg = new Image();
  const buf = Buffer.alloc(300 * 300 * 4, 0);
  for (let i = 0; i < 300 * 300; i++) {
    buf.writeUInt32BE((i << 8) + 0xff, i * 4); // eslint-disable-line no-bitwise
  }
  xxxImg.resize(new Vector2u(300, 300), buf);
  const xxxTexture = new Texture();
  xxxTexture.resize(new Vector2u(300, 300));
  xxxTexture.update(xxxImg);
  const xxxSprite = new Sprite(xxxTexture);
  xxxSprite.setPosition(new Vector2f(100, 150));
  console.log(xxxImg.pixels.slice());

  const yyyImg = new Image();
  yyyImg.resize(new Vector2u(100, 100), new Color(0));
  yyyImg.copy(xxxImg, new Vector2u(0, 0),
    new IntRect(new Vector2i(100, 100), new Vector2i(100, 100)), true);
  const yyyTexture = new Texture();
  yyyTexture.resize(new Vector2u(100, 100));
  yyyTexture.update(yyyImg);
  const yyySprite = new Sprite(yyyTexture);
  yyySprite.setPosition(new Vector2f(400, 450));

  const zzzImg = new Image();
  if (!await zzzImg.loadFromFile(path.join(__dirname, 'assets/avatar.gif'))) {
    throw new Error('Failed to load avatar.gif');
  }
  zzzImg.createMaskFromColor(new Color(0xffffffff), 0);
  for (let i = 10; i < 50; i++) {
    for (let j = 10; j < 50; j++) {
      zzzImg.setPixel(new Vector2u(i, j), new Color(0x000000ff));
    }
  }
  console.log(zzzImg.getPixel(new Vector2u(100, 100)));
  zzzImg.flipHorizontally();
  // zzzImg.setPixel(new Vector2u(1000, 2000), new Color(0));
  const zzzTexture = new Texture();
  zzzTexture.resize(zzzImg.getSize());
  zzzTexture.update(zzzImg);
  const zzzSprite = new Sprite(zzzTexture);
  zzzSprite.setPosition(new Vector2f(700, 550));
  const oooSprite = new Sprite(zzzSprite);
  oooSprite.setPosition(new Vector2f(750, 550));

  const icnBuff = Buffer.alloc(32 * 32 * 4, 0);
  for (let i = 10; i < 20; i++) {
    for (let j = 0; j < 32; j++) {
      icnBuff.writeUInt8(Math.random() * 255, j * 32 * 4 + i * 4 + 0);
      icnBuff.writeUInt8(Math.random() * 255, j * 32 * 4 + i * 4 + 1);
      icnBuff.writeUInt8(Math.random() * 255, j * 32 * 4 + i * 4 + 2);
      icnBuff.writeUInt8(255, j * 32 * 4 + i * 4 + 3);
    }
  }
  window.setIcon(new Vector2u(32, 32), icnBuff);

  function frame() {
    if (!window.isOpen()) return;
    const delta = clock.getElapsedTime();
    clock.restart();
    text.setString(`你好 FPS: ${(1000 / delta.asMilliseconds()).toFixed(2)}`);

    let event;
    while ((event = window.pollEvent())) {
      if (event.is('Closed')) {
        window.close();
      } else {
        const key = event.getIf('KeyPressed');
        if (!key) continue;
        switch (key.code) {
          case Keyboard.Key.Escape:
            window.close();
            break;
          case Keyboard.Key.Left:
            window.setPosition(add(window.getPosition(), new Vector2i(1, 1)));
            break;
          case Keyboard.Key.RAlt:
            window.setTitle('No alt key...');
            break;
          case Keyboard.Key.LAlt:
            console.log(window.getSettings());
            break;
          default:
        }
      }
    }
    if (Keyboard.isKeyPressed(Keyboard.Key.LControl)) {
      window.create(new VideoMode(new Vector2u(800, 600), 32), 'New title');
      window.setVerticalSyncEnabled(true);
    }
    if (Keyboard.isKeyPressed(Keyboard.Key.Escape)) window.close();
    if (Keyboard.isKeyPressed(Keyboard.Key.S)) {
      Keyboard.setVirtualKeyboardVisible(true);
    } else {
      Keyboard.setVirtualKeyboardVisible(false);
    }

    window.clear(red);
    circleColor = (circleColor + 1) % 256;
    let color = (circleColor << 16) + 0xff; // eslint-disable-line no-bitwise
    circle.setFillColor(new Color(color));
    color = (circleColor << 8) + 0xff; // eslint-disable-line no-bitwise
    circle.setOutlineColor(new Color(color));
    const pos = circle.getPosition();
    pos.x = (pos.x + 1) % 1000;
    pos.y = (pos.y + 1) % 1000;
    circle.setPosition(pos);
    circle.setPointCount(circle.getPointCount() % 100 + 1);
    circle.setRotation(degrees(circle.getRotation().asDegrees() % 360 + 1));
    const scale = circle.getScale();
    scale.x = (scale.x + 1) % 5;
    scale.y = (scale.y + 1) % 5;
    circle.setScale(scale);

    const mousePos = {
      desktop: Mouse.getPosition(),
      window: Mouse.getPosition(window),
    };
    if (mousePos.window.x < 0) mousePos.window.x = Math.abs(mousePos.window.x);
    if (mousePos.window.x > mode.size.x) mousePos.window.x = mode.size.x;
    if (mousePos.window.y < 0) mousePos.window.y = Math.abs(mousePos.window.y);
    if (mousePos.window.y > mode.size.y) mousePos.window.y = mode.size.y;
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

  if (!await font.openFromFile(path.join(__dirname, 'assets/font.ttf'))) {
    throw new Error('Failed to open font.ttf');
  }
  text = new Text({ string: '你好', font });
  text.setPosition(new Vector2f(200, 300));
  if (process.platform !== 'win32') xxxImg.saveToFile('/tmp/xxx.png');
  if (!await texture.loadFromFile(path.join(__dirname, 'assets/avatar.gif'))) {
    throw new Error('Failed to load avatar.gif');
  }
  sprite = new Sprite(texture);
  sprite.setPosition(new Vector2f(300, 400));
  if (!await texture2.loadFromFile(path.join(__dirname, 'assets/avatar.gif'))) {
    throw new Error('Failed to load avatar.gif');
  }
  sprite2 = new Sprite(texture2);
  sprite2.setPosition(new Vector2f(500, 600));
  window.setFramerateLimit(60);
  sound.play();
  // music.play();
  music.setLooping(true);
  console.log(sound);
  console.log(music);
  frame();
}

main().catch(error => { console.error(error); process.exitCode = 1; });
