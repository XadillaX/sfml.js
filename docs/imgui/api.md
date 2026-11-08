# ImGui API guide

Use the [API reference](/reference/imgui/) to confirm an argument or return value after following the task-oriented guides. Its summaries identify operations; detail pages contain usage notes, parameters, return values and native lifetime restrictions.

## Find the right namespace

| Task | Entry point | Tutorial |
| --- | --- | --- |
| Integrate a native window | `SFML.Init`, `ProcessEvent`, `Update`, `Render`, `Shutdown` | [Quick start](getting-started.md) |
| Declare a control | `ImGui.Button`, `Checkbox`, `SliderFloatEx` | [Widgets](widgets.md) |
| Organize a panel | `BeginChild`, `BeginTable`, menu and popup functions | [Layout](layout.md) |
| Edit UTF-8 or supply callbacks | `InputTextEx`, `ListBoxCallbackEx`, `PlotLinesCallbackEx` | [Callbacks](callbacks.md) |
| Load fonts or edit style | Top-level `getFontAtlas`, `getStyleColors`; `SFML.GetStyle` | [Fonts](fonts.md) |
| Draw primitives or switch windows | `ImGui.GetWindowDrawList`, `SFML.SetCurrentWindow` | [Rendering](rendering.md) |

## Read a signature as a JavaScript contract

For example, [SliderFloatEx](/reference/imgui/functions/ImGui.SliderFloatEx.html) accepts a writable `Float32Array`, two numeric bounds, a format string and flags. Its boolean return reports an edit; the current value is in the array. The native parameter name does not make a JavaScript number writable.

Overload names are explicit. `Button` is the default-size form; `ButtonEx` accepts a size. `PushStyleVar` takes a scalar; `PushStyleVarVec2` takes a vector. `Ex` does not universally mean “callback”: inspect each signature rather than inferring parameters from its suffix.

`ImVec2Like` accepts supported vector values such as `[ x, y ]` or `{ x, y }`. A pointer to editable numeric data instead requires the typed array documented by that function. Struct handles, such as `ImGuiInputTextCallbackData`, are opaque branded objects returned by the binding. Texture IDs and raw pointer arguments use `bigint`; they are not interchangeable with struct handles. Never construct either from guessed addresses.

`ImGui.GetIO()` and `ImGui.GetStyle()` return native handles. `SFML.GetIO()` and `SFML.GetStyle()` provide convenient writable field views for the currently selected window. A helper that accepts a handle cannot be given the convenience view instead.

## Check these details before calling

1. Whether the operation requires an initialized context, an active frame or a visible parent window.
2. Whether an argument is copied, modified in place or borrowed.
3. Whether optional `null` disables a feature, such as a window close button.
4. Whether a boolean means activation, content changed, selection, or visibility.
5. Which matching End/Pop operation is required and under which condition.
6. How long returned handles and views remain usable.

The source declarations are useful for TypeScript tooling and implementation inspection: [package exports](../../packages/sfml.js-imgui/src/index.ts), [SFML integration](../../packages/sfml.js-imgui/src/sfml.ts), [ImGui modules](../../packages/sfml.js-imgui/src/imgui/index.ts).

API descriptions live beside those declarations, with English, Chinese, Japanese and Korean summaries and details. TypeDoc reads them directly. When reporting a documentation problem, include the exact function, language, expected JavaScript call and observed result.
