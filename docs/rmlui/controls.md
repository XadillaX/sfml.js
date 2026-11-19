# Form controls

All element-returning paths use native runtime types. Queries, traversal,
creation, cloning and event targets preserve the same wrapper identity.
`ElementFormControlInput`, `ElementFormControlTextArea` and
`ElementFormControlSelect` extend `ElementFormControl`; `ElementForm` extends
`Element`. A tag string does not determine the wrapper type.

```js
const { ElementFormControlInput } = require('sfml.js-rmlui');

const input = document.querySelector('input');

if (input instanceof ElementFormControlInput) {
  input.setName('message');
  input.setValue('A🌙中');
  input.setDisabled(false);

  input.focus();
  input.setSelectionRange(1, 3);

  console.log(input.getSelection()); // { start: 1, end: 3, text: '🌙中' }
}
```

Use `getName` / `setName`, `getValue` / `setValue`, `isDisabled` /
`setDisabled`, and `isSubmitted` for native control behavior.
`setDisabled(false)` removes the attribute. `isSubmitted()` checks the
type-specific submission state separately from disabled state.

`form.submit(name = '', value = '')` dispatches the native `submit` event.
An empty submitter name uses the `submit` key. Disabled, unnamed and
non-submitted controls are omitted; duplicate names join their values with
`, `. This operation does not issue an HTTP request.

## Native attribute-backed controls

`ElementFormControl.createInstancer(valueAttribute = 'value')` creates an owned,
callback-free native allocator for this abstract base. `GetValue` reads the
selected attribute as a native string, defaulting to empty; `SetValue` writes
the same attribute. Name, disabled, focus and default `IsSubmitted = true`
come from the real native base. Update the context before reading computed
focus behavior after changing disabled state.

```js
const { ElementFormControl, Factory } = require('sfml.js-rmlui');

const allocator = ElementFormControl.createInstancer('payload');

Factory.registerElementInstancer('value-field', allocator);

const field = Factory.instanceElement(null, 'value-field', 'input', {
  name: 'answer', payload: 'Native value',
});

if (!(field instanceof ElementFormControl)) {
  throw new Error('Expected a native form control');
}

field.setValue('Updated');
console.log(field.getAttribute('payload')); // Updated

allocator.releaseElement(field);
```

Native `data-attr-payload` bindings can update the same value from shared data
without per-control JS value callbacks. JS subclass methods do not override
native virtuals. Direct `new ElementFormControl(tag)` remains invalid.
Factory applies allocation attributes; direct `allocator.instanceElement`
does not apply them. Direct control clones retain the original allocator and
attribute key after registry replacement; they copy release observers without
replaying JS allocation callbacks. Ancestor clones reparse descendants using
current Factory registrations. Allocators and elements expire at shutdown.

Native `Form::Submit` selects only `input`, `textarea` and `select` tags.
Register the allocator for one of those tags or supply one as the actual tag
when using Factory; an arbitrary custom tag is not selected for submission.
Attached controls must be detached before explicit release.

## Text input and text areas

`select()`, `setSelectionRange(start, end)` and `getSelection()` work with
Unicode code-point offsets, not JavaScript UTF-16 indexes or UTF-8 byte offsets.
Selection changes require focus. Call `context.update()` before normal input;
`element.focus(focusVisible = false)` returns the native success boolean.
`element.blur()` releases focus. Non-text/password input types ignore text
selection and return `{ start: 0, end: 0, text: '' }`.

Password inputs return `*` masks in the selection's `text`; the offsets still
count the original Unicode code points. `getValue()` and form submission retain
the actual value. Selecting the password `密🌙` returns
`{ start: 0, end: 2, text: '**' }`.

`setCompositionRange(start, end)` sets native IME feedback. An end no greater
than the start clears it. This call does not change or commit text, nor does
it establish platform IME support.

Text areas also expose `setNumColumns` / `getNumColumns` (default 20),
`setNumRows` / `getNumRows` (default 2), `setMaxLength` / `getMaxLength`
(default -1, unlimited), and `setWordWrap` / `getWordWrap` (default true).
Row/column setters clamp to at least one. Changing the maximum length truncates
existing text by code points; native `setValue` may subsequently exceed it.
User editing applies the length limit.

