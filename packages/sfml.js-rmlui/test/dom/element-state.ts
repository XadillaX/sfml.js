import {
  type Element, type Context, type AttributeValue, type AttributeResult,
  type VariantVector2, type VariantVector3, type VariantVector4,
  type VariantColour,
} from '../../dist';

declare const element: Element;

element.setClassNames('one two');
const classes: string = element.getClassNames();
element.setPseudoClass('selected', true);
const active: boolean = element.isPseudoClassSet('selected');
const all: boolean = element.arePseudoClassesSet([ 'selected' ] as const);
const names: string[] = element.getActivePseudoClasses();
const address: string = element.getAddress(true, false);
const context: Context | null = element.getContext();
const focus: Element = element.getFocusLeafNode();
const legacy: string | null = element.getAttribute('value');
const text: string = element.getAttribute('value', '');
const numeric: number = element.getAttribute('number', 0);
const flag: boolean = element.getAttribute('flag', false);
const wide: bigint = element.getAttribute('bigint', 0n);
const point: VariantVector2 = element.getAttribute('point', { x: 0, y: 0 });
const spatial: VariantVector3 = element.getAttribute('point', {
  x: 0, y: 0, z: 0,
});
const vector: VariantVector4 = element.getAttribute('point', {
  x: 0, y: 0, z: 0, w: 0,
});
const colour: VariantColour = element.getAttribute('colour', {
  type: 'colourf', red: 0, green: 0, blue: 0, alpha: 1,
});
const raw: AttributeValue = element.getAttributeValue('number');
const snapshot: Record<string, AttributeValue> = element.getAttributes();
const count: number = element.getNumAttributes();
const has: boolean = element.hasAttribute('nothing');
const widened: AttributeResult<false> = true;
element.setAttribute('value', null);
element.setAttribute('value', point);
element.setAttributes({ flag, numeric, wide, colour, vector, spatial });

element.setAttribute('pointer', element);
const storedElement: Element | null = element.getElementAttribute('pointer');
element.getElementAttribute('pointer', element);
// @ts-expect-error Generic conversion does not select a pointer template.
element.getAttribute('pointer', element);
// @ts-expect-error Element fallback requires an actual Element.
element.getElementAttribute('pointer', {});
// @ts-expect-error Arbitrary object values are not native Variants.
element.setAttributes({ invalid: { any: true } });
// @ts-expect-error null does not identify a native conversion template.
element.getAttribute('value', null);
// @ts-expect-error A numeric fallback selects a numeric result.
const wrong: string = element.getAttribute('number', 0);
// @ts-expect-error Literal fallback types must widen to the native value type.
const literal: false = element.getAttribute('flag', false);
// @ts-expect-error Pseudo-class names are strings.
element.arePseudoClassesSet([ 3 ]);

void [
  classes, active, all, names, address, context, focus, legacy, text, numeric,
  flag, wide, point, spatial, vector, colour, raw, snapshot, count, has,
  widened, wrong, literal, storedElement,
];
