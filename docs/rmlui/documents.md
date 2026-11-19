# RmlUi documents and events

RML documents are persistent element trees. Load a document once, change its elements in response to application state, and call `context.update()` each frame.

For typed form elements, submission, text selection and select options, see
[form controls](./controls.md).

For memory, file and custom input, see [byte streams](./streams.md).

For subtree queries, font measurement, clipping snapshots and explicit layout,
see [element utilities](./element-utilities.md).

## Load a document

```js
const document = context.loadDocument('/absolute/path/to/panel.rml');

document.show();
```

For generated markup, use `loadDocumentFromMemory(rml, sourceUrl)`. Supply a source URL when relative stylesheets, images or templates need a base path. Both loaders throw if loading fails and return an initially hidden document.

Omitting `sourceUrl` uses `"[document from memory]"`; passing `""` keeps it
empty. Invalid types and embedded null bytes are rejected before loading.
The native parser records `document.sourceURL` when it encounters `<head>`.
Include that element when the document needs a source URL or linked resources.

`initialise(window, { fileRoot })` makes the file interface try that directory before the original path, including for `/assets/...`. It does not restrict filesystem access. Fonts must be loaded separately before the document.

## Native XML parsing {#xml-parser}

`BaseXMLParser` owns the upstream tokenizer. `parseEvents(stream)` collects
ordered `start`, `end` and `data` snapshots in one native entry, without
calling JavaScript for each token. Attributes and content are independent
copies. `XMLDataType.Text`, `CDATA` and `InnerXML` identify the data category.
Upstream explicit `<![CDATA[...]]>` sections join ordinary Text; registered
raw-content tags produce CDATA, and captured attributes produce InnerXML.

```js
const { BaseXMLParser, StreamMemory } = require('sfml.js-rmlui');
const source = new StreamMemory(Buffer.from('<panel key="ready">text</panel>'));

source.setSourceURL('views/panel.rml');

const tokenizer = new BaseXMLParser();

tokenizer.registerCDATATag('script');
tokenizer.registerInnerXMLAttribute('capture');
const events = tokenizer.parseEvents(source);

console.log(events);
```

Supply optional `handleElementStart(parser, name, attributes)`,
`handleElementEnd(parser, name)` and `handleData(parser, data, type)` callbacks
to the constructor when token handling requires synchronous JavaScript.
`parse(stream)` invokes them in native order; they must return `undefined`.
The Base public `handleElementStart`, `handleElementEnd` and `handleData`
methods also dispatch these virtuals outside a callback. Callback parser
references expire on return. Line numbers start at zero before parsing and
use one-based source lines during parsing. `getSourceURL()` requires an active
parse; direct virtual dispatch has no source URL.

`XMLParser(root)` retains a checked element or document and builds its DOM
in native code through `parse(stream)`. It does not support `parseEvents`.
Its structural start/end virtuals are protected and reject direct calls.
`XMLNodeHandler` supplies all three synchronous structural callbacks.
Use a native default handler to construct ordinary elements:

```js
const { XMLParser, XMLNodeHandler, StreamMemory } = require('sfml.js-rmlui');
const delegate = XMLNodeHandler.createDefault();

XMLParser.registerNodeHandler('panel', new XMLNodeHandler({
  elementStart(parser, name, attributes) {
    parser.pushDefaultHandler();

    return delegate.elementStart(parser, 'div', attributes);
  },
  elementEnd(parser, name) {
    return delegate.elementEnd(parser, name);
  },
  elementData(parser, data, type) {
    return delegate.elementData(parser, data, type);
  },
}));

const document = context.createDocument();
const parser = new XMLParser(document);

parser.parse(new StreamMemory(Buffer.from(
  '<body><panel id="panel">content</panel></body>')));
```

