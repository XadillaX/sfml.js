import {
  PropertyDictionary, Property, PropertyId, ShorthandId, Unit,
} from '../../src';

const dictionary = new PropertyDictionary();
const property = new Property(20, Unit.PX);
dictionary.setProperty(PropertyId.Width, property);
dictionary.setCustomProperty('--gap', property);
dictionary.setVarShorthand(ShorthandId.Margin,
  new Property('var(--gap)', Unit.VAR_EXPRESSION));
const ordinary: Map<PropertyId, Property> = dictionary.getProperties();
const custom: Map<string, Property> = dictionary.getCustomProperties();
const shorthands: Map<ShorthandId, Property> = dictionary.getVarShorthands();
const one: Property | null = dictionary.getProperty(PropertyId.Width);
const two: Property | null = dictionary.getCustomProperty('--gap');
const three: Property | null = dictionary.getVarShorthand(ShorthandId.Margin);
const removed: boolean = dictionary.removeCustomProperty('--gap');
const removedVar: boolean = dictionary.removeVarShorthand(ShorthandId.Margin);
const empty: boolean = dictionary.empty();
const count: number = dictionary.getNumProperties();
dictionary.removeProperty(PropertyId.Width);
dictionary.import(dictionary);
dictionary.import(dictionary, 10);
dictionary.merge(dictionary);
dictionary.merge(dictionary, -1);
dictionary.setSourceOfAllProperties({
  path: 'theme.rcss', lineNumber: 3, ruleName: 'body',
});
dictionary.setSourceOfAllProperties(null);
dictionary.clear();
void [ ordinary, custom, shorthands, one, two, three,
  removed, removedVar, empty, count ];

// @ts-expect-error Plain property IDs cannot be used as shorthand IDs.
dictionary.setVarShorthand(PropertyId.Width, property);
// @ts-expect-error Shorthand IDs cannot be used as ordinary property IDs.
dictionary.setProperty(ShorthandId.Margin, property);
// @ts-expect-error Property storage is mandatory.
dictionary.setProperty(PropertyId.Width, 20);
// @ts-expect-error Import requires an owned dictionary.
dictionary.import(new Map());
