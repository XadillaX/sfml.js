# Native geometry and convolution

`MeshUtilities` appends upstream quad, line, background and border geometry to
a Native-owned `Mesh`. `ConvolutionFilter` runs the upstream alpha filter on
byte views. These value utilities also work before initialization and after
shutdown; creating renderable `Geometry` still requires a live render manager.

## Mesh generation

```js
const { Mesh, MeshUtilities, RenderBox } = require('sfml.js-rmlui');
const mesh = new Mesh();
const colour = { red: 60, green: 30, blue: 10, alpha: 120 };

MeshUtilities.generateQuad(mesh, { x: 2, y: 3 }, { x: 4, y: 5 }, colour);
MeshUtilities.generateLine(mesh, { x: 0.4, y: 0.6 }, { x: 2.4, y: 1.6 }, colour);
const box = new RenderBox(
  { x: 30, y: 20 }, { x: 2, y: 3 }, [ 1, 2, 3, 4 ], [ 15, 9, 7, 5 ]);

MeshUtilities.generateBackgroundBorder(
  mesh, box, colour, [ colour, colour, colour, colour ]);
```

Colours contain already premultiplied RGBA bytes; no automatic multiplication
occurs. `generateQuad` defaults to UV corners `(0,0)` and `(1,1)` and accepts
both corners as optional final arguments. `generateLine` rounds both edges to
the pixel grid. Background operations use `RenderBox` widths, offsets and
corner radii. Zero-alpha background or borders are omitted.

Operations append indices with the existing vertex offset. If an exported
vertex or index view retains the previous allocation, append copies that
prefix once and leaves the old view independent. Otherwise Native reuses the
mesh and grows capacity geometrically. Obtain new views after append.
`RenderManager.makeGeometry(mesh)` validates and snapshots the resulting mesh.

## Shared command batches

```js
const commands = MeshUtilities.allocateCommands(2);

commands.set([ 0, 2, 3, 4, 5, 60, 30, 10, 120, 0, 0, 1, 1 ]);
commands.set([ 1, 0.4, 0.6, 2.4, 1.6, 60, 30, 10, 120 ],
  MeshUtilities.commandStride);
const batched = new Mesh();

MeshUtilities.append(batched, commands);
```

The allocation is a writable Native-owned `Float32Array`. A batch enters Native
once, validates every selected record before writes and generates geometry
without copying the command buffer. `append(mesh, commands, count)` executes a
prefix; omitting `count` executes all records.

Each record has `commandStride` fields, currently 40:

| Operation in field 0 | Fields |
| --- | --- |
| Quad: 0 | 1–4: x/y/width/height; 5–8: RGBA; 9–12: u0/v0/u1/v1 |
| Line: 1 | 1–4: x/y/width/height; 5–8: RGBA |
| Background: 2 | 1–2: fill size; 3–4: border offset; 5–8: widths; 9–12: radii; 13–16: RGBA |
| Background and border: 3 | Background fields, then 17–32: top/right/bottom/left RGBA |

Widths and radii follow `RenderBox` ordering. Reserved fields are ignored.
Coordinates must be finite; colours are integer bytes; fill sizes, widths and
radii must be nonnegative. Detached or concurrently shared backing is rejected.

## Alpha convolution

```js
const { ConvolutionFilter, FilterOperation, ColorFormat } =
  require('sfml.js-rmlui');
const filter = new ConvolutionFilter();

filter.initialise({ x: 1, y: 0 }, FilterOperation.Sum);
filter.kernel.set([ 0.25, 0.5, 0.25 ]);
const source = ConvolutionFilter.allocateBytes(3);

source.set([ 40, 80, 120 ]);
const output = ConvolutionFilter.allocateBytes(3);

filter.run(output, { x: 3, y: 1 }, 3, ColorFormat.A8,
  source, { x: 3, y: 1 }, { x: 0, y: 0 }, ColorFormat.A8);
console.log(Array.from(output)); // [40, 80, 80]
```

`initialise(radius, operation)` creates a square kernel; x/y radii create a
rectangular kernel. Negative radii return `false` and preserve the old kernel;
invalid enums and allocation bounds throw. `getRow(index)` maps a checked row.
Reinitialization replaces storage; previously returned rows and kernels remain
valid and independent, including after wrapper collection and shutdown.

`run` crosses into Native once. Source rows are tightly packed; the destination
stride is in bytes and only alpha changes. RGBA colour channels and padding
remain untouched. Source offset is relative to the destination origin.
Buffers must be live, nonoverlapping byte views without concurrent shared
backing. The kernel must be initialized and contain finite, bounded weights.
`Sum` saturates above 255. Negative Sum weights incur a Native preflight and
throw before any write if an output alpha is negative. `Dilation` selects the
largest weighted alpha, with a minimum of zero.

See the [API guide](api.md) for value types and resource lifetimes.
