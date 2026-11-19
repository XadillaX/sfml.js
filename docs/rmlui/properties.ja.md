# 型付き属性と定義

## プロパティ ID の仕様

`PropertyId` と `ShorthandId` はメインスタイルシート用です。
`MediaQueryId` は 14 種類のメディア条件、`FontFaceId` は `@font-face` の
フィールドを識別します。四つの列挙型は RmlUi 6.3 の `Core/ID.h` から生成します。
値はそれぞれの仕様に属するため、メディアやフォントの ID を Element の
プロパティ操作に `PropertyId` として渡してはいけません。

メディア条件は Native で解析し、サイズ、画素密度、テーマの変更時に評価します。
解像度の単位は `x` で、例は `@media (resolution: 2x)` です。
フォントは記載順に読み込みます。スタイル、ウェイト、フォールバック、
フェイス番号を省略した場合の既定値は Normal、Auto、false、0 です。

```js
const { MediaQueryId, FontFaceId } = require('sfml.js-rmlui');
const feature = MediaQueryId.AspectRatio;
const fontField = FontFaceId.FaceIndex;
```

## 所有 Variant と変換先

`new Variant(value)` は Native が所有する `Rml::Variant` を作成します。
引数省略時は `NONE`、別の Variant を渡す場合は正確な格納型をコピーします。
`getType()` は共有メタデータを読み取ります。`clone()`、`assign(value)`、
`move()`、`moveAssign(source)`、`clear()` はネイティブ操作を使います。
移動後も移動元の型は維持され、文字列とコンテナーは移動後の状態となり、
数値は元の値を維持します。終了後の型は `NONE` で、値の操作は無効です。

`get(defaultValue)` は `Rml::Variant::Get<T>` の既定値を保持します。
`getInto(defaultValue)` はネイティブの成否と値を `{ success, value }` で返します。
`getReference(VariantType.X)` は正確な格納型を確認して参照を読み、
複合出力を独立したコピーで返します。Element のコピーは寿命スロットを共有し、
`getElementValue()` は同一性を持つ要素、または破棄後の `null` を返します。
プロパティ、属性辞書、イベント引数にも所有 Variant のコピーを渡せます。

```js
const { Variant, VariantType } = require('sfml.js-rmlui');
const value = new Variant('17, bad, 3');
const result = value.getInto({ type: 'vector3i', x: 91, y: 92, z: 93 });

// { success: false, value: { x: 17, y: 92, z: 93 } }
value.assign({ type: 'character', value: 0x1f600 });
value.getType() === VariantType.INT64;
value.get({ type: 'character', value: 0 }); // 128512
```

`vector2i`、`vector3i`、`vector4i` は int32 成分の整数ベクトル変換先です。
対応する Variant 格納型がないため、そのまま値として格納できません。
文字列はネイティブのカンマ区切りで変換します。成分不足は既定値を保持し、
途中の失敗は変換済みの先頭を保持します。到達する成分だけを範囲確認します。
`character` は `Rml::Character` 列挙型で、`INT64` として格納します。
読み取りは int64 の変換後に uint32 となり、Unicode スカラーだけに限定しません。
Property とスタイルの読み取りはゼロ初期値を使い、属性、イベント引数、
Variant は呼び出し側の既定値を使います。型付きアダプターのない参照は格納できません。

文字列への変換、`Property.toString()`、`PropertyDefinition.getValue()`、
`PropertySpecification.propertiesToString()` は、出力がポインターを直列化する場合に
`TypeError` を送出します。装飾・フィルターの入れ子属性も対象です。
既存のキャッシュ文字列は隠れた属性を読まずに返し、通常のスカラー変換では
ネイティブ所有者を走査しません。

文字列から真偽値への変換は `1`、`true`、`0`、`false` を大小文字を区別せず
受け入れますが、空白は除去しません。float/double はネイティブの `atof` に従い、
数値でない文字列や空文字列も成功としてゼロになります。バイト色は空文字列で
失敗すると初期色を保持し、空でない不正な色では不透明な黒に変更して失敗します。
浮動小数点色の各成分も同じ解析器を使い、数値でない成分はゼロになります。

文字列の変換先は出力の初期値でもあります。トランジションとアニメーション一覧は
そこに追記し、空でないエフェクト一覧のキャッシュ文字列も追記します。
変換行列、色停止点、影一覧は文字列を置換し、空のエフェクト一覧や null は
`none` になります。浮動小数点の文字列は小数三桁で整形して末尾のゼロを除去します。
ネイティブの `ToString`、`FromString` と変換器の特殊化はこれらの入口を支える
C++ 機能で、JS は値と型付き既定値で変換を選択します。

