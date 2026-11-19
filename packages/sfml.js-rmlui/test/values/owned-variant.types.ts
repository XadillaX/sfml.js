import {
  Variant, VariantType, Property, type Element, type RmlEvent, type Context,
  type VariantValue, type VariantConversion, type VariantCharacter,
  type VariantIntegerVector, type VariantVector2, type VariantVector3,
  type VariantVector4, type DataVariantValue,
  type VariantScriptPointer, type VariantOpaquePointer, type VariantReadValue,
  type VariantScriptObject,
} from '../../src';

declare const element: Element;
declare const event: RmlEvent;
declare const context: Context;
declare const nativeScript: VariantScriptObject;

type ScriptValue = Element | Context | RmlEvent | VariantScriptObject | null;

const owned = new Variant({ type: 'float', value: 0.1 });
const clone: Variant = owned.clone();
const assigned: Variant = clone.assign(owned).moveAssign(owned.move());
const type: VariantType = owned.getType();
const reference: VariantReadValue = owned.getReference(VariantType.FLOAT);
const character: VariantCharacter = { type: 'character', value: 0x1f600 };
const vector: VariantIntegerVector = { type: 'vector2i', x: 91, y: 92 };
const number: number = owned.get(character);
const conversion: VariantConversion<VariantVector2> = owned.getInto(vector);
const vec3: VariantVector3 = new Property('1, 2, 3')
  .get({ type: 'vector3i', x: 0, y: 0, z: 0 });
const vec4: VariantVector4 = element.getAttribute('values',
  { type: 'vector4i', x: 0, y: 0, z: 0, w: 0 });
const eventResult: VariantVector2 = event.getParameter('values', vector);
const attribute: number = element.getAttribute('character', character);
const value: VariantValue = new Variant(character);
const copied = new Property(owned);
element.setAttribute('copy', owned);
const pointer: VariantScriptPointer = { type: 'scriptinterface', value: null };
const script: ScriptValue = owned.get(pointer);
const contextValue: VariantValue = new Variant(context);
const eventValue: VariantReadValue = new Property(event).value;
const pointerResult: VariantConversion<ScriptValue> = owned.getInto(pointer);
const storedElement: Element | null = owned.getElementValue();
const variantEqual: boolean = owned.equals(clone);
const variantUnequal: boolean = owned.notEquals(clone);
owned.clear();

new Variant(nativeScript);
new Variant({ type: 'scriptinterface', value: nativeScript });
// @ts-expect-error Native script identities require an explicit default tag.
owned.get(nativeScript);
// @ts-expect-error Data models cannot store native script identities.
const invalidNativeScriptData: DataVariantValue = nativeScript;
// @ts-expect-error A plain object has no native ScriptInterface provenance.
new Variant({ type: 'scriptinterface', value: {} });
// @ts-expect-error Data models cannot store ScriptInterface pointers.
const invalidPointerData: DataVariantValue = pointer;
const opaque: VariantOpaquePointer = { type: 'voidptr', value: {} };
const objectResult: object | null = owned.get(opaque);
const opaqueResult: VariantConversion<object | null> = owned.getInto(opaque);
new Variant(opaque);
// @ts-expect-error Data models cannot store opaque pointer values.
const invalidOpaqueData: DataVariantValue = opaque;
// @ts-expect-error Opaque pointers require objects, not numeric addresses.
new Variant({ type: 'voidptr', value: 1n });
// @ts-expect-error Native object output needs a typed selector to be stored.
new Variant(objectResult);
// @ts-expect-error Integer vectors are template destinations, not storage.
const invalidStored: VariantValue = vector;
// @ts-expect-error Integer vectors cannot be stored in a data model.
const invalidData: DataVariantValue = vector;
// @ts-expect-error Character selectors require a numeric char32_t value.
const invalidCharacter: VariantCharacter = { type: 'character', value: 'a' };
// @ts-expect-error Move assignment requires an owned source.
owned.moveAssign(1);
// @ts-expect-error Scalar conversion returns a number, not its tagged input.
const invalidResult: VariantCharacter = owned.get(character);
// @ts-expect-error Raw pointers cannot enter a Variant.
new Variant({ pointer: 1n });
// @ts-expect-error Variant comparison requires another owned Variant.
owned.equals(copied);
// @ts-expect-error Clearing a Variant does not assign a replacement value.
owned.clear(1);

void [
  assigned, type, reference, number, conversion, vec3, vec4, eventResult,
  attribute, value, copied, script, contextValue, eventValue, pointerResult,
  invalidPointerData, objectResult, opaqueResult, invalidOpaqueData,
  invalidNativeScriptData,
  invalidStored, invalidData, invalidCharacter, invalidResult,
  storedElement, variantEqual, variantUnequal,
];
