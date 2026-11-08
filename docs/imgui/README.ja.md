# ImGui ガイド

sfml.js-imgui で SFML ウィンドウにデバッグパネル、シーンインスペクター、ネイティブ編集ツールを作ります。最初のフレームループから、状態編集、テーブル、テキスト入力、フォント、独自描画へ進みます。

現在のソースは Dear ImGui 1.91.9b と imgui-sfml 3.0 を対象とし、サンプルは JavaScript と SFML 3.1 API を使います。JavaScript と [SFML ウィンドウ](../sfml/window.ja.md)の基礎が必要で、C++ は不要です。

## 学習の順序

| 章 | 作るもの・学ぶこと |
| --- | --- |
| [クイックスタート](getting-started.ja.md) | 完全なカウンター、フレーム、入力キャプチャ、安全な終了 |
| [ウィジェットと状態](widgets.ja.md) | 永続状態、固有 ID、リアルタイムのシーン編集 |
| [レイアウト](layout.ja.md) | テーブル、メニュー、確認モーダル、スコープの対応 |
| [入力とコールバック](callbacks.ja.md) | UTF-8 編集、契約、リスト getter、プロット |
| [フォントとスタイル](fonts.ja.md) | アトラス、CJK、間隔、色、DPI |
| [描画と複数ウィンドウ](rendering.ja.md) | シーン合成、描画リスト、ウィンドウ別の所有権 |
| [API ガイド](api.ja.md) | 正確なシグネチャ、オーバーロード、寿命の確認 |

実践章は完全な実行可能ソースにリンクし、短いコードの配置場所と期待結果も説明します。英語、中国語、日本語、韓国語を提供します。

## サンプルを選ぶ

monorepo のルートで bootstrap を一度実行してから起動します。

```sh
node tools/bootstrap.cjs
node packages/sfml.js-imgui/examples/demo.cjs
```

- [ウィジェットデモ](../../packages/sfml.js-imgui/examples/README.ja.md#demo)：Dear ImGui 標準のコントロールとレイアウト。
- [シーンインスペクター](../../packages/sfml.js-imgui/examples/README.ja.md#scene-inspector)：動く円のサイズ、色、速度を編集。
- [workbench](../../packages/sfml.js-imgui/examples/README.ja.md#workbench)：入力、選択、テーブル、モーダル、時間プロットを組み合わせる。

## パッケージの役割

ImGui はコントロール、列挙値、コールバック、ネイティブハンドル操作を提供します。SFML はウィンドウ連携、イベント転送、フレーム送信を担当します。getFontAtlas や getStyleColors はトップレベルのエクスポートです。

アプリケーション値は JavaScript 所有で、書き込み可能なネイティブスカラーには型付き配列を使います。IO、スタイル、フォント、描画リストはネイティブ所有者と有効期間を持ちます。各章で境界を説明し、正確な契約は [API リファレンス](/reference/imgui/)で確認できます。
