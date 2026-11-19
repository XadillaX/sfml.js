# Core ElementStyle acceptance

> The actual element-owned style component has local macOS arm64 behavioral
> evidence. Whole Core nineteen-group acceptance and Tasks 5–10 remain open.

## Exact original declaration

`Core/Element.h:402`, `Rml::Element::GetStyle()`, type `ElementStyle *() const`,
is represented by `Element.getStyle()`. It returns the canonical checked
component and retains detached-element ownership. Element destruction,
shutdown and subsequent runtime generations invalidate old views.

The forward `Rml::ElementStyle` class record and independent native constructor
are not promoted by this accessor. Runtime Initialize/Shutdown remain managed
operations; a public method cannot invalidate global style storage.

## Actual component methods

| Native methods | Consumer contract |
| --- | --- |
| UpdateDefinition | Explicit native stylesheet definition update. |
| SetPseudoClass, IsPseudoClassSet, GetActivePseudoClasses | Normal/override bits are 1/2; combined active state is 3. Clearing normal state preserves override. The setter returns active membership change. |
| SetClass, IsClassSet, SetClassNames, GetClassNames, GetClassNameList | Native ordered class storage; raw setters preserve component semantics. Lists and state maps are copied. |
| SetProperty, SetCustomProperty, SetVarShorthand | Typed properties are copied and bound to native owners; property/name/shorthand dirty sets remain native. Shorthands require registered IDs and VAR_EXPRESSION string storage. |
| RemoveProperty, RemoveCustomProperty, RemoveVarShorthand | Remove inline overrides with native dirty/fallback rules. |
| GetProperty, GetCustomProperty | Resolve native cascade, inheritance, variables and defaults. Borrowed properties are copied before further native calls or V8 wrapping. |
| GetLocalProperty, GetLocalCustomProperty, GetLocalShorthand | Copy local unresolved values, distinct from inherited/default lookup. |
| GetLocalPropertyWithResolvedVariables | Resolve only a locally specified value. |
| GetSpecifiedProperty, GetSpecifiedCustomProperty, GetSpecifiedShorthand | Copy the cascade before variable substitution. |
| GetLocalStyleProperties | Copy all three inline dictionaries; excludes stylesheet/class definitions. |
| ResolveNumericValue, ResolveRelativeLength | Native finite single-unit arithmetic; RelativeTarget reuses the existing six-value enum. |
| DirtyProperty, DirtyInheritedProperties, DirtyPropertiesWithUnits, DirtyPropertiesWithUnitsRecursive, AnyPropertiesDirty | Real dirty transitions and unit matching; recursion includes non-DOM children. |
| Iterate, IterateAll | Native-order independent snapshots; unique plain IDs, custom/shorthand names, placeholder skipping and exact inherited filtering. |
| ComputeValues | Consume real dirty sets into existing owned ComputedValues and propagate inherited child dependencies. |
| ResolveKeyFrameProperty | Native variable/shorthand resolution with reusable optional cache, dependency set and output storage. |

Raw style class/pseudo setters do not invoke Element's additional definition
dirtying. Consumers explicitly call UpdateDefinition. Normal high-frequency
data expressions, layout and rendering remain in C++.

## Computation and resolver ownership

Owned output must be associated with the same live element. Readonly views and
foreign associated output reject. Density must be finite and positive; viewport
components must be finite. All JS viewport getters complete before borrowing
element, output, parent and document pointers. Expired font handles reject
before consuming dirty sets.

ComputeValues must run parents before children. It does not call
Element::OnPropertyChange or write live element layout. Consumers redirty the
returned IDs before a subsequent Context.update applies native live values.
The four-language TSDoc and guides include this operation explicitly.

KeyFramePropertyResolver preserves the optional shorthand cache until reset.
Keyframe local variables come from the block dictionary, then definition and
ancestor sources. Dependencies clear on every resolution. Results are owned
copies and null represents native resolution failure. Reset is required when
the block or variable environment changes.

A separate source review reproduced retained callback edges in resolver output
storage after shutdown. Weak handle tracking and explicit cache/storage edge
removal now accompany native resource clearing. The dedicated GC regression
retains the resolver across shutdown and requires the callback weak reference
to expire. Old resolver generations cannot revive.

## Shared command boundary

StyleSetNumeric, StyleRemoveProperty, StyleGetNumeric, StyleGetLocalNumeric,
StyleResolveNumeric and StyleResolveRelativeLength use the existing command
planes, prefix snapshots, Native scheduler and ownership checks. The relative
opcode stores RelativeTarget in the property plane.

