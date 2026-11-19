# RmlUi rendering and Retina

RmlUi layout and geometry stay in the native backend. SFML handles vertex buffers, textures, shaders and render targets. Use the same open `RenderWindow` for the runtime's whole lifetime.

Renderer creation requires SFML shader support and all six required programs.
Missing support or compilation failure throws before registration or selection.
Failed geometry or clip-mask uploads abort the UI frame and restore the host
view. If only a merged batch allocation fails, individual draws preserve the
submitted sequence.

## Compose a frame

Clear the window, record your SFML scene, call `window.flush()`, render the RmlUi context, then call `window.display()`. Flushing submits recorded scene commands before RmlUi draws. Call `context.update()` before rendering to apply layout, animations and display density.

Each `context.render()` owns a transparent UI base layer and presents it over the host scene only after successful traversal. It restores the host `View` and adapter state on success or failure. Callback failures discard the current UI frame. Render callbacks see the already submitted host scene; UI pixels become visible in the window when the frame completes.

Context frames and pushed layers own verified eight-bit stencil buffers. Request `settings.stencilBits: 8` for direct `RenderManager` draws into the window outside a context frame.

Layer zero can be a source or destination, including self-composites and saved alpha masks. Inside a context frame it contains only RmlUi content. Direct manager operations outside a context frame read the host window as layer zero. Spare layers retain at most eight size-compatible targets within a 32 MiB storage budget; resizing releases old-size targets.

## Physical pixels and `dp`

On macOS, `initialise(window)` enables the native Retina surface while preserving the window's on-screen size. Afterwards, window sizes, mouse/resize events and texture captures use physical pixels. Create the RmlUi context from `window.getSize()` **after** initialization.

| At density 2 | Result |
| --- | --- |
| 1024 × 768 on-screen window | 2048 × 1536 framebuffer and context |
| `font-size: 20dp` | 40 physical pixels, preserving apparent size |
| `font-size: 20px` | 20 physical pixels |
| Mouse input | Forward directly without another scale multiplication |

The context refreshes `densityIndependentPixelRatio` on update. `processEvent` handles resize dimensions. `context.dimensions` is a cached readonly view; use `setDimensions(width, height)` to update native layout.

`initialise(window, { highDpi: false })` preserves the current surface, including one already enabled. Once enabled, the surface stays enabled until the window closes, even after `shutdown()`. Other platforms use the density reported by the backend, currently 1.

## Renderer coverage

See [render state](./render-state.md) for viewport, scissor, owned geometry
masks, matrix submission and save/restore operations.

| Feature | Current support |
| --- | --- |
| Text, textures, solid geometry, scissor | Implemented |
| Stencil clip masks and rounded overflow | Implemented; needs a stencil buffer |
| Offscreen layers and compositing | Implemented through SFML render textures |
| Blur and drop shadow | Implemented through SFML shaders |
| Saved layer alpha masks | Implemented; positioned scissor snapshots |
| Linear, radial, conic and repeating gradients; creation | Native programs with complete stop lists and homogeneous transforms |
| CSS image masks | Implemented; foreground/backdrop/mask combinations compared against GL3 on macOS |
| Opacity, brightness, contrast, invert, grayscale, sepia, hue rotation, saturation | Implemented through native premultiplied color shaders |
| Backdrop filters | Readable UI base layer and combined CSS effects verified on macOS |
| 4×4 geometry and clip transforms | Native homogeneous projection, Z clipping and perspective texture interpolation |

