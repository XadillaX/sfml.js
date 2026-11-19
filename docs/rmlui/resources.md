# Renderer resources

Initialise RmlUi before using these APIs. Resource mutations belong to the
runtime's owner thread and reject calls from event callbacks.

```ts
import * as rmlui from 'sfml.js-rmlui';

const renderer = rmlui.getRenderInterface();
const context = rmlui.createContext('overlay', 800, 600, renderer);
const sources = rmlui.getTextureSourceList();

for (const source of sources) {
  rmlui.releaseTexture(source, context.renderInterface);
}

rmlui.releaseCompiledGeometry(renderer);
```

| Operation | Effect |
| --- | --- |
| `getRenderInterface()` | Return the selected/default native renderer, or null before selection and after shutdown. |
| `createRenderInterface(window)` | Create a separate SFML renderer and resource cache. |
| `setRenderInterface(renderer \| null)` | Select the default before initialization; null restores automatic selection. |
| `context.renderInterface` | Return the renderer used when creating this context. |
| `getTextureSourceList()` | Copy file-source URLs from all managers; preserve native order and duplicates. |
| `releaseTexture(source, renderer?)` | Return true only when a loaded texture handle was released. |
| `releaseTextures(renderer?)` | Release loaded file and generated textures; reload on subsequent use. |
| `releaseCompiledGeometry(renderer?)` | Release compiled handles while retaining meshes for recompilation. |
| `releaseRenderManagers()` | Release managers with no contexts; also release font resources and update active contexts. |

Omit the renderer or pass `null` to release resources in **all** renderers.
Pass an opaque `RenderInterface` to restrict the operation to that renderer.
Each independently created interface has a separate cache, even on the same
window. Use URLs returned by `getTextureSourceList()` exactly: path resolution
can change markup paths, including a leading slash. The list includes cached
sources whose handles were released. Generated textures have no source URL.

Renderer references remain valid after removing contexts or releasing unused
managers. They become invalid at shutdown, including across reinitialisation.
Selected renderers and interfaces used by Native managers or preloading retain
their native windows until shutdown. Unused interfaces can be collected.
Keep those windows open until then. An additional renderer does not replace
the default system interface or alter the window's high-DPI setting.

Before `releaseRenderManagers()`, reattach or collect all detached elements.
They may retain native geometry or callback textures; the binding rejects
cleanup while any detached owned tree survives. Nodes that have belonged to
one renderer cannot move to another renderer: native resources retain their
original manager. Use `clone()` to create an independent subtree. Transfers
between contexts sharing a renderer preserve node identity.

See [fonts](fonts.md) for font-face storage and cache lifetime.

## Compiled filters and shaders

`context.getRenderManager()` and `element.getRenderManager()` return the
canonical manager wrapper; an element without a manager returns `null`.
Contexts using the same renderer share that manager.
`new RenderManager(renderer)` instead owns an independent native manager.
The runtime retains independent managers through shutdown, including native
font-layer texture caches after JS wrapper collection. Shutdown releases
fonts and cached glyph textures before destroying those managers.

```ts
const manager = context.getRenderManager();
const compiled = manager.compileFilter('blur', { sigma: 2 });
const handles = new rmlui.FilterHandleList();

compiled.addHandleTo(handles);
console.log(compiled.isValid, handles.size);
compiled.release();
handles.clear();
```

`Filter.compileFilter(element)` invokes the native virtual with the element's
manager, including resolution of relative lengths. `compileFilter` and
`compileShader` return `CompiledFilter` and `CompiledShader` owners.
Returning a compiled filter from a custom `Filter` callback transfers ownership
to RmlUi and empties the JS resource. Each returned resource may transfer only
once and must belong to the receiving element's manager.
Both offer `isValid`, idempotent `release()`, and `invalidHandle()` returning
`0n`. Default constructors create empty resources. Unsupported or failed
compilation also produces an empty resource; required malformed parameters
throw. Parameters copy scalar, vector, colour and colour-stop values.

`addHandleTo` ignores empty resources and preserves order and duplicates.
The list retains native resources after wrapper GC; explicit release empties
the underlying resource without removing existing entries. `size` counts
entries, and `clear()` drops their ownership. Pointer values are not exposed.
Shutdown releases all compiled resources before their managers. Global
`releaseRenderManagers()` invalidates borrowed unused managers and their
resources, but preserves active shared managers and independent managers.

