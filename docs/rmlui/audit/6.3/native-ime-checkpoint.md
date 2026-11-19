# Native IME implementation checkpoint

> **The desktop input-method item is closed by user acceptance.** [The desktop record](desktop-ime-acceptance.md) preserves actual macOS preedit, Chinese commit, cancellation, caret-coordinate observations, and English-only repeat failures. The user waived further desktop checks; reliable repeats, hardware input, and the candidate panel remain unverified. The native fixture passes 73 contracts. Linux/Windows execution remains unverified. The counts and fingerprints below are historical checkpoints.

Window key-focus recovery now queues the native input-context activation at the
runtime boundary. A session retired before drain drops that activation.
The lifecycle fixture preserves the native `activate` implementation and
verifies both cases. These are synthetic Cocoa notification observations.
The early unfocused Sogou attempt did not establish engine behavior.
The later foreground application received real system preedit and one Chinese
commit. Other focused repeats produced unmarked English text with Sogou selected.
The native `NSTextView` control also has both Chinese and English observations.
[The desktop record](desktop-ime-attempt.json) keeps these results separate from
reliable acceptance, source restoration, and the remaining visual/hardware gates.

The current XIM widget fixture uses real installed Xlib declarations and
production state on this host. Cleaning Xlib's `True`, `False` and `Status`
macros fixes a reproduced V8/NAN compilation failure. This checks header
compatibility, not Linux linking or an input method engine.

A native event queue under `sfml.js-interop/include/platform/x11/` passes five
ordering/lifetime contracts and memory sanitizers. It remains unconnected to
the SFML pump and RmlUi runtime. Same-pump replacement followed by a line query
therefore retains its explicit unsupported-layout result.

## Implementation and ownership

The implementation is organized under `native/platform/ime/`. Unicode range conversion, widget editing transactions, caret geometry, the per-window registry, Cocoa events, Cocoa focus lifecycle, Cocoa editing, owned Cocoa snapshots and Cocoa commands have separate responsibilities. The dependency corrections for rejected text replacement and render-time caret notification live in `tools/dependencies/patches/patch-rmlui-text-input.cjs` and are included in the package file inventory. Native fixtures live under `test/native/platform/ime/{common,layout,macos,windows,x11}`. Caret fixtures live in `ime/layout/caret-contracts.cc`.

Each window adapter retains its actual SFML Cocoa view and restores the original next responder on deactivation. Cocoa callbacks retain copied text and queued actions. Native widget edits run when `Context.update()` or `Context.processEvent()` drains the queue inside the runtime boundary. Widget observers and destruction/focus hooks invalidate late edits. Callback continuation checks stop input method interpretation and subsequent actions when a host callback fails.

The adapter uses the pinned SFML keyboard conversion selector and validates the native key-repeat ivar before reading it. It neither writes that setting nor swizzles the SFML class. UTF-16 ranges expand incomplete surrogate slices to whole characters. Caret geometry projects the actual widget caret through RmlUi's accumulated ancestor transform, including homogeneous perspective division. Rendering refreshes the rectangle after transform changes, independently of key events. Cocoa converts the complete rectangle from backing pixels to view points and then window/screen coordinates. Invalid or behind-camera rectangles produce no candidate bounds.

The window registry accepts caret updates only from its active editing session. Full-addon integration verifies that rendering, transforming or removing another context does not move the active candidate rectangle. Removing the guard makes that test fail; restoring it passes. Queued-key duplicate ownership is assigned when the key is replayed, allowing earlier queued keys to change the active context.

The integration fixture retains actual Cocoa clients through the full binding. Destroying the widget rejects queued edits, and restarting the runtime on the same window rejects edits from the old client. The test-only addon and clipboard restoration source live under `test/native/platform/macos/`; their builders remain at the platform entry point. Binaries remain in the existing system temporary directory.

The SFML Cocoa delivery scope captures an opaque source and stores it on each actual queued key/text entry. Polling transfers that source to a private owner on the native JavaScript event snapshot. Constructing another public `Event`, spreading its data or serializing it does not copy the source. A changed key/text payload no longer matches its original source. Shared ownership follows queued entries and live JS snapshots; garbage collection and window destruction release discarded sources. The host receives its SFML key events. Text keys explicitly claimed by the native input client bypass the hidden SFML interpreter; ordinary fallback and explicitly submitted text events remain independent.

The extension is reproducible through `sfml.js-interop/tools/patches/sfml-event-source.patch`, `sfml-native-input.patch`, and `sfml-macos-text-owner.patch`, applied by `tools/sfml/prepare-source.cjs` in the existing SFML source/build cache. The shared opaque source header is `window-event-source.h`. Public SFML event and window layouts remain unchanged; the private window queue is rebuilt with the Window library.

## Reproduced defects and verified fixes

