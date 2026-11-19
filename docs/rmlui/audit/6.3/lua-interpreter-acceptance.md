# Managed Lua interpreter references

> Native compilation, captured functions and exact result-count calls pass
> thirteen local macOS arm64 scenarios. All 55 original Lua declarations now
> have explicit mappings; 45 retain defined follow-up obligations.

## Native execution and ownership

`LuaScriptHost.compile(source, path, line)` creates a compiled chunk without
executing source. A `LuaFunction` retains an actual registry reference and
the exact native host. `getFunction(name)` captures the current function,
so replacing or removing the global cannot change an existing reference.
Neither VM pointers nor integer registry references are exported to Node.

`LuaFunction.call()` returns its first scalar value. `callResults(count, ...args)`
passes the exact count to the protected native call, pads missing results with
null, and discards extras. The default result count is zero and still executes
the function. Result conversion rejects non-finite numbers and non-scalar
results without exposing a partial output array.

Argument count and result count are checked against the actual Lua stack
limit before reading JS argument getters or allocating argument storage.
After reading getters, the native reference, state and generation are checked
again. A getter may release that reference or shut down the runtime. Calls
retain their host independently so nested callbacks cannot destroy a borrowed
VM stack by releasing the reference.

Every call restores the exact outer stack after success or failure. Calling
from Node inside a Lua callback retains the enclosing Lua event/document
globals; a Node listener does not select a new Lua scope. Explicit host-file
execution uses a document-free scope and restores previous globals afterward.

`release()` drops this registry reference and VM retention. Further calls
and releases reject. Other captured references remain valid. Native VM close
still occurs at a safe runtime boundary outside V8 GC. Shutdown closes the
VM and invalidates every captured function's generation.

`executeFile(path)` invokes the actual native `Interpreter::LoadFile` under
the managed state, stack and global scopes. The selected RmlUi FileInterface
supplies bytes; file-open/read errors and Lua exceptions preserve their
original paths. Explicit trusted execution does not depend on a document's
`allowExternal` policy.

## Verification

The original red run contains eleven failures for missing managed entrypoints.
The additional stack-limit red test reaches an argument getter before
rejecting an oversized call. The final maintained function test has thirteen
PASS results and zero failures.

The file-syntax red case exposed an idempotence mismatch in the pinned-source
patch: its short replacement already appeared in the file-open error path,
so compilation retained its original log-only failure. The patch now replaces
the complete uniquely identified LoadString function. Syntax errors preserve
file path and line, and subsequent file execution remains usable.

The nested diagnostic test initially expected the Node event to select a new
Lua scope. Inspection of `JsEventListener`, `LuaDocumentScope` and the native
Lua listener established that only a Lua listener selects that scope.
The corrected test asserts preservation of the actual enclosing Lua frame.

TypeScript build and positive/negative consumer types pass. Four changed
native source/header files pass formatting; three compilation units pass
naming with the real compile database. Final `npm test` passes lint, cpplint,
native/TypeScript builds, consumer types and all 103 runtime test files:
1,016 PASS, zero FAIL. Counts include actual `.test.cjs` entries only.
All four affected native object files are newer than their final source files.

The site validates 152 localized pages, 1,587 API pages in four languages,
303 redirects and all local links/assets. The five existing source-type
reference warning categories remain open for whole-site QA.

Evidence remains in `/tmp/rmlui-63-completion`:

- `lua-functions-red.log`
- `lua-functions-stack-red.log`
- `lua-functions-nested-diagnostic.log`
- `lua-functions-file-syntax-red.log`
- `lua-functions-focused-4.log`
- `lua-functions-native-2.log`
- `lua-functions-format-2.log`
- `lua-functions-naming-2.log`
- `lua-functions-patch-repeat.log`
- `lua-functions-package-4.log`
- `lua-functions-site-1.log`

The first complete package run was intentionally stopped after the review
added the stack-limit case. The second run completed with 103 files, 1,015 PASS
and zero failures before the subsequent syntax-error test and repair; it is
not final-source verification. The third run failed only its patch-script
line-length lint check. The fourth run passes against the final source.

## Declaration mapping and open acceptance

[The exact mapping](lua-declaration-map.json) preserves all 55 compiler
declarations, including the distinct `LuaType::RegType` struct and typedef
that share a name, signature and type. Keys include declaration kind and line.

| Status | Records |
| --- | ---: |
| Locally verified managed equivalent | 10 |
| External VM equivalent requiring follow-up | 1 |
| Native method descriptor mapping requiring follow-up | 8 |
| Native template mapping requiring follow-up | 20 |
| Native source mapping requiring runtime follow-up | 14 |
| Native Variant conversion requiring follow-up | 2 |

The supplied-VM C++ initialization overload is represented by selecting an
existing managed host. Arbitrary externally created `lua_State*` registration
has no accepted Node contract. Native registration templates are compiled for
the explicit built-in type list; that does not establish arbitrary user C++
type registration or exhaustive methods for every built-in type. Variant
conversion, exact index boundaries, diagnostic formatting and complete cast/
metamethod behavior have their own follow-up entries.

This review promotes no original Core or Supplemental declaration. Core keeps
549 records: 474 locally verified, 17 partial and 58 pending. Supplemental keeps
1,547 records: 1,530 locally verified, 16 partial and one opaque declaration.
`scope_complete` stays false. Core 19, the open Lua mappings, optional modules,
GPU/platform IME, official applications, visuals, rendered four-language QA,
editor/package CI and independent whole-scope review remain active.