The renderer implements all ten built-in filters, saved alpha masks, layers,
gradients, creation and explicit shader sources. See [rendering](./rendering.md)
for parameters and native rendering contracts.
Resource lifetime tests establish the operations they exercise.

Uncached texture loading checks both seeks, file length and the exact read
count. It closes an opened handle once on failure or exception and leaves
output dimensions unchanged until upload succeeds. File images premultiply
straight alpha once; generated RGBA bytes are already premultiplied.
Invalid generated dimensions, missing/short pixel spans and failed GPU resize
return zero from the native renderer without recording a successful upload.
Application callback exceptions propagate through the runtime boundary.

## Mesh, geometry and texture views

`new Mesh(vertexCount, indexCount)` allocates native vectors. `vertices` is a
writable `Uint8Array` of 20-byte `Rml::Vertex` records: float32 x/y at offsets
0/4, premultiplied RGBA bytes at 8–11, and float32 u/v at 12/16.
`indices` is an `Int32Array` with three indices per triangle. Both views
retain storage after mesh collection or shutdown. `resize()` preserves the
common prefix in fresh storage; obtain new views after resizing.

`manager.makeGeometry(mesh)` validates finite coordinates, triangle counts and
index bounds, snapshots the native vectors and empties a nonempty source.
Old views cannot modify the geometry. An empty index vector produces empty
geometry and leaves the source intact. `mesh.isValid` follows the native
boolean conversion and only tests whether indices are nonempty.

`Geometry.render(translation, texture?, shader?)` rounds translation using
RmlUi and accepts textures and shaders from the same manager. Flush pending
sfml.js window commands before direct RmlUi drawing. `getMesh()` returns an
independent mutable copy and throws for empty or released geometry.
`release()` returns the native mesh; `GeometryReleaseMode.ClearMesh` discards
it. Repeated release returns an empty mesh. Mesh equality uses native values.

`manager.loadTexture(source, documentPath?)` returns a cached `Texture` view.
The default system path resolver strips an initial `/` from `source`; use a
relative source with its document path when needed. Loading is lazy:
`isValid` means a database entry exists, while `getDimensions()` loads the
image and returns zero dimensions on failure. `equals()` compares native
manager/database identity. `new Texture()` creates an empty view.

