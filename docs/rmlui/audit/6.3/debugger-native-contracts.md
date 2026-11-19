# Native Debugger contracts

> Local macOS arm64 checkpoint: five Native operations, one Context forward,
> 18 Debugger scenarios and 95 dependent consumer scenarios pass.
> Whole RmlUi integration and independent review remain incomplete.

## Exact interface routes

[The declaration map](debugger-declaration-map.json) retains all six original
`Debugger/Debugger.h` records, including the Context forward. Every operation
invokes the pinned upstream implementation through the runtime boundary:

| Upstream | Public operation | Verified contract |
| --- | --- | --- |
| `Initialise(Context*)` | `Debugger.initialise(host)` | Embedded fonts, initially hidden computed style, separate host/target, duplicate false result, owned contexts |
| `Shutdown()` | `Debugger.shutdown()` | Document/listener release, repeated calls, application log restoration, host destruction and runtime restart |
| `SetContext(Context*)` | `Debugger.setContext(target \| null)` | Native hook transfer, null detach, target removal, custom reflection, 16 switches without updating old targets |
| `SetVisible(bool)` | `Debugger.setVisible(boolean)` | Strict boolean input, native style change, ordinary callback reentry rejection |
| `IsVisible()` | `Debugger.isVisible()` | Upstream computed visibility after host update, false without a debugger, ordinary event callback read |

The class forward references the existing checked Context facade; it is
source-reviewed separately from the executed functions. Every call requires a
live initialized process-wide runtime, including reads after runtime shutdown.
Visibility changes use the normal host update rather than an eager hidden
update in the binding.

## Native ownership

The central context release hook closes the plugin before host destruction,
including independently owned contexts. Target removal/unload-all detaches
inspection while keeping host tools. Host unload-all closes the plugin.
Individual internal documents reject close/unload to preserve the plugin's
internal pointers. Runtime shutdown closes the debugger before context removal.
Upstream logs continue through the selected application SystemInterface and
restore that interface on plugin shutdown.

LLDB identified a Native allocator use-after-free when a former target released
a retired hook after plugin shutdown. A second bounded consumer reproduced the
same lifetime failure through borrowed Factory allocators. The correction uses
one stateless Native generic allocator per Debugger element type. Allocators
retain no context or callback and survive deferred releases. Plugin shutdown
disables only its own registrations and preserves replacements made by the host.
There is no added target update, full-instance scan, JS geometry transfer or
per-element bridge in this lifecycle correction.

The exact, idempotent `tools/patch-rmlui-debugger.cjs` also routes failed upstream
initialization through normal plugin cleanup and prevents retired detached hooks
from rendering the active plugin. Failed partial initialization cleanup is a
source-reviewed correction; dependency/font failure configurations remain in
Task 6 acceptance.

## Execution evidence

[Fingerprint evidence](debugger-native-evidence.json) preserves the logs, source
hashes, original inventory identity and sixteen preceding input-map hashes.
The existing build tree compiles all nine upstream Debugger source files and
the focused native binding.

The 18 consumer scenarios exercise native Element Info/menu documents, Event
Log capture and forwarding, scalar and custom-array/custom-struct Data Models,
getter exceptions, separate/owned contexts, deferred hooks, escaped allocators,
host replacements, runtime restart and physical pointer input at densities
1 and 2. The separate eight-suite regression covers context instancers, plugins,
lifetimes, listeners, custom/data models, render batching and SystemInterface:
95 PASS, zero FAIL. Combined focused evidence is 113 PASS across nine suites.
Lint, consumer types, cpplint, native formatting, four-file naming and patch
byte-idempotence pass.

The source review was performed by the implementer; `independent` is false.
No full-package runtime sweep, GPU timing or other-platform job was run for
this checkpoint. The prior full-package checkpoints retain their original
source fingerprints and are not promoted to current-source acceptance.

## Remaining work

The full inventory now has nineteen source maps, 3,902 represented declarations
and 24 unrepresented SVG/Lottie declarations. Representation includes pending
and reviewed entries; it is not a feature or PASS count. SVG/Lottie, HarfBuzz/
bitmap selection, full Core and renderer acceptance, initialization/GPU
measurement, platform IME, the official applications and VisualTests, editor/
packaging/CI and independent whole-change review remain open.

The [English](../../debugger.md), [Chinese](../../debugger.zh-CN.md),
[Japanese](../../debugger.ja.md) and [Korean](../../debugger.ko.md) guides describe
the public API and lifetime behavior.
