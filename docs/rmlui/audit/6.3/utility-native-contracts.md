# Native geometry and convolution acceptance

> Local macOS arm64 acceptance covers the ConvolutionFilter and MeshUtilities
> adapters. Full RmlUi 6.3 integration remains incomplete.

## Interface and ownership

[The declaration map](utility-declaration-map.json) retains all 17 original
indices: ConvolutionFilter 545–554 and MeshUtilities 2013–2019. Enum, type and
destructor records remain distinct from application operations and test counts.
[Fingerprinted evidence](utility-native-evidence.json) ties those routes to
current sources, actual logs and the source archive.

`ConvolutionFilter` owns the actual upstream filter. Square and rectangular
initialization, shared contiguous kernels, checked rows and alpha-only Run
have managed consumers. Reinitialization retains previously exported storage.
Negative radii preserve the old kernel; unsafe dimensions, byte spans, formats,
overlap, detached/shared backing and non-finite weights reject before writes.
Negative Sum weights use a Native preflight to avoid invalid alpha conversion.
The public row accessor requires an integer index.

`MeshUtilities` calls upstream quad, line, background and border generation.
The shared command adapter validates a selected batch, enters Native once,
reserves both mesh vectors and appends in order without copying input commands.
Retained views cause one existing-prefix copy; otherwise append reuses the
mesh and grows capacity geometrically. No existing-prefix ownership scan or
per-element JS callback occurs. Immutable makeGeometry snapshots are preserved.

The standalone value entries execute in workers while the main thread owns
the runtime. The worker test performs all seven new Native operations rather
than only exempting their names from runtime checks.

## Behavioral evidence

The final full `npm test` exits zero: 117 runtime files, 1,166 PASS, zero FAIL,
zero emitted Native compiler warnings/errors. Node/Python dependency
deprecation notices are separate from compiler diagnostics.

Convolution and mesh suites each contain seven scenarios, including wrapper GC
and subsequent shared-view access. Four performance contracts verify fixed
entries, one retained-prefix copy, bounded vector growth and allocation-free
steady convolution.

Four original Native groups check alpha/stride, dilation/offset, quad/line
layout and rounded background/border. Five original meshes are also compared
byte-for-byte with managed output, including differently coloured rounded
borders. TypeScript consumers, four translated TypeDoc contracts, 11 routing
checks and all 12 code blocks in four guides pass. Five Native compilation
units pass identifier naming with the established LLVM 18/SDK configuration.
Format, fixture lint and whitespace checks pass.

The actual `sfml.js-rmlui-1.2.1.tgz` contains 612 entries and 1,568,682 bytes.
Twenty-four current Native/source/dist members match the archive byte-for-byte.
This does not claim an isolated installation or execution from the archive.
The source review was performed by the implementing assistant; an independent
whole-binding review remains outstanding.

## CPU utility measurements

M4 Max, Node.js v22.22.2: nine measurement groups, 80 timed samples per group,
720 timed calls and 45 separately counted calls. Timing disables diagnostics
and malloc logging. Full data is in
[JSON](utility-performance-results.json) and
[CSV](utility-performance-results.csv).

| Operation | Size | CPU p50 / p95, ms | JS → Native / Native → JS |
| --- | --- | --- | --- |
| Shared quad batch | 1,000 | 0.014958 / 0.016625 | 1 / 0 |
| Scalar quad calls | 1,000 | 0.310750 / 0.456916 | 1,000 / 0 |
| Shared quad batch | 10,000 | 0.153458 / 0.167958 | 1 / 0 |
| Scalar quad calls | 10,000 | 3.777000 / 4.015333 | 10,000 / 0 |
| Shared quad batch | 100,000 | 1.564542 / 1.703000 | 1 / 0 |
| Scalar quad calls | 100,000 | 38.577375 / 41.853875 | 100,000 / 0 |
| A8 3×3 convolution | 64×64 | 0.029750 / 0.031875 | 1 / 0 |
| A8 3×3 convolution | 256×256 | 0.392917 / 0.460083 | 1 / 0 |
| A8 3×3 convolution | 512×512 | 1.567542 / 1.596833 | 1 / 0 |

Shared batches have zero existing-prefix copies and zero utility payload
allocations in their measured intervals. The pre-sized mesh capacity also has
zero measured reserve calls and main-thread malloc allocations. Convolution
has zero payload allocations, malloc/realloc calls and negative preflight
pixels; its finite kernel validation visits nine weights per call.

These numbers measure utility calls. Command/source setup, mesh reset, layout,
rendering, presentation and GPU time are excluded. The existing Mesh.resize
setup copies its previous allocation before shrinking; that Core operation
still needs a separate performance correction. A cold mesh append reserves
its two output vectors, as the dedicated performance contract verifies.

## Remaining scope

[Inventory reconciliation](full-inventory-reconciliation.json) now contains
14 maps: 3,629 represented declarations and 297 unmatched declarations.
Representation includes reviewed, pending and partial records; it is not
a pass count or completion percentage.

FontMetrics/TextShapingContext fields, other remaining headers, Lua follow-ups,
the 19 Core acceptance groups, modules, initialization/GPU/platform IME,
20 applications, 113 VisualTests, browser/editor/package/CI and whole-binding
review still require their own completion evidence.
