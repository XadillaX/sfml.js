'use strict';

const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const sf = require('..');
const { label } = require('./bitmap-label.cjs');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

const point = (x, y) => new sf.Vector2f(x, y);
const size = (x, y) => new sf.Vector2u(x, y);
const warm = new sf.Color(255, 184, 112);
const cool = new sf.Color(103, 222, 198);
const muted = new sf.Color(156, 175, 194);

function starTexture() {
  const image = new sf.Image(size(9, 9), sf.Color.Transparent);
  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      if (Math.abs(x - 4) + Math.abs(y - 4) <= 4) {
        image.setPixel(size(x, y),
          Math.abs(x - 4) + Math.abs(y - 4) < 2
            ? sf.Color.White : new sf.Color(170, 210, 235));
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
  const source = new sf.RenderTexture(size(88, 72));
  const view = source.getTexture();
  const stamp = new sf.Sprite(starTexture());
  stamp.setOrigin(point(4.5, 4.5));
  const screen = new sf.Sprite(view);
  screen.setScale(point(3, 3));
  const mesh = new sf.VertexArray(sf.PrimitiveType.TriangleStrip, 4);
  for (const [ i, x, y, u, v ] of [
    [ 0, 664, 182, 0, 0 ], [ 1, 930, 158, 88, 0 ],
    [ 2, 646, 396, 0, 72 ], [ 3, 908, 374, 88, 72 ],
  ]) {
    const vertex = mesh.getVertex(i);
    vertex.position = point(x, y);
    vertex.texCoords = point(u, v);
    vertex.color = i % 2 ? new sf.Color(150, 190, 255) : sf.Color.White;
  }
  const meshStates = new sf.RenderStates(view);
  const output = new sf.RenderTexture(size(960, 560));
  const open = new Uint32Array(
    native.openRenderTexturePreview(output[graphicsNative]));
  const labels = [
    label('SFML / OFFSCREEN', 24, 24, 3),
    label('ONE GPU TEXTURE / TWO DISPLAYED STATES', 24, 68, 2, muted),
    label('01 / RECORDED FIRST', 24, 120, 2, warm),
    label('02 / AFTER DISPLAY', 336, 120, 2, cool),
    label('03 / VERTEX ARRAY', 648, 120, 2, cool),
    label('OLD PIXELS PRESERVED', 24, 418, 2, muted),
    label('SAME TEXTURE VIEW', 336, 418, 2, muted),
    label('WARP / VERTEX TINT', 648, 418, 2, muted),
    label('DISPLAY SOURCE / DRAW VIEW / DISPLAY OUTPUT', 24, 484, 2),
    label('LIVE ANIMATION / ESC CLOSES', 24, 522, 2, muted),
  ];
  let frames = 0;
  const start = performance.now();

  function renderSource(alternate) {
    source.clear(alternate
      ? new sf.Color(15, 57, 58) : new sf.Color(61, 36, 34));
    stamp.setColor(alternate ? cool : warm);
    for (let i = 0; i < 12; i++) {
      const angle = frames * 0.025 + i * Math.PI / 6;
      stamp.setPosition(point(44 + Math.cos(angle) * 29,
        36 + Math.sin(angle) * 23));
      stamp.setRotation(sf.degrees(frames + i * 30));
      const scale = 0.6 + (Math.sin(angle * 2) + 1) * 0.35;
      stamp.setScale(point(scale, scale));
      source.draw(stamp);
    }
    stamp.setScale(point(2.4, 2.4));
    stamp.setPosition(point(44, 36));
    stamp.setRotation(sf.degrees(-frames * 1.4));
    source.draw(stamp);
    source.display();
  }

  async function render() {
    renderSource(false);
    output.clear(new sf.Color(16, 22, 29));
    for (const text of labels) output.draw(text);
    screen.setPosition(point(24, 166));
    output.draw(screen);
    // Source writes submit this consumer first, preserving the warm image.
    renderSource(true);
    screen.setPosition(point(336, 166));
    output.draw(screen);
    output.draw(mesh, meshStates);
    output.display();
    frames++;
    if (frames === 1) {
      assert.equal(source.getTexture(), view);
      console.log('Offscreen texture / draw snapshots / Sprite + vertices.');
      if (process.env.SFML_DEMO_SNAPSHOT) {
        const screenshot = output.getTexture().copyToImage();
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
