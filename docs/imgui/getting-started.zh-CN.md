# ImGui 快速开始

先创建带计数器的原生窗口，再把同一套帧循环用于场景检查器。本章需要 JavaScript 和 SFML 窗口、事件的基础知识，不要求 C++ 或 Dear ImGui 使用经验。

## 安装与运行

源码开发需要 Node.js 20 或 22、Python 和 C++20 工具链。按[平台依赖说明](../sfml/getting-started.zh-CN.md#requirements)准备环境，包括图形显示和 OpenGL。在 monorepo 根目录执行：

```sh
node tools/bootstrap.cjs
node packages/sfml.js-imgui/examples/demo.cjs
```

bootstrap 安装依赖、下载原生库，并构建各包和文档站。它属于首次准备，不需要每次运行示例都执行。只改动 ImGui TypeScript 后，可执行 `npm run build:ts --prefix packages/sfml.js-imgui`。

应用使用已发布的兼容版本时，同时安装两个包：

```sh
npm install sfml.js sfml.js-imgui
```

本章对应的版本尚未发布时，运行 monorepo 示例。示例通过 `../dist` 引入本地构建。下面的独立程序使用包名导入：保存为已安装两个包的应用目录中的 `counter.cjs`，运行 `node counter.cjs`。

## 完整计数器

```js
const sf = require('sfml.js');
const { ImGui, SFML } = require('sfml.js-imgui');

const window = new sf.RenderWindow(
  new sf.VideoMode(new sf.Vector2u(800, 600)),
  'ImGui counter'
);
window.setFramerateLimit(60);
const clock = new sf.Clock();
let running = true;
let clicks = 0;

function drawControls() {
  ImGui.SetNextWindowSize([ 320, 160 ], ImGui.ImGuiCond.FirstUseEver);
  if (ImGui.Begin('Controls')) {
    if (ImGui.Button('Count')) {
      clicks++;
    }
    ImGui.TextUnformatted(`Clicks: ${clicks}`);
  }
  ImGui.End();
}

try {
  if (!SFML.Init(window)) {
    throw new Error('ImGui initialization failed');
  }
  while (running && window.isOpen()) {
    let event;
    while ((event = window.pollEvent()) !== undefined) {
      SFML.ProcessEvent(window, event);
      if (event.is('Closed')) {
        running = false;
      }
    }
    if (!running) {
      break;
    }
    SFML.Update(window, clock.restart().asSeconds());
    drawControls();

    window.clear(sf.Color.Black);
    SFML.Render(window);
    window.display();
  }
} finally {
  SFML.Shutdown(window);
  window.close();
}
```

黑色原生窗口中会出现可移动的 Controls 面板。每次激活 Count，计数增加一次。折叠再展开面板，计数保留，因为 `clicks` 由应用持有。关闭原生窗口后，程序退出循环，先释放 ImGui，再销毁 SFML 窗口。

## 每帧做什么

| 阶段 | 调用 | 职责 |
| --- | --- | --- |
| 收集输入 | `pollEvent` → `SFML.ProcessEvent` | 转发所有事件，包括文本、焦点和关闭事件。 |
| 开始帧 | `SFML.Update(window, seconds)` | 更新输入与时间，开始 ImGui 帧。 |
| 声明控件 | `drawControls()` | 读取应用状态，让控件修改它。 |
| 绘制场景 | `window.clear`、可选的 `window.draw` | 准备 UI 后方的 SFML 内容。 |
| 绘制 UI | `SFML.Render(window)` | 提交已录制的 SFML 绘制，再渲染 ImGui。 |
| 显示 | `window.display()` | 展示完整画面。 |

时间单位是**秒**，不要传毫秒。此循环不需要额外调用 `ImGui.NewFrame()` 或 `ImGui.Render()`，后端已经管理这两个步骤。持久对象在循环外创建，控件声明在循环内重复执行。

`Begin` 返回 false 表示可以跳过内容，例如面板已折叠，但仍必须调用 `End`。表格、菜单、弹窗的规则不同，见[布局章节](layout.zh-CN.md)。

## 区分 UI 输入和场景输入

即使应用不应响应某个快捷键，ImGui 仍需要收到对应事件。应用输入处理放在 `ProcessEvent` 之后。例如，在事件循环中加入以下代码，让 Escape 仅在 ImGui 未捕获键盘时退出：

```js
const key = event.getIf('KeyPressed');
if (key?.code === sf.Keyboard.Key.Escape &&
    !SFML.GetIO().wantCaptureKeyboard) {
  running = false;
}
```

用 `wantCaptureMouse` 控制场景鼠标操作，用 `wantCaptureKeyboard` 控制应用按键。捕获标志反映当前 ImGui 帧状态；在先处理事件、再 Update 的常规循环里，读取到的是上一次 UI 更新的状态。不要因此丢弃发给 ImGui 的事件。原生关闭事件始终处理，不受捕获标志限制。

`wantTextInput` 是文本输入支持请求，不能代替键盘捕获标志。如果场景响应按键释放，应记录哪些按下事件已被 UI 消费，避免其释放事件触发场景操作。[场景检查器](../../packages/sfml.js-imgui/examples/README.zh-CN.md#scene-inspector)演示了 Space 快捷键，并关闭按键重复。

## 排查首次运行

| 现象 | 检查项 |
| --- | --- |
| 缺少模块或原生二进制 | 完成 bootstrap，或安装当前平台的兼容发布版本。 |
| 有窗口但没有 UI | 检查调用顺序、Init 结果，以及保存的面板位置是否在屏幕外。 |
| 按钮没有反应 | 转发全部事件，每个渲染帧调用一次 Update。 |
| 面板无法移动或调整大小 | 初始几何使用 `FirstUseEver`，无条件设置会每帧覆盖用户操作。 |
| 折叠时出现断言 | 即使 Begin 返回 false，也要调用 End。 |
| 退出时失败 | 先停止循环，再 Shutdown，最后关闭仍然存活的窗口。 |

Dear ImGui 通常把面板位置保存到进程工作目录下的 `imgui.ini`。应用应明确工作目录；重新运行不代表自动恢复初始布局。

下一章：[控件与持久状态](widgets.zh-CN.md)。API：[Init](/reference/imgui/functions/SFML.Init.html)、[Update](/reference/imgui/functions/SFML.Update.html)、[Render](/reference/imgui/functions/SFML.Render.html)、[Begin](/reference/imgui/functions/ImGui.Begin.html)。
