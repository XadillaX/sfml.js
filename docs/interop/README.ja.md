# ネイティブ拡張の開発

sfml.js-interop は共有ネイティブヘッダーと SFML SDK のパスを両方のバインディングに提供します。アプリは通常 JavaScript パッケージを使用し、ネイティブ拡張は隣接リポジトリの非公開ヘッダーではなく、この契約を利用します。

拡張の依存関係に `sfml.js-interop` を宣言します。nan と同様、`require('sfml.js-interop')` は include ディレクトリを返します。`require('sfml.js-interop/paths')` は `root`、`include`、`sfmlInclude`、`sfmlLib`、`sfmlBin` を公開します。依存パッケージを利用する側で解決してください。

```json
{
  "include_dirs": [
    "<!(node -e \"process.stdout.write(require('sfml.js-interop'))\")",
    "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlInclude)\")"
  ]
}
```

`sfml-js-interop.h` は `SFMLJS_INTEROP_VERSION`（現在は 1）と `shared-handle.h`、`exception-boundary.h`、`numeric-fields.h` を公開します。ホストと契約・SFML のバージョンを合わせます。`RenderWindowFrom` が受け取るのはバインディング内部のネイティブハンドルで、公開 JavaScript RenderWindow オブジェクトではありません。

寿命はネイティブ所有者が管理します。ビューや借用ポインターは所有者、コンテキスト、ウィンドウより長く保持できません。記録済み描画ではリソースを保持し、呼び出し時のスナップショットを守ります。V8 に C++ コールバックを公開する際は共有例外境界を使用します。バージョンマクロの一致だけでは異なるビルド設定のバイナリー間の ABI 互換性を保証しません。

Rush は interop、sfml.js、sfml.js-imgui の順にビルドします。SDK の取得は interop が担当し、拡張に兄弟パッケージのパスを固定しません。[統合ソース](../../packages/sfml.js-imgui/native/interop.h)、[JS ブリッジ](../../packages/sfml.js-imgui/src/internal/sfml-interop.ts)、[開発ガイド](../sfml/development.ja.md)を参照してください。
