# RmlUi API ガイド

[RmlUi API リファレンス](/reference/rmlui/)は TypeScript 宣言と 4 言語の TSDoc から生成します。概要は短い説明を表示し、メンバー詳細はシグネチャ、既定値、引数、戻り値、有効期間を説明します。

[文字列とリソース URL](strings.ja.md) では保持バイトビュー、UTF-8 反復、
一括位置変換と型付きネイティブ整形を説明します。

## 契約を探す

| 目的 | API |
| --- | --- |
| 描画ウィンドウの接続 | [initialise](/reference/rmlui/functions/initialise.html)、[InitialiseOptions](/reference/rmlui/interfaces/InitialiseOptions.html) |
| フォントの読み込みとキャッシュ解放 | [loadFontFace](/reference/rmlui/functions/loadFontFace.html)、[フォントガイド](fonts.ja.md) |
| Native ライフサイクル通知 | [Plugin](/reference/rmlui/classes/Plugin.html)、[プラグインガイド](plugins.ja.md) |
| 描画リソースの取得と解放 | [描画リソース](resources.ja.md)、[RenderInterface](/reference/rmlui/interfaces/RenderInterface.html) |
| レイアウト、スクロール、座標投影 | [要素レイアウト](layout.ja.md)、[Element](/reference/rmlui/classes/Element.html) |
| ネイティブのスクロールと変換部品 | [ElementScroll](/reference/rmlui/classes/ElementScroll.html)、[TransformState](/reference/rmlui/classes/TransformState.html)、[ElementTransformBuffer](/reference/rmlui/classes/ElementTransformBuffer.html) |
| イベント登録・再帰解除・明示送信 | [EventDispatcher](/reference/rmlui/classes/EventDispatcher.html)、[要素状態](element-state.ja.md) |
| ボックス値の構築と取得 | [ボックス値](boxes.ja.md)、[Box](/reference/rmlui/classes/Box.html)、[RenderBox](/reference/rmlui/classes/RenderBox.html) |
| 数値と単位の解決 | [数値と単位](numeric-values.ja.md)、[NumericValue](/reference/rmlui/classes/NumericValue.html) |
| 型付き属性の取得と設定 | [属性](properties.ja.md)、[Property](/reference/rmlui/classes/Property.html) |
| 属性アニメーションとイージング | [アニメーション](animation.ja.md)、[Tween](/reference/rmlui/classes/Tween.html) |
| コンテキストの作成、更新、描画 | [createContext](/reference/rmlui/functions/createContext.html)、[Context](/reference/rmlui/classes/Context.html) |
| 物理サイズの取得 | [ContextDimensions](/reference/rmlui/interfaces/ContextDimensions.html) |
| データと自作ビュー・コントローラー | [データモデル](data-models.ja.md)、[DataView](/reference/rmlui/classes/DataView.html)、[DataController](/reference/rmlui/classes/DataController.html)、[Factory](/reference/rmlui/classes/Factory.html) |
| 文書の表示とアンロード | [Document](/reference/rmlui/classes/Document.html) |
| 要素の検索、スタイル、リスナー | [Element](/reference/rmlui/classes/Element.html) |
| 有効なイベントとコピーしたパラメーター | [RmlEvent](/reference/rmlui/classes/RmlEvent.html)、[RmlEventListener](/reference/rmlui/types/RmlEventListener.html) |
| ランタイムの解放 | [shutdown](/reference/rmlui/functions/shutdown.html) |

## ネイティブ要素の部品

