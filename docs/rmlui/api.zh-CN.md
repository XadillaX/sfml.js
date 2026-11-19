# RmlUi API 指南

[RmlUi API 参考](/reference/rmlui/)由本包 TypeScript 声明和四语 TSDoc 生成。总览展示短摘要，成员详情包含签名、默认值、参数、返回值和生命周期说明。

[字符串与资源 URL](strings.zh-CN.md) 说明保活字节视图、UTF-8 迭代、
批量偏移转换与有类型原生格式化。

## 查找契约

| 任务 | API |
| --- | --- |
| 绑定渲染窗口 | [initialise](/reference/rmlui/functions/initialise.html)、[InitialiseOptions](/reference/rmlui/interfaces/InitialiseOptions.html) |
| 加载字体与释放字形缓存 | [loadFontFace](/reference/rmlui/functions/loadFontFace.html)、[字体指南](fonts.zh-CN.md) |
| 观察 Native 生命周期通知 | [Plugin](/reference/rmlui/classes/Plugin.html)、[插件指南](plugins.zh-CN.md) |
| 检查与释放渲染资源 | [渲染资源](resources.zh-CN.md)、[RenderInterface](/reference/rmlui/interfaces/RenderInterface.html) |
| 查询布局、滚动与坐标投影 | [元素布局](layout.zh-CN.md)、[Element](/reference/rmlui/classes/Element.html) |
| 查询原生滚动与变换组件 | [ElementScroll](/reference/rmlui/classes/ElementScroll.html)、[TransformState](/reference/rmlui/classes/TransformState.html)、[ElementTransformBuffer](/reference/rmlui/classes/ElementTransformBuffer.html) |
| 挂载、递归解绑和显式派发事件 | [EventDispatcher](/reference/rmlui/classes/EventDispatcher.html)、[元素状态](element-state.zh-CN.md) |
| 构造和查询盒值 | [盒值](boxes.zh-CN.md)、[Box](/reference/rmlui/classes/Box.html)、[RenderBox](/reference/rmlui/classes/RenderBox.html) |
| 解析数值和单位 | [数值与单位](numeric-values.zh-CN.md)、[NumericValue](/reference/rmlui/classes/NumericValue.html) |
| 读取与设置类型化属性 | [类型化属性](properties.zh-CN.md)、[Property](/reference/rmlui/classes/Property.html) |
| 属性动画与缓动求值 | [动画](animation.zh-CN.md)、[Tween](/reference/rmlui/classes/Tween.html) |
| 创建、更新和绘制上下文 | [createContext](/reference/rmlui/functions/createContext.html)、[Context](/reference/rmlui/classes/Context.html) |
| 读取物理尺寸 | [ContextDimensions](/reference/rmlui/interfaces/ContextDimensions.html) |
| 绑定原生数据及自定义视图、控制器 | [数据模型](data-models.zh-CN.md)、[DataView](/reference/rmlui/classes/DataView.html)、[DataController](/reference/rmlui/classes/DataController.html)、[Factory](/reference/rmlui/classes/Factory.html) |
| 显示与卸载文档 | [Document](/reference/rmlui/classes/Document.html) |
| 查询、设置样式和监听元素 | [Element](/reference/rmlui/classes/Element.html) |
| 读取活跃事件与参数副本 | [RmlEvent](/reference/rmlui/classes/RmlEvent.html)、[RmlEventListener](/reference/rmlui/types/RmlEventListener.html) |
| 释放运行时 | [shutdown](/reference/rmlui/functions/shutdown.html) |

## 原生元素组件