All six operations are exercised at 1k/10k/100k. Each submitted group enters
Native once, produces zero reverse callbacks, performs zero element ownership
visits and reallocates no command backing. Existing command snapshot,
partial-failure, detached-buffer, transfer, generation, callback and GC tests
remain in the suite.

## Behavioral and source verification

The final runtime run records 82 files, 756 literal PASS markers and zero FAIL.
Eleven style groups cover override state, raw classes, local/inherited/resolved
properties, custom variables, shorthand cache reuse, cycle/failure/null results,
native computation and redirty integration, unit dirtying, event callbacks,
typed storage, destruction/getter reentry, font generation and callback GC.
Seventeen command groups cover all six opcodes and existing buffer contracts.

Lint, cpplint, native build, TypeScript build and consumer types pass. Native
naming uses the established Apple SDK command; seven modified native files pass
format checking. Four-language source/API checks pass 81/81, with zero skips.

Evidence is in `/tmp/rmlui-63-completion/element-style-*`, especially
`runtime-package-final.log`, `commands-all-six.log`,
`resolver-shutdown-red.log`, `resolver-shutdown-green.log`,
`resolver-cleanup-build.log`, `lint-translated.log`,
`cpplint-accepted.log`, `ts-translated.log`, `types-translated.log`,
`naming-final.log`, `format-final.log` and `site-translated.log`.
The separate review is `element-style-source-review.md`.

## Complete CPU frame measurements

The [raw samples and counters](element-style-performance.json) and
[CSV](element-style-performance.csv) retain six successful matrix scenarios,
eighteen workloads and 1,440 timed frames. A separate same-fixture paired probe
adds 160 timed frames, giving 1,600 accepted samples. Platform is Apple M4 Max,
darwin/arm64, Node 22.22.2, RmlUi 6.3, 320×240, highDpi=false and vsync disabled.
Each matrix workload has twenty warmup frames, eighty timing samples, five
separate malloc/counter frames and one separate bridge observation.

| Rows | Dirty load | Element batch p50 / p95 ms | Raw style batch p50 / p95 ms |
| --- | --- | --- | --- |
| 1,000 | Clean | 0.324 / 2.869 | 0.295 / 0.444 |
| 1,000 | 1% roots | 0.527 / 3.111 | 0.481 / 0.700 |
| 1,000 | All | 1.042 / 3.436 | 1.021 / 2.057 |
| 10,000 | Clean | 1.212 / 3.591 | 1.335 / 2.234 |
| 10,000 | 1% roots | 3.579 / 5.283 | 2.773 / 4.704 |
| 10,000 | All | 10.038 / 12.261 | 8.865 / 10.343 |
| 100,000 | Clean | 19.558 / 22.139 | 19.970 / 21.936 |
| 100,000 | 1% roots | 41.694 / 43.495 | 43.435 / 47.939 |
| 100,000 | All | 104.083 / 108.638 | 112.867 / 116.937 |

The matrix uses separate processes. Its 100k timing difference triggered a
paired comparison: one live fixture, identical retained command planes and
alternating AB/BA order across eighty pairs. Element batch records
108.261 / 116.529 ms; style batch records 108.630 / 116.365 ms. Every actual
frame changes data; independent native output checks pass for both paths.
These samples do not establish a statistically significant speed difference.

Clean frames have five forward calls and zero callbacks; dirty frames have
six forward calls and one explicit batch callback at every scale. At 100k,
clean/sparse/all geometry uploads are 0/1/10, while draw submissions are 10 in
all three loads. Element ownership visits, numeric backing allocations, resize
copies and command backing allocations remain zero.

| Raw style, 100k | Clean | 1% roots | All |
| --- | --- | --- | --- |
| Main-thread malloc allocations, median | 96 | 3,132 | 300,193 |
| Main-thread requested bytes, median | 8,628 | 2,409,780 | 31,027,796 |
| Command snapshot bytes | 0 | 24,000 | 2,400,000 |
| Geometry expansion bytes | 0 | 120,000 | 12,000,000 |
| Batch staging copied bytes | 0 | 120,000 | 12,000,000 |
| VBO uploaded bytes | 0 | 120,000 | 12,000,000 |

Fixture construction is measured outside frames: 318.220 ms for Element batch
and 333.091 ms for raw style at 100k. Native rendering and layout still have
linear work and allocations; 100k all-dirty frames do not meet a 60fps budget.
No claim of whole-engine zero allocation is made.

Three initial style attempts stopped on an incorrect assertion expecting six
calls on clean frames. The final assertion uses five for clean and six for
dirty; all three sizes pass. The raw attachment preserves the failed assertion
records rather than deleting attempt history.

CPU timing does not establish GPU completion, other
platform acceptance, all original declarations or official application/visual
acceptance.
