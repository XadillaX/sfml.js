# Fonts

Select a native FreeType, HarfBuzz or bitmap engine before initialization.
Omitting the selection creates the default FreeType engine:

```js
const rmlui = require('sfml.js-rmlui');
const engine = new rmlui.FontEngineInterface();

rmlui.setFontEngineInterface(engine);
rmlui.initialise(window);
engine.loadFontFace('regular.ttf', 'application-font', rmlui.FontStyle.Normal);
const face = engine.getFontFaceHandle(
  'application-font', rmlui.FontStyle.Normal, rmlui.FontWeight.Normal, 20,
);

if (face) {
  const shaping = new rmlui.TextShapingContext('en');

  shaping.letterSpacing = 1;
  const widths = engine.getStringWidths(face, [ 'one', 'two' ], shaping);
  const metrics = engine.getFontMetrics(face);

  console.log(widths, metrics.ascent, metrics.lineSpacing);
}
```

`getFontEngineInterface()` returns the canonical selected engine, or `null`
before selection and after shutdown. `setFontEngineInterface(null)` restores
automatic selection before initialization. Only the selected active engine
performs font operations. Constructing extra engines does not initialize the
upstream global provider; Core alone calls its Initialize and Shutdown.
Default text layout, glyph generation and atlas management stay in C++.

Face and effects handles are opaque Native tokens. Font release, manager
release and shutdown invalidate them. `prepareFontEffects(face, effects)`
returns a token belonging to that face and font generation.
`generateString(manager, face, effects, text, position, colour, opacity, shaping)`
returns an integer width and an ordered `TexturedMeshList`. Meshes own shared
vertex/index snapshots; atlas textures belong to their render manager and
become invalid when fonts are released. Colours contain premultiplied RGBA
bytes; opacity applies to effects and defaults to one. Direct generation loads
cold glyphs in Native before building their atlas. Rebuilding an atlas after
loading new glyphs invalidates its previous texture views; owned mesh bytes
remain valid.

`FontMetrics.values` shares an independent Native snapshot of ascent, descent,
line spacing, x-height, underline position and underline thickness.
`TextShapingContext.enums` shares Direction/FontKerning; `values` shares letter
spacing. Native calls validate and snapshot shaping parameters before use.
`getStringWidths` measures an array with one Native entry and returns shared
Native-owned int32 widths. These numerical allocations survive collection and
shutdown; editing metrics snapshots does not change engine caches.

`FontMetrics.size` and `hasEllipsis` read the copied integer and boolean fields.
The six named float getters read the corresponding `values` entries without
entering Native. Ascent is positive above the baseline; descent and underline
position are positive below it. Underline position may also be negative.

Shaping defaults to an empty language, `Style.Direction.Auto`,
`Style.FontKerning.Auto` and zero spacing. Numerical getters and setters use
the shared views; language reads and replacement enter Native. A language
replacement during a custom callback cannot change the active batch's frozen
parameters. Contexts can be created before initialization and reused after
shutdown; they still follow the runtime owner environment restriction.
The default FreeType provider uses kerning unless `Style.FontKerning.None`
is selected and truncates letter spacing to an integer per glyph. Language
and direction are forwarded to providers; FreeType does not perform complex
script shaping. Use a provider with the required shaping behavior.

For repeated measurements, allocate a fixed `FontMeasureBuffer` once:

```js
const buffer = new rmlui.FontMeasureBuffer(2, 64);

buffer.append('one');
buffer.append('two');
const widths = engine.measureStrings(face, buffer, shaping);

buffer.clear();
buffer.append('next');
engine.measureStrings(face, buffer, shaping); // Reuses the same widths.
```

