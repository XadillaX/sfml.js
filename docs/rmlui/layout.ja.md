# 要素のレイアウト、スクロール、投影

スタイルや文書を変更したら `context.update()` 後にレイアウトを取得します。
RmlUi の既定の `display` は `div` でも `inline` です。
ブロック配置には `display: block` を明示してください。

`absoluteLeft`、`absoluteTop` はコンテキスト内のボーダー左上座標です。
`offsetLeft`、`offsetTop` は `offsetParent` に対する距離です。
親ラッパーは同一性を保持します。`offsetWidth`、`offsetHeight` は
パディングとボーダーを含み、マージンを除きます。`clientLeft`、`clientTop`
はボーダー幅、`clientWidth`、`clientHeight` はパディングを含み
スクロールバーを除くサイズです。

`getRelativeOffset(area = BoxArea.Content)`、
`getAbsoluteOffset(area = BoxArea.Content)` は独立した `{ x, y }` を返します。
`BoxArea.Margin`、`Border`、`Padding`、`Content` で領域を選びます。
`Auto` は `clipArea` 専用で、オフセット取得には使えません。
`getContainingBlock()` は包含ブロックのサイズをコピーします。

`getPosition()`、`getFloat()`、`getDisplay()` はネイティブ計算済みスタイルの
`StylePosition`、`StyleFloat`、`StyleDisplay` を返します。
`getLineHeight()` はピクセル単位です。`baseline` は下マージン端から上向きの距離、
`zIndex` はネイティブの重なり順です。`isReplaced()` は自身を描画する要素を識別します。

```js
const {
  BoxArea, ScrollAlignment, ScrollBehavior, ScrollParentage,
} = require('sfml.js-rmlui');

context.update();
const border = element.getAbsoluteOffset(BoxArea.Border);

element.scrollIntoView({
  vertical: ScrollAlignment.Center,
  horizontal: ScrollAlignment.Nearest,
  behavior: ScrollBehavior.Instant,
  parentage: ScrollParentage.Closest,
});
```

`scrollLeft`、`scrollTop` は書き込み可能です。ネイティブの丸めと範囲制限を適用し、
変更時は `scroll` を同期送信します。`scrollWidth`、`scrollHeight` は
パディングを含むスクロール可能領域です。
`scrollTo(offset, behavior = ScrollBehavior.Instant)` は両軸を更新します。
`Smooth` では `context.update()` を継続し、`Auto` は
`context.setDefaultScrollBehavior(...)` の設定に従います。

`element.getElementScroll()` は同一性を維持する借用ネイティブコンポーネントです。
`new ElementScroll(element)` はカスタムウィジェット用の独立所有コンポーネントを
作成します。`ScrollOrientation.VERTICAL` は `0`、`HORIZONTAL` は `1` です。
両方で `update()`、`enableScrollbar(direction, elementWidth)`、
`disableScrollbar(direction)`、`updateScrollbar(direction)`、
`getScrollbar(direction)`、`getScrollbarSize(direction)`、
`formatScrollbars()`、`updateProperties()` を使えます。幅は有限かつ非負です。
未作成のバーは null、無効なバーのサイズはゼロです。

所有コンポーネントは `release()` でリスナーを解除できます。借用ビューでは拒否します。
元のデストラクターと同様に、ホストの非 DOM 子要素は残ります。ホスト破棄で両方無効に
なります。所有コンポーネントは分離ホストとコールバックを保持し、解放、ネイティブ破棄、
終了で参照を解除します。GC の解放は最外側のネイティブ処理の終了後です。
矢印によるネイティブ入力は overflow が `auto` または `scroll` の軸だけを動かします。

`scrollIntoView(true)` は開始端、`false` は終了端に垂直配置します。
オプションの既定値は vertical `Start`、horizontal `Nearest`、
behavior `Instant`、parentage `All` です。`Adaptive` は表示中なら位置を維持し、
それ以外は中央へ移動します。`Closest` は直近のスクロールコンテナのみを対象とします。
`All` でも滑らかに移動できる祖先は一つだけで、残りは即座に移動します。

`setScrollableOverflowRectangle(size, clampScrollOffset)` はオーバーフローの
サイズを設定します。最終サイズが確定した時に clamp を有効にしてください。
座標は有限のネイティブ float、サイズは非負です。不正値は変更前に拒否します。

`isVisible(true)` は祖先の可視性も検査します。引数を省くと要素のみです。
`isPointWithinElement(point)` は要素平面上のボーダー領域を検査します。
変換された画面座標は先に `project(point)` へ渡し、`{ success, point }` を確認します。
入力は変更されず、特異変換は失敗します。行列は `context.render()` 時に更新されるため、
変換変更後は描画してから投影を取得します。

切り離したツリーは旧文書へのオフセット親参照とその基点をリセットします。
ツリー内部の参照は保持し、再挿入後の更新で新しい配置を確定します。
これにより破棄済み文書の参照を防ぎます。数値コピーは GC や終了後も読めますが、
破棄済み要素への操作は例外になります。スクロールコールバックにも実行中ツリーの保護が適用されます。

構築と数値ビューは[ボックス値](boxes.ja.md)を参照してください。
型付きプロパティ、計算済み値、アニメーションには個別のガイドがあります。

`setOffset(offset, offsetParent, offsetFixed = false)` は配置の基準を書き込みます。
親は自身を除く祖先または null とし、所有ツリー内の参照と循環防止を保証します。
座標は有限値です。固定オフセットは祖先のスクロールを無視し、
ネイティブの `position: fixed` も同じ動作を含みます。position 規則は維持され、
後の配置更新で手動の基準が置換される場合があります。切り離しでは木の外への
オフセット親参照を解除し、破棄済みツリーへの参照を防ぎます。
