# Native Lua declaration consumers

> Thirteen direct Native/Lua consumer scenarios pass on macOS arm64.
> The original 55-declaration map remains unchanged. These are implementer
> checks of concrete types in the managed VM; independent whole-scope and
> arbitrary external-VM acceptance remain open.

## Registration and exact consumers

[The native extension](../../../../packages/sfml.js-rmlui/test/native/scripting/lua-contracts.cc)
uses the already loaded package and its real Lua 5.4.8 VM. It does not copy a
runtime or create a separate installation.
[Its descriptor types](../../../../packages/sfml.js-rmlui/test/native/scripting/lua-contract-types.cc)
instantiate the public templates with a native value and an actual Element
subclass. The subclass implements RmlUi RTTI and inherits the upstream Element
method/getter/setter tables before overriding matching entries.

| Original declaration group | Actual consumer |
| --- | --- |
| Eight descriptor records | Method/name/function-pointer tables, getter/setter macros and registered native calls |
| Twenty template records | Register, push, check, thunk, GC, table registration, ExtraInit and checked Element casts |
| Fourteen runtime-source records | Index/newindex fallback, equality, pointer formatting and integer index conversion |
| Two Variant utilities | Direct null/scalar/vector/colour round trips plus the existing managed value/owner fixtures |
| Ten managed interpreter records | Existing interpreter, function-reference and coroutine acceptance |
| One external-VM overload | Remains pending; no arbitrary VM pointer input is exposed to JS |

Template results concern the actual instantiated native value and Element
subclass. Borrowed custom values still require their extension owner to retain
the allocation; registration alone cannot detect an arbitrary external free.
Borrowed Element aliases use the native observer and reject after destruction.

## Index and nullable receiver corrections

The original `PushIndex` added one in `int`, so `INT_MAX` produced
`-2147483648` rather than `2147483648`. `GetIndex` narrowed 64-bit Lua input
before subtracting and accepted values outside the native range. Conversion now
uses the wider Lua integer, checks the one-based range before subtraction and
narrows only the checked result:

```cpp
// Native int bounds are checked as one-based Lua integers.
if (value < minimum || value > maximum)
    return luaL_error(L, "RmlUi index out of range");
return static_cast<int>(value - 1);
```

Boundary fixtures cover both ends, zero-to-`-1`, 64-bit extrema, values that
would truncate, fractional numbers, nil/boolean errors, numeric-string
compatibility and recovery after errors.

The managed `thunk` acquired its access guard before testing a nil receiver.
That guard rejected nil, preventing the original nil-return branch from
running. The null branch now precedes the guard. Live receivers remain rooted
through Lua GC and C++ exception unwinding.

Both changes ship in the existing
[Lua dependency patch](../../../../packages/sfml.js-rmlui/tools/dependencies/patches/patch-rmlui-lua.cjs).
Two installer repeats write zero files. The fixture retains upstream
`Element:SetAttribute` string conversion and ignored unknown-property
assignment.

## Behavioral verification

[The explicit native suite](../../../../packages/sfml.js-rmlui/test/scripting/lua-native-contracts.cjs)
checks thirteen scenarios: direct Variant/null contracts; full push/read index
domains; rejected narrowing; descriptors and dispatch; inherited overrides;
script methods and function/table fallbacks; type errors and stack recovery;
pointer formatting and equality; owned/borrowed GC; rooted method-error
unwinding; successful/failed/expired Element casts; and isolated registrations
in two managed VMs.

GC checks count native destructor calls, repeat manual `__gc` safely, reject
access to collected userdata and verify a borrowed allocation was not deleted.
Registration starts above an existing stack marker and returns with the same
outer frame. No raw foreign userdata or fabricated VM owner is used.

The package rebuilds in its existing directory. Native consumer naming,
formatting and cpplint, package lint, TypeScript consumer types and
four-language source comments pass. Script guides describe these contracts in
English, Chinese, Japanese and Korean. Compiler naming checks suppress
third-party-header diagnostics; they report no owned-source naming failure.
Dependency checks still emit the existing Node `punycode` deprecation warning.

The complete runtime runner exits zero: 128 recursively discovered test files,
1,220 literal PASS lines and zero failures. The thirteen explicit native
consumer scenarios run separately against the same final package binary.
This verifies the current package suite; it does not substitute for the
nineteen Core acceptance groups or independent full-integration review.

The original inventory retains 3,926 declarations and SHA-256
`2459e6eb1b8cf4d570d7915043862b3cb70162171da0a556f2b8df61df709f13`.
[Fingerprinted evidence](lua-native-evidence.json) records exact declaration
keys, current source/binary/log identities and executed checks. Complete Core,
renderer/GPU/platform IME, modules, twenty applications, 113 VisualTests,
browser/editor/package/CI and independent whole-scope acceptance remain open.
