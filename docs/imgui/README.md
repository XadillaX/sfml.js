# ImGui guide

Use `sfml.js-imgui` to build debug panels, scene inspectors and native editor controls in an SFML window. The guides take you from the first frame loop to a tool with editable state, tables, text input, fonts and custom rendering.

The current sources target Dear ImGui 1.91.9b and imgui-sfml 3.0. Examples use JavaScript and the SFML 3.1 API. Start with basic JavaScript and the [SFML window guide](../sfml/window.md); C++ knowledge is not required.

## Follow the learning path

| Chapter | What you will build or learn |
| --- | --- |
| [Quick start](getting-started.md) | A complete counter, the frame lifecycle, input capture and safe shutdown |
| [Widgets and state](widgets.md) | Persistent editable values, unique IDs and a live scene inspector |
| [Layout and tool panels](layout.md) | A table, a menu, a confirmation modal and correct scope pairing |
| [Text input and callbacks](callbacks.md) | UTF-8 editing, callback contracts, list getters and plots |
| [Fonts and style](fonts.md) | Font atlas loading, CJK coverage, spacing, colors and DPI considerations |
| [Rendering and multiple windows](rendering.md) | Scene/UI composition, draw lists and per-window resource ownership |
| [API guide](api.md) | How to find exact signatures, overloads and lifetime contracts |

Each practical chapter links a complete runnable source, explains where its smaller snippets belong and describes what to expect. All chapters are maintained in English, Chinese, Japanese and Korean.

## Choose a runnable example

From the monorepo root, run bootstrap once, then launch an example:

```sh
node tools/bootstrap.cjs
node packages/sfml.js-imgui/examples/demo.cjs
```

- [Widget demo](../../packages/sfml.js-imgui/examples/README.md#demo): explore Dear ImGui's built-in widget and layout catalogue.
- [Scene inspector](../../packages/sfml.js-imgui/examples/README.md#scene-inspector): change a moving SFML circle's size, color and speed.
- [Workbench](../../packages/sfml.js-imgui/examples/README.md#workbench): combine text editing, object selection, a table, a modal and a timing plot.

## Understand the package boundary

`ImGui` exports the controls, enums, callback wrappers and native-handle operations. `SFML` integrates a native window, forwards its events and submits frames. Helpers such as `getFontAtlas` and `getStyleColors` are top-level exports.

Application values live in JavaScript; writable native scalar arguments use typed arrays. IO/style views, fonts and draw lists have native owners and limited lifetimes. The guides explain this boundary where each feature needs it; use the [API reference](/reference/imgui/) for the exact contract.
