# Core Context construction and incremental callback leases

> Context construction, four generalized callback lease families and the
> bounded CPU initialization probe have local acceptance. The complete package
> passes 84 runtime files with 781 PASS and zero FAIL. Full Core remains open.

## Exact Context operations

| Original declaration | Original line | Consumer representation |
| --- | --- | --- |
| `Context(const String&, RenderManager*, TextInputHandler*)` | 34 | `new Context(name, manager, handler)` |
| `~Context()` | 36 | Owned `context.remove()` and native GC/shutdown destruction |
| `GetTextInputHandler() const` | 248 | `context.getTextInputHandler()` |

These are the original inventory locations in `Core/Context.h`, before binding
patches. No dependent class, text-handler customization or SetInstancer record
is promoted by this table.

Direct construction invokes actual NativeContextInstancer allocation through
one callback-free cached allocator. It does not select the registered Factory
adapter, add a Core context entry or issue a plugin creation notification.
It preserves native zero dimensions and density 1. An explicit null text-input
handler remains null; the getter returns the exact checked borrowed capability.
Set dimensions before layout.

ContextOwnership retains ContextPtr and its native manager. Actual destruction
releases documents before invalidating context tokens and their dimensions.
Same-name registered contexts remain untouched. Constructor allocator teardown
follows context and upstream Factory teardown. Restart cannot revive prior
context, manager or handler capabilities.

Context roots have an indexed weak token lookup. Saved root pointers are
equality keys only and are erased on invalidation; no post-destruction
dereference or whole-context enumeration is needed to resolve ownership.

## Incremental callback leases

Native Element parent changes notify only their affected subtree. Each lease
has an indexed native observer, maintained by Add, Bind, Detach and retirement.
Native destruction notifies the current element and removes its index entry
before address reuse. Notices do not allocate V8 objects or execute JavaScript.

Transfer promotes existing weak callback handles until the next safe boundary.
The boundary resolves only pending leases and retired slots, updates private
owner-array entries, then weakens records after all replacement edges exist.
GC notices during V8 allocations remain queued for the next pass.
Owned Context publication and delegation notify that Context's own root.

The generalized families are Tween, Filter, Decorator and ElementInstancer.
With existing live leases, constructing 100 unrelated native text inputs
records zero old-lease visits and zero ownership notifications. A single
animated node detach and reattach each records one Tween lease visit.
The observer's node-visit counter includes only the changed subtree.

Other ownership mechanisms, including font effects, typed listeners,
data-factory instances and arbitrary wrapper refresh, retain separate gates.
This document does not establish their general initialization complexity.

## Focused evidence

Context passes sixteen cases, including direct construction/defaults,
exact handler identity, same-name registry preservation, nested custom
allocation, checked invalid arguments/restart, one-entry construction/release,
owned-context closure collection and retained native manager resources.
Context construction failure matrices retain disabled, declined, throwing and
wrong-subtype instancer cases.

Callback ownership passes fourteen families. Existing Filter, Tween and
ElementInstancer tests retain detached reparenting, shared callbacks, closure
cycles, release ordering and error/reentry coverage.
Ordinary direct Context construction and remove each use one native entry
and zero registered reverse callbacks.

Nine touched native files pass formatting. Compiler-backed naming and all
81 site tests pass; four-language TSDoc and resource guides describe the direct
constructor and borrowed handler getter.

The separate controller source review is
`/tmp/rmlui-63-completion/context-lease-source-review.md`.
Focused logs use `context-lease-runtime.log`, `lease-parent-focus.log`,
`lease-parent-filter.log`, `lease-parent-animation.log` and
`lease-parent-elements.log`. The first direct constructor red and the
100,000-visit unrelated-widget lease red are retained. An aborted full-package
run is retained separately and is not acceptance evidence.

Final `npm test` exits zero: lint, cpplint, native/TypeScript builds, consumer
types and all 84 unique runtime suite files pass, with 781 PASS and zero FAIL.
Final validation uses `context-lease-final-package.log`,
`context-lease-final-format.log`, `context-lease-final-naming.log` and
`context-lease-transfer-naming.log`.

## Bounded CPU initialization measurements

Apple M4 Max, 48 GiB RAM, macOS 26.6.2, Node.js 22.22.2. Four workloads have
80 measured batches each, totaling 320 batches and 176,000 new text inputs.
Each batch constructs detached native text inputs with copied id/value
attributes and completes the normal safe-boundary ownership updates.
Existing attached elements have live native Tween callback leases.

| Existing leases | New inputs | CPU p50 (ms) | CPU p95 (ms) | malloc p50 | Requested bytes p50 |
| --- | --- | --- | --- | --- | --- |
| 1,000 | 100 | 0.372 | 0.516 | 2,901 | 588,840 |
| 1,000 | 1,000 | 3.991 | 5.792 | 29,008 | 5,871,920 |
| 10,000 | 100 | 0.370 | 0.423 | 2,901 | 588,840 |
| 10,000 | 1,000 | 3.991 | 6.001 | 29,008 | 5,871,920 |

Every batch records exactly two entries per new input, zero registered reverse
callbacks, zero old Tween lease visits and zero ownership notifications.
Wrapper ownership visits are four per input, and native parent observer
visits are three per input. These counts include actual internal text-widget
children. The measured allocation count concerns the main thread; requested
bytes are allocation requests, not peak resident memory.

The CPU interval excludes existing-document setup, layout/update/render,
destruction and GPU execution. Malloc tracking remains active throughout the
measured constructor interval; no warmup samples are discarded.
These measurements establish bounded new-input construction with existing
Tween leases, not every application's complete initialization cost.
Raw measured batches are
[core-context-lease-initialization.csv](core-context-lease-initialization.csv).
The executable probe and full counter snapshots remain in the task temporary
directory as `context-lease-initialization.cjs` and
`context-lease-initialization.json`.

The exact ledger promotes only the three Context operations above: 549 unique
Core records retain 449 local, 18 partial and 82 pending. Data retains 131 local
records; scope_complete remains false. Source hashes preserve the reviewed
Context constructor and current Element ownership-hook implementation.

Full nineteen-group Core acceptance, abstract-control customization,
ScriptInterface/value templates, global interfaces and Tasks 5–10 remain open.
No staging, commit, push, publication or whole-project completion is established.
