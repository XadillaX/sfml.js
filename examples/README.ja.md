# サンプル

[English](README.md) / [简体中文](README.zh-CN.md) / **日本語** / [한국어](README.ko.md)

> このリポジトリのサンプルはルートで実行します。初回は `npm ci`、ソース変更後は `npm run build` を実行してください。描画には OpenGL ウィンドウに対応するグラフィカルセッションが必要です。独立したプロジェクトには個別の導入手順があります。

## ここから始める

- <a id="breakout"></a>[Breakout：衝突判定、ライフ、スコア、一時停止を備えたブロック崩し。](projects/README.ja.md#breakout)

- [Shader：キーボードとマウスで操作する 5 種類の公式シェーダー。](official/README.ja.md#shader)

- <a id="16-games"></a>[16 ゲーム：Tetris から Asteroids までの ClojureScript 全作品ギャラリー。](projects/README.ja.md#16-games)

## 目的別に探す

- <a id="screenshots"></a>[機能サンプル](features/README.ja.md): System、Window、Graphics、Audio、Network に分けた 15 個の入口。

- [公式サンプル](official/README.ja.md): 操作方法、プラットフォーム要件、出典を記載した 24 個の SFML 移植。

- <a id="game-projects"></a>[ゲームとアプリ](projects/README.ja.md): [Süper Mario Kart](projects/README.ja.md#super-mario-kart)、[play-nes](projects/README.ja.md#play-nes)、Breakout、JavaScript の 5 ゲーム、ClojureScript の 16 ゲーム。

## 実行前の準備

```sh
node examples/breakout.cjs
node examples/official/shader/Shader.cjs
node examples/network.cjs
```

[プロジェクトトップ](../README.ja.md) · [クイックスタート](../docs/getting-started.ja.md) · [開発ガイド](../docs/development.ja.md)
