# RmlUi render state

`context.getRenderManager()` returns the shared native `RenderManager`.
An explicitly constructed `new RenderManager(getRenderInterface())` owns an
independent manager. Shutdown invalidates both. Resources belong to the manager
that created them.

`prepareRender({ x, y })` starts a pass with default state and a balanced layer
stack. `setViewport({ x, y })` changes the cached viewport; `getViewport()`
returns its integer size. Sizes must be nonnegative signed 32-bit integers.

`setScissorRegion({ p0, p1 })` intersects a valid integer rectangle with the
viewport. `null` or an invalid rectangle disables the scissor.
`getScissorRegion()` returns a copied rectangle or `null`.
`disableScissorRegion()` explicitly disables it.

## Callback textures {#callback-textures}

`manager.makeCallbackTexture(callback)` returns a unique `CallbackTexture`.
The callback runs lazily when `toTexture().getDimensions()` or textured
geometry first needs GPU data. `isValid` checks resource identity without
loading. `new CallbackTexture()` is empty; `invalidHandle()` is `4294967295`.
`release()` is idempotent and invalidates all existing nonempty texture views.
Views retain native resource ownership even after the original JS owner is
collected. They cannot revive when an upstream cache index is reused.
`Decorator.addTexture(view)` also retains the view and its generation callback;
`getTexture(index)` preserves its validity checks and ownership.

```js
const generated = manager.makeCallbackTexture(api =>
  api.generateTexture(
    new Uint8Array([ 128, 0, 0, 128 ]), { x: 1, y: 1 }));
const texture = generated.toTexture();

geometry.render({ x: 20, y: 20 }, texture);
generated.release();
```

The scoped `CallbackTextureInterface` exposes every native submission method:
`generateTexture(bytes, dimensions)` accepts tightly packed premultiplied RGBA
unshared `Uint8Array` or `Buffer`, exactly width × height × 4 bytes, and positive
integer dimensions. It returns native generation success. `saveLayerAsTexture()`
captures the current layer within the active nonempty scissor rectangle.
`getRenderManager()` returns the originating manager.
`setTextureHandle(handle, dimensions)` transfers a `TextureHandle` created by
`manager.generateTextureHandle(bytes, dimensions)`. Manager and dimensions
must match; successful transfer empties the token. `handle.release()` releases
an untransferred texture, and `handle.isValid` reports ownership. These tokens
represent native handle ownership without accepting unchecked pointer numbers.

Submit exactly once and return a synchronous boolean. A true result without
submission, a promise, or a nonboolean result throws. False or an exception
rolls back any generated or transferred texture; failure is cached without
retry. A retained interface expires as soon as the callback returns. During
generation only its scoped methods can enter native code: resource release,
DOM/runtime mutation, recursive rendering and nested texture loads reject
before they can invalidate the active native database entry. Callback code
should use previously computed bytes and the supplied interface.

`new CallbackTextureSource(callback)` caches one unique resource per manager.
`getTexture(manager)` returns a lazy view with the same ownership rules;
an omitted callback produces empty views. Returned views retain their cache
resource when the source wrapper is collected. Releasing an unused manager
evicts its cache entry; shutdown invalidates resources, sources and handle
tokens. Native move construction/assignment correspond to JS reference
assignment without copying native resources.

Run [Callback textures](
../../packages/sfml.js-rmlui/examples/callback-textures.cjs) to exercise
generation, explicit handle transfer and scissored layer snapshots.

## Save and restore

```js
const manager = context.getRenderManager();
const saved = manager.getState();

try {
  manager.setScissorRegion({
    p0: { x: 20, y: 20 }, p1: { x: 200, y: 100 },
  });
  const matrix = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0,
    0, 0, 1, 0, 12, 8, 0, 1,
  ]);

  manager.setTransform(matrix);
  geometry.render({ x: 0, y: 0 });
} finally {
  manager.setState(saved);

  for (const mask of saved.clipMaskList) {
    mask.geometry.release();
  }
}
```

`RenderState` contains `scissorRegion`, `clipMaskList` and `transform`.
Matrices use column-major `Float32Array(16)` storage with finite values.
The buffer must be fixed and unshared; subviews are supported.
Ordinary geometry and clip masks apply the complete homogeneous 4×4 matrix,
after geometry translation, with perspective-correct texture interpolation and
Z clipping at −10000 to 10000. Custom supplied vertex programs keep their
documented SFML affine convention.
`setTransform(null)` selects identity. `resetState()` disables scissor and masks
and selects identity, without changing the viewport.

