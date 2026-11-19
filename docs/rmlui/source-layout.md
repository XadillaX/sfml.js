# RmlUi source layout

**English** · [简体中文](source-layout.zh-CN.md) · [日本語](source-layout.ja.md) · [한국어](source-layout.ko.md)

`packages/sfml.js-rmlui` groups native bindings, TypeScript interfaces and tests by responsibility. Put new implementations in their owning module, with related headers and implementation files together.

| Directory | Responsibility |
| --- | --- |
| `runtime/` | Initialization, Context, runtime state, capabilities, callback lifetime, Plugin and Debugger |
| `dom/documents/` | Documents, Factory, attribute collections and XML parsing |
| `dom/elements/` | Element, layout, scrolling, element instancing, SVG and Lottie |
| `dom/controls/` | Forms, text controls, options and panels |
| `data/` | Data models, type registration, addresses, members, batching and diagnostics |
| `events/` | Events, listeners, dispatch and instancing |
| `style/properties/` | Property, parsers, specifications and stylesheets |
| `style/effects/` | Decorators, filters, effect values and their callbacks |
| `style/values/` | Computed styles, style structs, transforms and mapped views |
| `animation/` | Animations, transitions, tweens and value callbacks |
| `rendering/` | Render management, geometry, textures, layers, resources and the SFML renderer |
| `fonts/` | Font loading, FreeType/HarfBuzz/bitmap engines, measurement, glyphs and font effects |
| `scripting/` | Script interfaces, hosts and script objects |
| `scripting/lua/` | Lua hosts, models, values, functions and instancing |
| `platform/` | SFML system integration, input, text input and window density |
| `io/` | File interfaces and streams |
| `values/` | Variant, numeric values, strings, URLs and shared types |

These directories live under `native/` and `src/`. Implementations needed in only one layer stay there. `src/internal/` contains cross-module internal protocols such as native loading, wrapper allocation and shared-memory conversion.

`src/index.ts` is the public npm entry point; `native/addon.cc` registers the native module. Package build configuration stays in the root `binding.gyp`, `package.json` and `tsconfig.json`.

Generated files live in `src/generated/` and `native/generated/`. Edit the generators in `tools/codegen/`, then regenerate their output.

| Tool directory | Responsibility |
| --- | --- |
| `tools/build/` | Package native builds, Lua C++ compilation and compilation-database repair; repository LSP databases merge only inside the owning Rush workspace |
| `tools/codegen/` | Input, event, property ID and style bindings generated from upstream headers |
| `tools/dependencies/` | Dependency versions, verification, downloads and build-source inventories |
| `tools/dependencies/patches/` | RmlUi, Lua, Debugger, numeric, string and rlottie patches |
| `tools/performance/` | Performance measurements and native call counts |
| `tools/testing/` | Recursive runtime test collection/execution, clipboard preservation, npm source-package inventories and build dependency verification |

`test/` groups runtime and type cases by module. `test/native/` groups C++ oracle programs and their build scripts by module. These scripts reuse the package's existing object files; callers select an existing temporary output directory.

`packages/sfmljs-rmlui-vscode/tools/testing/` runs extension integration checks in an existing VS Code installation. Its `tools/packaging/` verifies the VSIX's bundled client, language server, language resources and four-language README files. Repository Windows toolchain setup lives in `tools/ci/`, shared by the existing Node.js CI and the dedicated RmlUi CI.

`third_party/` preserves upstream layouts. `build/` and `dist/` reuse existing build directories. After a source move, remove only old outputs that have corresponding outputs at the new paths.

Moving source directories does not establish full RmlUi 6.3 acceptance. Existing evidence under `audit/6.3/` retains the paths and hashes recorded when collected. Use the [source relocation map](audit/6.3/source-layout-map.json) to find those historical paths.