Start callbacks return an element already owned by the current parse subtree,
or `null`; end/data callbacks return a boolean. Promises are rejected.
`getParseFrame()` returns independent fields with checked element/handler
references. `getDocumentHeader()` returns an owned copy; prepare edits outside
the callback and call `setDocumentHeader(copy)` during parsing to write them
back. `pushHandler`, `pushDefaultHandler` and XML `handleData` require an active
parser. A callback may access its current parser and delegate a handler, but
cannot mutate the DOM, stream, registry or runtime.

Registration lowercases tags; `getNodeHandler` uses exact case-sensitive
lookup. An empty registration selects the default, while an empty lookup
returns `null`. Replacing a registration invalidates existing XMLParser and
borrowed handler references. Owned handlers and persistent CDATA tags may be
registered before initialization; new parsers adopt that setup.
`shutdown()` clears registrations and invalidates all parser/handler references,
including abandoned setup. Removing a context invalidates parsers whose roots
belonged to it. Unregistered callback cycles remain collectible.

## Native document headers {#document-header}

`DocumentHeader` owns an actual native `Rml::DocumentHeader`. Its `source`,
`title`, `templateResources`, `rcss` and `scripts` fields use upstream defaults:
empty strings and lists. Resource records use `{ path, content, isInline, line }`,
defaulting to `""`, `""`, `false` and `0`. Inline paths identify the content
origin; external RCSS/script paths are already resolved resource paths.

```js
const { DocumentHeader } = require('sfml.js-rmlui');
const header = new DocumentHeader({
  source: '/absolute/path/to/panel.rml',
  title: 'Panel',
  templateResources: [ 'base.rml' ],
  rcss: [{
    path: '/absolute/path/to/panel.rml',
    content: 'body { width: 320px; }',
    isInline: true,
    line: 4,
  }],
});

document.processHeader(header);
document.updateDocument();
document.show();
```

`processHeader` executes native template loading, then resource merging in
source order. Document rules override earlier template rules. It records the
document's own source/title, invokes script hooks and immediately hides the
document without dispatching a `hide` event. An empty header title stays empty
even if a template has a title. If no RCSS loads, the existing stylesheet
remains installed. Call `updateDocument()` before layout queries and `show()`
to display the processed document. A context-free detached document retains
parsed RCSS but does not compile its media blocks. Assign its container to a
context-owned document to apply those rules.

`header.replace(input)` validates and replaces all fields in one native entry;
omitted fields reset to defaults. Field setters copy lists and records;
`snapshot()` copies all fields in one entry. Editing an input or output object
never changes native storage. Paths reject embedded null bytes; line offsets
must fit native int32. Getter exceptions preserve the receiver's previous
storage, and runtime restart invalidates old headers and documents.

`mergeHeader(other)` runs the upstream merge: existing nonempty source/title
win, template paths resolve against `other.source`, and RCSS/scripts append
without rewriting their paths. Self-merge uses a source snapshot.
`mergePaths(target, source, basePath)` and `mergeResources(target, source)`
return independent merged target arrays. Assign the result to a header field
to retain it. These operations do not mutate input arrays.

`document.title` calls native GetTitle/SetTitle and does not rename the SFML
window. `hide()` dispatches `hide`, updates visibility/focus and keeps the
document in lookup. `close()` dispatches `unload` and queues destruction;
wrappers remain readable until the next `context.update()` destroys them.

Header script records preserve source order and inline line offsets.
The Core base document's script hooks are empty. Select a
[NodeScriptHost or LuaScriptHost](scripts.md) before loading to execute
trusted JavaScript or Lua.

## Edit elements

Concrete element classes also accept `new Constructor(tag, attributes = {})`.
The tag is independent of native class identity; for example,
`new ElementFormControlInput('field', { value: 'ready' })` constructs a native
input with initialized text defaults. Native Element and ElementText use their
pooled allocators. Other concrete classes use their own native allocators.
JS subclasses retain the nearest registered native type. The abstract
ElementFormControl cannot be constructed directly.

