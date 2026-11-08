# ImGui API 使用指南

通过任务式教程理解用法后，用 [API 参考](/reference/imgui/)核对参数和返回值。总览摘要帮助定位操作，详情页提供使用说明、参数、返回值和原生资源有效期。

## 找到正确入口

| 任务 | 入口 | 教程 |
| --- | --- | --- |
| 集成原生窗口 | `SFML.Init`、`ProcessEvent`、`Update`、`Render`、`Shutdown` | [快速开始](getting-started.zh-CN.md) |
| 声明控件 | `ImGui.Button`、`Checkbox`、`SliderFloatEx` | [控件](widgets.zh-CN.md) |
| 组织面板 | `BeginChild`、`BeginTable`、菜单与弹窗函数 | [布局](layout.zh-CN.md) |
| 编辑 UTF-8、传入回调 | `InputTextEx`、`ListBoxCallbackEx`、`PlotLinesCallbackEx` | [回调](callbacks.zh-CN.md) |
| 加载字体、修改样式 | 顶层 `getFontAtlas`、`getStyleColors`；`SFML.GetStyle` | [字体](fonts.zh-CN.md) |
| 绘制图元、切换窗口 | `ImGui.GetWindowDrawList`、`SFML.SetCurrentWindow` | [渲染](rendering.zh-CN.md) |

## 把签名读成 JavaScript 契约

例如 [SliderFloatEx](/reference/imgui/functions/ImGui.SliderFloatEx.html)接收可写 Float32Array、两个数值边界、格式字符串和标志，布尔返回值表示是否编辑，当前值从数组中读取。原生参数名不会让 JavaScript 数字具备写回能力。

重载名称明确区分：Button 使用默认尺寸，ButtonEx 接受大小；PushStyleVar 接受标量，PushStyleVarVec2 接受向量。Ex 不总是表示「带回调」，应查看具体签名。

`ImVec2Like` 接受 `[ x, y ]` 或 `{ x, y }` 等向量值；可写数值指针则要求该函数声明的类型化数组。`ImGuiInputTextCallbackData` 等结构体句柄是绑定返回的带类型标记的不透明对象。纹理 ID 和原始指针参数使用 `bigint`，与结构体句柄不能互换，也不能猜测地址来构造。

`ImGui.GetIO()`、`ImGui.GetStyle()` 返回原生句柄；`SFML.GetIO()`、`SFML.GetStyle()` 返回当前窗口的便捷可写字段视图。要求句柄的辅助函数不能接收便捷视图。

## 调用前核对

1. 是否要求已初始化的上下文、活动帧或可见父窗口。
2. 参数会被复制、原地修改，还是仅借用。
3. 可选 null 是否关闭某项功能，例如窗口关闭按钮。
4. 布尔返回值表示激活、编辑、选择，还是可见性。
5. 需要哪一个 End/Pop，以及何时必须调用。
6. 返回句柄和视图的有效期。

源码声明便于 TypeScript 工具提示和实现核对：[包导出](../../packages/sfml.js-imgui/src/index.ts)、[SFML 集成](../../packages/sfml.js-imgui/src/sfml.ts)、[ImGui 模块](../../packages/sfml.js-imgui/src/imgui/index.ts)。

API 说明紧贴声明维护，包含英、中、日、韩四语摘要与详情，由 TypeDoc 直接读取。反馈文档问题时，请提供准确函数、语言、预期 JavaScript 调用和实际结果。
