# 原生 Debugger

> `Debugger` 在已初始化的 SFML 运行时中执行上游 RmlUi 调试工具。
> 宿主负责显示工具，被调试目标可以是另一个上下文。

```js
const { Debugger } = require('sfml.js-rmlui');

if (!Debugger.initialise(host)) {
  throw new Error('Debugger initialization failed');
}

Debugger.setContext(application);
Debugger.setVisible(true);
host.update();
```

在正常帧循环中调用 `host.update()` 和 `host.render()`，将输入交给显示工具的上下文。
`isVisible()` 读取上游计算样式，因此初始化或修改可见性后，需要先更新宿主。
初始化会加载内嵌的原生字体；调试器已经存在时，`initialise()` 返回 false。

菜单提供 Element Info、Event Log、Data Models 和元素轮廓开关。Data Models 使用
原生反射读取标量、数组和结构体，包括已注册的自定义定义；窗口显示时按上游
0.3 秒间隔刷新。JS getter 与反射回调中的异常会从 `host.update()` 传播；
内置反射在 C++ 中执行。

`setContext(null)` 解除检查。删除目标或卸载目标的全部文档，会移除检查 hook，
保留宿主工具；删除宿主或卸载宿主的全部文档，会关闭调试器。禁止直接关闭或卸载
单个内部调试文档，应调用 `Debugger.shutdown()`。关闭会释放原生文档、监听器，
并恢复应用日志接口；运行时已初始化时，可重复调用。

五个方法均执行进程级运行时归属检查。普通事件回调中只允许读取 `isVisible()`；
修改调试器状态的操作会拒绝回调重入。运行时关闭后，需要重新初始化才能调用。
通过 Factory 借用的通用 allocator 在当前运行时中持续有效，调试器关闭时会移除
自身的 Factory 注册；allocator 的原生生命周期也覆盖旧目标中等待延迟释放的 hook。

本地 macOS 验收覆盖独立与自有上下文、原生日志、标量与自定义数组／结构体反射、
回调异常、目标切换、延迟释放，以及密度比例为 1 和 2 时的鼠标交互。
见[验收记录](audit/6.3/debugger-native-contracts.md)。平台任务、示例 F8 绑定和
项目整体验收仍需分别完成。
