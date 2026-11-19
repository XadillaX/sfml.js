# Official application implementation checkpoint

> **Task 9 remains open.** The current manifest contains all 20 upstream
> applications, including both original native games and the original Demo.
> The supplements below record current local evidence. Remaining platform work,
> 113-page visual reference comparisons and independent acceptance are pending.
> Earlier application inventories and full-runtime counts are historical.

## Application structure

The [document transfer supplement](core-document-transfer-acceptance.md)
verifies the original `basic/demo` root-to-sandbox ownership prerequisite and
the optional original IME font preparation command.
[Original demo application acceptance](official-demo-acceptance.md) adds its
three original application modules, six binding scenarios, a direct unchanged
C++ reference, callback corrections and two native screenshots. Its 66 focused
binding scenarios and four direct vendor cases are local evidence; the earlier
full runtime counts below remain historical.

[Original Invaders acceptance](official-invaders-acceptance.md) records both
original native games, actual Lua startup/menu scripts, ten standalone native
reference scenarios, two integrated game/lifecycle scenarios, score persistence
and native screenshots. All four galleries now contain 29 entries.
The package-built application loader is verified on macOS; Linux and Windows
builds and execution remain unverified. The VisualTests and whole-project acceptance
remain open. Application inventories and counts below describe earlier
checkpoints; the current manifest contains all 20 upstream applications.

Each application follows the upstream sample directory:
`examples/official/basic/animation/main.cjs`,
`basic/benchmark/main.cjs`, `basic/data_binding/main.cjs` and
`basic/tree_view/main.cjs`. The existing data-field helper remains alongside
data binding. Animation and benchmark own their event and frame logic.
The launcher selects the application and supplies the SFML backend.

The moved data-binding and data-storage files have exactly the same SHA-256
values as their original bytes in `source-layout-evidence.json`. The tree-view
application changes only its existing helper import. Historical source-layout
paths and fingerprints remain unchanged; the new checkpoint records the
relocations separately.

## Local behavior

| Application | Observed behavior |
| --- | --- |
| Animation | Original transforms, color keys, fades and animation events; Space pauses, Return steps, +/- nudges, arrows animate, inline clicks toggle the transition or request exit |
| Benchmark | Regenerate 50 original rows; pause and single-step row updates independently from rendering; preserve the zero-initialized 200-entry float32 FPS ring |
| Data binding | Existing Basics, Events, Invaders and Forms interactions pass |
| Tree view | Existing directory-first traversal and descendant toggling pass |

Five basic-application scenarios and four existing data scenarios passed.
Animation and benchmark preserve the upstream window requests, vertical sync,
resource paths and document contents. The operating system may constrain the
visible window to the available screen.

The launcher initializes Debugger for animation and benchmark and handles F8
before application keys. Scripted clicks begin after layout, matching the
first rendered frame available to physical input. The standalone benchmark
listener declared but never attached upstream remains unused.

Mixed-unit animation interpolation returns pixels while an animation is active.
Select options move into the native widget and are inspected with `getOption`;
the original benchmark options have no submitted values.

## Captures and validation

[Animation](../../../../packages/sfml.js-rmlui/examples/screenshots/animation.png)
and [benchmark](../../../../packages/sfml.js-rmlui/examples/screenshots/benchmark.png)
were captured from actual SFML windows and visually inspected. They show the
original transform/transition panels and the route/range/select workload.
These captures are not independent GL3 pixel comparisons.

Package lint passed. Four-language example cards include source links, controls,
bounded commands and native screenshots. The
[fingerprinted checkpoint](official-application-checkpoint.json) records the
observed logs, captures, application inventory and 113 visual-test names.
The completed animation/benchmark revision passed 143 runtime suites:
1,484 scenarios, zero failures. It predates the additional entries below.
The source snapshot for that revision remains separate from current sources.

## Application directory and control continuation

The manifest now selects 17 independent upstream application entries.
Application scripts follow `basic/<application>/main.cjs` and
`tutorial/<application>/main.cjs`. Inventory, drag-listener and transform-window
classes remain alongside their corresponding upstream application.
`shell/shortcuts.cjs` translates the actual upstream Shell handler; the
command-line launcher supplies its before/after-context priority order.

Variables loads the original stylesheet directly, retaining its `px` lengths.
The tutorial and basic drag applications remain separate. Basic drag retains
its original synchronous transfer/insertion algorithm. Transform retains the
post-presentation update, 50-degree-per-second rotation and shared pause flag.
Effects binds the original float32 fields and resets only the selected
submenu. SVG retains all three documents and all three inline update paths.
Bitmap and HarfBuzz select their respective native engines before initialization;
HarfBuzz registers the original language scripts and directions.

