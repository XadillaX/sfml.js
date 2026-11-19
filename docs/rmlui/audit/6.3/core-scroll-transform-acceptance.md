# Core scroll and transform component acceptance

> Two exact accessor representations have local macOS arm64 acceptance.
> Full Core and Tasks 5–10 acceptance remains required.

| Original inventory declaration | Consumer representation |
| --- | --- |
| `Core/Element.h:572` `GetElementScroll() const` | `getElementScroll()` returns a canonical checked view of the actual element-owned native component. |
| `Core/Element.h:576` `GetTransformState() const noexcept` | `getTransformState()` returns a const native view or the original null result. Matrix reads copy native state; element-owned setters reject mutation. |

The scroll view implements native Update, EnableScrollbar, DisableScrollbar,
UpdateScrollbar, GetScrollbar, GetScrollbarSize, FormatScrollbars and
UpdateProperties. Native orientation values remain 0/1. Size is the vertical
width or horizontal height in pixels and zero when disabled. Property
recomputation remains explicit before visibility queries. The element token
retains detached ownership and invalidates on actual destruction or shutdown.

The pinned creator previously dereferenced a null factory result. A bounded
test recorded `SIGSEGV`. Versioned source patches now throw for missing
scrollbar, internal slider children and corner results. Temporary native owners
unwind before component pointers are published. The focused nine-group run
passes all three failure/retry paths together with the other component groups.

Element transform views read current native state after context rendering.
Removed transform state returns null and invalidates reads while absent;
destroyed elements and stale runtime generations reject access. Independently
constructed TransformState values keep the native change-result, nullable
matrix and singular inverse rules. Inputs are fixed, unshared Float32Array
matrices with sixteen finite column-major values. Getter snapshots own copied
native values and survive element destruction, wrapper GC and runtime shutdown.

ElementTransformBuffer allocates reusable native output storage once. Each row
contains 48 column-major floats and one presence byte. Transform, perspective
and inverse begin at offsets 0/16/32 with flags 1/2/4. All owners are checked
before output changes. V8-visible element token edges retain detached ownership;
ArrayBuffer deleters retain only numerical storage.

The 1,000/10,000/100,000-row focused cases use repeated registrations of one
translated element; mixed matrix presence uses four distinct elements.
The large-list cases record one JS-to-native entry, zero
native-to-JS callbacks, zero element ownership visits and zero output storage
allocations per refresh. Each translated row copies two present matrices
(128 bytes); the absent perspective is zero-filled separately. At 100,000 rows
the output allocation is 19,300,000 bytes and present-matrix copies are
12,800,000 bytes per refresh. These counters do not represent total malloc
traffic, full-frame timing or GPU time. Requested O(N) reads are distinct from
ownership scans.

A separate source review identified redundant native token creation behind the
canonical JS state wrapper. The getter now validates and reuses its prior token.
The counted 1,000-query group records exactly one token allocation.

Four-language TSDoc and API guides, positive/negative consumer types and
explicit runtime cases cover the implemented representations. Formatting passes
all five changed native source/header files. Compiler-backed identifier naming
passes four compilation units using the established LLVM/SDK configuration.
The initial PATH/SDK-mismatch diagnostics are not passing evidence.

Final `npm test` exits zero: 79 unique runtime suite files, 727 literal PASS
lines and zero FAIL lines, including all ten component groups. Lint, cpplint,
native/TypeScript builds and consumer types pass. The final site recheck after
all guide/link additions passes 81 tests with zero failures or skips.
Twenty task-owned tracked/untracked files have a clean whitespace scan.

Temporary evidence uses `/tmp/rmlui-63-completion/element-components-*.log`,
`element-transform-counts-red.log`, `element-transform-token-red.log` and
`*-naming-established.log`. The distinct source review is
`/tmp/rmlui-63-completion/element-components-source-review.md`.

The independent ElementScroll constructor is not implemented by this borrowed
view. No forward class, full Element class, other dependent object or platform
scope is promoted. The full Core nineteen-group acceptance and Tasks 5–10
remain required.
