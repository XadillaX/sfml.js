# Typed properties and definitions

## Property ID specifications

`PropertyId` and `ShorthandId` belong to the main stylesheet specification.
`MediaQueryId` identifies the 14 media-query features; `FontFaceId` identifies
fields in `@font-face`. All four enums are generated from RmlUi 6.3 `Core/ID.h`.
Their values belong to distinct specifications. A media or font-face ID must
not be passed to an Element property method as a `PropertyId`.

Media queries are parsed and evaluated in Native when context dimensions,
pixel density or themes change. Resolution uses the RmlUi unit `x`, for example
`@media (resolution: 2x)`. Font-face declarations load sources in listed order;
omitted style, weight, fallback and face index select Normal, Auto, false and 0.

```js
const { MediaQueryId, FontFaceId } = require('sfml.js-rmlui');
const feature = MediaQueryId.AspectRatio;
const fontField = FontFaceId.FaceIndex;
```

## Owned Variants and conversion destinations

`new Variant(value)` stores an owned `Rml::Variant` in Native. An omitted value
selects `NONE`; another Variant preserves the exact native storage type in a
copy. `getType()` reads shared metadata. `clone()`, `assign(value)`, `move()`,
`moveAssign(source)` and `clear()` use native copy, assignment, move and clear
operations. Upstream moves preserve the source type; strings and containers
remain in their moved-from state, while numeric sources retain their value.
Shutdown changes the shared type to `NONE` and invalidates value operations.

`get(defaultValue)` preserves `Rml::Variant::Get<T>` defaults.
`getInto(defaultValue)` returns `{ success, value }` with the native boolean.
`getReference(VariantType.X)` checks exact storage before reading the native
reference; aggregate outputs are independent snapshots. Element copies share
a guarded lifetime slot, and `getElementValue()` returns canonical identity or
`null` after target destruction. Properties, attribute dictionaries and event
parameters accept owned Variants as native value copies.

```js
const { Variant, VariantType } = require('sfml.js-rmlui');
const value = new Variant('17, bad, 3');
const result = value.getInto({ type: 'vector3i', x: 91, y: 92, z: 93 });

// { success: false, value: { x: 17, y: 92, z: 93 } }
value.assign({ type: 'character', value: 0x1f600 });
value.getType() === VariantType.INT64;
value.get({ type: 'character', value: 0 }); // 128512
```

`vector2i`, `vector3i` and `vector4i` select integer vector destinations with
int32 components. Upstream has no corresponding Variant storage types, so
these selectors cannot be stored. String conversion uses native comma
splitting; insufficient components preserve the entire default, while failure
partway through preserves the converted prefix. Overflow checks visit only
components reachable by the native conversion.
`character` selects the `Rml::Character` enum, stored as `INT64`. Native enum
conversion first reads int64 and then yields uint32, without an extra Unicode
scalar restriction. Property and style queries use a zero-valued destination;
Element attributes, event parameters and Variant getters use the caller's
default. Native pointers without a typed adapter remain unsupported inputs.

String destinations, `Property.toString()`, `PropertyDefinition.getValue()`
and `PropertySpecification.propertiesToString()` throw `TypeError` when the
output would serialize a pointer. This includes nested decorator/filter
properties. An effect's existing cached text is returned without reading
hidden properties. Ordinary scalar conversion does not scan native owners.

String-to-bool conversion accepts `1`, `true`, `0` and `false` without case
sensitivity; it does not trim whitespace. String-to-float/double follows native
`atof`: nonnumeric text and empty strings convert successfully to zero.
Byte-colour conversion preserves the initial colour on empty-string failure;
nonempty invalid colour text resets it to opaque black before returning false.
Float-colour components use the same float parser, so a nonnumeric component
becomes zero.

A string destination is also its initial native output. Transition and animation
lists append to it; a nonempty effect list with cached text also appends.
Transforms, colour stops and box shadows replace it. Empty or null effect lists
produce `none`. Scalar float text uses three decimal places and removes trailing
zeros. Native `ToString`/`FromString` and direct converter specializations remain
C++ support for these consumers; the JS API selects conversions through values
and typed defaults.

