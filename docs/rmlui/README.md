# RmlUi guide

<p><a class="library-brand" href="https://mikke89.github.io/RmlUiDoc/"><img src="assets/rmlui.png" width="246" height="84" alt="RmlUi"></a></p>

Build a document-based interface inside an SFML window with `sfml.js-rmlui`. RML describes the element tree, RCSS controls its presentation, and JavaScript owns application state and event handlers. The current sources target RmlUi 6.3 and SFML 3.1.

Start with JavaScript and the [SFML window guide](../sfml/window.md). RmlUi 6.3 resembles HTML/CSS but does not embed a browser. [Native data models](data-models.md) cover scalar and callback bindings, recursive records and arrays, custom variables, shared numeric storage and sparse updates. The guides below cover the runtime, document tree, styles, rendering, input, fonts, scripts and resource ownership; the [API reference](/reference/rmlui/) documents their TypeScript contracts.

## What is RmlUi?

[RmlUi](https://github.com/mikke89/RmlUi) is a C++ UI library with HTML/CSS-inspired document authoring. Load an RML document once to create a persistent element tree, style it with RCSS, then update individual elements when application state changes. RmlUi handles layout and generates geometry; this package renders it through SFML.

It suits game menus, HUDs, inventory windows and interfaces whose layout and visual design belong in separate assets. RML, RCSS and the Node.js event handlers work together without a browser DOM or web JavaScript environment. For tools composed from widget calls every frame, see the [ImGui guide](../imgui/README.md).

[Official documentation](https://mikke89.github.io/RmlUiDoc/) · [Official repository](https://github.com/mikke89/RmlUi)

## Learning path

| Chapter | What it covers |
| --- | --- |
| [Quick start](getting-started.md) | Run the counter and understand initialization, fonts and frame order |
| [RML and RCSS basics](rml-rcss.md) | Write markup, selectors and layout, connect clicks, and find official syntax references |
| [Documents and events](documents.md) | Load RML, edit elements, register listeners and release native objects |
| [Native Debugger](debugger.md) | Inspect elements, logs and reflected data models in a separate host |
| [SVG and Lottie](vector-elements.md) | Native vector elements, decorators, animation frames and sources |
| [Native geometry and convolution](geometry-utilities.md) | Generate meshes in Native batches and filter shared alpha buffers |
| [Rendering and Retina](rendering.md) | Compose SFML and RmlUi, size high-density interfaces and assess effects |
| [Shared storage and batching](performance.md) | Submit numeric commands, batch custom calculations and preload resources |
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
