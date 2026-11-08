'use strict';

const assert = require('node:assert');
const sfml = require('sfml.js');
const imgui = require('../dist');

const { ImGui, SFML } = imgui;
const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(400, 300)), 'sfml.js-imgui callbacks');
assert.ok(SFML.Init(window));

const clock = new sfml.Clock();
const buffer = new Uint8Array(64);
buffer.set(Buffer.from('hello\0'));
const currentItem = new Int32Array([ 0 ]);
let inputCalls = 0;
let inputBufferSize = 0;
let listed = 0;
let plotted = 0;
let drawCalls = 0;

const inputCallback = data => {
  inputCalls++;
  const fields = ImGui.viewImGuiInputTextCallbackData(data);
  inputBufferSize = fields.BufSize;
  return 0;
};
const listGetter = index => {
  listed++;
  return `row ${index}`;
};
const comboGetter = index => `item ${index}`;
const plotGetter = index => {
  plotted++;
  return index * 0.5;
};
const drawCallback = () => {
  drawCalls++;
};

for (let frame = 0; frame < 2; frame++) {
  let event;
  while ((event = window.pollEvent()) !== undefined) {
    if (event.is('Closed')) {
      window.close();
    }
    SFML.ProcessEvent(window, event);
  }
  SFML.Update(window, clock.restart().asSeconds());

  if (ImGui.Begin('callbacks')) {
    ImGui.SetKeyboardFocusHere();
    ImGui.InputTextEx(
      'text', buffer, buffer.length,
      ImGui.ImGuiInputTextFlags.CallbackAlways, inputCallback);
    ImGui.ListBoxCallbackEx('list', currentItem, 4, listGetter);
    ImGui.ComboCallbackEx('combo', currentItem, 4, comboGetter);
    ImGui.PlotLinesCallbackEx('plot', 8, plotGetter);
    ImGui.AddCallbackEx(ImGui.GetWindowDrawList(), drawCallback);
  }
  ImGui.End();

  window.clear(sfml.Color.Black);
  SFML.Render(window);
  window.display();
}

assert.ok(inputCalls > 0);
assert.strictEqual(inputBufferSize, buffer.length);
assert.ok(listed >= 4);
assert.ok(plotted >= 8);
assert.ok(drawCalls > 0);

SFML.Shutdown(window);
window.close();
console.log('[sfml.js-imgui] callbacks ok');
