'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const { ImGui, SFML } = require('../dist');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(320, 240)),
  'sfml.js-imgui argument contracts'
);
assert.ok(SFML.Init(window));

const address = ImGui.MemAlloc(16);
assert.equal(typeof address, 'bigint');
assert.notEqual(address, 0n);

try {
  const type = ImGui.ImGuiDataType.Float;
  const scalar = [ 'scalar', type, address ];
  const vector = [ ...scalar, 2 ];
  const slider = [ ...scalar, address, address ];
  const sliderVector = [ ...vector, address, address ];
  const vertical = [ 'scalar', { x: 20, y: 80 }, type,
    address, address, address ];
  const requiredPointers = [
    [ 'DragScalar', scalar, [ 2 ]],
    [ 'DragScalarEx', scalar, [ 2 ]],
    [ 'DragScalarN', vector, [ 2 ]],
    [ 'DragScalarNEx', vector, [ 2 ]],
    [ 'InputScalar', scalar, [ 2 ]],
    [ 'InputScalarEx', scalar, [ 2 ]],
    [ 'InputScalarN', vector, [ 2 ]],
    [ 'InputScalarNEx', vector, [ 2 ]],
    [ 'SliderScalar', slider, [ 2, 3, 4 ]],
    [ 'SliderScalarEx', slider, [ 2, 3, 4 ]],
    [ 'SliderScalarN', sliderVector, [ 2, 4, 5 ]],
    [ 'SliderScalarNEx', sliderVector, [ 2, 4, 5 ]],
    [ 'VSliderScalar', vertical, [ 3, 4, 5 ]],
    [ 'VSliderScalarEx', vertical, [ 3, 4, 5 ]],
  ];
  for (const [ name, args, indexes ] of requiredPointers) {
    for (const index of indexes) {
      for (const invalid of [ null, 0n ]) {
        const input = [ ...args ];
        input[index] = invalid;
        assert.throws(() => ImGui[name](...input), {
          name: 'TypeError',
          message: /pointer|address/i,
        }, `${name}: argument ${index} must reject ${invalid}`);
      }
    }
  }

  const color = new Float32Array([ 1, 0, 0, 1 ]);
  for (const count of [ 1, 2, 3 ]) {
    assert.throws(() => ImGui.ColorPicker4(
      'color', color, 0, new Float32Array(count)
    ), RangeError);
  }
  assert.throws(() => ImGui.ColorPicker4(
    'color', color, ImGui.ImGuiColorEditFlags.NoAlpha, new Float32Array(2)
  ), RangeError);

  const textBuffer = ImGui.createTextBuffer();
  const text = new Uint8Array([ 65, 66, 67, 68 ]);
  const append = (begin, end) =>
    ImGui.TextBuffer_append(textBuffer, begin, end);
  assert.throws(() => append('ABC', 'C'), TypeError);
  assert.throws(() => append(text, new Uint8Array([ 0 ])), TypeError);
  assert.throws(() => append(text.subarray(2), text.subarray(1)), RangeError);
  assert.throws(() => append(
    text.subarray(0, 2), text.subarray(3)
  ), RangeError);

  // Explicit ranges use byte offsets and do not require NUL termination.
  append(text, text.subarray(2));
  assert.equal(ImGui.TextBuffer_c_str(textBuffer), 'AB');
  append(text.subarray(2), text.subarray(4));
  assert.equal(ImGui.TextBuffer_c_str(textBuffer), 'ABCD');
  append(text.subarray(4), text.subarray(4));
  assert.equal(ImGui.TextBuffer_c_str(textBuffer), 'ABCD');
  append('!', null);
  assert.equal(ImGui.TextBuffer_c_str(textBuffer), 'ABCD!');

  const builder = ImGui.createFontGlyphRangesBuilder();
  ImGui.ImFontGlyphRangesBuilder_AddText(builder, text, text.subarray(2));
  assert.equal(ImGui.ImFontGlyphRangesBuilder_GetBit(builder, 65), true);
  assert.equal(ImGui.ImFontGlyphRangesBuilder_GetBit(builder, 66), true);
  assert.equal(ImGui.ImFontGlyphRangesBuilder_GetBit(builder, 67), false);
  const filter = ImGui.createTextFilter();
  assert.throws(() => ImGui.TextFilter_PassFilter(
    filter, 'ABC', 'C'
  ), TypeError);

  SFML.Update(window, 1 / 60);
  ImGui.Begin('contracts');
  const storage = ImGui.GetStateStorage();
  assert.equal(ImGui.Storage_GetVoidPtr(storage, 0x7fffffff), 0n);
  ImGui.SetStateStorage(null);
  assert.equal(ImGui.Storage_GetVoidPtr(
    ImGui.GetStateStorage(), 0x7fffffff
  ), 0n);
  assert.doesNotThrow(() => ImGui.PushFont(null));
  ImGui.PopFont();
  assert.doesNotThrow(() => ImGui.ColorPicker4(
    'rgb', color, ImGui.ImGuiColorEditFlags.NoAlpha, new Float32Array(3)
  ));
  assert.doesNotThrow(() => ImGui.TextUnformattedEx(text, text.subarray(2)));
  assert.throws(() => ImGui.TextUnformattedEx('ABC', 'C'), TypeError);
  assert.throws(() => ImGui.GetIDStr('ABC', 'C'), TypeError);
  assert.equal(ImGui.GetIDStr(text, text.subarray(2)), ImGui.GetID('AB'));
  for (const offset of [ 1, text.length ]) {
    const empty = text.subarray(offset);
    assert.equal(ImGui.GetIDStr(empty, empty), ImGui.GetID(''));
  }

  // A cloned list owns its output independently of the window's draw list.
  const source = ImGui.GetWindowDrawList();
  const clone = ImGui.ImDrawList_CloneOutput(source);
  assert.ok(clone);
  const clip = ImGui.ImDrawList_GetClipRectMin(source);
  const sourceFields = ImGui.viewImDrawList(source);
  const cloneFields = ImGui.viewImDrawList(clone);
  const flags = sourceFields.Flags;
  assert.equal(cloneFields.Flags, flags);
  cloneFields.Flags = 0;
  assert.equal(sourceFields.Flags, flags);
  ImGui.ImDrawList__ClearFreeMemory(clone);
  assert.deepEqual(ImGui.ImDrawList_GetClipRectMin(source), clip);
  ImGui.End();
  SFML.Render(window);
} finally {
  ImGui.MemFree(address);
  SFML.Shutdown(window);
  window.close();
}

console.log('[sfml.js-imgui] argument contracts ok');
