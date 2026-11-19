# Native color filter observations

Eight color filters have local macOS arm64 pixel evidence:
`opacity`, `brightness`, `contrast`, `invert`, `grayscale`, `sepia`,
`hue-rotate` and `saturate`. Together with the existing blur and drop-shadow
paths, all ten built-in filter names can compile. Full renderer acceptance
remains open.

The implementation resides in `native/rendering/effects/color-filter.*`.
`effects/filter-record.h` owns immutable color matrices, scalar opacity and
captured-mask state. Each color filter uses one SFML shader pass through the
existing scratch targets. No JS callback or CPU pixel transformation enters
the rendering path.

## Parameter and pixel contracts

The matrix coefficients, parameter key `value` and default 1 follow the pinned
RmlUi 6.3 GL3 renderer. Hue angles use radians. Explicit managed parameters
must have a numeric Native Variant type and convert to a finite float.
Omitted values retain the native default. Invert and opacity clamp to 0–1.

RGB matrices multiply premultiplied pixels directly. The constant column
multiplies source alpha, so contrast and invert leave fully transparent
pixels transparent. Each pass retains GL3's transformed RGB and source alpha;
the RGBA8 attachment clamps channels to 0–1. Source alpha is not an extra RGB
upper bound. Filters execute in list order.

| Observation | Concrete check |
| --- | --- |
| All eight color names | Known input `(80, 120, 160)` produces analytic expected RGB within two byte values |
| Ordered chain | Brightness then invert produces `(215, 195, 175)`; the reverse produces `(88, 68, 48)` |
| Partial transparency | Invert on premultiplied `(40, 60, 80, 128)` produces `(88, 68, 48)` |
| Partial transparency with saturation | Sepia on `(128, 128, 128, 128)` produces `(173, 154, 120)`; brightness 2 produces `(255, 255, 255)` |
| Empty source pixels | Outside geometry remains black after full-target contrast/invert passes |
| Hue rotation | A π rotation of red produces `(0, 109, 109)` |
| Native clamping | Invert value 4 uses the clamped amount 1 |
| Actual RCSS dispatch | `brightness(50%) invert(100%)` reaches the renderer with resolved numeric values |
| Invalid parameters | Infinity and an invalid string reject before filter allocation |
| Resource lifetime | Native defaults compile; repeated release is safe and clears validity |

The original focused run passed twelve scenarios. The visual-corpus continuation
adds a thirteenth regression for translucent channel saturation; all thirteen
pass. Nine existing layer scenarios and four existing compiled-resource
scenarios also pass, including blur, self-composites, saved masks, callback
rollback, manager lifetime and resource invalidation.

The complete effect-enabled runtime runner also passes all 131 files:
1,301 literal PASS lines, zero failed files. Its Native binary fingerprint
matches the focused effect evidence.

Effect compilation returns zero when the required SFML shader programs are
unavailable. A real unavailable-shader device or allocation-failure injection
has not been observed in this increment.

## Evidence limits

The checks use actual SFML rendering and image readback on macOS arm64.
Analytic RGB references cover the listed values; they do not establish every
possible parameter, GPU, driver or platform. Full-scale blur/drop-shadow,
readable layer zero, backdrop combinations, perspective, gradients, deeper
clip protocols and independent whole-change review remain required.

The accompanying machine-readable evidence retains source, log and Native
binary fingerprints. Four-language rendering guides describe the public
color-filter contract and the remaining backdrop/perspective limits.
