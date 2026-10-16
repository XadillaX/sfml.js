'use strict';

const { performance } = require('node:perf_hooks');
const { writeFileSync } = require('node:fs');
const {
  Color, Texture, Sprite, RenderTexture, Vector2f, Vector2u,
} = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

const width = 900;
const height = 600;
const count = 256;
const diameter = 14;
const uncapped = process.argv.includes('--uncapped');
const background = new Color(13, 18, 27);

function makeTexture([ red, green, blue ]) {
  const texture = new Texture(new Vector2u(diameter, diameter));
  const pixels = new Uint8Array(diameter * diameter * 4);
  for (let y = 0; y < diameter; y++) {
    for (let x = 0; x < diameter; x++) {
      const distance = Math.hypot(x + 0.5 - diameter / 2,
        y + 0.5 - diameter / 2);
      const offset = (y * diameter + x) * 4;
      pixels[offset] = red;
      pixels[offset + 1] = green;
      pixels[offset + 2] = blue;
      pixels[offset + 3] = Math.max(0,
        Math.min(1, diameter / 2 - distance)) * 255;
    }
  }
  texture.update(pixels);
  return texture;
}

const textures = [
  makeTexture([ 61, 232, 151 ]),
  makeTexture([ 87, 178, 255 ]),
  makeTexture([ 255, 192, 96 ]),
];
const sprites = Array.from({ length: count },
  (_, index) => new Sprite(textures[index % textures.length]));
const target = new RenderTexture(new Vector2u(width, height));
const position = new Vector2f();
const open = new Uint32Array(
  native.openRenderTexturePreview(target[graphicsNative])
);
const start = performance.now();
let frames = 0;
let reportTime = start;
let reportFrames = 0;
let timer;

function saveFrame(path) {
  const rgba = native.readRenderTexturePixels(target[graphicsNative]);
  const rgb = Buffer.alloc(width * height * 3);
  for (let index = 0; index < width * height; index++) {
    rgb[index * 3] = rgba[index * 4];
    rgb[index * 3 + 1] = rgba[index * 4 + 1];
    rgb[index * 3 + 2] = rgba[index * 4 + 2];
  }
  writeFileSync(path, Buffer.concat([
    Buffer.from(`P6\n${width} ${height}\n255\n`), rgb,
  ]));
}

function render() {
  const time = (performance.now() - start) / 1000;
  target.clear(background);
  for (let index = 0; index < count; index++) {
    const phase = index * 2.3999632297 + time * 0.42;
    const radius = 36 + Math.sqrt(index / count) * 225;
    const wave = 1 + Math.sin(time * 1.2 + index * 0.05) * 0.12;
    position.x = width / 2 + Math.cos(phase) * radius * wave * 1.35;
    position.y = height / 2 + Math.sin(phase) * radius * wave * 0.95;
    sprites[index].setPosition(position);
    target.draw(sprites[index]);
  }
  target.display();
  frames++;
  if (frames === 1) {
    console.log('Preview open: 256 sprites; 257 commands per display.');
    console.log(uncapped ? 'Frame pacing: uncapped.' : 'Frame pacing: 16 ms.');
    if (process.env.SFML_DEMO_SNAPSHOT) {
      saveFrame(process.env.SFML_DEMO_SNAPSHOT);
    }
  }
  if (!open[0]) {
    if (timer) clearInterval(timer);
    console.log(`Preview closed after ${frames} frames.`);
    return;
  }
  const now = performance.now();
  const elapsed = now - reportTime;
  if (elapsed >= 1000) {
    const fps = (frames - reportFrames) * 1000 / elapsed;
    console.log(`${fps.toFixed(1)} FPS; rendered ${frames} frames.`);
    reportTime = now;
    reportFrames = frames;
  }
  if (uncapped) setImmediate(render);
}

if (uncapped) setImmediate(render);
else timer = setInterval(render, 16);
