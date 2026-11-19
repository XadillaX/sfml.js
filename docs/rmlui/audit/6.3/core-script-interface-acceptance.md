# Native script-interface and event-element contracts

> Native base identity, default script-object reads and typed event-element
> conversion have checked implementations and focused lifetime coverage.
> Document script execution, non-null script adapters and the full value
> template review remain open.

## Representation

`ScriptInterface` is an abstract TypeScript base of Element and RmlEvent.
Direct JS construction rejects; concrete facades retain their existing native
allocation, observer, callback-lease and release rules. This models the native
abstract Releasable inheritance without inventing an independently owned
ScriptInterface. C++ type aliases remain in the compiled upstream headers;
exported types and native `isClass` provide the consumer equivalent.

The upstream Event does not declare independent RTTI. It inherits
ScriptInterface's `GetStaticClassIdentifier`, `GetClassIdentifier` and
`IsClass`. Element explicitly declares ScriptInterface as its native RTTI
parent. Native addresses stay inside the existing class registry; public
ClassIdentifier symbols never expose their bits or retain object ownership.

Element and event `getScriptObject()` call the native virtual. Ordinary
upstream implementations return null. JS-only subclassing does not install a
native script object. An unregistered non-null ScriptObject throws rather
than exposing an arbitrary pointer. This does not establish a working
document script host or complete non-null ScriptObject adaptation.

Event RTTI and script reads resolve authentic EventHandle state. Released
events, expired individual callback leases, destroyed owned references and
old runtime generations reject. Nested dispatch leaves the outer callback
valid. Element reads use the checked ElementHandle and require an initialized
runtime; shutdown rejects before access, and reinitialization does not revive
the old element. Static tokens survive restart in the same module.

## Typed pointer conversion

`getElementParameter(name, defaultValue = null)` maps a native
`GetParameter<ScriptInterface*>` conversion to a checked Element or null.
It narrows through actual native RTTI. Missing and nonconvertible values keep
the live fallback. The exact upstream `drag_element` void-pointer contract
is accepted only for native drag EventIds. Arbitrary pointers and incompatible
script objects reject.

Every call validates the native event and its owned references before
borrowing parameters. No persistent attribute receives an unchecked element
pointer. A returned facade has the element's own lifetime; the event does not
make an attached node immortal. Mutation of the JS parameter snapshot does
not change native conversion results.

The source review checked an additional suspected release path before
changing ownership code. Its regression passed with the existing protection:
DictionaryFromJs calls ElementOf only after accessors, and ElementOf records
the parameter in the outer boundary's active elements. Manual owned-event
processing pins its observer references. Releasing either parameter inside
those callbacks already rejects. No ownership change is attributed to that
pre-existing behavior; the regression remains checked in.

## Verification coverage

`test/script-interface.test.cjs` contains ten scenarios covering pre-init
static identity, direct abstract construction, actual element inheritance,
upstream null script objects, owned and borrowed events, nested leases,
fallback conversions, canonical element identity, destroyed references,
authentic receivers, runtime restart and GC of event-element ownership edges.

The initial nine scenarios fail on the original missing interface. The
abstract-construction assertion has its own recorded failing run. The
additional parameter-release regression passes before ownership changes.
Existing input tests also exercise the new typed conversion on real
dragstart and dragdrop events. Consumer TypeScript fixtures cover abstract
construction, ScriptInterface inheritance, opaque tokens, nullable element
outputs and rejected pointer defaults.

Four-language document and native-type guides describe these contracts.
Package verification also covers the existing Event, default-action,
instancer, listener and ownership tests. Exact final command results and
source hashes are retained in the authoritative operation ledger under
`/tmp/rmlui-63-completion`.

The complete `npm_config_jobs=4 npm test` exits zero: 88 unique runtime files,
823 PASS, zero FAIL, including all ten new script-interface scenarios.
Lint, cpplint, Native build, TypeScript and consumer types pass.
All 81 site tests pass after translating the protected constructor summary.
The final source-only TypeScript and lint checks also pass. Both changed
native units pass formatting and compiler identifier checks.

## Open scope

The pinned baseline inventory contains eight ScriptInterface declarations,
not nine. It includes the class, three RTTI methods, two aliases, destructor
and GetScriptObject. Class customization and non-null script-object adaptation
remain partial. Element's inherited RTTI alias can be accepted independently
from those script-host requirements.

The event pointer adapter is accepted locally; full GetParameter template
coverage remains partial while exact type mapping and script customization
remain open. Property and persistent-attribute pointer templates are not
promoted by these event tests. Core A1/A3/A4/A19 have additional evidence;
the whole Core/19 gate and Tasks 5–10 remain incomplete.

Exact accounting promotes one original row, Element's RTTI parent alias.
Core retains 549 unique rows: 459 local, 17 partial and 73 pending.
Eight ScriptInterface compiler records are added to the supplemental ledger;
six are local and two retain explicit script-customization gaps. Supplemental
values retain 1482 unique rows: 1469 local, twelve partial and one reviewed
opaque forward declaration. Data remains 131 local.
