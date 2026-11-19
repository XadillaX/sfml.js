# Plugin local acceptance

This record covers the locally verified macOS arm64 `Rml::Plugin` boundary.
The full RmlUi 6.3 completion plan remains active.

## Upstream contracts and ownership

The Native adapter implements `GetEventClasses` and all eleven notifications
from `Include/RmlUi/Core/Plugin.h`. Optional functions are captured once into
an immutable Native callback table. Masks are validated as integers 0..15 and
captured once per registration; unregister does not reenter JS mask selection.
Default mask is All. A Native presence array makes missing hooks return before
any V8 handle scope or function-table lookup, including high-volume element
creation/destruction under an All subscription.

There is one upstream comment/implementation discrepancy: the Plugin header
describes document-open notification before file opening, but
`Context::LoadDocument(path)` opens its StreamFile before delegating to the
stream overload that notifies. Failed file opening emits no notice; memory
and stream loads notify before parsing. The adapter preserves actual Core
order, and an actual custom FileInterface/Plugin trace verifies all three
entry behaviors.

Registration before initialization retains the Native adapter and callbacks.
Late registration uses Core's initialization-before-insertion order regardless
of mask. Explicit unregister delivers shutdown for every mask when initialized.
Global shutdown delivers it only to Basic subscribers in reverse order, as
upstream specifies. Shutdown invalidates every adapter, including non-Basic
registrations and unregistered setup-time instances.

The pinned PluginRegistry patch preserves registration order. Notification
entry records its initial vector size, uses index access after callback return,
tombstones removed entries and compacts only after the outer notification.
This permits safe self-removal and removal of the next subscriber; newly added
registrations wait for the next notification. Membership removal is immediate.
Late initialization self-removal records cancellation, then removes Core's
new entry and delivers shutdown after the initialization callback returns.

Registration keeps a strong Native callback root. Retired owners survive the
entire outer Native operation so that an upstream notification never holds a
dangling pointer. The root becomes weak at the safe outer boundary; a private
V8 edge keeps captured functions reachable through a live facade. Unregistered
cycles collect, while registered functions survive collection of their facade.
There is no per-frame full Plugin ownership scan.

Each invoked notification creates independent scoped Context/Element handles.
Arguments refer to the live Native objects, including the base Element during
its destructor. Normal wrapper identity is not reused for these borrows.
Return invalidates the borrowed handles and zeros the independent dimensions
mirror; retained numeric views remain memory-safe. DataModel lookup uses the
canonical Native model state and still succeeds during pre-destruction notice;
ordinary Native removal invalidates the returned model.

Approved reads are context name/dimensions/model lookup, element id/tag and
attributes, and document title/source URL. Other DOM/runtime operations are
blocked. Registry edits are allowed in Plugin notices but not in parser,
instancer, effect, value, texture or text-input callbacks. Global shutdown
rejects new registrations. Notifications require undefined synchronous return.
The first exception is saved until the outer Native return while destruction
finishes. Rejected Promises are consumed and rejected as callback results.

## Verification

Eleven focused scenarios exercise mask capture, late/startup initialization,
global versus explicit shutdown, all eleven Native notices, scoped reads and
expiry, self-removal, traversal edits, exception-safe context destruction,
invalid masks/callbacks, async rejection, GC/cycles and visible static frames.
The static test now requires twenty actual draws across twenty frames and
zero host callbacks/uploads.

After the final Native missing-hook fast path, the full integration suite
reports 99 unique test files, 943 PASS and zero FAIL. Its last marker is
`PASS template-accessors-cannot-use-expired-receivers`. The final runtime log
was created after every relevant compiled Native, test and JS facade change.
Eleven focused cases pass against that Native artifact. A separate three-check
FileInterface/Plugin probe proves actual successful-file, failed-file and memory
entry notification order. One intervening full-suite command was intentionally
stopped to add the Native missing-hook fast path; it is not final evidence.

TypeScript compilation and consumer types pass, including nominal Plugin
typing that rejects plain objects. Thirteen touched Native files pass format.
Three compilation units pass naming with the compatible MacOSX15.4 SDK.
Seventeen site checks pass, including complete EN/ZH/JA/KO callable descriptions,
parameters and return contracts. Four guides and translated API navigation link
to the Plugin page. Final lint, consumer types and cpplint are verified
separately from performance measurement.

The executing controller reconciled the full Plugin header, Core initialization
and unregister order, Registry loops, Context creation/destruction and model
notifications, Element base destruction, Native state ownership, wrapper
accessors and public adapters. This is direct source review; it is not an
independent review or acceptance of document script hosts.

## Equal-pixel complete CPU frame measurement

Run from `packages/sfml.js-rmlui`:

```sh
node tools/measure-plugin-performance.cjs
```

Evidence: Apple M4 Max, Node v22.22.2, timestamp
`2026-11-16T21:59:26.030Z`. Four cases use the same 160×120 window and red 20×20
Native geometry. Each case has twenty warmup, eighty uninstrumented timing and
five diagnostic frames. Each complete CPU frame clears, flushes SFML commands,
updates, renders and displays. Setup, diagnostics and pixel capture are outside
timing. The red pixel is checked and all four full-image SHA256 hashes match:
`b60f44e4d77c0b83c8fc1125c4e8ae17ca60f5e6048965f467e0c1adf50bd9f8`.

| Plugins | Mask | CPU p50/p95 ms | JS→Native / Native→JS |
| ---: | ---: | ---: | ---: |
| 0 | 0 | 0.214000 / 0.338791 | 4 / 0 |
| 1 | Basic | 0.203708 / 0.248208 | 4 / 0 |
| 1 | All | 0.193958 / 0.237833 | 4 / 0 |
| 1,000 | All | 0.202042 / 0.241417 | 4 / 0 |

Actual Addon observation counts two RmlUi calls (`update`, `render`) and two
SFML `submitRenderWindow` entries. Every diagnostic frame reports one actual
draw, zero uploads, zero element ownership visits and zero callback snapshot
visits. No Plugin notification occurs in these static frames, even with one
thousand All subscriptions; this measurement does not time active notifications
or initialization.

Main-thread malloc tracking reports 56–60 allocations requesting 7,300–7,620
bytes per frame across the four cases; realloc counts are zero. These allocation
requests include the whole measured Native main-thread frame. Their individual
origin is not established, and the benchmark does not claim zero allocations.
Timing variation does not establish that subscribing improves speed.
GPU completion time, active notification cost, cold resources and platform
coverage are outside this measurement. Detailed values are in the
[CSV](core-plugin-performance.csv); raw timings and every counted sample remain
in `/tmp/rmlui-63-completion/plugin-frame-performance-3.json`.

The first failed benchmark had no visible geometry because default inline
layout did not use the requested box dimensions. The next pixel check caught
unflushed SFML clear commands. Both setup issues were corrected with explicit
block layout and the documented SFML flush before Native rendering. Only the
third, passing result is used as performance evidence.

## Remaining completion scope

Promotion is limited to the exact Core Plugin declaration and two global
registry functions. Core 549 = 472 locally verified, seventeen partial and sixty
pending. Supplemental 1547 remains 1528 local, eighteen partial and one opaque.
Other pending/partial declarations,
actual Node/Lua document hosts, native Debugger/SVG/Lottie/HarfBuzz/bitmap
integration, GPU/platform IME, twenty applications/113 visuals, rendered
four-language pages, editor/package/CI and independent final review remain open.
The original plan's `scope_complete` remains false.
