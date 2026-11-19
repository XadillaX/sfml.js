import {
  Property, PropertyDefinition, PropertyId, RelativeTarget, Unit,
  type Element, type NumericValue, type PropertySource,
} from '../../src';

declare const element: Element;
const property = new Property(12, Unit.PX, 5);
const keyword = new Property(1);
const numeric: NumericValue = property.getNumericValue();
const number: number = property.get(0);
const text: string = property.get('');
const source: PropertySource | null = property.source;
property.source = { path: 'x.rcss', lineNumber: 1, ruleName: 'body' };
property.definition = new PropertyDefinition(PropertyId.Width, '0', false, true)
  .addParser('number')
  .setRelativeTarget(RelativeTarget.ContainingBlockWidth);
property.definition.parseValue(property, '4');
property.definition.getValue(property);
const snapshot: Property | null = element.getProperty(PropertyId.Width);
const width: number = element.getProperty('width', 0);
element.setProperty(PropertyId.Width, property);
element.setProperty('width', '2px');
element.getLocalProperty(PropertyId.Width);
const local: Map<PropertyId, Property> = element.getLocalStyleProperties();
const entries: [string, Property][] = element.iterateLocalProperties();
element.iterateLocalProperties(element);
// @ts-expect-error The inheritance filter is an Element or null.
element.iterateLocalProperties({});
element.removeProperty(PropertyId.Width);
property.unitView[0] = Unit.PX;
property.specificityView[0] = 3;
property.parserIndexView[0] = -1;
// @ts-expect-error Typed setter requires PropertyId.
element.setProperty('width', property);
// @ts-expect-error Typed setter requires an owned Property.
element.setProperty(PropertyId.Width, '2px');
property.value = element;
const storedElement: Element | null = property.getElementValue();
const propertyText: string = property.toString();
const copiedProperty: Property = property.clone();
const propertyEqual: boolean = property.equals(copiedProperty);
const propertyUnequal: boolean = property.notEquals(copiedProperty);

// @ts-expect-error Pointer conversion uses the explicit element adapter.
property.get(element);
// @ts-expect-error Property::Get has no null type selector.
property.get(null);
// @ts-expect-error Built-in definition flags are read-only.
property.definition.isInherited = false;
// @ts-expect-error Shared mapping cannot be replaced.
property.unitView = new Int32Array(1);
// @ts-expect-error Property comparison requires owned Property storage.
property.equals(numeric);

void [
  keyword, numeric, number, text, source, snapshot, width, local, entries,
  storedElement,
  propertyText, copiedProperty, propertyEqual, propertyUnequal,
];
