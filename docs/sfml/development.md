# Development Guide

**English** · [简体中文](development.zh-CN.md) · [日本語](development.ja.md) · [한국어](development.ko.md)

> This guide is for contributors changing source code, maintaining documentation or running repository tests. To use sfml.js as a dependency, start with [Quick start](getting-started.md).

[Documentation](README.md) · [API guide](api.md) · [Examples](../../packages/sfml.js/examples/README.md)

<a id="get-the-source"></a>

## Get the source

Prepare Node.js, Python and a C++20 toolchain; see [requirements](getting-started.md#requirements) for platform installation commands. Then run:

```sh
git clone https://github.com/XadillaX/node-sfml.git
cd node-sfml
node tools/bootstrap.cjs
```

`node tools/bootstrap.cjs` installs dependencies with Rush and builds interop, both bindings and the website in dependency order. SFML and ImGui libraries are downloaded by their owning packages. Node.js 20 or 22 is recommended for this checkout; the website requires Node.js 20 or later.

## Building

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm --prefix packages/sfml.js run build` | Compile native code and TypeScript |
| `npm --prefix packages/sfml.js run build:native` | Compile native code and update clangd configuration |
| `npm --prefix packages/sfml.js run build:ts` | Generate constants and compile TypeScript |
| `npm --prefix site run build` | Build the four-language website and generated API reference |
| `npm --prefix site run build:reference` | Generate TypeDoc API documentation only |
| `npm --prefix site run dev` | Preview the website during development |
| `npm --prefix site run preview` | Serve the production website build locally |
| `npm --prefix packages/sfml.js run lint` | Check source, tools, tests and examples |
| `npm --prefix packages/sfml.js run test:types` | Validate TypeScript APIs |
| `npm --prefix packages/sfml.js run test:runtime` | Run runtime tests serially; requires a prior build |
| `npm --prefix packages/sfml.js test` | Run lint, build, type checks and runtime tests in sequence |
| `npm --prefix packages/sfml.js pack --dry-run` | Inspect the npm package file list |

For TypeScript-only changes, run `npm --prefix packages/sfml.js run build:ts`; after native changes, run `npm --prefix packages/sfml.js run build`. Runtime tests do not rebuild automatically, so ensure the build matches the source before running them.

<a id="testing"></a>

## Testing and verification

```sh
npm --prefix packages/sfml.js test
```

`npm --prefix packages/sfml.js test` runs lint, native and TypeScript builds, type checks and runtime tests.

Runtime tests run serially by file, covering public APIs, comparisons with native SFML, actual rendered pixels, asynchronous I/O, snapshots and lifetimes. Type tests are in `test/*.types.ts`, runtime tests in `test/*.test.cjs`, and native comparisons in `test/native/`.

Graphics tests require a display server and an OpenGL context. For headless Linux, install Xvfb as shown in [Linux CI](../../.github/workflows/node.js.yml), then run:

```sh
LIBGL_ALWAYS_SOFTWARE=1 \
  xvfb-run -a -s "-screen 0 1280x1024x24 -noreset" npm --prefix packages/sfml.js run test:runtime
```

CI is configured for Node.js 20/22 on Linux, macOS and Windows; [Windows CI](../../.github/workflows/node.js-windows.yml) uses Mesa software OpenGL.

CI does not replace device testing for speakers, microphones, joysticks, sensors or fullscreen switching. SFML's macOS backend does not support Vulkan, and SuspendAwareClock.now supports only Android. State the actual platform and skipped cases when reporting results.

## Maintaining documentation

The package README files introduce each package. Root `docs/sfml/`, `docs/imgui/` and `docs/interop/` contain the guides. Runnable examples and API source comments stay in their owning packages. Root `site/` is the private Rush project `sfml-js-site` and owns VitePress, TypeDoc, localization and site tests.

- Examples import the public `sfml.js` package; only repository demo scripts use repository-relative paths.
- Distinguish complete examples from context-dependent snippets, and state requirements for async functions, assets and devices.
- Check loading booleans and network statuses, and close owned resources when examples end.
- When changing public behavior, update JSDoc, the relevant guides and affected examples together.

Install the website dependencies, then build the website:

```sh
node common/scripts/install-run-rush.js build --to sfml-js-site
```

After bootstrap, `npm --prefix site run dev` prepares Markdown and serves the site. Restart it after changing guide sources; theme changes support hot reload. `npm --prefix site run build` generates the complete site in `site/build/site/`. Core URLs remain `/guide`, `/examples` and `/reference`; ImGui uses `/imgui/` and `/reference/imgui/`, and native extension guidance uses `/interop/`. Each has Chinese, Japanese and Korean counterparts.

`npm --prefix site test` checks routes, localization and theme behavior. The site build also checks all generated links, anchors, language coverage and assets. `npm --prefix site run build:reference` regenerates both API references in `site/build/site/reference/` and its language counterparts. TypeDoc reads package source comments and requires complete translations. ImGui API translations are maintained beside their declarations.

The [Publish Docs workflow](../../.github/workflows/publish-docs.yml) runs on updates to `main` and also supports manual dispatch. Generated output is committed to `docs/` on the `gh-pages` branch, preserving files at that branch's root and its existing `CNAME` (`sfml.js.org`). It skips the commit when generated content is unchanged.

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

Generated constant descriptions are maintained in `tools/constant-docs.json` and the templates in `tools/constant-docs.cjs`. Run `npm --prefix packages/sfml.js run generate:window` and `npm --prefix packages/sfml.js run generate:network` after editing them; do not edit generated comments directly.

## Running examples

Run these commands from the repository root:

```sh
npm --prefix packages/sfml.js run demo:types -- --frames=120
npm --prefix packages/sfml.js run demo:window -- --frames=120
npm --prefix packages/sfml.js run demo:audio
npm --prefix packages/sfml.js run demo:network
```

The examples are organized into [overview](../../packages/sfml.js/examples/README.md), [feature examples](../../packages/sfml.js/examples/features/README.md), [official examples](../../packages/sfml.js/examples/official/README.md) and [games and applications](../../packages/sfml.js/examples/projects/README.md). Commands and [screenshot support](../../packages/sfml.js/examples/features/README.md#screenshots) are documented with their entry points. After building, run the script directly; pass `--frames` only where supported.

## Source and generated files

| Directory | Contents |
| --- | --- |
| `packages/sfml.js/` | Core source, native binding, tests and examples |
| `packages/sfml.js-imgui/` | ImGui binding source, multilingual API comments and demo |
| `packages/sfml.js-interop/` | Shared headers and SFML SDK downloader |
| `docs/` | Shared guides, grouped by package |
| `site/` | VitePress, TypeDoc, theme and site tests |
| `common/` | Rush configuration and shared lockfile |

`build/`, `dist/`, `node_modules/` and downloaded SFML libraries are generated content. Window and network constants are generated from the current SFML headers; do not edit `src/*/gen/constants.ts` directly.

Native builds generate per-package compilation databases and merge them into root `compile_commands.json`, used by root `.clangd`. `node tools/configure-lsp.cjs` merges existing databases without rebuilding native code.

## Implementation conventions

Value types use TypedArray for calculations and shared storage; native resources and their views keep memory alive. Graphics resources are destroyed on their owning thread. Recorded draws must preserve snapshot semantics: later property changes must not alter previously recorded results.

Relevant entry points include `src/internal/lazy-value.ts`, `src/internal/graphics-state.ts`, `packages/sfml.js-interop/include/shared-handle.h`, `native/deferred-delete.h` and `native/batch-drawable.h`. Add JSDoc describing behavior, parameters and upstream counterparts when adding public fields or methods.

The downloader, installation hooks and platform builds are interconnected; validate the corresponding platforms when changing them. Download URLs and architecture mappings are in `packages/sfml.js-interop/tools/lib_downloader_urls.cjs`, and the cache is in `packages/sfml.js-interop/third_party/sfml/`.

## Submitting changes

Describe the specific behavior, relevant verification and unverified platform paths in the PR. Run affected native comparison tests for native changes; check links, code examples and the TypeDoc build for documentation-only changes. Include the machine, Node.js/SFML versions, scenario and measurement method with performance figures.

### Record changes with rush change

Package versions are placeholders managed by Rush version policies; do not edit `version` fields in `package.json` by hand. All three published packages (`sfml.js-interop`, `sfml.js`, and `sfml.js-imgui`) use the single lockstep policy `sfml-js`, so they always release together and share one version number.

After changing a published package, run from the repository root and commit the generated file under `common/changes/`:

```sh
node common/scripts/install-run-rush.js change
```

Choose `patch`, `minor` or `major` per affected package. Change files feed the CHANGELOG content; the lockstep policy's `nextBump` decides the actual version, and every release bumps and publishes all three packages together.

### Release through CI

Releases run in the **Publish packages** workflow and must be cut only after main CI is green:

1. Merge the PRs containing the `common/changes/*.json` files.
2. Push a `v*` tag at the main commit (the tag name only triggers the workflow; the version is determined by the lockstep policy):

   ```sh
   git tag v2026.11.09
   git push origin v2026.11.0
   ```

3. The workflow builds and reruns all three packages' tests, then `rush publish --apply --publish --target-branch main` applies the change files, updates versions and CHANGELOG files, merges the bump back to main, tags each package and publishes to npm.

Requirements: an npm automation/publish token stored as the `NPM_AUTH_TOKEN` repository secret (consumed through `common/config/rush/.npmrc-publish`), and main must accept the workflow's `GITHUB_TOKEN` pushes. At publish time the lockstep policy pins every internal dependency between the three packages to the exact released version; the working-tree manifests keep caret ranges (`versionFormatForCommit: original`).
