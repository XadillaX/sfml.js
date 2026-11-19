# 文書スクリプト

`NodeScriptHost` は `Context` が読み込む文書の JavaScript ホストです。
`initialise` 後に作成し、読み込み前に `setScriptHost` で選択します。
Context が変更・無効化されても、既存文書は自身のホストを保持します。

```js
const { NodeScriptHost } = require('sfml.js-rmlui');
const host = new NodeScriptHost({
  handlers: {
    save(event, document, context) {
      document.title = context.name;
      event.stopPropagation();
    },
  },
});

context.setScriptHost(host);
const document = context.loadDocumentFromMemory(`
<rml><head/><body>
  <button id="save" onclick="save">Save</button>
</body></rml>`, 'forms/panel.rml');

document.getElementById('save').click();
```

名前付きハンドラーは一度取得します。元の options の変更は登録を置換しません。
インライン式が無効なら、未知の名前は文書の読み込みを失敗させます。

## 信頼されたソース

両ソース設定の既定は false です。`allowInline: true` は `<script>` の内容と
`on*` JavaScript 式を、`allowExternal: true` は `<script src="...">` を
有効にします。外部ソースは現在の RmlUi `FileInterface` で読み込み、独自の
ファイルルートにも対応します。無効なら外部ファイルを読みません。
Node VM はセキュリティ境界ではありません。信頼されたソースのみ有効にします。

文書ごとに VM を共有します。`globals` は追加の値を取得し、
`document`、`context`、`event`、`element` は予約名です。前の二つは寿命を
検証する RmlUi ラッパーです。`on*` 内では `event` が有効なイベント、
`element` が現在の対象です。入れ子のイベントから戻ると外側の値を復元します。

RmlUi は `</head>` でリソース順に実行し、この時点では本文は未解析です。
本文の要素は後のイベントで検索してください。インラインスタックは RML の
ソース URL と元の行位置、外部スタックは解決済みパスとソース行を使用します。

## エラーと寿命

例外は開始元 API にそのまま伝播し、失敗した文書は Context に追加しません。
スクリプトとハンドラーは同期で返す必要があります。Promise は拒否し、
その拒否結果を処理します。

`document.loadInlineScript(content, sourcePath, sourceLine = 1)` と
`document.loadExternalScript(sourcePath)` はネイティブ仮想フックを呼びます。
通常の文書は上流の空実装を保持します。`context.setScriptHost(null)` は
以降の文書を通常モードにし、全体の body・リスナー生成器は保持します。

ネイティブ文書の破棄は VM セッションを解放し、失効した Document ラッパーが
残っても保持しません。文書・Context の寿命を検証し、イベント操作は送信後に
失効します。コールバック中の破壊的な再入は拒否します。Factory のスクリプト
リスナーは通常の `EventListener` を使い、元の文書が失効したら送信を拒否します。

## ネイティブスクリプトオブジェクト {#native-script-objects}

`Context`、`Element`、`RmlEvent` は `ScriptInterface` を実装します。
`setScriptObject(object)` は実際のネイティブインスタンスにホストを登録し、
`getScriptObject()` は仮想メソッドを呼んで同一オブジェクトを返します。
null は関連付けを解除します。未登録のインスタンスと複製要素は null を返します。

```js
const state = { count: 0 };

element.setScriptObject(state);

if (element.getScriptObject() === state) {
  state.count++;
}

element.setScriptObject(null);
```

接続ツリーがスクリプトを保持し、分離要素は JS 所有者経由で保持します。
Element を参照し返す循環は回収できます。親の変更後も関連付けを保持し、
ネイティブ破棄と shutdown で解放します。再初期化しても古いラッパーは失効した
ままです。変更のないフレームではスクリプト登録を走査しません。

連続するリスナーは同じネイティブイベントの関連付けを読みます。各借用は自身の
コールバック後に失効します。所有イベントは JS handle 経由で保持し、循環を
回収できます。Factory への転送でネイティブ保持に昇格し、イベントの解放まで
保持します。ネイティブ RTTI は変わりません。外部の `GetScriptObject` 実装には
専用の登録アダプターが必要で、この API では上書きできません。

