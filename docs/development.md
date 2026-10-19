# Development Guide

**English** · [简体中文](development.zh-CN.md) · [日本語](development.ja.md) · [한국어](development.ko.md)

> This guide is for contributors changing source code, maintaining documentation or running repository tests. To use sfml.js as a dependency, start with [Quick start](getting-started.md).

[Documentation](README.md) · [API guide](api.md) · [Examples](../examples/README.md)

<a id="get-the-source"></a>

## Get the source

Prepare Node.js, Python and a C++20 toolchain; see [requirements](getting-started.md#requirements) for platform installation commands. Then run:

```sh
git clone https://github.com/XadillaX/node-sfml.git
cd node-sfml
npm ci
```

`install` compiles the native module; `prepare` generates TypeScript constants, JavaScript and declaration files. Build hooks first check for and download SFML 3.1.0. When installed as an npm dependency, the package uses the published dist, so only the native module needs compiling during installation.

## Building

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile native code and TypeScript |
| `npm run build:native` | Compile native code and update clangd configuration |
| `npm run build:ts` | Generate constants and compile TypeScript |
| `npm run build:docs` | Build the four-language website and generated API reference |
| `npm run build:reference` | Generate TypeDoc API documentation only |
| `npm run docs:dev` | Preview the website during development |
| `npm run docs:preview` | Serve the production website build locally |
| `npm run lint` | Check source, tools, tests and examples |
| `npm run test:types` | Validate TypeScript APIs |
| `npm run test:runtime` | Run runtime tests serially; requires a prior build |
| `npm test` | Run lint, build, type checks and runtime tests in sequence |
| `npm pack --dry-run` | Inspect the npm package file list |

For TypeScript-only changes, run `npm run build:ts`; after native changes, run `npm run build`. Runtime tests do not rebuild automatically, so ensure the build matches the source before running them.

<a id="testing"></a>

## Testing and verification

```sh
npm test
```

`npm test` runs lint, native and TypeScript builds, type checks and runtime tests.

Runtime tests run serially by file, covering public APIs, comparisons with native SFML, actual rendered pixels, asynchronous I/O, snapshots and lifetimes. Type tests are in `test/*.types.ts`, runtime tests in `test/*.test.cjs`, and native comparisons in `test/native/`.

Graphics tests require a display server and an OpenGL context. For headless Linux, install Xvfb as shown in [Linux CI](../.github/workflows/node.js.yml), then run:

```sh
LIBGL_ALWAYS_SOFTWARE=1 \
  xvfb-run -a -s "-screen 0 1280x1024x24 -noreset" npm run test:runtime
```

CI is configured for Node.js 20/22 on Linux, macOS and Windows; [Windows CI](../.github/workflows/node.js-windows.yml) uses Mesa software OpenGL.

CI does not replace device testing for speakers, microphones, joysticks, sensors or fullscreen switching. SFML's macOS backend does not support Vulkan, and SuspendAwareClock.now supports only Android. State the actual platform and skipped cases when reporting results.

## Maintaining documentation

The README introduces the project and provides a minimal example; `docs/` explains usage by task and module; `examples/README.md` provides runnable entry points. Generate complete signatures from source comments instead of maintaining a duplicate set of declarations in handwritten documentation.

- Examples import the public `sfml.js` package; only repository demo scripts use repository-relative paths.
- Distinguish complete examples from context-dependent snippets, and state requirements for async functions, assets and devices.
- Check loading booleans and network statuses, and close owned resources when examples end.
- When changing public behavior, update JSDoc, the relevant guides and affected examples together.

Install the website dependencies, then build the website:

```sh
npm ci --prefix site
npm run build:docs
```

`site/` contains the VitePress theme and build scripts. The build prepares English, Chinese, Japanese and Korean guides and API references. TypeDoc lives at `/reference/`, `/zh/reference/`, `/ja/reference/` and `/ko/reference/`; the complete website is written to `build/site/`. Edit the original Markdown files, then restart `npm run docs:dev` to refresh prepared content. Theme changes support hot reload.

Documentation generation does not require compiling or loading the native module; documentation-only environments can first run `npm ci --ignore-scripts`. `npm run build:reference` generates standalone TypeDoc in `build/docs/`, with translations in its `zh/`, `ja/` and `ko/` subdirectories. `npm --prefix site test` checks localization, link conversion and legacy redirects; the production build also validates generated routes, anchors and assets.

The [Publish Docs workflow](../.github/workflows/publish-docs.yml) runs on updates to `main` and also supports manual dispatch. Generated output is committed to `docs/` on the `gh-pages` branch, preserving files at that branch's root and its existing `CNAME` (`sfml.js.org`). It skips the commit when generated content is unchanged.

Legacy TypeDoc class and interface URLs redirect to the corresponding English reference page, preserving fragment links. The API language selector preserves the current page and member anchor.

Write JSDoc in English first, followed by `@zh`, `@ja` and `@ko` translations. Place each translation immediately after its summary or block tag. Parameter translations use `@zh name - description` (likewise for Japanese and Korean). Keep identifiers, code examples and links intact. Missing prose translations fail the documentation build.

```ts
/**
 * Read the elapsed time.
 * @zh 读取经过的时间。
 * @ja 経過時間を読み取ります。
 * @ko 경과 시간을 읽습니다.
 * @param unit - Time unit.
 * @zh unit - 时间单位。
 * @ja unit - 時間の単位。
 * @ko unit - 시간 단위.
 */
```

Generated constant descriptions are maintained in `tools/constant-docs.json` and the templates in `tools/constant-docs.cjs`. Run `npm run generate:window` and `npm run generate:network` after editing them; do not edit generated comments directly.

## Running examples

Run these commands from the repository root:

```sh
npm run demo:types -- --frames=120
npm run demo:window -- --frames=120
npm run demo:audio
npm run demo:network
```

See [examples/README.md](../examples/README.md) for descriptions. After building, run `node examples/<name>.cjs` directly. Entry points supporting `--frames` can limit the frame count; the examples guide also explains how to capture screenshots.

The two legacy `drawAsync`/`displayAsync` examples explicitly report that they are unsupported; see the [ported examples](../examples/ported/README.md).

## Source and generated files

| Directory | Contents |
| --- | --- |
| `src/` | TypeScript implementation |
| `native/` | C++ bindings |
| `test/` | Runtime, type and native comparison tests |
| `tools/` | Constant generators, benchmarks and test tools |
| `docs/` | API and development documentation |
| `site/` | Website theme, localization, search and build scripts |

`build/`, `dist/`, `node_modules/` and downloaded SFML libraries are generated content. Window and network constants are generated from the current SFML headers; do not edit `src/*/gen/constants.ts` directly.

Native builds automatically generate `build/compile_commands.json` for `.clangd`. To update only the language server configuration, run `npm run configure:lsp`; restart clangd if the editor still shows stale diagnostics.

## Implementation conventions

Value types use TypedArray for calculations and shared storage; native resources and their views keep memory alive. Graphics resources are destroyed on their owning thread. Recorded draws must preserve snapshot semantics: later property changes must not alter previously recorded results.

Relevant entry points include `src/internal/lazy-value.ts`, `src/internal/graphics-state.ts`, `native/shared-handle.h`, `native/deferred-delete.h` and `native/batch-drawable.h`. Add JSDoc describing behavior, parameters and upstream counterparts when adding public fields or methods.

The downloader, installation hooks and platform builds are interconnected; validate the corresponding platforms when changing them. Download URLs and architecture mappings are in `tools/lib_downloader_urls.cjs`, and the cache is in `third_party/sfml/`.

## Submitting changes

Describe the specific behavior, relevant verification and unverified platform paths in the PR. Run affected native comparison tests for native changes; check links, code examples and the TypeDoc build for documentation-only changes. Include the machine, Node.js/SFML versions, scenario and measurement method with performance figures.
