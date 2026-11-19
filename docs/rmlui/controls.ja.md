# フォーム入力

要素を返す各 API はネイティブ実行時の型を使用します。検索、走査、作成、
複製、イベント対象でラッパーの同一性を保ちます。
`ElementFormControlInput`、`ElementFormControlTextArea`、
`ElementFormControlSelect` は `ElementFormControl` を、
`ElementForm` は `Element` を継承します。タグ名だけで型を判定しません。

```js
const { ElementFormControlInput } = require('sfml.js-rmlui');

const input = document.querySelector('input');

if (input instanceof ElementFormControlInput) {
  input.setName('message');
  input.setValue('A🌙中');
  input.setDisabled(false);

  input.focus();
  input.setSelectionRange(1, 3);

  console.log(input.getSelection()); // { start: 1, end: 3, text: '🌙中' }
}
```

`getName` / `setName`、`getValue` / `setValue`、
`isDisabled` / `setDisabled`、`isSubmitted` はネイティブ動作を呼び出します。
`setDisabled(false)` は属性を削除します。`isSubmitted()` は型固有の送信状態を
調べ、無効状態の判定は別です。

`form.submit(name = '', value = '')` はネイティブ `submit` イベントを発行します。
名前が空ならキーは `submit` です。無効・無名・送信対象外の入力を除外し、
同名の値は `, ` で結合します。HTTP リクエストは行いません。

## 属性に値を保持するネイティブ入力

`ElementFormControl.createInstancer(valueAttribute = 'value')` は抽象基底用の、
JS コールバックを持たない所有ネイティブ生成器を作ります。`GetValue` は指定属性を
文字列として読み、未設定時は空文字です。`SetValue` は同じ属性に書き込みます。
名前・無効状態・フォーカス・既定の `IsSubmitted = true` は実際の基底を使います。
無効状態を変更した後は、計算済みスタイルに依存するフォーカス操作の前に
コンテキストを更新します。

```js
const { ElementFormControl, Factory } = require('sfml.js-rmlui');

const allocator = ElementFormControl.createInstancer('payload');

Factory.registerElementInstancer('value-field', allocator);

const field = Factory.instanceElement(null, 'value-field', 'input', {
  name: 'answer', payload: 'Native value',
});

if (!(field instanceof ElementFormControl)) {
  throw new Error('Expected a native form control');
}

field.setValue('Updated');
console.log(field.getAttribute('payload')); // Updated

allocator.releaseElement(field);
```

ネイティブ `data-attr-payload` バインドは共有データから同じ値を更新し、
入力ごとの JS 値コールバックを呼びません。JS 派生クラスのメソッドはネイティブ
仮想関数を上書きしません。直接 `new ElementFormControl(tag)` は拒否します。
Factory は生成属性を設定し、直接 `allocator.instanceElement` は設定しません。
登録を置換しても入力の直接複製は元の生成器と属性名を保持し、解放通知をコピーします。
JS 生成コールバックは再実行しません。祖先の複製は現在の Factory 登録で子孫を
再解析します。終了時に生成器と要素が無効になります。

`Form::Submit` が選択するタグは `input`、`textarea`、`select` のみです。
そのタグで生成器を登録するか、Factory の実際のタグとして指定します。
任意のカスタムタグは送信対象として選択されません。追加済みの入力は、
明示的な解放の前に親から切り離します。

## テキスト入力とテキストエリア

`select()`、`setSelectionRange(start, end)`、`getSelection()` は Unicode
コードポイント単位です。JavaScript UTF-16 添字や UTF-8 バイト位置ではありません。
選択変更にはフォーカスが必要です。通常の入力前に `context.update()` を呼びます。
`element.focus(focusVisible = false)` はネイティブの成功フラグを返し、
`element.blur()` は解除します。text/password 以外の入力型は選択を無視し、
`{ start: 0, end: 0, text: '' }` を返します。

パスワードの選択 `text` は `*` マスクで、添字は元の Unicode コードポイント
単位です。`getValue()` とフォーム送信は実際の値を保ちます。`密🌙` の全選択は
`{ start: 0, end: 2, text: '**' }` を返します。

`setCompositionRange(start, end)` は IME 合成の表示範囲を設定します。
end が start 以下なら解除します。テキストの変更・確定は行わず、
プラットフォーム IME 対応を示すものでもありません。

テキストエリアには `setNumColumns` / `getNumColumns`（既定値 20）、
`setNumRows` / `getNumRows`（2）、`setMaxLength` / `getMaxLength`
（-1、無制限）、`setWordWrap` / `getWordWrap`（true）もあります。
行列数の最小値は 1 です。上限変更は既存テキストをコードポイント単位で切り詰めます。
その後のネイティブ `setValue` は超過でき、ユーザー編集には上限を適用します。

