# sfml.js-interop

[![npm version](https://img.shields.io/npm/v/sfml.js-interop.svg?style=for-the-badge&colorA=5DDB61&colorB=4BC74F&label=sfml.js-interop)](https://www.npmjs.org/package/sfml.js-interop)

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

为 [sfml.js](../sfml.js) 及其插件（如 [sfml.js-imgui](../sfml.js-imgui)）提供共享原生头文件和 SFML SDK 路径。应用通常直接使用 JavaScript 包；本软件包面向原生扩展作者。

[完整互操作指南](../../docs/interop/README.zh-CN.md) · [开发指南](../../docs/sfml/development.zh-CN.md)

## 用法

在扩展中声明 `sfml.js-interop` 依赖。与 [nan](https://www.npmjs.com/package/nan) 类似，require 本软件包会返回它的 include 目录：

```js
const includeDir = require('sfml.js-interop');
```

`require('sfml.js-interop/paths')` 导出已解析的 SDK 路径：

| 导出 | 路径 |
| --- | --- |
| `root` | 包含已下载 SDK 的软件包根目录 |
| `include` | 互操作头文件目录 |
| `sfmlInclude` | SFML C++ 头文件 |
| `sfmlLib` | SFML 链接库 |
| `sfmlBin` | SFML 运行时二进制文件 |

在 `binding.gyp` 中引用这两个 include 目录，不要硬编码兄弟仓库的私有头文件：

```json
{
  "include_dirs": [
    "<!(node -e \"process.stdout.write(require('sfml.js-interop'))\")",
    "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlInclude)\")"
  ]
}
```

## 契约

- `sfml-js-interop.h` 提供 `SFMLJS_INTEROP_VERSION`（当前为 1），并导入 `shared-handle.h`、`exception-boundary.h` 和 `numeric-fields.h`。
- 扩展需匹配宿主绑定所用的契约与 SFML 版本。版本宏相同本身不保证不同构建配置的二进制之间 ABI 兼容。
- `RenderWindowFrom` 接收绑定内部的原生窗口句柄，不接收公开的 JavaScript RenderWindow 对象。
- 原生拥有者管理生命周期：视图和借用指针不能超出其拥有者、上下文或窗口的生命周期。
- 已录制绘制需要保活资源、保持调用时快照；向 V8 暴露 C++ 回调时使用共享异常边界。

SDK 下载器归本软件包管理；Rush 先构建 interop，再构建 sfml.js 和 sfml.js-imgui。完整消费示例见[集成源码](../sfml.js-imgui/native/interop.h)和 [JS 桥接](../sfml.js-imgui/src/internal/sfml-interop.ts)。

## 许可证

[MIT](../sfml.js/LICENSE)。
