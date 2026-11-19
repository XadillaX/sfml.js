# Core offset and property iterator acceptance

Two exact Core declarations have local macOS arm64 evidence. Runtime tests
exercise the pinned native algorithms through checked handles, with positive
and negative consumer types and four-language source comments and guides.

| Original inventory key | Representation and acceptance |
| --- | --- |
| `Core/Element.h:92` `SetOffset(Vector2f, Element*, bool)` | `setOffset(offset, offsetParent, offsetFixed = false)` applies native position rules and scrolling. Finite coordinates and a boolean flag are validated after JS conversion and before native mutation. The parent must be a strict ancestor or null to preserve the raw pointer's ownership and prevent recursive cycles. |
| `Core/Element.h:257` `IterateLocalProperties(Element*)` | `iterateLocalProperties(filterInheritedBy = null)` returns native-order name/property pairs. A single native traversal includes inline overrides, stylesheet/class properties, custom variables and variable shorthands. Native duplicate, shorthand-placeholder and exact inheritance filtering rules apply. |

The offset regressions verify native border-relative and absolute coordinates,
ancestor scrolling, explicit fixed offsets, self/unrelated parent rejection,
nonfinite/invalid flags, detachment, independent null-parent offsets and runtime
shutdown. Getter-driven document destruction during coordinate conversion
rejects the receiver before native access. Existing detached-tree cleanup clears
outgoing layout pointers while preserving internal ancestor relationships.

The iterator regression distinguishes local from inherited values, inline
height from stylesheet width, class opacity, custom variables and unresolved
variable shorthands. A child's custom override removes the corresponding
inherited entry. Copies survive class removal, caller mutation and document
destruction. Instrumentation records one native runtime entry and zero
native-to-JS callbacks for the filtered snapshot.

Both new public methods first failed their runtime tests because they did not
exist. Final focused runs pass all 16 layout and 12 property groups. Consumer
types, lint, cpplint, native/TypeScript build, native formatting, compiler-backed
identifier naming and all four source-comment locales pass. Temporary logs use
`/tmp/rmlui-63-completion/core-offset-iterator-*.log`; initial missing-method
failures are `core-offset-red.log` and `core-property-iterator-red.log`.
The source review is `/tmp/rmlui-63-completion/core-offset-iterator-review.md`.

The final full-package run exits zero in `core-offset-iterator-package-final.log`:
78 unique runtime suite files, 717 literal PASS lines and zero FAIL lines,
including lint, cpplint, native/TypeScript builds and consumer types. The seven
additional `[sfml.js-rmlui]` dependency/smoke diagnostic banners are not counted
as test files. This run also contains the later explicit data-application
regression. All 81 site checks passed before its guide-only clarification.
Compiler-backed naming and formatting passed for all three native units changed
in this continuation. Thirty-three tracked and untracked task files passed an
explicit trailing-whitespace scan.

The exact ledger retains all 549 original keys: 402 locally verified, 20 partial
and 127 pending. Full Core acceptance, platform evidence and Tasks 5–10 remain
required; the query/offset/iterator groups do not establish whole-plan closure.
