# RmlUi 字节流

`StreamMemory`、`StreamFile` 和 `Stream` 实现 RmlUi 字节流接口。
`context.loadDocument(stream)` 和
`container.loadStyleSheetContainer(stream)` 从当前游标开始解析。
解析前设置来源 URL，使相对 RCSS、图片和字体路径使用文档来源。
RML 的 `<head>` 会将此 URL 保存到加载后的文档。

```js
const { StreamMemory, SeekOrigin, StyleSheetContainer } = require('sfml.js-rmlui');
const source = new StreamMemory(Buffer.from(
  '<rml><head/><body id="panel"/></rml>'));

source.setSourceURL('/application/assets/panel.rml');
const document = context.loadDocument(source);

const rules = new StreamMemory(Buffer.from('#panel { width: 240px; }'));

rules.setSourceURL('/application/assets/panel.rcss');
const container = new StyleSheetContainer();

container.loadStyleSheetContainer(rules);
document.setStyleSheetContainer(container);

source.seek(0, SeekOrigin.Set);
console.log(source.readString(5)); // <rml>
```

## 内存与文件

`new StreamMemory()` 创建原生持有的可写存储，初始容量为 256 字节。
数字参数指定容量，初始长度仍为零。`Uint8Array` 参数会复制该视图的字节，
创建原生持有的只读快照。分离或修改原视图不会影响流。
只读快照拒绝全部修改操作。

`read(count)` 和 `peek(count)` 返回独立数组。视图重载返回字节数，
仅修改目标视图覆盖的范围。`rawStream()` 复制全部已用字节，与游标位置无关。
返回的数组不受重新分配或 shutdown 影响。

`write(string)` 保留内嵌空字符，`writeCString(string)` 在首个空字符处停止。
`readString(count, initial)` 追加解码后的 UTF-8，保留空字符。
计数单位是字节，不是 JavaScript 字符。流复制沿用原生 RmlUi 语义：
即使自定义目标只写入部分数据，返回值仍为消耗的来源字节数。

内存流保留 RmlUi 的末尾定位语义：
`seek(offset, SeekOrigin.End)` 定位至 `length - offset`。
文件流使用 `length + offset`。自定义流由回调决定该语义。
内存删除将现有游标限制到新长度；头部删除使游标回退但不会小于零。
过大的 pop 计数最多删除现有长度。截断使内存游标移动到新末尾。

`new StreamFile()` 初始未打开。`open(path)` 使用已安装的 RmlUi 文件接口，
并先释放之前的文件句柄。文件流只读。`close()` 后必须重新打开才能读取、
定位和查询游标。shutdown 会在销毁文件接口前自动关闭所有文件。

字节批次和内存容量必须是 `[0, 2147483647]` 范围内的整数。
禁止使用已分离、共享或可调整大小的缓冲区。来源 URL 必须是字符串且不含
内嵌空字符。shutdown 使流包装对象失效，但已返回的字节快照仍然有效。

## 自定义同步流

使用 `new Stream(callbacks, sourceUrl, mode)`，实现 `length`、`tell`、
`seek`、`read`、`write`、`truncate`、`isReadReady` 和 `isWriteReady`。
URL 默认为空，模式默认为 `StreamMode.Read + StreamMode.Write`。

读取回调接收独立临时 `Uint8Array` 和最大计数，填充允许范围并返回
`[0, count]` 内的整数。不得分离或调整临时缓冲区大小。
写入回调接收字节快照，修改不会影响解析器或原始输入。
长度、位置和删除计数必须是非负安全整数；就绪检查和定位返回布尔值。

可选 `peek` 默认读取后恢复游标；`pushBack` 默认定位、写入并恢复游标；
`popBack` 默认截断。`pushFront` 和 `popFront` 必须显式实现。
`isEOS` 默认检查 `tell() >= length()`。
`close` 仅在显式 `stream.close()` 时运行，GC 和 shutdown 不调用它。

方法仅捕获一次，之后修改回调对象不会替换它们。流回调禁止重入原生 API，
包括调用自身或关闭运行时。回调异常保留原始 JS 对象身份。
Promise 返回值被同步拒绝，同时挂接拒绝处理器。
文档读取失败不会挂载文档或触发 load 事件。
样式表解析失败时可能保留此前已解析的规则。

回调通过 GC 可见的所有者引用保活。失去引用的回调环可以回收，
不会一直占用运行时资源。
