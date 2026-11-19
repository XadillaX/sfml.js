# 数値と単位

`NumericValue` は独立したネイティブ `Rml::NumericValue` を所有します。
既定値は数値 `0`、単位 `Unit.UNKNOWN` です。`number` と `unit` は実際の
ネイティブフィールドに対応します。`numberView` は 1 要素の `Float32Array`、
`unitView` は 1 要素の `Int32Array` です。保持したビューはラッパーの回収、
要素の破棄、ランタイム終了後も有効で、DOM オブジェクトを保持しません。

```js
const { NumericValue, Unit, anyUnit } = require('sfml.js-rmlui');
const distance = new NumericValue(12, Unit.DP);

distance.numberView[0] = 24;
const pixels = element.resolveLength(distance);
const quarter = element.resolveNumericValue(
  new NumericValue(25, Unit.PERCENT), 200
); // 50
const isLength = anyUnit(distance.unit & Unit.LENGTH);
```

`clone()` は独立したネイティブコピーを作成します。`equals()` と `notEquals()`
は上流の演算子で数値と単位を比較し、正負のゼロは等価です。数値の書き込みは
float32 に丸めます。スタイル変更後は `context.update()` を呼び出してから、
現在の計算済みスタイルでフォント相対単位を解決してください。

| 単位 | 解決規則 |
| --- | --- |
| `PX` | ピクセル値 |
| `DP` | 数値とコンテキスト密度比の積 |
| `VW`、`VH` | 現在のコンテキスト幅・高さのパーセント |
| `EM`、`REM` | 要素・ドキュメントのフォントサイズの倍率 |
| `INCH`、`CM`、`MM`、`PT`、`PC` | 1 インチあたり 96 ピクセルに密度比を乗算 |
| `NUMBER` | 数値と `baseValue` の積 |
| `PERCENT` | 数値と `baseValue / 100` の積 |
| `DEG`、`RAD` | ラジアン |
| `X` | 拡大縮小しない数値 |

`resolveLength()` は `NUMBER` と `PERCENT` を含む長さ以外の単位にゼロを
返します。`resolveNumericValue()` は非数値単位にゼロを返します。どちらも
有効な要素が必要です。数値オブジェクト自体は初期化前や Worker 内でも
作成・編集・比較できます。

`Unit` は上流の基本・数値・型付きプロパティ・カスタムプロパティ・合成フラグを
すべて含み、`Units` は集合の型別名です。JavaScript の `|` と `&` はネイティブの
集合演算子、`anyUnit()` は `Rml::Any` に対応します。単位集合は保持・比較
できますが、複数の単位を単一の長さや数値として解決することはできません。

コンストラクターと setter は非有限値、float32 の範囲外、未知の単位ビットを
拒否します。ネイティブ操作も共有ビューを再検証し、解決結果の桁あふれは例外に
なります。無効なフィールドはビューへの直接書き込みか対応する setter で修復できます。

## 計算済み値

`element.getComputedValues()` はネイティブ `GetComputedValues()` の読み取り専用
ライブビューです。スタイル変更後は `context.update()` を呼んでから取得します。
98 個の getter は `fontFamily`、`marginTop`、`lineHeight`、`borderRadius`、
`animation`、`transform` などの camelCase 名です。構造化結果は独立したコピーで、
未設定のアニメーション、トランジション、変換、フォントハンドルは `null` です。

`new ComputedValues(element)` は上流の既定値で独立したネイティブ領域を作ります。
82 個の setter と書き込み専用 `setHasLetterSpacing(boolean)` により、
83 個のネイティブ代入操作を提供します。`copyInherited(source)` と
`copyNonInherited(source)` は対象のフィールド群だけをコピーし、関連要素は
変えません。代入は所有値のみを変更します。フォントファミリー、カーソル、字間、
ローカル flex 値、アニメーション、トランジション、変換は関連要素から読みます。
要素の破棄やランタイム終了後は所有値・ビューの両方が無効です。
監視参照は参照されていない切り離し要素を保持しません。

```js
const { ComputedValues, Style, resolveValueOr } = require('sfml.js-rmlui');

context.update();
const view = element.getComputedValues();
const value = new ComputedValues(element);

value.copyInherited(view);
value.copyNonInherited(view);
value.width = new Style.LengthPercentageAuto(
  Style.LengthPercentageAutoType.Percentage, 25
);
const pixels = resolveValueOr(value.width, 400, 0); // 100
```

`Style` はネイティブの列挙、値型、別名を公開します。フォントの太さは
1–1000 または Auto（0）です。`LengthPercentage`、`LengthPercentageAuto`、
`NumberAuto`、`VerticalAlign`、`LineHeight` は独立したネイティブ値を所有します。
`valueView` と `typeView` は実数と列挙のフィールドを、
`LineHeight.inheritValueView` は継承値を共有します。ビューは要素を保持せず、
ラッパーの GC、DOM の破棄、終了後も有効です。ネイティブは使用前に範囲と有限値を検証します。

`new Style.VerticalAlign()` は Baseline、数値一つはピクセル長、
引数二つは `(VerticalAlignType, length)` です。`Style.Clip(type, number)` は
int8 符号化を維持します。Number の 0、-1、-2 は Auto、None、Always になります。
`getType()`、`getNumber()`、`equals(type)` はネイティブ操作に対応します。
境界幅は int16 から uint16 への変換を維持し、角丸半径は範囲検証後に int16 へ切り捨てます。

`resolveValue` と `resolveValueOr` は二つの長さ型に対応します。負の割合基準は
未確定を意味し、自動長や未確定の割合はゼロまたは指定の既定値になります。
絶対長は負の基準でも自身の値です。`fontFaceHandle` と
`element.getFontFaceHandle()` は世代を検証する不透明なトークンを返し、数値アドレスは公開しません。

## 独立したスタイルフィールド群

`Style.CommonValues`、`Style.InheritedValues`、`Style.RareValues` は上流の
既定値で三つのネイティブ構造体を作り、112 個の書き込み可能フィールドを公開します。
名前は camelCase で、`float_` は `float` です。要素とは独立し、代入で文書の
スタイルは変わりません。初期化前や Worker 内でも使えます。

アドレスを持つ数値フィールドは `フィールド名View` を公開します。実数は
`Float32Array`、境界幅は `Uint16Array`、角丸は `Int16Array`、色は RGBA の
`Uint8Array` です。ビューはラッパーの回収や終了後も構造体を保持し、色の取得は
コピーを返します。ビットフィールドはネイティブで検証し、`hasLetterSpacing`
は数値の 0/1 です。setter は無効な列挙、整数、実数、色を変更前に拒否します。
ビューへの直接書き込みは検証を通りません。`clip` は `Style.Clip` のコピーで、
`language` はゼロ文字を含む UTF-8 を保持します。

```js
const values = new Style.CommonValues();

values.display = Style.Display.Flex;
values.widthType = Style.LengthPercentageAutoType.Percentage;
values.widthValueView[0] = 25;
values.backgroundColorView.set([20, 40, 60, 255]);
```

非 null の `InheritedValues.fontFaceHandle` はフォントエンジンに依存します。
`shutdown()`、`releaseFontResources()`、`releaseRenderManagers()` は
所有 `ComputedValues` 内のコピーも含め、既存トークンを無効化します。
無効なハンドルの取得と代入は例外になります。有効な要素から再取得してください。
終了後も `null` の代入と他の独立フィールドへのアクセスは有効です。
解放前に切り離した要素を再接続または回収してください。上流はコンテキストが
所有するツリーだけを更新します。拒否された解放は既存トークンを無効にしません。