`getState()` copies native meshes and matrices. Its geometry remains valid
after source elements close; it belongs to the original manager and is
invalidated by release or runtime shutdown. `setState()` validates all fields
before submission and keeps independent native copies. Changing or releasing a
submitted snapshot cannot invalidate the active state. Release snapshot
geometries when finished. Invalid inputs leave the cached state unchanged;
argument accessors execute before native manager validation.

## Geometry masks

Create the SFML window with `{ settings: { stencilBits: 8 } }`.

Mask definitions retain the scissor write region and transform at submission.
Changing the current scissor does not enlarge an existing mask. Overlapping
triangles and more than 255 intersections retain boolean coverage. The native
interface preserves its definition when toggled off and on; the managed
`disableClipMask()` also clears Core's mask list.

```js
const { ElementUtilities, ClipMaskOperation } = require('sfml.js-rmlui');
const clipping = ElementUtilities.getClippingRegion(element, true);

manager.setScissorRegion(clipping.region);
manager.setClipMask(clipping.clipMask);

for (const mask of clipping.clipMask) {
  mask.geometry.release();
}

geometry.render({ x: 0, y: 0 });
manager.disableClipMask();

manager.setClipMask(ClipMaskOperation.Set, geometry, { x: 10, y: 20 });
manager.disableClipMask();
```

Both `setClipMask(masks)` and `setClipMask(operation, geometry, translation)`
invoke their native overloads. Geometry must be nonempty and belong to the same
manager. Submission copies each mesh and transform. Disabling, replacing or
resetting the mask releases those native copies.

`clipMaskGeometryEquals(a, b)` maps native equality: operation and offset compare
by value; geometry and transform compare by reference, with `null` transforms
equal. Equal matrix contents in different arrays do not compare equal.
Separate snapshots have separate resource identities. Use `!` for inequality.

## Layers and filter lists {#render-layers}

```js
const { BlendMode, FilterHandleList } = require('sfml.js-rmlui');
const destination = manager.getTopLayer();
const layer = manager.pushLayer();

try {
  geometry.render({ x: 20, y: 20 });
  const blur = manager.compileFilter('blur', { sigma: 3 });
  const filters = new FilterHandleList();

  blur.addHandleTo(filters);

  try {
    manager.compositeLayers(layer, destination, BlendMode.Blend, filters);
  } finally {
    filters.clear();
    blur.release();
  }
} finally {
  manager.popLayer();
}
```

`pushLayer()` selects a transparent offscreen target. Match every call with
`popLayer()` before the next `context.render()` or `prepareRender()`.
`getTopLayer()` returns a canonical opaque token; before the first push it is
layer zero. In a context frame it contains transparent UI content; outside a
frame it represents the host window. `getNextLayer()` returns the layer below the top and
throws on an empty stack. Only layers pushed through this facade can be popped.
Different managers cannot interleave active targets on one renderer.

`compositeLayers(source, destination, blendMode, filters?)` accepts active
same-manager tokens. Both source and destination may be layer zero.
`BlendMode.Blend` composites premultiplied source over the
destination. `BlendMode.Replace` replaces pixels in the active clipping region.
Self-composition snapshots its input. Popped tokens stay invalid after target
pool reuse. A list applies filters in insertion order and retains their native
resources after wrapper GC; released and foreign-manager entries throw before
composition. `clear()` releases the list's ownership.

`saveLayerAsMaskImage()` snapshots the current layer's alpha inside the active
scissor region and returns a `CompiledFilter`. Add it to a `FilterHandleList`
to multiply subsequent layer pixels by that mask at its original viewport
position. Layer zero can also supply a mask. The snapshot survives popping its
source layer. An invalid region returns an invalid filter. Release it when finished.

State and layer reads and submissions work in decorator rendering callbacks;
event callbacks allow reads and reject mutations. A callback cannot pop layers
opened by its caller. Returning with unbalanced layers reports an error and
unwinds those layers before native rendering resumes; an existing callback
exception is preserved. Shader and platform renderer
acceptance remains separate. Run the
[element inspector](../../packages/sfml.js-rmlui/examples/element-utilities.cjs)
for clipped native geometry, transform submission and state restoration.
The [layer composition application](
../../packages/sfml.js-rmlui/examples/render-layers.cjs) shows nested blending,
self-composite blur and saved alpha masks. Space moves shapes; Escape exits.