## グローバル RCSS 登録とカスタム解析器

`StyleSheetSpecification` はグローバル属性と解析器のレジストリです。
寿命は `initialise` / `shutdown` に従い、カスタム属性は文書を読む前に登録します。
`registerProperty(name, defaultValue, inherited, forcesLayout = false)` は
変更可能な定義を返します。組み込み名は予約済みで、重複するカスタム名は元の定義を保持します。
容量超過はネイティブのマップを変更する前に例外になります。
`registerShorthand(name, properties, type)` はローカル仕様と同じ検証と六方式を使います。

`getProperty(nameOrId)`、`getShorthand(nameOrId)` と三つの `getRegistered…` は
検索結果と ID 集合のコピーを返します。`getPropertyId`、`getPropertyName`、
`getShorthandId`、`getShorthandName` は名前と ID を変換します。
`getShorthandUnderlyingProperties(id)` は重複しない属性 ID を再帰的に集めます。
`parsePropertyDeclaration(dictionary, name, value)` は宣言を書き込みます。
`getPropertySpecification()` は借用した読み取り専用仕様を返し、終了時に
解析器・定義のハンドルとともに無効になります。

```js
const { StyleSheetSpecification: styles, PropertyParser, Unit } =
  require('sfml.js-rmlui');
const parser = new PropertyParser((property, value, parameters) => {
  if (!/^count:\d+$/.test(value)) {
    return false;
  }

  property.value = Number(value.slice(6)) * parameters.factor;
  property.unit = Unit.NUMBER;

  return true;
});

styles.registerParser('count-parser', parser);
styles.registerProperty('item-count', 'count:2', true)
  .addParser('count-parser', 'factor=3');
```

RCSS の `item-count: count:4` は継承する数値 12 になります。
`getParser(name)` は検証付きの組み込み・カスタム解析器、または `null` を返します。
`parser.parseValue(property, text, parameters = {})` は直接解析でき、引数値は int32 です。
引数マップと出力属性はコピーで、復帰後に属性を変更しても解析済みスタイルは変わりません。
false は通常のネイティブ部分書き込みを保持します。例外と不正な出力型は出力を採用せず、
例外はネイティブ呼び出し終了後に伝播します。同期の真偽値を返してください。
コールバックは Property を読み書きできますが、再帰解析、登録変更、
DOM・ランタイム操作は例外になります。登録済みの閉包は終了まで保持され、
未登録の解析器の循環参照は回収できます。
解析器が作るアニメーションのコールバックはネイティブの既定値やスタイルが持つ間保持されます。
独立した Property や辞書のコピーは回収可能な JS 参照で保持します。

## 属性仕様

`new PropertySpecification(reserveProperties, reserveShorthands)` はローカル仕様を
所有します。予約容量は属性 0〜127、短縮形 0〜254 で、ID は割り当てません。
`registerProperty(name, defaultValue, inherited, forcesLayout,
id = PropertyId.Invalid)` は `addParser` で設定できる変更可能な定義を返します。
自動 ID は 1 から始まり、割り当てた最大 ID の次に進みます。明示的な疎な ID も使えます。
同名の登録は既存定義を保持します。ID 競合と容量超過は登録前に例外となります。
空の名前と `invalid` は予約済みです。

`getProperty(nameOrId)` は検証付き定義または `null` を返します。
`getRegisteredProperties()`、`getRegisteredInheritedProperties()`、
`getRegisteredPropertiesForcingLayout()` は独立した昇順 ID 配列です。
仕様ラッパーが回収されても登録済み定義は終了まで保持され、終了時に無効になります。

```js
const {
  PropertySpecification, PropertyDictionary, ShorthandType,
} = require('sfml.js-rmlui');
const specification = new PropertySpecification(2, 1);

specification.registerProperty('x', '0px', false, false).addParser('length');
specification.registerProperty('y', '0px', false, false).addParser('length');
const pair = specification.registerShorthand('pair', 'x,y',
  ShorthandType.Replicate);
const values = new PropertyDictionary();

specification.parseShorthandDeclaration(values, pair, '4px');
console.log(specification.propertiesToString(values, true, ';'));
```

