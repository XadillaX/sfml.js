# Native SVG and Lottie contracts

The existing macOS arm64 build compiles and links both upstream plugins.
Six current consumer suites pass 69 scenarios. This covers the local vector
integration; whole RmlUi acceptance and independent review remain incomplete.

The declaration map retains 24 original SVG/Lottie records: six reviewed
forward declarations or RTTI aliases and eighteen executed facade/lifetime
routes. Constructors, destructors, RTTI, source loading, intrinsic dimensions
and SVG inner markup retain their upstream implementations.

| Contract | Executed coverage |
| --- | --- |
| SVG rendering | RGB channels, alpha, inline markup, source replacement, box resize and opacity |
| SVG resources | File loading, content cropping, decorator textures and reload |
| Lottie rendering | Native clock, changing frames, automatic looping, source replacement, aspect-preserving resize and opacity |
| Lottie images | Embedded PNG decoding through the statically linked decoder |
| Element types | Direct construction, native RTTI, checked receivers and borrowed Factory allocators |
| Lifetime | Runtime restart, owned/detached elements, Debugger coexistence and texture callbacks |

`ElementSVG.ensureSourceLoaded()` and `ElementLottie.ensureSourceLoaded()`
enter the existing checked Native runtime boundary. The upstream plugins own
parsing, geometry, textures and animation. Regular Native update/render calls
perform the work.

SVG keeps its inline/file distinction: an active `src` returns empty inner
markup and ignores inline replacement. Lottie preserves its aspect ratio and
centers content in a differently proportioned box. Its native duration uses
`(end - start - 1) / frameRate`. The shared system clock is configured before
loading/showing documents, which may update their contents.

Core initializes the plugins after successful runtime initialization. Runtime
shutdown releases contexts and detached ownership before upstream plugin
shutdown destroys allocators and caches. Checked Factory wrappers retain
generation validation.

The dependency manifest pins LunaSVG 3.5.0, bundled PlutoVG 1.3.1 and rlottie
0.2 using archive digests and commits. The build contains five SVG, two Lottie,
ten LunaSVG, eleven PlutoVG and thirty-four rlottie translation units.
The rlottie decoder is linked statically. Its portable ARM64 path avoids the
release's ARM32-only NEON assembly; Windows static exports use the permanent
dependency patch.

The six suites contain 6 vector, 18 Debugger, 10 constructor, 9 instancer,
13 lifetime and 13 callback-texture scenarios. Dependency validation, installer
byte-idempotence, Native build, TypeScript, ESLint, cpplint, formatting and
six-unit identifier checks are recorded separately.

The [declaration map](vector-declaration-map.json) and
[fingerprint evidence](vector-native-evidence.json) retain exact routes and
their verification inputs. Historical source paths resolve through the
[directory migration map](source-layout-map.json).

Representation is not a feature or PASS count. HarfBuzz/bitmap selection, full
Core and renderer acceptance, GPU/initialization measurements, platform IME,
official applications, VisualTests, editor/package/CI gates and independent
whole-change review remain open. The source review is an implementer review.
