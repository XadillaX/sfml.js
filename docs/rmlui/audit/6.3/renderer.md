# RmlUi 6.3 Renderer Coverage Review

This report preserves the 2026-11-13 baseline findings and line references.
See [current renderer contracts](renderer-native-contracts.md) for subsequent
Native compatibility, saved-mask, pixel and resource-lifetime evidence.

> **Baseline verdict: not complete and not accepted.** All 21 rendering virtuals were declared, but declaration coverage was not semantic coverage. The baseline renderer rejected every upstream compiled gradient and `shader(creation)`, rejected eight built-in filters, skipped saved mask filters, could not read the base layer for backdrop effects, and discarded perspective. Working basic rendering and limited pixel tests did not close these gaps.

## Review Boundary

- Repository: `/Users/bytedance/Workspace/github/sfml.js`.
- Package: `packages/sfml.js-rmlui`.
- Review date: 2026-11-13.
- Checkout HEAD: `5cb430b59f273ea8c52f29cd6165d6bb3514f69c`. The package is untracked in this dirty checkout; this is a working-files baseline, not a review of a committed diff.
- Authority: the local pinned `third_party/rmlui` 6.3 headers, Core call sites, and official GL3 backend. Version evidence: `tools/deps_downloader.cjs:9-12`, `binding.gyp:41-42`, upstream `CMakeLists.txt:6`.
- Scope: rendering interface, native renderer/shaders, System/File/Font/TextInput integration, geometry/effect tests, and VisualTests. Adjacent SFML headers/source were read only to resolve the APIs actually used here.
- Parent retains ownership of the comprehensive test/CI/package audit. The test observations and gates here are renderer-specific evidence and acceptance requirements, not a separate package/CI verdict.
- No repository edits, builds, runtime tests, downloads, clones, copies, commits, subagents, or isolated environments were performed. Only this requested `/tmp` report was written.
- Hard constraint for subsequent work: **禁止使用 `using-git-worktrees`，禁止创建 worktree，禁止为构建或测试创建隔离环境，在现有工作目录完成任务。** Preserve unrelated modifications.

Paths below are relative to the package unless prefixed otherwise. `U/` means `third_party/rmlui/`; `GL3` means `U/Backends/RmlUi_Renderer_GL3.cpp`; `RI` means `U/Include/RmlUi/Core/RenderInterface.h`; `R` means `native/render-interface-sfml.cc`; `H` means `native/render-interface-sfml.h`.

Evidence labels:

- **Implemented, unaccepted:** an actual implementation matches the inspected normal-path contract, but this review has not executed its acceptance tests.
- **Partial/incorrect:** an implementation exists but loses required semantics.
- **Missing/no-op:** upstream behavior is rejected or deliberately skipped.
- **Inherited:** behavior is supplied by the actual selected upstream implementation; an absent local override alone is not a defect.

## Findings

### P1: Upstream Compiled Shaders Cannot Render

**Evidence:** `R:667-676,710-734`; `U/Source/Core/DecoratorGradient.cpp:252-259,422-428,619-625`; `U/Source/Core/DecoratorShader.cpp:35`; `GL3:1625-1742`.

`CompileShader` requires `vertex_shader` and `fragment_shader`. None of the built-in gradient decorators supplies these keys. They supply named typed dictionaries: points/center/radius/angle, a repeating flag, and a `ColorStopList`. The generic decorator supplies `name="shader"`, `value`, and `dimensions`. All return zero before compilation, so shader-derived geometry is not rendered.

The scalar/int/vec2 forwarding loop is not an implementation of the upstream shader protocol. It also skips the boolean, color-stop arrays, and other structured data that a real implementation needs. Raw GLSL acceptance is a separate extension, not coverage of `CompileShader`.

**Required action:** native dispatch for all three gradient names with repeating variants, plus the official GL3 `shader` value `creation`. Copy resolved parameter data into immutable native records. Preserve local gradient coordinates, premultiplied stops, upstream interpolation, and the complete transform.

### P1: Saved Mask Images Are Deliberate No-Ops

**Evidence:** `R:464-468,613-625`; `H:45-57`; `U/Source/Core/ElementEffects.cpp:293-311`; `GL3:1850-1873,1978-1998`.

`SaveLayerAsMaskImage` creates a texture-owning filter handle, but `ApplyFilters` explicitly skips every `kMask` record. Consequently, image masks and the geometry-generated `horizontal-gradient` masks fail even without the missing compiled-gradient implementation.

There is a second implementation gap: snapshots are cropped to the scissor rectangle, but the filter record stores neither its window-space origin nor capture dimensions relative to the full layer. Simply sampling the cropped texture with full-target UVs would stretch/misplace it.

**Required action:** preserve capture bounds and orientation, multiply **all four premultiplied source channels** by mask alpha, use transparent values outside the captured region, and retain each snapshot independently through `ReleaseFilter`. Do not substitute mask luminance for alpha.

### P1: Base-Layer Reads Break Backdrop Filters

**Evidence:** `R:536-545,584-586`; `U/Source/Core/ElementEffects.cpp:249-279`; `GL3:1749-1757,1896-1926,2089-2108`.

`CompositeLayers` rejects source handle zero. Upstream records the current top layer before entering an effect; ordinary top-level backdrop filters therefore legitimately use source zero. The call is logged and discarded. Nonzero-layer backdrop rendering is not proof that the base-layer case works.

`CaptureLayerRegion` also returns zero when the base layer is current. The save virtuals have no contract restriction excluding that layer. The official GL3 stack supplies a readable offscreen base layer.

**Required action:** make layer zero a first-class readable/capturable render target. Implement every base/nonbase and self-composite combination without texture feedback. Define whether backdrop sees only preceding RmlUi content, as in the GL3 offscreen base, or additionally the host scene; do not silently change that boundary.

### P1: Eight Built-In Filters Are Rejected

**Evidence:** `R:628-651`; `U/Source/Core/Factory.cpp:216-226`; `U/Source/Core/FilterBasic.cpp:17-19,34-44`; `GL3:1493-1602`.

Only `blur` and `drop-shadow` compile. `opacity`, `brightness`, `contrast`, `invert`, `grayscale`, `sepia`, `hue-rotate`, and `saturate` return zero. They therefore disappear from filter chains. This affects both foreground and backdrop filters, including official alpha-compositing tests.

**Required action:** implement opacity and the seven GL3 RGB color-matrix operations with the resolved `value` convention. Percent conversion and degree-to-radian conversion already occur in Core. Matrix constant terms must be multiplied by alpha in premultiplied space. Do not multiply them by one or accidentally transform alpha.

### P1: Perspective Is Replaced With an Affine Approximation

**Evidence:** `R:269-278,129-134,307-309`; `H:35,142`; `RI:88-93`; `GL3:50-70,1469-1473,2017-2030`.

`SetTransform` retains only six matrix elements and forces the final row to `(0,0,1)`. Homogeneous W and the Z-related terms are lost. Some orthographic projections of 3D rotations still produce a plausible 2D shape, but perspective, Z translations under perspective, and general `matrix3d` do not retain their meaning. Clip commands snapshot the same reduced transform.

