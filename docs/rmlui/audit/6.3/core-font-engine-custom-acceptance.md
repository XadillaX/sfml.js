# Custom FontEngineInterface local acceptance

This record covers the custom application font boundary on macOS arm64.
The complete RmlUi 6.3 plan remains active.

## Native and host execution

`HostFonts` implements all twelve upstream virtual signatures: initialization,
shutdown, three load overloads, face selection, effect preparation, metrics,
string width, mesh generation, version and resource release. The default
FreeType implementation stays in C++. Optional callbacks are captured once.
Two binding extensions provide bulk string snapshots and packed measurement.

Faces use checked provider-owned tokens and Native metrics, optional codepoint
advances and a shared geometry version. Effects are provider-owned opaque
objects. Native ownership and private V8 edges retain active callbacks, faces,
effects and workspace wrappers. Escaped numeric buffers retain pure Native
allocations, without V8 handles in backing-store owners. Shutdown removes
callback roots even if the caller retains the invalid engine wrapper.

The independent advance table bypasses JS width hooks. It supports letter
spacing and explicitly has no kerning or shaping. The whole batch is checked
for overflow before writing widths; this path uses neither scratch copies nor
per-call buffer allocations.

The packed hook receives reusable Native UTF-8, uint32 offsets and int32 output.
Native snapshots active bytes and offsets before JS, invokes one callback,
validates synchronous completion and original/workspace attachment, then
copies active widths back. Capacity grows geometrically and is bounded by
uint31. Growth and detachment replace storage rather than resizing mapped
arrays. Later calls overwrite retained workspace arrays; replaced arrays remain
memory-safe through GC and shutdown.

Scalar upstream width requests also use the packed hook, with count one.
This does not claim to coalesce separate layout requests into one callback.
Applications needing no host width work use the Native table or default engine.
The compatibility scalar hook invokes JS for each row; the bulk string hook
avoids repeated callbacks but still materializes per-string V8 snapshots.

Callback exceptions preserve the first error, rejected Promises receive a
handler, and callback depth guards Core lifetime and registration descriptor
accessors. Failed width calls never commit partially written original output.
Memory loads receive independent byte snapshots. Generated meshes and textures
retain the existing snapshot and generation checks.

## Verification

The custom runtime suite has eighteen passing scenarios:

- All load overloads, metrics/version validation and provider-owned selection.
- Lifecycle, initialization rollback, first exceptions, Promise and reentry.
- Native 100,000-row measurement without per-row host calls and atomic overflow.
- Packed 100,000-row measurement with one callback and reusable storage.
- Input snapshots, output attachment, failed commits and recovery.
- Growth, direct detachment, Worker transfer, GC and escaped storage.
- Effects and generated mesh snapshots.
- Actual Context layout and geometry rendering, static reuse and version/text
  invalidation.

After the final Native rebuild, the full runtime command exits zero with
98 unique test files, 932 PASS markers and zero FAIL markers. Its last marker
is `PASS template-accessors-cannot-use-expired-receivers`.

TypeScript compilation and consumer fixtures pass. Package lint and cpplint
pass. Four changed Native files pass format, and three compilation units pass
naming with the installed MacOSX15.4 SDK and external include variables removed.
Fifteen source-documentation checks pass, including all EN/ZH/JA/KO callback
parameter/return descriptions and font guides. These are source contracts;
complete multilingual rendered-page acceptance belongs to the original plan.

The controller directly reconciled signatures against upstream
`Include/RmlUi/Core/FontEngineInterface.h` and read `ElementText.cpp`, Native
callback/state/storage ownership, and the public adapters. This is a controller
source review, not an independent reviewer or a whole-project audit.

## Equal-output measurement

Run from `packages/sfml.js-rmlui`:

```sh
node tools/measure-custom-font-performance.cjs
```

Evidence: Apple M4 Max, Node v22.22.2, timestamp
`2026-11-16T21:28:01.855Z`. Each of nine cases has twenty warmup calls, eighty
timed calls and five diagnostic calls. All use six-byte ASCII `native` and
independent seven-pixel advances, returning width 42. Every result is checked.
Diagnostics and malloc logging are disabled during timed calls.

| Rows | Native p50/p95 ms | Packed JS p50/p95 ms | Scalar compatibility p50/p95 ms |
| ---: | ---: | ---: | ---: |
| 1,000 | 0.016291 / 0.020583 | 0.005416 / 0.007375 | 0.140333 / 0.151834 |
| 10,000 | 0.157041 / 0.171500 | 0.031958 / 0.039917 | 1.416625 / 1.480000 |
| 100,000 | 1.541875 / 1.602708 | 0.307375 / 0.385958 | 13.795042 / 16.038417 |

All cases use one JS-to-Native entry. Native uses zero host callbacks, packed
uses one, compatibility uses the row count. The packed hook can compute this
ASCII width from boundaries, while the Native table decodes codepoints and
checks overflow before a second write pass. This comparison does not measure
equivalent general-purpose font shaping algorithms.

All fifteen packed diagnostic calls report zero main-thread malloc/realloc
and zero measurement-storage allocations. Explicit packed copies are 14,004,
140,004 and 1,400,004 bytes per call. These include input UTF-8, offsets and
result widths. They are snapshot copies, so the host path is not zero-copy.

Native diagnostic calls report zero explicit copies. The first 1,000-row sample
observes twenty allocations requesting 32,936 bytes; its remaining four
samples and all 10,000/100,000-row samples observe zero. The allocation cause
has not been proven, and prewarming empty diagnostic intervals does not justify
discarding it. Compatibility allocations and ranges are retained in the
[CSV](core-font-engine-custom-performance.csv).

Timing excludes initialization, UTF-8 input preparation, layout, rendering,
presentation and GPU work. Copy counts cover explicitly instrumented
measurement buffers, not all V8 allocations or copies. macOS malloc tracking
reports Native main-thread allocation requests. These are not complete-frame,
FreeType, HarfBuzz or bitmap-font performance results.

## Evidence and remaining scope

Observed logs are under `/tmp/rmlui-63-completion`:

- `font-engine-packed-native-3.log`
- `font-engine-packed-ts-2.log`, `font-engine-packed-types-2.log`
- `font-engine-packed-focused-final.log`
- `font-engine-packed-runtime-2-final.log`
- `font-engine-packed-lint-5.log`, `font-engine-packed-cpplint-5.log`
- `font-engine-packed-format-final.log`, `font-engine-packed-naming-3.log`
- `font-engine-packed-site-final.log`
- `font-engine-custom-performance-2.json`

Only the exact Core forward declaration for `Rml::FontEngineInterface` is newly
accepted. Core has 549 rows: 469 local, seventeen partial and 63 pending.
Supplemental remains 1547: 1528 local, eighteen partial and one opaque.
`scope_complete` remains false. Existing default-engine and shared-buffer
evidence is retained with its historical source hashes.

Plugin notifications, actual Node/Lua hosts, Native alternative font engines,
optional modules, GPU/platform IME, applications, full four-language/editor/
package/CI execution and Core/19 remain in the authorized plan. No staging,
commit, push, publication, worktree or isolated build/test environment.