`bytes` is shared packed UTF-8, `offsets` contains row boundaries and `widths`
is the fixed shared output. Direct writers set bytes and offsets and pass an
explicit count as the fifth `measureStrings` argument. Offsets start at zero,
never decrease, and stay within byte capacity. Native code validates every
active UTF-8 slice before writing output. Inactive widths retain their values.
Thread transfer of the public buffers is rejected or produces a copy.
Direct `ArrayBuffer.transfer()` invalidates the measurement buffer; subsequent
measurement rejects detached views while transferred storage stays alive.
Measurement reuses input and output storage; cold glyph loads can still allocate.
`append` performs UTF-8 encoding during input preparation.

Initialise RmlUi before loading fonts, and load them before documents. All
three `Rml::LoadFontFace` overloads are available through `loadFontFace`:

```js
const fs = require('node:fs');
const { loadFontFace, FontStyle, FontWeight } = require('sfml.js-rmlui');

loadFontFace('regular.ttf');
loadFontFace('collection.ttc', false, FontWeight.Normal, 1);
loadFontFace('regular.ttf', 'application-font', FontStyle.Normal);
loadFontFace(
  fs.readFileSync('italic.ttf'),
  'application-font', FontStyle.Italic, 530, true, 0,
);
```

The first form uses the font's internal family/style. The named file and memory
forms register the supplied family/style for RCSS; an empty family restores
metadata family/style. Paths use the active file interface, including
`initialise(window, { fileRoot })`'s root.

`FontWeight.Auto` (0) detects the weight and loads all available weights in a
variable font. Integers 1–1000 select a variable-font weight or override the
registered weight of a static font. `Normal` is 400 and `Bold` is 700.
The collection index defaults to 0, weight to Auto and fallback to false.
Fallback faces supply characters missing from other faces. Duplicate native
face registrations do not update existing fallback status.

The boolean result is RmlUi's result: missing files, invalid data or absent
collection faces return false. Invalid argument types/ranges throw. Loading is
synchronous and must run in the runtime owner's environment, outside event
callbacks.

Memory input accepts Buffer or Uint8Array, including subarrays. Native code
copies exactly the view's bytes, so callers may mutate, transfer or collect
their input after return. Shared and detached buffers are rejected. Copies
remain alive until after `shutdown`, including unsuccessful loads: a collection
may have registered some faces before failure.

For the default engine, `releaseFontResources()` releases glyph/texture caches,
invalidates native font handles and updates every context. It retains registered
faces and source bytes, so subsequent layout/rendering can recreate the caches.
Call it outside event callbacks in an initialised runtime.

## Built-in engines and capabilities

```js
const engine = new rmlui.FontEngineInterface('harfbuzz');

engine.registerLanguage('ar', 'Arab', 'rtl');
rmlui.setFontEngineInterface(engine);
rmlui.initialise(window);
engine.loadFontFace('Cairo-Regular.ttf', 'arabic', rmlui.FontStyle.Normal);
console.log(engine.kind, rmlui.getCapabilities());
```

The constructor accepts `freetype`, `harfbuzz`, `bitmap`, or synchronous custom
callbacks. `kind` reports that selection (`custom` for callbacks) and rejects
retired engines after shutdown. Switching engines requires shutdown followed
by construction and selection of a new engine.

HarfBuzz 15.1.0 shapes clusters, joining forms and ligatures in C++, using the
same compiled FreeType library as the default engine. It honors language,
direction, kerning and integer letter spacing. Its upstream implementation
ignores the measurement's prior character. `registerLanguage` maps a BCP47 tag
to a four-letter ISO15924 script and `ltr` or `rtl` for Auto direction; call it
before initialization. File, named-file and memory loads are supported.
The named-file adapter retains its byte storage until the provider shuts down.

The bitmap engine loads upstream single-page XML `.fnt` files and relative
atlas images. It applies the atlas's glyph advances and kerning, including the
measurement's prior character. Pixel sizes are fixed by the atlas; family,
style and size requests use upstream permissive best matching. It ignores
shaping, letter spacing, the kerning switch and font effects, including effect
opacity. General memory-font loads return false. The upstream debugger's
special family reports success without loading its embedded font and uses a
loaded bitmap face instead.

