# RmlUi 文書とイベント

RML 文書は持続する要素ツリーです。一度読み込んだ後、アプリケーション状態に応じて要素を変更し、毎フレーム `context.update()` を呼びます。

型付きフォーム、送信、テキスト選択、選択肢 API は[フォーム入力](./controls.ja.md)を参照してください。

メモリ、ファイル、カスタム入力は[バイトストリーム](./streams.ja.md)を参照してください。

子孫の検索、フォント測定、クリップのコピー、明示配置は
[要素ユーティリティ](./element-utilities.ja.md)を参照してください。

## 所有するネイティブ要素の生成

具体型は `new Constructor(tag, attributes = {})` で生成できます。タグと
ネイティブ型は独立しています。`new ElementFormControlInput('field',
{ value: 'ready' })` はテキスト入力の既定値を初期化します。Element と
ElementText はネイティブのプール、他の具体型は各型の生成器を使います。
JS 派生型は最も近い登録済みネイティブ型を使い、抽象型 ElementFormControl
の直接生成は拒否します。

```js
const { ElementFormControlInput } = require('sfml.js-rmlui');
const field = new ElementFormControlInput('input', { value: 'ready' });

document.appendChild(field);
document.removeChild(field);
field.release();
```

属性をコピーし、getter より前にランタイムの世代を保存します。変換中の再起動を
拒否し、Factory の登録変更やプラグイン生成通知は行いません。内部の子要素は
Factory を使います。ElementInstancer はこの所有要素を返すことができ、複製と
解放でも元の生成器を保持します。

`release()` は追加済み・借用・実行中の木を拒否し、ネイティブを同期で破棄して
すべての子ラッパーを無効にします。子ラッパーは切り離した所有ルートを保持し、
明示解放または参照の回収まで存続させます。GC も元の生成器を使います。
所有関係の更新は対象の木だけです。生成時は世代取得とコピー転送の二つの
ネイティブ呼出し、解放時は一つです。これらは設定操作です。

## ネイティブ XML 解析 {#xml-parser}

`BaseXMLParser` は上流の字句解析器を所有します。`parseEvents(stream)` は一回の
ネイティブ呼び出しで順序付きの `start`、`end`、`data` スナップショットを収集し、
トークンごとに JavaScript を呼びません。属性と内容は独立コピーです。
`XMLDataType.Text`、`CDATA`、`InnerXML` はデータの種類を示します。
上流の明示的な `<![CDATA[...]]>` は通常の Text に結合されます。登録した
生内容タグは CDATA、指定属性が捕捉した内部マークアップは InnerXML です。

```js
const { BaseXMLParser, StreamMemory } = require('sfml.js-rmlui');
const source = new StreamMemory(Buffer.from('<panel key="ready">text</panel>'));

source.setSourceURL('views/panel.rml');

const tokenizer = new BaseXMLParser();

tokenizer.registerCDATATag('script');
tokenizer.registerInnerXMLAttribute('capture');
const events = tokenizer.parseEvents(source);

console.log(events);
```

同期 JavaScript 処理には、任意の `handleElementStart(parser, name, attributes)`、
`handleElementEnd(parser, name)`、`handleData(parser, data, type)` を生成器に
渡します。`parse(stream)` はネイティブ順に呼び、戻り値は `undefined` が必要です。
Base の公開 `handleElementStart`、`handleElementEnd`、`handleData` もコールバック外
で仮想メソッドを呼べます。コールバックの解析器参照は戻ると無効です。解析前の
行番号はゼロ、解析中は 1 始まりです。`getSourceURL()` は解析中のみ有効で、
仮想メソッドの直接呼び出しにはソース URL がありません。

`XMLParser(root)` は検証済み要素・文書を保持し、`parse(stream)` でネイティブ DOM
を構築します。`parseEvents` は使えず、保護された開始・終了タグの仮想メソッドの
直接呼び出しも拒否します。`XMLNodeHandler` には三つの同期構造コールバックが
必要です。通常要素の生成はネイティブの既定ハンドラーへ委譲できます。

