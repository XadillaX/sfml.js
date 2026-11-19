# RmlUi API guide

The [RmlUi API reference](/reference/rmlui/) is generated from this package's TypeScript declarations and four-language TSDoc. Overview entries show short descriptions; member pages contain signatures, defaults, parameters, return values and lifetime details.

[Strings and resource URLs](strings.md) cover retained byte views, UTF-8
iteration, batched offsets and typed native formatting.

## Find a contract

| Task | API |
| --- | --- |
| Bind a render window | [initialise](/reference/rmlui/functions/initialise.html), [InitialiseOptions](/reference/rmlui/interfaces/InitialiseOptions.html) |
| Load fonts and release glyph caches | [loadFontFace](/reference/rmlui/functions/loadFontFace.html), [Font guide](fonts.md) |
| Observe Native lifecycle notifications | [Plugin](/reference/rmlui/classes/Plugin.html), [Plugin guide](plugins.md) |
| Inspect and release renderer resources | [Renderer resources](resources.md), [RenderInterface](/reference/rmlui/interfaces/RenderInterface.html) |
| Inspect layout, scroll and project coordinates | [Element layout](layout.md), [Element](/reference/rmlui/classes/Element.html) |
| Inspect native scroll and transform components | [ElementScroll](/reference/rmlui/classes/ElementScroll.html), [TransformState](/reference/rmlui/classes/TransformState.html), [ElementTransformBuffer](/reference/rmlui/classes/ElementTransformBuffer.html) |
| Construct and inspect box values | [Box values](boxes.md), [Box](/reference/rmlui/classes/Box.html), [RenderBox](/reference/rmlui/classes/RenderBox.html) |
| Resolve numeric values and units | [Numeric values](numeric-values.md), [NumericValue](/reference/rmlui/classes/NumericValue.html) |
| Read and assign typed properties | [Properties](properties.md), [Property](/reference/rmlui/classes/Property.html) |
| Animate typed properties and evaluate easing | [Animation](animation.md), [Tween](/reference/rmlui/classes/Tween.html) |
| Create, update and render a context | [createContext](/reference/rmlui/functions/createContext.html), [Context](/reference/rmlui/classes/Context.html) |
| Read physical dimensions | [ContextDimensions](/reference/rmlui/interfaces/ContextDimensions.html) |
| Bind native data and custom views/controllers | [Data models](data-models.md), [DataView](/reference/rmlui/classes/DataView.html), [DataController](/reference/rmlui/classes/DataController.html), [Factory](/reference/rmlui/classes/Factory.html) |
| Show and unload documents | [Document](/reference/rmlui/classes/Document.html) |
| Query, style and listen to elements | [Element](/reference/rmlui/classes/Element.html) |
| Attach, recursively detach and explicitly dispatch events | [EventDispatcher](/reference/rmlui/classes/EventDispatcher.html), [Element state](element-state.md) |
| Read live events and copied parameters | [RmlEvent](/reference/rmlui/classes/RmlEvent.html), [RmlEventListener](/reference/rmlui/types/RmlEventListener.html) |
| Release the runtime | [shutdown](/reference/rmlui/functions/shutdown.html) |

## Native element components