**Required action:** keep the complete `Rml::Matrix4f` and use an `sf::Shader` vertex stage for geometry, gradient/custom shader geometry, and mask geometry. Compute `P * M * vec4(position + translation, 0, 1)`. Preserve homogeneous clipping and perspective-correct interpolation; CPU-dividing positions and then drawing ordinary 2D vertices is not equivalent.

### P1: Effect Acceptance Is Absent

**Evidence:** `test/basic.test.cjs:84-120`; `test/density.test.cjs:67-98`; `tools/run-tests.cjs`; `examples/official.cjs:35-43,170-219`.

The smoke test exercises a few blur/shadow/rounded-overflow scenes but asserts update/render success, not their pixels. Density testing really does inspect pixels and glyph height, but it does not inspect masks, filters, shader gradients, perspective, or compositing. The VisualTests launcher lists 113 documents and permits navigation; it does not evaluate assertions, load match references as an oracle, or compare captures.

Missing gradients can even make two comparison regions equally blank. Equality without an independent content assertion can falsely pass `renderer_alpha_blending_02/03`.

**Required action:** introduce deterministic renderer-level pixel oracles and a machine-readable VisualTests result ledger. Every expected effect must be positively observed. Loading, no crash, log screenshots, or equal empty regions are not acceptance.

### P2: Blur and Shadow Sampling Do Not Match GL3 Boundaries or Scale

**Evidence:** `R:425-438,441-456,475-500,506-533`; `native/rmlui-shaders.h:17-18,39-46,59-62,69-84`; `GL3:1310-1461,1787-1849`.

The normalized separable Gaussian is a real implementation, and the three-target rotation does preserve the original source while constructing a shadow. However:

- The radius is capped at 24 regardless of sigma. Large values such as the upstream 25dp backdrop blur or 30px shadow become a truncated, renormalized narrow kernel, not the requested scale.
- Foreground blur skips every sigma below 0.5; GL3's ordinary blur path does not apply that cutoff. The GL3 drop-shadow path does use a 0.5 cutoff.
- Postprocessing unconditionally samples the full target. It carries no active input-window bounds and no transparent-outside test. SFML edge clamping is not GL3's explicit zero contribution outside its scissor-aligned sampling region.
- Shadow is blurred before offsetting. GL3 first constructs an offset, bounded shadow and then blurs it. These commute only for an unbounded image; clipping near a target/input-window edge makes the distinction observable.

**Required action:** explicit sampling rectangles, half-texel conventions, transparent boundaries, scale-aware blur, and a bounded shadow pass that preserves the untouched source. Use the GL3 algorithm as the reference for parity; document any approved alternative rather than describing every Gaussian as equivalent.

### P2: Clip-Mask State Has Narrower Semantics Than the Interface

**Evidence:** `R:281-287,290-357`; `H:31-36`; `RI:10-13,76-86`; `GL3:1117-1172`.

`Set`, `SetInverse`, and ordinary nonoverlapping `Intersect` are implemented with actual SFML stencil operations. The stencil-only write and destination-composite test are appropriate. They are not no-ops when an appropriate stencil target exists.

Remaining defects/limits:

- Disabling the mask clears its retained geometry. GL3 toggles stencil testing without destroying mask contents. Disable/re-enable without a rewrite cannot restore the previous mask. Core normally resubmits its clip list, which limits the user-visible impact but does not make the virtual's toggle a reset operation.
- Stencil availability is inferred solely from the window, even though layer targets independently request eight stencil bits. With no window stencil, all clipping is logged away, including offscreen clipping.
- Unconditional increment plus an increasing reference assumes nonoverlapping triangles within each intersecting geometry. Overlapping triangles can increment twice and fail the equality test. It also has no handling for reference saturation beyond eight-bit depth. GL3 uses the same basic increment scheme; this is a contract-strengthening requirement, not a unique divergence from that backend.
- Replayed commands snapshot geometry and the reduced transform, but not the scissor state at mask-write time. A later scissor change reconstructs the mask under the new scissor. That is not a literal snapshot of previously rasterized mask contents across arbitrary interface call sequences.

**Required action:** preserve enable state separately from mask contents, use full transforms, validate actual target stencil capability, and make intersection boolean/idempotent. Preserve mask-write state if replay is retained. Define and test deep-mask behavior instead of silently saturating. An owned offscreen base with stencil removes dependence on host-window stencil.

### P2: Native Geometry Conversion Uses Invalid Type Aliasing

**Evidence:** `R:151-160`; `H:22-28`.

One-time de-indexing into an immutable native static VBO is the right architectural boundary and keeps geometry out of JS. But reading `Rml::Vertex[]` as `sf::Vertex[]` is not made valid by their similar layouts. Current native files also contain no layout assertions. Matching size/offsets alone would not solve C++ strict aliasing.

**Required action:** construct each expanded `sf::Vertex` from the source position/color/UV fields during the already-required de-indexing pass. A carefully constrained representation-copy approach is possible, but explicit conversion is simpler and does not introduce an extra per-frame copy. Do not change this into JS geometry transport.

### P2: Failure and Resource Boundaries Are Incomplete

**Evidence:** `R:45-65,137-166,190-246,376-410,417-420,447-503,549-555`; `H:154-166`.

- Filter compilation returns nonzero even if required shader programs were not created. Compositing then silently omits nonempty filters when `shaders_ready_` is false; the self-composite path can still enter filter processing because of the separate `source == destination` condition.
- Texture generation uses a throwing SFML constructor instead of converting creation failure to the contract's zero handle. LoadTexture ignores failed seeks and the byte count returned from `Read`.
- `PushLayer` allocates a raw `LayerResource` before constructing its render target. A construction exception leaks that record. Active stack entries are raw pointers with no destructor cleanup if rendering is aborted before balanced pops.
- Manual save/restore of scissor booleans is not exception-safe. A failing allocation/pass can leave renderer state changed.
- The pool retains targets for every encountered size indefinitely; repeated distinct resizes can retain unbounded GPU memory until shutdown.
- System and render interfaces borrow a raw window pointer. The current public API explicitly requires keeping the window open until shutdown; this is not evidence of native window-owner retention.

**Required action:** RAII ownership for every layer, scoped render state, error rollback, bounded/resize-aware pooling, capability failure reporting, and an explicit native window-lifetime contract. Validate generated texture size/span at the interface boundary. Never reinterpret “render returned true” as proof all requested effects succeeded.

### P2: Clipboard Encoding Is Not UTF-8 Safe

**Evidence:** `native/system-interface-sfml.cc:77-82`; repository `packages/sfml.js-interop/third_party/sfml/include/SFML/System/String.hpp:164-173,284-298,354`; `packages/sfml.js-interop/third_party/sfml-source-3.1.0/src/SFML/System/String.cpp:177-186,238-260,280-289`.

RmlUi text is UTF-8. Passing `std::string` to SFML selects its locale/ANSI conversion; assigning the returned `sf::String` back to `std::string` also converts to ANSI. This cannot preserve general Unicode clipboard text.

