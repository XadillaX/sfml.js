'use strict';

// Run after building: node tools/benchmark-vertex-array.cjs.
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { cpus } = require('node:os');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

const counts = [ 256, 1024, 4095 ];
const modes = [ 'sprites', 'vertex_array', 'raw_vertices' ];
const warmupFrames = 30;
const framesPerSample = 40;
const sampleCount = 5;
const target = new sf.RenderTexture(new sf.Vector2u(128, 128));
const texture = new sf.Texture(new sf.Vector2u(1, 1));
texture.update(new Uint8Array([ 255, 0, 0, 255 ]));
const states = new sf.RenderStates({ texture });
const median = values =>
  values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
const report = {
  cpu: cpus()[0].model, node: process.version,
  platform: `${process.platform}/${process.arch}`, sfml: native.sfmlVersion,
  unit: 'milliseconds per frame', warmupFrames, framesPerSample, sampleCount,
  workload: '128x128 offscreen, identical red 1px quads sharing one texture',
  notes: [
    'Sprites issue N SFML draws; each vertex path issues one with 6N vertices.',
    'One clear command precedes every frame, included in record time.',
    'Readback drains GPU work and is timed separately, outside total_ms.',
    'Record includes draw-time vertex snapshots and raw-array validation.',
    'Geometry is static; excludes creation, uploads and per-frame animation.',
    'Wall time on the calling thread, not GPU timestamp measurements.',
    'Rotate mode order; report medians of five 40-frame sample means.',
  ],
  results: [],
};

for (const count of counts) {
  const array = new sf.VertexArray(sf.PrimitiveType.Triangles, count * 6);
  const sprites = [];
  for (let i = 0; i < count; i++) {
    const x = i % 128;
    const y = Math.floor(i / 128);
    const sprite = new sf.Sprite(texture);
    sprite.setPosition(new sf.Vector2f(x, y));
    sprites.push(sprite);
    const corners = [[ 0, 0 ], [ 1, 0 ], [ 0, 1 ],
      [ 0, 1 ], [ 1, 0 ], [ 1, 1 ]];
    for (let j = 0; j < 6; j++) {
      const [ dx, dy ] = corners[j];
      const vertex = array.getVertex(i * 6 + j);
      vertex.position = new sf.Vector2f(x + dx, y + dy);
      vertex.texCoords = new sf.Vector2f(dx, dy);
    }
  }
  const raw = [ ...array ];
  let bytes;
  const frame = mode => {
    const start = performance.now();
    target.clear();
    if (mode === 'sprites') {
      for (const sprite of sprites) target.draw(sprite);
    } else if (mode === 'vertex_array') {
      target.draw(array, states);
    } else {
      target.draw(raw, sf.PrimitiveType.Triangles, states);
    }
    const recorded = performance.now();
    target.display();
    const displayed = performance.now();
    bytes = native.readRenderTexturePixels(target[graphicsNative]);
    const read = performance.now();
    return [ recorded - start, displayed - recorded,
      displayed - start, read - displayed ];
  };
  const verify = () => {
    for (let i = 0; i < 128 * 128; i++) {
      assert.equal(bytes[i * 4], i < count ? 255 : 0);
      assert.equal(bytes[i * 4 + 1], 0);
      assert.equal(bytes[i * 4 + 2], 0);
      assert.equal(bytes[i * 4 + 3], 255);
    }
  };
  for (const mode of modes) {
    for (let i = 0; i < warmupFrames; i++) frame(mode);
    verify();
  }
  const samples = Object.fromEntries(modes.map(mode => [ mode, []]));
  for (let sample = 0; sample < sampleCount; sample++) {
    for (let j = 0; j < modes.length; j++) {
      const mode = modes[(j + sample) % modes.length];
      const sums = [ 0, 0, 0, 0 ];
      for (let i = 0; i < framesPerSample; i++) {
        const values = frame(mode);
        for (let k = 0; k < sums.length; k++) sums[k] += values[k];
      }
      samples[mode].push(sums.map(sum => sum / framesPerSample));
      verify();
    }
  }
  for (const mode of modes) {
    const rows = samples[mode];
    report.results.push({
      quads: count, mode, vertices: mode === 'sprites' ? count * 4 : count * 6,
      sfml_draws: mode === 'sprites' ? count : 1,
      record_ms: median(rows.map(row => row[0])),
      display_ms: median(rows.map(row => row[1])),
      total_ms: median(rows.map(row => row[2])),
      readback_ms: median(rows.map(row => row[3])),
      total_min_ms: Math.min(...rows.map(row => row[2])),
      total_max_ms: Math.max(...rows.map(row => row[2])),
    });
  }
  console.error(`Verified and measured ${count} quads.`);
}
console.log(JSON.stringify(report, null, 2));
