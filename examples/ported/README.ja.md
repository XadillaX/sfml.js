# 旧バージョンのサンプル

[English](README.md) / [简体中文](README.zh-CN.md) / **日本語** / [한국어](README.ko.md)

> このディレクトリは、旧版の `example/` にあった 16 個のデモ入口を保持しています。ファイル名は変えず、拡張子を `.cjs` にしています。14 個の入口は現在の API に適合済みで、2 個の非同期描画の入口は `UNSUPPORTED` を報告し、終了コードは 2 です。

[全サンプル](../README.ja.md) · [API ナビゲーション](../../docs/api.ja.md) · [開発ガイド](../../docs/development.ja.md)

これらのスクリプトは、旧シーンが現在の API でどのように動くかを確認するためのものです。新しいアプリケーションは[クイックスタート](../../docs/getting-started.ja.md)から始めてください。

## 実行

プロジェクトのルートで実行します。

```sh
# 初回ビルドにはネイティブモジュールを含める
npm run build

# 総合ウィンドウを開く
npm run demo:ported

# 任意の移植済みスクリプトを実行する
node examples/ported/texture.cjs
node examples/ported/sound_buffer.cjs
```

## サンプルの入口

| ファイル | デモの内容 |
|------|----------|
| color.cjs | 色の構築、成分への書き込み、JSON 出力 |
| vector2.cjs | 2 次元ベクトル、スカラー型の変換、コピー、名前付き演算 |
| vector3.cjs | 3 次元ベクトル、スカラー型の変換、コピー、名前付き演算 |
| time.cjs | 時間のファクトリー関数、bigint のマイクロ秒、Time.Zero |
| rect.cjs | position／size、包含と交差領域。元の不正入力のデモも保持 |
| video_mode.cjs | 表示モード、サイズ、NaN 入力、デスクトップモードとフルスクリーンモードの照会 |
| vertex.cjs | 頂点のメンバービューと VertexArray へのアクセス |
| joystick.cjs | ジョイスティックの接続、識別情報、ボタン数、軸の照会 |
| sensor.cjs | すべてのセンサーの可用性確認、有効化、読み取り |
| touch.cjs | タッチの状態と位置の照会 |
| font.cjs | 読み込み失敗、フォント読み込み、コードポイント 1／文字サイズ 10 のグリフと行間 |
| texture.cjs | 読み込み失敗、GIF の読み込み、切り出し、テクスチャのコピー、Sprite |
| sound_buffer.cjs | WAV のデコード、PCM のコピー、保存、再読み込み |
| render_window.cjs | 元の総合シーンの図形、頂点の線、グラデーションピクセル、切り出し、マスク、Sprite、中国語テキスト、オーディオ |
| render_window_display_async.cjs | 未対応：元の同期／非同期 display の比較。displayAsync がない |
| render_window_display_draw_async.cjs | 未対応：元の非同期描画の総合シーン。drawAsync と displayAsync がない |

## ウィンドウの操作

`render_window.cjs` は、元の `VideoMode.getFullscreenModes()[3]`、タイトル `hello`、style 5 を使います。赤い背景、元のシーン配置、既定の音量を保持し、起動時に Sound を 1 回再生します。Music はループを設定するだけで再生しません。`setFramerateLimit(60)` と `setImmediate(frame)` によるスケジューリングを維持します。

| キー | 動作 |
|------|------|
| Esc／閉じるイベント | ウィンドウを閉じる。Esc のリアルタイム照会も保持 |
| Left | ウィンドウ位置の x／y にそれぞれ 1 を加算 |
| LControl | 押している間は 800×600 で再作成し、垂直同期を有効化 |
| LAlt | コンテキスト設定を出力 |
| RAlt | ウィンドウのタイトルを変更 |
| S | 仮想キーボードの表示を要求。システムの対応状況に従う |

元のマウス処理も保持しています。毎フレーム、デスクトップ座標とウィンドウ相対座標を読み取り、元の mode の範囲に制限してから Mouse.setPosition を呼びます。元のキーリピートの挙動も維持します。

Windows 以外では、総合サンプルは引き続き `/tmp/xxx.png` を保存します。SoundBuffer サンプルも引き続き `os.tmpdir()` 内の `.game.wav` に保存してから再読み込みし、自動削除はしません。

## 移植の規約

適応の対象は、インポートパス、SFML 3 の引数とメソッド名、値型、非同期読み込みです。シーンのパラメーター、アニメーションの式、描画順序、入力、ファイル出力、フレームのスケジューリングは元のロジックを維持します。画像、フォント、音声は `assets/` にあります。

名前に async を含む 2 つの入口では、同期描画や固定時間の sleep で旧インターフェースを模擬しません。display の比較コードは、10 フレーム、50 ms のハートビート、setImmediate のラップ、displayAsync、終了後のエラーチェックを保持します。非同期の総合シーンは、drawAsync/displayAsync を順に await する処理を保持します。

座標とサイズには Vector2、回転には Angle、色には Color を使い、イベントは `is/getIf` で読み取ります。数値列挙型の反復時には逆マッピングを除外します。読み込み操作の boolean を確認し、元の存在しないパス `abcdefg`／`abc.jpg` を保持します。console.log／JSON.stringify は新版のオブジェクトを直接受け取り、表示形式は新版の型そのものに従います。整数変換と不正値の処理も新版の値型に従い、サンプル層で旧版の検証を模擬しません。

各スクリプトは独立してデモのロジックを含み、共有のシーンや出力整形のヘルパー関数は使いません。元の同期的なリソース読み込みは元の順序で await する形に変更しており、並列の事前読み込みにはしていません。
