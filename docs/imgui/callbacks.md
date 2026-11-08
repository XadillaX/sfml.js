# Text input, callbacks and buffers

An input field edits bytes, a list asks JavaScript for labels, and a plot asks for values. Run the complete [workbench](../../packages/sfml.js-imgui/examples/workbench.cjs) to see all three:

```sh
node packages/sfml.js-imgui/examples/workbench.cjs
```

Name updates the text displayed below it; Selection changes the chosen object; Frame ms reads a ring buffer of frame timings. Focus Name to update the callback byte counter. `CallbackAlways` means each active edit callback, not an unconditional application callback while the field is inactive.

## Store and read UTF-8 text

Create a buffer once, outside the frame. Its capacity is in **bytes**, including a trailing zero. Character count is not byte count: many non-ASCII characters occupy several UTF-8 bytes.

These helpers reject overflow instead of cutting a multibyte character in half:

```js
const name = new Uint8Array(128);

function writeText(target, value) {
  const bytes = Buffer.from(value, 'utf8');
  if (value.includes('\0') || bytes.length >= target.length) {
    throw new RangeError('Text needs room for one trailing zero byte');
  }
  target.fill(0);
  target.set(bytes);
}

function readText(source) {
  const end = source.indexOf(0);
  return Buffer.from(source.subarray(0, end < 0 ? source.length : end))
    .toString('utf8');
}

writeText(name, 'Scene');
```

After initialization, call the following inside a visible window on each frame:

```js
if (ImGui.InputText('Name', name, name.length)) {
  console.log(readText(name));
}
```

The default return value reports a content change. With `EnterReturnsTrue`, it instead reports Enter confirmation; choose the flag according to whether the application saves continuously or on confirmation. The buffer contains the editable state regardless of the return value.

Do not rewrite the buffer from the old application string every frame: that fights the current edit. Initialize it, let ImGui edit it, and explicitly synchronize when loading another object or applying a reset. Use a suitable fixed capacity. `CallbackResize` does not turn a JavaScript typed array into a resizable native string; replacing a typed array from the callback is not a supported ownership strategy.

## Inspect callback data synchronously

The plain `InputText` function needs no callback. Use `InputTextEx` when a feature needs JavaScript callback behavior:

```js
let callbackBytes = 0;

function inspectInput(data) {
  const fields = ImGui.viewImGuiInputTextCallbackData(data);
  callbackBytes = fields.BufTextLen;
  return 0;
}

function drawTextEditor() {
  ImGui.InputTextEx(
    'Name',
    name,
    name.length,
    ImGui.ImGuiInputTextFlags.CallbackAlways,
    inspectInput
  );
  ImGui.TextUnformatted(`Current name: ${readText(name)}`);
  ImGui.TextUnformatted(`Last active callback: ${callbackBytes} bytes`);
}
```

`BufTextLen` is the occupied UTF-8 byte length; `BufSize` is capacity. The data handle and its view are borrowed for this invocation. Copy the scalar or text that the application needs; do not retain the view, await inside the callback or use it from a timer. The callback returns the number required by its contract, usually zero for default handling.

## Supply list and plot data

Keep the selection array and data outside the frame; keep a stable row order during each call. A getter can be invoked repeatedly, so make it fast and free of side effects:

```js
const labels = [ 'Player', 'Light', 'Camera' ];
const selected = new Int32Array([ 0 ]);
const timings = new Float32Array([ 16, 17, 15, 19, 16 ]);

function drawData() {
  ImGui.ListBoxCallbackEx(
    'Selection',
    selected,
    labels.length,
    index => labels[index]
  );
  ImGui.TextUnformatted(`Selected: ${labels[selected[0]]}`);
  ImGui.PlotLinesCallbackEx(
    'Frame ms',
    timings.length,
    index => timings[index],
    null,
    0,
    null,
    0,
    40,
    [ 0, 70 ]
  );
}
```

Call `drawData()` inside a visible window. Indices are zero-based. If the data shrinks, clamp the selection before reading an item; render an empty state rather than indexing an empty list. For a ring buffer, pass the oldest sample's offset as `valuesOffset`, as workbench does.

Load remote data before rendering and update the application model when it arrives. An `async` getter returns a Promise where the binding requires an immediate string or number; it cannot pause native rendering.

## Know which memory you own

| Value | Owner | Validity |
| --- | --- | --- |
| Application `Uint8Array` / `Float32Array` | JavaScript | Keep it alive for every call that reads or writes it |
| Text callback handle / view | Current native callback | Only during that callback |
| IO, style, fonts | ImGui context / atlas | Do not use after the owner is destroyed or rebuilt incompatibly |
| Storage reference view | Native storage | Structural changes may invalidate its address |
| Draw list and draw command callback handles | Renderer | Use only during the documented frame or callback scope |

`AddCallbackEx` runs later, when the renderer processes the draw list, normally inside `SFML.Render`. It is not the place to declare widgets. Keep captured resources and any `userData` target alive until every possible invocation completes. Cloned draw lists may replay callbacks independently; merely completing the current frame does not end their lifetime.

Native handles and opaque pointer parameters are not JavaScript callbacks. Do not cast a function to `bigint` or pass it to a raw pointer API. Use the `Ex` wrapper whose reference explicitly accepts a JavaScript function.

If input truncates, check capacity in bytes and its zero terminator. If characters render as boxes but decode correctly, check [font coverage](fonts.md). If a callback fails, first check its return type, flag and borrowed-data lifetime.

API: [InputTextEx](/reference/imgui/functions/ImGui.InputTextEx.html), [ListBoxCallbackEx](/reference/imgui/functions/ImGui.ListBoxCallbackEx.html), [PlotLinesCallbackEx](/reference/imgui/functions/ImGui.PlotLinesCallbackEx.html), [AddCallbackEx](/reference/imgui/functions/ImGui.AddCallbackEx.html).
