# RmlUi 元素工具

`ElementUtilities` 暴露 `Rml::ElementUtilities` 的全部静态操作。
查询计算字体、布局或裁剪前先更新上下文；修改变换后渲染一次，
使累积变换状态生效。

```js
const { ElementUtilities: utilities, BoxArea, PositionAnchor } =
  require('sfml.js-rmlui');
const panel = utilities.getElementById(document, 'panel');
const width = utilities.getStringWidth(panel, 'AV');
const bounds = utilities.getBoundingBox(panel, BoxArea.Auto);
const box = utilities.buildBox({ x: 640, y: 480 }, panel);

utilities.positionElement(panel, { x: 12, y: 12 }, PositionAnchor.BottomRight);
```

`getElementById(root, id)` 广度优先搜索，包含根节点。
标签和类名查询不包含根节点，返回有效包装器数组。
`getElementsByTagName(root, tag, stopTag)` 的可选 `stopTag`
阻止搜索该节点的后代；停止节点本身仍可匹配。查询保留包装器身份。
数组是快照，其中的包装器仍随原生元素销毁而失效。

`getDensityIndependentPixelRatio(element)` 返回上下文密度比例；
没有上下文时返回 1。
`getStringWidth(element, text, priorCharacter = 0)` 按原生字体和塑形设置
测量 UTF-8 文本。前置字符是用于字距调整的 Unicode 标量码点。
返回整数像素宽度；没有原生字体时返回零。

`getBoundingBox(element, area)` 必须指定 `BoxArea`，返回
`{ p0: { x, y }, p1: { x, y } }`；原生投影失败时返回 `null`。
`Auto` 遵循上游行为，包含边框盒和外部 box-shadow 溢出，
不包含滤镜溢出。

## 裁剪快照

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
保留原生的两类输出。`region` 是整数裁剪矩形或 `null`；
变换蒙版可以在 `region` 为 `null` 时存在。
`forceClipSelf` 包含目标元素的边框区域。请求蒙版几何时，
元素必须关联到上下文。

每个蒙版包含 `ClipMaskOperation`、独立持有的 `Geometry`、
取整后的 `absoluteOffset`，以及复制的列主序
`Float32Array(16)` 变换矩阵。`null` 矩阵表示单位变换。
修改返回的矩阵或网格不会改变原元素。几何在文档关闭或包装器回收后
仍可使用；主动释放、运行时关闭或释放渲染管理器后失效。
使用完毕后释放快照。

`setClippingRegion(element, forceClipSelf = false)` 将原生裁剪提交到
渲染管理器并返回原生可见性。
`applyTransform(element)` 提交累积变换。
没有上下文时两者返回 `false`。使用几何蒙版时，
渲染窗口需要设置 `stencilBits: 8`。

## 布局与数据视图

`buildBox(containingBlock, element, inlineElement = false)` 返回独立 `Box`，
不会设置元素的盒。行内尺寸沿用上游规则，包括尚未解析的自动尺寸。
`formatElement(element, containingBlock)` 调用原生布局引擎，
适用于自定义非 DOM 内容。脱离上下文前先在 DOM 中计算样式；
格式化不会更新脏样式。容纳块尺寸必须有限且非负。

`positionElement(element, offset, anchor)` 构建并设置盒，
按父元素内容区域解析相对长度，并从选定的边或角定位。
CSS 定位属性仍会影响最终偏移。
全部 8 个 `PositionAnchor` 成员保留原生位值。
没有父元素时返回 `false`；偏移必须为有限值。

`applyDataViewsControllers(element)` 调用原生接口，
从 `data-*` 属性构造数据视图和控制器。
没有模型或适用绑定时返回 `false`，视图或控制器成功初始化时返回 `true`。
在已挂接元素上设置绑定属性后，用该方法构造绑定，再更新模型或上下文。
原生值视图和控制器同步输入值并触发模型事件。移除模型会注销控制器，
并清除元素关联。再次调用会构造绑定，不能作为幂等的绑定刷新操作。

全部操作拒绝已销毁元素。布局、数据构造及渲染状态提交
会在进入上游前拒绝不安全的回调重入。
参数 getter 执行完毕后才验证原生接收者。

运行[元素检查器](../../packages/sfml.js-rmlui/examples/element-utilities.cjs)，
查看定位、投影边界、文本宽度和裁剪快照。
