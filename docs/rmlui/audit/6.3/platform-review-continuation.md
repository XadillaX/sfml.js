# Platform integration source-review continuation

This is a distinct implementer source pass after local package, editor and
rendered-documentation verification. It does not establish independent review
or Linux/Windows execution.

## Current adapter checkpoint

[The current adapter checkpoint](platform-adapter-checkpoint.json) records
Windows IMM32 and X11 callback adapter sources under their platform directories.
Their GYP sources, factories and native libraries are connected. Both OS
translation-unit sets remain uncompiled and unexecuted on their target platform.

The current complete package command passes lint, native/TS builds,
declarations and all 152 runtime files: 1,590 literal PASS markers, zero FAIL.
The current checkpoint retains 63 source/dependency/binary fingerprints.
The widget/Cocoa fixture passes 70 contracts using real installed Xlib
declarations and the production X11 state. Four production X11 units pass
host syntax checks. The Linux ABI, linker and native engine remain unverified.
Current native formatting covers 401 files; six compiler naming units and
the 743-file source-package inventory pass. The completed package log is
`/tmp/rmlui-63-completion/x11-real-headers-package.log`; its exit code is zero.
The separate Windows delivery runner and Cocoa probe build retain their
preceding directory-cohort results.

The real-Xlib compile regression first fails in V8/NAN declarations because
Xlib defines `True`, `False` and `Status`. The X11 boundary now undefines those
macros along with its existing `None` and `Always` cleanup. The callback fixture
uses real Xlib declarations where the SDK exists and keeps its explicit
declaration fallback on macOS hosts without that SDK. No XIC is created by the
fixture. The real-Xlib naming command uses LLVM 18's matching C++ and resource
headers; attempts that mixed its parser with Xcode's newer headers failed in
system headers and do not establish naming acceptance.

`sfml.js-interop/include/platform/x11/event-queue.h` has five portable
contracts for native output order, nested polling, host retirement, destruction
during interpretation and exception recovery. Address/undefined-behavior
sanitizers pass those contracts. The queue is not connected to SFML or RmlUi
at this checkpoint. It does not resolve the same-pump XIM layout gap yet.

The complete interop suite passes eleven tests. Its initial seven SDK archive
tests failed while loading an absent native Window builder from their small
archive fixture. The real `ensureSdk()` operation is now also callable without
executing the native build; the CLI still calls the same operation followed by
the actual Window extension builder. The archive tests invoke that production
operation. The actual CLI separately reuses the existing verified SDK and
native build marker. Changed script lint and native fixture style pass.

Runtime deferral must happen after native collection and before returning the
corresponding real SFML events. Putting interpretation only in RmlUi's drain
would leave `waitEvent()` unable to generate the event it is waiting for.
`WindowBase::close()` currently resets its owning implementation immediately.
The new queue can retain a retired host through `Pop()`; the SFML close path
still needs to use that facility. Collection must retain key-repeat filtering
and the order of KeyPress, ClientMessage, focus and other events. Input-client
replacement while native entries remain queued needs its own executable
contract before XIC replay is connected.

Native IME fixtures live under
`test/native/platform/ime/{common,layout,macos,windows,x11}`.
General Cocoa probes and clipboard restoration live under
`test/native/platform/macos`; their build entry points remain at the platform
root. Both Python builders, native includes and JavaScript runners resolve
the current paths.

The file-editing tool removed ten original files while processing no-change
move hunks without producing their destinations. The task transcript retained
the original sources and patch history. Recovery matched recorded source
fingerprints and replayed the two unrecorded fixture histories before restoring
the actual destinations. The restored widget/Cocoa, delivery and probe builders
all execute successfully. The interrupted full-package log and initial missing
source failure are not acceptance evidence. Future no-change moves must verify
the destination immediately; the tool's success message alone is insufficient.

The current real widget/Cocoa fixture passes 70 contracts, including four
Windows snapshot contracts, four X11 preedit contracts and fourteen actual X11
decoder/caret body contracts. The preceding fixture additionally observed
identical existing native object hashes before and after its execution.
Six compiler naming units pass with the
layout header included. Native formatting passes 399 files; the final edited
fixtures pass formatting and cpplint. The source package contains 743 files and
57 install/build/application entries. Reapplying the persistent layout patch
twice leaves all three changed dependency files byte-identical.

The preceding hook checkpoint has nine registry contracts, three actual
installed-library contracts and four prepared SFML lookup contracts. Those
hook sources are unchanged by the display-line work.

XIC teardown now retires capture immediately and keeps its callback owner alive
through `XDestroyIC`. The registry contract first failed when closing released
that owner; it passes with explicit retirement ownership. SFML's X11 cleanup
destroys the XIC while retaining that owner, including `DestroyNotify`.