```js
const { XMLParser, XMLNodeHandler, StreamMemory } = require('sfml.js-rmlui');
const delegate = XMLNodeHandler.createDefault();

XMLParser.registerNodeHandler('panel', new XMLNodeHandler({
  elementStart(parser, name, attributes) {
    parser.pushDefaultHandler();

    return delegate.elementStart(parser, 'div', attributes);
  },
  elementEnd(parser, name) {
    return delegate.elementEnd(parser, name);
  },
  elementData(parser, data, type) {
    return delegate.elementData(parser, data, type);
  },
}));

const document = context.createDocument();
const parser = new XMLParser(document);

parser.parse(new StreamMemory(Buffer.from(
  '<body><panel id="panel">content</panel></body>')));
```

開始コールバックは現在の解析サブツリーが所有する要素か `null`、終了・データは
真偽値を返します。Promise は拒否します。`getParseFrame()` は独立したフィールドと
検証付き要素・ハンドラー参照を返します。`getDocumentHeader()` は所有コピーです。
編集をコールバック外で準備し、解析中の `setDocumentHeader(copy)` で書き戻します。
`pushHandler`、`pushDefaultHandler`、XML の `handleData` は解析中のみ使えます。
コールバックは現在の解析器の検査とハンドラー委譲だけが可能で、DOM、ストリーム、
登録、ランタイムは変更できません。

登録はタグを小文字にし、`getNodeHandler` は大文字小文字を区別して照会します。
空の登録は既定ハンドラーを設定し、空の照会は `null` を返します。登録置換は既存
XMLParser と借用ハンドラーを無効にします。所有ハンドラーと永続 CDATA タグは
初期化前にも登録でき、新しい解析器が採用します。`shutdown()` は登録と未採用の
初期設定を解放し全参照を無効にします。コンテキスト除去は所属ルートの解析器を
無効にします。未登録のコールバック循環参照は回収できます。

## ネイティブ文書ヘッダー {#document-header}

`DocumentHeader` は実際のネイティブ `Rml::DocumentHeader` を所有します。
`source`、`title`、`templateResources`、`rcss`、`scripts` の既定値は空文字列・
空リストです。資源は `{ path, content, isInline, line }` で、既定値は
`""`、`""`、`false`、`0`。インラインのパスは内容の出典、外部 RCSS・
スクリプトのパスは解決済み資源パスです。

```js
const { DocumentHeader } = require('sfml.js-rmlui');
const header = new DocumentHeader({
  source: '/absolute/path/to/panel.rml',
  title: 'Panel',
  templateResources: [ 'base.rml' ],
  rcss: [{
    path: '/absolute/path/to/panel.rml',
    content: 'body { width: 320px; }',
    isInline: true,
    line: 4,
  }],
});

document.processHeader(header);
document.updateDocument();
document.show();
```

`processHeader` はテンプレートを読み込み、資源をソース順で結合します。文書の
ルールは先行するテンプレートのルールを上書きします。文書自身のソース・タイトル
を保存し、スクリプトフックを呼び、即座に非表示にします。`hide` イベントは発生
しません。文書タイトルが空ならテンプレートのタイトルは使いません。RCSS が
読み込まれなければ既存シートを保持します。配置の照会前に `updateDocument()`、
表示には `show()` を呼びます。
コンテキストのない未接続文書は解析済み RCSS を保持しますが、メディアブロックを
コンパイルしません。コンテナーをコンテキスト所有の文書に設定すると適用できます。

`replace(input)` は全フィールドを検証後、一回のネイティブ呼び出しで置換します。
省略フィールドは既定値に戻ります。setter と `snapshot()` の入出力は独立コピー
です。パスの NUL バイトは拒否し、行オフセットは int32 範囲です。getter の例外
では既存領域を変更せず、ランタイム再初期化は古いヘッダー・文書を無効化します。

