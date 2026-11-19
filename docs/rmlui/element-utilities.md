# RmlUi element utilities

`ElementUtilities` exposes all static operations of
`Rml::ElementUtilities`. Update the context before inspecting computed fonts,
layout or clipping. Render once after changing transforms to update the
accumulated transform state.

```js
const { ElementUtilities: utilities, BoxArea, PositionAnchor } =
  require('sfml.js-rmlui');
const panel = utilities.getElementById(document, 'panel');
const width = utilities.getStringWidth(panel, 'AV');
const bounds = utilities.getBoundingBox(panel, BoxArea.Auto);
const box = utilities.buildBox({ x: 640, y: 480 }, panel);

utilities.positionElement(panel, { x: 12, y: 12 }, PositionAnchor.BottomRight);
```

`getElementById(root, id)` searches breadth-first and includes the root.
Tag and class queries exclude the root and return arrays of live wrappers.
The optional `stopTag` in `getElementsByTagName(root, tag, stopTag)` prevents
searching that node's descendants; the stop node itself can still match.
These operations preserve wrapper identity. A returned array is a snapshot;
native element destruction invalidates the wrappers inside it.

`getDensityIndependentPixelRatio(element)` returns its context's ratio or 1
without a context. `getStringWidth(element, text, priorCharacter = 0)` measures
UTF-8 text using the native font and shaping settings. The preceding character
is a Unicode scalar codepoint used for kerning. Width is an integer in pixels;
without a native font the result is zero.

`getBoundingBox(element, area)` requires a `BoxArea` and returns
`{ p0: { x, y }, p1: { x, y } }`, or `null` on native projection failure.
`Auto` includes the border box and outer box-shadow overflow, following
upstream behavior; it does not include filter overflow.

## Clipping snapshots

```js
const clipping = utilities.getClippingRegion(panel, true, false);

console.log(clipping.region, clipping.clipMask.length);

for (const mask of clipping.clipMask) {
  console.log(mask.operation, mask.absoluteOffset, mask.transform);
  const mesh = mask.geometry.getMesh();

  console.log(mesh.indices.length);
  mask.geometry.release();
}
```

`getClippingRegion(element, includeClipMask = false, forceClipSelf = false)`
returns both native outputs. `region` is an integer scissor rectangle or
`null`; a transformed mask can exist even when `region` is `null`.
`forceClipSelf` includes the target's border area.
Requesting mask geometry requires an element attached to a context.

Each mask has a `ClipMaskOperation`, independent owned `Geometry`, rounded
`absoluteOffset`, and a copied column-major `Float32Array(16)` transform.
`null` transform means identity. Editing the returned matrix or mesh cannot
change the original element. Geometry survives document closure and wrapper
collection, and is invalidated by its own release, runtime shutdown or render
manager release. Release snapshots when finished.

`setClippingRegion(element, forceClipSelf = false)` submits native clipping
to the render manager and returns native visibility.
`applyTransform(element)` submits the accumulated transform.
Both return `false` for an element without a context. These rendering
operations require a window with `stencilBits: 8` for geometry masks.

## Layout and data views

`buildBox(containingBlock, element, inlineElement = false)` returns an
independent `Box` without assigning it to the element. Inline sizing follows
upstream rules, including unresolved automatic dimensions.
`formatElement(element, containingBlock)` runs the native layout engine;
it is useful for custom non-DOM content. For detached elements, compute styles
while attached before detaching; formatting does not update dirty styles.
Containing dimensions must be finite and nonnegative.

`positionElement(element, offset, anchor)` builds and sets the box, evaluates
relative lengths against the parent's content, and positions from the selected
edge or corner. CSS position properties still affect the final offset.
All eight `PositionAnchor` members use native bit values. No parent means
`false`; offsets must be finite.

`applyDataViewsControllers(element)` invokes the native construction of views
and controllers from `data-*` attributes. It returns `false` when no model or
binding applies, or `true` when a view or controller initializes successfully.
After setting binding attributes on an already attached element, call it to
construct the bindings, then update the model/context. Native value views and
controllers synchronize input values and emit model events. Model removal
unregisters controllers and clears the element's model association. Reapplying
is a construction operation, not an idempotent binding refresh.

All operations reject destroyed elements. Layout/data construction and render
state submission reject unsafe callback reentry before entering upstream code.
Argument getters run before native receiver validation.

Run [the element inspector](../../packages/sfml.js-rmlui/examples/element-utilities.cjs)
to inspect positioning, projected bounds, text width and clipping snapshots.
