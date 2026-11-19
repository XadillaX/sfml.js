import {
  Property, type Element, type RmlEvent, type VariantNumber,
  type VariantInteger64, type VariantValue, type VariantResult,
} from '../../src';

declare const element: Element;
declare const event: RmlEvent;
const integer: VariantNumber = { type: 'int', value: 17 };
const unsigned: VariantInteger64 = { type: 'uint64', value: 9n };
const property = new Property(integer);
const value: VariantValue = unsigned;
const number: number = property.get(integer);
const wide: bigint = property.get(unsigned);
const attribute: number = element.getAttribute('count', integer);
const parameter: bigint = event.getParameter('count', unsigned);
const style: number = element.getProperty('width', { type: 'float', value: 0 });
const inferred: VariantResult<typeof unsigned> = 1n;
const inlineNumber: number = property.get({ type: 'int', value: 0 });
const inlineWide: bigint = event.getParameter(
  'count', { type: 'uint64', value: 0n });
const inlineAttribute: number = element.getAttribute(
  'count', { type: 'int', value: 0 });
property.value = unsigned;
element.setAttributes({ count: integer, total: unsigned });
element.dispatchEvent('count', { count: integer });
// @ts-expect-error Integer scalar values require numbers.
const invalidNumber: VariantNumber = { type: 'int', value: 1n };
// @ts-expect-error 64-bit scalars require BigInt.
const invalidWide: VariantInteger64 = { type: 'uint64', value: 1 };
// @ts-expect-error Unsupported native scalar names are rejected.
const invalidType: VariantNumber = { type: 'integer', value: 1 };
// @ts-expect-error Typed conversion returns a primitive, not a tagged input.
const invalidResult: VariantNumber = property.get(integer);
void [
  value, number, wide, attribute, parameter, style, inferred,
  inlineNumber, inlineWide, inlineAttribute,
  invalidNumber, invalidWide, invalidType, invalidResult,
];
