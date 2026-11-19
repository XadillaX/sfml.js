# RmlUi クイックスタート

完全な[カウンターソース](../../packages/sfml.js-rmlui/examples/demo.cjs)と [RML](../../packages/sfml.js-rmlui/examples/assets/tutorial.rml) / [RCSS](../../packages/sfml.js-rmlui/examples/assets/tutorial.rcss) を実行します。カウンター、Increment ボタン、ぼかし、角丸クリッピングが表示されます。

## ワークスペースの準備

[動作要件](../sfml/getting-started.ja.md#requirements)に従い、C++20 ネイティブツールチェーン、Python、画面、OpenGL を用意します。macOS ではパッチ済み SFML Window ライブラリ用に Xcode Command Line Tools と CMake も必要です。

```sh
# From the monorepo root.
node tools/bootstrap.cjs
cd packages/sfml.js-rmlui
npm run demo
```

Bootstrap は依存順にインストールとビルドを行う初回設定です。本パッケージの変更後は `npm run build`、TypeScript のみの変更後は `npm run build:ts` を使います。npm 公開済みバージョンの存在を前提とせず、ローカルソースを使う手順です。

ソースパッケージはネイティブビルド用スクリプトを同梱します。明示的な npm `install`
フックは依存関係とネイティブ宣言を準備してから、バインディングと両方の原版 Invaders
モジュールを構成・ビルドし、既存の `build/` を再利用します。リポジトリの LSP 統合は
所属する Rush ワークスペース内だけで実行します。同梱 JavaScript／型を使うため、
インストールに TypeScript コンパイラーは不要です。`npm run test:package` は実際の
npm ファイル一覧とビルドスクリプトの依存関係を確認します。

[VS Code 拡張](../../packages/sfmljs-rmlui-vscode/README.ja.md)は言語サーバーを同梱し、
RML／RCSS の補完、診断、ホバー説明、色プレビューを提供します。

## 初期化とリソース

カウンターは `settings.stencilBits: 8` で `RenderWindow` を作り、`initialise(window)` を確認し、同梱 LatoLatin の標準／太字を読み込みます。その後 `window.getSize()` でコンテキストを作ります。フォントは同期的に読み込まれるため、文書より先に完了させます。RCSS の `font-family` はフォント内部の名前に合わせます。

```js
if (!rmlui.initialise(window)) {
  throw new Error('RmlUi initialisation failed');
}

const size = window.getSize();
const context = rmlui.createContext('main', size.x, size.y);
```

この断片はカウンターのウィンドウ作成後に置きます。macOS では Retina サーフェスが有効になる場合があるため、サイズは初期化**後**に読みます。`loadDocument` の文書は最初は非表示なので、`document.show()` が必要です。

## システムインターフェースと時刻

`getSystemInterface()` は選択済みのネイティブ参照を返します。
未選択または終了後は `null` です。カスタマイズする場合は `initialise` の前に
`SystemInterface(window, callbacks)` を作成し、`setSystemInterface(system)` で
選択します。省略したコールバックは SFML／上流の動作を使用します。
八つの任意メソッドは翻訳、リソースパス、ログ、カーソル、クリップボード、
キーボードを処理します。

```js
const system = new rmlui.SystemInterface(window, {
  translateString(input) {
    return { value: input, translations: 0 };
  },
});

rmlui.setSystemInterface(system);
rmlui.initialise(window);

// Before each update, optionally drive native animations with application time.
system.clock[0] = elapsedSeconds;
context.update();
// Restore the native SFML clock.
system.clock[0] = NaN;
```

`clock` はネイティブ所有の 1 要素 `Float64Array` です。時刻の取得に JS
コールバックや Addon 呼び出しは不要です。入力は有限かつ非負の秒数で、
初期値の `NaN` は SFML 時計を使います。コールバックは同期実行し、`this` は
コールバックオブジェクトです。他の RmlUi API への再入と初期化後の設定変更は
拒否します。終了時にネイティブ参照とコールバックを解放し、未使用の設定も
無効化します。取得済みの時刻バッファは引き続き読み取れます。

## アプリケーションログ

`Log.message(type, format, ...values)` と
`Log.parseError(filename, line, format, ...values)` は 1 回の Addon 呼び出しで
整形し、ネイティブ `Rml::Log` に配信します。選択済みの
`SystemInterface.logMessage` は最終レベルと文字列を受け取ります。
初期化前にも利用できます。

```js
rmlui.Log.message(rmlui.LogType.Info, '%s: %d', 'loaded documents', 3);
rmlui.Log.parseError('panel.rml', 12, 'Unexpected %s', 'tag');
```

整形は [文字列ガイド](strings.ja.md) の検証済みスカラー規則に従います。
ログは最大 1,021 UTF-8 バイトを保持し、NUL で終端します。`parseError` は
メッセージを切り詰めた後、ファイル名と行番号を付けた結果も切り詰めます。
負の行番号なら行番号を省略します。戻り値は `void` で、ネイティブ `Rml::Log`
はログコールバックの真偽値を無視します。例外は伝播し、コールバックへの
再入と別のランタイム環境からの呼び出しは拒否されます。

## ファイル API

`FileInterface(root)` はルート付きパスを先に試します。`FileCallbacks` を渡すと
カスタムリソースのバイトを提供できます。初期化前に `setFileInterface` で選択し、
`getFileInterface()` で取得します。未選択なら Native のファイルシステムを使います。
明示した `fileRoot` は選択済みのファイルシステム API と一致する必要があります。

```js
const resources = new Map([
  ['virtual.rml', Buffer.from('<rml><body><p>Ready</p></body></rml>')],
]);
const files = new rmlui.FileInterface({
  open(path) {
    return resources.get(path) ?? null;
  },
});

rmlui.setFileInterface(files);
rmlui.initialise(window);
const document = context.loadDocument('virtual.rml');
```

open の配列は Native 所有のコピーとなり、read、seek、tell、length は Native で
実行します。既存の `StreamMemory` やカスタム `Stream` も使えます。
この API を使う `StreamFile` は返せません。任意のコールバックで七つの
仮想メソッドを実装でき、`this` を保持します。同期実行で再入は禁止です。

`files.open(path)` は検査済みの `FileHandle` または null を返します。同じ API で
`read(output, size, file)`、seek、tell、length、close を実行してください。
`loadFile` はバイトのコピーか null、空ファイルでは空配列を返します。
shutdown は開いたファイルを閉じ、すべての API とトークンを無効化します。
カスタムの事前読み込みは所有スレッドでバイトを一度取得し、画像のデコードと
アルファ変換をワーカーで行います。ファイルシステムの読み込みもワーカーです。

## 描画インターフェースの選択

`getRenderInterface()` は実際に選択した Native インターフェースを返し、未選択や
shutdown 後は `null` になります。SFML 描画器は初期化の前後に作成できます。
`initialise` の前に `setRenderInterface(renderer)` で既定の描画器を選択し、
`null` で自動選択に戻します。

```js
const renderer = rmlui.createRenderInterface(renderWindow);

rmlui.setRenderInterface(renderer);
rmlui.initialise(systemWindow);
const context = rmlui.createContext('ui', 800, 600);
```

初期化は選択を保持します。コンテキストは選択した描画ウィンドウを使い、
初期化ウィンドウはシステム時刻・入力・DPI を提供します。`createContext` に
別の描画器を明示すると独立したリソースキャッシュを使います。選択済み、または
Native 管理器や事前読み込みで使われた描画器は shutdown までウィンドウを保持し、
未使用の描画器は回収できます。使用中のウィンドウは shutdown まで開いてください。
描画とジオメトリ処理は Native のままで、既存のバッチ処理と描画コピーを保持します。

## 各フレーム

カウンターはすべてのイベントを転送し、ネイティブの閉じるイベントでループを停止します。更新と描画の順序は次のとおりです。

```js
context.update();
window.clear(sfml.Color.Black);
// Set your scene view with window.setView(sceneView), then draw the scene.
window.flush();
context.render();
window.display();
```

ループ停止と RmlUi 終了までウィンドウを開いたままにします。サイズ変更は `processEvent` が処理します。アプリケーションが別のコンテキストサイズを選ぶ場合は `setDimensions` を使えます。

## クリックと解放

カウンターは名前付き関数 `increment` を登録と解除に使います。Increment を押すと JavaScript の状態と `counter.innerRML` が変わります。終了時はリスナー解除、文書アンロード、コンテキスト削除、`shutdown()`、ウィンドウを閉じる処理の順です。

| 症状 | 確認項目 |
| --- | --- |
| ネイティブモジュールやフォントがない | Bootstrap を完了し、ローカルのサンプル素材を使用。 |
| 文字が出ない | `loadFontFace` の結果と RCSS のフォント名を確認。 |
| 文書が見えない | `show`、`update`、`render` の順序を確認。 |
| クリックに反応しない | イベント転送とハンドラー登録を確認。variables のミッションボタンには処理がありません。 |
| 文字が小さい、ぼやける | 初期化後のサイズと `dp` を使用。[Retina](rendering.ja.md) を参照。 |
| 終了時にクラッシュ | 所有者とウィンドウより先にリスナーを解放し、ラッパーの使用を終了。 |

次は[文書とイベント](documents.ja.md)です。
