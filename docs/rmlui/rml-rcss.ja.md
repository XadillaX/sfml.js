# RML と RCSS の基礎

RML は文書の要素を定義し、RCSS はセレクターで要素のレイアウトと外観を指定します。JavaScript は文書を読み込み、アプリケーション状態と接続します。本章は[カウンターサンプル](../../packages/sfml.js-rmlui/examples/README.ja.md#demo)を使います。先に[クイックスタート](getting-started.ja.md)を実行してください。

## 3 つのファイル

| ファイル | 役割 |
| --- | --- |
| [tutorial.rml](../../packages/sfml.js-rmlui/examples/assets/tutorial.rml) | 要素ツリー、ID、テキスト、スタイルシートへのリンク |
| [tutorial.rcss](../../packages/sfml.js-rmlui/examples/assets/tutorial.rcss) | レイアウト、フォント、色、ホバー状態 |
| [demo.cjs](../../packages/sfml.js-rmlui/examples/demo.cjs) | ウィンドウ、フォント、文書の読み込み、入力、クリック処理、フレームループ |

## 文書を書く

以下は `tutorial.rml` の簡略版です。`demo.cjs` が使う ID を残しているので、既存のランチャーと次のスタイルシートで試せます。

```xml
<rml>
  <head>
    <title>Counter</title>
    <link type="text/rcss" href="tutorial.rcss" />
  </head>
  <body>
    <div id="window">
      <div id="title">My counter</div>
      <div id="counter" class="muted">Clicks: 0</div>
      <button id="increment">Increment</button>
    </div>
  </body>
</rml>
```

`<rml>` がルート、`<head>` が文書のリソース、`<body>` が表示する UI です。スタイルシートのパスは RML ファイルを基準に解決します。タグを対応する終了タグで閉じ、属性値を引用符で囲み、空要素は `<link />` のように書きます。文字としての `&` と `<` は `&amp;` と `&lt;` にします。

`id` は個々の要素を検索・装飾する識別子です。`class` は共通スタイルを適用するグループで、複数のクラス名は空白で区切ります。RML は任意のタグにブラウザーの既定の見た目を与えません。特に `div` をブロック配置するには `display: block` が必要です。

## RCSS で装飾する

RML と同じディレクトリの `tutorial.rcss` に以下を書きます。ランチャーは文書の読み込み前に LatoLatin の通常・太字フォントを読み込んでいます。

```css
body {
  width: 100%;
  height: 100%;
  font-family: LatoLatin;
  font-size: 16dp;
  color: #f5f7fa;
  background: #1d2430;
}

div {
  display: block;
}

#window {
  width: 480dp;
  margin: auto;
  padding: 24dp;
  box-sizing: border-box;
  background: #2b3446;
  border: 1dp #46546e;
}

#title {
  font-size: 22dp;
  font-weight: bold;
  margin-bottom: 12dp;
}

.muted {
  color: #8fd3ff;
  margin-bottom: 18dp;
}

button {
  display: inline-block;
  padding: 10dp 24dp;
  background: #e84c88;
}

button:hover {
  background: #ff6aa2;
}
```

| セレクター | 対象 |
| --- | --- |
| `button` | すべてのボタン要素 |
| `#window` | `id="window"` の要素 |
| `.muted` | `muted` クラスを持つ要素 |
| `#window button` | `#window` 内の子孫ボタン |
| `button:hover` | ポインターが重なったボタン |

`margin` はボックスの外側、`padding` は内容と枠線の間の余白です。`box-sizing: border-box` は指定幅に内側余白と枠線を含めます。フォントと文字色は親から継承し、より具体的なセレクターで一般的なルールを上書きできます。ホバースタイルは外観だけを変えるため、クリック動作にはリスナーが必要です。

固定の UI サイズとフォントには `dp` を使います。密度比 2 では `16dp` が描画上の 32 ピクセルになり、論理サイズを維持します。`px` は描画ピクセル、`%` の基準寸法はプロパティによって異なります。バインディングがコンテキストの密度比を初期化します。[Retina の寸法](rendering.ja.md)も参照してください。`font-family` はファイル名ではなく、読み込んだフォントの内部ファミリー名に合わせます。

RCSS の対応プロパティはブラウザー CSS と同一ではありません。例えば枠線の短縮形は `border: 1dp #46546e` です。Flexbox、テンプレート、デコレーターについては上流の専用ページを参照してください。

## クリックを状態につなぐ

ランチャーは文書の読み込み後に要素を取得し、フレームループの外で一度だけリスナーを登録します。

```js
const counter = document.getElementById('counter');
const button = document.getElementById('increment');

if (!counter || !button) {
  throw new Error('Counter elements are missing');
}

let clicks = 0;

function increment() {
  clicks += 1;
  counter.innerRML = `Clicks: ${clicks}`;
}

button.addEventListener('click', increment);
```

フレームループは SFML イベントを `context.processEvent` に渡し、`update` と `render` を呼びます。クリックで既存の要素を更新し、次のフレームに表示します。`innerRML` はマークアップを解析するため、信頼できないテキストは代入前にエスケープしてください。本パッケージは RML 内の `<script>` やインライン `onclick` の JavaScript を実行しません。

文書をアンロードする前に、同じ関数で `button.removeEventListener('click', increment)` を呼びます。検索、クラスの変更、ネイティブオブジェクトの寿命は[文書とイベント](documents.ja.md)で説明します。

## 編集を試す

タイトル、`.muted` の色、ボタンの内側余白を変更し、monorepo のルートで再起動します。

```sh
node packages/sfml.js-rmlui/examples/demo.cjs
```

RML と RCSS の編集にはネイティブの再ビルドは不要です。ランチャーは起動時に読み込み、ファイル変更を監視しません。簡略版にはタイトル、カウンター、ボタンが表示され、Increment を押すと値が 1 増えます。

## 公式構文リファレンス

- [RML マニュアル](https://mikke89.github.io/RmlUiDoc/pages/rml.html)：[構文](https://mikke89.github.io/RmlUiDoc/pages/rml/syntax.html)、[要素一覧](https://mikke89.github.io/RmlUiDoc/pages/rml/element_index.html)、[テンプレート](https://mikke89.github.io/RmlUiDoc/pages/rml/templates.html)。
- [RCSS マニュアル](https://mikke89.github.io/RmlUiDoc/pages/rcss.html)：[構文と単位](https://mikke89.github.io/RmlUiDoc/pages/rcss/syntax.html)、[セレクター](https://mikke89.github.io/RmlUiDoc/pages/rcss/selectors.html)、[プロパティ一覧](https://mikke89.github.io/RmlUiDoc/pages/rcss/property_index.html)。
- [基本要素のスタイルガイド](https://mikke89.github.io/RmlUiDoc/pages/style_guide.html)と [Flexbox](https://mikke89.github.io/RmlUiDoc/pages/rcss/flexboxes.html)。

上流のオンラインマニュアルは開発ブランチを対象にしています。本バインディングは RmlUi 6.3 の API と描画機能の一部を公開しています。機能を使う前に、[描画対応範囲](rendering.ja.md)と [API ガイド](api.ja.md)を確認してください。