```js
const { ElementFormControlInput } = require('sfml.js-rmlui');
const field = new ElementFormControlInput('input', { value: 'ready' });

document.appendChild(field);
document.removeChild(field);
field.release();
```

Construction copies attributes, captures the runtime generation before getters
and rejects restart during conversion. It does not change Factory registrations
or notify plugins of creation. Native widgets still use Factory for their
internal children. Custom ElementInstancer callbacks can return these detached
owned elements, retaining allocator provenance through cloning and release.

`release()` rejects attached, borrowed and active subtrees, then runs native
destructors synchronously. All subtree aliases become invalid. A surviving
child wrapper retains its detached owner until explicit release or collection;
GC destroys an unreferenced subtree through the same native allocator.
Construction and release update ownership edges only for the affected subtree.
Construction uses one generation capture and one native snapshot transfer;
release uses one native entry. These are configuration operations.

In the [counter](../../packages/sfml.js-rmlui/examples/demo.cjs), add this after loading the document:

```js
const button = document.getElementById('increment');
const counter = document.querySelector('#counter');

if (!button || !counter) {
  throw new Error('Counter elements are missing');
}

button.setClass('ready', true);
button.setAttribute('title', 'Increase the counter');
button.setProperty('width', '180dp');
```

Queries return `null` when no element matches. `setProperty` reports whether RCSS accepted the value; `removeProperty` removes the inline override. `innerRML` parses markup and replaces child elements. Destruction releases their listeners automatically and invalidates all aliases. Query the new children afterwards.

`getElementById` searches the entire owning document, including siblings of this element. `querySelector` searches descendants only. RmlUi also accepts the special IDs `#self`, `#document` and `#parent`.

## Register and remove a listener

```js
let clicks = 0;

function increment(event) {
  clicks++;
  counter.innerRML = `Clicks: ${clicks}`;
  console.log(event.type, event.targetId);
}

button.addEventListener('click', increment);
// Optional: stop receiving clicks while keeping the button alive.
button.removeEventListener('click', increment);
```

Use the same element, function, event type and capture flag for removal. The default capture flag is false. A function may be shared across registrations; an identical registration is idempotent and unmatched removal does nothing. Removal, element destruction and runtime shutdown release callbacks automatically. A listener may remove itself or other listeners during dispatch.

Classes, styles, titles, target-local ordinary attributes and unrelated subtrees may change synchronously in a listener, including the counter above. Replacing a subtree containing an active event target or native call receiver is rejected before mutation. Attribute set/removal conservatively applies the same subtree guard, including ordinary attributes on ancestors. Changing or removing `type` on an active input is also rejected because it can destroy the native widget executing the callback. Runtime teardown, document unloading and recursive update/input are rejected during callbacks; schedule these operations after dispatch with `queueMicrotask`. Listener exceptions propagate from the input or other native operation that invoked them.

Listeners run synchronously. `RmlEvent` snapshots `type`, `id`, `phase`, `targetId`, `target`, `currentTarget`, `isInterruptible`, `parameters` and `unprojectedMouseScreenPosition`. The targets are checked element wrappers: repeated queries and event targets preserve `===` identity even without an id or with duplicate ids. `id` is RmlUi's event **type** identifier, not a dispatch sequence number. Native element destruction still invalidates the wrappers.

`isPropagating`, `isImmediatePropagating`, `stopPropagation()` and `stopImmediatePropagation()` access the live native event during that listener's callback. They throw after the callback returns; copied fields remain readable. Stopping propagation finishes listeners at the current DOM level, while stopping immediate propagation skips the remaining listeners too. Both methods have no effect on non-interruptible events. RmlUi uses `EventPhase.Capture = 1`, `Target = 2` and `Bubble = 4`. At the target, ordinary listeners execute before capture listeners, preserving registration order within each group.

