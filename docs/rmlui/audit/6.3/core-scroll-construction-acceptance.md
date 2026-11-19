# Native scrollbar construction and lifetime acceptance

> The public `ElementScroll(Element*)` constructor now has an actual owned
> native equivalent. Eleven lifecycle scenarios pass locally on macOS arm64.
> Full-package and site verification are recorded separately below.

`new ElementScroll(element)` allocates a distinct native component. The
element's existing `getElementScroll()` view remains canonical and borrowed.
All eight methods invoke the original RmlUi algorithms. Orientation values,
finite nonnegative width validation, missing bars, disabled sizes, visibility,
formatting and positions retain their native contracts.

The component owns its `WidgetScroll` listeners. The existing indexed element
destruction notice resets them before native children are destroyed. The notice
does not invoke JavaScript or allocate V8 objects; clearing host edges is queued
until the outer native boundary. Explicit release also clears those edges.
Retained invalid facades no longer root destroyed hosts after document
destruction or shutdown.

GC queues native cleanup rather than destroying a widget on the V8 GC stack.
The next outer native boundary drains that queue. A visible private host edge
retains detached element ownership and callbacks while the component is live,
without creating a strong native V8 root. Released components leave their
host-owned non-DOM children intact, matching the upstream destructor. Releasing
borrowed components or a widget during its active event callback is rejected.

The regressions exercise distinct independent components on the same host,
actual native arrow input before and after listener release, native document
destruction, detached-host GC retention, component GC, active-callback release,
old generations, failed scrollbar instancing and invalid inputs. Separate
regressions reproduce and verify host-root cleanup on document destruction and
shutdown. Native input tests explicitly select block layout, scrollable
overflow and instant default scrolling to preserve the real upstream behavior.

One hundred unchanged queries with 1,000 existing components record 100 native
entries, zero callbacks, zero element ownership visits and zero parent
notifications. Registry sweeping occurs only at geometric allocation thresholds;
frame boundaries drain changed or retired instances rather than scanning peers.

Evidence is under `/tmp/rmlui-63-completion/owned-scroll-*`. The original
missing-constructor run and both retained-root failures are preserved. The
focused final run and existing component suite pass. Native builds, consumer
types, ESLint, cpplint and formatting pass. Compiler-backed naming passes both
changed compilation units with the installed macOS 15.4 SDK. The first naming
attempt failed because its selected SDK lacked the C++ library; the corrected
command uses the existing SDK without creating an environment.

The four-language site build exits zero: 152 localized pages, 1,587 API pages
per language, 303 redirects and all local links/assets validate. All four
source-comment contract checks pass. Five existing RmlUi source-type warning
categories remain explicit documentation work. Full `npm test` exits zero:
104 actual runtime suite files, 1,027 PASS and zero FAIL. The current scrollbar
and runtime objects were compiled after their source timestamps. Source hashes
and completed logs are recorded in the ledger. Source review was performed by
the implementing controller and is not independent acceptance.
The exact [28-row dependent mapping](core-scroll-iterator-declaration-map.json)
contains all 16 scrollbar and 12 iterator declarations. Three iterator
constructor/move declarations retain explicit transfer follow-up. Original
primary ledger statuses are unchanged. Full Core 19, Lua, optional modules,
applications, platform/GPU, package/CI and independent acceptance remain active.