Geometry and texture views retain independently owned managers across wrapper
GC. They become invalid when a borrowed unused manager is released, or at
shutdown. `releaseTexture` and `releaseCompiledGeometry` only evict GPU data:
live views and mesh geometry remain reusable. [Callback textures](
./render-state.md#callback-textures) provide lazy byte generation, checked
handle transfer and layer snapshots with retained native ownership.

## Typed vertices and spritesheets

`new Vertex()` owns one native vertex; `mesh.getVertex(index)` maps an existing
entry. `position`, `colour` and `texCoord` copy fields on read and write all
components on assignment. `positionView`, `colourView` and `texCoordView` share
native memory. New vertices have zero vectors and opaque black colour
(`red/green/blue = 0`, `alpha = 255`). Colour writes expect premultiplied bytes;
they do not premultiply automatically. `equals()` compares field values, so
signed zeros are equal and NaN is unequal. Old vertex views keep their original
allocation after mesh resize, geometry transfer, collection and shutdown.

`new TextureSource(source?, documentPath?)` preserves both input strings and
caches textures per render manager. `getSource()` and `getDefinitionSource()`
return those strings; `getTexture(manager)` returns a lazy `Texture` view.
The binding retains cached managers and resets the source cache when an unused
manager is released. It can then be reused with live managers; shutdown
invalidates it. `TexturedMesh` is a `{ mesh, texture }` record and
`TexturedMeshList` is an ordered array. Pass each record's native mesh to
`makeGeometry()` and its texture to `Geometry.render()`.

`SpritesheetList` owns an upstream collection. `addSpriteSheet(name,
imageSource, definitionSource, definitionLineNumber, displayScale, definitions)`
accepts `[name, { p0, p1 }]` sprite pairs in pixels. It copies inputs and
overwrites duplicate sprite names. `merge(other)` appends sheets and overwrites
names; self-merge snapshots the source. `reserve(sheets, sprites)` reserves
capacity without changing `numSpriteSheets()` or `numSprites()`.
`getSprite(name)` returns null or a `{ rectangle, spriteSheet }` snapshot.

`Spritesheet` carries `name`, `definitionLineNumber`, `displayScale` (inverse
resolution), and an independent `textureSource`. Its constructor takes the same
five arguments as upstream: name, source, document path, line and scale.
Returned metadata remains stable across insertion, merge and list collection;
editing a snapshot does not edit the list. `SpriteMap` maps names to snapshots.
The texture source remains subject to the runtime lifetime rules above.

## Decorator instancing and manual element data

`new DecoratorInstancer(callback)` supplies a synchronous
`(name, properties, active) => Decorator | null` factory. Register local values
with `registerProperty` and `registerShorthand`, then register the factory with
`DecoratorInstancer.register(name, instancer)`. Registered and replaced
instancers remain alive until shutdown because parsed declarations retain
their native pointers. Unregistered callback cycles can be collected.

`active` is a `DecoratorInstancerInterface` valid only during that callback,
including nested delegation. `getSprite(name)` returns copied metadata,
`getTexture(filename)` resolves the declaration's source path, and
`getRenderManager()` returns a checked manager. Saved interfaces throw after
callback return or exception; returned resources have their own lifetimes.
A missing property source gives an empty texture.

```js
const builtin = rml.DecoratorInstancer.get('horizontal-gradient');
const defaults = new rml.PropertyDictionary();

builtin.getPropertySpecification().setPropertyDefaults(defaults);
rml.DecoratorInstancer.register('delegated',
  new rml.DecoratorInstancer((_name, _properties, active) =>
    builtin.instanceDecorator('horizontal-gradient', defaults, active)));
```

The dictionary must contain every registered property, including defaults.
Callbacks receive a copy. Instancing can happen during document loading;
callbacks must not mutate DOM, register properties, shut down, or recursively
invoke the same instancer. RmlUi may cache a returned decorator for several
elements and invoke its generation step repeatedly.

`decorator.generateElementData(element, paintArea = BoxArea.Padding)` returns
an owned `DecoratorData` or null. Use a concrete box area, not `Auto`.
`renderElement(element, data)` checks the originating decorator, element and
manager. Flush pending SFML commands before direct rendering.
`releaseElementData(data)` releases once and permits repeated calls while the
decorator remains valid. It also works after the source element dies. GC
releases abandoned data; manager release invalidates decorators and frees
their manual data before destroying the manager. Manual data is separate from
the data RmlUi manages for styled elements.

`new Decorator<Data>(manager, callbacks)` implements all three native virtuals
with synchronous JavaScript. `generateElementData(element, paintArea)` returns
an object or null; null prevents rendering. `renderElement(element, data)` and
`releaseElementData(data)` receive the same object. Promises and primitive data
are rejected. Callbacks can inspect elements and create/render/release geometry;
DOM mutation, shutdown and recursive callbacks are rejected.

Custom decorators expose `addTexture(texture)`, `getNumTextures()` and
`getTexture(index = 0)`. Textures must use the same render manager. Adding an
invalid texture returns -1; adding an existing texture reuses its index.
Out-of-range indices return an invalid texture. These protected operations are
available on custom decorators only.

Native document and global stylesheet caches retain callbacks, including
inactive media-block sheets. JS-owned sheets, containers, explicit instancer
interfaces and detached trees retain them through visible GC edges, so unused
callback cycles remain collectible. Manual data uses independent ownership;
retaining an element does not retain all manual data created for it.

Explicit data release invokes its callback before the outer RmlUi call returns.
Native cleanup
queues callback work to a safe runtime boundary; no JavaScript runs in a GC
destructor. A GC-triggered release runs on the next RmlUi call only if its data
and callbacks are still reachable. Collected data or closures are skipped.
Use explicit release for deterministic cleanup. Shutdown releases live manual
data before invalidating the manager, then clears the callback closures.

## Stylesheets and explicit instancer interfaces

`StyleSheetContainer` owns parsed RCSS and its media blocks. Load text with
`loadStyleSheetContainer(source, sourceUrl = '', beginLineNumber = 1)`;
the URL resolves relative resources and the positive line number identifies
the source. The result is the upstream parser's boolean, including its
partial-write behavior on a failed parse. Load and merge before compilation.
`mergeStyleSheetContainer(other)` rejects a compiled receiver and self-merge;
`combineStyleSheetContainer(other)` creates an uncompiled combined container.

Call `updateCompiledStyleSheet(context)` to evaluate viewport, density and
theme media queries. `getCompiledStyleSheet()` returns null before compilation
and a checked read-only `StyleSheet` view afterwards. A true update result
invalidates every previous view, including views of still-retained media
blocks. A false result preserves them. Views keep native container storage
alive independently of the JS container wrapper.

`sheet.combineStyleSheet(other)` creates an independently owned mutable sheet.
Only owned combinations support `mergeStyleSheet(other)` and
`buildNodeIndex()`; build the index before matching elements.
`getSprite`, `getNamedDecorator` and `getKeyframes` return independent metadata
and property dictionaries, or null when absent. Later declarations replace
same-name decorators and animations when sheets are combined.

`getElementDefinition(element)` matches the element's hierarchy and returns
an immutable native `ElementDefinition`, or null for unmatched/text nodes.
`getProperty(id)`, `getCustomProperty(name)`, `getPropertyIds()` and
`getProperties()` return independent values. Definitions survive element
destruction and later sheet merges; shutdown invalidates them. After merging,
rebuild the index before querying the updated definition.

`element.getStyleSheet()` returns the document's compiled view.
`document.getStyleSheetContainer()` retains a read-only container; its load,
merge and update operations throw. `document.setStyleSheetContainer(container)`
retains the native container and compiles media queries; null clears its rules.
Call `updateDocument()` to apply styles and layout. Media changes invalidate
old compiled views, including when several documents share one container.
Retained containers and unchanged compiled views survive document destruction
or replacement. `reloadStyleSheet()` reads style tags and linked RCSS from the
original readable document URL while preserving DOM and inline attributes.

`new DecoratorInstancerInterface(manager, sheet, source = null)` retains the
native manager and sheet and copies the `PropertySource`. It can be passed
to `instancer.instanceDecorator` outside a factory callback. A null source
makes filename texture requests return empty textures. Constructed interfaces
expire when the sheet or manager is invalidated; callback-supplied interfaces
still expire at callback exit. Shutdown invalidates sheets and containers.
`sheet.instanceDecorators(manager, declarations, source = null)` returns an
independent array of shared decorators. Nonempty declaration text caches by
text, source path and render manager; empty text creates fresh instances.
Merging clears the sheet's cache, and manager destruction releases its cached
instances before native resources. Returned decorators survive the source
sheet's collection but remain bound to their original manager. Factory errors
propagate; a native instancing failure returns an empty array.
[Stream input](./streams.md) supports files, memory and synchronous callbacks.

## Factory parsing and caches

`Factory.instanceElement(parent, instancer, tag, attributes = {})` calls the
native instancer using an independent tag and owned Variant attributes.
The returned node retains its actual native subtype and remains detached until
`parent.appendChild(node)`. Null parents are supported; failed instancing returns
null. The registered `*` instancer supplies RmlUi's unknown-name fallback.
Borrowed element pointers cannot be persisted in attributes.

`Factory.instanceElementText(parent, text)` translates text, decodes entities
and appends native text or RML children. Whitespace adds no child.
`Factory.instanceElementStream(parent, stream)` parses from the current cursor
and source URL. Both preserve native parser results and partial-write behavior.
RmlUi 6.3's stream helper returns true after parsing even for syntax diagnostics;
host stream failures propagate as exceptions. Context roots cannot receive
children through these helpers. Parsing rejects callback reentry.

`instanceStyleSheetString(text)`, `instanceStyleSheetFile(filename)` and
`instanceStyleSheetStream(stream)` create uncompiled owned containers or return
null on parsing failure. File loading uses the installed native file interface;
open failure returns null. RCSS with no parsed rules returns null; syntax
diagnostics can still return a partially parsed container.
Assign the result through `document.setStyleSheetContainer(container)`.

`Factory.clearStyleSheetCache()` and `Factory.clearTemplateCache()` affect
subsequent loads and preserve retained containers and compiled views. Cache
mutation rejects callback reentry. `isStructuralDataView(name)` uses an exact
unprefixed name such as `for`; `getStructuralDataViewAttributeNames()` returns an
independent array of full `data-` attribute names. Shutdown invalidates owners.

The [element factory](../../packages/sfml.js-rmlui/examples/factory-elements.cjs)
application exercises typed native input, parsed children and cache clearing.

## Element instancers

`ElementFormControl.createInstancer(valueAttribute = 'value')` provides a
callback-free native form-control allocator whose virtual values live in the
selected attribute. It uses the same checked allocation, clone and release
provenance as other instancers. See [form controls](./controls.md) for shared
data updates, direct-allocation attribute semantics and submission tag rules.

`Factory.getElementInstancer(tag)` returns a canonical `ElementInstancer` or
null. Unknown tags use the registered `*` fallback. Native registration
lowercases names, while lookup keys remain exact.
`Factory.registerElementInstancer(name, instancer)` retains the adapter until
shutdown, including replaced adapters still used by existing elements.
Passing null disables that exact name; disabling `*` removes the fallback too.

```js
const input = Factory.getElementInstancer('input');
const custom = new ElementInstancer((parent, tag, attributes) =>
  input.instanceElement(parent, tag, attributes), snapshot => {
  console.log('Released', snapshot.tagName, snapshot.attributes);
});

Factory.registerElementInstancer('account-control', custom);
const field = Factory.instanceElement(null, 'account-control', 'account', {
  type: 'text', value: 'Native control',
});

custom.releaseElement(field);
```

Allocation callbacks return null or a detached node created by another
`ElementInstancer.instanceElement(parent, tag, attributes = {})`. The direct
method follows that allocator's behavior; Factory applies attributes and
plugin notifications afterwards. Factory and clone operations preserve native
subtypes and the original allocator, including nested adapters. Returning
borrowed, attached, active or untracked nodes rejects without transferring them.
Callback input attributes and release snapshots are independent copies.

`releaseElement(element)` requires an owned detached node allocated through
that exact adapter; all wrapper aliases become invalid after native destruction.
Native destruction is synchronous. Optional release notifications receive
`{ tagName, attributes }` snapshots at a safe boundary after destruction.
No JS executes from a native destructor, including GC inside an allocation
callback. GC notices run on the next native call if their observer remains
reachable; collected observers and environment cleanup do not invoke JS.
Observer exceptions propagate without preventing native destruction.

Callbacks may allocate through other instancers and inspect copied values;
DOM mutation, registration changes and recursion reject. Registered adapters
remain alive until shutdown. Unregistered adapters follow native tree ownership
or visible detached owner edges, so cycles can be collected.
Shutdown invalidates adapters and releases elements before native pools.
The element-factory application verifies custom input allocation and release.

## Context instancers and owned document streams

`new ContextInstancer()` uses the native context constructor.

`new Context(name, manager, handler)` directly constructs an owned native
context without selecting the registered Factory adapter. It retains zero
dimensions and density 1, does not enter the Core registry or emit a plugin
creation notice, and releases through `remove()` or GC. The input handler is
explicit: null stays null. `context.getTextInputHandler()` returns the exact
checked borrowed handler, or null. Custom handlers and native composition
sessions are described in [text input](./text-panels.md). Real input-method
acceptance is recorded separately in the [IME checkpoint](./audit/6.3/native-ime-checkpoint.md).

Context construction requires a non-null root element from the `*` instancer
and an `ElementDocument` from the `body` instancer. Disabled, declined or wrong
document allocations throw before dereferencing their results; callback errors
retain their original identity. Failed construction destroys its partial
elements and does not add a Core registry entry.

`new ContextInstancer(create, release?)` delegates allocation to another typed
instancer and observes `{ name }` after native destruction at a safe boundary.
The returned allocation must have the requested name, render manager and native
text-input handler. Null declines creation; callback exceptions propagate.
Nested adapters preserve outer-to-inner release notifications.

`Factory.registerContextInstancer(instancer)` selects the adapter used by
`createContext` and retains it through shutdown, including replaced adapters.
`Factory.instanceContext(name, manager, handler)` and
`instancer.instanceContext(name, manager, handler)` return owned contexts without
Core registration. Pass null for an absent native text-input handler.
The native default dimensions are zero; call `setDimensions` before layout.
Children retain their owned context through visible V8 edges, allowing closure
cycles to collect. `context.remove()` releases that allocation without removing
a registered context with the same name. `instancer.releaseContext(context)`
additionally checks the exact outer allocator and rejects registered contexts.
Release owned contexts before global font-resource or render-manager release,
because upstream invalidation visits only registered Core contexts.

`Factory.instanceDocumentStream(context, stream, documentBaseTag)` parses an
owned detached document with the stream's source URL and native header handling.
The base tag chooses the document allocator; the source still uses registered
XML handlers such as `body`. Creation does not insert into the context or
dispatch context load notifications. Descendants retain their document.
Context removal destroys these documents before their borrowed resources.
Stream errors throw; native syntax diagnostics may produce partial documents.

```js
const custom = new ContextInstancer((name, manager, handler) =>
  new Context(name, manager, handler));

Factory.registerContextInstancer(custom);
const owned = Factory.instanceContext(
  'independent', context.getRenderManager(), null);

owned.setDimensions(760, 480);
const parsed = Factory.instanceDocumentStream(owned, new StreamMemory(
  Buffer.from('<rml><head/><body id="parsed"/></rml>')), 'body');

console.log(parsed.id, owned.getNumDocuments()); // parsed, 0
owned.remove();
```

## Event instancers and owned events

`new EventInstancer()` allocates native events. Custom creation callbacks
delegate to another instancer and return its owned `RmlEvent`, or null to decline.
The target, id, type and interruption flag must match; parameters may be
customized. Transfer invalidates the source event handle.
`Factory.registerEventInstancer(instancer)` applies to real native dispatch
and retains registered adapters through shutdown, including replacements.

`Factory.instanceEvent(target, id, type, parameters, interruptible)` and
`instancer.instanceEvent(...)` return owned events without dispatching them.
`event.setPhase(phase)` and `event.setCurrentElement(elementOrNull)` call native
setters, including mouse projection, and update retained fields.
Propagation and parameter methods require a live event. Owned events also
check target, current and parameter element observers.
`event.release()` releases any owned event; `instancer.releaseEvent(event)`
additionally requires the exact outer allocator. Both reject dispatch leases.
GC and shutdown also delete owned events. Copied fields remain readable.
Release callbacks receive `{ type, id }` after native deletion at a safe
boundary, outermost first. Environment cleanup does not invoke JS.

```js
const allocator = new EventInstancer();
const custom = new EventInstancer((...args) =>
  allocator.instanceEvent(...args), snapshot => console.log(snapshot.type));

Factory.registerEventInstancer(custom);
const id = registerEventType('account-save', true, true);
const event = Factory.instanceEvent(input, id, 'account-save',
  { value: input.getValue() }, true);

event.setPhase(EventPhase.Target);
event.setCurrentElement(input);
console.log(event.getParameter('value', ''));
event.release();
```

## Native event listeners and inline attributes

`new EventListener(process, attach?, detach?)` creates a native listener.
Pass it to `element.addEventListener(type, listener, capture?)` and remove the
same registration with `removeEventListener`. One listener supports multiple
elements, event types and capture phases; identical registrations are deduplicated.
Native element ownership retains its callbacks. Detached element/callback
cycles can collect.

`EventListenerInstancer(create)` receives the exact inline attribute value and
requesting element. Its callback returns a live `EventListener` or null.
`Factory.registerEventListenerInstancer(instancerOrNull)` controls real RML
`on*` attributes and retains the instancer until replacement or shutdown.
Values are never evaluated as JavaScript. Attribute replacement/removal
detaches the previous listener. During instancing, element `id` and `tagName`
remain readable and new listeners may be constructed; DOM mutation is rejected.
`Factory.instanceEventListener(value, element)` and
`instancer.instanceEventListener(value, element)` create an unattached listener:
retain the result until it is attached.

Attach/detach callbacks receive `{ id, tagName }` copied at attachment time.
They execute once per actual registration at the outer safe boundary, after
native frames return. Environment cleanup invokes no JavaScript. Manual
`listener.onAttach(element)`/`onDetach(element)` deliver notifications;
actual registration uses the element dispatcher. `listener.processEvent(event)`
invokes processing without dispatch, gives the callback an expiring event lease
and protects the source event against release, transfer and recursive processing.
`listener.release()` destroys an inactive listener after all attachments are
removed. Shutdown invalidates listeners/instancers and clears callback edges.

```js
Factory.registerEventListenerInstancer(new EventListenerInstancer(
  (action, element) => new EventListener(event => {
    if (action === 'save') {
      console.log(element.id, event.type);
    }
  })));
button.setAttribute('onclick', 'save');
button.click();
button.removeAttribute('onclick');
```
