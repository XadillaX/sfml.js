# テキスト・進捗・タブ

`Document.createTextNode(text)` は `ElementText | null` を返します。
検索・走査・複製・イベント対象はネイティブ派生型とラッパーの同一性を保持します。
`ElementText`、`ElementProgress`、`ElementTabSet` は `Element` を継承します。

## 文字組み

`getText()` / `setText(text)` は元のリテラルテキストを扱います。
測定・描画の前にフォントを読み込み、所有コンテキストを更新してください。

```js
const text = document.createTextNode('A🌙中 &amp; Z');

document.getElementById('content').appendChild(text);
context.update();
const line = text.generateLine(1, Infinity, 0, true, true, false);
// { line: '🌙中 & Z', lineLength: 15, lineWidth: ..., reachedEnd: true }
```

`generateLine(lineBegin, maximumLineWidth, rightSpacingWidth,
trimWhitespacePrefix, decodeEscapeCharacters, allowEmpty)` はネイティブ入力を
すべて明示的に受け取り、既定値はありません。`lineBegin` と出力 `lineLength` は
**元テキストの UTF-8 バイト数**です。開始位置はゼロからバイト長までの int32
文字境界で、終端も有効です。JavaScript UTF-16 添字は直接使えません。
消費バイト数は書式処理後の行のバイト数と異なる場合があります。

最大幅は非負、`Infinity` は無制限です。右余白は最後のトークン後に確保する有限の
ピクセル幅です。ネイティブ RCSS の空白・単語分割・大文字小文字変換に従います。
`allowEmpty` は収まらない場合に消費をゼロにすることを許可します。
強制改行は最後のバイトまで消費しても false を返す場合があります。
フォントがない場合は
`{ line: '', lineLength: 0, lineWidth: 0, reachedEnd: true }` を返します。

`generateLine` は測定のみです。`clearLines()` は行を消去し、
`addLine({ x, y }, text)` は最初の行からの有限ベースラインオフセットに
書式処理済みの行を追加します。`suppressAutoLayout()` は以後のテキスト変更による
再配置を抑制する一方向設定です。他の文書変更による再配置はあり得ます。

`getLines()` は `{ text, position: { x, y }, width }` のコピーを返します。
ネイティブ整数幅は初期値ゼロで、ジオメトリ生成時に更新されます。
コピーは再配置・行削除・要素破棄後も有効で、変更しても要素には影響しません。

## 進捗

`getValue()` は `[0, getMax()]` に制限された値を返し、既定値はゼロです。
`setValue(value)` は有限浮動小数点数を保存します。`getMax()` の既定値は 1 で、
保存値が正でない場合も 1 を返します。`setMax(value)` は有限値を保存します。
`getIntrinsicDimensions()` はネイティブの進捗実装を呼び、幅は密度非依存
256 ピクセル、高さは現在の行高です。未指定の縦横比はゼロのままです。

## タブ

`setTab(index, rmlOrElement)` と `setPanel(index, rmlOrElement)` は両方の
ネイティブオーバーロードに対応します。既存の int32 添字なら置換し、それ以外は
末尾に追加します。添字の空きは埋めません。要素引数は未接続ツリーの所有権を移します。
接続中の要素は先に親から外してください。見出し・パネルの置換や削除は
要素を破棄し、保持したラッパーを無効にします。

`removeTab(index)` は存在する見出しとパネルを削除します。
`getNumTabs()` はパネル数と独立した見出し数で、内部 tabs コンテナーを作る場合が
あります。`getActiveTab()` は空でも初期値ゼロです。`setActiveTab(index)` は
制限されない int32 添字を保存し、変化時だけ `parameters.tab_index` を含む
`tabchange` を送出します。ネイティブクリックの既定動作もタブを切り替えます。

文字組み・変更操作、進捗・タブの変更、ツリーを変更し得る `getNumTabs()` は
イベントへの再入を拒否します。元テキスト・行コピー・進捗値・有効タブの読み取りは
可能です。リスナー例外はネイティブ操作が戻った後に伝播します。

継承した `processDefaultAction(event)` はコールバック中に使えます。
[ネイティブ型と既定動作](./rtti-default-actions.ja.md)、
[フォーム](./controls.ja.md)と[文書の寿命](./documents.ja.md)も参照してください。
