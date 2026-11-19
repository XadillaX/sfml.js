# Native string, URL and default clipboard contracts

> Native and managed String/URL contracts are locally verified on macOS arm64:
> 88 exact original declarations, seven native groups, four-language guides
> and a complete 112-file, 1,125-PASS package run. Whole RmlUi 6.3 acceptance
> remains incomplete.

## Default clipboard

The actual default SFML backend now converts input with
`sf::String::fromUtf8` and output with `sf::String::toUtf8`. The previous
implicit ANSI conversion lost Japanese, Greek, accented and emoji characters
in both directions. The permanent regression tests use the independently
implemented `sfml.js.Clipboard` endpoint to observe each direction. They
restore the original clipboard text in `finally` without logging that text.

`default-clipboard-red-1.log` records two failed Unicode assertions and twelve
passing existing SystemInterface scenarios. `default-clipboard-green-1.log`
records all fourteen scenarios passing after the correction. Each new
scenario checks ASCII and empty text alongside Unicode.

The native adapter and its existing tests pass ESLint, cpplint and
clang-format. The maintained adapter also passes the established LLVM 18
identifier naming check.

These incremental builds do not replace the previous complete package
evidence. `numeric-template-package-3.log` still records its historical
compiler warning; that log and its fingerprinted evidence are unchanged.
The fresh `string-url-package-2.log` result below includes the corrected
default clipboard and all current public String/URL adapters.

## Pinned native string and URL corrections

`tools/patch-rmlui-strings.cjs` supplies six exact edits through the existing
dependency patch pipeline. The package file list includes that module.

| Native contract | Correction |
| --- | --- |
| URL replacement | Reset every parsed component and parameter before parsing the replacement, including an empty URL |
| URL query cache | Mark the reconstructed URL dirty after clearing parameters |
| URL UTF-8 encoding | Format each escaped byte as an unsigned value |
| URL embedded NUL | Encode the complete explicit byte length |
| String replacement | Treat an empty search as a no-op instead of entering a nonadvancing loop |
| StringView equality | Compare all view bytes, including bytes after embedded NUL |

The original URL probe records six failed assertions and two ASCII/cache
controls. The original StringView probe records one failed byte-equality
assertion and fifteen length/offset controls. The permanent fixture also
reproduces the empty-search failure with a bounded two-second subprocess;
the process is terminated on timeout.

The corrections retain the pinned resource URL rules. They do not add WHATWG
URL parsing. For example, the existing decoder maps `+` to a space, `%GG` to
`GG` and `%A` to byte `0A`. Query parameters retain native unordered-map
ordering. RML entity decoding is single-pass, and ASCII case folding does not
change non-ASCII characters.

Native codepoint offsets remain distinct from JavaScript UTF-16 offsets.
For `Aé中😀Z`, the six byte boundaries are `0, 1, 3, 6, 10, 11`. A byte offset
inside a codepoint rounds forward according to the existing RmlUi helper.
Invalid raw view/iterator positions remain native preconditions; a managed
facade must check positions and retain the backing owner.

## Permanent verification

Run the fixture using the existing native build and an existing temporary
output directory:

```sh
python3 test/native/build-string-url-contracts.py /tmp/rmlui-63-completion
```

The runner recompiles the actual StringUtilities source with libc++ extensive
hardening and native assertions enabled, links existing native objects, and
executes `test/native/string-url-contracts.cc`. It creates no worktree, clone,
copied repository or isolated build/test environment.

`string-url-permanent-runner-1.log` exits zero with eight literal PASS lines:
seven runtime groups and one hardened-source verification marker. The
groups cover all URL component operations, encoding/decoding, URL cache and
replacement, string formatting, RML/ASCII rules, lists and byte views,
Unicode helpers/iterators and empty-search behavior. Fourteen partial RML
entities execute with the hardened source and preserve their input; they are
controls, not confirmed out-of-bounds defects.

The intentionally malformed protocol emits the native error diagnostic and
returns false as expected. It is not a compiler error or a failed scenario.

`string-url-patch-integrity-1.log` verifies all six exact anchors, reversible
in-memory edits, two complete no-op patcher runs, unchanged source timestamps
and the package file list. The maintained patch module and fixture pass
ESLint, cpplint and clang-format. `string-clipboard-native-naming-1.log`
records the two maintained compilation units passing identifier naming.
The naming tool's suppressed dependency diagnostics are not a zero-warning
package-build claim.