`getCapabilities()` returns an independent snapshot before initialization,
while active and after shutdown. `compiled` identifies the linked binary;
`available` identifies usable entry points in this runtime. Modules require
initialization; fonts additionally require active selection. A selected engine
before initialization is named in `selectedFontEngine` but remains unavailable.
Module availability does not mean that a Lua host or a visible Debugger exists.
Font feature flags describe implementation semantics; check `compiled` and
`available` before using them. Custom engines have caller-defined behavior.

Both alternative engines are compiled by default. To omit them, run the build
in the existing package directory:

```sh
GYP_DEFINES="rmlui_harfbuzz=0 rmlui_bitmap_font=0" npm run build
```

Each flag accepts 0 or 1 independently. A disabled constructor throws instead
of silently falling back. The dependency installer still validates the pinned
archives. All configurations reuse the existing build directory. Cross-platform
and whole-project acceptance remain separate from local font tests.

## Custom providers

Pass synchronous `FontEngineCallbacks` to the constructor to implement the
upstream font virtuals. Core invokes initialization and shutdown; the three
load hooks receive file metadata, explicit names, or independent memory bytes.
Register faces with `engine.createFontFace(metrics, advances?)` during
initialization or face selection. The returned handle belongs to that provider
and generation. Optional metrics/version hooks refresh Native values; otherwise
registration metrics and the shared `face.version` supply them.

`FontAdvanceTable` stores independent codepoint advances in Native memory.
Edit `face.advances` and increment `face.version[0]` to invalidate generated
geometry. This path adds letter spacing and does not implement kerning or
shaping. Contextual measurement can use the packed callback:

```js
let customFace;
const custom = new rmlui.FontEngineInterface({
  initialize() {
    customFace = custom.createFontFace({
      size: 20, ascent: 15, descent: 5, lineSpacing: 20, xHeight: 10,
      underlinePosition: 2, underlineThickness: 1, hasEllipsis: true,
    });
  },
  getFontFaceHandle() {
    return customFace.handle;
  },
  measureStrings(face, packed, count, shaping, priorCharacter) {
    for (let i = 0; i < count; ++i) {
      packed.widths[i] =
        (packed.offsets[i + 1] - packed.offsets[i]) * 7;
    }
  },
});

rmlui.setFontEngineInterface(custom);
rmlui.initialise(window);
```

The example measures ASCII bytes only. Supply `generateString` to render
custom text: return integer width and owned meshes with Texture views.
`prepareFontEffects` may return retained opaque data passed into generation.
Native takes mesh ownership and validates face/effect/texture generations.

The packed hook receives a Native UTF-8 snapshot, uint32 boundaries, and int32
results. It runs once per nonempty batch, creates no per-string JS values, and
also handles upstream scalar requests with count one. Write all active widths
and return `undefined`. Native commits results only after success and attached
input/output checks. Throwing, returning a Promise, entering Core recursively,
or detaching views rejects the call without partially writing original widths.
Native advance-table overflow also leaves the whole output unchanged.

Workspace capacity grows geometrically; steady calls reuse the same object
and arrays. Only active bytes and offsets are copied in, and active widths out.
Later calls overwrite retained workspace views. Growth or detachment replaces
the workspace; old arrays retain pure Native storage through GC and shutdown.
Worker transfers are rejected or copied. `getStringWidths` and `getStringWidth`
callbacks remain compatibility paths with string conversion and, for the
scalar hook, one callback per row.

Custom release invalidates owned faces/effects and discards workspace storage
before invoking `releaseFontResources`. Register new faces after release or
from later face selection. Retained numeric arrays stay memory-safe. This
extension has caller-defined capabilities; select a built-in engine by name
to use HarfBuzz or the upstream bitmap engine.

Run `node tools/performance/measure-custom-font-performance.cjs` from the package directory
to compare equal-output Native, packed JS and scalar compatibility measurement
at 1,000, 10,000 and 100,000 rows. Timing excludes setup, layout, rendering,
presentation and GPU work; JSON reports p50/p95 and bridge/allocation/copy counts.
