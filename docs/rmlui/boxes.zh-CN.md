# 盒值与渲染盒

`Box` 独立持有原生 `Rml::Box`，无需初始化运行时：

```js
const { Box, BoxArea, BoxEdge } = require('sfml.js-rmlui');

const box = new Box({ x: 80, y: 50 });

box.setEdge(BoxArea.Padding, BoxEdge.Top, 7);
box.content[0] = 100;
box.edges[BoxArea.Margin * Box.numEdges + BoxEdge.Left] = -4;
```

`content` 是映射内容 x/y 尺寸的可写 `Float32Array`。
`edges` 映射 12 个原生浮点数：Margin、Border、Padding，每组按上、右、下、左排列。
`Box.numAreas` 为 3，不包含内容；`Box.numEdges` 为 4。
视图只保活独立数值，在包装器回收、元素销毁、运行时关闭和重新初始化后仍可使用。
Node worker 也能创建独立盒值。

`getSize()` 读取内容尺寸；`getSize(area)` 包含指定区域及其所有内层区域。
`getPosition(area = BoxArea.Content)` 以边框左上角为原点，外边距位置可以为负。
`getEdge(area, edge)` 和 `setEdge(area, edge, size)` 只接受 Margin、Border、Padding。
`getCumulativeEdge(area, edge)` 从 Margin 向内累加，Content 累加到 Padding。

`getSizeAcross(direction, area, areaEnd = BoxArea.Content)` 包含起止区域，
外层必须排在内层之前；方向为 `BoxDirection.Vertical` 或 `Horizontal`。
`getFrameSize(area)` 不包含内层区域，Content 则返回内容尺寸。Auto 不能作为具体盒区域。

`setContent(size)` 和 `setEdge(...)` 修改与共享视图相同的原生字段。
尺寸和位置查询返回独立 `{ x, y }` 快照；`clone()` 复制盒。
`equals(other)` 和 `notEquals(other)` 保留原生比较语义：
Box 的边尺寸按字节比较，因此边上的正零和负零不同。

## 元素布局盒

调用 `context.update()` 后，`element.getBox()` 返回主盒副本。
`element.getBox(index)` 返回 `{ box, offset }`，偏移相对主盒。
索引越界时返回主盒及零偏移，与 RmlUi 6.3 一致。
INT32_MIN 会被拒绝，因为上游在范围检查前减一会造成有符号溢出。

`element.setBox(box)` 复制盒并清除附加盒；
`element.addBox(box, offset)` 复制附加盒与偏移。
之后修改传入的盒不会影响元素。`getNumBoxes()` 统计主盒及附加盒。
这些属于手动布局操作，后续原生布局更新可能覆盖结果。

## 渲染盒

`element.getRenderBox(fillArea = BoxArea.Padding, index = 0)` 返回独立 `RenderBox`。
填充区域只能是 Border、Padding 或 Content，索引越界行为与 `getBox(index)` 相同。
保留原生取整语义，包括附加盒偏移和主盒的内边距区域尺寸。

`new RenderBox(fillSize, borderOffset, borderWidths, borderRadius)` 可独立构造。
边宽 `EdgeSizes` 为上、右、下、左四元组；
圆角 `CornerSizes` 为左上、右上、右下、左下四元组。

`fillSize`、`borderOffset`、`borderWidths`、`borderRadius` 是可写共享 `Float32Array`。
对应的 `get...()` 返回副本，`set...()` 更新原生字段。
`getFillOffset()` 返回 `{ x: 左边框宽度, y: 上边框宽度 }`。
`clone()`、`equals()`、`notEquals()` 使用原生值语义；
RenderBox 按数值分量比较，Box 的边尺寸则按字节比较。

使用有限原生浮点数。公开 setter 先验证全部参数，再写入；
查询及元素写入会拒绝通过共享视图引入的非有限值。
向量或数组 getter 抛出异常不会造成 setter 部分写入。
元素句柄在参数 getter 执行后验证，从 getter 销毁元素会得到失效句柄错误。

元素坐标与投影见[布局与滚动](layout.zh-CN.md)。