**Required action:** use `sf::String::fromUtf8(begin,end)` and the returned string's `toUtf8()` bytes. Verify non-ASCII and supplementary-plane round trips, not just ASCII.

The source-level call chains are confirmed, not merely suspected from the parameter name:

- Set: `sf::Clipboard::setString(text_utf8)` implicitly constructs `sf::String(const std::string&, locale)`, delegates to the string-view constructor, then calls `Utf32::fromAnsi`.
- Get: `text = sf::Clipboard::getString()` invokes `sf::String::operator std::string()`, which returns `toAnsiString()`, then calls `Utf32::toAnsi`.
- Explicit UTF-8 output instead calls `Utf32::toUtf8` in `String::toUtf8`.

Suggested adapter correction, **not applied to the repository**:

```cpp
sf::Clipboard::setString(
    sf::String::fromUtf8(text_utf8.begin(), text_utf8.end()));

const auto utf8 = sf::Clipboard::getString().toUtf8();
text.assign(utf8.begin(), utf8.end());
```

Acceptance should include both external clipboard directions with Latin accents, CJK, supplementary-plane characters, combining sequences, and newlines. Test a non-UTF-8/default C locale as well. An internal byte-string round trip alone may hide a wrong intermediate Unicode clipboard value. No system clipboard was read or changed during this review.

### P2: Font and IME Integration Is Only a Partial Public Surface

**Evidence:** `binding.gyp:38-43`; `native/rmlui-core.cc:52-60,80-87`; `native/rmlui-context.cc:45-46`; `U/Source/Core/Core.cpp:110-125`; `native/rmlui-platform-sfml.cc:36-43`.

FreeType's native engine is genuinely selected and implements the entire font virtual surface. It is wrong to label FontEngineInterface absent. However, the binding exposes only filename/fallback loading, not collection face selection, explicit family/style/weight, memory font data, or resource-release control. Alternative native font engines are not integrated.

No custom TextInputHandler is installed globally or per context. Its default `OnActivate`, `OnDeactivate`, and `OnDestroy` are empty. SFML `TextEntered` forwards committed codepoints, not composition ranges, preedit selection, candidate placement, or cancellation. System keyboard activation/deactivation likewise inherits empty methods.

**Required action:** retain native font generation and extend configuration/loading deliberately; add a lifetime-aware native text-input handler and platform composition bridge. Public SFML 3.1 text events alone cannot provide a complete IME protocol. Platform text APIs may be needed; this does not require or justify raw OpenGL rendering.

## Every RenderInterface Virtual

`RI` has 21 non-destructor virtual methods plus its virtual destructor. All 21 have local overrides. The table grades behavior, not override count.

| Virtual and upstream contract | Current evidence | Baseline classification |
|---|---|---|
| `~RenderInterface()` (`RI:28`): polymorphic lifetime | Implicit derived destructor releases member-owned filters/shaders/pool; geometry/textures are released through callbacks; active stack is raw (`H:154-166`) | Partial exceptional-path cleanup; preserve upstream shutdown ordering |
| `CompileGeometry` (`RI:34-40`): immutable vertices/indices remain valid until release; zero on failure | `R:137-167`, static triangle VBO, one-time index expansion | Implemented normal path; aliasing defect, incomplete failure validation |
| `RenderGeometry` (`RI:41-45`): translation, optional texture, active geometry transform and masks | `R:114-135,169-181`; normalized texture UVs, premultiplied blending | Implemented basic path; perspective/clip limitations apply |
| `ReleaseGeometry` (`RI:46-48`) | `R:183-188`; deletes record, retained clip command shares its VBO | Implemented; retained VBO intentionally survives record release while referenced |
| `LoadTexture` (`RI:50-54`): joined source path, dimensions on success, zero on failure | `R:190-234`; FileInterface read, SFML decode, RGB premultiply once, smooth texture | Implemented standard raster path; partial I/O failure handling, synchronous read/decode |
| `GenerateTexture` (`RI:55-59`): RGBA8 input already premultiplied | `R:236-247`; direct native upload, no second premultiply | Implemented normal path; validate size/span and return zero on allocation failure |
| `ReleaseTexture` (`RI:60-62`) | `R:249-253` | Implemented for individually owned textures |
| `EnableScissorRegion` (`RI:64-66`) | `R:255-260`; next draw applies view | Implemented lazy state |
| `SetScissorRegion` (`RI:67-70`): window coordinates independent of transform | `R:81-105,262-267`; `sf::View::setScissor`, not viewport remapping | Implemented usual Core path; target-size compatibility and empty/zero-sized targets need acceptance |
| `EnableClipMask` (`RI:76-78`) | `R:281-287` | Partial: toggling off destroys contents |
| `RenderToClipMask` (`RI:79-86`): Set/SetInverse/Intersect; mask affects geometry draws and destination composites only | `R:290-357` | Real stencil implementation; incomplete transform, capability, snapshot, overlap/depth behavior |
| `SetTransform` (`RI:88-93`): nullable full matrix, geometry-handle operations only | `R:269-279` | Incorrect for perspective; identity reset and affine translation order are present |
| `PushLayer` (`RI:95-98`): nonzero handle, switch target, transparent black within scissor | `R:376-401`; clears whole target, requests stencil | Implemented normal path; clearing extra unused pixels is not itself a defect |
| `CompositeLayers` (`RI:99-105`): filters in order, Blend/Replace, source may equal destination | `R:536-570`; SFML premultiplied Blend or BlendNone; self-copy through post target; destination scissor/stencil | Partial: no base source, missing filters/masks, boundary issues; nonbase/self plumbing is real |
| `PopLayer` (`RI:106-107`): return rendering to previous stack target | `R:403-411`; `ActiveTarget` reads stack | Implemented balanced-stack path; exception cleanup and bounded pool absent |
| `SaveLayerAsTexture` (`RI:109-112`): current layer cropped to active scissor size | `R:572-611`; render/copy into independent SFML texture | Partial: nonbase crop works structurally; base fails; output is not smoothed unlike loaded/generated textures and GL3 render textures |
| `SaveLayerAsMaskImage` (`RI:114-116`): snapshot for later filter use | `R:613-625` | Snapshot resource exists, resulting filter is a no-op; crop-coordinate metadata absent |
| `CompileFilter` (`RI:118-122`): name/typed parameters to native handle | `R:628-655` | Two of ten built-in names; no supported capability contract; raw `.at` requires all keys |
| `ReleaseFilter` (`RI:123-125`) | `R:657-665`; erases owned record, frees mask texture | Implemented |
| `CompileShader` (`RI:127-131`) | `R:667-697` | Wrong protocol for every upstream built-in; custom raw-source extension only |
| `RenderShader` (`RI:132-137`): shader + geometry + translation + optional texture | `R:699-741` | Real custom shader draw, but no built-in dispatch; incomplete typed parameters and perspective |
| `ReleaseShader` (`RI:138-140`) | `R:743-751` | Implemented for successful custom records |

