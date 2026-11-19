# アニメーションとイージング

`Element.animate(nameOrId, target, duration, tween?, iterations?, alternate?,
delay?, start?)` はアニメーションを開始・置換します。`target` と `start`
は `Property` で、ネイティブのキーにコピーされます。時間の単位は秒です。
既定値は RmlUi と同じく Linear/Out、反復 1 回、方向の交替あり、遅延ゼロ、
開始値は現在のプロパティです。反復回数 `-1` は無限反復です。

```js
const { Property, PropertyId, Unit, Tween, TweenType, TweenDirection } =
  require('sfml.js-rmlui');

element.animate('width', new Property(180, Unit.PX), 0.4,
  new Tween(TweenType.Cubic, TweenDirection.Out));
element.addAnimationKey(PropertyId.Width, new Property(100, Unit.PX), 0.2);
```

`addAnimationKey` は既存アニメーションに指定時間のキーを追加します。
両メソッドはネイティブの真偽値を返します。アニメーションがない場合や
非対応のプロパティ型は `false` です。`context.update()` が進行と
`animationend` の通知を行います。時間刻みの上限は 100 ミリ秒で、
更新ごとに進める反復は最大 1 回です。長い停止後も更新を続けてください。

`Tween` は全種別・方向と `evaluate(t)`、`reverse()`、`clone()`、
`equals()`、`notEquals()`、`toString()` を提供します。入力は `[0, 1]` の
有限値、出力はオーバーシュート可能です。2 種別の構築では方向との
曖昧さを避けるため、2 番目の種別をオブジェクトで指定します。

```js
const mixed = new Tween(TweenType.Quadratic, { out: TweenType.Cubic });
const custom = new Tween(t => t * t); // コールバックの既定方向は In。

console.log(mixed.evaluate(0.25), custom.evaluate(0.5));
```

コールバックは同期的に有限の数値を返します。入出力はネイティブ float32
です。例外はネイティブ処理が終了した後に JS 呼び出し元へ伝播します。
評価中のランタイム・DOM 操作は禁止ですが、別の Tween の入れ子評価は
可能です。組み込み Tween はランタイム外でも使用でき、コールバック Tween
は初期化が必要で、終了時に無効になります。

アニメーションのコピーはコールバック同一性を保持します。置換・完了時に
保持を解放します。切り離されたツリーの循環参照は V8 が回収できます。
依存関係準備時に RmlUi 6.3 へ検証済みの所有権拡張を適用し、元の
関数ポインターのオーバーロードも維持します。

## CSS モーション値

`makeAnimation(fields?)`、`makeTransition(fields?)`、
`makeTransitionList(fields?)` はネイティブ値のコピーを構築します。
数値は float32 または整数、フラグは boolean、名前は UTF-8 です。
Animation の既定値は duration/delay が `0`、Linear/Out、
`alternate=false`、`paused=false`、`numIterations=1`、空の名前です。
Transition は `PropertyId.Invalid`、Linear/Out、duration/delay が `0`、
`reverseAdjustmentFactor=0` です。TransitionList は `none=true`、
`all=false`、空の項目が既定で、項目の指定だけではフラグは変わりません。

```js
const {
  makeAnimation, makeTransition, makeTransitionList,
} = require('sfml.js-rmlui');
const transitions = makeTransitionList({
  none: false,
  transitions: [makeTransition({
    id: PropertyId.Width, duration: 0.3,
    tween: new Tween(t => t * t), reverseAdjustmentFactor: 1,
  })],
});

element.setProperty(PropertyId.Transition,
  new Property(transitions, Unit.TRANSITION));
element.setProperty(PropertyId.Animation, new Property({
  type: 'animationlist',
  animations: [makeAnimation({ name: 'pulse', duration: 1 })],
}, Unit.ANIMATION));
```

CSS 遷移はクラス変更などによるスタイル規則の変化で開始します。
インライン width の直接設定は遷移を開始しません。名前はスタイルシートの
`@keyframes` を参照します。`none=false` かつ `all=true` のスタイルには
最初の項目が必要で、空の場合はネイティブ処理の前に例外になります。

Property、型付き変換、属性、イベントは両方のタグ付き一覧に対応し、
実際の Tween ファサードを返します。項目と Tween はコピーされます。
`Property.get(exemplar)` の変換失敗は既定構築の一覧を返します。
属性とイベントは指定したフォールバックを保持します。
`animationEquals`、`transitionEquals`、`transitionListEquals` は全フィールドと
コールバック同一性を比較し、否定はネイティブ `!=` に対応します。

Property とスナップショットは GC に見える参照でコールバックを保持します。
接続された要素のスタイル、属性、実行中のキーは独立した保持権を持ち、
クローンは自分の要素に再接続します。最後のネイティブコピーの解放で保持を
解除します。切り離したツリーと Property／クロージャの循環は回収可能です。
Tween と同じランタイム、例外伝播、再入制限が適用されます。
