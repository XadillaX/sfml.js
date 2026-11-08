# Documentation site rules

This site serves all packages in the Rush monorepo. Keep core `/guide`,
`/examples` and `/reference` URLs stable across English, Chinese, Japanese
and Korean. ImGui API prose must have all four languages; never add an
English fallback or suppress missing translations to pass a build.

Use Game Icons exclusively for UI icons. Official project logos and
proprietary brand icons are exceptions when identifying their brands.
Reuse the attributed artwork in `packages/sfml.js/assets/icons/game-icons`.
If a new icon is needed, inspect the full Game Icons catalog first and
record its source and attribution before adding it.

Handwritten guides live in `docs/sfml`, `docs/imgui` and `docs/interop`.
Package README files, API source comments and runnable examples stay in
their owning packages. Only `site/build` and VitePress caches are disposable.
