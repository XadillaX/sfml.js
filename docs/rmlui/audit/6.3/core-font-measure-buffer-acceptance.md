# Shared Native font measurement acceptance

`FontMeasureBuffer` provides fixed Native-owned UTF-8 bytes, uint32 row
boundaries and int32 output widths. `FontEngineInterface.measureStrings`
validates the complete active prefix and writes widths in place with one
Native entry. Repeated calls retain the original output view and leave
inactive rows unchanged.

The convenience string-array API remains available. This acceptance covers
the reusable default-engine measurement path; arbitrary custom font engines
and the complete RmlUi 6.3 task remain open.

## Ownership and validation

Mapped vectors never resize. Empty allocations retain sentinel storage.
Native checks ordered offsets, byte bounds and canonical UTF-8 before writing
output. Tests cover empty strings, non-ASCII characters, embedded null bytes,
surrogate replacement, prior-character kerning and partial row counts.
Invalid input leaves all widths unchanged.

Shaping contexts retain immutable language storage and copy shared owners
plus numerical fields before entering the engine. Long language tags do not
create a warm string allocation. Count accessors finish before Native validates
the selected engine and font generation.

Public buffers are marked untransferable for thread transfer. Direct
`ArrayBuffer.transfer()` and `transferToFixedLength()` invalidate the original
binding; later measurement rejects detached views. Transferred views preserve
their Native allocation through GC and shutdown. V8 weak handles belong to
the environment's binding, while backing stores retain a separate pure Native
allocation whose deleter can run on another thread.

A tested private detach-key approach caused Node 22.22.2 to abort inside
ArrayBufferTransfer. It is absent from the accepted implementation. Native
detachment checks provide the verified behavior.

## Measurement evidence

Apple M4 Max, Node 22.22.2, Native FreeType, LatoLatin at 20 pixels. Each row
contains the six UTF-8 bytes of `native`. Each strategy has 20 warmup calls,
80 timed calls and five separate diagnostic calls at each size. Scalar and
batch outputs match. Timing excludes input preparation, layout, rendering,
presentation and GPU work; counters and malloc logging are disabled while
timing.

| Rows | Packed p50 / p95 (ms) | String array p50 / p95 (ms) |
| --- | --- | --- |
| 1,000 | 0.038 / 0.038 | 0.078 / 0.122 |
| 10,000 | 0.377 / 0.393 | 0.827 / 0.853 |
| 100,000 | 3.713 / 3.816 | 7.810 / 8.007 |

All fifteen packed diagnostic calls record one Native entry, zero host
callbacks, zero storage allocations, zero copied buffer bytes, zero callback
snapshot visits, zero element ownership visits, zero main-thread malloc
allocations and zero reallocations.

String-array main-thread malloc medians over five calls are 7 / 28,200 bytes,
15 / 345,608 bytes and 103 / 3,585,096 bytes at the three sizes. The measurement
storage/copy counters cover this binding's buffers. The libmalloc logger
counts main-thread malloc-family requests and excludes VM allocations and
V8 objects allocated inside existing arenas. Cold glyph loads can allocate.

The first diagnostic attempt used one warmup call and observed bootstrap
allocations. Repeated isolated probes and the project's established 20-call
warmup produce the accepted zero-allocation results.

Reproduce from `packages/sfml.js-rmlui`:

```sh
node tools/measure-font-buffer-performance.cjs
```

## Verification and scope

The reviewed whole-package runtime run executes all 97 current test files
once and records 914 literal PASS lines, zero FAIL and exit zero. Native smoke
messages sharing the runner's prefix are excluded from the file count.
The nine focused buffer scenarios pass, including detachment, GC and shutdown.
Native and TypeScript builds, complete package lint, consumer types, cpplint,
five-file formatting and three compiler-backed naming units pass. Four
source-contract checks pass for English, Chinese, Japanese and Korean.

Evidence resides under `/tmp/rmlui-63-completion/`:

- `font-measure-buffer-detach-reviewed-native.log`
- `font-measure-buffer-detach-reviewed-ts.log`
- `font-measure-buffer-detach-reviewed-focused.log`
- `font-measure-buffer-detach-reviewed-runtime.log`
- `font-measure-buffer-detach-reviewed-lint.log`
- `font-measure-buffer-detach-reviewed-types.log`
- `font-measure-buffer-detach-reviewed-cpplint.log`
- `font-measure-buffer-detach-reviewed-format.log`
- `font-measure-buffer-detach-reviewed-naming.log`
- `font-measure-buffer-detach-reviewed-site.log`
- `font-measure-buffer-performance.json`
- `font-measure-buffer-source-review.md`

The source review is a controller review, not an independent review. No Core
declaration is promoted by this buffer extension. Core remains 549 records:
468 locally verified, 17 partial and 64 pending. Supplemental values remain
1,547: 1,528 local, 18 partial and one opaque. `scope_complete` remains false.
Custom engines, Plugin, Node/Lua document execution, optional libraries,
GPU/platform/IME, application visuals, full documentation/editor/package/CI
and complete initialization acceptance remain authorized work.