| Trigger | Corrected behavior | Retained reproduction |
|---|---|---|
| Native preedit reaches a disabled control | Both preedit and commit reject the edit; cancellation restores an existing composition | `ime-disabled-red.log` |
| Empty composition commit replaces a selection | Restore the committed selection, then let the native delete path emit one `change` | `ime-empty-commit-red.log` |
| Sanitization or maxlength rejects all replacement text | The widget still reports the selection deletion and updates layout | `ime-rejected-commit-red.log` |
| Key callback stops the runtime continuation | Abort Cocoa interpretation and fallback key dispatch before any further edit | `ime-callback-stop-focus-red.log` |
| Queued keys switch between contexts sharing a window | Duplicate text belongs to the context that actually replays the key | `ime-shared-context-red.log` |
| Ancestors translate and scale the actual widget caret | Project all caret corners through the accumulated native transform | `ime-caret-transforms-red.log` |
| A transform changes without another key event | Render-time notification refreshes the rotated candidate rectangle | `ime-caret-render-refresh-red.log` |
| A native key is polled and discarded before an equal synthetic key | Correlate the actual queue entry and native JS snapshot; the independent key remains valid | `ime-provenance-red.log` |
| Session or initial widget snapshot allocation fails during focus switching | Construct the session and its snapshot before deactivating the previous input | `ime-focus-allocation-red.log` |
| Cocoa UTF-16 snapshot allocation fails during focus switching | Prepare owned text and all ranges before replacing the active session and registry entry | `ime-focus-allocation-third-red.log` |
| Reading the long previous widget fails during cancellation | Restore the prior accepting state, responder and queryable snapshot before propagating failure | `ime-focus-long-cancellation-red.log` |
| Cocoa deactivation throws during registered focus replacement | Restore the prior session and snapshot; keep its composition available for a later commit | `ime-focus-cocoa-exception-protocol-red.log` |

The reproduction logs are retained in `/tmp/rmlui-63-completion/`. The [fingerprinted evidence](native-ime-checkpoint.json) records current sources, binaries, final validation logs and observed scenario counts. The patch installer passed two consecutive idempotence checks.

The system-interface tests now run inside a native wrapper that saves every pasteboard item and data representation in memory. Restoration verifies item counts, type sets and bytes; no clipboard contents are written to disk or printed.

## Verification

The current focused result is 109 PASS: 41 native/Cocoa, 14 text-input, 13 input, 16 listener, 14 system-interface and 11 full-addon integration scenarios. Native format, fixture format/cpplint, package cpplint, seven compilation-unit naming checks with installed LLVM 18, package lint, TypeScript build/types and four-language source-comment checks passed. The build reused the existing tree with `make -j4 -C build`. The geometry cases verify nested translation/scale, rotation after a render-only update, perspective division and a behind-camera caret. Cocoa cases verify both surface densities, projected width and invalid bounds.

The retained event-provenance reproduction failed before the correction: polling and discarding Cocoa `A`, then submitting an equal synthetic key, produced one `keydown` instead of two. The permanent integration scenario now verifies two. Further scenarios verify events queued before focus, native event copies, payload mutation, text submitted without its key, `waitEvent`, source garbage collection and release of unpolled sources on window close. A one-shot exception injected into the actual Cocoa input context also verifies that the runtime reports the error and restores deferred editing before the next input.

Fault injection into the real platform focus function covers three allocations with a short previous widget and six with a long previous widget. Each failure preserves the active responder and its queryable Cocoa text. The Cocoa UTF-16 snapshot now owns its temporary NSString under RAII, prepares every range before publication and releases that storage on a C++ exception. The window registry publishes the new session only after activation succeeds. The standalone fixture supplies only the context-to-window registry and rejects any V8-handle operation.

The core window event and lifecycle suites pass all 35 tests, including all 23 event subtype payloads and vector conversions. Retina capture and mouse checks pass at both surface densities. The root LSP database now recursively includes Objective-C++ sources after subsystem directory organization. Before the focus-unit split, whole native naming passed all 234 compilation units using LLVM 18 with its matching standard/builtin headers and the current macOS SDK. The current focused naming result covers all seven IME units; the evidence retains the earlier whole-run wrapper and command separately.

The physical acceptance harness opened a real SFML window and reported backing dimensions of 1800 × 1300. The desktop tool returned no screenshot, a native window capture failed, and the full-screen capture was black. These observations establish neither displayed candidates nor positioning. No keyboard/input-method action was attempted, the selected ABC input source was retained, and the task-owned window was closed.

The separate Cocoa focus fixture injects one-shot `activate`, `deactivate` and `discardMarkedText` exceptions into an actual input-context instance. Five switch/blur scenarios retain the old responder, actual widget preedit, queryable Cocoa text and marked range, then successfully commit Chinese text. The key-window branch is explicitly forced on that fixture instance because a CLI window has no desktop focus guarantee; these are synthetic API observations. Cocoa operations precede native composition cancellation, and publication or retirement of pending events waits for success. Objective-C `@finally` restores state on both Cocoa exceptions and C++ allocation failures.

The focus transaction revision's full runtime completed with 1,479 passes across 142 files and zero failures. The JSON retains its log, source and binary fingerprints separately from the previous 1,474-pass revision. This completed run precedes the new official animation and benchmark application suites; those additions still require their own integration validation. The historical renderer resource and CSS checkpoints retain their original fingerprints and are not rewritten.

## Remaining acceptance

- Verify hardware keyboard input and the displayed macOS candidate panel. Real system preedit, commit, cancellation, and rollback are covered by the desktop record.
- Verify the displayed candidate placement after transforms and scrolling. The desktop record verifies the coordinates supplied to the system.
- Verify allocation and native lifecycle boundaries beyond prepared Cocoa snapshots, long previous-widget cancellation and the injected Cocoa interpretation exception.
- Compile and execute the Windows IMM32 and X11 adapters on their target platforms. The current factories are connected, but cross-platform native IME is not accepted.
- Complete the distinct renderer review, all 20 official applications, 113 VisualTests pages, editor/site/package/CI checks and final independent acceptance.
