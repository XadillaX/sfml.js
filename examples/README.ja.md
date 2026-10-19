# サンプル

[English](README.md) / [简体中文](README.zh-CN.md) / **日本語** / [한국어](README.ko.md)

> このリポジトリのサンプルはルートディレクトリで実行します。初回実行前に `npm ci`、ソースコードの変更後に `npm run build` を実行してください。グラフィックスのサンプルには、利用可能なディスプレイサーバーと OpenGL コンテキストが必要です。

[プロジェクトトップ](../README.ja.md) · [クイックスタート](../docs/getting-started.ja.md) · [開発ガイド](../docs/development.ja.md)

## ここから始める

```sh
node examples/breakout.cjs
node examples/all-types.cjs --frames=120
node examples/render-texture.cjs --frames=120
node examples/network.cjs
```

ビルド済みの場合はスクリプトを直接実行してください。`npm run demo:*` は package.json に従って再ビルドします。グラフィックスの各入口が対応するフレーム数、フォントなどの引数は、それぞれのスクリプトを基準とします。

<a id="breakout"></a>

## ブロック崩しで遊ぶ

![ネイティブウィンドウで描画するブロック崩し](../assets/breakout.png)

[breakout.cjs](breakout.cjs) は衝突判定、3 つのライフ、スコア、勝敗判定を備えたゲームです。左右キーまたは A／D で移動、Space で発射または再開、P で一時停止、Esc で終了します。操作中にフォーカスを失うと一時停止します。

`npm run demo:breakout` でビルドして起動できます。macOS／Linux では次のコマンドで同じゲーム画面を撮影できます。

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-breakout.png \
  node examples/breakout.cjs --autoplay --frames=900
```

最後のフレームの実際の描画結果を保存します。`--autoplay` はパドルを自動操作し、`--frames` は実行フレーム数を制限します。`node examples/breakout.cjs --self-test` はウィンドウを開かずにゲームロジックを検証します。

## グラフィックスとウィンドウ

| ファイル | デモの内容 | npm コマンド |
| --- | --- | --- |
| [all-types.cjs](all-types.cjs) | 値型、変換、図形、頂点、テキストを組み合わせたシーン | `demo:types` |
| [sprites.cjs](sprites.cjs) | 大量のスプライトの描画 | `demo` |
| [image.cjs](image.cjs) | ピクセルの編集、コピー、マスク、エンコードとデコード | `demo:image` |
| [texture.cjs](texture.cjs) | 画像の読み込み、切り出し、部分アップロード、サンプリング | `demo:texture` |
| [sprite.cjs](sprite.cjs) | スプライトのアニメーション、反転、色、境界 | `demo:sprite` |
| [render-texture.cjs](render-texture.cjs) | オフスクリーン合成、テクスチャビュー、描画スナップショット | `demo:render-texture` |
| [drawable.cjs](drawable.cjs) | 独自の複合オブジェクト、親子の変換、ブレンド、ステンシル | `demo:drawable` |
| [vertex-array.cjs](vertex-array.cjs) | 動的なタイルと連続した頂点 | `demo:vertices` |
| [text.cjs](text.cjs) | テキストのレイアウトと頂点アニメーション | `demo:text` |
| [window.cjs](window.cjs) | ウィンドウイベント、カーソル、入力の診断 | `demo:window` |
| [system-window.cjs](system-window.cjs) | System と Window のインターフェース | `demo:system-window` |

継続的に描画するサンプルの多くは Esc で終了できます。`--frames=120` を渡すと実行時間を制限できます。text サンプルでは `--font=/path/to/font.ttf` と `--text=中文示例` でフォントとテキストを指定します。中国語には対応するグリフが必要です。

一部の診断用サンプルは、リポジトリ内部のプレビューや検証用ヘルパー関数を使います。アプリケーションの入門には、公開インターフェースだけを使う[クイックスタート](../docs/getting-started.ja.md)のウィンドウコードを利用してください。

## オーディオとネットワーク

| ファイル | デモの内容 |
| --- | --- |
| [audio.cjs](audio.cjs) | Sound、Music、Worker によるデータ供給、エフェクト、録音再生 |
| [audio-worker.cjs](audio-worker.cjs) | オーディオサンプルが読み込む tone と filter の Worker ファクトリー |
| [network.cjs](network.cjs) | ローカルの TCP、Packet、UDP、Selector |
| [sleep-err.cjs](sleep-err.cjs) | 非同期の待機と SFML のログ出力 |
| [vector-scalars.cjs](vector-scalars.cjs) | 各種数値スカラー型でのベクトル演算 |

audio サンプルでは、1～4 でモードを切り替え、Space で再生／一時停止、S で停止、E でエフェクトを切り替え、R／T で録音を開始／終了します。矢印キーでパンと音量を調整します。録音はシステムのマイクを使い、通常起動ではキー入力を待ちます。

<a id="screenshots"></a>
## スクリーンショット

`SFML_DEMO_SNAPSHOT` に対応するグラフィックスのサンプルは、実行画面を保存できます。macOS／Linux では、たとえば次のように実行します。

```sh
SFML_DEMO_SNAPSHOT=/tmp/sfml-render-texture.png \
  node examples/render-texture.cjs --frames=2
```

PowerShell の場合：

```powershell
$env:SFML_DEMO_SNAPSHOT = "$env:TEMP/sfml-render-texture.png"
node examples/render-texture.cjs --frames=2
Remove-Item Env:SFML_DEMO_SNAPSHOT
```

総合サンプルの all-types は PPM で保存し、他のサンプルの保存形式はそれぞれの入口の実装に従います。静止画のスクリーンショットが示すのは、指定したシーンの描画結果だけです。スループット、音声出力、入力デバイスのテスト結果を示すものではありません。

<a id="game-projects"></a>

## ゲームプロジェクト

[node-sfml-demos](https://github.com/XadillaX/node-sfml-demos) には、sfml.js で実装した Bomberman、Breakout、Tetris、Doodle Jump、Arkanoid が含まれています。

プロジェクトを置くディレクトリで、この独立したリポジトリをクローンしてください。各ゲームのディレクトリで依存関係をインストールし、起動します。Bomberman の場合：

```sh
git clone https://github.com/XadillaX/node-sfml-demos.git
cd node-sfml-demos/bomberman
npm install
node index.js
```

ゲームごとのディレクトリ、操作方法、元の C++ ソースコードは[リポジトリの README](https://github.com/XadillaX/node-sfml-demos#readme)を参照してください。[ネイティブビルドの要件](../docs/getting-started.ja.md#requirements)も適用されます。

## SFML 公式サンプル

[official/](official/README.ja.md) には SFML 公式リポジトリから移植した 20 サンプルがあります。テニス、シェーダー、テキスト、地形、音声、通信、X11、OpenGL ウィンドウを含み、元のシーンと素材を保持しています。操作方法、Node 向けの調整、出典、ライセンスはガイドを参照してください。

```sh
node examples/official/tennis/Tennis.cjs
```

## 旧バージョンのサンプル

[ported/](ported/README.ja.md) には元の 16 本のスクリプトを保持しています。14 本は現在の API で動作し、2 本は旧版の非同期描画インターフェースに依存しており、未対応を報告します。

```sh
npm run test:ported
```

all-types-scene.cjs と bitmap-label.cjs はデモの補助ファイルであり、独立したアプリケーションの入口ではありません。
