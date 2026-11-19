# sfml.js-rmlui

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

面向 [sfml.js](../sfml.js) 的 [RmlUi](https://github.com/mikke89/RmlUi) 6.3 集成，通过 SFML 3.1 渲染。使用 RML 文档和 RCSS 样式定义原生界面，再用 JavaScript 或 TypeScript 连接元素与应用逻辑。

[快速开始](../../docs/rmlui/getting-started.zh-CN.md) · [示例](examples/README.zh-CN.md) · [API 参考](https://sfml.js.org/zh/reference/rmlui/) · [sfml.js](../sfml.js/README.zh-CN.md)

Native 绑定和 TypeScript 接口按职责组织；模块与工具归属见[源码目录](../../docs/rmlui/source-layout.zh-CN.md)。

## 功能

- 加载外部或内存中的 RML，查询元素并修改类、属性、样式和标记。
- 注册 JavaScript 事件监听器，在运行时切换 RCSS 主题。
- 使用[原生 Debugger](../../docs/rmlui/debugger.zh-CN.md) 检查元素、日志与数据模型，宿主和目标可使用不同上下文。
- 几何数据保留在原生内存中，通过 SFML 顶点缓冲、纹理和着色器绘制。
- 支持模板裁剪、图层合成、模糊和投影。
- 支持 macOS Retina 表面、物理像素输入和使用 `dp` 的密度无关布局。
- API 文档提供英文、简体中文、日文和韩文。

RmlUi 使用自己的标记和样式语言。本包提供[原生数据模型](../../docs/rmlui/data-models.zh-CN.md)、[Node／Lua 文档脚本](../../docs/rmlui/scripts.zh-CN.md)、原生 Debugger、[SVG／Lottie 元素](../../docs/rmlui/vector-elements.zh-CN.md)和原生 [FreeType、HarfBuzz、位图字体](../../docs/rmlui/fonts.zh-CN.md)；不提供浏览器 DOM API 或任意浏览器 CSS。渐变、图片遮罩、颜色／背景滤镜及 3D 变换已实现，并在 macOS 上与固定版本的 GL3 渲染器对照，详见[渲染器覆盖](../../docs/rmlui/rendering.zh-CN.md#renderer-coverage)。Linux／Windows 运行验证仍待完成。

## 构建与运行

以下命令面向当前 monorepo 源码。Node.js、Python、C++20 工具链、显示环境和 OpenGL 的要求见[平台要求](../../docs/sfml/getting-started.zh-CN.md#requirements)。

```sh
# From the monorepo root, install and build once.
node tools/bootstrap.cjs
cd packages/sfml.js-rmlui
npm run demo
npm run examples -- variables
npm run examples -- --list
```

工作区已准备好时，先构建 `sfml.js-interop` 和 `sfml.js`，再在本包执行 `npm run build`。macOS 需要 Xcode Command Line Tools 和 CMake。依赖步骤复用 `sfml.js-interop/third_party` 下的 SFML 源码、构建目录及版本匹配的带补丁 Window 库。

## 帧生命周期

| 阶段 | 调用 | 契约 |
| --- | --- | --- |
| 初始化 | `initialise(window)` | 将一个已打开的 `RenderWindow` 绑定到进程级运行时。 |
| 准备 | `loadFontFace`、`createContext`、`loadDocument`、`show` | 先加载字体再加载文档；初始化后读取上下文尺寸。 |
| 输入 | `context.processEvent(event)` | 直接转发所有 SFML 事件，false 表示已消费。 |
| 布局 | `context.update()` | 更新布局、动画和显示密度。 |
| 绘制 | `window.clear`、场景绘制、`window.flush`、`context.render` | 在 UI 绘制前提交待执行的 SFML 命令。 |
| 呈现 | `window.display()` | 显示完整帧。 |
| 退出 | 移除监听器、`context.remove`、`shutdown`、`window.close` | 窗口仍存活时释放 RmlUi。 |

RmlUi 6.3 的 `update()` 和 `render()` 返回 true，空上下文也如此。它们的返回值不表示布局发生变化或存在可见几何。

## 示例

![SFML 窗口中的 RmlUi 主题](examples/screenshots/variables.png)

[计数器](examples/README.zh-CN.md#demo)的 Increment 按钮具有实际交互。官方 [variables](examples/README.zh-CN.md#variables) 页面展示主题和悬停样式，任务按钮在上游没有点击行为。启动器还支持文档加载、模板、拖动教程及 113 个 VisualTests 页面。

```sh
npm run examples -- drag
npm run examples -- template
npm run examples -- visual/clip_mask
```

## 文档与检查

| 指南 | 内容 |
| --- | --- |
| [快速开始](../../docs/rmlui/getting-started.zh-CN.md) | 构建、资源和帧循环 |
| [文档与事件](../../docs/rmlui/documents.zh-CN.md) | 元素修改、监听器和所有权 |
| [渲染与 Retina](../../docs/rmlui/rendering.zh-CN.md) | 坐标、`dp`、模板缓冲和渲染覆盖范围 |
| [字体](../../docs/rmlui/fonts.zh-CN.md) | 原生引擎、整形、图集限制与能力查询 |
| [API 指南](../../docs/rmlui/api.zh-CN.md) | 精确签名、默认值与返回值 |

执行 `npm test` 检查 lint、原生／TypeScript 构建、类型和运行时回归。macOS 下，`npm --prefix ../sfml.js-interop run test:high-dpi` 检查原生表面、像素截图和光标坐标。跨物理显示器移动窗口仍需设备测试。

## 许可证

[MIT](../sfml.js/LICENSE)。
