# Core data and query declaration acceptance

Six formerly pending Core declaration keys now have exact local macOS arm64
evidence. The Core ledger retains 549 original declarations: 397 locally
verified, 20 partial and 132 pending. Its scope remains incomplete.

| Exact header and source line | Contract and evidence |
| --- | --- |
| `Core/Context.h:261` `CreateDataModel` | The exact native overload receives a checked type register or null and `allowMissingVariables`, default false. Duplicate names return null. Shared/default register provenance, late binding, native views/controllers and shutdown are verified in data-model/schema tests. |
| `Core/Context.h:266` `GetDataModel` | Native lookup returns a canonical checked constructor or null; existing bindings, removal and same-name replacement preserve lifetime rules. |
| `Core/Context.h:269` `GetDataModels` | Native map is copied using own data properties; JS wrappers remain canonical. Empty/populated/removed maps and the positive consumer return type are verified. |
| `Core/Context.h:275` `RemoveDataModel` | Native boolean result is preserved; all model/variable/view/controller leases invalidate and callback edges release. Missing/removal/recreation and callback destruction rejection are verified. |
| `Core/Element.h:531` `GetElementById` | Native lookup searches the entire owning document breadth first, or starts at this receiver when detached. Special tokens, duplicate IDs, sibling lookup, non-DOM exclusions and invalid receivers are verified. |
| `Core/Element.h:544` `QuerySelector` | Native lookup searches descendants depth first, excluding the receiver, text and non-DOM children. Duplicate IDs, sibling exclusion, detached roots, empty selectors, wrong argument types and invalid receivers are verified. |

The query tests deliberately distinguish native search order. A deeply nested
duplicate ID precedes a shallower duplicate in depth-first selector traversal;
the shallower duplicate wins the native breadth-first ID lookup. Detached child
ID lookup starts at that child, not at its tree's root. All returned elements
retain existing checked native ownership and canonical wrappers.

`data-template-package.log` verifies all four Context data callables in the
full package run: 78 runtime files, 708 PASS, zero FAIL, with native/TS/lint/type
checks. Two new query groups then pass in `core-query-runtime.log` together
with the existing DOM suite: 15 PASS, zero FAIL. These later additions are
test/documentation changes; no additional full-package count is inferred.

Type fixtures preserve positive nullable Element returns and reject numeric
IDs/selectors. Query search order is documented in four source-comment locales.
Final package lint, TypeScript build and consumer types pass; all four localized
source-comment checks pass with zero failures or skips. Five Core/query files
pass the whitespace check. The review preserves native breadth/depth traversal
and existing handle validation rather than adding a separate query mechanism.
The exact records and logs remain in `/tmp/rmlui-63-completion/`.

Continue the remaining Core operations, all nineteen Core acceptance groups
and the full completion plan. A18's text-input dependencies and A19's remaining
inventory cannot be accepted from this scoped verification.
