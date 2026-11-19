# RmlUi 描画状態

## コールバックテクスチャ {#callback-textures}

`manager.makeCallbackTexture(callback)` は一意の `CallbackTexture` を返します。
`toTexture()` のビューは、寸法取得または描画が初めて GPU データを必要とする時に
同期生成します。`isValid` は読込を行わず資源の同一性を確認します。
`new CallbackTexture()` は空、`invalidHandle()` は `4294967295` です。
`release()` は再呼出し可能で、既存の空でないビューを失効させます。
ビューは元の JS 所有者が回収された後もネイティブ資源を保持し、解放済みの
キャッシュインデックスの再利用によって復活することはありません。
`Decorator.addTexture(view)` もビューと生成関数を保持します。
`getTexture(index)` は有効性の確認と所有権を維持します。

```js
const generated = manager.makeCallbackTexture(api =>
  api.generateTexture(
    new Uint8Array([ 128, 0, 0, 128 ]), { x: 1, y: 1 }));

geometry.render({ x: 20, y: 20 }, generated.toTexture());
generated.release();
```

`CallbackTextureInterface` は生成コールバック中のみ有効です。
`generateTexture(bytes, dimensions)` は非共有の乗算済み RGBA `Uint8Array` または
`Buffer` と正の整数寸法を受け取り、長さは幅 × 高さ × 4 バイトで、ネイティブの
成功結果を返します。`saveLayerAsTexture()` は有効で空でないシザー領域内の
現在のレイヤーを保存します。`getRenderManager()` は元の管理器を返します。
`setTextureHandle(handle, dimensions)` は
`manager.generateTextureHandle(bytes, dimensions)` の所有 `TextureHandle` を
受け取り、同じ管理器と元の寸法を確認して所有権を転送します。
転送後は空となり、`handle.isValid` は所有状態、
`handle.release()` は未転送の資源を解放します。生ポインターの数値は受け付けません。

成功時に一度だけ提出し、同期の真偽値を返します。提出なしの true、Promise、
他の型は例外です。false または例外で生成済みの資源を解放し、失敗は再試行せず
キャッシュします。生成中はこのインターフェースのみネイティブに入れます。
資源の解放、DOM やランタイムの変更、再描画、入れ子の読込を拒否します。
事前計算したバイトと提供されたインターフェースを使用してください。

`new CallbackTextureSource(callback)` は管理器ごとに一意の資源をキャッシュします。
`getTexture(manager)` は遅延ビューを返し、コールバック省略時は空となります。
ソースが回収されてもビューは資源を保持します。未使用管理器の解放でその項目を
消去し、終了時には資源、ソース、トークンを失効させます。
ネイティブの移動構築と代入は JS 参照代入で表し、資源を複製しません。

[コールバックテクスチャ](
../../packages/sfml.js-rmlui/examples/callback-textures.cjs)でバイト生成、
所有ハンドルの転送、シザー領域のレイヤー保存を確認できます。

`context.getRenderManager()` は共有ネイティブ `RenderManager` を返します。
`new RenderManager(getRenderInterface())` は独立した管理器を所有します。
終了すると両方が無効になります。リソースは生成元の管理器に所属します。

`prepareRender({ x, y })` は既定状態と均衡したレイヤースタックで描画を始めます。
`setViewport({ x, y })` はキャッシュしたビューポートを設定し、
`getViewport()` は整数寸法を返します。寸法は非負の符号付き 32 ビット整数です。

`setScissorRegion({ p0, p1 })` は有効な整数矩形をビューポートと交差させます。
`null` または無効な矩形はシザーを無効化します。`getScissorRegion()` は
矩形コピーまたは `null` を返し、`disableScissorRegion()` は明示的に無効化します。

## 保存と復元

```js
const manager = context.getRenderManager();
const saved = manager.getState();

try {
  manager.setScissorRegion({
    p0: { x: 20, y: 20 }, p1: { x: 200, y: 100 },
  });
  const matrix = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 1, 0, 12, 8, 0, 1,
  ]);

  manager.setTransform(matrix);
  geometry.render({ x: 0, y: 0 });
} finally {
  manager.setState(saved);

  for (const mask of saved.clipMaskList) {
    mask.geometry.release();
  }
}
```

`RenderState` は `scissorRegion`、`clipMaskList`、`transform` を持ちます。
行列は有限値の列優先 `Float32Array(16)` です。
通常のジオメトリとマスクは平行移動後に完全な同次 4×4 行列を適用し、
透視補正したテクスチャ補間と −10000～10000 の Z クリップを行います。
独自の頂点プログラムは SFML のアフィン変換規約を維持します。
バッファーは固定で非共有とし、部分ビューにも対応します。`setTransform(null)` は
単位行列を選びます。`resetState()` はシザーとマスクを無効化し、単位行列に戻します。
ビューポートは保持します。

