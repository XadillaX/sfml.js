# Managed Lua value ownership

> The managed Lua value and callback fixtures pass locally on macOS arm64.
> Registered external void* and ScriptObject sources have separate local evidence.
> Registered arbitrary Native ScriptInterface sources have follow-up evidence.
> Complete acceptance remains open.

## Exact declarations

This review concerns only the two original `Lua/Utilities.h` declarations:

- Line 30: `Rml::Lua::PushVariant(lua_State*, const Variant*)`.
- Line 33: `Rml::Lua::GetVariant(lua_State*, int, Variant*)`.

Their full compiler keys include the header, line, declaration kind, qualified
name, signature and return type. The original inventory contains 3,926
declarations and retains SHA-256
`2459e6eb1b8cf4d570d7915043862b3cb70162171da0a556f2b8df61df709f13`.
Managed runtime evidence supplements these two entries; their external native
extension follow-up status remains open.

## Native values and Lua sources

The 23 scenarios in
[lua-variants.test.cjs](../../../../packages/sfml.js-rmlui/test/lua-variants.test.cjs)
execute actual scripted documents and `EventParametersProxy` reads. They cover
boolean, byte and char limits, signed and unsigned integer limits, float and
double, embedded-null UTF-8 strings, native vectors and colours, guarded
Element/Context/Event pointers, and nonempty transform, decorator, filter,
font-effect, colour-stop and box-shadow values.

Native values without a Lua scalar representation use owned userdata. Copies
keep their native storage, shared pointer expiry slots and resource leases.
Values above Lua's signed integer limit do not wrap to negative integers.
Native event copies expire with the original event scope.

Native `NONE` becomes Lua `nil`; using it in a Lua parameter table omits that
field. Guarded null pointers remain owned userdata and return as explicit null
parameters. A Lua table value converts to native `NONE`; typed
`Event.getParameter` then returns its fallback when conversion fails.
Lua `Element:SetAttribute` retains its upstream string input contract.
Host `call`, `getGlobal` and `setGlobal` retain their separate scalar contract.

## Callback owners and release

The 14 scenarios in
[lua-variant-callbacks.test.cjs](../../../../packages/sfml.js-rmlui/test/lua-variant-callbacks.test.cjs)
verify transition, animation and font callbacks, mixed nested declarations,
deeper filter values, host cycles, native listener/model owners without host
facades, allocated elements without instancer facades, retained invalid
shutdown facades, and empty independent Context selections.

Native VM owners retain their Lua values independently of a JS host facade.
Collectible JS owners obtain private edges and allow self-cycles to collect.
Removing the last Lua value removes callback edges even when the VM stays
selected. Explicit shutdown clears edges before discarding element handles.
The font owner gate performs a final empty refresh after the last native
custom effect disappears.

## Dirty refresh and allocation scope

[lua-variant-ownership-performance.test.cjs](../../../../packages/sfml.js-rmlui/test/lua-variant-ownership-performance.test.cjs)
checks 128, 256 and 512 listeners sharing one VM, and the same numbers of
independently retained function handles. Each scene keeps eight saved values
and one pulse value. It explicitly collects the previous pulse before each
timed interval.

Owner discovery uses stable V8 identity hashes with collision checks. Each
VM contributes its native values once per actual owner. Native roots are
separate from collectible JS roots.

| Scene | Owners | Owner lookups | Identity comparisons | Value copies |
| --- | ---: | ---: | ---: | ---: |
| Shared listeners | 128 | 262 | 259 | 36 |
| Shared listeners | 256 | 518 | 515 | 36 |
| Shared listeners | 512 | 1,030 | 1,027 | 36 |
| Retained functions | 128 | 262 | 3 | 2,340 |
| Retained functions | 256 | 518 | 3 | 4,644 |
| Retained functions | 512 | 1,030 | 3 | 9,252 |

Each interval triggers two Lua owner discovery passes. Function handles keep
separate root arrays, so their value copies and allocation costs grow with the
number of actual owners. Six load scenarios pass. Static intervals have zero
Lua owner passes, lookups, comparisons and value copies, and zero DOM callback
snapshot and element ownership visits.

An additional main-thread malloc profile enables the existing macOS logger
over the same operations. These are the last recorded interval counters;
they are not median allocation counts.

| Scene | Owners | malloc allocations | Requested bytes |
| --- | ---: | ---: | ---: |
| Shared listeners | 128 | 215 | 16,115 |
| Shared listeners | 256 | 215 | 16,115 |
| Shared listeners | 512 | 215 | 16,115 |
| Retained functions | 128 | 7,677 | 640,331 |
| Retained functions | 256 | 15,110 | 1,274,027 |
| Retained functions | 512 | 29,970 | 2,541,579 |

Timings cover the inline Lua value copy and `Context.update`. They exclude
fixture construction, Lua GC, rendering and GPU time. This is a discovery
scaling check, not complete-frame or initialization acceptance.

## Verification and open scope

Final native builds have zero compiler warnings/errors. Ten changed native
units pass identifier naming checks with LLVM 18 and matching headers. Lint,
cpplint and the Core/Lua dependency patch repeat pass; repeat inspects 64
existing files and writes none.

The four-language site passes 81 tests and validates 152 localized pages,
1,595 API pages per language, 303 redirects and all local links/assets.
Unrelated sfml.js type-reference warnings remain in TypeDoc output. Rendered
browser checks and multi-screen acceptance remain separate.

The complete `npm test` exits 0: 109 runtime files, 1,096 PASS lines,
zero failures and zero compiler warnings/errors. It includes lint, cpplint,
native/TypeScript builds, consumer types and the full runtime suite.
[The recorded evidence](lua-variant-runtime-evidence.json) stores the exact
declaration keys, source/log fingerprints, complete package result and six
allocation profiles.

[External native adapter evidence](external-native-adapter-acceptance.md)
now covers registered C++ `void*` allocations, native `GetScriptObject`
overrides, their owner lifetimes and a real Lua copy/expiry path. It adds
evidence to these two Utilities entries without promoting their original
follow-up status. [External ScriptInterface Variant acceptance](external-script-variant-acceptance.md)
adds registered arbitrary Native sources and their original shared expiry.
Unregistered native pointers remain rejected. Remaining Lua
templates/descriptors/casts/index boundaries, Core/Supplemental/unmatched
declarations, optional modules, GPU/platform IME, applications, visual/editor
checks, package CI and whole-scope review remain open.
