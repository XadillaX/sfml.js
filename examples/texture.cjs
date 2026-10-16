'use strict';

const assert = require('node:assert/strict');
const { resolve } = require('node:path');
const { performance } = require('node:perf_hooks');
const {
  Texture, Image, Sprite, VertexArray, PrimitiveType, RenderStates,
  RenderTexture, Vector2u, Vector2i, Vector2f, IntRect, Color,
} = require('..');
const { label } = require('./bitmap-label.cjs');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

function placed(texture, x, y, width = 280, height = 190) {
  const sprite = new Sprite(texture);
  const size = texture.getSize();
  sprite.setPosition(new Vector2f(x, y));
  sprite.setScale(new Vector2f(width / size.x, height / size.y));
  return sprite;
}

function tiled(texture, x, y) {
  const vertices = new VertexArray(PrimitiveType.TriangleStrip, 4);
  const size = texture.getSize();
  for (const [ i, dx, dy ] of [
    [ 0, 0, 0 ], [ 1, 1, 0 ], [ 2, 0, 1 ], [ 3, 1, 1 ],
  ]) {
    const vertex = vertices.getVertex(i);
    vertex.position = new Vector2f(x + dx * 280, y + dy * 190);
    vertex.texCoords = new Vector2f(dx * size.x * 5, dy * size.y * 4);
  }
  return vertices;
}

async function main() {
  const frameArgument = process.argv.find(arg => arg.startsWith('--frames='));
  const limit = frameArgument ? Number(frameArgument.slice(9)) : Infinity;
  if (frameArgument && (!Number.isSafeInteger(limit) || limit <= 0)) {
    throw new RangeError('--frames must be a positive integer');
  }
  const file = new Texture();
  assert.equal(await file.loadFromFile(
    resolve(__dirname, 'ported/assets/avatar.gif')), true);

  const pattern = new Image(new Vector2u(16, 16));
  const palette = [
    [ 24, 44, 72, 255 ], [ 73, 202, 167, 255 ], [ 255, 186, 84, 255 ],
  ];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const color = palette[(Math.floor(x / 3) + Math.floor(y / 3)) % 3];
      pattern.pixels.set(color, (y * 16 + x) * 4);
    }
  }
  const nearest = new Texture(pattern);
  const encoded = await nearest.copyToImage().saveToMemory('png');
  const smooth = new Texture(nearest);
  const repeated = new Texture(pattern);
  const crop = new Texture();
  smooth.setSmooth(true);
  const mipmap = smooth.generateMipmap();
  repeated.setRepeated(true);
  assert.equal(await crop.loadFromMemory(encoded, false,
    new IntRect(new Vector2i(3, 3), new Vector2i(8, 8))), true);
  const dynamic = new Texture();
  assert.equal(dynamic.resize(new Vector2u(64, 48)), true);
  const background = new Image(new Vector2u(64, 48), new Color(24, 44, 72));
  const patch = new Texture(new Image(
    new Vector2u(8, 8), new Color(255, 186, 84)));
  const alternate = new Texture(new Image(
    new Vector2u(8, 8), new Color(73, 202, 167)));
  dynamic.update(background);
  const patchSize = patch.getSize();
  const previous = new Vector2u();
  const restore = new Image(patchSize, new Color(24, 44, 72)).pixels;

  const target = new RenderTexture(new Vector2u(952, 680));
  const open = new Uint32Array(
    native.openRenderTexturePreview(target[graphicsNative]));
  const muted = new Color(158, 174, 193);
  const accent = new Color(100, 225, 164);
  const sprites = [
    label('SFML / TEXTURE', 24, 24, 3),
    label('ASYNC LOAD / CROPPING / REGION UPLOAD / SAMPLING', 24, 66, 2, muted),
    label('FILE / GIF', 24, 112, 2, accent),
    label('MEMORY / PNG CROP', 336, 112, 2, accent),
    label('RESIZE / SWAP / UPDATE', 648, 112, 2, accent),
    placed(file, 24, 144),
    placed(crop, 336, 144),
    placed(dynamic, 648, 144),
    label('IMAGE / NEAREST', 24, 374, 2, accent),
    label('COPY / SMOOTH', 336, 374, 2, accent),
    label('REPEATED / VERTICES', 648, 374, 2, accent),
    placed(nearest, 24, 406),
    placed(smooth, 336, 406),
    label('8 X 8 REGION CHANGES EACH FRAME / ESC CLOSES', 24, 630, 2, muted),
  ];
  const tiles = tiled(repeated, 648, 406);
  const tileStates = new RenderStates(repeated);
  const clear = new Color(17, 22, 30);
  let frames = 0;
  const started = performance.now();
  console.log('Loaded GIF from file and cropped PNG from memory.');
  console.log(`GPU limit: ${Texture.getMaximumSize()} / mipmap: ${mipmap}`);
  console.log('Image and copy constructors / readback PNG / resize / swap.');
  console.log('Nearest / smooth / repeated sampling; animated 8 x 8 uploads.');

  async function render() {
    if (frames > 0 && frames % 60 === 0) patch.swap(alternate);
    dynamic.update(restore, patchSize, previous);
    previous.x = frames % 57;
    previous.y = Math.round(20 + 18 * Math.sin(frames / 18));
    dynamic.update(patch, previous);
    target.clear(clear);
    for (const sprite of sprites) target.draw(sprite);
    target.draw(tiles, tileStates);
    target.display();
    frames++;
    if (frames === 1 && process.env.SFML_DEMO_SNAPSHOT) {
      const pixels = native.readRenderTexturePixels(target[graphicsNative]);
      const screenshot = new Image(target.getSize(), pixels);
      assert.equal(await screenshot.saveToFile(
        process.env.SFML_DEMO_SNAPSHOT), true);
      console.log(`Screenshot: ${process.env.SFML_DEMO_SNAPSHOT}`);
    }
    if (frames >= limit || !open[0]) {
      console.log(`${frames} frames / ` +
        `${(frames * 1000 / (performance.now() - started)).toFixed(1)} FPS`);
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