All named execution logs are under `/tmp/rmlui-63-completion/`.

## Public retained byte and URL adapters

`URL` owns an actual native `Rml::URL`, independently of runtime
initialisation. Component setters, URL replacement, parameters and ordering
use that instance. Parameter snapshots create own data properties, including
`__proto__`, without writing a JavaScript prototype. All map values are
validated before replacing native parameters.

`StringView` retains immutable native string storage. Subviews share that
owner, check byte offsets and clip counts at the view end. Byte snapshots use
separate native storage; modifying them cannot modify source bytes or lookup
indices. Iterators retain their source view, use private native index
snapshots and perform movement and dereference without native entries.
Iterator equality follows the same native owner and absolute byte position
across aliased views.

Before-begin and end states are numeric offsets, never invalid native
pointers. A slice starting with UTF-8 continuation bytes preserves native
seek behavior: backward movement can reach minus one, and advancing from
that state skips the initial continuation bytes. The focused regression
first reproduced a returned zero where minus one was required.

`StringUtilities` uses the native ASCII, RML, replacement and list functions.
Whitespace membership uses the same four ASCII bytes as native
`IsWhitespace`. Scalar and batch character/byte conversion reuse a lazily
compiled native boundary index. Reusable fixed, unshared `Int32Array` output
avoids new output storage; overlapping input/output subarrays use a snapshot
of the original input before applying results.

`string-url-public-runtime-6.log` records fifteen passing public scenarios,
including real owner retention across GC and runtime shutdown.
`string-iterator-continuation-red-1.log` records the independent continuation
boundary failure before its correction. The fresh complete package result
below also includes these scenarios.

## Typed native formatting

`formatString` returns `{ value, length }`, expressing the native mutable
destination and returned UTF-8 byte count as one managed result.
`createString` returns its text. Both use the real native
`Rml::FormatString` in one addon entry with explicitly typed scalar arguments.
Supported conversions are `d`, `i`, `u`, `o`, `x`, `X`, `f`, `F`, `e`, `E`,
`g`, `G`, `a`, `A`, `c`, `s` and literal `%%`. Flags, width, precision and
dynamic `*` are supported. Integer and character arguments are range checked;
floating arguments must be finite.

Raw C ABI pointers, positional arguments and length-modified formats are
outside the managed scalar domain and throw. The original C++ varargs
functions remain available in native support. Each dimension and the total
formatted output have a one-million-byte limit. Embedded NUL in the format
itself is rejected.

The managed adapter preserves the actual native buffer branches: output
shorter than 256 bytes truncates its text at the first NUL but keeps the full
reported length; longer output retains that NUL. For `%cZ` with zero, the
result is `{ value: "", length: 2 }`. `%260s%cZ` with empty text and zero
returns 262 bytes, including NUL at byte 260.

`string-format-public-red-1.log` records five missing-surface failures.
`string-format-public-green-3.log` records all five scenarios passing.
The actual native fixture independently checks dynamic dimensions, UTF-8
byte precision and both NUL-buffer branches.
`string-url-permanent-runner-2.log` exits zero with eight literal PASS lines,
retaining its seven runtime groups and hardened-source marker.

## Batch diagnostics

String and URL entries record the current thread's active diagnostics
without entering runtime ownership-maintenance scopes. A 220,000-byte view
contains 100,000 native codepoints. Its seven-offset batch builds one index
on first use. Warm conversion records one forward native entry, zero
callbacks, zero index rebuilds, zero input-copy bytes, zero output-storage
allocations and zero ownership visits. Managed movement and dereference
record zero native entries.

`string-url-performance-green-4.log` records four passing groups. Its three
malloc-profiler warm-up intervals are preserved: the first records fifteen
allocations and 30,792 requested bytes; the next two record zero. The measured
steady query then records zero main-thread malloc allocations and zero
requested bytes. These are scoped warm-query results, not initialization,
whole CPU frame or GPU measurements.

The diagnostic investigation also retains cold empty-interval and repeated
query samples in `string-malloc-investigation-1.log`. It does not attribute
all cold host/profiler allocations to the native lookup implementation.

