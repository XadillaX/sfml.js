# RmlUi 要素ユーティリティ

`ElementUtilities` は `Rml::ElementUtilities` の全静的操作を公開します。
計算フォント、配置、クリップを取得する前にコンテキストを更新します。
変換を変更した後は一度描画し、累積変換状態を更新してください。

```js
const { ElementUtilities: utilities, BoxArea, PositionAnchor } =
  require('sfml.js-rmlui');
const panel = utilities.getElementById(document, 'panel');
const width = utilities.getStringWidth(panel, 'AV');
const bounds = utilities.getBoundingBox(panel, BoxArea.Auto);
const box = utilities.buildBox({ x: 640, y: 480 }, panel);

utilities.positionElement(panel, { x: 12, y: 12 }, PositionAnchor.BottomRight);
```

`getElementById(root, id)` はルートを含めて幅優先で検索します。
タグとクラスの検索はルートを除き、有効なラッパー配列を返します。
`getElementsByTagName(root, tag, stopTag)` の任意の `stopTag` は
そのノードの子孫への検索を止めます。停止ノード自体は一致可能です。
ラッパーの同一性を保持します。配列はコピーですが、含まれるラッパーは
ネイティブ要素の破棄で無効になります。

`getDensityIndependentPixelRatio(element)` はコンテキストの密度比、
コンテキストがない場合は 1 を返します。
`getStringWidth(element, text, priorCharacter = 0)` はネイティブフォントと
整形設定で UTF-8 テキストを測定します。先行文字はカーニング用の
Unicode スカラーコードポイントです。結果は整数ピクセル幅で、
ネイティブフォントがない場合はゼロです。

`getBoundingBox(element, area)` は `BoxArea` が必須で、
`{ p0: { x, y }, p1: { x, y } }` を返します。
ネイティブ投影失敗時は `null`。`Auto` は上流と同じくボーダーボックスと
外側 box-shadow のはみ出しを含み、フィルターのはみ出しは含みません。

## クリップのコピー

```js
const clipping = utilities.getClippingRegion(panel, true, false);

console.log(clipping.region, clipping.clipMask.length);

for (const mask of clipping.clipMask) {
  console.log(mask.operation, mask.absoluteOffset, mask.transform);
  const mesh = mask.geometry.getMesh();

  console.log(mesh.indices.length);
  mask.geometry.release();
}
```

`getClippingRegion(element, includeClipMask = false, forceClipSelf = false)`
は両方のネイティブ出力を返します。`region` は整数シザー矩形または `null`。
変換マスクは `region` が `null` でも存在できます。
`forceClipSelf` は対象のボーダー領域を含めます。マスクジオメトリを
要求する要素はコンテキストに接続している必要があります。

各マスクは `ClipMaskOperation`、独立所有の `Geometry`、丸めた
`absoluteOffset`、列優先のコピー `Float32Array(16)` 変換を持ちます。
`null` 変換は単位変換です。取得した行列やメッシュの変更は元の要素に
影響しません。文書を閉じたりラッパーを回収した後もジオメトリは有効です。
明示解放、ランタイム終了、描画管理器の解放で無効になります。
使用後にコピーを解放してください。

`setClippingRegion(element, forceClipSelf = false)` はクリップを
描画管理器に送信し、ネイティブ可視性を返します。
`applyTransform(element)` は累積変換を送信します。
コンテキストがない場合は両方とも `false`。
ジオメトリマスクにはウィンドウの `stencilBits: 8` が必要です。

## 配置とデータビュー

`buildBox(containingBlock, element, inlineElement = false)` は要素に設定せず
独立した `Box` を返します。インラインサイズは未解決の自動サイズも
含めて上流の規則を使います。
`formatElement(element, containingBlock)` はネイティブ配置エンジンを実行し、
独自の非 DOM 内容に使用できます。切り離す前に DOM でスタイルを計算します。
配置は未更新のスタイルを計算しません。包含サイズは有限・非負が必須です。

`positionElement(element, offset, anchor)` はボックスを作成・設定し、
親の内容領域で相対長を解決して辺や隅から配置します。
CSS 配置プロパティも最終オフセットに影響します。
8 個の `PositionAnchor` はネイティブビット値を保持します。
親がない場合は `false`。オフセットは有限値が必須です。

`applyDataViewsControllers(element)` はネイティブ操作で `data-*` 属性から
ビューとコントローラーを作成します。モデルや適用バインディングが
なければ `false`、ビューかコントローラーの初期化に成功すると `true` です。
接続済み要素に属性を設定した後、これを呼んで構築し、モデルかコンテキストを
更新します。値ビューとコントローラーは入力値を同期し、モデルイベントを
実行します。モデル削除で登録と要素の接続が解除されます。再呼出しは構築操作で、
冪等なバインディング更新ではありません。

全操作は破棄された要素を拒否します。配置、データ作成、描画状態の送信は
上流呼び出し前に危険なコールバック再入を拒否します。
引数 getter の終了後にネイティブ対象の有効性を確認します。

[要素インスペクター](../../packages/sfml.js-rmlui/examples/element-utilities.cjs)
で配置、投影境界、テキスト幅、クリップのコピーを確認できます。
