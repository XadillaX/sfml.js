# ネイティブジオメトリと畳み込み

`MeshUtilities` は上流の四角形、線、背景、境界ジオメトリを Native 所有の
`Mesh` に追加します。`ConvolutionFilter` はバイトビュー上で上流のアルファ
フィルターを実行します。値ユーティリティは初期化前や終了後も使えます。
描画可能な `Geometry` の作成には有効な描画マネージャーが必要です。

## メッシュ生成

```js
const { Mesh, MeshUtilities, RenderBox } = require('sfml.js-rmlui');
const mesh = new Mesh();
const colour = { red: 60, green: 30, blue: 10, alpha: 120 };

MeshUtilities.generateQuad(mesh, { x: 2, y: 3 }, { x: 4, y: 5 }, colour);
MeshUtilities.generateLine(mesh, { x: 0.4, y: 0.6 }, { x: 2.4, y: 1.6 }, colour);
const box = new RenderBox(
  { x: 30, y: 20 }, { x: 2, y: 3 }, [ 1, 2, 3, 4 ], [ 15, 9, 7, 5 ]);

MeshUtilities.generateBackgroundBorder(
  mesh, box, colour, [ colour, colour, colour, colour ]);
```

色はアルファ乗算済みの RGBA バイトで、自動乗算は行いません。
`generateQuad` の UV は既定で `(0,0)` と `(1,1)` です。末尾の二引数で
変更できます。`generateLine` は両端をピクセルグリッドに合わせます。
背景は `RenderBox` の幅、オフセット、角半径を使い、アルファゼロの背景や
境界は省略します。

追加するインデックスには既存頂点のオフセットが入ります。既存の頂点・
インデックスビューが古い領域を保持している場合、Native は先頭部分を一度だけ
コピーします。ビューがなければメッシュを再利用し、容量を幾何級数的に
増やします。追加後は新しいビューを取得してください。
`RenderManager.makeGeometry(mesh)` はメッシュを検証し、コピーを保持します。

## 共有コマンドバッチ

```js
const commands = MeshUtilities.allocateCommands(2);

commands.set([ 0, 2, 3, 4, 5, 60, 30, 10, 120, 0, 0, 1, 1 ]);
commands.set([ 1, 0.4, 0.6, 2.4, 1.6, 60, 30, 10, 120 ],
  MeshUtilities.commandStride);
const batched = new Mesh();

MeshUtilities.append(batched, commands);
```

結果は直接書き込める Native 所有の `Float32Array` です。一括送信では
Native を一度だけ呼び、選択された全レコードを検証してからジオメトリを生成します。
コマンド領域のコピーはありません。`append(mesh, commands, count)` は先頭の
指定件数を実行し、`count` を省略すると全件を実行します。

各レコードは `commandStride` フィールド、現在は 40 個です。

| フィールド 0 の操作 | 配置 |
| --- | --- |
| 四角形: 0 | 1–4: x/y/幅/高さ、5–8: RGBA、9–12: u0/v0/u1/v1 |
| 線: 1 | 1–4: x/y/幅/高さ、5–8: RGBA |
| 背景: 2 | 1–2: 塗りサイズ、3–4: 境界オフセット、5–8: 幅、9–12: 半径、13–16: RGBA |
| 背景と境界: 3 | 背景の配置に加え、17–32: 上/右/下/左の RGBA |

幅と半径は `RenderBox` 順です。予約領域は無視します。座標は有限、色は整数
バイト、塗りサイズ・幅・半径は非負でなければなりません。切り離された
バッファーや並行共有領域を持つバッファーは拒否します。

## アルファ畳み込み

```js
const { ConvolutionFilter, FilterOperation, ColorFormat } =
  require('sfml.js-rmlui');
const filter = new ConvolutionFilter();

filter.initialise({ x: 1, y: 0 }, FilterOperation.Sum);
filter.kernel.set([ 0.25, 0.5, 0.25 ]);
const source = ConvolutionFilter.allocateBytes(3);

source.set([ 40, 80, 120 ]);
const output = ConvolutionFilter.allocateBytes(3);

filter.run(output, { x: 3, y: 1 }, 3, ColorFormat.A8,
  source, { x: 3, y: 1 }, { x: 0, y: 0 }, ColorFormat.A8);
console.log(Array.from(output)); // [40, 80, 80]
```

`initialise(radius, operation)` は正方形、x/y 半径は長方形のカーネルを作ります。
負の半径は `false` を返し、以前のカーネルを保持します。不正な列挙値や領域上限は
例外です。`getRow(index)` は検証済みの共有行を取得します。再初期化は領域を
置き換えますが、既存の行・カーネルビューは古い領域を保持し、回収や終了後も有効です。

`run` は Native を一度だけ呼びます。ソース行は密に配置し、出力ストライドは
バイト単位です。アルファのみを変更し、RGB と行の余白は保持します。
ソースオフセットは出力原点に対する位置です。バッファーは有効で重ならず、
並行共有領域を持たないバイトビューを使ってください。初期化済みカーネルの
重みは有限かつ安全な範囲である必要があります。`Sum` は 255 を超える値を
飽和させます。負の Sum 重みは Native の事前検証を要し、負の出力アルファが
あれば書き込み前に例外になります。`Dilation` は最大の重み付きアルファを選び、
最小値はゼロです。

値型と資源の寿命は [API ガイド](api.ja.md) を参照してください。
