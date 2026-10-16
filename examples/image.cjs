'use strict';

const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { performance } = require('node:perf_hooks');
const {
  Image, Texture, Sprite, RenderTexture, Vector2u, Vector2f, Color,
} = require('..');
const { label } = require('./bitmap-label.cjs');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

function spriteFromImage(image, x, y, scale = 1) {
  const texture = new Texture(image.getSize());
  texture.update(image.pixels);
  const sprite = new Sprite(texture);
  sprite.setPosition(new Vector2f(x, y));
  sprite.setScale(new Vector2f(scale, scale));
  return sprite;
}

async function load(path) {
  const image = new Image();
  if (!await image.loadFromFile(path)) {
    throw new Error(`Could not load image: ${path}`);
  }
  return image;
}

async function main() {
  const pathArgument = process.argv.find(arg => arg.startsWith('--file='));
  const path = pathArgument ? resolve(pathArgument.slice(7)) :
    resolve(__dirname, 'ported/assets/avatar.gif');
  const [ original, logo ] = await Promise.all([
    load(path), load(resolve(__dirname, '../assets/sfml.js.png')),
  ]);
  const size = original.getSize();
  const mirrored = new Image(original);
  mirrored.flipHorizontally();
  const grayscale = new Image(original);
  for (let i = 0; i < grayscale.pixels.length; i += 4) {
    const pixels = grayscale.pixels;
    const value = Math.round(
      pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722);
    pixels[i] = value;
    pixels[i + 1] = value;
    pixels[i + 2] = value;
  }
  const png = await grayscale.saveToMemory('png');
  assert.ok(png, 'PNG encoding must succeed');
  const decoded = new Image();
  assert.equal(await decoded.loadFromMemory(png), true);
  assert.deepEqual(decoded.pixels, grayscale.pixels);

  const target = new RenderTexture(new Vector2u(1040, 620));
  const open = new Uint32Array(
    native.openRenderTexturePreview(target[graphicsNative]));
  const muted = new Color(158, 174, 193);
  const green = new Color(100, 225, 164);
  const blue = new Color(104, 185, 255);
  const amber = new Color(255, 199, 107);
  const sprites = [
    label('SFML / IMAGE', 24, 28, 3),
    label('REAL FILE / ASYNC LOAD / SHARED PIXELS', 24, 70, 2, muted),
    spriteFromImage(logo, 752, 24, 0.75),
  ];
  const titles = [ 'ORIGINAL', 'HORIZONTAL FLIP', 'GRAYSCALE' ];
  const descriptions = [
    'ASYNC FILE LOAD', 'NATIVE FLIP', 'DIRECT PIXEL EDIT',
  ];
  const colors = [ green, blue, amber ];
  const scale = Math.min(300 / size.x, 300 / size.y);
  const background = new Image(new Vector2u(300, 300));
  for (let y = 0; y < 300; y++) {
    for (let x = 0; x < 300; x++) {
      const alternate = (Math.floor(x / 15) + Math.floor(y / 15)) % 2;
      const shade = alternate ? 44 : 34;
      background.pixels.set([ shade, shade + 4, shade + 10, 255 ],
        (y * 300 + x) * 4);
    }
  }
  for (const [ index, image ] of [ original, mirrored, decoded ].entries()) {
    const x = 24 + index * 346;
    sprites.push(
      label(titles[index], x, 128, 2, colors[index]),
      spriteFromImage(background, x, 162),
      spriteFromImage(image,
        x + (300 - size.x * scale) / 2,
        162 + (300 - size.y * scale) / 2, scale),
      label(descriptions[index], x, 484, 2, muted)
    );
  }
  sprites.push(
    label('PNG ROUNDTRIP / PIXELS MATCH', 24, 538, 2, green),
    label(`${size.x} X ${size.y} / GIF USES FIRST FRAME / ESC CLOSES`,
      24, 576, 2, muted)
  );
  console.log(`Loaded: ${path} (${size.x} x ${size.y})`);
  console.log('Left: original. Middle: horizontal flip. Right: grayscale.');
  console.log('PASS: PNG roundtrip preserves all pixels ' +
    `(${png.length} bytes).`);

  const frameArgument = process.argv.find(arg => arg.startsWith('--frames='));
  const limit = frameArgument ? Number(frameArgument.slice(9)) : Infinity;
  if (frameArgument && (!Number.isSafeInteger(limit) || limit <= 0)) {
    throw new RangeError('--frames must be a positive integer');
  }
  let frames = 0;
  let reportFrames = 0;
  let lastReport = performance.now();
  const clearColor = new Color(17, 22, 30);
  console.log('Frame pacing: uncapped.');
  async function render() {
    target.clear(clearColor);
    for (const sprite of sprites) target.draw(sprite);
    target.display();
    frames++;
    if (frames === 1 && process.env.SFML_DEMO_SNAPSHOT) {
      const pixels = native.readRenderTexturePixels(target[graphicsNative]);
      const screenshot = new Image(target.getSize(), pixels);
      assert.equal(await screenshot.saveToFile(
        process.env.SFML_DEMO_SNAPSHOT), true);
      console.log(`Screenshot: ${process.env.SFML_DEMO_SNAPSHOT}`);
    }
    const now = performance.now();
    if (now - lastReport >= 1000) {
      const fps = (frames - reportFrames) * 1000 / (now - lastReport);
      console.log(`${frames} frames / ${fps.toFixed(1)} FPS / uncapped`);
      reportFrames = frames;
      lastReport = now;
    }
    if (frames >= limit || !open[0]) return;
    setImmediate(() => render().catch(fail));
  }
  await render();
}

function fail(error) {
  console.error(error);
  process.exitCode = 1;
}

main().catch(fail);
