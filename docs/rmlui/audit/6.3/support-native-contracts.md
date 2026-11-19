# Native support and application logging acceptance

> Local macOS arm64 acceptance covers 157 exact supporting declarations.
> The full package runs 113 runtime files with 1,131 PASS and zero failures or
> emitted compiler warnings/errors. Full RmlUi 6.3 acceptance remains incomplete.

[The declaration map](support-declaration-map.json) retains every original
inventory index and exact header, line, kind, name, signature and type.
[Fingerprinted evidence](support-native-evidence.json) distinguishes native
support groups, application consumers, archive checks and whole-scope limits.
The original 3,926-declaration inventory and its fingerprints remain unchanged.
Declaration records, ABI aliases and deleted special members are not independent
application features or individual passing scenarios.

## Native and managed responsibilities

| Header | Exact records | Native contract and managed consumer |
| --- | ---: | --- |
| `Config/Config.h` | 27 | Configured containers and owner pointers retain their native ABI; consumers use records, arrays and retained storage. |
| `Core/Debug.h` | 1 | Original `Assert` routes to the selected log sink; assertions and debugger breaks remain native support. |
| `Core/Dictionary.h` | 3 | Mutable/const lookup and typed default conversion; event parameter records retain their checked Variant behavior. |
| `Core/Log.h` | 11 | `Log.message`, `Log.parseError`, six legal `LogType` values and the native count sentinel. |
| `Core/ObserverPtr.h` | 23 | Native observer blocks, copy/move and shutdown lifetime; managed handles detect destruction. |
| `Core/Plugin.h` | 23 | Native plugin ownership, captured callbacks, event masks and checked concrete object wrappers. |
| `Core/PropertyIdSet.h` | 26 | Native bitset algebra and iterators; registered property sets return detached ordered ID snapshots. |
| `Core/Span.h` | 11 | Native borrowed contiguous views; managed mesh/glyph views retain their underlying owners. |
| `Core/StableVector.h` | 11 | Erased slot reuse and stable active indices; native texture registry handles preserve resource validity checks. |
| `Core/Traits.h` | 21 | Deleted copy/move operations, unique release, family identity, native casts/type names and checked class tokens. |

There is no separate JavaScript STL or pointer-syntax library. Borrowed native
spans retain upstream caller preconditions. Managed buffers own the storage they
expose, and resizing produces new storage while existing snapshots remain alive.
Stable native indices can reuse erased slots; application resource handles
still apply their native ownership and validity checks.

Observer copies and moves refer to the same observed object. Copying or moving
the observed object itself retains distinct observer blocks for each object.
The original pool outlives shutdown until remaining observers and objects
release it. Managed leases must reject expired objects before dereferencing.

## Application logging

```ts
import { Log, LogType } from 'sfml.js-rmlui';

Log.message(LogType.Info, '%s: %d', 'loaded documents', 3);
Log.parseError('panel.rml', 12, 'Unexpected %s', 'tag');
```

Both helpers validate and format scalar arguments, then dispatch through actual
`Rml::Log` inside one runtime-owned Addon entry. The shared scalar formatter
retains the existing native string formatting contract; logging does not call
the public formatter through a separate bridge entry.

Logging preserves the original 1,021-byte payload limit and C-string NUL
termination. `ParseError` applies the native message truncation followed by
filename/line-prefix truncation. A negative line omits the line number. A
percent sign inside a value never becomes a second format string. The native
helpers ignore the log sink's boolean result, while host exceptions propagate
at the safe runtime boundary. Foreign environments and callback reentry are
rejected. The native `LT_MAX` count sentinel is not a legal managed severity.

The English, Chinese, Japanese and Korean getting-started guides contain the
same executable example and localized contracts. Public source TSDoc supplies
all four descriptions and parameter contracts.

## Verification

The permanent
[native probe](../../../../packages/sfml.js-rmlui/test/native/support-contracts.cc)
links the existing production objects and executes eight original support
groups. Its
[runner](../../../../packages/sfml.js-rmlui/test/native/build-support-contracts.py)
reuses the current macOS package build, with assertions and libc++ header
hardening enabled. It creates only an executable in the existing temporary
output directory.

The complete `npm test` result covers lint, native style, production build,
consumer types and all 113 runtime files: 1,131 PASS and zero failures.
Nine supporting consumer suites contribute 82 of those passing scenarios;
these are included in the total, not additional passes. Four-language TypeDoc
contract checks pass in all four languages, and all eleven guide-routing tests
pass. Both changed native units pass identifier naming checks. Dependency
deprecation notices and suppressed dependency diagnostics remain distinct
from native compiler warnings.

The actual archive contains 598 entries and 1,512,624 bytes. Twelve selected
source/dist files match the current package byte for byte. The previous
String/URL archive remains retained. No isolated installation or execution
from the packaged archive is claimed.

## Remaining scope

[Inventory reconciliation](full-inventory-reconciliation.json) now includes
twelve maps: 3,563 represented declarations and 363 still requiring source and
execution reconciliation. Representation is not a pass count. Original Core
and Supplemental ledger acceptance categories remain unchanged.

The remaining supporting declarations include XML parser extensions, renderer
and font contracts, style/scroll/type facilities and optional module headers.
Full Core nineteen-group acceptance, Lua follow-ups, optional modules,
initialization/GPU/platform IME checks, twenty applications and 113 visual
cases, rendered documentation, editor/package/CI and the whole-binding review
remain open. No commit, push or publication is performed by this checkpoint.
