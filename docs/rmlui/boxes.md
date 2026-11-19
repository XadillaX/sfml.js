# Box values and rendering boxes

`Box` owns an independent native `Rml::Box`. Construct it without a runtime:

```js
const { Box, BoxArea, BoxEdge } = require('sfml.js-rmlui');

const box = new Box({ x: 80, y: 50 });

box.setEdge(BoxArea.Padding, BoxEdge.Top, 7);
box.content[0] = 100;
box.edges[BoxArea.Margin * Box.numEdges + BoxEdge.Left] = -4;
```

`content` is a writable `Float32Array` over native x/y content size.
`edges` maps exactly 12 native floats: Margin, Border, Padding, each ordered
Top, Right, Bottom, Left. `Box.numAreas` is three, excluding content;
`Box.numEdges` is four. Views retain only the independent value. They survive
wrapper collection, element destruction, shutdown and subsequent runtime
generations. Independent values can also be created in Node workers.

`getSize()` reads content size; `getSize(area)` includes the requested area and
all inner areas. `getPosition(area = BoxArea.Content)` is relative to the
border's top-left corner. Margin positions can be negative.
`getEdge(area, edge)` and `setEdge(area, edge, size)` accept only Margin,
Border and Padding. `getCumulativeEdge(area, edge)` sums from Margin inward
through the requested area; Content includes edges through Padding.

`getSizeAcross(direction, area, areaEnd = BoxArea.Content)` includes both
endpoints, with outer area preceding inner area. Direction is
`BoxDirection.Vertical` or `Horizontal`. `getFrameSize(area)` excludes inner
areas; for Content it returns content size. Auto is not a concrete box area.

`setContent(size)` and `setEdge(...)` update the same native fields as their
views. Queries return independent `{ x, y }` snapshots. `clone()` copies the
value. `equals(other)` and `notEquals(other)` preserve upstream operators:
Box compares edge bytes exactly, so positive and negative zero edges differ.

## Element layout boxes

After `context.update()`, `element.getBox()` returns an independent main box.
`element.getBox(index)` returns `{ box, offset }`; the offset is measured from
the main box. Out-of-range indices return the main box with zero offset, as in
RmlUi 6.3. The binding rejects INT32_MIN because upstream subtracts one before
checking the index, which would overflow.

`element.setBox(box)` copies the value and clears additional boxes.
`element.addBox(box, offset)` copies an additional box and its offset.
Subsequent edits to the input value do not affect the element.
`getNumBoxes()` counts the main box plus additional boxes. These are manual
layout operations; a later native layout pass can replace their results.

## Rendering boxes

`element.getRenderBox(fillArea = BoxArea.Padding, index = 0)` creates an
independent `RenderBox`. The fill area must be Border, Padding or Content.
Its index follows `getBox(index)` fallback behavior. Native rounding is
preserved, including rounded additional-box offsets and main padding size.

`new RenderBox(fillSize, borderOffset, borderWidths, borderRadius)` constructs
a value independently of an element. Widths and radii are four-number arrays:
`EdgeSizes` uses Top, Right, Bottom, Left, and `CornerSizes` uses TopLeft,
TopRight, BottomRight, BottomLeft.

`fillSize`, `borderOffset`, `borderWidths` and `borderRadius` are writable
shared `Float32Array` views. Their `get...()` methods return copies;
`set...()` methods update the native fields. `getFillOffset()` returns
`{ x: leftBorderWidth, y: topBorderWidth }`. `clone()`, `equals()` and
`notEquals()` operate on native values. RenderBox equality uses numerical
component comparisons, unlike Box's byte comparison of its edges.

Use finite native floats. Public setters validate all input before writing.
Queries and element setters reject non-finite fields introduced through shared
views. Vector or array accessors may throw without a partial native setter
write. Element handles are validated after argument accessors, so destroying
an element from an accessor raises an invalid-handle error.

See [layout and scrolling](layout.md) for element coordinates and projections.
