# Data definition, pointer traits and family registration acceptance

> Local macOS arm64 acceptance covers the interfaces below. The data ledger
> retains 131 declarations: 59 locally verified and 72 partial.
> Whole-plan acceptance remains open.

`DataVariable.getDefinition()` now supplies a checked `DataDefinition` for
inferred scalars, function bindings and static integer literals. Registered
definitions preserve canonical `DataSchema` identity. Unregistered definitions
retain a variable lease and resolve its checked path before every operation.
No native definition pointer or fabricated family identifier crosses into JS.

`DataDefinition.isValid`, `type` and `reflectMemberNames()` preserve native
ownership and callback guards. Model removal invalidates inferred/function
definitions. Independent literals retain their static native definition after
shutdown. Registered custom reflection preserves the first host exception and
rejects destructive reentry. Private function aliases and their newly exposed
underlying metadata suppress empty scalar reflection rather than dereferencing
a model-owned definition after its destruction.

`DataSchema.underlying` returns canonical array element or reference target
metadata. `DataPointerTraits` maps `is_pointer_v`, `element_type` and
`Dereference` to `isPointer`, `elementType` and `dereference(variable)`.
Value dereference preserves the wrapper identity; reference dereference returns
a checked target or null. Wrong definitions, pointer-to-pointer schemas and
expired owners reject. C++ raw, unique and shared pointer ownership forms use
managed native reference leases in JS.

`DataTypeRegister.createFamilyId()` uses the actual native family allocator.
`registerDefinition(id, name, callbacks)` transfers a unique native custom
definition and returns the upstream insertion result. Duplicate identities or
names return false without retaining rejected callbacks. Allocated identities
can be reused in different registers of the current runtime generation.
Unallocated or old-generation identities reject. Name and numeric family lookup
return the same canonical schema.

## Verification

- Seven focused runtime groups cover unregistered lifetimes, recursive
  metadata, value/reference traits, custom reflection errors, caller-selected
  families, private function aliases, rejected callback collection and runtime
  generation changes.
- Full package `npm test` exits zero: 77 runtime test files, 698 literal PASS
  lines and zero FAIL lines. This includes lint, cpplint, native/TypeScript
  builds and consumer type fixtures.
- A separately compiled upstream C++ probe asserts classification, underlying
  types, pointer/value identity and null behavior for values, raw pointers,
  `UniquePtr` and `SharedPtr`.
- All 81 site tests and four-language public declaration checks pass. Final
  declaration comments also pass package lint, TypeScript build and consumer
  type checking.
- Changed native sources pass formatting and identifier naming checks.
  LLVM 18 naming uses its matching resource and C++ headers. Conflicting
  inherited `CPATH` and `CPLUS_INCLUDE_PATH` are removed for that command;
  project compilation flags and the selected macOS SDK remain in use.

Source tests: `packages/sfml.js-rmlui/test/data-definition.test.cjs`,
`data-definition.types.ts` and `test/native/data-pointer-traits.cc`.
Raw logs and the distinct review are in `/tmp/rmlui-63-completion/` under
`data-definition-*`, `data-family-*` and `data-pointer-traits-*`.
The [operation ledger](./data-operation-ledger.json) links the exact evidence
for every promoted declaration.

Remaining data constructor/template contracts require exact native/JS
acceptance. Core's nineteen groups, scripting/Lua, optional modules, complete
renderer/IME/platform evidence, all official applications/visual pages and
documentation/editor/package/CI acceptance continue under the original plan.
