# Project Rules

## Website Icons

The documentation website must use Game Icons exclusively for UI icons.
Do not introduce icons from other libraries, framework defaults, emoji,
hand-drawn SVGs, or CSS-drawn substitutes. This applies to the homepage,
guides, search dialogs, navigation, and generated API reference pages,
including hover, expanded, selected, and responsive states.

Official project logos and proprietary brand icons, such as GitHub's
official icon, are exceptions. Preserve their official artwork when they
identify or link to that brand. Do not use brand icons as substitutes for
generic UI actions. When no Game Icon has the correct meaning for a
generic action, use a clear text label instead of an unrelated icon.

The local `assets/icons/game-icons/` directory contains only a subset of the
Game Icons collection. It is not the complete catalog.

When the website needs an icon:

1. Search and inspect the full [Game Icons catalog](https://game-icons.net/)
   first. Choose an icon whose meaning matches the feature or content.
2. After finding a suitable icon, check whether it already exists in
   `assets/icons/game-icons/`.
3. If it is missing locally, copy the selected icon into that directory
   before using it, and record its source and attribution in `sources.json`.

Do not limit icon selection to the local subset or reuse an unrelated icon
just because it is already available.
