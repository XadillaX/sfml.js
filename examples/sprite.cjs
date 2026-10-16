'use strict';

const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const sf = require('..');
const { label } = require('./bitmap-label.cjs');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

const point = (x, y) => new sf.Vector2f(x, y);
const rect = (x, y, w, h) =>
  new sf.IntRect(new sf.Vector2i(x, y), new sf.Vector2i(w, h));

function atlas(body, wing) {
  const image = new sf.Image(new sf.Vector2u(64, 16), sf.Color.Transparent);
  for (let frame = 0; frame < 4; frame++) {
    for (let y = 1; y < 15; y++) {
      for (let x = 1; x < 15; x++) {
        const dx = x - 7;
        let color;
        if (y >= 3 && y <= 11 && Math.abs(dx) <= 2) color = body;
        if (y >= 7 && y <= 11 && Math.abs(dx) <= 6) color = wing;
        if (y >= 4 && y <= 6 && Math.abs(dx) <= 1) color = sf.Color.White;
        if (y >= 12 && y <= 12 + frame % 3 && Math.abs(dx) <= 1) {
          color = new sf.Color(255, 186, 84);
        }
        if (x === 2 && y === 9) color = sf.Color.Red;
        if (color) image.setPixel(new sf.Vector2u(frame * 16 + x, y), color);
      }
    }
  }
  return new sf.Texture(image);
}

async function main() {
  const argument = process.argv.find(arg => arg.startsWith('--frames='));
  const limit = argument ? Number(argument.slice(9)) : Infinity;
  if (argument && (!Number.isSafeInteger(limit) || limit <= 0)) {
    throw new RangeError('--frames must be a positive integer');
  }
  const first = atlas(new sf.Color(73, 202, 167), new sf.Color(31, 123, 107));
  const second = atlas(new sf.Color(112, 174, 244), new sf.Color(51, 91, 165));
  const stamp = new sf.Sprite(first, rect(0, 0, 16, 16));
  stamp.setScale(point(8, 8));
  const copy = new sf.Sprite(stamp);
  copy.setOrigin(point(8, 8));
  copy.setPosition(point(476, 505));
  copy.setColor(new sf.Color(255, 186, 130));
  const bounds = new sf.VertexArray(sf.PrimitiveType.LineStrip, 5);
  for (const vertex of bounds) vertex.color = new sf.Color(255, 186, 84);
  const target = new sf.RenderTexture(new sf.Vector2u(952, 680));
  const open = new Uint32Array(
    native.openRenderTexturePreview(target[graphicsNative]));
  const muted = new sf.Color(158, 174, 193);
  const accent = new sf.Color(100, 225, 164);
  const labels = [
    label('SFML / SPRITE', 24, 24, 3),
    label('ATLAS / FLIP / COLOR / COPY / BOUNDS', 24, 66, 2, muted),
    label('TEXTURE RECT / ANIMATE', 24, 112, 2, accent),
    label('NEGATIVE WIDTH / FLIP', 336, 112, 2, accent),
    label('COLOR / ALPHA', 648, 112, 2, accent),
    label('SET TEXTURE', 24, 374, 2, accent),
    label('COPY / INDEPENDENT', 336, 374, 2, accent),
    label('GLOBAL BOUNDS', 648, 374, 2, accent),
    label('ONE SPRITE / MULTIPLE SNAPSHOTS / ESC CLOSES', 24, 630, 2, muted),
  ];
  let frames = 0;
  const start = performance.now();

  async function render() {
    const frame = Math.floor(frames / 8) % 4;
    target.clear(new sf.Color(17, 22, 30));
    for (const text of labels) target.draw(text);
    stamp.setTexture(first);
    stamp.setTextureRect(rect(frame * 16, 0, 16, 16));
    stamp.setColor(sf.Color.White);
    stamp.setOrigin(point(0, 0));
    stamp.setRotation(sf.degrees(0));
    stamp.setScale(point(8, 8));
    stamp.setPosition(point(100, 175));
    target.draw(stamp);
    stamp.setTextureRect(rect((frame + 1) * 16, 0, -16, 16));
    stamp.setPosition(point(412, 175));
    target.draw(stamp);
    stamp.setTextureRect(rect(frame * 16, 0, 16, 16));
    stamp.setColor(new sf.Color(255, 140, 220, 100 + frames % 156));
    stamp.setPosition(point(724, 175));
    target.draw(stamp);
    stamp.setTexture(second);
    stamp.setColor(sf.Color.White);
    stamp.setPosition(point(100, 439));
    target.draw(stamp);
    copy.setRotation(sf.degrees(-frames * 0.8));
    target.draw(copy);
    stamp.setPosition(point(788, 505));
    stamp.setOrigin(point(8, 8));
    stamp.setRotation(sf.degrees(frames * 0.8 + 25));
    target.draw(stamp);
    const box = stamp.getGlobalBounds();
    for (const [ i, x, y ] of [
      [ 0, 0, 0 ], [ 1, 1, 0 ], [ 2, 1, 1 ], [ 3, 0, 1 ], [ 4, 0, 0 ],
    ]) {
      bounds.getVertex(i).position = point(
        box.position.x + box.size.x * x, box.position.y + box.size.y * y);
    }
    target.draw(bounds);
    target.display();
    frames++;
    if (frames === 1) {
      console.log('Cropped animation / flipped sampling / tint and alpha.');
      console.log('Shared draw snapshots / independent copy / global bounds.');
      if (process.env.SFML_DEMO_SNAPSHOT) {
        const pixels = native.readRenderTexturePixels(target[graphicsNative]);
        const screenshot = new sf.Image(target.getSize(), pixels);
        assert.equal(await screenshot.saveToFile(
          process.env.SFML_DEMO_SNAPSHOT), true);
      }
    }
    if (frames >= limit || !open[0]) {
      console.log(`${frames} frames / ` +
        `${(frames * 1000 / (performance.now() - start)).toFixed(1)} FPS`);
      return;
    }
    setImmediate(() => render().catch(fail));
  }
  await render();
}

function fail(error) {
  console.error(error);
  process.exitCode = 1;
}

main().catch(fail);
