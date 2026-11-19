# 要素のクラス、属性とフォーカス

## ネイティブスタイル部品 {#native-style-component}

`getStyle()` は同一性を保持する要素所有の
[`ElementStyle`](/reference/rmlui/classes/ElementStyle.html) を返します。
クラスと擬似クラスの setter は部品を直接変更するため、変更後に
`updateDefinition()` を明示的に呼びます。`setClass` は所属の変更を返します。
`setPseudoClass(name, activate, overrideClass = false)` は有効な所属の変更を
返します。通常・上書き・両方のビットは 1・2・3 です。通常の解除でも上書きは
残ります。`getClassNameList()` と `getActivePseudoClasses()` は状態のコピーです。

`setProperty(id, property)`、`setCustomProperty('--name', property)`、
`setVarShorthand(id, property)` は型付き値をコピーし ID や名前を変更済みに
します。短縮形には登録済みグローバル ID と VAR_EXPRESSION 文字列が必要です。
`removeProperty`、`removeCustomProperty`、`removeVarShorthand` はインライン値を
削除します。`getLocalStyleProperties()` はカスタムと短縮形を含む辞書全体を
コピーします。

`getProperty` と `getCustomProperty` はカスケード・継承・変数を解決します。
`getLocalProperty`、`getLocalCustomProperty`、`getLocalShorthand` は置換前の
ローカル値です。`getLocalPropertyWithResolvedVariables` はローカル指定値を
解決します。`getSpecifiedProperty`、`getSpecifiedCustomProperty`、
`getSpecifiedShorthand` は変数置換前のカスケード結果です。いずれも所有コピーか
null を返します。`iterate()` は重複しない通常 ID のコピー、
`iterateAll(filter = null)` はカスタム・短縮形を含むコピーで、短縮形の
プレースホルダーを除外し上流のカスケードフィルターを維持します。

`resolveNumericValue(value, base)` と `resolveRelativeLength(value,
RelativeTarget)` は有限の単一単位でネイティブ計算を行います。
`dirtyProperty`、`dirtyInheritedProperties`、`dirtyPropertiesWithUnits`、
`dirtyPropertiesWithUnitsRecursive` は実際の変更状態を操作します。再帰処理は
非 DOM 子も含みます。`anyPropertiesDirty()` は属性・変数・短縮形を調べます。

```js
const style = element.getStyle();

style.setClass('selected', true);
style.updateDefinition();
style.setProperty(PropertyId.Width, new Property(24, Unit.PX));
const values = new ComputedValues(element);
const dirty = style.computeValues(
  values, parent.getComputedValues(), document.getComputedValues(),
  true, 1, { x: 320, y: 240 },
);

for (const id of dirty) {
  style.dirtyProperty(id);
}

context.update();
```

`computeValues` は同じ要素に関連付けた所有値へ計算し、実際の変更集合を消費して
子へ継承依存を伝えます。親から子の順で実行します。要素の属性変更フックや配置
更新は実行しません。次の配置更新前に返された全 ID を再び変更済みにします。
密度は有限の正数、視口は有限値が必要です。読み取り専用出力、別要素に関連する
出力、期限切れフォントハンドルは拒否します。

`resolveKeyFrameProperty(id, propertyOrNull, block, resolver)` はネイティブ変数と
短縮形を展開します。`KeyFramePropertyResolver` は任意キャッシュ・依存・保存領域を
再利用します。ブロックや変数環境を変える前に `reset()` します。ローカル変数は
ブロック辞書から取得し、その後スタイルシートや祖先を探します。
`hasSubstitutedShorthands` は遅延キャッシュの有無、`variableDependencies` は最後の
解析の依存コピーです。結果は所有コピー、失敗は null です。要素破棄でスタイルが、
ランタイム終了でスタイルと解析器が無効になります。

高頻度数値処理は `ElementCommandBuffer` の共有領域と `StyleSetNumeric`、
`StyleRemoveProperty`、`StyleGetNumeric`、`StyleGetLocalNumeric`、
`StyleResolveNumeric`、`StyleResolveRelativeLength` を使います。相対長では
`properties` に `RelativeTarget` を保存します。一度の submit がネイティブで順序を
維持して前方区間を処理し、要素ごとの Addon 呼び出しを省きます。既存のコピー・
寿命・コールバック規則を維持します。

## 要素操作

`setClassNames(names)` はクラス名全体を置き換え、`getClassNames()` は空白
区切りの文字列を返します。`setPseudoClass(name, active)`、
`isPseudoClassSet(name)`、`arePseudoClassesSet(names)` はコロンなしの
ネイティブ疑似クラス名を扱います。空の一覧は全有効と判定します。
`getActivePseudoClasses()` は独立したスナップショットです。

`getAddress(includePseudoClasses = false, includeParents = true)` は
`div#item.selected:hover < body` のような RmlUi アドレスを返します。
葉から祖先への順序であり、CSS セレクターではありません。

