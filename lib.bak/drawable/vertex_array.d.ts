import { Color } from '../color';
import { Drawable } from './drawable';
import { PointType, Vector2F } from '../vector2';
import { FloatRect } from '../rect';
import { Vertex } from '../vertex';

export class VertexArray extends Drawable {
  constructor();
  constructor(type: VertexArray.PrimitiveType, vertexCount?: number);

  getVertexCount(): number;

  duplicateVertex(idx: number): Vertex;
  setVertex(idx: number, vertex: Vertex): void;
  setPosition(idx: number, position: PointType<Vector2F>): void;
  setColor(idx: number, color: Color | number): void;
  setTexCoords(idx: number, position: PointType<Vector2F>): void;

  clear(): void;
  resize(size: number): void;
  append(vertex: Vertex): void;
  setPrimitiveType(type: VertexArray.PrimitiveType): void;
  getPrimitiveType(): VertexArray.PrimitiveType;
  getBounds(): FloatRect;
}

export namespace VertexArray {
  export enum PrimitiveType {
    Points,
    Lines,
    LineStrip,
    Triangles,
    TriangleStrip,
    TriangleFan,
    Quads,
    LinesStrip,
    TrianglesStrip,
    TrianglesFan,
  }
}
