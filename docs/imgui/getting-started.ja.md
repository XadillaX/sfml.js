# ImGui クイックスタート

カウンター付きのネイティブウィンドウを作り、そのフレームループをシーンインスペクターへ発展させます。JavaScript と SFML のウィンドウ・イベントの基礎を前提とします。C++ や Dear ImGui の経験は不要です。

## インストールと実行

ソースから開発する場合は Node.js 20 または 22、Python、C++20 ツールチェーンを用意します。[プラットフォーム要件](../sfml/getting-started.ja.md#requirements)に従い、ディスプレイと OpenGL も準備してください。monorepo のルートで実行します。

```sh
node tools/bootstrap.cjs
node packages/sfml.js-imgui/examples/demo.cjs
```

bootstrap は依存関係をインストールし、ネイティブライブラリを取得して各パッケージとサイトをビルドします。初期設定用であり、サンプルの起動ごとに実行する必要はありません。ImGui の TypeScript だけを変更した場合は `npm run build:ts --prefix packages/sfml.js-imgui` を使います。

公開済みの互換バージョンを使うアプリケーションでは、両方をインストールします。

```sh
npm install sfml.js sfml.js-imgui
```

このガイドのバージョンが未公開なら monorepo のサンプルを使ってください。サンプルは `../dist` からローカルビルドを読み込みます。次の独立プログラムはパッケージ名を使うため、両パッケージをインストールしたアプリケーション内に `counter.cjs` として保存し、`node counter.cjs` で実行します。

## 完全なカウンター

```js
const sf = require('sfml.js');
const { ImGui, SFML } = require('sfml.js-imgui');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(800, 600)),
  'ImGui counter'
);
window.setFramerateLimit(60);
const clock = new sf.Clock();
let running = true;
let clicks = 0;

function drawControls() {
  ImGui.SetNextWindowSize([ 320, 160 ], ImGui.ImGuiCond.FirstUseEver);
  if (ImGui.Begin('Controls')) {
    if (ImGui.Button('Count')) {
      clicks++;
    }
    ImGui.TextUnformatted(`Clicks: ${clicks}`);
  }
  ImGui.End();
}

try {
  if (!SFML.Init(window)) {
    throw new Error('ImGui initialization failed');
  }
  while (running && window.isOpen()) {
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      SFML.ProcessEvent(window, event);
      if (event.is('Closed')) {
        running = false;
      }
    }
    if (!running) {
      break;
    }
    SFML.Update(window, clock.restart().asSeconds());
    drawControls();

    window.clear(sf.Color.Black);
    SFML.Render(window);
    window.display();
  }
} finally {
  SFML.Shutdown(window);
  window.close();
}
```

黒いウィンドウに移動可能な Controls パネルが現れます。Count を操作するたびに値が一度増えます。折りたたんで再表示しても、アプリケーションが `clicks` を保持しているため値は残ります。ネイティブウィンドウを閉じるとループを抜け、ImGui を解放してから SFML ウィンドウを破棄します。

## 毎フレームの処理

| 段階 | 呼び出し | 役割 |
| --- | --- | --- |
| 入力収集 | `pollEvent` → `SFML.ProcessEvent` | テキスト、フォーカス、終了を含む全イベントを転送 |
| フレーム開始 | `SFML.Update(window, seconds)` | 入力と時間を更新し、ImGui フレームを開始 |
| コントロール宣言 | `drawControls()` | アプリケーション状態を読み、ウィジェットで更新 |
| シーン描画 | `window.clear`、必要なら `window.draw` | UI の背後の SFML コンテンツを準備 |
| UI 描画 | `SFML.Render(window)` | 記録済み SFML 描画を反映してから ImGui を描画 |
| 表示 | `window.display()` | 完成したフレームを表示 |

経過時間の単位は**秒**です。ミリ秒を渡さないでください。バックエンドが管理するため、このループで `ImGui.NewFrame()` や `ImGui.Render()` を追加で呼びません。永続オブジェクトはループの前で作り、ウィジェットの宣言はループ内で繰り返します。

`Begin` が false を返す場合、折りたたみなどで内容を省略できますが `End` は必要です。テーブル、メニュー、ポップアップとは規則が異なります。[レイアウト](layout.ja.md)で説明します。

## UI とシーンへ入力を振り分ける

アプリケーションのショートカットを無視するときも ImGui には全イベントが必要です。アプリケーション入力は ProcessEvent の後で処理します。次をイベントループ内に追加すると、ImGui がキーボードをキャプチャしていないときだけ Escape で終了できます。

```js
const key = event.getIf('KeyPressed');
if (key?.code === sf.Keyboard.Key.Escape &&
    !SFML.GetIO().wantCaptureKeyboard) {
  running = false;
}
```

シーンのマウス操作には `wantCaptureMouse`、キー操作には `wantCaptureKeyboard` を使います。キャプチャフラグは現在の ImGui フレーム状態を示し、イベントを Update より前に処理する通常のループでは直前の UI 更新の状態を参照します。ImGui 宛てのイベントを捨てず、ネイティブの終了イベントは常に処理してください。

`wantTextInput` はテキスト入力機能の要求であり、キーボードキャプチャの代用ではありません。キー解放で動作するシーンでは、UI が消費したキー押下を記録し、その解放でシーン操作を起動しないようにします。[シーンインスペクター](../../packages/sfml.js-imgui/examples/README.ja.md#scene-inspector)は Space ショートカットを示し、キーリピートを無効にしています。

## 初回実行の問題を調べる

| 症状 | 確認内容 |
| --- | --- |
| モジュールやネイティブバイナリがない | bootstrap の完了、または互換性のある公開版のインストール |
| ウィンドウはあるが UI がない | 呼び出し順、Init の成功、保存されたパネル位置 |
| ボタンが反応しない | 全イベントの転送と、描画フレームごとの Update |
| パネルを移動・リサイズできない | 初期サイズに FirstUseEver を使い、毎フレーム上書きしない |
| 折りたたむとアサーションが出る | Begin が false でも End を呼んでいるか |
| 終了時に失敗する | ループ終了 → Shutdown → 生存中のウィンドウを close の順か |

Dear ImGui は通常、プロセスの作業ディレクトリの `imgui.ini` にパネル位置を保存します。作業ディレクトリを明確にし、再起動で初期配置に戻るとは考えないでください。

次は[ウィジェットと状態](widgets.ja.md)です。API：[Init](/reference/imgui/functions/SFML.Init.html)、[Update](/reference/imgui/functions/SFML.Update.html)、[Render](/reference/imgui/functions/SFML.Render.html)、[Begin](/reference/imgui/functions/ImGui.Begin.html)。