`element.getStyle()` exposes the actual checked
[`ElementStyle`](/reference/rmlui/classes/ElementStyle.html), including cascade,
dirty sets, explicit definition updates, owned computation, snapshot iterators
and reusable keyframe resolution. See [Element state](element-state.md#native-style-component)
for lifecycle, layout consumption and shared numeric command contracts.

`element.getElementBackgroundBorder()` returns the canonical element-owned
[`ElementBackgroundBorder`](/reference/rmlui/classes/ElementBackgroundBorder.html).
`dirtyBackground()` and `dirtyBorder()` mark geometry for the next native
`render()`. Rendering uses current computed style, layout and manager state;
prepare the manager viewport first. A detached element without a manager does
not draw. Another manager's active layer and effect callback reentry are rejected.

`getClipGeometry(area)` accepts BoxArea.Border, Padding or Content
and returns an independent native `Geometry` snapshot. Margin and Auto throw.
No manager produces an empty geometry. Component regeneration, element
destruction, snapshot editing and snapshot release do not change other
snapshots or the component mesh. The manager still controls GPU resource
lifetime; `getMesh()` copies survive manager release and shutdown.

```js
const background = element.getElementBackgroundBorder();

context.getRenderManager().prepareRender({
  x: context.dimensions.width, y: context.dimensions.height,
});
background.render();
const clip = background.getClipGeometry(BoxArea.Padding);
const mesh = clip.getMesh();

clip.release();
```

`element.getElementScroll()` returns the element-owned `ElementScroll`.
`ScrollOrientation.VERTICAL` is 0 and `HORIZONTAL` is 1. Its `update()`,
`enableScrollbar(orientation, elementWidth)`, `disableScrollbar(orientation)`,
`updateScrollbar(orientation)`, `formatScrollbars()` and `updateProperties()`
run the native component operations. `getScrollbar(orientation)` returns a live
element, or `null` if the scrollbar has never been created.
`getScrollbarSize(orientation)` returns the vertical width or horizontal height
in pixels, and zero when disabled. Disabling changes the native property;
`updateProperties()` recomputes scrollbar properties before visibility queries.
The component invalidates with its element and retains detached ownership.

`element.getTransformState()` returns a read-only current native state or
`null`. RmlUi updates transforms during `context.render()`.
`getTransform()`, `getLocalPerspective()` and `getInverseTransform()` return
independent native-owned `Float32Array` snapshots with sixteen column-major
values. Unset matrices return `null`; singular transforms have no inverse.
Snapshots remain usable after element destruction and runtime shutdown.
`new TransformState()` owns an independent state with `setTransform(matrix)`
and `setLocalPerspective(matrix)`; each copies sixteen finite floats or clears
with `null`, and returns whether the native value changed.

For repeated reads across many elements, allocate `ElementTransformBuffer`
once. `refresh()` uses one native entry, no JS callbacks and no output
reallocation. Each element occupies 48 column-major floats: transform at 0,
perspective at 16, inverse at 32. `flags[i]` has presence bits 1, 2 and 4;
absent matrices contain zeros. Writes only change snapshots. All owners are
checked before output changes; destroyed elements and stale runtimes throw.
Numerical views retain only their storage, including after wrapper collection.

```js
const { ElementTransformBuffer } = require('sfml.js-rmlui');
const transforms = new ElementTransformBuffer(elements);

context.update();
context.render();
transforms.refresh();
const firstTransform = transforms.matrices.subarray(0, 16);
const firstPresence = transforms.flags[0];
```

## Important return values

`initialise` returns success; repeating it does not replace the process-wide window or options. `loadFontFace` returns whether a font loaded. Element queries return `null` for no match. `setProperty` returns whether the RCSS property was accepted.

`processEvent` returns propagation for key/text/wheel events and non-interaction for mouse/touch input. Direct input methods and exact return rules are covered in [Documents and events](./documents.md#direct-input). `update` and `render` forward RmlUi 6.3's result, currently always true; do not use them as dirty flags or visibility tests.

## Defaults and ownership

`highDpi` defaults to true; font fallback, modal display and listener capture default to false. These values also appear on their API detail pages.

Obtain context and element wrappers through runtime creation, loaders or element queries. Their internal handles are not public API. These wrappers borrow native objects; see [documents and events](documents.md) for invalidation and listener removal.

`Box` and `RenderBox` have public constructors. They own independent native values and shared numerical views; see [box values](boxes.md) for their lifetime and snapshot rules.

The [source entry point](../../packages/sfml.js-rmlui/src/index.ts) and exported declarations are the source of truth. This binding covers the documented surface, rather than every C++ RmlUi API.
