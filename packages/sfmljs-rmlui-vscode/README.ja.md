# VS Code 向け RmlUi

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語** · [한국어](README.ko.md)

RmlUi 6.3 の RML／RCSS に構文強調、スニペット、補完、ホバー説明、診断、色の
プレビューを提供します。言語サーバーを同梱し、実行時の `node_modules` は不要です。

## ビルドとインストール

既存のリポジトリで `node tools/bootstrap.cjs` を実行し、次を使います。

```sh
npm --prefix packages/sfmljs-rmlui-language-server test
npm --prefix packages/sfmljs-rmlui-vscode test
npm --prefix packages/sfmljs-rmlui-vscode run vsix -- --out rmlui.vsix
code --install-extension packages/sfmljs-rmlui-vscode/rmlui.vsix
```

VSIX の出力先は用途に合わせて指定します。VS Code 1.80 以降が必要です。
`.rml` または `.rcss` ファイルを開くと有効になります。

## コマンドと設定

コマンドパレットから RML／RCSS マニュアル、プロパティ索引、データバインディング
マニュアル、**RmlUi: Restart RmlUi language server** を開けます。
`rmlui` 設定は未知のプロパティ、タグ、擬似クラスの診断、ワークスペースの ID／class
補完、サーバートレースを制御します。独自タグはネイティブ instancer が提供できるため、
未知のタグはヒントとして表示します。

## 検証

本パッケージの `npm run test:editor` はインストール済み `code` CLI と現在のビルドで、
実際の有効化、コマンド、補完、診断、ホバー、色、サーバー再起動を検証します。
無題文書を使い、別プロファイルの作成、VS Code のダウンロード、リポジトリのコピーは
行いません。CLI 名が異なる場合は `VSCODE_CLI` を設定します。

`python tools/packaging/verify-vsix.py <archive.vsix>` でアーカイブを検証できます。
同梱ファイルを現在のビルドとバイト単位で比較し、ソース、テスト、依存関係、
ソースマップが含まれないことを確認します。