Additional contract notes:

- The Core `RenderManager` clamps scissors against its own context dimensions (`U/Source/Core/RenderManager.cpp:95-111`). Do not claim ordinary Core scissors are always unbounded. A context larger than its actual render target still needs target-side validation because SFML's normalized scissor API requires bounds within `[0,1]`.
- Source geometry uses triangle indices, premultiplied vertex colors, and normalized UVs for ordinary textures. Gradient decorators deliberately repurpose UVs as **local pixel positions**; `shader(value)` uses normalized local UVs. A single universal “all RmlUi UVs are normalized” assumption is false.
- Transforms apply to `RenderGeometry`, `RenderToClipMask`, and `RenderShader`; they must not transform the scissor or fullscreen layer composite.
- Layer saves and filter passes must not unintentionally apply the current geometry transform or destination clip mask. Destination compositing must apply clipping.
- `SaveLayerAsTexture` currently produces an independent copy, not an alias into a pooled layer. That is useful snapshot behavior to retain. Smooth sampling should match GL3, especially for scaled cached box shadows.

## Effects and Parameter Protocol

### Required Filter Inventory

All ten names are registered by 6.3 Core. `mask-image` is an additional saved-filter path, not a `CompileFilter("mask-image")` requirement.

| Name | Parameters received by renderer | Required behavior |
|---|---|---|
| `opacity` | `value: float` | Multiply premultiplied RGBA, not alpha alone |
| `brightness` | `value: float` | Scale RGB; preserve alpha |
| `contrast` | `value: float` | RGB scale plus `(0.5 - 0.5 * value) * alpha` |
| `invert` | `value: float` | GL3 clamps value to `[0,1]`; RGB scale `1-2v`, offset `v * alpha` |
| `grayscale` | `value: float` | Interpolate identity with luminance matrix `(0.2126,0.7152,0.0722)` |
| `sepia` | `value: float` | GL3 sepia coefficient matrix interpolated with identity |
| `hue-rotate` | `value: float`, already radians | GL3 sine/cosine hue matrix |
| `saturate` | `value: float` | GL3 saturation matrix; values over one are meaningful |
| `blur` | `sigma: float`, resolved pixels | Gaussian scale, bounded sampling, ink overflow |
| `drop-shadow` | `sigma: float`, `offset: Vector2f` resolved pixels, `color: Colourb` straight RGBA | Source alpha silhouette, premultiplied tint, offset, blur, untouched source over shadow |
| Saved mask filter | Native snapshot handle from `SaveLayerAsMaskImage` | Multiply source RGBA by captured mask alpha with correct spatial mapping |

Reference equations/defaults are in `GL3:1493-1598`, not inferred from generic web CSS. Core shorthand defaults differ from some GL3 fallback dictionary values; normal Core calls supply resolved values. Use Core's emitted values rather than parsing RCSS in the backend.

Filter lists are ordered. Test noncommuting chains as well as the upstream commutative contrast/opacity example. Include masks after filters, foreground + backdrop + mask combinations, self Replace and Blend, and cached outer/inset/multiple box shadows. Box shadow is a Core geometry/layer/blur/save pipeline (`U/Source/Core/GeometryBoxShadow.cpp:197-235`), not another missing filter name.

### Required Shader Inventory

| `CompileShader` name | Exact Core dictionary | Coordinate/semantic requirements |
|---|---|---|
| `linear-gradient` | `p0: Vector2f`, `p1: Vector2f`, `length: float`, `repeating: bool`, `color_stop_list: ColorStopList` | Local pixel UVs; `p=p0`, `v=p1-p0`; projection along v |
| `radial-gradient` | `center: Vector2f`, `radius: Vector2f`, `repeating: bool`, `color_stop_list` | Local pixel UVs; elliptical distance using inverse radii |
| `conic-gradient` | `center: Vector2f`, `angle: float` radians, `repeating: bool`, `color_stop_list` | Local pixel UVs; angle convention matches GL3 rotation and atan |
| `shader` | `value: String`, `dimensions: Vector2f` | Local normalized UVs; GL3 recognizes `value="creation"` and reads elapsed time at render |

Each color stop contains an already-premultiplied `ColourbPremultiplied` and a resolved `Unit::NUMBER` position. Core resolves lengths, missing positions, repeated positions, and some soft spacing. Do not reparse colors, divide positions by length again, or premultiply twice.

GL3 uses `smoothstep` mixing through the ordered stop list and wraps repeating positions between the first and last stop (`GL3:96-159`). It caps its uniform upload at 16 stops (`GL3:40,1627-1642`). Parity tests should cover that supported range; a “full Core” claim must also specify behavior above 16 rather than silently dropping stops. A native lookup representation can remove the uniform-count limit, but its numerical semantics require separate validation. Equal-position hard stops and degenerate repeating intervals need deterministic behavior; do not bless undefined shader arithmetic as correct merely because a reference driver happens to render it.

Legacy `gradient`, `horizontal-gradient`, and `vertical-gradient` are geometry/color decorators (`Factory.cpp:204-206`), not compiled shader names. They can work today and must not be reported as entirely absent.

The strings `cake`, `animated_radar`, and other values in upstream mock tests demonstrate dictionary delivery, not universally implemented shader effects. Only `creation` is supported by this pinned GL3 reference. Arbitrary user shader programs require an explicitly documented extension/registry and are not supplied automatically by upstream.

## Integration Coverage

### SystemInterface

Authority: `U/Include/RmlUi/Core/SystemInterface.h`; defaults in `U/Source/Core/SystemInterface.cpp`.

| Virtual | Selected behavior | Coverage |
|---|---|---|
| Destructor | Native `unique_ptr` resets after RmlUi shutdown | Implemented normal lifecycle; window must outlive interface |
| `GetElapsedTime` | SFML monotonic clock, seconds (`system-interface-sfml.cc:43-45`) | Implemented; add controllable clock for deterministic acceptance |
| `TranslateString` | Inherited identity translation, count zero | Valid default; no localization-provider integration |
| `JoinPath` | Inherited resource/document joining, slash/drive/path normalization | Real inherited behavior; root-relative path is resource-oriented, not a filesystem sandbox |
| `LogMessage` | Inherited default logger | Implemented upstream default; tests do not fail on unexpected renderer warnings |
| `SetMouseCursor` | SFML cursors for arrow/move/pointer/resize/cross/text/unavailable and scroll prefix (`:48-74`) | Implemented named set; unknown names preserve previous cursor; headless creation failure disables cursors |
| `SetClipboardText` | SFML clipboard with implicit ANSI conversion | Incorrect for UTF-8 |
| `GetClipboardText` | SFML clipboard with implicit ANSI conversion | Incorrect for UTF-8 |
| `ActivateKeyboard` | Inherited empty method | No virtual-keyboard/caret-position integration |
| `DeactivateKeyboard` | Inherited empty method | No virtual-keyboard integration |

Missing custom localization or logging callbacks are configuration-surface omissions, not proof that logging/path joining do not work. Log collection and deterministic time belong in acceptance infrastructure without routing render geometry through JS.

