# Layout and tool panels

Turn separate controls into an editor with a menu, object table and confirmation dialog. The complete [workbench source](../../packages/sfml.js-imgui/examples/workbench.cjs) supplies the frame loop and persistent state:

```sh
node packages/sfml.js-imgui/examples/workbench.cjs
```

Edit Name, choose an object and toggle its table checkbox. Scene → Reset opens a modal; Cancel preserves the data and Reset restores it. This chapter explains the layout functions used by that runnable program.

## Work with the layout cursor

Widgets normally advance vertically. `SameLine()` places the next item beside the previous one, `Separator()` creates a visual division, and `Dummy([ width, height ])` reserves an area for custom content. Prefer these operations and tables to positioning each widget with fixed screen coordinates.

`SetNextWindowSize(size, FirstUseEver)` sets initial geometry while respecting later resizing and saved settings. Use a size that leaves room for labels and editable values. On a narrow panel, a short toolbar can wrap manually or become a vertical group; a long row of `SameLine` calls will not automatically adapt.

For an independently scrolling region, use a child window inside a visible parent:

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

Zero width uses the available parent width. The child still needs `EndChild()` when its contents are clipped and `BeginChild()` returns false.

## Align values with a table

In workbench, `rows` is an array of stable IDs, labels and persistent `Uint8Array` values. The following is its complete table function; call it inside the parent's successful `Begin` branch:

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

`TableNextRow` advances the row; `TableNextColumn` selects each cell. Column headings explain the unlabeled checkboxes, while `PushID` distinguishes their input state. Resizing a column affects layout, not row identity. For many rows, use the list clipper APIs to submit the visible range rather than formatting every row every frame.

## Open a popup from an action

`OpenPopup` requests opening; `BeginPopupModal` declares the contents on subsequent frames. Calling `OpenPopup` every frame prevents normal dismissal. Popup IDs also depend on the ID stack: request and declaration must use the same scope.

This is the workbench menu pattern. `reset()` is the application's state-reset function:

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

The parent must use `ImGui.Begin('Workbench', null, ImGui.ImGuiWindowFlags.MenuBar)`. Call `drawMenu()` inside that window. The request is deliberately made after closing the menu scope, where the modal is declared. A modal blocks interaction with other ImGui windows; it does not stop your JavaScript scene update.

## Match the scope rules

| Opening call | Matching call | When to close |
| --- | --- | --- |
| `Begin` | `End` | Always after calling Begin, even if it returns false |
| `BeginChild` | `EndChild` | Always after calling BeginChild |
| `BeginTable` | `EndTable` | Only if BeginTable returned true |
| `BeginMenuBar` / `BeginMenu` | `EndMenuBar` / `EndMenu` | Only if the corresponding Begin returned true |
| `BeginPopup` / `BeginPopupModal` | `EndPopup` | Only if the corresponding Begin returned true |
| `PushID`, `PushFont`, style pushes | Corresponding pop | Once per push, in reverse nesting order |

When a popup never appears, inspect its ID scope and ensure its declaration runs every frame. When layout asserts, inspect scope pairing before changing sizes. When a control acts on the wrong row, inspect stable IDs rather than table coordinates.

Continue with [text input and callbacks](callbacks.md). API: [BeginTable](/reference/imgui/functions/ImGui.BeginTable.html), [BeginChild](/reference/imgui/functions/ImGui.BeginChild.html), [OpenPopup](/reference/imgui/functions/ImGui.OpenPopup.html), [BeginPopupModal](/reference/imgui/functions/ImGui.BeginPopupModal.html).
