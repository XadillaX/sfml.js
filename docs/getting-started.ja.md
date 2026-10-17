# クイックスタート

[English](getting-started.md) / [简体中文](getting-started.zh-CN.md) / **日本語** / [한국어](getting-started.ko.md)

> 目標は、sfml.js をインストールし、閉じるイベントに応答できるネイティブウィンドウを動かすことです。このガイドでは現在の SFML 3.1.0 API を使います。

[ドキュメントトップ](README.ja.md) · [基本概念](concepts.ja.md) · [サンプル](../examples/README.ja.md)

<a id="requirements"></a>
## 必要な環境

sfml.js は Node.js のネイティブ拡張です。インストール時に現在のプラットフォーム向けの SFML 動的ライブラリをダウンロードし、ローカルでバインディングをコンパイルします。Python と C++20 ツールチェーンが必要です。

パッケージが宣言する Node.js の対応範囲は `^18.19.0 || >=20.5.0` で、現在の CI 設定は Node.js 20 と 22 を使っています。初めて環境を構築する場合は Node.js 22 を利用できます。

### macOS

macOS 13+ の x64、arm64 をダウンロード対象としてサポートしています。Xcode Command Line Tools をインストールし、Python が利用できることを確認します。

```sh
xcode-select --install
python3 --version
```

ダウンロードする SFML のアーキテクチャは Node.js のアーキテクチャで決まります。`node -p process.arch` で確認できます。

### Linux

現在、自動ダウンロードに対応しているのは x64 です。Ubuntu／Debian では、リポジトリの CI と同じ依存パッケージをインストールできます。

```sh
sudo apt-get update
sudo apt-get install -y \
  build-essential python3 \
  libgl1-mesa-dev libx11-dev libxrandr-dev libxcursor-dev libxi-dev \
  libudev-dev libfreetype-dev libflac-dev libvorbis-dev \
  libopenal-dev libmbedtls-dev
```

