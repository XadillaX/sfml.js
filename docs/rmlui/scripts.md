# Document scripts

`NodeScriptHost` selects JavaScript execution for documents loaded by a
`Context`. Create the host after `initialise`, then call `setScriptHost`
before loading documents. Existing documents keep their selected host when
the Context changes or disables its selection.

```js
const { NodeScriptHost } = require('sfml.js-rmlui');
const host = new NodeScriptHost({
  handlers: {
    save(event, document, context) {
      document.title = context.name;
      event.stopPropagation();
    },
  },
});

context.setScriptHost(host);
const document = context.loadDocumentFromMemory(`
<rml><head/><body>
  <button id="save" onclick="save">Save</button>
</body></rml>`, 'forms/panel.rml');

document.getElementById('save').click();
```

Named handlers are captured once. Replacing fields in the original options
object does not replace registered callbacks. An unknown name fails document
loading when inline expressions are disabled.

## Trusted sources

Both source options default to false. `allowInline: true` enables `<script>`
contents and `on*` JavaScript expressions; `allowExternal: true` enables
`<script src="...">`. External sources use RmlUi's active `FileInterface`,
including custom file roots. Disabled external execution performs no file read.
A Node VM context is not a security boundary; enable only trusted sources.

Scripts share one VM context per document. `globals` captures additional
values; `document`, `context`, `event` and `element` are reserved names.
The first two values are checked RmlUi facades. During an `on*` callback,
`event` is the live event and `element` is its current target. Nested events
restore the previous values when they return.

RmlUi executes scripts in header resource order at `</head>`, before body
parsing. Query body elements from a later event rather than a head script.
Inline stack locations use the RML source URL and original line offsets.
External stacks use the resolved file path and source line.

## Errors and lifetime

Script exceptions propagate unchanged to the initiating API. A failed load
does not attach its document. Scripts and handlers must return synchronously;
Promise results are rejected and their rejection is consumed.

`document.loadInlineScript(content, sourcePath, sourceLine = 1)` and
`document.loadExternalScript(sourcePath)` call the native virtual hooks.
Ordinary documents preserve the upstream empty hook implementation.
`context.setScriptHost(null)` selects ordinary documents for later loads.
Global body and event-listener instancers remain registered.

Native document destruction releases its VM session even if an expired
Document facade remains reachable. Retained document/context facades check
their native lifetimes; live event operations expire after dispatch.
Destructive runtime reentry is rejected during callbacks. Factory-created
script listeners use the normal checked `EventListener` facade and reject
dispatch after their original script document expires.

## Native script objects

`Context`, `Element` and `RmlEvent` implement `ScriptInterface`.
`setScriptObject(object)`
registers a host object on the actual native instance; `getScriptObject()` calls
its native virtual method and returns that same object. Pass null to remove the
association. Unregistered instances and cloned elements return null.

```js
const state = { count: 0 };

element.setScriptObject(state);

if (element.getScriptObject() === state) {
  state.count++;
}

element.setScriptObject(null);
```

Attached native trees retain their script objects. Detached elements retain
them through their JS owner, so an object referring back to its Element can
still be collected. Reparenting preserves the association. Native destruction
and shutdown release it; stale facades remain invalid after reinitialisation.
Calls in unchanged frames do not scan script-object registrations.

Successive listeners see one association on their shared native event. Each
borrowed event facade expires after its own callback. Owned events retain the
object through their JS handle and allow cycles to collect; Factory transfer
promotes retention until Native releases the event. Setting a script object
does not change native RTTI. A foreign native `GetScriptObject` override needs
its own registered adapter and cannot be overwritten through this API.

Native extensions register the exact override result and its JS owner through
`sfmlrmlui::RegisterNativeScriptObject` in `native/scripting/rmlui-script-object.h`.
Each interface keeps a separate association even when several return the same
opaque pointer. The native override remains authoritative after registration.
`RegisterNativeObjectVariant` in `native/values/rmlui-variant-objects.h` separately
registers a real `void*` allocation. Its native owner invalidates the shared slot
before releasing the allocation; Variant and Lua copies then return null.
Copied values retain JS owners through the existing native value-owner edges.
These C++ entry points do not expose addresses or add JS registration calls.

Arbitrary Native `ScriptInterface` Variant sources use
`RegisterNativeScriptVariant` in `native/values/rmlui-variant-pointers.h`.
The extension owns the real interface and its registration, invalidating the
registration before destroying the interface. JS receives the original object,
typed as `VariantScriptObject`; `{ type: 'scriptinterface', value: object }`
selects the pointer destination. Copies, moves, DOM values and Lua snapshots
share the expiry slot without extending the native allocation's lifetime.
Unregistered pointers and shared slots are rejected before dereferencing.
This registration is independent of the `GetScriptObject` association, whose
query calls the virtual getter once. Native unregisters that association with
`SetScriptObjectForBinding(nullptr, {})`, releasing its owner edges.

Registered Contexts retain script objects until removal. Independently owned
Contexts use their JS root edge and allow object/Context cycles to collect.
Context inherits the actual native base class identifier. Its `release()` only
releases independently owned instances; registered Contexts use `remove()`.

## Lua scripts

`LuaScriptHost` owns an actual Lua 5.4.8 VM. Create it after `initialise`
and select it with the same `context.setScriptHost` method. Documents sharing
one Lua host share its globals; separate hosts have independent VMs. Switching
the Context's host preserves the interpreter of documents already loaded.

```js
const { LuaScriptHost } = require('sfml.js-rmlui');
const lua = new LuaScriptHost({ allowInline: true });

lua.execute(`
function save(event, element, document)
  document.title = element.id
  event:StopPropagation()
