# Native Debugger

> `Debugger` runs the upstream RmlUi tools inside an initialized SFML runtime.
> The host displays the tools; the inspection target can be another context.

```js
const { Debugger } = require('sfml.js-rmlui');

if (!Debugger.initialise(host)) {
  throw new Error('Debugger initialization failed');
}

Debugger.setContext(application);
Debugger.setVisible(true);
host.update();
```

Call `host.update()` and `host.render()` in its regular frame loop. Feed input
to the context displaying the tools. `isVisible()` reads upstream computed
style: update the host after initialization or visibility changes. Initialization
loads the embedded native fonts; an existing debugger causes `initialise()` to
return false.

The menu opens Element Info, Event Log and Data Models, and toggles element
outlines. Data Models uses native reflection for scalars, arrays and structs,
including registered custom definitions. It refreshes while visible, using
the upstream 0.3-second interval. JS getter and reflection exceptions propagate
from `host.update()`; built-in reflection stays in C++.

`setContext(null)` detaches inspection. Removing or unloading all documents in
the target detaches its hook and keeps the host tools available. Removing the
host or unloading all its documents shuts down the debugger. Individual debugger
documents cannot be closed or unloaded directly; call `Debugger.shutdown()`.
Shutdown releases native documents/listeners and restores the application log
interface. Repeated shutdown calls are safe while the runtime is initialized.

The five methods use the process-wide runtime owner checks. Only `isVisible()`
may run inside an ordinary event callback; operations that change the debugger
reject callback reentry. After runtime shutdown, all five methods require
initialization again. Generic Factory allocators borrowed while debugging remain
valid during that runtime, while the plugin's Factory registrations are removed
at shutdown. Their native lifetime also covers retired hooks awaiting release
in a former target.

Local macOS acceptance covers separate and owned contexts, native logging,
scalar/custom-array/custom-struct reflection, callback errors, retargeting,
deferred releases and pointer interaction at density ratios 1 and 2. See the
[acceptance record](audit/6.3/debugger-native-contracts.md). Platform jobs,
sample F8 bindings and whole-project acceptance remain separate work.
