# Element classes, attributes and focus

## Native style component

`getStyle()` returns the canonical element-owned
[`ElementStyle`](/reference/rmlui/classes/ElementStyle.html). Its class and
pseudo-class setters call the component directly; call `updateDefinition()`
after changing them. `setClass` returns membership change. `setPseudoClass(name,
activate, overrideClass = false)` returns active membership change; normal,
override and combined bits are 1, 2 and 3. Clearing normal activation preserves
an override. `getClassNameList()` and `getActivePseudoClasses()` copy native
state.

`setProperty(id, property)`, `setCustomProperty('--name', property)` and
`setVarShorthand(id, property)` copy typed native properties and dirty the
appropriate ID/name. The last requires a registered global shorthand and a
VAR_EXPRESSION string. `removeProperty`, `removeCustomProperty` and
`removeVarShorthand` remove their inline overrides. `getLocalStyleProperties()`
copies the full inline dictionary, including custom and shorthand maps.

`getProperty` and `getCustomProperty` resolve cascade, inheritance and
variables. `getLocalProperty`, `getLocalCustomProperty` and `getLocalShorthand`
copy local values without substitution; `getLocalPropertyWithResolvedVariables`
resolves a locally specified value. `getSpecifiedProperty`,
`getSpecifiedCustomProperty` and `getSpecifiedShorthand` preserve the cascade
before substitution. All return independent native snapshots or null.
`iterate()` snapshots unique numeric plain IDs; `iterateAll(filter = null)`
includes custom properties and shorthands, skips shorthand placeholders and
preserves upstream cascade filtering.

`resolveNumericValue(value, base)` and `resolveRelativeLength(value,
RelativeTarget)` use native arithmetic with a single finite numeric unit.
`dirtyProperty`, `dirtyInheritedProperties`, `dirtyPropertiesWithUnits` and
`dirtyPropertiesWithUnitsRecursive` retain actual native dirty semantics; the
recursive operation includes non-DOM children. `anyPropertiesDirty()` checks
properties, variables and shorthands.

```js
const style = element.getStyle();

style.setClass('selected', true);
style.updateDefinition();
style.setProperty(PropertyId.Width, new Property(24, Unit.PX));
const values = new ComputedValues(element);
const dirty = style.computeValues(
  values, parent.getComputedValues(), document.getComputedValues(),
  true, 1, { x: 320, y: 240 },
);

for (const id of dirty) {
  style.dirtyProperty(id);
}

context.update();
```

`computeValues` writes owned values associated with this element, consumes its
real dirty sets and propagates inherited dependencies to children. Execute
parents before children. It does not call Element's property-change hook or
update layout. Redirty returned IDs before the subsequent native layout update.
Positive finite density and finite viewport values are required; readonly
output, foreign associated elements and expired font handles reject.

`resolveKeyFrameProperty(id, propertyOrNull, block, resolver)` uses native
variable and shorthand expansion. A `KeyFramePropertyResolver` reuses the
optional cache, dependency set and output storage; call `reset()` before
changing the block or variable environment. Keyframe local variables come from
the block dictionary, followed by stylesheet/ancestor lookup.
`hasSubstitutedShorthands` reports the lazy cache; `variableDependencies` copies
the last resolution's dependencies. Results are owned snapshots or null on
failure. Element destruction invalidates the style; shutdown invalidates both
the style and resolver.

High-frequency numeric style work uses `ElementCommandBuffer` shared planes:
`StyleSetNumeric`, `StyleRemoveProperty`, `StyleGetNumeric`,
`StyleGetLocalNumeric`, `StyleResolveNumeric` and `StyleResolveRelativeLength`.
The relative opcode stores `RelativeTarget` in `properties`. One submit consumes
the ordered prefix in Native without per-element addon calls. Buffers retain
their existing snapshot, lifetime and callback rules.

## Element operations

`setClassNames(names)` replaces the complete native class list.
`getClassNames()` returns its space-separated form. `setPseudoClass(name,
active)`, `isPseudoClassSet(name)` and `arePseudoClassesSet(names)` operate on
native pseudo-classes without a leading colon. An empty list passes the
all-active check. `getActivePseudoClasses()` returns an independent snapshot.

`getAddress(includePseudoClasses = false, includeParents = true)` returns
RmlUi's address, such as `div#item.selected:hover < body`. It reads from the
leaf toward its ancestors and is not a CSS selector.

