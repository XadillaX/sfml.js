# ImGui API ガイド

目的別ガイドで使い方を学んだ後、[API リファレンス](/reference/imgui/)で引数や戻り値を確認します。一覧の概要で操作を探し、詳細ページで使用上の注意、パラメーター、戻り値、ネイティブリソースの寿命を読みます。

## 名前空間を選ぶ

| 目的 | 入口 | ガイド |
| --- | --- | --- |
| ウィンドウ連携 | SFML.Init、ProcessEvent、Update、Render、Shutdown | [開始](getting-started.ja.md) |
| コントロール宣言 | ImGui.Button、Checkbox、SliderFloatEx | [状態](widgets.ja.md) |
| パネル構成 | BeginChild、BeginTable、メニュー、ポップアップ | [レイアウト](layout.ja.md) |
| UTF-8 とコールバック | InputTextEx、ListBoxCallbackEx、PlotLinesCallbackEx | [入力](callbacks.ja.md) |
| フォントとスタイル | getFontAtlas、getStyleColors、SFML.GetStyle | [フォント](fonts.ja.md) |
| 図形とウィンドウ切り替え | ImGui.GetWindowDrawList、SFML.SetCurrentWindow | [描画](rendering.ja.md) |

## JavaScript の契約として読む

[SliderFloatEx](/reference/imgui/functions/ImGui.SliderFloatEx.html)は書き込み可能な Float32Array、上下限、書式、フラグを受け取ります。boolean は編集の発生で、値は配列にあります。ネイティブの引数名によって JavaScript 数値が書き込み先になるわけではありません。

Button は既定サイズ、ButtonEx はサイズ指定です。PushStyleVar はスカラー、PushStyleVarVec2 はベクトルです。Ex が常にコールバックを意味するとは限らず、シグネチャを確認します。

ImVec2Like は `[ x, y ]` や `{ x, y }` などの値を受け取ります。編集用数値ポインターには指定された型付き配列が必要です。ImGuiInputTextCallbackData などの構造体ハンドルは、バインディングが返す型付きの不透明オブジェクトです。テクスチャ ID と生ポインター引数は bigint であり、構造体ハンドルとは交換できません。推測したアドレスで作らないでください。

ImGui.GetIO/GetStyle はネイティブハンドル、SFML.GetIO/GetStyle は現在のウィンドウの便利な書き込みビューです。ハンドルを要求するヘルパーにビューを渡せません。

## 呼び出し前の確認

1. 初期化済みコンテキスト、活動フレーム、可視の親が必要か。
2. 引数はコピー、直接変更、借用のどれか。
3. null は閉じるボタンなどの機能を無効にするか。
4. boolean は操作、変更、選択、可視性のどれか。
5. 対応する End/Pop とその条件は何か。
6. 戻されたハンドルやビューはいつまで有効か。

TypeScript の補完と実装調査には[公開エクスポート](../../packages/sfml.js-imgui/src/index.ts)、[SFML 連携](../../packages/sfml.js-imgui/src/sfml.ts)、[ImGui モジュール](../../packages/sfml.js-imgui/src/imgui/index.ts)を参照します。

説明は宣言の隣で英・中・日・韓の概要と詳細を管理し、TypeDoc が直接読み取ります。問題報告には関数、言語、期待する JavaScript 呼び出し、実際の結果を含めてください。
