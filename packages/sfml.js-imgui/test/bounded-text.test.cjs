'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const { ImGui, SFML } = require('../dist');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(320, 240)),
  'sfml.js-imgui bounded text'
);
assert.ok(SFML.Init(window));

try {
  const filter = ImGui.createTextFilter();
  const io = ImGui.GetIO();
  const bytes = new Uint8Array([ 65, 66, 67 ]);
  const hashes = new Uint8Array([ 65, 35, 35 ]);
  let measured;
  let expected;

  // Focus the actual filter editor, then enter its inclusion term.
  for (let frame = 0; frame < 4; frame++) {
    if (frame === 2) {
      ImGui.IO_AddInputCharactersUTF8(io, 'ABC');
    }
    SFML.Update(window, 1 / 60);
    ImGui.Begin('bounded text');
    if (frame === 0) {
      ImGui.SetKeyboardFocusHere();
    }
    ImGui.TextFilter_Draw(filter, 'filter', 180);
    measured = ImGui.CalcTextSizeEx(hashes, hashes.subarray(2), true);
    expected = ImGui.CalcTextSize('A#');
    assert.deepEqual(
      ImGui.CalcTextSizeEx(hashes, hashes.subarray(3), true),
      ImGui.CalcTextSize('A')
    );
    const emptyRange = hashes.subarray(3);
    assert.deepEqual(
      ImGui.CalcTextSizeEx(emptyRange, emptyRange, true),
      ImGui.CalcTextSize('')
    );
    ImGui.End();
    SFML.Render(window);
  }

  assert.equal(ImGui.TextFilter_IsActive(filter), true);
  assert.equal(ImGui.TextFilter_PassFilter(filter, 'ABC'), true);
  assert.deepEqual({
    matchBeyondEnd: ImGui.TextFilter_PassFilter(
      filter, bytes, bytes.subarray(2)
    ),
    truncatedHashWidth: measured.x,
  }, {
    matchBeyondEnd: false,
    truncatedHashWidth: expected.x,
  });
  assert.equal(
    ImGui.TextFilter_PassFilter(filter, bytes, bytes.subarray(3)), true
  );
  const empty = bytes.subarray(3);
  assert.equal(ImGui.TextFilter_PassFilter(filter, empty, empty), false);
} finally {
  SFML.Shutdown(window);
  window.close();
}

console.log('[sfml.js-imgui] bounded text ok');