```js
element.setClassNames('item selected');
element.setPseudoClass('invalid', true);
element.setAttributes({
  title: 'Inventory',
  count: 12,
  sequence: 9223372036854775807n,
  position: { x: 20, y: 40 },
});
const count = element.getAttribute('count', 0);
const raw = element.getAttributeValue('sequence');
```

`setAttribute(name, value)` と `setAttributes(values)` は文字列、真偽値、
数値、符号付き・符号なし 64 ビット BigInt、ベクトル、型付きの色、null を
扱います。null は Variant NONE を保存し、キーは削除しません。
`hasAttribute(name)` でキーなしと NONE を区別し、
`removeAttribute(name)` で削除します。`getNumAttributes()` はキー数です。

一括設定はキーをマージし、グループに対して `OnAttributeChange` を一度
呼びます。すべての JS getter と変換を終えてから要素を借用し、変更します。
変換エラーでは既存属性は変わりません。ネイティブコールバックの副作用を
巻き戻すトランザクションではありません。入力型の変更は単一属性と同じ
破棄防止検証を行います。イベント配信中の対象への属性変更は例外になる場合
があります。コールバック内の読み取りは可能です。

従来の `getAttribute(name)` はネイティブ文字列変換または null を返します。
`getAttribute(name, defaultValue)` は既定値の型で変換テンプレートを選びます。
number は double、BigInt は int64、INT64_MAX を超える既定値は uint64 です。
キーがなければ既定値を返します。number 型の無効な数値文字列はネイティブ
規則によりゼロになります。無効な整数文字列は BigInt の既定値を保持します。
危険な数値・文字列から整数への変換は事前に例外となります。null は型を
特定できないため既定値として拒否します。

`getAttributeValue(name)` は生の値をコピーし、キーなしと NONE は null です。
`getAttributes()` は全キーと値を独自のデータプロパティへコピーします。
ベクトルと色もコピーされ、要素の破棄後も読めます。コピーの変更は
ネイティブ属性に影響しません。

属性値はライフタイム保護された要素参照、所有するスタイル一覧と変換、
型付きスクリプト値や不透明ポインター値を受け入れます。
[`VariantValue`](/reference/rmlui/types/VariantValue.html) でネイティブ表現を
選びます。任意のホストオブジェクトには型付きポインター選択子か検証済みの
ネイティブ由来情報が必要です。イベント引数はコールバック内要素参照も扱います。
[ネイティブ値](./numeric-values.ja.md)を参照してください。

`getContext()` は所有文書経由で一意のコンテキストを返します。分離要素と
コンテキストルートはネイティブ同様に null です。`getFocusLeafNode()` は
最深のフォーカス子孫を返し、子孫がフォーカスされていなければ自身を返します。

[文書操作](./documents.ja.md)と
[ネイティブ型と既定動作](./rtti-default-actions.ja.md)も参照してください。

`getEventDispatcherSummary()` は `click (2)` などの診断文字列をコピーします。
キャプチャーと通常の登録を合算し、リスナーがなければ空文字列を返します。

`getEventDispatcher()` は同一性を保持する要素所有の
[`EventDispatcher`](/reference/rmlui/classes/EventDispatcher.html) を返します。
`attachEvent(idOrName, listener, capture = false)` と
`detachEvent(idOrName, listener, capture = false)` は Element の登録と共有し、
同じ登録は重複しません。`detachAllEvents()` はウィジェットのリスナーと
非 DOM 子要素を含めすべて再帰解除します。実行中の関数は安全に完了し、
型付き解除通知は外側境界でコピーした要素識別を使います。`toString()` は
同じ診断文字列です。破棄・終了で無効になり、トークンは分離要素を保持します。

```js
const dispatcher = element.getEventDispatcher();

dispatcher.attachEvent(EventId.Click, onClick);
EventDispatcher.dispatchEvent(
  element, EventId.Click, 'click', {}, true, false, DefaultActionPhase.Target,
);
dispatcher.detachEvent(EventId.Click, onClick);
```

静的 `dispatchEvent(target, id, type, parameters, interruptible, bubbles,
defaultActionPhase)` は全フラグが必須です。id はリスナーを選び、type は独立した
名前コピーであり、登録の既定値は使いません。上流同様、bubbles が false でも
`TargetAndBubble` は祖先の既定動作を実行します。引数取得は対象検証前に行います。

`getClosestScrollableContainer()` は自身を先に検査し、祖先へ進みます。
先に `context.update()` を呼びます。auto/scroll は対象軸の内容が表示領域を
超える場合のみ該当し、`overscroll-behavior: contain` は溢れがなくても該当します。
コンテナーがなければ null です。

`getDataModel()` はコンテキストの検索と同じ検証付き `DataModelConstructor`、
または未接続の場合 null を返します。切り離しで接続が解除され、再挿入では
新しい親のモデルに従います。モデル削除は保持済みハンドルも無効にします。
要素の破棄後は検索できませんが、保持済みモデルの寿命はコンテキストに従います。
検索は既存のネイティブポインター索引を使い、モデルや要素の集合を走査しません。
