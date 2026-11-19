import {
  type RmlEvent, type Element, type VariantDefault, type VariantResult,
  type VariantVector2, type VariantVector3, type VariantVector4,
  type VariantColour,
} from '../../dist';

declare const event: RmlEvent;
declare const element: Element;

const number: number = event.getParameter('count', 0);
const text: string = event.getParameter('count', '');
const flag: boolean = event.getParameter('flag', false);
const wide: bigint = event.getParameter('wide', 0n);
const point: VariantVector2 = event.getParameter('point', { x: 0, y: 0 });
const vector3: VariantVector3 = event.getParameter('point', {
  x: 0, y: 0, z: 0,
});
const vector4: VariantVector4 = event.getParameter('point', {
  x: 0, y: 0, z: 0, w: 0,
});
const colour: VariantColour = event.getParameter('colour', {
  type: 'colourb', red: 0, green: 0, blue: 0, alpha: 255,
});
const fallback: VariantDefault = 0;
const widened: VariantResult<false> = true;
const matches: boolean = event.isType('click');
event.isType(event.id);

// @ts-expect-error A default selecting a native conversion type is required.
event.getParameter('count');
// @ts-expect-error null cannot identify the native conversion type.
event.getParameter('count', null);
// @ts-expect-error Pointer defaults require a dedicated typed adapter.
event.getParameter('pointer', element);
// @ts-expect-error Primitive literal defaults widen to the native result type.
const literal: 0 = event.getParameter('count', 0);
// @ts-expect-error A number default selects a numeric result.
const wrong: string = event.getParameter('count', 0);
// @ts-expect-error Event names and ids are strings and numbers.
event.isType(false);

void [
  number, text, flag, wide, point, vector3, vector4, colour, fallback,
  widened, matches, literal, wrong,
];
