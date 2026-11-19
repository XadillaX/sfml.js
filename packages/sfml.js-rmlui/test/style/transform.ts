import {
  Transform, TransformPrimitiveType as T, makeTransformPrimitive,
  NumericValue, Unit, Property, Element, RmlEvent,
  type TransformPrimitive, type TransformSnapshot, type DecomposedMatrix4,
  type TransformArrayPrimitiveType, type TransformPrimitiveValues,
  type TransformPrimitiveRecord,
} from '../../src';

const translation = makeTransformPrimitive(T.TRANSLATE3D, [
  new NumericValue(5, Unit.PERCENT),
  { number: 0, unit: Unit.PX },
  { number: 20, unit: Unit.PX },
]);
const primitive: TransformPrimitive = {
  type: T.ROTATE3D, values: [ 0, 0, 1, Math.PI ],
};

const arrayType: TransformArrayPrimitiveType = T.MATRIX2D;
const matrix: TransformPrimitiveValues<T.MATRIX2D> = [ 1, 0, 0, 1, 0, 0 ];
const scale: TransformPrimitiveRecord<T.SCALE2D> = {
  type: T.SCALE2D, values: [ 2, 2 ],
};
// @ts-expect-error Matrix2D snapshots have six native coefficients.
const shortMatrix: TransformPrimitiveValues<T.MATRIX2D> = [ 1, 0 ];
// @ts-expect-error Named-field decomposition is not an array primitive.
const namedType: TransformArrayPrimitiveType = T.DECOMPOSEDMATRIX4;

const transform = new Transform([ translation, primitive ]);
transform.addPrimitive({ type: T.SCALE2D, values: [ 2, 2 ] });
transform.primitives = [ transform.getPrimitive(0) ];
const unit: Unit = translation.values[0].unit;
const angle = makeTransformPrimitive(T.ROTATEX, [
  { number: 90, unit: Unit.DEG },
]).values[0];
const radians: number = angle;
const count: number = transform.getNumPrimitives();
const property: Property = Transform.makeProperty(transform.primitives);
const read: TransformSnapshot = property.get(transform);
const nullPointer: TransformSnapshot = {
  type: 'transform', primitives: null,
};
const empty = new Property(nullPointer, Unit.TRANSFORM);
const decomposed: DecomposedMatrix4 = {
  type: T.DECOMPOSEDMATRIX4,
  perspective: { x: 0, y: 0, z: 0, w: 1 },
  quaternion: { x: 0, y: 0, z: 0, w: 1 },
  translation: { x: 1, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
  skew: { x: 0, y: 0, z: 0 },
};
transform.addPrimitive(decomposed);
transform.clearPrimitives();

declare const element: Element;
declare const event: RmlEvent;
element.setAttribute('transform-value', transform);
const attribute: TransformSnapshot =
  element.getAttribute('transform-value', transform);
const parameter: TransformSnapshot = event.getParameter('value', transform);
const style: TransformSnapshot = element.getProperty('transform', transform);
element.dispatchEvent('value', { transform });
// @ts-expect-error Scale2D has exactly two components.
transform.addPrimitive({ type: T.SCALE2D, values: [ 1 ] });
// @ts-expect-error Translation retains a number/unit pair.
transform.addPrimitive({ type: T.TRANSLATEX, values: [ 5 ] });
// @ts-expect-error Resolved angle is a number in radians.
transform.addPrimitive({ type: T.ROTATEX, values: [{ number: 5, unit }] });
// @ts-expect-error Decomposed matrix uses named vectors.
makeTransformPrimitive(T.DECOMPOSEDMATRIX4, []);
// @ts-expect-error Reading an attribute returns a snapshot, not a live facade.
attribute.clearPrimitives();
// @ts-expect-error Clearing primitives does not take an index.
transform.clearPrimitives(0);

void [
  radians, count, read, empty, parameter, style,
  arrayType, matrix, scale, shortMatrix, namedType,
];
