# Text, progress and tabs

`Document.createTextNode(text)` returns `ElementText | null`. Queries, traversal,
clones and event targets preserve native subclasses and wrapper identity.
`ElementText`, `ElementProgress` and `ElementTabSet` inherit `Element`.

## Text layout

`getText()` / `setText(text)` access literal raw text. Load a font and update
the owning context before measuring or rendering text.

```js
const text = document.createTextNode('A🌙中 &amp; Z');

document.getElementById('content').appendChild(text);
context.update();
const line = text.generateLine(1, Infinity, 0, true, true, false);
// { line: '🌙中 & Z', lineLength: 15, lineWidth: ..., reachedEnd: true }
```

`generateLine(lineBegin, maximumLineWidth, rightSpacingWidth,
trimWhitespacePrefix, decodeEscapeCharacters, allowEmpty)` maps all native
inputs without implicit defaults. `lineBegin` and returned `lineLength` use
**UTF-8 source bytes**. The start must be an int32 character boundary between
zero and the byte length inclusive. JavaScript UTF-16 indexes cannot be used
directly. Consumed bytes can differ from the formatted line's byte length.

The maximum width is nonnegative; `Infinity` means unlimited. Right spacing
is a finite float reserved after the last token. Native RCSS whitespace,
word-break and text-transform rules control formatting. `allowEmpty` permits
zero consumption when no token fits. A forced line break can return false even
if it consumes the final source bytes. Without a font, the native result is
`{ line: '', lineLength: 0, lineWidth: 0, reachedEnd: true }`.

`generateLine` measures without adding a line. `clearLines()` removes lines;
`addLine({ x, y }, text)` adds formatted content at a finite baseline offset
from the first line. `suppressAutoLayout()` prevents subsequent text changes
from dirtying layout; this native setting is one-way, and unrelated document
changes may still trigger layout.

`getLines()` returns copied `{ text, position: { x, y }, width }` records.
Their native integer width starts at zero and is updated during geometry
generation. Copies remain valid after layout, line removal and element
destruction. Modifying copies does not affect the element.

## Progress

`getValue()` returns the value clamped to `[0, getMax()]`; the default is zero.
`setValue(value)` stores a finite float. `getMax()` defaults to one, also
returning one for nonpositive stored maxima. `setMax(value)` stores a finite
float. `getIntrinsicDimensions()` uses the native progress override:
width is 256 density-independent pixels, height is the current line height.
The unspecified ratio remains zero.

## Tab sets

`setTab(index, rmlOrElement)` and `setPanel(index, rmlOrElement)` support both
native overloads. Existing int32 indices are replaced; other indices append
without filling gaps. An element argument transfers a detached owned tree.
Remove attached nodes from their parent first. Replacing or removing a title
or panel destroys it and invalidates retained wrappers.

`removeTab(index)` removes the matching title and panel if present.
`getNumTabs()` counts titles, independently of the panel count. It may create
the internal tabs container. `getActiveTab()` starts at zero even for an empty
tab set. `setActiveTab(index)` stores an unclamped int32 index and dispatches
`tabchange` with `parameters.tab_index` only when the index changes. Native
click default actions also change the active tab.

Text layout/mutation and progress/tab mutations reject event callback reentry.
`getNumTabs()` also rejects it because it can mutate the tree. Pure text,
line-snapshot, progress-value and active-tab reads remain available. Listener
exceptions propagate after native operations return.

The inherited `processDefaultAction(event)` is available during callbacks;
see [native types and default actions](./rtti-default-actions.md).
See [form controls](./controls.md) and [document lifetimes](./documents.md).
