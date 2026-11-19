# 文本、进度条与标签页

`Document.createTextNode(text)` 返回 `ElementText | null`。
查询、遍历、复制和事件目标保留原生子类及包装器身份。
`ElementText`、`ElementProgress` 和 `ElementTabSet` 均继承 `Element`。

## 文本排版

`getText()` / `setText(text)` 访问字面原始文本。
测量或绘制前，先加载字体并更新所属上下文。

```js
const text = document.createTextNode('A🌙中 &amp; Z');

document.getElementById('content').appendChild(text);
context.update();
const line = text.generateLine(1, Infinity, 0, true, true, false);
// { line: '🌙中 & Z', lineLength: 15, lineWidth: ..., reachedEnd: true }
```

`generateLine(lineBegin, maximumLineWidth, rightSpacingWidth,
trimWhitespacePrefix, decodeEscapeCharacters, allowEmpty)` 映射全部原生输入，
没有隐含默认值。`lineBegin` 和返回的 `lineLength` 使用 **UTF-8 源字节**。
起点必须是从零到文本字节长度之间的 int32 字符边界，允许末尾。
不能直接使用 JavaScript UTF-16 索引，消耗字节数也可能与格式化结果的字节数不同。

最大宽度必须非负，`Infinity` 表示不限宽；右侧间距是最后一个词元之后预留的
有限浮点像素宽度。格式化由原生 RCSS 空白、断词和大小写转换规则控制。
`allowEmpty` 允许在无法容纳词元时不消耗文本。
强制换行即使消耗了最后的源字节，也可能返回 false。
字体不可用时原生返回
`{ line: '', lineLength: 0, lineWidth: 0, reachedEnd: true }`。

`generateLine` 只测量，不添加行。`clearLines()` 清空行，
`addLine({ x, y }, text)` 在相对首行的有限基线偏移处添加已格式化内容。
`suppressAutoLayout()` 禁止后续文本变化标脏布局。这是原生单向设置，
其他文档变化仍可能触发布局。

`getLines()` 返回 `{ text, position: { x, y }, width }` 副本。
原生整数宽度初始为零，生成几何时更新。副本在布局变化、移除行和销毁元素后
仍有效，修改副本不会影响元素。

## 进度条

`getValue()` 返回钳制到 `[0, getMax()]` 的值，默认为零。
`setValue(value)` 保存有限浮点数。`getMax()` 默认为 1，
保存的最大值非正时也返回 1。`setMax(value)` 保存有限浮点数。
`getIntrinsicDimensions()` 调用进度条的原生重载：
宽度为 256 个密度无关像素，高度为当前行高，未指定的宽高比保持为零。

## 标签页

`setTab(index, rmlOrElement)` 和 `setPanel(index, rmlOrElement)` 支持两种
原生重载。int32 索引存在时替换，否则追加，不填充中间空位。
元素参数会转移持有所有权的脱离树，已连接的节点必须先从父节点移除。
替换或移除标题、面板会销毁对应元素，使保留的包装器失效。

`removeTab(index)` 移除存在的对应标题及面板。
`getNumTabs()` 统计标题数量，与面板数量独立，可能创建内部 tabs 容器。
`getActiveTab()` 初始为零，即使标签组为空。
`setActiveTab(index)` 保存不钳制的 int32 索引，只在变化时派发 `tabchange`，
索引放在 `parameters.tab_index`。原生点击默认行为也会切换活动标签。

文本排版、文本修改及进度条、标签页修改禁止事件回调重入。
`getNumTabs()` 因为可能修改树也禁止重入。
原始文本、行快照、进度值和活动标签的纯读取仍可使用。
监听器异常在原生操作返回后传播。

继承的 `processDefaultAction(event)` 可在回调中使用；
参见[原生类型与默认动作](./rtti-default-actions.zh-CN.md)。
另见[表单控件](./controls.zh-CN.md)和[文档生命周期](./documents.zh-CN.md)。