### FileInterface

Authority: `U/Include/RmlUi/Core/FileInterface.h`; `native/file-interface-root.*`; inherited `U/Source/Core/FileInterface.cpp`.

| Virtual | Selected behavior | Coverage |
|---|---|---|
| Destructor | Native-owned custom interface reset after RmlUi shutdown | Implemented |
| `Open` | Try `root + stripped-leading-slashes path`; then original path; binary fopen (`file-interface-root.cc:14-22`) | Implemented sample-shell semantics, deliberately not sandboxed |
| `Close` | fclose (`:25-27`) | Implemented valid-handle path |
| `Read` | fread, returns actual byte count (`:29-33`) | Implemented |
| `Seek` | fseek, forwards origin, reports success (`:35-39`) | Implemented stdio long-offset contract |
| `Tell` | ftell cast to size_t (`:42-44`) | Implemented success path; error `-1` becomes huge unsigned value |
| `Length` | Inherited Seek/Tell, restores position | Available, not missing; inherited failure handling is weak |
| `LoadFile` | Inherited open/length/read/close | Available; upstream warns on short read but still returns true |

If no `fileRoot` is configured, Core installs `FileInterfaceDefault` (`Core.cpp:99-108`). The custom root is set before initialization and released after shutdown. `test/resources.test.cjs` checks stylesheet resolution, original absolute-path fallback through font loading, and reinitialization without retaining a freed custom interface.

No custom virtual filesystem/provider is exposed. Resource reads and texture decode are synchronous. `LoadTexture` itself is a synchronous upstream virtual; replacing it with a promise would violate the contract. For asynchronous resource preparation, prefetch/decode into native-owned immutable cache entries before rendering, then satisfy the synchronous callback from that cache.

### FontEngineInterface

Authority: `U/Include/RmlUi/Core/FontEngineInterface.h`; selected implementation `U/Source/Core/FontEngineDefault/FontEngineInterfaceDefault.cpp`.

| Virtual | Actual selected implementation |
|---|---|
| Destructor | Core owns default engine; shutdown occurs before render-manager destruction |
| `Initialize` | `FontProvider::Initialise` |
| `Shutdown` | `FontProvider::Shutdown` |
| `LoadFontFace(file, face_index, fallback, weight)` | Native FontProvider file loading and face selection |
| `LoadFontFace(file, face_index, family, style, weight, fallback)` | Native explicit registration |
| `LoadFontFace(bytes, face_index, family, style, weight, fallback)` | Native memory-face registration; memory lifetime must be retained by caller |
| `GetFontFaceHandle` | Native family/style/weight/size resolution |
| `PrepareFontEffects` | Native layer configuration and caching |
| `GetFontMetrics` | Native face metrics |
| `GetStringWidth` | Native glyph advances, kerning, letter spacing |
| `GenerateString` | Native textured meshes using premultiplied color/effect opacity |
| `GetVersion` | Native atlas/geometry invalidation version |
| `ReleaseFontResources` | Native sized-face resource release |

All twelve non-destructor virtuals have default-engine overrides. This is implementation coverage, not full JS access or full typography acceptance.

Important boundaries:

- `RMLUI_FONT_ENGINE_FREETYPE` is enabled; default Core constructs the engine and calls Initialize/Shutdown. Font geometry stays native and reaches the same RenderInterface.
- The JS load function only forwards filename and fallback. It does not expose the other font-loading capabilities above.
- The engine iterates codepoints with kerning/letter spacing (`FontFaceHandleDefault.cpp:59-83,171-240`), not the HarfBuzz shaping engine. Merely linking SFML's own text facilities would not change which engine RmlUi uses.
- Built-in `font-effect: blur`, `glow`, `outline`, and `shadow` are registered (`Factory.cpp:229-232`) and generated by native font layers. They are not the same as layer filters.
- Native FreeType conversion handles MONO, GRAY, and BGRA glyph bitmaps (`FreeTypeInterface.cpp:353-429`). Color-font support still depends on the actual font format/FreeType build; “all emoji formats work” is not established.
- File-loaded font bytes are retained by FontProvider. The memory overload does not take equivalent ownership (`FontProvider.cpp:90-119`); any future JS memory-font API must retain a native snapshot.
- Font acceptance currently checks a loaded Latin font and approximate glyph height, not shaping, fallback, effects, atlas eviction, or every loading overload.

### TextInputHandler

Authority: `U/Include/RmlUi/Core/TextInputHandler.h`; `TextInputContext.h`; `Core.cpp:121-125`.

| Virtual | Integration state |
|---|---|
| Destructor | Default Core-owned handler |
| `OnActivate` | Inherited no-op |
| `OnDeactivate` | Inherited no-op |
| `OnDestroy` | Inherited no-op |

`Rml::CreateContext` is called without a text-input handler override; no global handler is installed. Committed SFML UTF-32 codepoints are forwarded to `ProcessTextInput`, including CR-to-LF normalization. That is useful ordinary input support, but it is not IME composition support.

The native bridge must observe activation/deactivation/destruction, invalidate borrowed TextInputContext pointers, and connect platform preedit/commit/cancel/selection events to `GetBoundingBox`, `Get/SetSelectionRange`, `SetCursorPosition`, `SetText`, `SetCompositionRange`, and `CommitComposition`. Character offsets are not UTF-8 byte offsets. Focus loss, document removal, and shutdown during composition are required lifecycle cases.

## Effects and Asset Formats

The inventory distinguishes renderer work from optional upstream integration work. Nothing below is silently counted as implemented.

| Feature/format | Present baseline | Required support/acceptance boundary |
|---|---|---|
| RML/RCSS, linked styles, spritesheets | Core + FileInterface integration | Exercise resolved external resources and missing-file diagnostics; not just document parse |
| TGA | SFML decoder; 26 TGA files in bundled Samples + Tests/Data | Official GL3 baseline accepts uncompressed 24/32-bit TGA; test orientation, BGR conversion, alpha, sprite subrects |
| PNG | SFML decoder; one bundled PNG in that inventory | RGBA transparency, dimensions, sampling; do not confuse decode availability with a pixel test |
| BMP/JPG/GIF/PSD/HDR/PIC/PNM | Advertised by the local SFML Image API | Decoder-supported variants only; not proof of GIF animation or HDR rendering preservation |
| Generated RGBA8 | Native `GenerateTexture` | Premultiplied input, copied upload, glyph atlases and plugin-generated textures |
| Image/tiled-horizontal/tiled-vertical/tiled-box/ninepatch/text decorators | Core-generated geometry/texture paths | Validate tile boundaries, scaling, image-color alpha, paint areas, clips |
| Legacy straight gradients | Core vertex colors | Test interpolation and opacity independently of compiled gradients |
| Linear/radial/conic, repeating variants | Missing compiled shader protocol | All names/parameters/stop cases above |
| Layer filters, masks, backdrop, box shadows | Partial/missing as findings describe | Ordered effects, nested layers, alpha, source bounds, transform and clip combinations |
| TTF, including bundled Latin/emoji fonts | Native FreeType; 11 bundled TTF files | File load, fallback, style/weight, metrics, atlas regeneration, visible pixels |
| OTF/TTC/variable-face selection | Depends on FreeType; selection not fully exposed | Explicit API and fixture tests; do not claim WOFF/WOFF2 universally without codec/build evidence |
| Bitmap font `.fnt` + atlas | Upstream sample replaces FontEngineInterface; not integrated | Native `.fnt` parsing/metrics and SFML atlas textures; not a new image decoder |
| HarfBuzz shaping | Upstream alternative font-engine sample; not integrated | Native shaping/cluster metrics + same SFML geometry path; script/direction fixtures |
| SVG external/inline/decorator | Optional Core SVG plugin not enabled | Native SVG plugin/rasterization + generated SFML textures; not `sf::Image::loadFromMemory(svg)` |
| Lottie JSON | Optional Core Lottie plugin not enabled | Native frame rasterization + immutable frame texture snapshots; deterministic timeline pixels |
| IME/virtual keyboard | Committed text only, callbacks no-op | Native platform bridge; no renderer-only patch can supply absent composition events |

