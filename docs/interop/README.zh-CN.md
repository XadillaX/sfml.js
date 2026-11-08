# 开发原生扩展

sfml.js-interop 为两个绑定包提供共享原生头文件和 SFML SDK 路径。应用通常直接使用 JavaScript 包；原生扩展通过这份契约集成，不引用兄弟仓库的私有头文件。

在扩展中声明 `sfml.js-interop` 依赖。与 nan 类似，`require('sfml.js-interop')` 返回 include 目录；`require('sfml.js-interop/paths')` 导出 `root`、`include`、`sfmlInclude`、`sfmlLib` 和 `sfmlBin`。从消费该依赖的包中解析路径。

```json
{
  "include_dirs": [
    "<!(node -e \"process.stdout.write(require('sfml.js-interop'))\")",
    "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlInclude)\")"
  ]
}
```

`sfml-js-interop.h` 提供 `SFMLJS_INTEROP_VERSION`（当前为 1），并导入 `shared-handle.h`、`exception-boundary.h` 和 `numeric-fields.h`。扩展需匹配宿主绑定所用的契约与 SFML 版本。`RenderWindowFrom` 接收绑定内部的原生窗口句柄，不接收公开 JavaScript RenderWindow 对象。

原生拥有者管理生命周期，视图和借用指针不能超出拥有者、上下文或窗口的生命周期。已录制绘制需要保活资源并保持调用时的快照语义。向 V8 暴露 C++ 回调时使用共享异常边界。版本宏相同，本身不保证采用不同构建配置的二进制之间 ABI 兼容。

Rush 先构建 interop，再构建 sfml.js 和 sfml.js-imgui。SDK 下载器归 interop 管理，扩展中不要硬编码兄弟包路径。参考[集成源码](../../packages/sfml.js-imgui/native/interop.h)、[JS 桥接](../../packages/sfml.js-imgui/src/internal/sfml-interop.ts)和[开发指南](../sfml/development.zh-CN.md)。
