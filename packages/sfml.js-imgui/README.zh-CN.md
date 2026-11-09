# sfml.js-imgui

[![npm version](https://img.shields.io/npm/v/sfml.js-imgui.svg?style=for-the-badge&colorA=FF69b4&colorB=cc47a4&label=sfml.js-imgui)](https://www.npmjs.org/package/sfml.js-imgui)

[English](README.md) · **简体中文** · [日本語](README.ja.md) · [한국어](README.ko.md)

面向 [sfml.js](../sfml.js) 的 [Dear ImGui](https://github.com/ocornut/imgui) 1.91.9b 集成，遵循 [imgui-sfml](https://github.com/SFML/imgui-sfml) 3.0。使用 JavaScript 或 TypeScript 在 SFML 窗口中构建调试面板、场景检查器和原生编辑器控件。

[快速开始](../../docs/imgui/getting-started.zh-CN.md) · [示例](examples/README.zh-CN.md) · [API 参考](https://sfml.js.org/zh/reference/imgui/) · [sfml.js](../sfml.js/README.zh-CN.md)

## 功能

- 完整的 Dear ImGui 控件集：按钮、滑块、颜色编辑、文本输入、表格、菜单、模态弹窗和曲线
- 持久编辑状态通过类型化数组直接映射原生标量参数
- 字体图集控制，包括 CJK 覆盖和自定义 TTF 字体
- 自定义绘制列表，以及按窗口划分的 ImGui 上下文和独立资源所有权
- 所有导出函数、枚举和实时结构体视图都有 TypeScript 声明

`ImGui` 导出控件、枚举、回调包装和原生句柄操作；`SFML` 负责窗口集成、事件转发和帧提交。

## 安装

`sfml.js-imgui` 是 `sfml.js` 的对等依赖，请同时安装两个软件包：

```sh
npm install sfml.js sfml.js-imgui
```

与 sfml.js 一样，安装时会编译原生扩展，需要 Python、C++20 工具链、显示器和 OpenGL。支持 Node.js `^18.19.0 || >=20.5.0`。见 [平台要求](../../docs/sfml/getting-started.zh-CN.md#requirements)。

## 计数器示例

```javascript
const sf = require('sfml.js');
const { ImGui, SFML } = require('sfml.js-imgui');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(800, 600)),
  'ImGui counter',
);
window.setFramerateLimit(60);
const clock = new sf.Clock();
let clicks = 0;

SFML.Init(window);
try {
  while (window.isOpen()) {
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      SFML.ProcessEvent(window, event);
      if (event.is('Closed')) window.close();
    }

    SFML.Update(window, clock.restart().asSeconds());
    if (ImGui.Begin('Controls')) {
      if (ImGui.Button('Count')) clicks++;
      ImGui.TextUnformatted(`Clicks: ${clicks}`);
    }
    ImGui.End();

    window.clear(sf.Color.Black);
    SFML.Render(window);
    window.display();
  }
} finally {
  SFML.Shutdown(window);
  window.close();
}
```

## 帧生命周期

| 阶段 | 调用 | 职责 |
| --- | --- | --- |
| 收集输入 | `pollEvent` → `SFML.ProcessEvent` | 转发所有事件，包括文本、焦点和关闭事件。 |
| 开始一帧 | `SFML.Update(window, seconds)` | 更新输入与计时，然后开始 ImGui 帧。 |
| 声明控件 | 控件调用 | 读取并更新应用状态；每个 `Begin` 都要配对 `End`。 |
| 绘制界面 | `SFML.Render(window)` | 提交已录制的 SFML 绘制并渲染 ImGui。 |
| 呈现 | `window.display()` | 显示完成的帧。 |
| 退出 | `SFML.Shutdown(window)` | 在关闭仍然存活的原生窗口前释放 ImGui。 |

时间单位使用经过的**秒**而不是毫秒，并用 `SFML.GetIO().wantCaptureMouse` / `wantCaptureKeyboard` 控制场景输入。不要自行调用 `ImGui.NewFrame()` 或 `ImGui.Render()`，后端已经负责这些操作。

## 示例

![Dear ImGui 控件演示窗口](examples/screenshots/demo.png)

[`examples`](examples/README.zh-CN.md) 中包含三个可运行示例：Dear ImGui 控件演示、用面板驱动 SFML 圆形的场景检查器，以及组合文本输入、表格、模态弹窗和曲线的工作台。

```sh
# 在 monorepo 根目录执行 node tools/bootstrap.cjs 之后
node packages/sfml.js-imgui/examples/demo.cjs
node packages/sfml.js-imgui/examples/scene-inspector.cjs
node packages/sfml.js-imgui/examples/workbench.cjs
```

## 文档

ImGui 指南提供英文、简体中文、日文和韩文版本：

| 章节 | 内容 |
| --- | --- |
| [快速开始](../../docs/imgui/getting-started.zh-CN.md) | 完整计数器、帧生命周期、输入捕获与安全退出 |
| [控件与状态](../../docs/imgui/widgets.zh-CN.md) | 持久编辑状态、唯一 ID 和实时场景检查器 |
| [布局](../../docs/imgui/layout.zh-CN.md) | 表格、菜单、确认弹窗与作用域配对 |
| [文本输入与回调](../../docs/imgui/callbacks.zh-CN.md) | UTF-8 编辑、回调契约、列表与曲线 |
| [字体与样式](../../docs/imgui/fonts.zh-CN.md) | 字体图集、CJK 覆盖、间距、颜色与 DPI |
| [渲染与多窗口](../../docs/imgui/rendering.zh-CN.md) | 场景合成、绘制列表与按窗口划分的所有权 |
| [API 使用指南](../../docs/imgui/api.zh-CN.md) | 签名、重载和生命周期约束 |

## 许可证

[MIT](../sfml.js/LICENSE)。
