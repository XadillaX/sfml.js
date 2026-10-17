# API ナビゲーション

[English](api.md) / [简体中文](api.zh-CN.md) / **日本語** / [한국어](api.ko.md)

> sfml.js は SFML 3.1.0 を基盤としています。手書きのガイドでは使い方、戻り値、Node.js 向けの適応を説明し、完全なシグネチャと型制約は [TypeDoc](https://sfml.js.org/ja/reference/) がソースコードから生成します。

[ドキュメントトップ](README.ja.md) · [クイックスタート](getting-started.ja.md) · [基本概念](concepts.ja.md)

公開インターフェースはすべて `sfml.js` からインポートします。エクスポート一覧は [src/index.ts](../src/index.ts) を参照してください。アプリケーションコードから `dist/internal` やネイティブモジュールのハンドルにアクセスする必要はありません。

## 目的から選ぶ

| 目的 | ドキュメント | 主なインターフェース |
| --- | --- | --- |
| 座標、角度、フレーム時間の計算 | [System](system.ja.md) | Vector2／3、Angle、Time、Clock、名前付き演算関数 |
| 独自のファイルソースの利用 | [入力ストリーム](system.ja.md#input-streams) | InputStream、MemoryInputStream、FileInputStream |
| ウィンドウの作成と入力の受信 | [Window](window.ja.md) | RenderWindow、Window、Event、Keyboard、Mouse |
| 画像とアニメーションの表示 | [Graphics](graphics.ja.md) | Image、Texture、Sprite |
| 図形とテキストの描画 | [Graphics](graphics.ja.md) | Shape、Font、Glyph、Text |
| カメラ、オフスクリーン合成、大量のジオメトリ | [Graphics](graphics.ja.md) | View、RenderTexture、VertexArray、VertexBuffer |
| カスタム描画とシェーダー | [Graphics](graphics.ja.md) | Drawable、RenderStates、Shader、Glsl |
| 再生、録音、音声処理 | [Audio](audio.ja.md) | SoundBuffer、Sound、Music、SoundStream、SoundRecorder |
| ネットワーク通信とファイル転送 | [Network](network.ja.md) | Packet、TcpSocket、UdpSocket、Http、Ftp、Sftp |

## System

`Vector2`／`Vector3` は複数のスカラー型に対応し、`Vector2i/u/f` と `Vector3i/u/f` がよく使われる特殊化です。`degrees()`／`radians()` で Angle を、時間のファクトリー関数で Time を作成します。

JavaScript には C++ の演算子オーバーロードがないため、対応する操作には `add()`、`multiply()`、`equal()`、`*Assign()` を使います。`Clock`、非同期の `sleep()`、`TimeoutWithPredicate`、入力ストリーム、`Unicode`、エラーログのインターフェースもこのモジュールに含まれます。

詳細は [System](system.ja.md) を参照してください。

## Window

`Window` は OS のウィンドウと OpenGL コンテキストを提供します。2D 描画には通常、Window と RenderTarget の両方の機能を持つ `RenderWindow` を使います。

イベントは `pollEvent()`、`handleEvents()`、同期の `waitEvent()` で取得できます。キーボード、マウス、ジョイスティック、センサーにはリアルタイムの状態照会もあります。`Clipboard`、`Cursor`、`Context`、`Vulkan` はシステムとの連携を担います。

詳細は [Window](window.ja.md) を参照してください。

## Graphics

Image は CPU 側のピクセル、Texture は GPU テクスチャを保持し、Sprite はテクスチャを参照して描画します。Shape は円、矩形、凸多角形、独自の凸形状を提供します。Font と Text はフォントの読み込み、レイアウト、編集可能な頂点を提供します。

RenderTarget はウィンドウとオフスクリーンターゲットの描画インターフェースを統一します。View はカメラとビューポートを、RenderStates は変換、ブレンド、ステンシル、テクスチャ、Shader を制御します。頂点配列と GPU 頂点バッファを使えば、ジオメトリを直接構成できます。

詳細は [Graphics](graphics.ja.md) と[描画スナップショット](concepts.ja.md#draw-snapshots)を参照してください。

## Audio

短い効果音には SoundBuffer + Sound、長い音声には Music を使います。SoundSource は音量、パン、空間オーディオのプロパティを提供します。SoundStream、SoundRecorder、EffectProcessor は Worker コールバックで独自のデータを処理します。

詳細は [Audio](audio.ja.md) を参照し、特にサンプル数、チャンネルの並び、バッファの有効期間に注意してください。

## Network

Network は Node.js のトランスポートで SFML スタイルの API を実装しており、本番コードは SFML C++ Network を呼び出しません。Packet は SFML のエンコード規約を維持し、TCP、UDP、DNS、TLS、HTTP、FTP、SFTP の I/O には Promise を使います。

ステータスの戻り値、部分送信、プロトコルの制約、終了方法を含む詳細は [Network](network.ja.md) を参照してください。

## 互換性の範囲

| 項目 | 現在の挙動 |
| --- | --- |
| C++ のポインター、参照による出力引数 | オブジェクト、ビュー、戻り値のオブジェクトで表現 |
| C++ のテンプレートと演算子 | 明示的なスカラータグ、クラス、名前付き関数で表現 |
| ファイル読み込み | Promise を使用し、個別の失敗ステータスは各インターフェースに従う |
| デストラクター | ネイティブ側の所有権と JS 参照を組み合わせる。終了用インターフェースを持つリソースは明示的に閉じる |
| `drawAsync()`／`displayAsync()` | 未提供。旧サンプルは未対応であることを明示的に報告 |
| Android SuspendAwareClock | 条件付きコンパイルのインターフェースあり。現在のダウンロードフローはデスクトップ向け |
| Vulkan | 照会インターフェースをエクスポート済み。利用可否は SFML のプラットフォームバックエンドに依存し、macOS バックエンドでは利用不可 |

プラットフォームごとのビルドとテストの範囲は[開発ガイド](development.ja.md#testing)を参照してください。

<a id="sfml-cpp-reference"></a>
## SFML C++ リファレンス

[SFML 3.1.0 公式リファレンス](https://www.sfml-dev.org/documentation/3.1.0/)は C++ 側の概念を確認するための資料です。JavaScript のシグネチャは [TypeDoc](https://sfml.js.org/ja/reference/) を基準とし、バインディング固有の挙動は各モジュールのガイドに従ってください。

- [System の C++ リファレンス](system.ja.md#sfml-cpp-reference)
- [Window の C++ リファレンス](window.ja.md#sfml-cpp-reference)
- [Graphics の C++ リファレンス](graphics.ja.md#sfml-cpp-reference)
- [Audio の C++ リファレンス](audio.ja.md#sfml-cpp-reference)
- [Network の C++ リファレンス](network.ja.md#sfml-cpp-reference)
