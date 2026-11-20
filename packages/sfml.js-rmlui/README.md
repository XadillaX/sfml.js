# sfml.js-rmlui

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

[RmlUi](https://github.com/mikke89/RmlUi) 6.3 integration for [sfml.js](../sfml.js), rendered through SFML 3.1. Define native interfaces with RML documents and RCSS styles, then connect their elements to JavaScript or TypeScript.

[Quick start](../../docs/rmlui/getting-started.md) · [Examples](examples/README.md) · [API reference](https://sfml.js.org/reference/rmlui/) · [sfml.js](../sfml.js/README.md)

Native bindings and TypeScript interfaces are grouped by subsystem. See the
[source layout](../../docs/rmlui/source-layout.md) for module and tool ownership.

## Features

- Load external or in-memory RML; query elements and change classes, attributes, styles and markup.
- Register JavaScript event listeners and switch RCSS themes at runtime.
- Inspect elements, logs and native data models with the [Debugger](../../docs/rmlui/debugger.md), using separate host and target contexts.
- Keep geometry in native memory, with SFML vertex buffers, textures and shaders.
- Render stencil clipping, composited layers, blur and drop shadows.
- Use macOS Retina surfaces with physical-pixel input and density-independent `dp` layout.
- Read API contracts in English, Simplified Chinese, Japanese and Korean.

RmlUi implements its own markup and styling language. It provides [native data models](../../docs/rmlui/data-models.md), [Node/Lua document scripting](../../docs/rmlui/scripts.md), the native Debugger, [SVG/Lottie elements](../../docs/rmlui/vector-elements.md) and native [FreeType, HarfBuzz and bitmap fonts](../../docs/rmlui/fonts.md). Browser DOM APIs and arbitrary browser CSS are unavailable. Gradients, image masks, color/backdrop filters and 3D transforms are implemented; see [renderer coverage](../../docs/rmlui/rendering.md#renderer-coverage).

The RmlUi runtime suites pass on macOS, Linux and Windows. The native SFML/GL3
pixel comparison suite runs on macOS; full VisualTests and application acceptance
have separate coverage records in the [examples](examples/README.md#coverage-and-verification).

## Build and run

These instructions use the current monorepo sources. See the [platform requirements](../../docs/sfml/getting-started.md#requirements) for Node.js, Python, a C++20 toolchain, a display and OpenGL.

```sh
# From the monorepo root, install and build once.
node tools/bootstrap.cjs
cd packages/sfml.js-rmlui
npm run demo
npm run examples -- variables
npm run examples -- --list
```

For an already prepared workspace, build `sfml.js-interop` and `sfml.js` first, then run `npm run build` in this package. On macOS, Xcode Command Line Tools and CMake are required. The dependency step reuses the SFML source/build directories under `sfml.js-interop/third_party` and the matching patched Window library.

## Frame lifecycle

| Stage | Call | Contract |
| --- | --- | --- |
| Initialize | `initialise(window)` | Bind one open `RenderWindow` to the process-wide runtime. |
| Prepare | `loadFontFace`, `createContext`, `loadDocument`, `show` | Load fonts before documents; size the context after initialization. |
| Input | `context.processEvent(event)` | Forward every SFML event directly; false means consumed. |
| Layout | `context.update()` | Update layout, animation and display density. |
| Draw | `window.clear`, scene draws, `window.flush`, `context.render` | Submit pending SFML drawing before the UI. |
| Present | `window.display()` | Present the completed frame. |
| Exit | Remove listeners, `context.remove`, `shutdown`, `window.close` | Release RmlUi while its window is still alive. |

`update()` and `render()` return true in RmlUi 6.3, including for an empty context. Their return values do not indicate changed layout or visible geometry.

## Examples

![RmlUi themes in an SFML window](examples/screenshots/variables.png)

The [counter](examples/README.md#demo) includes a working Increment button. The official [variables](examples/README.md#variables) page demonstrates themes and hover styles; its mission buttons have no upstream click action. The launcher also opens document, template and drag tutorials, plus 113 VisualTests pages.

```sh
npm run examples -- drag
npm run examples -- template
npm run examples -- visual/clip_mask
```

## Documentation and checks

| Guide | Content |
| --- | --- |
| [Quick start](../../docs/rmlui/getting-started.md) | Build, resources and the frame loop |
| [Documents and events](../../docs/rmlui/documents.md) | Element edits, listeners and ownership |
| [Rendering and Retina](../../docs/rmlui/rendering.md) | Coordinates, `dp`, stencil and renderer coverage |
| [Fonts](../../docs/rmlui/fonts.md) | Native engines, shaping, atlas limits and capabilities |
| [API guide](../../docs/rmlui/api.md) | Exact signatures, defaults and return values |

Run `npm test` for lint, native/TypeScript builds, type checks and runtime regressions. On macOS, `npm --prefix ../sfml.js-interop run test:high-dpi` checks native surfaces, pixel capture and cursor coordinates. Physical transitions between monitors require device testing.

## License

[MIT](../sfml.js/LICENSE).
