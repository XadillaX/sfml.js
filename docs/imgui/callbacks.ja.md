# テキスト入力、コールバック、バッファ

入力欄はバイト列を編集し、リストは JavaScript からラベルを、プロットは数値を取得します。完全な [workbench](../../packages/sfml.js-imgui/examples/workbench.cjs) で試せます。

```sh
node packages/sfml.js-imgui/examples/workbench.cjs
```

Name は下の文字列を更新し、Selection は対象を変え、Frame ms はフレーム時間のリングバッファを読みます。Name にフォーカスするとコールバックのバイト数が更新されます。CallbackAlways は編集中のコールバックであり、非アクティブな入力欄でも無条件に動くアプリケーション関数ではありません。

## UTF-8 を保存して読む

バッファはループ外で一度作ります。容量は末尾ゼロを含む**バイト数**です。文字数とは異なり、多くの非 ASCII 文字は複数バイトを使います。次の関数は文字の途中で切らず、容量超過を拒否します。

```js
const name = new Uint8Array(128);

function writeText(target, value) {
  const bytes = Buffer.from(value, 'utf8');
  if (value.includes('\0') || bytes.length >= target.length) {
    throw new RangeError('Text needs room for one trailing zero byte');
  }
  target.fill(0);
  target.set(bytes);
}

function readText(source) {
  const end = source.indexOf(0);
  return Buffer.from(source.subarray(0, end < 0 ? source.length : end))
    .toString('utf8');
}

writeText(name, 'Scene');
```

初期化後、可視ウィンドウ内で毎フレーム呼びます。

```js
if (ImGui.InputText('Name', name, name.length)) {
  console.log(readText(name));
}
```

既定の戻り値は内容変更を示します。EnterReturnsTrue を付けると Enter による確定を示すため、逐次保存か確定保存かに応じて選びます。どちらでも編集中の状態はバッファに入っています。

古いアプリケーション文字列で毎フレーム上書きしないでください。初期化後は ImGui に編集させ、別オブジェクトを読み込むときやリセット時に明示的に同期します。適切な固定容量を選びます。CallbackResize は型付き配列を自動拡張する仕組みではなく、コールバック内で配列を交換する方法はサポートされた所有権管理ではありません。

## コールバック内で同期的に読む

通常の InputText にコールバックは不要です。JavaScript の処理が必要な場合に InputTextEx を使います。

```js
let callbackBytes = 0;

function inspectInput(data) {
  const fields = ImGui.viewImGuiInputTextCallbackData(data);
  callbackBytes = fields.BufTextLen;
  return 0;
}

function drawTextEditor() {
  ImGui.InputTextEx(
    'Name',
    name,
    name.length,
    ImGui.ImGuiInputTextFlags.CallbackAlways,
    inspectInput
  );
  ImGui.TextUnformatted(`Current name: ${readText(name)}`);
  ImGui.TextUnformatted(`Last active callback: ${callbackBytes} bytes`);
}
```

BufTextLen は使用中の UTF-8 バイト数、BufSize は容量です。データハンドルとビューはその呼び出し中だけ借用します。必要な数値や文字列をコピーし、ビューを保存したり await やタイマーから使ったりしないでください。戻り値は契約に従った数値で、通常はゼロが既定の処理を保ちます。

## リストとプロットのデータを渡す

選択配列とデータはフレーム外に保持し、呼び出し中は行順序を固定します。getter は複数回呼ばれるため、速く、副作用のない処理にします。

```js
const labels = [ 'Player', 'Light', 'Camera' ];
const selected = new Int32Array([ 0 ]);
const timings = new Float32Array([ 16, 17, 15, 19, 16 ]);

function drawData() {
  ImGui.ListBoxCallbackEx(
    'Selection',
    selected,
    labels.length,
    index => labels[index]
  );
  ImGui.TextUnformatted(`Selected: ${labels[selected[0]]}`);
  ImGui.PlotLinesCallbackEx(
    'Frame ms',
    timings.length,
    index => timings[index],
    null,
    0,
    null,
    0,
    40,
    [ 0, 70 ]
  );
}
```

drawData は可視ウィンドウ内で呼びます。インデックスはゼロ始まりです。データが減ったら選択範囲を補正し、空リストは要素を参照せず空状態を表示します。リングバッファでは workbench のように、最古のサンプル位置を valuesOffset に渡します。

外部データは描画の外で読み込み、到着時にモデルを更新します。async getter は Promise を返しますが、ネイティブ側は即座に文字列や数値を必要とし、待機できません。

## 所有者と寿命

| 値 | 所有者 | 有効期間 |
| --- | --- | --- |
| アプリケーションの型付き配列 | JavaScript | 読み書きするすべての呼び出し中、保持する |
| 入力コールバックのハンドル・ビュー | 現在のコールバック | その呼び出し中だけ |
| IO、スタイル、フォント | コンテキスト・アトラス | 所有者の破棄や非互換な再構築まで |
| Storage 参照ビュー | ネイティブストレージ | 構造変更でアドレスが無効になる場合がある |
| DrawList・DrawCmd コールバックハンドル | レンダラー | 記載されたフレーム・呼び出し範囲内 |

AddCallbackEx は描画リスト処理時、通常は SFML.Render 内で実行されます。そこでウィジェットを宣言しません。捕捉したリソースと userData の参照先を、すべての呼び出しが終わるまで保持します。複製した描画リストは独立して再生できるため、現在のフレーム終了だけでは寿命が終わりません。

ネイティブハンドルや不透明ポインターは JavaScript 関数ではありません。関数を bigint に変換して渡さず、JavaScript コールバックを明示的に受け取る Ex ラッパーを選びます。

切り詰めはバイト容量と終端、正しくデコードできるのに四角になる文字は[フォント](fonts.ja.md)、コールバック失敗は戻り型・フラグ・借用期間を確認します。

API：[InputTextEx](/reference/imgui/functions/ImGui.InputTextEx.html)、[ListBoxCallbackEx](/reference/imgui/functions/ImGui.ListBoxCallbackEx.html)、[PlotLinesCallbackEx](/reference/imgui/functions/ImGui.PlotLinesCallbackEx.html)、[AddCallbackEx](/reference/imgui/functions/ImGui.AddCallbackEx.html)。
