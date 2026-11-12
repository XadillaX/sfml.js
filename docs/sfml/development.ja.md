# 開発ガイド

[English](development.md) / [简体中文](development.zh-CN.md) / **日本語** / [한국어](development.ko.md)

> このガイドは、ソースコードの変更、ドキュメントの保守、リポジトリのテストを行うコントリビューター向けです。依存パッケージとして利用する場合は[クイックスタート](getting-started.ja.md)から読んでください。

[ドキュメントトップ](README.ja.md) · [API ナビゲーション](api.ja.md) · [サンプル一覧](../../packages/sfml.js/examples/README.ja.md)

<a id="get-the-source"></a>
## ソースコードの取得

Node.js、Python、C++20 ツールチェーンを用意します。プラットフォーム別のインストールコマンドは[必要な環境](getting-started.ja.md#requirements)を参照し、その後に以下を実行してください。

```sh
git clone https://github.com/XadillaX/node-sfml.git
cd node-sfml
node tools/bootstrap.cjs
```

`node tools/bootstrap.cjs` は Rush で依存関係をインストールし、interop、両バインディング、サイトを依存順にビルドします。SFML と ImGui のライブラリは各パッケージが取得します。このリポジトリでは Node.js 20 または 22 を推奨し、サイトには Node.js 20 以上が必要です。

## ビルド

以下のコマンドはすべてリポジトリのルートで実行します。

| コマンド | 用途 |
| --- | --- |
| `npm --prefix packages/sfml.js run build` | ネイティブ部分と TypeScript をコンパイル |
| `npm --prefix packages/sfml.js run build:native` | ネイティブ部分をコンパイルし、clangd の設定を更新 |
| `npm --prefix packages/sfml.js run build:ts` | 定数を生成し、TypeScript をコンパイル |
| `npm --prefix site run build` | 4 言語のサイトと API リファレンスをビルド |
| `npm --prefix site run build:reference` | TypeDoc API ドキュメントのみを生成 |
| `npm --prefix site run dev` | サイトの開発プレビューを起動 |
| `npm --prefix site run preview` | 本番用ビルドをローカルでプレビュー |
| `npm --prefix packages/sfml.js run lint` | ソースコード、ツール、テスト、サンプルを検査 |
| `npm --prefix packages/sfml.js run test:types` | TypeScript のインターフェースを検証 |
| `npm --prefix packages/sfml.js run test:runtime` | ランタイムテストを直列に実行。事前にビルドが必要 |
| `npm --prefix packages/sfml.js test` | lint、ビルド、型検査、ランタイムテストを順に実行 |
| `npm --prefix packages/sfml.js pack --dry-run` | npm パッケージのファイル一覧を確認 |

TypeScript だけを変更した場合は `npm --prefix packages/sfml.js run build:ts`、ネイティブ部分を変更した場合は `npm --prefix packages/sfml.js run build` を実行します。ランタイムテストは自動的に再ビルドしないため、実行前にビルド結果とソースコードが一致していることを確認してください。

<a id="testing"></a>
## テストと検証

```sh
npm --prefix packages/sfml.js test
```

`npm --prefix packages/sfml.js test` は lint、ネイティブ部分と TypeScript のビルド、型検査、ランタイムテストを実行します。

ランタイムテストはファイル単位で直列に実行し、公開インターフェース、ネイティブ SFML との比較、実際に描画されたピクセル、非同期 I/O、スナップショット、ライフサイクルを検証します。型テストは `test/*.types.ts`、ランタイムテストは `test/*.test.cjs`、ネイティブ比較テストは `test/native/` にあります。

グラフィックスのテストにはディスプレイサーバーと OpenGL コンテキストが必要です。ディスプレイのない Linux 環境では、[Linux CI](../../.github/workflows/node.js.yml)に従って Xvfb をインストールしてから実行します。

```sh
LIBGL_ALWAYS_SOFTWARE=1 \
  xvfb-run -a -s "-screen 0 1280x1024x24 -noreset" npm --prefix packages/sfml.js run test:runtime
```

CI は Linux、macOS、Windows の Node.js 20／22 を対象としています。[Windows CI](../../.github/workflows/node.js-windows.yml)は Mesa のソフトウェア OpenGL を使います。

CI はスピーカー、マイク、ジョイスティック、センサー、フルスクリーン切り替えなどの実機確認の代わりにはなりません。SFML の macOS バックエンドは Vulkan に対応しておらず、SuspendAwareClock.now は Android のみ対応しています。結果を報告する際は、実際に実行したプラットフォームとスキップした項目を明記してください。

## ドキュメントの保守

各パッケージの README はそのパッケージを紹介します。ルートの `docs/sfml/`、`docs/imgui/`、`docs/interop/` がガイドを持ち、実行可能なサンプルと API コメントは各パッケージに残ります。ルートの `site/` は非公開 Rush プロジェクト `sfml-js-site` で、VitePress、TypeDoc、翻訳、サイトテストを管理します。

- サンプルは公開パッケージ `sfml.js` をインポートします。リポジトリ相対パスを使うのは、リポジトリ内のデモスクリプトだけです。
- 完全なサンプルと前後の文脈に依存する断片を区別し、async 関数、素材、デバイスの要件を説明します。
- 読み込みの真偽値とネットワークのステータスを確認し、サンプル終了時には所有するリソースを閉じます。
- 公開された挙動を変更する場合は、JSDoc、対応するガイド、影響を受けるサンプルも更新します。

サイトの依存パッケージをインストールしてビルドします。

```sh
node common/scripts/install-run-rush.js build --to sfml-js-site
```

bootstrap 後に `npm --prefix site run dev` で Markdown を準備してサイトを起動します。ガイドを編集した場合は再起動し、テーマ変更にはホットリロードを使えます。`npm --prefix site run build` はサイトを `site/build/site/` に生成します。コアの `/guide`、`/examples`、`/reference` を保持し、ImGui は `/imgui/` と `/reference/imgui/`、拡張ガイドは `/interop/` に配置します。中国語・日本語・韓国語のパスもあります。

`npm --prefix site test` はルート、翻訳、テーマを検証します。サイトビルドは全リンク、アンカー、言語別ページ、アセットも検査します。`npm --prefix site run build:reference` は両 API を `site/build/site/reference/` と各言語ディレクトリに生成します。TypeDoc はソースコメントを読み取り、翻訳の完全性を検証します。ImGui の API 翻訳は宣言の隣で直接管理します。

[Publish Docs ワークフロー](../../.github/workflows/publish-docs.yml)は `main` の更新時に実行され、手動実行にも対応しています。生成結果は `gh-pages` ブランチの `docs/` にコミットされ、同ブランチのルートファイルを保持し、既存の `CNAME`（`sfml.js.org`）を引き継ぎます。生成内容に変更がなければコミットをスキップします。

以前の TypeDoc のクラスやインターフェースの URL は、フラグメントを保持して対応する英語リファレンスに転送されます。API の言語切り替えでは、現在のページとメンバーのアンカーを保持します。単独ビルドの `site/build/site/reference/` には、`zh/`、`ja/`、`ko/` の翻訳サブディレクトリも生成されます。

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

自動生成される定数の説明は `tools/constant-docs.json` と `tools/constant-docs.cjs` のテンプレートで管理します。変更後は `npm --prefix packages/sfml.js run generate:window` と `npm --prefix packages/sfml.js run generate:network` を実行し、生成済みのコメントを直接編集しないでください。

## サンプルの実行

以下のコマンドはリポジトリのルートで実行します。

```sh
npm --prefix packages/sfml.js run demo:types -- --frames=120
npm --prefix packages/sfml.js run demo:window -- --frames=120
npm --prefix packages/sfml.js run demo:audio
npm --prefix packages/sfml.js run demo:network
```

サンプルは[概要](../../packages/sfml.js/examples/README.ja.md)、[機能](../../packages/sfml.js/examples/features/README.ja.md)、[公式](../../packages/sfml.js/examples/official/README.ja.md)、[ゲームとアプリ](../../packages/sfml.js/examples/projects/README.ja.md)に分かれています。コマンドと[撮影機能](../../packages/sfml.js/examples/features/README.ja.md#screenshots)は各入口で説明しています。ビルド後はスクリプトを直接実行し、`--frames` は対応する入口にだけ渡してください。

## ソースコードと生成ファイル

| ディレクトリ | 内容 |
| --- | --- |
| `packages/sfml.js/` | コア、ネイティブバインディング、テスト、サンプル |
| `packages/sfml.js-imgui/` | ImGui バインディングソース、多言語 API コメント、デモ |
| `packages/sfml.js-interop/` | 共有ヘッダーと SFML SDK 取得ツール |
| `docs/` | パッケージ別の共有ガイド |
| `site/` | VitePress、TypeDoc、テーマ、サイトテスト |
| `common/` | Rush 設定と共通ロックファイル |

`build/`、`dist/`、`node_modules/`、ダウンロード済みの SFML はすべて生成物です。ウィンドウとネットワークの定数は現在の SFML ヘッダーから生成されるため、`src/*/gen/constants.ts` を直接編集しないでください。

ネイティブビルドが各パッケージのコンパイルデータベースを生成し、ルートの `compile_commands.json` に統合します。ルートの `.clangd` がこれを参照します。`node tools/configure-lsp.cjs` は既存データベースの統合のみを行います。

## 実装上の規約

値型は TypedArray を使って計算と共有ストレージを実現し、ネイティブリソースとそのビューがメモリの寿命を維持します。グラフィックスのリソースは所属するスレッドで破棄します。描画の記録はスナップショットのセマンティクスを維持し、後からプロパティを変更しても記録済みの結果が変わらないようにしてください。

関連する入口は `src/internal/lazy-value.ts`、`src/internal/graphics-state.ts`、`packages/sfml.js-interop/include/shared-handle.h`、`native/deferred-delete.h`、`native/batch-drawable.h` です。公開フィールドやメソッドを追加する際は、機能、引数、上流との対応関係を説明する JSDoc を追加してください。

ダウンローダー、インストールフック、プラットフォーム別ビルドは相互に関係しているため、変更時には対応するプラットフォームで検証が必要です。ダウンロード URL とアーキテクチャのマッピングは `packages/sfml.js-interop/tools/lib_downloader_urls.cjs`、キャッシュは `packages/sfml.js-interop/third_party/sfml/` にあります。

## 変更の提出

PR には具体的な挙動、実施した検証、未検証のプラットフォーム固有の処理経路を記載してください。ネイティブ部分の変更では影響を受けるネイティブ比較テストを実行し、ドキュメントのみの変更ではリンク、コードサンプル、TypeDoc のビルドを確認します。性能値には、マシン、Node.js／SFML のバージョン、シナリオ、測定方法を添えてください。

### rush change で変更を記録する

パッケージのバージョンは Rush のバージョンポリシーが管理するプレースホルダーです。`package.json` の `version` を手動で編集しないでください。公開する 3 つのパッケージ（`sfml.js-interop`、`sfml.js`、`sfml.js-imgui`）は単一のロックステップポリシー `sfml-js` を使い、常に一緒にリリースされ、同じバージョン番号を共有します。

公開パッケージを変更したら、リポジトリのルートで次を実行し、生成されたファイルを `common/changes/` にコミットします。

```sh
node common/scripts/install-run-rush.js change
```

影響を受けるパッケージごとに `patch`、`minor`、`major` を選びます。チェンジファイルは CHANGELOG の内容になり、実際のバージョンはロックステップポリシーの `nextBump` が決定します。毎回のリリースで 3 パッケージすべてがまとめてバンプおよび公開されます。

### CI でリリースする

リリースは **Publish packages** ワークフローが実行します。main の CI がすべて成功した後にのみタグを作成してください。

1. `common/changes/*.json` を含む PR をマージします。
2. main のコミットに `v<バージョン>` タグを付けてプッシュします。タグ名はリリース対象バージョンのプレーンな SemVer（例: `v1.2.2`）で、ワークフローのトリガーも兼ねます。実際のバージョンはロックステップポリシーが決定します。

   ```sh
   git tag v1.2.2
   git push origin v1.2.2
   ```

3. ワークフローは 3 パッケージすべてをビルドしてテストを再実行し、`rush publish --apply --publish --target-branch main` を実行します。これによりチェンジファイルの適用、バージョンと CHANGELOG の更新、main へのバンプのマージ、npm への公開が行われます。Rush が作る一時的な `<パッケージ>_v<バージョン>` タグは自動的に削除され、リポジトリにはプレーンな `v<バージョン>` リリースタグだけが残ります。

前提条件: npm の自動公開トークンをリポジトリシークレット `NPM_AUTH_TOKEN` に保存すること（`common/config/rush/.npmrc-publish` から参照）、および main がワークフローの `GITHUB_TOKEN` によるプッシュを許可すること。3 パッケージ間の内部依存はコミット済みソースと公開マニフェストの両方でキャレット範囲を維持します。ロックステップのリリースは常に同一バージョンを共有するため、範囲は必ずそのバージョンに解決されます。