Current application-control checks record **8 PASS, zero failures**.
They cover the effects launcher, original variable lengths and themes, Shell
density/reload priorities, tutorial items, transform timing, effects submenu
reset, SVG updates and synchronous basic-drag transfer in both reorder directions.

The native transfer fix separates a dragdrop parameter reference from active
method receivers and event targets. The transfer exception applies only to
that parameter's exact draggable element;
its ancestors, other parameters and outer receivers remain protected.
A strong V8 wrapper owner retains both native ownership and the callback-owner
edges through the outer native input operation. Callback reference management
lives in `native/events/rmlui-event-references.cc`.

Seven binding regressions cover native pointer input, detachment and GC between
listeners, exceptions, ordinary parameter aliases, nested receivers and ancestor
destruction. Three additional direct-vendor scenarios verify the native
unmodified, transferred and detached paths. Upstream `Context::OnElementDetach`
silently cancels a removed drag, so no dragend event follows that removal;
an unmodified drag still emits dragend. The original failing synthetic and
pointer-input logs remain separate regression evidence.

Native captures for effects, transform, SVG, Lottie, bitmap font and HarfBuzz
were visually inspected. Independent GL3 application reference comparisons
remain required. The direct Lottie raster comparison is recorded below.

The bitmap application now has checks against the original `.fnt` glyph advances,
kerning pairs, atlas dimensions and first-glyph UVs for its actual paragraph.
HarfBuzz checks all three original language buttons, the resulting native line
widths and the English, Arabic and Hindi ligature/conjunct geometry.
These are font-engine and application behavior checks, not independent GL3
application screenshots.

`basic/custom_log/main.cjs` and its own `system-interface.cjs` preserve the
missing-document warning, severity prefixes, immediate file writes and
application-local clipboard. Logs go to an explicit `--log-file` destination
or a temporary directory; they are never written into the repository by default.
The original `assets/demo.rml` remains unchanged. The native assertion macro is
disabled in the Release build, as in the upstream Release application.
Four checks verify bounded launch, actual native log levels, clipboard behavior
and document loading. Its native screenshot and the basic-drag screenshot were
visually inspected.

Current package lint, existing five animation/benchmark scenarios and four
data/tree scenarios pass. The checkpoint records full-runtime revisions
separately. The three remaining application entries,
113 VisualTests comparisons, physical IME and independent whole acceptance
remain open.

## IME and original Lottie verification

The IME entry preserves the original document, emoji input, eight-language
textarea and all ten font faces. Five Noto fallback downloads match the
upstream CMake hashes; fallback faces use the original explicit normal weight.
The launcher accepts per-face fallback metadata and retains existing defaults
for the other applications. Three checks cover original control values,
native glyph generation, Unicode replacement, focus changes and closure.
The original Debugger initialization supplies the shortcut font used by the
document. Its six internal documents remain alive when the application closes.

The native IME fixture had two distinct sources of nondeterminism. Ordinary
desktop typing entered its SFML queue after the synthetic key was replayed.
Modifier changes also produced untagged native keys through `flagsChanged`.
A temporary subclass of the fixture's own surface accepts only explicitly
sent synthetic keys and restores the original class on exit.

The allocation counter was process-wide: a recorded failure on
`main_thread=0` consumed a fault intended for the focus operation, and one
repeated run terminated with an uncaught helper-thread `std::bad_alloc`.
Thread-local injection now exercises only the focus operation. The synthetic
Cocoa suite passed 41 checks in each of five consecutive runs. These fixture
corrections leave the production adapter unchanged. Physical composition and
candidate-window checks remain separate acceptance requirements.

The original mountain animation is compared with a standalone executable
linked directly to the existing rlottie archive. Checks use the actual
270 × 225 content raster, original template background and native clipping.
At 0, 0.731, 1.419, 2.783, 3.521 and 3.913 seconds the reference selects
frames 0, 18, 35, 70, 0 and 10. Each comparison checks 182,250 color channels;
all six report zero mismatches and maximum channel error zero.

All four example galleries now contain 26 entries, including the eight
additional basic applications and IME. Every added entry has its own source
link, run command, native screenshot, controls and upstream link.
Thirty focused rendered-site and RmlUi documentation checks pass.

Earlier failed integration attempts remain in the evidence history. The current
complete runtime run passed 149 test files with 1,517 PASS records and zero
failures. Its application, native-source and binary fingerprints are recorded
in the checkpoint JSON. This is local macOS integration evidence; Task 9 still
requires the remaining applications and visual reference corpus.