Asset counts were obtained from a read-only extension inventory. There is additionally one `.fnt` bitmap-font asset. The counts are not a statement that every asset was decoded or rendered.

Optional SVG/Lottie integration is gated in `U/Source/Core/Core.cpp:145-151` and is not enabled by this package's binding defines/source selection. Bitmap/HarfBuzz samples explicitly install their own font interfaces (`Samples/basic/bitmap_font/src/main.cpp:42-46`, `Samples/basic/harfbuzz/src/main.cpp:79-92`). These are real gaps for an “all upstream samples/integrations” claim, but not additional RenderInterface virtuals.

## SFML-Only Implementation Architecture

This is an implementation recommendation, not a claim of completed work or permission to edit this checkout during the review.

### Render Session and Layer Ownership

Use a native render-session object around `Context::Render` with Begin/End and rollback. Own a full-size `sf::RenderTexture` as logical base layer zero, with a verified stencil attachment. Own all pushed layers with RAII; stack entries reference owned resources. Retain only a bounded number of size-compatible spare layers; release old-size resources at resize boundaries.

Keep the GL3 semantic default: the base starts transparent and accumulates RmlUi content; present it over the host window at End. If backdrop must include already drawn host content, make that a separate explicit mode initialized by `sf::Texture::update(window)` or an owned host texture. That SFML operation needs no raw GL, but changes the backdrop domain and final presentation strategy.

The session preserves/restores the host `sf::View` and all adapter-owned state. Every SFML draw supplies explicit blend, shader, texture, coordinate type, and stencil settings. Pending sfml.js operations must be flushed before native rendering, as the current `Context.render` documentation already requires; use an existing native interop flush only if its ownership/order contract supports it. Do not reorder queued host draws around the UI.

### Geometry and Transform Programs

Retain one-time native de-indexing into `sf::VertexBuffer`. Explicitly convert vertex fields. Use shared native references only when a mask snapshot or queued native command must outlive the handle's release.

Use a shared vertex-program convention:

```glsl
uniform mat4 projection;
uniform mat4 transform;
uniform vec2 translation;

void main()
{
    vec2 local = gl_Vertex.xy + translation;
    gl_Position = projection * transform * vec4(local, 0.0, 1.0);
    gl_FrontColor = gl_Color;
    // Each program chooses raw local decorator coordinates or texture UVs.
}
```

This is illustrative GLSL submitted through `sf::Shader`, not a raw OpenGL API call. Use `sf::Glsl::Mat4` with deliberate column/row-major conversion. Match GL3's top-left pixel projection and Z clipping range; retain RmlUi painter ordering, not invented depth sorting. Do not multiply by both this explicit projection and SFML's model-view-projection again.

Texture programs must respect SFML render-texture orientation through the SFML texture-coordinate convention. Gradient programs consume raw local pixel coordinates, not the texture matrix. `creation` consumes local normalized coordinates. Apply the identical homogeneous transform to clip geometry.

### Clip State

Separate immutable mask definition/content from its enable flag. Record full transforms, translations, and required write-region state; use target generations rather than assuming a raw target pointer proves its stencil contents remain valid.

For stencil intersection, test the previous reference value before incrementing, so overlapping fragments cannot increment the same pixel repeatedly. For eight-bit exhaustion, rebuild/normalize the logical mask or use native SFML coverage textures with a dedicated boolean mask-combine pass. Both approaches need pixel tests. Do not expose a nesting limit silently.

Apply clipping to ordinary geometry, shader geometry, and destination composites. Do not carry it into source snapshots or filter scratch passes. Validate stencil attachments instead of logging and drawing unclipped content while reporting full capability.

### Effect Records and Pass Scheduling

Replace generic mutable shader dictionaries with typed immutable native records:

- Filter variants: opacity, RGB matrix, blur, drop shadow, captured mask.
- Shader variants: linear/radial/conic gradient and named native shader effect.
- Captured mask: owned texture plus capture bounds, full layer size, orientation, and immutable snapshot lifetime.

An effect-pass scheduler tracks distinct read/write targets, input sampling bounds, and output clipping. First materialize the source including the base-layer case; never sample a texture while drawing into it. Apply filters in order with replace blending inside scratch passes. Only the final composite selects premultiplied Blend or Replace.

Opacity can use a scalar shader; RGB transforms share one matrix shader. Masking uses two samplers through `sf::Shader::setUniform`, including the explicit mask texture. Blur uses SFML sprites/quads and render textures with GL3-equivalent scale handling, bounds, interpolation, and transparent padding. Shadow construction preserves the source in a target never overwritten by its blur intermediates.

Handle SFML texture Y conventions explicitly once. Do not “fix” the current negative shadow Y texel step without an asymmetric pixel test; it accounts for render-texture orientation.

### Snapshots and Failure Handling

Native owns all geometry, texture, filter, shader, layer, and font-data lifetimes. JS may configure effects/resources and schedule context operations, but never receives render meshes for drawing.

For current immediate SFML draws, bind copied parameter values and owned resources before issuing the draw. For any future deferred command path, snapshot matrices, scissor/mask state, filter/shader parameters, time, resource references, and any mutable texture content/version at record time. A shared pointer by itself preserves lifetime, not mutable-content snapshot semantics.

Use RAII to restore state on early returns and exceptions. Catch expected allocation/compilation failures at the virtual boundary; clean partial records and return zero where the interface permits failure. Validate capabilities at initialization. Unsupported hardware should produce a clear initialization/capability failure for the full renderer, not nonzero filter handles that later vanish.

### System, Font, and Text Input

Keep the selected FreeType implementation; do not replace it with JS or `sf::Text` mesh reconstruction. Add native configuration for the relevant font overloads and optional native alternative engines. Retain owned bytes for memory-font loading until engine shutdown/resource lifetime permits release.

Fix UTF-8 clipboard conversion. Keep valid inherited path/logging behavior, but provide native test clock/log sinks. Treat custom localization/virtual filesystem providers as explicit integrations with ownership and error contracts, not unimplemented rendering.

