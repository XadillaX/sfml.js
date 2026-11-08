'use strict';

const assert = require('node:assert');
const sfml = require('sfml.js');
const imgui = require('../dist');

const { ImGui, SFML } = imgui;
assert.match(SFML.Version, /^\d+\.\d+/);
assert.strictEqual(SFML.Version, ImGui.GetVersion());
const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'sfml.js-imgui test');
assert.ok(SFML.Init(window));

const clock = new sfml.Clock();
const value = new Float32Array([ 0.5 ]);

for (let frame = 0; frame < 2; frame++) {
  let event;
  while ((event = window.pollEvent()) !== undefined) {
    if (event.is('Closed')) {
      window.close();
    }
    SFML.ProcessEvent(window, event);
  }
  SFML.Update(window, clock.restart().asSeconds());

  const io = SFML.GetIO();
  io.fontGlobalScale = 1.2;
  const style = ImGui.viewImGuiStyle(ImGui.GetStyle());
  style.WindowRounding = 6;

  if (ImGui.Begin('test')) {
    ImGui.Text('frame %d', frame);
    ImGui.SliderFloat('value', value, 0, 1);
    ImGui.TextUnformatted('hello');
  }
  ImGui.End();

  window.clear(sfml.Color.Black);
  SFML.Render(window);
  window.display();
}

assert.strictEqual(SFML.GetIO().fontGlobalScale, Math.fround(1.2));
assert.strictEqual(SFML.GetStyle().windowRounding, 6);

const ioHandle = ImGui.GetIO();
const ioFields = ImGui.viewImGuiIO(ioHandle);
assert.strictEqual(ioFields.DisplaySizeX, 320);
assert.strictEqual(ioFields.DisplaySizeY, 240);

const atlas = imgui.getFontAtlas(ioHandle);
assert.ok(atlas);
const ranges = imgui.getGlyphRangesChineseSimplifiedCommon(atlas);
assert.ok(ranges.length > 100);
const colors = imgui.getStyleColors(ImGui.GetStyle());
assert.ok(colors.length >= 64);

SFML.Shutdown(window);
window.close();
console.log('[sfml.js-imgui] basic ok');