`getState()` はネイティブメッシュと行列をコピーします。元の要素が閉じても
ジオメトリは有効で、元の管理器に所属します。解放または終了で無効になります。
`setState()` は全フィールドを検証後、独立したネイティブコピーを保持します。
設定したコピーの変更・解放は現在の状態を無効化しません。使用後に取得した
ジオメトリを解放してください。不正な入力はキャッシュ状態を変更しません。
引数アクセサーの実行後に管理器の有効性を確認します。

## ジオメトリマスク

SFML ウィンドウは `{ settings: { stencilBits: 8 } }` で生成します。

マスクは設定時の書き込みシザー領域と変換を保持します。現在のシザー変更で
既存マスクは広がりません。重複三角形と 255 を超える交差も論理的な被覆を
維持します。ネイティブの無効化と再有効化は定義を保持しますが、
JS の `disableClipMask()` は Core のマスクリストも消去します。

```js
const { ElementUtilities, ClipMaskOperation } = require('sfml.js-rmlui');
const clipping = ElementUtilities.getClippingRegion(element, true);

manager.setScissorRegion(clipping.region);
manager.setClipMask(clipping.clipMask);

for (const mask of clipping.clipMask) {
  mask.geometry.release();
}

geometry.render({ x: 0, y: 0 });
manager.disableClipMask();

manager.setClipMask(ClipMaskOperation.Set, geometry, { x: 10, y: 20 });
manager.disableClipMask();
```

`setClipMask(masks)` と `setClipMask(operation, geometry, translation)` は
それぞれのネイティブ形式を呼びます。ジオメトリは空でなく同じ管理器に所属する
必要があります。設定時にメッシュと行列をコピーし、無効化・置換・リセット時に
そのネイティブコピーを解放します。

`clipMaskGeometryEquals(a, b)` はネイティブ同一性を比較します。操作と位置は値、
ジオメトリと行列は参照で比較します。`null` 行列同士は同一です。同じ内容でも
別の行列配列は同一ではありません。別のコピーは独立したリソースです。
不一致は `!` で表します。

## レイヤーとフィルターリスト {#render-layers}

```js
const { BlendMode, FilterHandleList } = require('sfml.js-rmlui');
const destination = manager.getTopLayer();
const layer = manager.pushLayer();

try {
  geometry.render({ x: 20, y: 20 });
  const blur = manager.compileFilter('blur', { sigma: 3 });
  const filters = new FilterHandleList();

  blur.addHandleTo(filters);

  try {
    manager.compositeLayers(layer, destination, BlendMode.Blend, filters);
  } finally {
    filters.clear();
    blur.release();
  }
} finally {
  manager.popLayer();
}
```

`pushLayer()` は透明なオフスクリーン描画先を選びます。各呼び出しを
`popLayer()` と対応させ、次の `context.render()` または `prepareRender()`
の前にスタックを均衡させてください。`getTopLayer()` は正規の不透明トークンで、
最初の追加前はレイヤー零です。フレーム内では透明な UI 内容を含み、
フレーム外ではホストウィンドウを表します。`getNextLayer()` は一つ下の層を返し、
空スタックでは例外になります。この API で追加した層だけを解放できます。
同じ描画器の別管理器で有効な描画先を交互に使うことはできません。

`compositeLayers(source, destination, blendMode, filters?)` は同じ管理器の
有効なトークンを受け取ります。ソースと描画先の両方にレイヤー零を指定できます。
`BlendMode.Blend` は乗算済みアルファで上に合成し、`BlendMode.Replace` は
有効なクリップ領域のピクセルを置換します。自己合成は入力をコピーします。
プール再利用後も解放済みトークンは無効です。リストは挿入順に適用し、
ラッパー回収後もリソースを保持します。解放済み・別管理器のフィルターは合成前に
例外になります。`clear()` はリストの所有権を解放します。

`saveLayerAsMaskImage()` は有効なシザー領域のアルファを `CompiledFilter`
に保存します。`FilterHandleList` に追加すると、元のビューポート位置で
後続ピクセルにマスクのアルファを乗算します。元の層を解放してもコピーは有効です。
レイヤー零もマスク元に使えます。領域が無効なら無効なフィルターです。使用後に解放してください。

装飾器の描画コールバックは状態とレイヤーの取得・設定に対応します。
イベントコールバックは取得だけに対応します。シェーダーとプラットフォーム描画の
受け入れは別途必要です。
呼び出し元の層は解放できません。均衡しない層を残して返すとエラーを報告し、
ネイティブ描画を続ける前にその層を解放します。元のコールバック例外は保持します。
[要素インスペクター](../../packages/sfml.js-rmlui/examples/element-utilities.cjs)
でネイティブマスク、行列設定、状態復元を確認できます。
[レイヤー合成](../../packages/sfml.js-rmlui/examples/render-layers.cjs)は
入れ子の合成、自己合成ぼかし、アルファマスクを表示します。Space で移動、
Escape で終了します。