Implement text-input lifecycle separately from rendering. Use native platform composition hooks behind a common TextInputHandler. SFML-only **rendering** remains intact. If the project additionally forbids all platform text APIs, full IME must be declared blocked rather than falsely “implemented” by three empty callbacks.

## Acceptance Plan

### Existing Evidence

| Evidence | What it proves structurally | What it does not prove |
|---|---|---|
| `basic.test.cjs` | Document/event plumbing and repeated effect-path smoke execution are authored | Correct effect pixels, source retention, clipping, gradients, perspective |
| `density.test.cjs` | Authored one-pixel line, dp position/input, glyph-height and resize pixel checks | General glyph fidelity, color alpha, filter correctness |
| `resources.test.cjs` | Authored rooted stylesheet/layout, font-file fallback, reinitialization checks | Texture decoding pixels, I/O fault handling, Unicode clipboard |
| Upstream `UnitTests/Decorator.cpp` | Mock assertions for exact gradient/shader dictionaries and geometry paint areas | Actual SFML shader compilation or raster output |
| Upstream `UnitTests/Filter.cpp` | Filter creation/release and resolved-property plumbing | Filter kernel/color mathematics or framebuffer pixels |
| Upstream `Common/TestsInterface.cpp` | Dummy geometry comparison, counters, manual time, warning accounting | Native SFML renderer acceptance unless explicitly wired into a real harness |
| `examples/official.cjs` | Can enumerate and preview 113 local VisualTests | Any automated visual verdict |

No row above means its tests were executed by this review.

### Gate 1: Contract and Lifecycle Tests

Add native tests, built in the existing checkout/build arrangement, for every row of the render virtual table. Keep generated captures, logs, and transient fixtures under `/tmp` or an already designated project test-output directory, not scattered through the repository.

Required cases:

- Geometry de-indexing, vertex colors/UVs, compile-once behavior, release, invalid/failure paths, and mask-held VBO references.
- Generated premultiplied texture upload and source-byte mutation after upload; loaded straight-alpha image premultiplied exactly once.
- Nullable transform reset, transform-before-translation semantics, nonuniform scale/rotation/skew, Z translation, perspective, and matrix-layout correctness.
- Scissor enabled/disabled, empty rectangles, target edges, resizing, and context/target size mismatch.
- Clip Set/Inverse/Intersect, disable/re-enable, same geometry with different transforms, overlapping triangles, deep nesting, target switches, destination composite, release/reuse.
- Layer combinations `0->N`, `N->0`, `0->0`, `N->N`, and `N->M`, each with Blend and Replace; nonempty filters and independent mask state.
- Layer and mask save/reuse after pop, pool reuse, resize, release of original sources, multiple outstanding masks, crop origin, and texture orientation.
- Allocation/shader failure injection, balanced cleanup, restoration after aborted render, bounded pool memory.
- Snapshot test: record/draw A, mutate inputs to B, finish/present A, then draw B and observe B. Cover effect parameters, transforms, mask content, textures, and font bytes where exposed.
- System/File/Font/TextInput lifecycle tables above, including Unicode clipboard, short reads, collection/memory fonts, fallback/effects/version invalidation, composition cancellation and destruction.

### Gate 2: Independent Pixel Oracles

Use a real SFML render target and SFML texture/image readback; no raw GL in the production renderer or its SFML test adapter. Pin viewport, physical size, dp ratio, font bytes, clock, filtering, antialiasing, and color-space configuration. Do not use frame-count timing for animated shaders.

Reference sources:

1. Small analytic/CPU reference scenes for premultiplied Blend/Replace, opacity/matrices, masks, crops, transform sample positions, and Gaussian impulse properties.
2. Captures from the **pinned official GL3 backend** for its effect semantics, generated separately from unchanged reference source when available. Its raw GL is reference-only, never linked into the production SFML renderer. This review did not build it.
3. Upstream VisualTests assertions and `rel="match"` references where present. A web-browser rendering is supplementary and cannot override intentional RmlUi 6.3 differences.

Proposed measurable thresholds, to be recorded per fixture before accepting output:

- Exact geometry coverage, untouched exterior pixels, crop dimensions, and no-op identity cases: exact where no interpolation occurs; at most one 8-bit channel unit for explicitly identified conversion rounding.
- Premultiplied blend/matrix/mask interior samples: at most two channel units after quantization; check alpha independently and verify transparent RGB does not leak.
- Gradient fixtures: at most two units at non-edge samples against the resolved-stop oracle. Explicit edge/degenerate-stop rules, not a global blurred image comparison.
- Blur: same sampling algorithm against GL3, with a predefined per-pixel budget (initial target max four channel units and MAE at most one on controlled fixtures). Also assert impulse mass, symmetry, width/variance, and large-sigma spread. If downsampling differences exceed this budget, explain and approve a separate fixture-specific criterion; never widen tolerances merely to make a broken effect pass.
- Perspective: compare a textured checkerboard and mask edge locations, including near-plane/W behavior; exterior coverage must remain correct. Test UV interpolation as well as corner positions.
- Whole-page comparisons: record differing-pixel count, maximum channel error, MAE, and an error image; compare regions with distinct criteria for text/AA. SSIM or a single percentage score alone is insufficient.

Every oracle must assert expected nonempty content. Negative controls should prove that removing each effect, forcing zero alpha, swapping Y, or discarding perspective causes failure. Keep all captures and the exact renderer/source hashes with the result ledger.

### Gate 3: VisualTests

All 113 `.rml` filenames and their metadata were inventoried. Renderer-critical document bodies/call sites were inspected; this is not a claim that all 113 pages were visually reviewed or passed.

| Fixture group | Required observation |
|---|---|
| `renderer_alpha_blending_01.rml` | White/gray/black reference regions agree across solid color, texture alpha, image-color, straight/compiled gradients, and color filters |
| `renderer_alpha_blending_02.rml` | Visible overlapping circles agree for direct rendering versus offscreen `opacity(1)` |
| `renderer_alpha_blending_03.rml` | Visible circles agree for contrast/opacity in both orders; independently verify the filtered values |
| `shader_linear_gradient.rml` | Direction, angle, paint area, transparent stops, multiple stop positions, and repeats |
| `shader_radial_gradient.rml` | Ellipse/circle, closest/farthest size modes as resolved by Core, off-center, near-zero radii, repeats |
| `shader_conic_gradient.rml` | Angle convention, off-center, stops outside nominal range, repeated sectors, fixed-time animation |
| `mask_image.rml` | Image/straight-gradient/radial masks actually hide content and retain window-space alignment |
| `filter_drop_shadow.rml` | Correctly shaped yellow shadow to the lower right; original remains unchanged |
| `filter_blur_area.rml`, `filter_blur_orb.rml` | Large-sigma spread, backdrop content, stable motion/edges, combined shadow/blur |
| `filter_with_backdrop.rml`, `filter_backdrop_filter_box_shadow.rml` | Foreground/backdrop/mask/shadow interaction, ordering, source-zero behavior |
| `filter_overflow.rml` | Record pinned upstream's own documented overflow limitation separately; do not label it an SFML success or silently “fix” Core in this renderer task |
| `clip_mask.rml`, `border_radius.rml`, `overflow_clip_transform.rml` | Curved inner clip edge, nested clipping, equivalent transformed windows, no exterior leaks |
| `opacity.rml`, `text_decorator.rml`, `text_input_overflow.rml` | Visible font effects, opacity on effects, decorator hover states, correct text clipping |
| `color_interpolation.rml` | Fixed-time color transitions and rounded geometry interpolation |
| `image_ratio.rml`, `renderer_alpha_blending_01.rml` | Raster sampling/ratio and atlas-subrect alpha |
| `position_absolute_transform.rml`, `drag.rml` | Transformed geometry agrees with hit/drag placement and clipping |
| `ink_overflow_bounding_box.rml` | Debug overlay requires debugger integration; otherwise mark blocked and provide a native bounding-box/ink-region test |
| `stacking_context_01.rml`, `stacking_context_02.rml` | Correct draw ordering when filters create stacking contexts |
| Remaining VisualTests | Run deterministic rendering regressions and prescribed interaction states; do not reinterpret layout-engine differences as renderer defects |