`mergeHeader(other)` は上流の結合を実行します。既存の非空ソース・タイトルを
保持し、テンプレートを `other.source` 基準で解決し、RCSS・スクリプトのパスは
変更せず追加します。自己結合はコピーを使います。`mergePaths(target, source,
basePath)` と `mergeResources(target, source)` は結合対象の独立配列を返し、
入力配列は変更しません。保存するには結果をヘッダーフィールドに代入します。

`document.title` はネイティブ GetTitle/SetTitle を呼び、SFML ウィンドウ名を
変更しません。`hide()` は `hide` を発生させ、表示・フォーカスを更新し文書を保持
します。`close()` は `unload` を発生させ、次の `context.update()` まで破棄を
遅延します。実際の破棄まではラッパーを読み取れます。

スクリプト記録はソース順・行オフセットを保持します。Core 基底フックは空で、
読み込み前に [NodeScriptHost または LuaScriptHost](scripts.ja.md) を
選択すると、信頼された JavaScript または Lua を実行できます。

## 文書を読み込む

```js
const document = context.loadDocument('/absolute/path/to/panel.rml');

document.show();
```

生成したマークアップには `loadDocumentFromMemory(rml, sourceUrl)` を使います。相対スタイルシート、画像、テンプレートの基準が必要ならソース URL を渡します。どちらの読み込みも失敗時は例外となり、成功時は非表示の文書を返します。

`sourceUrl` を省略すると `"[document from memory]"`、`""` は空のままです。
文字列以外の値とヌル文字は読み込み前に拒否します。ネイティブ解析器は
`<head>` で `document.sourceURL` を記録します。ソース URL や外部リソースが
必要な文書にはこの要素を含めてください。

`initialise(window, { fileRoot })` は `/assets/...` を含め、指定ディレクトリを先に検索し、その後で元のパスを試します。ファイルシステムのアクセス制限ではありません。フォントは文書より先に別途読み込みます。

## 要素を編集

[カウンター](../../packages/sfml.js-rmlui/examples/demo.cjs)の文書読み込み後に追加する例です。

```js
const button = document.getElementById('increment');
const counter = document.querySelector('#counter');

if (!button || !counter) {
  throw new Error('Counter elements are missing');
}

button.setClass('ready', true);
button.setAttribute('title', 'Increase the counter');
button.setProperty('width', '180dp');
```

該当要素がなければクエリーは `null` を返します。`setProperty` は RCSS が値を受け付けたかを返し、`removeProperty` はインライン指定を削除します。`innerRML` はマークアップを解析して子要素を置換します。破棄時にリスナーを自動解放し、すべての別名ラッパーを無効化します。置換後に新しい子を取得してください。

`getElementById` は兄弟要素を含む所属文書全体を検索します。`querySelector` は子孫だけを検索します。RmlUi は特殊な id として `#self`、`#document`、`#parent` も受け付けます。

## リスナーの登録と解除

```js
let clicks = 0;

function increment(event) {
  clicks++;
  counter.innerRML = `Clicks: ${clicks}`;
  console.log(event.type, event.targetId);
}

button.addEventListener('click', increment);
// Optional: stop receiving clicks while keeping the button alive.
button.removeEventListener('click', increment);
```

解除には同じ要素、関数、イベント種類、キャプチャフラグを使います。キャプチャの既定値は false です。同じ関数を複数の登録で共有できます。同一登録は重複せず、存在しない登録の解除は何もしません。解除、要素破棄、ランタイム終了でコールバックを自動解放します。実行中に自身や他のリスナーを解除できます。

リスナー内でクラス、スタイル、タイトル、対象自身の通常属性、無関係なサブツリーを同期変更できます。上のカウンターも動作します。イベント対象や実行中のネイティブ呼び出し対象を含むサブツリーの置換は変更前に拒否します。属性の設定・削除にも同じ保守的な検証を適用するため、祖先の通常属性も制限されます。実行中の入力要素の `type` の設定・削除は、コールバックを実行しているネイティブウィジェットを破棄し得るため拒否します。終了、文書アンロード、再帰更新・入力も拒否するため、これらは `queueMicrotask` で実行後に予約してください。リスナー例外は呼び出し元の入力処理などから伝播します。

