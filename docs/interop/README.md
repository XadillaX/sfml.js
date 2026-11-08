# Developing native extensions

sfml.js-interop supplies shared native headers and the SFML SDK paths to both bindings. Applications normally use the JavaScript packages; native extension authors use this contract instead of including a sibling repository's private headers.

Declare `sfml.js-interop` as a dependency of your extension. Like nan, `require('sfml.js-interop')` returns its include directory. `require('sfml.js-interop/paths')` exposes `root`, `include`, `sfmlInclude`, `sfmlLib` and `sfmlBin`. Resolve these from the consuming package.

```json
{
  "include_dirs": [
    "<!(node -e \"process.stdout.write(require('sfml.js-interop'))\")",
    "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlInclude)\")"
  ]
}
```

`sfml-js-interop.h` exposes `SFMLJS_INTEROP_VERSION` (currently 1), `shared-handle.h`, `exception-boundary.h` and `numeric-fields.h`. Match the contract and SFML versions used by the host binding. `RenderWindowFrom` accepts the binding's native window handle, not a public JavaScript RenderWindow object.

Native owners control lifetime. A view or borrowed pointer must not outlive its owner, context or window. Keep resources alive for recorded drawing and preserve draw-time snapshots. Use the shared exception boundary when exposing C++ callbacks to V8. A matching version macro alone does not guarantee ABI compatibility across independently configured binaries.

Rush builds interop before sfml.js and sfml.js-imgui. The SDK downloader belongs to interop; do not hardcode sibling package paths in an addon. See the [integration source](../../packages/sfml.js-imgui/native/interop.h), [JS bridge](../../packages/sfml.js-imgui/src/internal/sfml-interop.ts) and [development guide](../sfml/development.md).
