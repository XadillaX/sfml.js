# Rendering and multiple windows

Combine SFML scene drawing with ImGui controls, add a custom shape within a panel, and understand which resources belong to each window. Run the [scene inspector](../../packages/sfml.js-imgui/examples/scene-inspector.cjs) for scene composition or the [workbench](../../packages/sfml.js-imgui/examples/workbench.cjs) for an in-panel drawing:

```sh
node packages/sfml.js-imgui/examples/scene-inspector.cjs
node packages/sfml.js-imgui/examples/workbench.cjs
```

Run one command at a time; closing its window exits that example. The inspector draws an animated SFML circle behind its controls. Workbench reserves space for a colored ImGui circle next to its selected-object label.

## Submit scene content before the UI

The inspector follows this order on every frame:

```js
SFML.Update(window, seconds);
drawControls(seconds);
window.clear(background);
window.draw(circle);
SFML.Render(window);
window.display();
```

Here `seconds`, `background`, `circle` and `drawControls` come from the complete inspector. The controls edit the model before its scene draw is recorded. `SFML.Render` calls `window.flush()` before invoking the backend, so recorded SFML drawing reaches the render target before the UI overlay.

Do not clear the window after rendering the UI: that erases it. Drawing SFML content after `SFML.Render` can put it over the controls. This sequence handles the normal overlay case without manually managing OpenGL state.

## Draw inside a panel

Use the current window's draw list for decorative graphics that follow its clipping. The complete workbench uses this pattern inside its visible window:

```js
function drawPreview() {
  const origin = ImGui.GetCursorScreenPos();
  const list = ImGui.GetWindowDrawList();
  if (list) {
    ImGui.ImDrawList_AddCircleFilled(
      list,
      [ origin.x + 48, origin.y + 48 ],
      32,
      ImGui.GetColorU32(ImGui.ImGuiCol.PlotHistogram)
    );
  }
  ImGui.Dummy([ 96, 96 ]);
  ImGui.SameLine();
  ImGui.TextUnformatted('Custom preview');
}
```

Call `drawPreview()` after `Begin` succeeds. Draw-list coordinates are screen coordinates; `GetCursorScreenPos` is a suitable origin. The packed color comes from the current style, avoiding assumptions about byte packing. `Dummy` advances normal layout because draw-list commands alone do not reserve space or create an interactive item.

If the graphic needs clicks or dragging, pair the reserved area with an appropriate item such as `InvisibleButtonEx` and use item/mouse queries to update application state. A visible primitive alone does not participate in input handling.

## Treat texture IDs as backend resources

`ImGui.Image` takes a backend texture identifier as a `bigint`; it does not accept an `sf.Texture` object or a filename. Do not invent an ID by converting a JavaScript object or an interop pointer to `bigint`: a native object address and a GPU texture identifier have different meanings.

Use an explicitly supported texture-ID bridge when integrating images. The [interop guide](../interop/README.md) explains native object sharing, but an object handle by itself is not an ImGui texture-ID adapter. Keep the actual GPU texture alive until rendering has consumed every command that references it. For scene previews without a verified texture bridge, draw with SFML in the same window, as the inspector does.

## Manage contexts per native window

Each `SFML.Init(window)` establishes the integration for that native window. An ImGui panel created by `Begin` is not a second SFML window. Multiple SFML windows require multiple init/update/render/shutdown sequences.

The repository's runnable [multi-window test](../../packages/sfml.js-imgui/test/multi-window.test.cjs) verifies context switching. For application code:

1. Initialize each open window and retain its state and clock.
2. Select it with `SFML.SetCurrentWindow(window)` before accessing context-owned fonts, style or IO.
3. Forward its events, start its frame and declare its controls.
4. Clear and render that window, then display it.
5. On close, call `SFML.Shutdown(window)` before `window.close()` and remove it from further frame processing.

`ProcessEvent`, `Update` and `Render` select the relevant integration context, but do not rely on whichever unrelated window happened to run last when loading fonts or editing style. Fonts and borrowed views belong to their original context; do not reuse them as handles in another window.

Use elapsed time per window if their update schedules differ. A single clock restarted separately for each window measures the gap between windows, not each window's frame duration.

## Keep frame resources within their lifetime

Acquire draw lists for the current frame; do not cache them through shutdown or assume their contents survive the next frame. A JavaScript reference to a native handle is not an ownership guarantee.

`AddCallbackEx` callbacks execute during rendering, after the widget-building phase. They must not call `Begin`, add widgets, switch contexts, or destroy resources still referenced by the renderer. If you clone draw lists, account for their independent lifetime and callback retention; see [callbacks](callbacks.md).

If a custom shape overlaps the next widget, reserve its area. If it appears at the wrong position, check screen versus local coordinates. If a multi-window UI uses the wrong style or font, check context selection before changing the data.

API: [Render](/reference/imgui/functions/SFML.Render.html), [GetWindowDrawList](/reference/imgui/functions/ImGui.GetWindowDrawList.html), [ImDrawList_AddCircleFilled](/reference/imgui/functions/ImGui.ImDrawList_AddCircleFilled.html), [SetCurrentWindow](/reference/imgui/functions/SFML.SetCurrentWindow.html).
