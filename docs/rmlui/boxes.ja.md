# ボックス値と描画ボックス

`Box` は独立したネイティブ `Rml::Box` を所有します。ランタイム初期化は不要です。

```js
const { Box, BoxArea, BoxEdge } = require('sfml.js-rmlui');

const box = new Box({ x: 80, y: 50 });

box.setEdge(BoxArea.Padding, BoxEdge.Top, 7);
box.content[0] = 100;
box.edges[BoxArea.Margin * Box.numEdges + BoxEdge.Left] = -4;
```

`content` は x/y 内容サイズの書き込み可能な `Float32Array` です。
`edges` は 12 個のネイティブ値を直接参照します。
Margin、Border、Padding の各組は上、右、下、左の順です。
`Box.numAreas` は内容を除く 3、`Box.numEdges` は 4 です。
ビューは独立値のみを保持し、ラッパーの GC、要素の破棄、終了、再初期化後も使用できます。
Node worker でも独立値を作成できます。

`getSize()` は内容サイズ、`getSize(area)` は指定領域と内側のサイズを返します。
`getPosition(area = BoxArea.Content)` はボーダー左上を基準とし、マージン位置は負になり得ます。
`getEdge(area, edge)` と `setEdge(area, edge, size)` は Margin、Border、Padding のみを受け付けます。
`getCumulativeEdge(area, edge)` は Margin から内側へ合計します。Content は Padding までを含みます。

`getSizeAcross(direction, area, areaEnd = BoxArea.Content)` は両端を含みます。
外側領域は内側領域より前に指定し、方向は `BoxDirection.Vertical` または `Horizontal` です。
`getFrameSize(area)` は内側を除きますが、Content では内容サイズを返します。Auto は無効です。

`setContent(size)` と `setEdge(...)` はビューと同じネイティブフィールドを更新します。
位置・サイズ取得は独立した `{ x, y }` コピーを返します。`clone()` はボックスをコピーします。
`equals()` と `notEquals()` はネイティブ演算子を使います。Box の辺はバイト比較のため、正負のゼロも区別します。

## 要素のレイアウトボックス

`context.update()` 後の `element.getBox()` はメインボックスのコピーを返します。
`getBox(index)` は `{ box, offset }` を返し、オフセットはメインボックスを基準とします。
範囲外ではメインとゼロオフセットを返します。
上流が範囲確認前に 1 を引くため、符号付きオーバーフローを起こす INT32_MIN は拒否します。

`setBox(box)` は値をコピーして追加ボックスを消去し、
`addBox(box, offset)` は追加ボックスと位置をコピーします。入力値の後の変更は要素へ影響しません。
`getNumBoxes()` はメインと追加ボックスを数えます。
手動設定は、後続のネイティブレイアウトで上書きされる場合があります。

## 描画ボックス

`getRenderBox(fillArea = BoxArea.Padding, index = 0)` は独立した `RenderBox` を返します。
領域は Border、Padding、Content のみで、添字は `getBox(index)` と同じ範囲外動作です。
追加ボックスの位置やメインパディング領域のサイズにはネイティブの丸めを適用します。

`new RenderBox(fillSize, borderOffset, borderWidths, borderRadius)` でも構築できます。
幅 `EdgeSizes` は上・右・下・左、半径 `CornerSizes` は左上・右上・右下・左下の 4 要素です。
`fillSize`、`borderOffset`、`borderWidths`、`borderRadius` は書き込み可能な共有 `Float32Array` です。
`get...()` はコピーを返し、`set...()` は同じネイティブフィールドを更新します。
`getFillOffset()` は `{ x: 左ボーダー幅, y: 上ボーダー幅 }` を返します。
`clone()`、`equals()`、`notEquals()` はネイティブ値で動作します。
RenderBox の等価比較は数値比較であり、Box の辺のバイト比較とは異なります。

有限の浮動小数点数を使用してください。setter は全引数を検証した後に書き込みます。
共有ビューへ書いた非有限値は、取得と要素への適用時に拒否します。
入力の getter が例外を投げても部分的な setter 書き込みは行いません。
要素は引数 getter の実行後に検証するため、getter による要素破棄は無効ハンドルの例外になります。

座標と投影は[レイアウト](layout.ja.md)を参照してください。
