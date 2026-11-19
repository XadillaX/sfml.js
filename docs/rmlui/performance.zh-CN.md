# 共享存储、批处理与预加载

Native 持有模型存储和资源，负责求值、布局与渲染。逐帧保留数值视图及命令数组，
由 JavaScript 写入字节，再一次通知或提交。存储初始化见[原生数据模型](data-models.zh-CN.md)，
实际验收见[性能报告](audit/6.3/architecture-performance-results.md)。

## 数值元素命令

一次创建 `new rmlui.ElementCommandBuffer(context, elements)`，保留其 TypedArray。
`opcodes` 写入 `ElementCommandOpcode.SetNumeric`，`properties` 写入 `PropertyId.Width`，
`units` 写入 `Unit.PX`；`elements[i]` 是预注册槽位，`numbers[i]` 是数值。
最后调用一次 `submit(count)`，无需逐元素构造和解析 `"2px"`。

Native 先校验并保存整个前缀的快照，再顺序执行；查询可见之前的写入。
预校验失败不消费命令；执行失败由 `consumed` 保留已完成前缀。
扩容、回收和 shutdown 后，旧共享视图仍可安全持有字节。

## 显式批量数据 view

大量已挂接元素需要相同的 JS 数值计算时，使用
`new rmlui.DataBatchView(model, elements, expressions, update, options)`。
每个表达式对应一个稳定元素槽位。回调通过 `slots`、`inputs` 读取连续脏区间，
把结果写入 `commands`，返回命令数。完整代码见[英文指南](performance.md)。

区间遵循原生调度器的现有顺序；其他组和旧 view 会切断区间，不能假定任意文档中
总是只有一次回调。按依赖选择 `sortOffset`；示例中的 `999` 让计算排在同深度的默认
属性 view 之后。抛错不应用返回命令。JS getter、transform 和旧逐元素 API
保留各自的回调、执行顺序与副作用。

## 展示前准备资源

先初始化，隐藏窗口，再等待全部纹理及字体描述：

```js
window.setVisible(false);
await rmlui.preloadResources({
  textures: [ 'images/menu.png' ],
  fonts: [{ source: 'fonts/menu.ttf', family: 'Menu' }],
});
document.show();
context.update();
window.clear(sfml.Color.Black);
window.flush();
context.render();
window.display();
window.setVisible(true);
```

纹理路径必须与文档或样式表中的解析路径一致。Native 工作线程读取文件、解码图片、
预乘 alpha；GPU 上传和字体注册在所属线程完成。字形图集在布局和渲染时生成，
因此显示前的隐藏帧负责预热。并发的相同描述共享准备和提交。
可选 `signal` 取消单批请求；`renderInterface` 指定纹理缓存拥有者。

失败时 Promise 拒绝，之前成功提交的资源保留。对应资源释放及 shutdown 会使待提交
结果失效。字体字节由 Native 持有至 shutdown；存活的纹理句柄可以跨缓存淘汰保活。

## 渲染边界与验收范围

Context 渲染在 Native 合并连续兼容几何。纹理、变换、裁剪、shader、图层、捕获及
回调边界先提交当前批次；直接 geometry 调用保持立即绘制语义。
静态缓存不重复上传，同形状变化按每个 chunk 的受影响顶点区间上传；
状态变化仍可能产生多个 draw。

测量覆盖 macOS arm64 的完整 CPU 帧；GPU 耗时、全引擎零分配及
RmlUi 6.3 全部 API 完整性仍需分别验收。
