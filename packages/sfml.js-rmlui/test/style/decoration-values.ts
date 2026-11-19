import {
  Property, Unit, NumericValue, type ColorStopList, type BoxShadowList,
  type Element, type RmlEvent, type PremultipliedColour,
} from '../../src';

declare const element: Element;
declare const event: RmlEvent;
const color: PremultipliedColour = {
  type: 'colourb-premultiplied', red: 64, green: 0, blue: 0, alpha: 128,
};
const stops: ColorStopList = {
  type: 'colorstoplist',
  values: [{ color, position: new NumericValue(50, Unit.PERCENT) }],
};
const shadows: BoxShadowList = {
  type: 'boxshadowlist',
  values: [{
    color, offsetX: new NumericValue(2, Unit.PX),
    offsetY: new NumericValue(3, Unit.EM),
    blurRadius: new NumericValue(4, Unit.PX),
    spreadDistance: new NumericValue(1, Unit.DP), inset: false,
  }],
};
const property = new Property(stops, Unit.COLORSTOPLIST);
const stopCopy: ColorStopList = property.get(stops);
const shadowCopy: BoxShadowList = element.getProperty('box-shadow', shadows);
const attribute: ColorStopList = element.getAttribute('stops', stops);
const parameter: BoxShadowList = event.getParameter('shadow', shadows);
property.value = shadows;
element.setAttribute('stops', stops);
element.dispatchEvent('custom', { shadow: shadows });
// @ts-expect-error Premultiplied colours are nested values, not Variants.
new Property(color);
// @ts-expect-error Lists require an explicit native type.
new Property({ values: stops.values });
// @ts-expect-error Lengths retain number and unit, not only a number.
shadows.values[0].offsetX = 2;
// @ts-expect-error Premultiplied colors cannot use a straight-alpha tag.
stops.values[0].color.type = 'colourb';
// @ts-expect-error Conversion result is a list, not a number.
const wrong: number = property.get(stops);
void [ stopCopy, shadowCopy, attribute, parameter, wrong ];
