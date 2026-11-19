import {
  ParameterMap, Property, PropertyDefinition, PropertyDictionary, PropertyId,
  PropertyParser, PropertyParserCallback, PropertySpecification,
  ShorthandDefinition, ShorthandId, ShorthandType, StyleSheetSpecification,
  Unit,
} from '../../src';

const parse: PropertyParserCallback = (property, value, parameters) => {
  property.value = Number(value) * (parameters.factor ?? 1);
  property.unit = Unit.NUMBER;
  return true;
};
const parser = new PropertyParser(parse);
const registered: boolean =
  StyleSheetSpecification.registerParser('scaled-number', parser);
const found: PropertyParser | null =
  StyleSheetSpecification.getParser('number');
const definition: PropertyDefinition =
  StyleSheetSpecification.registerProperty('custom-number', '2', true)
    .addParser('scaled-number', 'factor=3');
const lookup: PropertyDefinition | null =
  StyleSheetSpecification.getProperty(definition.id);
const byName: PropertyDefinition | null =
  StyleSheetSpecification.getProperty('custom-number');
const id: PropertyId =
  StyleSheetSpecification.getPropertyId('custom-number');
const name: string = StyleSheetSpecification.getPropertyName(id);
const shorthand: ShorthandId = StyleSheetSpecification.registerShorthand(
  'custom-number-pair', 'custom-number', ShorthandType.Replicate);
const snapshot: ShorthandDefinition | null =
  StyleSheetSpecification.getShorthand(shorthand);
const shorthandByName: ShorthandDefinition | null =
  StyleSheetSpecification.getShorthand('custom-number-pair');
const shorthandId: ShorthandId =
  StyleSheetSpecification.getShorthandId('custom-number-pair');
const shorthandName: string =
  StyleSheetSpecification.getShorthandName(shorthandId);
const specification: PropertySpecification =
  StyleSheetSpecification.getPropertySpecification();
const dictionary = new PropertyDictionary();
const parsed: boolean = StyleSheetSpecification.parsePropertyDeclaration(
  dictionary, name, '5');
const ids: PropertyId[][] = [
  StyleSheetSpecification.getRegisteredProperties(),
  StyleSheetSpecification.getRegisteredInheritedProperties(),
  StyleSheetSpecification.getRegisteredPropertiesForcingLayout(),
  StyleSheetSpecification.getShorthandUnderlyingProperties(shorthand),
];
const output = new Property();
const parameters: ParameterMap = { factor: 3 };
const direct: boolean = parser.parseValue(output, '4', parameters);
parser.parseValue(output, '4');
void [
  registered, found, lookup, byName, snapshot, shorthandByName, shorthandName,
  specification, parsed, ids, direct,
];

// @ts-expect-error Parser callbacks must return synchronously.
new PropertyParser(async () => true);
// @ts-expect-error Parser registration requires a checked parser instance.
StyleSheetSpecification.registerParser('invalid', parse);
// @ts-expect-error Parameter values must be numbers.
parser.parseValue(output, '4', { factor: '3' });
// @ts-expect-error The global specification cannot be constructed.
new StyleSheetSpecification();
