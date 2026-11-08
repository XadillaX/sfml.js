'use strict';

const assert = require('node:assert/strict');
const sfml = require('sfml.js');
const { ImGui, SFML, getFontAtlas } = require('../dist');

const window = new sfml.RenderWindow(
  new sfml.VideoMode(new sfml.Vector2u(320, 240)),
  'sfml.js-imgui glyph fields'
);
assert.ok(SFML.Init(window, false));

try {
  const atlas = getFontAtlas(ImGui.GetIO());
  assert.ok(atlas);
  const font = ImGui.ImFontAtlas_AddFontDefault(atlas);
  assert.ok(font);
  assert.ok(ImGui.ImFontAtlas_Build(atlas));

  const glyph = ImGui.ImFont_FindGlyph(font, 65);
  assert.ok(glyph);
  const fields = ImGui.viewImFontGlyph(glyph);
  assert.equal(fields.Codepoint, 65);
  assert.equal(fields.Colored, 0);
  assert.equal(fields.Visible, 1);

  // Other native calls must not overwrite a bitfield's temporary stack value.
  for (let index = 0; index < 128; index++) {
    ImGui.GetVersion();
    ImGui.viewImGuiStyle(ImGui.GetStyle());
    ImGui.ImFont_FindGlyph(font, 66);
    assert.equal(fields.Codepoint, 65);
    assert.equal(fields.Colored, 0);
    assert.equal(fields.Visible, 1);
  }

  const original = { ...fields };
  const fresh = () => ImGui.viewImFontGlyph(ImGui.ImFont_FindGlyph(font, 65));
  try {
    fields.Colored = 1;
    assert.equal(fresh().Colored, 1);
    assert.equal(fields.Visible, 1);
    assert.equal(fields.Codepoint, 65);
    fields.Visible = 0;
    assert.equal(fresh().Visible, 0);
    assert.equal(fields.Colored, 1);
    assert.equal(fields.Codepoint, 65);
    const second = fresh();
    second.Colored = 0;
    second.Visible = 1;
    assert.equal(fields.Colored, 0);
    assert.equal(fields.Visible, 1);

    fields.X0 = original.X0 + 0.5;
    assert.equal(fresh().X0, original.X0 + 0.5);
    second.AdvanceX = original.AdvanceX + 1;
    assert.equal(fields.AdvanceX, original.AdvanceX + 1);

    // The native field is 30 bits, not a full uint32 or a Unicode validator.
    for (const codepoint of [ 0, 0x10ffff, 0x3fffffff, 65 ]) {
      fields.Codepoint = codepoint;
      assert.equal(second.Codepoint, codepoint);
      assert.equal(second.Colored, 0);
      assert.equal(second.Visible, 1);
    }

    for (const name of [ 'Colored', 'Visible', 'Codepoint' ]) {
      const before = fields[name];
      for (const invalid of [ undefined, null, true, '1', 1n, {}]) {
        assert.throws(() => {
          fields[name] = invalid;
        }, TypeError);
        assert.equal(second[name], before);
      }
      const outside = name === 'Codepoint' ? 0x40000000 : 2;
      for (const invalid of [ -1, 0.5, NaN, Infinity, -Infinity, outside ]) {
        assert.throws(() => {
          fields[name] = invalid;
        }, RangeError);
        assert.equal(second[name], before);
      }
    }

    // Copied descriptors must stay live and retain the handle, not a receiver.
    const detached = (() => {
      const view = fresh();
      const descriptors = {};
      for (const name of [ 'Colored', 'Visible', 'Codepoint' ]) {
        descriptors[name] = Object.getOwnPropertyDescriptor(view, name);
        assert.equal(typeof descriptors[name].get, 'function');
        assert.equal(typeof descriptors[name].set, 'function');
        assert.equal(descriptors[name].enumerable, true);
        assert.equal(descriptors[name].configurable, false);
      }
      return Object.defineProperties({}, descriptors);
    })();
    if (global.gc) {
      global.gc();
    }
    detached.Colored = 1;
    assert.equal(fields.Colored, 1);
    second.Visible = 0;
    assert.equal(detached.Visible, 0);
    assert.equal(detached.Codepoint, 65);
    detached.Colored = -0;
    detached.Visible = -0;
    detached.Codepoint = -0;
    assert.equal(detached.Colored, 0);
    assert.equal(detached.Visible, 0);
    assert.equal(detached.Codepoint, 0);
  } finally {
    Object.assign(fields, original);
  }
  assert.equal(fresh().Codepoint, 65);
  assert.equal(fresh().Colored, 0);
  assert.equal(fresh().Visible, 1);
  assert.equal(fresh().X0, original.X0);
  assert.equal(fresh().AdvanceX, original.AdvanceX);
} finally {
  SFML.Shutdown(window);
  window.close();
}

console.log('[sfml.js-imgui] glyph fields ok');