`registerShorthand(name, properties, type, id = ShorthandId.Invalid)` は六種類の
`ShorthandType` に対応します。構成名はカンマ区切りで、`?` と `#` 接尾辞を使えます。
構成の欠落と重複は `Invalid` を返し、無効な宣言は名前や ID を予約しません。
Box は四属性、Flex は三属性が必要で、不正な項目数は例外になります。
`getShorthand(nameOrId)` は構造コピーを返し、属性と入れ子の短縮形を区別します。
属性定義の参照は世代を検証します。

`parsePropertyDeclaration(dictionary, nameOrId, value)` は属性 ID、属性名、
短縮形名、カスタム変数名に対応し、`parseShorthandDeclaration` は短縮形 ID を使います。
両方ともネイティブ成功結果を返し、失敗時の部分書き込みを保持します。
`setPropertyDefaults(dictionary)` は欠落属性だけを埋めます。
`propertiesToString(dictionary, includeName, delimiter)` は通常属性を ID 順に
直列化し、末尾に区切りを付けません。区切りはネイティブ `char` と同じ一 UTF-8 バイトです。

## 属性辞書

`PropertyDictionary` は実行中のランタイムでネイティブ辞書を所有します。
通常属性は `PropertyId`、カスタム属性は文字列、変数短縮形は `ShorthandId` を使い、
3 つのマップは独立しています。主スタイルシートの ID を装飾やフォント効果の
ローカル仕様に流用しないでください。

`setProperty(id, property)`、`setCustomProperty(name, property)`、
`setVarShorthand(id, property)` は入力をコピーします。変数短縮形は
`Unit.VAR_EXPRESSION` の文字列 Property が必要です。ID は非ゼロで、対応する
`MaxNumIds` 未満です。`getProperty`、`getCustomProperty`、`getVarShorthand` は
独立コピーまたは `null` を返します。`getProperties()`、`getCustomProperties()`、
`getVarShorthands()` は属性コピーを含む新しい Map を返します。

`removeProperty(id)` は戻り値なし、`removeCustomProperty(name)` と
`removeVarShorthand(id)` は項目が存在していたかを返します。
`getNumProperties()` は通常属性のみを数え、`empty()` と `clear()` は全マップを扱います。

`import(source, specificity = -1)` は入力の詳細度が既存以上なら上書きします。
RmlUi 6.3 は正数の場合だけ詳細度を強制し、ゼロと負数は入力の詳細度を保持します。
`merge(source, specificityOffset = 0)` は詳細度を加算して比較し、int32 の範囲外なら
変更前に例外を投げます。自己インポートと自己マージはコピーを読みます。
`setSourceOfAllProperties(sourceOrNull)` は 1 回コピーした出典を全マップに設定します。

保存したコールバックはネイティブコピーと JS 可視参照で保持します。
消去や GC は参照を解放し、辞書を捕捉するコールバックの循環も回収できます。
終了時は RmlUi の破棄前に資源を解放し、古い辞書ハンドルを無効にします。

## 要素属性

`Element.getProperty(nameOrId)` は継承、既定値、定義、ソース情報を含む原生属性を
即座にコピーします。カスケード変数は `context.update()` 後に読みます。
欠落は `null` です。`getLocalProperty(nameOrId)` はインライン指定と一致する RCSS 規則を
読み、継承・既定値を除き変数も解決しません。`getLocalStyleProperties()` はクラス規則とカスタム変数を
除いた `Map<PropertyId, Property>` のコピーを返します。

```js
const { Property, PropertyId, Unit } = require('sfml.js-rmlui');
const width = element.getProperty('width');

element.setProperty(PropertyId.Width, new Property(120, Unit.PX));
element.setProperty('height', '30px');
console.log(width.toString()); // 取得時の値を保持します。
element.removeProperty(PropertyId.Width);
```

`new Property()` の既定値は null/NONE、UNKNOWN、詳細度とパーサー番号 -1、
定義とソース null です。整数 1 個は KEYWORD の列挙型コンストラクターを選びます。
単位を指定する形式の JavaScript 数値は DOUBLE、列挙型形式は INT になります。

`{ type, value }` は数値の格納型または変換テンプレートを明示的に選択します。
`byte`・`char`・`float`・`double`・`int`・`uint` は有限の JavaScript 数値を受け取り、
整数型ではネイティブ範囲内の整数が必要です。`byte` は 0–255、`int` は符号付き
32 ビット、`uint` は符号なし 32 ビットです。`char` の範囲はプラットフォームに従い、
`float` は単精度に丸められます。`int64`・`uint64` は対応する符号付き・符号なし
64 ビット範囲の正確な BigInt が必要で、小さな正値も符号なし型を選べます。
生の読み取りは number または BigInt を返します。

