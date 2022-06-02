declare module '*/binding.node' {
  interface PrimitiveTypeInterface {
    Points: 0,
    Lines: 1,
    LineStrip: 2,
    Triangles: 3,
    TriangleStrip: 4,
    TriangleFan: 5,
    Quads: 6,

    // Deprecated names
    LinesStrip: 2,
    TrianglesStrip: 4,
    TrianglesFan: 5,
  }
  type PrimitiveType = _RangeOf<0, 6>;

  export class VertexArray extends Drawable {
    constructor();
    constructor(type: PrimitiveType, vertexCount: Uint32);

    getVertexCount(): Uint32;
    duplicateVertex(index: Uint32): Vertex;
    setVertex(index: Uint32, vertex: Vertex): void;
    setPosition(index: Uint32, position: Vector2F): void;
    setColor(index: Uint32, color: Color): void;
    setTexCoords(index: Uint32, texCoords: Vector2F): void;

    clear(): void;
    resize(size: Uint32): void;
    append(vertex: Vertex): void;
    setPrimitiveType(type: PrimitiveType): void;
    getPrimitiveType(): PrimitiveType;

    getBounds(): FloatRect;

    static PrimitiveType: PrimitiveTypeInterface;
  }
}
