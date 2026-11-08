'use strict';

const sfml = require('sfml.js');
const imgui = require('../dist');

const { ImGui, SFML } = imgui;
const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'benchmark');
if (!SFML.Init(window)) {
  throw new Error('init failed');
}

const io = SFML.GetIO();
const color = new Float32Array([ 1, 0.5, 0.25, 1 ]);

/**
 * Run one micro benchmark.
 * @param {string} name Name.
 * @param {number} count Iterations.
 * @param {Function} callback Function being measured.
 */
function bench(name, count, callback) {
  for (let i = 0; i < 1000; i++) {
    callback();
  }
  const start = process.hrtime.bigint();
  for (let i = 0; i < count; i++) {
    callback();
  }
  const elapsed = Number(process.hrtime.bigint() - start);
  console.log(`${name}: ${(elapsed / count).toFixed(2)} ns/op`);
}

bench('shared IO read', 1e7, () => {
  if (io.fontGlobalScale < 0) {
    throw new Error('unreachable');
  }
});
bench('shared IO write', 1e7, () => {
  io.fontGlobalScale = 1;
});
bench('ColorConvertFloat4ToU32', 1e6, () => {
  ImGui.ColorConvertFloat4ToU32(color);
});
bench('SFML.GetIO() view', 1e5, () => SFML.GetIO());
bench('ImGui.GetIO() handle', 1e5, () => ImGui.GetIO());

SFML.Shutdown(window);
window.close();
