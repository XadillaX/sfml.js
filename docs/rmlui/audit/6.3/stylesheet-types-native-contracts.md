# Stylesheet and shared Native type contracts

> Focused local macOS arm64 acceptance: six Native groups and nine consumer
> suites with 101 passing scenarios. The 135 declaration routes include
> source-reviewed forwards and do not establish complete Core acceptance.

The [exact declaration map](stylesheet-types-declaration-map.json) retains
36 original `StyleSheetTypes.h` rows, 98 `Types.h` rows and `HashCombine`.
Each record keeps its original inventory index and exact key. The original
3,926-declaration inventory remains unchanged.

## Media query correction

A negated conjunction could ignore a later failing condition. For example:

```css
div { width: 1px; }

@media not (min-width: 100px) and (min-height: 200px) {
  div { width: 9px; }
}
```

At an `80 × 240` context, the binding returned width `1` when it should return
`9`. The regression is recorded in the
[fingerprinted evidence](stylesheet-types-native-evidence.json).
The Native evaluation now stops after any conjunction member fails, then
applies the `Not` modifier to the complete result. The durable dependency patch
preserves the correction across dependency preparation.

Native and JS consumers check `160 × 120`, `160 × 240`, `80 × 240` and
`80 × 120`. They verify both output properties and the original
`UpdateCompiledStyleSheet` changed/unchanged result. Existing positive media
queries across all fourteen features remain covered by the specification-ID
suite.

## Native contracts

| Group | Verified behavior |
| --- | --- |
| Scalar/handle/index ABI | byte, ScriptObject, TouchId, nine external handle aliases, Unicode constants, BoxArea values, enum storage widths and invalid index sentinels |
| Configured aliases | Numeric/color/matrix aliases, Native releaser pointers, configured class/value containers, touch storage and Variant list values |
| Hashing | PropertyId/Character/FamilyId hash specializations, their underlying aliases and configured HashCombine |
| Keyframes/decorators | Sorted timeline, complete last-block replacement at duplicate times, actual property IDs, borrowed instancer identity and independent dictionary copies |
| Media blocks | Default modifier/empty storage, explicit constructor and shared stylesheet identity, copied query properties, negated conjunction and unchanged compilation |
| Selector index | ID/class/tag/other priority, repeated-class deduplication, ordered Native node-list cache identity and its actual hash specialization |

The fixture links the active vendor objects from the existing build. It creates
a Core context but never draws, loads textures, creates a JS runtime or runs Lua
models. Two binding-only context cleanup hooks are documented in the fixture.
The fixture's assertions are enabled; vendor objects retain their package
Release flags. Matrix checks describe this package's current column-major
configuration.

Duplicate keyframe times follow pinned RmlUi's complete last-block replacement.
The new consumer case verifies that a width declaration from an earlier block
is absent from the later block, rather than inventing a merged-property result.
`getKeyframes` and `getNamedDecorator` continue returning independent snapshots.

## Consumer and verification evidence

| Consumer suite | PASS |
| --- | ---: |
| style-sheet | 14 |
| specification-ids | 3 |
| input | 13 |
| variant-scalars | 5 |
| animation-values | 10 |
| decoration-values | 7 |
| numeric-value | 7 |
| script-interface | 25 |
| layout | 17 |
| Total | 101 |

The changed Native dependency object and addon were rebuilt in the existing
build tree. Package lint, all consumer TypeScript fixtures, Native fixture
naming/format/style and dependency-patch idempotence pass.
The source review was performed by the implementer and is explicitly recorded
as non-independent.

## Acceptance limits

Forward declarations refer to existing definitions and keep those definitions'
separate operation acceptance. Aliases establish representation and ownership;
they do not add JS hash tables, JS subclasses for internal selectors, scalar
raw addresses or additional constructor APIs.

The [full reconciliation](full-inventory-reconciliation.json) uses eighteen
inputs: 3,896 represented declarations and 30 unmatched declarations.
All fifteen preceding on-disk inputs retain their original bytes.
Representation includes partial, pending and source-reviewed rows, and is not
a pass count.

Debugger, Lottie and SVG still require six, eleven and thirteen declaration
routes respectively, as well as real implementations and execution evidence.
Nineteen Core groups, full renderer effects, GPU timing, platform IME, optional
modules, twenty official applications, 113 VisualTests, editor/browser/package
and CI acceptance remain open. No new complete-package build, isolated install,
publication or complete integration acceptance is claimed.