リスナーは同期実行されます。`RmlEvent` は `type`、`id`、`phase`、`targetId`、`target`、`currentTarget`、`isInterruptible`、`parameters`、`unprojectedMouseScreenPosition` を保存します。対象は検証付き要素ラッパーで、id が未設定または重複していても、再検索とイベント対象で `===` の同一性を保ちます。`id` はイベントの**種類**の識別子で、送信ごとの番号ではありません。ネイティブ要素の破棄でラッパーは無効になります。

`isPropagating`、`isImmediatePropagating`、`stopPropagation()`、`stopImmediatePropagation()` は現在のリスナー中だけネイティブイベントにアクセスし、コールバック終了後は例外になります。保存済みの項目は読み取れます。伝播停止は現在の DOM 階層のリスナーを完了し、即時停止は残りのリスナーも省略します。中断できないイベントには影響しません。段階値は `EventPhase.Capture = 1`、`Target = 2`、`Bubble = 4` です。対象では通常リスナーが capture リスナーより先に実行され、各グループ内は登録順です。

パラメーターは真偽値、数値、文字列、null を保持します。符号付き・符号なし 64 ビット整数は正確な BigInt になり、JS から渡す BigInt は `-2^63` から `2^64 - 1` の範囲です。ベクトルは `{ x, y }`、`{ x, y, z }`、`{ x, y, z, w }`、色は `{ type: 'colourb' | 'colourf', red, green, blue, alpha }` です。バイト成分は 0〜255 の整数、浮動小数点色とベクトルはネイティブ float 精度です。型付き要素とネイティブ `drag_element` は検証付き要素になります。未対応の所有者型と任意ポインターは文字列化せず例外にします。

パラメーターの getter は JavaScript を実行できます。すべての getter の完了後に対象要素と要素参照を検証し、破棄済みなら例外を投げます。要素型パラメーターは送信が戻るまで保護され、サブツリーの置換では破棄できません。

```js
button.addEventListener('counter-update', event => {
  console.log(event.target === button, event.parameters.total);
  event.stopPropagation();
});
button.dispatchEvent('counter-update', { total: 9007199254740993n });
button.click();
```

`dispatchEvent(type, parameters?, options?)` は入れ子の送信に対応します。オプション省略時は上流のイベント仕様を使います。`{ interruptible, bubbles }` を渡す場合、未指定の項目は true です。戻り値は伝播の継続状態です。`click()` は `Rml::Element::Click` を呼びます。内外のイベント有効期間は独立し、内側の実行中も外側は有効です。最初の未捕捉リスナー例外は最外側のネイティブ入口から再送出し、その入口が戻るまで後続の JS リスナーを省略します。

`context.processEvent(event)` はキー、テキスト、ホイールでは伝播状態を返します。マウスとタッチでは false は要素との操作を示し、伝播制御とは独立しています。無視するイベントは true です。ウィンドウを閉じるイベントは結果にかかわらず処理します。

## 直接入力

SFML イベントを作らず、コンテキストへ直接入力できます。`KeyIdentifier` は上流の全 `KI_*` 名とカスタム範囲 177–250 を公開します。`KeyModifier` の七つの `KM_*` フラグはビット OR で組み合わせます。修飾キー引数の既定値は 0 です。

```js
context.processKeyDown(rmlui.KeyIdentifier.KI_A, rmlui.KeyModifier.KM_CTRL);
context.processKeyUp(rmlui.KeyIdentifier.KI_A);
context.processTextInput('水😀');
context.processTextInput(0x1f642);
context.processMouseMove(40, 80);
context.processMouseButtonDown(0);
context.processMouseButtonUp(0);
context.processMouseWheel({ x: 1, y: 0 });
context.processMouseLeave();
```