`element.getStyle()` は実際の検証付き
[`ElementStyle`](/reference/rmlui/classes/ElementStyle.html) を公開します。
カスケード、変更集合、明示定義更新、所有値計算、コピー反復、再利用キーフレーム
解析を含みます。寿命、配置への適用、共有数値コマンドは
[要素状態](element-state.ja.md#native-style-component) を参照してください。

`element.getElementBackgroundBorder()` は同一性を保持する要素所有の
[`ElementBackgroundBorder`](/reference/rmlui/classes/ElementBackgroundBorder.html)
を返します。`dirtyBackground()` と `dirtyBorder()` は次回のネイティブ
`render()` でジオメトリを更新します。現在の計算スタイル・配置・管理器状態を
使うため、先に視口を準備します。管理器がない分離要素は描画せず、別管理器の
活動レイヤーと効果関数内の再入を拒否します。

`getClipGeometry(area)` は BoxArea.Border・Padding・Content の領域値で
独立したネイティブ `Geometry` コピーを返します。Margin・Auto は例外、
管理器がなければ空です。部品再生成・要素破棄・コピーの変更や解放は他の
コピーと部品メッシュに影響しません。管理器が GPU 資源の寿命を制御しますが、
`getMesh()` のコピーは管理器解放・終了後も使用できます。

```js
const background = element.getElementBackgroundBorder();

context.getRenderManager().prepareRender({
  x: context.dimensions.width, y: context.dimensions.height,
});
background.render();
const clip = background.getClipGeometry(BoxArea.Padding);
const mesh = clip.getMesh();

clip.release();
```

`element.getElementScroll()` は要素が所有する `ElementScroll` を返します。
`ScrollOrientation.VERTICAL` は 0、`HORIZONTAL` は 1 です。
`update()`、`enableScrollbar(orientation, elementWidth)`、
`disableScrollbar(orientation)`、`updateScrollbar(orientation)`、
`formatScrollbars()`、`updateProperties()` はネイティブの操作を実行します。
`getScrollbar(orientation)` はライブ要素、未作成なら `null` を返します。
`getScrollbarSize(orientation)` は垂直バーの幅または水平バーの高さを
ピクセルで返し、無効ならゼロです。無効化は属性を変更するため、可視性取得前に
`updateProperties()` で再計算します。要素の破棄で部品も無効化されます。
分離要素はトークンによって保持されます。

`element.getTransformState()` は現在の状態の読み取り専用ビュー、または
`null` を返します。変換は `context.render()` 中に更新されます。
`getTransform()`、`getLocalPerspective()`、`getInverseTransform()` は
列優先の 16 値を持つ独立したネイティブ `Float32Array` コピーを返します。
未設定なら `null`、特異変換にも逆行列はありません。コピーは要素やランタイム
の終了後も使用できます。`new TransformState()` は独立した状態を所有し、
`setTransform(matrix)` と `setLocalPerspective(matrix)` は有限の 16 値を
コピーします。`null` は解除し、戻り値はネイティブ値が変わったかです。

多数の要素を繰り返し読む場合は `ElementTransformBuffer` を一度確保します。
`refresh()` は一回のネイティブ呼び出しで実行し、JS コールバックと出力の
再確保はありません。各要素は 48 値で、変換は 0、透視は 16、逆行列は 32
のオフセットです。`flags[i]` の存在ビットは 1、2、4。未設定行列はゼロです。
書き込みはコピーだけを変えます。全要素を出力変更前に検証し、無効なら例外に
なります。数値ビューは領域だけを保持し、ラッパーの回収後も使用できます。

```js
const { ElementTransformBuffer } = require('sfml.js-rmlui');
const transforms = new ElementTransformBuffer(elements);

context.update();
context.render();
transforms.refresh();
const firstTransform = transforms.matrices.subarray(0, 16);
const firstPresence = transforms.flags[0];
```

## 主な戻り値

`initialise` は成功を返し、再呼び出しではプロセス全体のウィンドウや設定を置き換えません。`loadFontFace` はフォント読み込みの成否を返します。要素クエリーは該当なしなら `null`、`setProperty` は RCSS の受理結果を返します。

`processEvent` はキー・テキスト・ホイールでは伝播状態、マウス・タッチでは要素と操作していないかを返します。直接入力と戻り値は[文書とイベント](./documents.ja.md#直接入力)を参照してください。`update` と `render` は RmlUi 6.3 の結果を返し、現在は常に true です。変更フラグや可視性の判定には使えません。

## 既定値と所有権

`highDpi` の既定値は true、代替フォント登録、モーダル表示、リスナーキャプチャは false です。API 詳細にも記載しています。

コンテキストと要素のラッパーはランタイム生成、読み込み関数、要素クエリーから取得します。内部ハンドルは公開 API ではありません。借用オブジェクトの無効化とリスナー解除は[文書とイベント](documents.ja.md)を参照してください。

`Box` と `RenderBox` は公開コンストラクターを持ち、独立したネイティブ値と数値ビューを所有します。寿命とコピーの規則は[ボックス値](boxes.ja.md)を参照してください。

[ソースの入口](../../packages/sfml.js-rmlui/src/index.ts)とエクスポート宣言が契約の基準です。このバインディングは記載された範囲を対象とし、C++ RmlUi API 全体を公開するものではありません。
