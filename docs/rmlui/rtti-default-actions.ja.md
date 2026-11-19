# ネイティブ型と既定動作

`ScriptInterface` は `Context`、`Element` と `RmlEvent` の型付き基底で、独立したネイティブ
生成入口はありません。`ScriptInterface.getStaticClassIdentifier()` は実際の基底
トークンを返します。ネイティブ Event は同じトークンを継承するため、
`RmlEvent.getStaticClassIdentifier()` も同じ値です。要素は独自のトークンを持ち、
ScriptInterface 基底の `isClass` 判定にも対応します。

`getScriptObject()` は有効なオブジェクトのネイティブ仮想メソッドを呼びます。
未登録のコンテキスト、要素、イベントは `null` を返します。
`setScriptObject(object)` は管理されるホスト関連付けを登録し、`null` で解除します。
JS の派生だけではネイティブスクリプトを作成しません。
[スクリプトオブジェクト](scripts.ja.md#native-script-objects)も参照してください。
イベントの RTTI とスクリプト参照には、
有効な所有イベントまたは現在のコールバック借用が必要です。要素破棄、所有イベント
解放、コールバック終了、ランタイム終了後の参照は拒否します。保存したイベントの
コピーは読めます。`release()` は具象型の既存の生成・所有権規則を維持します。

`Element.getStaticClassIdentifier()` はラッパーに対応するネイティブ型の
不透明な `ClassIdentifier` シンボルを返します。公開されたすべての要素派生型が
継承します。JS のみの派生型は最も近い登録済みネイティブ基底型を使います。
静的トークンは初期化前にも取得でき、同じモジュールのランタイム再起動後も有効です。
シリアル化や文字列からの作成はできません。

`element.getClassIdentifier()` は実際のネイティブ型を取得し、
`element.isClass(token)` は継承関係を判定します。破棄済み要素は拒否します。
トークンはポインターを公開せず、要素の寿命を延長しません。専用ラッパーのない
ネイティブ派生型も、`Element` で包まれていても独自のトークンを持ちます。
RML タグや JS プロトタイプはネイティブ型を決定しません。

```js
const controlType = rmlui.ElementFormControl.getStaticClassIdentifier();

if (element.isClass(controlType)) {
  // The native element derives from ElementFormControl.
}
```

`element.processDefaultAction(event)` は入力やタブの実装を含む仮想
`Rml::Element::ProcessDefaultAction` を呼び出します。その要素のリスナーから
同期的に呼び出し、対象は有効なイベントの `currentTarget` と一致する必要があります。
そのリスナーが戻ると保存したイベントは失効し、同じ送信の別リスナーからも使えません。

```js
tabs.addEventListener('click', event => {
  event.stopPropagation();
  tabs.processDefaultAction(event);
});
```

この例はタブのクリック動作を手動で一度実行します。段階、対象、引数、伝播状態を
維持し、伝播停止後も明示的な呼び出しは動作します。手動実行は後続の自動動作を
取り消しません。手動のみなら中断可能なイベントで `stopPropagation()` を呼びます。
中断できないイベントの自動動作は停止できません。

逐次呼び出しは副作用を繰り返し、チェックボックスなら二度切り替わります。
同じイベントの手動動作が実行中の再入は拒否します。別の入れ子イベントは独自の
動作を実行できます。要素とコールバックの既存の寿命保護は維持し、リスナー例外は
最外側のネイティブ呼び出しの境界で伝播します。

[要素の状態](./element-state.ja.md)、[テキストとタブ](./text-panels.ja.md)、
[フォーム](./controls.ja.md)も参照してください。
