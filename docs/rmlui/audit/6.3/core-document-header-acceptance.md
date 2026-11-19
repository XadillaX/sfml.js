# Core document header acceptance

> DocumentHeader and ProcessHeader use their actual native implementations.
> Local macOS arm64 verification passes. Core nineteen-group and Tasks 5–10
> acceptance remain open.

## Exact original declarations

| Original record in Core/ElementDocument.h | Consumer representation |
| --- | --- |
| Rml::DocumentHeader, line 9 | Owned DocumentHeader with actual native storage and complete source-reviewed fields and merge functions. |
| ElementDocument::ProcessHeader, line 46 | Document.processHeader(DocumentHeader), passing a native header snapshot. |
| ElementDocument::SetTitle, line 52 | Document.title setter. |
| ElementDocument::GetTitle, line 54 | Document.title getter. |
| ElementDocument::GetSourceURL, line 57 | Document.sourceURL getter. |
| ElementDocument::Hide, line 83 | Document.hide with native visibility, focus and hide dispatch. |
| ElementDocument::Close, line 86 | Document.close with synchronous unload and deferred native destruction. |

These are original compiler-inventory locations, not line numbers in the
modified upstream checkout. No other class, constructor, destructor or script
hook is promoted by this acceptance.

## Source-reviewed native header surface

The compiler inventory contains only a forward DocumentHeader class. The actual
class is in `Source/Core/DocumentHeader.h`; its methods are in DocumentHeader.cpp.

| Native storage or operation | Contract |
| --- | --- |
| source, title | Owned strings; empty defaults. |
| template_resources | Ordered owned paths, exposed as templateResources. |
| Resource.path | Inline content origin or already resolved external path; default empty. |
| Resource.content | Owned inline text; default empty. |
| Resource.is_inline | Exposed as isInline; default false. |
| Resource.line | Native int32 line offset; default zero. |
| ResourceList, rcss, scripts | Ordered owned records; inputs and outputs are copied. |
| MergeHeader | Preserve existing nonempty title/source; resolve template paths against source header; append RCSS/scripts without rewriting paths. |
| MergePaths | Native JoinPath plus upstream colon/pipe conversion; return the modified independent target copy. |
| MergeResources | Append resource copies, preserving order, flags, offsets and literal paths. |

Self-merge snapshots the source before native vector insertion. replace validates
every input before one atomic native assignment; omitted fields reset. Field
setters and all list/snapshot getters copy deliberately. Native generation
checks run after all JS accessors; constructor input also checks its original
generation. Getter exceptions preserve the old receiver storage.

Header values contain no render resources or JS callback edges. SharedHandle
owns their ordinary string/vector memory until collection; shutdown prevents
old-generation access without a per-entry global header scan.

## Native ProcessHeader behavior

ProcessHeader loads and recursively merges templates, merges the document
header last, records the document's own source/title, builds RCSS in source
order, invokes script hooks and hides the document with an immediate property
update. Document rules override earlier template rules. An empty document title
remains empty even if a template has a title. Existing sheets remain installed
when no new RCSS loads. Processing does not dispatch Hide.

A context-free detached document retains parsed RCSS media blocks but native
DirtyMediaQueries does not compile them. Its retained container can be applied
to a context-owned document, which compiles and applies the rules.

The binding calls native ProcessHeader directly. The base LoadInlineScript and
LoadExternalScript hooks are empty; script execution and host ownership remain
Task 5 requirements. No script execution is claimed from storing header records.

## Verification boundary

The focused suite exercises defaults, all header fields, snapshot isolation,
merge ordering and self-merge, native path resolution, external and inline RCSS,
template/document overrides, title/source, hidden state, hide/unload dispatch,
deferred alias invalidation, invalid records/paths/int32 offsets, getter errors,
runtime restart, inherited setters, managerless parsing and callback rejection.

The batch test uses 10,000 RCSS and 10,000 script resources. replace, snapshot and
merge each require one native entry, zero reverse callbacks and zero element
ownership visits. These measurements cover header configuration operations,
not complete frames, zero-allocation processing or GPU completion.

The separate controller review is
`/tmp/rmlui-63-completion/document-header-source-review.md`; it is not an
external or subagent review. Initial missing-interface tests and incorrect
fixture assumptions remain in the red/extended/accepted attempt logs. Nullable
Factory context and immediate compilation on a context-free document were
corrected against the public API and actual native source, without changing
upstream semantics.

Four-language guide coverage is under [documents](../../documents.md#document-header).
Every exported field, setter, parameter and result has source-level multilingual
documentation. Positive and negative consumer fixtures are
`test/document-header.ts`.

The final focused run passes ten groups. The full runtime runner passes 83
unique suite files, 766 literal PASS markers and zero FAIL. Package lint,
cpplint, native/TypeScript builds and consumer type checks pass. Four changed
native source/header files pass formatting; compiler-backed naming passes all
three compilation units. Site tests pass 81/81 with zero failures or skips.

Evidence logs use `/tmp/rmlui-63-completion/document-header-*`, including
`green-final.log`, `runtime-package-final.log`, `build-native-final.log`,
`build-ts-final.log`, `types-final.log`, `lint-accepted.log`,
`cpplint-corrected.log`, `naming-final.log`, `format-final.log` and
`site-tests-final.log`. The exact ledger records source SHA-256 hashes for
DocumentHeader.h, DocumentHeader.cpp and ElementDocument.cpp.

Seven original records are locally accepted. The ledger retains 549 unique
original keys: 428 locally verified, 18 partial and 103 pending. Data retains
its separate 131-record acceptance; scope_complete remains false.

Continue actual owned constructors and allocator provenance, remaining
templates/global/dependent interfaces, the nineteen Core groups and Tasks 5–10.
No commit, push, publication or whole-project completion is established by this
bounded acceptance.
