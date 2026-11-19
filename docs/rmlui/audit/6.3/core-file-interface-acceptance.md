# Native file interface acceptance

> The file interface, global selection and custom-source preloading are locally
> verified on macOS arm64. Whole Core/19 and the remaining completion plan stay
> open.

## Native ownership and operations

`FileInterface(root | callbacks)` owns an actual Native `Rml::FileInterface`
subclass. `setFileInterface(provider | null)` calls Core before initialization.
`getFileInterface()` checks the actual Core pointer and returns the canonical
selected wrapper or null. Initialization preserves the selected provider and
rejects a conflicting `fileRoot`; selection after initialization is rejected.

| Upstream operation | Consumer representation |
| --- | --- |
| Constructor/destructor | Checked Native provider, GC and shutdown |
| Open | `open(path)` → checked `FileHandle` or null |
| Close | `close(file)` |
| Read | `read(output, size, file)` → exact native byte count |
| Seek | `seek(file, offset, origin)` → native bool |
| Tell | `tell(file)` → native byte position |
| Length | `length(file)` → native byte length |
| LoadFile | `loadFile(path)` → owned bytes or null |

File identities are native table entries, never exposed stdio addresses.
The V8 ownership map uses BigInt keys, preserving native identity width.
Each token belongs to one provider and is invalidated by close and shutdown.
Open byte arrays become Native-owned snapshots. Reads and cursor operations
on those bytes remain native; ordinary native reads require no intermediate
binding buffer. Existing memory/custom streams use typed native leases.
File streams are rejected because they already delegate to the file provider.

The seven optional host methods are captured once and preserve `this`.
Native callback availability uses a bitmask. Callbacks use independent scratch
bytes, checked counts/bools and synchronous result validation. Caller output
backing is retained and checked again after callbacks. Promise rejections are
handled; native API reentry, detached/resizable/shared buffers, invalid offsets
and foreign tokens are rejected. Exact callback exception identity is retained.

The default `LoadFile` retains upstream ordering and result semantics:
empty files still call Read with size zero, short reads log a warning and keep
unread bytes zero-filled, then Close runs. Native length allocation is bounded.
The original upstream source closes empty files; an empty-file handle leak
was not established and no upstream patch was made.

Installed providers retain their callback edges. Unselected providers and
open-file callback cycles remain collectible. Close removes the native entry
before invoking the close observer and clears private edges even if it throws.
Close frees byte storage even when the closed token remains reachable.
Shutdown invalidates selected and unused setup owners, closes outstanding
files, clears callbacks from retained wrappers and releases streams before the
installed file provider. Native destructors never invoke JS.

## Default paths and preloading

Initialization without `fileRoot` retains the upstream original-path stdio
policy. An explicit filesystem provider/root retains the existing shell's
root-first then original-path fallback, including an explicitly empty root.
Provider roots are resolved at construction, matching initialization options.
Two temporary resource fixtures verify different original/shadow bytes and
matching worker decoding for these two policies.

Custom-source preload requests obtain immutable bytes once per deduplicated
resource on the owning Node thread. Native workers decode and premultiply
images without calling JS or substituting filesystem reads. Filesystem sources
are read and decoded on workers. Source capture and filesystem reads have
separate diagnostics. A custom provider can perform its own work inside its
callback; that work is not a worker filesystem operation.

Concurrent source requests share preparation and commit. A failing custom
callback removes only cache entries inserted by its request, retaining another
request's live cache/worker lease. Abort and shutdown prevent stale commits.
The ready first texture use accesses the native cache without another provider
call or main-thread texture file read.

## Evidence

Six initial contracts fail because the API is absent. The distinct default-path
fixture separately reproduces the incorrect shadow-byte result before the
policy correction. The complete package run exits zero: 94 unique runtime
suites, 885 PASS and zero FAIL, including all eighteen file scenarios.
It includes lint, cpplint, Native/TypeScript builds and consumer fixtures.

The eighteen file scenarios cover setup/default/root selection, all seven real
virtuals, document and StreamFile loading, source snapshots, typed leases,
empty/missing/partial files, close errors, callback capture/reentry/promises,
foreign workers, GC cycles, retained wrappers, shutdown, preloading/dedup/cache,
abort/failing-source ownership and detached-buffer checks.

Thirty-two static context updates record zero native-to-JS callbacks,
callback snapshot visits and element ownership visits. A deduplicated custom
texture preload records one owner-thread provider snapshot, zero worker
filesystem reads, one worker image decode and zero main-thread image
preparations. The provider is called once, and the ready texture is reused.
This increment does not measure complete initialization latency or GPU time.

Eleven touched Native files pass formatting and seven compilation units pass
LLVM naming checks with the validated macOS SDK. All 81 site/reference tests
pass, including English, Chinese, Japanese and Korean contracts.
Evidence logs and a separate controller source review are under
`/tmp/rmlui-63-completion/`; that review is not independent.

Only three exact Core/Core.h file declarations are promoted. The ten
Core/FileInterface.h compiler declarations are added individually while
preserving denominator history. Core remains 549: 465 local, seventeen partial,
67 pending. Supplemental declarations total 1547: 1528 local, eighteen partial,
one opaque. Full font/render global selection, plugins/scripts, Core/19 and
Tasks 5–10 remain open.