```js
const count = new Property({ type: 'uint', value: 12 }, Unit.NUMBER);
const narrow = count.get({ type: 'int', value: 0 });

element.setAttribute('total', { type: 'uint64', value: 12n });
const total = element.getAttribute('total', { type: 'uint64', value: 0n });
```

同じ見本を Property・属性・イベントのテンプレートに使えます。ネイティブの
Variant 等価比較は格納型を区別します。RmlUi 6.3 には byte-to-byte、
double-to-byte、string-to-char の変換器がありません。生の byte 値は保持されますが、
これらのテンプレート変換は属性・イベントの既定値、または Property の `T{}` を返します。
危険な浮動小数点・文字列からの整数変換はネイティブのキャストや走査前に例外になります。
有効な十進接頭辞と、符号なし文字列変換の符号接頭辞は保持します。
入力アクセサーを実行してから受信オブジェクトの有効性を検証します。

`value` はスカラー、ベクトル、色、色停止点と影のリスト、変換、
[遷移／アニメーション一覧](animation.ja.md#css-モーション値)をコピーします。
Element 参照は Property と属性のコピー後も同じラッパーを返します。
`property.getElementValue()` と
`element.getElementAttribute(name, fallback = null)` はネイティブの
`ScriptInterface*` 変換を選びます。キーなし・変換失敗は既定値を返し、
破棄済みの保存対象は正常に null へ変換されます。到達可能な所有者は独立要素を
保持し、値の削除・置換は参照を解放します。自己参照と要素間の循環は回収できます。
明示的な解放と DOM 破棄は全コピーの参照を null にし、終了は実行世代を無効にします。

Element、Context、RmlEvent 入力は保護された ScriptInterface 参照を格納します。
`get({ type: 'scriptinterface', value: null })` はネイティブ基底参照の変換を選びます。
属性とイベント取得は指定の既定値を保持し、Property の初期値は null です。
Context の削除、イベントの解放、各コールバックの終了は全コピーを null にします。
生の取得は元の Context またはイベントラッパーを返します。
コピーは回収可能な JS 参照で対象を保持し、変更のないフレームでは所有者を走査しません。

参照のテンプレート取得は要素 API または scriptinterface を使います。`getAttribute(name)`、
文字列既定値での取得、`Property.toString()`、
`PropertyDefinition.getValue(property)` はポインター値を拒否します。
RML 出力にポインターアドレスは含まれません。生の `value`、
`getAttributeValue()`、`getAttributes()` は Element、Context、RmlEvent または null を返します。

装飾、フィルター、フォント効果は
`DecoratorList`、`FilterList`、`FontEffectList` を返し、属性とイベントの入力にも使えます。

```js
const { FilterList } = require('sfml.js-rmlui');
const filters = new FilterList('blur(2px) brightness(75%)');

element.setProperty(PropertyId.Filter, new Property(filters, Unit.FILTER));
console.log(filters.value, filters.list);
```

コンストラクターはネイティブ仕様で RCSS を解析します。`value` は元の文字列、
`isNull` は共有ポインターの null 状態、`list` は宣言のコピーまたは `FontEffect` ラッパーです。
装飾宣言は `type`、`isNamed`、`paintArea`、`properties` を持ち、
フィルター宣言は `type`、`properties` を持ちます。属性エントリーは生成器内の
`id`、`name`、所有する `Property` です。名前付き装飾は後でスタイルシートが解決します。
フォント効果は `hasUniqueTexture`、非乗算済み `colour`、`layer`
（`FontEffectLayer.Back`／`Front`）、正確な BigInt `fingerprint` を返します。

メタデータを変更してもネイティブ宣言は変わりません。同じリストの代入は共有資源の
同一性を保持し、同じ文字列を別に解析すると異なるポインターになります。
空文字列または `"none"` は型付き null リストで、`value` は `''`、`list` は空です。
属性の型変換失敗は型付き null、属性／イベントの既定値 API は指定した値を返します。
CSS の `font-effect: none` は引き続き Variant NONE（`null`）です。
DOM 終了やラッパー GC 後も所有者があれば使えますが、元の実行世代が必要です。
実行終了は資源を解放しリストを無効化します。コピー済みのフォント情報と数値記録は
読み取れます。FontEffect ラッパー自体は終了時に無効になります。

`FontEffectList` は `(effects, text?)` と書き込み可能な `value`、`list` も提供します。
文字列の代入は RCSS を解析しません。リストの代入は入力順で不変な効果を保持し、
毎回新しい領域を作るため、既存の Property と DOM のスナップショットを維持します。
`[]` と null への代入は非 null 領域を作ります。RCSS の解析順は背面／前面です。

`new FontEffect()` の既定値は白色、Back、指紋 `0n` です。独自テクスチャを持たず、
字形メトリクスに対応せず、テクスチャを生成しません。解析した効果は派生実装を保持します。
`colour`、`layer`、`fingerprint` の編集はメタデータをコピーし、他の所有者に影響しません。
編集した効果はリストに再代入してください。`colour` の変更には値全体を代入します。

`FontGlyph` の `bearing`、`advance`、`bitmapDimensions`、`colorFormat` は
対応する `Int32Array` ビューでネイティブ領域にマップします。ビットマップ代入は
入力ビューだけをネイティブ専用領域へコピーします。`bitmapData` と `bitmapOwnedData`
は領域を保持する書き込み可能なビューです。どちらの代入もデータポインターを設定し、
null で消去します。`weakCopy()` はメトリクスをコピーして現在の領域を共有し、
`bitmapOwnedData` は null です。元の置換・回収後も弱コピーとビューは有効です。
これらの独立した値は実行終了後も使用できます。

`effect.getGlyphMetrics(glyph, origin?, dimensions?)` は
`{ supported, origin, dimensions }` を返します。既定値は原点ゼロと元の寸法です。
`effect.generateGlyphTexture(bytes, dimensions, stride, glyph)` はネイティブで
乗算済み RGBA を書き込みます。stride はバイト単位で、行の余白は保持します。
領域、形式、切り離し／共有バッファー、入力と出力の重複を検証します。

`new FontEffect(callbacks)` は任意の同期コールバック `hasUniqueTexture()`、
`getGlyphMetrics(glyph, origin, dimensions)`、
`generateGlyphTexture(destination, dimensions, stride, glyph)` を受けます。
省略時は基本クラスの動作です。メトリクスは実際の入力原点を使い、
`{ supported, origin, dimensions }` を返します。グリフは保持可能な
ネイティブ所有の独立コピーです。存在するビットマップには宣言寸法分の領域が
必要です。メトリクス呼び出しでは null のビットマップも使用できます。

テクスチャの作業領域はネイティブ所有で、元の行間隔を保持します。
行の初期値は出力と同じで、余白はゼロです。同期呼び出しの成功時のみ行を反映します。
保持したビューは出力を参照しません。例外、Promise、作業領域の切り離し、
出力の転送・縮小では書き込みを破棄します。再帰や実行環境・DOM の変更は拒否し、
メタデータ編集は許可します。

リスト、属性のコピー、辞書、入れ子の宣言属性は、属性定義の既定値も含めて
独自効果のコールバックを保持します。スタイルシートは無効なメディア規則や
キーフレームも保持します。文書は `close()` から次のコンテキスト更新までを含め、
ネイティブ破棄までスタイルを保持します。切り離した要素ツリーと独立した定義は
GC が追跡できる参照を使い、コールバックとの循環を回収できます。
登録済みの既定値とグローバルなスタイルシートキャッシュはネイティブのルートです。
コンテキストルートにはカーソルプロキシーとそのドラッグクローン、および次回更新まで
破棄されないアンロード文書も含まれます。要素属性は要素ツリーの所有関係に従います。

既定フォントエンジンのレイヤーは文書を閉じた後も効果を保持します。
`releaseFontResources()` はそのキャッシュ参照を解放しますが、別の値やスタイルが
所有しているコールバックは残ります。所有権の追跡はネイティブ効果の同一性と
アトラス再利用を維持します。終了時は古いラッパーが残っていても全コールバックを
解放します。独自の属性パーサー内で効果の構築とリストのコピーは可能ですが、
RCSS の入れ子解析は拒否します。

`FontEffect.fillColorValuesFromAlpha(bytes, dimensions, stride)` は
protected なネイティブ補助関数です。各 RGBA ピクセルのアルファを 3 色チャンネルへ
コピーし、アルファと行の余白を保持します。非共有 `Uint8Array` の部分ビューを受け、
寸法、行間隔、領域の範囲を検証します。初期化前、終了後、ワーカーでも使用できます。

`DecoratorDeclaration` と `FilterDeclaration` は書き込み可能なレコードです。
`instancer` は `DecoratorInstancer.get(name)` または `FilterInstancer.get(name)`
で取得する型付き参照で、不明な名前は `null` です。装飾の null は名前付き参照を
意味し、フィルターには非 null の生成器が必要です。空のコンストラクターは
`type: ''`、`properties: []`、`instancer: null`、装飾の `paintArea: BoxArea.Auto`
を設定します。`isNamed` は現在の生成器フィールドから計算されます。

`new DecoratorList(records, text?)` と `new FilterList(records, text?)` は
レコードをネイティブ領域へコピーします。両リストの `value` と `list` は変更可能です。
`value` の変更はメタデータ文字列だけに作用し、RCSS を解析しません。
`list` の変更は宣言をコピーし、`value` を維持します。代入のたびに新しい共有リストを
作るため、既存の属性やイベントのスナップショットは変わりません。
null リストへの代入と `[]` からの構築は、非 null のストレージを作ります。
入力の配列、宣言、属性は独立したままです。

```js
const records = filters.list;
const sigma = records[0].properties.find(entry => entry.name === 'sigma');

sigma.property.value = 6;
filters.list = records;
element.setProperty(PropertyId.Filter, new Property(filters, Unit.FILTER));
```

生成器の完全な属性辞書は解析済み宣言から取得してください。必須属性の欠落、
不明なローカル ID、異なる生成器型、無効な参照や描画領域は代入前に拒否されます。
属性の `name` は表示用で、`id` がフィールドを指定します。
`DecoratorInstancer`、`FilterInstancer`、`FontEffectInstancer` は
`get(name)`、`register(name, instancer)`、`getPropertySpecification()` を公開します。
登録は名前を小文字化し、検索は入力と完全一致します。置換後も既存参照のため
以前のインスタンサーを終了まで保持します。仕様はローカル ID の読み取り専用ビューです。

`new FontEffectInstancer(callback)` はネイティブの効果生成を実装します。
`registerProperty(name, defaultValue, affectsGeneration = true)` と
`addParser(...)` で属性を登録し、`registerShorthand(...)` で
`font-effect` 短縮形を登録すると匿名 RCSS 引数を解析できます。
同名属性は最初の定義を保持します。無効な短縮形は ID を消費せず、容量を事前検証します。

```js
const source = new FontEffect();
const custom = new FontEffectInstancer((name, properties) => {
  source.colour = properties.getProperty(tint.id).get({
    type: 'colourb', red: 255, green: 255, blue: 255, alpha: 255,
  });

  return source;
});
const tint = custom.registerProperty('tint', 'white', false)
  .addParser('color');

custom.registerShorthand('font-effect', 'tint', ShorthandType.FallThrough);
FontEffectInstancer.register('tint', custom);
const effects = new FontEffectList('tint(red)');
```

コールバックは所有辞書コピーを受け、`FontEffect` または `null` を同期的に返します。
RCSS 解析器が指紋を設定する前にメタデータをコピーし、返却ラッパーのスナップショットと
グリフの仮想実装を保持します。RmlUi 6.3 は `affectsGeneration` を保存しますが、
解析時の指紋には全属性を使います。この動作を維持します。
`instanceFontEffect(name, properties)` の直接呼び出しには完全な属性が必要です。
先に `specification.setPropertyDefaults(properties)` で補完できます。
直接呼び出しでは RCSS 指紋を計算しません。コピーされた値の操作と他の生成器への委譲は
可能ですが、再帰生成、解析、登録、DOM 変更は例外になります。例外は最外の境界で伝播します。
登録済みコールバックは終了まで保持し、未登録の循環参照は GC で回収可能です。
終了時に全ビューが無効になります。

`new FilterInstancer(callback)` はフィルターファクトリーを提供します。
`registerProperty(name, defaultValue).addParser(...)` と `filter` 短縮形を使います。
この登録には `affectsGeneration` 引数はありません。コールバックは辞書コピーを受け取り、
所有 `Filter` または `null` を同期的に返します。
`FilterInstancer.get(name).instanceFilter(name, properties)` への委譲も可能です。
直接呼び出しには既定値を含む完全なローカル属性が必要です。
辞書を後で変更しても生成済みフィルターのパラメーターは変わりません。

```js
const blur = FilterInstancer.get('blur');
const parameters = new PropertyDictionary();

blur.getPropertySpecification().setPropertyDefaults(parameters);
const filter = blur.instanceFilter('blur', parameters);
const overflow = filter.extendInkOverflow(element, {
  p0: { x: 0, y: 0 },
  p1: { x: 40, y: 30 },
});
```

`extendInkOverflow` はネイティブ仮想関数を呼び、入力を変更せず
`Rectanglef` の角のコピーを返します。相対長は指定した有効な要素で解決します。
コールバック制限、置換、終了の動作は上記と同じです。
`compileFilter(element)` は一意のコンパイル済み所有リソースを返します。
[描画リソース](resources.ja.md) を参照してください。
`new Filter({ compileFilter, extendInkOverflow? })` は仮想関数を同期実装します。
コンパイルコールバックは要素を受け取り、その描画管理器で作成した
`CompiledFilter` を返します。所有権はネイティブへ移動し、元ラッパーの
`isValid` は false になります。同じリソースの再返却は例外になります。
別の管理器のリソースは所有権を保持したまま拒否されます。
失敗時は新しい空の `CompiledFilter` を返します。任意のはみ出しコールバックは
矩形コピーを受け取り、有限値の角を返す必要があります。

```js
const custom = new Filter({
  compileFilter(element) {
    return element.getRenderManager().compileFilter('blur', { sigma: 2 });
  },
  extendInkOverflow(element, overflow) {
    overflow.p0.x -= 6;
    overflow.p1.x += 6;

    return overflow;
  },
});

FilterInstancer.register('custom', new FilterInstancer(() => custom));
```

効果コールバックは属性やボックスのコピー参照、数値長の解決、リソースの
コンパイルが可能です。DOM/スタイル変更、終了、再帰描画は拒否されます。
ネイティブ要素の効果はコールバックを保持します。切り離したツリーと単独の
フィルターは GC が追跡できる参照を使い、自己参照クロージャーも回収できます。
終了時はコールバックを解放し、フィルターを無効化します。
カスタム装飾の生成とグリフ仮想関数のカスタム実装は両方とも実装済みです。
ネイティブ所有権がコールバックを保持し、切り離したオブジェクトや独立オブジェクトの
循環は回収可能で、終了時に解放されます。

`ColorStopList` は `{ type: 'colorstoplist', values: ColorStop[] }`、
`BoxShadowList` は `{ type: 'boxshadowlist', values: BoxShadow[] }` です。
色は `{ type: 'colourb-premultiplied', red, green, blue, alpha }` で、
各チャンネルは 0 から 255 の整数です。RGB はアルファ乗算済みで、
読み書き時に乗除算を行いません。数値は `{ number, unit }` です。
順序、負のオフセット、相対単位、省略位置（`Unit.UNKNOWN`）を保持します。
結果は独立コピーで、GC や終了後も読み取れます。

```js
/** @type {import('sfml.js-rmlui').BoxShadowList} */
const emptyShadows = {
  type: 'boxshadowlist', values: [],
};
const shadows = element.getProperty('box-shadow', emptyShadows);

if (shadows.values.length) {
  shadows.values[0].offsetX = { number: 8, unit: Unit.PX };
  element.setProperty(PropertyId.BoxShadow,
    new Property(shadows, Unit.BOXSHADOWLIST));
}
```

同じリストを属性やイベントにも使用できます。`getAttributeValue(name)` は生のリスト、
`getAttribute(name)` は従来どおり文字列を返します。属性・イベントの型付き取得では
指定した既定値を使い、スタイル属性の変換失敗では空リストを返します。不正な要素、
非有限数、範囲外の色値は出力先を変更せず例外になります。
数値入力は NumericValue オブジェクトも使用でき、出力は共有ビューを持たない普通のレコードです。
`Property.equals` と `notEquals` は全フィールドを含めリストを値比較します。
要素 1 個のリスト比較はネイティブ ColorStop/BoxShadow 演算子と同じ意味になります。

`get(typeExemplar)` は `0` で double、`0n` で符号付き 64 ビット整数、`''` で文字列、
またはベクトル・色の形で変換型を選びます。失敗時は見本の値ではなく `T{}` を返します。
`element.getProperty(name, typeExemplar)` は属性欠落時も `T{}` を返します。
`getNumericValue()` は独立した `NumericValue`、`toString()` は定義を使う文字列を
返します。等価比較は単位と値だけを比較します。

`unit`、`specificity`、`parserIndex` は個別の 1 要素 `Int32Array` で原生メタデータを
マップし、原生呼び出し時に属性へ同期します。ビューは整数だけを保持するため、
GC スレッドでスタイル資源を解放しません。バッファーは転送不可で、構造化複製はコピーします。
`source` は `{ path, lineNumber, ruleName }` のコピーです。
要素への反映には `setProperty` を呼びます。

`PropertyDefinition` は ID、継承、レイアウト、相対対象、既定属性コピーを公開します。
`parseValue(property, text)` は失敗時の UNKNOWN 単位を含め出力を変更します。
`getValue(property)` は `{ success, value }` を返します。RmlUi 6.3 のキーワード
変換は有効な文字列を返しても `success: false` になります。

`PropertyDefinition(id, defaultValue, inherited, forcesLayout)` は変更可能な独立定義を
作ります。`addParser(name, parameters = '')` と `setRelativeTarget(target)` は
チェーン可能です。組み込み定義は読み取り専用です。借用参照を保護するため、
独立定義は終了まで保持します。

属性と定義は所有環境の初期化済みランタイムが必要です。DOM 破棄後もコピーは有効ですが、
終了後は無効です。終了時はプールとパーサーより先に参照を解放し、共有メタデータを
既定値に戻します。古いハンドルは再初期化後も使えません。残したビューは独立領域として
書き込み可能で、新しい世代に影響しません。偽ハンドル、無効単位、非有限数、
単位と一致しない複合値ストレージは原生境界で拒否します。

`Transform` はネイティブのプリミティブリストを所有し、正規化した
`TransformPrimitive` レコードで構築します。`TransformPrimitiveType` は全 22 型を
含みます。`getPrimitive(index)` と `primitives` はコピーを返します。
`primitives` への代入で一括置換でき、`addPrimitive`、`clearPrimitives`、
`getNumPrimitives` も使えます。無効なインデックスや成分は例外になります。

```js
const { Transform, TransformPrimitiveType: T, makeTransformPrimitive } =
  require('sfml.js-rmlui');
const rotate = makeTransformPrimitive(T.ROTATE2D,
  [{ number: 90, unit: Unit.DEG }]);
const transform = new Transform([rotate]);

element.setProperty(PropertyId.Transform,
  Transform.makeProperty(transform.primitives));
```

解決済み成分は数値で、正規レコードの角はラジアンです。平行移動と透視変換は
`{ number, unit }` で相対単位を保持します。`makeTransformPrimitive(type, numericValues)`
はネイティブの NumericValue 配列コンストラクターを呼びます。角は RAD/DEG/PERCENT、
Rotate3D の軸は NUMBER。行列と拡大縮小は数値をコピーします。
スカラー形式は成分を明示し、移動の既定単位は PX、角は DEG、等倍拡縮は各軸に同じ値を
指定します。Matrix3D は列優先の 16 係数、DecomposedMatrix4 は `perspective`、
`quaternion`（x/y/z/w）、`translation`、`scale`、`skew` の 5 ベクトルです。

生の値は `{ type: 'transform', primitives: [...] }` です。`primitives: null` は
空の TransformPtr、空配列は恒等変換です。Property の `Get<T>` が失敗すると空ポインター
レコードを返し、属性とイベントは指定した既定値を使います。代入時に独立したネイティブ
所有者へコピーします。Property の比較はポインター同一性で、`property.clone()` は
維持しますがコピーからの再構築は新しいポインターになります。
純粋な Transform とコピーは終了後も使え、`makeProperty` は有効なランタイムが必要です。
リスト代入で書き込み可能な `GetPrimitives` を表現し、可変長ベクトルの参照は貸し出しません。

`element.iterateLocalProperties(filterInheritedBy = null)` は一度の Native
呼出しでネイティブ順の `[name, Property]` 配列を返します。インライン上書き、
シートとクラス規則、変数と変数付き略記を含み、重複と略記プレースホルダーは
ネイティブ規則に従います。絞り込み要素が実際に継承する値のみを残し、
独自の上書きは除外します。値はイテレーターの解放とラップ前にすべてコピーし、
後の属性・クラス変更や要素破棄もコピーを無効にしません。
ライブのネイティブイテレーターは保持しません。
