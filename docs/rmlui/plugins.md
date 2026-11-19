# Plugins

`Plugin` adapts `Rml::Plugin` with Native-owned registrations. Capture the
callbacks at construction, then register the adapter:

```js
const rmlui = require('sfml.js-rmlui');
const plugin = new rmlui.Plugin({
  getEventClasses() {
    return rmlui.PluginEventClasses.Basic;
  },
  onContextCreate(context) {
    console.log(context.name, context.dimensions.width);
  },
});

rmlui.registerPlugin(plugin);
// Later, while the runtime is still active:
rmlui.unregisterPlugin(plugin);
```

Registration is legal before initialization. The four mask bits are `Basic`
(1), `Document` (2), `Element` (4), and `DataModel` (8); `All` is 15 and is the
default. Use bitwise OR to combine different categories. `getEventClasses`
runs once per registration and its result remains fixed until unregistration.
Changing callback object properties later does not replace captured functions.

| Callback | Native notification timing |
| --- | --- |
| `onInitialise()` | Initial startup for Basic subscribers; every late registration before insertion |
| `onShutdown()` | Every explicit unregistration while initialized; global shutdown for Basic subscribers in reverse registration order |
| `onContextCreate(context)` | After dimensions are set and the context is registered |
| `onContextDestroy(context)` | Before its documents and data models are destroyed |
| `onDocumentOpen(context, documentPath)` | At stream loading, before parsing; the path overload has already opened its file |
| `onDocumentLoad(document)` | After instancing and insertion, before the `load` event |
| `onDocumentUnload(document)` | After the `unload` event |
| `onElementCreate(element)` | After Factory applies attributes |
| `onElementDestroy(element)` | During the base Element destructor, before its metadata and children are destroyed |
| `onDataModelCreate(context, name)` | After the Native model is inserted |
| `onDataModelDestroy(context, name)` | Before Native removal; `context.getDataModel(name)` still works |

Notification arguments are live, separate borrowed facades. They permit
context name/dimensions/model lookup, element id/tag/attribute reads, and
document title/source URL reads. Native access through the borrowed handle
expires when the callback returns. A retained dimensions view stays safe and
is zeroed at expiry. Copy values needed later. A returned model follows the
model's actual lifetime and is invalidated by removal or context destruction.
The base Element destruction callback exposes only surviving base fields.

Registry edits are permitted inside Plugin notifications. Self-removal is
safe, removes future notifications immediately, and does not skip the next
subscriber. New registrations start at the next notification; an initialized
runtime still calls their `onInitialise` immediately. Self-removal during late
`onInitialise` cancels insertion and calls `onShutdown` after initialization
returns. Duplicate registration throws; repeated unregistration returns false.

The upstream header describes `onDocumentOpen` as preceding file opening, but
RmlUi 6.3 actually opens `StreamFile` first in the path overload. A failed open
emits no notice. Memory/stream loads notify before document parsing. This
adapter preserves that observed Core order.

All notifications must synchronously return undefined. Exceptions are retained
until the outer Native call safely returns; teardown completes and borrowed
arguments expire. Promises are rejected and their rejection is consumed.
DOM mutation, layout, rendering, input and runtime shutdown are rejected during
notifications. Parser/instancer/effect/value callbacks cannot edit the Plugin
registry. New registrations are rejected during global shutdown.

Native registration keeps the adapter and callbacks alive even if their JS
facade is collected. Unregistration releases that root at the outer Native
boundary; unregistered callback cycles can collect. Runtime shutdown invalidates
all adapters. Static frames add no Plugin callbacks or registry scans when no
subscribed notification occurs.
