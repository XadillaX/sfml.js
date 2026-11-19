# RmlUi ソース構成

[English](source-layout.md) · [简体中文](source-layout.zh-CN.md) · **日本語** · [한국어](source-layout.ko.md)

`packages/sfml.js-rmlui` はネイティブバインディング、TypeScript インターフェース、テストを責務別に配置しています。新しい実装は担当モジュールに置き、関連するヘッダーと実装ファイルをまとめます。

| ディレクトリ | 責務 |
| --- | --- |
| `runtime/` | 初期化、Context、実行時状態、機能照会、コールバック寿命、Plugin、Debugger |
| `dom/documents/` | ドキュメント、Factory、属性集合、XML 解析 |
| `dom/elements/` | Element、レイアウト、スクロール、要素のインスタンス化、SVG、Lottie |
| `dom/controls/` | フォーム、テキストコントロール、選択肢、パネル |
| `data/` | データモデル、型登録、アドレス、メンバー、バッチ処理、診断 |
| `events/` | イベント、リスナー、ディスパッチ、インスタンス化 |
| `style/properties/` | Property、パーサー、仕様、スタイルシート |
| `style/effects/` | デコレーター、フィルター、エフェクト値とコールバック |
| `style/values/` | 計算済みスタイル、スタイル構造体、変換、マップされたビュー |
| `animation/` | アニメーション、トランジション、Tween、値コールバック |
| `rendering/` | 描画管理、ジオメトリ、テクスチャ、レイヤー、リソース、SFML 描画アダプター |
| `fonts/` | フォント読み込み、FreeType/HarfBuzz/ビットマップエンジン、計測、グリフ、フォントエフェクト |
| `scripting/` | スクリプトインターフェース、ホスト、スクリプトオブジェクト |
| `scripting/lua/` | Lua ホスト、モデル、値、関数、インスタンス化 |
| `platform/` | SFML システム連携、入力、テキスト入力、ウィンドウ密度 |
| `io/` | ファイルインターフェース、ストリーム |
| `values/` | Variant、数値、文字列、URL、共有型 |

これらは `native/` と `src/` の下にあります。片方の層だけで必要な実装はその層に置きます。`src/internal/` はネイティブローダー、ラッパー割り当て、共有メモリ変換など、モジュール間の内部プロトコルを保持します。

`src/index.ts` が npm の公開入口、`native/addon.cc` がネイティブモジュールの登録入口です。パッケージのビルド設定はルートの `binding.gyp`、`package.json`、`tsconfig.json` に残します。

生成ファイルは `src/generated/` と `native/generated/` にあります。生成処理の変更は `tools/codegen/` の生成器を編集してから再生成します。

| ツールディレクトリ | 責務 |
| --- | --- |
| `tools/build/` | パッケージのネイティブビルド、Lua の C++ コンパイル、コンパイルデータベース修正。リポジトリ LSP データベースの統合は所属する Rush ワークスペース内だけで実行 |
| `tools/codegen/` | 上流ヘッダーから入力、イベント、プロパティ ID、スタイルバインディングを生成 |
| `tools/dependencies/` | 依存バージョン、検証、ダウンロード、ビルドソース一覧 |
| `tools/dependencies/patches/` | RmlUi、Lua、Debugger、数値、文字列、rlottie のパッチ |
| `tools/performance/` | 性能測定、ネイティブ呼び出し回数 |
| `tools/testing/` | 実行時テストの再帰収集・実行、クリップボード保護、npm ソースパッケージのファイル一覧とビルド依存の検証 |

`test/` は実行時・型テストをモジュール別に配置します。`test/native/` は C++ 対照プログラムとビルドスクリプトをモジュール別に配置します。スクリプトは現在のパッケージのオブジェクトファイルを再利用し、呼び出し元が既存の一時出力ディレクトリを指定します。

`packages/sfmljs-rmlui-vscode/tools/testing/` は既存の VS Code で拡張機能の統合検証を実行します。同パッケージの `tools/packaging/` は VSIX 内蔵クライアント、言語サーバー、言語リソース、四言語の README を検証します。リポジトリ共通の Windows ツールチェーン初期化は `tools/ci/` にあり、既存の Node.js CI と専用 RmlUi CI で共有します。

`third_party/` は上流のディレクトリ構成を保持します。`build/` と `dist/` は既存のビルドディレクトリを再利用します。ソース移動後は、新しいパスの成果物が存在する旧成果物だけを削除します。

ディレクトリ移動は RmlUi 6.3 全体の受け入れ完了を意味しません。`audit/6.3/` の既存証拠は採取時のパスとハッシュを保持します。過去のパスは[移動対応表](audit/6.3/source-layout-map.json)で確認してください。
