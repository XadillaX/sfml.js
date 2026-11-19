# Native types and default actions

`ScriptInterface` is the typed base of `Context`, `Element` and `RmlEvent`; it has no
standalone native allocation. `ScriptInterface.getStaticClassIdentifier()`
returns the actual native base token. Native Event inherits that same token;
`RmlEvent.getStaticClassIdentifier()` therefore returns it too. Elements have
their own tokens and satisfy `isClass` for the ScriptInterface base.

`getScriptObject()` calls the native virtual on a live object. Unregistered
contexts, elements and events return `null`. `setScriptObject(object)` registers
a managed host association; passing `null` clears it. JS subclassing alone
does not create a native script object. See [script objects](scripts.md#native-script-objects).
Event RTTI and script-object reads
require a live owned event or the currently active callback lease. Element
destruction, owned-event release, callback return and shutdown reject later
native reads. Saved event snapshot fields remain readable. `release()` keeps
each concrete facade's existing native allocation and ownership rules.

`Element.getStaticClassIdentifier()` returns an opaque `ClassIdentifier` symbol
for the facade's native class. Every exported element subclass inherits this
method. A JS-only subclass resolves to its nearest registered native base.
Static tokens are available before initialization and survive runtime restart
within the same module. They cannot be serialized or constructed from strings.

`element.getClassIdentifier()` queries the actual native object.
`element.isClass(token)` tests native inheritance. Both reject destroyed
elements. Tokens expose no pointer addresses and do not retain an element.
Unknown native subclasses still have distinct tokens even when wrapped by
`Element`. The element's RML tag and JS prototype do not determine native type.

```js
const controlType = rmlui.ElementFormControl.getStaticClassIdentifier();

if (element.isClass(controlType)) {
  // The native element derives from ElementFormControl.
}
```

`element.processDefaultAction(event)` calls virtual
`Rml::Element::ProcessDefaultAction`, including the input and tab-set overrides.
Call it synchronously from a listener on that element: the receiver must be
the live event's `currentTarget`. Retained events reject after their own
listener returns, even during another listener in the same dispatch.

```js
tabs.addEventListener('click', event => {
  event.stopPropagation();
  tabs.processDefaultAction(event);
});
```

This example performs the native tab click action once manually. The method
preserves the live phase, target, parameters and propagation state. Stopped
events still execute their default action when explicitly passed to this
method. Manual execution does not cancel the later automatic default action;
use `stopPropagation()` on an interruptible event to prevent that later action.
For non-interruptible events, stop methods do not cancel it.

Sequential calls repeat native side effects: a checkbox can toggle twice.
Calling the same event's manual action recursively while it is active rejects.
A nested, distinct event may execute its own action. Existing active-element
and callback lifetime protections still apply; listener exceptions propagate
at the outer native boundary.

See [element state](./element-state.md), [text and tabs](./text-panels.md)
and [form controls](./controls.md).
