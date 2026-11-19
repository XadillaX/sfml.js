# Mesh resize storage acceptance

`Mesh.resize` allocates new Native vectors at their destination sizes and
copies only the vertex/index prefixes that remain. New vertices retain
RmlUi's value-initialized position, opaque-black colour and texture coordinates;
new indices are zero. Every successful resize replaces storage, including
unchanged sizes. Existing byte, index and typed vertex views retain their
previous allocation independently.

The implementation validates both counts before allocation and replaces the
current mesh only after both allocations and copies succeed. Empty
destinations do not allocate vector storage or copy discarded data.
Diagnostic storage counts exclude the shared ownership control block.

Seven scenarios verify shrinking, growing, unchanged sizes, opposite size
changes, empty destinations, invalid-count atomicity and owner collection.
The geometry suite passes twelve scenarios, mesh utilities seven and existing
utility performance four. Two performance contracts verify actual process
allocation bounds and prefix/storage accounting across eighteen workloads.

The process-allocation assertion first failed on the old implementation:
1,000 vertices and 3,000 indices resized to zero requested 32,072 bytes.
The earlier baseline also measured 100,000 vertices and 300,000 indices
shrinking to three/nine with 3,200,072 requested bytes.

| Destination from 100,000 vertices / 300,000 indices | Copied bytes | Vector storage bytes | Process requested bytes |
| --- | ---: | ---: | ---: |
| Zero / zero | 0 | 0 | 72 |
| Three / nine | 96 | 96 | 168 |
| 200,000 / 600,000 | 3,200,000 | 6,400,000 | 6,400,072 |

Each result holds both with and without an exported old vertex view.
The process figures come from macOS libmalloc intervals after binding warmup;
they are allocation requests, not retained memory or a cross-platform verdict.
Other platforms still execute the Native storage and lifetime contracts.

Native builds, ESLint, cpplint, clang-format and LLVM 18 naming checks pass.
[Evidence](mesh-resize-evidence.json) fingerprints the implementation,
consumer tests, measurement tool, native binary and original/final logs.
The original declaration maps are unchanged. This is local implementer
verification; independent review and whole RmlUi acceptance remain open.
