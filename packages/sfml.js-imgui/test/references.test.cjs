'use strict';

const assert = require('node:assert');
const sfml = require('sfml.js');
const imgui = require('../dist');

const { ImGui, SFML } = imgui;
const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(320, 240)), 'sfml.js-imgui refs');
assert.ok(SFML.Init(window));

const clock = new sfml.Clock();
const color = new Float32Array([ 1, 1, 1, 1 ]);

for (let frame = 0; frame < 2; frame++) {
  let event;
  while ((event = window.pollEvent()) !== undefined) {
    if (event.is('Closed')) {
      window.close();
    }
    SFML.ProcessEvent(window, event);
  }
  SFML.Update(window, clock.restart().asSeconds());
  if (ImGui.Begin('refs')) {
    const storage = ImGui.GetStateStorage();
    const intRef = ImGui.Storage_GetIntRef(storage, 1, 7);
    intRef[0] = 8;
    assert.strictEqual(ImGui.Storage_GetInt(storage, 1), 8);

    const floatRef = ImGui.Storage_GetFloatRef(storage, 2, 0.5);
    floatRef[0] = 2.5;
    assert.strictEqual(ImGui.Storage_GetFloat(storage, 2), 2.5);

    const boolRef = ImGui.Storage_GetBoolRef(storage, 3, false);
    boolRef[0] = 1;
    assert.strictEqual(ImGui.Storage_GetBool(storage, 3), true);

    const builder = ImGui.createFontGlyphRangesBuilder();
    ImGui.ImFontGlyphRangesBuilder_AddText(builder, '中文字符');
    const ranges = ImGui.FontGlyphRangesBuilder_BuildRanges(builder);
    assert.ok(ranges.length >= 4);
    assert.strictEqual(ranges[ranges.length - 1], 0);

    const textBuffer = ImGui.createTextBuffer();
    ImGui.TextBuffer_appendf(textBuffer, 'value %d', 42);
    assert.strictEqual(ImGui.TextBuffer_c_str(textBuffer), 'value 42');

    ImGui.ImColor_SetHSV(color, 0.5, 0.8, 0.9, 1);
    assert.ok(Math.abs(color[1] - 0.9) < 0.01);
    assert.ok(Math.abs(color[2] - 0.9) < 0.01);
    assert.strictEqual(color[3], 1);
  }
  ImGui.End();

  const io = ImGui.GetIO();
  const atlas = imgui.getFontAtlas(io);
  const texture = ImGui.FontAtlas_GetTexDataAsRGBA32(atlas);
  if (texture) {
    assert.ok(texture.pixels.length > 0);
    assert.strictEqual(
      texture.pixels.length,
      texture.width * texture.height * texture.bytesPerPixel);
  }

  window.clear(sfml.Color.Black);
  SFML.Render(window);
  window.display();
}

SFML.Shutdown(window);
window.close();
console.log('[sfml.js-imgui] references ok');
