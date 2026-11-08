# Widgets and state

Build controls that edit the scene immediately and retain their values across frames. Run the complete [scene inspector](../../packages/sfml.js-imgui/examples/scene-inspector.cjs):

```sh
node packages/sfml.js-imgui/examples/scene-inspector.cjs
```

Animate pauses the circle; Speed changes its orbit; Radius and Color modify its SFML geometry and fill. Reset restores the original values. The example includes the event loop, input capture and shutdown described in [quick start](getting-started.md).

## State lives outside the frame

Dear ImGui uses immediate mode: the application declares the controls on each frame. It retains UI interaction state such as focus, while the application owns the values being edited. Calling a widget again does not mean allocating a fresh value each time.

Native writable scalar arguments map to typed arrays:

| Control or value | Application storage | Read the result |
| --- | --- | --- |
| Checkbox, optional window open flag | `new Uint8Array([ 1 ])` | `state[0] !== 0` |
| Integer input, selected item index | `new Int32Array([ 0 ])` | `state[0]` |
| Slider or float input | `new Float32Array([ 0.5 ])` | `state[0]` |
| RGB / RGBA color | `Float32Array` with 3 / 4 entries | Channels in the range 0–1 |
| Editable text | Zero-terminated `Uint8Array` | Decode UTF-8; see [buffers](callbacks.md). |

A JavaScript number is passed by value and cannot receive a native pointer write. A regular array is appropriate for a vector value such as `[ 320, 160 ]`, but does not replace a writable `Float32Array` argument.

## Make an editable panel

To run this smaller variation, keep the imports, window and loop from quick start, replace its `drawControls` function with the one below, and put the state declarations before the loop:

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

The close button writes zero into `panelOpen`. A menu or application action can set it to one to reopen the panel. Collapse only skips its content; it does not close it. Do not reuse a zero open flag for a panel that should always remain visible.

`Button` reports activation. `Checkbox`, `SliderFloatEx` and `ColorEdit3` report edits; their return value is not the edited value. Read the array even when the return value is false if the scene needs the current state. `AlwaysClamp` also constrains direct text entry in the slider; a drag range alone is not sufficient validation for every input mode.

Keep SFML objects alive across frames. In the inspector, an edited radius calls `circle.setRadius`, then updates the origin so the circle remains centered. Color channels are converted with `Math.round(channel * 255)` before creating an SFML color. The scene advances with `seconds * speed[0]` only when `enabled[0]` is nonzero.

## Give repeated controls stable identities

Labels are also part of widget IDs. Two buttons named Reset in the same scope conflict even when they are drawn at different positions.

| Form | Visible label | Identity |
| --- | --- | --- |
| `Reset##player` | Reset | Includes `##player` |
| `Reset##camera` | Reset | Different from the player button |
| `FPS: 60###stats` | FPS: 60 | Stable `stats` suffix even as FPS changes |
| `PushID(row.id)` + `Checkbox('##enabled', ...)` | No checkbox text | Scoped by the stable row ID |

Use object IDs rather than array indices when rows may be sorted, inserted or removed. Otherwise an active control can inherit another row's identity after reordering. This complete loop runs inside a visible ImGui window; create `rows` outside the frame:

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

Call `drawRows()` inside the successful `Begin` branch. Always pop the ID in the same scope where it was pushed; use `try/finally` if work in that scope can throw and you intend to recover.

## Text, precision and ownership

Use `TextUnformatted` for filenames, user content and template strings. It does not interpret `%` as a formatting instruction. Use formatted wrappers only when you intentionally need their formatting contract.

`Float32Array` has single-precision storage; formatting a value with `toFixed` changes only the displayed text. Keep a separate higher-precision application model when necessary, and explicitly decide when widget edits should update it.

Arrays created by your application remain JavaScript-owned. Views from `Storage_GetIntRef`, style accessors and callback accessors are borrowed native memory, with different lifetime rules. A reachable JavaScript view does not keep a deleted context or an invalidated storage entry usable. Read [callback and buffer lifetimes](callbacks.md) before retaining these views.

Common mistakes are allocating state inside `drawControls` (values reset), using the widget return value as the state (only the edit frame is true), or giving repeated rows the same ID (interaction conflicts).

Continue with [layout and tool panels](layout.md). API: [Checkbox](/reference/imgui/functions/ImGui.Checkbox.html), [SliderFloatEx](/reference/imgui/functions/ImGui.SliderFloatEx.html), [PushID](/reference/imgui/functions/ImGui.PushID.html), [TextUnformatted](/reference/imgui/functions/ImGui.TextUnformatted.html).