`Element.getProperty(nameOrId)` immediately copies the native property.
The copy includes inheritance, default values, definition and source metadata.
Read cascading variables after `context.update()`. A missing property returns
`null`. `getLocalProperty(nameOrId)` reads inline overrides and matching RCSS
rules, excluding inheritance and defaults, and leaves variables unresolved.
`getLocalStyleProperties()` returns a snapshot
`Map<PropertyId, Property>` without class rules or custom variables.

```js
const { Property, PropertyId, Unit } = require('sfml.js-rmlui');
const width = element.getProperty('width');

element.setProperty(PropertyId.Width, new Property(120, Unit.PX));
element.setProperty('height', '30px');
console.log(width.toString()); // The previous value is unchanged.
element.removeProperty(PropertyId.Width);
```

`new Property()` uses native defaults: null/NONE value, UNKNOWN unit,
specificity -1, parser index -1, null definition and source. A single integer
argument selects the native enum constructor with KEYWORD unit. Supplying a
unit selects the value/unit constructor. JavaScript numbers use native DOUBLE
storage in this form; the enum form uses INT.

`{ type, value }` explicitly selects native numeric storage or a conversion
template. `byte`, `char`, `float`, `double`, `int` and `uint` take a finite
JavaScript number; integer types require an integer within their native range.
`byte` is 0–255, `int` is signed 32-bit, `uint` is unsigned 32-bit, and `char`
uses the current platform's native char range. `float` rounds to native
single precision. `int64` and `uint64` require an exact BigInt within their
signed or unsigned 64-bit range, including small positive unsigned values.
Raw value reads return a primitive number or BigInt.

```js
const count = new Property({ type: 'uint', value: 12 }, Unit.NUMBER);
const narrow = count.get({ type: 'int', value: 0 });

element.setAttribute('total', { type: 'uint64', value: 12n });
const total = element.getAttribute('total', { type: 'uint64', value: 0n });
```

The same selectors work with property, attribute and event templates. Native
Variant equality distinguishes storage types. RmlUi 6.3 has no byte-to-byte,
double-to-byte or string-to-char converter: raw byte reads preserve the byte,
but these template conversions keep the supplied attribute/event fallback or
the property's `T{}`. Unsafe floating-point and string integer conversions
throw before native casts or scans; valid decimal prefixes remain accepted,
including signed prefixes for unsigned string conversions. Input accessors
run before resolving the live receiver.