```js
element.setClassNames('item selected');
element.setPseudoClass('invalid', true);
element.setAttributes({
  title: 'Inventory',
  count: 12,
  sequence: 9223372036854775807n,
  position: { x: 20, y: 40 },
});
const count = element.getAttribute('count', 0);
const raw = element.getAttributeValue('sequence');
```

`setAttribute(name, value)` and `setAttributes(values)` support strings,
booleans, numbers, signed/unsigned 64-bit BigInt, vectors, tagged colours and
null. Null stores native Variant NONE; it does not remove the key. Use
`hasAttribute(name)` to distinguish an absent key from NONE, and
`removeAttribute(name)` to remove it. `getNumAttributes()` counts native keys.

Bulk setting merges keys and calls native `OnAttributeChange` once for the
group. All JS getters and conversions finish before borrowing the receiver
and applying the group. Conversion errors leave existing attributes unchanged.
The native callback itself may perform side effects; this is not a rollback
transaction. Input type changes preserve the same subtree-destruction guards
as individual attribute updates. Mutating an active dispatch target's
attributes can throw; read operations remain available in callbacks.

The original `getAttribute(name)` returns native string conversion or null.
`getAttribute(name, defaultValue)` selects the native conversion template from
the default's type. Numbers select double. BigInt selects int64, or uint64 when
the default exceeds INT64_MAX. Missing keys return the fallback. Native
conversion rules apply: invalid numeric strings become zero for a number
default, while an invalid integer string retains a BigInt fallback. Unsafe
number/string-to-integer ranges throw before native conversion. A null
default is rejected because it does not identify a conversion type.

`getAttributeValue(name)` returns a raw value snapshot, with null for either
an absent key or NONE. `getAttributes()` copies all keys and values into own
data properties. Vectors and colours are copied; the snapshots remain readable
after element destruction and changing them does not change native attributes.

Attribute values accept lifetime-guarded element references, owned style
lists and transforms, and typed script or opaque-pointer values. Use the
[`VariantValue`](/reference/rmlui/types/VariantValue.html) types to select the
native representation; an arbitrary host object requires a typed pointer
selector or checked native provenance. Event parameters additionally support
callback-scoped element references. See [native values](./numeric-values.md).

`getContext()` returns the canonical context through the owner document.
Detached elements and the context root itself return null, matching native
`Element::GetContext`. `getFocusLeafNode()` returns the deepest focus descendant
or the receiver itself when no descendant is focused.

See [document controls](./documents.md) and
[native types and default actions](./rtti-default-actions.md).

`getEventDispatcherSummary()` copies the native debug string, such as
`click (2)`, counting capture and non-capture registrations together. An
element without listeners returns an empty string.

`getEventDispatcher()` returns the canonical element-owned
[`EventDispatcher`](/reference/rmlui/classes/EventDispatcher.html).
`attachEvent(idOrName, listener, capture = false)` and
`detachEvent(idOrName, listener, capture = false)` share registrations with
Element's listener methods; identical registrations are idempotent.
`detachAllEvents()` recursively removes every listener, including native widget
listeners and non-DOM children. Active callbacks finish safely; typed detach
notifications run at the outer boundary with copied element identities.
`toString()` returns the same native summary. Destruction and shutdown invalidate
the component; its token retains detached elements.

```js
const dispatcher = element.getEventDispatcher();

dispatcher.attachEvent(EventId.Click, onClick);
EventDispatcher.dispatchEvent(
  element, EventId.Click, 'click', {}, true, false, DefaultActionPhase.Target,
);
dispatcher.detachEvent(EventId.Click, onClick);
```

Static `dispatchEvent(target, id, type, parameters, interruptible, bubbles,
defaultActionPhase)` requires all flags. The id selects listeners, while type
is an independent copied name. Registered defaults are not consulted.
`TargetAndBubble` runs ancestor default actions even when bubbles is false,
matching upstream. Parameter accessors run before target validation.

`getClosestScrollableContainer()` checks this element before its ancestors.
Call `context.update()` first. Auto/scroll overflow qualifies only when content
exceeds the client area on that axis; `overscroll-behavior: contain` qualifies
without overflowing content. A missing container returns null.

`getDataModel()` returns the same checked `DataModelConstructor` as context
lookup, or null when no model is attached. Native detachment clears the
association, and reinsertion follows the new parent's model. Model removal
invalidates retained model handles. Destroying an element invalidates its
queries; a retained model follows its context lifetime. The lookup uses the
existing native pointer index without scanning model or element collections.
