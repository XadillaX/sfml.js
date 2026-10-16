import {
  VertexArray, PrimitiveType, Vertex, Vector2f, Color, RenderTexture,
  Vector2u, RenderTarget, RenderStates, Drawable, type ReadonlyValue,
} from '../src';

const array = new VertexArray(PrimitiveType.Triangles, 3);
array.getVertex(0).position = new Vector2f(1, 2);
array.getVertex(0).color = Color.Red;
const read: ReadonlyValue<Vertex> = new Vertex();
array.setVertex(1, read);
array.append(read);
array.resize(6);
array.clear();
array.setPrimitiveType(PrimitiveType.TriangleStrip);
const type: PrimitiveType = array.getPrimitiveType();
const copy: Drawable = new VertexArray(array);
for (const vertex of array) vertex.color.a = 128;
const target: RenderTarget = new RenderTexture(new Vector2u(32, 32));
target.draw(array);
target.draw(copy, RenderStates.Default);
target.draw([ read, new Vertex() ], PrimitiveType.Lines);
target.draw([ read ], PrimitiveType.Points, RenderStates.Default);
class Custom extends VertexArray {
  protected draw(target: RenderTarget, states: RenderStates): void {
    super.draw(target, states);
  }
}
// @ts-expect-error VertexArray is not Transformable.
array.move(new Vector2f());
// @ts-expect-error A Vertex[] requires its primitive type.
target.draw([ read ]);
// @ts-expect-error Arbitrary coordinates are not a Vertex.
target.draw([ new Vector2f() ], PrimitiveType.Points);
// @ts-expect-error Indexed assignment requires a Vertex value.
array.setVertex(0, Color.White);
// @ts-expect-error Draw is protected.
array.draw(target, new RenderStates());
void [ type, Custom ];
