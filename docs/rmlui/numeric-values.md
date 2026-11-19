# Numeric values and units

`NumericValue` owns a native `Rml::NumericValue`. The default is number `0`
and `Unit.UNKNOWN`. `number` and `unit` map the actual native fields;
`numberView` is a one-element `Float32Array`, and `unitView` is a one-element
`Int32Array`. Retained views remain valid after wrapper collection, element
destruction and runtime shutdown. They never retain a DOM object.

```js
const { NumericValue, Unit, anyUnit } = require('sfml.js-rmlui');
const distance = new NumericValue(12, Unit.DP);

distance.numberView[0] = 24;
const pixels = element.resolveLength(distance);
const quarter = element.resolveNumericValue(
  new NumericValue(25, Unit.PERCENT), 200
); // 50
const isLength = anyUnit(distance.unit & Unit.LENGTH);
```

`clone()` copies into independent native storage. `equals()` and `notEquals()`
call the upstream operators and compare both fields. Signed zero compares
equal. Number writes round to float32.

Call `context.update()` after style changes before resolving font-relative
values. Resolution uses the native element's current computed style.

| Unit | Resolution |
| --- | --- |
| `PX` | Number in pixels |
| `DP` | Number times the context density ratio |
| `VW`, `VH` | Percentage of the current context width or height |
| `EM`, `REM` | Multiple of the element or document font size |
| `INCH`, `CM`, `MM`, `PT`, `PC` | 96 pixels per inch, scaled by the context density ratio |
| `NUMBER` | Number times `baseValue` |
| `PERCENT` | Number times `baseValue / 100` |
| `DEG`, `RAD` | Radians |
| `X` | Number without scaling |

`resolveLength()` returns zero for every non-length unit, including `NUMBER`
and `PERCENT`. `resolveNumericValue()` returns zero for non-numeric units.
Both methods require a live element. Numeric values themselves can be
constructed, edited and compared without an initialized runtime, also in
workers.

`Unit` includes all upstream basic, numeric, typed-property, custom-property
and combined flags. `Units` is its set alias. JavaScript `|` and `&` correspond
to the native set operators; `anyUnit()` corresponds to `Rml::Any`.
Unit sets can be stored and compared. A set containing several units cannot
be resolved as one length or numeric value.

Constructors and setters reject non-finite float values, float32 overflow and
unknown unit bits. Native operations validate shared views again before using
them. Resolution throws on overflow. Direct view writes can repair an invalid
field; ordinary setters can repair their corresponding field too.

## Computed values

`element.getComputedValues()` returns the live, read-only native
`GetComputedValues()` view. Run `context.update()` after changing styles before
inspecting it. Its 98 getters use camelCase names, including `fontFamily`,
`marginTop`, `lineHeight`, `borderRadius`, `animation` and `transform`.
Structured getter results are independent copies. Absent animation, transition,
transform and font-face values return `null`.

`new ComputedValues(element)` allocates native storage with upstream defaults.
It provides all 83 native assignments: 82 property setters plus the write-only
`setHasLetterSpacing(boolean)`. `copyInherited(source)` and
`copyNonInherited(source)` copy only their native field groups, preserving the
destination's associated element. Assignments affect the owned value only.
Font family, cursor, letter spacing, local flex properties and motion/transform
getters still read the associated element. Both owned values and live views
reject access after that element is destroyed or the runtime is shut down.
An observer does not keep an unreferenced detached element alive.

```js
const { ComputedValues, Style, resolveValueOr } = require('sfml.js-rmlui');

context.update();
const view = element.getComputedValues();
const value = new ComputedValues(element);

value.copyInherited(view);
value.copyNonInherited(view);
value.width = new Style.LengthPercentageAuto(
  Style.LengthPercentageAutoType.Percentage, 25
);
const pixels = resolveValueOr(value.width, 400, 0); // 100
```

`Style` exports the native style enums, including font weights from 1–1000
and Auto (0), and the native value types and aliases. `LengthPercentage`,
`LengthPercentageAuto`, `NumberAuto`, `VerticalAlign` and `LineHeight` retain
their own native scalar storage. `valueView` and `typeView` map its float and
enum fields; `LineHeight.inheritValueView` maps its inherited value. These
views survive wrapper collection, DOM destruction and shutdown without keeping
elements alive. Native consumers recheck mapped enum ranges and finite floats.

`new Style.VerticalAlign()` means Baseline; one numeric argument means a pixel
length; two arguments mean `(VerticalAlignType, length)`.
`Style.Clip(type, number)` preserves the signed-int8 encoding: Number with 0,
-1 or -2 becomes Auto, None or Always. `getType()`, `getNumber()` and
`equals(type)` expose its native operations. Border-width assignments accept
int16 values and retain the upstream uint16 storage conversion; radius
assignments truncate to int16 after range checking.

`resolveValue` and `resolveValueOr` support both length classes. Percentages
use a nonnegative base; a negative base is indefinite. Auto and indefinite
percentages return zero or the supplied fallback. Absolute lengths retain
their value even with an indefinite base. `fontFaceHandle` and
`element.getFontFaceHandle()` return opaque generation-checked tokens, never
numerical addresses.

## Standalone style field groups

`Style.CommonValues`, `Style.InheritedValues` and `Style.RareValues` construct
the three native structs with their upstream defaults and all 112 writable
fields. Names use camelCase (`float_` becomes `float`). These objects are
independent of elements: writing them does not update a document's style.
They can be created before initialization and used in Workers.

Each addressable numeric field provides a `fieldView`: floats use
`Float32Array`, border widths use `Uint16Array`, radii use `Int16Array`, and
colors use RGBA `Uint8Array`. Views retain the native struct after wrapper
collection or shutdown. Color getters return copies. Bitfields use checked
native accessors; `hasLetterSpacing` retains its native numeric 0/1 type.
Ordinary setters reject invalid enum, integer, float or color values before
writing. Direct views bypass setter checks. `clip` copies an owned `Style.Clip`;
`language` preserves UTF-8 text, including embedded zero characters.

```js
const values = new Style.CommonValues();

values.display = Style.Display.Flex;
values.widthType = Style.LengthPercentageAutoType.Percentage;
values.widthValueView[0] = 25;
values.backgroundColorView.set([20, 40, 60, 255]);
```

A non-null `InheritedValues.fontFaceHandle` remains tied to the font engine.
`shutdown()`, `releaseFontResources()` and `releaseRenderManagers()` invalidate
existing tokens, including copies inside owned `ComputedValues`. Stale reads
and assignments throw; obtain a fresh token from a live element. Assigning
`null` and accessing the other standalone fields remain valid after shutdown.
Reattach or collect detached elements before releasing fonts or render
managers: upstream only invalidates context-owned trees. Rejected releases
leave existing tokens valid.
