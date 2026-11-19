# Core element inspection acceptance

Three exact Core declarations now have local macOS arm64 evidence. Each method
calls the pinned RmlUi implementation through an existing checked element
boundary. Native ownership, model storage and DOM traversal remain native.

| Original inventory key | Consumer contract | Evidence |
| --- | --- | --- |
| `Core/Element.h:568` `GetEventDispatcherSummary()` | `getEventDispatcherSummary()` returns a copied native type/count string, including capture registrations and native deduplication. Detached listeners survive; destroyed receivers reject. | `dom.test.cjs`: `native-dispatcher-summary-counts-and-detachment` |
| `Core/Element.h:574` `GetClosestScrollableContainer()` | `getClosestScrollableContainer()` includes the receiver, tests auto/scroll overflow independently on each axis, and honors overscroll containment without overflowing content. Returns a canonical wrapper or null. | `layout.test.cjs`: `closest-scroll-container-self-axes-containment-and-lifetime` |
| `Core/Element.h:578` `GetDataModel()` | `getDataModel()` returns the canonical checked constructor for the attached native model or null. Detachment, reparenting, model removal/recreation, document destruction and shutdown retain separate element/model lifetimes. | `dom.test.cjs`: `element-model-identity-detachment-replacement-and-query-cost` |

All three new tests first failed because their public methods did not exist.
After implementation, 17 DOM groups and 14 layout groups pass with zero
failures. Positive TypeScript assertions cover the three return types.
Lint, cpplint, native/TypeScript build, consumer types, native formatting,
compiler-backed identifier naming and four localized source-comment checks pass.
Four element-state guides describe the native defaults and lifetime contracts.

The model test queries an already wrapped model 1,000 times. Instrumentation
records exactly 1,000 runtime entries, zero native-to-JS callbacks, zero element
ownership visits and zero data/custom-instance ownership visits. The method uses
the existing pointer-to-weak-owner index and canonical handle cache. It does not
enumerate models, traverse DOM nodes or allocate native model storage.
Debug strings are copied on request, and scroll-container search retains native
ancestor traversal. These are explicit query operations, not per-frame hooks.

Logs use `/tmp/rmlui-63-completion/core-element-inspection-*.log`; the three
initial failures use `core-dispatcher-summary-red.log`,
`core-element-model-red.log` and `core-scroll-container-red.log`.
The distinct source review is
`/tmp/rmlui-63-completion/core-element-inspection-review.md`.

The original ledger still contains all 549 declaration keys, with 400 locally
verified, 20 partial and 129 pending. Its scope remains incomplete. Continue
the remaining Core operations, all nineteen acceptance groups and Tasks 5–10;
this group does not establish whole-plan or other-platform acceptance.
