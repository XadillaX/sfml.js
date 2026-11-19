# Native system interface acceptance

This acceptance covers the typed system interface and its global Set/Get
contract on macOS arm64. Whole Core/19, global initialization, device input,
script/plugin integration and Tasks 5–10 remain open.

## Native representation

`SystemInterface(window, callbacks?)` owns an actual Native
`SystemInterfaceSFML` subclass. `setSystemInterface(system | null)` delegates
to Core before initialization. `initialise` retains this selection and creates
the default SFML implementation only when none was selected.
`getSystemInterface()` returns the canonical selected wrapper or null.
Selection after initialization is rejected according to the upstream contract.

| Upstream operation | Consumer representation |
| --- | --- |
| Constructor/destructor | Checked native owner, GC and shutdown |
| GetElapsedTime | `getElapsedTime()`, shared `clock[0]` or native SFML clock |
| TranslateString | `translateString(input)` → `{ value, translations }` |
| JoinPath | `joinPath(documentPath, resourcePath)` |
| LogMessage | `logMessage(type, message)` → native bool |
| SetMouseCursor | `setMouseCursor(name)` |
| SetClipboardText | `setClipboardText(text)` |
| GetClipboardText | `getClipboardText()` |
| ActivateKeyboard | `activateKeyboard(caret, lineHeight)` |
| DeactivateKeyboard | `deactivateKeyboard()` |

`LogType` supplies the six legal native severity values. The native maximum
sentinel is not a valid log argument. Variadic `Rml::Log` helpers are outside
this accepted surface.

The one-element `Float64Array` clock maps a Native-owned double. NaN selects
the SFML clock; supplied time must be finite and nonnegative. Native time reads
require no JS callback or Addon entry. Callback availability is captured into
a native bitmask, so omitted virtuals do not inspect V8 callback storage.

The eight optional host hooks are synchronous. Functions are captured once,
preserve their callback object's `this`, and use strict native result checks.
The dedicated callback scope rejects all recursive binding entries, including
setup-only shutdown and return-object accessor reentry. Exact JS exceptions
propagate at the native boundary; promises are rejected with handled
rejections.

Selected interfaces root their callback/window edges until shutdown.
Unselected wrappers and callback cycles remain collectible. Shutdown invalidates
every interface, clears private callback/window edges from retained wrappers,
and leaves resource-free clock backing alive. Environment cleanup releases
owners in its V8 context. Foreign workers cannot access the setup owner's
registry. The default renderer retains its own window independently of the
selected system's cursor window.

## Evidence

The later [default clipboard verification](string-url-native-contracts.md)
adds two permanent tests of the actual SFML backend. ASCII controls pass
before the fix while both Unicode directions fail. Explicit UTF-8 conversion
then passes all fourteen current SystemInterface scenarios. The historical
package counts below are retained; they are not a fresh whole-package result.

The original nine runtime contracts fail before implementation. The final
focused suite passes twelve scenarios covering pending/default selection,
replacement, rejected initialization, actual virtual calls, document
translation/path joining, callback capture, errors/reentry, shutdown,
collectible cycles and foreign-worker rejection.

A real width animation advances during 32 context updates from shared
application time. Its numeric result matches the supplied time. The interval
records zero native-to-JS callbacks, zero callback snapshot visits and zero
element ownership visits. Static updates do not necessarily read time, so they
are not used to establish clock consumption.

The complete package run exits zero with 93 unique runtime files, 867 PASS and
zero FAIL. It includes lint, cpplint, Native build, TypeScript, consumer fixtures
and all runtime suites. Final source/type/document verification is recorded in
the system-interface logs under `/tmp/rmlui-63-completion/`.
Ten changed Native files pass formatting; six changed compilation units pass
LLVM naming checks with the validated macOS SDK.

The controller performs a separate source review; this is not an independent
reviewer. The ledger updates only three Core/Core.h system rows and reconciles
the twelve Core/SystemInterface.h declarations against the compiler inventory.
Core remains 549 declarations: 462 local, seventeen partial, seventy pending.
Supplemental history retains 1525 and adds the twelve declarations explicitly:
1537 total, 1518 local, eighteen partial and one opaque.

Device cursor appearance, system clipboard interaction, touchscreen keyboard,
IME, complete initialization latency, GPU timings, file/font/render global
selection and full Log helpers are not established by this acceptance.

## Application logging follow-up

[Native support acceptance](support-native-contracts.md) now establishes
`Log.message` and `Log.parseError` through actual `Rml::Log`, including
pre-initialization system selection, typed formatting, native truncation,
callback errors and foreign-environment rejection. These application helpers
use the selected system sink and retain the six legal `LogType` values.
The original system-interface measurement above remains a historical checkpoint.