キー、テキスト、ホイールは伝播が続くかを返します。マウスは要素と操作していないかを返し、`isMouseInteracting` はその逆のヒントです。ボタンは最後に入力した位置を使用し、左 0、右 1、中央 2 です。座標はウィンドウの物理ピクセルです。ホイールの正値は右・下で、数値引数は非推奨の垂直専用オーバーロードです。文字列は一つの `textinput` イベントになり、数値は Unicode スカラー値です。不正な値と単独 UTF-16 サロゲートは例外になります。直接テキスト入力は制御文字を保持します。

`processTouchStart`、`processTouchMove`、`processTouchEnd`、`processTouchCancel` は `{ identifier, position: { x, y } }` の一覧を受け取ります。識別子は正確な非負のネイティブ `uintptr_t` 値で、`Number.MAX_SAFE_INTEGER` を超える場合は `bigint` を使います。座標はネイティブ浮動小数点数になります。一覧全体を検証してから全項目を処理し、結果を論理 AND で結合します。空一覧は true、不明な識別子の move/end は true、cancel は false です。cancel に修飾キー引数はありません。RmlUi 6.3 はタッチをマウス操作で模擬するため、キャンセルで左ボタンが解放され、クリックが発生する場合があります。

SFML キー入力はイベントの修飾キースナップショットを使用します。システムキーは macOS で `KI_LMETA/KI_RMETA`、他の環境で `KI_LWIN/KI_RWIN` です。ポインターは現在の修飾キーを読みます。SFML が提供しないロック切替状態は 0 のままで、直接入力では全七フラグを指定できます。SFML タッチは一項目の一覧になります。`TextEntered` は CR を LF に変換し、他の制御文字を除外します。RmlUi コールバック中の再入力は拒否されます。必要に応じて `dispatchEvent` をネストできます。例外は最外側の入力呼び出しへ届き、保存したイベント制御はコールバック終了後に失効し、shutdown 後も失効したままです。

## 既定構築のイベント {#default-events}

初期化後の `new rmlui.RmlEvent()` は所有するネイティブ `Rml::Event()` を作ります。
対象と現在要素は null、型とパラメーターは空、ID は `EventId.Invalid`、
段階は `EventPhase.None`、マウス画面座標は `{ x: 0, y: 0 }` で、中断できません。
公開する `target` の型は `Element | null` です。

```js
const event = new rmlui.RmlEvent();
const listener = new rmlui.EventListener(value => {
  console.log(value.target, value.getParameter('count', 0));
});

listener.processEvent(event);
event.release();
listener.release();
```

所有イベントは明示解放・GC・終了まで有効です。手動リスナーは独立した借用を受け取り、
コールバックが戻ると無効になります。`setCurrentElement(element)` は対象と独立して
現在要素を監視し、置換・解除で旧要素の監視を終了します。参照先の破棄後はネイティブ
アクセスを拒否しますが、`release()` は可能です。`isType(nameOrId)` は解放後も
保持した型または ID のコピーを比較します。

## イベント仕様

要素とコンテキストのリスナーは名前または数値 `EventId` を受け取ります。同じ名前と ID は登録の同一性を共有し、重複登録されません。どちらの形式でも解除できます。`context.getRootElement()` は一意のルートラッパーを返し、コンテキストのリスナーはそのルートに登録されます。

`registerEventType(name, interruptible, bubbles, defaultActionPhase?)` はネイティブ ID を返します。カスタム名の再登録では ID を維持してフラグを置換します。組み込み型のフラグは変更されません。カスタム ID はランタイム終了時に失効します。`DefaultActionPhase.None`、`Target`、`TargetAndBubble` はリスナー終了後の既定動作を制御し、既定値は `None` です。送信オプションは中断・バブルフラグのみを変更し、登録された既定動作の段階を維持します。中断可能な click の伝播停止はチェックボックスの切り替えを防ぎます。

## コンテキスト登録と更新予約

