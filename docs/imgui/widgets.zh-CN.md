# 控件与状态

让控件实时修改场景，并在帧间保留编辑结果。运行完整的[场景检查器](../../packages/sfml.js-imgui/examples/scene-inspector.cjs)：

```sh
node packages/sfml.js-imgui/examples/scene-inspector.cjs
```

Animate 暂停圆形，Speed 调整轨道速度，Radius 和 Color 修改 SFML 几何与填充色，Reset 恢复初值。源码包含[快速开始](getting-started.zh-CN.md)介绍的事件循环、输入捕获和退出清理。

## 状态在帧循环外

Dear ImGui 使用即时模式：应用每帧声明控件。ImGui 保留焦点等交互状态，应用持有被编辑的值。每帧重新调用控件函数，不代表每帧重新分配状态。

原生可写标量参数使用类型化数组：

| 控件或数据 | 应用存储 | 读取方式 |
| --- | --- | --- |
| 复选框、可选的窗口打开标志 | `new Uint8Array([ 1 ])` | `state[0] !== 0` |
| 整数输入、选中项索引 | `new Int32Array([ 0 ])` | `state[0]` |
| 滑块、浮点输入 | `new Float32Array([ 0.5 ])` | `state[0]` |
| RGB / RGBA 颜色 | 3 / 4 个元素的 `Float32Array` | 0–1 范围内的通道值 |
| 可编辑文本 | 零结尾的 `Uint8Array` | 按 UTF-8 解码，见[缓冲区](callbacks.zh-CN.md)。 |

JavaScript 数字按值传递，不能接收原生指针写回。普通数组适用于 `[ 320, 160 ]` 这样的向量值，不能代替要求可写的 `Float32Array`。

## 实现可编辑面板

保留快速开始中的导入、窗口与循环，把 `drawControls` 替换为下列函数，并把状态声明放在循环之前，即可运行这一简化版本：

```js
const enabled = new Uint8Array([ 1 ]);
const speed = new Float32Array([ 1 ]);
const tint = new Float32Array([ 0.25, 0.75, 0.95 ]);
const panelOpen = new Uint8Array([ 1 ]);

function drawControls() {
  if (!panelOpen[0]) {
    return;
  }
  if (ImGui.Begin('Controls', panelOpen)) {
    ImGui.Checkbox('Animate', enabled);
    const changed = ImGui.SliderFloatEx(
      'Speed',
      speed,
      0,
      3,
      '%.2f',
      ImGui.ImGuiSliderFlags.AlwaysClamp
    );
    ImGui.ColorEdit3('Tint', tint);
    if (changed) {
      console.log(`New speed: ${speed[0]}`);
    }
    if (ImGui.Button('Reset')) {
      enabled[0] = 1;
      speed[0] = 1;
      tint.set([ 0.25, 0.75, 0.95 ]);
    }
    ImGui.TextUnformatted(`Speed: ${speed[0].toFixed(2)}`);
  }
  ImGui.End();
}
```

关闭按钮把 `panelOpen` 写为零；菜单或应用操作可将其设为一，重新打开面板。折叠仅跳过内容，不会关闭面板。需要始终显示的面板不要沿用值为零的打开标志。

`Button` 返回是否激活，`Checkbox`、`SliderFloatEx` 和 `ColorEdit3` 返回是否编辑，返回值都不是当前状态。场景每帧需要当前值时，直接读数组，不必等返回 true。`AlwaysClamp` 还限制滑块的直接文本输入；拖动范围不能代替所有输入模式的校验。

SFML 对象同样跨帧复用。检查器修改半径后调用 `circle.setRadius`，再更新原点以保持居中。颜色通道通过 `Math.round(channel * 255)` 转为 SFML 颜色；仅在 `enabled[0]` 非零时，用 `seconds * speed[0]` 推进动画。

## 重复控件需要稳定 ID

标签也是控件 ID 的组成部分。同一作用域中两个 Reset 按钮，即使位置不同，也会冲突。

| 写法 | 显示文字 | 身份 |
| --- | --- | --- |
| `Reset##player` | Reset | 包含 `##player` |
| `Reset##camera` | Reset | 与 player 按钮不同 |
| `FPS: 60###stats` | FPS: 60 | FPS 改变时，`stats` 身份不变 |
| `PushID(row.id)` + `Checkbox('##enabled', ...)` | 无复选框文字 | 由稳定的行 ID 区分 |

行可能排序、增删时，使用对象 ID，避免使用数组下标，否则交互状态可能在重排后落到另一行。将 `rows` 放在帧循环外，下面的函数在可见窗口内调用：

```js
const rows = [
  { id: 'player', label: 'Player', enabled: new Uint8Array([ 1 ]) },
  { id: 'camera', label: 'Camera', enabled: new Uint8Array([ 0 ]) },
];

function drawRows() {
  for (const row of rows) {
    ImGui.PushID(row.id);
    ImGui.Checkbox('Enabled', row.enabled);
    ImGui.SameLine();
    ImGui.TextUnformatted(row.label);
    ImGui.PopID();
  }
}
```

在 Begin 成功的分支中调用 `drawRows()`。Push 与 Pop 必须在相同作用域配对；作用域内操作可能抛错且程序准备恢复时，用 `try/finally` 保证平衡。

## 文本、精度与所有权

文件名、用户输入和模板字符串使用 `TextUnformatted`，它不会把 `%` 解释为格式指令。确实需要格式化时再使用对应包装函数。

`Float32Array` 使用单精度；`toFixed` 只改变显示文字。有更高精度要求时，保留独立的应用模型，并明确何时将控件编辑同步进去。

应用创建的数组由 JavaScript 持有。`Storage_GetIntRef`、样式和回调访问器返回的视图借用原生内存，其生命周期不同。视图仍可被 JavaScript 引用，不代表已销毁的上下文或失效的存储地址仍可访问，详见[回调与缓冲区](callbacks.zh-CN.md)。

值每帧复位时检查状态是否声明在函数内部；值仅在编辑帧为真时检查是否误用了返回值；重复行操作串扰时检查 ID。

下一章：[布局与工具面板](layout.zh-CN.md)。API：[Checkbox](/reference/imgui/functions/ImGui.Checkbox.html)、[SliderFloatEx](/reference/imgui/functions/ImGui.SliderFloatEx.html)、[PushID](/reference/imgui/functions/ImGui.PushID.html)、[TextUnformatted](/reference/imgui/functions/ImGui.TextUnformatted.html)。
