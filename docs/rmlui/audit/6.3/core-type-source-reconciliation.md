# Core type and forward declaration reconciliation

> All 58 previously pending Core type records and nine type-level partial
> records now have exact source mappings. This is a source reconciliation;
> callable, constructor, template and full Core 19 acceptance remain separate.

Subsequent [runtime acceptance](core-type-runtime-acceptance.md) executes
29 associated consumer files with 318 passing scenarios and the three native
iterator transfer contracts. It reconciles these exact type sites separately
from callable/template acceptance. The source-only steps below describe the
original mapping stage.

[The mapping](core-type-declaration-map.json) preserves 67 original keys:
54 managed type representations and 13 private native forwards. It validates
every referenced source and runtime file. No original ledger status is
promoted by generating this artifact.

The baseline [Core review](core.md) explicitly states that forward declarations
do not add concrete APIs at their forward sites. Each type is traced to its
actual definition and managed/native use, rather than excluded by a broad
“internal” label.

The managed group includes Context/DOM/control/event/allocator/data-model
facades, property dictionaries, copied iterator values, transform states,
stylesheet containers/views, sprites and cached decorators. Their callable
contracts and native ownership are individually tracked elsewhere.

Private forwards include the actual native layout engine and formatting boxes,
Context's ScrollController, internal widgets, stylesheet parser/tree,
ElementMeta, stacking traversal and ElementDocument's navigation direction.
`NavigationSearchDirection` is defined only in ElementDocument.cpp and used by
its private directional-navigation search. The public tab search takes a
boolean direction.

Source reconciliation corrected two path assumptions: ElementScroll and
PropertiesIteratorView have concrete public headers, while their forward
sites occur in Element.h. `ElementScroll(element)` now owns a distinct actual
native component, alongside the borrowed element-owned view. Its constructor,
methods and destructor have dedicated runtime evidence in the
[dependent mapping](core-scroll-iterator-declaration-map.json).
Native PropertiesIteratorView operators map to copied property/name arrays and
ordinary JS iteration. All twelve exact declarations are mapped, including two
explicitly deleted copy operations. Three constructor/move rows retain native
transfer execution and exact managed-contract follow-up.

Eight stylesheet type partials contain stale obligations for Stream loading,
element definition matching, attachment and cached decorator instancing.
The current source and tests implement those operations; all eight original
rows now carry their exact source evidence. Event's type-level partial now
includes the completed non-null ScriptInterface adapter evidence while
retaining the separate GetParameter template obligation. Original aggregate
statuses have not been promoted by these documentation updates.

Core's eight remaining value/template rows still require a complete
destination and ownership reconciliation, including the distinction between
managed Element pointers, other actual ScriptInterface subclasses and
arbitrary opaque native addresses. Passing scalar and element tests is not
automatically complete template acceptance.

The two primary recovered ledger sections contain 549 Core records and 1,547
Supplemental records. The original compiler inventory contains 3,926 records,
including 3,814 Core records. Other dependent maps, such as the 131-record data
ledger and the 55-record Lua map, must be reconciled with the complete inventory
before any whole-API claim. [The exact cross-reference](full-inventory-reconciliation.json)
includes seven maps: the two primary ledgers, data, Lua, type forwards,
28 scroll/iterator declarations and 225 Input/EventId declarations.
It matches 2,533 original records and leaves 1,393 without a match. The latter
include the MediaQueryId and FontFaceId enums, conversion and matrix/
math/string/value types, public dependent components and modules. These counts
are representations, not passing runtime features. Other evidence maps and
implemented native/JS equivalents must be reconciled before classifying gaps.
The [Input/EventId mapping](core-input-event-declaration-map.json) uses
fingerprinted indices and group-level sources to avoid duplicating inventory
signatures. It verifies the exact generated member names and values. Per-value
native execution, device and platform acceptance are separate from this source
mapping.

Temporary generators remain under `/tmp/rmlui-63-completion`; outputs belong
to this project's audit directory. All existing source and unrelated changes
are preserved. Full Core 19, public dependency coverage, optional modules,
applications, visual/platform/GPU verification and independent review remain
active.
