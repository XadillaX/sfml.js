# Managed Lua document and callback acceptance

> Local macOS arm64 acceptance covers the actual Lua 5.4.8 host, document
> execution, listeners, models, custom element instancers, coroutines and
> shutdown. The complete RmlUi integration remains open.

## Implemented behavior

`LuaScriptHost` owns a native VM. Its documents intentionally share globals;
independent hosts have independent states. Context selection routes document
and listener creation without replacing global body/listener instancers.
Already loaded documents retain their captured Node or Lua host.

The public host executes source, calls named functions and gets/sets scalar
globals. Signed 64-bit integers remain exact bigint values, strings preserve
embedded null bytes, and non-finite results reject. Source policies default
to disabled; named handlers work independently of inline source execution.
External files use the active RmlUi FileInterface. Script errors retain source
paths, line offsets and traceback, and failed loads do not attach documents.

DOM and data-event callbacks execute directly in Native/Lua. Nested scopes
restore document, context, event and element globals. Event userdata expires
after dispatch. Invalid DOM proxies and unsafe subtree mutations reject.
Same-data-event recursion and destructive Context operations during events
reject while preserving stack recovery.

Models belong to an exact Context and native model identity. Reopening through
the same VM returns the existing wrapper. Two Contexts can use the same name
independently. Stable native data paths read replacement tables and arrays;
nested proxy writes dirty their owning root. Lua uses one-based array indices
and RML expressions use zero-based indices.

Native models retain their VM after public-host GC. Pre-destruction notices
expire Lua aliases; definitions and registry references release only after
native models, views and controllers have been destroyed. Retained proxies
keep checked tombstones. Manual GC cannot collect active models or proxies.
Unchanged frames do not scan a Lua model registry.

Managed Lua element instancers retain function references in the actual VM.
Registration, produced elements and Node Factory facades independently retain
the VM and allocator. Return conversion runs inside pcall and accepts detached
owned Elements, owned ElementPtr values or nil. Replacement and direct release
preserve original allocators, including pooled native elements.

Coroutines resolve ownership through the main VM registry while using their
own stacks for registry references and model binding. Yield/resume, listeners,
models and instancer creation are verified. Lua-created Contexts inherit the
current Lua host.

VM close is deferred out of V8 GC. Shutdown removes contexts/models, closes
VMs while native listeners and element allocators remain valid, releases typed
pools, and then shuts down Core. Finalizers cannot reenter RmlUi Context
creation or access destroyed script objects.

## Observed verification

| Check | Result |
| --- | --- |
| Actual native build | Completed; all four Lua object files are newer than their final sources |
| Managed Lua scenarios | 28 PASS, 0 FAIL |
| Complete runtime suite | 102 test files, 988 PASS, 0 FAIL |
| Package lint, cpplint and consumer types | Passed |
| Native Lua formatting | Eight changed source/header files passed |
| Native naming | Four Lua compilation units and the final model/object changes passed |
| Pinned source patches | 21 Lua/Core files unchanged after two runs |
| Documentation build | 152 localized pages, 1,586 API pages × four languages, 303 redirects and all local links/assets validated |

File counts include only `.test.cjs` entries. Smoke-summary messages sharing
the runtime log prefix are not files.

The static Lua and model scenarios each count twenty update/render frames:
40 runtime entries, zero Node callbacks and zero geometry uploads. Native
listener dispatch likewise records one runtime entry and zero Node callbacks.
These are CPU-side counters, not a Lua throughput or GPU timing measurement.

The red cases reproduced same-name model invalidation, registered-instancer
GC SIGSEGV, active-proxy collection, select query reentry, non-finite scalar
results and three coroutine state-lookup failures. Each corresponding repaired
behavior runs in the maintained Lua suite.

Evidence is under `/tmp/rmlui-63-completion`:

- `lua-coroutines-native-build-3.log`
- `lua-coroutines-runtime-3.log`
- `lua-coroutines-full-runtime-3.log`
- `lua-coroutines-site-build-3.log`
- `lua-coroutines-lint-3.log`
- `lua-coroutines-cpplint-4.log`
- `lua-coroutines-consumer-types-4.log`
- `lua-coroutines-format-5.log`
- `lua-coroutines-naming-2.log` and `lua-coroutines-naming-4.log`
- `lua-coroutines-patch-idempotence-3.log`
- `lua-managed-source-review.md`

## Remaining obligations

The baseline inventory contains 55 Lua header declarations, including C++
registration templates and stack APIs. Managed runtime verification does not
advertise arbitrary user C++ template registration or raw Lua state pointers.
Their exact consumer mapping remains a separate ledger obligation; this stage
promotes no existing Core or Supplemental declaration.

Core retains 549 records: 474 locally verified, 17 partial and 58 pending.
Supplemental retains 1,547 records: 1,528 locally verified, 18 partial and one
opaque declaration. `scope_complete` remains false.

Non-null GetScriptObject adapters, the remaining exact Core contracts, actual
Lua Invaders/Game bindings, optional libraries/fonts/Debugger, GPU/platform
IME, twenty official applications and 113 visuals, rendered documentation QA,
editor/package/CI and independent whole-scope review remain active.