Native 拡張は `native/scripting/rmlui-script-object.h` の
`sfmlrmlui::RegisterNativeScriptObject` で実際の返却ポインターと JS 所有者を
登録します。同じポインターを返す複数のインターフェースも関連付けは独立し、
登録後もネイティブ実装が優先されます。`native/values/rmlui-variant-objects.h` の
`RegisterNativeObjectVariant` は実際の `void*` 割り当てを別に登録します。
所有者は割り当てを解放する前に共有スロットを失効させ、Variant と Lua の
コピーはその後 null を返します。コピーの JS 所有者は既存の値所有辺で保持します。
これらは C++ 専用で、JS にアドレスや登録 API を公開しません。

任意の Native `ScriptInterface` を Variant にする場合は
`native/values/rmlui-variant-pointers.h` の `RegisterNativeScriptVariant` を使います。
拡張は実際のインターフェースと登録を保持し、破棄前に登録を失効させます。
JS 出力は登録時の元のオブジェクトで、型は `VariantScriptObject` です。
`{ type: 'scriptinterface', value: object }` がポインター変換先を選びます。
コピー、移動、DOM 値、Lua スナップショットは失効スロットを共有し、
ネイティブ割り当ての寿命を延ばしません。未登録の参照と共有スロットは
参照先に触れる前に拒否します。`GetScriptObject` の関連付けとは独立しており、
その問い合わせでは仮想 getter を一度だけ呼びます。Native は
`SetScriptObjectForBinding(nullptr, {})` で関連付けと所有辺を解除できます。

登録済み Context は削除まで保持します。独立所有 Context は JS の根を使い、
オブジェクトとの循環を回収できます。Context は実際の基底型識別子を継承します。
`release()` は独立所有のみ解放し、登録済みは `remove()` を使います。

## Lua スクリプト

`LuaScriptHost` は実際の Lua 5.4.8 VM を所有します。`initialise` 後に作成し、
`context.setScriptHost` で選択します。同じ Lua ホストの文書はグローバルを
共有し、別のホストは独立 VM を使います。Context の選択を変えても、既存文書の
インタープリターは変わりません。

```js
const { LuaScriptHost } = require('sfml.js-rmlui');
const lua = new LuaScriptHost({ allowInline: true });

lua.execute(`
function save(event, element, document)
  document.title = element.id
  event:StopPropagation()
end
function sum(a, b) return a + b end
`, 'handlers.lua');
context.setScriptHost(lua);
const document = context.loadDocumentFromMemory(`
<rml><head/><body>
  <button id="save" onclick="save">Save</button>
</body></rml>`, 'forms/lua-panel.rml');

document.getElementById('save').click();
lua.call('sum', 1n, 2n); // 3n
```

両ソース設定の既定は false です。名前付き Lua 関数はソース実行を有効にせず
ハンドラーに使えます。`allowInline` はヘッドスクリプトとインラインハンドラー、
`allowExternal` は外部ファイルを有効にします。現在の RmlUi ファイル
インターフェースを使い、ソースパスと行位置を保持します。

`execute(source, path = '', line = 1)`、`call(name, ...args)`、
`getGlobal(name)`、`setGlobal(name, value)` はスカラーを交換します。
null、boolean、有限 number、string、符号付き 64 ビット bigint に対応し、
Lua 整数は bigint で返します。文字列内の null バイトを保持します。
テーブル、関数、ネイティブポインターはスカラーブリッジの値ではありません。

Native/Lua 内の `document:GetAttribute(name)`、属性の反復とイベント引数は
RmlUi Variant を使います。`Vector2f`、`Colourb`、`Colourf` userdata は
ネイティブ値として渡せます。検証済みの Element、Context、Event userdata は
保護された ScriptInterface ポインターになり、コピーは元の破棄またはイベント終了時の
失効状態を共有します。ネイティブアドレスは公開しません。

登録済みの不透明ポインター、Vector3/4、集約 Variant は所有 Lua userdata を
使います。イベント経由のコピーでもネイティブ値とポインターの同一性を保持します。
byte と char は実際の格納値を読みます。Lua の符号付き整数上限を超える符号なし
64 ビット値は所有 userdata を使い、負数へのオーバーフローを防ぎます。
外部の不透明 userdata は拒否します。Node のスカラーメソッドは引き続きスカラーだけを扱います。

Lua のコピーは Lua GC または VM 終了まで保持します。文書、リスナー、モデル、
インスタンサー登録、生成要素、取得した Lua 関数が実際の所有者として VM の
ポインター値を保持します。独立 Context やホストとオブジェクトの循環は回収できます。
終了や明示的な要素破棄は、失効したファサードが残っていても古い保持辺を削除します。
変更のないフレームはこれらの所有者を走査しません。

