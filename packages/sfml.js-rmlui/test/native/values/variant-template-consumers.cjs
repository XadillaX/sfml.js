'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const sfml = require('sfml.js');
const rmlui = require('../../../dist');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(160, 120)), 'Native value templates');
assert.ok(rmlui.initialise(window, { highDpi: false }));

try {
  require(path.resolve(process.argv[2])).run();
} finally {
  rmlui.shutdown();
  window.close();
}