Parameters preserve booleans, numbers, strings and null. Native signed and unsigned 64-bit integers become exact BigInts; JS BigInts must fit the range `-2^63` through `2^64 - 1`. Vectors use `{ x, y }`, `{ x, y, z }` or `{ x, y, z, w }`. Colours use `{ type: 'colourb' | 'colourf', red, green, blue, alpha }`; byte channels are integers from 0 to 255, and float colours and vectors use native float precision. Typed element values and the native `drag_element` parameter resolve to checked elements. Unsupported native owner types and arbitrary pointers throw instead of converting to strings.

Parameter getters may run JavaScript. Dispatch validates the receiver and element references after those getters finish, and throws if either was destroyed. Element-valued parameters remain protected against subtree destruction until dispatch returns.

```js
button.addEventListener('counter-update', event => {
  console.log(event.target === button, event.parameters.total);
  event.stopPropagation();
});
button.dispatchEvent('counter-update', { total: 9007199254740993n });
button.click();
```

`dispatchEvent(type, parameters?, options?)` supports nested dispatch. Omit options to use RmlUi's event specification, or pass `{ interruptible, bubbles }`; omitted members then default to true. The result says whether propagation continues. `click()` calls `Rml::Element::Click`. Nested callbacks have separate event leases: the outer callback remains live while the inner callback runs. The first uncaught listener error is rethrown at the outermost native entry and suppresses later JS listeners until that entry returns.

`context.processEvent(event)` returns propagation for keyboard, text and wheel events. For mouse and touch input, false means an element is interacting, independently of propagation controls. Ignored events return true. Handle the native window close event regardless of this result.

## Default-constructed events {#default-events}

`new rmlui.RmlEvent()` creates an owned native `Rml::Event()` after runtime
initialization. Its target and current element are null, type and parameters
are empty, id is `EventId.Invalid`, phase is `EventPhase.None` and mouse screen
position is `{ x: 0, y: 0 }`. It is noninterruptible. Accordingly, the public
`target` type is `Element | null`.

```js
const event = new rmlui.RmlEvent();
const listener = new rmlui.EventListener(value => {
  console.log(value.target, value.getParameter('count', 0));
});

listener.processEvent(event);
event.release();
listener.release();
```

An owned event remains live until explicit release, GC or shutdown. Manual
listener callbacks receive a separate lease that expires when they return.
`setCurrentElement(element)` observes that node independently of the target;
replacing or clearing it releases the old observation. Destruction of a
referenced node rejects subsequent native access, while `release()` still
works. `isType(nameOrId)` compares retained type/id snapshots even after release.

## Event specifications

Element and context listeners accept event names or numeric `EventId` values.
The same name/id pair shares listener identity, so registering both is
idempotent and either form can remove the registration. `context.getRootElement()`
returns the canonical root element; context listeners attach to that root.

`registerEventType(name, interruptible, bubbles, defaultActionPhase?)` returns
the native id. Re-registering a custom name replaces its flags without changing
its id. Built-in types keep their existing flags. Custom ids expire at shutdown.
`DefaultActionPhase.None`, `Target` and `TargetAndBubble` control native default
actions after listeners; the default is `None`. Dispatch options override only
`interruptible` and `bubbles`, retaining the registered default action phases.
Stopping an interruptible click prevents a checkbox's native toggle.

## Context registry and scheduling

`getContext(nameOrIndex)` preserves wrapper identity, and `getNumContexts()`
counts active contexts. A missing name or out-of-range index returns `null`.
This follows the pinned 6.3 implementation; its header's index-clamping comment
is inaccurate. Index order follows the native registry. `removeContext(name)`
returns false on a miss; successful removal and `context.remove()` return true
and invalidate aliases. `context.name` validates native lifetime.

`context.dimensions` is a shared native view with getter-only fields. It
reflects `setDimensions()` and forwarded resize events, including within resize
listeners. Width and height are nonnegative int32 values. The backing storage
survives wrapper GC and becomes zero on native destruction.

