# Core owned element constructor acceptance

> Nine concrete native types have owned construction and synchronous release.
> Ten focused groups, 84 runtime suite files with 776 PASS and all 81 site
> tests pass. This document does not establish full Core acceptance.

## Exact original constructor and destructor records

| Original header | Native type | Constructor line | Destructor line |
| --- | --- | --- | --- |
| Core/Element.h | Element | 53 | 54 |
| Core/ElementDocument.h | ElementDocument | 42 | 43 |
| Core/ElementText.h | ElementText | 13 | 14 |
| Core/Elements/ElementForm.h | ElementForm | 18 | 19 |
| Core/Elements/ElementFormControlInput.h | ElementFormControlInput | 21 | 22 |
| Core/Elements/ElementFormControlSelect.h | ElementFormControlSelect | 21 | 22 |
| Core/Elements/ElementFormControlTextArea.h | ElementFormControlTextArea | 21 | 22 |
| Core/Elements/ElementProgress.h | ElementProgress | 37 | 38 |
| Core/Elements/ElementTabSet.h | ElementTabSet | 16 | 17 |

These are compiler-inventory locations in the original headers. Each constructor
has the original `const String&` argument. The consumer equivalent accepts the
tag plus optional copied initial attributes. ElementDocument is named Document
in the facade. Tags do not select or alter the concrete native type.

No forward class, ElementFormControl abstract constructor/destructor,
ScriptInterface alias, or SetInstancer record is promoted by this table.

## Native contracts

Each concrete facade invokes its actual native constructor. Element and
ElementText use the original pool implementations; the other classes use their
typed native generic allocator. One allocator per type is retained independently
of Factory registration. JS subclasses use their nearest registered native
concrete ancestor.

The existing relay is installed before attribute application or publication.
Its first allocator performs final release, preserving native pool provenance
and nested custom instancer order. Custom instancer callbacks can return a
directly constructed detached element. Cloning continues through its recorded
allocator and upstream Factory attribute behavior.

An empty attribute dictionary still initializes Input's default text type.
Construction captures the native generation before JS accessors, transfers an
owned plain snapshot, and rechecks the generation before allocation. Getter
errors, unsupported values and runtime restart cannot publish a partial element.
Ordinary copied attributes do not introduce a Native-to-JS Proxy call per field.
Construction uses two native entries; release uses one.

`release()` rejects attached, borrowed, invalid and active subtrees, then runs
actual native destructors synchronously. All native observers become invalid.
Release snapshots only the affected subtree's wrapper edges and clears former
owner/context references on surviving aliases. Child wrappers retain a detached
root until explicit release or collection.

New-node wrapper ownership work is linear: with 1,000 existing nodes, creating
1,000 more records 1,000 wrapper visits, 2,000 native entries and zero registered
reverse callbacks. Releasing them records 1,000 visits and 1,000 entries.
This does not establish linear initialization for arbitrary callback leases:
their native parent-version rebuilds still require separate acceptance.
Arbitrary DOM reparenting retains its general ownership refresh.

The owned pooled allocator is destroyed after its nodes and before RmlUi's
global pool shutdown. Initial shutdown ordering caused a reproducible native
pool dereference; its backtrace is retained in the evidence.

## Failed child construction

Select checks every child before AppendChild dereferences it and preserves
successful creation/insertion order. Progress rejects a missing fill child.
Text widgets require both actual ElementText nodes and an actual selection
node. They retain the upstream listener/text/selection construction order and
remove all installed listeners, properties and successfully inserted children
when construction throws.

Range retains its slider in local unique ownership until Initialise succeeds.
Failure can no longer publish an uninitialized slider. If an existing input's
type replacement fails, native value/selection/update/render/layout operations
throw a defined error while the type is absent. Reapplying a valid type repairs
it. This is checked failure and retry, not attribute rollback.

All upstream corrections are persisted by exact idempotent edits in
`tools/patch-rmlui.cjs`; the existing dependency tree is reused.

## Evidence and remaining acceptance

The ten focused groups cover all nine types, initial values and RTTI, detached
ownership/identity, active release rejection, custom constructor return and
clone release, invalid inputs/getters/restart, child failure retry, child-held
owner GC, exact configuration entry counts, linear new-node wrapper visits,
range failure/type repair and native child-instancer observation order.

The child-order fixture's first failed run rejected a pure child-count query
inside the instancer callback. The corrected read gate permits that safe native
query and the accepted fixture observes child counts 0, 0, 2. That red result
must not be described as a measured child-order mismatch.

Consumer fixtures are `test/element-constructors.types.ts`; all new exported
constructor/release documentation and four-language guides use source-level
comments. The separate controller source review is
`/tmp/rmlui-63-completion/constructors-source-review.md`, not an external or
subagent review.

Final focused evidence is `constructors-ten-groups.log`; site evidence is
`constructors-site-all.log`. Other logs use the same temporary directory with
the `constructors-` prefix. Initial missing-interface tests, native crash
backtraces, corrected fixture assumptions, failed range construction and
aborted intermediate full runs are retained.

Final `npm test` exits zero. Lint, cpplint, native/TypeScript builds and consumer
types pass. Runtime has 84 unique suite files, 776 PASS and zero FAIL. Five
native source/header files pass formatting and three compilation units pass
compiler-backed naming. All 81 site tests pass with zero failures/skips.
Compiler naming suppresses dependency warnings and existing NOLINT entries;
this is not a claim that every dependency diagnostic is absent.

Final evidence is `constructors-final-package.log`,
`constructors-final-format-accepted.log`, `constructors-final-naming.log`,
`constructors-site-all.log` and `constructors-ledger-accepted.log`.
The ledger retains source SHA-256 hashes and only promotes the eighteen
original constructor/destructor keys above.

Core retains 549 unique records: 446 locally verified, 18 partial and 85
pending. Data retains 131 locally verified records; scope_complete is false.
Core nineteen-group acceptance,
abstract customization, templates/global interfaces, Tasks 5–10, initialization
costs, GPU and platform verification remain open. No commit, push, publication
or whole-project completion is established by this bounded acceptance.
