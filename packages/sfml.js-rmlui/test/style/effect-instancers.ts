import {
  DecoratorInstancer, FilterInstancer, FontEffectInstancer, FontEffect,
  PropertyDictionary, PropertySpecification, PropertyDefinition,
  ShorthandType, Filter, type FontEffectInstancerCallback,
  type FilterInstancerCallback, type FilterOverflow, type Element,
} from '../../dist';

const callback: FontEffectInstancerCallback = (name, properties) => {
  const value: PropertyDictionary = properties;
  const type: string = name;
  void [ value, type ];
  return new FontEffect();
};
const custom = new FontEffectInstancer(callback);
const definition: PropertyDefinition = custom.registerProperty('size', '1',
  false).addParser('number');
custom.registerShorthand('font-effect', 'size', ShorthandType.FallThrough);
FontEffectInstancer.register('custom', custom);
const specification: PropertySpecification = custom.getPropertySpecification();
const properties = new PropertyDictionary();
specification.setPropertyDefaults(properties);
const instance: FontEffect | null = custom.instanceFontEffect('custom',
  properties);
const font = FontEffectInstancer.get('outline');
if (font) {
  FontEffectInstancer.register('outline-alias', font);
}
const decorator = DecoratorInstancer.get('image');
if (decorator) {
  DecoratorInstancer.register('image-alias', decorator);
  decorator.getPropertySpecification().getRegisteredProperties();
}
const filter = FilterInstancer.get('blur');
if (filter) {
  FilterInstancer.register('blur-alias', filter);
  filter.getPropertySpecification().getRegisteredProperties();
}
// @ts-expect-error Factory callback must return synchronously.
new FontEffectInstancer(async () => new FontEffect());
// @ts-expect-error Font effect instancers cannot use decorator tokens.
FontEffectInstancer.register('invalid', decorator!);
// @ts-expect-error Decorator and filter references are distinct.
DecoratorInstancer.register('invalid', filter!);
// @ts-expect-error Callback dictionaries cannot be arbitrary objects.
custom.instanceFontEffect('invalid', {});
// @ts-expect-error Affects-generation is boolean.
custom.registerProperty('invalid', '0', 1);
void [ definition, instance ];

const filterCallback: FilterInstancerCallback = (_name, properties) =>
  filter!.instanceFilter('blur', properties);
const customFilter = new FilterInstancer(filterCallback);
customFilter.registerProperty('radius', '2px').addParser('length');
customFilter.registerShorthand('filter', 'radius', ShorthandType.FallThrough);
const filterInstance: Filter | null = customFilter.instanceFilter('custom',
  properties);
declare const element: Element;
const overflow: FilterOverflow | undefined = filterInstance?.extendInkOverflow(
  element, { p0: { x: 0, y: 0 }, p1: { x: 10, y: 10 } });
// @ts-expect-error Filter instancers must return a Filter synchronously.
new FilterInstancer(async () => null);
// @ts-expect-error Font effects cannot be returned as filters.
new FilterInstancer(() => new FontEffect());
// @ts-expect-error Local filter dictionaries are checked owners.
customFilter.instanceFilter('invalid', {});
// @ts-expect-error Filter effects have no affectsGeneration flag.
customFilter.registerProperty('invalid', '0', true);
void overflow;
