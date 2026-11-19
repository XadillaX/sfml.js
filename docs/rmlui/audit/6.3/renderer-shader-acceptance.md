# RmlUi 6.3 shader observations

> Native gradient and creation protocol/pixel checks pass on macOS arm64.
> This is bounded renderer evidence. Full renderer, platform, VisualTests
> and independent whole-change acceptance remain open.

## Native shader contract

`shaders/compile-shaders.cc` dispatches resolved linear, radial and conic
gradients, their repeating variants, and `shader` with `value="creation"`.
`shaders/shader-record.h` owns const typed parameter snapshots and the SFML
program. `shaders/gradient-program.cc` specializes every color stop into the
fragment program, removing the fixed 16-stop uniform-array limit without
dropping colors. Compilation failure returns zero.

Gradient UVs remain local pixel positions. Creation uses normalized local UVs.
Both draw through the common column-major `projection * transform *
vec4(position + translation, 0, 1)` stage, with perspective interpolation and
the existing scissor/stencil snapshots. Built-ins ignore the optional texture.
Explicit custom GLSL sources retain the prior SFML affine coordinate convention.

Stops use already premultiplied byte colors and resolved `Unit.NUMBER`
positions. Nondecreasing unequal positions follow the pinned GL3 successive
`smoothstep` equation. Equal positions switch to the later color at that
position. One stop is constant; a zero repeat interval paints the final stop.
Empty/descending lists, coincident linear endpoints, nonpositive radial radii
and nonfinite parameters return invalid handles. Conic center coordinate is
zero. Creation uses elapsed seconds and the pinned GL3 RGB/vertex-alpha
equation, with `1e-6` lower bounds for its center and reciprocal singularities.

## Observed pixel tests

The standalone fixture in
[`shader-contracts.cc`](../../../../packages/sfml.js-rmlui/test/native/rendering/shaders/shader-contracts.cc)
executes ten groups against actual SFML rendering. Independent CPU equations
check both interior samples of all six gradient variants, immutable dictionary
copies, all 21 stops, premultiplied vertex/stop alpha, translated perspective
interpolation, combined scissor/released stencil geometry, equal stops, zero
repeat intervals, one stop, invalid inputs and actual GLSL compilation failure.
Creation samples use fixed clock values 0.25 and 1.75 seconds, unchanged
dimension snapshots, center singularity and vertex alpha.

The fixture allows at most two 8-bit channel units away from raster edges.
Readback uses SFML textures/images, including alpha from the transparent frame
base. Production renderer and these probes use no raw GL rendering.
No official GL3 reference captures or non-macOS driver evidence are claimed.

`compiled-resources.test.cjs` passes six managed groups, including tagged
21-stop dictionary delivery, compilation/release of all built-ins, custom
GLSL named `shader`, and a real RML linear-gradient decorator whose red/blue
pixels must match an independent equation and have positive content.
`native-sfml-renderer.test.cjs` also reruns the five earlier mask/geometry
protocol groups, for 15 native groups in that runtime file.

Native build, package lint/cpplint, TypeScript build, consumer types, all four
source-comment locales, nine source formatting checks and five LLVM naming
units pass. The complete runtime run passes 135 files with 1,335 literal PASS
markers and zero failed files. Core provenance reconciles 2,096 exact source
sites, 302 evidence groups and 1,174 current fingerprints.
[`renderer-shader-evidence.json`](./renderer-shader-evidence.json) records
the current native binary, sources and verification logs.

## Remaining gates

Scale-correct blur/shadow bounds, transparent exterior sampling, source
preservation across larger kernels, startup/resource failure injection,
platform IME/device checks, all official applications and 113 VisualTests,
site/editor/package CI and independent whole acceptance remain required.
The complete-task commit/push gate remains closed. A separate pinned GL3
reference driver has captured 16 content-positive blur/shadow images at
sigma 0, 3, 8 and 24, with full and bounded scissor regions, 161×121 pixels,
OpenGL 4.1 and MSAA disabled. These prepare the next comparison gate; they
do not establish SFML blur/shadow parity. Reference-only raw GL remains
confined to `test/native/rendering/reference/gl3-capture.cc`.