The native decoder and caret bodies compile verbatim from the current source
with Xlib data declarations substituted on macOS. Nonterminated UTF-8,
wide text, locale restoration on exceptions, code-point word boundaries,
deferred edits and synchronous retired-caret replies pass. This does not
establish Linux ABI or actual XIM engine execution.

The prepared SFML lookup branch uses the private header copied by its actual
installer. A failing 151-byte native commit now expands storage and retries
the same event. Exact-capacity text, supplementary characters, combined
character/keysym status and nontext status also pass. Short input retains stack
storage until a real overflow. The source-package archive contains current
header, patch and installer bytes, verified without extraction.

XIM display-line movement now has a runtime snapshot implementation under
`native/platform/ime/layout`. The dependency patch exposes native line stops
and their pixel positions without moving a widget. Capturing is enabled only
for X11 sessions. A native formatting revision reuses an unchanged snapshot;
pending formatting invalidates it. Rendering refreshes the active session
after its native text layout is current.

Line-start/end, previous/next-line and up/down callbacks query copied data.
Vertical moves preserve the horizontal pixel offset across shorter lines.
Queued caret edits retain the existing composition and carry the soft-break
affinity to the widget, so a line end and the next line start can render at
different places while returning the same code-point offset. Movement is
clamped to the preedit range, including a supplementary-character prefix.

Feedback-only draws now queue only a caret update. An unchanged caret retains
its soft-break side and ideal horizontal position. The native formatting
revision remains unchanged, allowing the next display-line movement without
another render. The first regression returned position 7 instead of 8 after
feedback on a shorter intermediate line; the corrected fixture also observes
the unchanged rendered soft-break line.

The first display-line regression failed when `LineEnd` returned the entire
preedit extent. The expanded fixture uses the native widget's own down-key
behavior as a proportional-width reference and observes the rendered caret
line after soft-wrap movement. Its production callback body is still compiled
verbatim with Xlib declarations substituted on macOS.

The same-pump freshness requirement remains open. If XIM changes the preedit
and requests a display-line move before the runtime can format that text, the
adapter returns the actual copied caret and captures
`XIM display-line caret requires a current runtime layout snapshot`.
The exception is raised at the runtime boundary before queued edits run.
This explicitly reports unavailable layout rather than returning a guessed
column. It is not full support for that XIM callback ordering, and the platform
or whole-scope acceptance flags must remain false.

Cocoa key-window regain now queues native input-context activation. It runs
after preceding cancellation at the owning runtime entry. Retiring the session
before drain discards that activation. Two lifecycle contracts observe the
actual native `activate` method through an instance-local subclass that calls
its original implementation. `currentInputContext` is not used as a CLI focus
oracle: even direct native activation does not make it identify this fixture.
These contracts do not establish physical focus or Chinese engine execution.

[The bounded desktop attempt](desktop-ime-attempt.json) selects Sogou Pinyin
and independently verifies restoration to ABC with identical before/after
inventories. Its native input context reports the Sogou source, but the
application and key-window status remain false. `SetFrontProcess` reports
-13066. Launching the same executable through a bounded application bundle
does not establish native key focus. The initial unfocused attempt receives
English insert callbacks; these are not evidence of actual Chinese preedit or
commit. No physical keyboard or candidate-window acceptance is established.
Launch Services' zero exit is explicitly separated from the application's
`UNACCEPTED` output. No Cocoa engine correction is inferred from this attempt.

The preceding verified language-server and extension builds, five installed
editor-host contracts, VSIX byte inventory, source-package inventory, 87 site tests,
four-language site build/link checks and 56 guides at three browser widths
pass. The API browser cohort remains historical. Rechecking retained visual
captures still fails four content contracts and two interaction contracts.
Physical input, Windows/Linux execution, candidate placement, all six original
visual disagreements and distinct independent whole review remain required.
All five publication gates remain rejected.

## Historical hook checkpoint

The observations below describe the earlier hook checkpoint before these
adapter sources and the XIC retirement correction. Its hashes and counts are
historical; use the current checkpoint above for this revision.

[The SFML hook checkpoint](platform-window-hook-evidence.json) records the
current installed extension, source hooks and message-lineage verification.
The earlier boundary snapshot below is historical; its old callback-header
and Native fingerprints do not describe this continuation.

[The native boundary checkpoint](platform-input-boundary-evidence.json)
records the common deferred queue and per-window callback registry. Real
widgets verify preedit/commit delivery only at drain, cancellation, retired
edits, duplicate text, event-source release and native close. The registry
rejects unrelated handles, unsupported configuration and a window closed
during configuration. It retains no captured-event history.