`getContext(nameOrIndex)` はラッパーの同一性を維持し、`getNumContexts()` は有効なコンテキスト数を返します。名前がない場合と範囲外のインデックスは `null` です。これは固定バージョン 6.3 の実装に従い、ヘッダーのクランプという注釈とは異なります。インデックス順序はネイティブ登録に従います。`removeContext(name)` は名前がなければ false、削除成功と `context.remove()` は true を返して別名を無効にします。`context.name` は有効期間を検証します。

`context.dimensions` は getter のみの共有ネイティブビューです。`setDimensions()` と転送されたリサイズに追従し、resize リスナーでも新しい寸法を読み取れます。幅と高さは非負の int32 です。ラッパーの GC 後も記憶領域は有効で、ネイティブ破棄後は 0 になります。

`setDensityIndependentPixelRatio(ratio)` は正の有限比率を手動指定し、更新やリサイズ後も保持します。`null` はウィンドウ同期に戻します。`requestNextUpdate(seconds)` は次の更新までの遅延を短縮し、0 は即時更新です。予約がなければ `getNextUpdateDelay()` は `Infinity` です。`update()` が遅延をリセットしてから要素が次の更新を要求します。JS タイマーは作成しません。

## 未接続要素と DOM 所有権

`document.createElement(tag)`、`document.createTextNode(text)`、`element.clone()` はネイティブが所有する未接続要素を返し、ファクトリー失敗時は `null` です。テキストはリテラルとして扱います。複製は属性・スタイル・内容をコピーし、JS リスナーはコピーしません。未接続要素は所有文書を持ちません。

```js
const panel = document.createElement('div');
const label = document.createTextNode('Hello <world> & 世界');

if (panel && label) {
  panel.appendChild(label);
  document.appendChild(panel);
  const detached = document.removeChild(panel);

  document.insertBefore(detached, null);
}
```

`appendChild(child, domElement = true)` と `insertBefore(child, adjacent)` は未接続要素の所有権を一度だけ移し、同じラッパーを返します。接続済み要素は先に取り外し、入れ子の文書を含まないツリーなら他のコンテキストへ移せます。`removeChild` は所有権付きの未接続要素を返し、子でなければ `null` です。`replaceChild(child, replaced)` は取り外した要素を返し、基準が `null` または子以外なら末尾に追加して `null` を返します。`insertBefore` も基準がなければ末尾に追加し、あれば DOM/非 DOM 区分を継承します。循環、コンテキストルートの挿入、実行中のネイティブ・イベント対象ツリーの移動は変更前に拒否します。Debugger が所有する文書も保護します。

実際の文書をコンテキストルートから取り外し、同じ有効なコンテキストの別の要素へ挿入できます。元の `basic/demo` サンドボックスもこの経路を使います。文書は未接続でも自身の所有文書と借用コンテキストを保持します。ルートは自身の文書だけを DOM 子として受け入れます。`getNumDocuments()` はルート直下の文書を数え、入れ子の文書には個別の `updateDocument()` が必要です。`close()` と `unload()` が破棄待ちにするのはルート文書だけです。入れ子・未接続文書は所有ツリーの破棄まで生存し、外側の文書を閉じると入れ子のツリーも破棄されます。コンテキストの削除では、その文書を含む独立所有ツリーを先に破棄します。

`dragdrop` コールバックでは、検証済みの `drag_element` パラメーターを同期的に取り外して挿入でき、上流のインベントリー移動アルゴリズムを保持します。最外側のネイティブ呼び出しが終わるまで、ネイティブ所有権とリスナーを保持します。祖先、通常パラメーターの別名、イベント対象、実行中のメソッド受信要素は引き続き保護します。取り外しはドラッグをキャンセルするため、上流はその後に `dragend` を送信しません。

`getNumChildren()` は DOM 子要素のみ、`true` を渡すと内部要素も数えます。`getChild(index)` は両方を参照でき、範囲外では `null` です。先頭・末尾・兄弟・`hasChildNodes()` は DOM 区分に従います。`querySelectorAll`、`getElementsByTagName`、`getElementsByClassName` は有効なラッパーのスナップショット配列を返します。ネイティブ実装に従い、`contains` は自身を含み、`closest` は自身を除く祖先を検索します。

