# RmlUi バイトストリーム

`StreamMemory`、`StreamFile`、`Stream` は RmlUi のストリーム API を実装します。
`context.loadDocument(stream)` と
`container.loadStyleSheetContainer(stream)` は現在位置から解析します。
相対 RCSS、画像、フォントの参照元として、解析前に URL を設定してください。
RML の `<head>` が読み込んだ文書にこの URL を保存します。

```js
const { StreamMemory, SeekOrigin, StyleSheetContainer } = require('sfml.js-rmlui');
const source = new StreamMemory(Buffer.from(
  '<rml><head/><body id="panel"/></rml>'));

source.setSourceURL('/application/assets/panel.rml');
const document = context.loadDocument(source);

const rules = new StreamMemory(Buffer.from('#panel { width: 240px; }'));

rules.setSourceURL('/application/assets/panel.rcss');
const container = new StyleSheetContainer();

container.loadStyleSheetContainer(rules);
document.setStyleSheetContainer(container);

source.seek(0, SeekOrigin.Set);
console.log(source.readString(5)); // <rml>
```

## メモリとファイル

`new StreamMemory()` は初期容量 256 バイトの書き込み可能なネイティブ領域です。
数値で容量を指定しても、初期の長さはゼロです。
`Uint8Array` を渡すとビューをコピーし、ネイティブ所有の読み取り専用領域を
作成します。元のビューを変更、切り離ししても影響しません。
読み取り専用領域ではすべての変更操作が例外になります。

`read(count)` と `peek(count)` は独立配列を返します。ビュー形式はバイト数を
返し、指定ビューの範囲だけを書き換えます。`rawStream()` は位置に関係なく
使用中の全バイトをコピーします。返却配列は再割り当てや shutdown 後も有効です。

`write(string)` は埋め込みヌルを保持し、`writeCString(string)` は最初のヌルで
停止します。`readString(count, initial)` はヌルも含めて UTF-8 を復号し、
初期文字列に追加します。数は JavaScript 文字数ではなくバイト数です。
ストリームコピーは出力の書き込みが短い場合も、元から消費したバイト数を返します。

メモリの `seek(offset, SeekOrigin.End)` は上流と同じ `length - offset` です。
ファイルは `length + offset`、カスタムストリームはコールバックの規則です。
メモリの削除は現在位置を新しい長さ以内に制限します。先頭削除では位置を戻し、
ゼロ未満にしません。pop の数は最大でも現在長です。切り詰めは位置を新しい末尾へ
移動します。

`new StreamFile()` は未オープンです。`open(path)` は既存ハンドルを閉じ、
インストール済みの RmlUi ファイル API で開きます。ファイルは読み取り専用です。
`close()` 後の read、seek、位置取得には再度 open が必要です。
shutdown はファイル API の破棄前にすべてのファイルを自動で閉じます。

バイトバッチとメモリ容量は `[0, 2147483647]` の整数です。
切り離し済み、共有、サイズ変更可能なバッファは拒否されます。
参照元 URL はヌルを含まない文字列です。shutdown はラッパーを無効にしますが、
返却済みのコピーは有効です。

## カスタム同期ストリーム

`new Stream(callbacks, sourceUrl, mode)` に `length`、`tell`、`seek`、`read`、
`write`、`truncate`、`isReadReady`、`isWriteReady` を実装して渡します。
既定 URL は空、モードは `StreamMode.Read + StreamMode.Write` です。

読み取りは独立した一時 `Uint8Array` と最大数を受け取り、許可された範囲を
埋めて `[0, count]` の整数を返します。一時バッファの切り離し、サイズ変更は
禁止です。書き込みは独立コピーを受け取り、変更はパーサーや入力に影響しません。
長さ、位置、削除数は非負の安全な整数、準備状態と seek は真偽値です。

任意の `peek` は read と位置復元、`pushBack` は seek、write、位置復元、
`popBack` は truncate が既定です。`pushFront` と `popFront` は実装が必要です。
`isEOS` は `tell() >= length()` が既定です。
`close` は明示的な `stream.close()` のみで実行し、GC や shutdown では呼びません。

メソッドは一度取得するため、後でオブジェクトを変更しても置換されません。
同じストリームや shutdown を含むネイティブ API の再入は禁止です。
例外は元の JS オブジェクトとして伝達されます。Promise は同期で拒否し、
拒否ハンドラーを追加します。読み取り失敗時は文書を接続せず load も通知しません。
スタイル解析失敗では既に解析したルールが残る場合があります。

所有者との参照は GC に可視で、不要なコールバック循環参照も回収できます。