The [VisualTests launcher](../../packages/sfml.js-rmlui/examples/README.md#visual-tests) previews upstream pages. A page loading without a crash does not certify its visual assertions or full RmlUi renderer coverage.

Color filters preserve list order. `RenderManager.compileFilter(name, { value })`
uses the native names `opacity`, `brightness`, `contrast`, `invert`, `grayscale`,
`sepia`, `hue-rotate` and `saturate`; hue angles are radians. Omitted values
default to 1. Explicit values must be finite numbers. Color matrices preserve
premultiplied alpha and transparent pixels. Invert and opacity clamp to 0–1.
Like the pinned GL3 renderer, matrix output clamps to the RGBA8 channel range,
not source alpha. Ordinary loaded, generated, preloaded and saved-layer textures
use linear filtering and repeat addressing, including UVs outside 0–1.
Unavailable effect shaders produce an invalid compilation handle.

`blur` uses `{ sigma }` (default 1), with finite, nonnegative sigma in physical
pixels. Large radii use the pinned GL3 iterative half-scaling and seven-point
Gaussian kernel, then stable power-of-two placement. Samples outside the
active scissor window contribute transparent pixels. A reduced window with no
remaining samples produces transparent output.

`drop-shadow` uses `{ sigma, offset, color }`: sigma defaults to 0, offset to
`{ x: 0, y: 0 }`, and color to opaque black. Offsets must be finite physical
pixels; positive Y points down. Color contains straight RGBA bytes. The shader
shifts and tints source alpha before optional blur (sigma ≥ 0.5), then places
the unchanged source over the shadow. Ordered filter chains use three reusable
SFML scratch targets, retaining premultiplied pixels and the source layer.
The macOS native suite compares 16 odd-size, full/scissored captures against
the pinned official GL3 backend and also checks transparency, source retention,
fractional/negative offsets and scratch reuse.

Ten real RML/CSS scenes cover foreground filters, backdrop filters, gradient
masks, every combination and transformed rounded overflow. On macOS their
GL3/SFML maximum RGB channel difference is 1; mean difference stays below 0.004.
Repeated frames and reverse scene order preserve exact SFML pixels, including
premultiplied alpha and transparent corners. Twelve native allocation groups
cover base/layer/scratch/capture failures and retries. A failed mask-record
allocation releases its already captured texture. Full application and
VisualTests acceptance remains separate.

Geometry and clip masks share a full column-major transform. Geometry
translation precedes that transform; the projection uses top-left physical
pixels and a Z range of −10000 to 10000. Clip definitions retain their
write-scissor and transform snapshots. Intersections remain boolean for
overlapping triangles and normalize stencil values before eight-bit exhaustion.
The custom `vertex_shader` extension retains its supplied vertex program and
legacy SFML affine transform convention.

## Gradient and creation dictionaries

`RenderManager.compileShader` accepts `linear-gradient` with `p0` and `p1`,
`radial-gradient` with `center` and positive `radius`, and `conic-gradient` with
`center` and `angle` in radians. These use local pixel UVs, optional `repeating`
(default false), and a tagged `color_stop_list`. Stop positions must be finite,
nondecreasing numbers with `Unit.NUMBER`; colors already contain premultiplied
bytes. All stops participate in successive GL3 `smoothstep` mixing, including
lists longer than 16. The complete stop list is specialized into GLSL; if the
GPU cannot compile it, the resource is invalid.

A single stop paints a constant color. Equal positions switch to the later
color at that position. Repeats wrap between the first and last position;
a zero repeat interval paints the final color. Empty or descending stops,
coincident linear endpoints, nonpositive radial radii and nonfinite parameters
return invalid resources. At a conic center the gradient coordinate is zero.

Use name `shader` with `{ value: 'creation', dimensions: { x, y } }` for creation.
Dimensions must be finite and positive. It uses normalized local UVs and elapsed
seconds from `SystemInterface`, preserving the pinned GL3 RGB equation and
vertex alpha. Its center and reciprocal denominators have a `1e-6` lower bound
to produce finite pixels. Built-ins use the full 4×4 transform and ignore the
optional texture. Explicit `vertex_shader` and `fragment_shader` parameters
select the custom GLSL extension, with its SFML affine coordinate convention.

## Verify density

From `packages/sfml.js-rmlui`, run `npm test`; on macOS also run `npm --prefix ../sfml.js-interop run test:high-dpi`. Regression checks cover 1×/Retina layout, glyph rasterization, hit testing, resize, physical pixel capture and limits. Moving the window between physical monitors still needs device testing.
