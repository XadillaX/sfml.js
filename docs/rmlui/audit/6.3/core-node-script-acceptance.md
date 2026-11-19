# Node document script acceptance

> Node document execution and the two ElementDocument script virtuals have
> local macOS arm64 acceptance. This does not complete Task 5, Core/19,
> managed Lua, optional modules or whole-project acceptance.

## Native execution and ownership

`native/rmlui-script-host.cc` supplies a real `ElementDocument` subclass.
`Context.setScriptHost` selects a captured host for subsequent document loads.
Each loaded document retains its own selection. Separate Factory routing
slots preserve the global body and event-listener instancers.
Hosted construction emits the standard Plugin element-create notice, and
the existing Element destructor emits element-destroy. The existing first
exception guard suppresses later host callbacks after a script fails; native
destruction still invalidates the failed document before the API returns.

RmlUi applies initial `on*` attributes before attaching their elements. An
RAII Factory attribute scope carries the exact element/parent pair only
during that operation; attached elements use their actual owner document.
Listener compilation happens once at instancing, then the existing typed
listener bridge supplies the expiring live event and safe native ownership.
Direct Factory listener facades use that same bridge.

Head scripts execute in resource order at `</head>`, before body parsing.
Inline Node stacks retain the source URL and source-line offset. External
scripts use the active RmlUi FileInterface and a checked StreamFile read;
empty files close correctly, short reads fail, and disabled external
execution does not read a file.

Script exceptions remain unchanged at the initiating boundary. Native
Factory rejects a failed script document before attachment. Promise results
are rejected synchronously and consume their rejection.

Native documents root their VM sessions. The host's session index uses weak
references, so a retained expired Document facade cannot retain the VM.
Context removal clears the host selection; runtime shutdown invalidates host
handles. A moved Factory listener checks its original document before user
code. No user callback runs from a native document destructor.

`Document.loadInlineScript` and `loadExternalScript` invoke the native
virtuals. Ordinary documents retain upstream empty hooks.

## Verified evidence

- Fifteen focused groups pass in `scripts-runtime-final-6.log`, including retained
  VM/session GC, source order, original line locations, empty external files,
  disabled sources, nested events, cancellation, direct Factory listeners,
  captured handlers, exact exceptions, destructive reentry and Plugin lifecycle.
- `scripts-full-runtime-final-3.log` finishes successfully: 100 unique test files,
  958 PASS, zero FAIL. Its final case is
  `template-accessors-cannot-use-expired-receivers`.
- The final declaration compilation leaves all 117 compiled JavaScript
  files byte-identical to the executable code covered by that runtime run.
- Package lint, consumer type fixtures and touched Native cpplint pass.
  Six touched Native files pass format; four changed compilation units pass
  naming with actual compile flags and the supported macOS SDK.
- Seventeen four-language source/site tests pass. Site preparation creates
  actual English, Chinese, Japanese and Korean `/rmlui/scripts` guide routes.
- The final exact Factory patch is idempotent.

All named log files are under `/tmp/rmlui-63-completion/`.

The static counter scenario records twenty update/render iterations:
40 RmlUi runtime entries, zero callbacks, zero uploads, twenty draws and
zero data/element/listener/typed-listener ownership visits. A subsequent
single click records one event callback and zero instancer callbacks.
These are counters, not complete CPU-frame timing or GPU measurements.

## Remaining scope

The executing controller performed the source review; it is not independent.
Only the exact two script methods are promoted. Core 549 becomes 474 local,
seventeen partial and fifty-eight pending. Supplemental 1547 remains 1528
local, eighteen partial and one opaque; `scope_complete` stays false.

Managed Lua execution, safe Lua userdata/events and actual Node/Lua switching
remain unaccepted. The official Lua 5.4.8 archive has been downloaded and its
SHA-256 verified as
`4f18ddae154e793e46eeab727c59ef1c0c0c2b744e7b94219710d76f530629ae`;
its 32 runtime source units are extracted in the existing dependency tree,
alongside the 37 upstream RmlUi Lua C++ units. None have been configured,
compiled or executed. Non-null ScriptInterface adapters
also remain open: Node hosting does not install a GetScriptObject facade.
Continue the remaining Core declarations, optional native dependencies,
GPU/platform IME, applications/visuals, rendered multilingual pages,
editor/package/CI and independent final review.
