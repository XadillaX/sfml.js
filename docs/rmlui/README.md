# RmlUi guide

<p><a class="library-brand" href="https://mikke89.github.io/RmlUiDoc/"><img src="assets/rmlui.png" width="246" height="84" alt="RmlUi"></a></p>

Build a document-based interface inside an SFML window with `sfml.js-rmlui`. RML describes the element tree, RCSS controls its presentation, and JavaScript owns application state and event handlers. The current sources target RmlUi 6.3 and SFML 3.1.

Start with JavaScript and the [SFML window guide](../sfml/window.md). RmlUi 6.3 resembles HTML/CSS but does not embed a browser. [Native data models](data-models.md) cover scalar and callback bindings, recursive records and arrays, custom variables, shared numeric storage and sparse updates. The guides below cover the runtime, document tree, styles, rendering, input, fonts, scripts and resource ownership; the [API reference](/reference/rmlui/) documents their TypeScript contracts.

## What is RmlUi?

[RmlUi](https://github.com/mikke89/RmlUi) is a C++ UI library with HTML/CSS-inspired document authoring. Load an RML document once to create a persistent element tree, style it with RCSS, then update individual elements when application state changes. RmlUi handles layout and generates geometry; this package renders it through SFML.

It suits game menus, HUDs, inventory windows and interfaces whose layout and visual design belong in separate assets. RML, RCSS and the Node.js event handlers work together without a browser DOM or web JavaScript environment. For tools composed from widget calls every frame, see the [ImGui guide](../imgui/README.md).

[Official documentation](https://mikke89.github.io/RmlUiDoc/) · [Official repository](https://github.com/mikke89/RmlUi)

## Guide directory

### Getting started and documents

| Chapter | What it covers |
| --- | --- |
| [Quick start](getting-started.md) | Run the counter and understand initialization, fonts and frame order |
| [RML and RCSS basics](rml-rcss.md) | Write markup, selectors and layout, connect clicks, and find official syntax references |
| [Documents and events](documents.md) | Load RML, edit elements, register listeners and release native objects |
| [Byte streams](streams.md) | Read file, memory and callback streams and manage their lifetimes |
| [Strings and resource URLs](strings.md) | Work with strings, resource paths and URLs |

### Elements, layout and controls

| Chapter | What it covers |
| --- | --- |
| [Element classes, attributes and focus](element-state.md) | Change element state, classes and focus |
| [Element utilities](element-utilities.md) | Position elements, measure text, inspect projected bounds and clipping geometry |
| [Layout, scrolling and projection](layout.md) | Inspect layout dimensions, scroll positions and coordinate projections |
| [Boxes and render boxes](boxes.md) | Work with box-model data and render boxes |
| [Form controls](controls.md) | Use inputs, selectors and form operations |
| [Text, progress bars and tabs](text-panels.md) | Work with text elements, progress displays and tabs |
| [SVG and Lottie](vector-elements.md) | Native vector elements, decorators, animation frames and sources |
| [Native types and default actions](rtti-default-actions.md) | Identify element types and invoke default event actions |

### Styles, animation and rendering

| Chapter | What it covers |
| --- | --- |
| [Numeric values and units](numeric-values.md) | Work with typed numbers, units and conversions |
| [Typed properties](properties.md) | Define and parse properties and typed values |
| [Animation and easing](animation.md) | Animate elements with keyframes and easing |
| [Native geometry and convolution](geometry-utilities.md) | Generate meshes in Native batches and filter shared alpha buffers |
| [Rendering resources](resources.md) | Manage textures, shaders, filters and factory resources |
| [Render state](render-state.md) | Manage clipping, layers, callback textures and state restoration |
| [Rendering and Retina](rendering.md) | Compose SFML and RmlUi, size high-density interfaces and assess effects |

### Runtime and extensions

| Chapter | What it covers |
| --- | --- |
| [Plugins](plugins.md) | Register plugins and runtime callbacks |
| [Document scripts](scripts.md) | Run Node.js and Lua document scripts |
| [Native data models](data-models.md) | Use bindings, expressions, shared arrays and sparse updates |
| [Fonts](fonts.md) | Choose font engines, shape text and manage glyph atlases |
| [Native Debugger](debugger.md) | Inspect elements, logs and reflected data models in a separate host |
| [Shared storage and batching](performance.md) | Submit numeric commands, batch custom calculations and preload resources |
| [Source layout](source-layout.md) | Find Native bindings, TypeScript interfaces and tools |
| [API guide](api.md) | Find types, defaults, return values and lifetime contracts |

These guides and the source-generated API reference are maintained in English, Simplified Chinese, Japanese and Korean.

## Run an example

From the monorepo root:

```sh
node tools/bootstrap.cjs
node packages/sfml.js-rmlui/examples/demo.cjs
node packages/sfml.js-rmlui/examples/official.cjs variables
```

The [examples catalogue](../../packages/sfml.js-rmlui/examples/README.md) includes screenshots, controls and source links. The counter has a working Increment button. The variables page's mission buttons demonstrate hover styling only.

## Ownership boundary

The process-wide runtime binds one `RenderWindow` and belongs to its initializing Node.js environment and thread. It owns contexts, documents, fonts and renderer resources. Element wrappers share native validity. JS references retain owned detached trees; attached nodes follow their native parent's lifetime. Destruction automatically releases listeners, and stale wrapper access throws. Shut down RmlUi before closing the SFML window. See [native lifetimes](documents.md#native-lifetimes) for deferred document destruction and worker restrictions.