子孫の参照は未接続ネイティブツリーを保持します。リスナーがラッパーを捕捉する循環を含め、到達不能ツリーは回収できます。挿入後はネイティブの親が所有し、取り外し・再挿入でもリスナーは維持されます。破棄はすべての借用ラッパーを無効にします。

ネイティブウィジェットの内部要素は参照できますが、生ポインターをウィジェットが保持するため取り外し・置換は拒否します。JS 所有権 API で挿入した非 DOM 要素は、ラッパー回収後に再取得した場合も移動できます。

## 文書の順序、フォーカスとレイアウト

`context.createDocument(instancerName = 'body')` は空の文書を作り、失敗時は
`null` を返します。`getDocument(idOrIndex)` は一意の文書ラッパーまたは `null`、
`getNumDocuments()` は破棄待ちを除く文書数を返します。添字はスタック順です。
`setDocumentsBaseTag(tag)` / `getDocumentsBaseTag()` は以後の文書のルートタグ
（初期値 `body`）を設定・取得します。インスタンサー名は変更しません。

`context.unloadDocument(document)` / `unloadAllDocuments()` は unload を同期送信し、
検索対象から除外して `context.update()` で破棄します。破棄前の再アンロードは
何もしません。`document.getContext()` は一意の所有コンテキストを返し、
ファクトリーで作成した未接続文書では `null` です。破棄後の操作は例外になります。

```js
const { ModalFlag, FocusFlag, ScrollFlag, ScrollBehavior } = require('sfml.js-rmlui');

document.show(ModalFlag.Modal, FocusFlag.Auto, ScrollFlag.None);
document.show(ModalFlag.Keep, FocusFlag.Keep, ScrollFlag.Auto);
context.setDefaultScrollBehavior(ScrollBehavior.Instant, 1);
```

`show()` の既定値は `None / Auto / Auto` です。第 1 引数の `false / true` は
`None / Modal` と同じです。`ModalFlag.Keep` は現在のモーダル状態を維持します。
`FocusFlag.None` はフォーカスを要求せず、`Document` は文書、`Keep` は以前の要素、
`Auto` は最初の Tab 移動可能な `autofocus` 要素（なければ文書）を選びます。
`ScrollFlag.None` はフォーカスによるスクロールを防ぎ、`Auto` は必要に応じて
新たにフォーカスした子要素を表示範囲に移動します。`isModal()` はモーダルフラグが
設定され、文書が表示中の場合のみ true です。非表示では false ですが内部フラグは
維持され、`ModalFlag.Keep` で再表示すると復元されます。

`findNextTabElement(current, forward, wrapAround = true)` はフォーカスを変えずに
検索します。開始要素はその文書に属する必要があります。
`context.getFocusElement()` / `getHoverElement()` は有効なラッパーまたは `null` を
返します。`unfocusDocument(document)` は履歴から除き以前のフォーカスを要求しますが、
モーダル状態が残っていると拒否される場合があります。

文書の `pullToFront()` / `pushToBack()`、またはコンテキストの
`pullDocumentToFront(document)` / `pushDocumentToBack(document)` で順序を変更します。
コンテキストの文書操作は別コンテキストの文書を拒否します。

変更後は入力・描画前に `context.update()` を呼びます。`document.updateDocument()`
はその文書のスタイルと配置を更新しますが、保留中の文書破棄は処理しません。
`getElementAtPoint(point, ignoreElement = null, element = null)` は物理ピクセルと
現在の配置を使い、変換・クリッピング・モーダルフォーカスを考慮します。
サブツリーを無視したり検索ルートを指定できます。要素引数は同じコンテキストに
属する必要があり、所有文書を持たないコンテキストルートも指定できます。
座標は float 丸め後に int32 範囲内である必要があります。
変換行列は `render()` で更新されるため、変換変更後のヒットテストには描画が必要です。
RmlUi 6.3 は逆投影座標と祖先のクリップ矩形を比較するため、平行移動時の判定境界が
見た目と異なる場合があります。このバインディングはネイティブの動作を保持します。
`setDefaultScrollBehavior(behavior, speedFactor = 1)` の速度は正の有限 float です。
既定動作を `Auto` にすると滑らかなスクロールになります。

