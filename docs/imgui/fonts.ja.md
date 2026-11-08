# フォントとスタイル

必要な文字を読み込み、ネイティブ所有権を保ちながら余白と色を調整します。完全な [workbench](../../packages/sfml.js-imgui/examples/workbench.cjs) は任意のフォントパスを受け取ります。

```sh
node packages/sfml.js-imgui/examples/workbench.cjs /absolute/path/to/font.ttf
```

実在する TTF のパスに置き換えてください。このコマンドは既定のラテン文字範囲を 20 px で表示します。パッケージにフォントファイルは含まれません。中国語・日本語・韓国語には、それぞれの範囲と該当文字を含むフォントが必要です。

## 最初のフレーム前に CJK フォントを読む

[クイックスタート](getting-started.ja.md)に次のインポートを追加します。SFML.Init の成功後、ループの前に読み込みます。font と ranges はアプリケーションスコープで保持し、フレームからの参照と範囲配列の寿命を確保します。

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

初期化後に `loadFont('/absolute/path/to/cjk-font.ttf')` を一度呼びます。範囲ヘルパーは両端を含むペアを返しますが、**ネイティブの終端ゼロを含みません**。ゼロ初期化された追加要素が必要です。少なくともアトラス構築が終わるまで配列を保持し、後の再構築にも使うならフォントとともに保持します。

getFontAtlas は ImGui.GetIO のネイティブハンドルを受け取ります。SFML.GetIO の便利なフィールドビューで代用できません。このファイル読み込みは同期的なので初期化時に行い、Update と Render の間でアトラスを変更しません。

## 読み込んだフォントを選ぶ

毎フレーム、対象コントロールを PushFont と PopFont で囲みます。

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

クイックスタートの drawControls 呼び出しを置き換え、Update の後、描画・Render の前に実行します。この共通サンプルでは中国語とラテン文字が表示されます。アトラスへの追加だけでは全ウィジェットで選択されないため、PushFont で指定します。

日本語には getGlyphRangesJapanese、韓国語には getGlyphRangesKorean、広い中国語範囲には getGlyphRangesChineseFull を使えます。いずれも終端ゼロと対応するフォントが必要です。全中国語範囲はアトラスの容量と構築負荷を増やします。実際の UI を覆う最小範囲を選びます。範囲指定は翻訳やフォントのインストールではありません。

## 全体の間隔と色

初期化後に既定スタイルを設定します。

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

ImGuiCol ごとに連続した RGBA の四要素を使い、値は 0–1 です。代入はネイティブ状態へ即座に反映されます。コンテキストが有効な間だけビューを保持してください。

一時的な変更は Push/Pop で囲みます。

```js
ImGui.PushStyleVar(ImGui.ImGuiStyleVar.FrameRounding, 8);
try {
  ImGui.Button('Rounded action');
} finally {
  ImGui.PopStyleVar();
}
```

PushStyleVar はスカラー、PushStyleVarVec2 は二成分の値です。毎フレーム全体サイズに倍率を掛け続けないでください。DPI 変更時は一定の基準からサイズを求め、適切なフォント画素サイズを選び、活動フレームの外でテクスチャを再構築します。fontGlobalScale は既存アトラスを拡大するため文字がぼけることがあります。

## 問題の確認

| 症状 | 主な原因 |
| --- | --- |
| 文字が四角になる | フォントに字形がない、または範囲に含まれない |
| 読み込んでも変わらない | PushFont で選択していない |
| 構築が失敗する | 無効ファイル、不完全な範囲、終端不足、過大なアトラス |
| 拡大するとぼける | 表示に対して小さなサイズでラスタライズした |
| 他のコントロールにも影響する | Pop の不足、または全体スタイルを変更した |
| ウィンドウ終了後にクラッシュ | フォント・スタイルが所有コンテキストの寿命を超えた |

API：[getFontAtlas](/reference/imgui/functions/getFontAtlas.html)、[getGlyphRangesChineseSimplifiedCommon](/reference/imgui/functions/getGlyphRangesChineseSimplifiedCommon.html)、[UpdateFontTexture](/reference/imgui/functions/SFML.UpdateFontTexture.html)、[getStyleColors](/reference/imgui/functions/getStyleColors.html)。
