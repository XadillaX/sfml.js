import {
  Vertex, Vector2f, Vector2i, Vector2u, Color, FloatRect, type ReadonlyValue,
  add, addAssign, multiply, multiplyAssign, equal, notEqual,
} from '..';

const position = new Vector2f(1, 2);
const texCoords = new Vector2f(3, 4);
const vertex = new Vertex();
const readonlyVertex: ReadonlyValue<Vertex> = vertex;
new Vertex(position);
new Vertex(position, Color.Red);
new Vertex(position, Color.Red, texCoords);
new Vertex(position, undefined, texCoords);
new Vertex(vertex);
new Vertex(readonlyVertex);
new Vertex(
  readonlyVertex.position, readonlyVertex.color, readonlyVertex.texCoords,
);
const positionMember: Vector2f = vertex.position;
const colorMember: Color = vertex.color;
const texCoordsMember: Vector2f = vertex.texCoords;
vertex.position = readonlyVertex.texCoords;
vertex.texCoords = readonlyVertex.position;
vertex.color = readonlyVertex.color;
vertex.color = Color.White;
vertex.position.x = 3;
vertex.color.a = 128;
vertex.texCoords.y = 4;
addAssign(vertex.position, readonlyVertex.texCoords);
multiplyAssign(vertex.color, readonlyVertex.color);
const colorResult: Color = multiply(readonlyVertex.color, Color.White);
const normal: Vector2f = readonlyVertex.position.normalized();
readonlyVertex.texCoords.length();
readonlyVertex.color.toInteger();
add(readonlyVertex.color, Color.Red).r = 3;
const colorCopy: Color = new Color(readonlyVertex.color);
const vectorCopy: Vector2f = new Vector2f(readonlyVertex.position);
const rect: FloatRect = new FloatRect(
  readonlyVertex.position, readonlyVertex.texCoords,
);

// @ts-expect-error Nested const colors cannot be modified.
readonlyVertex.color.r = 0;
// @ts-expect-error Nested const positions cannot be modified.
readonlyVertex.position.x = 0;
// @ts-expect-error Nested const texture coordinates cannot be modified.
readonlyVertex.texCoords.y = 0;
// @ts-expect-error Const members cannot be replaced.
readonlyVertex.color = Color.Red;
// @ts-expect-error Const color views cannot become mutable aliases.
const mutableColor: Color = readonlyVertex.color;
// @ts-expect-error Const vector views cannot become mutable aliases.
const mutableVector: Vector2f = readonlyVertex.position;
// @ts-expect-error Const Vertex views cannot become mutable aliases.
const mutableVertex: Vertex = readonlyVertex;
// @ts-expect-error Const color views cannot be assignment targets.
multiplyAssign(readonlyVertex.color, Color.White);
// @ts-expect-error Const vector views cannot be assignment targets.
addAssign(readonlyVertex.position, position);
// @ts-expect-error Vertex requires float position vectors.
new Vertex(new Vector2i());
// @ts-expect-error Vertex requires float texture coordinate vectors.
new Vertex(position, Color.Red, new Vector2u());
// @ts-expect-error The second argument is a Color.
new Vertex(position, texCoords);
// @ts-expect-error Copy construction takes exactly one Vertex.
new Vertex(vertex, Color.White);
// @ts-expect-error Packed color integers require explicit Color construction.
new Vertex(position, 0xff0000ff);
// @ts-expect-error Member assignment cannot convert scalar types implicitly.
vertex.position = new Vector2i();
// @ts-expect-error Member assignment cannot convert scalar types implicitly.
vertex.texCoords = new Vector2u();
// @ts-expect-error Plain channel objects are not Color values.
vertex.color = { r: 255, g: 0, b: 0, a: 255 };
// @ts-expect-error Vertex has no arithmetic operators in SFML.
add(vertex, vertex);
// @ts-expect-error Vertex has no arithmetic operators in SFML.
multiply(vertex, 2);
// @ts-expect-error Vertex has no equality operator in SFML.
equal(vertex, vertex);
// @ts-expect-error Vertex has no inequality operator in SFML.
notEqual(vertex, vertex);

export {
  positionMember, colorMember, texCoordsMember, colorResult, normal, colorCopy,
  vectorCopy, rect, mutableColor, mutableVector, mutableVertex,
};
