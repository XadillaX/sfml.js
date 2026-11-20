# RmlUi ガイド

<p><a class="library-brand" href="https://mikke89.github.io/RmlUiDoc/"><img src="assets/rmlui.png" width="246" height="84" alt="RmlUi"></a></p>

`sfml.js-rmlui` で SFML ウィンドウ内に文書ベースの UI を構築します。RML が要素ツリーを、RCSS が外観を定義し、JavaScript がアプリケーション状態とイベント処理を管理します。現在のソースは RmlUi 6.3 と SFML 3.1 を対象としています。

JavaScript と [SFML ウィンドウ](../sfml/window.ja.md)の基礎が前提です。RmlUi 6.3 は HTML/CSS に似ていますが、ブラウザーを組み込んでいません。[ネイティブデータモデル](data-models.ja.md)はスカラーとコールバック、再帰レコードと配列、独自変数、共有数値領域と部分更新を扱います。以下のガイドはランタイム、文書ツリー、スタイル、描画、入力、フォント、スクリプト、リソース所有権を説明し、[API リファレンス](/reference/rmlui/)は TypeScript の契約を示します。

## RmlUi とは

[RmlUi](https://github.com/mikke89/RmlUi) は、HTML/CSS に似た文書構文を使う C++ UI ライブラリです。RML を一度読み込むと永続的な要素ツリーを作り、RCSS で装飾し、アプリケーション状態の変化に応じて個々の要素を更新します。RmlUi がレイアウトとジオメトリの生成を行い、本パッケージが SFML で描画します。

ゲームメニュー、HUD、インベントリ、レイアウトと外観を別の素材ファイルで管理する UI に適しています。RML、RCSS、Node.js のイベント処理が連携し、ブラウザー DOM や Web の JavaScript 環境は使いません。毎フレームのウィジェット呼び出しで構築するツールには [ImGui ガイド](../imgui/README.ja.md)を参照してください。

[公式ドキュメント](https://mikke89.github.io/RmlUiDoc/) · [公式リポジトリ](https://github.com/mikke89/RmlUi)

## ガイド一覧

### 入門と文書

| 章 | 内容 |
| --- | --- |
| [クイックスタート](getting-started.ja.md) | カウンターを実行し、初期化、フォント、フレーム順序を理解 |
| [RML と RCSS の基礎](rml-rcss.ja.md) | マークアップ、セレクター、レイアウト、クリック処理、公式構文リファレンス |
| [文書とイベント](documents.ja.md) | RML の読み込み、要素編集、リスナー登録、ネイティブオブジェクトの解放 |
| [バイトストリーム](streams.ja.md) | ファイル、メモリ、コールバックストリームの読み込みと有効期間 |
| [文字列とリソース URL](strings.ja.md) | 文字列処理、リソースパスと URL |

### 要素、レイアウトとコントロール

| 章 | 内容 |
| --- | --- |
| [要素のクラス、属性とフォーカス](element-state.ja.md) | 要素の状態、クラスとフォーカスを変更 |
| [要素ユーティリティ](element-utilities.ja.md) | 位置指定、テキスト測定、投影境界とクリップジオメトリ |
| [レイアウト、スクロールと投影](layout.ja.md) | レイアウト寸法、スクロール位置と座標投影 |
| [ボックスと描画ボックス](boxes.ja.md) | ボックスモデルの値と描画ボックス |
| [フォームコントロール](controls.ja.md) | 入力、選択コントロールとフォーム操作 |
| [テキスト、進捗バーとタブ](text-panels.ja.md) | テキスト要素、進捗表示とタブ |
| [SVG と Lottie](vector-elements.ja.md) | Native ベクター要素、デコレーター、フレームとソース |
| [ネイティブ型と既定の動作](rtti-default-actions.ja.md) | 要素型の識別と既定のイベント動作 |

### スタイル、アニメーションと描画

| 章 | 内容 |
| --- | --- |
| [数値と単位](numeric-values.ja.md) | 型付き数値、単位と変換 |
| [型付きプロパティ](properties.ja.md) | プロパティの定義、解析と型付き値 |
| [アニメーションとイージング](animation.ja.md) | 要素アニメーション、キーフレームとイージング |
| [ジオメトリと畳み込み](geometry-utilities.ja.md) | メッシュの一括生成と共有アルファ領域のフィルター |
| [描画リソース](resources.ja.md) | テクスチャ、シェーダー、フィルターと Factory リソース |
| [描画状態](render-state.ja.md) | クリップ、レイヤー、コールバックテクスチャと状態復元 |
| [描画と Retina](rendering.ja.md) | SFML との合成、高密度表示、エフェクトの対応範囲 |

### ランタイムと拡張

| 章 | 内容 |
| --- | --- |
| [プラグイン](plugins.ja.md) | プラグイン登録とランタイムコールバック |
| [文書スクリプト](scripts.ja.md) | Node.js と Lua の文書スクリプト |
| [ネイティブデータモデル](data-models.ja.md) | バインディング、式、共有配列と部分更新 |
| [フォント](fonts.ja.md) | フォントエンジン、シェーピングとグリフアトラス |
| [ネイティブ Debugger](debugger.ja.md) | 別ホストで要素、ログ、データモデルを検査 |
| [共有領域とバッチ処理](performance.ja.md) | 数値コマンド、まとめた JS 計算、リソースの準備 |
| [ソース構成](source-layout.ja.md) | Native バインディング、TypeScript インターフェースとツール |
| [API ガイド](api.ja.md) | 型、既定値、戻り値、有効期間の契約 |

ガイドとソースから生成する API リファレンスは、英語、簡体字中国語、日本語、韓国語で保守しています。

## サンプルを実行

monorepo のルートで実行します。

```sh
node tools/bootstrap.cjs
node packages/sfml.js-rmlui/examples/demo.cjs
node packages/sfml.js-rmlui/examples/official.cjs variables
```

[サンプル一覧](../../packages/sfml.js-rmlui/examples/README.ja.md)に画面、操作方法、ソースリンクがあります。カウンターの Increment は動作しますが、variables のミッションボタンはホバースタイルのみです。

## 所有権の境界

プロセス全体のランタイムは 1 つの `RenderWindow` に接続し、初期化した Node.js 環境とスレッドに属します。コンテキスト、文書、フォント、描画リソースを管理します。ラッパーはネイティブの有効性を共有します。JS 参照は所有権付き未接続ツリーを保持し、接続済み要素の寿命は親が管理します。破棄時にリスナーを自動解放し、無効なラッパーの使用は例外になります。SFML ウィンドウを閉じる前に RmlUi を終了してください。遅延破棄と Worker の制約は[ネイティブの有効期間](documents.ja.md#ネイティブの有効期間)を参照してください。
