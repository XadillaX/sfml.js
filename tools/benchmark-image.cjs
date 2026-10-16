'use strict';

// Run after build: node tools/benchmark-image.cjs. Timings are observations,
// not pass/fail thresholds. Codecs include the required invocation snapshot.
const { performance } = require('node:perf_hooks');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const sf = require('..');
const native = require('../build/Release/sfml.node');
const { graphicsNative } = require('../dist/internal/graphics-state');

function measure(fn, count) {
  const start = performance.now();
  for (let i = 0; i < count; i++) fn();
  return performance.now() - start;
}

function median(values) {
  return values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
}

function jsBulk(operation, image, source) {
  const data = image.pixels;
  const { x: width, y: height } = image.getSize();
  if (operation === 3) {
    data.set(source.pixels);
  } else if (operation === 2) {
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 255 && data[i + 1] === 0 &&
          data[i + 2] === 0 && data[i + 3] === 255) data[i + 3] = 0;
    }
  } else {
    const rows = operation === 0 ? height : Math.floor(height / 2);
    const columns = operation === 0 ? Math.floor(width / 2) : width;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < columns; x++) {
        const from = (y * width + x) * 4;
        const to = operation === 0 ? (y * width + width - 1 - x) * 4 :
          ((height - 1 - y) * width + x) * 4;
        for (let c = 0; c < 4; c++) {
          const byte = data[from + c];
          data[from + c] = data[to + c];
          data[to + c] = byte;
        }
      }
    }
  }
}

async function main() {
  const report = {
    node: process.version, platform: `${process.platform}/${process.arch}`,
    sfml: native.sfmlVersion, unit: 'milliseconds per operation',
    notes: [
      'Five-sample medians; native baseline loops inside one NAN call.',
      'Copy uses distinct images; JS full-image copy uses TypedArray.set.',
      'Mask scans a no-match image; matched writes are not timed.',
      'Codec totals include snapshots, queue and completion costs.',
      'Input: deterministic RGBA pattern; compression is content-dependent.',
    ],
    bulk: [], codecs: [],
  };
  const directory = await mkdtemp(join(tmpdir(), 'sfml-image-bench-'));
  try {
    for (const size of [ 16, 1024 ]) {
      const image = new sf.Image(new sf.Vector2u(size, size), sf.Color.Blue);
      const source = new sf.Image(image);
      const origin = new sf.Vector2u();
      const methods = [
        () => image.flipHorizontally(), () => image.flipVertically(),
        () => image.createMaskFromColor(sf.Color.Red),
        () => image.copy(source, origin),
      ];
      const count = size === 16 ? 10000 : 20;
      for (let op = 0; op < methods.length; op++) {
        const js = () => jsBulk(op, image, source);
        measure(methods[op], 20);
        measure(js, 20);
        const samples = [[], [], []];
        for (let i = 0; i < 5; i++) {
          samples[0].push(measure(methods[op], count) / count);
          samples[1].push(native.benchmarkImageBulk(
            image[graphicsNative], source[graphicsNative], op, count) / count);
          samples[2].push(measure(js, count) / count);
        }
        report.bulk.push({
          size, operation: [ 'horizontal', 'vertical', 'mask', 'copy' ][op],
          binding: median(samples[0]), cpp: median(samples[1]),
          js: median(samples[2]),
        });
      }
      for (let i = 0; i < image.pixels.length; i++) {
        image.pixels[i] = (i * 43 + Math.floor(i / 4096)) % 256;
      }
      const decoded = new sf.Image();
      for (const format of [ 'png', 'qoi' ]) {
        const file = join(directory, `${size}.${format}`);
        const samples = { encode: [], decode: [], save: [], load: [],
          encodeDispatch: [], decodeDispatch: [] };
        let bytes = 0;
        for (let i = 0; i < 6; i++) {
          let start = performance.now();
          const saving = image.saveToMemory(format);
          const encodeDispatch = performance.now() - start;
          const encoded = await saving;
          if (!encoded) throw new Error('Encode failed');
          const encode = performance.now() - start;
          bytes = encoded.byteLength;
          start = performance.now();
          const loading = decoded.loadFromMemory(encoded);
          const decodeDispatch = performance.now() - start;
          if (!await loading) throw new Error('Decode failed');
          const decode = performance.now() - start;
          start = performance.now();
          if (!await image.saveToFile(file)) throw new Error('Save failed');
          const save = performance.now() - start;
          start = performance.now();
          if (!await decoded.loadFromFile(file)) throw new Error('Load failed');
          const load = performance.now() - start;
          if (i > 0) {
            for (const [ key, value ] of Object.entries({
              encode, decode, save, load, encodeDispatch, decodeDispatch,
            })) samples[key].push(value);
          }
        }
        report.codecs.push({ size, format, bytes,
          ...Object.fromEntries(Object.entries(samples)
            .map(([ key, values ]) => [ key, median(values) ])) });
      }
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
  console.log(JSON.stringify(report, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
