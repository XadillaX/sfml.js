# VisualTests content and interaction checkpoint

The 113-page VisualTests corpus remains open. This checkpoint records actual
renderer comparisons, 109 passing positive content assertion groups and 25
live interaction sequences on macOS arm64. All 113 pages have content contracts;
four static contracts and two live contracts fail in both renderers.
It does not accept outstanding interactions,
physical input or other platforms.

The unchanged upstream documents and eighteen `rel="match"` documents render
through two paths: the binding's SFML renderer, and the pinned GL3 renderer in
a separate native executable. Both use the existing Core objects and font
assets. The GL3 driver compiles the unchanged upstream metadata/link handlers.
The binding implements their delegation contract through its XML handler API.
All resources retain their original source paths. Both capture drivers now
initialize Debugger, matching the original VisualTests shell and providing its
embedded font for the original font-family hover case.

## Measured results

- 113 primary pages produce 144 top/scroll captures.
- Eighteen match documents produce nineteen additional captures.
- All 163 captures compare within one RGB byte at the same pixel;
  159 are byte-identical. No spatial tolerance or page exclusions are used.
- Both paths report zero resource, parser and font warnings/errors.
- Native element identity, every primary/auxiliary box, baseline, visibility,
  scrollbar size, debugger Auto ink bounds, content and scroll measurements agree within
  0.005 physical pixels, accounting for the reference JSON's decimal precision.
- 109 pages pass literal content assertions for flex, floats, fractional
  dimensions, gaps, positioning, shrink-to-fit, scroll extents, tables,
  image sizing, curved borders, nested clipping, masks, all gradient groups,
  shadows, foreground/backdrop filter combinations, alpha blending, paint
  order, inline fragments, baselines, controls, letter spacing and ACID1.
  These include all static interpolation groups, transformed drag sources,
  navigation target grids, aligned subtrees, input glyph alignment, input
  clipping, text-decorator equivalences and custom overflow marker glyphs.
- Four original content contracts fail; no content group remains unimplemented.
- All 109 passing contracts are re-executed against the independent native
  snapshots and images. Forty-nine mutations verify that missing rendering
  or corrupted content widths are rejected.
- Twenty-five live interaction sequences produce 165 additional captures. Every
  RGB byte is identical between the binding and independent GL3. Focus,
  pseudo-classes, scroll offsets, scrollbar sizes, clock, pointer and context
  dimensions agree. Twenty-three sequences pass positive behavior assertions;
  two fail in both drivers. Failing contracts are independently executed against
  both drivers and retain separate assertion locations and messages.
- Linux and Windows execution and physical IME remain unverified.
- The integrated runtime run passes all 149 test files and records 1,550
  literal PASS markers, with zero FAIL markers. These counts are runtime
  evidence, not acceptance of the pending VisualTests assertions.

The [per-page evidence ledger](visual-corpus-evidence.json) retains each source
hash, upstream metadata, measured frame positions, capture fingerprints,
comparison result and content/interaction status.
The [interaction ledger](visual-interaction-evidence.json) records the input
manifest hash, source hashes, per-checkpoint comparisons and behavior assertions.

## Live behavior assertions

The literal TSV input sequence is executed by the public JS binding and by
an independent C++ driver. Neither modifies the upstream RML documents.
Animation time advances in 1/60-second steps; single large clock jumps do not
prove animation endpoints because RmlUi clamps elapsed animation time.

- `color_interpolation`: red start, gamma-2 midpoint, green endpoint and
  reversal after the declared 0.6 seconds.
- `flex_01`: the declared 1.2:1:1 grow factors and exact restoration after exit.
- `element_label`: forwarded hover/active, two checkbox toggles, input focus
  and button activation through the distant label.
- `issue_452_scrollbar_resets`: both actual tabset/flex scroll containers reach
  their bottom and retain offsets while button padding changes.
- `position_absolute_static_position`: wheel and direct article scrolling
  retain the absolute box's wrapper-relative position.
- `media_query_01` and `media_query_02`: the 999/1000 menu boundary, opening
  the collapsed menu, three sprite variants and the 2x-resolution asset.
- `navigation_02`: explicit entry/exit, automatic skipping of the right
  container and scrolling the explicit bottom target into view.
- `navigation_01`: click activation, all four arrows, Tab, exact focused grid
  targets and automatic scrolling to the offscreen column target.
- `document_position`: both document and block handles move and resize.
- `handle_target_anchor`: all three anchoring modes survive moving, sizing
  and parent resizing; extreme drags stop at -50%, 50dp and zero edge margins.
- `inline_formatting_03`: real handle resizing splits the inline span into two
  boxes, joins them when widened and restores the original decorated boxes.
- `position_absolute_transform`: 160dp scrolling clips both transformed
  absolute/fixed children; bottom scrolling removes all child pixels.
- `drag`: both transformed originals remain stationary; red drag clones move
  exactly 20/10 pixels and disappear on release.
- `text_decorator`: hover changes to red heart text and exit restores the
  original pixels without layout movement. All seven inherited color, opacity,
  italic, bold, spacing, debugger-font and size cases also retain exact layout
  and restore their original pixels. The later `group.hover` rule retains
  the earth text in those cases; only inherited properties change.
