'use strict';

const { writeFileSync } = require('node:fs');
const { RenderTexture, Vector2u, Color } = require('..');
const { createScene, comparePanels } = require('./all-types-scene.cjs');
const { label } = require('./bitmap-label.cjs');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

const uncapped = process.argv.includes('--uncapped');
const frameArgument = process.argv.find(arg => arg.startsWith('--frames='));
const frameLimit = frameArgument ? Number(frameArgument.slice(9)) : Infinity;
if (frameArgument && (!Number.isSafeInteger(frameLimit) || frameLimit <= 0)) {
  throw new RangeError('--frames must be a positive integer');
}
const size = new Vector2u(1040, 720);
const leftOffset = [ 24, 120 ];
const rightOffset = [ 536, 120 ];
const cold = createScene(leftOffset);
const warm = createScene(rightOffset, true);
const target = new RenderTexture(size);
const open = new Uint32Array(
  native.openRenderTexturePreview(target[graphicsNative]));
const background = new Color(13, 18, 27);
const muted = new Color(145, 167, 187);
const green = new Color(61, 232, 151);
const blue = new Color(87, 178, 255);
const labels = [
  label('SFML / ALL TYPES', 24, 24, 3),
  label(`${cold.names.length} TYPE NAMES / INCLUDING GLSL ALIASES`,
    24, 58, 2, muted),
  label('JS ARRAYBUFFER', 32, 96, 2, green),
  label('NATIVE BACKINGSTORE', 544, 96, 2, blue),
  label('SPRITES / VERTEXARRAY / VERTEXBUFFER / SHADER', 24, 610, 2, muted),
  label('ANGLE TRANSFORM VECTOR2/3 I U F COLOR RECT VERTEX', 24, 644, 2),
  label('TIME CLOCK GLSL VEC IVEC BVEC 2/3/4 MAT3/4', 24, 669, 2),
  label('TRANSFORMABLE TEXTURE SPRITE RENDERTEXTURE / ESC CLOSES',
    24, 695, 1, muted),
];
const passed = label('PIXELS MATCH', 772, 26, 2, green);
const failed = label('CHECK FAILED', 772, 26, 2, new Color(255, 96, 96));
let frames = 0;
let checks = 0;
let lastReport = 0;
let reportFrames = 0;
let failure;

function saveFrame(path) {
  const rgba = native.readRenderTexturePixels(target[graphicsNative]);
  const rgb = Buffer.alloc(size.x * size.y * 3);
  for (let i = 0; i < size.x * size.y; i++) {
    rgb[i * 3] = rgba[i * 4];
    rgb[i * 3 + 1] = rgba[i * 4 + 1];
    rgb[i * 3 + 2] = rgba[i * 4 + 2];
  }
  writeFileSync(path, Buffer.concat([
    Buffer.from(`P6\n${size.x} ${size.y}\n255\n`), rgb,
  ]));
}

function render() {
  const elapsed = cold.clock.getElapsedTime();
  cold.prepare(elapsed);
  warm.prepare(elapsed);
  target.clear(background);
  cold.draw(target);
  warm.draw(target);
  for (const sprite of labels) target.draw(sprite);
  if (checks > 0 || failure) target.draw(failure ? failed : passed);
  target.display();
  frames++;
  const milliseconds = elapsed.asMilliseconds();
  if (frames === 1 || milliseconds - lastReport >= 1000 ||
      frames === frameLimit) {
    try {
      cold.verify();
      warm.verify();
      comparePanels(target, leftOffset, rightOffset);
      checks++;
    } catch (error) {
      failure = error;
      console.error(error);
      process.exitCode = 1;
    }
    const fps = (frames - reportFrames) * 1000 /
      Math.max(1, milliseconds - lastReport);
    console.log(`${failure ? 'FAIL' : 'PASS'}: ${cold.names.length} types, ` +
      `${checks} pixel/native checks, ${frames} frames, ${fps.toFixed(1)} FPS`);
    lastReport = milliseconds;
    reportFrames = frames;
  }
  if (frames === 1) {
    console.log(cold.names.join(', '));
    console.log('Right pane: wrapped values + C++ writes to Vertex.color.');
    console.log('GLSL feeds sprite data; Shader colors CPU/GPU triangles.');
    console.log(uncapped ? 'Frame pacing: uncapped.' : 'Frame pacing: 16 ms.');
  }
  if (process.env.SFML_DEMO_SNAPSHOT &&
      (frames === 2 || frames === frameLimit)) {
    saveFrame(process.env.SFML_DEMO_SNAPSHOT);
  }
  if (failure || frames >= frameLimit || !open[0]) return;
  if (uncapped) setImmediate(render);
  else setTimeout(render, 16);
}

// Resource setup does not count towards animation time or reported FPS.
Promise.all([ cold.ready, warm.ready ]).then(() => {
  cold.clock.restart();
  render();
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