`element.getStyle()` 提供真实且带检查的
[`ElementStyle`](/reference/rmlui/classes/ElementStyle.html)，包含层叠、脏集合、
显式定义更新、独立计算、快照迭代和可复用关键帧解析。生命周期、布局消费与
共享数值命令见 [元素状态](element-state.zh-CN.md#原生样式组件)。

`element.getElementBackgroundBorder()` 返回身份固定、元素持有的
[`ElementBackgroundBorder`](/reference/rmlui/classes/ElementBackgroundBorder.html)。
`dirtyBackground()` 和 `dirtyBorder()` 标记几何在下次原生 `render()` 中更新。
渲染使用当前计算样式、布局和管理器状态，先准备管理器视口。没有管理器的分离
元素不绘制，拒绝其他管理器的活动层和效果回调重入。

`getClipGeometry(area)` 接收 BoxArea.Border、Padding 或 Content，返回
独立的原生 `Geometry` 快照；Margin 和 Auto 抛出异常。没有管理器时返回空几何。
组件重建、元素销毁、快照修改和释放不会改变其他快照或组件网格。管理器仍控制
GPU 资源寿命，`getMesh()` 副本在管理器释放和关闭后仍可用。

```js
const background = element.getElementBackgroundBorder();

context.getRenderManager().prepareRender({
  x: context.dimensions.width, y: context.dimensions.height,
});
background.render();
const clip = background.getClipGeometry(BoxArea.Padding);
const mesh = clip.getMesh();

clip.release();
```

`element.getElementScroll()` 返回元素持有的 `ElementScroll`。
`ScrollOrientation.VERTICAL` 为 0，`HORIZONTAL` 为 1。
`update()`、`enableScrollbar(orientation, elementWidth)`、
`disableScrollbar(orientation)`、`updateScrollbar(orientation)`、
`formatScrollbars()` 和 `updateProperties()` 调用对应原生组件操作。
`getScrollbar(orientation)` 返回实时元素；尚未创建时为 `null`。
`getScrollbarSize(orientation)` 返回垂直条宽度或水平条高度，单位为像素，
禁用时为零。禁用操作改变原生属性；查询可见性前用 `updateProperties()`
重新计算滚动条属性。组件随元素销毁而失效，并保活分离元素的所有权。

`element.getTransformState()` 返回当前原生状态的只读视图，或 `null`。
RmlUi 在 `context.render()` 中更新变换。
`getTransform()`、`getLocalPerspective()` 和 `getInverseTransform()`
返回独立原生存储中的 `Float32Array` 快照，每个矩阵包含 16 个列主序值。
未设置的矩阵返回 `null`；奇异变换没有逆矩阵。元素销毁、运行时关闭后，
快照仍可使用。`new TransformState()` 创建独立状态，
`setTransform(matrix)` 和 `setLocalPerspective(matrix)` 复制 16 个有限值，
传入 `null` 则清除；返回原生值是否改变。

需要反复读取多个元素时，一次分配 `ElementTransformBuffer`。
`refresh()` 只进入原生一次，不产生 JS 回调或输出存储重新分配。
每个元素占 48 个列主序浮点数：变换偏移 0，透视偏移 16，逆矩阵偏移 32。
`flags[i]` 的存在位分别为 1、2、4；缺失矩阵填零。写入只修改输出快照。
全部元素在更新输出前统一校验；元素销毁或运行时失效时抛出异常。
数值视图仅保活存储，包装器回收后仍可使用。

```js
const { ElementTransformBuffer } = require('sfml.js-rmlui');
const transforms = new ElementTransformBuffer(elements);

context.update();
context.render();
transforms.refresh();
const firstTransform = transforms.matrices.subarray(0, 16);
const firstPresence = transforms.flags[0];
```

## 关键返回值

`initialise` 返回初始化是否成功；重复调用不替换进程级窗口或选项。`loadFontFace` 返回字体是否加载成功。元素查询无匹配时返回 `null`。`setProperty` 返回 RCSS 是否接受属性。

`processEvent` 对键盘、文本、滚轮返回传播状态，对鼠标、触摸返回是否未与元素交互。直接输入方法及返回规则见[文档与事件](./documents.zh-CN.md#直接输入)。`update` 和 `render` 转发 RmlUi 6.3 的返回值，当前始终为 true，不能用作脏标志或可见性判断。

## 默认值与所有权

`highDpi` 默认为 true；字体后备、模态显示、监听器捕获标志均默认为 false。对应 API 详情也提供这些值。

通过运行时创建、加载器或元素查询获取上下文与元素包装器。内部句柄不是公开 API。这些包装器借用原生对象，失效与监听器移除规则见[文档与事件](documents.zh-CN.md)。

`Box` 和 `RenderBox` 提供公开构造函数，独立持有原生值与共享数值视图；生命周期与快照规则见[盒值](boxes.zh-CN.md)。

[源码入口](../../packages/sfml.js-rmlui/src/index.ts)和导出声明是 API 契约的依据。本绑定覆盖文档所列接口，不包含全部 C++ RmlUi API。
