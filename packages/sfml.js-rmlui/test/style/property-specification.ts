import {
  PropertySpecification, PropertyDictionary, PropertyDefinition,
  PropertyId, ShorthandId, ShorthandType, ShorthandDefinition,
} from '../../src';

const spec = new PropertySpecification(4, 4);
const definition: PropertyDefinition = spec.registerProperty(
  'size', '4px', false, true).addParser('length');
const dictionary = new PropertyDictionary();
const propertyByName: PropertyDefinition | null = spec.getProperty('size');
const propertyById: PropertyDefinition | null = spec.getProperty(definition.id);
const registered: PropertyId[] = spec.getRegisteredProperties();
const inherited: PropertyId[] = spec.getRegisteredInheritedProperties();
const layout: PropertyId[] = spec.getRegisteredPropertiesForcingLayout();
const id: ShorthandId = spec.registerShorthand(
  'size-pair', 'size', ShorthandType.Replicate);
const shorthandByName: ShorthandDefinition | null =
  spec.getShorthand('size-pair');
const shorthandById: ShorthandDefinition | null = spec.getShorthand(id);
const byName: boolean = spec.parsePropertyDeclaration(
  dictionary, 'size', '2px');
const byId: boolean = spec.parsePropertyDeclaration(
  dictionary, definition.id, '3px');
const shorthand: boolean = spec.parseShorthandDeclaration(
  dictionary, id, '5px');
spec.setPropertyDefaults(dictionary);
const text: string = spec.propertiesToString(dictionary, true, ';');
for (const item of shorthandById?.items ?? []) {
  if (item.type === 'property') {
    const propertyId: PropertyId = item.propertyId;
    const child: PropertyDefinition = item.definition;
    void [ propertyId, child ];
    // @ts-expect-error Property items do not expose shorthand ids.
    item.shorthandId;
  } else {
    const shorthandId: ShorthandId = item.shorthandId;
    const child: ShorthandDefinition = item.definition;
    void [ shorthandId, child ];
  }
}
// @ts-expect-error Native construction requires both reservation counts.
new PropertySpecification();
// @ts-expect-error Parsing requires a native dictionary.
spec.parsePropertyDeclaration({}, 'size', '1px');
// @ts-expect-error Property and shorthand enums are distinct.
spec.getProperty(ShorthandId.Margin);
// @ts-expect-error Shorthand parser strategy must be a ShorthandType.
spec.registerShorthand('x', 'size', 'box');
// @ts-expect-error Serialization requires a boolean.
spec.propertiesToString(dictionary, {}, ';');
void [ propertyByName, propertyById, registered, inherited, layout,
  shorthandByName, byName, byId, shorthand, text ];
