# Exact numeric Variant storage and template conversion

Explicit `{ type, value }` inputs select native BYTE, CHAR, FLOAT, DOUBLE,
INT, UINT, INT64 or UINT64 storage. Number inputs retain their established
double mapping; the single-number Property enum constructor remains
INT/KEYWORD. Explicit 64-bit tags use lossless BigInt conversion even for
small positive unsigned values.

Property values preserve storage types through clone and native equality.
Raw output returns a primitive number or BigInt. The five new template
destinations BYTE, CHAR, FLOAT, INT and UINT use actual GetInto conversion.
Property templates return T{} on failure; attribute and event templates retain
the supplied default. Tagged inputs are copied before borrowing the checked
receiver, and consumer types infer primitive results for inline selectors.

The pinned upstream has no byte-to-byte, double-to-byte or string-to-char
converter. Raw byte output therefore reads the exact native storage with
GetReference<byte>(); template conversion preserves the upstream failure
semantics. Extracting a byte fallback also reads its exact stored value before
attempting conversion. No extra upstream converter was added.

Tagged inputs reject invalid scalar names, shapes, value types, non-finite
numbers, fractional integers and values beyond native bounds. Unsafe
floating-point integer casts and narrow string scans reject before conversion.
Decimal prefix parsing remains native, including valid negative magnitudes
for unsigned string conversions. Native char range follows the platform.

## Local verification

Five new runtime scenarios fail before implementation and pass afterward:
native storage/copy/equality, Property and attribute default semantics,
event parameters, scalar ranges/unsafe conversions, and getter-driven
receiver shutdown. Positive and negative TypeScript fixtures include inline
property, attribute and event selector inference.

`npm_config_jobs=4 npm test` exits zero with 89 unique runtime test files,
828 PASS and zero FAIL. This includes lint, cpplint, Native build, TypeScript,
consumer types and existing lifetime/ownership suites. All 81 site tests pass.
Both changed native units pass clang-format and compiler identifier checks.
The final compiler check suppresses dependency and existing NOLINT diagnostics;
it reports no user-code naming error.

Four-language property guides document storage ranges, precision, BigInt
selection and upstream conversion exceptions. Logs and source hashes are
recorded in the authoritative ledger under `/tmp/rmlui-63-completion`.
The source review is a distinct controller phase, not an independent review.

## Remaining contracts

Persistent element ownership has separate
[pointer acceptance](core-variant-elements-acceptance.md). Scalar evidence
alone does not accept non-null script objects or arbitrary native template
destinations. Integer-vector and Character
conversion representations still need explicit review. The supplemental
compiler ledger currently omits Core/Variant.h, which must be reconciled
against the full declaration inventory.

The existing original and supplemental aggregate value rows stay partial.
Core retains 549 rows: 459 local, 17 partial and 73 pending. Supplemental values
retain 1482 rows: 1469 local, twelve partial and one reviewed opaque declaration.
Core/19, global interfaces, scripting, optional modules, renderer/platform
acceptance, applications and whole-plan acceptance remain open.
