# sfml.js-interop

[![npm version](https://img.shields.io/npm/v/sfml.js-interop.svg?style=for-the-badge&colorA=5DDB61&colorB=4BC74F&label=sfml.js-interop)](https://www.npmjs.org/package/sfml.js-interop)

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md)

Shared native headers and SFML SDK paths for [sfml.js](../sfml.js) and its addons such as [sfml.js-imgui](../sfml.js-imgui). Applications normally use the JavaScript packages directly; this package is for authors of native extensions.

[Full interop guide](../../docs/interop/README.md) · [Development guide](../../docs/sfml/development.md)

## Usage

Declare `sfml.js-interop` as a dependency of your extension. Like [nan](https://www.npmjs.com/package/nan), requiring the package returns its include directory:

```js
const includeDir = require('sfml.js-interop');
```

`require('sfml.js-interop/paths')` exposes the resolved SDK paths:

| Export | Path |
| --- | --- |
| `root` | Package root containing the downloaded SDK |
| `include` | Interop headers directory |
| `sfmlInclude` | SFML C++ headers |
| `sfmlLib` | SFML link libraries |
| `sfmlBin` | SFML runtime binaries |

Reference both include directories from `binding.gyp` instead of hardcoding a sibling repository's private headers:

```json
{
  "include_dirs": [
    "<!(node -e \"process.stdout.write(require('sfml.js-interop'))\")",
    "<!(node -e \"process.stdout.write(require('sfml.js-interop/paths').sfmlInclude)\")"
  ]
}
```

## Contract

- `sfml-js-interop.h` exposes `SFMLJS_INTEROP_VERSION` (currently 1) and pulls in `shared-handle.h`, `exception-boundary.h` and `numeric-fields.h`.
- Match the contract and SFML versions used by the host binding. A matching version macro alone does not guarantee ABI compatibility across independently configured binaries.
- `RenderWindowFrom` accepts the binding's internal native window handle, not a public JavaScript RenderWindow object.
- Native owners control lifetime: a view or borrowed pointer must not outlive its owner, context or window.
- Keep resources alive for recorded drawing, preserve draw-time snapshots, and use the shared exception boundary when exposing C++ callbacks to V8.

The SDK downloader belongs to this package; Rush builds interop before sfml.js and sfml.js-imgui. See the [integration source](../sfml.js-imgui/native/interop.h) and the [JS bridge](../sfml.js-imgui/src/internal/sfml-interop.ts) for a complete consumer.

## License

[MIT](../sfml.js/LICENSE).
