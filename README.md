# SFML for Node.js

The Rush monorepo for [sfml.js](packages/sfml.js), [sfml.js-imgui](packages/sfml.js-imgui) and [sfml.js-interop](packages/sfml.js-interop).

[Website](https://sfml.js.org/) · [Core guides](docs/sfml/README.md) · [ImGui](docs/imgui/README.md) · [Native extensions](docs/interop/README.md)

## Develop

Prepare Node.js 20 or 22, Python and a C++20 toolchain using the [platform requirements](docs/sfml/getting-started.md#requirements). From a clone, run:

```sh
node tools/bootstrap.cjs
```

This installs the pinned Rush/pnpm dependencies, downloads native libraries, builds the packages and website, and generates the root clangd compilation database.

## Documentation

Guides live in `docs/sfml`, `docs/imgui` and `docs/interop`. The private Rush project in `site` contains VitePress, TypeDoc, localization and site tests. API comments and runnable examples stay in their packages.

```sh
npm --prefix site run dev
node common/scripts/install-run-rush.js build --to sfml-js-site
npm --prefix site test
```

The production website is generated in `site/build/site`. See the [development guide](docs/sfml/development.md) for package tests and contribution conventions.
