# Element layout, scrolling and projection

Call `context.update()` after style or document changes before reading layout.
RmlUi's default `display` is `inline`, including for `div`; explicitly set
`display: block` where block layout is required.

`absoluteLeft` and `absoluteTop` locate the border corner in context pixels.
`offsetLeft` and `offsetTop` locate it relative to `offsetParent`, whose wrapper
retains element identity. `offsetWidth` and `offsetHeight` include borders
and padding, but exclude margins. `clientLeft` and `clientTop` are border
widths; `clientWidth` and `clientHeight` include padding and exclude scrollbars.

`getRelativeOffset(area = BoxArea.Content)` and
`getAbsoluteOffset(area = BoxArea.Content)` return independent `{ x, y }`
snapshots. `BoxArea.Margin`, `Border`, `Padding` and `Content` select the
measured area. `Auto` is accepted by `clipArea`, but not by offset queries.
`getContainingBlock()` copies the containing block dimensions.

`getPosition()`, `getFloat()` and `getDisplay()` return `StylePosition`,
`StyleFloat` and `StyleDisplay` enum values from native computed styles.
`getLineHeight()` returns computed pixels. `baseline` is measured upward from
the bottom margin edge; `zIndex` reads the native z-index. `isReplaced()`
identifies elements handling their own rendering.

```js
const {
  BoxArea, ScrollAlignment, ScrollBehavior, ScrollParentage,
} = require('sfml.js-rmlui');

context.update();
const border = element.getAbsoluteOffset(BoxArea.Border);

element.scrollIntoView({
  vertical: ScrollAlignment.Center,
  horizontal: ScrollAlignment.Nearest,
  behavior: ScrollBehavior.Instant,
  parentage: ScrollParentage.Closest,
});
```

`scrollLeft` and `scrollTop` are writable. Native setters round and clamp
offsets and synchronously emit `scroll` when they change. `scrollWidth` and
`scrollHeight` describe scrollable content including padding.
`scrollTo(offset, behavior = ScrollBehavior.Instant)` preserves native
two-axis behavior. `Smooth` progresses during regular `context.update()`
calls; `Auto` uses `context.setDefaultScrollBehavior(...)`.

`element.getElementScroll()` returns the canonical borrowed native scrollbar
component. `new ElementScroll(element)` creates a distinct owned component for
custom native-widget integration. `ScrollOrientation.VERTICAL` is `0` and
`HORIZONTAL` is `1`. Both forms expose `update()`, `enableScrollbar(direction,
elementWidth)`, `disableScrollbar(direction)`, `updateScrollbar(direction)`,
`getScrollbar(direction)`, `getScrollbarSize(direction)`,
`formatScrollbars()` and `updateProperties()`. Width must be finite and
nonnegative. An uncreated scrollbar is null; a disabled scrollbar's size is zero.

Owned components support `release()`; borrowed ones reject it. Release detaches
widget listeners while keeping the host's non-DOM scrollbar children, matching
the upstream destructor. Host destruction invalidates both forms. Owned
components retain detached hosts and their callback edges; release, native
destruction and shutdown remove that retention. GC teardown runs after the
outer native operation unwinds. Native arrow input scrolls only axes whose
overflow is `auto` or `scroll`.

Both `scrollIntoView(true)` and `scrollIntoView(false)` use the native boolean
overload, aligning vertically to the start or end. The options overload defaults
to vertical `Start`, horizontal `Nearest`, behavior `Instant` and parentage
`All`. `Adaptive` keeps visible content stationary and otherwise centers it.
`Closest` considers only the nearest scroll container. With `All`, only one
ancestor can animate smoothly; additional ancestors move instantly, matching
RmlUi 6.3.

`setScrollableOverflowRectangle(size, clampScrollOffset)` sets the native
overflow dimensions. Set the clamp flag when the final size is known.
Coordinates must be finite native floats; overflow dimensions must be
nonnegative. Invalid values and enum members throw before mutation.

`isVisible()` checks the element; `isVisible(true)` also checks ancestors.
`isPointWithinElement(point)` checks the border area in the element's plane.
For transformed screen coordinates, first call `project(point)` and check
its `{ success, point }` result. It preserves the caller's point. Singular
transforms fail. Native matrices refresh during `context.render()`, so render
after changing transforms before querying projections.

Detaching a tree clears offset-parent references into the old document,
resetting those native offset bases. Internal offset-parent relationships are
preserved. Reattaching and updating establishes new layout. This prevents
detached elements from dereferencing a destroyed document. Value snapshots
survive wrapper collection and runtime shutdown; live element operations throw
after destruction. Scroll callbacks use the normal active-subtree guards.

See [box values and rendering boxes](boxes.md) for construction and shared
numerical views. Typed style properties, full computed-value inspection and
animations have their own guides.

`setOffset(offset, offsetParent, offsetFixed = false)` writes the native layout
base. The offset parent must be a strict ancestor or null; this preserves the
native pointer's owning tree and prevents recursive offset cycles. Coordinates
must be finite. Fixed offsets ignore ancestor scrolling; native `position: fixed`
also implies this behavior. Position rules still apply, and a later layout
update may replace the manually supplied base. Detachment clears outgoing
offset parents before either tree can be destroyed.
