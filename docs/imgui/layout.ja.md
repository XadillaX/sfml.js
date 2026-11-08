# レイアウトとツールパネル

個別のコントロールをメニュー、オブジェクト表、確認ダイアログのあるエディターへまとめます。[workbench の完全なソース](../../packages/sfml.js-imgui/examples/workbench.cjs)にはフレームループと永続状態が含まれます。

```sh
node packages/sfml.js-imgui/examples/workbench.cjs
```

Name を編集し、オブジェクトを選択して表のチェックを切り替えます。Scene → Reset でモーダルを開き、Cancel で保持、Reset で初期化します。この章ではその構成方法を説明します。

## レイアウトカーソルを使う

ウィジェットは通常、縦に進みます。SameLine は次の項目を横に置き、Separator は区切りを作り、Dummy はカスタム描画用の領域を確保します。個々のウィジェットを固定座標に置くより、これらとテーブルを使います。

`SetNextWindowSize(size, FirstUseEver)` は初期サイズだけを設定し、ユーザーの変更や保存済み設定を尊重します。ラベルと入力欄に十分な幅を確保してください。狭いパネルではツールバーを縦にするなどの調整が必要です。SameLine の連続呼び出しは自動で折り返しません。

可視の親ウィンドウ内で、独立したスクロール領域を作れます。

```js
if (ImGui.BeginChild(
  'help',
  [ 0, 100 ],
  ImGui.ImGuiChildFlags.Borders
)) {
  ImGui.TextUnformatted('Select an object, then edit its enabled flag.');
  ImGui.TextUnformatted('This area scrolls separately from the parent.');
}
ImGui.EndChild();
```

幅ゼロは親の利用可能幅です。クリップされて BeginChild が false を返す場合も EndChild が必要です。

## テーブルで値をそろえる

workbench の rows は安定した ID、ラベル、永続 Uint8Array を持ちます。次の完全な表関数を、親の Begin が成功した分岐で呼びます。

```js
function drawRows() {
  const flags =
    ImGui.ImGuiTableFlags.Borders +
    ImGui.ImGuiTableFlags.RowBg +
    ImGui.ImGuiTableFlags.Resizable;
  if (ImGui.BeginTable('objects', 2, flags)) {
    ImGui.TableSetupColumn('Object');
    ImGui.TableSetupColumn('Enabled');
    ImGui.TableHeadersRow();
    for (const row of rows) {
      ImGui.PushID(row.id);
      ImGui.TableNextRow();
      ImGui.TableNextColumn();
      ImGui.TextUnformatted(row.label);
      ImGui.TableNextColumn();
      ImGui.Checkbox('##enabled', row.enabled);
      ImGui.PopID();
    }
    ImGui.EndTable();
  }
}
```

TableNextRow で行を進め、TableNextColumn でセルへ移ります。見出しが無ラベルのチェックボックスを説明し、PushID が操作状態を区別します。列幅変更は行の ID に影響しません。大量の行には list clipper API を使い、毎フレーム全行を整形せず可視範囲を送信します。

## 操作からポップアップを開く

OpenPopup は開く要求、BeginPopupModal は以後のフレームでの内容宣言です。毎フレーム OpenPopup を呼ぶと正常な終了を妨げます。ポップアップ ID も ID スタックに依存するため、要求と宣言を同じスコープに置きます。

reset はアプリケーション状態を初期化する関数です。

```js
function drawMenu() {
  let requestReset = false;
  if (ImGui.BeginMenuBar()) {
    if (ImGui.BeginMenu('Scene')) {
      requestReset = ImGui.MenuItem('Reset...');
      ImGui.EndMenu();
    }
    ImGui.EndMenuBar();
  }
  if (requestReset) {
    ImGui.OpenPopup('Reset scene?');
  }
  if (ImGui.BeginPopupModal(
    'Reset scene?',
    null,
    ImGui.ImGuiWindowFlags.AlwaysAutoResize
  )) {
    ImGui.TextUnformatted('Restore the current scene settings?');
    if (ImGui.Button('Reset')) {
      reset();
      ImGui.CloseCurrentPopup();
    }
    ImGui.SameLine();
    if (ImGui.Button('Cancel')) {
      ImGui.CloseCurrentPopup();
    }
    ImGui.EndPopup();
  }
}
```

親は `ImGui.Begin('Workbench', null, ImGui.ImGuiWindowFlags.MenuBar)` を使い、その内部で drawMenu を呼びます。要求はメニュースコープを閉じてから出すため、モーダルの宣言と同じスコープになります。モーダルは他の ImGui ウィンドウへの操作を遮断しますが、JavaScript のシーン更新を止めません。

## スコープの対応規則

| 開始 | 終了 | 終了条件 |
| --- | --- | --- |
| Begin | End | false を含め、Begin を呼んだら必ず |
| BeginChild | EndChild | BeginChild を呼んだら必ず |
| BeginTable | EndTable | true の場合だけ |
| BeginMenuBar / BeginMenu | EndMenuBar / EndMenu | 対応する開始が true の場合だけ |
| BeginPopup / BeginPopupModal | EndPopup | 対応する開始が true の場合だけ |
| PushID、PushFont、スタイル Push | 対応する Pop | Push ごとに一回、入れ子の逆順 |

ポップアップが出ないなら ID スコープと毎フレームの宣言を、アサーションならスコープ対応を、違う行が変更されるなら安定 ID を確認します。

次は[テキスト入力とコールバック](callbacks.ja.md)です。API：[BeginTable](/reference/imgui/functions/ImGui.BeginTable.html)、[BeginChild](/reference/imgui/functions/ImGui.BeginChild.html)、[OpenPopup](/reference/imgui/functions/ImGui.OpenPopup.html)、[BeginPopupModal](/reference/imgui/functions/ImGui.BeginPopupModal.html)。
