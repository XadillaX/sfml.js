# Shared storage, batching and preloading

Native owns model storage, resources, layout and rendering. Keep numeric views
and command arrays between frames; write their bytes in JavaScript, then notify
or submit once. See [native data models](data-models.md) for storage setup and
[local measurements](audit/6.3/architecture-performance-results.md) for evidence.

## Numeric element commands

Register elements once. Property selectors use `PropertyId`; numeric values
use `Unit`, so a width does not require constructing and parsing a `"2px"` string.

```js
const commands = new rmlui.ElementCommandBuffer(context, elements);

commands.opcodes.fill(rmlui.ElementCommandOpcode.SetNumeric);
commands.properties.fill(rmlui.PropertyId.Width);
commands.units.fill(rmlui.Unit.PX);

for (let i = 0; i < elements.length; i++) {
  commands.elements[i] = i;
  commands.numbers[i] = values[i] + 1;
}

commands.submit(elements.length);
```

The Native consumer validates and snapshots the entire prefix before executing
it in order. Queries see earlier writes. Prevalidation failure consumes nothing;
an execution failure preserves the completed prefix in `commands.consumed`.
Retained views remain safe after reserve, collection and shutdown.

## Explicit data-view batches

Use `DataBatchView` when many attached elements need the same numeric JS
calculation. Each expression corresponds to one registered element slot.
The example assumes the elements belong to `model` and each expression resolves
to its numeric source. Choose the ordering offset to preserve dependencies;
`999` places this example after the default attribute views at the same depth.

```js
const batch = new rmlui.DataBatchView(model, elements, expressions,
  (current, count) => {
    const { commands, slots, inputs } = current;

    for (let i = 0; i < count; i++) {
      commands.elements[i] = slots[i];
      commands.numbers[i] = inputs[i] + 1;
    }

    return count;
  }, { sortOffset: 999 });

batch.commands.opcodes.fill(rmlui.ElementCommandOpcode.SetNumeric);
batch.commands.properties.fill(rmlui.PropertyId.Width);
batch.commands.units.fill(rmlui.Unit.PX);
```

Each callback receives a contiguous dirty interval in the existing Native
scheduler order. Other groups and legacy views can split intervals; one group
does not guarantee one callback in every document. Throwing applies no returned
commands. JS getters and transforms retain their own callbacks, and legacy
per-element APIs keep their execution order and side effects.

## Prepare resources before showing the window

Initialize first, hide the window, and await all texture and font descriptors.
Texture paths must match the resolved document or stylesheet sources.

```js
window.setVisible(false);
await rmlui.preloadResources({
  textures: [ 'images/menu.png' ],
  fonts: [{ source: 'fonts/menu.ttf', family: 'Menu' }],
});
document.show();
context.update();
window.clear(sfml.Color.Black);
window.flush();
context.render();
window.display();
window.setVisible(true);
```

Native workers read files, decode images and premultiply alpha. GPU uploads and
font registration occur on the owning thread. Font atlases are generated during
layout/render; the hidden frame warms them before presentation. Identical
concurrent descriptors share preparation and commit. An optional `signal` aborts
one request; `renderInterface` selects the texture cache owner.

Failure rejects the promise while keeping earlier successful commits. Matching
resource release and shutdown invalidate pending commits. Font bytes remain
Native-owned until shutdown, and live texture handles survive cache eviction.

## Rendering boundaries

Context rendering merges consecutive compatible geometry in Native. Texture,
transform, clipping, shader, layer, capture and callback boundaries submit the
pending run first. Direct geometry calls retain immediate semantics. Unchanged
cached runs do not upload again; same-shape changes upload one affected vertex
range per chunk. State changes can still require multiple draws.

The measurements cover complete CPU frames on macOS arm64. They do not establish
GPU time, whole-engine zero allocations or full RmlUi 6.3 API coverage.
