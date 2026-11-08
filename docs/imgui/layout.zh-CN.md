# 布局与工具面板

把独立控件组织成含菜单、对象表格和确认弹窗的编辑器。[工作台完整源码](../../packages/sfml.js-imgui/examples/workbench.cjs)提供帧循环和持久状态：

```sh
node packages/sfml.js-imgui/examples/workbench.cjs
```

编辑 Name、选择对象、切换表格复选框。通过 Scene → Reset 打开模态弹窗；Cancel 保留数据，Reset 恢复初值。本章说明该程序中的布局组织方式。

## 使用布局游标

控件默认向下排列。`SameLine()` 把下一项放到上一项旁边，`Separator()` 分隔内容，`Dummy([ width, height ])` 为自定义内容预留空间。优先用这些操作与表格组织布局。

`SetNextWindowSize(size, FirstUseEver)` 设置初始大小，同时尊重用户调整和已保存的配置。宽度需要容纳标签与输入区；窄面板的工具栏可改为纵向排列，连续调用 `SameLine` 不会自动形成响应式换行。

在可见父窗口内，用子窗口创建独立滚动区域：

```js
if (ImGui.BeginChild(
  'help',
  [ 0, 100 ],
  ImGui.ImGuiChildFlags.Borders
)) {
  ImGui.TextUnformatted('Select an object, then edit its enabled flag.');
  ImGui.TextUnformatted('This area scrolls separately from the parent.');
}
ImGui.EndChild();
```

宽度零使用父窗口剩余宽度。内容被裁剪、BeginChild 返回 false 时，仍需调用 `EndChild()`。

## 用表格对齐属性

工作台的 `rows` 包含稳定 ID、标签和持久 `Uint8Array`。下面是完整表格函数，在父窗口 Begin 成功的分支中调用：

```js
function drawRows() {
  const flags =
    ImGui.ImGuiTableFlags.Borders +
    ImGui.ImGuiTableFlags.RowBg +
    ImGui.ImGuiTableFlags.Resizable;
  if (ImGui.BeginTable('objects', 2, flags)) {
    ImGui.TableSetupColumn('Object');
    ImGui.TableSetupColumn('Enabled');
    ImGui.TableHeadersRow();
    for (const row of rows) {
      ImGui.PushID(row.id);
      ImGui.TableNextRow();
      ImGui.TableNextColumn();
      ImGui.TextUnformatted(row.label);
      ImGui.TableNextColumn();
      ImGui.Checkbox('##enabled', row.enabled);
      ImGui.PopID();
    }
    ImGui.EndTable();
  }
}
```

`TableNextRow` 推进一行，`TableNextColumn` 进入单元格。列标题说明无文字复选框的含义，`PushID` 区分它们的交互状态。调整列宽不应改变行身份。数据很多时，用 list clipper API 仅提交可见范围，避免每帧格式化全部行。

## 从操作打开弹窗

`OpenPopup` 请求打开，`BeginPopupModal` 在后续每帧声明内容。不要每帧无条件 OpenPopup，否则会妨碍正常关闭。弹窗 ID 也依赖 ID 栈：请求与声明必须使用同一作用域。

下面是工作台的菜单模式，`reset()` 是应用恢复状态的函数：

```js
function drawMenu() {
  let requestReset = false;
  if (ImGui.BeginMenuBar()) {
    if (ImGui.BeginMenu('Scene')) {
      requestReset = ImGui.MenuItem('Reset...');
      ImGui.EndMenu();
    }
    ImGui.EndMenuBar();
  }
  if (requestReset) {
    ImGui.OpenPopup('Reset scene?');
  }
  if (ImGui.BeginPopupModal(
    'Reset scene?',
    null,
    ImGui.ImGuiWindowFlags.AlwaysAutoResize
  )) {
    ImGui.TextUnformatted('Restore the current scene settings?');
    if (ImGui.Button('Reset')) {
      reset();
      ImGui.CloseCurrentPopup();
    }
    ImGui.SameLine();
    if (ImGui.Button('Cancel')) {
      ImGui.CloseCurrentPopup();
    }
    ImGui.EndPopup();
  }
}
```

父窗口使用 `ImGui.Begin('Workbench', null, ImGui.ImGuiWindowFlags.MenuBar)`，并在其内部调用 `drawMenu()`。请求在菜单作用域结束后发出，与模态弹窗声明处于同一作用域。模态弹窗阻止其他 ImGui 窗口接收交互，不会暂停 JavaScript 场景更新。

## 正确配对作用域

| 开始调用 | 对应结束 | 结束条件 |
| --- | --- | --- |
| `Begin` | `End` | 只要调用了 Begin，就必须结束 |
| `BeginChild` | `EndChild` | 只要调用了 BeginChild，就必须结束 |
| `BeginTable` | `EndTable` | 仅在 BeginTable 返回 true 时 |
| `BeginMenuBar` / `BeginMenu` | `EndMenuBar` / `EndMenu` | 仅在对应 Begin 返回 true 时 |
| `BeginPopup` / `BeginPopupModal` | `EndPopup` | 仅在对应 Begin 返回 true 时 |
| `PushID`、`PushFont`、样式 Push | 对应 Pop | 每次 Push 对应一次 Pop，按相反顺序退出嵌套 |

弹窗不出现时，检查 ID 作用域，以及每帧是否执行声明。布局断言先查配对。控件修改了错误的行时，先查稳定 ID。

下一章：[文本输入与回调](callbacks.zh-CN.md)。API：[BeginTable](/reference/imgui/functions/ImGui.BeginTable.html)、[BeginChild](/reference/imgui/functions/ImGui.BeginChild.html)、[OpenPopup](/reference/imgui/functions/ImGui.OpenPopup.html)、[BeginPopupModal](/reference/imgui/functions/ImGui.BeginPopupModal.html)。
