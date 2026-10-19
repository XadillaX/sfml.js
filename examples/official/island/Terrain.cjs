'use strict';

const { parentPort } = require('node:worker_threads');
const noise = require('./Perlin.cjs');
const width = 800;
const height = 600;
const rowBlockSize = Math.floor(height / 32) + 1;
const defaults = {
  perlinFrequency: 7,
  perlinFrequencyBase: 4,
  heightBase: 0,
  edgeFactor: 0.9,
  edgeDropoffExponent: 1.5,
  snowcapHeight: 0.6,
  heightFactor: height / 2,
  heightFlatten: 3,
  lightFactor: 0.7,
};

/**
 * Compute the original three-octave elevation and radial edge falloff.
 * @param {number} x - Grid coordinate, including adjacent border samples.
 * @param {number} y - Grid coordinate, including adjacent border samples.
 * @param {object} settings - Terrain parameters.
 */
function elevation(x, y, settings) {
  const nx = x / width - 0.5;
  const ny = y / height - 0.5;
  let value = 0;
  for (let i = 0; i < 3; ++i) {
    const scale = settings.perlinFrequencyBase ** i;
    value += noise(
      nx * settings.perlinFrequency * scale,
      ny * settings.perlinFrequency * scale
    ) / scale;
  }

  const distance = 2 * Math.hypot(nx, ny);
  const edge = 1 - settings.edgeFactor *
    distance ** settings.edgeDropoffExponent;
  const result = ((value + 1) / 2 + settings.heightBase) * edge;
  return Math.max(0, Math.min(1, result));
}

/**
 * Truncate color channels as in the upstream uint8_t conversions.
 * @param {number[]} color - Floating-point RGB components.
 */
function rgb(color) {
  return color.map(value => Math.trunc(value));
}

/**
 * Select sand, grass or forest from the original moisture thresholds.
 * @param {number} moisture - Normalized moisture.
 */
function lowlands(moisture) {
  if (moisture < 0.27) return [ 240, 240, 180 ];
  if (moisture < 0.3) {
    const t = (moisture - 0.27) / 0.03;
    return rgb([ 240 - 240 * t, 240 - 40 * t, 180 - 180 * t ]);
  }
  if (moisture < 0.4) return [ 0, 200, 0 ];
  if (moisture < 0.48) {
    return rgb([ 0, 200 - 40 * (moisture - 0.4) / 0.08, 0 ]);
  }
  if (moisture < 0.6) return [ 0, 160, 0 ];
  if (moisture < 0.7) {
    const t = (moisture - 0.6) / 0.1;
    return rgb([ 34 * t, 160 - 60 * t, 34 * t ]);
  }
  return [ 34, 100, 34 ];
}

/**
 * Interpolate the upstream terrain palette.
 * @param {number} value - Elevation in [0, 1].
 * @param {number} moisture - Moisture in [0, 1].
 * @param {number} snowcap - Elevation at which snow begins.
 */
function terrainColor(value, moisture, snowcap) {
  if (value < 0.11) return rgb([ 0, 0, value / 0.11 * 74 + 181 ]);
  if (value < 0.14) {
    const channel = ((value - 0.11) / 0.03) ** 0.3 * 48;
    return rgb([ channel, channel, 255 ]);
  }
  if (value < 0.16) {
    const channel = (value - 0.14) * 128 / 0.02 + 48;
    return rgb([ channel, channel, 127 + (0.16 - value) * 128 / 0.02 ]);
  }
  if (value < 0.17) return [ 240, 230, 140 ];

  const low = lowlands(moisture);
  if (value < 0.4) return low;

  const t = (moisture - 0.6) / 0.4;
  const rock = moisture < 0.6 ? [ 112, 128, 144 ]
    : rgb([ 112 + 110 * t, 128 + 56 * t, 144 - 9 * t ]);
  const highFactor = Math.min((value - 0.4) / 0.1, 1);
  const high = rgb(low.map((channel, i) =>
    channel * (1 - highFactor) + rock[i] * highFactor
  ));
  if (value < snowcap) return high;

  const snowFactor = Math.min((value - snowcap) / 0.05, 1);
  return rgb(high.map(channel =>
    channel * (1 - snowFactor) + 255 * snowFactor
  ));
}

/**
 * Fill one disjoint row block with RGB and compressed surface normals.
 * @param {object} job - Shared grid, block index and parameter snapshot.
 * @param {SharedArrayBuffer} job.buffer - Grid shared with the main thread.
 * @param {number} job.index - Row block number.
 * @param {object} job.settings - Terrain parameters.
 */
function generateBlock({ buffer, index, settings }) {
  const data = new Float32Array(buffer);
  const start = index * rowBlockSize;
  const end = Math.min(start + rowBlockSize, height + 1);
  for (let y = start; y < end; ++y) {
    for (let x = 0; x <= width; ++x) {
      const value = elevation(x, y, settings);
      const moisture = (noise(
        (x / width - 0.5) * 4 + 0.5,
        (y / height - 0.5) * 4 + 0.5
      ) + 1) / 2;
      const color = terrainColor(value, moisture, settings.snowcapHeight);
      const offset = (y * (width + 1) + x) * 5;
      data.set(color, offset);

      // Signed border samples avoid C++ unsigned-coordinate underflow.
      const left = elevation(x - 1, y, settings) ** settings.heightFlatten;
      const right = elevation(x + 1, y, settings) ** settings.heightFlatten;
      const bottom = elevation(x, y + 1, settings) ** settings.heightFlatten;
      const top = elevation(x, y - 1, settings) ** settings.heightFlatten;
      data[offset + 3] = (left - right) * settings.heightFactor;
      data[offset + 4] = (bottom - top) * settings.heightFactor;
    }
  }
}

if (parentPort) {
  parentPort.on('message', job => {
    generateBlock(job);
    parentPort.postMessage(job.index);
  });
}

module.exports = {
  width, height, rowBlockSize, defaults, elevation, terrainColor, generateBlock,
};
