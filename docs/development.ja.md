# 開発ガイド

[English](development.md) / [简体中文](development.zh-CN.md) / **日本語** / [한국어](development.ko.md)

> このガイドは、ソースコードの変更、ドキュメントの保守、リポジトリのテストを行うコントリビューター向けです。依存パッケージとして利用する場合は[クイックスタート](getting-started.ja.md)から読んでください。

[ドキュメントトップ](README.ja.md) · [API ナビゲーション](api.ja.md) · [サンプル一覧](../examples/README.ja.md)

<a id="get-the-source"></a>
## ソースコードの取得

Node.js、Python、C++20 ツールチェーンを用意します。プラットフォーム別のインストールコマンドは[必要な環境](getting-started.ja.md#requirements)を参照し、その後に以下を実行してください。

```sh
git clone https://github.com/XadillaX/node-sfml.git
cd node-sfml
npm ci
```

`install` はネイティブモジュールをコンパイルし、`prepare` は TypeScript の定数、JavaScript、型宣言ファイルを生成します。ビルドフックは最初に SFML 3.1.0 を確認してダウンロードします。npm の依存パッケージとしてインストールする場合は、公開パッケージ内の dist を使うため、インストール時にはネイティブ部分のコンパイルだけが必要です。

## ビルド

以下のコマンドはすべてリポジトリのルートで実行します。

| コマンド | 用途 |
| --- | --- |
| `npm run build` | ネイティブ部分と TypeScript をコンパイル |
| `npm run build:native` | ネイティブ部分をコンパイルし、clangd の設定を更新 |
| `npm run build:ts` | 定数を生成し、TypeScript をコンパイル |
| `npm run build:docs` | 4 言語のサイトと API リファレンスをビルド |
| `npm run build:reference` | TypeDoc API ドキュメントのみを生成 |
| `npm run docs:dev` | サイトの開発プレビューを起動 |
| `npm run docs:preview` | 本番用ビルドをローカルでプレビュー |
| `npm run lint` | ソースコード、ツール、テスト、サンプルを検査 |
| `npm run test:types` | TypeScript のインターフェースを検証 |
| `npm run test:runtime` | ランタイムテストを直列に実行。事前にビルドが必要 |
| `npm test` | lint、ビルド、型検査、ランタイムテストを順に実行 |
| `npm run test:ported` | 移植済みサンプルを検証し、成功と未対応を区別して報告 |
| `npm pack --dry-run` | npm パッケージのファイル一覧を確認 |

TypeScript だけを変更した場合は `npm run build:ts`、ネイティブ部分を変更した場合は `npm run build` を実行します。ランタイムテストは自動的に再ビルドしないため、実行前にビルド結果とソースコードが一致していることを確認してください。

<a id="testing"></a>
## テストと検証

```sh
npm test
npm run test:ported
```

`npm test` は lint、ネイティブ部分と TypeScript のビルド、型検査、ランタイムテストを実行します。test:ported は旧バージョンから移植したサンプルを別途検証し、成功と未対応を区別します。

ランタイムテストはファイル単位で直列に実行し、公開インターフェース、ネイティブ SFML との比較、実際に描画されたピクセル、非同期 I/O、スナップショット、ライフサイクルを検証します。型テストは `test/*.types.ts`、ランタイムテストは `test/*.test.cjs`、ネイティブ比較テストは `test/native/` にあります。

グラフィックスのテストにはディスプレイサーバーと OpenGL コンテキストが必要です。ディスプレイのない Linux 環境では、[Linux CI](../.github/workflows/node.js.yml)に従って Xvfb をインストールしてから実行します。

```sh
LIBGL_ALWAYS_SOFTWARE=1 \
  xvfb-run -a -s "-screen 0 1280x1024x24 -noreset" npm run test:runtime
```

CI は Linux、macOS、Windows の Node.js 20／22 を対象としています。[Windows CI](../.github/workflows/node.js-windows.yml)は Mesa のソフトウェア OpenGL を使います。

CI はスピーカー、マイク、ジョイスティック、センサー、フルスクリーン切り替えなどの実機確認の代わりにはなりません。SFML の macOS バックエンドは Vulkan に対応しておらず、SuspendAwareClock.now は Android のみ対応しています。結果を報告する際は、実際に実行したプラットフォームとスキップした項目を明記してください。

## ドキュメントの保守

README はプロジェクトの紹介と最小限のサンプルを、`docs/` は目的別・モジュール別の使い方を、`examples/README.md` は実行可能な入口を提供します。完全なシグネチャはソースコメントから生成し、手書きのドキュメントで別の宣言を維持しないようにします。

- サンプルは公開パッケージ `sfml.js` をインポートします。リポジトリ相対パスを使うのは、リポジトリ内のデモスクリプトだけです。
- 完全なサンプルと前後の文脈に依存する断片を区別し、async 関数、素材、デバイスの要件を説明します。
- 読み込みの真偽値とネットワークのステータスを確認し、サンプル終了時には所有するリソースを閉じます。
- 公開された挙動を変更する場合は、JSDoc、対応するガイド、影響を受けるサンプルも更新します。

サイトの依存パッケージをインストールしてビルドします。

```sh
npm ci --prefix site
npm run build:docs
```

`site/` には VitePress のテーマとビルドスクリプトがあります。英語・中国語・日本語・韓国語のガイドと API リファレンスを生成します。TypeDoc は `/reference/`、`/zh/reference/`、`/ja/reference/`、`/ko/reference/` に配置され、サイト全体は `build/site/` に出力されます。元の Markdown を編集し、`npm run docs:dev` を再起動して生成内容を更新してください。テーマの変更はホットリロードに対応しています。

ドキュメントの生成にネイティブモジュールのコンパイルや読み込みは不要です。ドキュメント専用環境では、先に `npm ci --ignore-scripts` を実行できます。`npm run build:reference` は TypeDoc のみを `build/docs/` に生成します。`npm --prefix site test` はリンク変換と旧 URL のリダイレクトを検証し、本番ビルドではルート、アンカー、画像なども検査します。

[Publish Docs ワークフロー](../.github/workflows/publish-docs.yml)は `main` の更新時に実行され、手動実行にも対応しています。生成結果は `gh-pages` ブランチの `docs/` にコミットされ、同ブランチのルートファイルを保持し、既存の `CNAME`（`sfml.js.org`）を引き継ぎます。生成内容に変更がなければコミットをスキップします。

以前の TypeDoc のクラスやインターフェースの URL は、フラグメントを保持して対応する英語リファレンスに転送されます。API の言語切り替えでは、現在のページとメンバーのアンカーを保持します。単独ビルドの `build/docs/` には、`zh/`、`ja/`、`ko/` の翻訳サブディレクトリも生成されます。

JSDoc は英語を先に書き、続けて `@zh`、`@ja`、`@ko` の翻訳を記述します。各翻訳は対応する概要やブロックタグの直後に置きます。引数の翻訳は `@ja name - 説明` の形式を使います。識別子、コード例、リンクを維持してください。文章の翻訳が不足すると、ドキュメントのビルドは失敗します。

```ts
/**
 * Read the elapsed time.
 * @zh 读取经过的时间。
 * @ja 経過時間を読み取ります。
 * @ko 경과 시간을 읽습니다.
 * @param unit - Time unit.
 * @zh unit - 时间单位。
 * @ja unit - 時間の単位。
 * @ko unit - 시간 단위.
 */
```

自動生成される定数の説明は `tools/constant-docs.json` と `tools/constant-docs.cjs` のテンプレートで管理します。変更後は `npm run generate:window` と `npm run generate:network` を実行し、生成済みのコメントを直接編集しないでください。

## サンプルの実行

以下のコマンドはリポジトリのルートで実行します。

```sh
npm run demo:types -- --frames=120
npm run demo:window -- --frames=120
npm run demo:audio
npm run demo:network
```

サンプルの説明は [examples/README.md](../examples/README.ja.md)を参照してください。ビルド済みであれば、`node examples/<名称>.cjs`（`<名称>` はサンプル名）で直接実行できます。`--frames` に対応する入口ではフレーム数を制限できます。スクリーンショットの撮影方法もサンプル一覧に記載しています。

旧版の `drawAsync`／`displayAsync` を使う 2 つのサンプルは、未対応であることを明示的に報告します。詳細は[移植に関する説明](../examples/ported/README.ja.md)を参照してください。

## ソースコードと生成ファイル

| ディレクトリ | 内容 |
| --- | --- |
| `src/` | TypeScript の実装 |
| `native/` | C++ バインディング |
| `test/` | ランタイム、型、ネイティブ比較テスト |
| `tools/` | 定数ジェネレーター、ベンチマーク、テストツール |
| `docs/` | API と開発のドキュメント |
| `site/` | サイトのテーマ、多言語対応、検索、ビルドスクリプト |

`build/`、`dist/`、`node_modules/`、ダウンロード済みの SFML はすべて生成物です。ウィンドウとネットワークの定数は現在の SFML ヘッダーから生成されるため、`src/*/gen/constants.ts` を直接編集しないでください。

ネイティブのビルド後、`.clangd` が使用する `build/compile_commands.json` が自動生成されます。言語サービスの設定だけを更新する場合は `npm run configure:lsp` を実行してください。エディターに古い診断が表示され続ける場合は clangd を再起動します。

## 実装上の規約

値型は TypedArray を使って計算と共有ストレージを実現し、ネイティブリソースとそのビューがメモリの寿命を維持します。グラフィックスのリソースは所属するスレッドで破棄します。描画の記録はスナップショットのセマンティクスを維持し、後からプロパティを変更しても記録済みの結果が変わらないようにしてください。

関連する入口は `src/internal/lazy-value.ts`、`src/internal/graphics-state.ts`、`native/shared-handle.h`、`native/deferred-delete.h`、`native/batch-drawable.h` です。公開フィールドやメソッドを追加する際は、機能、引数、上流との対応関係を説明する JSDoc を追加してください。

ダウンローダー、インストールフック、プラットフォーム別ビルドは相互に関係しているため、変更時には対応するプラットフォームで検証が必要です。ダウンロード URL とアーキテクチャのマッピングは `tools/lib_downloader_urls.cjs`、キャッシュは `third_party/sfml/` にあります。

## 変更の提出

PR には具体的な挙動、実施した検証、未検証のプラットフォーム固有の処理経路を記載してください。ネイティブ部分の変更では影響を受けるネイティブ比較テストを実行し、ドキュメントのみの変更ではリンク、コードサンプル、TypeDoc のビルドを確認します。性能値には、マシン、Node.js／SFML のバージョン、シナリオ、測定方法を添えてください。