ディスプレイのない CI では `xvfb` と `xauth` も必要です。実行方法は[開発ガイド](development.ja.md#testing)を参照してください。他のディストリビューションでは対応する開発用パッケージを使います。

### Windows

Python と Visual Studio 2022 Build Tools をインストールし、「C++ によるデスクトップ開発」と Windows SDK を選択します。現在のダウンロード対象は x64、ia32 です。ビルドツールチェーンのアーキテクチャは Node.js と一致させてください。

## パッケージのインストール

アプリケーションのディレクトリで実行します。

```sh
npm install sfml.js
```

TypeScript の型宣言はパッケージに含まれています。npm は既定で `latest` タグをインストールします。次のコマンドでインストール済みのバージョンと公開タグを確認できます。

```sh
npm ls sfml.js
npm view sfml.js dist-tags
```

現在のリポジトリを直接試す場合は、[開発ガイド](development.ja.md#get-the-source)に従って `npm ci` を実行してから、リポジトリのサンプルを動かしてください。

インストールされたファイルは依存パッケージ内の `third_party/sfml/` に、ネイティブモジュールは `build/Release/sfml.node` に保存されます。ダウンロードには SFML の GitHub Release へのアクセスが必要です。バージョンとアーキテクチャが一致する場合はキャッシュを再利用します。

`SFML_DOWNLOAD_MIRROR` でダウンロード用プロキシの接頭辞を指定できます。最終的な URL は `<接頭辞>/<完全な GitHub URL>` になります。使用するプロキシはこの形式に対応している必要があります。設定については[ダウンロード URL の実装](../tools/lib_downloader_urls.cjs)を参照してください。

## 最初のウィンドウを開く

`hello.cjs` を作成します。

```javascript
const sf = require('sfml.js');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(800, 600)),
  'Hello, sfml.js',
);
const circle = new sf.CircleShape({ radius: 80 });
circle.setPosition(new sf.Vector2f(320, 220));
circle.setFillColor(new sf.Color(76, 190, 110));
window.setFramerateLimit(60);

function frame() {
  window.handleEvents({
    Closed: () => window.close(),
    KeyPressed: event => {
      if (event.code === sf.Keyboard.Key.Escape) window.close();
    },
  });
  if (!window.isOpen()) return;

  window.clear(new sf.Color(24, 28, 32));
  window.draw(circle);
  window.display();
  setImmediate(frame);
}

frame();
```

`node hello.cjs` を実行すると、ウィンドウに緑色の円が表示されます。Esc キーまたは閉じるボタンで終了します。

各フレームでは、最初にイベントを処理し、続いてシーンの更新、画面のクリア、描画、表示を行います。`setImmediate(frame)` は次のイベントループで描画を再開し、ファイル、ネットワーク、Worker のメッセージ処理に実行機会を与えます。`display()` は同期インターフェースで、フレームレート制限や垂直同期によって待機する場合があります。対応する `displayAsync()` メソッドはありません。

## TypeScript の使用

公開型はパッケージのエントリーポイントからインポートします。

```typescript
import { RenderWindow, Vector2u } from 'sfml.js';

const window = new RenderWindow(new Vector2u(800, 600), 'TypeScript');
window.close();
```

マイクロ秒単位の時間と一部のネットワーク整数には `bigint` を使うため、アプリケーションの TypeScript の `target` は `ES2020` 以上にしてください。CommonJS アプリケーションでは `require('sfml.js')` を使い、型パッケージを別途インストールする必要はありません。

## 画像の読み込み

まずリソースを作成し、読み込みの成功を待ってから、それを使うオブジェクトを作成します。

```javascript
const sf = require('sfml.js');

async function loadSprite(filename) {
  const texture = new sf.Texture();
  if (!await texture.loadFromFile(filename)) {
    throw new Error(`Cannot load texture: ${filename}`);
  }
  return new sf.Sprite(texture);
}
```

返された Sprite をウィンドウの `draw()` に渡します。相対ファイルパスは呼び出し時の作業ディレクトリを基準に解決されます。

通常、ファイルが存在しない場合やデコードに失敗した場合は `false` を返します。型エラー、範囲エラー、実行時の異常は例外または Promise の reject で通知されます。例外だけを捕捉して、読み込みの戻り値を無視しないでください。

## よくある問題

| 症状 | 確認事項 |
| --- | --- |
| `sfml.node` が見つからない | インストールスクリプトが無効になっていないか確認。ツールチェーンを確認してから、アプリケーション内で `npm rebuild sfml.js` を実行 |
| `Unsupported SFML platform` | 対応する OS と `process.arch` を確認。現在 Linux arm64 用の自動ダウンロードパッケージはない |
| ウィンドウや OpenGL コンテキストを作成できない | グラフィカルセッションと OpenGL ドライバーの有無を確認。Linux CI では Xvfb を使用 |
| ウィンドウが応答しない、非同期タスクが完了しない | フレームループが `setImmediate` などでイベントループに制御を返しているか確認 |
| `await load...()` が例外を投げないのに何も表示されない | 真偽値の戻り値、ファイルパス、Sprite の位置、テクスチャ矩形を確認 |
| 中国語のテキストが表示されない | 対象の文字を収録したフォントを `Font.openFromFile()` で読み込む |

次は[基本概念](concepts.ja.md)を読むか、[完全なサンプル](../examples/README.ja.md)を実行してください。

<a id="sfml-cpp-reference"></a>
## SFML C++ リファレンス

[SFML 3.1.0 公式リファレンス](https://www.sfml-dev.org/documentation/3.1.0/)のサンプルは、上流の概念を理解するために利用できます。ただし、C++ のファイル読み込みコンストラクターやブロッキングするループを、そのまま JavaScript にコピーすることはできません。リソースの非同期読み込みと Node.js のイベントループについては、このガイドの方法に従ってください。