`element.getIntrinsicDimensions()` はネイティブ仮想メソッドの
`{ valid, dimensions: { x, y }, ratio }` を返します。未設定の出力初期値はゼロです。
入力・テキストエリアのオーバーライドも含みます。フォント依存の結果には、
読み込み済みフォントと最新のスタイル・レイアウトが必要です。

## ネイティブ入力ライフサイクル

`new TextInputHandler()` は各ウィジェットから JS を呼び出さず、Native に
通知を記録します。`createContext(name, width, height, renderer, handler)`
の第 5 引数、または `setTextInputHandler(handler)` で設定します。
既存コンテキストは元の設定を保持し、全体の設定は shutdown まで保持されます。

```js
const { TextInputHandler, createContext } = require('sfml.js-rmlui');
const handler = new TextInputHandler();
const context = createContext('editor', 800, 600, null, handler);

// 文書を表示し、レイアウト更新後に入力へフォーカスします。
const events = handler.drainEvents();

for (let i = 0; i < events.kinds.length; ++i) {
  const input = events.contexts[i];

  if (events.kinds[i] === 0 && input?.isValid) {
    input.setCursorPosition(0);
  }
}
```

`drainEvents()` は Addon を 1 回呼び出します。Native 所有の `Uint32Array`
スナップショットは 0 有効化、1 無効化、2 破棄を表し、`contexts` は対応する
一意の `TextInputContext` です。履歴の解放のため定期的に取得してください。
数値スナップショットはハンドラー解放・shutdown 後も有効です。

`TextInputContext` は `getBoundingBox()`（投影失敗時は null）、
`getSelectionRange()`、`setSelectionRange()`、`setCursorPosition()`、
`setText()`、`setCompositionRange()`、`commitComposition()` を提供します。
編集は Native で実行します。範囲は非負 int32 の Unicode コードポイントで、
終端を含まず、順序付きです。`setText()` は maxlength を無視します。
`commitComposition()` は置換範囲外の文字数から制限を計算します。
固定ソースは上流の合成文字数計算を修正しています。空範囲では置換しません。

明示的な `onActivate` / `onDeactivate` は同期で、検証付き
`TextInputContext` メソッドのみ再入可能です。`onDestroy` は無効化後の安全な
ネイティブ境界で実行し、デストラクターや V8 finalizer 内では実行しません。
破棄済みウィジェットの取得・編集はできません。フォーカス解除後も参照は有効ですが、
破棄・入力型変更・shutdown で無効になります。終了後も `isValid` は取得可能です。
OS の IME や候補ウィンドウの対応を示すものではありません。

初期化前にもハンドラーを作成・設定できます。次に成功した初期化で採用され、
初期化を拒否した場合は設定を保持します。初期化前の shutdown でも無効になります。
Node 環境の終了時は JS を呼ばずに解放します。作成した環境が設定を所有するため、
別 worker はアクセスできません。初期化前の null は初期化時に既定のハンドラーを
選び、初期化後の null は新しいコンテキストの全体ハンドラーを無効化します。

## 選択肢

`setSelection(index)` は選択を設定します。固定した 6.3 実装では範囲外は選択解除です。
`getSelection()` は添字または -1 を返します。`getOption(index)` は一意のラッパー
または null、`getNumOptions()` は個数を返します。後者 2 つは保留中の子を移動し、
option 以外を破棄する場合があるため、ネイティブイベントのコールバック中は禁止です。

`add(rml, value, before = -1, selectable = true)` は内容を追加します。
`add(element, before = -1)` は所有権付き未接続 `option` を移譲します。
接続済み要素は先に `removeChild` で外します。同一性を保ち、範囲外の添字は末尾です。
不正な所有権、文書の挿入、循環は移譲前に拒否されます。

`remove(index)` は選択肢を破棄し、範囲外は何もしません。`removeAll()` は全てを破棄し、
保持したラッパーは無効になります。`showSelectBox()` は開き、
`hideSelectBox()` は値を保持して閉じ、`cancelSelectBox()` は開いた時の値に戻して閉じます。
`isSelectBoxVisible()` はネイティブの開閉状態を返します。

新しい入力変更 API はコールバックへの再入を拒否します。値・選択範囲の読み取りは可能です。
リスナー例外はネイティブ操作から戻った後に伝播します。破棄・終了は全ての別名を無効にします。
[文書の寿命](./documents.ja.md)も参照してください。

フォーム以外は[テキスト・進捗・タブ](./text-panels.ja.md)を参照してください。
