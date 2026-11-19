# 动画与缓动

`Element.animate(nameOrId, target, duration, tween?, iterations?, alternate?,
delay?, start?)` 启动或替换动画。`target` 和 `start` 使用 `Property`，
由原生关键帧保存副本。持续时间和延迟以秒为单位。默认值与 RmlUi 一致：
Linear/Out 缓动、一次迭代、启用交替方向、零延迟，以当前属性值为起点。
迭代次数 `-1` 表示无限重复。

```js
const { Property, PropertyId, Unit, Tween, TweenType, TweenDirection } =
  require('sfml.js-rmlui');

element.animate('width', new Property(180, Unit.PX), 0.4,
  new Tween(TweenType.Cubic, TweenDirection.Out));
element.addAnimationKey(PropertyId.Width, new Property(100, Unit.PX), 0.2);
```

`addAnimationKey` 为已有动画追加指定时长的关键帧。两个方法均返回上游
布尔值；没有已有动画时追加关键帧返回 `false`，不支持的属性类型也返回
`false`。`context.update()` 推进动画并派发 `animationend`。
RmlUi 单次时间步长最多 100 毫秒，每次更新最多推进一次迭代；
长时间暂停后仍需要持续更新。

`Tween` 提供全部原生缓动类型和方向，以及 `evaluate(t)`、`reverse()`、
`clone()`、`equals()`、`notEquals()` 和 `toString()`。求值输入必须是
`[0, 1]` 内的有限数；曲线输出允许超出此范围。双类型构造使用对象区分
第二个类型和方向参数：

```js
const mixed = new Tween(TweenType.Quadratic, { out: TweenType.Cubic });
const custom = new Tween(t => t * t); // 回调方向默认为 In。

console.log(mixed.evaluate(0.25), custom.evaluate(0.5));
```

回调必须同步返回有限数，原生输入输出均为 float32。回调异常在原生处理
退出后传播到发起调用的 JS 层。求值期间禁止调用运行时和 DOM 接口，
允许嵌套求值其他 Tween。内置 Tween 不依赖运行时生命周期；回调 Tween
要求已初始化运行时，并在 RmlUi 关闭后失效。

动画副本保留回调身份并在需要时保活回调；替换或完成动画会释放对应保活。
脱离 DOM 的树使用 V8 可见引用，允许回收闭包循环。包内依赖准备流程
对 RmlUi 6.3 应用经过锚点校验的回调所有权扩展，保留原始函数指针重载。

## CSS 动画值

`makeAnimation(fields?)`、`makeTransition(fields?)` 和
`makeTransitionList(fields?)` 构造原生值副本。数值按原生 float32 或整数
保存，标志使用布尔值，名称保留 UTF-8。`Animation` 默认时长和延迟为 `0`、
Linear/Out、`alternate=false`、`paused=false`、`numIterations=1`，
名称为空。`Transition` 默认编号为 `PropertyId.Invalid`、Linear/Out、
时长和延迟为 `0`、`reverseAdjustmentFactor=0`。`TransitionList`
默认 `none=true`、`all=false`、条目为空；提供条目不会自动改变标志。

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

CSS 过渡由样式规则变化触发，例如切换类名；直接设置行内 width 不会启动
原生 CSS 过渡。动画名称对应元素样式表中的 `@keyframes`。
`none=false` 且 `all=true` 时必须至少有一个过渡；空列表作为样式设置时
会在进入原生索引操作前抛错。

Property 原始值、属性模板转换、元素 attribute 和事件参数都支持这两种
带标记的列表，并返回可调用的 `Tween`。列表与 Tween 按值复制，修改返回值
不会修改原生存储。`Property.get(exemplar)` 转换失败时返回默认构造的列表；
attribute 和事件的默认参数则保留传入的回退值。
`animationEquals`、`transitionEquals`、`transitionListEquals`
比较全部原生字段和回调身份，取反对应原生 `!=`。

Property 包装器和返回快照通过 GC 可见引用保活回调。已挂载元素的样式、
attribute 和正在运行的关键帧独立保活回调；克隆元素绑定自己的所有权。
删除值后，最后一个原生副本释放时解除保活。脱离文档的树及
Property／闭包循环均可回收。回调列表遵守前述 Tween 的运行时、
异常传播和重入规则。
