# sfml.js-interop

[![npm version](https://img.shields.io/npm/v/sfml.js-interop.svg?style=for-the-badge&colorA=5DDB61&colorB=4BC74F&label=sfml.js-interop)](https://www.npmjs.org/package/sfml.js-interop)

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語** · [한국어](README.ko.md)

[sfml.js](../sfml.js) と [sfml.js-imgui](../sfml.js-imgui) などのアドオンのための、共有ネイティブヘッダーと SFML SDK パスです。アプリは通常 JavaScript パッケージを直接使います。このパッケージはネイティブ拡張の作者向けです。

[相互運用ガイド全体](../../docs/interop/README.ja.md) · [開発ガイド](../../docs/sfml/development.ja.md)

## 使い方

拡張の依存関係に `sfml.js-interop` を宣言します。[nan](https://www.npmjs.com/package/nan) と同様、このパッケージを require すると include ディレクトリが返ります。

```js
const includeDir = require('sfml.js-interop');
```

`require('sfml.js-interop/paths')` は解決済みの SDK パスを公開します。

| エクスポート | パス |
| --- | --- |
| `root` | ダウンロードした SDK を含むパッケージルート |
| `include` | 相互運用ヘッダーのディレクトリ |
| `sfmlInclude` | SFML C++ ヘッダー |
| `sfmlLib` | SFML リンクライブラリ |
| `sfmlBin` | SFML ランタイムバイナリ |

隣接リポジトリの非公開ヘッダーをハードコードせず、`binding.gyp` から両方の include ディレクトリを参照してください。

```json
{
  "include_dirs": [
    "<!(node -e \"process.stdout.write(require('sfml.js-interop'))\")",
    "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlInclude)\")"
  ]
}
```

## 契約

- `sfml-js-interop.h` は `SFMLJS_INTEROP_VERSION`（現在は 1）を公開し、`shared-handle.h`、`exception-boundary.h`、`numeric-fields.h` を取り込みます。
- ホストバインディングの契約と SFML バージョンに合わせてください。バージョンマクロの一致だけでは、独立したビルド設定のバイナリー間の ABI 互換性を保証しません。
- `RenderWindowFrom` が受け取るのは公開 JavaScript RenderWindow オブジェクトではなく、バインディング内部のネイティブウィンドウハンドルです。
- 寿命はネイティブ所有者が管理します。ビューや借用ポインターは所有者、コンテキスト、ウィンドウより長く保持できません。
- 記録済み描画のためにリソースを保持し、呼び出し時のスナップショットを守り、C++ コールバックを V8 に公開する際は共有例外境界を使います。

SDK の取得はこのパッケージが担当します。Rush は interop、sfml.js、sfml.js-imgui の順にビルドします。完全な利用例は[統合ソース](../sfml.js-imgui/native/interop.h)と [JS ブリッジ](../sfml.js-imgui/src/internal/sfml-interop.ts)を参照してください。

## ライセンス

[MIT](../sfml.js/LICENSE)。