Supplement VisualTests with `Samples/basic/effects/data/effects.rml` for all ten filter names and `shader(creation)`, and `Samples/basic/transform/data/transform.rml` for perspective/3D. Their original application/data-model setup is not supplied by merely loading the document. A test driver must reproduce required setup or use equivalent native renderer fixtures while marking the original sample not yet accepted.

For every page/state, ledger fields should include source path/hash, environment, viewport/density, clock/input sequence, required capabilities/resources, oracle, capture paths, metrics, warnings, and verdict: **pass**, **fail**, **blocked**, or **not run**. A blocked debugger/plugin/script case is not a pass and must remain visible in totals.

### Gate 4: Architecture and Platform Checks

- Static scan of package native rendering code: no raw `gl*` calls, GL headers, native-handle GL manipulation, or renderer-side GL state restoration. Existing adapter scan found no such calls/includes. GLSL source executed by `sf::Shader` is allowed. Existing platform GL link flags are not themselves evidence of raw GL usage.
- No geometry/indices marshaled to JS. Native VBO upload and cached rendering counters should establish one-time compilation and stable repeated-frame behavior.
- No mutable filter/shader/mask alias after draw recording; resource release and resize must not change prior snapshots.
- Validate macOS, Windows, and Linux on supported graphics contexts without creating per-build/test isolated environments. Record exact SFML version, GPU/driver, shader language/context capability, stencil bits, and scale. A macOS result is not proof of other platforms.
- Check draw order with host SFML content before and after UI rendering, restored view state, and explicitly chosen backdrop domain.
- Check zero/unsupported shader or stencil capabilities produce the declared failure behavior, not a nominally successful but incomplete frame.
- Repeat load/render/unload, context removal, resize, and shutdown cycles with resource counters; require bounded pools and all live counts back to baseline.

## Recommended Execution Order

1. Turn this ledger into failing contract/pixel fixtures; retain current smoke and density coverage.
2. Fix ownership, alias-safe geometry conversion, scoped state, texture errors, and readable base-layer architecture.
3. Implement full-matrix geometry/shader/mask rendering and robust clip state.
4. Implement typed filters, spatial mask snapshots, bounded/multiscale blur, and complete compositing.
5. Implement gradient protocol and `creation`, including resolved parameters and deterministic time.
6. Complete System/File error and UTF-8 handling; extend native font surface and text-input lifecycle/platform integration.
7. Complete the optional SVG/Lottie/bitmap/HarfBuzz integrations if the deliverable remains “all upstream integrations”; otherwise retain explicit exclusions, never a global full-coverage claim.
8. Execute the pixel, VisualTests, lifetime, and platform gates in the existing working directories; publish the complete pass/fail/blocked ledger before any completion claim.

## Declined to Judge

- General DOM/data-binding/debugger/Lua/plugin API completeness beyond the integration dependencies explicitly listed above: outside this renderer-focused scope.
- Full application logic of upstream games and unrelated samples: not renderer semantics.
- Layout-engine bugs already documented by pinned VisualTests: require separate upstream/Core attribution, not speculative fixes to this SFML adapter.
- Entire SFML binding's worker/thread/shutdown safety: only the borrowed window and immediate/deferred rendering boundary relevant here were assessed.
- Production performance numbers and GPU/platform portability: no benchmark or runtime execution was performed.

These exclusions do not erase the broader user's requirement to audit other modules before implementing all gaps. This report closes only the requested baseline-review scope, not implementation or acceptance.

## Compiler Inventory Reconciliation

Companion artifact: [upstream-api.json](upstream-api.json), version `6.3`, parser `libclang C API, public declarations, function bodies skipped`. Read-only inspection confirmed 121 headers marked parsed and an empty diagnostics array. This review did not rerun that compiler inventory.

All five relevant recorded header hashes match the current files:

| Class | Inventory `CXXMethod` entries | Reconciliation |
|---|---:|---|
| `RenderInterface` | 21 | Every exact signature represented by the virtual coverage table, including const spans, nullable matrix pointer, filter span, and texture argument |
| `SystemInterface` | 9 | All entries covered, including UTF-8 clipboard integration and inherited keyboard callbacks |
| `FileInterface` | 7 | All entries covered, including `long` seek offsets and inherited `Length`/`LoadFile` |
| `FontEngineInterface` | 12 | All entries covered; three distinct load overloads, shaping context arguments, premultiplied color, and font resource release retained |
| `TextInputHandler` | 3 | Activation/deactivation/destruction covered; current implementation is inherited no-op |

Constructors are not renderer capabilities. Virtual destructors were separately inspected in the source headers and lifecycle tables. A clean declaration parse establishes the API inventory, not correct implementation, successful shader execution, or visual acceptance.

## Baseline Fingerprints

SHA-256 of the central files read:

| File | SHA-256 |
|---|---|
| `native/render-interface-sfml.cc` | `fababc6826a8412cb6763d641f208d410a3cd6013b26748f728acec9866c9994` |
| `native/render-interface-sfml.h` | `f4713c021e930a0a79acc518de7edc863317f89c1ab01f99b1b97da2fa61218c` |
| `native/rmlui-shaders.h` | `673d2e2157df2a1c456e372c6d9ad02ae81d1f2482b4ea32d87b36bb656c3800` |
| `U/Include/RmlUi/Core/RenderInterface.h` | `5182152438d3c84265b62925b6fb161dac4932ca120b4d57e1912d0ddb8cd34b` |
| `GL3` | `8f51d9dafc81ace13bcdf56a120f61cdf2f217bed97a890772d9758feb9857dd` |

**Final assessment:** useful native basic-rendering foundation; substantial missing and incorrect advanced semantics. No “full renderer,” “all effects,” or “VisualTests passed” statement is justified by the current implementation and authored tests.
