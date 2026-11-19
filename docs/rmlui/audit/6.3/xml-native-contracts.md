# Native XML parser contracts

> Local macOS arm64 XML verification passes: four original native groups,
> 17 managed scenarios, and complete-package verification across 114 runtime
> files with 1,148 PASS and zero failures. Whole RmlUi 6.3 acceptance remains
> incomplete.

## Native and managed surfaces

`BaseXMLParser` owns an actual upstream parser. Its CDATA/InnerXML registration,
stream parsing, line positions and public start/end/data virtuals execute in
native code. Optional synchronous callbacks receive scoped parser references.
The direct public virtual methods dispatch outside callbacks; callbacks return
`undefined`. `parseEvents` collects owned native events in one entry without
per-token JavaScript callbacks.

`XMLParser` owns the upstream DOM parser and retains its checked root.
Ordinary document parsing remains native. Its protected structural start/end
handlers reject direct managed calls. Active callbacks can select the child
handler, delegate a native handler and submit data. Parse-frame fields are
snapshots with checked element/handler references. Document headers are owned
copies with an explicit active-parser writeback route.

`XMLNodeHandler` stores all three synchronous virtual implementations.
Start returns `null` or an element already owned by the current parse subtree;
end/data return booleans. Promises and foreign elements are rejected.
Registered handlers retain callback roots. Unregistered callback cycles remain
collectible through weak handles and V8-visible private edges.

The original inventory contains 49 exact declarations in these headers:

| Header | Original indices | Records |
| --- | --- | --- |
| `Core/BaseXMLParser.h` | 53–71 | 19 |
| `Core/XMLNodeHandler.h` | 3811–3818 | 8 |
| `Core/XMLParser.h` | 3819–3840 | 22 |

The [exact declaration map](xml-declaration-map.json) retains original indexed
keys, and [fingerprinted evidence](xml-native-evidence.json) records current
sources, logs, native groups, managed scenarios and archive byte comparisons.
Records include native forward declarations, types and destructors; they are
not 49 application features or 49 passing scenarios. `ReleaseHandlers` is
documented upstream as internal lifecycle support and remains part of checked
shutdown, rather than an unsafe public table reset.

## Lifetime and source contracts

Parser references check runtime generation, handler revision, root validity
and callback scope before dereferencing native state. Registration replacement
invalidates existing XML parsers and borrowed handler references.
Callback-scoped parsers expire on return and can access only their own current
native parser. DOM/stream/registry/runtime mutation is excluded during XML
callbacks. Errors unwind through the existing first-exception channel.

Owned handlers and persistent CDATA registrations may be prepared before
initialization. Successful initialization adopts that setup. Callback-array
getters cannot create handlers across shutdown: both generation and registry
revision are checked. Shutdown clears abandoned setup and releases parser
stacks before detached-element and observer pools. Context removal invalidates
parsers whose roots belonged to that context.

Source positions use upstream one-based lines; unparsed line counters are
zero. Source URLs are copied only during active parsing. Direct Base virtual
dispatch has no source URL. Explicit `<![CDATA[...]]>` joins upstream Text;
registered raw tags produce CDATA and captured inner markup produces InnerXML.
Neither the adapter nor the tests normalize away those native distinctions.

## Local verification

The complete `npm test` exits zero after lint, cpplint, native/TypeScript builds,
consumer type checks and all 114 runtime files: 1,148 literal PASS lines,
zero FAIL and zero emitted native compiler warnings/errors. Dependency
deprecations remain separate from compiler diagnostics.

The XML runtime suite executes 17 passing scenarios:
batched tokenization and source positions, direct public virtuals, callback
shape/order/return validation, setup/shutdown accessors, native DOM/delegation,
header copy/writeback, data dispatch, foreign subtree rejection, root GC,
context removal, generation/revision invalidation and collectible callbacks.

The permanent native fixture runs four original groups: Base public virtuals,
tokenization/data/source lifetime, shared handler registration/release, and
frame/default/type contracts. It reuses existing vendor objects with assertions
and libc++ header hardening, without creating another build environment.

The diagnostic scenario verifies 20,000 Base token events from 10,000 tags
using one native entry, zero host callbacks and zero ownership visits.
Ordinary parsing of 1,000 native DOM children also uses one native entry and
zero host callbacks. These are parse-boundary counts, not complete-frame GPU
performance measurements.

Four-language TypeDoc contracts, the 11 guide-routing checks, rendered anchor
checks and actual execution of both examples in all four guides pass. Native
formatting, whitespace and two XML identifier-naming units pass. Dependency
warnings suppressed by the naming checker are distinct from package compiler
diagnostics. The source review was performed by the implementing assistant,
not an independent reviewer.

The current actual npm archive contains 604 entries and 1,546,731 bytes.
Nineteen maintained XML/native/core/source/generated members byte-match current
files. No archive-runtime execution or isolated
installation is claimed.

## Remaining whole-integration work

The [full inventory cross-reference](full-inventory-reconciliation.json) now
contains thirteen maps, 3,612 represented and 314 unmatched declarations.
Representation is not a pass count. Beyond XML, remaining header reconciliation, Lua follow-ups,
nineteen Core groups, modules, initialization/GPU/platform IME, twenty official
applications, 113 VisualTests, browser/editor/package/CI and whole-binding
review remain open. Previous Support/String checkpoints retain historical
source fingerprints after the shared runtime/header changes.
