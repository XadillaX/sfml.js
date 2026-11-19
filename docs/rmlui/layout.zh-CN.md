# 元素布局、滚动与投影

修改样式或文档后，先调用 `context.update()` 再读取布局。RmlUi 的默认
`display` 是 `inline`，`div` 也一样；需要块布局时应显式设置 `display: block`。

`absoluteLeft`、`absoluteTop` 是边框左上角的上下文像素坐标。
`offsetLeft`、`offsetTop` 相对 `offsetParent`，返回的父元素包装器保持身份一致。
`offsetWidth`、`offsetHeight` 包含边框和内边距，不含外边距。
`clientLeft`、`clientTop` 是边框宽度；`clientWidth`、`clientHeight`
包含内边距，但不含滚动条。

`getRelativeOffset(area = BoxArea.Content)`、
`getAbsoluteOffset(area = BoxArea.Content)` 返回独立的 `{ x, y }` 快照。
`BoxArea.Margin`、`Border`、`Padding`、`Content` 选择测量区域。
`Auto` 可用于 `clipArea`，不能用于偏移查询。
`getContainingBlock()` 返回包含块尺寸的快照。

`getPosition()`、`getFloat()`、`getDisplay()` 分别返回原生计算样式的
`StylePosition`、`StyleFloat`、`StyleDisplay` 枚举。
`getLineHeight()` 返回计算后的像素行高。`baseline` 从下外边距边缘向上测量，
`zIndex` 读取原生层叠值。`isReplaced()` 判断元素是否自行渲染。

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

`scrollLeft`、`scrollTop` 可写。原生 setter 会取整、限制范围，并在偏移变化时
同步派发 `scroll`。`scrollWidth`、`scrollHeight` 包含可滚动内容和内边距。
`scrollTo(offset, behavior = ScrollBehavior.Instant)` 保留原生双轴行为。
`Smooth` 随持续调用 `context.update()` 推进；
`Auto` 使用 `context.setDefaultScrollBehavior(...)` 指定的行为。

`element.getElementScroll()` 返回身份稳定的借用原生滚动条组件。
`new ElementScroll(element)` 为自定义原生控件创建独立持有的组件。
`ScrollOrientation.VERTICAL` 为 `0`，`HORIZONTAL` 为 `1`。
两种形式均提供 `update()`、`enableScrollbar(direction, elementWidth)`、
`disableScrollbar(direction)`、`updateScrollbar(direction)`、
`getScrollbar(direction)`、`getScrollbarSize(direction)`、
`formatScrollbars()` 和 `updateProperties()`。宽度必须有限且非负。
尚未创建的滚动条返回 null；禁用滚动条的尺寸为零。

独立组件可调用 `release()`，借用组件禁止释放。释放解绑控件监听器，
但保留宿主持有的非 DOM 滚动条子元素，与原生析构一致。宿主销毁后两种组件均失效。
独立组件会保活分离宿主及其回调引用，释放、原生销毁和运行时关闭会清除这些引用。
GC 清理在最外层原生调用退出后执行。原生箭头输入仅滚动 overflow 为
`auto` 或 `scroll` 的轴。

`scrollIntoView(true)`、`scrollIntoView(false)` 调用原生布尔重载，分别垂直对齐
起始端或末尾。选项重载默认值为：vertical `Start`、horizontal `Nearest`、
behavior `Instant`、parentage `All`。`Adaptive` 在已可见时保持位置，
否则居中。`Closest` 仅考虑最近的滚动容器。
使用 `All` 时只有一个祖先容器平滑滚动，其余立即移动，遵循 RmlUi 6.3。

`setScrollableOverflowRectangle(size, clampScrollOffset)` 设置原生溢出尺寸；
最终尺寸确定后再开启 clamp。坐标必须是原生 float 范围内的有限数，
溢出尺寸不得为负。非法值和枚举在修改前抛出异常。

`isVisible()` 检查元素，`isVisible(true)` 同时检查祖先。
`isPointWithinElement(point)` 在元素平面上检查边框区域。
屏幕坐标受变换影响时，先调用 `project(point)`，检查返回的 `{ success, point }`。
该方法不修改传入坐标，奇异变换会失败。原生矩阵在 `context.render()` 时刷新，
所以修改变换后应先渲染，再查询投影。

脱离的子树会清除指向旧文档的 offset parent，并重置对应的原生偏移基点；
子树内部的偏移父子关系保留。重新插入并更新后会建立新布局。
这保证脱离的元素不会访问已销毁的文档。数值快照可在包装器回收和运行时关闭后读取；
元素销毁后的实时操作会抛出异常。滚动回调受现有活动子树保护约束。

盒模型构造、渲染盒和共享数值视图见[盒值](boxes.zh-CN.md)。
带类型的样式属性、完整计算样式和动画分别见对应指南。

`setOffset(offset, offsetParent, offsetFixed = false)` 写入原生布局基准。
偏移父节点必须是严格祖先或 null，保证原生指针处于同一所有权树中，并避免偏移循环。
坐标必须有限。固定偏移忽略祖先滚动，原生 `position: fixed` 也隐含该行为。
原生 position 规则仍然有效；后续布局更新可能覆盖手动设置的基准。
脱离节点时会清除指向树外的偏移父节点，避免访问已销毁的树。
