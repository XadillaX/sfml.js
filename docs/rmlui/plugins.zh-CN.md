# 插件

`Plugin` 对应 `Rml::Plugin`，注册关系由 Native 持有。构造时捕获回调，再注册：

```js
const rmlui = require('sfml.js-rmlui');
const plugin = new rmlui.Plugin({
  getEventClasses() {
    return rmlui.PluginEventClasses.Basic;
  },
  onContextCreate(context) {
    console.log(context.name, context.dimensions.width);
  },
});

rmlui.registerPlugin(plugin);
// 在运行时关闭之前注销。
rmlui.unregisterPlugin(plugin);
```

初始化前即可注册。四个事件位为 `Basic`（1）、`Document`（2）、`Element`（4）、
`DataModel`（8），`All` 为 15，也是默认值。不同类别用按位或组合。
`getEventClasses` 每次注册只执行一次，掩码固定到注销为止；
之后修改回调对象的属性不会替换已捕获函数。

| 回调 | 原生通知时机 |
| --- | --- |
| `onInitialise()` | 首次初始化通知 Basic 订阅者；晚注册均在插入前调用 |
| `onShutdown()` | 已初始化时显式注销均调用；全局关闭按注册逆序通知 Basic 订阅者 |
| `onContextCreate(context)` | 设置尺寸并注册上下文之后 |
| `onContextDestroy(context)` | 销毁所属文档与模型之前 |
| `onDocumentOpen(context, documentPath)` | 进入流加载、解析之前；路径重载此时已打开文件 |
| `onDocumentLoad(document)` | 实例化并插入之后，`load` 事件之前 |
| `onDocumentUnload(document)` | `unload` 事件之后 |
| `onElementCreate(element)` | Factory 设置属性之后 |
| `onElementDestroy(element)` | Element 基类析构期间，销毁元数据与子节点之前 |
| `onDataModelCreate(context, name)` | 原生模型插入之后 |
| `onDataModelDestroy(context, name)` | 原生移除之前，仍可调用 `context.getDataModel(name)` |

参数是实时、独立的借用包装器。允许读取上下文名称、尺寸和模型，元素 id、标签及
属性，文档标题与来源 URL。回调返回后，借用句柄不能再进入原生对象。
已取得的尺寸视图保持内存安全，失效时归零；需要保留的值在回调内复制。
返回的模型遵循实际模型生命周期，移除模型或销毁上下文后失效。
Element 基类析构回调只提供仍存活的基类字段。

插件通知允许修改注册关系。自注销立即取消后续通知，不会跳过下一位订阅者。
新增注册从下一次通知生效；已初始化时仍立即调用其 `onInitialise`。
晚初始化中自注销取消插入，在 `onInitialise` 返回后调用 `onShutdown`。
重复注册抛错，重复注销返回 false。

上游头文件称 `onDocumentOpen` 在打开文件前通知，但 RmlUi 6.3 的路径重载实际
先打开 StreamFile，失败时不通知。内存和流加载在文档解析前通知。
本适配器保留实测 Core 顺序。

所有通知必须同步返回 undefined。异常暂存到外层原生调用安全返回时抛出；
销毁继续完成，借用参数仍按期失效。拒绝 Promise，并消化其异步拒绝。
通知期间禁止修改 DOM、布局、渲染、输入或关闭运行时。
解析器、实例化器、特效和数值回调不能修改插件注册关系；全局关闭期间拒绝新增注册。

注册期间 Native 保活适配器与回调，即使 JS 包装器已回收。
注销在外层 Native 边界释放根引用；未注册的回调循环可以回收。
关闭运行时使所有适配器失效。没有订阅通知发生时，静态帧不增加插件回调或注册表扫描。