`compile(source, path = '', line = 1)` はソースを実行せずに `LuaFunction` を
返します。`getFunction(name)` は現在の名前付き関数をキャプチャし、その後の
グローバル関数の置換はこの参照に影響しません。

```javascript
const chunk = lua.compile('local a, b = ...; return a + b, "ready"');
const results = chunk.callResults(2, 9007199254740993n, 2n);

// [9007199254740995n, "ready"]
chunk.release();
```

`LuaFunction.call(...args)` は最初のスカラー結果をコピーします。
`callResults(resultCount = 0, ...args)` は一度実行し、指定数の結果を返します。
不足分は null、余分な結果は破棄します。エラー後も外側の Lua スタックを復元します。
Node から呼ぶと、実行中の外側の Lua イベントと文書のグローバルを保持します。
Node イベント自体は新しい Lua スコープを選択しません。ネイティブ参照はホストの
GC 後も VM を保持します。`release()` は参照と VM の保持を解放し、再度の呼び出しや
解放を拒否します。shutdown はすべての関数を無効にします。`executeFile(path)` は
現在の RmlUi FileInterface で明示的にファイルを読み、実行します。文書の
`allowExternal` は適用せず、エラーにファイルパスを保持します。

DOM リスナーとデータイベントは Native/Lua で直接実行します。入れ子の送信後は
`document`、`context`、`event`、`element` の外側の値を復元します。失効した
イベントと破棄済み DOM のプロキシはアクセスを拒否します。Lua 標準ライブラリを
提供し、ソースポリシーは信頼するスクリプトに適用します。
コルーチンはホストのレジストリーとグローバルを共有し、独立した呼び出しスタックを
持ちます。リスナー、モデル、インスタンサーを作成し、yield 後に resume できます。
同じデータイベントのコールバックを再帰的に呼ぶことはできません。

文書内の `context:OpenDataModel(name, table)` は管理モデルを返します。
同じホストで再度開くと既存ラッパーを返します。名前は Context に属し、複数の
Context で同名モデルを独立に使えます。ネストしたテーブルへの書き込みは根変数を
dirty にし、テーブルや配列の置換後もネイティブデータアドレスは現在の値を読みます。
Lua 配列は 1 始まり、RML のデータ式は 0 始まりです。Lua、Node または Context
破棄によるモデル削除は、保持したモデル・テーブルプロキシを失効させます。
ネイティブモデルはホストの GC 後も VM を保持し、コントローラーとビューの破棄後に
変数定義を解放します。

`ElementInstancer.new(function(tag) ... end)` は管理 Lua アロケーターです。
コールバック外で `rmlui:RegisterTag(tag, instancer)` を呼び、親のない所有
`Element.new(tag)`、所有 `ElementPtr` または nil を返します。登録、生成要素、
Node Factory ラッパーがアロケーターと VM を保持します。tag 置換後も古い要素の
解放経路と元のアロケーターを保持します。`rmlui:CreateContext` は現在の Lua
ホストを継承します。

`shutdown` は DOM・モデルの破棄後に VM を閉じます。VM finalizer から Context
を作成したり、破棄された RmlUi オブジェクトに再入したりすることはできません。

## Native Lua 型拡張

Native 拡張は管理 VM 内で `Rml::Lua::LuaType<T>` とメソッド・getter・setter の
記述表を登録します。`ExtraInit<T>` でコンストラクターを登録し、Element の表を
継承した後、同名の項目を独自の表で上書きできます。Element サブクラスには
RmlUi RTTI が必要です。Element の `As` 表は RTTI を検証し、型が合わない場合は
nil を返します。

`push(..., true)` は割り当てたオブジェクトの所有権を Lua GC に渡します。
借用する Element・Context・Event は既存の失効検査を使います。独自の借用値は
拡張の所有者が管理し、Lua の使用中は割り当てを保持する必要があります。
メソッドは GC 中に受信者を保持し、エラー後も元の参照を復元します。
nil の受信者は nil を返します。未知の属性への代入は上流と同じく無視します。
`Element:SetAttribute` は入力を文字列に変換します。

Native `PushIndex` と `GetIndex` は 0 始まりの `int` と 1 始まりの Lua 整数を
変換します。Native の `[-2147483648, 2147483647]` は
`[-2147483647, 2147483648]` に対応し、Lua の 0 は Native の `-1` を返します。
範囲外の入力は縮小変換の前にエラーになります。Native 統合は検証済み管理ホストを
使い、任意の外部 VM ポインターを渡す JS 入口はありません。
