# Independently owned data variable acceptance

Local macOS arm64 acceptance covers `new DataVariable(schema, initialValue)`
and binding its retained storage through `bindCustomDataVariable()`.
The full completion plan remains open.

The checked constructor pairs the registered native definition with independent
native storage. It supports scalar and enum conversion, arrays, recursive
structs, nullable references, custom payloads and member callbacks. No hidden
model or raw host pointer is required. Numeric arrays keep the existing shared
backing store; resize preserves old views while variable paths resolve current
storage. Registers own definitions and callbacks, and variables retain the
register. Borrowed registers expire with their context; all registers expire
with the runtime generation.

Child handles retain a canonical root wrapper. Payloads, callback receivers
and reference targets are retained through V8-visible edges, while native
reference paths use weak owners. Unreachable reference and callback cycles
collect. Model aliases retain independent storage until model removal. Native
member callbacks receive checked current parent paths, and custom child paths
can forward shared views and resizing to model or independent targets.

The full regression run exposed a recursive reference error being replaced by
a generic path error. Path resolution now captures the first exception before
applying the absent-path fallback, preserving the original `RangeError`.
Initialization accessors preserve thrown error identity and recheck the
register after runtime destruction.

## Verification

- `npm test` exits zero: 78 runtime files, 707 literal PASS lines, zero FAIL.
  This includes lint, cpplint, native/TypeScript builds and consumer type checks.
- Nine owned-storage groups cover shared writes and resize, exact integers,
  mixed model/owned references, custom/member callbacks, payload retention,
  unreachable cycles, context/generation expiry, destructive reentry, input
  accessor errors and model-alias release.
- Final constructor overload declarations pass package lint, TypeScript
  compilation and consumer fixtures. All 81 site tests pass, including all
  four public API languages. Each constructor overload has its own matching
  parameter documentation.
- Changed production native files pass formatting and compiler-backed naming.
  The native template probe compiles against existing vendor objects and runs
  with assertions enabled. It exercises direct definition/storage construction,
  scalar/function/default definitions, member objects, value/reference/pointer
  getters, setters, managed native pointer forms, vector/array/list containers,
  model registrations, event receivers and definition destruction.

Tests are `packages/sfml.js-rmlui/test/data-owned.test.cjs`,
`data-owned.types.ts` and `test/native/data-templates.cc`. Logs and the distinct
review use `/tmp/rmlui-63-completion/data-owned-*` and `data-templates-*`.
Existing frame-performance artifacts retain their original measured sources;
these API regressions do not provide new GPU or frame timing evidence.

The [data ledger](./data-operation-ledger.json) retains every native declaration.
Remaining template/interface rows require individual evidence reconciliation.
Core's nineteen groups and Tasks 5–10 continue under the original plan.
