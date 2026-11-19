# Native abstract form-control acceptance

> Local macOS arm64 evidence for the native attribute-value specialization and
> one-time allocation hooks. Full Core/19, input/IME, global initialization,
> GPU and whole-plan acceptance remain open.

## Native contract

`ElementFormControl.createInstancer(valueAttribute = 'value')` allocates an
actual native subclass of the abstract `Rml::ElementFormControl`. The real
base constructor establishes native tab/focus behavior. `GetValue` converts
the configured attribute to an owned native string, defaulting to empty;
`SetValue` updates that attribute. Name, disabled presence/pseudo-class/focus
and default `IsSubmitted = true` remain native base behavior.

The attribute key must be a non-empty string without null characters.
There is no JS virtual-value callback. Native data-attr expressions can read
shared numerical data and update the same value without reverse JS calls.
JS subclass overrides do not implement native virtual overrides.
Direct abstract construction remains rejected.

Factory applies supplied attributes; direct `instanceElement` follows the
allocator contract and does not apply them. Actual native type determines
the wrapper, independent of the tag. Native form submission still searches
only input, textarea and select, omits disabled/unnamed controls, and joins
duplicate names with `, `.

## Allocation and ownership

The allocator owns its copied key. Allocation installs the existing relay
before Factory sets attributes or publishes the node. Direct control clones
allocate through the original native allocator and copy release-observer
leases without replaying JS allocation callbacks. A two-layer JS delegate
can subsequently change its selected allocator without changing that clone's
key or release chain.

This guarantee applies to a control's direct clone. Native ancestor cloning
serializes and reparses descendants through current Factory registrations.
Explicit release requires a detached owned node and the exact outer
instancer; GC/tree ownership retains the original concrete allocator.
Shutdown invalidates both allocators and element capabilities.

Direct instancer allocation, Factory element allocation and direct cloning
flush prior ownership changes before allocation, then publish only the new
subtree's edges. They do not trigger a sweep of existing wrapped elements.
This does not accept every other general wrapper or initialization path.

Native Element SetInstancer retains its first pointer. Native Context
SetInstancer asserts that its pointer is unset. The binding represents these
construction hooks through checked allocator/delegation APIs, preserving
original release provenance instead of replacing live pointers. The
idempotent pinned-source Factory patch checks `HasInstancerForBinding` before
setting a delegated context's already installed allocator; the original
Context setter and assertion remain intact.

## Runtime evidence

`test/form-control-instancer.test.cjs` passes ten bounded scenarios:
native RTTI/value/name/disabled/focus; configurable keys and direct attributes;
native form selection; shared data updates; crossing counters; allocation
and clone ownership scaling; nested release; changing nested allocation;
unregistered GC/tree transfers; bad options and restart.

The scalar shared-data update uses two runtime entries, zero reverse
callbacks and zero numeric backing allocations. Allocator creation, direct
allocation, two value operations and release use six entries, including the
new wrapper's native RTTI query, and zero reverse callbacks.

The ownership regression retains 1000 old animated wrappers, then allocates
100 nodes via each of the direct instancer, Factory and clone routes.
New wrapper work is bounded by four visits per new node and old Tween lease
visits are zero. The retained red log recorded 105250 wrapper visits for
100 direct allocations before the publication-path correction.

The actual compiled Context.cpp was temporarily compiled with NDEBUG removed
and RMLUI_DEBUG enabled in the existing package object/link tree. All 16
context-instancer and 21 construction-failure/recovery scenarios pass. The
original Release Context object is restored and relinked afterward.
No worktree, cloned/copied repository or isolated build/test environment is used.

## Initialization measurements

Apple M4 Max, 48 GiB, Darwin 25.6.0, Node.js 22.22.2. Twenty measured batches
per group, two untimed warmups per group, 80 timed batches and 44000 timed
new control allocations. Existing setup, forced GC, value verification,
release, layout, rendering and GPU time are outside the measured interval.

| Existing Tween leases | New controls | CPU p50/p95 ms | Runtime entries | Reverse callbacks | New wrapper visits | Median malloc calls / requested bytes |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 100 | 0.256 / 0.279 | 201 | 0 | 100 | 1144 / 335728 |
| 0 | 1000 | 2.124 / 2.318 | 2001 | 0 | 1000 | 11081 / 3387448 |
| 10000 | 100 | 0.290 / 0.319 | 201 | 0 | 100 | 1196 / 342576 |
| 10000 | 1000 | 2.283 / 3.671 | 2001 | 0 | 1000 | 11134 / 3364856 |

Every batch has zero old instance/lease visits, zero observer parent-node
visits, and zero geometry upload/draw calls. The interval measures explicit
per-element construction; it is not a batched frame or GPU measurement.
Main-thread malloc logging includes native/V8 wrapper costs, rather than
all worker-thread or system allocations.

Raw rows: [core-abstract-control-allocation.csv](./core-abstract-control-allocation.csv).
Final `npm test` passes lint, cpplint, native/TypeScript build, consumer types
and 85 unique runtime suite files: 791 PASS, zero FAIL. The three affected
native units pass formatting and compiler identifier naming. All 81 site
tests pass, including all four language comment contracts.

Independent follow-up source review found no further confirmed defects in
the three corrected paths. Twelve reviewed source hashes match current files.
The exact ledger promotes only the abstract base constructor/destructor and
Element/Context SetInstancer construction-hook equivalents, retaining 549
unique rows: 453 local, 18 partial, 78 pending. Data remains 131 local;
scope_complete remains false.

Source review, runtime/build/style logs and exact reconciliation are under
`/tmp/rmlui-63-completion`. The aborted early package run is not accepted
evidence. Actual TextInputHandler/TextInputContext customization, platform IME,
remaining global/dependent rows, Core19 and Tasks 5–10 still require closure.
