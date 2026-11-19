# Original visual failure diagnosis

> The six original acceptance failures are retained and deferred by the user's
> explicit upstream-parity decision. Fresh macOS arm64 captures
> reproduce four content failures and two interaction failures in both drivers.
> All 38 fresh SFML/GL3 frame pairs are byte-exact. Matching the reference does
> not establish the behavior required by the original pages.

The [measured report](visual-failure-diagnosis.json) records original metadata,
source hashes, frame hashes, geometry differences and complete assertion stacks.
Capture outputs and diagnostic scripts use
`/tmp/rmlui-63-completion/visual-diagnosis`. Original corpus and interaction
failure evidence remains retained.

## Confirmed paths

| Original page | Original requirement and observation | Source path |
| --- | --- | --- |
| `ink_overflow_bounding_box` | The debugger bounds must include filters. The rendered yellow shadow reaches below the reported bottom of 348px; the original check requires 388px. | `Source/Debugger/ElementInfo.cpp:162` uses `GetBoundingBox(Auto)`. `Source/Core/ElementUtilities.cpp:242–244` explicitly excludes filter ink; `ElementEffects.cpp:222–230` extends the rendering scissor separately. |
| `position_05_floating_a_box_clear` | The original description requires the sibling below the right float. Its top is 72px while the float bottom is 144px. | `Source/Core/Layout/BlockFormattingContext.cpp:164–178` inserts an inline box into the existing block container. Its inline path has no clearance application; block and floated paths apply clearance separately. |
| `position_07_absolute_positioning_relative` | The absolute child must use the positioned inline parent's top-left corner. Actual x is -100px; the declared parent-relative x is 126px. | `Source/Core/Layout/BlockFormattingContext.cpp:176` passes the unchanged block container to inline children. `LayoutDetails.cpp:147–164` searches container ancestors, so the inline parent cannot establish the child's containing block. |
| `white_space` | The original page requires centered I/ABC, identical Hello World spacing and word spaces between Duck spans. The measured centers include 244px against the 250px guideline; heading masks differ; Duck offsets are `[0,37,74]` versus `[0,41,82]`. | `Source/Core/ElementText.cpp:650–660` appends a final collapsed space to a token. `GenerateLine` includes that space in measured line width. Inline text fragments also keep text-node-local whitespace state. |
| `flex_04` | `flex:none` must retain its item width when the document narrows. The long-word border box changes from 263px to 164px. | `Source/Core/Layout/FlexFormattingContext.cpp:329` obtains the auto basis through `GetShrinkToFitWidth`; `LayoutDetails.cpp:254–260` clamps that result to the available width before the zero shrink factor is used. The failure is in the none group, not the numeric equal-share assertion. |
| `text_overflow_01` | Initial paint must be stable and hover exit must restore text. The fresh sequence changes 278 pixels at x=13–50, y=202–213 without time/input changes. | `Source/Core/ElementText.cpp:496–527` generates full-line meshes before measuring abbreviated strings containing the ellipsis. `FontFaceHandleDefault.cpp:59–70,249–265,343–363` lazily adds glyphs and rebuilds the atlas. Earlier meshes can retain coordinates from the preceding atlas layout. |

These findings establish the failing source paths; they do not authorize
changing pinned Core, markup, fixtures, thresholds or exclusions.

## Authorized acceptance policy

The user chose: 「如果是它自身问题，就先不用管了。它自己都有问题过不了，
你还能怎么办？它能过的，你为什么过不了」。

Binding acceptance therefore requires all upstream-passing content and input
contracts to pass in SFML, with unchanged frame and geometry thresholds.
Only the six diagnosed page/scope/source-hash/assertion-stack combinations in
`test/visual/upstream-failures.json` may receive
`bindingStatus: upstream-failure-deferred`. Both actual drivers must reproduce
the same reviewed assertion stack, and all their reference frames must still
match. Numeric error messages remain preserved; their serialization is not used
as the assertion identity.

Original `contentStatus`, interaction `status`, errors and pass/fail counts
remain unchanged. Separate binding acceptance fields record this decision.
Missing native evidence, a passing native assertion paired with a failing SFML
assertion, any other failed assertion, changed source hashes or any out-of-policy
frame/layout difference must reject acceptance. Publication recomputes these
conditions from page records instead of trusting a summary pass flag.

The distinct integration review reproduced an attachment gap: deleting the
GL3 outcome from one input row while retaining its `bindingAccepted` flag
allowed the corpus CLI to exit zero. The aggregate comparator now recomputes
input acceptance from both driver outcomes, hashes, byte-exact frames and
layout limits. It rejects duplicate or unknown input pages and reports with
another policy version. The reproduction uses unchanged captures and a
temporary JSON report; it changes no production input or fixture.

## Ellipsis single-variable experiment

The temporary probe calls the production default font engine's
`getStringWidth(face, "\u2026")` once before the first render of the unchanged
text-overflow document. It does not alter markup, layout, time, inputs, renderer
or Core source. The measured ellipsis width is 11px. Font version reads zero
before and after this measurement because atlas rebuilding is deferred.

With this single premeasurement, repeat-frame differences are zero and the
unchanged text-overflow interaction validator passes. The original sequence
still fails in both SFML and GL3. This supports lazy glyph insertion and atlas
regeneration as the cause; the diagnostic variant is explicitly not acceptance
evidence and is not installed into the production capture path.

## Metadata reader correction

`test/visual/catalog.cjs` previously ended quoted attribute values at either
quote character. It read `Now the ` instead of the original sibling requirement
and similarly truncated the ink and whitespace requirements. Attribute parsing
now terminates at its opening quote's matching delimiter.

The failing regression retains three literal requirements from unchanged
upstream pages. The corrected reader passes all three and focused JavaScript
lint. Existing catalog metadata was refreshed only after verifying every
original page hash. Assertions, original pages and capture images remain
unchanged.

The first reference rebuild failed to link `Rml::Debugger::Initialise` because
its historical temporary build recipe omitted Debugger objects. The corrected
recipe reuses 241 existing Core/Debugger/FreeType objects and compiles only four
capture/backend objects. It succeeds and the resulting executable produced all
38 fresh reference frames without warnings or errors.

## Acceptance limits

Linux/Windows ABI, linking, IME-engine execution and physical composition/
candidate evidence remain unverified. Whole-scope acceptance and publication
gates for those incomplete scopes stay false. The production Core scope decision
is resolved by the upstream-parity policy above. Remaining work includes
target-platform evidence, distinct whole-change review and delivery validation.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。
