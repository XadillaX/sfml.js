# RmlUi quick start

Run the complete [counter source](../../packages/sfml.js-rmlui/examples/demo.cjs) and its [RML](../../packages/sfml.js-rmlui/examples/assets/tutorial.rml) / [RCSS](../../packages/sfml.js-rmlui/examples/assets/tutorial.rcss) assets. The window displays a counter, an Increment button, blur and rounded clipping.

## Prepare the workspace

Follow the [platform requirements](../sfml/getting-started.md#requirements). A native C++20 toolchain, Python, a display and OpenGL are required. On macOS, install Xcode Command Line Tools and CMake for the patched SFML Window library.

```sh
# From the monorepo root.
node tools/bootstrap.cjs
cd packages/sfml.js-rmlui
npm run demo
```

Bootstrap installs and builds the workspace in dependency order. Run it once for setup. After changing this package, use `npm run build`; after only TypeScript edits, use `npm run build:ts`. These commands refer to the local checkout, without assuming an npm release exists.

Source packages include their native build helpers. The explicit npm `install`
hook prepares dependencies and generated native declarations before configuring
and building the addon and both original Invaders modules. It reuses `build/`;
the optional repository LSP merge runs only inside the owning Rush workspace.
Installation uses the shipped JavaScript/types and does not require TypeScript.
`npm run test:package` checks the actual npm file inventory and helper imports.

The [VS Code extension](../../packages/sfmljs-rmlui-vscode/README.md) includes its
language server and supports RML/RCSS completion, diagnostics, hover and colors.

## Initialization and resources

The counter creates a `RenderWindow` with `settings.stencilBits: 8`, checks `initialise(window)`, loads the bundled LatoLatin regular/bold fonts, then reads `window.getSize()` to create its context. Font loading is synchronous and must finish before loading the document. The RCSS `font-family` must match the font's internal family name.

```js
if (!rmlui.initialise(window)) {
  throw new Error('RmlUi initialisation failed');
}

const size = window.getSize();
const context = rmlui.createContext('main', size.x, size.y);
```

This fragment belongs after window creation in the counter. Read the size **after** initialization: macOS may have enabled a Retina surface. `loadDocument` initially creates a hidden document; call `document.show()` to display it.

## System interface and application time

`getSystemInterface()` returns the selected native interface, or `null` before
selection and after shutdown. To override system behavior, create a
`SystemInterface(window, callbacks)` and call `setSystemInterface(system)`
before `initialise`. Omitted callbacks use the SFML/upstream implementation.
The eight optional hooks cover translation, resource path joining, logging,
cursor, clipboard and keyboard operations.

```js
const system = new rmlui.SystemInterface(window, {
  translateString(input) {
    return { value: input, translations: 0 };
  },
});

rmlui.setSystemInterface(system);
rmlui.initialise(window);

// Before each update, optionally drive native animations with application time.
system.clock[0] = elapsedSeconds;
context.update();
// Restore the native SFML clock.
system.clock[0] = NaN;
```

`clock` is a one-element Native-owned `Float64Array`: native time reads need no
JS callback or Addon call. Supplied seconds must be finite and nonnegative;
the initial `NaN` selects the SFML clock. Callbacks are synchronous, preserve
their callback-object `this`, and cannot reenter RmlUi APIs. Selection is fixed
after initialization. Shutdown releases native interfaces and callbacks,
invalidates setup objects, and leaves previously obtained clock storage readable.

## Application logging

`Log.message(type, format, ...values)` and
`Log.parseError(filename, line, format, ...values)` format and dispatch through
native `Rml::Log` in one Addon entry. The selected `SystemInterface.logMessage`
receives the resulting severity and text, including before initialization.

```js
rmlui.Log.message(rmlui.LogType.Info, '%s: %d', 'loaded documents', 3);
rmlui.Log.parseError('panel.rml', 12, 'Unexpected %s', 'tag');
```

Formatting uses the checked scalar rules in the [string guide](strings.md).
The native log buffer retains at most 1,021 UTF-8 bytes and stops at NUL.
`parseError` first truncates its message, then the filename/line-prefixed result.
A negative line omits the line number. Both helpers return `void`; native
`Rml::Log` ignores the log callback's boolean result. Callback exceptions
propagate, and callback reentry and foreign runtime environments are rejected.

## File interface

Create `FileInterface(root)` for the root-first filesystem policy, or provide
`FileCallbacks` for custom resource bytes. Select it with `setFileInterface`
before initialization; `getFileInterface()` returns the selected wrapper.
Without a selection, initialization installs the native filesystem default.
An explicit `fileRoot` must agree with an already selected filesystem provider.

```js
const resources = new Map([
  ['virtual.rml', Buffer.from('<rml><body><p>Ready</p></body></rml>')],
]);
const files = new rmlui.FileInterface({
  open(path) {
    return resources.get(path) ?? null;
  },
});

rmlui.setFileInterface(files);
rmlui.initialise(window);
const document = context.loadDocument('virtual.rml');
```

Open byte arrays become Native-owned snapshots. Their read, seek, tell and
length operations remain native. Existing `StreamMemory` or custom `Stream`
objects are also accepted; a `StreamFile` cannot be returned from this provider.
Optional callbacks implement all seven upstream virtuals, preserve `this`,
and must return synchronously without reentering RmlUi APIs.

`files.open(path)` returns a checked `FileHandle` or null. Use the same provider
for `read(output, size, file)`, `seek`, `tell`, `length` and `close`. `loadFile`
returns a byte snapshot or null; empty files return an empty array.
Shutdown closes outstanding files and invalidates every provider and token.
Custom resource preloads obtain their byte snapshots once on the owning thread;
image decoding and alpha preparation run on Native workers. Filesystem
preloads perform both reading and decoding on workers.

## Selecting the renderer

`getRenderInterface()` returns the actual selected Native interface, or `null`
before selection and after shutdown. Create an SFML interface before or after
initialization; call `setRenderInterface(renderer)` before `initialise` to choose
the default. Passing `null` restores automatic selection.

```js
const renderer = rmlui.createRenderInterface(renderWindow);

rmlui.setRenderInterface(renderer);
rmlui.initialise(systemWindow);
const context = rmlui.createContext('ui', 800, 600);
```

Initialization preserves the selected renderer. Contexts use its render window;
the initialization window still supplies system timing, input and DPI.
An explicit renderer argument to `createContext` selects another resource cache.
Selected renderers and those used by Native managers or preloading retain their
Native window until shutdown. Unused renderers are collectible. Keep every
used window open until shutdown. Rendering and geometry remain Native and
retain existing batching and draw snapshot semantics.

## Each frame

The counter's loop forwards every event to RmlUi, stops on the native close event, then updates and renders:

```js
context.update();
window.clear(sfml.Color.Black);
// Set your scene view with window.setView(sceneView), then draw the scene.
window.flush();
context.render();
window.display();
```

Keep the window open until the loop has stopped and RmlUi has shut down. `processEvent` already updates dimensions for resize events; explicit `setDimensions` is useful when the application chooses a different context size.

## Click and cleanup

The counter keeps one named `increment` function for registration and removal. Clicking Increment changes JavaScript state and `counter.innerRML`. Before exit, it removes the listener, unloads the document, removes the context, calls `shutdown()`, then closes the window.

| Symptom | Check |
| --- | --- |
| Missing native module or fonts | Finish bootstrap and use the local example assets. |
| Text is absent | Check `loadFontFace` and the RCSS family name. |
| Document is invisible | Call `show`, `update` and `render` in that order. |
| Click does nothing | Forward events and register a handler; variables mission buttons have none. |
| Text is small or blurry | Read the post-initialization size and use RCSS `dp`; see [Retina](rendering.md). |
| Exit crashes | Release listeners and wrappers before their native owners and window. |

Continue with [documents and events](documents.md).