- `issue_143_overflow_in_absolutely_positioned_input`: hover clipping retains
  glyphs within the input content area and leaves the right exterior blank.
- `text_overflow_02`: all eight original custom markers change text paint
  without moving any box, and every exit restores the original marker pixels.
- `table_04`: minimum and maximum row heights and remaining empty table space.
- `scrollable_overflow_values`: all fourteen block/flex scrollbar-axis rules.
- `scrollable_overflow`, `scrollable_overflow_height` and
  `scrollable_overflow_margin_padding`: all direct/nested and block/flex limits
  clamp at their literal margin/padding extents and restore original paint.
- `flex_03_scroll`: both-axis and single-axis containers reach exact limits.
  Native setters also clamp visible overflow, as specified by their Core
  implementation; no browser-specific setter behavior is assumed.

Mutation checks reject missing checkbox state, a reset scroll offset and
missing clone rendering. Sixteen additional mutations run against both
drivers and reject lost navigation focus, anchor constraints, inline splits,
decorator/custom-marker glyphs, input clipping, transformed clipping and
scroll offsets. Loading or comparing a screenshot alone does not
pass these behavior assertions.

## Original contract disagreements

Four static contracts and two live contracts fail using the pinned Core and
actual GL3, as well as the binding. They remain failures in the ledger and make the
comparison command exit one.

- `position_05_floating_a_box_clear`: the fixture expects `clear:right` on an
  inline span to place it below the float. Its top is 72px while the float's
  bottom is 144px. Upstream `FormatInlineBox` retains the parent's block
  container; clearance is processed for block and floated boxes.
- `position_07_absolute_positioning_relative`: the fixture expects the
  positioned inline parent to anchor its absolute child. The parent begins at
  (226, 32), so the declared offsets would produce (126, 232). Both paths
  produce (-100, 200), anchored to the document. `FormatInlineBox` formats
  children with the existing parent container; `GetContainingBlock` traverses
  container boxes, not the positioned inline box.
- `white_space`: all five forms of `I` should intersect the 250px guideline
  at the same center. The white glyph pixels in `none` and `left` center at
  250px; `right`, `both` and `newlines` center at 244px in both renderers.
  The final wrapped ABC line also centers at 244px; the first three center
  at 250px. Plain and nested Hello World glyphs have different word spacing.
  Duck glyph starts are 0/37/74px when the spaces are outside their spans,
  compared with 0/41/82px for the inside-span and plain-text forms; the first
  form loses the declared 4dp word space. Each original requirement is
  checked separately even while the other whitespace contracts fail.
  `ElementText::BuildToken` preserves a trailing collapsed space and
  `GenerateLine` includes its advance in the line width.
  `LineBox::Close` centers that width without removing the trailing advance.
  `Factory::InstanceElementText` discards whitespace-only nodes, so spaces
  between the Duck spans never reach word-spacing layout. Direct native
  measurements give 36+47px for the nested Hello World runs and 79px for
  the plain run. These diagnoses preserve the failing original assertions.
- `ink_overflow_bounding_box`: the debugger's actual `BoxArea::Auto` bounds
  cover the skewed box shadows but omit the drop-shadow extension. The
  drop-shadow box bounds end at 348px while the original 40px lower shadow
  requires coverage through 388px. A solid yellow pixel at (280, 383) proves
  that the omitted ink is rendered. `ElementUtilities::GetBoundingBox`
  explicitly excludes filter overflow; the debugger uses this function
  directly. The separate extension in `ElementEffects` affects rendering
  but does not extend the debugger outline.
- `flex_04` live resizing: at the original 500dp document width the long
  `flex: none` item is 263dp wide. Resizing to 200dp reduces it to 164dp,
  contradicting the fixture's requirement that these items neither shrink nor
  grow. `FlexFormattingContext` obtains an auto basis through
  `LayoutDetails::GetShrinkToFitWidth`, which clamps intrinsic content width to
  available container width before the zero shrink factor can preserve it.
- `text_overflow_01` live rendering: repeating the initial render at the same
  clock and without input changes 264 pixels at x=16–50, y=202–213. Hover exit
  also fails to restore the original first-line pixels in the hidden-overflow
  box. Layout remains unchanged. Both drivers reproduce the same corruption
  and correction. A separate cold-atlas inspection changes 278 pixels at
  x=13–50, y=202–213, while the canonical corpus retains its 264-pixel failure.
  `ElementText::GenerateGeometry` emits earlier-line UVs before a later
  abbreviated string introduces the ellipsis glyph. The font layer rebuilds
  its atlas and replaces the shared mesh texture; the earlier UVs refer to
  its prior packing. The font version changes from zero to two.
  A diagnostic premeasurement of U+2026 changes the first version to one
  and removes both repeat and hover-restoration differences. This diagnostic
  does not alter the canonical capture or pass its failed assertion.

