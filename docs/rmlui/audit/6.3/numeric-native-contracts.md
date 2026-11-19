# Native numeric support contracts

> Native numeric support is locally verified on macOS arm64. All 459 original
> numeric declaration records have exact indexed mappings and reviewed
> relationships to six existing JS consumer suites. Full Core, platform and
> whole-project acceptance remain incomplete.

The native probes produce 21 literal PASS lines: 15 runtime groups, one supported
compilation control and five deliberately unsupported compilation checks.
The complete package exits zero with 109 runtime files, 1,099 PASS and zero
FAIL. It has one compiler warning in the default clipboard adapter; this is an
open follow-up, not zero-warning package acceptance.

The [exact declaration map](numeric-declaration-map.json) distinguishes
instantiated types, fields, operations and compile-time domain rejections.
[Fingerprinted evidence](numeric-native-evidence.json) records source files,
complete logs, current consumer cases and the open clipboard warning.

## Verified native domains

| Domain | Executed contracts |
| --- | --- |
| Matrix storage | Row-major and column-major construction, raw layout, row/column setters, zero initialization, identity, diagonal matrices, const/mutable indexing, transposed alias view, packed/strided proxies and const conversions |
| Matrix operations | All four storage multiplication combinations, vector multiplication, scalar division, cross-storage assignment/addition/subtraction/comparison and in-place transposed aliases |
| Matrix transforms | Translation, scaling, independently checked axis rotations, normalized rotation axis, skew, orthographic/perspective projections, Compose with translation/scale/skew and nonidentity quaternion/perspective, inversion and singular destination preservation |
| Vectors | Float and integer Vector2/3/4 arithmetic, dot products, contiguous component pointers, float normalization and near-zero preservation, rounding, cross products and dimension/type conversions |
| Colours | Byte wrap and truncation, float channel arithmetic, contiguous channels, premultiplied conversions, opacity, zero-alpha handling and rounded interpolation |
| Rectangles | Integer/float corners, inclusive containment, strict intersection, touching edges, invalid rectangles, extension, translation, join and casts |
| Math | Scalar/vector min/max/clamp, interpolation, angle functions, rounding, fractional decomposition, hexadecimal conversion, powers of two and pixel-grid overloads |
| Random values | Actual native Math code with controlled C rand output at zero, intermediate values and RAND_MAX; strict positive floating upper bounds, integer modulo, booleans and zero scale |

The probes instantiate the native float matrix strategies, six float/integer
vector types, byte/float colours and integer/float rectangles. They do not
establish arbitrary custom component types or another platform's ABI.
Native RandomInteger requires a positive modulus. RandomReal's strict upper
bound tests use positive finite maxima; zero scale retains its zero result.

The compilation checks preserve rejection of integer Vector2/3/4 normalization,
float-colour premultiplication and direct byte-colour Lerp. The complete log
contains five expected compiler errors followed by their validated PASS lines.
These are separate from runtime failures.

## Maintained corrections

The original-source probes reproduced incorrect scalar division, cross-storage
comparison, row-major Compose and unusable cross-storage assignment/arithmetic.
The permanent regressions exposed the additional alias hazard in assigning or
adding/subtracting a matrix's own transposed view.

[The versioned numeric patch](../../../../packages/sfml.js-rmlui/tools/patch-rmlui-numeric.cjs)
corrects those operations and StrideVector's const conversion without changing
matrix component layout. Cross-storage alias operations take a 64-byte stack
snapshot only when both operands refer to the same matrix. Matrix multiplication
continues to compute its complete result before assignment. Compose uses native
column access for either underlying storage strategy.

RandomReal clamps a rounded endpoint to the next representable float toward
zero. The independent endpoint probe executes the actual compiled Math object;
it replaces only the C random generator's output, with no RmlUi lifecycle stubs.

The complete vendor patcher accepts all 19 exact numeric edits and preserves
contents and timestamps on two repeated applications. Reversing the edits
in memory reproduces Matrix4.h's original inventory fingerprint. The inventory
does not contain standalone fingerprints for Matrix4.inl or Math.cpp.
The new patch module is included in the package file list.

Native owns and executes these operations. Existing JS consumers use checked
vector/colour snapshots, fixed column-major Float32Array matrices, native
TransformState values and bulk ElementTransformBuffer storage. No per-element
JS numerical interface was added.

The consuming suites are element-components, render-state, transform, geometry,
decoration-values and variant-template-destinations. Actual rendered pixels,
matrix-buffer rejection, byte-colour premultiplication and snapshot lifetimes
are checked. The 1k/10k/100k TransformBuffer refresh tests use one Native entry,
zero callbacks, zero ownership visits and zero new buffer allocations.
Their explicit matrix copies remain measured; they are not described as zero.

The original parser omitted several conversion operators and private multiplier
specializations. Actual vector multiplication executes VectorMultiplier for
both storage strategies; four matrix storage pairs execute the three applicable
MatrixMultiplier specializations. The private generic MatrixMultiplier vector
Multiply declaration has no definition or public route. This source-only
finding adds no invented original declaration.

## Reproduction and evidence

Use the existing package build and an existing temporary output directory:

```sh
python3 packages/sfml.js-rmlui/test/native/build-numeric-contracts.py \
  /tmp/rmlui-63-completion
```

The maintained runner enables assertions and reuses existing native objects.
It creates only probe executables in the temporary directory, without a
worktree, cloned repository, new dependency tree or isolated runtime.

| Evidence file in /tmp/rmlui-63-completion | Observed result |
| --- | --- |
| numeric-matrix-contract-red-1.log | Thirteen compiler diagnostics from original cross-storage operations |
| numeric-upstream-anomalies-2.log | Original division, row comparison and row Compose discrepancies |
| numeric-matrix-alias-red-1.log | Failing in-place transpose assertion |
| numeric-random-native-red-1.log | Failing strict floating upper-bound assertion |
| numeric-permanent-runner-3.log | All 15 runtime groups and six compiler checks pass, including independent nonidentity Compose values |
| numeric-patch-integrity-4.log | Original header fingerprint, 19 exact edits, idempotence/timestamps and package inclusion pass |
| numeric-patch-lint-2.log | Numeric and parent patch modules pass ESLint |
| numeric-native-format-5.log | Final four native fixtures pass clang-format |
| numeric-native-style-7.log | Final four native fixtures pass cpplint |
| numeric-native-naming-4.log | Four fixture compilation units pass identifier naming |
| numeric-template-package-3.log | Complete package exits zero: 109 files, 1,099 PASS, zero FAIL; one default-clipboard compiler warning remains open |

The package runs recorded in numeric-template-package-1.log and
numeric-template-package-2.log were stopped for subsequent source corrections.
Neither is passing package acceptance.

All 459 exact numeric records match the fingerprinted original inventory.
Ten-map reconciliation represents 3,318 of the 3,926 original records and leaves
608 unrepresented. These are mapping counts, not operation pass counts.
The independent verifier checks all ten inputs, six actual consuming suites,
source/log hashes, report links and unchanged Core/Supplemental categories.

The complete package warning comes from system-interface-sfml.cc:82, where
GetClipboardText implicitly converts sf::String to std::string. Current Unicode
clipboard tests use custom callbacks and do not verify this default path.
Native default clipboard UTF-8 behavior, the remaining declarations, Lua,
Core nineteen groups and whole-plan acceptance remain open.
