# sfml.js-imgui

[![npm version](https://img.shields.io/npm/v/sfml.js-imgui.svg?style=for-the-badge&colorA=FF69b4&colorB=cc47a4&label=sfml.js-imgui)](https://www.npmjs.org/package/sfml.js-imgui)

[English](README.md) · [简体中文](README.zh-CN.md) · **日本語** · [한국어](README.ko.md)

[sfml.js](../sfml.js) のための [Dear ImGui](https://github.com/ocornut/imgui) 1.91.9b 連携。[imgui-sfml](https://github.com/SFML/imgui-sfml) 3.0 に沿っています。JavaScript または TypeScript で、SFML ウィンドウ内にデバッグパネル、シーンインスペクター、ネイティブ編集コントロールを構築できます。

[クイックスタート](../../docs/imgui/getting-started.ja.md) · [サンプル](examples/README.ja.md) · [API リファレンス](https://sfml.js.org/ja/reference/imgui/) · [sfml.js](../sfml.js/README.ja.md)

## 機能

- Dear ImGui のフルウィジェットセット：ボタン、スライダー、カラー編集、テキスト入力、テーブル、メニュー、モーダル、プロット
- 型付き配列がネイティブのスカラーパラメーターに直接マップされる永続編集状態
- CJK カバレッジとカスタム TTF フォントに対応するフォントアトラス制御
- カスタム描画リスト、ウィンドウごとに独立した ImGui コンテキストとリソース所有権
- すべてのエクスポート関数、列挙値、ライブ構造体ビューの TypeScript 宣言

`ImGui` はウィジェット、列挙値、コールバックラッパー、ネイティブハンドル操作を提供します。`SFML` はウィンドウ連携、イベント転送、フレーム送信を担当します。

## インストール

`sfml.js-imgui` は `sfml.js` のピア依存パッケージです。両方を一緒にインストールしてください。

```sh
npm install sfml.js sfml.js-imgui
```

sfml.js と同様にインストール時にネイティブアドオンをコンパイルするため、Python、C++20 ツールチェーン、ディスプレイ、OpenGL が必要です。Node.js `^18.19.0 || >=20.5.0` に対応しています。[プラットフォーム要件](../../docs/sfml/getting-started.ja.md#requirements)を参照してください。

## カウンターの例

```javascript
const sf = require('sfml.js');
const { ImGui, SFML } = require('sfml.js-imgui');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(800, 600)),
  'ImGui counter',
);
window.setFramerateLimit(60);
const clock = new sf.Clock();
let clicks = 0;

SFML.Init(window);
try {
  while (window.isOpen()) {
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      SFML.ProcessEvent(window, event);
      if (event.is('Closed')) window.close();
    }

    SFML.Update(window, clock.restart().asSeconds());
    if (ImGui.Begin('Controls')) {
      if (ImGui.Button('Count')) clicks++;
      ImGui.TextUnformatted(`Clicks: ${clicks}`);
    }
    ImGui.End();

    window.clear(sf.Color.Black);
    SFML.Render(window);
    window.display();
  }
} finally {
  SFML.Shutdown(window);
  window.close();
}
```

## フレームのライフサイクル

| 段階 | 呼び出し | 役割 |
| --- | --- | --- |
| 入力収集 | `pollEvent` → `SFML.ProcessEvent` | テキスト、フォーカス、終了イベントを含むすべてのイベントを転送します。 |
| フレーム開始 | `SFML.Update(window, seconds)` | 入力とタイミングを更新し、ImGui フレームを開始します。 |
| コントロール宣言 | ウィジェット呼び出し | アプリ状態を読み書きします。すべての `Begin` に `End` を対にします。 |
| UI 描画 | `SFML.Render(window)` | 記録済み SFML 描画を送信し、ImGui を描画します。 |
| 表示 | `window.display()` | 完成したフレームを表示します。 |
| 終了 | `SFML.Shutdown(window)` | 生存中のネイティブウィンドウを閉じる前に ImGui を解放します。 |

時間はミリ秒ではなく**秒**で渡し、シーン入力の制御には `SFML.GetIO().wantCaptureMouse` / `wantCaptureKeyboard` を使います。`ImGui.NewFrame()` や `ImGui.Render()` を自分で呼ばないでください。バックエンドが管理します。

## サンプル

![Dear ImGui ウィジェットデモのウィンドウ](examples/screenshots/demo.png)

[`examples`](examples/README.ja.md) には実行可能なサンプルが 3 つあります。Dear ImGui のウィジェットデモ、パネルから SFML の円を操作するシーンインスペクター、テキスト入力・テーブル・モーダル・プロットを組み合わせる workbench です。

```sh
# monorepo のルートで node tools/bootstrap.cjs を実行した後
node packages/sfml.js-imgui/examples/demo.cjs
node packages/sfml.js-imgui/examples/scene-inspector.cjs
node packages/sfml.js-imgui/examples/workbench.cjs
```

## ドキュメント

ImGui ガイドは英語、簡体字中国語、日本語、韓国語で提供しています。

| 章 | 内容 |
| --- | --- |
| [クイックスタート](../../docs/imgui/getting-started.ja.md) | 完全なカウンター、フレーム、入力キャプチャ、安全な終了 |
| [ウィジェットと状態](../../docs/imgui/widgets.ja.md) | 永続状態、固有 ID、リアルタイムのシーン編集 |
| [レイアウト](../../docs/imgui/layout.ja.md) | テーブル、メニュー、確認モーダル、スコープの対応 |
| [入力とコールバック](../../docs/imgui/callbacks.ja.md) | UTF-8 編集、契約、リスト getter、プロット |
| [フォントとスタイル](../../docs/imgui/fonts.ja.md) | アトラス、CJK、間隔、色、DPI |
| [描画と複数ウィンドウ](../../docs/imgui/rendering.ja.md) | シーン合成、描画リスト、ウィンドウ別の所有権 |
| [API ガイド](../../docs/imgui/api.ja.md) | シグネチャ、オーバーロード、寿命の確認 |

## ライセンス

[MIT](../sfml.js/LICENSE)。
