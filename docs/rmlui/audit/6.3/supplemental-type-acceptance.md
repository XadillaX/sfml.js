# Supplemental type relationship acceptance

> Local macOS arm64 execution verifies seven original declaration sites through
> 20 existing consumer suites: 198 PASS and zero failed files. Six sites are
> forward declarations; the seventh is the static Factory class. Full Core
> nineteen-group and whole-integration acceptance remain incomplete.

The [declaration map](supplemental-type-declaration-map.json) retains the
original inventory indices and complete declaration keys. The
[execution evidence](supplemental-type-evidence.json) fingerprints the actual
sources, every executed suite and its complete log. The original 3,926-record
inventory is unchanged.

## Exact declaration relationships

| Original site | Actual native consumer | Verified managed contract |
| --- | --- | --- |
| `FontEffectInstancer.h:10`, Factory | Native friend declaration; registry lookup in `PropertyParserFontEffect` | The existing static registry facade; no extra method or private property exposure |
| `FontEffectInstancer.h:11`, FontEffect | `SharedPtr<FontEffect>` from the actual instancer | Owned effect copies, parser-written fingerprints, custom glyph virtuals and retained callbacks |
| `Decorator.h:16`, StyleSheet | Const stylesheet reference in `DecoratorInstancerInterface`; `GetSprite` | Owned interfaces retain their sheet/cache; callback-borrowed interfaces expire; sprite metadata is copied |
| `Factory.h:37`, Factory | All 31 original public operation declarations | Nine instancer categories, checked parsing/streams/caches, structural names and runtime lifecycle |
| `EventInstancer.h:10`, Event | `EventPtr` allocation and `Event*` release | Original allocation owner, single transfer, active release guards and exact release callbacks |
| `EventListener.h:9`, Event | Actual `ProcessEvent(Event&)` callback | Checked dispatch leases and canonical live targets; escaped operations reject after expiry |
| `EventListener.h:10`, Element | Observer-backed native attachments and event targets | Copied attach/detach id/tag notifications and live target/current facades during dispatch |

Forward declarations add no independent methods at their forward sites.
Factory's private constructor and destructor do not become public JS
constructors. Its friend relationship does not expose `volatile_properties`.
The actual font-effect parser computes the fingerprint from the parsed
properties; the binding copies callback-returned effect state before that write.

The Factory class record was reconciled against its 31 operation records,
including the event, listener, data-view and data-controller registries.
Those records already have individual local acceptance. Their current consumer
suites execute real registry lookup, creation, dispatch, data updates, transfer,
replacement, null results, exceptions and shutdown.

The Event and Element forward sites retain their specific consuming contracts.
Attach/detach notifications contain copied metadata. Event callbacks expose
checked live element references. Full Element method acceptance does not follow
from listener execution. Exact value-template and ScriptInterface acceptance
remain linked to their existing separate records.

## Observed execution

Twenty existing suites executed in the current package and native build,
without a repository copy or isolated environment. They cover Factory and
document streams, context/element/effect/filter/data instancers, event/listener
instancers, default events, dispatch, ScriptInterface, template destinations,
font callbacks and ownership, alpha rendering, decorators and stylesheets.
All 20 commands exited zero, producing 198 literal PASS lines and no FAIL lines.
Per-suite names, counts, source hashes and logs are in the execution evidence.

Supplemental's 1,547 original records now contain 1,540 locally verified
operation/value records, six locally verified managed type sites and one
reviewed opaque forward. No Supplemental partial record remains.
Core's separate ledger remains 482 local operation records, 54 managed type
records and 13 reviewed private forwards.

The full inventory now cross-references nine maps. The new seven-record map
overlaps existing ledger rows: 2,859 original records are represented and
1,067 remain unrepresented. Representation is not an acceptance count.
Remaining supporting declarations, Lua follow-ups, Core nineteen groups,
optional modules, initialization/GPU/platform checks, applications/visuals,
editor/package/CI and the whole-scope review remain active.