end
function sum(a, b) return a + b end
`, 'handlers.lua');
context.setScriptHost(lua);
const document = context.loadDocumentFromMemory(`
<rml><head/><body>
  <button id="save" onclick="save">Save</button>
</body></rml>`, 'forms/lua-panel.rml');

document.getElementById('save').click();
lua.call('sum', 1n, 2n); // 3n
```

Both source flags default to false. A named Lua function can be used as a
handler without enabling source execution. `allowInline` enables head scripts
and inline handlers; `allowExternal` enables external script files. Lua uses
RmlUi's active file interface and retains source paths and line offsets.

`execute(source, path = '', line = 1)`, `call(name, ...args)`,
`getGlobal(name)` and `setGlobal(name, value)` exchange scalar values:
null, boolean, finite number, string and signed 64-bit bigint. Lua integer
results return bigint. Embedded null bytes in strings survive conversion.
Tables, functions and native pointers are not scalar bridge values.

Within Native/Lua, `document:GetAttribute(name)`, attribute iteration and event
parameters use RmlUi Variants. `Vector2f`, `Colourb` and `Colourf` userdata can
be passed back as native values. Checked Element, Context and Event userdata
become guarded ScriptInterface pointers; their copies share the original
destruction or dispatch expiry. They never expose native addresses.

Registered opaque pointers, Vector3/4 and aggregate Variant storage use owned
Lua userdata. Copying through an event preserves the native value and pointer
identity. Byte and char values read their actual storage. Unsigned 64-bit
values above Lua's signed integer maximum use owned userdata to avoid wrapping.
Foreign opaque userdata is rejected. The Node scalar methods remain scalar.

Lua copies remain alive until Lua GC or VM shutdown. Documents, listeners,
models, instancer registrations, allocated elements and captured Lua functions
retain their VM's pointer values through their actual owners. Independent
Context and host/object cycles remain collectible. Shutdown and explicit
element destruction clear old pointer edges even if invalid facades survive.
Unchanged frames do not scan those owners.

`compile(source, path = '', line = 1)` returns a `LuaFunction` without executing
the source. `getFunction(name)` captures the current named function; later
replacement of that global does not change the captured reference.

```javascript
const chunk = lua.compile('local a, b = ...; return a + b, "ready"');
const results = chunk.callResults(2, 9007199254740993n, 2n);

// [9007199254740995n, "ready"]
chunk.release();
```

`LuaFunction.call(...args)` copies the first scalar result.
`callResults(resultCount = 0, ...args)` executes once, copies exactly that many
results, pads missing results with null and discards extras. Both restore the
outer Lua stack, including after errors. A call from Node retains the enclosing
Lua event/document globals; a Node event does not select a new Lua scope.
The native reference retains its VM after host GC. `release()` drops that
reference and VM retention; subsequent calls or releases reject. Shutdown
invalidates every function. `executeFile(path)` explicitly reads and executes
through the selected RmlUi FileInterface, independently of document
`allowExternal`, retaining the file path in error messages.

DOM listeners and data events execute directly in Native/Lua. The scoped
`document`, `context`, `event` and `element` globals restore their outer values
after nested dispatch. Retained events and destroyed DOM proxies reject access.
Lua standard libraries are available; source policy applies to trusted scripts.
Coroutines share their host's registry and globals while keeping independent
call stacks. They can create listeners, models and instancers, yield, and resume.
Recursive invocation of the same data-event callback is rejected.

Inside a document script, `context:OpenDataModel(name, table)` returns a managed
model. Opening the same model in the same host returns its existing wrapper.
Names belong to their Context; two Contexts may use the same name independently.
Nested table writes dirty the owning root variable, and replacing an array or
table updates existing native data addresses. Lua arrays use one-based indices;
RML data expressions use zero-based indices. Removing a model through Lua,
Node or Context destruction expires all retained model/table proxies. Native
models retain their VM through host GC; variable definitions are released after
native controllers and views.

`ElementInstancer.new(function(tag) ... end)` creates a managed Lua allocator.
Register it with `rmlui:RegisterTag(tag, instancer)` outside callbacks. Return
a detached owned `Element.new(tag)`, an owned `ElementPtr`, or nil. Registration,
produced elements and direct Node Factory facades retain the allocator and VM.
Tag replacement preserves old elements' release paths and original allocators.
Contexts created by `rmlui:CreateContext` inherit the current Lua host.

`shutdown` closes all native Lua VMs after DOM/model teardown. VM finalizers
cannot create Contexts or reenter destroyed RmlUi objects.

## Native Lua type extensions

Native consumers use `Rml::Lua::LuaType<T>` and their method/getter/setter
descriptors in the managed VM. `ExtraInit<T>` can register a constructor and
inherit Element tables before the custom tables override matching names.
Registered native Element subclasses must define RmlUi RTTI; the Element `As`
table checks that RTTI and returns nil for an incompatible subtype.

`push(..., true)` transfers allocation ownership to Lua GC. Borrowed Element,
Context and Event values retain their existing native expiry checks. A borrowed
custom value remains the extension owner's responsibility; its owner must keep
the allocation alive while Lua uses it. Methods retain their receiver during
GC and restore that root after errors. A nil method receiver returns nil.
Unknown property assignment retains the upstream ignored-assignment behavior.
`Element:SetAttribute` converts its input to a string.

Native `PushIndex` and `GetIndex` convert between zero-based `int` and one-based
Lua integers. The native range `[-2147483648, 2147483647]` maps to
`[-2147483647, 2147483648]`; Lua zero returns the native `-1` sentinel.
Out-of-range Lua input raises an error before narrowing. Native integration
uses checked managed hosts; arbitrary external VM pointers have no JS entrypoint.