`element.getIntrinsicDimensions()` returns
`{ valid, dimensions: { x, y }, ratio }` from the native virtual method.
Unassigned outputs start at zero. This includes text-area and input overrides;
font-dependent values require a loaded font and current style/layout.

## Native text-input lifecycle

`new TextInputHandler()` records native lifecycle notifications without
per-widget JS callbacks. Pass it as the fifth argument of
`createContext(name, width, height, renderer, handler)`, or select it globally
with `setTextInputHandler(handler)`. Existing contexts keep their original
selection. Global selections stay alive through shutdown.

```js
const { TextInputHandler, createContext } = require('sfml.js-rmlui');
const handler = new TextInputHandler();
const context = createContext('editor', 800, 600, null, handler);

// Load/show a document, update layout, then focus a text input.
const events = handler.drainEvents();

for (let i = 0; i < events.kinds.length; ++i) {
  const input = events.contexts[i];

  if (events.kinds[i] === 0 && input?.isValid) {
    input.setCursorPosition(0);
  }
}
```

`drainEvents()` uses one addon entry. Its native-owned `Uint32Array` snapshot
contains 0 activate, 1 deactivate and 2 destroy; `contexts` contains the
matching canonical `TextInputContext` capabilities. Drain regularly to release
notification history. Numeric snapshots survive handler release and shutdown.

`TextInputContext` exposes `getBoundingBox()` (null on failed projection),
`getSelectionRange()`, `setSelectionRange()`, `setCursorPosition()`,
`setText()`, `setCompositionRange()` and `commitComposition()`. Editing runs in
Native. Offsets are nonnegative int32 Unicode code points with an exclusive
end; ordered ranges are required. `setText()` bypasses maxlength, while
`commitComposition()` applies it to the text remaining outside the replacement.
The pinned source corrects the upstream composition-length calculation.
An empty composition range performs no replacement.

Explicit `onActivate` / `onDeactivate` constructor callbacks run synchronously
and may only reenter the checked `TextInputContext` methods. `onDestroy` runs
at the next safe native boundary after invalidation, never inside a destructor
or V8 finalizer. It cannot inspect or edit the destroyed widget. Blur preserves
the capability; widget destruction, input type changes and shutdown invalidate
it. `isValid` remains readable after shutdown. These contracts do not install
or verify a platform IME or candidate window.

Handler construction and global selection are available before initialization.
Pending handlers belong to the next successful initialization. A rejected
initialization preserves that selection. Shutdown invalidates them even if
initialization never ran, and Node environment cleanup releases them without
invoking JS. Creating a handler claims the setup owner environment; foreign
workers cannot access its settings. A null selection before initialization
chooses the upstream default when initialized; a null selection afterward
disables the global handler for new contexts.

## Select options

`setSelection(index)` selects an option; an out-of-range index clears selection
in the pinned 6.3 implementation. `getSelection()` returns an index or -1.
`getOption(index)` returns the canonical option or null; `getNumOptions()`
counts options. The latter two prepare pending children and may destroy
non-option children, so calls during native event callbacks are rejected.

`add(rml, value, before = -1, selectable = true)` adds option content.
`add(element, before = -1)` transfers a detached owned `option`; call
`removeChild` before moving an attached element. Identity survives the transfer.
An out-of-range insertion index appends. Invalid ownership, document insertion
and cycles are rejected before ownership is consumed.

`remove(index)` destroys that option; an out-of-range index is a no-op.
`removeAll()` destroys every option. Retained wrappers reject access afterward.
`showSelectBox()` opens the popup; `hideSelectBox()` closes it retaining the
current value; `cancelSelectBox()` restores the opening value and closes it.
`isSelectBoxVisible()` reports native popup state.

New control mutations reject callback reentry; pure value/selection reads
remain available. Listener exceptions propagate after the native operation
returns. Destruction and shutdown invalidate all aliases, as described in
[document lifetimes](./documents.md).

For non-form elements, see [text, progress and tabs](./text-panels.md).
