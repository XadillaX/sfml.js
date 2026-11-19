# Renderer declarations and Native compatibility contracts

The [declaration map](renderer-declaration-map.json) accounts for all 31
original `RenderInterface.h` rows and 27 `RenderInterfaceCompatibility.h`
rows. This is declaration reconciliation with verified consumer paths.
Full SFML rendering semantics remain unaccepted.

All 21 modern virtuals have Native SFML overrides. The public `RenderInterface`
is a runtime-owned opaque token obtained through renderer creation/selection
and context inspection. The legacy compatibility adapter remains Native-only;
it does not create a JavaScript renderer subclass or add advanced features.

## Direct Native contracts

Run in the existing package/build directory, passing an existing temporary
output directory:

```sh
python3 test/native/build-render-interface-contracts.py /tmp/rmlui-63-completion
```

The fixture links the active vendor-object list from `build/rmlui.target.mk`
and checks six groups:

| Group | Observed contract |
| --- | --- |
| Modern enums and defaults | All five enum values; noncopyable interface; optional no-op/zero virtuals make no required-renderer calls |
| Legacy defaults and ownership | Stable owned adapter, native class relationship, default compile/texture failure and unsupported advanced operations |
| Compiled geometry | Immutable caller input, retained snapshot, alpha conversion, one legacy compiled handle per texture and one release per cached entry |
| Immediate fallback | Zero compilation uses immediate rendering, retries compilation on the next draw and releases its zero cache entry |
| Texture conversion | Ordered dimensions/source forwarding, premultiplied-to-straight conversion without source mutation, failed callback returns zero, successful handle release |
| Scissor and transform | Set/Intersect use translated bounds; Intersect replaces the legacy scissor; SetInverse is a no-op; transform/null pointers forward unchanged |

The fixture creates no Core contexts, JS runtime or Lua models. The linked
binding-only invalidation hook asserts if reached. It does not render to a GPU
or validate an application renderer's visual output.

## SFML consumer evidence

Six existing runtime suites pass **68 scenarios, zero failures** on macOS
arm64: renderer startup 11, geometry 12, render state 16, layers 9, batching 7
and callback textures 13.

Real window captures check geometry submission snapshots, textured/custom-GLSL
drawing, scissor and affine transforms, clip-mask Set/SetInverse/Intersect,
mask disabling, Blend/Replace, blur and saved mask/texture snapshots. The new
mask case checks visible and hidden pixels for both inverse and intersection
operations, then confirms that disabling the mask exposes previously hidden
pixels. The window requests eight stencil bits.

Lifecycle cases cover retained manager/window ownership, unused renderer GC,
generation invalidation, callback restrictions, texture/source lifetimes and
shutdown cleanup. The existing 32-frame static selection case still records
zero host callbacks and zero ownership/snapshot scans.

Native naming, formatting, fixture style and package lint pass. The
[evidence](renderer-native-evidence.json) stores current fixture, consumer and
production-source fingerprints and persistent log fingerprints. Production
rendering code was not changed in this phase; a full package rebuild was not
repeated. Earlier full package reports remain fingerprinted checkpoints.
This source review was performed by the implementer, not independently.

## Open semantics

Declaration coverage does not close built-in gradient and `shader(creation)`
protocols, eight built-in color filters, readable base layers, backdrop
combinations, perspective interpolation, deeper/transformed clipping or
resource/allocation/shader failure protocols. The corresponding declaration
rows retain explicit partial statuses. GPU execution time was not measured.

The [cumulative reconciliation](full-inventory-reconciliation.json) now
contains 17 maps: 3,761 represented declarations and 165 unmatched declarations.
All 14 prior on-disk declaration maps retain their exact bytes.
Representation includes pending and partial records; it is not a pass count.
The remaining full-binding, platform, modules, applications and package/editor
acceptance work continues.