`value` copies scalar, vector, colour, color-stop, box-shadow, transform and
[transition/animation list](animation.md#typed-css-motion-values) Variants.
Element references retain canonical wrapper identity through copied properties
and attributes. `property.getElementValue()` and
`element.getElementAttribute(name, fallback = null)` select the native
`ScriptInterface*` conversion. A missing key or failed conversion uses the
fallback; a destroyed stored target converts successfully to null. Detached
targets remain alive while a reachable owner retains them. Removing or
replacing the value releases that edge; self and cross-element cycles collect.
Explicit release and DOM destruction null every copied native reference.
Shutdown invalidates owners from that runtime generation.

Element, Context and RmlEvent inputs use guarded native ScriptInterface
storage. `get({ type: 'scriptinterface', value: null })` selects the native
base-pointer template; attribute and event reads preserve the supplied fallback,
while Property uses a null destination. Context removal, event release and the
end of each event callback null all stored copies. Raw reads retain the original
Context or event facade. Copied owners retain targets through collectible JS
edges; unchanged frames do not scan owners.

Pointer values require the element adapter or scriptinterface selector.
`getAttribute(name)` and string-default reads, `Property.toString()` and
`PropertyDefinition.getValue(property)` reject pointer values. RML serialization
does not expose pointer addresses. Raw `value`, `getAttributeValue()` and
`getAttributes()` return an Element, Context, RmlEvent or null.

Decorator, filter and font-effect
Variants return `DecoratorList`, `FilterList` and `FontEffectList` resource
owners, also accepted by property, attribute and event inputs.

```js
const { FilterList } = require('sfml.js-rmlui');
const filters = new FilterList('blur(2px) brightness(75%)');

element.setProperty(PropertyId.Filter, new Property(filters, Unit.FILTER));
console.log(filters.value, filters.list);
```

These constructors parse RCSS through the native specification. `value` is the
original text, `isNull` identifies an empty native shared pointer, and `list`
returns copied declarations or owned `FontEffect` wrappers. Decorator entries include `type`, `isNamed`,
`paintArea` and `properties`; filter entries include `type` and `properties`.
Each property entry has an instancer-local `id`, `name` and owned `Property`.
Named decorator references resolve through the stylesheet later. Font-effect
metadata includes `hasUniqueTexture`, unpremultiplied `colour`, `layer`
(`FontEffectLayer.Back`/`Front`) and exact BigInt `fingerprint`.

Metadata edits do not mutate native declarations. Assigning a list to another
property retains its shared resource identity; separately parsing the same text
creates a different pointer. Empty input or `"none"` creates a typed null list
whose `value` is `''` and `list` is empty. Failed typed property conversion
returns that typed null list; attributes/events retain their supplied fallback.
The upstream CSS `font-effect: none` still reads as Variant NONE (`null`).
List owners survive DOM close and wrapper GC but require their original runtime
generation. Shutdown releases resources and invalidates list access; already
copied scalar metadata and numerical decoration records remain readable.
Font-effect wrappers themselves are invalid after shutdown.

`FontEffectList` also accepts `(effects, text?)` and has writable `value` and
`list`. Text writes do not parse RCSS; list writes preserve the supplied order
and capture immutable native effects. Each write creates new storage, keeping
previous Property and DOM snapshots. `[]` and writes to null allocate non-null
storage. Parsed RCSS lists retain the upstream back/front ordering.

`new FontEffect()` creates the native base effect: white colour, Back layer,
fingerprint `0n`, no unique texture, unsupported glyph metrics and no texture
output. Parsed effects retain their derived native behavior. Set `colour`,
`layer` or `fingerprint` to edit a wrapper, then assign it back into a list.
Writes copy metadata without mutating effects already held elsewhere. A copied
`colour` object is independent; assign the whole value to apply a change.

`FontGlyph` maps native `bearing`, `advance`, `bitmapDimensions` and
`colorFormat` fields through their corresponding `Int32Array` views. Bitmap
assignment copies the exact input view into native unique storage; `bitmapData`
and `bitmapOwnedData` expose retained writable byte views. Assigning either
sets the glyph's data pointer; `null` clears it. `weakCopy()` copies metrics
and shares the current allocation while reporting `bitmapOwnedData: null`.
Replacing the source bitmap or collecting its wrapper cannot invalidate a
weak copy or an exported byte view. These independent values survive shutdown.

`effect.getGlyphMetrics(glyph, origin?, dimensions?)` returns
`{ supported, origin, dimensions }`; defaults are zero origin and the glyph's
bitmap dimensions. `effect.generateGlyphTexture(bytes, dimensions, stride, glyph)`
calls native glyph generation into premultiplied RGBA bytes. Stride is measured
in bytes; row padding is preserved. Buffer bounds, format, detached/shared
buffers and source/destination overlap are checked.

`new FontEffect(callbacks)` accepts optional synchronous `hasUniqueTexture()`,
`getGlyphMetrics(glyph, origin, dimensions)` and
`generateGlyphTexture(destination, dimensions, stride, glyph)` overrides.
Omitted methods keep native base defaults. Metrics return the same
`{ supported, origin, dimensions }` record, using the actual input origin.
Glyph arguments are independent native-owned snapshots and may be retained.
Present source bitmaps must cover the declared dimensions, including during
custom metric calls; a null bitmap is valid for metrics.

Texture callbacks receive native-owned scratch storage with the original
stride. Row pixels begin with the destination contents, while padding begins
at zero. Only row pixels are committed on successful synchronous return.
Retained views never alias the destination. Exceptions, promises, detached
scratch buffers and transferred or shrunken destinations discard the write.
Recursive callbacks and runtime/DOM mutations are rejected; metadata edits
remain safe.

Lists, property snapshots, dictionary entries and nested declaration properties
retain custom effect callbacks, including property definition defaults.
Stylesheets retain inactive rules and keyframes; documents retain their
styles until native destruction, including the interval between `close()` and
the next context update. Detached trees and independently retained definitions
use GC-visible references, so their callback/owner cycles can be collected.
Registered defaults and the global stylesheet cache are native roots.
Context roots also cover the cursor proxy and its drag clones, and documents
unloaded but not destroyed until the next update. Element attributes follow
the ownership of their element tree.

The default font engine retains effects in its font layers after a document
closes. `releaseFontResources()` drops those cache owners; callbacks remain
alive if another value or style still owns them. Ownership tracking preserves
native effect identity and font atlas reuse. Shutdown releases all callbacks,
even when old wrappers remain reachable. Custom property parsers may construct
effects and copy effect lists; nested RCSS parsing remains prohibited.

`FontEffect.fillColorValuesFromAlpha(bytes, dimensions, stride)` exposes the
protected native helper. It copies each RGBA pixel's alpha byte into its three
colour channels, preserving alpha and row padding. It accepts non-shared
`Uint8Array` subviews and validates dimensions, stride and storage bounds.
This pixel operation works before initialization, after shutdown and in workers.

`DecoratorDeclaration` and `FilterDeclaration` are writable records. Their
`instancer` fields hold typed references from `DecoratorInstancer.get(name)`
and `FilterInstancer.get(name)`; unknown names return `null`. Null means a named
decorator reference, but a filter needs a non-null instancer. Empty constructors
initialize `type: ''`, `properties: []`, `instancer: null`, and decorators use
`paintArea: BoxArea.Auto`. `isNamed` follows the current instancer field.

`new DecoratorList(records, text?)` and `new FilterList(records, text?)` copy
records into native storage. Both lists expose writable `value` and `list`.
Changing `value` only changes the metadata text; it does not parse RCSS.
Changing `list` copies declarations without changing `value`. Each assignment
creates a new native shared list, so properties, attributes and events that
already retain the previous list keep their snapshots. Assigning to a null
list creates non-null storage; constructing from `[]` also creates non-null
empty storage. Input arrays, declarations and properties remain independent.

```js
const records = filters.list;
const sigma = records[0].properties.find(entry => entry.name === 'sigma');

sigma.property.value = 6;
filters.list = records;
element.setProperty(PropertyId.Filter, new Property(filters, Unit.FILTER));
```

Use parsed declarations to obtain the instancer's complete property dictionary.
Native conversion rejects missing required properties, unknown local IDs,
mismatched instancer types, stale references and invalid paint areas before
replacing a list. Property `name` is display metadata; `id` selects the field.
`DecoratorInstancer`, `FilterInstancer` and `FontEffectInstancer` expose
`get(name)`, `register(name, instancer)` and `getPropertySpecification()`.
Registration lowercases names, lookup uses the exact supplied name, and
replacement retains earlier instancers through shutdown for existing
references. Specifications are read-only views with local IDs.

`new FontEffectInstancer(callback)` implements native font-effect instancing.
Register properties with `registerProperty(name, defaultValue,
affectsGeneration = true).addParser(...)`; register the `font-effect`
shorthand to parse anonymous RCSS arguments. Duplicate properties preserve
their initial definition. Invalid shorthands do not reserve IDs; property and
shorthand capacities are checked before native insertion.

```js
const source = new FontEffect();
const custom = new FontEffectInstancer((name, properties) => {
  source.colour = properties.getProperty(tint.id).get({
    type: 'colourb', red: 255, green: 255, blue: 255, alpha: 255,
  });

  return source;
});
const tint = custom.registerProperty('tint', 'white', false)
  .addParser('color');

custom.registerShorthand('font-effect', 'tint', ShorthandType.FallThrough);
FontEffectInstancer.register('tint', custom);
const effects = new FontEffectList('tint(red)');
```

Callbacks receive an owned dictionary copy and return a `FontEffect` or `null`
synchronously. Native code copies metadata before the RCSS parser sets its
fingerprint, preserving the returned wrapper's snapshot and virtual glyph
implementation. RmlUi 6.3 stores `affectsGeneration` but computes the parsed
fingerprint from all properties; the binding preserves this behavior.
Direct `instanceFontEffect(name, properties)` requires all local properties
(use `specification.setPropertyDefaults(properties)`) and does not compute
the RCSS fingerprint. Callbacks can operate on property/dictionary/effect
copies and delegate to other instancers; recursive instancing, parsing,
registration and DOM/runtime mutations throw. Exceptions propagate when the
outer native call unwinds. Registered callbacks survive GC through shutdown;
unregistered callback cycles are collectible. Shutdown invalidates all views.
`new FilterInstancer(callback)` provides the corresponding filter factory.
Use `registerProperty(name, defaultValue).addParser(...)` and a `filter`
shorthand; this registration has no `affectsGeneration` argument. The callback
receives a dictionary copy and returns an owned `Filter` or `null`. It can
delegate to `FilterInstancer.get(name).instanceFilter(name, properties)`.
Direct calls require the complete local property set, including defaults.
Created filters retain their native parameters after the dictionary changes.

```js
const blur = FilterInstancer.get('blur');
const parameters = new PropertyDictionary();

blur.getPropertySpecification().setPropertyDefaults(parameters);
const filter = blur.instanceFilter('blur', parameters);
const overflow = filter.extendInkOverflow(element, {
  p0: { x: 0, y: 0 },
  p1: { x: 40, y: 30 },
});
```

`extendInkOverflow` invokes the native virtual operation and returns copied
`Rectanglef` corners, preserving its input. Relative lengths resolve against
the supplied live element. Filter instancers share the callback restrictions,
replacement and shutdown behavior described above. `compileFilter(element)`
returns a unique compiled owner; see [renderer resources](resources.md).
`new Filter({ compileFilter, extendInkOverflow? })` implements the native
virtuals synchronously. The compilation callback receives the element and
returns a `CompiledFilter` from that element's render manager. Ownership moves
out of the returned wrapper: its `isValid` becomes false, and returning it again
throws. A resource from another manager is rejected without consuming it.
Return a new empty `CompiledFilter` to report failure. The optional overflow
callback receives a rectangle copy and must return finite corners.

```js
const custom = new Filter({
  compileFilter(element) {
    return element.getRenderManager().compileFilter('blur', { sigma: 2 });
  },
  extendInkOverflow(element, overflow) {
    overflow.p0.x -= 6;
    overflow.p1.x += 6;

    return overflow;
  },
});

FilterInstancer.register('custom', new FilterInstancer(() => custom));
```

Effect callbacks can read properties and box snapshots, resolve numeric lengths,
and compile resources. DOM/style mutation, shutdown and recursive rendering are
rejected. Native element effects retain callbacks; detached trees and standalone
filters use GC-visible references so self-capturing closures remain collectible.
Shutdown releases callbacks and invalidates filter wrappers.
Custom decorator creation and font glyph virtual overrides are implemented;
native ownership retains their callbacks while detached or standalone cycles
remain collectible, and shutdown releases them.

`ColorStopList` uses `{ type: 'colorstoplist', values: ColorStop[] }`;
`BoxShadowList` uses `{ type: 'boxshadowlist', values: BoxShadow[] }`.
Each color is `{ type: 'colourb-premultiplied', red, green, blue, alpha }`,
with integer channels from 0 to 255. RGB bytes already include alpha;
reading and assigning them performs no further multiplication or division.
Each numeric component is `{ number, unit }`. Native order, negative offsets,
relative units and omitted color-stop positions (`Unit.UNKNOWN`) are retained.
Snapshots are detached copies that remain readable after GC or shutdown.

```js
/** @type {import('sfml.js-rmlui').BoxShadowList} */
const emptyShadows = {
  type: 'boxshadowlist', values: [],
};
const shadows = element.getProperty('box-shadow', emptyShadows);

if (shadows.values.length) {
  shadows.values[0].offsetX = { number: 8, unit: Unit.PX };
  element.setProperty(PropertyId.BoxShadow,
    new Property(shadows, Unit.BOXSHADOWLIST));
}
```

The same tagged lists work in attributes and events. `getAttributeValue(name)`
reads the raw list; `getAttribute(name)` preserves the established string
conversion. Typed attribute/event reads use their supplied fallback, whereas
property reads use an empty list when conversion fails. Malformed entries,
non-finite float components and invalid byte channels throw without changing
the destination. NumericValue objects may supply numeric fields on input;
outputs are plain records, not shared views.
`Property.equals` and `notEquals` compare these native lists by value,
including every entry field. Singleton lists provide the same equality
semantics as native ColorStop/BoxShadow operators.

`Transform` owns a native primitive list. Construct it with canonical
`TransformPrimitive` records; `TransformPrimitiveType` exposes all 22 native
types. `getPrimitive(index)` and `primitives` return copies. Assign `primitives`
to replace the whole list, or use `addPrimitive`, `clearPrimitives` and
`getNumPrimitives`. Invalid indices and malformed components throw.

```js
const { Transform, TransformPrimitiveType: T, makeTransformPrimitive } =
  require('sfml.js-rmlui');
const rotate = makeTransformPrimitive(T.ROTATE2D,
  [{ number: 90, unit: Unit.DEG }]);
const transform = new Transform([rotate]);

element.setProperty(PropertyId.Transform,
  Transform.makeProperty(transform.primitives));
```

Resolved components are numbers; angles in canonical records are radians.
Translate/Perspective components are `{ number, unit }` and retain relative units.
`makeTransformPrimitive(type, numericValues)` invokes the native NumericValue
array constructor: angles accept RAD/DEG/PERCENT and Rotate3D axes require NUMBER.
Matrix/Scale constructors copy numbers. Supply all components explicitly for
scalar overloads: native translation defaults use PX, angles DEG, uniform scales
repeat the same number. Matrix3D uses 16 column-major coefficients.
DecomposedMatrix4 uses `perspective`, `quaternion` (x/y/z/w),
`translation`, `scale` and `skew` vectors.

Raw transform values use `{ type: 'transform', primitives: [...] }`.
`primitives: null` preserves a null native TransformPtr; an empty array represents
an identity transform. Property `Get<T>` failure returns the null-pointer record;
attributes and events retain the supplied fallback. Assignment copies primitives
into a new native owner. Native property equality compares pointer identity:
`property.clone()` preserves it; rebuilding from a snapshot creates a new pointer.
Pure Transform values and snapshots survive shutdown; `makeProperty` requires
the active runtime. Numerical list replacement also supplies the writable native
`GetPrimitives` capability without lending references into a resizable vector.

`get(typeExemplar)` selects a native conversion: `0` for double, `0n` for a
signed 64-bit integer, `''` for string, or a vector/colour shape. Conversion
failure returns the native `T{}`, regardless of the exemplar's value.
`element.getProperty(name, typeExemplar)` also returns `T{}` for missing names.
`getNumericValue()` returns an independent `NumericValue`; `toString()` uses
the native definition. Equality compares unit and value, excluding metadata.

`unit`, `specificity` and `parserIndex` map separate one-element `Int32Array`
metadata fields, synchronized into the property at native boundaries.
Views retain only these integers; their backing-store cleanup cannot release
style resources on a GC thread. Their buffers are marked untransferable;
structured cloning copies them. `source` is a copied
`{ path, lineNumber, ruleName }` record. Metadata changes do not affect an
element until the property is assigned back.

`PropertyDefinition` exposes id, inheritance, layout flag, relative target and
a copied default property. `parseValue(property, text)` mutates the output,
including UNKNOWN unit on failure. `getValue(property)` returns both native
outputs as `{ success, value }`. In pinned RmlUi 6.3, keyword conversion returns
`success: false` even when `value` is a valid keyword.

Constructing `PropertyDefinition(id, defaultValue, inherited, forcesLayout)`
creates a mutable standalone definition. `addParser(name, parameters = '')`
and `setRelativeTarget(target)` return it for chaining. Built-in definitions
obtained from properties are read-only. Standalone definitions are retained
until shutdown because native properties borrow their pointers.

Properties and definitions require the owning initialized runtime. DOM
destruction does not invalidate copies; shutdown does. Shutdown releases
property resources before the RmlUi pools and parsers, resets mapped metadata
to native defaults, and invalidates old handles across reinitialization.
Retained views remain writable independent storage and cannot affect a later
generation. Native boundaries reject forged handles, invalid unit bits,
non-finite numbers, and complex units without matching native storage.

## Property specifications

`new PropertySpecification(reserveProperties, reserveShorthands)` owns a local
native specification. Reservations are 0–127 properties and 0–254 shorthands;
they do not assign IDs. `registerProperty(name, defaultValue, inherited,
forcesLayout, id = PropertyId.Invalid)` returns a mutable definition ready for
`addParser`. Automatic IDs start at 1 and follow the highest assigned ID.
Explicit sparse IDs are supported. Re-registering a name preserves its existing
definition; conflicting IDs or exhausted capacity throw before registration.
Empty names and `invalid` are reserved.

`getProperty(nameOrId)` returns a checked definition or `null`.
`getRegisteredProperties()`, `getRegisteredInheritedProperties()` and
`getRegisteredPropertiesForcingLayout()` return independent ascending ID arrays.
Registered definitions retain native storage until shutdown, even after the
specification wrapper is collected. Shutdown invalidates all such references.

```js
const {
  PropertySpecification, PropertyDictionary, ShorthandType,
} = require('sfml.js-rmlui');
const specification = new PropertySpecification(2, 1);

specification.registerProperty('x', '0px', false, false).addParser('length');
specification.registerProperty('y', '0px', false, false).addParser('length');
const pair = specification.registerShorthand('pair', 'x,y',
  ShorthandType.Replicate);
const values = new PropertyDictionary();

specification.parseShorthandDeclaration(values, pair, '4px');
console.log(specification.propertiesToString(values, true, ';'));
```

`registerShorthand(name, properties, type, id = ShorthandId.Invalid)` supports
all six `ShorthandType` strategies. Components are comma-separated names with
native `?` and `#` suffixes. Missing components or duplicates return `Invalid`;
invalid declarations do not consume names or IDs. Box requires four properties,
Flex three; invalid counts throw. `getShorthand(nameOrId)` returns a structural
snapshot with typed property/nested-shorthand items and checked definitions.

`parsePropertyDeclaration(dictionary, nameOrId, value)` accepts property IDs or
names of properties, shorthands and custom variables. `parseShorthandDeclaration`
uses shorthand IDs. Both return native success and preserve partial native
writes on failure. `setPropertyDefaults(dictionary)` fills missing properties.
`propertiesToString(dictionary, includeName, delimiter)` serializes ordinary
properties in ID order without a trailing delimiter; the delimiter must occupy
one UTF-8 byte, matching native `char`.

## Global RCSS registry and custom parsers

`StyleSheetSpecification` exposes RmlUi's global property and parser registry.
Its lifecycle follows `initialise` / `shutdown`; register custom properties
before loading documents. `registerProperty(name, defaultValue, inherited,
forcesLayout = false)` returns a mutable definition. Built-in names are
reserved, duplicate custom names preserve the original, and capacity overflow
throws before changing native maps. `registerShorthand(name, properties, type)`
uses the same validation and six strategies as a local specification.

`getProperty(nameOrId)`, `getShorthand(nameOrId)` and the three `getRegistered…`
methods provide the global lookups and copied ID sets. `getPropertyId`,
`getPropertyName`, `getShorthandId`, `getShorthandName` map names and IDs.
`getShorthandUnderlyingProperties(id)` recursively collects distinct IDs.
`parsePropertyDeclaration(dictionary, name, value)` writes native declarations.
`getPropertySpecification()` returns a borrowed read-only specification;
shutdown invalidates it and all parser/definition handles.

```js
const { StyleSheetSpecification: styles, PropertyParser, Unit } =
  require('sfml.js-rmlui');
const parser = new PropertyParser((property, value, parameters) => {
  if (!/^count:\d+$/.test(value)) {
    return false;
  }

  property.value = Number(value.slice(6)) * parameters.factor;
  property.unit = Unit.NUMBER;

  return true;
});

styles.registerParser('count-parser', parser);
styles.registerProperty('item-count', 'count:2', true)
  .addParser('count-parser', 'factor=3');
```

RCSS can now use `item-count: count:4`, yielding the inherited numeric value 12.
`getParser(name)` returns a checked built-in/custom parser or `null`.
`parser.parseValue(property, text, parameters = {})` supports direct parsing;
parameter values must be int32. Parameter maps and output properties are copies.
Retaining and editing the callback's output later cannot change parsed styles.
A false return preserves normal native partial-write behavior. Exceptions or
invalid output storage reject the callback output; exceptions propagate after
native unwinding. Callbacks must return a synchronous boolean. They can read and
write Property values; nested parsing, registry changes and DOM/runtime calls
throw during the callback. Registered parsers retain their closures until
shutdown; unregistered parser cycles can be collected.
Animation callbacks produced by parsers remain alive while native defaults or
styles own them. Copies stored in standalone Properties or dictionaries use
collectable JS ownership edges.

## Property dictionaries

`PropertyDictionary` owns a native dictionary in the active runtime. Its three
maps are independent: ordinary properties use `PropertyId`, custom properties
use string names, and variable shorthands use `ShorthandId`. Main stylesheet
IDs must not be reused for a decorator's or font effect's local specification.

`setProperty(id, property)`, `setCustomProperty(name, property)` and
`setVarShorthand(id, property)` copy the input. A variable shorthand requires
a string Property with `Unit.VAR_EXPRESSION`. IDs must be nonzero and below
the corresponding `MaxNumIds`. The matching `getProperty`, `getCustomProperty`
and `getVarShorthand` return independent copies or `null`. `getProperties()`,
`getCustomProperties()` and `getVarShorthands()` return new Maps of copies.

`removeProperty(id)` returns nothing. `removeCustomProperty(name)` and
`removeVarShorthand(id)` return whether an entry existed. `getNumProperties()`
counts only ordinary properties; `empty()` checks all three maps, and `clear()`
clears all three.

`import(source, specificity = -1)` overwrites entries when incoming specificity
is at least the stored specificity. RmlUi 6.3 forces the supplied specificity
only when it is positive; zero and negative values preserve incoming values.
`merge(source, specificityOffset = 0)` adds the offset before comparison;
int32 overflow throws before any entry changes. Self-import and self-merge
read a snapshot. `setSourceOfAllProperties(sourceOrNull)` copies one source
record for every entry across the three maps.

Stored callbacks remain alive through native copies and visible JS ownership
edges. Clearing or collecting a dictionary releases those edges, including
cycles where a callback captures the dictionary. Shutdown releases stored
resources before RmlUi teardown and invalidates old dictionary handles.

`element.iterateLocalProperties(filterInheritedBy = null)` returns native-order
`[name, Property]` pairs in one native traversal. It includes inline overrides,
stylesheet/class rules, custom variables and variable shorthands, with native
duplicate suppression and shorthand placeholder handling. With a filter, only
properties actually inherited by that element remain; its own overrides are
excluded. Values are copied before the native iterator is released and before
wrapping. Later property/class changes or element destruction do not invalidate
the snapshot. The method does not retain a live native iterator.
