# sfml.js-rmlui

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語** · [한국어](README.ko.md)

[sfml.js](../sfml.js) 向けの [RmlUi](https://github.com/mikke89/RmlUi) 6.3 統合です。SFML 3.1 で描画し、RML 文書と RCSS スタイルで定義したネイティブ UI を JavaScript / TypeScript の処理に接続します。

[クイックスタート](../../docs/rmlui/getting-started.ja.md) · [サンプル](examples/README.ja.md) · [API リファレンス](https://sfml.js.org/ja/reference/rmlui/) · [sfml.js](../sfml.js/README.ja.md)

Native バインディングと TypeScript インターフェイスは機能別に配置しています。
モジュールとツールの配置は[ソース構成](../../docs/rmlui/source-layout.ja.md)を参照してください。

## 機能

- 外部ファイルまたはメモリから RML を読み込み、要素のクラス、属性、スタイル、マークアップを変更。
- JavaScript イベントリスナーの登録と RCSS テーマの実行時切り替え。
- [ネイティブ Debugger](../../docs/rmlui/debugger.ja.md) で要素、ログ、モデルを検査。ホストと対象は別々に指定可能。
- ジオメトリをネイティブメモリに保持し、SFML の頂点バッファ、テクスチャ、シェーダーで描画。
- ステンシルクリッピング、レイヤー合成、ぼかし、ドロップシャドウ。
- macOS Retina サーフェス、物理ピクセル入力、`dp` による密度非依存レイアウト。
- 英語、簡体字中国語、日本語、韓国語の API ドキュメント。

RmlUi は独自のマークアップとスタイル言語を実装します。[ネイティブデータモデル](../../docs/rmlui/data-models.ja.md)、[Node／Lua 文書スクリプト](../../docs/rmlui/scripts.ja.md)、Debugger、[SVG／Lottie 要素](../../docs/rmlui/vector-elements.ja.md)、ネイティブ [FreeType／HarfBuzz／ビットマップフォント](../../docs/rmlui/fonts.ja.md)を提供します。ブラウザー DOM API や任意のブラウザー CSS は使えません。グラデーション、画像マスク、色／背景フィルター、3D 変換は実装済みです。[描画対応](../../docs/rmlui/rendering.ja.md#renderer-coverage)を参照してください。

RmlUi の実行時テストは macOS、Linux、Windows で成功しています。ネイティブ
SFML／GL3 ピクセル比較テストは macOS で実行します。VisualTests 全体と
アプリケーションの検証範囲は[サンプルの検証説明](examples/README.ja.md#coverage-and-verification)を参照してください。

## ビルドと実行

以下は現在の monorepo ソースを使う手順です。Node.js、Python、C++20 ツールチェーン、画面、OpenGL については[動作要件](../../docs/sfml/getting-started.ja.md#requirements)を確認してください。

```sh
# From the monorepo root, install and build once.
node tools/bootstrap.cjs
cd packages/sfml.js-rmlui
npm run demo
npm run examples -- variables
npm run examples -- --list
```

準備済みの環境では `sfml.js-interop` と `sfml.js` を先にビルドし、本パッケージで `npm run build` を実行します。macOS では Xcode Command Line Tools と CMake が必要です。依存関係の準備には `sfml.js-interop/third_party` の SFML ソース／ビルドディレクトリと、バージョンが一致するパッチ済み Window ライブラリを再利用します。

## フレームのライフサイクル

| 段階 | 呼び出し | 契約 |
| --- | --- | --- |
| 初期化 | `initialise(window)` | 開いている `RenderWindow` 1 つをプロセス全体のランタイムに接続。 |
| 準備 | `loadFontFace`, `createContext`, `loadDocument`, `show` | 文書より先にフォントを読み込み、初期化後にサイズを取得。 |
| 入力 | `context.processEvent(event)` | SFML イベントを直接転送。false は処理済み。 |
| レイアウト | `context.update()` | レイアウト、アニメーション、表示密度を更新。 |
| 描画 | `window.clear`、シーン描画、`window.flush`、`context.render` | UI より先に保留中の SFML コマンドを送信。 |
| 表示 | `window.display()` | 完成したフレームを表示。 |
| 終了 | リスナー解除、`context.remove`、`shutdown`、`window.close` | ウィンドウが有効な間に RmlUi を解放。 |

RmlUi 6.3 の `update()` と `render()` は、空のコンテキストでも true を返します。レイアウトの変更や可視ジオメトリの有無を示す値ではありません。

## サンプル

![SFML ウィンドウ内の RmlUi テーマ](examples/screenshots/variables.png)

[カウンター](examples/README.ja.md#demo)の Increment ボタンは動作します。公式 [variables](examples/README.ja.md#variables) はテーマとホバースタイルを表示するサンプルで、ミッションボタンには上流でもクリック処理がありません。文書読み込み、テンプレート、ドラッグのチュートリアルと 113 個の VisualTests ページも開けます。

```sh
npm run examples -- drag
npm run examples -- template
npm run examples -- visual/clip_mask
```

## ドキュメントと検証

| ガイド | 内容 |
| --- | --- |
| [クイックスタート](../../docs/rmlui/getting-started.ja.md) | ビルド、リソース、フレームループ |
| [文書とイベント](../../docs/rmlui/documents.ja.md) | 要素の編集、リスナー、所有権 |
| [描画と Retina](../../docs/rmlui/rendering.ja.md) | 座標、`dp`、ステンシル、描画の対象範囲 |
| [フォント](../../docs/rmlui/fonts.ja.md) | ネイティブエンジン、シェーピング、アトラス制約と機能確認 |
| [API ガイド](../../docs/rmlui/api.ja.md) | シグネチャ、既定値、戻り値 |

`npm test` で lint、ネイティブ／TypeScript ビルド、型検査、実行時回帰を確認します。macOS の `npm --prefix ../sfml.js-interop run test:high-dpi` はサーフェス、ピクセルキャプチャ、カーソル座標を検証します。物理モニター間の移動は実機検証が必要です。

## ライセンス

[MIT](../sfml.js/LICENSE)。