## イベントパラメーターの型変換

`event.getParameter(name, defaultValue)` は RmlUi の `GetParameter<T>` 規則で
ライブパラメーターを読みます。このリスナーのコールバック中のみ有効です。
入れ子のイベント送信は外側のコールバックを無効化しません。終了後は
`event.parameters` のコピーを使います。JS コピーの変更は原本に影響しません。

```js
element.addEventListener('change', event => {
  const value = event.getParameter('value', 0);
  const text = event.getParameter('value', '');

  console.log(value, text, event.isType('change'));
});
```

非 null の既定値で結果型を選びます。number は double、BigInt は int64、
INT64_MAX を超える既定値では uint64 です。ベクトルと色はコピーを返します。
未指定パラメーターは既定値になります。非数値文字列は number への変換で 0、
BigInt への変換では既定値になります。安全でない数値・文字列の整数範囲外は例外です。
所有する変換・アニメーション・遷移・装飾・効果の既定値は型付きネイティブ
アダプターを使います。汎用ポインターから数値や文字列への変換は拒否します。

`event.getElementParameter(name, defaultValue = null)` は検証付き要素ポインターの
等価インターフェースです。未指定または変換できない値では有効な既定要素を返し、
それ以外は一意のネイティブ要素を返します。ScriptInterface 要素値と上流の
`drag_element` 契約に対応し、任意のポインターは拒否します。毎回イベントと
所有参照を検証し、借用イベントはコールバック終了時に失効します。返された要素は
通常の寿命を持ち、ノード破棄時に無効になります。生の要素コピーは `parameters`
から読めます。永続属性は借用要素ポインターを受け付けません。

`event.isType(nameOrId)` は保存済みの型名・ID を使う二つのネイティブ等価演算に
対応し、コールバック終了後も使えます。

## テキストバイトとマウスカーソル

`context.processTextInput(text)` は Unicode 文字列またはスカラー値を受け取ります。
`context.processTextInputChar(byte)` はネイティブの `char` オーバーロードを使います。
整数バイト 0–127 は制御文字を含む ASCII を送信し、128–255 はイベントを送信せず
`false` を返します。どちらもイベントの伝播が継続するかを返します。

`context.enableMouseCursor(enabled)` は真偽値を要求します。有効にすると次のマウス更新で
カーソルを同期し、無効にすると RmlUi によるシステムカーソルの変更を止めます。
カーソルは非表示になりません。削除済みコンテキストでは両方の操作が例外になります。

## ネイティブの有効期間 {#ネイティブの有効期間}

| 操作 | 効果 |
| --- | --- |
| `document.hide()` | 非表示にしますが、文書とラッパーは有効です。 |
| `document.close()` / `unload()` | `unload` を同期実行し、`context.update()` で破棄します。実際の破棄まではラッパーを読み取れます。 |
| `context.remove()` | コンテキストとすべての文書を破棄します。 |
| `shutdown()` | すべてのコンテキスト、文書、要素ラッパーが無効になります。 |

ラッパーはネイティブの有効性を共有します。JS 参照は所有権付きの未接続ツリーを保持しますが、接続済み要素の親やコンテキストによる破棄は防げません。破棄後のアクセスは例外になります。同名コンテキストの再作成や再初期化で古いラッパーは復活しません。削除後、保持した寸法ビューはゼロになります。

プロセス全体のランタイムは初期化した Node.js 環境とスレッドに属します。Worker はインポートとバージョン照会ができますが、他環境のランタイム操作は例外になります。所有環境の終了時は JS リスナーを呼ばずにリソースを解放します。描画ウィンドウを閉じる前に RmlUi を終了してください。