`setDensityIndependentPixelRatio(ratio)` sets a positive finite manual ratio
that persists through update and resize. Passing `null` restores synchronization
with the bound window. `requestNextUpdate(seconds)` reduces the next native
update delay; zero requests an immediate update. `getNextUpdateDelay()` preserves
`Infinity` when nothing is scheduled. `update()` resets the delay before native
elements request their next deadlines; these APIs do not start a JS timer.

## Direct input

The same context accepts direct input without constructing SFML events. `KeyIdentifier` exposes all upstream `KI_*` names, including the custom range 177–250. `KeyModifier` exposes the seven upstream `KM_*` flags; combine them with bitwise OR. Modifier arguments default to zero.

```js
context.processKeyDown(rmlui.KeyIdentifier.KI_A, rmlui.KeyModifier.KM_CTRL);
context.processKeyUp(rmlui.KeyIdentifier.KI_A);
context.processTextInput('水😀');
context.processTextInput(0x1f642);
context.processMouseMove(40, 80);
context.processMouseButtonDown(0);
context.processMouseButtonUp(0);
context.processMouseWheel({ x: 1, y: 0 });
context.processMouseLeave();
```

Keyboard, text and wheel methods return whether propagation continues. Mouse methods return whether no element is interacting; `isMouseInteracting` exposes the inverse hint. Buttons use the last submitted mouse position: left 0, right 1, middle 2. Window coordinates are physical pixels. Wheel vectors are positive right/down; a numeric delta retains the deprecated vertical-only overload. Strings dispatch one `textinput` event, while numbers represent Unicode scalars; invalid scalars and isolated UTF-16 surrogates throw. Direct text preserves control characters.

`processTouchStart`, `processTouchMove`, `processTouchEnd` and `processTouchCancel` accept a list of `{ identifier, position: { x, y } }`. Identifiers are exact nonnegative native `uintptr_t` values; use `bigint` above `Number.MAX_SAFE_INTEGER`. Positions become native float coordinates. The whole list is validated before forwarding, every entry is processed, and results are combined with logical AND. Empty lists return true. Unknown move/end identifiers return true; unknown cancel identifiers return false. Cancel has no modifier argument. RmlUi 6.3 simulates mouse input for touches; cancellation releases the left button and can produce a click.

SFML key forwarding uses the event's modifier snapshot. System keys map to `KI_LMETA/KI_RMETA` on macOS and `KI_LWIN/KI_RWIN` elsewhere. Pointer events sample live modifier keys; SFML does not expose lock-toggle states, which remain clear. Direct input can supply all seven flags. SFML touch events become one-entry lists. `TextEntered` converts CR to LF and skips other control characters. Input methods reject calls from an active RmlUi callback; use nested `dispatchEvent` when appropriate. Callback errors reach the outer input call, and retained event controls expire even after shutdown.

## Detached nodes and DOM ownership

`document.createElement(tag)`, `document.createTextNode(text)` and
`element.clone()` return native-owned detached nodes, or `null` if the native
factory fails. Text is literal; clone copies native attributes, styles and
content without copying JS listeners. Detached nodes have no owner document.

```js
const panel = document.createElement('div');
const label = document.createTextNode('Hello <world> & 世界');

if (panel && label) {
  panel.appendChild(label);
  document.appendChild(panel);
  const detached = document.removeChild(panel);

  document.insertBefore(detached, null);
}
```

`appendChild(child, domElement = true)` and `insertBefore(child, adjacent)`
transfer a detached node exactly once and return the same wrapper. Remove an
attached node first; a detached subtree without nested documents can then move
to another context.
`removeChild` returns the owned detached child or `null` for a non-child.
`replaceChild(child, replaced)` returns the owned removed node; if the reference
is `null` or not a child, it appends and returns `null`. `insertBefore` also
appends on a missing reference, otherwise inheriting its DOM/non-DOM status.
Cycles, insertion of context roots and transfers of active native/event
subtrees throw before mutation. Debugger-owned documents remain protected.

