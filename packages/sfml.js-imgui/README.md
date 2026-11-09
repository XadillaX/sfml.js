# sfml.js-imgui

[![npm version](https://img.shields.io/npm/v/sfml.js-imgui.svg?style=for-the-badge&colorA=FF69b4&colorB=cc47a4&label=sfml.js-imgui)](https://www.npmjs.org/package/sfml.js-imgui)

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

[Dear ImGui](https://github.com/ocornut/imgui) 1.91.9b integration for [sfml.js](../sfml.js), following [imgui-sfml](https://github.com/SFML/imgui-sfml) 3.0. Build debug panels, scene inspectors and native editor controls inside an SFML window, in JavaScript or TypeScript.

[Quick start](../../docs/imgui/getting-started.md) · [Examples](examples/README.md) · [API reference](https://sfml.js.org/reference/imgui/) · [sfml.js](../sfml.js/README.md)

## Features

- The full Dear ImGui widget set: buttons, sliders, color editors, text input, tables, menus, modals and plots
- Persistent edit state with typed arrays mapped directly to native scalar parameters
- Font atlas control including CJK coverage and custom TTF fonts
- Custom draw lists and per-window ImGui contexts with separate resource ownership
- TypeScript declarations for every exported function, enum and live struct view

`ImGui` exports widgets, enums, callback wrappers and native handle operations. `SFML` handles window integration, event forwarding and frame submission.

## Installation

`sfml.js-imgui` is a peer of `sfml.js`; install both packages together:

```sh
npm install sfml.js sfml.js-imgui
```

Like sfml.js, installation compiles a native addon and requires Python, a C++20 toolchain, a display and OpenGL. Node.js `^18.19.0 || >=20.5.0` is supported. See the [platform requirements](../../docs/sfml/getting-started.md#requirements).

## Counter example

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

## Frame lifecycle

| Stage | Call | Responsibility |
| --- | --- | --- |
| Collect input | `pollEvent` → `SFML.ProcessEvent` | Forward every event, including text, focus and close events. |
| Start a frame | `SFML.Update(window, seconds)` | Update input and timing, then start the ImGui frame. |
| Declare controls | widget calls | Read and update application state; pair every `Begin` with `End`. |
| Draw the UI | `SFML.Render(window)` | Flush recorded SFML drawing and render ImGui. |
| Present | `window.display()` | Display the completed frame. |
| Exit | `SFML.Shutdown(window)` | Release ImGui before closing the still-live native window. |

Use elapsed **seconds**, not milliseconds, and gate scene input with `SFML.GetIO().wantCaptureMouse` / `wantCaptureKeyboard`. Do not call `ImGui.NewFrame()` or `ImGui.Render()` yourself; the backend manages them.

## Examples

![Dear ImGui demo window](examples/screenshots/demo.png)

Three runnable examples are bundled in [`examples`](examples/README.md): the Dear ImGui widget demo, a scene inspector that drives an SFML circle from a panel, and a workbench combining text input, tables, modals and plots.

```sh
# From the monorepo root after running node tools/bootstrap.cjs
node packages/sfml.js-imgui/examples/demo.cjs
node packages/sfml.js-imgui/examples/scene-inspector.cjs
node packages/sfml.js-imgui/examples/workbench.cjs
```

## Documentation

The ImGui guides ship in English, Simplified Chinese, Japanese and Korean:

| Chapter | Content |
| --- | --- |
| [Quick start](../../docs/imgui/getting-started.md) | Complete counter, frame lifecycle, input capture and safe shutdown |
| [Widgets and state](../../docs/imgui/widgets.md) | Persistent edit state, unique IDs and the live scene inspector |
| [Layout](../../docs/imgui/layout.md) | Tables, menus, confirmation modals and scope pairing |
| [Input and callbacks](../../docs/imgui/callbacks.md) | UTF-8 editing, callback contracts, lists and plots |
| [Fonts and styles](../../docs/imgui/fonts.md) | Font atlas, CJK coverage, spacing, colors and DPI |
| [Rendering and windows](../../docs/imgui/rendering.md) | Scene composition, draw lists and per-window ownership |
| [API guide](../../docs/imgui/api.md) | Signatures, overloads and lifetime constraints |

## License

[MIT](../sfml.js/LICENSE).
