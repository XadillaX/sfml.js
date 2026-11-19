# RmlUi 6.3 blur and shadow observations

The native SFML suite matches all 16 pinned official GL3 reference images
with zero RGB error on macOS arm64. The comparison uses a 161 × 121 viewport,
MSAA disabled, sigma 0, 3, 8 and 24, and full or positioned scissor bounds.
Full renderer, platform, application and whole-change acceptance remain open.

## Rendering contract

[`render-blur.cc`](../../../../packages/sfml.js-rmlui/native/rendering/effects/render-blur.cc)
uses full-size SFML render textures for iterative lower-left half-scaling.
Odd dimensions exclude the final sampling row/column. Filter bounds reduce
with the pinned integer rules, then a normalized seven-point kernel runs
vertically and horizontally. Upscaling first fills the requested bounds and
then uses exact power-of-two placement for stable interiors.

The blur shader uses the pinned fullscreen clip endpoints, triangle diagonal
and per-vertex texture-coordinate offsets. This avoids SFML projection
rounding changing exact half-texel boundary decisions. SFML submits these
native vertices and performs all production rendering and readback.
The temporary target clears to transparent before the horizontal pass,
including the border needed for bilinear upscaling.

[`render-filters.cc`](../../../../packages/sfml.js-rmlui/native/rendering/effects/render-filters.cc)
copies only the active window. Shadows shift and tint its alpha before blur,
preserve the unmodified source in the third scratch target, then composite
the source over the shadow. Color and saved-mask filters retain list order.
Finite nonnegative sigma and finite offsets are required. A collapsed
reduction window has no samples and produces transparent output.
Scissor state restores on both normal return and exception unwinding.

## Independent reference and native assertions

[`gl3-capture.cc`](../../../../packages/sfml.js-rmlui/test/native/rendering/reference/gl3-capture.cc)
links the unmodified pinned GL3 backend to existing Core objects. Raw GL
is confined to this independent reference driver. Each image has positive
effect content; reference readback is RGB over opaque black.

[`filter-contracts.cc`](../../../../packages/sfml.js-rmlui/test/native/rendering/effects/filter-contracts.cc)
renders matching SFML images and independently reads transparent layer alpha.
Every comparison checks source retention and premultiplied bounds. Four
additional groups cover finite normalized kernels and invalid parameters,
ordered shadow/opacity/shadow chains across three frames with exactly three
scratch allocations, empty/collapsed windows without stale pixels, and
fractional blur plus negative/fractional shadow offsets and asymmetric Y.

[`native-sfml-renderer.test.cjs`](../../../../packages/sfml.js-rmlui/test/rendering/native-sfml-renderer.test.cjs)
builds fresh official reference captures in its reused temporary directory
before executing the five mask/geometry, ten shader and four filter groups.
It requires all 16 comparison results in addition to their native assertions.
The complete runtime runner includes this suite.

## Remaining gates

GPU/startup/resource failure injection, foreground/backdrop/CSS mask
application combinations, native platform IME/device evidence, 20 official
applications and 113 VisualTests, site/editor/package CI, and independent
whole-change acceptance remain required. This record does not authorize
staging, committing, pushing or publishing an incomplete task.