A real document can be removed from its context root and inserted under another
element in the same live context, as in the original `basic/demo` sandbox.
Documents keep their own owner-document identity and borrowed context, including
when detached. The context root accepts only its own documents as DOM children.
`getNumDocuments()` counts documents directly under the root; nested documents
need their own `updateDocument()` call. `close()` and `unload()` queue destruction
only for root documents. Nested or detached documents remain alive until their
owning tree is destroyed. Closing the outer document destroys its nested tree;
removing a context destroys independently owned trees containing its documents
before releasing the context.

During `dragdrop`, the checked `drag_element` parameter may be removed and
inserted synchronously, preserving the upstream inventory algorithm. The
binding retains its native owner and callbacks through the outer native call.
This permission does not apply to its ancestors, ordinary parameter aliases,
event targets or active method receivers. Native detachment silently cancels
the drag; upstream does not dispatch `dragend` after removing that node.

`getNumChildren()` counts DOM children; `getNumChildren(true)` includes internal
children. `getChild(index)` can access both, returning `null` out of range.
First/last child, sibling and `hasChildNodes()` queries follow DOM membership.
`querySelectorAll`, `getElementsByTagName` and `getElementsByClassName` return
snapshot arrays of live wrappers. `contains` includes self; `closest` searches
ancestors excluding self, matching the pinned native implementation.
Native widget internal children can be read but cannot be removed or replaced:
their widgets retain raw native references. Non-DOM nodes inserted through
the JS ownership APIs remain transferable, even after their wrappers are
collected and obtained again.

A retained descendant keeps its detached native tree alive. An unreachable
detached tree is collectible even when listeners capture its wrappers.
Insertion transfers ownership to the native parent; listeners survive both
detachment and reinsertion. Destruction invalidates every borrowed alias.

## Document stack, focus and layout

`context.createDocument(instancerName = 'body')` creates an empty document and
returns `null` on factory failure. `getDocument(idOrIndex)` returns the canonical
document or `null`; `getNumDocuments()` excludes documents queued for destruction.
Indices follow stack order. `setDocumentsBaseTag(tag)` and
`getDocumentsBaseTag()` control the tag of subsequent documents, initially `body`;
they do not change the factory name.

`context.unloadDocument(document)` and `unloadAllDocuments()` dispatch unload
synchronously, remove documents from lookup, and defer destruction until
`context.update()`. Repeating an unload before destruction is harmless.
`document.getContext()` returns the canonical context, or `null` for a detached
factory document. All handles reject access after actual destruction.

```js
const { ModalFlag, FocusFlag, ScrollFlag, ScrollBehavior } = require('sfml.js-rmlui');

document.show(ModalFlag.Modal, FocusFlag.Auto, ScrollFlag.None);
document.show(ModalFlag.Keep, FocusFlag.Keep, ScrollFlag.Auto);
context.setDefaultScrollBehavior(ScrollBehavior.Instant, 1);
```

`show()` defaults to `None / Auto / Auto`. Its first argument also accepts
`false / true` as `None / Modal`. `ModalFlag.Keep` preserves modal state.
`FocusFlag.None` makes no focus request; `Document` focuses the document, `Keep`
restores its last focused element, and `Auto` chooses the first tabbable
`autofocus` element or the document. `ScrollFlag.None` suppresses focus scrolling;
`Auto` scrolls the newly focused child into view. `isModal()` is true only when
the modal flag is set and the document is visible. Hiding returns false without
clearing the stored flag; showing again with `ModalFlag.Keep` restores it.

`findNextTabElement(current, forward, wrapAround = true)` searches without
changing focus. The starting element must belong to that document.
`context.getFocusElement()` and `getHoverElement()` return live wrappers or
`null`. `unfocusDocument(document)` removes focus history and requests the
previous focus; an active modal can still refuse that request.

Use document `pullToFront()` / `pushToBack()`, or context
`pullDocumentToFront(document)` / `pushDocumentToBack(document)` to change stack
order. Context document operations reject documents from other contexts.

