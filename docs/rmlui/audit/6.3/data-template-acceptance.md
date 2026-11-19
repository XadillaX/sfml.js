# Data declaration and template acceptance

The 131 public declaration keys from the five RmlUi 6.3 data headers now have
local macOS arm64 verification. The 70 previously partial keys were reconciled
individually with native execution and the corresponding JS runtime/type
contracts. This is data-interface acceptance on this platform; it does not
complete the full RmlUi plan, GPU measurement or platform/package acceptance.

## Representation and ownership

Native code owns registers, definitions, model roots and independent storage.
JS schemas select actual register-owned native definitions. Member objects use
stored nodes; member value functions use checked scalar callbacks; references
use current native paths and retained target leases. Numerical array views share
native allocations. Geometry, expression evaluation and default controllers
remain native.

`new DataStructHandle(register, definition)` now validates register identity,
native struct kind and generation before sharing the existing schema lease.
It allocates no data storage. The red test previously failed at `isValid` because
the inherited internal constructor accepted a register object as a variable
handle. The runtime fixture verifies construction, shared member insertion,
independent storage, model aliasing and foreign/scalar/reference/custom/stale
rejection. Positive and negative consumer types cover the public signature.

The JS representation deliberately guards numeric conversion ranges, freezes
schemas after storage creation and rejects duplicate members. It does not claim
the same caller memory layout as a C++ object or container. Raw, unique and
shared C++ pointer forms use managed reference leases in JS; C++ code can still
instantiate upstream templates directly.

Upstream `BasePointerDefinition` checks the outer storage address. It can
dereference a null pointee before invoking an underlying definition. The JS
adapter additionally checks the target, with documented null read/write/size/
child behavior. Valid target forwarding is verified separately from this
additional guard.

## Exact declaration reconciliation

The operation ledger retains every complete
`header:line:kind:name:signature` key, including repeated out-of-line template
definitions. Each promoted record names its native assertion and JS contract.
Its `exact_native_evidence` field resolves to the native probe evidence group;
the two ordinary event-function records use native RML callback tests.

| Header | Individually reconciled source lines | Native and JS evidence |
| --- | --- | --- |
| `DataModelHandle.h` | 12 | Actual native model constructor; checked constructor/root/lifetime tests |
| `DataModelHandle.h` | 42 | `Bind<T>` for scalar, struct, vector, array and list; native-owned schema/root/resize tests |
| `DataModelHandle.h` | 52, 56 | Native data event controller and actual member receiver overload; live Event/model/argument tests |
| `DataModelHandle.h` | 72, 116 | Actual `RegisterScalar<Payload>`; scalar payload, void setter, absent callbacks and collection |
| `DataModelHandle.h` | 78, 151 | Actual `RegisterStruct<Record>`; recursive/member definitions and reflection |
| `DataModelHandle.h` | 82, 136 | Custom unique-definition insertion and accepted/rejected destructor counts; custom callback/payload lifetime |
| `DataModelHandle.h` | 91, 170 | Actual vector/array/list registrations; size/index/write/default/resize behavior |
| `DataModelHandle.h` | 103 | Actual register pointer identity; canonical shared/default register leases |
| `DataStructHandle.h` | 13, 15 | Actual direct `StructHandle<Record>` construction; checked JS constructor and negative inputs |
| `DataStructHandle.h` | 29 | Actual member object pointer; stored parent/recursive member contracts |
| `DataStructHandle.h` | 45 | Actual scalar value, reference and raw-pointer getters; checked current-target forwarding |
| `DataStructHandle.h` | 61 | Actual getter/setter pair; scalar conversion, readonly/setter-only and two-way controllers |
| `DataTypeRegister.h` | 24, 36 | Actual native register and scalar/custom/raw/unique/shared definition lookup; family identity/provenance |
| `DataTypes.h` | 9, 10 | Native definition/register forward declarations resolved to the verified native adapters |
| `DataTypes.h` | 18 | Actual native RML data event callback with expiring Event and owned expression values |
| `DataTypes.h` | 21, 23 | Actual Variant member getter/setter aliases; typed bound host receiver function tests |
| `DataTypes.h` | 31, 33 | Actual value member aliases; member getter/setter and reference callback types |
| `DataTypes.h` | 70 | Native readonly and explicit getter-absent `VoidMemberFunc` definition; omitted JS callbacks |
| `DataVariable.h` | 27, 28, 29, 30 | Native reads/writes/size/children across definitions; current checked JS paths and invalid inputs |
| `DataVariable.h` | 46, 48, 49 | Native inheritance/destruction/category; definition reflection, register ownership and callback GC |
| `DataVariable.h` | 51, 52, 54, 55 | Native default operations and custom scalar overrides; full JS custom Get/Set/Size/Child contracts |
| `DataVariable.h` | 70, 72, 74, 79 | Actual scalar construction/Get/Set; every checked storage width, bool/string and native controllers |
| `DataVariable.h` | 95, 97, 99, 106 | Actual scalar callback construction and absent-function results; payload conversion/lifetime |
| `DataVariable.h` | 119, 121, 123, 127 | Actual struct construction/children and unique member insertion; checked stored/callback members |
| `DataVariable.h` | 134, 136, 140 | Actual vector/array/list definitions and direct vector growth; native indexed storage and resize |
| `DataVariable.h` | 169, 171, 173, 174, 175, 176 | Actual scalar/struct/array forwarding and outer-null guards; managed current-target and null-pointee checks |
| `DataVariable.h` | 188, 190 | Actual raw/unique/shared pointer definitions and explicit construction; managed pointer traits/leases |
| `DataVariable.h` | 197, 199 | Actual member object definition; checked stored member defaults and provenance |
| `DataVariable.h` | 211, 213 | Actual reference/raw-pointer/array-reference member definitions; suffix, retargeting and lifetime |
| `DataVariable.h` | 231, 233, 239, 254 | Actual scalar member pair/readonly/setter-only definitions; conversion and omitted callback outcomes |

## Observed verification

`data-template-package.log` records `npm test` exit zero: native/TS builds,
lint, cpplint, consumer types and 78 runtime files with 708 literal PASS lines
and zero FAIL. The focused definition fixture passes eight groups.
`data-template-site.log` records site lint and 81 tests passing, zero failed or
skipped, including all four source-comment locales.

`data-templates-native.log` records three passing native groups with assertions
enabled. It links the existing vendor object files using C++20, `-fno-rtti`,
`RMLUI_STATIC_LIB`, dead stripping and zlib. The executable and logs use the
existing task temporary directory; no additional build environment was created.
Native format, production naming and native-probe cpplint checks pass.

The source-level ledger is 131 unique records, all locally verified. Its
`scope_complete` stays false. Continue the exact Core ledger, nineteen Core
acceptance groups and Tasks 5–10; these results do not waive remaining gates.
