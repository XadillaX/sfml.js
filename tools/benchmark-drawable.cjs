'use strict';

// Run after building: node tools/benchmark-drawable.cjs.
// Measures wall time on the calling thread, not GPU timestamp queries.
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { cpus } = require('node:os');
const { resolve } = require('node:path');
const buildRoot = resolve(
  process.env.SFML_BENCH_ROOT || resolve(__dirname, '..'));
const sf = require(buildRoot);
const native = require(resolve(buildRoot, 'build/Release/sfml.node'));
const { graphicsNative } = require(
  resolve(buildRoot, 'dist/internal/graphics-state'));

const warmupFrames = 30;
const framesPerSample = 40;
const sampleCount = 5;
const counts = [ 256, 1024, 4095 ];
const size = new sf.Vector2u(128, 128);
const texture = new sf.Texture(new sf.Vector2u(1, 1));
texture.update(new Uint8Array([ 255, 0, 0, 255 ]));
const sprites = Array.from({ length: counts[counts.length - 1] }, (_, i) => {
  const sprite = new sf.Sprite(texture);
  sprite.setPosition(new sf.Vector2f(i % 128, Math.floor(i / 128)));
  return sprite;
});

class CustomLeaf extends sf.Drawable {
  constructor(sprite) {
    super();
    this.sprite = sprite;
  }

  draw(target, states) {
    target.draw(this.sprite, states);
  }
}

const leaves = sprites.map(sprite => new CustomLeaf(sprite));
const target = new sf.RenderTexture(size);
const mutableStates = new sf.RenderStates();
let lastPixels;

function frame(mode, count) {
  const source = mode.startsWith('custom_leaf') ? leaves : sprites;
  const states = mode.endsWith('_states') ? mutableStates : undefined;
  const start = performance.now();
  target.clear();
  for (let i = 0; i < count; i++) {
    target.draw(source[i], states);
    if (mode === 'flush_each') target.flush();
  }
  const recorded = performance.now();
  if (mode === 'split_batch') target.flush();
  const flushed = performance.now();
  target.display();
  const displayed = performance.now();
  // Drain prior GPU work so the next frame starts without its queue backlog.
  // This synchronization and pixel copy are reported separately.
  lastPixels = native.readRenderTexturePixels(target[graphicsNative]);
  const read = performance.now();
  return [
    recorded - start, flushed - recorded, displayed - flushed,
    displayed - start, read - displayed,
  ];
}

function median(values) {
  return values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
}

function verify(count) {
  for (let i = 0; i < size.x * size.y; i++) {
    const offset = i * 4;
    assert.equal(lastPixels[offset], i < count ? 255 : 0);
    assert.equal(lastPixels[offset + 1], 0);
    assert.equal(lastPixels[offset + 2], 0);
    assert.equal(lastPixels[offset + 3], 255);
  }
}

const modes = [
  'batch', 'custom_leaf', 'batch_states', 'custom_leaf_states',
  'flush_each', 'split_batch',
];
const report = {
  cpu: cpus()[0].model,
  node: process.version,
  platform: `${process.platform}/${process.arch}`,
  sfml: native.sfmlVersion,
  buildRoot,
  unit: 'milliseconds per frame',
  warmupFrames, framesPerSample, sampleCount,
  workload: '128x128 offscreen; distinct 1px sprites sharing one texture',
  notes: [
    'Five sample means; report their medians and total min/max.',
    'No window, vsync, uploads or animation in timed frames.',
    'Resources are created before timing; callback state copies are timed.',
    'Each frame ends with separately timed readback to drain GPU work.',
    'Thread wall time includes driver work; it is not GPU execution time.',
    'custom_leaf allocates one RenderStates copy per sprite callback.',
    '*_states passes a persistent mutable RenderStates instead of Default.',
    'flush_each uses the same API but flushes every sprite; not pure NAN cost.',
    'flush_each record_ms includes its native submissions.',
    'split_batch diagnoses flush/display separately, adding one NAN call.',
    'Other modes submit through display; counts include one clear command.',
  ],
  results: [],
};

for (const count of counts) {
  const samples = Object.fromEntries(modes.map(mode => [ mode, []]));
  for (const mode of modes) {
    for (let i = 0; i < warmupFrames; i++) frame(mode, count);
    verify(count);
  }
  // Rotate mode order to avoid assigning all early/late samples to one mode.
  for (let sample = 0; sample < sampleCount; sample++) {
    for (let j = 0; j < modes.length; j++) {
      const mode = modes[(j + sample) % modes.length];
      const sums = [ 0, 0, 0, 0, 0 ];
      for (let i = 0; i < framesPerSample; i++) {
        const times = frame(mode, count);
        for (let k = 0; k < sums.length; k++) sums[k] += times[k];
      }
      samples[mode].push(sums.map(value => value / framesPerSample));
    }
  }
  for (const mode of modes) {
    const values = samples[mode];
    const columns = [ 0, 1, 2, 3, 4 ].map(
      column => median(values.map(row => row[column])));
    const totals = values.map(row => row[3]);
    report.results.push({
      sprites: count, mode,
      record_ms: columns[0], flush_ms: columns[1],
      display_ms: columns[2], total_ms: columns[3],
      readback_ms: columns[4],
      total_min_ms: Math.min(...totals), total_max_ms: Math.max(...totals),
    });
  }
  console.error(`Measured ${count} sprites across ${modes.length} paths.`);
}

console.log(JSON.stringify(report, null, 2));