After changes, call `context.update()` before input/rendering.
`document.updateDocument()` updates that document's styles and layout for
geometry queries, without flushing pending context destruction.
`getElementAtPoint(point, ignoreElement = null, element = null)` uses physical
pixel coordinates and current layout, including transforms, clipping and modal
focus. It can ignore a subtree or restrict the search root. Element arguments
must belong to this context; its root is valid even though it has no owner
document. Coordinates must remain within int32 range after float conversion.
Transform matrices refresh during `render()`, so transform changes require a
render before transformed hit tests. RmlUi 6.3 compares inverse-projected points
against ancestor clip rectangles; translated clipping can therefore differ from
the visual boundary. The binding preserves this native behavior.
`setDefaultScrollBehavior(behavior, speedFactor = 1)` requires a positive finite
float speed; setting the default to `Auto` selects smooth scrolling.

## Typed event parameter conversion

`event.getParameter(name, defaultValue)` reads the live native parameter using
RmlUi's `GetParameter<T>` conversion rules. It is available only while that
listener callback is active; nested dispatch does not expire the outer
callback. Retain `event.parameters` for raw values after the callback.
Modifying that JS snapshot does not modify the native parameters.

```js
element.addEventListener('change', event => {
  const value = event.getParameter('value', 0);
  const text = event.getParameter('value', '');

  console.log(value, text, event.isType('change'));
});
```

The non-null default selects the result type: number uses double, BigInt uses
int64 (uint64 when the default exceeds INT64_MAX), and vectors/colours return
copies. Missing parameters return the default. Native conversions differ from
JavaScript: a nonnumeric string becomes zero with a number default, but retains
a BigInt default. Unsafe number/string-to-integer overflow throws. Owned
transform, animation, transition, decoration and effect defaults use their
typed native adapters. Generic pointer-to-number/string conversion is rejected.

`event.getElementParameter(name, defaultValue = null)` is the checked element
pointer equivalent. It returns the canonical element or a live fallback when
the parameter is missing or cannot convert. It accepts native ScriptInterface
element values and the exact upstream `drag_element` pointer contract.
Arbitrary pointers are rejected. Every call checks the native event and its
owned references; callback return expires a borrowed event. A returned element
keeps its own normal lifetime and becomes invalid when that node is destroyed.
Raw element snapshots remain available through `parameters`. Persistent
attributes do not accept borrowed element pointers.

`event.isType(nameOrId)` implements both native equality operators against the
retained type/id snapshot and remains available after the callback.

## Text bytes and mouse cursors

`context.processTextInput(text)` accepts Unicode strings or scalar numbers.
`context.processTextInputChar(byte)` selects the native `char` overload: integer
bytes 0–127 dispatch ASCII, including control characters; 128–255 return `false`
without dispatch. Both return whether the event remains propagating.

`context.enableMouseCursor(enabled)` requires a boolean. The next mouse update
refreshes the native cursor when enabled; disabling it stops RmlUi from changing
the system cursor. It does not hide the cursor. Removed contexts reject both
operations.

## Native lifetimes

| Operation | Effect |
| --- | --- |
| `document.hide()` | Hide while keeping the document and wrappers alive. |
| `document.close()` / `unload()` | Dispatch `unload` synchronously and schedule destruction at `context.update()`; wrappers remain readable until actual destruction. |
| `context.remove()` | Destroy the context and all its documents. |
| `shutdown()` | Invalidate every context, document and element wrapper. |

Wrappers share native validity. JS references retain owned detached trees, but
cannot prevent a native parent or context from destroying attached elements.
Accessing a destroyed object throws. Recreating a context with the same name
or reinitializing the runtime never revives old wrappers. Retained context
dimensions become zero after removal.

The process-wide runtime belongs to the Node.js environment and thread that initialized it. Workers may import the addon and query its version, but foreign runtime access throws. Owner-environment cleanup releases native resources without invoking JavaScript listeners. Shut down RmlUi before closing its render window.
