# 字体与样式

加载工具所需字符，再调整间距与颜色，并明确原生资源的所有权。完整[工作台](../../packages/sfml.js-imgui/examples/workbench.cjs)接受可选字体文件：

```sh
node packages/sfml.js-imgui/examples/workbench.cjs /absolute/path/to/font.ttf
```

将路径替换为已有 TTF 文件。此命令使用默认拉丁字形范围，以 20 px 显示工作台。包不提供字体文件。中文、日文和韩文需要相应字形范围，以及实际包含这些字符的字体。

## 在首帧前加载 CJK 字体

在[快速开始](getting-started.zh-CN.md)的导入之后加入以下顶层辅助函数。加载操作放在 `SFML.Init(window)` 成功后、进入循环前。`font` 和 `ranges` 保留在应用作用域，供后续帧访问并维持字形范围存储：

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

初始化后调用一次 `loadFont('/absolute/path/to/cjk-font.ttf')`。字形辅助函数返回包含端点的起止范围对，**不含原生终止零值**。新增的零初始化元素不可省略。数组至少保留到图集构建结束，与字体一起保留也便于后续重建。

`getFontAtlas` 接收 `ImGui.GetIO()` 返回的原生句柄；`SFML.GetIO()` 返回便捷字段视图，不能替代。这里的字体文件加载是同步操作，应在初始化阶段完成。不要在 `SFML.Update` 与 `SFML.Render` 之间修改图集。

## 选择已加载字体

每帧在需要的控件外配对 PushFont 和 PopFont：

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

用此代码替换快速开始循环内的 `drawControls()`，位于 Update 后、绘制与 Render 前。中文应显示为真实字形，拉丁文本保持可读。把字体加入图集不会自动为所有控件选中它，PushFont 明确完成选择。

按需选择 `getGlyphRangesJapanese`、`getGlyphRangesKorean` 或 `getGlyphRangesChineseFull`，同样需要末尾零值与匹配字体。完整中文范围增加图集体积和构建开销，应选择覆盖实际 UI 的最小范围。字形范围不会翻译标签，也不会安装字体。

## 设置全局间距与颜色

初始化后设置持久样式：

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

每个 `ImGuiCol` 对应连续四个 RGBA 浮点数，范围 0–1。这些是实时视图，赋值直接修改原生状态；缓存不得超过所属上下文的有效期。

局部样式通过 Push/Pop 限定范围：

```js
ImGui.PushStyleVar(ImGui.ImGuiStyleVar.FrameRounding, 8);
try {
  ImGui.Button('Rounded action');
} finally {
  ImGui.PopStyleVar();
}
```

`PushStyleVar` 接收标量，`PushStyleVarVec2` 接收二维值。不要每帧重复乘以全局缩放系数。DPI 变化时从稳定基准推导尺寸，选择合适的字体像素大小，在活动帧之外重建纹理。增大 `fontGlobalScale` 会放大现有图集，可能使文字变模糊。

## 排查字体与样式

| 现象 | 常见原因 |
| --- | --- |
| 显示方框 | 字体本身缺字，或字形未纳入图集范围。 |
| 加载后没有变化 | 没有通过 PushFont 选择该字体。 |
| 图集构建失败 | 文件无效、范围不完整、缺少终止零值或图集过大。 |
| 缩放后模糊 | 栅格化字号小于实际显示需求。 |
| 样式影响了其他控件 | Push 未配对 Pop，或误改全局样式。 |
| 关闭窗口后崩溃 | 缓存字体、样式句柄超过上下文生命周期。 |

API：[getFontAtlas](/reference/imgui/functions/getFontAtlas.html)、[getGlyphRangesChineseSimplifiedCommon](/reference/imgui/functions/getGlyphRangesChineseSimplifiedCommon.html)、[UpdateFontTexture](/reference/imgui/functions/SFML.UpdateFontTexture.html)、[getStyleColors](/reference/imgui/functions/getStyleColors.html)。
