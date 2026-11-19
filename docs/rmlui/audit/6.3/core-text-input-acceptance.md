# Native text-input contracts

> Fourteen real-widget scenarios, eight startup scenarios and 120 timed CPU
> frames pass locally on macOS arm64. Native input contracts include
> pre-initialization setup. OS IME and whole-plan gates remain open.

## Native representation

`TextInputHandler` owns a native adapter or wraps the exact borrowed upstream
handler. Canonical identities use pointer-keyed weak registries. Global
selections retain all installed handlers through shutdown. Contexts retain
their original selection, including before the first widget activation.

Handler construction and Core global selection work before initialization.
Creating a handler claims the Node setup environment before storing persistent
V8 state. Pending handlers target the next successful generation and are
adopted by initialization. Rejected initialization arguments preserve the
selection. Setup-only shutdown clears the upstream borrowed pointer before
releasing all installed and uninstalled handlers; it does not call upstream
Shutdown. Node cleanup releases setup state without JS callbacks and permits
another environment to become the owner. Foreign workers reject setup access.
A null selection before initialization chooses the default on initialization;
a null selection afterward disables the global selection for new contexts.

The pinned widget constructor records a native `TextInputContext` and a
captured-handler lease. Destruction calls the original native virtual, then
invalidates the input and retires its lease. Only the affected native leases
are queued. Context and widget callback edges use the existing incremental
owner mechanism: registered trees have Native roots, while owned and detached
trees have V8-visible edges. An input capability keeps a live detached owner
reachable; an invalidated capability releases that edge at the safe boundary.

With no callbacks, events stay in a Native journal. `drainEvents()` enters the
addon once, maps a Native-owned numeric snapshot, and returns canonical input
capabilities. No numeric event plane is copied into V8 storage. Snapshot
construction and JS capability/array allocation are still real costs.
Consumers must drain notification history to release that storage.

Explicit activate/deactivate callbacks preserve synchronous native ordering
and may use only the checked input methods. Destroy callbacks run after
invalidation at a safe boundary. This deliberately loses live access inside
the native `OnDestroy` virtual: the destroyed capability already rejects reads
and edits. Explicit shutdown drains these notices after all widgets are gone,
before releasing handler bindings. Native environment cleanup invokes no JS.

The seven `TextInputContext` methods run the actual upstream implementation.
Ranges use nonnegative int32 Unicode code points, ordered start/end and an
exclusive end. Blur preserves lifetime; input type replacement invalidates the
old widget identity. Failed transformed-element projection returns null.
`SetText` bypasses maxlength. `CommitComposition` applies it to the replacement
range and remaining text; [0, 0] performs no replacement.

The original 6.3 composition formula failed a real maxlength probe:
replacing `B` in `AB` with `XYZ`, maxlength 3, produced `AXYZ`.
The persistent dependency patch subtracts `end - start`, derives the available
composition length from the remaining text and clamps it to zero. The native
Unicode and maxlength regression now produces `AXY` and `A界B`.

## Real-widget coverage

The checked-in `test/text-input.test.cjs` covers:

- Lifecycle order, borrowed/global/per-context selection and canonical identity.
- Unicode selection, cursor, direct replacement and composition commit.
- Native maxlength restrictions and direct replacement bypass.
- Explicit synchronous callbacks, guarded reentry and callback exceptions.
- Handler replacement, type replacement, runtime restart and invalid handles.
- Owned-context closure-cycle collection and registered owner retention.
- Widget transfer: activation follows the new context; destruction follows the
  handler captured when the widget was created.
- Successful bounds and failed transformed-detached projection.
- Explicit shutdown destroy notification and natural Node environment cleanup.
- Measured default-journal entry counts and unchanged ownership gates.

Consumer type tests cover input capabilities, nullable callbacks, native
handler selection, range/text signatures and forbidden direct construction.
The final full `npm test` exits zero: 87 unique runtime files, 813 PASS,
zero FAIL, with lint, cpplint, Native build, TypeScript and consumer types
passing. All 81 site tests pass, including the four localized API contracts.
Localized controls guides describe batching, lifetime and callback restrictions.

`test/text-input-startup.test.cjs` verifies pending callback retention through
GC, pre-init getter/setter/default selection, shutdown without initialization,
rejected initialization arguments, reinitialization, stale handler aliases,
foreign-worker rejection and actual worker exit followed by owner acquisition.
All eight cases failed before implementation and pass after the change.

## CPU-frame measurements

Apple M4 Max, Node.js v22.22.2, darwin 25.6.0. Each group has two warmup frames
and 20 timed frames, with 100 alternating blur/focus notifications per frame.
Every frame drains the journal, updates and renders the context. Existing
inputs are hidden but their wrappers remain reachable. Setup, font loading,
GC, validation, teardown, SFML display and GPU completion are outside timing.
Main-thread malloc accounting uses the existing opt-in Native diagnostics.

| Existing hidden inputs | Mode | CPU p50 / p95 (ms) | Drain p50 (ms) | JS → Native / Native → JS | Median malloc / requested B |
| --- | --- | --- | --- | --- | --- |
| 0 | Journal | 0.146 / 0.207 | 0.029 | 103 / 0 | 1038 / 33176 |
| 0 | Explicit callbacks | 0.188 / 0.224 | 0.020 | 103 / 100 | 1039 / 33304 |
| 1000 | Journal | 0.452 / 0.542 | 0.028 | 103 / 0 | 1040 / 33528 |
| 1000 | Explicit callbacks | 0.425 / 0.550 | 0.017 | 103 / 100 | 1039 / 33304 |
| 10000 | Journal | 3.179 / 3.588 | 0.032 | 103 / 0 | 1039 / 33304 |
| 10000 | Explicit callbacks | 3.535 / 3.674 | 0.020 | 103 / 100 | 1038 / 33176 |

All 120 frames have zero input ownership passes/lease visits, zero existing
wrapper/data-owner visits, zero VBO upload bytes and two geometry draws.
The 103 forward entries are 100 explicit host blur/focus actions plus one
drain, one update and one render. Notification drain itself is one entry.
Native context update/render still traverse their normal scene structures;
these timings do not establish constant total frame cost with scene size.
Modes have the same visible text, event count and canonical input identities.

[Raw per-frame CSV](core-text-input-performance.csv) preserves counts and
timings. The temporary measurement script and full Native diagnostic JSON
remain under `/tmp/rmlui-63-completion`, not in the source tree.

## Open acceptance

Platform candidate windows, SFML IME integration and non-macOS behavior have
not been verified. Independent follow-up confirms the shutdown finding is
resolved, with no further confirmed defects in its requested scope. The new
startup change has a separate controller source-review phase; it is not a
fresh-agent review. Full package and site acceptance runs exit zero. An
interrupted build is not counted as passing evidence; its resumed build and
the later complete npm test pass.

Exact accounting promotes five original rows: the two TextInputHandler
dependency declarations, Core getter/setter and the full CreateContext
render-interface/text-input-handler contract. Fifteen supplemental compiler
declarations retain the complete TextInputContext and TextInputHandler headers,
including all seven input methods, three lifecycle virtuals, class and
destructor declarations. Safe JS destruction notifications are deferred;
the original Native OnDestroy executes before invalidation.

The authoritative Core ledger retains 549 unique rows, 458 local, 17 partial
and 74 pending. Supplemental values retain 1474 unique rows, 1463 local,
ten partial and one reviewed opaque forward declaration. Data remains
131 local. Full Core/19 and whole-plan acceptance stay false.
