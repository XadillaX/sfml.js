# Native geometry transforms and clip protocols

This checkpoint covers the actual SFML renderer on macOS arm64.
Full renderer, platform, application and independent whole-change acceptance
remain open.

The current complete runtime run passes 135 files with 1,323 literal PASS
markers and no failed files. [Evidence](./renderer-transform-clip-evidence.json)
records the source, native binary and log hashes. All 2,096 Core source sites
resolve to current evidence, including the split renderer dependencies.

## Source organization

The rendering directory contains the interface and subsystem directories:
`geometry`, `clipping`, `layers`, `effects`, `shaders`, `textures` and
`manager`. Geometry expansion, batching, clip replay, filter passes and shader
compilation have separate compilation units. Manager bindings and texture
bindings live with their owning subsystem. Context traversal and callback
state remain under `native/runtime/context-render-session.cc`.

[The supplemental path map](./renderer-source-layout-map.json) records
relocations and split dependencies. Historical source maps and observation
ledgers retain their original contents. Current Core reconciliation follows
both maps and includes all split renderer sources.

## Transform observations

Native expansion explicitly copies positions, premultiplied color and UV
fields from RmlUi vertices. Invalid indices return zero before publishing a
record or incrementing successful-compilation counters.

Ordinary geometry and masks share the same homogeneous vertex program.
Translation precedes the complete column-major RmlUi matrix. The projection
matches GL3's top-left pixel coordinates and −10000 to 10000 Z clip range.
SFML's texture matrix retains render-texture orientation; raw decorator
coordinates have a separate varying.

Seven analytic pixel cases cover nonuniform scale/skew and translation order,
perspective coverage, perspective masks, outside-Z rejection, varying-W Z
clipping, negative-W rejection and perspective-correct UV interpolation.
The texture fixture also mutates uploaded source bytes and the submitted
matrix before capture. Interior texture samples have a maximum two-channel-unit
budget. Coverage samples outside identified edges require exact RGB.

The pre-implementation run failed ordinary perspective, perspective mask and
outside-Z cases. A dense-grid UV oracle avoids confusing a small projected
area with an empty fixture. All seven current cases assert their own expected
content or expected complete rejection.

Custom supplied `vertex_shader` programs retain their previous SFML affine
convention. Built-in gradient and creation shader geometry still requires
implementation and its own homogeneous-program acceptance.

## Clip observations

Mask content and enable state are independent. Commands own their VBO,
full transform, translation and write-scissor snapshots. Source geometry
release, a later transform/scissor change and target pool reuse do not alter
the retained definition. Current destination scissor still limits final draws.

Intersection tests the previous stencil reference before incrementing.
Duplicate fragments cannot increment the same pixel twice. At reference 254,
two full-target stencil-only SFML passes erase stale values and invert accepted
254 values into one. This preserves boolean coverage without CPU readback or
a nesting cutoff. A 522-command fixture observes exactly four normalization
draws in addition to those commands.

Three managed pixel cases cover duplicated intersection triangles, 520
intersections followed by a narrower final intersection, and definition-time
write-scissor retention. The initial deep fixture exposed stencil saturation
only after adding that narrower final intersection; the original broad repeat
alone was not a sufficient failure control.

Five native protocol cases call `RenderInterfaceSFML` directly and cover:

- Disable/re-enable after releasing source geometry.
- Defining while disabled, then frame/layer/pool switches.
- Write-scissor and transform snapshots with target changes.
- Invalid index transactions and successful-compilation counters.
- Deep intersection coverage and bounded normalization draw count.

The native executable links existing SFML renderer and upstream build objects.
It does not link the V8/runtime session bridge, reconstruct production geometry
in JS, or create an isolated build tree. The runtime runner includes this
probe on macOS; its object-link helper explicitly skips other platforms.

## Remaining acceptance

Gradient/creation programs, blur scale and shadow source preservation,
foreground/backdrop combinations, allocation and unsupported-hardware
protocols, cross-platform/device evidence, all applications and VisualTests,
rendered documentation/editor/package/CI and independent whole acceptance
remain required. These focused observations do not close those gates.
