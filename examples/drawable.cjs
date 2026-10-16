'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { writeFileSync } = require('node:fs');
const sf = require('..');
const { label } = require('./bitmap-label.cjs');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

// Drawable and Transformable are independent capabilities, as in SFML.
class Group extends sf.Drawable {
  constructor(...children) {
    super();
    this.pose = new sf.Transformable();
    this.children = children;
  }

  draw(target, states) {
    states.transform.combine(this.pose.getTransform());
    for (const child of this.children) target.draw(child, states);
  }
}

const point = (x, y) => new sf.Vector2f(x, y);
function texture(color) {
  const image = new sf.Image(new sf.Vector2u(1, 1), color);
  const value = new sf.Texture(image.getSize());
  value.update(image.pixels);
  return value;
}

const frameArgument = process.argv.find(arg => arg.startsWith('--frames='));
const frameLimit = frameArgument ? Number(frameArgument.slice(9)) : Infinity;
if (frameArgument && (!Number.isSafeInteger(frameLimit) || frameLimit <= 0)) {
  throw new RangeError('--frames must be a positive integer');
}
const uncapped = process.argv.includes('--uncapped');
const size = new sf.Vector2u(900, 520);
const target = new sf.RenderTexture(size, { stencilBits: 8 });
const textures = [
  texture(new sf.Color(61, 232, 151, 190)),
  texture(new sf.Color(87, 178, 255, 190)),
  texture(new sf.Color(255, 192, 96, 190)),
];
const branches = Array.from({ length: 6 }, (_, i) => {
  const leaves = textures.map((image, j) => {
    const sprite = new sf.Sprite(image);
    sprite.setOrigin(point(0.5, 0.5));
    sprite.setPosition(point(j * 24, 0));
    sprite.setScale(point(50 - j * 8, 16 + j * 4));
    sprite.setRotation(sf.degrees(j * 35));
    return sprite;
  });
  const branch = new Group(...leaves);
  branch.pose.setPosition(point(
    Math.cos(i * Math.PI / 3) * 108, Math.sin(i * Math.PI / 3) * 108));
  return branch;
});
const root = new Group(...branches);
const left = new sf.RenderStates(
  new sf.Transform().translate(point(225, 265)));
const right = new sf.RenderStates({
  transform: new sf.Transform().translate(point(675, 265))
    .scale(point(1.3, 0.7)),
  blendMode: sf.BlendAdd,
  stencilMode: new sf.StencilMode({
    stencilComparison: sf.StencilComparison.Equal, stencilReference: 1,
  }),
});
const mask = new sf.Sprite(textures[0]);
mask.setPosition(point(525, 145));
mask.setScale(point(300, 240));
const maskState = new sf.RenderStates(new sf.StencilMode({
  stencilUpdateOperation: sf.StencilUpdateOperation.Replace,
  stencilReference: 1, stencilOnly: true,
}));
const muted = new sf.Color(145, 167, 187);
const labels = [
  label('DRAWABLE / NESTED GROUPS', 24, 24, 3),
  label('ONE COMPOSITE / TWO STATE SNAPSHOTS', 24, 62, 2, muted),
  label('ALPHA BLEND', 105, 445, 2),
  label('ADD / STENCIL CLIP', 560, 445, 2),
  label('PARENT SCALE AND CHILD ROTATION / ESC CLOSES',
    24, 490, 2, muted),
];
const open = new Uint32Array(
  native.openRenderTexturePreview(target[graphicsNative]));
let frames = 0;
let firstHash;

function inspectFrame() {
  const rgba = native.readRenderTexturePixels(target[graphicsNative]);
  const hash = createHash('sha256').update(rgba).digest('hex');
  if (frames === 1) firstHash = hash;
  else assert.notEqual(hash, firstHash, 'Animation must change pixels');
  if (process.env.SFML_DEMO_SNAPSHOT) {
    const rgb = Buffer.alloc(size.x * size.y * 3);
    for (let i = 0; i < size.x * size.y; i++) {
      rgb[i * 3] = rgba[i * 4];
      rgb[i * 3 + 1] = rgba[i * 4 + 1];
      rgb[i * 3 + 2] = rgba[i * 4 + 2];
    }
    writeFileSync(process.env.SFML_DEMO_SNAPSHOT, Buffer.concat([
      Buffer.from(`P6\n${size.x} ${size.y}\n255\n`), rgb,
    ]));
  }
}

function render() {
  root.pose.setRotation(sf.degrees(frames * 0.6));
  for (let i = 0; i < branches.length; i++) {
    branches[i].pose.setRotation(sf.degrees(i * 60 - frames * 1.2));
  }
  target.clear(new sf.Color(13, 18, 27), 0);
  target.draw(mask, maskState);
  target.draw(root, left);
  target.draw(root, right);
  for (const sprite of labels) target.draw(sprite);
  target.display();
  frames++;
  if (frames === 1 || frames === frameLimit) {
    inspectFrame();
    console.log(`PASS: ${frames} frames; nested transforms, blend and stencil`);
  }
  if (frames >= frameLimit || !open[0]) return;
  if (uncapped) setImmediate(render);
  else setTimeout(render, 16);
}

render();
