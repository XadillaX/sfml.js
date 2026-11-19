# RmlUi 6.3 renderer resource and startup observations

The macOS native wrapper passes 73 assertions: 16 pinned GL3 captures,
16 exact SFML comparisons, five renderer groups, ten shader groups,
four filter groups, ten texture groups and twelve startup/failure groups.
The complete runtime run passes 1,393 assertions across all 135 files with
zero failed files. Core reconciliation resolves all 2,096 exact source sites.
Full renderer/platform/application acceptance remains open.

## File and texture transactions

[`texture-contracts.cc`](../../../../packages/sfml.js-rmlui/test/native/rendering/textures/texture-contracts.cc)
replaces only the native application file boundary. Valid PNG encoding,
decoding, alpha conversion, SFML uploads and texture leases use actual code.
It verifies failed seeks, a decodable short-read prefix, invalid lengths,
missing providers, callback exceptions, exact successful upload bytes and
cache eviction with a surviving lease. When read and close both throw,
cleanup preserves the original read exception.

Generated textures retain already premultiplied input. Nonpositive dimensions,
missing or short pixel spans, dimensions above the driver limit and failed GPU
resize return zero before success counters change. File loads leave output
dimensions unchanged until upload succeeds. An opened native file closes once
on every failure or exception. Allocation exceptions may propagate; file and
texture ownership remains under RAII.

## Initialization and allocation failures

[`sfml-faults.cc`](../../../../packages/sfml.js-rmlui/test/native/rendering/initialization/sfml-faults.cc)
overrides selected installed SFML symbols in the native fixture executable.
Successful calls forward through `RTLD_NEXT`. There are no production test
hooks, alternate graphics backends or copied dependency installations.

[`startup-contracts.cc`](../../../../packages/sfml.js-rmlui/test/native/rendering/initialization/startup-contracts.cc)
injects unavailable shader support and failures at each of six required program
compilations. Window attachment rejects before registering a usable interface.
An uninitialized renderer returns no shader, filter or saved-mask handle.
Retrying the same renderer compiles every required program and opens a real
frame. The complete host view, including rotation, viewport and scissor,
survives both failure and retry.

Failed texture resize returns no resource and recovers on the next upload.
Failed solo or clip-mask vertex-buffer allocation raises a traversal error;
rollback preserves the full host image and view. A merged allocation failure
falls back to individual draws, verified at both submitted positions with
premultiplied pixels and one immutable solo upload.

## Evidence limits

The wrapper retains zero RGB error for all 16 pinned GL3/SFML filter images.
Seven JS render-session scenarios and eighteen FileInterface scenarios also
pass. Package lint, native lint, TS compilation, consumer types, all four
source-comment locales, native format and naming across ten changed units
pass. The full runtime provenance records the exact source, native binary and
135-file runtime log fingerprints for this checkpoint.

Render-target allocation failures, complete foreground/backdrop/mask CSS
combinations, platform IME/device work, twenty official applications, the
113-page VisualTests corpus, site/editor/package CI and independent whole-change
acceptance remain required. These observations do not authorize a final commit,
push, release or publication.