The [88-record declaration map](string-url-declaration-map.json) keeps every
original header, line, kind, name, signature and type. It separates native
pointer/literal constructors and varargs from managed retained views, numeric
positions and typed scalar formatting. `StringView.begin()` and `end()` return
view-relative byte positions. Negated `equals()` represents inequality.
Record count includes types and overloads; it is not an independent test count.

[English](../../strings.md), [Chinese](../../strings.zh-CN.md),
[Japanese](../../strings.ja.md) and [Korean](../../strings.ko.md) guides are
published through the existing site manifest and sidebar. Their identical
code runs against actual native bindings. Source-localized parameter and
return contracts pass the four-language TypeDoc checks without unresolved
type references. `StringInput` is a public alias instead of an undocumented
internal parameter type.

The full inventory now has eleven
maps, 3,406 represented original declarations and 520 unrepresented ones.
These are cross-reference counts, not accepted feature counts.

Final focused verification also passes ESLint, source and consumer
TypeScript checks, cpplint and clang-format. The final logs use
`string-url-public-lint-8.log`, `string-url-public-types-3.log`,
`string-url-public-cpplint-4.log` and `string-url-public-format-5.log`;
silent tools produce empty successful logs. `string-url-public-naming-3.log`
records four compiled units passing identifier naming using the established
LLVM 18 header configuration. Earlier SDK/header mismatch attempts are
diagnostic-tool failures, not product failures. Suppressed dependency
diagnostics are not a zero-warning full-package claim.

## Current complete package and source review

`string-url-package-2.log` exits zero after package ESLint, cpplint, the
existing native build, source TypeScript, consumer types and every current
runtime suite. It contains 112 unique runtime files, 1,125 literal PASS lines,
zero FAIL, zero native compiler warnings and zero compiler errors. Host
dependency deprecation notices remain distinct from compiler diagnostics.
The first current package attempt stopped at its foreign-worker assertion;
that failed log is retained.

The actual worker test now executes all forty independent String/URL entries
while the main runtime remains initialized. It checks the worker's own byte
views, native index, offset batch, typed format and URL mutations. All other
runtime entries still require the owning environment. Worker resources are
not skipped or accepted merely because argument validation throws.

`string-view-boundaries-red-1.log` reproduces the missing `begin()` method.
`string-view-boundaries-green-1.log` passes all fifteen current public cases.
The permanent native fixture directly checks pointer-range view and iterator
constructors; `string-url-permanent-runner-3.log` records its seven runtime
groups plus the hardened-source marker. The final fixture passes cpplint and
clang-format. Final public lint and types use
`string-url-public-lint-11.log` and `string-url-public-types-4.log`.

`string-url-four-language-4.log` passes all four complete TypeDoc checks.
`string-url-guide-routing-1.log` passes all eleven existing routing tests,
including the four String guide routes. The guide example executes actual
native APIs in `string-url-guide-runtime-1.log`. Source comments include
localized summaries, parameters, return values and explicit defaults.

The separate controller source review checks immutable owners, pending cache
publication, backing-store retention, overlapping batches, callback accessor
reentry, hostile parameter keys and numeric iterator sentinels. It is not a
separate reviewer. Typed printf validates native promoted scalar types and
bounds before returning output; fragment allocation precedes the aggregate
output-limit check.

The actual temporary npm archive has 594 entries and is 1,508,511 bytes.
`string-url-pack-verify-1.log` checks thirteen String/URL source and generated
files byte-for-byte against current files, including byte boundaries and
`StringInput`. This verifies package inventory; it does not claim an isolated
installation or execution from the archive.

[Fingerprinted checkpoint evidence](string-url-native-evidence.json) preserves
all original inventory keys, checkpoint source digests, actual logs and the
archive digest. `string-url-evidence-verify-2.log` independently verifies
six evidence groups, recomputes the eleven-map inventory match and confirms
unchanged Core/Supplemental counts. Historical numeric evidence is unchanged.

The [support and logging follow-up](support-native-contracts.md) retains the
original archive and reruns the complete package after sharing scalar formatting
with native application logging. Its fresh evidence verifies 113 files and
1,131 PASS; the twelve-map reconciliation leaves 363 supporting declarations.

Remaining whole-scope obligations include those 363 supporting declarations,
Lua and Core/19 acceptance, modules, initialization/GPU/platform input,
official applications and visuals, editor/browser/package/CI checks and
the final whole-binding review.
