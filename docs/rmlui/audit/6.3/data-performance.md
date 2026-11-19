# Native data binding scale measurements

> Local macOS arm64 evidence, captured 2026-11-16 at 04:24:20 UTC.
> The measured fixtures pass. These single-pass observations do not establish
> whole-project performance acceptance or platform coverage.

The fixture creates 1,000, 10,000 and 100,000 actual bound `i` elements using
Core's default `data-for` and attribute views. Each fixture has 100 native
float64 array roots, 100 section elements and 100 hidden structural templates.
Every generated row's attribute is checked outside the measured intervals.
Empty structural templates explicitly retain their empty RML attribute.

Host: Apple M4 Max, Darwin 25.6.0, arm64, Node.js v22.22.2, RmlUi 6.3.
Each size runs in a bounded child process using the existing package build and
dependencies. No separate installation, checkout or build environment is used.
The final measurements ran after builds, lint, naming and runtime checks exited.
All samples, counts and memory deltas are in [the CSV](data-performance.csv).

## Observed times

Times are milliseconds, rounded to three decimal places. Diagnostics are enabled.
Each row is one measured operation, with setup and correctness checks outside it.

| Operation | 1,000 rows | 10,000 rows | 100,000 rows |
| --- | ---: | ---: | ---: |
| Bind 100 native arrays | 0.233 | 0.721 | 5.339 |
| Map 100 shared numeric views | 0.101 | 0.118 | 0.124 |
| Create the bound DOM | 1.526 | 13.652 | 268.011 |
| Initial context update after show | 0.046 | 0.390 | 8.465 |
| Model update with no dirty roots | 0.011 | 0.016 | 0.051 |
| Dirty one root and update the model | 0.014 | 0.033 | 0.201 |
| Context update after sparse change | 0.018 | 0.344 | 4.785 |
| Dirty all roots and update the model | 0.212 | 1.997 | 18.781 |
| Context update after all-root change | 0.051 | 0.630 | 8.126 |
| Apply one scalar path patch | 0.021 | 0.026 | 0.051 |
| Grow one native array by one value | 0.012 | 0.013 | 0.017 |

The no-dirty fixture first changes all shared buffers without dirtying any root.
Its model update returns false, reads no checked scalars and leaves DOM values
unchanged. Dirtying one of the 100 roots changes exactly that root's rows:
10, 100 and 1,000 checked scalar reads respectively. Dirtying all roots reads
1,000, 10,000 and 100,000 values and updates every row.

## Native work and measurement scope

| Counter | Included work |
| --- | --- |
| Runtime entries | Accepted `RuntimeBoundary` entries; successful session controls excluded |
| Storage nodes | Actual `DataStorageNode` construction |
| Backing allocations and bytes | Successfully created numerical data backings and their requested byte lengths |
| Resize copies and bytes | Executed numeric-resize `memcpy` calls and the copied prefixes |
| Scalar reads | `CheckedDataScalar::Get` invocations |
| Scalar writes | Successful checked scalar/enum definition `Set` operations |
| Memory deltas | Process RSS and V8 heap snapshots around each operation |

Binding allocates 100 storage nodes and 100 data backings at every size, with
8,000, 80,000 and 800,000 requested backing bytes. It performs one scalar
conversion/write per input value. Mapping views enters native code 100 times
without allocating additional data backings or copying their contents.

No-dirty model update uses one native entry. Sparse and all-root operations use
two entries each: dirty notification and update. These intervals allocate no
data storage nodes/backings and execute no numeric resize copies. A scalar
patch uses one entry and one checked write. Growing one root uses one new
backing and one prefix copy: 80, 800 or 8,000 copied bytes respectively.
New backing lengths are 88, 808 and 8,008 bytes; old views remain readable.

The counters exclude RmlUi DOM/expression/string allocations and copies, other
V8/SFML allocations, unguarded independent value APIs, inferred scalar
definitions and literal-int reads. Direct JavaScript buffer writes bypass the
checked definitions. RSS/heap deltas are memory observations, not allocation
counts; GC may affect them. Zero values in this CSV apply only to their stated
counter scopes. DOM creation at 100,000 rows increases observed RSS by
300,695,552 bytes.

## Ownership scan correction

The initial 100,000-row attempt exposed repeated whole-wrapper scans during
attribute verification. A native stack sample located
`RefreshDataFactoryOwnership` and `RefreshTypedListenerOwnership` in ordinary
attribute-read boundaries. They walked every wrapped element even when no
matching callback owners existed.

Both now update only previous/current roots carrying their specific callback
edges. Strong local handles preserve those snapshots across V8 allocation;
weak root records do not retain nodes. The last removed root edge is cleared.
Expired element-cache cleanup follows the existing geometric threshold pattern,
and shutdown clears the cache and resets its threshold.

The new regression removes the final typed listener subtree while keeping its
former detached root reachable, then proves the callback can collect. Existing
data-factory, listener, lifetime, reentry and GC scenarios also pass. The complete
runtime suite exits zero: 67 files, 608 PASS, zero FAIL. Native build, package lint,
cpplint, changed-file format and six compilation-unit naming checks pass.
The site suite passes 81 tests, and 144 pages regenerate across four locales.
The distinct review phase was controller-owned.

## Reproduction and remaining acceptance

From the repository root after building the existing package:

```sh
node packages/sfml.js-rmlui/tools/measure-data.cjs
```

Optional positional sizes must be positive multiples of 100. The maintenance
tool outputs JSON and asserts actual DOM/state/copy behavior. Its diagnostic
entry points are internal to the addon and absent from public TypeScript APIs.
Normal package runtime tests exercise their count/reset semantics.

The broader A08 acceptance still requires repeated p50/p95 sampling, the direct
native versus JS compute comparison, glyph/mesh work and memory-retention
measurements. Whole-engine allocation/copy profiling, rendering at these sizes
and Linux/Windows execution are unverified. Full data declaration reconciliation
and the remaining completion plan continue separately.
