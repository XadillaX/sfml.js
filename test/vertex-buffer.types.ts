import {
  VertexBuffer, VertexBufferUsage, VertexArray, PrimitiveType, Vertex,
  RenderTarget, RenderTexture, Vector2u, RenderStates, Drawable,
  type ReadonlyValue,
} from '../src';

const value = new VertexBuffer(PrimitiveType.Triangles, VertexBuffer.Usage.Static);
const defaults = new VertexBuffer();
const typed = new VertexBuffer(PrimitiveType.Lines);
const usageOnly = new VertexBuffer(VertexBufferUsage.Dynamic);
const copy: Drawable = new VertexBuffer(value);
const created: boolean = value.create(6);
const vertices: readonly ReadonlyValue<Vertex>[] = [ new Vertex() ];
value.update(vertices, 1, 0);
value.update(new VertexArray(PrimitiveType.Triangles, 6));
value.update(typed);
value.swap(defaults);
value.setUsage(VertexBufferUsage.Stream);
value.setPrimitiveType(PrimitiveType.Points);
const usage: VertexBufferUsage = value.getUsage();
const type: PrimitiveType = value.getPrimitiveType();
const count: number = value.getVertexCount();
const handle: number = value.getNativeHandle();
const available: boolean = VertexBuffer.isAvailable();
VertexBuffer.bind(value);
VertexBuffer.bind(null);
const target: RenderTarget = new RenderTexture(new Vector2u(32, 32));
target.draw(value);
target.draw(value, RenderStates.Default);
target.draw(value, 0, 3);
target.draw(value, 0, 3, RenderStates.Default);
target.draw(copy);
class Custom extends VertexBuffer {
  protected draw(target: RenderTarget, states: RenderStates): void {
    super.draw(target, states);
  }
}
// @ts-expect-error Usage is distinct from PrimitiveType.
value.setUsage(PrimitiveType.Points);
// @ts-expect-error Range upload requires both count and offset.
value.update(vertices, 1);
// @ts-expect-error Buffer-to-buffer copy has no range overload.
value.update(defaults, 1, 0);
// @ts-expect-error Range draw requires count.
target.draw(value, 1);
// @ts-expect-error GPU storage exposes no mutable vertex view.
value.getVertex(0);
// @ts-expect-error VertexBuffer draw is protected.
value.draw(target, new RenderStates());
void [ created, usageOnly, usage, type, count, handle, available, Custom ];
