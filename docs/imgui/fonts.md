# Fonts and style

Load the characters your tool needs, then adjust spacing and colors without losing native ownership. The complete [workbench](../../packages/sfml.js-imgui/examples/workbench.cjs) accepts an optional font file:

```sh
node packages/sfml.js-imgui/examples/workbench.cjs /absolute/path/to/font.ttf
```

Replace the path with an existing TTF file. This command uses the default Latin ranges and displays the workbench at 20 px. The package does not supply the font file. For Chinese, Japanese or Korean text, use the corresponding glyph ranges and a font that actually contains those characters.

## Load a CJK font before the first frame

Extend the [quick-start imports](getting-started.md) with the top-level helpers below. Put the loading block after successful `SFML.Init(window)` and before entering the loop. Declare `font` and `ranges` in the application scope so later frame code can access the font and the range storage remains alive.

```js
const {
  getFontAtlas, getGlyphRangesChineseSimplifiedCommon,
} = require('sfml.js-imgui');
let font = null;
let ranges = null;

function loadFont(path) {
  const atlas = getFontAtlas(ImGui.GetIO());
  if (!atlas) {
    throw new Error('Missing font atlas');
  }
  const pairs = getGlyphRangesChineseSimplifiedCommon(atlas);
  ranges = new Uint16Array(pairs.length + 1);
  ranges.set(pairs);
  font = ImGui.ImFontAtlas_AddFontFromFileTTF(
    atlas,
    path,
    20,
    null,
    ranges
  );
  if (!font || !SFML.UpdateFontTexture()) {
    throw new Error('Font loading failed');
  }
}
```

Call `loadFont('/absolute/path/to/cjk-font.ttf')` once after initialization. The range helpers return inclusive start/end pairs **without the native zero terminator**. The extra zero-initialized array entry is required. Keep that array alive until the atlas finishes building; retaining it alongside the font also permits later rebuilds.

`ImGui.GetIO()` returns the native handle accepted by `getFontAtlas`. `SFML.GetIO()` returns a convenient field view and cannot replace that handle. Font-file loading here is synchronous; perform it during setup. Do not modify the atlas between `SFML.Update` and `SFML.Render`.

## Select the loaded font

Inside each frame, surround the desired controls with a font push and pop:

```js
ImGui.PushFont(font);
try {
  if (ImGui.Begin('Font preview')) {
    ImGui.TextUnformatted('场景设置');
    ImGui.TextUnformatted('Player speed: 1.0');
  }
  ImGui.End();
} finally {
  ImGui.PopFont();
}
```

Place this after `Update` and before drawing/rendering, in place of `drawControls()` in the quick-start loop. The Chinese label should display real glyphs, while Latin text remains readable. Loading a font into the atlas alone does not select it for every widget; `PushFont` makes that selection explicit.

Use `getGlyphRangesJapanese`, `getGlyphRangesKorean`, or `getGlyphRangesChineseFull` when needed. Each still requires a trailing zero and a matching font file. Full Chinese coverage increases atlas size and build work; choose the smallest ranges that cover your actual UI. Ranges select characters; they do not translate labels or install fonts.

## Set global spacing and colors

Run this after initialization to set persistent style defaults:

```js
const { getStyleColors } = require('sfml.js-imgui');
const style = SFML.GetStyle();
style.windowPaddingX = 12;
style.windowPaddingY = 12;
style.itemSpacingX = 8;
style.itemSpacingY = 8;
style.frameRounding = 4;

const colors = getStyleColors(ImGui.GetStyle());
colors.set([ 0.20, 0.55, 0.70, 1 ], ImGui.ImGuiCol.Button * 4);
```

Colors are consecutive RGBA floats, four per `ImGuiCol` entry, with values from zero to one. These are live views: assignments modify native state immediately. Cache them only while their context remains valid.

For a temporary change, push a style value around the affected controls and pop it afterward:

```js
ImGui.PushStyleVar(ImGui.ImGuiStyleVar.FrameRounding, 8);
try {
  ImGui.Button('Rounded action');
} finally {
  ImGui.PopStyleVar();
}
```

Use the correct overload: `PushStyleVar` takes a scalar, while `PushStyleVarVec2` takes a two-component value. Do not repeatedly multiply global style sizes each frame. For DPI changes, derive sizes from a stable baseline, choose an appropriate font pixel size, and rebuild the font texture outside an active frame. Increasing `fontGlobalScale` enlarges an existing atlas and can soften its text.

## Diagnose font and style problems

| Symptom | Likely cause |
| --- | --- |
| Characters are boxes | The font lacks the glyphs, or they were not included in the atlas ranges. |
| Font loads but the UI looks unchanged | The loaded font was not selected with `PushFont`. |
| Font build fails | Invalid file, incomplete ranges, missing terminator or an excessively large atlas. |
| Blurry text after scaling | The atlas was rasterized at too small a size for the displayed scale. |
| Style changes affect unrelated controls | A push was not popped, or a global view was edited instead of a local override. |
| Crash after closing a window | A cached font/style handle outlived its owning context. |

API: [getFontAtlas](/reference/imgui/functions/getFontAtlas.html), [getGlyphRangesChineseSimplifiedCommon](/reference/imgui/functions/getGlyphRangesChineseSimplifiedCommon.html), [UpdateFontTexture](/reference/imgui/functions/SFML.UpdateFontTexture.html), [getStyleColors](/reference/imgui/functions/getStyleColors.html).
