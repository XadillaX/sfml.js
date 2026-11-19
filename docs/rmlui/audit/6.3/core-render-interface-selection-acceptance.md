# Native renderer selection acceptance

> Renderer selection and native window ownership are verified on macOS arm64.
> Font engines, Plugin, arbitrary renderer customization and whole Core/19
> remain open.

## Core selection and ownership

`createRenderInterface(window)` creates the existing Native SFML renderer before
or after initialization. `setRenderInterface(renderer | null)` calls the actual
Core setter before initialization; initialization preserves the selected
renderer. Null restores automatic selection. Runtime/callback replacement,
foreign environments, forged tokens and stale generations are rejected.

`getRenderInterface()` reads the actual Core pointer and returns its canonical
checked token. It returns null before selection and after shutdown. Unknown
native providers are rejected rather than wrapped with unchecked addresses.
Setup tokens belong to the next runtime generation and remain usable after
successful initialization, including unselected interfaces.

The selected renderer may use another window from the system interface.
Contexts use the selected render window; the initialization window still
provides system timing, input and DPI. The independent-window pixel test renders
red into the selected target and verifies the system window remains blue.

Native managers, geometry, layers, filters, resources and draw batching retain
their existing implementation. Selection introduces no per-draw JS callback
and does not change the geometry or immutable draw snapshot contract.

## Collection and shutdown

Unused tokens are indexed by a weak Native registry. Their window relationship
is a V8-visible private edge backed by a weak native persistent. A regression
fixture creates a window-to-renderer cycle, selects then resets that renderer
and proves both objects are collectible. The fixture failed with the original
strong window persistent before the ownership correction.

Selection retains the native window. Core context construction, explicit
render managers and resource preloading retain their renderer before resources
borrow its pointer. Used renderers retain their windows until shutdown, including
after context removal or unused-manager cleanup. Wrapper GC does not destroy
native borrowers; surviving contexts can recover a canonical interface token.

Shutdown releases contexts, detached resources, font layers and all render
managers before renderers and their window leases. Setup-only shutdown clears
Core's borrowed pointer as well. Selected and unused tokens are invalidated.
Private window edges are cleared even from retained stale wrappers, so a saved
invalid renderer does not retain the window. Native destructors invoke no JS.
Registry cleanup is amortized at interface creation and adds no frame scan.

## Observed verification

Seven initial startup cases failed before the integration. The separate cyclic
owner case reproduced an uncollected native window before private-edge ownership.
The complete runtime pass includes every existing suite and eleven renderer
startup scenarios:

| Verification | Result |
| --- | --- |
| Complete runtime suite | 95 unique files, 896 PASS, zero FAIL |
| Renderer startup scenarios | 11 PASS |
| Separate render/system windows | Red selected target, blue system target |
| Static selected renderer | 32 updates and renders, zero Native host callbacks |
| Static ownership work | Zero callback snapshot and element ownership visits |
| Native formatting | Eight changed files, zero violations |
| LLVM naming | Six compilation units, zero failures |
| Site/API localization | 17 tests, 17 PASS, zero FAIL across four locales |

Native/TypeScript compilation, consumer types, ESLint and cpplint pass. Final
post-review rebuilding and all eleven startup scenarios verify the resource
release ordering. The existing resource, render-state, layer pixel and preload
suites remain part of the complete runtime acceptance.

The separate controller source review is recorded in
`/tmp/rmlui-63-completion/render-interface-source-review.md`; it is not an
independent review. Logs, final builds and source hashes accompany the exact
global setter/getter ledger rows. The Core denominator remains 549 and the
supplemental denominator remains 1547. Only the setter status is newly promoted;
the getter's existing local acceptance is refreshed with nullable setup semantics.

This result establishes renderer global selection and resource-safe ownership.
It does not establish arbitrary renderer customization, font engine selection,
Plugin, full initialization latency, GPU timings, other platform execution or
completion of the remaining original plan.
