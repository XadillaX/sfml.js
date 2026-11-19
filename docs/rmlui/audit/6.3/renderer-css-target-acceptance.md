# RmlUi 6.3 CSS combinations and allocation observations

The macOS native wrapper passes 107 assertions: the previous 73 renderer,
shader, filter, resource and startup observations, twelve target-allocation
groups, ten actual CSS reference captures, ten CSS image comparisons and two
CSS repeat/order groups. Whole platform/application acceptance remains open.

## Actual CSS rendering

[`effect-scenes.h`](../../../../packages/sfml.js-rmlui/test/native/rendering/css/effect-scenes.h)
defines real RML documents rendered by upstream Core and each backend.
The ten scenes cover an unfiltered baseline; foreground filters; backdrop
filters; gradient masks; all two-way and three-way combinations; and transformed
rounded overflow with asymmetric geometry and partially transparent children.
No external fonts, textures or scripts participate.

The reference uses the pinned official GL3 renderer. The SFML driver uses only
SFML draw/readback APIs. Both render the same parsed document and reject parser
warnings. All ten comparisons pass the existing maximum-channel bound of 2 and
mean RGB bound of 0.1. Observed maximum error is 1 and maximum mean error is
0.00386702. Every filtered scene differs from its baseline; the complete
combination also differs from each combination with one component removed.

Every SFML image repeats exactly in consecutive frames and in reverse scene
order. Transparent UI-base corners and premultiplied channels are checked
before host presentation. These observations validate the fixture combinations,
not all official applications or the full VisualTests corpus.

## Allocation and captured texture ownership

[`render-target-contracts.cc`](../../../../packages/sfml.js-rmlui/test/native/rendering/layers/render-target-contracts.cc)
checks base creation, a resized base, additional and nested layers, all three
scratch targets, capture-target allocation, capture-output texture allocation
and mask-record allocation. Each failure preserves the layer stack, host
pixels and full host view and permits retry. Scratch counters include only
targets that were successfully allocated; a failed output allocation still
counts its preceding actual capture draw.

The executable replaces selected SFML allocation boundaries and forwards
successful work to installed SFML. Constructor delegation makes simulated
driver failures reachable despite dylib-local binding. The mask-record probe
arms one `std::bad_alloc` only after a real captured texture finishes its copy,
and observes the corresponding deallocation. A regression run reproduced the
orphaned texture. The production renderer now adopts that texture under RAII
before allocating or registering its filter record.

The standalone CSS executables do not create Lua data models. Their binding
cleanup boundary rejects unexpected model invalidation; ordinary upstream Core,
CSS traversal, geometry and rendering remain actual native code.

## Remaining acceptance

The resource checkpoint separately records a complete 135-file runtime with
1,393 passes and exact Core reconciliation. This newer wrapper result is a
focused observation; a new full runtime is recorded separately when completed.
Platform IME/device work, twenty official applications, 113 VisualTests pages,
site/editor/package CI and independent whole-change acceptance remain required.
