'use strict';

// Native shared vertices; one draw for a 24x16 animated tile field.
const assert = require('node:assert/strict');
const { setTimeout } = require('node:timers/promises');
const { writeFileSync } = require('node:fs');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

const limitArg = process.argv.find(arg => arg.startsWith('--frames='));
const frameLimit = limitArg ? Number(limitArg.slice(9)) : Infinity;
const uncapped = process.argv.includes('--uncapped');
const width = 720;
const height = 480;
const target = new sf.RenderTexture(new sf.Vector2u(width, height));
const open = new Uint32Array(
  native.openRenderTexturePreview(target[graphicsNative]));
const array = new sf.VertexArray(sf.PrimitiveType.Triangles, 24 * 16 * 6);
const members = [ ...array ];
const clock = new sf.Clock();
const corners = [[ 0, 0 ], [ 1, 0 ], [ 0, 1 ],
  [ 0, 1 ], [ 1, 0 ], [ 1, 1 ]];

async function main() {
  let frames = 0;
  while (open[0] && frames < frameLimit) {
    const time = clock.getElapsedTime().asSeconds();
    for (let tile = 0; tile < 24 * 16; tile++) {
      const column = tile % 24;
      const row = Math.floor(tile / 24);
      const inset = 3 + (Math.sin(time * 2 + column * 0.4 + row * 0.3) + 1) * 3;
      for (let j = 0; j < 6; j++) {
        const vertex = members[tile * 6 + j];
        vertex.position.x =
          column * 30 + inset + corners[j][0] * (30 - inset * 2);
        vertex.position.y = row * 30 + inset + corners[j][1] * (30 - inset * 2);
        vertex.color.r = 40 + column * 8;
        vertex.color.g = 80 + row * 9;
        vertex.color.b = 220;
      }
    }
    target.clear(new sf.Color(12, 18, 26));
    target.draw(array);
    target.display();
    frames++;
    if (!uncapped) await setTimeout(16);
  }
  const rgba = native.readRenderTexturePixels(target[graphicsNative]);
  assert.deepEqual([ ...rgba.subarray(0, 4) ], [ 12, 18, 26, 255 ]);
  const center = (15 * width + 15) * 4;
  assert.deepEqual([ ...rgba.subarray(center, center + 4) ],
    [ 40, 80, 220, 255 ]);
  if (process.env.SFML_DEMO_SNAPSHOT) {
    const rgb = Buffer.alloc(width * height * 3);
    for (let i = 0; i < width * height; i++) {
      rgba.copy(rgb, i * 3, i * 4, i * 4 + 3);
    }
    writeFileSync(process.env.SFML_DEMO_SNAPSHOT,
      Buffer.concat([ Buffer.from(`P6\n${width} ${height}\n255\n`), rgb ]));
  }
  console.log(`PASS: ${frames} frames, 384 tiles, one VertexArray draw/frame`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
