import {
  Tween, TweenType, TweenDirection, Property, PropertyId, Unit,
  type Element, type TweenCallback,
} from '../../src';

declare const element: Element;
const callback: TweenCallback = t => t * t;
const native = new Tween(TweenType.Sine, TweenDirection.InOut);
const dual = new Tween(TweenType.Quadratic, { out: TweenType.Cubic });
const custom = new Tween(callback);
const value: number = custom.evaluate(0.5);
const equal: boolean = custom.equals(custom.clone());
const unequal: boolean = custom.notEquals(native);
const description: string = native.toString();
custom.reverse();

const target = new Property(40, Unit.PX);
const animated: boolean = element.animate('width', target, 0.5);
element.animate(PropertyId.Width, target, 1, dual, -1, false, 0.1, target);
element.addAnimationKey(PropertyId.Width, target, 1, native);
element.addAnimationKey('width', target, 1);
// @ts-expect-error A typed target property is required.
element.animate('width', '40px', 1);
// @ts-expect-error Callbacks must return synchronous numbers.
new Tween(async t => t);
// @ts-expect-error Callback construction has no second type.
new Tween(callback, { out: TweenType.Linear });
// @ts-expect-error Arbitrary directions are not supported.
new Tween(TweenType.Linear, 9);
// @ts-expect-error Tween comparison cannot use numeric progress values.
custom.notEquals(0.5);

void [ value, equal, unequal, description, animated ];
