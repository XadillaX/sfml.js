# sfml.js ドキュメント

[English](README.md) / [简体中文](README.zh-CN.md) / **日本語** / [한국어](README.ko.md)

> このドキュメントは、現在のリポジトリの SFML 3.1.0 バインディングに対応しています。初めて使う場合は「クイックスタート」から読み、個々のメソッドのシグネチャを調べる場合は [TypeDoc](https://sfml.js.org/ja/reference/) を参照してください。

## はじめに

| ドキュメント | 内容 |
| --- | --- |
| [クイックスタート](getting-started.ja.md) | 依存関係のインストール、インポート方法の選択、最初のウィンドウの作成 |
| [基本概念](concepts.ja.md) | 値とリソースのコピー、読み込みの完了時点、draw が反映されるタイミング |
| [API ナビゲーション](api.ja.md) | 5 つのモジュールが提供する機能 |
| [サンプル一覧](../examples/README.ja.md) | リポジトリ内の完全なデモの実行 |

## モジュール別ガイド

| モジュール | 内容 |
| --- | --- |
| [System](system.ja.md) | ベクトル、角度、時間、入力ストリーム、Unicode、エラー処理 |
| [Window](window.ja.md) | ウィンドウのライフサイクル、イベント、リアルタイム入力、OpenGL、Vulkan |
| [Graphics](graphics.ja.md) | 画像、テクスチャ、スプライト、図形、テキスト、ビュー、描画 |
| [Audio](audio.ja.md) | 再生、ストリーミングでのデータ供給、エフェクト、録音、エンコードとデコード |
| [Network](network.ja.md) | Packet、TCP／UDP、DNS、TLS、HTTP、FTP、SFTP |

## 開発への参加

[開発ガイド](development.ja.md)では、ビルド、テスト、ソースコードの構成、現在のドキュメント公開手順を説明しています。

メソッドのシグネチャとエクスポート一覧は [src/index.ts](../src/index.ts) とそのソースコメントを基準とします。上流の概念は [SFML 3.1.0 C++ リファレンス](https://www.sfml-dev.org/documentation/3.1.0/)を参照してください。JavaScript への適応、特に Node.js の非同期処理、メモリ、ネットワークの挙動は、sfml.js のガイドと [TypeDoc](https://sfml.js.org/ja/reference/) を基準とします。
