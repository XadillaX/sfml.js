import {
  Element, ElementStyle, Property, PropertyId, Unit, ComputedValues,
  PropertyDictionary, KeyFramePropertyResolver, NumericValue, RelativeTarget,
  ShorthandId,
} from '../../src';

declare const element: Element;

const style: ElementStyle = element.getStyle();
const changed: boolean = style.setClass('wide', true);
const states: Map<string, number> = style.getActivePseudoClasses();
const values = new ComputedValues(element);
const ids: Set<PropertyId> = style.computeValues(
  values, null, null, true, 1, { x: 320, y: 240 });
const property: Property | null = style.resolveKeyFrameProperty(
  PropertyId.Width, new Property('var(--a)', Unit.VAR_EXPRESSION),
  new PropertyDictionary(), new KeyFramePropertyResolver());
const length: number = style.resolveRelativeLength(
  new NumericValue(1, Unit.EM), RelativeTarget.FontSize);
const plain: Array<[PropertyId, Property]> = style.iterate();
const all: Array<[string, Property]> = style.iterateAll(element);

style.updateDefinition();
const pseudoChanged: boolean = style.setPseudoClass('hover', true, false);
const pseudoActive: boolean = style.isPseudoClassSet('hover');
const classActive: boolean = style.isClassSet('wide');
style.setClassNames('wide highlighted');
const classNames: string = style.getClassNames();
const classList: string[] = style.getClassNameList();

const widthValue = new Property(20, Unit.PX);
const variableValue = new Property('var(--spacing)', Unit.VAR_EXPRESSION);
const propertyChanged: boolean =
  style.setProperty(PropertyId.Width, widthValue);
style.setCustomProperty('--spacing', widthValue);
style.setVarShorthand(ShorthandId.Margin, variableValue);
const properties: Array<Property | null> = [
  style.getProperty(PropertyId.Width), style.getCustomProperty('--spacing'),
  style.getLocalProperty(PropertyId.Width),
  style.getLocalPropertyWithResolvedVariables(PropertyId.Width),
  style.getLocalCustomProperty('--spacing'),
  style.getLocalShorthand(ShorthandId.Margin),
  style.getSpecifiedProperty(PropertyId.Width),
  style.getSpecifiedCustomProperty('--spacing'),
  style.getSpecifiedShorthand(ShorthandId.Margin),
];
const dictionary: PropertyDictionary = style.getLocalStyleProperties();
style.removeProperty(PropertyId.Width);
style.removeCustomProperty('--spacing');
style.removeVarShorthand(ShorthandId.Margin);

const resolved: number = style.resolveNumericValue(
  new NumericValue(50, Unit.PERCENT), 200);
style.dirtyInheritedProperties();
style.dirtyProperty(PropertyId.Width);
style.dirtyPropertiesWithUnits(Unit.EM);
style.dirtyPropertiesWithUnitsRecursive(Unit.PERCENT);
const dirty: boolean = style.anyPropertiesDirty();
new KeyFramePropertyResolver().reset();

// @ts-expect-error The style component is owned by an element.
new ElementStyle();
// @ts-expect-error Output must be writable owned ComputedValues.
style.computeValues(element.getComputedValues(), null, null, true, 1,
  { x: 320, y: 240 });
// @ts-expect-error Registered numeric IDs are required.
style.setProperty('width', new Property(1, Unit.PX));
// @ts-expect-error Pseudo-class activation is boolean.
style.setPseudoClass('hover', 1);
// @ts-expect-error Shorthands use their own numeric IDs.
style.getLocalShorthand(PropertyId.Width);
// @ts-expect-error Custom properties require owned Property values.
style.setCustomProperty('--spacing', '20px');
// @ts-expect-error Native unit masks cannot be CSS strings.
style.dirtyPropertiesWithUnitsRecursive('em');

void [
  changed, states, ids, property, length, plain, all, pseudoChanged,
  pseudoActive, classActive, classNames, classList, propertyChanged,
  properties, dictionary, resolved, dirty,
];
