# ウィジェットと状態

編集結果をフレーム間で保持し、シーンへ即座に反映するコントロールを作ります。完全な[シーンインスペクター](../../packages/sfml.js-imgui/examples/scene-inspector.cjs)を実行してください。

```sh
node packages/sfml.js-imgui/examples/scene-inspector.cjs
```

Animate は円を停止し、Speed は軌道の速度、Radius と Color は SFML の形状と塗りを変更します。Reset は初期値に戻します。ソースには[クイックスタート](getting-started.ja.md)のイベントループ、入力キャプチャ、終了処理が含まれます。

## 状態はフレームの外に置く

Dear ImGui は即時モードです。アプリケーションが毎フレームコントロールを宣言し、ImGui がフォーカスなどの操作状態を保持します。編集対象の値はアプリケーションが所有します。毎フレーム関数を呼ぶことと、値を毎回作り直すことは別です。

| コントロール・値 | 保存形式 | 結果の読み方 |
| --- | --- | --- |
| チェックボックス、ウィンドウ開閉 | `new Uint8Array([ 1 ])` | `state[0] !== 0` |
| 整数入力、選択インデックス | `new Int32Array([ 0 ])` | `state[0]` |
| スライダー、浮動小数点入力 | `new Float32Array([ 0.5 ])` | `state[0]` |
| RGB / RGBA | 3 / 4 要素の `Float32Array` | 0–1 のチャンネル値 |
| 編集可能テキスト | ゼロ終端の `Uint8Array` | [バッファ](callbacks.ja.md)で UTF-8 を解説 |

JavaScript の数値は値渡しなので、ネイティブポインターの書き戻し先になりません。通常の配列は `[ 320, 160 ]` のようなベクトル値には使えますが、書き込み可能な Float32Array の代わりにはなりません。

## 編集パネルを作る

クイックスタートのインポート、ウィンドウ、ループを残し、drawControls を次に置き換えます。状態の宣言はループより前に置いてください。

```js
const enabled = new Uint8Array([ 1 ]);
const speed = new Float32Array([ 1 ]);
const tint = new Float32Array([ 0.25, 0.75, 0.95 ]);
const panelOpen = new Uint8Array([ 1 ]);

function drawControls() {
  if (!panelOpen[0]) {
    return;
  }
  if (ImGui.Begin('Controls', panelOpen)) {
    ImGui.Checkbox('Animate', enabled);
    const changed = ImGui.SliderFloatEx(
      'Speed',
      speed,
      0,
      3,
      '%.2f',
      ImGui.ImGuiSliderFlags.AlwaysClamp
    );
    ImGui.ColorEdit3('Tint', tint);
    if (changed) {
      console.log(`New speed: ${speed[0]}`);
    }
    if (ImGui.Button('Reset')) {
      enabled[0] = 1;
      speed[0] = 1;
      tint.set([ 0.25, 0.75, 0.95 ]);
    }
    ImGui.TextUnformatted(`Speed: ${speed[0].toFixed(2)}`);
  }
  ImGui.End();
}
```

閉じるボタンは panelOpen にゼロを書き込みます。メニューなどで一に戻すと再表示できます。折りたたみは内容を省略するだけです。常に表示するパネルに、ゼロになった開閉フラグを渡し続けないでください。

Button は操作の発生、Checkbox・SliderFloatEx・ColorEdit3 は編集の発生を返します。編集値そのものではありません。シーンが現在値を必要とするなら、戻り値が false のフレームでも配列を読みます。AlwaysClamp はスライダーへの直接テキスト入力も制限します。ドラッグ範囲だけで全入力モードを検証できるとは限りません。

SFML オブジェクトも再利用します。インスペクターは半径変更後に setRadius と原点更新を行い、中心を保ちます。色は `Math.round(channel * 255)` で SFML のチャンネルへ変換し、enabled が非ゼロのときだけ `seconds * speed[0]` でアニメーションを進めます。

## 繰り返すコントロールには安定した ID を付ける

ラベルは ID の一部です。同じスコープの Reset ボタン二つは、位置が違っても衝突します。

| 書き方 | 表示 | ID |
| --- | --- | --- |
| `Reset##player` | Reset | `##player` を含む |
| `Reset##camera` | Reset | player とは別 |
| `FPS: 60###stats` | FPS: 60 | 表示値が変わっても stats は一定 |
| `PushID(row.id)` と `Checkbox('##enabled', ...)` | ラベルなし | 安定した行 ID で区別 |

並べ替えや挿入・削除がある行には配列インデックスでなくオブジェクト ID を使います。そうしないと編集中のコントロールが別の行の状態を引き継ぐことがあります。rows はループ外に置き、次を可視ウィンドウ内で呼びます。

```js
const rows = [
  { id: 'player', label: 'Player', enabled: new Uint8Array([ 1 ]) },
  { id: 'camera', label: 'Camera', enabled: new Uint8Array([ 0 ]) },
];

function drawRows() {
  for (const row of rows) {
    ImGui.PushID(row.id);
    ImGui.Checkbox('Enabled', row.enabled);
    ImGui.SameLine();
    ImGui.TextUnformatted(row.label);
    ImGui.PopID();
  }
}
```

Begin が成功した分岐で drawRows を呼びます。Push と Pop は同じスコープで対応させます。例外が起こり得て処理を復帰させる場合は try/finally を使います。

## テキスト、精度、所有権

ファイル名、ユーザー入力、テンプレート文字列には TextUnformatted を使います。`%` を書式指定として解釈しません。書式が必要な場合だけ対応ラッパーを使ってください。

Float32Array は単精度です。toFixed は表示文字列だけを変えます。高精度が必要なら別のアプリケーションモデルを持ち、ウィジェット編集を反映するタイミングを決めます。

アプリケーションが作った配列は JavaScript 所有です。Storage_GetIntRef、スタイル、コールバックのビューはネイティブメモリを借用します。JavaScript から参照できても、破棄済みコンテキストや無効化されたアドレスは使えません。[寿命の説明](callbacks.ja.md)を確認してください。

毎フレーム値が戻るなら関数内の状態生成、編集フレームだけ真になるなら戻り値の誤用、別の行が反応するなら ID を確認します。

次は[レイアウト](layout.ja.md)です。API：[Checkbox](/reference/imgui/functions/ImGui.Checkbox.html)、[SliderFloatEx](/reference/imgui/functions/ImGui.SliderFloatEx.html)、[PushID](/reference/imgui/functions/ImGui.PushID.html)、[TextUnformatted](/reference/imgui/functions/ImGui.TextUnformatted.html)。