The existing Native tree builds successfully. Its complete runtime executes
150 test files with 1,559 literal PASS markers and no failed files. The real
widget/Cocoa fixture has 46 PASS markers; the standalone registry has five
contracts. Whole native formatting, package lint/cpplint and focused compiler
naming checks pass. Cocoa files now live under `native/platform/ime/macos`.
These observations establish common boundary behavior; OS hooks and adapters
remain the next implementation step.

`native/platform/ime/platform-text-input.cc` returns no adapter from
`NativeTextInput::Create` on every non-Apple platform. The common session,
Unicode ranges, transformed caret bounds, per-window ownership and runtime
drain already exist, but composition cannot reach them from Windows or Linux.
Final SFML text events therefore cannot satisfy platform IME acceptance.

The Window extension now exports registration and queued-event provenance
from the loaded SFML library on all supported platforms. The loader resolves
the module owning `sf::Keyboard::localize`; it does not load another runtime.
The dependency build helpers live under `sfml.js-interop/tools/sfml`.
Their identity includes every patch, protocol header and build helper.
Preparation reuses the existing dependency source and platform build
directory, atomically replaces Window and preserves the original System.

The native registry and delivery scope compile with SFML's C++17 requirement.
Eight contracts verify ownership, rejected registration, handle retirement,
nested client replacement/detachment, unwinding and exact X11 filter
reporting. Three additional macOS contracts resolve the actual installed
Window exports, reject unknown handles and check that capture cannot invent
a polled source. Windows/Linux branches of that test also exercise actual
native delivery, distinct sources for repeated events and close; those branches
have not run here.

The macOS Window build, installed-library contracts, whole native formatting,
native protocol lint, shared-helper JavaScript lint and focused compiler naming
checks pass. An unchanged-extension probe calls preparation twice and verifies
that the installed library's inode and modification time do not change.
The current RmlUi rebuild passes. Its completed collector runs 150 files with
1,559 literal PASS markers and zero failed files; the real-widget/Cocoa fixture
passes 46 contracts. The collector's snapshot predates the additional Windows
lineage test, which passes its three contracts separately.

The existing SFML source tree identifies the platform extension points:

- Windows: both constructors register their live native handle; cleanup and
  destruction retire it. `globalOnEvent` brackets `processEvent` and the
  complete original/default window procedure with a delivery scope, including
  nested `WM_IME_CHAR` and `WM_CHAR` messages. A composition/candidate adapter
  still needs implementation.
- Linux: initialization registers the actual display, XIM and XIC with a
  configuration callback. Attachment replaces the host XIC only after creation
  succeeds; detachment restores SFML's original preedit style. The host restores
  focus and owns XIC destruction. Native event processing has a delivery scope
  and reports the actual `XFilterEvent` result before the SFML key entry.
  The preedit/caret callbacks still need implementation.

Ruling: filter provenance comes from the actual X11 filter result, before the
event is queued. An adapter must not infer that result from public key values
or from whether preedit happens to be visible. Incorrect inference can forward
an IME-owned Enter key to the widget as an extra newline.

The first shared-helper attempt supplied an absolute `git apply --directory`
path. Git reported success while skipping all dependency targets. The
installed-library test failed because the actual binary lacked protocol
exports. Applying the patch from the existing source directory corrected the
input; the subsequent real SFML build and loaded-library test passed.
The build also exposed C++20-only `unordered_map::contains` in the shared
registry. The registry now uses `find`, and its tests compile as C++17.

`native/platform/ime/windows/composition-delivery.h` records only the active
native call stack. Three portable synthetic contracts cover both surrogate
units under an IME result, independent keys/characters and unmatched exits
after failed entry. The same character delivered separately remains ordinary
text. These tests pass with package lint, formatting and compiler naming;
the Windows adapter has not yet connected this model to IMM32.

Native callbacks must copy or queue OS state while the SFML pump runs.
Widget edits and host callbacks remain inside the owning RmlUi runtime
boundary. Focus replacement, window close, context removal and runtime restart
must invalidate late work. The OS callback must not retain a raw widget
pointer after its session expires.

## Verification limits

The current dedicated CI workflow declares three platforms, but it has not
executed against this revision. Its runtime collector includes every
subsystem's `.test.cjs` file. Some native reference and Cocoa fixtures are
macOS-specific; a passing collector on another platform would not itself
prove composition or candidate behavior.

Original game loading is checked in the ordinary runtime collector.
The explicit original native game reference/lifecycle runner deliberately
requires macOS and prepares its references before loading either integrated
game. Linux/Windows need actual corresponding application observations.

