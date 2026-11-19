import {
  BoxArea, Decorator, DecoratorData, DecoratorInstancer,
  DecoratorInstancerInterface, Element, PropertyDictionary, RenderManager,
  ShorthandType, Sprite, Texture,
} from '../../src';

const factory = new DecoratorInstancer((name, properties, active) => {
  const manager: RenderManager = active.getRenderManager();
  const texture: Texture = active.getTexture('image.png');
  const sprite: Sprite | null = active.getSprite('icon');
  const builtin = DecoratorInstancer.get('horizontal-gradient')!;
  const defaults = new PropertyDictionary();
  builtin.getPropertySpecification().setPropertyDefaults(defaults);
  void manager;
  void texture;
  void sprite;
  void properties;
  return builtin.instanceDecorator(name, defaults, active);
});
factory.registerProperty('opacity', '1').addParser('number');
factory.registerShorthand('decorator', 'opacity', ShorthandType.FallThrough);
DecoratorInstancer.register('typed', factory);

declare const active: DecoratorInstancerInterface;
declare const element: Element;
const decorator: Decorator | null = factory.instanceDecorator(
  'typed', new PropertyDictionary(), active);
const data: DecoratorData | null | undefined =
  decorator?.generateElementData(element, BoxArea.Padding);
if (decorator && data?.isValid) {
  decorator.renderElement(element, data);
  decorator.releaseElementData(data);
}
// @ts-expect-error Native element data cannot be forged from an integer.
decorator?.releaseElementData(123n);
// @ts-expect-error The scoped interface cannot be constructed independently.
new DecoratorInstancerInterface();
// @ts-expect-error Decorator factories must be synchronous.
new DecoratorInstancer(async () => null);
