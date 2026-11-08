# 描画と複数ウィンドウ

SFML シーンと ImGui を重ね、パネル内に独自図形を描き、各ウィンドウのリソース所有権を理解します。シーン合成は[インスペクター](../../packages/sfml.js-imgui/examples/scene-inspector.cjs)、パネル内描画は [workbench](../../packages/sfml.js-imgui/examples/workbench.cjs) で確認できます。

```sh
node packages/sfml.js-imgui/examples/scene-inspector.cjs
node packages/sfml.js-imgui/examples/workbench.cjs
```

一度に一つ実行し、ウィンドウを閉じて終了します。インスペクターは UI の背後に動く SFML の円を描き、workbench は選択ラベルの横に ImGui の円を配置します。

## シーンを UI より前に送信する

インスペクターの毎フレームの順序です。

```js
SFML.Update(window, seconds);
drawControls(seconds);
window.clear(background);
window.draw(circle);
SFML.Render(window);
window.display();
```

seconds、background、circle、drawControls は完全なインスペクターのものです。コントロールがモデルを編集してから描画を記録します。SFML.Render はバックエンド実行前に window.flush を呼び、記録済み SFML 描画を UI より前に反映します。

UI の描画後に clear すると UI が消えます。Render の後で SFML を描くとコントロールを覆う場合があります。通常のオーバーレイではこの順序を守れば OpenGL 状態の手動管理は不要です。

## パネル内に描く

ウィンドウの描画リストを使うと、そのクリップに従って装飾を描けます。可視ウィンドウ内で次を呼びます。

```js
function drawPreview() {
  const origin = ImGui.GetCursorScreenPos();
  const list = ImGui.GetWindowDrawList();
  if (list) {
    ImGui.ImDrawList_AddCircleFilled(
      list,
      [ origin.x + 48, origin.y + 48 ],
      32,
      ImGui.GetColorU32(ImGui.ImGuiCol.PlotHistogram)
    );
  }
  ImGui.Dummy([ 96, 96 ]);
  ImGui.SameLine();
  ImGui.TextUnformatted('Custom preview');
}
```

Begin 成功後に drawPreview を呼びます。描画リストはスクリーン座標なので GetCursorScreenPos を起点にします。色はスタイルからパック済み値を取得し、バイト順を推測しません。描画命令だけでは領域や操作項目が作られないため、Dummy でレイアウトを進めます。

クリックやドラッグが必要なら InvisibleButtonEx などを同じ領域に配置し、項目・マウスの問い合わせで状態を更新します。見える図形だけでは入力を受け取りません。

## テクスチャ ID の意味

ImGui.Image が受け取るのは bigint のバックエンドテクスチャ ID であり、sf.Texture やファイル名ではありません。JavaScript オブジェクトや interop ポインターを bigint へ変換して ID を作らないでください。オブジェクトのアドレスと GPU テクスチャ ID は別物です。

明示的に対応したブリッジを使ってください。[相互運用ガイド](../interop/README.ja.md)はネイティブオブジェクト共有を説明しますが、そのハンドルだけでは ImGui のテクスチャアダプターになりません。参照する全描画命令の処理完了まで GPU テクスチャを保持します。検証済みブリッジがない場面では、インスペクターのように同じウィンドウへ SFML でシーンを描けます。

## ネイティブウィンドウごとのコンテキスト

SFML.Init は各ネイティブウィンドウの連携を初期化します。Begin で作る ImGui パネルは別の SFML ウィンドウではありません。複数のネイティブウィンドウにはそれぞれ Init、Update、Render、Shutdown が必要です。

[複数ウィンドウの実行テスト](../../packages/sfml.js-imgui/test/multi-window.test.cjs)が切り替えを検証します。アプリケーションでは次の順に処理します。

1. 各ウィンドウを初期化し、状態と時計を保持する。
2. フォント、スタイル、IO の操作前に SetCurrentWindow で選択する。
3. そのイベントを転送し、フレームを開始してコントロールを宣言する。
4. そのウィンドウを clear、Render、display する。
5. 終了時は Shutdown → close の順に処理し、以後のフレーム対象から除く。

ProcessEvent、Update、Render は対応するコンテキストを選びます。しかしフォント読み込みやスタイル変更では、直前に偶然処理されたウィンドウへ依存しないでください。フォントと借用ビューは元のコンテキストに属し、他のウィンドウのハンドルとして使えません。

更新間隔が異なるならウィンドウごとに時間を計算します。同じ時計を各ウィンドウで順に restart すると、各フレームの長さでなくウィンドウ間の間隔を測ってしまいます。

## フレームリソースの寿命

描画リストは現在のフレームで取得します。Shutdown を越えて保持せず、内容が次のフレームにも残るとは考えません。JavaScript の参照はネイティブ所有権の保証ではありません。

AddCallbackEx はウィジェット構築後の描画中に実行されます。Begin やウィジェット追加、コンテキスト切り替え、使用中リソースの破棄を行いません。複製リストは独立した寿命とコールバック保持を管理します。[コールバック](callbacks.ja.md)を参照してください。

次の項目を図形が覆うなら領域確保、位置が違うなら座標系、別ウィンドウのフォントやスタイルになるならコンテキスト選択を確認します。

API：[Render](/reference/imgui/functions/SFML.Render.html)、[GetWindowDrawList](/reference/imgui/functions/ImGui.GetWindowDrawList.html)、[ImDrawList_AddCircleFilled](/reference/imgui/functions/ImGui.ImDrawList_AddCircleFilled.html)、[SetCurrentWindow](/reference/imgui/functions/SFML.SetCurrentWindow.html)。
