# ImGui 指南

<p><a class="library-brand" href="https://www.dearimgui.com/"><img src="assets/dear-imgui.jpg" width="240" height="84" alt="Dear ImGui，Logo 绘制：Albane Kim"></a></p>

使用 `sfml.js-imgui`，在 SFML 窗口中构建调试面板、场景检查器和原生编辑器控件。本指南从第一段帧循环出发，逐步加入状态编辑、表格、文本输入、字体和自定义渲染。

当前源码面向 Dear ImGui 1.91.9b 和 imgui-sfml 3.0，示例使用 JavaScript 与 SFML 3.1 API。需要 JavaScript 和 [SFML 窗口](../sfml/window.zh-CN.md)基础，不要求 C++ 知识。

## 什么是 Dear ImGui

[Dear ImGui](https://www.dearimgui.com/) 是面向交互工具的 C++ 图形界面库。它使用即时模式（Immediate Mode）：每一帧通过函数调用描述要显示的控件，例如调用按钮函数、检查是否点击，再更新应用状态。ImGui 保留内部交互状态并生成绘制命令，SFML 集成层把这些命令显示到窗口中。

它适合调试面板、性能分析器、关卡编辑器和实时数据检查器。在本绑定中，控件由 JavaScript 代码组合，无需单独编写标记文档。需要用样式表设计具有持久元素树的界面时，可阅读 [RmlUi 指南](../rmlui/README.zh-CN.md)。

[官方仓库](https://github.com/ocornut/imgui) · [官方 Wiki](https://github.com/ocornut/imgui/wiki) · [常见问题](https://www.dearimgui.com/faq/)

## 学习路径

| 章节 | 学习结果 |
| --- | --- |
| [快速开始](getting-started.zh-CN.md) | 完整计数器、帧生命周期、输入捕获与安全退出 |
| [控件与状态](widgets.zh-CN.md) | 持久编辑状态、唯一 ID、实时场景检查器 |
| [布局与工具面板](layout.zh-CN.md) | 表格、菜单、确认弹窗与作用域配对 |
| [文本输入与回调](callbacks.zh-CN.md) | UTF-8 编辑、回调契约、列表与曲线 |
| [字体与样式](fonts.zh-CN.md) | 字体图集、CJK 覆盖、间距、颜色与 DPI |
| [渲染与多窗口](rendering.zh-CN.md) | 场景合成、绘制列表与按窗口划分的资源所有权 |
| [API 使用指南](api.zh-CN.md) | 查找准确签名、重载和生命周期约束 |

实践章节提供完整可运行源码，说明局部代码应放在哪里，并列出预期结果。各章提供英文、中文、日文、韩文版本。

## 选择可运行示例

在 monorepo 根目录执行一次 bootstrap，再启动示例：

```sh
node tools/bootstrap.cjs
node packages/sfml.js-imgui/examples/demo.cjs
```

- [控件演示](../../packages/sfml.js-imgui/examples/README.zh-CN.md#demo)：浏览 Dear ImGui 自带的控件和布局。
- [场景检查器](../../packages/sfml.js-imgui/examples/README.zh-CN.md#scene-inspector)：编辑运动圆形的大小、颜色与速度。
- [工作台](../../packages/sfml.js-imgui/examples/README.zh-CN.md#workbench)：组合文本编辑、对象选择、表格、模态弹窗和耗时曲线。

## 理解包的职责

`ImGui` 导出控件、枚举、回调包装和原生句柄操作；`SFML` 负责原生窗口集成、事件转发和帧提交。`getFontAtlas`、`getStyleColors` 等是顶层导出。

应用值由 JavaScript 持有，可写原生标量参数使用类型化数组。IO、样式视图、字体和绘制列表具有原生所有者及有效期。各章会在使用相应功能时解释边界，准确契约见 [API 参考](/reference/imgui/)。