The production rendering scan finds no raw GL call or GL header under
`native/rendering`. The reviewed geometry and clip paths use SFML buffers,
shaders, textures and stencil modes. The retained independent GL3 captures
remain reference-only. This source observation does not accept the six
outstanding original visual contracts or unobserved GPU/platform execution.

## Local delivery observations

[Current delivery evidence](source-package-editor-evidence.json) verifies
shipped build/install helpers, source inventory, runtime, actual editor host,
VSIX and four-language browser cohorts. Actual output validation now rejects
an empty guide body even when its navigation shell has a heading. The
homepage footer is outside that guide rule. Source and binary fingerprints
were checked against the files after these corrections.

That package/editor snapshot predates the Native boundary checkpoint and
the Cocoa directory migration. Its Native fingerprints and old source paths
must be refreshed against a later actual package run; changing their hashes
alone would not establish current package/editor verification.

All five whole-scope publication gates remain rejected. Required next work
is the non-macOS native bridges, their lifecycle/composition tests, physical
candidate observations, available platform execution, retained visual
contracts and independent whole-change acceptance.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。

## Native queue review continuation

The private SFML event queue now owns deferred X11 interpretation and opaque
event sources. The source patch preserves the original collection order and
key-repeat filtering. `waitEvent` drains callback-only deliveries before
waiting again; nested polling cannot repopulate an active interpreter.
Public SFML window/event layouts remain unchanged.

Weak generation tokens are revoked on replacement and immediately on close,
including a close while native configuration retains its host. Stale raw input
does not reach a replacement XIC, while WM protocol processing remains available.
An active XIC cannot be replaced from a runtime/font callback. Window close
retains the native implementation and callback owner through active polling
and the original native teardown.

The complete prepared X11 translation unit passes real-Xorg syntax checks on
macOS. Executable fixtures run its exact collection and queue-related bodies
with the unavailable X server and native host substituted. Seven queue tests,
five collection/poll/wait/lifetime tests and five actual lookup-branch tests pass;
address and undefined-behavior sanitizers pass both queue/lifetime fixtures.
The current complete package run verifies 152 files and 1,590 PASS markers.
The Window rebuild, twelve-test interop suite, 402-file formatting and shipped
queue/patch/installer archive bytes pass.

This review does not accept guarded RmlUi synchronous interpretation, current
layout after a same-delivery preedit replacement, target-platform linking,
actual IME engines, candidates, retained original visual disagreements or
independent whole-change review. Those remain required before full acceptance.

## Guarded input interpretation

The private protocol now distinguishes rejected, completed and interrupted
interpretation. Rejection leaves the original raw delivery at the queue front
without allocating; `waitEvent` returns after that rejection. An interrupted
delivery yields to the host immediately and retains generated output ahead of
later raw input. It does not replay the interpreted delivery.

The X11 client wraps the entire native handler in the owning `RuntimeScope`.
Preedit callbacks synchronously drain queued edits only while that scope permits
callbacks. The drain protects each encountered widget, including a focus change.
Dirty text is formatted through the native widget's existing `OnLayout` path
before its layout snapshot is read. Native collection never formats text or
queries a JS font engine.

Six live-addon contracts verify runtime ownership, nested polling, rejected
callback reentry, first-error identity, errors raised by deferred destruction at
runtime exit, and receiver protection during actual JS font measurement.
The exit-error regression first observed the original error being swallowed by
the next delivery; it now returns to the host before that delivery executes.

The exact production Draw and Caret bodies execute against real RmlUi widgets
and installed Xlib declarations. The same-delivery test performs no intervening
Update, Render or scheduled drain: line-end replies with code-point 4 after
replacing the original one-character value. Its synchronous drain is supplied
by the native fixture; this does not execute a Linux XIC or input-method engine.

Retired FocusIn/FocusOut deliveries now also suppress their XIC calls. Their
exact prepared guards fail before the correction and pass afterward. Current
lookup and focus contracts substitute only the external Xlib calls.

Nine queue contracts and six prepared collection/poll/wait/lifetime contracts
pass address and undefined-behavior sanitizers. Ten compiler naming units and
all 404 maintained native formatting inputs pass. The source package contains
745 files and 57 install/build/application entries. The 30-entry interop archive
contains the exact current queue, callback protocol, patch and installer bytes.
Logs use `/tmp/rmlui-63-completion/x11-runtime-*`.

Full acceptance remains open. Linux/Windows ABI and execution, real IME
composition and candidates, six retained visual assertions and distinct
independent whole-change review still require evidence.

禁止使用 `using-git-worktrees`，禁止创建 worktree、临时 clone 或复制仓库，
禁止为构建或测试创建隔离环境；在现有工作目录保留无关改动继续执行。
