# Native default FontEngineInterface selection acceptance

This accepts the default Native FreeType engine and the two exact Core global
selection functions. Arbitrary custom font engine virtuals remain pending.
The original RmlUi 6.3 completion task remains active.

## Native contract

`FontEngineInterface` constructs the concrete upstream
`FontEngineInterfaceDefault`, without initializing the global FreeType
provider. `setFontEngineInterface(engine | null)` selects a genuine Native
owner before initialization. An explicit choice survives initialization;
null restores automatic selection. Only the selected active engine performs
font operations, and Core alone calls Initialize and Shutdown.

`getFontEngineInterface()` compares Core's actual pointer with its Native
owner and returns the canonical typed wrapper. It returns null before
selection and after shutdown. Unknown, foreign-environment, stale-generation
and callback replacement attempts are rejected. Weak registry entries are
cleaned on construction and shutdown, without a frame-time engine scan.

All three LoadFontFace overloads share the existing Core font loader.
Memory input retains an immutable Native copy of the exact view until after
Core shutdown, including partial failures. Font families are lowercased at
the default engine boundary, as required by the upstream provider.

Face handles reuse genuine Native font tokens. Prepared effect handles are
bound to their face, engine and font generation. `getFontMetrics` returns an
independent Native-owned numerical snapshot. `TextShapingContext` owns its
language, shares enum/spacing fields and snapshots them before use.
Font size and spacing checks protect the upstream 26.6 shift and int32 cast.

`getStringWidth` and `getStringWidths` call the Native engine.
`generateString` returns owned Native mesh snapshots and manager-specific
atlas texture views. Atlas views verify their font generation before reading
the upstream texture database. Font release invalidates face/effect/atlas
tokens; escaped metric, width and mesh allocations remain valid.

## Observed verification

The reviewed complete runtime run contains 96 unique test files, 905 PASS and
zero FAIL. It ends with
`PASS template-accessors-cannot-use-expired-receivers`.
The separate font suite has nine passing scenarios. The thirteen-case
lifetime suite passes, including exhaustive foreign-worker validation,
environment cleanup and contention.

The focused font cases cover selection and a single provider lifetime,
automatic fallback, all loading overloads, shared metrics and shaping,
bulk measurement, getter-triggered font release and shutdown, element font
tokens, static rendering, generated meshes and stale font resources.

At 1,000, 10,000 and 100,000 strings, each bulk measurement records one
Native entry, zero host callbacks, zero callback snapshot visits and zero
element ownership visits. Thirty-two static text update/render frames record
zero host callbacks, snapshot visits and element ownership visits.
These counters are not complete CPU-frame or GPU timings.

Seventeen focused site checks pass, including public summaries, parameters
and return contracts in English, Chinese, Japanese and Korean.
Consumer fixtures cover all overloads, shared value types, nullable engine
selection and rejection of numeric face/effect addresses.

Evidence files are under `/tmp/rmlui-63-completion/`:

- `font-engine-default-red.log`
- `font-engine-default-reviewed-native.log`
- `font-engine-default-reviewed-focused.log`
- `font-engine-default-reviewed-lifetime.log`
- `font-engine-default-reviewed-runtime.log`
- `font-engine-default-post-format-native.log`
- `font-engine-default-post-format-focused.log`
- `font-engine-default-accepted-lint.log`
- `font-engine-default-accepted-types.log`
- `font-engine-default-accepted-cpplint.log`
- `font-engine-default-accepted-format.log`
- `font-engine-default-reviewed-naming.log`
- `font-engine-default-accepted-site.log`
- `font-engine-default-source-review.md`

The source review is a separate controller review, not an independent review.
Verification found and corrected missing Runtime owner guards on shaping
entry points and incomplete source translations. No worker or documentation
check was exempted.

## Remaining work

Only `Rml::SetFontEngineInterface` and `Rml::GetFontEngineInterface` are
promoted by this acceptance. The Core forward declaration
`Rml::FontEngineInterface` remains pending for custom-engine contracts.
Core and supplemental declaration inventories retain their original records.

The string-array bulk API allocates UTF-8 strings and a width vector per call.
A reusable shared measurement buffer is accepted separately in
[shared measurement acceptance](core-font-measure-buffer-acceptance.md).
Custom-engine shared computation remains open; this string-array acceptance
makes no zero-allocation claim.
HarfBuzz and bitmap selection, Plugin, actual Node/Lua document hosts, optional
modules, GPU/platform/IME verification, applications, full four-language site
and editor/package/CI acceptance remain part of the authorized completion task.
Core/19 and complete initialization latency remain open.