The relevant pinned positioning implementations are
`Source/Core/Layout/BlockFormattingContext.cpp`,
`Source/Core/Layout/BlockContainer.cpp` and
`Source/Core/Layout/LayoutDetails.cpp`. The bounding-box sources are
`Source/Core/ElementUtilities.cpp`, `Source/Core/ElementEffects.cpp` and
`Source/Debugger/ElementInfo.cpp`. No fixture or Core source is rewritten and
none of these failures is converted to a passing content assertion.

The cold-atlas inspection is retained in
`/tmp/rmlui-63-completion/original-text-inspection.json`
(SHA-256 `4a72f3ffa802f2db67d9acc60bf6a31659d64bbadcdc5326f19fab4ec4231619`).

## Renderer corrections

The initial corpus found two concrete differences. Color matrices clamped RGB
to source alpha; GL3 instead retains matrix output and lets RGBA8 clamp the
channel range. A failing translucent sepia/brightness regression verifies the
correction.

Loaded, preloaded, generated and saved-layer textures now match GL3's linear
repeat addressing. A failing two-texel callback texture regression sampled blue
at `u=1.25` before the correction and red afterward. This also resolves the
transformed box-shadow reference difference. Saved alpha masks retain their
separate bounded sampling behavior.

## Match-document interpretation

All eighteen match documents were executed. Thirteen match their primary page
within the strict pixel tolerance. Five pass explicit feature comparisons:

- `flex_05` compares the twelve container sizes, not their child content;
  all measured container rectangles agree.
- `flex_06` intentionally places its reference at `left: 55%`; sizes and
  offsets relative to the document agree.
- `gap-008` has different explanatory whitespace; section and item
  rectangles agree.
- `flex_wrap_column_reverse` retains the exact declared heights and ordering.
  The test's `*, p` reset overrides imported paragraph margins; the reference's
  `*` reset does not. Its collapsed gap is `max(10px, 0.8em) = 11.2px`,
  compared with the test's 10px. Both are asserted explicitly.
- `table_01` explicitly states that its inline-block reference is not pixel
  accurate and does not reproduce row coloring. Both layouts pass centered
  400dp width, four columns, 2/4-column spans and 20dp footer assertions.

These differences do not authorize rewriting upstream fixtures or marking the
whole corpus accepted.

## Reproduction

Run from `packages/sfml.js-rmlui`, reusing the existing build and dependencies.
Create the output directories once under the task's existing temporary root.

```sh
node test/visual/prepare-corpus.cjs /tmp/rmlui-63-completion/visual-corpus
python3 test/native/rendering/reference/build-gl3-reference.py \
  /tmp/rmlui-63-completion/visual-corpus/gl3 \
  --visual /tmp/rmlui-63-completion/visual-corpus/manifest.tsv
node test/visual/capture-sfml.cjs /tmp/rmlui-63-completion/visual-corpus/sfml
python3 test/visual/compare-corpus.py /tmp/rmlui-63-completion/visual-corpus
```

Run the interaction phase in its existing temporary directory:

```sh
node test/visual/interactions/prepare.cjs /tmp/rmlui-63-completion/visual-interactions
python3 test/native/rendering/reference/build-gl3-reference.py \
  /tmp/rmlui-63-completion/visual-interactions/gl3 \
  --visual /tmp/rmlui-63-completion/visual-interactions/manifest.tsv \
  --actions /tmp/rmlui-63-completion/visual-interactions/actions.tsv
node test/visual/capture-sfml.cjs \
  /tmp/rmlui-63-completion/visual-interactions/sfml \
  /tmp/rmlui-63-completion/visual-interactions/actions.tsv
python3 -B test/visual/interactions/compare.py \
  /tmp/rmlui-63-completion/visual-interactions
python3 -B test/visual/interactions/reject-mutations.py \
  /tmp/rmlui-63-completion/visual-interactions
python3 -B test/visual/compare-corpus.py \
  /tmp/rmlui-63-completion/visual-corpus \
  --interaction-report /tmp/rmlui-63-completion/visual-interactions/comparison.json
```

Assertions live in `test/visual/assertions/layout`,
`test/visual/assertions/layout/inline`,
`test/visual/assertions/controls`, `test/visual/assertions/rendering` and
`test/visual/interactions/validators/{controls,layout,rendering}`.
Shared primitives contain no
page-specific expectations.

Content sampling resolves the same DOM path in an existing top/scroll frame.
It fails when the requested pixels are not captured. Filtered wheels are
checked against literal alpha/contrast compositing equations. Blur detail
is compared to the original atlas, and media sprites compare every pixel
against their source atlas rectangle. These content checks supplement the
strict independent renderer comparison.

The filter-overflow page reproduces its declared upstream limitation: the
red box is blurred, while the overflowing blue child is absent. Its assertion
records this limitation explicitly and does not claim that the blue child
renders. The local page-content pass does not resolve the full feature gate.
The text-overflow-02 page also explicitly declares that atomic inline elements
do not implement ellipsis. Its content contract checks marker glyphs, original
line geometry and literal atomic clipping without treating that limitation
as implemented atomic ellipsis support.

The Python comparison uses the already installed Pillow and NumPy.
`--require-complete` fails while whole-corpus acceptance remains incomplete.
Captures, executables and logs remain in the task temporary directory.
